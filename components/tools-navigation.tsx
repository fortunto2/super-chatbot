'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TOOLS_CONFIG, } from '@/lib/config/tools-config';
import { ToolIcon } from '@/lib/config/tools-icons';

export function ToolsNavigation() {
  const pathname = usePathname();
  
  const currentTool = TOOLS_CONFIG.find(tool => pathname.includes(tool.href));
  
  return (
    <div className="mb-6">
      {/* Back to main chat button */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Chat
          </Button>
        </Link>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="size-4" />
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span className="font-medium">
            {currentTool ? currentTool.name : 'All Tools'}
          </span>
        </div>
      </div>
      
      {/* Tools navigation tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/tools">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Home className="size-4" />
            All Tools
          </Button>
        </Link>
        
        <span className="text-muted-foreground">|</span>
        
        {TOOLS_CONFIG.map((tool) => {
          const isActive = pathname === tool.href
          return (
            <Link key={tool.id} href={tool.href}>
              <Button 
                variant={isActive ? "default" : "outline"} 
                size="sm" 
                className="gap-2"
              >
                <ToolIcon name={tool.iconName} />
                {tool.shortDescription || tool.name}
              </Button>
            </Link>
          );
        })}
      </div>
      
      <Separator />
    </div>
  );
} 