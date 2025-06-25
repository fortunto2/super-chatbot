import { NextRequest, NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { FileService } from '@/lib/api/services/FileService';
import type { IFileRead } from '@/lib/api/models/IFileRead';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params;
  
  try {
    // Configure OpenAPI client for server-side usage
    configureSuperduperAI();
    
    console.log('📁 File proxy: Getting file status for ID:', fileId);
    
    // Use OpenAPI client instead of manual fetch
    const fileData: IFileRead = await FileService.fileGetById({ id: fileId });

    console.log('✅ File status response:', fileData);
    
    return NextResponse.json(fileData);
  } catch (error) {
    console.error('💥 File proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to get file status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 