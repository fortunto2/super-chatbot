import { auth } from '@/app/(auth)/auth';
import { 
  getUserToolsBalance, 
  addUserBalance, 
  setUserBalance,
  getBalanceStatus
} from '@/lib/utils/tools-balance';
import { NextRequest, NextResponse } from 'next/server';

// Check if user is admin (you may want to implement proper admin role checking)
function isAdmin(email?: string | null): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return email ? adminEmails.includes(email) : false;
}

// GET - Get user balance (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const balance = await getUserToolsBalance(userId);
    const status = await getBalanceStatus(userId);

    return NextResponse.json({
      userId,
      balance,
      status,
    });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user balance' },
      { status: 500 },
    );
  }
}

// POST - Add balance to user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount, reason } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId and amount are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const transaction = await addUserBalance(userId, amount, reason, {
      adminEmail: session.user.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: `Added ${amount} credits to user ${userId}`,
    });
  } catch (error) {
    console.error('Error adding user balance:', error);
    return NextResponse.json(
      { error: 'Failed to add user balance' },
      { status: 500 },
    );
  }
}

// PUT - Set user balance (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, balance, reason } = await request.json();

    if (!userId || balance === undefined) {
      return NextResponse.json(
        { error: 'userId and balance are required' },
        { status: 400 }
      );
    }

    if (typeof balance !== 'number' || balance < 0) {
      return NextResponse.json(
        { error: 'Balance must be a non-negative number' },
        { status: 400 }
      );
    }

    const transaction = await setUserBalance(userId, balance, reason || 'Admin balance adjustment');

    return NextResponse.json({
      success: true,
      transaction,
      message: `Set balance to ${balance} credits for user ${userId}`,
    });
  } catch (error) {
    console.error('Error setting user balance:', error);
    return NextResponse.json(
      { error: 'Failed to set user balance' },
      { status: 500 },
    );
  }
} 