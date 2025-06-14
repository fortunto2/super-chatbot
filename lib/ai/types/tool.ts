import { z } from 'zod';
import type { DataStreamWriter } from '@/lib/ai/data-stream';

export interface ToolProps {
  dataStream: {
    write: DataStreamWriter['write'];
    end: DataStreamWriter['end'];
    error: DataStreamWriter['error'];
  };
}

export interface ToolResult {
  type: 'success' | 'error';
  message: string;
  data?: any;
}

export interface ToolDefinition {
  description: string;
  parameters: z.ZodType<any>;
  execute: (params: any) => Promise<ToolResult>;
}

export type Tool = {
  new (props: ToolProps): ToolDefinition;
}; 