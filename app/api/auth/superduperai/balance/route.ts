import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { getUserSuperduperAIToken, updateUserSuperduperAIBalance } from '@/lib/db/queries';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { UserService } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userToken = await getUserSuperduperAIToken(session.user.id);
    if (!userToken) {
      return NextResponse.json({ 
        error: 'No SuperDuperAI connection',
        hasConnection: false,
        balance: 0 
      }, { status: 404 });
    }

    // Настраиваем SuperDuperAI client с пользовательским токеном
    configureSuperduperAI({ 
      url: process.env.SUPERDUPERAI_URL!,
      token: userToken,
      wsURL: process.env.SUPERDUPERAI_URL?.replace('https://', 'wss://')
    });

    // Получаем актуальный баланс из SuperDuperAI
    const userInfo = await UserService.userMe();
    const balance = userInfo.balance || 0;

    // Обновляем баланс в нашей БД
    await updateUserSuperduperAIBalance(session.user.id, balance);

    return NextResponse.json({
      hasConnection: true,
      balance,
      vip: userInfo.vip || false,
      admin: userInfo.admin || false,
    });
  } catch (error) {
    console.error('SuperDuperAI balance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', hasConnection: false, balance: 0 },
      { status: 500 }
    );
  }
} 