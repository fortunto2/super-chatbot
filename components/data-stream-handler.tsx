'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useMemo, memo } from 'react';
import { artifactDefinitions, ArtifactKind } from './artifact';
import { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { generateUUID } from '@/lib/utils';

export type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind';
  content: string | Suggestion;
};

function PureDataStreamHandler({ id, dataStream }: { id: string; dataStream?: any[] }) {
  // Throttle logging to avoid spam
  const lastLogTime = useRef<number>(0);
  const logWithThrottle = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const now = Date.now();
      if (now - lastLogTime.current > 500) { // Log at most every 500ms
        console.log(message, data);
        lastLogTime.current = now;
      }
    }
  };

  logWithThrottle('📡 DataStreamHandler initialized for id:', id);
  logWithThrottle('📡 External dataStream provided:', { hasStream: !!dataStream, length: dataStream?.length || 0 });
  
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);
  const isProcessing = useRef(false);

  // Memoize dataStream length to prevent unnecessary effect reruns
  const dataStreamLength = dataStream?.length || 0;
  const stableArtifactKind = useRef(artifact.kind);
  
  // Update stable artifact kind only when it actually changes
  if (stableArtifactKind.current !== artifact.kind) {
    stableArtifactKind.current = artifact.kind;
  }

  useEffect(() => {
    // Prevent concurrent processing
    if (isProcessing.current) return;
    
    logWithThrottle('📡 DataStream changed:', {
      hasDataStream: !!dataStream,
      dataStreamLength,
      lastProcessedIndex: lastProcessedIndex.current
    });
    
    if (!dataStream?.length || lastProcessedIndex.current >= dataStream.length - 1) return;

    isProcessing.current = true;

    try {
      const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
      logWithThrottle('📡 Processing new deltas:', newDeltas.length);
      
      if (newDeltas.length === 0) {
        isProcessing.current = false;
        return;
      }

      lastProcessedIndex.current = dataStream.length - 1;

      // Find artifact definition once
      const artifactDefinition = artifactDefinitions.find(
        (def) => def.kind === stableArtifactKind.current,
      );

      logWithThrottle('📡 Found artifact definition:', { found: !!artifactDefinition, kind: stableArtifactKind.current });

      (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
        logWithThrottle('📡 Processing delta:', { 
          type: delta.type, 
          content: typeof delta.content === 'string' ? delta.content.substring(0, 100) + '...' : delta.content 
        });

        if (artifactDefinition?.onStreamPart) {
          logWithThrottle('📡 Calling onStreamPart for artifact definition');
          artifactDefinition.onStreamPart({
            streamPart: delta,
            setArtifact,
            setMetadata,
          });
        }

        setArtifact((draftArtifact) => {
          logWithThrottle('📡 Setting artifact with delta type:', delta.type);
          if (!draftArtifact) {
            return { ...initialArtifactData, status: 'streaming' };
          }

          switch (delta.type) {
            case 'id':
              logWithThrottle('📡 Setting artifact id:', delta.content);
              return {
                ...draftArtifact,
                documentId: delta.content as string,
                status: 'streaming',
              };

            case 'title':
              logWithThrottle('📡 Setting artifact title:', delta.content);
              return {
                ...draftArtifact,
                title: delta.content as string,
                status: 'streaming',
              };

            case 'kind':
              logWithThrottle('📡 Setting artifact kind:', delta.content);
              return {
                ...draftArtifact,
                kind: delta.content as ArtifactKind,
                status: 'streaming',
              };

            case 'clear':
              logWithThrottle('📡 Clearing artifact content');
              return {
                ...draftArtifact,
                content: '',
                status: 'streaming',
              };

            case 'finish':
              logWithThrottle('📡 Finishing artifact');
              return {
                ...draftArtifact,
                status: 'idle',
              };

            default:
              logWithThrottle('📡 Unknown delta type:', delta.type);
              return draftArtifact;
          }
        });
      });
    } finally {
      isProcessing.current = false;
    }
  }, [dataStreamLength, setArtifact, setMetadata, id]); // Removed artifact from deps to prevent loops

  return null;
}

// Memoize DataStreamHandler to prevent unnecessary rerenders
export const DataStreamHandler = memo(PureDataStreamHandler, (prevProps, nextProps) => {
  // Only re-render if critical props actually change
  if (prevProps.id !== nextProps.id) return false;
  
  const prevLength = prevProps.dataStream?.length || 0;
  const nextLength = nextProps.dataStream?.length || 0;
  if (prevLength !== nextLength) return false;
  
  return true;
});
