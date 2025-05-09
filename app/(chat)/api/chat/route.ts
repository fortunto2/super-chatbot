import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
  getOrCreateOAuthUser,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

/**
 * Formats error response based on environment
 * @param error - error object
 * @param context - error context for easier debugging
 * @returns Response object with formatted error
 */
function formatErrorResponse(error: unknown, context = 'API') {
  console.error(`Error in ${context}:`, error);

  // In development mode return detailed error information
  if (!isProductionEnvironment) {
    const errorMessage =
      error instanceof Error
        ? `${error.message}\n\n${error.stack}`
        : 'Unknown error';

    return new Response(
      JSON.stringify(
        {
          error: `Error in ${context}`,
          details: errorMessage,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  // In production return generic message
  return new Response('An error occurred while processing your request!', {
    status: 500,
  });
}

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.error('Invalid request body:', error);

    if (!isProductionEnvironment) {
      return new Response(
        JSON.stringify(
          {
            error: 'Invalid request data',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return new Response('Invalid request body', { status: 400 });
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new Response(
        'You have exceeded your maximum number of messages for the day! Please try again later.',
        {
          status: 429,
        },
      );
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      try {
        await saveChat({
          id,
          userId: session.user.id,
          title,
          visibility: selectedVisibilityType,
        });
      } catch (error) {
        console.error('Failed to save chat:', error);

        // Check if the error is a foreign key constraint violation (missing user)
        if (
          error instanceof Error &&
          error.message.includes('foreign key constraint') &&
          (error.message.includes('Chat_userId_User_id_fk') ||
            error.message.includes('Key (userId)'))
        ) {
          console.log(`Trying to auto-create user with ID: ${session.user.id}`);

          try {
            // Try to automatically create user with this ID
            const email =
              session.user.email || `auth0-user-${session.user.id}@example.com`;

            await getOrCreateOAuthUser(session.user.id, email);

            // Try to save the chat again after creating the user
            await saveChat({
              id,
              userId: session.user.id,
              title,
              visibility: selectedVisibilityType,
            });
          } catch (innerError) {
            console.error(
              'Failed to auto-create user and save chat:',
              innerError,
            );
            // Continue execution, as we can still try to process the message without saving the chat
          }
        } else {
          // Continue execution for other types of errors
        }
      }
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    try {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: 'user',
            parts: message.parts,
            attachments: message.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      });
    } catch (error) {
      console.error('Failed to save user message:', error);

      // If the error is related to missing chat, try to recreate it
      if (
        error instanceof Error &&
        error.message.includes('foreign key constraint') &&
        (error.message.includes('Message_v2_chatId_Chat_id_fk') ||
          error.message.includes('Key (chatId)'))
      ) {
        console.log(`Trying to recreate chat with ID: ${id}`);

        try {
          // Check if user exists, create if not
          if (session.user.email) {
            await getOrCreateOAuthUser(session.user.id, session.user.email);
          }

          // Try to recreate the chat
          const title = await generateTitleFromUserMessage({
            message,
          });

          await saveChat({
            id,
            userId: session.user.id,
            title,
            visibility: selectedVisibilityType,
          });

          // Try to save message again
          await saveMessages({
            messages: [
              {
                chatId: id,
                id: message.id,
                role: 'user',
                parts: message.parts,
                attachments: message.experimental_attachments ?? [],
                createdAt: new Date(),
              },
            ],
          });
        } catch (innerError) {
          console.error(
            'Failed to recreate chat and save message:',
            innerError,
          );
          // Continue execution to let the user get a response
        }
      }
      // Continue execution, as we can still try to get a response without saving the message
    }

    const streamId = generateUUID();
    try {
      await createStreamId({ streamId, chatId: id });
    } catch (error) {
      console.error('Failed to create stream id in database', error);

      // If the error is related to missing chat, try to recreate it
      if (
        error instanceof Error &&
        error.message.includes('foreign key constraint') &&
        (error.message.includes('Stream_chatId_Chat_id_fk') ||
          error.message.includes('Key (chatId)'))
      ) {
        console.log(`Trying to recreate chat for stream with ID: ${id}`);

        try {
          // Check if user exists, create if not
          if (session.user.email) {
            await getOrCreateOAuthUser(session.user.id, session.user.email);
          }

          // Try to recreate the chat
          const title = await generateTitleFromUserMessage({
            message,
          });

          await saveChat({
            id,
            userId: session.user.id,
            title,
            visibility: selectedVisibilityType,
          });

          // Try to create stream ID again
          await createStreamId({ streamId, chatId: id });
        } catch (innerError) {
          console.error(
            'Failed to recreate chat and create stream ID:',
            innerError,
          );
          // Continue execution as stream can be created even without DB record
        }
      }
      // Continue execution, as we can proceed without DB record
    }

    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (error) {
                console.error('Failed to save assistant message:', error);
                if (error instanceof Error) {
                  console.error(error.stack);
                }
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const streamContext = getStreamContext();
    const resumeRequestedAt = new Date();

    if (!streamContext) {
      return new Response(null, { status: 204 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return new Response('id is required', { status: 400 });
    }

    const session = await auth();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    let chat: Chat;

    try {
      chat = await getChatById({ id: chatId });
    } catch (error) {
      return formatErrorResponse(error, 'GET chat/getChatById');
    }

    if (!chat) {
      return new Response('Not found', { status: 404 });
    }

    if (chat.visibility === 'private' && chat.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    const streamIds = await getStreamIdsByChatId({ chatId });

    if (!streamIds.length) {
      return new Response('No streams found', { status: 404 });
    }

    const recentStreamId = streamIds.at(-1);

    if (!recentStreamId) {
      return new Response('No recent stream found', { status: 404 });
    }

    const emptyDataStream = createDataStream({
      execute: () => {},
    });

    const stream = await streamContext.resumableStream(
      recentStreamId,
      () => emptyDataStream,
    );

    /*
     * For when the generation is streaming during SSR
     * but the resumable stream has concluded at this point.
     */
    if (!stream) {
      try {
        const messages = await getMessagesByChatId({ id: chatId });
        const mostRecentMessage = messages.at(-1);

        if (!mostRecentMessage) {
          return new Response(emptyDataStream, { status: 200 });
        }

        if (mostRecentMessage.role !== 'assistant') {
          return new Response(emptyDataStream, { status: 200 });
        }

        const messageCreatedAt = new Date(mostRecentMessage.createdAt);

        if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
          return new Response(emptyDataStream, { status: 200 });
        }

        const restoredStream = createDataStream({
          execute: (buffer) => {
            buffer.writeData({
              type: 'append-message',
              message: JSON.stringify(mostRecentMessage),
            });
          },
        });

        return new Response(restoredStream, { status: 200 });
      } catch (error) {
        return formatErrorResponse(error, 'GET chat/restoreStream');
      }
    }

    return new Response(stream, { status: 200 });
  } catch (error) {
    return formatErrorResponse(error, 'GET chat');
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    const deletedChat = await deleteChatById({ id });

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
