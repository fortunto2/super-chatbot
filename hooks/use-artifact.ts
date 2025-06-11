'use client';

import useSWR from 'swr';
import { UIArtifact } from '@/components/artifact';
import { useCallback, useMemo, useRef } from 'react';

export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

type Selector<T> = (state: UIArtifact) => T;

export function useArtifactSelector<Selected>(selector: Selector<Selected>) {
  const { data: localArtifact } = useSWR<UIArtifact>('artifact', null, {
    fallbackData: initialArtifactData,
  });

  const selectedValue = useMemo(() => {
    if (!localArtifact) return selector(initialArtifactData);
    return selector(localArtifact);
  }, [localArtifact, selector]);

  return selectedValue;
}

export function useArtifact() {
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    'artifact',
    null,
    {
      fallbackData: initialArtifactData,
    },
  );

  // Throttle logging to prevent spam
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

  const artifact = useMemo(() => {
    const result = localArtifact || initialArtifactData;
    logWithThrottle('🎨 useArtifact: artifact state changed:', {
      documentId: result.documentId,
      kind: result.kind,
      isVisible: result.isVisible,
      status: result.status,
      hasContent: !!result.content,
      contentLength: result.content?.length || 0
    });
    return result;
  }, [localArtifact]);

  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      logWithThrottle('🎨 useArtifact: setArtifact called with updater:', typeof updaterFn);
      setLocalArtifact((currentArtifact) => {
        const artifactToUpdate = currentArtifact || initialArtifactData;
        logWithThrottle('🎨 useArtifact: current artifact before update:', {
          documentId: artifactToUpdate.documentId,
          kind: artifactToUpdate.kind,
          isVisible: artifactToUpdate.isVisible,
          status: artifactToUpdate.status
        });

        let newArtifact: UIArtifact;
        if (typeof updaterFn === 'function') {
          newArtifact = updaterFn(artifactToUpdate);
        } else {
          newArtifact = updaterFn;
        }
        
        logWithThrottle('🎨 useArtifact: artifact after update:', {
          documentId: newArtifact.documentId,
          kind: newArtifact.kind,
          isVisible: newArtifact.isVisible,
          status: newArtifact.status,
          hasContent: !!newArtifact.content,
          contentLength: newArtifact.content?.length || 0
        });

        return newArtifact;
      });
    },
    [setLocalArtifact],
  );

  const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
    useSWR<any>(
      () =>
        artifact.documentId ? `artifact-metadata-${artifact.documentId}` : null,
      null,
      {
        fallbackData: null,
      },
    );

  return useMemo(
    () => ({
      artifact,
      setArtifact,
      metadata: localArtifactMetadata,
      setMetadata: setLocalArtifactMetadata,
    }),
    [artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata],
  );
}
