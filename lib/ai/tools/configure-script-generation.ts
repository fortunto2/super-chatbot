import { API_NEXT_ROUTES } from '@/lib/config/next-api-routes';
import { tool } from 'ai';
import { z } from 'zod';
import { saveMessages } from '@/lib/db/queries';

interface CreateScriptDocumentParams {
  createDocument: any;
}

export const configureScriptGeneration = (params?: CreateScriptDocumentParams) => tool({
  description: 'Generate a script (scenario) and create a document artifact. When prompt is provided, this will create a script artifact and show it in chat.',
  parameters: z.object({
    prompt: z.string().describe('Detailed description of the script to generate.'),
  }),
  execute: async ({ prompt }) => {
    if (!params?.createDocument) {
      return { error: 'createDocument not available' };
    }
    // 1. Generate script via API
    const scriptRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${API_NEXT_ROUTES.GENERATE_SCRIPT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await scriptRes.json();
    const script = data?.script || '';
    if (!script) {
      return { error: 'Script generation failed' };
    }
    // 2. Create document artifact
    const result = await params.createDocument.execute({
      title: prompt,
      kind: 'script',
      content: script,
    });

    // 3. Return assistant message with attachment (for image/video/script)
    return {
      id: result.id,
      role: 'assistant',
      parts: [
        {
          content: script,
          contentType: 'text/markdown',
        }
      ],
      experimental_attachments: [
        {
          url: `/api/document?id=${result.id}`,
          name: result.title || 'Scenario.md',
          contentType: 'text/markdown',
          documentId: result.id,
          kind: 'script',
        }
      ],
      createdAt: new Date().toISOString(),
      message: 'Script generated and artifact created.'
    };
  },
}); 