'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/components/icons';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Автоматически начинаем процесс аутентификации через Auth0
    const loginWithAuth0 = async () => {
      await signIn('auth0', { callbackUrl: '/' });
    };

    loginWithAuth0();
  }, []);

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Вход</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Аутентификация через Auth0
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <Button
            onClick={() => signIn('auth0', { callbackUrl: '/' })}
            type="button"
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Войти через Auth0
          </Button>
          <div className="flex items-center justify-center mt-4">
            <div className="animate-spin text-zinc-500 size-6">
              <LoaderIcon size={24} />
            </div>
            <span className="ml-2 text-zinc-600 dark:text-zinc-400">
              Перенаправление...
            </span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {' Нет аккаунта? '}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              onClick={() => signIn('auth0', { callbackUrl: '/' })}
            >
              Зарегистрируйтесь
            </Button>
            {' через Auth0.'}
          </p>
        </div>
      </div>
    </div>
  );
}
