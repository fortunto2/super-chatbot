import { auth } from '@/app/(auth)/auth';
import { getUserToolsBalance, getBalanceStatus, initializeUserBalance } from '@/lib/utils/tools-balance';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userType = session.user.type;

    // Initialize balance for new users
    await initializeUserBalance(userId, userType);

    const balance = await getUserToolsBalance(userId);
    const status = await getBalanceStatus(userId);

    return NextResponse.json({
      balance,
      status,
      userType,
      userId,
    });
  } catch (error) {
    console.error('Error fetching tools balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools balance' },
      { status: 500 },
    );
  }
} 