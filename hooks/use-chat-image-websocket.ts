import { useEffect, useRef, useCallback } from "react";
import { imageWebsocketStore, type ImageEventHandler, type ImageWSMessage } from "@/lib/websocket/image-websocket-store";
import type { UseChatHelpers } from '@ai-sdk/react';
import { generateUUID } from "@/lib/utils";

interface ChatImageWebSocketOptions {
  chatId: string;
  messages: any[];
  setMessages: UseChatHelpers['setMessages'];
  enabled?: boolean;
}

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

  // Only log once when chatId changes
  const shouldLog = currentChatIdRef.current !== chatId;
  if (shouldLog) {
    console.log('💬 Chat WebSocket Hook: New chatId detected', { 
      oldChatId: currentChatIdRef.current, 
      newChatId: chatId, 
      enabled, 
      messagesCount: messages.length 
    });
    currentChatIdRef.current = chatId;
  }

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

      console.log('💬 Chat WebSocket: Processing image event', eventData.type, 'for project', eventData.projectId, 'targeting', targetProjectId);

      // Filter events only for our target project
      if (eventData.projectId && eventData.projectId !== targetProjectId) {
        console.log('💬 Chat WebSocket: Ignoring event for different project', { 
          eventProjectId: eventData.projectId, 
          targetProjectId 
        });
        return;
      }

      // Only handle completed images that have URL
      if (eventData.type === 'file' && eventData.object?.type === 'image' && eventData.object?.url) {
        const imageUrl = eventData.object.url;
        const requestId = eventData.requestId;

        console.log('💬 Chat WebSocket: Image completed, updating messages', { imageUrl, requestId, targetProjectId });

        // Store the last image URL for debugging and try direct artifact update
        if (typeof window !== 'undefined') {
          const chatWebSocketInstance = (window as any).chatWebSocketInstance;
          if (chatWebSocketInstance) {
            chatWebSocketInstance.lastImageUrl = imageUrl;
            console.log('💾 Stored last image URL for debugging:', imageUrl);
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
                
                console.log('💫 Direct artifact update: Found matching artifact, updating with image URL');
                
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

                console.log('✅ Direct artifact update successful!');
              } else {
                console.log('💫 Direct artifact update: No matching artifact found');
              }
            } catch (error) {
              console.log('💫 Direct artifact update: Could not parse artifact content');
            }
          } else {
            console.log('💫 Direct artifact update: No artifact instance available');
          }
        }
        
        // Ensure we're connected to this project if not already
        if (!connectedProjectsRef.current.has(targetProjectId)) {
          console.log('💬 Chat WebSocket: Auto-connecting to project for image:', targetProjectId);
          connectToProject(targetProjectId);
        }

        // Add small delay to ensure artifact is added to messages first
        // This fixes race condition where WebSocket receives image before artifact is in messages
        setTimeout(() => {
          console.log('💬 Chat WebSocket: Processing image update after delay');
          
          // Update messages using the current setMessages function
          setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          let foundArtifact = false;
          
          console.log('💬 Chat WebSocket: Searching through', updatedMessages.length, 'messages for artifacts');
          
          // Look for the most recent assistant message with pending/streaming image artifact
          // Priority: 1) Same requestId, 2) Same projectId, 3) Any pending/streaming artifact
          let candidateMessage = null;
          let candidateIndex = -1;
          let candidatePriority = 0; // 0 = no match, 1 = pending/streaming, 2 = same project, 3 = same requestId
          
          for (let i = updatedMessages.length - 1; i >= 0; i--) {
            const message = updatedMessages[i];
            
            console.log(`💬 Chat WebSocket: Checking message ${i}:`, {
              role: message.role,
              hasRoles: !!message.role,
              partsCount: message.parts?.length || 0,
              messageId: message.id
            });
            
            if (message.role === 'assistant') {
              // Check if this message has image artifact content
              // Look for different possible artifact formats
              const hasImageArtifact = message.parts?.some(part => 
                part.type === 'text' && 
                'text' in part && 
                part.text && (
                  part.text.includes('"kind":"image"') ||  // Standard format
                  part.text.includes("'kind':'image'") ||  // Single quotes
                  (part.text.includes('kind') && part.text.includes('image') && part.text.includes('```json')) || // JSON block with kind/image
                  part.text.includes('ImageArtifact') ||   // Component name
                  (part.text.includes('status') && part.text.includes('projectId') && part.text.includes('requestId')) // Fields match
                )
              );

              console.log(`💬 Chat WebSocket: Assistant message ${i} has image artifact:`, hasImageArtifact);
              
              // DEBUG: Show message parts details
              console.log(`💬 Chat WebSocket: Message ${i} parts:`, message.parts?.map(part => ({
                type: part.type,
                hasText: 'text' in part && !!part.text,
                textLength: 'text' in part ? part.text?.length : 0,
                containsKind: 'text' in part && part.text ? part.text.includes('"kind"') : false,
                containsImage: 'text' in part && part.text ? part.text.includes('"kind":"image"') : false,
                containsImageAlt: 'text' in part && part.text ? part.text.includes('kind') && part.text.includes('image') : false,
                containsJSON: 'text' in part && part.text ? part.text.includes('```json') : false,
                textPreview: 'text' in part && part.text ? part.text.substring(0, 200) + '...' : 'no text'
              })));

              if (hasImageArtifact) {
                // Parse artifact to check compatibility
                const artifactPart = message.parts?.find(part => 
                  part.type === 'text' && 
                  'text' in part && 
                  part.text && (
                    part.text.includes('"kind":"image"') ||
                    part.text.includes("'kind':'image'") ||
                    (part.text.includes('kind') && part.text.includes('image') && part.text.includes('```json')) ||
                    part.text.includes('ImageArtifact') ||
                    part.text.includes('status') && part.text.includes('projectId') && part.text.includes('requestId')
                  )
                );
                
                if (artifactPart && 'text' in artifactPart && artifactPart.text) {
                  try {
                    // Try multiple JSON extraction patterns
                    let artifactContent = null;
                    
                    // Pattern 1: Standard ```json block
                    let artifactMatch = artifactPart.text.match(/```json\n(.*?)\n```/s);
                    if (artifactMatch) {
                      artifactContent = JSON.parse(artifactMatch[1]);
                    } else {
                      // Pattern 2: Look for any JSON-like structure with kind:image
                      const jsonMatch = artifactPart.text.match(/\{[^}]*"kind"\s*:\s*"image"[^}]*\}/);
                      if (jsonMatch) {
                        artifactContent = JSON.parse(jsonMatch[0]);
                      }
                    }
                    
                    if (artifactContent) {
                      console.log('💬 Chat WebSocket: Found artifact content:', {
                        artifactProjectId: artifactContent.projectId,
                        artifactStatus: artifactContent.status,
                        artifactRequestId: artifactContent.requestId,
                        targetProjectId: targetProjectId,
                        targetRequestId: requestId
                      });
                      
                      let priority = 0;
                      
                      // Check for exact requestId match (highest priority)
                      if (requestId && artifactContent.requestId === requestId) {
                        priority = 3;
                        console.log('💬 Chat WebSocket: Found exact requestId match:', requestId);
                      }
                      // Check for same projectId match
                      else if (artifactContent.projectId === targetProjectId) {
                        priority = 2;
                        console.log('💬 Chat WebSocket: Found same projectId match:', targetProjectId);
                      }
                      // Check for pending/streaming artifact (any project)
                      else if (artifactContent.status === 'pending' || artifactContent.status === 'streaming') {
                        priority = 1;
                        console.log('💬 Chat WebSocket: Found pending/streaming artifact, status:', artifactContent.status);
                      }
                      
                      // Use this candidate if it has higher priority
                      if (priority > candidatePriority) {
                        candidateMessage = message;
                        candidateIndex = i;
                        candidatePriority = priority;
                        console.log(`💬 Chat WebSocket: New best candidate with priority ${priority}:`, {
                          messageId: message.id,
                          artifactStatus: artifactContent.status,
                          artifactProjectId: artifactContent.projectId,
                          artifactRequestId: artifactContent.requestId
                        });
                      }
                    } else {
                      console.log('💬 Chat WebSocket: No valid artifact content found in part with image patterns');
                    }
                  } catch (error) {
                    console.error('💬 Chat WebSocket: Error parsing artifact:', error);
                  }
                }
              }
            }
          }
          
          // Update the best candidate if found
          if (candidateMessage && candidateIndex >= 0) {
            console.log('💬 Chat WebSocket: Updating candidate artifact with priority:', candidatePriority);
            
            // Update the artifact content with the completed image
            const updatedParts = candidateMessage.parts?.map(part => {
              // Check for image artifacts with multiple patterns
              const hasImageArtifact = part.type === 'text' && part.text && (
                part.text.includes('"kind":"image"') ||
                part.text.includes("'kind':'image'") ||
                (part.text.includes('kind') && part.text.includes('image') && part.text.includes('```json')) ||
                part.text.includes('ImageArtifact') ||
                (part.text.includes('status') && part.text.includes('projectId') && part.text.includes('requestId'))
              );
              
              if (hasImageArtifact) {
                try {
                  // Try multiple JSON extraction patterns for updating
                  let artifactContent = null;
                  let matchToReplace = null;
                  
                  // Pattern 1: Standard ```json block
                  let artifactMatch = part.text.match(/```json\n(.*?)\n```/s);
                  if (artifactMatch) {
                    artifactContent = JSON.parse(artifactMatch[1]);
                    matchToReplace = artifactMatch[0];
                  } else {
                    // Pattern 2: Look for any JSON-like structure with kind:image
                    const jsonMatch = part.text.match(/\{[^}]*"kind"\s*:\s*"image"[^}]*\}/);
                    if (jsonMatch) {
                      artifactContent = JSON.parse(jsonMatch[0]);
                      matchToReplace = jsonMatch[0];
                    }
                  }
                  
                  if (artifactContent && matchToReplace) {
                    // Update with completed image info
                    const updatedContent = {
                      ...artifactContent,
                      status: 'completed',
                      imageUrl: imageUrl,
                      requestId: requestId || artifactContent.requestId,
                      projectId: targetProjectId
                    };
                    
                    // Replace the JSON content in the text
                    const updatedText = part.text.replace(
                      matchToReplace,
                      `\`\`\`json\n${JSON.stringify(updatedContent, null, 2)}\n\`\`\``
                    );
                    
                    console.log('💬 Chat WebSocket: Updated artifact content with image');
                    
                    return {
                      ...part,
                      text: updatedText
                    };
                  } else {
                    console.log('💬 Chat WebSocket: Could not parse artifact for update despite patterns match');
                  }
                } catch (error) {
                  console.error('💬 Chat WebSocket: Error updating artifact content:', error);
                }
              }
              return part;
            });

            // Check if any parts were actually updated
            const wasUpdated = updatedParts?.some((part, index) => part !== candidateMessage.parts?.[index]);
            
            if (wasUpdated) {
              // Update the message
              updatedMessages[candidateIndex] = {
                ...candidateMessage,
                parts: updatedParts
              };
              
              foundArtifact = true;
              console.log('💬 Chat WebSocket: Successfully updated artifact with image');
            }
          }
          
          // If no artifact found, add a new message with the image attachment
          if (!foundArtifact) {
            console.log('💬 Chat WebSocket: No artifact found, adding new image message');
            
            const imageAttachment = {
              url: imageUrl,
              name: `generated-image-${Date.now()}.png`,
              contentType: 'image/png' as const,
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
          }
          
          return updatedMessages;
        });
        }, 100); // 100ms delay to allow artifact to be added to messages
      }
      
      // Handle other event types if needed
      else if (eventData.type === 'subscribe') {
        console.log('💬 Chat WebSocket: Subscribed to project', eventData.projectId || targetProjectId);
      }
    };
  }, [setMessages]);

  // Function to connect to a specific project
  const connectToProject = useCallback((projectId: string) => {
    if (!enabled || !projectId) {
      console.log('💬 Chat WebSocket: Skipping project connection -', { enabled, projectId });
      return;
    }

    // Skip if already connected to this project
    if (connectedProjectsRef.current.has(projectId)) {
      console.log('💬 Chat WebSocket: Already connected to project:', projectId);
      return;
    }

    console.log('💬 Chat WebSocket: Connecting to project:', projectId);

    // Create event handler for this project
    const eventHandler = createEventHandler(projectId);
    handlersMapRef.current.set(projectId, eventHandler);

    // Connect to WebSocket store
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://editor.superduperai.co';
    const url = `${baseUrl.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
    
    console.log('💬 Chat WebSocket: Connecting to URL:', url);
    
    imageWebsocketStore.initConnection(url, [eventHandler]);
    connectedProjectsRef.current.add(projectId);
  }, [enabled, createEventHandler]);

  // Extract projectIds from various sources
  const extractProjectIds = useCallback((messages: any[]) => {
    const projectIds = new Set<string>();
    
    // Always connect to chatId first
    projectIds.add(chatId);
    
    // Extract projectIds from image artifacts in messages
    for (const message of messages) {
      if (message.role === 'assistant' && message.parts) {
        for (const part of message.parts) {
          if (part.type === 'text' && part.text && part.text.includes('"kind":"image"')) {
            try {
              const artifactMatch = part.text.match(/```json\n(.*?)\n```/s);
              if (artifactMatch) {
                const artifactContent = JSON.parse(artifactMatch[1]);
                if (artifactContent.projectId) {
                  projectIds.add(artifactContent.projectId);
                  console.log('💬 Chat WebSocket: Found projectId in artifact:', artifactContent.projectId);
                }
              }
            } catch (error) {
              // Ignore parse errors
            }
          }
        }
      }
    }

    console.log('💬 Chat WebSocket: Extracted projectIds:', Array.from(projectIds));
    return projectIds;
  }, [chatId]);

  // Listen for new projectIds in messages and connect to them
  useEffect(() => {
    if (!enabled || !chatId) return;

    const projectIds = extractProjectIds(messages);
    
    // Connect to all unique project IDs
    for (const projectId of projectIds) {
      connectToProject(projectId);
    }
  }, [chatId, messages, enabled, connectToProject, extractProjectIds]);

  // Function to manually force connection to a projectId (useful for external calls)
  const forceConnectToProject = useCallback((projectId: string) => {
    console.log('💬 Chat WebSocket: Force connecting to project:', projectId);
    
    // Remove from connected projects to force reconnection
    connectedProjectsRef.current.delete(projectId);
    
    // Clean up existing handler if any
    const existingHandler = handlersMapRef.current.get(projectId);
    if (existingHandler) {
      imageWebsocketStore.removeProjectHandlers(projectId, [existingHandler]);
      handlersMapRef.current.delete(projectId);
    }
    
    // Now connect immediately - this bypasses the "already connected" check
    console.log('💬 Chat WebSocket: Forcing immediate connection to new project:', projectId);
    connectToProject(projectId);
  }, [connectToProject]);

  // Cleanup on unmount or chatId change
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      // Cleanup all handlers for all projects
      for (const [projectId, handler] of handlersMapRef.current.entries()) {
        console.log('💬 Chat WebSocket: Cleaning up project:', projectId);
        imageWebsocketStore.removeProjectHandlers(projectId, [handler]);
      }
      
      handlersMapRef.current.clear();
      connectedProjectsRef.current.clear();
      
      // Check if we should disconnect
      const debugInfo = imageWebsocketStore.getDebugInfo();
      if (debugInfo.totalHandlers === 0) {
        console.log('💬 Chat WebSocket: No more handlers, disconnecting');
        imageWebsocketStore.disconnect();
      }
    };
  }, [chatId]); // Run when chatId changes

  // Expose function to manually connect to a project (for external use)
  const connectToProjectId = useCallback((projectId: string) => {
    connectToProject(projectId);
  }, [connectToProject]);

  return {
    isEnabled: enabled && !!chatId,
    connectToProject: connectToProjectId,
    forceConnectToProject,
    connectedProjects: Array.from(connectedProjectsRef.current),
    // Add connection status for each project
    isConnectedToProject: (projectId: string) => connectedProjectsRef.current.has(projectId),
    // Add overall connection status
    isConnected: connectedProjectsRef.current.size > 0 && imageWebsocketStore.isConnected()
  };
}; 