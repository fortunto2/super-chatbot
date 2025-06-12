// Console helper functions for quick debugging in browser
import { imageWebsocketStore } from '@/lib/websocket/image-websocket-store';
import { imageMonitor, getImageDebugInfo } from './image-debug';
import { logSystemHealth, performSystemHealthCheck } from './image-system-check';

// Helper functions to expose in browser console
export const consoleHelpers = {
  // Quick system health check
  health: () => {
    console.group('🔍 Image System Health Check');
    const report = performSystemHealthCheck();
    console.table(report.websocket);
    console.table(report.monitoring);
    
    if (report.issues.length > 0) {
      console.group('⚠️ Issues:');
      report.issues.forEach(issue => console.warn(issue));
      console.groupEnd();
      
      console.group('💡 Recommendations:');
      report.recommendations.forEach(rec => console.info(rec));
      console.groupEnd();
    } else {
      console.log('✅ All systems operational');
    }
    console.groupEnd();
    return report;
  },

  // Quick debug info
  debug: () => {
    const debug = getImageDebugInfo();
    console.group('🔍 Image Generation Debug Info');
    console.log('Total requests:', debug.totalRequests);
    console.log('Duplicate images:', debug.duplicateImages);
    console.log('Mixed up images:', debug.mixedUpImages);
    console.log('Recent requests:', debug.recentRequests.slice(0, 5));
    console.groupEnd();
    return debug;
  },

  // WebSocket status
  ws: () => {
    const wsDebug = imageWebsocketStore.getDebugInfo();
    console.group('🔌 WebSocket Status');
    console.table(wsDebug);
    console.groupEnd();
    return wsDebug;
  },

  // Force cleanup
  cleanup: () => {
    console.log('🧹 Forcing system cleanup...');
    imageWebsocketStore.forceCleanup();
    imageMonitor.clear();
    console.log('✅ Cleanup completed');
  },

  // Test projectId validation
  testProjectId: (projectId: string) => {
    console.group(`🧪 Testing project validation for: ${projectId}`);
    
    // Test clean ID extraction
    const cleanId = projectId.startsWith('project.') ? projectId.substring(8) : projectId;
    console.log('Clean ID:', cleanId);
    
    // Test handler lookup
    const wsDebug = imageWebsocketStore.getDebugInfo();
    const hasHandlers = Object.keys(wsDebug.projectHandlers).includes(cleanId);
    console.log('Has handlers:', hasHandlers);
    
    // Test active projects
    const isActive = wsDebug.activeProjects.includes(cleanId);
    console.log('Is active:', isActive);
    
    console.groupEnd();
    return { cleanId, hasHandlers, isActive };
  },

  // Get handler count by project
  handlers: () => {
    const wsDebug = imageWebsocketStore.getDebugInfo();
    console.group('📊 Handler Distribution');
    console.table(wsDebug.projectHandlers);
    console.log('Total handlers:', wsDebug.totalHandlers);
    console.log('Connection handlers:', wsDebug.connectionHandlers);
    console.groupEnd();
    return wsDebug.projectHandlers;
  },

  // Monitor for issues
  monitor: (duration: number = 30000) => {
    console.log(`👁️ Starting monitoring for ${duration/1000} seconds...`);
    
    const startTime = Date.now();
    const initialDebug = getImageDebugInfo();
    
    const interval = setInterval(() => {
      const currentDebug = getImageDebugInfo();
      
      // Check for new issues
      const newDuplicates = currentDebug.duplicateImages.length - initialDebug.duplicateImages.length;
      const newMixups = currentDebug.mixedUpImages.length - initialDebug.mixedUpImages.length;
      
      if (newDuplicates > 0 || newMixups > 0) {
        console.warn('🚨 New issues detected:', { newDuplicates, newMixups });
      }
      
      if (Date.now() - startTime >= duration) {
        clearInterval(interval);
        console.log('👁️ Monitoring completed');
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }
};

// Chat WebSocket debugging
const chatWebSocket = {
  testConnection: (projectId: string) => {
    console.log('🧪 Testing chat WebSocket connection for projectId:', projectId);
    const store = (window as any).imageWebsocketStore || imageWebsocketStore;
    
    // Show current state
    const debugInfo = store.getDebugInfo();
    console.log('🔍 Current WebSocket state:', debugInfo);
    
    // Test URL formation
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://editor.superduperai.co';
    const url = `${baseUrl.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
    console.log('🔗 Would connect to URL:', url);
    
    // Check if connection exists and its state
    if (debugInfo.isConnected) {
      console.log('✅ WebSocket is connected');
    } else {
      console.log('❌ WebSocket is not connected');
      console.log('🔌 Attempting to force connection...');
      
      // Create a test handler
      const testHandler = (data: any) => {
        console.log('🧪 Test handler received:', data);
      };
      
      store.initConnection(url, [testHandler]);
    }
  },
  
  connectToProject: (projectId: string) => {
    console.log('🔗 Manually connecting to project:', projectId);
    
    // Try to get the chat WebSocket instance and connect to project
    const chatInstance = (window as any).chatWebSocketInstance;
    if (chatInstance && chatInstance.connectToProject) {
      chatInstance.connectToProject(projectId);
      console.log('✅ Connection request sent to chat WebSocket');
    } else {
      console.log('❌ Chat WebSocket instance not found, using store directly');
      const store = (window as any).imageWebsocketStore || imageWebsocketStore;
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://editor.superduperai.co';
      const url = `${baseUrl.replace('https://', 'wss://')}/api/v1/ws/project.${projectId}`;
      
      const testHandler = (data: any) => {
        console.log('🧪 Manual test handler received:', data);
      };
      
      store.initConnection(url, [testHandler]);
    }
  },
  
  forceConnectToProject: (projectId: string) => {
    console.log('🔗 Force connecting to project:', projectId);
    
    // Try to get the chat WebSocket instance and force connect
    const chatInstance = (window as any).chatWebSocketInstance;
    if (chatInstance && chatInstance.forceConnectToProject) {
      chatInstance.forceConnectToProject(projectId);
      console.log('✅ Force connection request sent to chat WebSocket');
         } else {
       console.log('❌ Chat WebSocket instance not found, using connectToProject instead');
       chatWebSocket.connectToProject(projectId);
     }
  },
  
  forceCleanup: () => {
    console.log('🧹 Forcing chat WebSocket cleanup...');
    const store = (window as any).imageWebsocketStore || imageWebsocketStore;
    store.forceCleanup();
    console.log('✅ Cleanup completed');
  },
  
  debugConnection: () => {
    console.log('🔍 Chat WebSocket Debug Information:');
    const store = (window as any).imageWebsocketStore || imageWebsocketStore;
    const debugInfo = store.getDebugInfo();
    
    console.table({
      'Connection Status': debugInfo.isConnected ? '✅ Connected' : '❌ Disconnected',
      'Total Handlers': debugInfo.totalHandlers,
      'Connection Handlers': debugInfo.connectionHandlers,
      'Active Projects': debugInfo.activeProjects.join(', ') || 'None',
      'Current URL': debugInfo.currentUrl || 'None',
      'Is Connecting': debugInfo.isConnecting ? 'Yes' : 'No'
    });
    
    // Show connected projects from chat instance if available
    const chatInstance = (window as any).chatWebSocketInstance;
    if (chatInstance && chatInstance.connectedProjects) {
      console.log('📡 Connected projects from chat:', chatInstance.connectedProjects);
      
      // Check connection status for each project
      chatInstance.connectedProjects.forEach((projectId: string) => {
        const isConnected = chatInstance.isConnectedToProject ? chatInstance.isConnectedToProject(projectId) : 'unknown';
        console.log(`📡 Project ${projectId}: ${isConnected ? '✅' : '❌'}`);
      });
    }
    
    return debugInfo;
  },
  
  simulateEvent: (projectId: string, eventType: string = 'file') => {
    console.log('🎭 Simulating WebSocket event for projectId:', projectId);
    const store = (window as any).imageWebsocketStore || imageWebsocketStore;
    
    const mockEvent = {
      type: eventType,
      projectId: projectId,
      requestId: `test_${Date.now()}`,
      object: eventType === 'file' ? {
        type: 'image',
        url: 'https://example.com/test-image.png'
      } : undefined
    };
    
    // Find handlers for this project and call them
    const handlers = store.projectHandlers?.get(projectId) || [];
    console.log('📞 Found', handlers.length, 'handlers for project:', projectId);
    
    handlers.forEach((ph: any, index: number) => {
      console.log(`🎯 Calling handler ${index + 1}:`, ph);
      try {
        ph.handler(mockEvent);
        console.log('✅ Handler', index + 1, 'executed successfully');
      } catch (error) {
        console.error('❌ Handler', index + 1, 'failed:', error);
      }
    });
  },
  
  listConnections: () => {
    console.log('📋 Listing all WebSocket connections:');
    const store = (window as any).imageWebsocketStore || imageWebsocketStore;
    const debugInfo = store.getDebugInfo();
    
    console.log('🔗 Store state:', debugInfo);
    
    // Show connected projects from chat instance
    const chatInstance = (window as any).chatWebSocketInstance;
    if (chatInstance) {
      console.log('💬 Chat instance state:', {
        isEnabled: chatInstance.isEnabled,
        connectedProjects: chatInstance.connectedProjects,
        isConnected: chatInstance.isConnected
      });
      
      // Check each project connection status
      if (chatInstance.connectedProjects && chatInstance.connectedProjects.length > 0) {
        console.log('📡 Project connection status:');
        chatInstance.connectedProjects.forEach((projectId: string) => {
          const isConnected = chatInstance.isConnectedToProject ? chatInstance.isConnectedToProject(projectId) : 'unknown';
          console.log(`  ${projectId}: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);
        });
      }
    } else {
      console.log('❌ No chat WebSocket instance found');
    }
  },
  
  // New helper to notify chat about new projectId
  notifyNewProject: (projectId: string) => {
    console.log('📢 Notifying chat WebSocket about new project:', projectId);
    
    const chatInstance = (window as any).chatWebSocketInstance;
    if (chatInstance && chatInstance.forceConnectToProject) {
      chatInstance.forceConnectToProject(projectId);
      console.log('✅ Chat WebSocket notified about new project');
         } else {
       console.log('❌ Chat WebSocket instance not available, manual connection needed');
       chatWebSocket.connectToProject(projectId);
     }
  },

  // Test artifact projectId notification
  testArtifactNotification: (projectId: string) => {
    console.log(`🔧 Testing artifact notification for projectId: ${projectId}`);
    const globalWindow = window as any;
    if (globalWindow.notifyNewProject) {
      globalWindow.notifyNewProject(projectId);
      console.log('✅ Notification sent successfully');
    } else {
      console.warn('⚠️ notifyNewProject not available on window object');
    }
  }
};

