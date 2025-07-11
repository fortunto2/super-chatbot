import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  or,
  sql,
  ilike,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

/**
 * Creates or gets an OAuth user
 * Used to create accounts for users authenticated through Auth0
 */
export async function getOrCreateOAuthUser(
  userId: string,
  email: string,
): Promise<User> {
  try {
    // Сначала проверяем, существует ли пользователь с этим ID
    const [existingUserById] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (existingUserById) {
      return existingUserById;
    }

    // Затем проверяем, существует ли пользователь с этим email
    const existingUsers = await getUser(email);
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // Если пользователь найден по email, возвращаем его, даже если ID отличается
      console.log(`Found user with email ${email} but different ID (${existingUser.id} vs ${userId}). Using existing user ID.`);
      return existingUser;
    }

    // Если пользователь не найден, создаем нового
    console.log(`User not found, creating new user with ID: ${userId} and email: ${email}`);
    
    try {
      // Используем отдельное соединение для гарантированного создания
      const createClient = postgres(process.env.POSTGRES_URL!, { max: 1 });
      const createDb = drizzle(createClient);
      
      try {
        // Создаем пользователя
        const [newUser] = await createDb
          .insert(user)
          .values({
            id: userId,
            email,
            password: null, // OAuth users don't have a password
          })
          .returning();
        
        if (!newUser) {
          throw new Error('Failed to create OAuth user: No user returned');
        }
        
        console.log(`Created new OAuth user with ID: ${userId} and email: ${email}`);
        return newUser;
      } finally {
        // Закрываем соединение
        await createClient.end().catch(e => console.error("Error closing create client:", e));
      }
    } catch (createError) {
      console.error(`Failed to create user with ID ${userId}:`, createError);
      
      // Последняя попытка - найти пользователя по ID снова
      // (возможно, он был создан параллельным запросом)
      const [lastChanceUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, userId));
      
      if (lastChanceUser) {
        console.log(`Found user with ID ${userId} on second check`);
        return lastChanceUser;
      }
      
      // Если до сих пор не найден, попробуем найти по email снова и вернуть его
      const [lastChanceUserByEmail] = await db
        .select()
        .from(user)
        .where(eq(user.email, email));
      
      if (lastChanceUserByEmail) {
        console.log(`Found user by email ${email} with ID ${lastChanceUserByEmail.id}`);
        return lastChanceUserByEmail;
      }
      
      throw createError;
    }
  } catch (error) {
    console.error('Failed to get or create OAuth user:', error);
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Failed to create guest user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  if (messages.length === 0) {
    return;
  }
  
  try {
    // Make the insert idempotent. If a message with the same ID already exists, do nothing.
    // This resolves a race condition where both the client and server might try to save the same message.
    return await db.insert(message).values(messages).onConflictDoNothing();
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
  thumbnailUrl,
  visibility,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  thumbnailUrl?: string | null;
  visibility?: 'public' | 'private';
}) {
  try {
    // Set default visibility based on kind
    const defaultVisibility = visibility || (kind === 'script' ? 'public' : 'private');
    
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        thumbnailUrl: thumbnailUrl ?? null,
        visibility: defaultVisibility,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    console.error(
      'Failed to get message count by user id for the last 24 hours from database',
    );
    throw error;
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    console.error('Failed to create stream id in database');
    throw error;
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    console.error('Failed to get stream ids by chat id from database');
    throw error;
  }
}

