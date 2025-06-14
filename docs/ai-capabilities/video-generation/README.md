# Video Generation Documentation

This section contains comprehensive documentation for the video generation capabilities in the Super Chatbot system.

## Overview

The video generation system supports multiple AI models and provides real-time progress tracking through WebSocket connections. It includes support for both text-to-video and image-to-video generation with economical default settings.

## Documentation Files

### Core Guides

- **[Models Guide](./models-guide.md)** - Complete overview of available video models, their capabilities, and use cases
- **[Image-to-Video Models](./image-to-video-models.md)** - Specialized guide for image-to-video generation models like VEO and KLING
- **[Pricing Guide](./pricing-guide.md)** - Cost analysis and pricing information for different models and settings

### Configuration & Settings

- **[Economical Settings](./economical-settings.md)** - Cost-saving default configurations and optimization strategies

### Troubleshooting

- **[WebSocket Troubleshooting](./websocket-troubleshooting.md)** - Debugging guide for real-time update issues

## Quick Start

1. **Text-to-Video**: Use the `configureVideoGeneration` tool with a prompt
2. **Image-to-Video**: Provide a source image along with your video prompt
3. **Monitor Progress**: Real-time updates via WebSocket connection
4. **Cost Optimization**: Default settings use economical HD resolution and 5-second duration

## Key Features

- **Multiple Models**: Support for VEO3, KLING, LTX, and other leading video AI models
- **Real-time Updates**: WebSocket-based progress tracking and result delivery
- **Cost Optimization**: Economical defaults with premium options available
- **Image-to-Video**: Advanced support for source image-based video generation
- **Flexible Settings**: Customizable resolution, duration, frame rate, and style options

## Architecture

The video generation system consists of:

- **AI Tools** (`lib/ai/tools/configure-video-generation.ts`) - User interface and parameter validation
- **API Layer** (`lib/ai/api/generate-video.ts`) - SuperDuperAI integration
- **WebSocket System** (`hooks/use-artifact-websocket.ts`) - Real-time progress updates
- **Artifact System** (`artifacts/video/`) - UI components and server handlers

## Related Documentation

- [AI Capabilities Overview](../README.md)
- [API Integration](../../api-integration/superduperai/)
- [WebSocket Architecture](../../architecture/websocket-architecture.md) 