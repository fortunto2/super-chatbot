export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'GPT-4.1',
    description: 'Advanced Azure OpenAI model with improved capabilities',
  },
  {
    id: 'chat-model-reasoning',
    name: 'O4-mini',
    description: 'Compact and efficient Azure OpenAI model',
  },
];
