'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

function AutoLoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRedirect = searchParams.has('from_redirect');
  const forceLogout = searchParams.has('force_logout');
  const guestMode = searchParams.has('guest_mode');
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [logoutAttempted, setLogoutAttempted] = useState(false);

  useEffect(() => {
    // If force_logout parameter is present and we're authenticated (guest mode)
    // Force logout first before attempting Auth0 login
    if (forceLogout && status === 'authenticated' && !logoutAttempted) {
      setLogoutAttempted(true);
      signOut({
        redirect: false,
      }).then(() => {
        // Clear the force_logout parameter and retry
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('force_logout');
        window.history.replaceState({}, '', newUrl.toString());
        setLogoutAttempted(false);
      });
      return;
    }

    // Если пользователь уже аутентифицирован, перенаправляем на главную страницу
    // BUT only if we're not in force logout mode
    if (status === 'authenticated' && !forceLogout) {
      router.push('/');
      return;
    }

    // Если пользователь не аутентифицирован и статус загрузки завершен,
    // начинаем процесс входа через Auth0 только один раз
    // НО если указан параметр guest_mode, переходим в гостевой режим
    if (status === 'unauthenticated' && !loginAttempted) {
      setLoginAttempted(true);
      if (guestMode) {
        // Переход в гостевой режим
        router.push('/api/auth/guest?redirectUrl=/');
      } else {
        signIn('auth0', { callbackUrl: '/' });
      }
    }
  }, [status, router, loginAttempted, forceLogout, logoutAttempted, guestMode]);

  // Если уже был редирект и пользователь всё ещё не авторизован,
  // показываем ссылку на гостевой вход
  if (fromRedirect && status === 'unauthenticated' && loginAttempted && !guestMode) {
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

export default function AutoLogin() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin text-zinc-500 size-12">
              <LoaderIcon size={48} />
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Загрузка...
            </p>
          </div>
        </div>
      }
    >
      <AutoLoginContent />
    </Suspense>
  );
}
