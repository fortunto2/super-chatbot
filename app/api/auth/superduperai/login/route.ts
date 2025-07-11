import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin } = new URL(request.url);
    const callbackUrl = `${origin}/api/auth/superduperai/callback`;
    
    // Используем SuperDuperAI URL из конфигурации
    const superduperaiUrl = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
    const authUrl = `${superduperaiUrl}/api/v1/auth/login?redirect_url=${encodeURIComponent(callbackUrl)}`;
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('SuperDuperAI login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 