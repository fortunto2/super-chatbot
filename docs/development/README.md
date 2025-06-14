# Development

AI-first development methodology and tools for working on the Super Chatbot project.

## 🚀 Core Development Approach

This project uses a **two-phase AI-first development methodology** designed for complex projects with multiple AI agents.

### Phase 1: Implementation Planning
- Create detailed implementation plan before writing code
- Get human approval for architectural decisions
- Define testing strategy and success criteria

### Phase 2: Implementation with AICODE Comments
- Follow approved implementation plan exactly
- Use AICODE comment system for persistent memory
- Document decisions and questions in code

## 📁 Files in This Section

### [AI Development Methodology](./ai-development-methodology.md) ⭐ **Essential**
Complete guide to the two-phase development process including:
- Structured planning approach
- AICODE comment system (NOTE/TODO/ASK)
- Multi-agent coordination patterns
- Success metrics and troubleshooting

### [Implementation Plan Template](./implementation-plan-template.md)
Standardized template for creating detailed implementation plans:
- Requirements and architecture decisions
- SuperDuperAI integration planning
- Testing strategy and deployment considerations
- Risk assessment and rollback procedures

### [AICODE Comment Examples](./aicode-examples.md)
Real examples from the codebase showing:
- How to use AICODE-NOTE for context preservation
- AICODE-TODO for future improvements
- AICODE-ASK for human clarification
- Best practices and patterns

### [Implementation Plans Archive](./implementation-plans/)
Approved implementation plans for reference and tracking.

## 🎯 Quick Start for AI Agents

### Before Starting Any Feature:
1. **Read methodology**: [AI Development Methodology](./ai-development-methodology.md)
2. **Search existing comments**: `grep -r "AICODE-" . --include="*.ts"`
3. **Create implementation plan**: Use [template](./implementation-plan-template.md)
4. **Get human approval** for the plan

### During Development:
1. **Follow plan exactly** - deviations require plan updates
2. **Add AICODE comments** for complex logic
3. **Document decisions** and questions
4. **Reference plan** in commit messages

### After Implementation:
1. **Archive plan** in implementation-plans/
2. **Update documentation** if needed
3. **Clean up** completed AICODE-TODO items
4. **Create PR** with plan reference

## 🔍 AICODE Comment System

### Comment Types:
- `AICODE-NOTE`: Persistent information about logic and decisions
- `AICODE-TODO`: Tasks for future development sessions  
- `AICODE-ASK`: Questions requiring human clarification

### Search Commands:
```bash
# Find all AICODE comments
grep -r "AICODE-" . --include="*.ts" --include="*.tsx"

# Find specific types
grep -r "AICODE-NOTE" . --include="*.ts"
grep -r "AICODE-TODO" . --include="*.ts"
grep -r "AICODE-ASK" . --include="*.ts"
```

## 🏗 Integration with Main Development

This methodology integrates with:
- Main [AGENTS.md](../../AGENTS.md) guidelines
- Project [Architecture](../architecture/README.md)
- [API Integration](../api-integration/README.md) patterns
- [AI Capabilities](../ai-capabilities/README.md) development

## 📊 Benefits

- **Predictable Development**: Structured process reduces errors
- **Context Preservation**: AICODE comments maintain memory across sessions
- **Quality Assurance**: Implementation plans ensure thorough planning  
- **Team Coordination**: Multiple AI agents can work consistently
- **Knowledge Sharing**: Persistent documentation in code 