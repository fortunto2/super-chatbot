# Dotenv Conflict Resolution

## Problem Description

Video generation settings component was showing only single model (LTX) instead of multiple available models due to environment configuration conflicts caused by `dotenv` package.

## Root Cause

The issue was caused by a conflict between Next.js automatic environment variable loading and the `dotenv` package:

1. **Next.js automatically loads** `.env`, `.env.local`, `.env.development` files
2. **dotenv package interfered** with this automatic loading process
3. **Missing environment variable**: `SUPERDUPERAI_URL` was not defined in `.env`
4. **Wrong file path**: Some configurations pointed to `.env.local` instead of `.env`

## Error Symptoms

- Only 1 fallback model (comfyui/ltx) appeared in video settings
- Console errors: "SuperDuperAI API token is required"
- API calls failing with "Not Found" errors
- Environment variables not being loaded properly

## Solution Applied

### 1. Remove dotenv Dependency
```bash
pnpm remove dotenv
```

### 2. Remove dotenv Imports
Removed `import { config } from 'dotenv';` and `config()` calls from:
- `drizzle.config.ts`
- `lib/db/migrate.ts` 
- `lib/db/helpers/01-core-to-parts.ts`
- `playwright.config.ts`

### 3. Add Missing Environment Variable
Added to `.env`:
```
SUPERDUPERAI_URL=https://dev-editor.superduperai.co
```

### 4. Fix File Path References
Changed `.env.local` references to `.env` where needed.

## Results

After the fix, the system now properly loads **11 video models**:

- Google VEO3 (Text/Image-to-Video) - $3/sec
- Google VEO2 (Text/Image-to-Video) - $2/sec
- Minimax variants - $1.2/sec
- KLING 2.1 Standard/Pro - $1-2/sec
- LTX - $0.4/sec
- LipSync - $0.4/sec
- OpenAI Sora - $10/sec

## Key Insights

1. **Next.js has built-in env support** - no need for additional dotenv
2. **Package conflicts can break env loading** - prefer framework defaults
3. **Missing variables cause fallback behavior** - all required vars must be set
4. **Environment consistency matters** - use same .env file across configs

## Prevention

- Use Next.js built-in environment variable loading
- Avoid unnecessary third-party env packages
- Ensure all required environment variables are defined
- Test environment loading separately from application logic

## Testing Command

To verify environment variables work without the application:
```bash
SUPERDUPERAI_TOKEN=your_token SUPERDUPERAI_URL=your_url npx tsx your_test_script.js
``` 