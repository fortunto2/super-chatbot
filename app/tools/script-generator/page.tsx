"use client";

import { Suspense } from "react";
import ScriptGeneratorForm from "./components/script-generator-form";
import ScriptGenerationResult from "./components/script-generation-result";
import { useScriptGenerator } from "./hooks/use-script-generator";
import { Separator } from "@/components/ui/separator";
import { Wand2, Sparkles } from "lucide-react";

export default function ScriptGeneratorPage() {
  const scriptGenerator = useScriptGenerator();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="p-3 rounded-full bg-green-100">
            <Wand2 className="size-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            AI Script Generator
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Generate detailed scripts and scenarios in Markdown format using AI. Instantly edit and refine your script with a powerful Markdown editor.
        </p>
        {/* Feature highlights */}
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Sparkles className="size-4" />
            <span>Markdown Output</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wand2 className="size-4" />
            <span>Script Structuring</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main content grid */}
      <div className="flex flex-col gap-2">
        {/* Left column - Input Form */}
        <div className="space-y-6">
          <Suspense fallback={<div>Loading form...</div>}>
            <ScriptGeneratorForm
              generateScript={scriptGenerator.generateScript}
              loading={scriptGenerator.loading}
            />
          </Suspense>
        </div>
        {/* Right column - Results */}
        <div className="space-y-6">
          <Suspense fallback={<div>Loading editor...</div>}>
            <ScriptGenerationResult
              script={scriptGenerator.script}
              setScript={scriptGenerator.setScript}
              editorRef={scriptGenerator.editorRef}
              loading={scriptGenerator.loading}
            />
          </Suspense>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 border-t pt-8">
        <p>
          Powered by <strong>SuperDuperAI</strong> 
          Scripts are generated using advanced AI models 
          Edit and export your scripts in Markdown for maximum flexibility
        </p>
      </div>
    </div>
  );
} 