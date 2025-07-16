import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
      content: z.string().optional(),
    }),
    execute: async ({ title, kind, content }) => {
      console.log('📄 ===== CREATE DOCUMENT TOOL CALLED =====');
      console.log('📄 KIND:', kind);
      console.log('📄 TITLE (first 100 chars):', title.substring(0, 100));
      console.log('📄 CONTENT provided:', content ? 'Yes' : 'No');
      console.log('📄 CONTENT length:', content?.length || 0);
      
      const id = generateUUID();
      console.log('📄 GENERATED ID:', id);

      console.log('📄 ✅ WRITING KIND TO DATA STREAM...');
      dataStream.writeData({
        type: 'kind',
        content: kind,
      });

      console.log('📄 ✅ WRITING ID TO DATA STREAM...');
      dataStream.writeData({
        type: 'id',
        content: id,
      });

      console.log('📄 ✅ WRITING TITLE TO DATA STREAM...');
      dataStream.writeData({
        type: 'title',
        content: title,
      });

      console.log('📄 ✅ WRITING CLEAR TO DATA STREAM...');
      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      console.log('📄 🔍 LOOKING FOR DOCUMENT HANDLER FOR KIND:', kind);
      console.log('📄 📋 AVAILABLE HANDLERS:', documentHandlersByArtifactKind.map(h => h.kind));
      
      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      );

      if (!documentHandler) {
        console.error('📄 ❌ NO DOCUMENT HANDLER FOUND FOR KIND:', kind);
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      console.log('📄 ✅ FOUND DOCUMENT HANDLER, CALLING onCreateDocument...');
      
      try {
        await documentHandler.onCreateDocument({
          id,
          title,
          content,
          dataStream,
          session,
        });
        console.log('📄 ✅ DOCUMENT HANDLER COMPLETED SUCCESSFULLY');
      } catch (error) {
        console.error('📄 ❌ DOCUMENT HANDLER ERROR:', error);
        console.error('📄 ❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
        throw error;
      }

      console.log('📄 ✅ WRITING FINISH TO DATA STREAM...');
      dataStream.writeData({ type: 'finish', content: '' });

      const result = {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
      
      console.log('📄 ✅ RETURNING RESULT:', result);
      console.log('📄 ===== CREATE DOCUMENT TOOL COMPLETE =====');
      
      return result;
    },
  });
