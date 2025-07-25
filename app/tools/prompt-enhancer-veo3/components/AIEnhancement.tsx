import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Settings, ChevronDown, ChevronUp, Copy } from "lucide-react";

interface AIEnhancementProps {
  enhancedPrompt: string;
  setEnhancedPrompt: (prompt: string) => void;
  enhanceWithSelectedFocus: () => void;
  isEnhancing: boolean;
  enhanceError: string;
  enhancementInfo: any;
  selectedFocusTypes: string[];
  toggleFocusType: (type: 'character' | 'action' | 'cinematic' | 'safe') => void;
  includeAudio: boolean;
  setIncludeAudio: (val: boolean) => void;
  customCharacterLimit: number;
  setCustomCharacterLimit: (val: number) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  copied: boolean;
  copyToClipboard: (text: string) => void;
}

export function AIEnhancement({
  enhancedPrompt,
  setEnhancedPrompt,
  enhanceWithSelectedFocus,
  isEnhancing,
  enhanceError,
  enhancementInfo,
  selectedFocusTypes,
  toggleFocusType,
  includeAudio,
  setIncludeAudio,
  customCharacterLimit,
  setCustomCharacterLimit,
  showSettings,
  setShowSettings,
  copied,
  copyToClipboard,
}: AIEnhancementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Enhanced Prompt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main AI Enhance Button - Large and Prominent */}
          <Button
            onClick={enhanceWithSelectedFocus}
            disabled={isEnhancing}
            size="lg"
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Enhancing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-3" />
                {enhancedPrompt.trim() ? 'Re-enhance with AI' : 'Enhance with AI'}
                {selectedFocusTypes.length > 0 && (
                  <span className="ml-2 text-sm opacity-90">
                    ({selectedFocusTypes.length} focus{selectedFocusTypes.length !== 1 ? 'es' : ''})
                  </span>
                )}
              </>
            )}
          </Button>
          {/* Quick Enhancement Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <Button
              variant={selectedFocusTypes.includes('character') ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFocusType('character')}
              className="text-xs"
            >
              👤 Focus Character
            </Button>
            <Button
              variant={selectedFocusTypes.includes('action') ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFocusType('action')}
              className="text-xs"
            >
              🎬 Focus Action
            </Button>
            <Button
              variant={selectedFocusTypes.includes('cinematic') ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFocusType('cinematic')}
              className="text-xs"
            >
              🎥 More Cinematic
            </Button>
            <Button
              variant={includeAudio ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeAudio(!includeAudio)}
              className={`text-xs ${includeAudio 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}
            >
              🔊 Audio & Voice
            </Button>
            <Button
              variant={selectedFocusTypes.includes('safe') ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFocusType('safe')}
              className={`text-xs ${selectedFocusTypes.includes('safe') 
                ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                : 'bg-green-50 border-green-200 hover:bg-green-100'}`}
            >
              🛡️ Safe Content
            </Button>
          </div>
          {/* Collapsible Settings */}
          <div className="border rounded-lg">
            <Button
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full justify-between p-3 h-auto"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Enhancement Settings</span>
                <Badge variant="outline" className="text-xs">
                  {customCharacterLimit} chars • GPT-4.1
                </Badge>
              </div>
              {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            {showSettings && (
              <div className="px-3 pb-3 space-y-3 border-t">
                {/* Character Limit Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Character Limit</span>
                    <Badge variant="outline" className="text-xs">
                      {customCharacterLimit} chars
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="200"
                      max="10000"
                      step="100"
                      value={customCharacterLimit}
                      onChange={e => setCustomCharacterLimit(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>200</span>
                      <span>2K</span>
                      <span>5K</span>
                      <span>10K</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customCharacterLimit < 600 && "Concise and focused"}
                    {customCharacterLimit >= 600 && customCharacterLimit < 1500 && "Balanced detail"}
                    {customCharacterLimit >= 1500 && customCharacterLimit < 3000 && "Rich and detailed"}
                    {customCharacterLimit >= 3000 && "Extremely detailed"}
                  </div>
                </div>
                {/* Model Info */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">AI Model</span>
                  <div className="p-2 bg-muted rounded text-xs">
                    <div className="font-medium">GPT-4.1</div>
                    <div className="text-muted-foreground">Best quality enhancement model</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {enhanceError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{enhanceError}</p>
            </div>
          )}
          {/* AI Enhanced Prompt Display */}
          <div className="relative">
            <Textarea
              value={enhancedPrompt}
              onChange={e => setEnhancedPrompt(e.target.value)}
              placeholder="Click 'Enhance with AI' to generate a professional, detailed prompt..."
              className="min-h-[500px] font-mono text-sm resize-none whitespace-pre-wrap pr-12"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(enhancedPrompt)}
              disabled={!enhancedPrompt}
              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-background/80"
              title={copied ? "Copied!" : "Copy enhanced prompt"}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          {/* Enhancement Info - Compact */}
          {enhancementInfo && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>Model: <span className="font-medium text-foreground">{enhancementInfo.modelName || enhancementInfo.model}</span></span>
                  <span>Length: <span className="font-medium text-foreground">{enhancementInfo.length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Characters: <span className="font-medium text-foreground">{enhancementInfo.actualCharacters} / {enhancementInfo.targetCharacters}</span></span>
                  <Badge
                    variant={enhancementInfo.actualCharacters <= enhancementInfo.targetCharacters ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {enhancementInfo.actualCharacters <= enhancementInfo.targetCharacters ? "✓ Within limit" : "⚠ Over limit"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          {/* Bottom Enhance Button - Duplicate for convenience */}
          <Button
            onClick={enhanceWithSelectedFocus}
            disabled={isEnhancing}
            size="lg"
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Enhancing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-3" />
                {enhancedPrompt.trim() ? 'Re-enhance with AI' : 'Enhance with AI'}
                {selectedFocusTypes.length > 0 && (
                  <span className="ml-2 text-sm opacity-90">
                    ({selectedFocusTypes.length} focus{selectedFocusTypes.length !== 1 ? 'es' : ''})
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 