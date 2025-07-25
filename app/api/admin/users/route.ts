import { auth } from '@/app/(auth)/auth';
import { getAllUsers } from '@/lib/db/admin-queries';
import { NextRequest, NextResponse } from 'next/server';

// Check if user is admin
function isAdmin(email?: string | null): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return email ? adminEmails.includes(email) : false;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';

    // Get users
    const data = await getAllUsers(page, 20, search);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 