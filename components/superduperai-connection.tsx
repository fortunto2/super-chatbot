'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderIcon, CheckCircleFillIcon, CrossIcon, BoxIcon } from '@/components/icons';

interface SuperDuperAIStatus {
  isConnected: boolean;
  balance: number;
  superduperaiUserId: string | null;
  connectedAt: Date | null;
}

interface SuperDuperAIBalance {
  hasConnection: boolean;
  balance: number;
  vip?: boolean;
  admin?: boolean;
}

// Simple Badge component
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' | 'destructive' }) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variantClasses = {
    default: 'bg-green-500 text-white',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-500 text-white',
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

export function SuperDuperAIConnection() {
  const [status, setStatus] = useState<SuperDuperAIStatus | null>(null);
  const [balance, setBalance] = useState<SuperDuperAIBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/superduperai/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch SuperDuperAI status:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/auth/superduperai/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      } else {
        setBalance({ hasConnection: false, balance: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch SuperDuperAI balance:', error);
      setBalance({ hasConnection: false, balance: 0 });
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchBalance()]);
    setLoading(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/auth/superduperai/login', {
        method: 'POST',
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate SuperDuperAI connection:', error);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/superduperai/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to disconnect SuperDuperAI:', error);
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check for connection status from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      loadData(); // Refresh data if just connected
      // Clear URL params
      router.replace(window.location.pathname);
    }
  }, [router]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoaderIcon size={24} />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.isConnected || false;
  const currentBalance = balance?.balance || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BoxIcon size={20} />
          SuperDuperAI Account
          {isConnected ? (
            <Badge variant="default">
              <CheckCircleFillIcon size={12} />
              <span className="ml-1">Connected</span>
            </Badge>
          ) : (
            <Badge variant="secondary">
              <CrossIcon size={12} />
              <span className="ml-1">Not Connected</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your SuperDuperAI account to use your personal credits for AI generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {currentBalance}
                  <span className="text-sm font-normal text-muted-foreground">credits</span>
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {balance?.vip && <Badge variant="default">VIP</Badge>}
                  {balance?.admin && <Badge variant="destructive">Admin</Badge>}
                  {!balance?.vip && !balance?.admin && (
                    <span className="text-sm text-muted-foreground">Regular</span>
                  )}
                </div>
              </div>
            </div>
            
            {status?.superduperaiUserId && (
              <div className="text-xs text-muted-foreground">
                User ID: {status.superduperaiUserId}
              </div>
            )}
            
            {currentBalance <= 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ You have no credits left. Generation will use the system fallback token.
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefreshBalance}
                disabled={refreshing}
                size="sm"
              >
                {refreshing ? (
                  <>
                    <LoaderIcon size={16} />
                    <span className="ml-2">Refreshing...</span>
                  </>
                ) : (
                  'Refresh Balance'
                )}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisconnect}
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Why connect SuperDuperAI?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use your personal credits instead of shared system credits</li>
                <li>• Track your usage and generation costs</li>
                <li>• Access premium features if you have VIP status</li>
                <li>• Keep your generations tied to your account</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Current:</strong> Using shared system token (limited resources)
              </p>
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <LoaderIcon size={16} />
                  <span className="ml-2">Redirecting to SuperDuperAI...</span>
                </>
              ) : (
                'Connect SuperDuperAI Account'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 