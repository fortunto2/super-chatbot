'use client';

import { useCallback, useEffect, useRef } from 'react';
import { generateUUID } from '@/lib/utils';
import { imageWebsocketStore } from '@/lib/websocket/image-websocket-store';
import { getSuperduperAIConfig, createWSURL } from '@/lib/config/superduperai';
import type { UseChatHelpers } from '@ai-sdk/react';

interface ChatImageWebSocketOptions {
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
      console.error('Failed to save image message:', errorData);
      throw new Error(`Failed to save message: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to save image message:', error);
  }
};

export const useChatImageWebSocket = ({ 
  chatId, 
  messages, 
  setMessages, 
  enabled = true 
}: ChatImageWebSocketOptions) => {
  const mountedRef = useRef(true);
  const currentChatIdRef = useRef<string | null>(null);
  const connectedProjectsRef = useRef<Set<string>>(new Set());
  const handlersMapRef = useRef<Map<string, ImageEventHandler>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create stable event handler that doesn't cause re-renders
  const createEventHandler = useCallback((targetProjectId: string): ImageEventHandler => {
    return (eventData: ImageWSMessage) => {
      if (!mountedRef.current) return;

      // Filter events only for our target project
      if (eventData.projectId && eventData.projectId !== targetProjectId) {
        return;
      }

      // Only handle completed images that have URL
      if (eventData.type === 'file' && eventData.object?.type === 'image' && eventData.object?.url) {
        const imageUrl = eventData.object.url;
        const requestId = eventData.requestId;

        // Store the last image URL for debugging and try direct artifact update
        if (typeof window !== 'undefined') {
          const chatWebSocketInstance = (window as any).chatWebSocketInstance;
          if (chatWebSocketInstance) {
            chatWebSocketInstance.lastImageUrl = imageUrl;
          }

          // Try direct artifact update immediately
          const artifactInstance = (window as any).artifactInstance;
          if (artifactInstance && artifactInstance.artifact && artifactInstance.artifact.kind === 'image') {
            try {
              const currentContent = JSON.parse(artifactInstance.artifact.content || '{}');
              
              // Check if this update is for current artifact
              if (currentContent.projectId === targetProjectId || 
                  currentContent.status === 'pending' || 
                  currentContent.status === 'streaming') {
                
                const updatedContent = {
                  ...currentContent,
                  status: 'completed',
                  imageUrl: imageUrl,
                  projectId: targetProjectId,
                  requestId: requestId || currentContent.requestId,
                  timestamp: Date.now(),
                  message: 'Image generation completed!'
                };

                artifactInstance.setArtifact((current: any) => ({
                  ...current,
                  content: JSON.stringify(updatedContent),
                  status: 'idle' as const
                }));
              }
            } catch (error) {
              // Silent fail for artifact update
            }
          }
        }
        
        // Ensure we're connected to this project if not already
        if (!connectedProjectsRef.current.has(targetProjectId)) {
          connectToProject(targetProjectId);
        }

        // Add small delay to ensure artifact is added to messages first
        setTimeout(() => {
          // Update messages using the current setMessages function
          setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          let foundArtifact = false;
          
          // Look for the most recent assistant message with pending/streaming image artifact
          let candidateMessage = null;
          let candidateIndex = -1;
          let candidatePriority = 0; // 0 = no match, 1 = pending/streaming, 2 = same project, 3 = same requestId
          
          for (let i = updatedMessages.length - 1; i >= 0; i--) {
            const message = updatedMessages[i];
            
            if (message.role === 'assistant') {
              // Check if this message has image artifact content
              const hasImageArtifact = message.parts?.some(part => 
                part.type === 'text' && 
                'text' in part && 
                part.text && (
                  part.text.includes('"kind":"image"') ||
                  part.text.includes("'kind':'image'") ||
                  (part.text.includes('kind') && part.text.includes('image') && part.text.includes('```json')) ||
                  part.text.includes('ImageArtifact') ||
                  (part.text.includes('status') && part.text.includes('projectId') && part.text.includes('requestId'))
                )
              );

              if (hasImageArtifact) {
                // Try to find and parse image artifact content
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
                      
                      if (artifactContent && artifactContent.status && artifactContent.projectId) {
                        
                        let priority = 0;
                        
                        // Priority 3: Exact requestId match (highest priority)
                        if (requestId && artifactContent.requestId === requestId) {
                          priority = 3;
                        }
                        // Priority 2: Same projectId
                        else if (artifactContent.projectId === targetProjectId) {
                          priority = 2;
                        }
                        // Priority 1: Pending/streaming status (lowest priority but still valid)
                        else if (artifactContent.status === 'pending' || artifactContent.status === 'streaming') {
                          priority = 1;
                        }
                        
                        if (priority > candidatePriority) {
                          candidateMessage = message;
                          candidateIndex = i;
                          candidatePriority = priority;
                        }
                        
                        break; // Found valid artifact in this message
                      }
                    } catch (error) {
                      // Silent fail for parsing
                    }
                  }
                }
              }
            }
          }

          if (candidateMessage && candidateIndex !== -1) {
            // Update the existing artifact
            const updatedParts = candidateMessage.parts?.map((part: any) => {
              if (part.type === 'text' && 'text' in part && part.text) {
                try {
                  let artifactContent = null;
                  let newText = part.text;
                  
                  if (part.text.includes('```json')) {
                    const jsonMatch = part.text.match(/(```json\\s*)({[\\s\\S]*?})(\\s*```)/);
                    if (jsonMatch) {
                      artifactContent = JSON.parse(jsonMatch[2]);
                      if (artifactContent) {
                        const updatedContent = {
                          ...artifactContent,
                          status: 'completed',
                          imageUrl: imageUrl,
                          message: 'Image generation completed!',
                          timestamp: Date.now()
                        };
                        newText = jsonMatch[1] + JSON.stringify(updatedContent, null, 2) + jsonMatch[3];
                      }
                    }
                  } else if (part.text.startsWith('{') && part.text.endsWith('}')) {
                    artifactContent = JSON.parse(part.text);
                    if (artifactContent) {
                      const updatedContent = {
                        ...artifactContent,
                        status: 'completed',
                        imageUrl: imageUrl,
                        message: 'Image generation completed!',
                        timestamp: Date.now()
                      };
                      newText = JSON.stringify(updatedContent);
                    }
                  }
                  
                  if (artifactContent) {
                    return { ...part, text: newText };
                  }
                } catch (error) {
                  // Silent fail
                }
              }
              return part;
            });

            // Check if any parts were actually updated
            const wasUpdated = updatedParts?.some((part, index) => part !== candidateMessage.parts?.[index]);
            
            if (wasUpdated) {
              // Update the message
              const updatedMessage = {
                ...candidateMessage,
                parts: updatedParts
              };
              
              updatedMessages[candidateIndex] = updatedMessage;
              foundArtifact = true;
              
              // Save the updated message to database
              saveMessageToDatabase(chatId, updatedMessage);
            }
          }

          if (!foundArtifact) {
            // Create new image message with attachment
            const imageAttachment = {
              name: `generated-image-${Date.now()}.webp`,
              url: imageUrl,
              contentType: 'image/webp',
            };

            const newMessage = {
              id: generateUUID(),
              role: 'assistant' as const,
              content: 'Image generated successfully',
              parts: [
                {
                  type: 'text' as const,
                  text: 'Image generated successfully'
                }
              ],
              experimental_attachments: [imageAttachment],
              createdAt: new Date(),
            };

            updatedMessages.push(newMessage);
            
            // Save new message to database
            saveMessageToDatabase(chatId, newMessage);
          }

          return updatedMessages;
        });
        }, 100); // Small delay to ensure proper timing
      }

      // Handle subscription confirmations
      if (eventData.type === 'subscribe') {
        connectedProjectsRef.current.add(targetProjectId);
      }
    };
  }, [setMessages, chatId]);

  const connectToProject = useCallback((projectId: string) => {
    if (!enabled) {
      return;
    }

    if (connectedProjectsRef.current.has(projectId)) {
      return;
    }

    const config = getSuperduperAIConfig();
    const url = createWSURL(`/api/v1/ws/project.${projectId}`, config);
    
    // Create handler for this project if not exists
    if (!handlersMapRef.current.has(projectId)) {
      const handler = createEventHandler(projectId);
      handlersMapRef.current.set(projectId, handler);
    }

         const handler = handlersMapRef.current.get(projectId);
     if (handler) {
       imageWebsocketStore.initConnection(url, [handler]);
     }
  }, [enabled, createEventHandler]);

  // Extract project IDs from messages
  const extractProjectIds = useCallback((messages: any[]) => {
    const projectIds = new Set<string>();
    
    for (const message of messages) {
      if (message.role === 'assistant' && message.parts) {
        for (const part of message.parts) {
          if (part.type === 'text' && 'text' in part && part.text) {
            try {
              // Look for project IDs in various formats
              const projectIdMatches = part.text.match(/"projectId":\\s*"([^"]+)"/g);
              if (projectIdMatches) {
                for (const match of projectIdMatches) {
                  const projectId = match.match(/"projectId":\\s*"([^"]+)"/)?.[1];
                  if (projectId) {
                    projectIds.add(projectId);
                  }
                }
              }
            } catch (error) {
              // Silent fail
            }
          }
        }
      }
    }
    
    return projectIds;
  }, []);

  // Force connect to a project (called from artifact component)
  const forceConnectToProject = useCallback((projectId: string) => {
    if (!projectId) return;
    
    // Force immediate connection
    connectToProject(projectId);
  }, [connectToProject]);

  // Cleanup function
     const cleanup = useCallback((projectId?: string) => {
     if (projectId) {
       const handler = handlersMapRef.current.get(projectId);
       if (handler) {
         imageWebsocketStore.removeProjectHandlers(projectId, [handler]);
         handlersMapRef.current.delete(projectId);
         connectedProjectsRef.current.delete(projectId);
       }
     } else {
       // Cleanup all
       for (const [pid, handler] of handlersMapRef.current.entries()) {
         imageWebsocketStore.removeProjectHandlers(pid, [handler]);
       }
       handlersMapRef.current.clear();
       connectedProjectsRef.current.clear();
     }
   }, []);

  // Auto-connect to projects found in messages
  useEffect(() => {
    if (!enabled || !chatId) return;

    const projectIds = extractProjectIds(messages);
    
    for (const projectId of projectIds) {
      connectToProject(projectId);
    }
  }, [messages, enabled, chatId, extractProjectIds, connectToProject]);

  // Store instance globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).chatWebSocketInstance = {
        projectIds: Array.from(connectedProjectsRef.current),
        forceConnect: forceConnectToProject,
        cleanup,
        handlers: handlersMapRef.current,
        lastImageUrl: null,
      };
    }
  }, [forceConnectToProject, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

     return {
     forceConnectToProject,
     cleanup,
     connectedProjects: Array.from(connectedProjectsRef.current),
     isConnectedToProject: (projectId: string) => connectedProjectsRef.current.has(projectId),
     isConnected: connectedProjectsRef.current.size > 0,
   };
};

// Types (keep existing types)
type ImageEventHandler = (eventData: ImageWSMessage) => void;

interface ImageWSMessage {
  type: string;
  projectId?: string;
  requestId?: string;
  object?: {
    type?: string;
    url?: string;
  };
} 