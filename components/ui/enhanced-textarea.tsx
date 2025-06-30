'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Simple token approximation: ~4 characters per token for English text
const approximateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};

interface EnhancedTextareaProps extends React.ComponentProps<'textarea'> {
  label?: string;
  showCounter?: boolean;
  showFullscreen?: boolean;
  fullscreenTitle?: string;
}

const EnhancedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  EnhancedTextareaProps
>(({ 
  className, 
  value = '', 
  label,
  showCounter = true,
  showFullscreen = true,
  fullscreenTitle = 'Edit Text',
  onChange,
  ...props 
}, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenValue, setFullscreenValue] = useState('');

  const textValue = typeof value === 'string' ? value : '';
  const charCount = textValue.length;
  const tokenCount = approximateTokenCount(textValue);

  const openFullscreen = useCallback(() => {
    setFullscreenValue(textValue);
    setIsFullscreen(true);
  }, [textValue]);

  const handleFullscreenChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFullscreenValue(e.target.value);
  }, []);

  const applyFullscreenChanges = useCallback(() => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: fullscreenValue },
        currentTarget: { value: fullscreenValue }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    }
    setIsFullscreen(false);
  }, [fullscreenValue, onChange]);

  const cancelFullscreen = useCallback(() => {
    setFullscreenValue(textValue);
    setIsFullscreen(false);
  }, [textValue]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          className={cn(
            'resize-none pr-12',
            className,
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          {...props}
        />
        
        {showFullscreen && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={openFullscreen}
            title="Open in fullscreen"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showCounter && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{charCount.toLocaleString()} characters</span>
          <span>~{tokenCount.toLocaleString()} tokens</span>
        </div>
      )}

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minimize2 className="h-4 w-4" />
              {fullscreenTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col space-y-4">
            <Textarea
              value={fullscreenValue}
              onChange={handleFullscreenChange}
              className="flex-1 resize-none text-base"
              placeholder={props.placeholder}
              autoFocus
            />
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex gap-4">
                <span>{fullscreenValue.length.toLocaleString()} characters</span>
                <span>~{approximateTokenCount(fullscreenValue).toLocaleString()} tokens</span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelFullscreen}>
                  Cancel
                </Button>
                <Button onClick={applyFullscreenChanges}>
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

EnhancedTextarea.displayName = 'EnhancedTextarea';

export { EnhancedTextarea }; 