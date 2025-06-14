# Super Chatbot Documentation

Structured documentation for AI agents to quickly find and use relevant information.

## 🚀 Quick Navigation for AI Agents

### [📚 Getting Started](./getting-started/README.md)
Start here for environment setup and project onboarding.

### [🔧 Development](./development/README.md)
AI-first development methodology, implementation planning, and AICODE comment system.

### [🏗 Architecture](./architecture/README.md)
System architecture, API design, and technical specifications.

### [🤖 AI Capabilities](./ai-capabilities/README.md)
Image and video generation, models, pricing, and usage examples.

### [🔗 API Integration](./api-integration/README.md)
SuperDuperAI API integration, authentication, and external service connections.

### [🛠 Maintenance](./maintenance/README.md)
Changelog, troubleshooting, and project maintenance information.

### [📖 Reference](./reference/README.md)
Glossary, FAQ, and quick reference materials.

## 🎯 For AI Agents: Best Entry Points

### Starting a New Feature
1. Read [Development Methodology](./development/ai-development-methodology.md)
2. Use [Implementation Plan Template](./development/implementation-plan-template.md)
3. Search existing [AICODE Comments](./development/aicode-examples.md)

### Working with AI Media Generation
1. Check [AI Capabilities Overview](./ai-capabilities/overview.md)
2. For images: [Image Generation Guide](./ai-capabilities/image-generation/README.md)
3. For videos: [Video Models Guide](./ai-capabilities/video-generation/models-guide.md)

### API Integration Tasks
1. Review [SuperDuperAI Integration](./api-integration/superduperai/README.md)
2. Check [Environment Setup](./getting-started/environment-setup.md)
3. Use [Dynamic API Integration](./api-integration/superduperai/dynamic-integration.md)

### Architecture Understanding
1. Start with [System Overview](./architecture/system-overview.md)
2. Review [API Architecture](./architecture/api-architecture.md)
3. Check [WebSocket Architecture](./architecture/websocket-architecture.md)

## 📋 Document Categories

| Category | Purpose | Key Files |
|----------|---------|-----------|
| **Getting Started** | Environment setup, onboarding | environment-setup.md |
| **Development** | AI methodology, AICODE system | ai-development-methodology.md |
| **Architecture** | System design, technical specs | system-overview.md, api-architecture.md |
| **AI Capabilities** | Media generation, models | overview.md, models-guide.md |
| **API Integration** | External APIs, authentication | superduperai/, dynamic-integration.md |
| **Maintenance** | Changelog, troubleshooting | changelog/, troubleshooting.md |
| **Reference** | Glossary, FAQ, quick reference | glossary.md, faq.md |

## 🔍 Search Patterns for AI Agents

### Finding AICODE Comments
```bash
grep -r "AICODE-" . --include="*.ts" --include="*.tsx"
```

### Finding Implementation Plans
```bash
ls docs/development/implementation-plans/
```

### Finding Model Information
```bash
# Video models
cat docs/ai-capabilities/video-generation/models-guide.md

# Image generation
cat docs/ai-capabilities/image-generation/README.md
```

## 📚 Related Resources

- [`../AGENTS.md`](../AGENTS.md) - Main AI agent guidelines
- Root README.md - Project overview and setup
- Implementation plans archive in `development/implementation-plans/`

This structured approach ensures AI agents can quickly navigate to relevant information without getting lost in documentation chaos. 