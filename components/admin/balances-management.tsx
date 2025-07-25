'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Minus,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BulkBalanceDialog } from './bulk-balance-dialog';
import React from 'react';

interface BalancesManagementProps {
  page: number;
  search: string;
}

interface User {
  id: string;
  email: string;
  balance: number;
  type: 'guest' | 'regular';
}

export function BalancesManagement({ page, search }: BalancesManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(search);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [stats, setStats] = useState({
    totalBalance: 0,
    averageBalance: 0,
    lowBalanceCount: 0
  });

  // Load data
  React.useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (search) {
          params.set('search', search);
        }

        const response = await fetch(`/api/admin/users?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users as User[]);
        setPagination(data.pagination);

        // Calculate stats
        const balances = data.users.map((u: User) => u.balance);
        const totalBalance = balances.reduce((sum: number, balance: number) => sum + balance, 0);
        const averageBalance = balances.length > 0 ? totalBalance / balances.length : 0;
        const lowBalanceCount = balances.filter((balance: number) => balance <= 10).length;

        setStats({
          totalBalance,
          averageBalance: Math.round(averageBalance),
          lowBalanceCount
        });
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [page, search]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.delete('page'); // Reset to first page
    router.push(`/admin/balances?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/admin/balances?${params.toString()}`);
  };

  // Handle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  // Handle individual balance update
  const handleQuickAdjust = async (userId: string, amount: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newBalance = Math.max(0, user.balance + amount);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balance: newBalance }),
      });

      if (!response.ok) {
        throw new Error('Failed to update balance');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading balances...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Total Credits</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalBalance}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Across {users.length} users</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">Average Balance</h3>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.averageBalance}</p>
          <p className="text-sm text-green-600 dark:text-green-400">Per user</p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-orange-600" />
            <h3 className="font-medium">Low Balance</h3>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.lowBalanceCount}</p>
          <p className="text-sm text-orange-600 dark:text-orange-400">Users ≤ 10 credits</p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkDialog(true)}
            disabled={selectedUsers.size === 0}
          >
            Bulk Actions ({selectedUsers.size})
          </Button>
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {users.length} of {pagination.total} users
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNext}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={selectAllUsers}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.type === 'regular' ? 'default' : 'secondary'}
                  >
                    {user.type === 'regular' ? 'Registered' : 'Guest'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      "font-medium",
                      user.balance <= 10 ? "text-red-500" : 
                      user.balance <= 50 ? "text-yellow-500" : "text-green-500"
                    )}>
                      {user.balance}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjust(user.id, -10)}
                      disabled={user.balance === 0}
                    >
                      <Minus className="h-3 w-3" />
                      10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjust(user.id, 50)}
                    >
                      <Plus className="h-3 w-3" />
                      50
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjust(user.id, 100)}
                    >
                      <Plus className="h-3 w-3" />
                      100
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Dialog */}
      {showBulkDialog && (
        <BulkBalanceDialog
          selectedUserIds={Array.from(selectedUsers)}
          users={users}
          onClose={() => setShowBulkDialog(false)}
          onComplete={() => {
            setSelectedUsers(new Set());
            setShowBulkDialog(false);
            // Reload data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
} 