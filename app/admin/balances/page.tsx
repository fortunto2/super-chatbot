import { Suspense } from 'react';
import { BalancesManagement } from '@/components/admin/balances-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ 
    page?: string; 
    search?: string; 
  }>;
}

export default async function BalancesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Credits Management
        </h1>
        <p className="text-muted-foreground">
          Manage user credits, bulk operations, and balance analytics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance Operations</CardTitle>
          <CardDescription>
            View user balances and perform bulk credit operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="p-8 text-center">Loading balances...</div>}>
            <BalancesManagement page={page} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 