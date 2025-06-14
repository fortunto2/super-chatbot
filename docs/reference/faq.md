# Frequently Asked Questions

Common questions and solutions for Super Chatbot development.

## Development Process

### Q: How do I start working on a new feature?
**A:** Follow the AI-first development methodology:
1. Read [AI Development Methodology](../development/ai-development-methodology.md)
2. Search for existing AICODE comments: `grep -r "AICODE-" . --include="*.ts"`
3. Create an [Implementation Plan](../development/implementation-plan-template.md)
4. Get human approval for the plan
5. Implement following the plan with AICODE comments

### Q: What are AICODE comments and why should I use them?
**A:** AICODE comments provide persistent memory for AI agents across sessions:
- `AICODE-NOTE`: Document complex logic and decisions
- `AICODE-TODO`: Track future improvements
- `AICODE-ASK`: Questions requiring human clarification

See [AICODE Examples](../development/aicode-examples.md) for usage patterns.

### Q: Do I need to create an implementation plan for small changes?
**A:** Yes, for any feature development. Small changes can use a simplified plan, but the planning phase helps prevent issues and maintains code quality.

## AI Capabilities

### Q: Which video model should I recommend to users?
**A:** Use the dynamic model selection tools:
- Budget users: `findBestVideoModel({ maxPrice: 0.5, vipAllowed: false })` → LTX
- Quality users: `findBestVideoModel({ maxPrice: 3.0, prioritizeQuality: true })` → VEO3
- Long videos: `findBestVideoModel({ preferredDuration: 15 })` → Sora

### Q: How do I check what video models are currently available?
**A:** Use `listVideoModels({ format: 'agent-friendly' })` to get current models with pricing and capabilities. Don't hardcode model names.

### Q: Why am I getting "model not found" errors?
**A:** Models change frequently. Always use the dynamic model selection system instead of hardcoding model names. Check [Dynamic Integration](../api-integration/superduperai/dynamic-integration.md).

### Q: How do video generation costs work?
**A:** Costs are per-second of generated video:
- LTX: $0.40/sec (budget option)
- VEO2/Sora: $2.00/sec (mid-tier)  
- VEO3: $3.00/sec (premium)

See [Pricing Guide](../ai-capabilities/video-generation/pricing-guide.md) for details.

## API Integration

### Q: How do I set up SuperDuperAI API access?
**A:** 
1. Get API tokens for dev/prod environments
2. Set environment variables (see [Environment Setup](../getting-started/environment-setup.md))
3. Test connectivity with the provided endpoints
4. Never hardcode tokens in source code

### Q: What's the difference between dev and prod API environments?
**A:**
- **Dev**: `https://dev-editor.superduperai.co` - for testing and development
- **Prod**: `https://editor.superduperai.co` - for production deployments
The system automatically selects based on `NODE_ENV`.

### Q: How do I handle API rate limiting?
**A:** The HTTP client includes automatic retry logic with exponential backoff. For custom implementations, wait increasing intervals between retries (2s, 4s, 8s, etc.).

### Q: Why are my WebSocket connections not working?
**A:** Check:
1. Correct WebSocket URL (wss://, not https://)
2. Valid authentication tokens
3. Network connectivity and firewall settings
4. Review [WebSocket Architecture](../architecture/websocket-architecture.md)

## Architecture

### Q: Should I use Server Components or Client Components?
**A:** 
- **Server Components**: Default choice for static content, data fetching, initial renders
- **Client Components**: When you need interactivity, useState, useEffect, or browser APIs
- Add `"use client"` directive only when necessary

### Q: How does the artifact system work?
**A:** Artifacts are generated content (images, videos, documents) that can be displayed and edited in chat:
1. Created with `createDocument` tool
2. Updated with `updateDocument` tool  
3. Rendered in the chat interface
4. Support real-time collaborative editing

### Q: What's the database schema structure?
**A:** See [System Overview](../architecture/system-overview.md) for complete schema. Key tables:
- `users` - Authentication and profiles
- `chats` - Chat sessions
- `messages` - Individual messages with metadata
- `documents` - Artifact content and versions

## Troubleshooting

### Q: My environment variables aren't loading
**A:** Check:
1. File is named `.env.local` for local development
2. Variables are in UPPERCASE format
3. No quotes around values (unless needed)
4. Restart the development server after changes

### Q: How do I debug WebSocket issues?
**A:** 
1. Check browser dev tools Network tab for WebSocket connections
2. Look for connection errors in console
3. Verify API token validity
4. Use debug mode: `DEBUG=superduperai:* npm run dev`

### Q: The application is slow, how do I optimize?
**A:** Check:
1. Bundle size analysis
2. Database query optimization
3. Image/video file sizes
4. Network requests (use caching)
5. Server Component vs Client Component usage

### Q: How do I handle errors in AI generation?
**A:** The system includes comprehensive error handling:
- Network errors: Automatic retries
- API errors: Graceful degradation  
- Validation errors: User-friendly messages
- Check [Technical Specifications](../architecture/technical-specifications.md) for patterns

## Getting Help

### Q: Where can I find more detailed information?
**A:** Documentation is organized by category:
- **Getting Started**: Setup and configuration
- **Development**: AI methodology and implementation
- **Architecture**: Technical design and specifications  
- **AI Capabilities**: Media generation features
- **API Integration**: External API usage
- **Reference**: Quick lookup and glossary

### Q: How do I report issues or bugs?
**A:** 
1. Check [Maintenance](../maintenance/README.md) for known issues
2. Review [Changelog](../maintenance/changelog/) for recent changes
3. Document steps to reproduce the issue
4. Include relevant error messages and logs 