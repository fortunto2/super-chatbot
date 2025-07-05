"use client";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { useState, useCallback, useRef } from "react";

export function useScriptGenerator() {
  const [script, setScript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<MDXEditorMethods>(null);

  const generateScript = useCallback(async (prompt: string) => {
    setLoading(true);
    try {
      // TODO: заменить на реальный API вызов
      const response = await fetch("/api/generate/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setScript(data.script || "");
      editorRef.current?.setMarkdown(data.script || "");
    } catch (e) {
      setScript("Error generating script");
    } finally {
      setLoading(false);
    }
  }, []);

  return { script, setScript, loading, generateScript, editorRef };
} 