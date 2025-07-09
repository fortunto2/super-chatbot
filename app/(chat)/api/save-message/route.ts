import { auth } from '@/app/(auth)/auth';
import { 
  saveMessages, 
  getMessageById, 
  getChatById, 
  saveChat 
} from '@/lib/db/queries';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { message } from '@/lib/db/schema';
import { generateTitleFromUserMessage } from '../../actions';

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL || '');
const db = drizzle(client);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, message: messageData } = body;

    console.log('💾 API save-message received:', {
      chatId,
      messageId: messageData?.id,
      role: messageData?.role,
      partsCount: messageData?.parts?.length || 0,
      attachmentsCount: messageData?.attachments?.length || 0,
      hasContent: !!messageData?.content
    });

    if (!chatId || !messageData) {
      console.error('💾 API save-message error: Missing required data');
      return NextResponse.json(
        { error: 'Missing chatId or message' }, 
        { status: 400 }
      );
    }

    // AICODE-NOTE: Check if chat exists and create it if it doesn't to prevent foreign key violations.
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      console.log(`💾 Chat with ID ${chatId} not found, creating it...`);
      try {
        // The message object from the client might not have a 'content' field,
        // which is used for title generation. We construct it from 'parts'.
        if (!messageData.content && Array.isArray(messageData.parts)) {
          messageData.content = messageData.parts
            .map((part: any) => (part.text ? part.text : ''))
            .join('\n');
        }

        const title = await generateTitleFromUserMessage({
          message: messageData,
        });

        await saveChat({
          id: chatId,
          userId: session.user.id,
          title,
          visibility: 'private', // Default to private for saved messages
        });
        console.log(`💾 ✅ Chat ${chatId} created successfully.`);
      } catch (createError) {
        console.error(`💾 ❌ Failed to create chat ${chatId}:`, createError);
        return NextResponse.json(
          { 
            error: 'Failed to create chat for message',
            details: createError instanceof Error ? createError.message : String(createError)
          }, 
          { status: 500 }
        );
      }
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