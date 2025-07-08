'use client';
import { Artifact } from '@/components/create-artifact';
import { Markdown } from '@/components/markdown';
import { CopyIcon, ShareIcon } from '@/components/icons';
import { toast } from 'sonner';

export const scriptArtifact = new Artifact<'script'>({
  kind: 'script',
  description: 'Useful for script/scenario content in markdown.',
  
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: (draftArtifact.content || '') + (streamPart.content as string),
          status: 'streaming',
          isVisible: 
            draftArtifact.status === 'streaming' &&
            draftArtifact.content.length > 100 &&
            draftArtifact.content.length < 200
              ? true
              : draftArtifact.isVisible,
        };
      });
    }
    
    // Make artifact visible when kind is set to script
    if (streamPart.type === 'kind' && streamPart.content === 'script') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          isVisible: true,
          status: 'streaming',
        };
      });
    }
    
    // Store document ID when it's available
    if (streamPart.type === 'id') {
      setArtifact((draftArtifact) => {
        console.log('📝 Script ID received:', streamPart.content);
        return {
          ...draftArtifact,
          documentId: streamPart.content as string,
        };
      });
    }
    
    // Add attachment when the stream is finished
    if (streamPart.type === 'finish') {
      setArtifact((draftArtifact) => {
        console.log('🎯 Script finish event triggered:', {
          eventType: streamPart.type,
          documentId: draftArtifact.documentId,
          title: draftArtifact.title,
          hasWindow: typeof window !== 'undefined',
          hasChatInstance: !!(window as any)?.chatInstance
        });
        
        // Add script attachment to chat messages after completion
        if (draftArtifact.documentId && draftArtifact.documentId !== 'init') {
          // The attachment logic is now only called once, on finish.
          const addAttachment = () => {
            const context = (window as any).chatInstance;
            console.log('🔍 Checking chat context:', {
              hasContext: !!context,
              hasSetMessages: !!context?.setMessages,
              hasChatId: !!context?.chatId,
              chatId: context?.chatId
            });
            
            if (context?.setMessages && context?.chatId) {
              const shortTitle = (draftArtifact.title || 'Generated Script').substring(0, 70) + '...';
              const assistantMessageContent = `Here is the script for "${shortTitle}"`;

              const scriptAttachment = {
                role: 'assistant' as const,
                content: assistantMessageContent,
                parts: [{ text: assistantMessageContent, type: 'text' as const }],
                experimental_attachments: [
                  {
                    url: `${window.location.origin}/artifact/${draftArtifact.documentId}`,
                    name: draftArtifact.title || 'Generated Script',
                    contentType: 'text/markdown' as const,
                  }
                ],
                createdAt: new Date(),
                id: crypto.randomUUID(),
              };
              
              console.log('💾 Attempting to save script attachment:', {
                documentId: draftArtifact.documentId,
                chatId: context.chatId,
                attachmentUrl: scriptAttachment.experimental_attachments[0].url
              });
              
              // Delay the update slightly to prevent race conditions with the main chat stream
              setTimeout(() => {
                // Add attachment message to chat
                context.setMessages((prev: any[]) => {
                  // Check if attachment already exists
                  const existingAttachment = prev.find(msg => 
                    msg.experimental_attachments?.some((att: any) => 
                      att.url.includes(draftArtifact.documentId)
                    )
                  );
                  
                  if (!existingAttachment) {
                    console.log('✅ Adding new script attachment to messages');
                    return [...prev, scriptAttachment];
                  } else {
                    console.log('⚠️ Script attachment already exists, skipping UI update');
                    return prev;
                  }
                });

                // Save attachment to database (this can be fire-and-forget)
                fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: context.chatId,
                    message: scriptAttachment,
                    selectedChatModel: 'chat-model',
                    selectedVisibilityType: 'private',
                  }),
                }).then(response => {
                  if (response.ok) {
                    console.log('✅ Script attachment saved to database successfully');
                  } else {
                    console.error('❌ Failed to save script attachment, status:', response.status);
                    return response.text().then(text => {
                      console.error('❌ Error details:', text);
                    });
                  }
                }).catch(error => {
                  console.error('❌ Network error saving script attachment:', error);
                });
              }, 250); // 250ms delay
              
              console.log('📄 Script attachment processing completed for:', draftArtifact.documentId);
              return true; // Success
            } else {
              console.log('⚠️ Chat context not available for attachment');
              return false; // Failed
            }
          };
          
          addAttachment();
        }
        
        return {
          ...draftArtifact,
          isVisible: true,
          status: 'idle',
        };
      });
    }
  },
  content: ({ content, title }) => (
    <div className="p-8 md:p-20 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="prose dark:prose-invert">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  ),
  actions: [
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
    {
      icon: <ShareIcon size={18} />,
      description: 'Copy artifact link',
      onClick: (context) => {
        const documentId = (context as any).documentId;
        if (documentId && documentId !== 'init') {
          const shareUrl = `${window.location.origin}/artifact/${documentId}`;
          navigator.clipboard.writeText(shareUrl);
          toast.success('Artifact link copied to clipboard!');
        } else {
          toast.error('Unable to generate share link - artifact not saved yet');
        }
      },
    },
  ],
  toolbar: [],
}); 