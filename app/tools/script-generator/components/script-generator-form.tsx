"use client";
import React, { useState } from "react";

interface ScriptGeneratorFormProps {
  generateScript: (prompt: string) => Promise<void>;
  loading: boolean;
}

export default function ScriptGeneratorForm({ generateScript, loading }: ScriptGeneratorFormProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    generateScript(prompt);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <input
        type="text"
        className="flex-1 border rounded px-3 py-2"
        placeholder="Describe your script..."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || !prompt.trim()}
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
} 