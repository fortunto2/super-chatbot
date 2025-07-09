import { imageDocumentHandler } from '@/artifacts/image/server';
// Utility: extract thumbnail URL from JSON content string
function getThumbnailUrl(content: string): string | null {
  try {
    const data = JSON.parse(content);
    if (!data) return null;
    // Common fields
    if (typeof data.thumbnailUrl === 'string') return data.thumbnailUrl;
    if (typeof data.thumbnail_url === 'string') return data.thumbnail_url;
    // Fallbacks for image/video specific
    if (typeof data.imageUrl === 'string') return data.imageUrl;
    if (typeof data.videoUrl === 'string') return data.videoUrl;
  } catch (_) {
    // ignore parse errors
  }
  return null;
}

import { sheetDocumentHandler } from '@/artifacts/sheet/server';
import { textDocumentHandler } from '@/artifacts/text/server';
import { videoDocumentHandler } from '@/artifacts/video/server';
import type { ArtifactKind } from '@/components/artifact';
import type { DataStreamWriter } from 'ai';
import type { Document } from '../db/schema';
import { saveDocument } from '../db/queries';
import type { Session } from 'next-auth';
import { scriptDocumentHandler } from '@/artifacts/script/server';

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  visibility?: 'public' | 'private';
}

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  content?: string; // Optional content for artifacts that generate their own content
  dataStream: DataStreamWriter;
  session: Session;
}

export interface UpdateDocumentCallbackProps {
  document: Document;
  description: string;
  dataStream: DataStreamWriter;
  session: Session;
}

export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      console.log('📄 createDocumentHandler.onCreateDocument called for kind:', config.kind);
      
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        content: args.content, // Now properly typed
        dataStream: args.dataStream,
        session: args.session,
      });

      console.log('📄 Draft content generated:', draftContent);

      // Send the content to the stream so it reaches the client
      args.dataStream.writeData({
        type: 'text-delta',
        content: draftContent,
      });

      if (args.session?.user?.id) {
        // AICODE-FIX: Extract human-readable title from JSON if needed
        let readableTitle = args.title;
        try {
          // Check if title is JSON for image/video artifacts
          if (config.kind === 'image' || config.kind === 'video') {
            if (args.title.startsWith('{') && args.title.endsWith('}')) {
              const titleParams = JSON.parse(args.title);
              // Use prompt as readable title
              readableTitle = titleParams.prompt || `AI Generated ${config.kind}`;
            } else if (args.title.includes('Video: "')) {
              // Handle video format: 'Video: "prompt" {...}'
              const match = args.title.match(/Video: "([^"]+)"/);
              if (match) {
                readableTitle = match[1];
              }
            }
          }
        } catch (e) {
          // If parse fails, keep original title
          console.log('📄 Could not parse title, using as-is');
        }
        
        // AICODE-NOTE: Truncate title to 255 characters for database storage
        if (readableTitle.length > 255) {
          readableTitle = readableTitle.substring(0, 252) + '...';
          console.log('📄 Title truncated to 255 characters');
        }
        
        await saveDocument({
          id: args.id,
          title: readableTitle,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
          thumbnailUrl: getThumbnailUrl(draftContent),
        });
        
        console.log('📄 Document saved to database with title:', readableTitle);
      }

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      console.log('📄 createDocumentHandler.onUpdateDocument called for kind:', config.kind);
      
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
        session: args.session,
      });

      console.log('📄 Updated content generated:', draftContent);

      // Send the updated content to the stream
      args.dataStream.writeData({
        type: 'text-delta',
        content: draftContent,
      });

      if (args.session?.user?.id) {
        // AICODE-FIX: Use document's existing title for updates
        // Title is already set when document was created, no need to re-parse
        await saveDocument({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
          thumbnailUrl: getThumbnailUrl(draftContent),
        });
        
        console.log('📄 Document updated in database');
      }

      return;
    },
  };
}

/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: Array<DocumentHandler> = [
  textDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
  videoDocumentHandler,
  scriptDocumentHandler,
];

export const artifactKinds = ['text', 'image', 'sheet', 'video', 'script'] as const;
