'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Home,
  Shield,
  Activity,
  FileText
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: Home,
    description: 'Admin dashboard overview'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and accounts'
  },
  {
    title: 'Balances',
    href: '/admin/balances',
    icon: CreditCard,
    description: 'Manage user credits and balances'
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: Activity,
    description: 'View balance transactions'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Usage statistics and reports'
  },
  {
    title: 'Documents',
    href: '/admin/documents',
    icon: FileText,
    description: 'Manage generated content'
  },
  {
    title: 'System',
    href: '/admin/system',
    icon: Settings,
    description: 'System configuration'
  },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
      
      {/* Admin Badge */}
      <div className="mt-8 p-3 rounded-lg bg-accent border border-border">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Admin Access</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Full system administration
        </p>
      </div>
    </nav>
  );
} 