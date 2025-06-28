# SuperDuperAI Image Generation API Guide

**Date:** June 25, 2025  
**Status:** Active Documentation

## Overview

This guide covers how to work with SuperDuperAI API for image generation, including direct API calls, real-time updates via SSE, and polling for results.

## API Endpoints

### Base URL
```
https://dev-editor.superduperai.co
```

### Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer YOUR_API_TOKEN
```

## Image Generation Workflow

### Step 1: Generate Image

**Endpoint:** `POST /api/v1/file/generate-image`

**Required Headers:**
- `Authorization: Bearer YOUR_TOKEN`  
- `Content-Type: application/json`

**Request Body:**
```json
{
  "config": {
    "prompt": "A beautiful sunset over mountains",
    "generation_config_name": "comfyui/flux",
    "params": {
      "width": 1024,
      "height": 1024,
      "quality": "hd",
      "style": "photographic",
      "shot_size": "Medium Shot"
    }
  }
}
```

**Note:** The correct structure requires a `config` object containing `prompt`, `generation_config_name`, and `params`.

**Response Example:**
```json
[{
  "id": "6690c27b-6862-46a7-b0e6-5ac303fd9da3",
  "url": null,
  "thumbnail_url": null,
  "type": "image", 
  "image_generation_id": "221d33d1-6484-4dc1-bcb3-eb0a71b64472",
  "image_generation": {
    "prompt": "A simple red apple on white background, photorealistic",
    "negative_prompt": "",
    "width": 1024,
    "height": 1024,
    "steps": 20,
    "shot_size": null,
    "seed": 69135535910046,
    "id": "221d33d1-6484-4dc1-bcb3-eb0a71b64472",
    "generation_config_name": "comfyui/flux",
    "style_name": null,
    "references": [],
    "entity_ids": []
  },
  "video_generation_id": null,
  "video_generation": null,
  "audio_generation_id": null,
  "audio_generation": null,
  "duration": null,
  "tasks": []
}]
```

**Note:** API returns an array containing file object(s). The `url` is initially `null` during generation.

### Step 2: Get Results (Two Methods)

#### Method 1: Real-time SSE (Recommended)

**Endpoint:** `GET /api/v1/events/file.{file_uuid}`

**Connection Type:** Server-Sent Events (EventSource)

**Example SSE Messages:**
```javascript
// Progress update
{
  "type": "render_progress", 
  "object": {
    "progress": 45,
    "file_id": "file_uuid_here"
  }
}

// Completion
{
  "type": "render_result",
  "object": {
    "file_id": "file_uuid_here",
    "url": "https://storage.superduperai.co/files/generated_image.png"
  }
}

// Task status update
{
  "type": "task",
  "object": {
    "id": "task_uuid",
    "status": "completed",
    "file_id": "file_uuid_here"
  }
}
```

#### Method 2: Polling

**Endpoint:** `GET /api/v1/file/{file_id}`

**Poll every 2-5 seconds until status is "completed" or "error"**

**Response when completed:**
```json
{
  "id": "6690c27b-6862-46a7-b0e6-5ac303fd9da3",
  "url": "https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/generated/image/2025/6/24/23/PiFrBCrJnerES783wdsx9R.webp",
  "thumbnail_url": "https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/uploaded/image/2025/6/24/23/cZQpa6cmaosUismdVWESUZ.webp",
  "type": "image",
  "image_generation_id": "221d33d1-6484-4dc1-bcb3-eb0a71b64472",
  "image_generation": {
    "prompt": "A simple red apple on white background, photorealistic",
    "negative_prompt": "",
    "width": 1024,
    "height": 1024,
    "steps": 20,
    "shot_size": null,
    "seed": 69135535910046,
    "id": "221d33d1-6484-4dc1-bcb3-eb0a71b64472",
    "generation_config_name": "comfyui/flux",
    "style_name": null,
    "references": [],
    "entity_ids": []
  },
  "video_generation_id": null,
  "video_generation": null,
  "audio_generation_id": null,
  "audio_generation": null,
  "duration": null,
  "tasks": []
}
```

**Note:** Once completed, the `url` field contains the direct link to the generated image file.

## cURL Examples

### Generate Image Request
```bash
curl -X POST "https://dev-editor.superduperai.co/api/v1/file/generate-image" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "prompt": "A majestic dragon flying over a medieval castle at sunset, highly detailed, fantasy art style",
      "generation_config_name": "comfyui/flux",
      "params": {
        "width": 1024,
        "height": 1024,
        "quality": "hd",
        "style": "fantasy",
        "shot_size": "Long Shot"
      }
    }
  }'
