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

import { AlertTriangle, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  balance: number;
  type: 'guest' | 'regular';
}

interface DeleteUserDialogProps {
  user: User;
  onClose: () => void;
  onDelete: (userId: string) => void;
}

export function DeleteUserDialog({ user, onClose, onDelete }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      onDelete(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user. Please try again.');
      console.error('Delete user error:', err);
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">User to be deleted:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Type:</strong> {user.type === 'regular' ? 'Registered' : 'Guest'}</p>
              <p><strong>Balance:</strong> {user.balance} credits</p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Warning</p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Deleting this user will also remove:
                </p>
                <ul className="list-disc list-inside mt-2 text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>All generated documents (images, videos, scripts)</li>
                  <li>Chat history and conversations</li>
                  <li>Balance and transaction history</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 