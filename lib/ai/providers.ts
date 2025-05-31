import { customProvider } from 'ai';
import {
  chatModel,
} from './models.test';
import { createAzure } from '@ai-sdk/azure';

// Создаем настроенный экземпляр провайдера Azure
const customAzure = createAzure({
  // API ключ для Azure OpenAI
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  // имя ресурса в Azure
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  // или используем полный URL в качестве baseURL
  baseURL:
    !process.env.AZURE_OPENAI_RESOURCE_NAME && process.env.AZURE_OPENAI_ENDPOINT
      ? process.env.AZURE_OPENAI_ENDPOINT
      : undefined,
  // Версия API, используем переменную окружения или значение по умолчанию
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
  // Добавляем дополнительные заголовки
  headers: {
    'x-ms-azure-region': process.env.AZURE_OPENAI_REGION || 'eastus2',
  },
});

// Создаем модели Azure с разными deployment name
const mainModel = customAzure(
  process.env.AZURE_GPT41_DEPLOYMENT_NAME || 'gpt-4.1',
);
const reasonModel = customAzure(
  process.env.AZURE_O4MINI_DEPLOYMENT_NAME || 'o4-mini',
);

// Создаем базовый провайдер
const provider = customProvider({
  languageModels: {
    'chat-model': chatModel,
    'chat-model-reasoning': reasonModel,
    'title-model': chatModel,
    'artifact-model': chatModel,
  },
});

// Расширяем провайдер методом languageModel для обратной совместимости
const myProvider = provider as any;

// Добавляем метод для получения модели по ID
myProvider.languageModel = (modelId: string) => {
  if (modelId === 'chat-model-reasoning') {
    return reasonModel;
  }
  return mainModel;
};

export { myProvider };