```

### Check File Status (Polling)
```bash
curl -X GET "https://dev-editor.superduperai.co/api/v1/file/FILE_UUID_HERE" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Subscribe to SSE Events  
```bash
curl -X GET "https://dev-editor.superduperai.co/api/v1/events/file.FILE_UUID_HERE" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Accept: text/event-stream"
```

## Available Image Models

Based on the [official Models Discovery API](https://dev-editor.superduperai.co/docs#/generation_config/generation_config_get_list):

### 💰 Affordable Models (Recommended for Testing)
- **`comfyui/flux`** - Flux Dev ($1 per image) ⭐ **Best value for testing**
- **`comfyui/flux/inpainting`** - Flux Inpainting ($1 per image)

### 🔥 Premium Models (VIP Required)
- **`google-cloud/imagen4-ultra`** - Google Imagen 4 Ultra ($3 per image)
- **`google-cloud/imagen4`** - Google Imagen 4 ($2 per image)
- **`google-cloud/imagen3`** - Google Imagen 3 ($1.5 per image)
- **`google-cloud/imagen3-edit`** - Google Imagen 3 Edit/Inpainting ($2 per image)
- **`fal-ai/flux-pro/v1.1-ultra`** - Flux Pro ($1 per image)
- **`fal-ai/flux-pro/kontext`** - FLUX Kontext Pro ($2 per image)
- **`azure-openai/gpt-image-1`** - OpenAI Image ($2 per image)
- **`azure-openai/gpt-image-1-edit`** - OpenAI Image Edit/Inpainting ($2.5 per image)

### Model Discovery API
```bash
# Get all image models
curl -X GET "https://dev-editor.superduperai.co/api/v1/generation-config?type=text_to_image,image_to_image" \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Full models list (all types)
curl -X GET "https://dev-editor.superduperai.co/api/v1/generation-config" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**💡 Cost-effective recommendation:** Start testing with `comfyui/flux` at $1 per image before using premium models.

### Model Types by Generation Type
- **Text-to-Image**: `comfyui/flux`, `google-cloud/imagen4`, `fal-ai/flux-pro/v1.1-ultra`, `azure-openai/gpt-image-1`
- **Image-to-Image**: `comfyui/flux/inpainting`, `google-cloud/imagen3-edit`, `fal-ai/flux-pro/kontext`, `azure-openai/gpt-image-1-edit`

## Parameters Reference

### Image Generation Parameters
- **width**: 512, 768, 1024, 1536 (depends on model)
- **height**: 512, 768, 1024, 1536 (depends on model)  
- **quality**: "sd", "hd", "full_hd"
- **style**: "photographic", "digital_art", "comic_book", "fantasy", "line_art", "analog_film", "neon_punk", "isometric", "low_poly", "origami", "modeling_compound", "cinematic", "3d_model", "pixel_art", "tile_texture"
- **shot_size**: "Extreme Long Shot", "Long Shot", "Medium Shot", "Medium Close-Up", "Close-Up", "Extreme Close-Up", "Two-Shot", "Detail Shot"

## Error Handling

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (invalid/missing token)
- **422**: Validation Error (invalid model or parameters)
- **429**: Rate Limited
- **500**: Internal Server Error

### Error Response Format
```json
{
  "detail": "Validation error message",
  "errors": [
    {
      "field": "config_id", 
      "message": "Model not found"
    }
  ]
}
```

## Best Practices

1. **Use free models for testing**: Start with `comfyui/flux` or `comfyui/sdxl`
2. **Implement timeout**: Set reasonable timeouts (5-10 minutes for image generation)
3. **Handle rate limits**: Implement exponential backoff
4. **Prefer SSE over polling**: SSE provides real-time updates with less server load
5. **Cache model list**: Models don't change frequently, cache for 1 hour
6. **Validate parameters**: Check model capabilities before sending requests

## Live Testing

The following cURL request was tested against the actual API:

```bash
curl -X POST "https://dev-editor.superduperai.co/api/v1/file/generate-image" \
  -H "Authorization: Bearer 9ab6d5b74e654a7887015a4fa2b10e7f" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "prompt": "A simple red apple on white background, photorealistic", 
      "generation_config_name": "comfyui/flux",
      "params": {
        "width": 512,
        "height": 512,
        "quality": "hd"
      }
    }
  }'
