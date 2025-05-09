import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Инициализация Sentry для серверной части
    Sentry.init({
      dsn: 'https://1301771c6b15e81db39cfe8653da9eec@o4508070942474240.ingest.us.sentry.io/4509294960705536',

      // Добавляет заголовки запросов и IP для пользователей
      sendDefaultPii: true,

      // Устанавливаем tracesSampleRate на 1.0, чтобы захватывать 100%
      // транзакций для трассировки.
      // В продакшне рекомендуется установить меньшее значение
      tracesSampleRate: 1.0,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Инициализация Sentry для edge runtime
    Sentry.init({
      dsn: 'https://1301771c6b15e81db39cfe8653da9eec@o4508070942474240.ingest.us.sentry.io/4509294960705536',

      // Добавляет заголовки запросов и IP для пользователей
      sendDefaultPii: true,

      // Устанавливаем tracesSampleRate на 1.0, чтобы захватывать 100%
      // транзакций для трассировки.
      // В продакшне рекомендуется установить меньшее значение
      tracesSampleRate: 1.0,
    });
  }
}

// Перехват ошибок запросов (для Next.js 15+)
export const onRequestError = Sentry.captureRequestError;
