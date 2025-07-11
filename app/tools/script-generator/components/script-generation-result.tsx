"use client";
import React from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { jsPDF } from "jspdf";
import { marked } from "marked";
import { CopyIcon, DownloadIcon, TrashIcon, InfoIcon, FileIcon } from "@/components/icons";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ScriptGenerationResultProps {
  script: string;
  setScript: (v: string) => void;
  editorRef: React.RefObject<MDXEditorMethods>;
  loading?: boolean;
}


export default function ScriptGenerationResult({ script, setScript, editorRef, loading }: ScriptGenerationResultProps) {

  const handleCopy = async () => {
    if (!script) return;
    await navigator.clipboard.writeText(script);
  };

  const handleClear = () => {
    setScript("");
    if (editorRef.current) editorRef.current.setMarkdown("");
  };

  const handleCopyHtml = async () => {
    const html = markdownToHtml(script);
    await navigator.clipboard.writeText(html);
  };

  if (!script && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Script</CardTitle>
          <CardDescription>
            Your generated script will appear here after processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <svg className="size-8 text-gray-300 dark:text-gray-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter a prompt and click &quot;Generate Script&quot; to get started.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="size-5 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Generating Script...
          </CardTitle>
          <CardDescription>
            AI is generating your script. This usually takes a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <svg className="size-8 text-blue-500 animate-pulse mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while your script is being created...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!script) return null;

  const actions = [
    {
      icon: <CopyIcon size={18} />,
      bg: "bg-blue-600 hover:bg-blue-700",
      onClick: handleCopy,
      tooltip: "Copy Markdown",
    },
    {
      icon: <DownloadIcon size={18} />,
      bg: "bg-green-600 hover:bg-green-700",
      onClick: () => handleDownload(script),
      tooltip: "Download .md",
    },
   
    {
      icon: <InfoIcon size={18} />,
      bg: "bg-purple-600 hover:bg-purple-700",
      onClick: handleCopyHtml,
      tooltip: "Copy as HTML",
    },
    {
      icon: <FileIcon size={18} />,
      bg: "bg-red-600 hover:bg-red-700",
      onClick: () => handleExportPdf(script),
      tooltip: "Export to PDF",
    },
    {
      icon: <TrashIcon size={18} />,
      bg: "bg-gray-400 hover:bg-gray-500",
      onClick: handleClear,
      tooltip: "Clear",
    },
  ];

  return (
    <div className="mt-4">
      <TooltipProvider>
        <div className="flex flex-wrap gap-3 mb-2">
          {actions.map((action, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  onClick={action.onClick}
                  className={`size-8 flex items-center justify-center rounded-full text-white transition-colors ${action.bg}`}
                  type="button"
                >
                  {action.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent>{action.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <h2 className="text-lg font-semibold mb-2">Generated Script</h2>
      <MarkdownEditor
        markdown={script}
        onChange={setScript}
        editorRef={editorRef}
      />
    </div>
  );
} 

function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*)\*/gim, '<i>$1</i>')
    .replace(/\n$/gim, '<br />')
    .replace(/\n/g, '<br />');
}

const handleDownload = (script: string) => {
  const blob = new Blob([script], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "script.md";
  a.click();
  URL.revokeObjectURL(url);
};

 // Export to PDF с максимально приближённым к сценарию оформлением
 //TODO:Починить неправильное отображение текста в пдф
 const handleExportPdf = (script: string) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 32;
  const maxWidth = 540;
  let y = margin + 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  // Парсим markdown в tokens
  const tokens = marked.lexer(script);
  let prevType = '';
  tokens.forEach(token => {
    // Перенос между блоками
    if (prevType && token.type !== 'space' && token.type !== 'hr') {
      y += 6;
    }
    prevType = token.type;
    if (token.type === "heading" && token.text) {
      const size = token.depth === 1 ? 22 : token.depth === 2 ? 18 : 16;
      doc.setFontSize(size);
      doc.setFont("helvetica", "bold");
      doc.text(String(token.text ?? ''), margin, y);
      y += size + 4;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
    } else if (token.type === "paragraph" && token.text) {
      // Горизонтальная линия (*** или ---)
      if (/^\*\*\*$|^---$/.test(String(token.text ?? '').trim())) {
        doc.setDrawColor(180);
        doc.setLineWidth(1);
        doc.line(margin, y, margin + maxWidth, y);
        y += 12;
      } else {
        // Диалоги Name: "..."
        const dialogueMatch = String(token.text ?? '').match(/^([A-Za-z0-9\- ]+):\s*"([^"]+)"$/);
        if (dialogueMatch) {
          doc.setFont("helvetica", "bold");
          doc.text(`${String(dialogueMatch[1] ?? '')}:`, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(` "${String(dialogueMatch[2] ?? '')}"`, margin + doc.getTextWidth(`${String(dialogueMatch[1] ?? '')}:`), y);
          y += 16;
        } else {
          // Жирный текст внутри параграфа
          const strongRegex = /\*\*(.+?)\*\*/g;
          let lastIndex = 0;
          let match;
          let x = margin;
          const localY = y;
          const text = String(token.text ?? '');
          while ((match = strongRegex.exec(text)) !== null) {
            const before = text.slice(lastIndex, match.index);
            if (before) {
              doc.setFont("helvetica", "normal");
              doc.text(String(before ?? ''), x, localY);
              x += doc.getTextWidth(String(before ?? ''));
            }
            doc.setFont("helvetica", "bold");
            doc.text(String(match[1] ?? ''), x, localY);
            x += doc.getTextWidth(String(match[1] ?? ''));
            doc.setFont("helvetica", "normal");
            lastIndex = match.index + match[0].length;
          }
          const after = text.slice(lastIndex);
          if (after) {
            doc.setFont("helvetica", "normal");
            doc.text(String(after ?? ''), x, localY);
          }
          y += 18;
        }
      }
    } else if (token.type === "list" && Array.isArray(token.items)) {
      (token.items as { text?: string }[]).forEach(item => {
        const itemText = String(item.text ?? "");
        // Диалог в списке
        const dialogueMatch = itemText.match(/^([A-Za-z0-9\- ]+):\s*"([^"]+)"$/);
        if (dialogueMatch) {  
          doc.setFont("helvetica", "bold");
          doc.text(`${String(dialogueMatch[1] ?? '')}:`, margin + 18, y);
          doc.setFont("helvetica", "normal");
          doc.text(` "${String(dialogueMatch[2] ?? '')}"`, margin + 18 + doc.getTextWidth(`${String(dialogueMatch[1] ?? '')}:`), y);
          y += 16;
        } else {
          doc.text(`• ${itemText}`, margin + 18, y);
          y += 16;
        }
      });
    } else if (token.type === "hr") {
      doc.setDrawColor(180);
      doc.setLineWidth(1);
      doc.line(margin, y, margin + maxWidth, y);
      y += 12;
    } else if (token.type === "blockquote" && token.text) {
      doc.setFontSize(12);
      doc.setTextColor(100);
      let lines = (doc.splitTextToSize(String(token.text ?? ''), maxWidth - 24) || []);
      lines = Array.isArray(lines) && lines.length > 0 ? lines.map(l => typeof l === 'string' ? l : '').map(l => l ?? '').filter(l => typeof l === 'string') : [''];
      doc.text(lines, margin + 24, y);
      y += (lines.length || 1) * 16;
      doc.setTextColor(0);
    } else if (token.type === "code" && token.text) {
      doc.setFont("courier", "normal");
      doc.setFillColor(240,240,240);
      let lines = (doc.splitTextToSize(String(token.text ?? ''), maxWidth - 24) || []);
      lines = Array.isArray(lines) && lines.length > 0 ? lines.map(l => typeof l === 'string' ? l : '').map(l => l ?? '').filter(l => typeof l === 'string') : [''];
      doc.rect(margin + 12, y - 12, maxWidth - 24, (lines.length || 1) * 16 + 12, "F");
      doc.text(lines, margin + 18, y);
      y += (lines.length || 1) * 16 + 16;
      doc.setFont("helvetica", "normal");
    } else if (token.type === "space") {
      y += 8;
    }
    // Обработка строк, начинающихся с * (но не markdown-список)
    else if (token.raw && /^\* /.test(token.raw)) {
      const itemText = String(token.raw ?? '').replace(/^\* /, '• ');
      doc.text(itemText, margin + 18, y);
      y += 16;
    }
    // Обычный текст (fallback)
    else if (token.raw) {
      let lines = (doc.splitTextToSize(String(token.raw ?? ''), maxWidth) || []);
      lines = Array.isArray(lines) && lines.length > 0 ? lines.map(l => typeof l === 'string' ? l : '').map(l => l ?? '').filter(l => typeof l === 'string') : [''];
      doc.text(lines, margin, y);
      y += (lines.length || 1) * 16;
    }
  });
  doc.save("script.pdf");
};