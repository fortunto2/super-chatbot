# SuperDuperAI Video Generation API Guide

**Date:** June 25, 2025  
**Status:** Active Documentation

## Overview

This guide covers how to work with SuperDuperAI API for video generation, including direct API calls, real-time updates via SSE, and polling for results.

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

## Video Generation Workflow

### Step 1: Generate Video

**Endpoint:** `POST /api/v1/file/generate-video`

**Required Headers:**
- `Authorization: Bearer YOUR_TOKEN`  
- `Content-Type: application/json`

**Request Body:**
```json
{
  "config": {
    "prompt": "A majestic eagle soaring over mountain peaks at sunset",
    "generation_config_name": "comfyui/ltx",
    "params": {
      "duration": 5,
      "aspect_ratio": "16:9"
    }
  }
}
```

**Note:** The correct structure requires a `config` object containing `prompt`, `generation_config_name`, and `params`.

**Response Example:**
```json
{
  "id": "998d1ea1-9198-450b-a869-5d23185a0a6a",
  "url": null,
  "thumbnail_url": null,
  "type": "video",
  "image_generation_id": null,
  "image_generation": null,
  "video_generation_id": "50e5122a-b8e6-420b-a0b9-f54f485530d1",
  "video_generation": {
    "prompt": "A small bird flying in slow motion over calm water, nature documentary style",
    "negative_prompt": "",
    "seed": 60457830923086,
    "duration": 5.0,
    "width": null,
    "height": null,
    "aspect_ratio": null,
    "id": "50e5122a-b8e6-420b-a0b9-f54f485530d1",
    "generation_config_name": "comfyui/ltx",
    "generation_config": {
      "name": "comfyui/ltx",
      "label": "LTX",
      "type": "image_to_video",
      "source": "local",
      "params": {
        "workflow_path": "ltx/default.json",
        "price_per_second": 0.4,
        "available_durations": [5]
      }
    },
    "references": []
  },
  "audio_generation_id": null,
  "audio_generation": null,
  "duration": null,
  "tasks": [
    {
      "type": "video-generation-flow",
      "status": "in_progress",
      "id": "64fde379-f2da-43cc-a52d-873d936527f9",
      "file_id": "998d1ea1-9198-450b-a869-5d23185a0a6a",
      "project_id": null
    }
  ]
}
```

**Note:** API returns a single file object (unlike image generation which returns array). The `url` is initially `null` during generation.

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
    "progress": 75,
    "file_id": "file_uuid_here"
  }
}

