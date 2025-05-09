'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

export default function AutoLogin() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRedirect = searchParams.has('from_redirect');
  const [loginAttempted, setLoginAttempted] = useState(false);

  useEffect(() => {
    // Если пользователь уже аутентифицирован, перенаправляем на главную страницу
    if (status === 'authenticated') {
      router.push('/');
      return;
    }

    // Если пользователь не аутентифицирован и статус загрузки завершен,
    // начинаем процесс входа через Auth0 только один раз
    if (status === 'unauthenticated' && !loginAttempted) {
      setLoginAttempted(true);
      signIn('auth0', { callbackUrl: '/' });
    }
  }, [status, router, loginAttempted]);

  // Если уже был редирект и пользователь всё ещё не авторизован,
  // показываем ссылку на гостевой вход
  if (fromRedirect && status === 'unauthenticated' && loginAttempted) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Не удалось выполнить вход через Auth0.
          </p>
          <Button
            onClick={() => router.push('/api/auth/guest?redirectUrl=/')}
            className="mt-4"
          >
            Войти как гость
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin text-zinc-500 size-12">
          <LoaderIcon size={48} />
        </div>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Перенаправление на Auth0...
        </p>
      </div>
    </div>
  );
}
