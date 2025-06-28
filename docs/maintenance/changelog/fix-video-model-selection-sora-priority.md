# Fix Video Model Selection - Prioritize Sora for Text-to-Video

**Date**: 2025-01-15  
**Type**: Critical Bug Fix  
**Component**: Video Generation / Model Selection  
**Status**: ✅ Completed

## Problem Description

При генерации видео в video-generator tool передавалась неправильная конфигурация LTX модели с типом `image_to_video`, что вызывало ошибку `ComfyExecutionError: 'str' object has no attribute 'read'` при text-to-video генерации без source image.

**Expected**: Sora модель с типом `text_to_video`  
**Actual**: LTX модель с типом `image_to_video`

## Root Cause

1. Hardcoded fallback к `comfyui/ltx` в API route
2. Недостаточная приоритизация `text_to_video` моделей
3. Отсутствие различения text-to-video vs image-to-video сценариев

## Solution Implemented

### 1. Smart Model Selection in API Route

- Добавлен `requireTextToVideo: true` для text-only генерации
- Приоритизация Sora модели для text-to-video
- Автодетекция типа генерации по наличию source image

### 2. Enhanced getBestVideoModel Function

- Новый параметр `requireTextToVideo` для фильтрации
- Улучшенная сортировка с приоритетом Sora
- Пониженный приоритет LTX модели

### 3. Updated Tool Configuration

- Дефолтный выбор text_to_video моделей в tools

## Impact

✅ Sora модель теперь используется по умолчанию для text-to-video  
✅ Устранена ошибка ComfyUI в video generation  
✅ Правильный выбор типа модели на основе входных данных

## Files Modified

- `app/api/generate/video/route.ts`
- `lib/ai/api/config-cache.ts`
- `lib/ai/tools/configure-video-generation.ts`
