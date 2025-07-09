'use client';

import { useState, useEffect } from 'react';
import { DocumentCard } from './document-card';
import { GallerySkeleton } from './gallery-skeleton';
import { Button } from '@/components/ui/button';
import type { DocumentFilters } from '../page';
import type { ArtifactKind } from '@/components/artifact';

interface Document {
  id: string;
  title: string;
  kind: ArtifactKind;
  thumbnailUrl?: string;
  createdAt: Date;
  userId: string;
  username?: string;
  model?: string;
  tags: string[];
  viewCount: number;
  visibility: 'public' | 'private';
  metadata: Record<string, any>;
}

interface DocumentGalleryProps {
  filters: DocumentFilters;
  page: number;
  onPageChange: (page: number) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function DocumentGallery({
  filters,
  page,
  onPageChange,
  onLoadingChange,
}: DocumentGalleryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      onLoadingChange(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams({
          list: 'true',
          page: page.toString(),
          limit: '20',
          visibility: filters.visibility,
          sort: filters.sort,
        });

        if (filters.kind) params.append('kind', filters.kind);
        if (filters.model) params.append('model', filters.model);
        if (filters.search) params.append('search', filters.search);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
        if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());

        const response = await fetch(`/api/document?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        setDocuments(data.documents);
        setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
        onLoadingChange(false);
      }
    };

    fetchDocuments();
  }, [filters, page, onLoadingChange]);

  if (isLoading) {
    return <GallerySkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No artifacts found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Document grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <DocumentCard key={`${doc.id}-${doc.createdAt}`} document={doc} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 