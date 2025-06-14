
import { imageDocumentHandler } from '@/artifacts/image/server';
import { sheetDocumentHandler } from '@/artifacts/sheet/server';
import { textDocumentHandler } from '@/artifacts/text/server';
import { videoDocumentHandler } from '@/artifacts/video/server';
import type { ArtifactKind } from '@/components/artifact';
import type { DataStreamWriter } from 'ai';
import type { Document } from '../db/schema';
import { saveDocument } from '../db/queries';
import type { Session } from 'next-auth';

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
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
        await saveDocument({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
        });
        
        console.log('📄 Document saved to database');
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
        await saveDocument({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
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
];

export const artifactKinds = ['text', 'image', 'sheet', 'video'] as const;
