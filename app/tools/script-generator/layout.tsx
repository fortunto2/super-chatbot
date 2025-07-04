import React from "react";

export default function ScriptGeneratorLayout({ children }: { children: React.ReactNode }) {
  return <div className="p-4 max-w-3xl mx-auto w-full">{children}</div>;
} 