export async function getChatImageArtifacts({
  chatId,
  limit = 5,
}: {
  chatId: string;
  limit?: number;
}) {
  try {
    // AICODE-NOTE: Find recent image artifacts from chat messages for image-to-video
    const recentMessages = await db
      .select({
        id: message.id,
        parts: message.parts,
        createdAt: message.createdAt,
      })
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(desc(message.createdAt))
      .limit(50); // Look at more messages to find artifacts

    // Extract image artifacts from message parts
    const imageArtifacts: Array<{
      id: string;
      url: string;
      prompt: string;
      createdAt: Date;
      projectId?: string;
    }> = [];

    for (const msg of recentMessages) {
      if (msg.parts && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          // Check if part contains image artifact
          if (part && typeof part === 'object' && 'text' in part) {
            const text = part.text as string;
            
            // Look for image artifacts in the text
            if (text && (
              text.includes('"kind":"image"') || 
              text.includes("'kind':'image'") ||
              text.includes('ImageArtifact')
            )) {
              try {
                let artifactContent = null;
                
                // Try to parse JSON content
                if (text.includes('```json')) {
                  const jsonMatch = text.match(/```json\s*({[\s\S]*?})\s*```/);
                  if (jsonMatch) {
                    artifactContent = JSON.parse(jsonMatch[1]);
                  }
                } else if (text.startsWith('{') && text.endsWith('}')) {
                  artifactContent = JSON.parse(text);
                }
                
                if (artifactContent && 
                    artifactContent.status === 'completed' && 
                    artifactContent.imageUrl) {
                  
                  imageArtifacts.push({
                    id: artifactContent.requestId || artifactContent.projectId || msg.id,
                    url: artifactContent.imageUrl,
                    prompt: artifactContent.prompt || 'Generated image',
                    createdAt: msg.createdAt,
                    projectId: artifactContent.projectId,
                  });
                  
                  // Stop at limit
                  if (imageArtifacts.length >= limit) {
                    break;
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON artifacts
                continue;
              }
            }
          }
        }
        
        if (imageArtifacts.length >= limit) {
          break;
        }
      }
    }

    return imageArtifacts;
  } catch (error) {
    console.error('Failed to get chat image artifacts from database');
    throw error;
  }
}

// AICODE-NOTE: New document gallery query functions
export async function getDocuments({
  userId,
  kind,
  model,
  visibility = 'all',
  search,
  dateFrom,
  dateTo,
  sortBy = 'newest',
  page = 1,
  limit = 20,
}: {
  userId?: string;
  kind?: ArtifactKind;
  model?: string;
  visibility?: 'mine' | 'public' | 'all';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'newest' | 'oldest' | 'popular';
  page?: number;
  limit?: number;
}) {
  try {
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    // Visibility filter
    if (visibility === 'mine' && userId) {
      conditions.push(eq(document.userId, userId));
    } else if (visibility === 'public') {
      conditions.push(eq(document.visibility, 'public'));
    } else if (visibility === 'all' && userId) {
      const visibilityCondition = or(
        eq(document.userId, userId),
        eq(document.visibility, 'public')
      );
      if (visibilityCondition) {
        conditions.push(visibilityCondition);
      }
    }

    // Kind filter
    if (kind) {
      conditions.push(eq(document.kind, kind));
    }

    // Model filter
    if (model) {
      conditions.push(eq(document.model, model));
    }

    // Date range filters
    if (dateFrom) {
      conditions.push(gte(document.createdAt, dateFrom));
    }
    if (dateTo) {
      conditions.push(lt(document.createdAt, dateTo));
    }

    // Search filter - search in title and tags
    if (search && typeof search === 'string' && search.length > 0) {
      const searchCondition = or(
        ilike(document.title, `%${search}%`),
        sql`${document.tags}::text LIKE ${`%${search}%`}` // <-- исправлено
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Build query
    const baseQuery = db
      .select({
        id: document.id,
        title: document.title,
        kind: document.kind,
        thumbnailUrl: document.thumbnailUrl,
        createdAt: document.createdAt,
        userId: document.userId,
        model: document.model,
        tags: document.tags,
        viewCount: document.viewCount,
        visibility: document.visibility,
        metadata: document.metadata,
        username: user.email,
      })
      .from(document)
      .leftJoin(user, eq(document.userId, user.id));

    const queryWithWhere = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // Apply sorting
    const queryWithSort = sortBy === 'newest' 
      ? queryWithWhere.orderBy(desc(document.createdAt))
      : sortBy === 'oldest'
      ? queryWithWhere.orderBy(asc(document.createdAt))
      : sortBy === 'popular'
      ? queryWithWhere.orderBy(desc(document.viewCount))
      : queryWithWhere.orderBy(desc(document.createdAt));

    // Get total count for pagination
    const countQuery = db
      .select({ count: count() })
      .from(document);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: total }] = await countQuery;

    // Get documents with pagination
    const documents = await queryWithSort.limit(limit).offset(offset);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + documents.length < total,
      },
    };
  } catch (error) {
    console.error('Failed to get documents from database');
    throw error;
  }
}

