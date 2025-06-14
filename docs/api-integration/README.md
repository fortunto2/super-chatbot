# API Integration

External API integrations and authentication for Super Chatbot.

## 📁 Files in This Section

### SuperDuperAI Integration
#### [SuperDuperAI Overview](./superduperai/README.md) ⭐ **Primary API**
Complete integration guide:
- Authentication and environment setup
- Image and video generation APIs
- WebSocket real-time updates
- Error handling and best practices

#### [Video Models](./superduperai/video-models.md)
SuperDuperAI video model specifications:
- Available models and configurations
- Request/response formats
- LTX model usage examples

#### [Dynamic Integration](./superduperai/dynamic-integration.md)
Dynamic model loading system:
- Real-time model discovery
- Caching strategies
- Smart model selection
- Performance optimizations

#### [Security Migration](./superduperai/security-migration.md)
Security improvements and migration:
- Environment-based token management
- Dual environment support
- Migration from hardcoded tokens

## 🎯 For AI Agents

### SuperDuperAI API Usage:
1. **Setup**: Check [environment setup](../getting-started/environment-setup.md)
2. **Integration**: Read [SuperDuperAI Overview](./superduperai/README.md)
3. **Dynamic models**: Use [Dynamic Integration](./superduperai/dynamic-integration.md)
4. **Video specifics**: Check [Video Models](./superduperai/video-models.md)

### Quick API Reference:
- **Base URL**: `https://dev-editor.superduperai.co` (dev)
- **Authentication**: Bearer token in headers
- **WebSocket**: `wss://dev-editor.superduperai.co/ws`
- **Rate Limits**: Check documentation for current limits

## 🔗 Related Sections

- [AI Capabilities](../ai-capabilities/README.md) - Using the APIs for media generation
- [Architecture](../architecture/README.md) - API architecture and design
- [Getting Started](../getting-started/README.md) - Environment setup 