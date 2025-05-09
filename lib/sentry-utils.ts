import * as Sentry from '@sentry/nextjs';

/**
 * Логирует ошибки HTTP в Sentry с полной информацией о запросе
 */
export function logHttpError(
  error: Error,
  request: Request,
  statusCode: number,
) {
  const url = new URL(request.url);

  Sentry.withScope((scope) => {
    // Добавляем информацию о запросе
    scope.setExtra('url', request.url);
    scope.setExtra('method', request.method);
    scope.setExtra('path', url.pathname);
    scope.setExtra('query', Object.fromEntries(url.searchParams.entries()));
    scope.setExtra('statusCode', statusCode);

    // Пытаемся получить заголовки запроса
    try {
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        // Избегаем добавления конфиденциальных заголовков
        if (!['authorization', 'cookie'].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      });
      scope.setExtra('headers', headers);
    } catch (e) {
      // Игнорируем ошибки при получении заголовков
    }

    // Логируем ошибку
    Sentry.captureException(error);
  });
}

/**
 * Логирует ошибки API в Sentry
 */
export function logApiError(error: Error, context: Record<string, any> = {}) {
  Sentry.withScope((scope) => {
    // Добавляем контекст
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Логируем ошибку
    Sentry.captureException(error);
  });
}

/**
 * Создает новый span для трассировки производительности
 */
export function createSpan(
  name: string,
  operation: string,
  callback: () => Promise<any>,
) {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    callback,
  );
}
