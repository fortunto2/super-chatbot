import { auth } from '@/app/(auth)/auth';
import { saveMessages, getMessageById } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { message } from '@/lib/db/schema';

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, message: messageData } = body;

    if (!chatId || !messageData) {
      return NextResponse.json(
        { error: 'Missing chatId or message' }, 
        { status: 400 }
      );
    }
    
    // Check if message already exists to avoid duplicates
    const existingMessage = await getMessageById({ id: messageData.id });
    
    if (existingMessage && existingMessage.length > 0) {
      // If message exists, update it instead of creating new one
      await db
        .update(message)
        .set({
          parts: messageData.parts || [],
          attachments: messageData.attachments || [],
        })
        .where(eq(message.id, messageData.id));
        
      return NextResponse.json({ 
        success: true, 
        message: 'Message updated successfully' 
      });
    }

    // Prepare message for database
    const messageToSave = {
      id: messageData.id,
      chatId: chatId,
      role: messageData.role,
      parts: messageData.parts || [],
      attachments: messageData.attachments || [],
      createdAt: messageData.createdAt ? new Date(messageData.createdAt) : new Date(),
    };
    
    await saveMessages({
      messages: [messageToSave],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save message API error:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: 'Failed to save message',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 