import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { disconnectUserSuperduperAI } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await disconnectUserSuperduperAI(session.user.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SuperDuperAI disconnect error:', error);
    return NextResponse.json(
      { error: 'Disconnect failed' },
      { status: 500 }
    );
  }
}
 