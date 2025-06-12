'use client';

import useSWR from 'swr';
import { UIArtifact } from '@/components/artifact';
import { useCallback, useMemo, useRef, useEffect } from 'react';

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
    // Artifact state changed silently
    return result;
  }, [localArtifact]);

  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      setLocalArtifact((currentArtifact) => {
        const artifactToUpdate = currentArtifact || initialArtifactData;

        let newArtifact: UIArtifact;
        if (typeof updaterFn === 'function') {
          newArtifact = updaterFn(artifactToUpdate);
        } else {
          newArtifact = updaterFn;
        }

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

  // Expose artifact globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).artifactInstance = {
        artifact,
        setArtifact,
        metadata: localArtifactMetadata,
        setMetadata: setLocalArtifactMetadata,
      };
    }
  }, [artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata]);

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
