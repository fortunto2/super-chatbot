import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Auth0Provider from 'next-auth/providers/auth0';
import {
  createGuestUser,
  getUser,
  getOrCreateOAuthUser,
} from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';
import { nanoid } from 'nanoid';
import * as Sentry from '@sentry/nextjs';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

/**
 * Синхронизирует пользователя Auth0 с БД с надежной обработкой ошибок
 * Повторяет попытку три раза в случае неудачи
 */
async function syncAuth0User(userId: string, email: string | null) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (email) {
        const user = await getOrCreateOAuthUser(userId, email);
        return user;
      }
      return null;
    } catch (error) {
      console.error(`Failed to sync Auth0 user (attempt ${attempt + 1}):`, error);
      lastError = error;
      
      // Ждем перед следующей попыткой (нарастающее время ожидания)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }
  }

  // Логируем ошибку в Sentry, если все попытки неудачны
  Sentry.captureException(lastError, {
    tags: { error_type: 'auth0_sync_failure' },
    extra: { 
      userId,
      email,
      attempts: maxRetries
    }
  });
  
  return null;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH_AUTH0_ID as string,
      clientSecret: process.env.AUTH_AUTH0_SECRET as string,
      issuer: process.env.AUTH_AUTH0_ISSUER as string,
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      if (account && account.provider === 'auth0') {
        token.type = 'regular';

        // Если ID отсутствует, генерируем его
        if (!token.id) {
          token.id = nanoid();
        }

        // Логируем информацию для отладки
        Sentry.addBreadcrumb({
          category: 'auth',
          message: 'Processing Auth0 account',
          level: 'info',
          data: { 
            tokenId: token.id, 
            tokenEmail: token.email,
            tokenName: token.name,
            provider: account.provider 
          }
        });

        try {
          if (token.email) {
            // Используем улучшенную версию с повторными попытками
            await syncAuth0User(token.id, token.email);
          }
        } catch (error) {
          console.error('Error syncing Auth0 user with database:', error);
          // Логируем ошибку в Sentry
          Sentry.captureException(error, {
            tags: { 
              error_type: 'auth0_db_sync',
              phase: 'jwt_callback'
            },
            extra: { 
              tokenId: token.id,
              tokenEmail: token.email 
            }
          });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;

        // Дополнительная синхронизация пользователя OAuth с каждым запросом сессии
        if (token.email && token.type === 'regular') {
          try {
            // Используем улучшенную версию с повторными попытками
            await syncAuth0User(token.id, token.email);
          } catch (error) {
            console.error(
              'Error syncing Auth0 user during session check:',
              error,
            );
            // Логируем ошибку в Sentry
            Sentry.captureException(error, {
              tags: { 
                error_type: 'auth0_db_sync',
                phase: 'session_callback'
              },
              extra: { 
                tokenId: token.id,
                tokenEmail: token.email 
              }
            });
          }
        }
      }

      return session;
    },
  },
});
