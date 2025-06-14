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

  // DataStreamHandler initialized silently
  
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
    
    if (!dataStream?.length || lastProcessedIndex.current >= dataStream.length - 1) return;

    isProcessing.current = true;

    try {
      const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
      
      if (newDeltas.length === 0) {
        isProcessing.current = false;
        return;
      }

      lastProcessedIndex.current = dataStream.length - 1;

      // Find artifact definition once
      const artifactDefinition = artifactDefinitions.find(
        (def) => def.kind === stableArtifactKind.current,
      );

      (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
        if (artifactDefinition?.onStreamPart) {
          artifactDefinition.onStreamPart({
            streamPart: delta,
            setArtifact,
            setMetadata,
          });
        }

        setArtifact((draftArtifact) => {
          if (!draftArtifact) {
            return { ...initialArtifactData, status: 'streaming' };
          }

          switch (delta.type) {
            case 'id':
              return {
                ...draftArtifact,
                documentId: delta.content as string,
                status: 'streaming',
              };

            case 'title':
              return {
                ...draftArtifact,
                title: delta.content as string,
                status: 'streaming',
              };

            case 'kind':
              return {
                ...draftArtifact,
                kind: delta.content as ArtifactKind,
                status: 'streaming',
              };

            case 'clear':
              return {
                ...draftArtifact,
                content: '',
                status: 'streaming',
              };

            case 'finish':
              return {
                ...draftArtifact,
                status: 'idle',
              };

            default:
              return draftArtifact;
          }
        });
      });
    } finally {
      isProcessing.current = false;
    }
  }, [dataStream, setArtifact, setMetadata, id]); // Removed artifact from deps to prevent loops

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
