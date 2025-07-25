'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Minus, Equal, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  balance: number;
  type: 'guest' | 'regular';
}

interface BulkBalanceDialogProps {
  selectedUserIds: string[];
  users: User[];
  onClose: () => void;
  onComplete: () => void;
}

type OperationType = 'add' | 'subtract' | 'set';

export function BulkBalanceDialog({ selectedUserIds, users, onClose, onComplete }: BulkBalanceDialogProps) {
  const [operation, setOperation] = useState<OperationType>('add');
  const [amount, setAmount] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
  const totalCurrentBalance = selectedUsers.reduce((sum, user) => sum + user.balance, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return;
    }

    try {
      setLoading(true);
      
      // Process each user
      const updatePromises = selectedUserIds.map(async (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        let newBalance: number;
        switch (operation) {
          case 'add':
            newBalance = user.balance + numAmount;
            break;
          case 'subtract':
            newBalance = Math.max(0, user.balance - numAmount);
            break;
          case 'set':
            newBalance = numAmount;
            break;
          default:
            return;
        }

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ balance: newBalance }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update balance for user ${user.email}`);
        }
      });

      await Promise.all(updatePromises);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balances. Please try again.');
      console.error('Bulk update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOperationPreview = () => {
    const numAmount = Number(amount) || 0;
    switch (operation) {
      case 'add':
        return `+${numAmount} credits to each user`;
      case 'subtract':
        return `-${numAmount} credits from each user (minimum 0)`;
      case 'set':
        return `Set each user to ${numAmount} credits`;
      default:
        return '';
    }
  };

  const getNewTotalEstimate = () => {
    const numAmount = Number(amount) || 0;
    switch (operation) {
      case 'add':
        return totalCurrentBalance + (numAmount * selectedUsers.length);
      case 'subtract':
        return Math.max(0, totalCurrentBalance - (numAmount * selectedUsers.length));
      case 'set':
        return numAmount * selectedUsers.length;
      default:
        return totalCurrentBalance;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Balance Operations
          </DialogTitle>
          <DialogDescription>
            Apply balance changes to {selectedUsers.length} selected users
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Users Preview */}
          <div className="space-y-2">
            <Label>Selected Users ({selectedUsers.length})</Label>
            <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {selectedUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <span>{user.email}</span>
                    <Badge variant={user.type === 'regular' ? 'default' : 'secondary'} className="text-xs">
                      {user.balance} credits
                    </Badge>
                  </div>
                ))}
                {selectedUsers.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    And {selectedUsers.length - 5} more users...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Operation Type */}
          <div className="space-y-3">
            <Label>Operation Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOperation('add')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                  operation === 'add' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Plus className="h-4 w-4" />
                Add Credits
              </button>
              <button
                type="button"
                onClick={() => setOperation('subtract')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                  operation === 'subtract' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Minus className="h-4 w-4" />
                Subtract
              </button>
              <button
                type="button"
                onClick={() => setOperation('set')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                  operation === 'set' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Equal className="h-4 w-4" />
                Set To
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={loading}
              />
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">Preview</h4>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Operation:</strong> {getOperationPreview()}</p>
              <p><strong>Current total:</strong> {totalCurrentBalance} credits</p>
              <p><strong>Estimated new total:</strong> {getNewTotalEstimate()} credits</p>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : `Update ${selectedUsers.length} Users`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 