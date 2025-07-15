'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { guestRegex } from '@/lib/constants';

function AutoLoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isGuest = session?.user?.email ? guestRegex.test(session.user.email) : false;

    // Based on session status, decide the action
    switch (status) {
      case 'loading':
        // Still loading, do nothing
        break;

      case 'authenticated':
        if (isGuest) {
          // If the user is a guest, we need to sign them out first
          // and then immediately sign them in via Auth0.
          signOut({ redirect: false }).then(() => {
            signIn('auth0', { callbackUrl });
          });
        } else {
          // If a regular user is somehow on this page, redirect them.
          router.push(callbackUrl);
        }
        break;

      case 'unauthenticated':
        // If the user is not authenticated, start the Auth0 login flow.
        signIn('auth0', { callbackUrl }).catch(() => {
            setError('Failed to redirect to Auth0. Please try again.');
        });
        break;
    }
  }, [status, session, router, callbackUrl]);
  
  if (error) {
     return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-destructive">{error}</p>
          <Button onClick={() => signIn('auth0', { callbackUrl })}>
            Retry Login
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
          Preparing your login...
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
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <AutoLoginContent />
    </Suspense>
  );
}
