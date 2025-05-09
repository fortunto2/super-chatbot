'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

export default function NotFound() {
  useEffect(() => {
    // Логируем 404 ошибку в Sentry
    Sentry.captureMessage('404 Not Found', {
      level: 'error',
      tags: {
        error_type: '404',
        page: window.location.pathname,
      },
    });
  }, []);

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Страница не найдена</p>
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
