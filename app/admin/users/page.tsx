import { Suspense } from 'react';
import { UsersTable } from '@/components/admin/users-table';
import { UsersTableSkeleton } from '@/components/admin/users-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ 
    page?: string; 
    search?: string; 
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Users Management
        </h1>
        <p className="text-muted-foreground">
          Manage user accounts, balances, and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all user accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersTable page={page} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 