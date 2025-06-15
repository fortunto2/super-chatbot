import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co';
    const token = process.env.SUPERDUPERAI_TOKEN || process.env.SUPERDUPERAI_API_KEY || '';

    if (!token) {
      return NextResponse.json(
        { error: 'SUPERDUPERAI_TOKEN or SUPERDUPERAI_API_KEY environment variable is required' },
        { status: 500 }
      );
    }

    // Return config without exposing the token
    return NextResponse.json({
      url,
      hasToken: !!token,
      wsURL: url.replace('https://', 'wss://').replace('http://', 'ws://'),
    });
  } catch (error) {
    console.error('Failed to get SuperDuperAI config:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
} 