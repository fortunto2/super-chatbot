# Architecture

System architecture, API design, and technical specifications for Super Chatbot.

## 📁 Files in This Section

### [System Overview](./system-overview.md) ⭐ **Start Here**
Complete system architecture including:
- Next.js 15 App Router architecture
- AI agent system design
- Database schema and ORM setup
- File storage and media handling

### [API Architecture](./api-architecture.md)
API design and integration patterns:
- Next.js API Routes structure
- SuperDuperAI API integration
- Dynamic model configuration
- HTTP client and caching strategies

### [WebSocket Architecture](./websocket-architecture.md)
Real-time communication design:
- Chat-level WebSocket connections
- Image/video generation progress tracking
- Connection management and cleanup
- Performance optimizations

### [Technical Specifications](./technical-specifications.md)
Detailed technical implementation:
- Frontend implementation details
- Backend API architecture
- Performance optimizations
- Security best practices

## 🎯 For AI Agents

### Understanding the System:
1. **Start with**: [System Overview](./system-overview.md) for big picture
2. **API Design**: [API Architecture](./api-architecture.md) for integration patterns
3. **Real-time Features**: [WebSocket Architecture](./websocket-architecture.md)
4. **Implementation Details**: [Technical Specifications](./technical-specifications.md)

### Quick Reference:
- **Database**: PostgreSQL with Drizzle ORM
- **API**: Next.js App Router with SuperDuperAI integration
- **WebSocket**: Chat-level connections for real-time updates
- **Storage**: Vercel Blob for media files
- **Auth**: NextAuth v5 with guest support

## 🔗 Related Sections

- [API Integration](../api-integration/README.md) - External API usage
- [AI Capabilities](../ai-capabilities/README.md) - Media generation features
- [Development](../development/README.md) - Development methodology 