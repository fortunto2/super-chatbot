import { NextRequest, NextResponse } from 'next/server';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params;
  
  try {
    const config = getSuperduperAIConfig();
    
    console.log('📁 File proxy: Getting file status for ID:', fileId);
    
    const response = await fetch(`${config.url}/api/v1/file/${fileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
        'User-Agent': 'SuperChatbot/1.0',
      },
    });

    console.log(`📡 SuperDuperAI File API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SuperDuperAI File API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get file status', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ File status response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 File proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to get file status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 