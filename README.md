<a href="https://chat.vercel.ai/">
  <img alt="AI-powered media creation platform with image, video, screenplay and storyboard generation." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Super Chatbot - AI Media Creation Platform</h1>
</a>

<p align="center">
    Super Chatbot is a comprehensive AI-powered creative platform that generates images, videos, screenplays, and storyboards from text descriptions. Built with Next.js and advanced AI models for professional content creation.
</p>

<p align="center">
  <a href="docs/ai-media-capabilities.md"><strong>AI Capabilities</strong></a> ·
  <a href="docs/prompt-examples.md"><strong>Prompt Examples</strong></a> ·
  <a href="#core-features"><strong>Core Features</strong></a> ·
  <a href="#ai-models"><strong>AI Models</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a>
</p>
<br/>

## Core Features

### 🎨 **Image Generation**

- **FLUX Pro/Dev Models**: Professional-grade image generation with exceptional quality
- **Multiple Styles**: Photorealistic, cinematic, artistic, anime, cartoon, steampunk, sci-fi
- **Flexible Resolutions**: Square, portrait, landscape, and custom aspect ratios
- **Shot Control**: From extreme close-ups to panoramic landscapes
- **Real-time Progress**: WebSocket-powered generation tracking

### 🎬 **Video Generation**

- **SuperDuperAI Veo3**: Cutting-edge video synthesis technology
- **Multiple Formats**: 16:9, 9:16, 4:3, 1:1 aspect ratios for all platforms
- **Frame Rate Control**: 24fps cinematic to 120fps high-speed
- **Duration Flexibility**: 5-60 second video clips
- **Professional Quality**: Full HD, HD, and SD output options

### 📝 **Screenplay Creation**

- **Industry-Standard Format**: Professional screenplay formatting
- **Character Development**: Consistent character voices and story arcs
- **Genre Expertise**: Comedy, drama, thriller, sci-fi, documentary styles
- **Dialogue Crafting**: Natural, engaging conversations with subtext
- **Collaborative Editing**: Real-time multi-user screenplay development

### 🎯 **Storyboard Design**

- **Visual Planning**: Convert scripts into detailed visual panels
- **Camera Notation**: Professional shot types, angles, and movements
- **Scene Visualization**: Consistent character and environment design
- **Technical Annotations**: Lighting, effects, and production notes
- **Export Options**: PDF, image sequences, and digital formats

### 🔧 **Technical Foundation**