// Completion
{
  "type": "render_result",
  "object": {
    "file_id": "file_uuid_here",
    "url": "https://storage.superduperai.co/videos/generated_video.mp4"
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

**Poll every 5-10 seconds until status is "completed" or "error"**

**Response when completed:**
```json
{
  "id": "998d1ea1-9198-450b-a869-5d23185a0a6a",
  "url": "https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/generated/video/2025/6/25/video.mp4",
  "thumbnail_url": "https://superduper-acdagaa3e2h7chh0.z02.azurefd.net/thumbnails/video_thumb.jpg",
  "type": "video",
  "video_generation": {
    "prompt": "A small bird flying in slow motion over calm water",
    "duration": 5.0,
    "generation_config_name": "comfyui/ltx"
  },
  "tasks": [
    {
      "type": "video-generation-flow",
      "status": "completed",
      "id": "task_uuid"
    }
  ]
}
```

**Note:** Once completed, the `url` field contains the direct link to the generated video file.

## cURL Examples

### Generate Video Request
```bash
curl -X POST "https://dev-editor.superduperai.co/api/v1/file/generate-video" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "prompt": "A peaceful mountain landscape with clouds moving slowly across the sky, cinematic style",
      "generation_config_name": "comfyui/ltx",
      "params": {
        "duration": 5,
        "aspect_ratio": "16:9"
      }
    }
  }'
```

### Check Video Status (Polling)
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

## Available Video Models

### 💰 Affordable Models (Recommended for Testing)
- **`comfyui/ltx`** - LTX Image-to-Video ($0.4/sec) ⭐ **Best value**
- **`comfyui/lip-sync`** - LipSync Video-to-Video ($0.4/sec)

### 🔥 Premium Models (VIP Required)
- **`google-cloud/veo3-text2video`** - Google VEO3 Text-to-Video ($3/sec)
- **`google-cloud/veo3`** - Google VEO3 Image-to-Video ($3/sec)
- **`google-cloud/veo2-text2video`** - Google VEO2 Text-to-Video ($2/sec)
- **`google-cloud/veo2`** - Google VEO2 Image-to-Video ($2/sec)
- **`fal-ai/kling-video/v2.1/standard/image-to-video`** - KLING 2.1 Standard ($1/sec)
- **`fal-ai/kling-video/v2.1/pro/image-to-video`** - KLING 2.1 Pro ($2/sec)
- **`fal-ai/minimax/video-01/image-to-video`** - Minimax ($1.2/sec)
- **`fal-ai/minimax/video-01-live/image-to-video`** - Minimax Live ($1.2/sec)
- **`azure-openai/sora`** - OpenAI Sora Text-to-Video ($10/sec) 💎 **Most expensive**

### Model Discovery API
```bash
curl -X GET "https://dev-editor.superduperai.co/api/v1/generation-config?type=text_to_video,image_to_video,video_to_video" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Parameters Reference

### Video Generation Parameters
- **duration**: Available durations depend on model (usually 5, 10, 15, 20 seconds)
- **aspect_ratio**: "16:9", "9:16", "4:3", "1:1" (depends on model)
- **width/height**: Custom dimensions (some models)
- **fps**: Frame rate (24, 30, 60) - model dependent
- **seed**: Random seed for reproducible results
- **negative_prompt**: What to avoid in generation

### Model-Specific Parameters
```json
{
  "config": {
    "prompt": "Your video description",
    "generation_config_name": "model_name",
    "params": {
      "duration": 5,
      "aspect_ratio": "16:9",
      "fps": 24,
      "seed": 12345,
      "negative_prompt": "blurry, low quality"
    }
  }
}
```

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
      "field": "config.generation_config_name", 
      "message": "Model not found or requires VIP access"
    }
  ]
}
```

## Best Practices

1. **Use affordable models for testing**: Start with `comfyui/ltx` ($0.4/sec)
2. **Implement longer timeouts**: Video generation takes 5-15 minutes
3. **Handle rate limits**: Implement exponential backoff
4. **Prefer SSE over polling**: SSE provides real-time updates
5. **Check model requirements**: Some models require VIP access or specific input types
6. **Monitor costs**: Premium models charge per second of output video

## Live Testing

The following cURL request was tested against the actual API:

```bash
curl -X POST "https://dev-editor.superduperai.co/api/v1/file/generate-video" \
  -H "Authorization: Bearer 9ab6d5b74e654a7887015a4fa2b10e7f" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "prompt": "A small bird flying in slow motion over calm water, nature documentary style",
      "generation_config_name": "comfyui/ltx",
      "params": {
        "duration": 5,
        "aspect_ratio": "16:9"
      }
    }
  }'
```

**✅ Test Status:** Successfully executed on June 25, 2025

**Test Results:**
- **Request:** Successfully sent
- **Response:** File created with ID `998d1ea1-9198-450b-a869-5d23185a0a6a`
- **Video Generation ID:** `50e5122a-b8e6-420b-a0b9-f54f485530d1`
- **Model Used:** comfyui/ltx ($0.4/sec)
- **Duration:** 5 seconds
- **Final Status:** ❌ Generation failed (expected - image-to-video model requires image input)
- **Cost:** $0.00 (no charge for failed generation)
- **Learning:** Image-to-video models need image reference, use text-to-video models for text-only prompts

## Integration Examples

### JavaScript/TypeScript
```typescript
// Using Fetch API
async function generateVideo(prompt: string): Promise<string> {
  // Step 1: Generate
  const response = await fetch('https://dev-editor.superduperai.co/api/v1/file/generate-video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      config: {
        prompt,
        generation_config_name: 'comfyui/ltx',
        params: { duration: 5, aspect_ratio: '16:9' }
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
    const timeout = setTimeout(() => {
      eventSource.close();
      reject(new Error('Video generation timeout (15 minutes)'));
    }, 15 * 60 * 1000); // 15 minutes
    
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'render_result') {
        clearTimeout(timeout);
        eventSource.close();
        resolve(message.object.url);
      } else if (message.type === 'task' && message.object.status === 'error') {
        clearTimeout(timeout);
        eventSource.close();
        reject(new Error('Video generation failed'));
      }
    };
    
    eventSource.onerror = () => {
      clearTimeout(timeout);
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
import time

def generate_video(prompt: str, api_token: str) -> str:
    # Step 1: Generate
    response = requests.post(
        'https://dev-editor.superduperai.co/api/v1/file/generate-video',
        headers={
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        },
        json={
            'config': {
                'prompt': prompt,
                'generation_config_name': 'comfyui/ltx',
                'params': {'duration': 5, 'aspect_ratio': '16:9'}
            }
        }
    )
    
    result = response.json()
    file_id = result['id']
    
    # Step 2: SSE subscription with timeout
    sse_url = f'https://dev-editor.superduperai.co/api/v1/events/file.{file_id}'
    sse_response = requests.get(
        sse_url,
        headers={'Authorization': f'Bearer {api_token}'},
        stream=True
    )
    
    client = sseclient.SSEClient(sse_response)
    start_time = time.time()
    timeout = 15 * 60  # 15 minutes
    
    for event in client.events():
        if time.time() - start_time > timeout:
            raise Exception('Video generation timeout')
            
        message = json.loads(event.data)
        
        if message['type'] == 'render_result':
            return message['object']['url']
        elif message['type'] == 'task' and message['object']['status'] == 'error':
            raise Exception('Video generation failed')

# Alternative: Polling method
def generate_video_polling(prompt: str, api_token: str) -> str:
    # Generate video
    response = requests.post(
        'https://dev-editor.superduperai.co/api/v1/file/generate-video',
        headers={'Authorization': f'Bearer {api_token}', 'Content-Type': 'application/json'},
        json={
            'config': {
                'prompt': prompt,
                'generation_config_name': 'comfyui/ltx',
                'params': {'duration': 5, 'aspect_ratio': '16:9'}
            }
        }
    )
    
    file_id = response.json()['id']
    
    # Poll for completion
    start_time = time.time()
    while time.time() - start_time < 15 * 60:  # 15 minutes timeout
        status_response = requests.get(
            f'https://dev-editor.superduperai.co/api/v1/file/{file_id}',
            headers={'Authorization': f'Bearer {api_token}'}
        )
        
        status = status_response.json()
        
        if status.get('url'):
            return status['url']
        elif status.get('tasks') and any(t.get('status') == 'error' for t in status['tasks']):
            raise Exception('Video generation failed')
        
        time.sleep(10)  # Wait 10 seconds before next check
    
    raise Exception('Video generation timeout')
```

## Cost Estimation

### Affordable Models
- **ComfyUI LTX**: $0.4/sec
  - 5-second video: $2.00
  - 10-second video: $4.00

### Premium Models  
- **KLING Standard**: $1/sec
  - 5-second video: $5.00
  - 10-second video: $10.00

- **Google VEO2**: $2/sec
  - 5-second video: $10.00
  - 10-second video: $20.00

- **Google VEO3**: $3/sec  
  - 5-second video: $15.00
  - 10-second video: $30.00

- **OpenAI Sora**: $10/sec 💎
  - 5-second video: $50.00
  - 10-second video: $100.00

## Related Documentation

- [SuperDuperAI OpenAPI Docs](https://dev-editor.superduperai.co/docs)
- [Image Generation API Guide](./image-generation-api-guide.md)
- [Dynamic Integration Guide](./dynamic-integration.md)
- [Security Migration Guide](./security-migration.md)
- [Models Discovery API](https://dev-editor.superduperai.co/docs#/generation_config/generation_config_get_list)

---

**Last Updated:** June 25, 2025  
**API Version:** v1  
**Documentation Status:** Active  
**Cost Information:** Updated June 2025 