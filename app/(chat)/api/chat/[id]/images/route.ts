import { auth } from '@/app/(auth)/auth';
import { getChatImageArtifacts } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.id;
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Get image artifacts from chat messages
    const imageArtifacts = await getChatImageArtifacts({
      chatId,
      limit: 20, // Return up to 20 recent images
    });

    return NextResponse.json(imageArtifacts);
    
  } catch (error) {
    console.error('Failed to get chat image artifacts:', error);
    return NextResponse.json(
      { error: 'Failed to load chat images' },
      { status: 500 }
    );
  }
} 