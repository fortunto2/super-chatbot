# Video Generation Testing

This directory contains tests for debugging and validating the video generation functionality.

## 🧪 Test Files

### `video-generation-smoke-test.js`
Basic smoke test that validates the API payload structure without making actual API calls.

**What it tests:**
- Request ID generation
- Model discovery
- Auth headers creation
- API URL construction 
- Payload structure validation
- Environment variable checks

**Usage:**
```bash
npm run test:video
# OR
node tests/video-generation-smoke-test.js
```

### `video-generation-real-test.js`
Advanced test that can optionally make real API calls to SuperDuperAI.

**What it tests:**
- All smoke test validations
- Real API call capabilities (optional)
- Response parsing and error handling
- Environment setup validation

**Usage:**
```bash
# Dry run (no actual API calls)
npm run test:video:dry
# OR
node tests/video-generation-real-test.js

# Live test (makes real API calls)
npm run test:video:live
# OR  
node tests/video-generation-real-test.js --live
```

### `video-generation-image-to-video-test.js`
Tests image-to-video model functionality and payload structure.

**What it tests:**
- Image-to-video model detection (VEO, KLING)
- Source image requirement validation
- Correct payload structure for image-to-video models
- Text-to-video model compatibility preservation
- Error handling for missing source images

**Usage:**
```bash
npm run test:video:i2v
# OR
node tests/video-generation-image-to-video-test.js
```

## 🔧 Environment Setup

For live testing, you need to set environment variables:

```bash
export SUPERDUPERAI_TOKEN="your-api-token-here"
export SUPERDUPERAI_URL="https://dev-editor.superduperai.co"  # Optional, uses default if not set
```

## 📋 Test Data

Tests use the following data structure (from your actual request):

```json
{
  "prompt": "Ocean waves gently crashing on a sandy beach at golden hour, cinematic style",
  "style": "flux_steampunk",
  "resolution": "1920x1080",
  "model": "comfyui/ltx",
  "duration": 10,
  "frameRate": 30
}
```

## 🎯 Expected Results

### Smoke Test Output:
```
✅ Test 1 - Request ID generation: vid_123456789_abc123
✅ Test 2 - Model discovery: comfyui/ltx
✅ Test 3 - Auth headers: [ 'Content-Type', 'Authorization', 'User-Agent' ]
✅ Test 4 - API URL: https://dev-editor.superduperai.co/api/v1/file/generate-video
✅ Test 5 - API Payload structure: [JSON object]
✅ Test 6 - Payload validation: All required fields present
✅ Test 7 - Full request object created
✅ Test 8 - Environment check
🎉 All smoke tests passed!
```

### Real Test Success (Live):
```
✅ API call successful!
🎬 Video generation should be starting...
🆔 Project ID: abc-123-def-456
```

### Real Test Error Examples:
```
❌ API call failed
🔍 Status: 401
💡 Check your SUPERDUPERAI_TOKEN

❌ API call failed  
🔍 Status: 400
💡 Check the request payload structure
```

## 🐛 Debugging

### Common Issues:

1. **Missing Environment Variables**
   - Set `SUPERDUPERAI_TOKEN` for live tests
   - Optionally set `SUPERDUPERAI_URL`

2. **API Payload Issues**
   - Check smoke test output for validation errors
   - Compare with working image generation structure

3. **Model Not Found**
   - Verify model ID `comfyui/ltx` exists in your SuperDuperAI instance
   - Check available models via API

4. **Authentication Failed**
   - Verify API token is correct and not expired
   - Check API URL is correct

## 🔄 Usage in Development

1. **Before making changes:** Run smoke test to ensure baseline works
2. **After changes:** Run both smoke and dry run tests
3. **For real testing:** Use live test with valid credentials
4. **For CI/CD:** Use smoke test only (no API credentials needed)

## 🎬 Integration with Main App

The test structure matches the actual video generation API in:
- `lib/ai/api/generate-video.ts`
- `lib/ai/tools/configure-video-generation.ts`

Any changes to the main API should be reflected in these tests. 