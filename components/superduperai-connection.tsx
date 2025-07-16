'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

interface SuperDuperAIConnectionProps {
  className?: string;
}

// Simple Badge component since it doesn't exist in UI components
const Badge = ({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary'; 
  className?: string;
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variantClasses = {
    default: 'bg-green-500 text-white',
    secondary: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// AICODE-NOTE: Updated component to work with Auth0 user sessions
// AICODE-NOTE: Focuses on personal token connection status instead of admin token usage
export default function SuperDuperAIConnection({ className }: SuperDuperAIConnectionProps) {
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    loading: boolean;
    error?: string;
  }>({
    connected: false,
    loading: true
  });

  // AICODE-NOTE: Fetch user data from Auth0 /auth/me endpoint
  useEffect(() => {
    fetch('/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        setUser(userData);
        setUserLoading(false);
        
        if (userData) {
          const hasToken = userData.superduperai_token && userData.superduperai_connected;
          setConnectionStatus({
            connected: !!hasToken,
            loading: false
          });
        } else {
          setConnectionStatus({
            connected: false,
            loading: false
          });
        }
      })
      .catch(() => {
        setUserLoading(false);
        setConnectionStatus({
          connected: false,
          loading: false
        });
      });
  }, []);

  // AICODE-NOTE: Handle SuperDuperAI account connection via OAuth
  const handleConnect = async () => {
    if (!user) {
      console.log('❌ No Auth0 user session');
      return;
    }

    setIsConnecting(true);
    
    try {
      console.log('🔗 Starting SuperDuperAI OAuth connection for user:', user.sub?.substring(0, 10) + '...');
      
      const response = await fetch('/api/auth/superduperai/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start OAuth flow');
      }

      const { authUrl } = await response.json();
      console.log('📱 Opening SuperDuperAI Auth0 popup...');

      // AICODE-NOTE: Open Auth0 in popup window with clear instructions
      const authWindow = window.open(
        authUrl,
        'superduperai-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        console.log('🚫 Popup blocked, falling back to redirect');
        window.location.href = authUrl;
        return;
      }

      // AICODE-NOTE: Monitor popup window and refresh status when closed
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          console.log('🔄 Popup closed, refreshing connection status...');
          
          // Refresh page to get updated Auth0 session with personal token
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }, 1000);

      // Auto-close after 5 minutes
      setTimeout(() => {
        if (!authWindow.closed) {
          authWindow.close();
          clearInterval(checkClosed);
          setIsConnecting(false);
          console.log('⏰ OAuth popup timed out after 5 minutes');
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('❌ SuperDuperAI connection error:', error);
      setConnectionStatus(prev => ({
        ...prev,
        error: 'Failed to connect SuperDuperAI account'
      }));
      setIsConnecting(false);
    }
  };

  if (userLoading || connectionStatus.loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading connection status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please log in to connect your SuperDuperAI account
            </p>
            <a href="/auth/login" className="inline-flex items-center">
              <Button variant="outline">
                Login <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          SuperDuperAI Account
          {connectionStatus.connected ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {connectionStatus.connected
            ? 'Your personal SuperDuperAI account is connected. You will be charged on your own credits for image and video generation.'
            : 'Connect your personal SuperDuperAI account to use your own credits instead of shared resources.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connectionStatus.connected ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Personal Credits Active
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    All image and video generations will use your SuperDuperAI account balance.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>User ID:</span>
              <span className="font-mono">{user.sub?.substring(0, 8)}...</span>
            </div>
            
            {user.superduperai_user_id && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>SuperDuperAI ID:</span>
                <span className="font-mono">{user.superduperai_user_id.substring(0, 8)}...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Connect Your Account
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Without a personal account, you cannot generate images or videos.
                  </p>
                </div>
              </div>
            </div>

            {connectionStatus.error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">{connectionStatus.error}</p>
              </div>
            )}

            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect SuperDuperAI Account
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              You&apos;ll be redirected to Auth0 to authenticate with your SuperDuperAI account.
              Your personal token will be securely stored in your session.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 