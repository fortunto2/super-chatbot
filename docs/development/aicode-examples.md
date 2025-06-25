# AICODE Comment Examples

This document shows real examples of how AICODE comments are used in the Super Chatbot codebase to provide persistent memory and context for AI agents.

## Overview

The AICODE comment system creates a persistent memory layer within the code that helps AI agents:
- Understand complex logic across development sessions
- Track improvements and tasks within context
- Ask questions that need human clarification
- Share knowledge between different AI agents

## Real Examples from Codebase

### Example 1: Environment Configuration Logic

From `lib/config/superduperai.ts`:

```typescript
export function getSuperduperAIConfig(): SuperDuperAIConfig {
  // AICODE-NOTE: Environment detection based on NODE_ENV for automatic dev/prod switching
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // AICODE-NOTE: Environment-specific URLs with fallback to known endpoints
  // This allows for custom deployment configurations while providing sensible defaults
  const baseURL = isDevelopment 
    ? (process.env.SUPERDUPERAI_DEV_URL || 'https://dev-editor.superduperai.co')
    : (process.env.SUPERDUPERAI_PROD_URL || 'https://editor.superduperai.co');
    
  // AICODE-NOTE: Separate tokens for dev/prod environments for security isolation
  const apiToken = isDevelopment
    ? (process.env.SUPERDUPERAI_DEV_TOKEN || '')
    : (process.env.SUPERDUPERAI_PROD_TOKEN || '');

  // AICODE-TODO: Add token validation to ensure it follows expected format (Bearer token structure)
  if (!apiToken) {
    throw new Error(`SuperDuperAI API token is required...`);
  }
}
```

**Analysis:**
- **AICODE-NOTE** explains why environment detection is implemented this way
- **AICODE-NOTE** documents the fallback URL strategy for configuration flexibility
- **AICODE-TODO** identifies a specific improvement needed for token validation

### Example 2: API Configuration and Pricing

From `lib/config/superduperai.ts`:

```typescript
export const VIDEO_MODEL_SETTINGS = {
  [VIDEO_MODELS.LTX]: {
    // AICODE-NOTE: Current limits based on SuperDuperAI API constraints as of 2024
    maxDuration: 30, // seconds
    maxResolution: { width: 1216, height: 704 },
    
    // AICODE-TODO: Update pricing when SuperDuperAI provides official pricing structure
    pricePerSecond: 0.4,
    
    // AICODE-ASK: Should we add support for custom aspect ratios beyond these standard ones?
    supportedAspectRatios: ['16:9', '1:1', '9:16', '21:9'],
  },
} as const;
```

**Analysis:**
- **AICODE-NOTE** provides temporal context about when constraints were valid
- **AICODE-TODO** tracks dependency on external API changes
- **AICODE-ASK** raises architectural question for human decision

### Example 3: Authentication Implementation

From `lib/config/superduperai.ts`:

```typescript
export function createAuthHeaders(config?: SuperDuperAIConfig): Record<string, string> {
  const apiConfig = config || getSuperduperAIConfig();
  
  // AICODE-NOTE: Bearer token authentication as required by SuperDuperAI API
  // All API requests must include this authorization header
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiConfig.apiToken}`,
    // AICODE-TODO: Add User-Agent header for better API analytics and debugging
  };
}
```

**Analysis:**
- **AICODE-NOTE** documents API requirement and usage pattern
- **AICODE-TODO** suggests enhancement for operational visibility

## Best Practices Demonstrated

### 1. Context Documentation
```typescript
// AICODE-NOTE: Environment detection based on NODE_ENV for automatic dev/prod switching
```
- Explains WHY a particular approach was chosen
- Provides context for future modifications

### 2. Temporal Information
```typescript
// AICODE-NOTE: Current limits based on SuperDuperAI API constraints as of 2024
```
- Includes time-sensitive information
- Helps identify when information might be outdated

### 3. Dependency Tracking
```typescript
// AICODE-TODO: Update pricing when SuperDuperAI provides official pricing structure
```
- Links internal tasks to external dependencies
- Clear action items for future development

### 4. Architecture Questions
```typescript
// AICODE-ASK: Should we add support for custom aspect ratios beyond these standard ones?
```
- Identifies areas needing human judgment
- Documents uncertainty for future review

### 5. Integration Requirements
```typescript
// AICODE-NOTE: Bearer token authentication as required by SuperDuperAI API
// All API requests must include this authorization header
```
- Documents external API requirements
- Provides critical integration context

## AI Agent Workflow with These Comments

### Before Modifying Code
1. Search for existing AICODE comments:
   ```bash
   grep -r "AICODE-" lib/config/superduperai.ts
   ```

2. Read and understand context from AICODE-NOTE comments

3. Check for relevant AICODE-TODO items

4. Note any AICODE-ASK questions that might need addressing

### During Development
1. Add AICODE-NOTE for complex logic or decisions
2. Create AICODE-TODO for future improvements
3. Use AICODE-ASK when uncertain about approach

### After Development
1. Convert resolved AICODE-ASK to AICODE-NOTE
2. Mark completed AICODE-TODO items
3. Add new comments for complex additions

## Comment Quality Examples

### ✅ Good AICODE Comments
```typescript
// AICODE-NOTE: Environment-specific URLs with fallback to known endpoints
// This allows for custom deployment configurations while providing sensible defaults

// AICODE-TODO: Add token validation to ensure it follows expected format (Bearer token structure)

// AICODE-ASK: Should we add support for custom aspect ratios beyond these standard ones?
```

### ❌ Poor AICODE Comments
```typescript
// AICODE-NOTE: This function gets config
// AICODE-TODO: Fix this
// AICODE-ASK: Is this right?
```

## Search Patterns for AI Agents

### Find All AICODE Comments
```bash
grep -r "AICODE-" . --include="*.ts" --include="*.tsx"
```

### Find Specific Comment Types
```bash
grep -r "AICODE-NOTE" . --include="*.ts"
grep -r "AICODE-TODO" . --include="*.ts"  
grep -r "AICODE-ASK" . --include="*.ts"
```

### Find Comments in Specific Directory
```bash
grep -r "AICODE-" lib/ --include="*.ts"
```

## Integration with Development Workflow

### Code Reviews
- Verify AICODE comments provide value
- Ensure ASK comments have been addressed
- Check that TODO items are reasonable

### Documentation Updates
- Include relevant AICODE comments in implementation plans
- Reference complex AICODE-NOTE comments in pull requests
- Track resolution of AICODE-ASK questions

### Knowledge Transfer
- New AI agents can quickly understand context
- Complex decisions are preserved across sessions
- Questions and tasks remain visible in code context

## Conclusion

AICODE comments transform code from static implementation to living documentation that preserves context, tracks improvements, and facilitates collaboration between AI agents and human developers. The examples shown demonstrate how this system maintains continuity and understanding in complex projects. 