```

**✅ Test Status:** Successfully executed on June 25, 2025

**Test Results:**
- **Request:** Successfully sent
- **Response:** File created with ID `6690c27b-6862-46a7-b0e6-5ac303fd9da3`
- **Generation Time:** ~2 minutes
- **Final Image URL:** [https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/generated/image/2025/6/24/23/PiFrBCrJnerES783wdsx9R.webp](https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/generated/image/2025/6/24/23/PiFrBCrJnerES783wdsx9R.webp)
- **Thumbnail URL:** [https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/uploaded/image/2025/6/24/23/cZQpa6cmaosUismdVWESUZ.webp](https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/uploaded/image/2025/6/24/23/cZQpa6cmaosUismdVWESUZ.webp)
- **Final Size:** 1024x1024 (API adjusted from requested 512x512)
- **Model Used:** comfyui/flux
- **SSE:** Connection timeout (error 524), polling method worked correctly

## Integration Examples

### JavaScript/TypeScript
```typescript
// Using Fetch API
async function generateImage(prompt: string): Promise<string> {
  // Step 1: Generate
  const response = await fetch('https://dev-editor.superduperai.co/api/v1/file/generate-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      config: {
        prompt,
        generation_config_name: 'comfyui/flux',
        params: { width: 1024, height: 1024, quality: 'hd' }
      }
    })
  });
  
  const result = await response.json();
  const fileId = result.id;
  
  // Step 2: Subscribe to SSE
  const eventSource = new EventSource(
    `https://dev-editor.superduperai.co/api/v1/events/file.${fileId}`,
    { headers: { 'Authorization': `Bearer ${API_TOKEN}` } }
  );
  
  return new Promise((resolve, reject) => {
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'render_result') {
        eventSource.close();
        resolve(message.object.url);
      } else if (message.type === 'task' && message.object.status === 'error') {
        eventSource.close();
        reject(new Error('Generation failed'));
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      reject(new Error('SSE connection failed'));
    };
  });
}
```

### Python
```python
import requests
import json
import sseclient

def generate_image(prompt: str, api_token: str) -> str:
    # Step 1: Generate
    response = requests.post(
        'https://dev-editor.superduperai.co/api/v1/file/generate-image',
        headers={
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        },
        json={
            'config': {
                'prompt': prompt,
                'generation_config_name': 'comfyui/flux',
                'params': {'width': 1024, 'height': 1024, 'quality': 'hd'}
            }
        }
    )
    
    result = response.json()
    file_id = result['id']
    
    # Step 2: SSE subscription
    sse_url = f'https://dev-editor.superduperai.co/api/v1/events/file.{file_id}'
    sse_response = requests.get(
        sse_url,
        headers={'Authorization': f'Bearer {api_token}'},
        stream=True
    )
    
    client = sseclient.SSEClient(sse_response)
    
    for event in client.events():
        message = json.loads(event.data)
        
        if message['type'] == 'render_result':
            return message['object']['url']
        elif message['type'] == 'task' and message['object']['status'] == 'error':
            raise Exception('Generation failed')
```

## Related Documentation

- [SuperDuperAI OpenAPI Docs](https://dev-editor.superduperai.co/docs)
- [Video Generation API Guide](./video-generation-api-guide.md) 
- [Dynamic Integration Guide](./dynamic-integration.md)
- [Security Migration Guide](./security-migration.md)

---

**Last Updated:** June 25, 2025  
**API Version:** v1  
**Documentation Status:** Active 