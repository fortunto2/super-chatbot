import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          {/* Thumbnail skeleton */}
          <Skeleton className="h-48 w-full" />

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-6 w-16" />
            </div>

            {/* Model */}
            <Skeleton className="h-5 w-24" />

            {/* Tags */}
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 