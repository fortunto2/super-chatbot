"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Shuffle, Sparkles, Loader2, Trash2, Settings, ChevronDown, ChevronUp, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { MoodboardUploader } from "@/components/ui/moodboard-uploader";
import { enhancePromptVeo3 } from "@/lib/ai/api/enhance-prompt-veo3";

interface Character {
  id: string;
  name: string;
  description: string;
  speech: string;
}

interface PromptData {
  scene: string;
  style: string;
  camera: string;
  characters: Character[];
  action: string;
  lighting: string;
  mood: string;
  language: string;
}

const PRESET_OPTIONS = {
  styles: ["Cinematic", "Documentary", "Anime", "Realistic", "Artistic", "Vintage", "Modern"],
  cameras: ["Close-up", "Wide shot", "Over-the-shoulder", "Drone view", "Handheld", "Static"],
  lighting: ["Natural", "Golden hour", "Blue hour", "Dramatic", "Soft", "Neon", "Candlelight"],
  moods: ["Peaceful", "Energetic", "Mysterious", "Romantic", "Tense", "Joyful", "Melancholic"],

  languages: ["English", "Spanish", "French", "German", "Italian", "Russian", "Japanese", "Chinese"]
};



export default function SimpleVeo3Generator() {
  const [promptData, setPromptData] = useState<PromptData>({
    scene: "", style: "", camera: "",
    characters: [{
      id: "default",
      name: "",
      description: "",
      speech: ""
    }], action: "", lighting: "", mood: "",
    language: "English" // Default fallback
  });

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [customCharacterLimit, setCustomCharacterLimit] = useState(4000);
  const [selectedModel] = useState<'gpt-4.1'>('gpt-4.1');
  const [promptHistory, setPromptHistory] = useState<Array<{
    id: string;
    timestamp: Date;
    basicPrompt: string;
    enhancedPrompt: string;
    length: string;
    model?: string;
    promptData: PromptData;
  }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enhancementInfo, setEnhancementInfo] = useState<{
    model: string;
    modelName?: string;
    length: string;
    actualCharacters: number;
    targetCharacters: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [selectedFocusTypes, setSelectedFocusTypes] = useState<Array<'character' | 'action' | 'cinematic' | 'safe'>>(['safe']); // Safe by default
  const [includeAudio, setIncludeAudio] = useState(true); // Audio enabled by default

  // Moodboard state
  const [moodboardEnabled, setMoodboardEnabled] = useState(true);
  const [moodboardImages, setMoodboardImages] = useState<Array<{
    id: string;
    url?: string;
    base64?: string;
    tags: string[];
    description: string;
    weight: number;
  }>>([]);

  // Set language based on locale after component mount
  useEffect(() => {
    const locale = window.location.pathname.split('/')[1];
    const localeToLanguage: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
      'es': 'Spanish',
      'hi': 'Hindi',
      'tr': 'Turkish'
    };
    const defaultLanguage = localeToLanguage[locale] || 'English';
    
    setPromptData(prev => ({
      ...prev,
      language: defaultLanguage
    }));
  }, []);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('veo3-prompt-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const historyWithDates = parsed.map((item: {
          id: string;
          timestamp: string;
          basicPrompt: string;
          enhancedPrompt: string;
          length: string;
          model?: string;
          promptData: PromptData;
        }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setPromptHistory(historyWithDates);
      } catch (error) {
        console.error('Failed to load prompt history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (promptHistory.length > 0) {
      localStorage.setItem('veo3-prompt-history', JSON.stringify(promptHistory));
    }
  }, [promptHistory]);

  // Auto-generate prompt when key fields change
  useEffect(() => {
    const hasValidCharacter = promptData.characters.some(char => char.name || char.description);
    // Generate prompt if we have scene OR character, don't require all fields
    if (promptData.scene || hasValidCharacter) {
      const prompt = generatePrompt(promptData);
      setGeneratedPrompt(prompt);
    }
  }, [promptData]);

  const saveToHistory = (basicPrompt: string, enhancedPrompt: string, length: string, model: string, promptData: PromptData) => {
    const newHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      basicPrompt,
      enhancedPrompt,
      length,
      model,
      promptData
    };
    
    setPromptHistory(prev => {
      const updated = [newHistoryItem, ...prev];
      // Limit to 10 items
      return updated.slice(0, 10);
    });
  };

  const loadFromHistory = (historyItem: typeof promptHistory[0]) => {
    setPromptData(historyItem.promptData);
    setGeneratedPrompt(historyItem.basicPrompt);
    setEnhancedPrompt(historyItem.enhancedPrompt);
    // Try to extract character limit from length string (e.g., "1000 chars")
    if (historyItem.length) {
      const match = historyItem.length.match(/(\d+)/);
      if (match) {
        const charLimit = parseInt(match[1]);
        if (charLimit >= 200 && charLimit <= 10000) {
          setCustomCharacterLimit(charLimit);
        }
      }
    }
  };

  const clearHistory = () => {
    setPromptHistory([]);
    localStorage.removeItem('veo3-prompt-history');
  };

  const updateField = (field: keyof PromptData, value: string) => {
    setPromptData(prev => ({ ...prev, [field]: value }));
  };

  const addCharacter = () => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: "",
      description: "",
      speech: ""
    };
    setPromptData(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter]
    }));
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setPromptData(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === id ? { ...char, [field]: value } : char
      )
    }));
  };

  const removeCharacter = (id: string) => {
    setPromptData(prev => ({
      ...prev,
      characters: prev.characters.filter(char => char.id !== id)
    }));
  };

  const generatePrompt = (data: PromptData) => {
    const parts: string[] = [];
    
    // Always start with scene if available
    if (data.scene) {
      parts.push(data.scene);
    }
    
    // Add characters if any exist
    if (data.characters.length > 0) {
      const validCharacters = data.characters.filter(char => char.name || char.description);
      if (validCharacters.length > 0) {
        const characterDescriptions = validCharacters.map(char => {
          let desc = char.description || char.name || "a character";
          if (char.speech && data.language) {
            desc += ` who says in ${data.language.toLowerCase()}: "${char.speech}"`;
          }
          return desc;
        });
        parts.push(`featuring ${characterDescriptions.join(', ')}`);
      }
    }
    
    // Add other elements if available
    if (data.action) parts.push(`${data.action}`);
    if (data.camera) parts.push(`Shot with ${data.camera.toLowerCase()}`);
    if (data.style) parts.push(`${data.style.toLowerCase()} style`);
    if (data.lighting) parts.push(`${data.lighting.toLowerCase()} lighting`);
    if (data.mood) parts.push(`${data.mood.toLowerCase()} mood`);

    // Return joined parts, or placeholder if empty
    return parts.length > 0 ? parts.join(', ') + '.' : 'Your generated prompt will appear here, or type your own prompt...';
  };

  const enhancePrompt = async (focusType?: string) => {
    // Determine which prompt to enhance based on current tab and available content
    let promptToEnhance = '';
    
    if (activeTab === 'enhance' && enhancedPrompt.trim()) {
      // If we're on the enhance tab and there's already enhanced content, use that
      promptToEnhance = enhancedPrompt.trim();
    } else if (generatedPrompt.trim()) {
      // Otherwise use the generated prompt from first tab
      promptToEnhance = generatedPrompt.trim();
    } else {
      return; // No prompt to enhance
    }
    
    setIsEnhancing(true);
    setEnhanceError("");
    
    try {
      const data = await enhancePromptVeo3({body: JSON.stringify({
        prompt: promptToEnhance,
        customLimit: customCharacterLimit,
        model: selectedModel,
        focusType: focusType, // Add focus type for specialized enhancement
        includeAudio: includeAudio,
        promptData: promptData, // Send character data for speech extraction
        ...(moodboardEnabled && moodboardImages.length > 0 ? {
          moodboard: {
            enabled: true,
            images: moodboardImages.map(img => ({
              id: img.id,
              url: img.url,
              base64: img.base64,
              tags: img.tags,
              description: img.description,
              weight: img.weight
            }))
          }
        } : {})
      })})
      
      if (data.enhancedPrompt) {
        setEnhancedPrompt(data.enhancedPrompt);
        setEnhancementInfo({
          model: data.model || selectedModel,
          modelName: data.model,
          length: `${data.characterLimit || customCharacterLimit} chars`,
          actualCharacters: data.characterCount || data.enhancedPrompt.length,
          targetCharacters: data.targetCharacters || customCharacterLimit
        });
        
        // Log structured output metadata for debugging
        if (data.metadata) {
          console.log('Structured output metadata:', {
            focusTypes: data.focusTypes,
            hasCharacterSpeech: data.metadata.hasCharacterSpeech,
            speechExtracted: data.metadata.speechExtracted,
            focusEnhancements: data.metadata.focusEnhancements,
            structuredFields: Object.keys(data.metadata.structuredData || {})
          });
        }
        
        // Save to history - use the original basic prompt for history
        const basicPromptForHistory = activeTab === 'enhance' && enhancedPrompt.trim() ? promptToEnhance : generatedPrompt;
        saveToHistory(
          basicPromptForHistory, 
          data.enhancedPrompt, 
          `${data.characterLimit || customCharacterLimit} chars`, 
          data.model || selectedModel, 
          promptData
        );
      } else {
        throw new Error('No enhanced prompt received');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      setEnhanceError(error instanceof Error ? error.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleFocusType = (focusType: 'character' | 'action' | 'cinematic' | 'safe') => {
    setSelectedFocusTypes(prev => {
      if (prev.includes(focusType)) {
        return prev.filter(type => type !== focusType);
      } else {
        return [...prev, focusType];
      }
    });
  };

  const enhanceWithSelectedFocus = async () => {
    if (selectedFocusTypes.length === 0) {
      // No focus types selected, use default enhancement
      await enhancePrompt();
    } else {
      // Use selected focus types (pass as comma-separated string)
      await enhancePrompt(selectedFocusTypes.join(','));
    }
  };



  const randomizePrompt = () => {
    const randomData: PromptData = {
      scene: "A serene lakeside at sunset",
      characters: [{
        id: "1",
        name: "Person",
        description: "A person in casual clothes",
        speech: Math.random() > 0.5 ? "Perfect evening for this!" : ""
      }],
      action: "skipping stones across the water",
      language: PRESET_OPTIONS.languages[Math.floor(Math.random() * PRESET_OPTIONS.languages.length)],
      style: PRESET_OPTIONS.styles[Math.floor(Math.random() * PRESET_OPTIONS.styles.length)],
      camera: PRESET_OPTIONS.cameras[Math.floor(Math.random() * PRESET_OPTIONS.cameras.length)],
      lighting: PRESET_OPTIONS.lighting[Math.floor(Math.random() * PRESET_OPTIONS.lighting.length)],
      mood: PRESET_OPTIONS.moods[Math.floor(Math.random() * PRESET_OPTIONS.moods.length)],

    };
    setPromptData(randomData);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    const emptyData: PromptData = {
      scene: "", style: "", camera: "",
      characters: [], action: "", lighting: "", mood: "",
      language: "English"
    };
    setPromptData(emptyData);
    setGeneratedPrompt("");
    setEnhancedPrompt("");
    setEnhanceError("");
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* VEO3 Info Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Master VEO3 Video Generation
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Learn professional prompting techniques and best practices for Google&apos;s most advanced AI video model.
            </p>
            <Link 
              href="/en/blog/veo3" 
              className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
              Read Complete VEO3 Guide
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">
            <Shuffle className="w-4 h-4 mr-2" />
            Prompt Builder
          </TabsTrigger>
          <TabsTrigger value="enhance">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Enhancement
          </TabsTrigger>
          <TabsTrigger value="history">
            <Copy className="w-4 h-4 mr-2" />
            History ({promptHistory.length}/10)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Prompt Builder */}
        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="size-5" />
                  VEO3 Prompt Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scene Description */}
                <div className="space-y-2 p-4 border-l-4 border-blue-500 bg-blue-950/20 rounded-lg">
                  <Label htmlFor="scene" className="flex items-center gap-2 text-blue-300 font-medium">
                    🎬 Scene Description
                  </Label>
                  <Textarea
                    id="scene"
                    placeholder="Describe the main scene (e.g., A cozy coffee shop in the morning)"
                    value={promptData.scene}
                    onChange={(e) => updateField("scene", e.target.value)}
                    className="min-h-[80px] border-blue-600 bg-blue-950/10 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                {/* Characters */}
                <div className="space-y-4 p-4 border-l-4 border-green-500 bg-green-950/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-green-300 font-medium">
                      👥 Characters ({promptData.characters.length})
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCharacter}
                      className="text-xs border-green-600 text-green-300 hover:bg-green-950/30"
                    >
                      + Add Character
                    </Button>
                  </div>
                  
                  {promptData.characters.length === 0 && (
                    <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                      No characters added yet. Click &ldquo;Add Character&rdquo; to start.
                    </div>
                  )}
                  
                  {promptData.characters.map((character, index) => (
                    <div key={character.id} className="p-4 border border-green-600 bg-green-950/10 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Character {index + 1}</Label>
                        {promptData.characters.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCharacter(character.id)}
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor={`char-name-${character.id}`} className="text-xs">Name</Label>
                          <input
                            id={`char-name-${character.id}`}
                            type="text"
                            placeholder="Character name (e.g., Sarah, Vendor)"
                            value={character.name}
                            onChange={(e) => updateCharacter(character.id, "name", e.target.value)}
                            className="w-full px-3 py-2 border border-green-600 bg-green-950/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`char-desc-${character.id}`} className="text-xs">Description</Label>
                          <Textarea
                            id={`char-desc-${character.id}`}
                            placeholder="Describe the character (e.g., A young woman with wavy brown hair)"
                            value={character.description}
                            onChange={(e) => updateCharacter(character.id, "description", e.target.value)}
                            className="min-h-[60px] text-sm border-green-600 bg-green-950/10 focus:border-green-400 focus:ring-green-400"
                          />
                        </div>
                        
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`char-speech-${character.id}`} className="text-xs">Speech/Dialogue</Label>
                            {character.speech && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                🎙️ Has Voice
                              </Badge>
                            )}
                          </div>
                          <Textarea
                            id={`char-speech-${character.id}`}
                            placeholder="What they say (e.g., Hello there! or Привет!)"
                            value={character.speech}
                            onChange={(e) => updateCharacter(character.id, "speech", e.target.value)}
                            className={`min-h-[50px] text-sm border-green-600 bg-green-950/10 focus:border-green-400 focus:ring-green-400 ${character.speech ? 'border-blue-400 bg-blue-950/20' : ''}`}
                          />
                          {character.speech && (
                                                          <div className="mt-1 text-xs text-blue-300 flex items-center gap-1">
                              <span>🔊</span>
                              <span>This dialogue will be highlighted in the enhanced prompt</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action */}
                <div className="space-y-2 p-4 border-l-4 border-orange-500 bg-orange-950/20 rounded-lg">
                  <Label htmlFor="action" className="flex items-center gap-2 text-orange-300 font-medium">
                    🎭 Action/Activity
                  </Label>
                  <Textarea
                    id="action"
                    placeholder="What are they doing? (e.g., slowly sipping coffee while turning pages)"
                    value={promptData.action}
                    onChange={(e) => updateField("action", e.target.value)}
                    className="border-orange-600 bg-orange-950/10 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                              {/* Language */}
              <div className="space-y-2 p-4 border-l-4 border-yellow-500 bg-yellow-950/20 rounded-lg">
                <Label htmlFor="language" className="flex items-center gap-2 text-yellow-300 font-medium">
                  🗣️ Speech Language
                </Label>
                <div className="space-y-2">
                  <input
                    id="language"
                    type="text"
                    placeholder="Enter language (e.g., English, Russian, Spanish...)"
                    value={promptData.language}
                    onChange={(e) => updateField("language", e.target.value)}
                    className="w-full px-3 py-2 border border-yellow-600 bg-yellow-950/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Label className="text-xs text-yellow-300">Quick select:</Label>
                    {PRESET_OPTIONS.languages.map((language) => (
                      <Badge
                        key={language}
                        variant={promptData.language === language ? "default" : "outline"}
                        className={`cursor-pointer text-xs ${
                          promptData.language === language 
                            ? "bg-yellow-600 text-white" 
                            : "border-yellow-600 text-yellow-300 hover:bg-yellow-950/30"
                        }`}
                        onClick={() => updateField("language", language)}
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

                {/* Visual Style */}
                <div className="space-y-2 p-4 border-l-4 border-purple-500 bg-purple-950/20 rounded-lg">
                  <Label htmlFor="style" className="flex items-center gap-2 text-purple-300 font-medium">
                    🎨 Visual Style
                  </Label>
                  <div className="space-y-2">
                    <input
                      id="style"
                      type="text"
                      placeholder="Enter visual style (e.g., Cinematic, Documentary, Anime...)"
                      value={promptData.style}
                      onChange={(e) => updateField("style", e.target.value)}
                      className="w-full px-3 py-2 border border-purple-600 bg-purple-950/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Label className="text-xs text-purple-300">Quick select:</Label>
                      {PRESET_OPTIONS.styles.map((style) => (
                        <Badge
                          key={style}
                          variant={promptData.style === style ? "default" : "outline"}
                          className={`cursor-pointer text-xs ${
                            promptData.style === style 
                              ? "bg-purple-600 text-white" 
                              : "border-purple-600 text-purple-300 hover:bg-purple-950/30"
                          }`}
                          onClick={() => updateField("style", style)}
                        >
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Camera Angle */}
                <div className="space-y-2 p-4 border-l-4 border-indigo-500 bg-indigo-950/20 rounded-lg">
                  <Label htmlFor="camera" className="flex items-center gap-2 text-indigo-300 font-medium">
                    📹 Camera Angle
                  </Label>
                  <div className="space-y-2">
                    <input
                      id="camera"
                      type="text"
                      placeholder="Enter camera angle (e.g., Close-up, Wide shot, Drone view...)"
                      value={promptData.camera}
                      onChange={(e) => updateField("camera", e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-600 bg-indigo-950/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Label className="text-xs text-indigo-300">Quick select:</Label>
                      {PRESET_OPTIONS.cameras.map((camera) => (
                        <Badge
                          key={camera}
                          variant={promptData.camera === camera ? "default" : "outline"}
                          className={`cursor-pointer text-xs ${
                            promptData.camera === camera 
                              ? "bg-indigo-600 text-white" 
                              : "border-indigo-600 text-indigo-300 hover:bg-indigo-950/30"
                          }`}
                          onClick={() => updateField("camera", camera)}
                        >
                          {camera}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lighting */}
                <div className="space-y-2 p-4 border-l-4 border-pink-500 bg-pink-950/20 rounded-lg">
                  <Label htmlFor="lighting" className="flex items-center gap-2 text-pink-300 font-medium">
                    💡 Lighting
                  </Label>
                  <div className="space-y-2">
                    <input
                      id="lighting"
                      type="text"
                      placeholder="Enter lighting type (e.g., Natural, Golden hour, Dramatic...)"
                      value={promptData.lighting}
                      onChange={(e) => updateField("lighting", e.target.value)}
                      className="w-full px-3 py-2 border border-pink-600 bg-pink-950/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Label className="text-xs text-pink-300">Quick select:</Label>
                      {PRESET_OPTIONS.lighting.map((light) => (
                        <Badge
                          key={light}
                          variant={promptData.lighting === light ? "default" : "outline"}
                          className={`cursor-pointer text-xs ${
                            promptData.lighting === light 
                              ? "bg-pink-600 text-white" 
                              : "border-pink-600 text-pink-300 hover:bg-pink-950/30"
                          }`}
                          onClick={() => updateField("lighting", light)}
                        >
                          {light}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mood */}
                <div className="space-y-2 p-4 border-l-4 border-rose-500 bg-rose-950/20 rounded-lg">
                  <Label htmlFor="mood" className="flex items-center gap-2 text-rose-300 font-medium">
                    🌟 Mood
                  </Label>
                  <div className="space-y-2">
                    <input
                      id="mood"
                      type="text"
                      placeholder="Enter mood (e.g., Peaceful, Energetic, Mysterious...)"
                      value={promptData.mood}
                      onChange={(e) => updateField("mood", e.target.value)}
                      className="w-full px-3 py-2 border border-rose-600 bg-rose-950/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Label className="text-xs text-rose-300">Quick select:</Label>
                      {PRESET_OPTIONS.moods.map((mood) => (
                        <Badge
                          key={mood}
                          variant={promptData.mood === mood ? "default" : "outline"}
                          className={`cursor-pointer text-xs ${
                            promptData.mood === mood 
                              ? "bg-rose-600 text-white" 
                              : "border-rose-600 text-rose-300 hover:bg-rose-950/30"
                          }`}
                          onClick={() => updateField("mood", mood)}
                        >
                          {mood}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>


              </CardContent>
            </Card>

            {/* Right: Generated Prompt Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Generated Prompt
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Preview
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Textarea with Copy button in top-right - Now Editable */}
                  <div className="relative">
                    <Textarea
                      value={generatedPrompt}
                      onChange={(e) => setGeneratedPrompt(e.target.value)}
                      placeholder="Your generated prompt will appear here, or type your own prompt..."
                      className="min-h-[400px] font-mono text-sm resize-none pr-20"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setGeneratedPrompt('')}
                        disabled={!generatedPrompt}
                        className="h-8 w-8 p-0 hover:bg-background/80"
                        title="Clear text"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedPrompt)}
                        disabled={!generatedPrompt}
                        className="h-8 w-8 p-0 hover:bg-background/80"
                        title={copied ? "Copied!" : "Copy to clipboard"}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button onClick={randomizePrompt} variant="outline" className="flex-1">
                        <Shuffle className="w-4 h-4 mr-2" />
                        Randomize All
                      </Button>
                      <Button onClick={clearAll} variant="outline" className="flex-1">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>

                    {/* Navigate to AI Enhancement - Large and Prominent */}
                    <Button 
                      onClick={() => {
                        setActiveTab("enhance");
                        // Automatically trigger enhancement after tab switch
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
                      <Sparkles className="w-6 h-6 mr-3" />
                      Continue to AI Enhancement →
                    </Button>

                    {/* Moodboard Section */}
                    <div className="space-y-3">
                      <MoodboardUploader
                        enabled={true}
                        onEnabledChange={setMoodboardEnabled}
                        onImagesChange={setMoodboardImages}
                        maxImages={3}
                        value={moodboardImages}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: AI Enhancement */}
        <TabsContent value="enhance">
          <div className="max-w-4xl mx-auto">
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
                    disabled={(!generatedPrompt && !enhancedPrompt) || isEnhancing}
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
                            <Label className="text-xs text-muted-foreground">Character Limit</Label>
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
                              onChange={(e) => setCustomCharacterLimit(Number(e.target.value))}
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
                          <Label className="text-xs text-muted-foreground">AI Model</Label>
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
                      onChange={(e) => setEnhancedPrompt(e.target.value)}
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
                    disabled={(!generatedPrompt && !enhancedPrompt) || isEnhancing}
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
          </div>
        </TabsContent>

        {/* Tab 3: History */}
        <TabsContent value="history">
          {promptHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="w-5 h-5" />
                    Recent Prompts History
                    <Badge variant="outline" className="ml-2">
                      {promptHistory.length}/10
                    </Badge>
                  </CardTitle>
                  <Button
                    onClick={clearHistory}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promptHistory.slice(0, 10).map((historyItem) => (
                    <div key={historyItem.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs text-muted-foreground">
                          {historyItem.timestamp.toLocaleString()}
                        </p>
                        <div className="flex gap-1">
                          {historyItem.model && (
                            <Badge variant="outline" className="text-xs">
                              {historyItem.model}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {historyItem.length}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm mb-3 line-clamp-3">
                        {historyItem.basicPrompt.length > 120 
                          ? historyItem.basicPrompt.substring(0, 120) + '...' 
                          : historyItem.basicPrompt}
                      </p>
                      <Button
                        onClick={() => loadFromHistory(historyItem)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Load This Version
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Copy className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate and enhance prompts to see them here
                </p>
                <Button variant="outline" onClick={() => setActiveTab("builder")}>
                  Start Building
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 