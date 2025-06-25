import { NextRequest, NextResponse } from 'next/server';
import { getSuperduperAIConfig } from '@/lib/config/superduperai';

export async function POST(request: NextRequest) {
  try {
    const config = getSuperduperAIConfig();
    const body = await request.json();
    
    console.log('🎬 Video proxy: Forwarding request to SuperDuperAI API');
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${config.url}/api/v1/file/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
        'User-Agent': 'SuperChatbot/1.0',
      },
      body: JSON.stringify(body),
    });

    console.log(`📡 SuperDuperAI API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SuperDuperAI API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate video', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Video generation response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Video proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 