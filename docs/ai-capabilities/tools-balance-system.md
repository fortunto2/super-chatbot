# Tools Balance System

## Overview

The Tools Balance System is a comprehensive credit-based system for controlling access to AI tools in Super Chatbot. Users consume credits when using image generation, video generation, script generation, and prompt enhancement tools.

## Features

- **Credit-based pricing** with different costs for different operations
- **User type-based allocation** (guests vs. registered users)
- **Real-time balance checking** before operations
- **Automatic balance deduction** after successful operations
- **Admin balance management** with API endpoints
- **UI components** for balance display and pricing information

## Architecture

### Components

1. **Pricing Configuration** (`lib/config/tools-pricing.ts`)

   - Defines costs for different operations
   - Supports cost multipliers for quality, duration, etc.
   - Configurable pricing for future adjustments

2. **Balance Management** (`lib/utils/tools-balance.ts`)

   - Core utilities for balance operations
   - Database interactions
   - Transaction logging

3. **API Endpoints**

   - `/api/tools-balance` - User balance information
   - `/api/admin/balance` - Admin balance management
   - Generation endpoints with balance integration

4. **UI Components** (`components/tools-balance.tsx`)
   - Balance display in different variants
   - Pricing information component
   - Real-time balance updates

## Pricing Structure

### Image Generation

- **Text to Image**: 2 credits (base)
- **Image to Image**: 3 credits (base)
- **High Quality**: +50% cost multiplier
- **Ultra Quality**: +100% cost multiplier

### Video Generation

- **Text to Video**: 10 credits (base)
- **Image to Video**: 15 credits (base)
- **Duration Multipliers**:
  - 5 seconds: 1x (base)
  - 10 seconds: 2x
  - 15 seconds: 3x
  - 30 seconds: 6x
- **Quality Multipliers**:
  - HD: +50%
  - 4K: +150%

### Script Generation

- **Basic Script**: 1 credit
- **Long Form**: 2 credits (for prompts >200 characters)

### Prompt Enhancement

- **Basic Enhancement**: 1 credit
- **VEO3 Enhancement**: 2 credits

## User Balance Allocation

### Guest Users

- **Initial Balance**: 50 credits
- **Purpose**: Trial experience with reasonable usage

### Registered Users

- **Initial Balance**: 200 credits
- **Purpose**: Extended usage for registered accounts

## Implementation Guide

### Adding New Tools

1. **Define Pricing** in `tools-pricing.ts`:

```typescript
'new-tool': {
  'operation-type': {
    id: 'operation-type',
    name: 'Operation Name',
    description: 'Description',
    baseCost: 5,
    costMultipliers: {
      'premium': 2.0
    }
  }
}
```

2. **Integrate in API Endpoint**:

```typescript
// Check balance before operation
const balanceValidation = await validateOperationBalance(
  userId,
  "new-tool",
  "operation-type",
  multipliers
);

if (!balanceValidation.valid) {
  return NextResponse.json(
    {
      success: false,
      error: "Insufficient balance",
      details: balanceValidation.error,
      requiredCredits: balanceValidation.cost,
    },
    { status: 402 }
  );
}

// ... perform operation ...

// Deduct balance after success
await deductOperationBalance(
  userId,
  "new-tool",
  "operation-type",
  multipliers,
  metadata
);
```

### Adjusting Pricing

Update values in `tools-pricing.ts`:

```typescript
export const TOOLS_PRICING = {
  "image-generation": {
    "text-to-image": {
      baseCost: 3, // Changed from 2 to 3
      // ...
    },
  },
};
```

## API Reference

### GET /api/tools-balance

Returns current user's balance information.

**Response:**

```json
{
  "balance": 45,
  "status": {
    "balance": 45,
    "isLow": false,
    "isEmpty": false,
    "displayColor": "green"
  },
  "userType": "regular",
  "userId": "user-123"
}
```

### Admin API: /api/admin/balance

#### GET - Get User Balance

Query: `?userId=user-123`

#### POST - Add Balance

```json
{
  "userId": "user-123",
  "amount": 100,
  "reason": "Top-up purchase"
}
```

#### PUT - Set Balance

```json
{
  "userId": "user-123",
  "balance": 200,
  "reason": "Admin adjustment"
}
```

## Database Schema

```sql
-- Added to User table
ALTER TABLE User ADD COLUMN balance INTEGER NOT NULL DEFAULT 100;
```

## UI Components Usage

### Header Balance Display

```tsx
import { ToolsBalance } from "@/components/tools-balance";

<ToolsBalance
  variant="header"
  className="order-1 md:order-5"
/>;
```

### Detailed Balance View

```tsx
<ToolsBalance variant="detailed" />
```

### Pricing Information

```tsx
import { ToolsPricing } from "@/components/tools-balance";

<ToolsPricing />;
```

## Environment Variables

### Admin Access

```env
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

Required for admin balance management endpoints.

## Error Handling

### Insufficient Balance (402)

```json
{
  "success": false,
  "error": "Insufficient balance",
  "details": "Required: 10 credits, Available: 5 credits",
  "requiredCredits": 10
}
```

### Unauthorized (401)

```json
{
  "error": "Unauthorized"
}
```

## Future Enhancements

1. **Payment Integration** - Top-up system with payment providers
2. **Balance History** - Transaction logs for users
3. **Subscription Plans** - Monthly credit allocations
4. **Referral System** - Bonus credits for referrals
5. **Usage Analytics** - Detailed credit usage statistics

## Security Considerations

1. **Balance validation** happens on server-side only
2. **Admin endpoints** require email-based authorization
3. **Transaction logging** for audit trails
4. **Rate limiting** to prevent abuse
5. **Balance deduction** only after successful operations

## Troubleshooting

### Balance Not Updating

- Check API endpoint `/api/tools-balance`
- Verify user authentication
- Check console for errors

### Admin Access Issues

- Verify `ADMIN_EMAILS` environment variable
- Check user email matches admin list
- Ensure proper authentication

### Generation Fails with Balance Error

- Check user's actual balance
- Verify pricing configuration
- Check multipliers calculation

## Migration Notes

For existing users, the system automatically:

1. Initializes balance based on user type
2. Only overrides default balance (100) from schema
3. Preserves any previously set custom balances
