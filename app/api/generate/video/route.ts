import { type NextRequest, NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai';
import { FileService } from '@/lib/api/services/FileService';
import { GenerationTypeEnum } from '@/lib/api/models/GenerationTypeEnum';

export async function POST(request: NextRequest) {
  try {
    // Handle FormData for image uploads or JSON for text-only
    let body: any;
    let sourceImageFile: File | null = null;
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('🎬 Video API: Processing multipart form data (image-to-video)');
      const formData = await request.formData();
      
      // Extract form fields
      body = {
        prompt: formData.get('prompt') as string,
        model: formData.get('model') as string,
        resolution: formData.get('resolution') as string,
        chatId: formData.get('chatId') as string,
        negativePrompt: formData.get('negativePrompt') as string,
        duration: Number(formData.get('duration')) || 5,
        generationType: formData.get('generationType') as string,
        frameRate: Number(formData.get('frameRate')) || 30,
        style: formData.get('style') as string,
        shotSize: formData.get('shotSize') as string,
        seed: Number(formData.get('seed')) || undefined,
      };
      
      // Extract image file  
      sourceImageFile = formData.get('sourceImage') as File | null;
      
      console.log('📦 Form data parameters:', body);
      console.log('🖼️ Source image file:', sourceImageFile ? `${sourceImageFile.name} (${sourceImageFile.size} bytes)` : 'None');
    } else {
      console.log('🎬 Video API: Processing JSON data (text-to-video)');
      body = await request.json();
      console.log('📦 Request parameters:', JSON.stringify(body, null, 2));
    }
    
    // Extract parameters from request body
    const {
      prompt,
      model,
      resolution,
      chatId,
      negativePrompt,
      duration = 5,
      generationType = 'text-to-video',
      frameRate = 30,
      style,
      shotSize,
      seed,
      sourceImageId,
      sourceImageUrl
    } = body;

        // AICODE-NOTE: Configure OpenAPI client server-side only (per AGENTS.md architecture)
    configureSuperduperAI();

    // Handle image upload if present for image-to-video mode
    let references: any[] = [];
    
    if (generationType === 'image-to-video' && sourceImageFile) {
      console.log('🖼️ Processing image-to-video generation with file upload...');
      
      try {
        // AICODE-NOTE: Upload image using OpenAPI FileService  
        const uploadResult = await FileService.fileUpload({
          formData: {
            payload: sourceImageFile
          }
        });
        
        console.log('✅ Image uploaded successfully:', uploadResult);
        
        // Add reference for image-to-video generation
        references.push({
          type: 'source',
          reference_id: uploadResult.id,
          reference_url: uploadResult.url
        });
        
      } catch (uploadError) {
        console.error('❌ Failed to upload source image:', uploadError);
        throw new Error('Failed to upload source image');
      }
    }

    // AICODE-NOTE: Use OpenAPI FileService for video generation (typed proxy architecture)
    console.log('🎬 Generating video with OpenAPI client...');
    console.log('📝 Generation type:', generationType);
    console.log('🎯 Selected model:', model);
    
    // Parse resolution parameter to extract width, height, and aspect ratio
    const parseResolution = (resolutionString: string) => {
      // Default values
      let width = 1280;
      let height = 720;
      let aspectRatio = "16:9";
      
      if (resolutionString) {
        // Parse formats like "1920x1080 (Full HD)" or "1024x1024 (Square)"
        const match = resolutionString.match(/(\d+)x(\d+)/);
        if (match) {
          width = parseInt(match[1], 10);
          height = parseInt(match[2], 10);
          
          // Calculate aspect ratio
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
          const divisor = gcd(width, height);
          aspectRatio = `${width / divisor}:${height / divisor}`;
        }
      }
      
      return { width, height, aspectRatio };
    };
    
    const { width, height, aspectRatio } = parseResolution(resolution);
    
    console.log('📐 Parsed resolution:', { 
      input: resolution, 
      output: { width, height, aspectRatio }
    });

    // Build proper request body for OpenAPI FileService.fileGenerateVideo
    const requestBody = {
      type: "media" as const,
      template_name: null,
      style_name: style || "flux_watercolor",
      config: {
        prompt,
        negative_prompt: negativePrompt || '',
        width,
        height,
        aspect_ratio: aspectRatio,
        seed: seed || Math.floor(Math.random() * 1000000000000),
        generation_config_name: model || 'azure-openai/sora',
        duration: duration || 5,
        frame_rate: frameRate || 30,
        batch_size: 1,
        shot_size: shotSize || "medium_shot",
        style_name: style || "flux_watercolor",
        qualityType: width >= 1920 ? "full_hd" : "hd",
        entity_ids: [],
        references
      }
    };

    console.log('🎬 Final OpenAPI request body:', JSON.stringify(requestBody, null, 2));
    
    // AICODE-NOTE: Use OpenAPI client instead of manual fetch (per AGENTS.md)
    const result = await FileService.fileGenerateVideo({
      requestBody
    });
    
    console.log('✅ Video generation result:', result);
    
    // AICODE-NOTE: OpenAPI client returns standardized response format
    const responseData = {
      success: true,
      fileId: result.id,
      projectId: chatId,
      url: result.url,
      tasks: result.tasks || []
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('💥 Video API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 