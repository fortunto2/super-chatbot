import { type NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/api/services/ProjectService';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to fix Next.js 15 compliance
    const resolvedParams = await params;
    
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log('🔍 API: Getting project by ID:', id);

    // Get project from SuperDuperAI API
    const project = await ProjectService.projectGetById({ id });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('🔍 ✅ API: Project found:', {
      id: project.id,
      dataCount: project.data?.length || 0,
      tasksCount: project.tasks?.length || 0
    });

    return NextResponse.json(project);
    
  } catch (error: any) {
    console.error('🔍 ❌ API: Failed to get project:', error);
    
    // Handle different error types
    if (error.status === 404) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (error.status === 403) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to get project' },
      { status: error.status || 500 }
    );
  }
} 