- [Next.js 15](https://nextjs.org) App Router with React 19
  - Advanced routing and React Server Components
  - Server Actions for optimal performance
- [AI SDK](https://sdk.vercel.ai/docs) Integration
  - Unified API for text, image, and video generation
  - Real-time streaming and tool calling
  - Multi-modal AI capabilities
- [shadcn/ui](https://ui.shadcn.com) Design System
  - Tailwind CSS for responsive styling
  - Radix UI primitives for accessibility
- Enterprise Data Management
  - PostgreSQL with Drizzle ORM
  - Vercel Blob for media storage
  - Real-time collaboration features

## AI Models

### Image Generation

- **FLUX Pro**: Commercial-grade photorealistic images
- **FLUX Dev**: Creative exploration and artistic styles
- **SDXL**: Alternative high-quality image synthesis

### Video Generation

- **SuperDuperAI Veo3**: Primary video generation model
- **Runway Gen-3**: Advanced motion and scene understanding
- **Stable Video Diffusion**: Consistent video synthesis

### Text Generation

- **GPT-4**: Advanced language understanding and creative writing
- **Claude**: Sophisticated dialogue and narrative creation
- **xAI Grok**: Real-time information and creative assistance

## Deploy Your Own

Deploy your AI media creation platform to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Generate%20a%20random%20secret%20to%20use%20for%20authentication&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F32&project-name=super-chatbot&repository-name=super-chatbot&demo-title=Super%20Chatbot&demo-description=AI-powered%20media%20creation%20platform%20for%20images%2C%20videos%2C%20screenplays%20and%20storyboards&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

Set up your local development environment with the required API keys and configuration:

> Note: You should not commit your `.env` file or it will expose secrets that allow others to control access to your AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts: `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your AI media creation platform will be running on [localhost:3000](http://localhost:3000).

## Architecture

This application is built with a modern, scalable architecture designed for professional content creation:

### 📚 Documentation

- **[AI Media Capabilities](docs/ai-media-capabilities.md)** - Comprehensive overview of AI features
- **[Prompt Examples](docs/prompt-examples.md)** - Proven prompts for optimal results
- **[Technical Specifications](docs/TECHNICAL_SPECIFICATIONS.md)** - Implementation details
- **[WebSocket Architecture](docs/CHAT_WEBSOCKET_ARCHITECTURE.md)** - Real-time communication
- **[AGENTS.md](AGENTS.md)** - AI agent development guide

### 🏗️ Core Components

- **Creative Interface**: Intuitive design for media generation workflows
- **AI Engine**: Multi-modal AI integration with streaming capabilities
- **Media Pipeline**: Professional-grade asset processing and storage
- **Collaboration Tools**: Real-time editing and project management
- **Export System**: Professional format output and integration

### 🤖 AI Integration

- **SuperDuperAI API**: Primary media generation backend
- **WebSocket Updates**: Real-time generation progress tracking
- **Batch Processing**: Efficient multi-asset generation
- **Style Consistency**: Maintained visual language across projects
- **Quality Control**: Multi-tier output options for different needs

### 🔧 Development Features

- **Type Safety**: Full TypeScript implementation
- **Code Quality**: Biome for linting and formatting
- **Testing**: Comprehensive E2E testing with Playwright
- **Monitoring**: Sentry for error tracking and performance
- **Security**: NextAuth v5 with enterprise-grade authentication

## Use Cases

### Content Creation

- **Marketing Campaigns**: Complete visual campaigns from concept to completion
- **Social Media**: Platform-optimized content across all formats
- **Educational Materials**: Instructional videos and visual aids
- **Entertainment**: Short films, commercials, and promotional content

### Professional Production

- **Pre-Production**: Complete pre-visualization for film and video projects
- **Concept Art**: Visual development for games, films, and products
- **Client Presentations**: Professional pitch materials and mockups
- **Rapid Prototyping**: Quick visual iteration for creative projects

## Getting Started

### Quick Examples

**Generate an Image:**

```
"Create a cinematic wide shot of a futuristic cityscape at sunset with flying cars, photorealistic style"
```

**Create a Video:**

```
"Generate a 10-second video of ocean waves crashing on a beach at golden hour, 30fps, cinematic"
```

**Write a Screenplay:**

```
"Write a 3-page comedy screenplay about two robots learning to dance"
```

**Design a Storyboard:**

```
"Create a 6-panel storyboard for a smartphone commercial with camera angles and transitions"
```

For detailed examples and advanced techniques, see our [Prompt Examples Guide](docs/prompt-examples.md).

## 🐛 Image Generation Debugging

If generated images don't appear in chat, follow these steps:

### 1. Open Browser Console

- Press F12 or right-click → Inspect → Console tab

### 2. Generate an Image

- Use the chat to request image generation (e.g., "generate image of a cat")

### 3. Monitor Debug Logs

Look for this sequence in console:

```
🎨 ✅ Image completed via SSE file event: [URL]
🔄 ImageArtifactWrapper memo: content changed, triggering re-render
🔧 ImageArtifactWrapper: initial state updated
🎯 ImageEditor: initialState updated
🎯 ImageEditor display state: { showImage: true, displayImageUrl: [URL] }
```

### 4. Quick Fix Commands

If image doesn't appear, try these console commands:

```javascript
quickImageFix(); // Apply last generated image
imageSystem.debug(); // Check system health
checkCurrentArtifact(); // Check artifact state
```

### 5. Save Images Permanently

To keep generated images accessible after closing artifacts:

```javascript
addImageToChat(); // Add last generated image to chat history
addImageToChat("https://your-image-url.com"); // Add specific image URL
```

**Why this is needed:** After closing an artifact, images disappear from the interface. The `addImageToChat()` function adds images to the chat message history where they remain permanently accessible.

### 6. Report Issues

When reporting problems, include:

- Which debug log step is missing/failing
- Full console output with timestamps
- Browser and version information

---
