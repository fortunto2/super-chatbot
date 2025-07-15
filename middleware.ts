import { NextResponse, type NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';
import * as Sentry from '@sentry/nextjs';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Sentry context setup
  Sentry.withScope((scope) => {
    scope.setTag('path', pathname);
    scope.setExtra('url', request.url);
    scope.setExtra('method', request.method);
  });

  // AICODE-NOTE: Auth0 middleware handles auth routes automatically
  const authRes = await auth0.middleware(request);

  // Handle Auth0 routes automatically (login, logout, callback, me)
  if (pathname.startsWith('/auth')) {
    return authRes;
  }

  // Allow health check and static asset paths
  const allowedPaths = [
    '/ping',
    '/api/config/',
    '/api/generate/',
    '/api/file/',
    '/debug',
    '/monitoring',
  ];
  if (allowedPaths.some(path => pathname.startsWith(path))) {
    return authRes;
  }

  // AICODE-NOTE: Get Auth0 session instead of NextAuth token
  const session = await auth0.getSession(request);

  // Set user context for Sentry if authenticated
  if (session) {
    Sentry.setUser({
      id: session.user.sub,
      email: session.user.email || undefined,
      username: session.user.name || undefined,
    });
    Sentry.setTag('user_type', 'authenticated');
    Sentry.setTag('superduperai_connected', session.user.superduperai_connected ? 'yes' : 'no');
  } else {
    Sentry.setUser(null);
  }

  // --- REDIRECTION LOGIC ---

  // CASE 1: Authenticated user trying to access login pages
  // ACTION: Redirect to home
  const isAuthPage = ['/login', '/auto-login', '/register'].includes(pathname);
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // CASE 2: Unauthenticated user on protected pages
  // ACTION: Redirect to Auth0 login
  if (!session && !isAuthPage && !pathname.startsWith('/auth')) {
    console.log('🔒 Redirecting unauthenticated user to Auth0 login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // AICODE-NOTE: Always return Auth0 middleware response to ensure proper session handling
  return authRes;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
};
