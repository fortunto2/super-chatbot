# Environment Setup Guide

This guide explains how to set up environment variables for secure SuperDuperAI API integration.

## Required Environment Variables

### SuperDuperAI API Configuration (Simplified)

**New simplified configuration** with single environment variables:

```bash
# SuperDuperAI API (Simplified - Recommended)
SUPERDUPERAI_URL="https://dev-editor.superduperai.co"  # Switch between dev/prod manually
SUPERDUPERAI_TOKEN="your-api-token-here"
```

**Environment URLs:**
- Development: `https://dev-editor.superduperai.co`
- Production: `https://editor.superduperai.co`

### Environment Switching

To switch between development and production environments, simply change the URL:

```bash
# For development
SUPERDUPERAI_URL="https://dev-editor.superduperai.co"
SUPERDUPERAI_TOKEN="your-dev-token"

# For production
SUPERDUPERAI_URL="https://editor.superduperai.co"
SUPERDUPERAI_TOKEN="your-prod-token"
```

## Security Best Practices

### 1. Token Management
- **Never commit API tokens to version control**
- Use different tokens for development and production
- Rotate tokens regularly
- Store tokens securely (use services like Vercel Environment Variables, AWS Secrets Manager, etc.)

### 2. Environment Files
Create separate environment files:

#### `.env.local` (for local development)
```bash
# New simplified configuration
SUPERDUPERAI_URL="https://dev-editor.superduperai.co"
SUPERDUPERAI_TOKEN="afda4dc28cf1420db6d3e35a291c2d5f"
```

#### Production deployment
Set environment variables in your deployment platform:
```bash
# Production configuration
SUPERDUPERAI_URL="https://editor.superduperai.co"
SUPERDUPERAI_TOKEN="your-production-token"
```

#### Configuration Examples
```bash
# Development setup
SUPERDUPERAI_URL="https://dev-editor.superduperai.co"
SUPERDUPERAI_TOKEN="afda4dc28cf1420db6d3e35a291c2d5f"

# Production setup  
SUPERDUPERAI_URL="https://editor.superduperai.co"
SUPERDUPERAI_TOKEN="your-production-token"
```

## Configuration Usage

### Automatic Configuration
The application automatically loads the correct configuration:

```typescript
import { getSuperduperAIConfig } from '@/lib/config/superduperai';

// Automatically uses dev or prod config based on NODE_ENV
const config = getSuperduperAIConfig();
```

### Manual Override
You can override the environment detection:

```typescript
// Force development config
process.env.NODE_ENV = 'development';
const devConfig = getSuperduperAIConfig();

// Force production config  
process.env.NODE_ENV = 'production';
const prodConfig = getSuperduperAIConfig();
```

## Fallback URLs

If environment variables are not set, the application uses these defaults:
- Development: `https://dev-editor.superduperai.co`
- Production: `https://editor.superduperai.co`

**⚠️ Warning**: The application will throw an error if API tokens are not provided.

## Deployment Platforms

### Vercel
```bash
# Set via Vercel CLI
vercel env add SUPERDUPERAI_PROD_TOKEN
vercel env add SUPERDUPERAI_PROD_URL

# Or via Vercel Dashboard
# Project Settings → Environment Variables
```

### Docker
```dockerfile
# In your Dockerfile
ENV SUPERDUPERAI_PROD_TOKEN=your-token
ENV SUPERDUPERAI_PROD_URL=https://editor.superduperai.co
```

### AWS/Serverless
```yaml
# serverless.yml
environment:
  SUPERDUPERAI_PROD_TOKEN: ${env:SUPERDUPERAI_PROD_TOKEN}
  SUPERDUPERAI_PROD_URL: https://editor.superduperai.co
```

## Testing Configuration

### Verify Setup
You can test your configuration:

```typescript
import { getSuperduperAIConfig } from '@/lib/config/superduperai';

try {
  const config = getSuperduperAIConfig();
  console.log('✅ Configuration loaded successfully');
  console.log('Environment:', config.environment);
  console.log('Base URL:', config.baseURL);
} catch (error) {
  console.error('❌ Configuration error:', error.message);
}
```

### API Health Check
```typescript
import { createAPIURL, createAuthHeaders } from '@/lib/config/superduperai';

async function testAPI() {
  try {
    const response = await fetch(createAPIURL('/api/v1/health'), {
      headers: createAuthHeaders()
    });
    
    if (response.ok) {
      console.log('✅ API connection successful');
    }
  } catch (error) {
    console.error('❌ API connection failed:', error);
  }
}
```

## Migration from Hardcoded Tokens

If you're migrating from hardcoded tokens:

### Before (Insecure)
```typescript
const token = "afda4dc28cf1420db6d3e35a291c2d5f"; // ❌ Hardcoded
const url = "https://editor.superduperai.co"; // ❌ Hardcoded
```

### After (Secure)
```typescript
import { getSuperduperAIConfig, createAuthHeaders, createAPIURL } from '@/lib/config/superduperai';

const config = getSuperduperAIConfig(); // ✅ From environment
const headers = createAuthHeaders(); // ✅ Secure headers
const url = createAPIURL('/api/v1/endpoint'); // ✅ Dynamic URL
```

## Troubleshooting

### Common Issues

1. **Missing Token Error**
   ```
   Error: SuperDuperAI API token is required. Please set SUPERDUPERAI_DEV_TOKEN in your environment variables.
   ```
   **Solution**: Set the appropriate token environment variable.

2. **Wrong Environment**
   - Check `NODE_ENV` value
   - Verify token is set for the correct environment (dev/prod)

3. **Network Issues**
   - Verify URLs are correct
   - Check firewall/proxy settings
   - Test API connectivity manually

### Debug Mode
Enable debug logging:

```bash
DEBUG=superduperai:* npm run dev
```

This will show detailed configuration and API call information. 