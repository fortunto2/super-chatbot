import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { getUserSuperduperAIStatus } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getUserSuperduperAIStatus(session.user.id);
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('SuperDuperAI status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
} 