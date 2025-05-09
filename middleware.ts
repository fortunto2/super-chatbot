import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Проверка на наличие параметра, предотвращающего цикл
  const hasRedirectParam = searchParams.has('from_redirect');

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Если пользователь переходит на страницу входа, перенаправляем на auto-login
  if (pathname === '/login') {
    const url = new URL('/auto-login', request.url);
    return NextResponse.redirect(url);
  }

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    // Для API запросов используем гостевой вход
    if (pathname.startsWith('/api/')) {
      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
      );
    }

    // Для страницы auto-login, если уже есть параметр from_redirect,
    // не перенаправляем снова, чтобы избежать циклических редиректов
    if (pathname === '/auto-login' && hasRedirectParam) {
      return NextResponse.next();
    }

    // Для обычных запросов перенаправляем на auto-login с параметром
    const url = new URL('/auto-login', request.url);
    url.searchParams.set('from_redirect', 'true');
    return NextResponse.redirect(url);
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/auto-login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/auto-login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
