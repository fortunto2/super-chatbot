'use client';

import { useCallback, useEffect, useRef } from 'react';
import { videoSSEStore, type VideoEventHandler as VideoSSEEventHandler } from '@/lib/websocket/video-sse-store';
import type { UseChatHelpers } from '@ai-sdk/react';

interface ChatVideoSSEOptions {
  chatId: string;
  messages: any[];
  setMessages: UseChatHelpers['setMessages'];
  enabled?: boolean;
}

// Add function to save message to database
const saveMessageToDatabase = async (chatId: string, message: any) => {
  try {
    const messageToSave = {
      id: message.id,
      role: message.role,
      parts: message.parts,
      attachments: message.experimental_attachments || [],
      createdAt: message.createdAt,
    };
    
    const response = await fetch('/api/save-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        message: messageToSave,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to save video message:', errorData);
      throw new Error(`Failed to save message: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to save video message:', error);
  }
};

export const useChatVideoSSE = ({ 
  chatId, 
  messages, 
  setMessages, 
  enabled = true 
}: ChatVideoSSEOptions) => {
  const mountedRef = useRef(true);
  const connectedProjectsRef = useRef<Set<string>>(new Set());
  const handlersMapRef = useRef<Map<string, VideoSSEEventHandler>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create stable event handler that doesn't cause re-renders
  const createEventHandler = useCallback((targetProjectId: string): VideoSSEEventHandler => {
    return (eventData: VideoSSEMessage) => {
      if (!mountedRef.current) return;

      // Filter events only for our target project
      if (eventData.projectId && eventData.projectId !== targetProjectId) {
        return;
      }

              // Only handle completed videos that have URL
        if (eventData.type === 'file' && eventData.object?.url) {
          const videoUrl = eventData.object.url;
          const thumbnailUrl = (eventData.object as any)?.thumbnail_url;
          const requestId = eventData.requestId;

          // Check if it's a video file
          if (videoUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i) || 
              eventData.object.contentType?.startsWith('video/')) {

            console.log('🎬 Chat SSE: Received video completion for project:', targetProjectId, 'URL:', videoUrl);
            if (thumbnailUrl) {
              console.log('🎬 Chat SSE: Video thumbnail available:', thumbnailUrl);
            }

                      // Store the last video URL for debugging and try direct artifact update
            if (typeof window !== 'undefined') {
              const chatSSEInstance = (window as any).chatSSEInstance;
              if (chatSSEInstance) {
                chatSSEInstance.lastVideoUrl = videoUrl;
                chatSSEInstance.lastThumbnailUrl = thumbnailUrl;
                console.log('🎬 💾 Stored last video URL for debugging:', videoUrl);
                if (thumbnailUrl) {
                  console.log('🎬 💾 Stored last thumbnail URL for debugging:', thumbnailUrl);
                }
              }

            // Try direct artifact update immediately
            const artifactInstance = (window as any).artifactInstance;
            if (artifactInstance?.artifact && artifactInstance.artifact.kind === 'video') {
              try {
                const currentContent = JSON.parse(artifactInstance.artifact.content || '{}');
                
                // Check if this update is for current artifact
                if (currentContent.projectId === targetProjectId || 
                    currentContent.status === 'pending' || 
                    currentContent.status === 'streaming') {
                  
                  const updatedContent = {
                    ...currentContent,
                    status: 'completed',
                    videoUrl: videoUrl,
                    projectId: targetProjectId,
                    requestId: requestId || currentContent.requestId,
                    timestamp: Date.now(),
                    message: 'Video generation completed!'
                  };

                  console.log('🎬 Chat SSE: Updating artifact with video URL');
                  artifactInstance.setArtifact((current: any) => ({
                    ...current,
                    content: JSON.stringify(updatedContent),
                    status: 'idle' as const
                  }));
                }
              } catch (error) {
                console.error('❌ Failed to update video artifact:', error);
              }
            }
          }
          
          // Ensure we're connected to this project if not already
          if (!connectedProjectsRef.current.has(targetProjectId)) {
            connectToProject(targetProjectId);
          }

          // Update messages with completed video
          setTimeout(() => {
            setMessages(prevMessages => {
              const updatedMessages = [...prevMessages];
              let foundArtifact = false;
              
              // Look for the most recent assistant message with pending/streaming video artifact
              for (let i = updatedMessages.length - 1; i >= 0; i--) {
                const message = updatedMessages[i];
                
                if (message.role === 'assistant') {
                  // Check if this message has video artifact content
                  const hasVideoArtifact = message.parts?.some(part => 
                    part.type === 'text' && 
                    'text' in part && 
                    part.text && (
                      part.text.includes('"kind":"video"') ||
                      part.text.includes("'kind':'video'") ||
                      part.text.includes('VideoArtifact')
                    )
                  );

                  if (hasVideoArtifact) {
                    // Try to find and parse video artifact content
                    for (const part of message.parts || []) {
                      if (part.type === 'text' && 'text' in part && part.text) {
                        try {
                          let artifactContent = null;
                          
                          // Try different parsing methods
                          if (part.text.includes('```json')) {
                            const jsonMatch = part.text.match(/```json\\s*({[\\s\\S]*?})\\s*```/);
                            if (jsonMatch) {
                              artifactContent = JSON.parse(jsonMatch[1]);
                            }
                          } else if (part.text.startsWith('{') && part.text.endsWith('}')) {
                            artifactContent = JSON.parse(part.text);
                          }
                          
                          if (artifactContent?.projectId === targetProjectId || 
                              (artifactContent?.status === 'pending' || artifactContent?.status === 'streaming')) {
                            
                            // Update the artifact content
                            const updatedContent = {
                              ...artifactContent,
                              status: 'completed',
                              videoUrl: videoUrl,
                              projectId: targetProjectId,
                              requestId: requestId || artifactContent.requestId,
                              timestamp: Date.now(),
                              message: 'Video generation completed!'
                            };
                            
                            // Update the part text
                            const newText = part.text.includes('```json') 
                              ? part.text.replace(/```json\\s*{[\\s\\S]*?}\\s*```/, `\`\`\`json\n${JSON.stringify(updatedContent, null, 2)}\n\`\`\``)
                              : JSON.stringify(updatedContent);
                            
                            (part as any).text = newText;
                            foundArtifact = true;
                            
                            console.log('🎬 Chat SSE: Updated message artifact with video URL');
                            break;
                          }
                        } catch (error) {
                          // Silent fail for parsing
                        }
                      }
                    }
                    
                    if (foundArtifact) break;
                  }
                }
              }
              
              if (foundArtifact) {
                // Save updated message to database
                const messageToSave = updatedMessages[updatedMessages.length - 1];
                if (messageToSave) {
                  saveMessageToDatabase(chatId, messageToSave);
                }
              }

              // Auto-save video to chat as separate attachment message
              if (!foundArtifact) {
                console.log('🎬 Chat SSE: No artifact found, creating new video message in chat');
                
                // Extract prompt from SSE message using the actual structure
                const prompt = (eventData.object as any)?.video_generation?.prompt || 
                             (eventData.object as any)?.prompt || 
                             (eventData as any)?.video_generation?.prompt || 
                             'Generated video';

                // Create video attachment message
                const videoAttachment = {
                  name: prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt,
                  url: videoUrl,
                  contentType: 'video/mp4',
                  thumbnailUrl: thumbnailUrl,
                };

                const newVideoMessage = {
                  id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  role: 'assistant' as const,
                  content: `Generated video: "${prompt}"`,
                  parts: [
                    {
                      type: 'text' as const,
                      text: `Generated video: "${prompt}"`
                    }
                  ],
                  experimental_attachments: [videoAttachment],
                  createdAt: new Date(),
                };

                updatedMessages.push(newVideoMessage);
                console.log('🎬 Chat SSE: Added new video message to chat history');

                // Save to database
                setTimeout(() => {
                  saveMessageToDatabase(chatId, newVideoMessage);
                }, 100);
              }
              
              return updatedMessages;
            });
          }, 100);
        }
      }
    };
  }, [setMessages, chatId]);

  const connectToProject = useCallback((projectId: string) => {
    if (!projectId || connectedProjectsRef.current.has(projectId)) {
      return;
    }

    console.log('🔌 Chat Video SSE: Connecting to:', projectId);
    
    const eventHandler = createEventHandler(projectId);
    handlersMapRef.current.set(projectId, eventHandler);
    
    // Add handlers to SSE store
    videoSSEStore.addProjectHandlers(projectId, [eventHandler]);
    
    // Initialize SSE connection
    let sseUrl: string;
    
    // AICODE-NOTE: Support both file.{fileId} and project.{projectId} formats
    // Always use Next.js proxy for SSE connections
    if (projectId.startsWith('file.')) {
      // Direct file-based SSE (like video generator tool) using Next.js proxy
      sseUrl = `/api/events/${projectId}`;
    } else {
      // Project-based SSE using Next.js proxy
      sseUrl = `/api/events/project.${projectId}`;
    }
    
    console.log('🔌 Video SSE URL:', sseUrl);
    videoSSEStore.initConnection(sseUrl, [eventHandler]);
    
    connectedProjectsRef.current.add(projectId);
  }, [createEventHandler, chatId]);

  // Cleanup project connection
  const disconnectFromProject = useCallback((projectId: string) => {
    if (!projectId || !connectedProjectsRef.current.has(projectId)) {
      return;
    }
    
    console.log('🔌 Chat Video SSE: Disconnecting from project:', projectId);

    const handler = handlersMapRef.current.get(projectId);
    if (handler) {
      videoSSEStore.removeProjectHandlers(projectId, [handler]);
      handlersMapRef.current.delete(projectId);
    }
    
    connectedProjectsRef.current.delete(projectId);
  }, []);

  // Extract project IDs from messages
  const extractProjectIdsFromMessages = useCallback((messages: any[]): string[] => {
    const ids = new Set<string>();
    
    for (const message of messages) {
      if (message.role === 'assistant' && message.parts) {
        for (const part of message.parts) {
          if (part.type === 'text' && 'text' in part && part.text) {
            try {
              // Check for video artifacts
              if (part.text.includes('"kind":"video"') || 
                  part.text.includes("'kind':'video'") ||
                  part.text.includes('VideoArtifact')) {
                
                let artifactContent = null;
                
                // Try different parsing methods
                if (part.text.includes('```json')) {
                  const jsonMatch = part.text.match(/```json\s*({[\s\S]*?})\s*```/);
                  if (jsonMatch) {
                    artifactContent = JSON.parse(jsonMatch[1]);
                  }
                } else if (part.text.startsWith('{') && part.text.endsWith('}')) {
                  artifactContent = JSON.parse(part.text);
                }
                
                if (artifactContent?.projectId) {
                  ids.add(artifactContent.projectId);
                }
                // AICODE-NOTE: Also connect to fileId for file-based SSE (like video generator tool)
                if (artifactContent?.fileId) {
                  ids.add(`file.${artifactContent.fileId}`);
                }
              }
            } catch (error) {
              // Silent fail for parsing
            }
          }
        }
      }
    }
    
    return Array.from(ids);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const currentProjectIds = new Set(extractProjectIdsFromMessages(messages));
    const previousProjectIds = connectedProjectsRef.current;

    // Connect to new projects
    for (const projectId of currentProjectIds) {
      if (!previousProjectIds.has(projectId)) {
        connectToProject(projectId);
      }
    }

    // Disconnect from old projects
    for (const projectId of previousProjectIds) {
      if (!currentProjectIds.has(projectId)) {
        disconnectFromProject(projectId);
      }
    }
    
    // Store instance for debugging
    if (typeof window !== 'undefined') {
      (window as any).chatVideoSSEInstance = {
        connectedProjects: connectedProjectsRef.current,
        lastVideoUrl: null,
        chatId: chatId,
        manualConnect: connectToProject
      };
    }
  }, [messages, enabled, connectToProject, disconnectFromProject, extractProjectIdsFromMessages, chatId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      // Cleanup all connections
      connectedProjectsRef.current.forEach(projectId => {
        disconnectFromProject(projectId);
      });
      
      // Force cleanup if needed
      const debugInfo = videoSSEStore.getDebugInfo();
      if (debugInfo.totalHandlers > 5) {
        console.log('🧹 Chat Video SSE: Force cleanup due to handler accumulation');
        videoSSEStore.forceCleanup();
      }
    };
  }, [disconnectFromProject]);

  return {
    connectedProjects: connectedProjectsRef.current,
  };
};

export type VideoEventHandler = (eventData: VideoSSEMessage) => void;

interface VideoSSEMessage {
  type: string;
  projectId?: string;
  requestId?: string;
  object?: {
    url?: string;
    contentType?: string;
  };
} 