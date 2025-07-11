import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { AuthService, UserService } from '@/lib/api';
import { saveUserSuperduperAI } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/profile?error=auth_failed', request.url)
      );
    }

    // Настраиваем SuperDuperAI client для server-side использования
    configureSuperduperAI();

    // Обработка OAuth callback - получаем токен
    const callbackResponse = await AuthService.authLoginCallback({
      redirectUrl: `${request.headers.get('origin')}/profile`
    });

    // Получаем информацию о токене
    const tokenResponse = await AuthService.authToken();
    
    // Получаем информацию о пользователе
    const userInfo = await UserService.userMe();

    // Сохраняем в нашей БД
    await saveUserSuperduperAI({
      userId: session.user.id,
      token: tokenResponse, // Реальный токен из response
      superduperaiUserId: userInfo.id,
      balance: userInfo.balance || 0,
    });

    return NextResponse.redirect(
      new URL('/profile?connected=true', request.url)
    );
  } catch (error) {
    console.error('SuperDuperAI callback error:', error);
    return NextResponse.redirect(
      new URL('/profile?error=connection_failed', request.url)
    );
  }
} 