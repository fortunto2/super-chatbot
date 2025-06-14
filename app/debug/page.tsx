'use client';

import { useState } from 'react';
import { MessageReasoningDebug } from '@/components/message-reasoning-debug';

export default function DebugPage() {
  const [exampleText, setExampleText] = useState(`<think>
  Это тестовый текст рассуждений внутри тега think.
  Он должен быть распознан и отображен как рассуждение.
  
  Проверяем, работает ли извлечение тега think корректно.
</think>

А этот текст должен остаться как основной контент сообщения.`);

  const mockMessage = {
    id: 'test-message',
    role: 'assistant',
    content: exampleText,
    parts: [
      { type: 'text', text: exampleText }
    ]
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Тестовая страница отладки рассуждений</h1>
      
      <div className="p-4 border rounded mb-6">
        <h2 className="text-lg font-bold mb-4">Тест отображения рассуждений</h2>
        
        <div className="mb-4">
          <h3 className="text-md font-semibold">Редактировать текст:</h3>
          <textarea 
            className="w-full h-48 p-2 text-xs font-mono bg-gray-100 border rounded"
            value={exampleText}
            onChange={(e) => setExampleText(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <h3 className="text-md font-semibold">Компонент рассуждений с текстом:</h3>
          <MessageReasoningDebug 
            isLoading={false}
            reasoning={exampleText}
            message={mockMessage}
          />
        </div>
      </div>
      
      <div className="p-4 border rounded mb-6">
        <h2 className="text-lg font-bold mb-4">Симуляция разных форматов</h2>
        
        <div className="mb-4">
          <h3 className="text-md font-semibold">Рассуждения как отдельное свойство:</h3>
          <MessageReasoningDebug 
            isLoading={false}
            reasoning="Это текст рассуждений как отдельное свойство"
            message={{
              id: 'test-reason-prop',
              role: 'assistant',
              reasoning: "Это текст рассуждений как отдельное свойство"
            }}
          />
        </div>
        
        <div className="mb-4">
          <h3 className="text-md font-semibold">Рассуждения как часть сообщения:</h3>
          <MessageReasoningDebug 
            isLoading={false}
            reasoning="Текст не важен"
            message={{
              id: 'test-parts',
              role: 'assistant',
              parts: [
                { type: 'reasoning', reasoning: "Это рассуждение в части сообщения" }
              ]
            }}
          />
        </div>
      </div>
      
      <div className="p-4 border rounded">
        <h2 className="text-lg font-bold mb-4">Вывод текущих логов</h2>
        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-48">
          {`
Processing chat request with model: chat-model-reasoning
Using reasoning model: true
streamText configuration: {
  selectedModel: 'chat-model-reasoning',
  isReasoningModel: true,
  experimentalOptions: {
    experimental_reasoning: true,
    experimental_sendReasoning: true,
    sendReasoning: true
  },
  resultKeys: [
    'warningsPromise',
    'usagePromise',
    'finishReasonPromise',
    'providerMetadataPromise',
    'textPromise',
    'reasoningPromise',
    'reasoningDetailsPromise',
    'sourcesPromise',
    'filesPromise',
    'toolCallsPromise',
    'toolResultsPromise',
    'requestPromise',
    'responsePromise',
    'stepsPromise',
    'output',
    'addStream',
    'closeStream',
    'baseStream'
  ]
}
Sending response with reasoning option: { sendReasoning: true, selectedChatModel: 'chat-model-reasoning' }

Message part 0: {"type":"step-start","partKeys":["type"],"hasTextDelta":false,"hasText":false}
Message part 1: {"type":"text","partKeys":["type","text"],"hasTextDelta":false,"hasText":true}
          `}
        </pre>
      </div>
    </div>
  );
} 