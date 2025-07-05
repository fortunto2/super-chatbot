'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface DebugParametersProps {
  data: any;
  title?: string;
}

export function DebugParameters({ data, title = 'Debug: Generation Parameters' }: DebugParametersProps) {
  const [showDebug, setShowDebug] = useState(false);

  if (!data) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-4">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center gap-2 text-sm font-medium mb-3 hover:text-gray-700 transition-colors w-full"
      >
        <span className={`transform transition-transform ${showDebug ? 'rotate-90' : ''}`}>
          ▶
        </span>
        {title}
      </button>
      
      {showDebug && (
        <div className="mt-2 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                toast.success('Parameters copied to clipboard');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              📋 Copy Parameters
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 