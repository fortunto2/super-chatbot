import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { isTestEnvironment } from '@/lib/constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Создаем настроенный экземпляр провайдера Azure
const customAzure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  baseURL:
    !process.env.AZURE_OPENAI_RESOURCE_NAME && process.env.AZURE_OPENAI_ENDPOINT
      ? process.env.AZURE_OPENAI_ENDPOINT
      : undefined,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
  headers: {
    'x-ms-azure-region': process.env.AZURE_OPENAI_REGION || 'eastus2',
  },
});

// Создаем модели Azure
const mainModel = customAzure(
  process.env.AZURE_GPT41_DEPLOYMENT_NAME || 'gpt-4.1',
);
const o4MiniModel = customAzure(
  process.env.AZURE_O4MINI_DEPLOYMENT_NAME || 'o4-mini',
);

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': mainModel,
        'chat-model-reasoning': wrapLanguageModel({
          model: o4MiniModel,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': mainModel,
        'artifact-model': mainModel,
      },
    });
