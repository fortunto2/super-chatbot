import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/api/services/ProjectService';
import { configureSuperduperAI } from '@/lib/config/superduperai';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  console.log('🔍 API: Getting project status for ID:', projectId);
  
  try {
    if (!projectId) {
      console.error('🔍 API: No project ID provided');
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Configure SuperDuperAI client
    console.log('🔍 API: Configuring SuperDuperAI client...');
    
    // Check environment variables
    const envUrl = process.env.NEXT_PUBLIC_SUPERDUPERAI_URL || process.env.SUPERDUPERAI_URL;
    const envToken = process.env.NEXT_PUBLIC_SUPERDUPERAI_TOKEN || process.env.SUPERDUPERAI_API_KEY || process.env.SUPERDUPERAI_TOKEN;
    console.log('🔍 API: Environment variables:', {
      url: envUrl || 'NOT SET',
      hasToken: !!envToken,
      tokenPrefix: envToken ? envToken.substring(0, 8) + '...' : 'NOT SET'
    });
    
    if (!envToken) {
      throw new Error('SuperDuperAI token not found in environment variables');
    }
    
    const config = configureSuperduperAI();
    console.log('🔍 API: Config after setup:', { url: config.url, hasToken: !!config.token });

    // Get project from SuperDuperAI API
    console.log('🔍 API: Calling ProjectService.projectGetById...');
    const project = await ProjectService.projectGetById({ id: projectId });
    console.log('🔍 API: Project retrieved successfully:', {
      id: project.id,
      tasksCount: project.tasks?.length || 0,
      dataCount: project.data?.length || 0
    });
    
    return NextResponse.json(project);
    
  } catch (error) {
    console.error('🔍 API: Failed to get project:', error);
    console.error('🔍 API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      projectId
    });
    
    if (error instanceof Error && (
      error.message.includes('404') || 
      error.message.includes('Not Found')
    )) {
      console.log('🔍 API: Returning 404 - project not found');
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    console.log('🔍 API: Returning 500 - internal server error');
    return NextResponse.json(
      { error: 'Failed to get project status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 