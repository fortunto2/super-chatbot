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

import { CreditCard, Plus, Minus } from 'lucide-react';

interface User {
  id: string;
  email: string;
  balance: number;
  type: 'guest' | 'regular';
}

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

export function EditUserDialog({ user, onClose, onUpdate }: EditUserDialogProps) {
  const [balance, setBalance] = useState(user.balance.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const newBalance = Number(balance);
    if (isNaN(newBalance) || newBalance < 0) {
      setError('Please enter a valid balance (0 or greater)');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balance: newBalance }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update balance');
      }

      const updatedUser = await response.json();
      onUpdate(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance. Please try again.');
      console.error('Update balance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const adjustBalance = (amount: number) => {
    const currentBalance = Number(balance) || 0;
    const newBalance = Math.max(0, currentBalance + amount);
    setBalance(newBalance.toString());
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Edit User Balance
          </DialogTitle>
          <DialogDescription>
            Update the credit balance for <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustBalance(-10)}
                disabled={loading}
              >
                <Minus className="h-4 w-4" />
                10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustBalance(-50)}
                disabled={loading}
              >
                <Minus className="h-4 w-4" />
                50
              </Button>
              <Input
                id="balance"
                type="number"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="text-center"
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustBalance(50)}
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustBalance(100)}
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                100
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Previous balance: {user.balance} credits
            </p>
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
              {loading ? 'Updating...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 