'use client';

export const dynamic = "force-dynamic";



import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { artifactDefinitions } from '@/components/artifact';
import type { Document } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ArtifactPage() {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromChat = searchParams?.get('from') === 'chat';
  const backHref = fromChat ? '/' : '/gallery';

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const id = params.id as string;
        
        if (!id) {
          setError('Invalid artifact ID');
          return;
        }
        
        console.log('Loading artifact with ID:', id);
        
        // Fetch document from API
        const response = await fetch(`/api/document?id=${id}`);
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          
          if (response.status === 404) {
            setError('Artifact not found');
          } else if (response.status === 401) {
            setError('Please login to view this artifact');
            router.push('/login');
          } else if (response.status === 403) {
            setError("You don't have permission to view this artifact");
          } else {
            setError(`Failed to load artifact: ${response.status} ${errorText}`);
          }
          return;
        }
        
        const documents = await response.json();
        console.log('Documents received:', documents?.length || 0);
        
        if (documents && documents.length > 0) {
          const document = documents[documents.length - 1];
          console.log('Document kind:', document.kind);
          console.log('Document title:', document.title?.substring(0, 100));
          console.log('Document content length:', document.content?.length || 0);
          console.log('Document content preview:', document.content?.substring(0, 200));
          
          setDocument(document); // Get latest version
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

  console.log('Rendering artifact:', {
    kind: document.kind,
    titleLength: document.title?.length || 0,
    contentLength: document.content?.length || 0,
    hasArtifactDefinition: !!artifactDefinition
  });

  const StandaloneArtifact = ({ title, content }: { title: string; content: string }) => {
    return <ArtifactContent title={title} content={content} />;
  }

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
        <StandaloneArtifact
          title={document.title}
          content={document.content || ''}
        />
      </div>
    </div>
  );
} 