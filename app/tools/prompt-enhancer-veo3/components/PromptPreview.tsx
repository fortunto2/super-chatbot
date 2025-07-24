import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Shuffle, Sparkles, Trash2 } from "lucide-react";

interface PromptPreviewProps {
  generatedPrompt: string;
  setGeneratedPrompt: (prompt: string) => void;
  randomizePrompt: () => void;
  clearAll: () => void;
  copyToClipboard: (text: string) => void;
  copied: boolean;
  setActiveTab: (tab: string) => void;
  isEnhancing: boolean;
  enhancePrompt: () => void;
}

export function PromptPreview({
  generatedPrompt,
  setGeneratedPrompt,
  randomizePrompt,
  clearAll,
  copyToClipboard,
  copied,
  setActiveTab,
  isEnhancing,
  enhancePrompt,
}: PromptPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="w-5 h-5" />
          Generated Prompt
          <Badge variant="secondary" className="ml-auto text-xs">Preview</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Textarea with Copy button in top-right - Now Editable */}
          <div className="relative">
            <Textarea
              value={generatedPrompt}
              onChange={e => setGeneratedPrompt(e.target.value)}
              placeholder="Your generated prompt will appear here, or type your own prompt..."
              className="min-h-[400px] font-mono text-sm resize-none pr-20"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setGeneratedPrompt("")}
                disabled={!generatedPrompt}
                className="size-8 p-0 hover:bg-background/80"
                title="Clear text"
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(generatedPrompt)}
                disabled={!generatedPrompt}
                className="size-8 p-0 hover:bg-background/80"
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button onClick={randomizePrompt} variant="outline" className="flex-1">
                <Shuffle className="size-4 mr-2" />
                Randomize All
              </Button>
              <Button onClick={clearAll} variant="outline" className="flex-1">
                <Trash2 className="size-4 mr-2" />
                Clear All
              </Button>
            </div>
            {/* Navigate to AI Enhancement - Large and Prominent */}
            <Button
              onClick={() => {
                setActiveTab("enhance");
                setTimeout(() => {
                  if (generatedPrompt && !isEnhancing) {
                    enhancePrompt();
                  }
                }, 100);
              }}
              disabled={!generatedPrompt}
              size="lg"
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              <Sparkles className="size-6 mr-3" />
              Continue to AI Enhancement →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 