// Auto-expose in browser console
if (typeof window !== 'undefined') {
  (window as any).imageSystem = consoleHelpers;
  (window as any).chatWebSocket = chatWebSocket;
  console.log('🔧 Image system helpers available as window.imageSystem');
  console.log('🔧 Chat WebSocket helpers available as window.chatWebSocket');
  console.log('Available commands:');
  console.log('  imageSystem.health() - System health check');
  console.log('  imageSystem.debug() - Debug information');
  console.log('  imageSystem.ws() - WebSocket status');
  console.log('  imageSystem.cleanup() - Force cleanup');
  console.log('  imageSystem.testProjectId(id) - Test project ID validation');
  console.log('  imageSystem.handlers() - Handler distribution');
  console.log('  imageSystem.monitor(duration) - Monitor for issues');
  console.log('  chatWebSocket.testConnection(projectId) - Test chat WebSocket');
  console.log('  chatWebSocket.connectToProject(projectId) - Manually connect to project');
  console.log('  chatWebSocket.forceCleanup() - Force chat cleanup');
  console.log('  chatWebSocket.debugConnection() - Chat WebSocket debug information');
  console.log('  chatWebSocket.simulateEvent(projectId, eventType) - Simulate WebSocket event');
  console.log('  chatWebSocket.listConnections() - List all WebSocket connections');
  console.log('  chatWebSocket.testArtifactNotification(projectId) - Test artifact notification');
  console.log('  debugChatArtifacts(messages, projectId, requestId) - Debug artifacts in messages');
  console.log('  checkCurrentMessages() - Check current chat messages state');
  console.log('  checkCurrentArtifact() - Check current global artifact state');
  console.log('  forceUpdateArtifact(imageUrl, projectId, requestId) - Force update artifact with image');
  console.log('  applyLastImageUrl() - Apply the last received image URL to current artifact');
  console.log('  quickImageFix() - Quick fix to apply the last generated image from console logs');
  
  // Expose helper to store chat WebSocket instance for debugging
  (window as any).setChatWebSocketInstance = (instance: any) => {
    (window as any).chatWebSocketInstance = instance;
    console.log('🔧 Chat WebSocket instance stored for debugging');
  };

  // Store reference to useChatImageWebSocket hook return value for debugging
  (window as any).storeChatWebSocketHook = (hookReturnValue: any) => {
    (window as any).chatWebSocketHook = hookReturnValue;
    console.log('🔧 Chat WebSocket hook stored for debugging');
  };
  
  // Global function to notify chat about new projectId
  (window as any).notifyNewProject = (projectId: string) => {
    chatWebSocket.notifyNewProject(projectId);
  };
  
  // Global function to check current messages state 
  (window as any).checkCurrentMessages = () => {
    console.log('🔍 Checking current chat messages state...');
    
    // Try to get messages from chat instance
    const chatInstance = (window as any).chatWebSocketInstance;
    if (chatInstance && chatInstance.messages) {
      console.log('📬 Found messages in chat instance:', chatInstance.messages.length);
      (window as any).debugChatArtifacts(chatInstance.messages);
    } else {
      console.log('❌ No messages found in chat instance');
      console.log('💡 Try calling this function after generating an image');
    }
  };

  // Global function to check current artifact state
  (window as any).checkCurrentArtifact = () => {
    console.log('🎨 Checking current artifact state...');
    
    // Try multiple ways to access current artifact state
    
    // Method 1: Try to access global artifact state
    try {
      const artifactInstance = (window as any).artifactInstance;
      if (artifactInstance && artifactInstance.artifact) {
        const artifact = artifactInstance.artifact;
        console.log('🎨 Found artifact in global instance:', {
          documentId: artifact.documentId,
          kind: artifact.kind,
          status: artifact.status,
          isVisible: artifact.isVisible,
          hasContent: !!artifact.content,
          contentLength: artifact.content?.length || 0
        });
        
        if (artifact.kind === 'image' && artifact.content) {
          try {
            const parsedContent = JSON.parse(artifact.content);
            console.log('🎨 Parsed artifact content:', {
              status: parsedContent.status,
              projectId: parsedContent.projectId,
              requestId: parsedContent.requestId,
              hasImageUrl: !!parsedContent.imageUrl,
              imageUrl: parsedContent.imageUrl?.substring(0, 100) + '...' || 'none'
            });
          } catch (error) {
            console.log('🎨 Could not parse artifact content as JSON');
          }
        }
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not access global artifact instance:', error);
    }
    
    // Method 2: Try to access via React DevTools (disabled due to TypeScript issues)
    try {
      // Look for React Fiber with artifact state
      const nextElement = document.querySelector('#__next') as any;
      const rootElement = document.querySelector('[data-reactroot]') as any;
      
      const reactRoot = nextElement?._reactInternalFiber ||
                       nextElement?._reactInternals ||
                       rootElement?._reactInternalFiber ||
                       rootElement?._reactInternals;
      
      if (reactRoot) {
        console.log('🔍 Found React root, searching for artifact state...');
        // This is a simplified search - in practice we'd need to traverse the fiber tree
        console.log('💡 React DevTools method not fully implemented - use global instance method');
      }
    } catch (error) {
      console.log('⚠️ Could not access via React DevTools:', error);
    }
    
    // Method 3: Check if SWR cache is available (fallback)
    try {
      if (typeof window !== 'undefined' && (window as any).__SWR_DEVTOOLS_REACT__) {
        console.log('🔍 SWR DevTools detected, but cache access may be limited');
      }
    } catch (error) {
      // Ignore
    }
    
    console.log('❌ No artifact found via any method');
    console.log('💡 Try calling this function when an artifact is visible');
    console.log('💡 The artifact might be managed internally by React state');
  };
  
  // Global function to debug chat artifacts
  (window as any).debugChatArtifacts = (messages: any[], targetProjectId?: string, targetRequestId?: string) => {
    console.log('🔍 Debugging chat artifacts:');
    console.log('- Total messages:', messages.length);
    console.log('- Target projectId:', targetProjectId || 'any');
    console.log('- Target requestId:', targetRequestId || 'any');
    
    let artifactCount = 0;
    let pendingCount = 0;
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      console.log(`📨 Message ${i}:`, {
        role: message.role,
        id: message.id,
        partsCount: message.parts?.length || 0,
        hasAttachments: !!message.experimental_attachments?.length
      });
      
      if (message.role === 'assistant' && message.parts) {
        for (let partIndex = 0; partIndex < message.parts.length; partIndex++) {
          const part = message.parts[partIndex];
          console.log(`  📝 Part ${partIndex}:`, {
            type: part.type,
            hasText: 'text' in part && !!part.text,
            textLength: 'text' in part ? part.text?.length : 0,
            textPreview: 'text' in part && part.text ? part.text.substring(0, 100) + '...' : 'no text'
          });
          
          if (part.type === 'text' && 'text' in part && part.text) {
            // Enhanced artifact detection - check multiple patterns
            const hasImageArtifact = 
              part.text.includes('"kind":"image"') ||  // Standard format
              part.text.includes("'kind':'image'") ||  // Single quotes
              (part.text.includes('kind') && part.text.includes('image') && part.text.includes('```json')) || // JSON block with kind/image
              part.text.includes('ImageArtifact') ||   // Component name
              (part.text.includes('status') && part.text.includes('projectId') && part.text.includes('requestId')); // Fields match
            
            console.log(`    🔍 Has image artifact patterns:`, hasImageArtifact);
            
            if (hasImageArtifact) {
              artifactCount++;
              
              try {
                // Try multiple JSON extraction patterns
                let artifactContent = null;
                
                // Pattern 1: Standard ```json block
                let artifactMatch = part.text.match(/```json\n(.*?)\n```/s);
                if (artifactMatch) {
                  artifactContent = JSON.parse(artifactMatch[1]);
                } else {
                  // Pattern 2: Look for any JSON-like structure with kind:image
                  const jsonMatch = part.text.match(/\{[^}]*"kind"\s*:\s*"image"[^}]*\}/);
                  if (jsonMatch) {
                    artifactContent = JSON.parse(jsonMatch[0]);
                  }
                }
                
                if (artifactContent) {
                  console.log(`📄 Artifact ${artifactCount} (message ${i}, part ${partIndex}):`, {
                    status: artifactContent.status,
                    projectId: artifactContent.projectId,
                    requestId: artifactContent.requestId,
                    hasImageUrl: !!artifactContent.imageUrl,
                    imageUrl: artifactContent.imageUrl?.substring(0, 50) + '...' || 'none',
                    messageId: message.id
                  });
                  
                  if (artifactContent.status === 'pending' || artifactContent.status === 'streaming') {
                    pendingCount++;
                  }
                  
                  // Check matching priority
                  let priority = 0;
                  if (targetRequestId && artifactContent.requestId === targetRequestId) {
                    priority = 3;
                    console.log('    🎯 EXACT REQUEST MATCH!');
                  } else if (targetProjectId && artifactContent.projectId === targetProjectId) {
                    priority = 2;
                    console.log('    🎯 PROJECT MATCH!');
                  } else if (artifactContent.status === 'pending' || artifactContent.status === 'streaming') {
                    priority = 1;
                    console.log('    ⏳ PENDING/STREAMING MATCH!');
                  }
                  
                  if (priority > 0) {
                    console.log(`    📊 Priority: ${priority} (3=exact, 2=project, 1=pending)`);
                  }
                } else {
                  console.log(`    ⚠️ Could not parse artifact JSON from part with patterns`);
                  console.log(`    📄 Raw text sample:`, part.text.substring(0, 200));
                }
              } catch (error) {
                console.error(`    ❌ Error parsing artifact:`, error);
                console.log(`    📄 Raw text sample:`, part.text.substring(0, 200));
              }
            }
          }
        }
      }
      
      // Also check attachments
      if (message.experimental_attachments && message.experimental_attachments.length > 0) {
        console.log(`  📎 Attachments (${message.experimental_attachments.length}):`, 
          message.experimental_attachments.map((att: any) => ({
            name: att.name,
            contentType: att.contentType,
            url: att.url?.substring(0, 50) + '...'
          }))
        );
      }
    }
    
    console.log(`📊 Summary: ${artifactCount} total artifacts, ${pendingCount} pending/streaming`);
    
    if (artifactCount === 0) {
      console.log('❌ No image artifacts found in messages');
      console.log('💡 Try running checkCurrentMessages() right after generating an image');
      console.log('💡 If artifacts exist but not found, check the artifact format in message parts');
    } else if (pendingCount === 0) {
      console.log('⚠️ No pending/streaming artifacts found - all completed?');
    }
  };

  // Global function to force update artifact with image
  (window as any).forceUpdateArtifact = (imageUrl: string, projectId?: string, requestId?: string) => {
    console.log('💪 Force updating artifact with image:', {
      imageUrl: imageUrl?.substring(0, 100) + '...',
      projectId,
      requestId
    });
    
    const artifactInstance = (window as any).artifactInstance;
    if (!artifactInstance) {
      console.log('❌ No artifact instance found');
      console.log('💡 Make sure an artifact component is currently mounted');
      return;
    }
    
    const { artifact, setArtifact } = artifactInstance;
    if (!artifact || artifact.kind !== 'image') {
      console.log('❌ No image artifact found or wrong artifact type');
      console.log('Current artifact:', artifact);
      return;
    }
    
    try {
      const currentContent = JSON.parse(artifact.content || '{}');
      console.log('🔍 Current artifact content:', currentContent);
      
      const updatedContent = {
        ...currentContent,
        status: 'completed',
        imageUrl: imageUrl,
        projectId: projectId || currentContent.projectId,
        requestId: requestId || currentContent.requestId,
        timestamp: Date.now(),
        message: 'Image generation completed (force updated)!'
      };
      
      console.log('🔄 Updating artifact with new content:', updatedContent);
      
      setArtifact((current: any) => ({
        ...current,
        content: JSON.stringify(updatedContent),
        status: 'idle' as const
      }));
      
      console.log('✅ Artifact force updated successfully!');
    } catch (error) {
      console.error('❌ Error force updating artifact:', error);
    }
  };

  // Global function to apply the last received image URL from WebSocket
  (window as any).applyLastImageUrl = () => {
    console.log('🔍 Searching for last received image URL in WebSocket logs...');
    
    // Method 1: Try to get from chat WebSocket instance
    const chatWebSocketInstance = (window as any).chatWebSocketInstance;
    console.log('🔍 Chat WebSocket instance:', !!chatWebSocketInstance);
    console.log('🔍 Last image URL in instance:', chatWebSocketInstance?.lastImageUrl);
    
    if (chatWebSocketInstance && chatWebSocketInstance.lastImageUrl) {
      console.log('✅ Found last image URL in chat WebSocket:', chatWebSocketInstance.lastImageUrl);
      (window as any).forceUpdateArtifact(chatWebSocketInstance.lastImageUrl);
      return;
    }
    
    // Method 2: Try to extract from recent console logs
    console.log('🔍 Chat WebSocket instance not found or no lastImageUrl, trying console logs...');
    
    // Look for the last "Stored last image URL" message in console history
    const consoleHistorySearch = () => {
      // This is a fallback - recommend manual URL extraction
      console.log('💡 Look in the console logs above for the line:');
      console.log('💡 "💾 Stored last image URL for debugging: https://..."');
      console.log('💡 Then copy that URL and call:');
      console.log('💡 forceUpdateArtifact("https://your-image-url-here")');
      
      // Show recent WebSocket storage attempts
      if ((window as any).setChatWebSocketInstance) {
        console.log('🔍 setChatWebSocketInstance function exists');
      } else {
        console.log('❌ setChatWebSocketInstance function not found');
      }
    };
    
         consoleHistorySearch();
   };

   // Quick function to fix image showing based on recent URL from logs
   (window as any).quickImageFix = () => {
     console.log('🚀 Quick Image Fix: Looking for recent image URL...');
     
     // For the user to manually paste the URL they see in logs
     const lastSeenUrl = 'https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/generated/image/2025/6/12/13/EqdghzDghDQfBhzEWVpi7h.webp';
     
     console.log('🚀 Using URL from your logs (update this if needed):', lastSeenUrl);
     console.log('💡 If this URL is wrong, copy the correct URL from the "💾 Stored last image URL" log above');
     console.log('💡 Then call: forceUpdateArtifact("YOUR_CORRECT_URL_HERE")');
     
     (window as any).forceUpdateArtifact(lastSeenUrl);
   };
 } 