import * as Sentry from '@sentry/nextjs';
import { auth } from '@/app/(auth)/auth';
import {
  getChatsByUserId,
  getChatById,
  getMessagesByChatId,
} from '@/lib/db/queries';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      // Логируем ошибку аутентификации
      Sentry.captureMessage(
        `Authentication failed: ${JSON.stringify({
          hasSession: !!session,
          hasUser: !!session?.user,
        })}`,
      );

      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Получаем информацию о пользователе
    const userId = session.user.id;
    Sentry.setUser({
      id: userId,
      email: session.user.email || undefined,
      userType: session.user.type,
    });

    try {
      // Пробуем получить чаты пользователя
      const chatsResult = await getChatsByUserId({
        id: userId,
        limit: 10,
        startingAfter: null,
        endingBefore: null,
      });

      // Проверяем наличие чатов
      const hasChats = chatsResult.chats.length > 0;

      // Если есть чаты, попробуем получить последний
      let chatDetails = null;
      let messages = null;

      if (hasChats) {
        const lastChat = chatsResult.chats[0];

        try {
          // Получаем подробную информацию о чате
          chatDetails = await getChatById({ id: lastChat.id });

          try {
            // Получаем сообщения в чате
            messages = await getMessagesByChatId({ id: lastChat.id });
          } catch (messageError) {
            Sentry.captureException(messageError, {
              extra: { context: 'Getting messages', chatId: lastChat.id },
            });
          }
        } catch (chatError) {
          Sentry.captureException(chatError, {
            extra: { context: 'Getting chat details', chatId: lastChat.id },
          });
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: session.user.email,
          type: session.user.type,
        },
        chats: {
          count: chatsResult.chats.length,
          hasMore: chatsResult.hasMore,
          items: chatsResult.chats.map((chat) => ({
            id: chat.id,
            title: chat.title,
            createdAt: chat.createdAt,
            visibility: chat.visibility,
          })),
        },
        lastChatDetails: chatDetails,
        lastChatMessages: messages ? messages.length : null,
      });
    } catch (dbError) {
      // Логируем ошибки базы данных
      Sentry.captureException(dbError, {
        extra: { context: 'Database query', userId },
      });

      return NextResponse.json(
        { error: 'Database error', message: (dbError as Error).message },
        { status: 500 },
      );
    }
  } catch (error) {
    // Логируем необработанные ошибки
    Sentry.captureException(error);

    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 },
    );
  }
}
