# AI Capabilities

AI-powered media generation features and tools in Super Chatbot.

## 📁 Files in This Section

### [Overview](./overview.md) ⭐ **Start Here**
Complete overview of AI capabilities including:
- Image generation (FLUX Pro/Dev)
- Video generation (SuperDuperAI Veo3)
- Integrated creative workflow
- Professional features and use cases

### Image Generation
#### [Image Generation Guide](./image-generation/README.md)
Comprehensive guide to image generation:
- FLUX Pro/Dev models via SuperDuperAI
- WebSocket-based real-time progress
- Style library and resolution options
- API integration and troubleshooting

### Video Generation  
#### [Video Models Guide](./video-generation/models-guide.md)
Dynamic video model selection:
- Available models (LTX, VEO3, Sora, KLING)
- Smart model selection based on requirements
- Budget vs quality considerations

#### [Video Pricing Guide](./video-generation/pricing-guide.md)
Cost optimization for video generation:
- Price comparison ($0.40 to $3.00 per second)
- Duration support analysis
- VIP requirements and recommendations

#### [Image-to-Video Models](./video-generation/image-to-video-models.md)
Support for image-to-video generation:
- VEO2/VEO3 and KLING 2.1 models
- Source image requirements and validation
- API payload structure differences
- Agent behavior and user guidance

## 🎯 For AI Agents

### Working with Image Generation:
1. **Read**: [Image Generation Guide](./image-generation/README.md)
2. **Use tools**: `configureImageGeneration` with proper parameters
3. **Monitor**: WebSocket progress updates
4. **Handle**: Real-time artifact updates

### Working with Video Generation:
1. **Check models**: Use `listVideoModels` for current options
2. **Select optimally**: Use `findBestVideoModel` with user requirements
3. **Generate**: Use `configureVideoGeneration` with selected model
4. **Budget awareness**: Check [pricing guide](./video-generation/pricing-guide.md)

### Model Selection Examples:
```typescript
// Budget-friendly video
const affordable = await findBestVideoModel({
  maxPrice: 0.5,
  vipAllowed: false
});

// Quality-focused video  
const premium = await findBestVideoModel({
  maxPrice: 3.0,
  prioritizeQuality: true,
  vipAllowed: true
});

// Duration-specific video
const longVideo = await findBestVideoModel({
  preferredDuration: 15,
  maxPrice: 2.0,
  vipAllowed: true
});
```

## 🔧 Available AI Tools

- `configureImageGeneration` - FLUX Pro/Dev image creation
- `configureVideoGeneration` - Video generation with dynamic models
- `listVideoModels` - Discover available video models
- `findBestVideoModel` - Smart model selection
- `createDocument` - Document artifacts for media
- `updateDocument` - Document editing and collaboration

## 🔗 Related Sections

- [API Integration](../api-integration/README.md) - SuperDuperAI integration
- [Architecture](../architecture/README.md) - WebSocket and API architecture
- [Development](../development/README.md) - Implementation methodology 