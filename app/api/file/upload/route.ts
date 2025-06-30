import { type NextRequest, NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { FileService } from '@/lib/api/services/FileService';
import type { Body_file_upload } from '@/lib/api/models/Body_file_upload';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 File upload API: Processing file upload request');
    
    // Configure SuperDuperAI for server-side operations
    configureSuperduperAI();
    
    const formData = await request.formData();
    const file = formData.get('payload') as File;
    
    if (!file) {
      console.error('❌ No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    console.log('📁 File upload details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }
    
    // Convert File to Blob for FileService
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    
    const uploadData: Body_file_upload = {
      payload: fileBlob
    };
    
    console.log('📁 Uploading to SuperDuperAI...');
    
    // Upload using FileService
    const result = await FileService.fileUpload({
      formData: uploadData,
      type: 'image' as any, // Specify type as image
    });
    
    console.log('✅ File upload successful:', {
      id: result.id,
      url: result.url,
      type: result.type
    });
    
    return NextResponse.json({
      success: true,
      id: result.id,
      url: result.url,
      type: result.type,
      message: 'File uploaded successfully'
    });
    
  } catch (error) {
    console.error('💥 File upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific error types
    if (errorMessage.includes('magic')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'File processing error', 
          details: 'Backend service issue with file type detection. Please try a different image format.'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'File upload failed', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 