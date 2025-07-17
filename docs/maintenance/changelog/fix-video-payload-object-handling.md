# Исправление обработки объектов в payload генерации видео

**Дата:** 24 января 2025  
**Проблема:** `TypeError: str.trim is not a function` в стратегиях генерации видео  
**Решение:** Добавлена функция `getStringValue()` для корректного извлечения строк из объектов

## Проблема

После унификации архитектуры video generation tool с image generation tool возникла ошибка при генерации видео в чате:

```
❌ text-to-video generation error: TypeError: str.trim is not a function
    at snakeCase (lib/ai/api/video-generation/strategies/text-to-video.ts:8:13)
```

### Причина

В обновленной конфигурации генерации параметры `shotSize` и `style` стали передаваться как объекты:

```javascript
shotSize: {
  id: 'extreme_long_shot',
  label: 'Extreme Long Shot',
  description: 'Shows vast landscapes or cityscapes with tiny subjects'
},
style: {
  id: 'flux_steampunk',
  label: 'Steampunk',
  description: 'Steampunk'
}
```

Но стратегии генерации ожидали строки:

```typescript
shot_size: snakeCase(params.shotSize), // Ожидалась строка, получен объект
style_name: snakeCase(params.style),   // Ожидалась строка, получен объект
```

## Решение

### 1. Добавлена функция `getStringValue()`

Функция умеет извлекать строковые значения из объектов или возвращать строки как есть:

```typescript
// Helper function to extract string value from object or string
function getStringValue(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.id) return value.id; // Приоритет: id
  if (typeof value === "object" && value.label) return value.label; // Fallback: label
  return undefined;
}
```

### 2. Обновлены стратегии генерации

**text-to-video.ts:**

```typescript
shot_size: snakeCase(getStringValue(params.shotSize)), // Извлекает строку из объекта
style_name: snakeCase(getStringValue(params.style)),   // Извлекает строку из объекта
```

**image-to-video.ts:**

```typescript
shot_size: snakeCase(getStringValue(params.shotSize)), // Извлекает строку из объекта
style_name: snakeCase(getStringValue(params.style)),   // Извлекает строку из объекта
```

## Поддерживаемые форматы

Теперь стратегии поддерживают оба формата:

### ✅ Строковый формат (legacy)

```javascript
{
  shotSize: "extreme_long_shot",
  style: "flux_steampunk"
}
```

### ✅ Объектный формат (новый)

```javascript
{
  shotSize: {
    id: "extreme_long_shot",
    label: "Extreme Long Shot",
    description: "Shows vast landscapes"
  },
  style: {
    id: "flux_steampunk",
    label: "Steampunk",
    description: "Steampunk"
  }
}
```

## Логика извлечения значений

1. **Если null/undefined** → возвращается `undefined`
2. **Если строка** → возвращается как есть
3. **Если объект с `id`** → возвращается `object.id`
4. **Если объект с `label`** → возвращается `object.label`
5. **Иначе** → возвращается `undefined`

## Технические детали

### Файлы изменены:

- `lib/ai/api/video-generation/strategies/text-to-video.ts`
- `lib/ai/api/video-generation/strategies/image-to-video.ts`

### Обратная совместимость:

- ✅ Старые строковые параметры продолжают работать
- ✅ Новые объектные параметры корректно обрабатываются
- ✅ Нет breaking changes для существующего API

### Приоритет значений:

1. `object.id` (основное поле для SuperDuperAI API)
2. `object.label` (fallback для читаемости)
3. Строка (прямое значение)

## Результат

**До исправления:**

```
❌ TypeError: str.trim is not a function
❌ Генерация видео не работала в чате
❌ Несовместимость объектных параметров
```

**После исправления:**

```
✅ Корректная обработка объектов и строк
✅ Генерация видео работает и в чате, и в инструменте
✅ Полная обратная совместимость
✅ Унифицированная архитектура параметров
```

## Мониторинг

Для отслеживания корректности обработки параметров добавлены логи в стратегиях:

- Входные параметры логируются как объекты
- Извлеченные строки проходят через `snakeCase`
- Финальный payload содержит корректные snake_case значения

Это решение обеспечивает бесшовную работу как с legacy строковыми параметрами, так и с новыми объектными параметрами из конфигураций.
