// lib/api-routes.ts
// Only Next.js backend API endpoints

export const API_NEXT_ROUTES = {
    GENERATE_IMAGE: '/api/generate/image',
    GENERATE_VIDEO: '/api/generate/video',
    FILE: (id: string) => `/api/file/${id}`,
    FILE_UPLOAD: '/api/file/upload',
    PROJECT: (id: string) => `/api/project/${id}`,
    PROJECT_VIDEO: '/api/project/video',
    ENHANCE_PROMPT: '/api/enhance-prompt',
    MODELS: '/api/config/models',
    SUPERDUPERAI: '/api/config/superduperai',
    EVENTS_FILE: (fileId: string) => `/api/events/file.${fileId}`,
    GENERATE_SCRIPT: '/api/generate/script',
    // Добавьте сюда только те эндпоинты, которые реально реализованы в app/api/
  } as const