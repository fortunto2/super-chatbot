'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { artifactDefinitions } from '@/components/artifact';
import type { Document } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ArtifactPage({ params }: PageProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromChat = searchParams?.get('from') === 'chat';
  const backHref = fromChat ? '/' : '/gallery';

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const { id } = await params;
        
        // Fetch document from API
        const response = await fetch(`/api/document?id=${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Artifact not found');
          } else if (response.status === 401) {
            setError('Please login to view this artifact');
            router.push('/login');
          } else if (response.status === 403) {
            setError("You don't have permission to view this artifact");
          } else {
            setError('Failed to load artifact');
          }
          return;
        }
        
        const documents = await response.json();
        if (documents && documents.length > 0) {
          setDocument(documents[documents.length - 1]); // Get latest version
        } else {
          setError('No artifact content found');
        }
      } catch (err) {
        console.error('Failed to load artifact:', err);
        setError('Failed to load artifact');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocument();
  }, [params, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading Artifact...</h1>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href={backHref}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Artifact Not Found</h1>
          <p className="text-muted-foreground mb-4">This artifact doesn&apos;t exist.</p>
          <Link href={backHref}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Find the artifact definition
  const artifactDefinition = artifactDefinitions.find(
    (def) => def.kind === document.kind
  );

  if (!artifactDefinition) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Unknown Artifact Type</h1>
          <p className="text-muted-foreground mb-4">
            This artifact type &quot;{document.kind}&quot; is not supported.
          </p>
          <Link href={backHref}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render the artifact content using the existing component
  const ArtifactContent = artifactDefinition.content as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const shareUrl = `${window.location.origin}/artifact/${document.id}`;
            navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied to clipboard');
          }}
        >
          Copy Link
        </Button>
      </div>

      {/* Artifact content */}
      <div className="h-[calc(100vh-60px)]">
        <ArtifactContent
          title={document.title}
          content={document.content || ''}
          mode="edit"
          status="idle"
          currentVersionIndex={0}
          isCurrentVersion={true}
          suggestions={[]}
          onSaveContent={() => {}} // Read-only
          isInline={false}
          getDocumentContentById={() => document.content || ''}
          isLoading={false}
          metadata={document.kind === 'text' ? { suggestions: [] } : {}}
          setMetadata={() => {}}
        />
      </div>
    </div>
  );
} 