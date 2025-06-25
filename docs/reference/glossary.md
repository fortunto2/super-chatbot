# Glossary

Key terms and concepts used in the Super Chatbot project.

## AI and Machine Learning

**AICODE Comments**
Structured comment system for AI agent memory preservation across development sessions. Types: NOTE, TODO, ASK.

**AI Agent**
An AI assistant (like Claude or GPT) working on the codebase, following the AI-first development methodology.

**AI Tools**
Functions available to AI agents for media generation and document manipulation (e.g., `configureImageGeneration`).

**Artifact**
Generated content like images, videos, or documents that can be displayed and edited in the chat interface.

**FLUX Pro/Dev**
Advanced image generation models available through SuperDuperAI API for high-quality image creation.

## Project-Specific Terms

**Implementation Plan**
Detailed planning document created before coding that outlines architecture, testing, and deployment strategy.

**SuperDuperAI**
Primary external API provider for AI-powered image and video generation capabilities.

**Two-Phase Development**
Development methodology: Phase 1 (Planning) → Phase 2 (Implementation with AICODE comments).

**WebSocket Architecture**
Real-time communication system for streaming AI generation progress and updates.

## Technical Terms

**App Router**
Next.js 15 routing system using the `app/` directory structure for modern React applications.

**Drizzle ORM**
TypeScript-first database ORM used for PostgreSQL integration with type-safe database operations.

**Dynamic Model Loading**
System for fetching available AI models from SuperDuperAI API in real-time instead of hardcoded configurations.

**Server Components**
React components that run on the server, providing better performance and SEO for static content.

**Vercel Blob**
Cloud storage service for storing generated media files (images, videos) with CDN distribution.

## Video Generation

**Duration Support**
Maximum video length supported by different models (e.g., LTX: 5s, Sora: up to 20s).

**LTX**
Lightricks video generation model, most affordable option at $0.40/second.

**Model Selection**
Process of choosing optimal video generation model based on budget, quality, and duration requirements.

**VEO2/VEO3**
Google's premium video generation models with high quality but higher cost ($2-3/second).

**VIP Models**
Premium video generation models requiring special access/subscription (VEO, KLING, Sora).

## Development

**AICODE-ASK**
Comment type for questions requiring human clarification or architectural decisions.

**AICODE-NOTE**
Comment type for documenting complex logic, decisions, and context for future AI agents.

**AICODE-TODO**
Comment type for tracking future improvements and tasks within code context.

**Context Preservation**
Maintaining development context and decisions across multiple AI agent sessions through structured documentation.

**Implementation Plans Archive**
Directory storing approved implementation plans for reference and project tracking.

## API Integration

**Bearer Token**
Authentication method used for SuperDuperAI API calls, stored securely in environment variables.

**Dynamic Configuration**
Real-time fetching of model capabilities and pricing instead of static configuration files.

**Rate Limiting**
API usage restrictions that require retry logic and exponential backoff strategies.

**WebSocket Events**
Real-time messages for generation progress (`render_progress`, `render_result`) and task updates. 