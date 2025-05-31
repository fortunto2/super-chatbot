"use client";

import { useEffect } from "react";
import { imageWebsocketStore, type ImageEventHandler } from "@/lib/websocket/image-websocket-store";

type Props = {
  projectId: string;
  eventHandlers: ImageEventHandler[];
};

export const useImageWebsocket = ({ projectId, eventHandlers }: Props) => {
  useEffect(() => {
    if (!projectId) return;

    // Use environment variable or fallback to default
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://editor.superduperai.co';
    const url = `${baseUrl.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
    
    console.log('Initializing image websocket connection:', url);
    imageWebsocketStore.initConnection(url, eventHandlers);

    return () => {
      imageWebsocketStore.removeHandlers(eventHandlers);
    };
  }, [projectId, eventHandlers]);

  return {
    isConnected: imageWebsocketStore.isConnected(),
    disconnect: () => imageWebsocketStore.disconnect(),
  };
}; 