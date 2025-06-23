# Исправление ошибки API payload для генерации изображений

## Проблема

При запросе генерации изображения возникала ошибка `400 Bad Request - Invalid payload`. API отклонял запросы с неправильной структурой данных.

## Анализ

Сравнение неправильного и правильного payload показал следующие проблемы:

### Неправильная структура (ошибка):

```json
{
  "type": "media",
  "template_name": null,
  "config": {
    "prompt": "make photo tiger",
    "negative_prompt": "",
    "width": 1024,
    "height": 1024,
    "steps": 20,
    "shot_size": "medium_shot",
    "seed": 659992199820,
    "generation_config_name": "comfyui/flux",
    "batch_size": 1,
    "style_name": "flux_watercolor",
    "references": [],
    "entity_ids": [],
    "model_type": null
  }
}
```

### Правильная структура (рабочая):

```json
{
  "type": "media",
  "template_name": null,
  "style_name": "flux_watercolor",
  "config": {
    "prompt": "Man on horse",
    "shot_size": "Long Shot",
    "style_name": "flux_watercolor",
    "seed": "407337484605",
    "aspecRatio": "16:9",
    "batch_size": 3,
    "entity_ids": [],
    "generation_config_name": "comfyui/flux",
    "height": "1088",
    "qualityType": "full_hd",
    "references": [],
    "width": "1920"
  }
}
```

## Исправления

### 1. Структура payload (файл: `lib/ai/api/generate-image.ts`)

- Вынесено `style_name` из `config` на верхний уровень
- Добавлено поле `aspecRatio` (с опечаткой в API, но так работает)
- Добавлено поле `qualityType`
- Значения высоты и ширины преобразованы в строки
- Изменен `batch_size` с 1 на 3
- `shot_size` изменен с `id` на `label` (например, "Long Shot" вместо "long_shot")
- `seed` преобразован в строку

### 2. Исправлена структура payload во всех файлах генерации:

- `lib/ai/api/generate-image-hybrid.ts` - обновлена структура payload
- `lib/ai/api/generate-image-with-project.ts` - обновлена структура payload

### 3. Обновлены все тесты с генерацией изображений:

- `tests/final-generate-image-test.js` - исправлена структура payload (type: "image" → "media")
- `tests/project-image-endpoint-test.js` - исправлена структура payload
- `tests/simple-image-test.js` - исправлена структура payload
- `tests/image-generation-debug-test.js` - исправлена структура payload
- `tests/simple-no-project-test.js` - исправлена структура payload
- `tests/websocket-global-test.js` - исправлена структура payload
- `tests/project-websocket-test.js` - исправлена структура payload

### 4. Типы MediaResolution (файл: `lib/config/media-settings-factory.ts`)

- Добавлено поле `qualityType` во все разрешения
- Добавлено разрешение 1920x1080 с `qualityType: 'full_hd'`
- Остальные разрешения получили `qualityType: 'hd'`

## Результат

- API принимает запросы без ошибок `400 Bad Request`
- Генерация изображений работает корректно
- Структура payload соответствует ожиданиям SuperDuperAI API

## Тестирование

Для проверки:

1. Зайти в `/tools/image-generator`
2. Ввести любой промпт (например, "make photo tiger")
3. Нажать "Generate Image"
4. Проверить в консоли, что нет ошибки 400, а есть успешный ответ

## Дата исправления

Январь 2025