export async function getPublicDocuments({
  kind,
  model,
  search,
  dateFrom,
  dateTo,
  sortBy = 'newest',
  page = 1,
  limit = 20,
}: {
  kind?: ArtifactKind;
  model?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'newest' | 'oldest' | 'popular';
  page?: number;
  limit?: number;
}) {
  return getDocuments({
    visibility: 'public',
    kind,
    model,
    search,
    dateFrom,
    dateTo,
    sortBy,
    page,
    limit,
  });
}

export async function incrementDocumentViewCount({ id }: { id: string }) {
  try {
    return await db
      .update(document)
      .set({ viewCount: sql`${document.viewCount} + 1` })
      .where(eq(document.id, id));
  } catch (error) {
    console.error('Failed to increment document view count');
    throw error;
  }
}

export async function updateDocumentVisibility({
  id,
  visibility,
  userId,
}: {
  id: string;
  visibility: 'public' | 'private';
  userId: string;
}) {
  try {
    return await db
      .update(document)
      .set({ visibility })
      .where(and(eq(document.id, id), eq(document.userId, userId)));
  } catch (error) {
    console.error('Failed to update document visibility');
    throw error;
  }
}

export async function updateDocumentMetadata({
  id,
  metadata,
  userId,
}: {
  id: string;
  metadata: Record<string, any>;
  userId: string;
}) {
  try {
    return await db
      .update(document)
      .set({ metadata })
      .where(and(eq(document.id, id), eq(document.userId, userId)));
  } catch (error) {
    console.error('Failed to update document metadata');
    throw error;
  }
}

// ===================================
// SuperDuperAI Integration Queries
// ===================================

/**
 * Сохраняет SuperDuperAI токен и данные пользователя
 */
export async function saveUserSuperduperAI({
  userId,
  token,
  superduperaiUserId,
  balance = 0,
}: {
  userId: string;
  token: string;
  superduperaiUserId: string;
  balance?: number;
}) {
  try {
    return await db
      .update(user)
      .set({
        superduperai_token: token, // пока без шифрования для простоты
        superduperai_user_id: superduperaiUserId,
        superduperai_balance: balance,
        superduperai_connected_at: new Date(),
      })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('Failed to save SuperDuperAI token:', error);
    throw error;
  }
}

/**
 * Получает SuperDuperAI токен для пользователя
 */
export async function getUserSuperduperAIToken(userId: string): Promise<string | null> {
  try {
    const [result] = await db
      .select({ token: user.superduperai_token })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return result?.token || null;
  } catch (error) {
    console.error('Failed to get SuperDuperAI token:', error);
    return null;
  }
}

/**
 * Получает статус подключения SuperDuperAI для пользователя
 */
export async function getUserSuperduperAIStatus(userId: string): Promise<{
  isConnected: boolean;
  balance: number;
  superduperaiUserId: string | null;
  connectedAt: Date | null;
}> {
  try {
    const [result] = await db
      .select({
        token: user.superduperai_token,
        balance: user.superduperai_balance,
        superduperaiUserId: user.superduperai_user_id,
        connectedAt: user.superduperai_connected_at,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      isConnected: !!result?.token,
      balance: result?.balance || 0,
      superduperaiUserId: result?.superduperaiUserId || null,
      connectedAt: result?.connectedAt || null,
    };
  } catch (error) {
    console.error('Failed to get SuperDuperAI status:', error);
    return {
      isConnected: false,
      balance: 0,
      superduperaiUserId: null,
      connectedAt: null,
    };
  }
}

/**
 * Обновляет баланс пользователя SuperDuperAI
 */
export async function updateUserSuperduperAIBalance(userId: string, balance: number) {
  try {
    return await db
      .update(user)
      .set({ superduperai_balance: balance })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('Failed to update SuperDuperAI balance:', error);
    throw error;
  }
}

/**
 * Отключает SuperDuperAI для пользователя
 */
export async function disconnectUserSuperduperAI(userId: string) {
  try {
    return await db
      .update(user)
      .set({
        superduperai_token: null,
        superduperai_user_id: null,
        superduperai_balance: 0,
        superduperai_connected_at: null,
      })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('Failed to disconnect SuperDuperAI:', error);
    throw error;
  }
}
