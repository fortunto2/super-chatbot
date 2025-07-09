'use client';

import { useState, useEffect } from 'react';
import { DocumentGallery } from './components/document-gallery';
import { GalleryFilters } from './components/gallery-filters';
import { GallerySearch } from './components/gallery-search';
import { GallerySkeleton } from './components/gallery-skeleton';
import { Button } from '@/components/ui/button';
import type { ArtifactKind } from '@/components/artifact';
import { useSession } from 'next-auth/react';

export interface DocumentFilters {
  visibility: 'mine' | 'public' | 'all';
  kind?: ArtifactKind;
  model?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sort: 'newest' | 'oldest' | 'popular';
}

export default function GalleryPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<DocumentFilters>({
    visibility: 'all',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // AICODE-NOTE: Gallery displays as "Artifacts" in UI but uses Document API
  return (
    <div className="flex h-full">
      {/* Sidebar with filters */}
      <div className="w-64 border-r bg-background p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <GalleryFilters 
          filters={filters}
          onFiltersChange={(newFilters: DocumentFilters) => {
            setFilters(newFilters);
            setPage(1); // Reset to first page on filter change
          }}
          isAuthenticated={!!session?.user}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header with search */}
        <div className="border-b p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Artifact Gallery</h1>
            <GallerySearch 
              value={filters.search || ''}
              onChange={(search: string) => {
                setFilters({ ...filters, search: search || undefined });
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto">
            <DocumentGallery
              filters={filters}
              page={page}
              onPageChange={setPage}
              onLoadingChange={setIsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 