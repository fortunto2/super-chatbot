import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * GalleryLayout wraps all pages under /gallery.
 * Adds a persistent "Back to Chat" link in the top-left corner so users can
 * quickly navigate back to the main chat (/chat) from any gallery screen.
 *
 * The link uses the design-system <Button> component
 * and Tailwind utility classes for consistent styling.
 */
export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100vh-60px)] p-4">
      {/* Navigation – Back to Chat */}
      <div className="mb-4">
        <Link href="/" className="inline-block">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Chat
          </Button>
        </Link>
      </div>

      {/* Actual gallery content */}
      {children}
    </div>
  );
}
