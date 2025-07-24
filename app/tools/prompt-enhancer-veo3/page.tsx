"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import { PromptBuilder } from "./components/PromptBuilder";
import { PromptPreview } from "./components/PromptPreview";
import { AIEnhancement } from "./components/AIEnhancement";
import { PromptHistory } from "./components/PromptHistory";
import { Character, PromptData } from "./types";
import { enhancePromptVeo3 } from "@/lib/ai/api/enhance-prompt-veo3";

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
    characters: [{ id: "default", name: "", description: "", speech: "" }],
    action: "", lighting: "", mood: "", language: "English"
  });
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [customCharacterLimit, setCustomCharacterLimit] = useState(4000);
  const [selectedModel] = useState<'gpt-4.1'>('gpt-4.1');
  const [promptHistory, setPromptHistory] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enhancementInfo, setEnhancementInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [selectedFocusTypes, setSelectedFocusTypes] = useState<Array<'character' | 'action' | 'cinematic' | 'safe'>>(['safe']);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [moodboardEnabled, setMoodboardEnabled] = useState(true);
  const [moodboardImages, setMoodboardImages] = useState<any[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('veo3-prompt-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setPromptHistory(historyWithDates);
      } catch (error) {
        console.error('Failed to load prompt history:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (promptHistory.length > 0) {
      localStorage.setItem('veo3-prompt-history', JSON.stringify(promptHistory));
    }
  }, [promptHistory]);

  useEffect(() => {
    const hasValidCharacter = promptData.characters.some(char => char.name || char.description);
    if (promptData.scene || hasValidCharacter) {
      const prompt = generatePrompt(promptData);
      setGeneratedPrompt(prompt);
    }
  }, [promptData]);

  const generatePrompt = (data: PromptData) => {
    const parts: string[] = [];
    if (data.scene) parts.push(data.scene);
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
    if (data.action) parts.push(`${data.action}`);
    if (data.camera) parts.push(`Shot with ${data.camera.toLowerCase()}`);
    if (data.style) parts.push(`${data.style.toLowerCase()} style`);
    if (data.lighting) parts.push(`${data.lighting.toLowerCase()} lighting`);
    if (data.mood) parts.push(`${data.mood.toLowerCase()} mood`);
    return parts.length > 0 ? parts.join(', ') + '.' : 'Your generated prompt will appear here, or type your own prompt...';
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
      return updated.slice(0, 10);
    });
  };

  const loadFromHistory = (historyItem: any) => {
    setPromptData(historyItem.promptData);
    setGeneratedPrompt(historyItem.basicPrompt);
    setEnhancedPrompt(historyItem.enhancedPrompt);
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

  const enhancePrompt = async (focusType?: string) => {
    let promptToEnhance = '';
    if (activeTab === 'enhance' && enhancedPrompt.trim()) {
      promptToEnhance = enhancedPrompt.trim();
    } else if (generatedPrompt.trim()) {
      promptToEnhance = generatedPrompt.trim();
    } else {
      return;
    }
    setIsEnhancing(true);
    setEnhanceError("");
    try {
      const data = await enhancePromptVeo3({body: JSON.stringify({
        prompt: promptToEnhance,
        customLimit: customCharacterLimit,
        model: selectedModel,
        focusType: focusType,
        includeAudio: includeAudio,
        promptData: promptData,
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
        if (data.metadata) {
          console.log('Structured output metadata:', {
            focusTypes: data.focusTypes,
            hasCharacterSpeech: data.metadata.hasCharacterSpeech,
            speechExtracted: data.metadata.speechExtracted,
            focusEnhancements: data.metadata.focusEnhancements,
            structuredFields: Object.keys(data.metadata.structuredData || {})
          });
        }
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
      await enhancePrompt();
    } else {
      await enhancePrompt(selectedFocusTypes.join(','));
    }
  };

  useEffect(() => {
    const locale = window.location.pathname.split('/')[1];
    const localeToLanguage: Record<string, string> = {
      'en': 'English', 'ru': 'Russian', 'es': 'Spanish', 'hi': 'Hindi', 'tr': 'Turkish'
    };
    const defaultLanguage = localeToLanguage[locale] || 'English';
    setPromptData(prev => ({ ...prev, language: defaultLanguage }));
  }, []);

  const addCharacter = () => {
    setPromptData(prev => ({
      ...prev,
      characters: [...prev.characters, { id: Date.now().toString(), name: "", description: "", speech: "" }]
    }));
  };
  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setPromptData(prev => ({
      ...prev,
      characters: prev.characters.map(char => char.id === id ? { ...char, [field]: value } : char)
    }));
  };
  const removeCharacter = (id: string) => {
    setPromptData(prev => ({
      ...prev,
      characters: prev.characters.filter(char => char.id !== id)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Info Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Master VEO3 Video Generation</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Learn professional prompting techniques and best practices for Google&apos;s most advanced AI video model.
            </p>
          </div>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Prompt Builder</TabsTrigger>
          <TabsTrigger value="enhance">AI Enhancement</TabsTrigger>
          <TabsTrigger value="history">History ({promptHistory.length}/10)</TabsTrigger>
        </TabsList>
        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PromptBuilder
              promptData={promptData}
              setPromptData={setPromptData}
              addCharacter={addCharacter}
              updateCharacter={updateCharacter}
              removeCharacter={removeCharacter}
              PRESET_OPTIONS={PRESET_OPTIONS}
              moodboardEnabled={moodboardEnabled}
              setMoodboardEnabled={setMoodboardEnabled}
              moodboardImages={moodboardImages}
              setMoodboardImages={setMoodboardImages}
            />
            <PromptPreview
              generatedPrompt={generatedPrompt}
              setGeneratedPrompt={setGeneratedPrompt}
              randomizePrompt={randomizePrompt}
              clearAll={clearAll}
              copyToClipboard={copyToClipboard}
              copied={copied}
              setActiveTab={setActiveTab}
              isEnhancing={isEnhancing}
              enhancePrompt={enhancePrompt}
            />
          </div>
        </TabsContent>
        <TabsContent value="enhance">
          <AIEnhancement
            enhancedPrompt={enhancedPrompt}
            setEnhancedPrompt={setEnhancedPrompt}
            enhanceWithSelectedFocus={enhanceWithSelectedFocus}
            isEnhancing={isEnhancing}
            enhanceError={enhanceError}
            enhancementInfo={enhancementInfo}
            selectedFocusTypes={selectedFocusTypes}
            toggleFocusType={toggleFocusType}
            includeAudio={includeAudio}
            setIncludeAudio={setIncludeAudio}
            customCharacterLimit={customCharacterLimit}
            setCustomCharacterLimit={setCustomCharacterLimit}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            copied={copied}
            copyToClipboard={copyToClipboard}
          />
        </TabsContent>
        <TabsContent value="history">
          <PromptHistory
            promptHistory={promptHistory}
            loadFromHistory={loadFromHistory}
            clearHistory={clearHistory}
            setActiveTab={setActiveTab}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 