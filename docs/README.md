# Super Chatbot Documentation

Welcome to the Super Chatbot documentation! This comprehensive guide covers all aspects of our AI-powered chat application with advanced media generation capabilities.

## 🚀 Quick Start

- **[Environment Setup](./getting-started/environment-setup.md)** - Get up and running quickly
- **[README Overview](./getting-started/README.md)** - Basic project information

## 🔐 Authentication System

### NextAuth + SuperDuperAI Integration

Our application uses a hybrid authentication system:

1. **Primary Authentication** - NextAuth with Auth0, Credentials, and Guest providers
2. **SuperDuperAI Integration** - User-specific tokens for personalized media generation

Key features:

- **Personal Credits** - Each user can connect their SuperDuperAI account
- **Fallback System** - System token for users who haven't connected
- **Secure Storage** - Encrypted token storage with AES-256-GCM
- **Usage Tracking** - Monitor credits and generation costs

📋 **Read more:** [SuperDuperAI User Authentication Guide](./api-integration/superduperai/user-authentication-guide.md)
📋 **Implementation:** [Auth Integration Plan](./development/implementation-plans/superduperai-auth-integration-plan.md)

## 🎨 AI Capabilities

### Media Generation

Our app provides powerful AI-driven content creation:

#### 🖼️ Image Generation

- **FLUX Pro/Dev models** via SuperDuperAI API
- **Text-to-image** and **image-to-image** workflows
- **Real-time progress** with SSE + polling fallback
- **Personal tokens** for cost tracking

📋 **Read more:** [Image Generation Guide](./ai-capabilities/image-generation/README.md)

#### 🎬 Video Generation

- **Veo3, LTX, RunwayML** models via SuperDuperAI API
- **Text-to-video** and **image-to-video** support
- **Economical defaults** (HD quality, 5s duration)
- **Cost optimization** with model selection

📋 **Read more:** [Video Generation Guide](./ai-capabilities/video-generation/README.md)

#### ✨ Prompt Enhancement

- **Automatic AI integration** for better prompts
- **Context-aware suggestions** based on generation type
- **Style and quality improvements**

📋 **Read more:** [Prompt Enhancement](./ai-capabilities/prompt-enhancement/README.md)

### Available Tools

AI agents have access to these specialized tools:

- `configure-image-generation` - FLUX Pro/Dev image generation
- `configure-video-generation` - Veo3/LTX video generation
- `create-document` / `update-document` - Document management
- `get-weather` - Real-time weather data
- `request-suggestions` - Contextual suggestions
- `diagnose-styles` - UI/UX analysis

## 🏗️ Architecture

### API Integration

#### SuperDuperAI Backend Integration

- **OpenAPI Client** - Auto-generated TypeScript client for type safety
- **Proxy Architecture** - Secure server-side API calls via Next.js routes
- **WebSocket Support** - Real-time updates for generation progress
- **Dynamic Model Loading** - Real-time model discovery and configuration

📋 **Read more:** [SuperDuperAI Integration](./api-integration/superduperai/README.md)

#### Authentication Architecture

```
NextAuth (Primary Auth)
    ├── Auth0 Provider (main authentication)
    ├── Credentials Provider (local accounts)
    ├── Guest Provider (guest sessions)
    └── SuperDuperAI Integration (additional auth for personal tokens)
```

#### Token Resolution Strategy

```typescript
// Priority for token resolution:
// 1. User's personal SuperDuperAI token (if connected)
// 2. System fallback token (for unconnected users)
// 3. Guest limitations (for guest users)
```

### Media Generation Framework

- **Strategy Pattern** - Pluggable generation strategies (text-to-image, image-to-video, etc.)
- **Factory Pattern** - Dynamic model and settings selection
- **SSE + Polling** - Reliable real-time updates with fallback mechanisms
- **Type Safety** - End-to-end TypeScript with OpenAPI generated types

📋 **Read more:** [Media Generation Framework](./architecture/media-generation-framework.md)

## 🔧 Development

### AI-First Development Methodology

All development follows our **AI-First Development Methodology**:

- **Two-phase development** (Planning → Implementation)
- **AICODE comment system** for persistent AI memory
- **Implementation plan templates** with approval process
- **Comprehensive documentation** for AI agent context

📋 **Read more:** [AI Development Methodology](./development/ai-development-methodology.md)

### Current Implementation Plans

#### 🔄 In Progress

- **[SuperDuperAI Auth Integration](./development/implementation-plans/superduperai-auth-integration-plan.md)** - User-specific token system
- **[Document Gallery](./development/implementation-plans/document-gallery-implementation-plan.md)** - Enhanced content management

#### ✅ Completed

- **[Image Generator Tool](./development/implementation-plans/image-generator-tool-implementation-plan.md)** - Standalone image generation
- **[Video Generation Image-to-Video](./development/implementation-plans/fix-video-generation-image-to-video.md)** - Enhanced video workflows

## 🌐 WebSocket & Real-time

### SSE Integration

- **Server-Sent Events** for real-time generation updates
- **Proxy pattern** through Next.js for security and CORS handling
- **Polling fallback** for maximum reliability
- **Connection management** with automatic reconnection

📋 **Read more:** [SSE Integration Guide](./websockets-implementation/sse-integration-guide.md)

## 🔍 Analysis & Maintenance

### Recent Improvements

- **Console Log Cleanup** - Production-ready logging levels
- **SSE Connection Optimization** - On-demand connections only when needed
- **Token Security Audit** - Fixed client-side token exposure issues
- **API Endpoint Standardization** - Consistent error handling and responses

### Documentation Structure

- **Implementation Plans** - Detailed development roadmaps
- **Changelog** - Comprehensive change tracking (99+ entries)
- **Troubleshooting Guides** - Common issues and solutions
- **API References** - Complete endpoint documentation

📋 **Read more:** [Documentation Analysis](./analysis/documentation-analysis-and-tasks.md)

## 🎯 For AI Agents

### Getting Started

1. **Read** [AI Development Methodology](./development/ai-development-methodology.md)
2. **Follow** AICODE comment system for persistent memory
3. **Use** implementation plan templates for new features
4. **Update** documentation as you make changes

### Key Resources

- **[AGENTS.md](../AGENTS.md)** - AI agent guidelines and architecture overview
- **[API Integration](./api-integration/README.md)** - External service integrations
- **[Architecture](./architecture/README.md)** - System design and patterns
- **[Development](./development/README.md)** - Development processes and tools

### Common Tasks

- **Media Generation** - Use `configure-image-generation` and `configure-video-generation` tools
- **Document Creation** - Use `create-document` and `update-document` tools
- **Code Changes** - Follow two-phase development (planning → implementation)
- **Documentation** - Always update relevant docs when making changes

## 📚 Reference

### FAQ & Glossary

- **[FAQ](./reference/faq.md)** - Frequently asked questions
- **[Glossary](./reference/glossary.md)** - Technical terms and definitions

### File Structure

```
docs/
├── ai-capabilities/          # AI features and tools
├── api-integration/          # External API integrations
├── architecture/             # System design
├── development/              # Development methodology
├── getting-started/          # Setup and basics
├── maintenance/              # Changes and maintenance
├── reference/               # FAQ, glossary, etc.
└── websockets-implementation/ # Real-time features
```

## 🔗 External Links

- **SuperDuperAI API** - [https://dev-editor.superduperai.co](https://dev-editor.superduperai.co)
- **OpenAPI Documentation** - [https://dev-editor.superduperai.co/docs](https://dev-editor.superduperai.co/docs)

---

_This documentation is continuously updated. For the latest changes, check the [changelog](./maintenance/changelog/)._
