import { auth } from '@/app/(auth)/auth';
import type { ArtifactKind } from '@/components/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
  getDocuments,
  getPublicDocuments,
  incrementDocumentViewCount,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const listMode = searchParams.get('list') === 'true';

  const session = await auth();

  // AICODE-NOTE: Handle gallery list mode
  if (listMode) {
    // Parse query parameters
    const kind = searchParams.get('kind') as ArtifactKind | undefined;
    const model = searchParams.get('model') || undefined;
    const visibility = searchParams.get('visibility') as 'mine' | 'public' | 'all' || 'all';
    const search = searchParams.get('search') || undefined;
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
    const sortBy = searchParams.get('sort') as 'newest' | 'oldest' | 'popular' || 'newest';
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);

    // For public-only documents, no auth required
    if (visibility === 'public') {
      const result = await getPublicDocuments({
        kind,
        model,
        search,
        dateFrom,
        dateTo,
        sortBy,
        page,
        limit,
      });
      return Response.json(result, { status: 200 });
    }

    // For user's documents or mixed, auth required
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const result = await getDocuments({
      userId: session.user.id,
      kind,
      model,
      visibility,
      search,
      dateFrom,
      dateTo,
      sortBy,
      page,
      limit,
    });

    return Response.json(result, { status: 200 });
  }

  // Original single document mode
  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new Response('Not found', { status: 404 });
  }

  // Check if document is public or owned by user
  if (document.visibility === 'public') {
    // Increment view count for public documents
    await incrementDocumentViewCount({ id });
    return Response.json(documents, { status: 200 });
  } else {
    // For private documents, require authentication
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    if (document.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }
    
    return Response.json(documents, { status: 200 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  const documents = await getDocumentsById({ id });

  if (documents.length > 0) {
    const [document] = documents;

    if (document.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const document = await saveDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return Response.json(document, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  if (!timestamp) {
    return new Response('Missing timestamp', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return Response.json(documentsDeleted, { status: 200 });
}
