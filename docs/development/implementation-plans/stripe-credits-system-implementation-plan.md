# Stripe Credits System Implementation Plan

**Date:** July 14, 2025  
**Status:** Planning Phase  
**Author:** AI Assistant  

## Overview

Implementation of a credit-based payment system for image and video generation using Stripe AI SDK and Meter API. The system will track usage based on actual model pricing from SuperDuperAI API and provide flexible credit packages.

## Current Context

Based on the codebase analysis:
- **Image models**: Pricing from $1.00-$3.00 per image (from `lib/config/superduperai.ts`)
- **Video models**: Pricing from $0.40-$10.00 per second (from `lib/config/superduperai.ts`)
- **Dynamic pricing**: Model prices fetched from SuperDuperAI API in real-time
- **Existing infrastructure**: OpenAPI client, WebSocket/SSE for real-time updates

## Architecture Overview

```
User Purchase → Stripe Payment → Credit Grant → Usage Tracking → Meter Events → Billing
```

### Key Components

1. **Stripe Products & Pricing**
   - Credit packages (100, 500, 1000, 5000 credits)
   - Usage-based billing with meters
   - Credit grants for prepaid usage

2. **Credit System**
   - Database schema for user credits
   - Real-time credit deduction
   - Usage tracking per model

3. **AI SDK Integration**
   - Stripe AI tools for payment processing
   - Automated credit management
   - Usage reporting

## Phase 1: Stripe Configuration

### 1.1 Create Stripe Products

```typescript
// Products for different credit packages
const products = [
  {
    name: "AI Generation Credits - Starter",
    description: "100 credits for image and video generation",
    metadata: { credits: "100", tier: "starter" }
  },
  {
    name: "AI Generation Credits - Pro", 
    description: "500 credits for image and video generation",
    metadata: { credits: "500", tier: "pro" }
  },
  {
    name: "AI Generation Credits - Business",
    description: "1000 credits for image and video generation", 
    metadata: { credits: "1000", tier: "business" }
  },
  {
    name: "AI Generation Credits - Enterprise",
    description: "5000 credits for image and video generation",
    metadata: { credits: "5000", tier: "enterprise" }
  }
];
```

### 1.2 Create Stripe Prices

Credit pricing based on volume discounts:
- 100 credits: $10.00 ($0.10 per credit)
- 500 credits: $45.00 ($0.09 per credit) 
- 1000 credits: $80.00 ($0.08 per credit)
- 5000 credits: $350.00 ($0.07 per credit)

### 1.3 Set Up Stripe Meters

```typescript
// Meter for image generation usage
const imageGenerationMeter = {
  event_name: "image_generation",
  display_name: "Image Generation",
  customer_mapping: {
    event_payload_key: "customer_id",
    type: "by_id"
  },
  default_aggregation: {
    formula: "sum"
  },
  value_settings: {
    event_payload_key: "credits_used"
  }
};

// Meter for video generation usage  
const videoGenerationMeter = {
  event_name: "video_generation",
  display_name: "Video Generation",
  customer_mapping: {
    event_payload_key: "customer_id", 
    type: "by_id"
  },
  default_aggregation: {
    formula: "sum"
  },
  value_settings: {
    event_payload_key: "credits_used"
  }
};
```

## Phase 2: Database Schema

### 2.1 User Credits Table

```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  available_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
```

### 2.2 Credit Transactions Table

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'refund'
  credits_delta INTEGER NOT NULL, -- positive for purchases, negative for usage
  model_name VARCHAR(255), -- for usage transactions
  model_price DECIMAL(10,4), -- actual price from SuperDuperAI API
  stripe_payment_intent_id VARCHAR(255),
  stripe_meter_event_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
```

### 2.3 Generation Usage Table

```sql
CREATE TABLE generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  generation_type VARCHAR(50) NOT NULL, -- 'image', 'video'
  model_name VARCHAR(255) NOT NULL,
  model_price DECIMAL(10,4) NOT NULL,
  credits_used INTEGER NOT NULL,
  duration_seconds INTEGER, -- for video generation
  file_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_generation_usage_user_id ON generation_usage(user_id);
CREATE INDEX idx_generation_usage_type ON generation_usage(generation_type);
```

## Phase 3: AI SDK Integration

### 3.1 Stripe AI Tools

```typescript
// lib/ai/tools/stripe-credit-management.ts
import { tool } from 'ai';
import { z } from 'zod';
import { 
  mcp_stripe_create_customer,
  mcp_stripe_create_payment_link,
  mcp_stripe_create_invoice,
  mcp_stripe_create_invoice_item
} from '@/lib/stripe/mcp-tools';

export const purchaseCredits = tool({
  description: 'Create payment link for credit purchase',
  parameters: z.object({
    userId: z.string(),
    creditPackage: z.enum(['starter', 'pro', 'business', 'enterprise']),
    customerEmail: z.string().email().optional()
  }),
  execute: async ({ userId, creditPackage, customerEmail }) => {
    // Implementation using MCP Stripe tools
    const customer = await mcp_stripe_create_customer({
      name: `User ${userId}`,
      email: customerEmail
    });
    
    const paymentLink = await mcp_stripe_create_payment_link({
      price: getPriceIdForPackage(creditPackage),
      quantity: 1
    });
    
    return {
      success: true,
      paymentUrl: paymentLink.url,
      customerId: customer.id
    };
  }
});

export const checkCreditBalance = tool({
  description: 'Check user credit balance',
  parameters: z.object({
    userId: z.string()
  }),
  execute: async ({ userId }) => {
    const credits = await getUserCredits(userId);
    return {
      totalCredits: credits.total_credits,
      usedCredits: credits.used_credits,
      availableCredits: credits.available_credits
    };
  }
});
```

### 3.2 Credit Deduction Logic

```typescript
// lib/credits/credit-manager.ts
import { db } from '@/lib/db';
import { userCredits, creditTransactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export class CreditManager {
  async deductCredits(params: {
    userId: string;
    modelName: string;
    modelPrice: number;
    generationType: 'image' | 'video';
    duration?: number;
  }) {
    const { userId, modelName, modelPrice, generationType, duration = 1 } = params;
    
    // Calculate credits needed based on model price
    const creditsNeeded = Math.ceil(modelPrice * duration);
    
    return await db.transaction(async (tx) => {
      // Check available credits
      const userCreditRecord = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.user_id, userId))
        .limit(1);
      
      if (!userCreditRecord.length || userCreditRecord[0].available_credits < creditsNeeded) {
        throw new Error('Insufficient credits');
      }
      
      // Deduct credits
      await tx
        .update(userCredits)
        .set({ 
          used_credits: sql`${userCredits.used_credits} + ${creditsNeeded}`,
          updated_at: new Date()
        })
        .where(eq(userCredits.user_id, userId));
      
      // Record transaction
      await tx.insert(creditTransactions).values({
        user_id: userId,
        transaction_type: 'usage',
        credits_delta: -creditsNeeded,
        model_name: modelName,
        model_price: modelPrice,
        metadata: { 
          generation_type: generationType,
          duration: duration
        }
      });
      
      return { success: true, creditsUsed: creditsNeeded };
    });
  }
  
  async addCredits(params: {
    userId: string;
    credits: number;
    stripePaymentIntentId: string;
  }) {
    const { userId, credits, stripePaymentIntentId } = params;
    
    return await db.transaction(async (tx) => {
      // Add credits to user account
      await tx
        .insert(userCredits)
        .values({
          user_id: userId,
          total_credits: credits,
          used_credits: 0
        })
        .onConflictDoUpdate({
          target: userCredits.user_id,
          set: {
            total_credits: sql`${userCredits.total_credits} + ${credits}`,
            updated_at: new Date()
          }
        });
      
      // Record transaction
      await tx.insert(creditTransactions).values({
        user_id: userId,
        transaction_type: 'purchase',
        credits_delta: credits,
        stripe_payment_intent_id: stripePaymentIntentId
      });
      
      return { success: true, creditsAdded: credits };
    });
  }
}
```

## Phase 4: Integration with Generation APIs

### 4.1 Update Image Generation

```typescript
// lib/ai/api/generate-image.ts
import { CreditManager } from '@/lib/credits/credit-manager';
import { sendMeterEvent } from '@/lib/stripe/meter-events';

export async function generateImage(params: ImageGenerationParams) {
  const { userId, model, ...otherParams } = params;
  
  // Get model pricing from SuperDuperAI API
  const modelConfig = await getImageModelConfig(model);
  const modelPrice = modelConfig.price || 1.0;
  
  // Check and deduct credits
  const creditManager = new CreditManager();
  await creditManager.deductCredits({
    userId,
    modelName: model,
    modelPrice,
    generationType: 'image'
  });
  
  try {
    // Generate image
    const result = await generateImageWithSuperduperAI(otherParams);
    
    // Send meter event to Stripe
    await sendMeterEvent({
      event_name: 'image_generation',
      payload: {
        customer_id: userId,
        credits_used: Math.ceil(modelPrice),
        model_name: model,
        timestamp: new Date().toISOString()
      }
    });
    
    return result;
  } catch (error) {
    // Refund credits on failure
    await creditManager.addCredits({
      userId,
      credits: Math.ceil(modelPrice),
      stripePaymentIntentId: 'refund_' + Date.now()
    });
    
    throw error;
  }
}
```

### 4.2 Update Video Generation

```typescript
// lib/ai/api/generate-video.ts
import { CreditManager } from '@/lib/credits/credit-manager';
import { sendMeterEvent } from '@/lib/stripe/meter-events';

export async function generateVideo(params: VideoGenerationParams) {
  const { userId, model, duration = 5, ...otherParams } = params;
  
  // Get model pricing from SuperDuperAI API
  const modelConfig = await getVideoModelConfig(model);
  const pricePerSecond = modelConfig.price_per_second || 0.4;
  
  // Check and deduct credits
  const creditManager = new CreditManager();
  await creditManager.deductCredits({
    userId,
    modelName: model,
    modelPrice: pricePerSecond,
    generationType: 'video',
    duration
  });
  
  try {
    // Generate video
    const result = await generateVideoWithSuperduperAI({
      ...otherParams,
      duration
    });
    
    // Send meter event to Stripe
    await sendMeterEvent({
      event_name: 'video_generation',
      payload: {
        customer_id: userId,
        credits_used: Math.ceil(pricePerSecond * duration),
        model_name: model,
        duration: duration,
        timestamp: new Date().toISOString()
      }
    });
    
    return result;
  } catch (error) {
    // Refund credits on failure
    await creditManager.addCredits({
      userId,
      credits: Math.ceil(pricePerSecond * duration),
      stripePaymentIntentId: 'refund_' + Date.now()
    });
    
    throw error;
  }
}
```

## Phase 5: Webhook Integration

### 5.1 Stripe Webhooks

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreditManager } from '@/lib/credits/credit-manager';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(event.data.object as Stripe.Invoice);
      break;
    case 'billing.credit_balance_transaction.created':
      await handleCreditTransaction(event.data.object);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { customer, metadata } = paymentIntent;
  
  if (metadata?.credits && metadata?.userId) {
    const creditManager = new CreditManager();
    await creditManager.addCredits({
      userId: metadata.userId,
      credits: parseInt(metadata.credits),
      stripePaymentIntentId: paymentIntent.id
    });
  }
}
```

## Phase 6: User Interface

### 6.1 Credit Balance Component

```typescript
// components/credits/credit-balance.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CreditBalance {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
}

export function CreditBalance({ userId }: { userId: string }) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCreditBalance();
  }, [userId]);
  
  const fetchCreditBalance = async () => {
    try {
      const response = await fetch(`/api/credits/balance?userId=${userId}`);
      const data = await response.json();
      setBalance(data);
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePurchaseCredits = () => {
    // Open credit purchase modal
    window.open('/credits/purchase', '_blank');
  };
  
  if (loading) {
    return <div>Loading credits...</div>;
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Credit Balance
          <Badge variant={balance?.availableCredits > 0 ? 'default' : 'destructive'}>
            {balance?.availableCredits || 0} available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Credits:</span>
            <span>{balance?.totalCredits || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Used Credits:</span>
            <span>{balance?.usedCredits || 0}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Available Credits:</span>
            <span>{balance?.availableCredits || 0}</span>
          </div>
        </div>
        
        <Button 
          onClick={handlePurchaseCredits}
          className="w-full mt-4"
          disabled={balance?.availableCredits > 100}
        >
          Purchase More Credits
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 6.2 Credit Purchase Page

```typescript
// app/credits/purchase/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 10.00,
    pricePerCredit: 0.10,
    description: 'Perfect for trying out AI generation',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 45.00,
    pricePerCredit: 0.09,
    description: 'Great for regular users',
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    credits: 1000,
    price: 80.00,
    pricePerCredit: 0.08,
    description: 'Ideal for content creators',
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 5000,
    price: 350.00,
    pricePerCredit: 0.07,
    description: 'For heavy usage and teams',
    popular: false
  }
];

export default function CreditPurchasePage() {
  const [loading, setLoading] = useState<string | null>(null);
  
  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });
      
      const data = await response.json();
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Purchase AI Generation Credits</h1>
        <p className="text-gray-600">
          Credits are used for image and video generation based on model pricing
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {creditPackages.map((pkg) => (
          <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-blue-500' : ''}`}>
            {pkg.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle className="text-center">
                {pkg.name}
              </CardTitle>
              <div className="text-center">
                <div className="text-3xl font-bold">${pkg.price}</div>
                <div className="text-sm text-gray-600">
                  {pkg.credits} credits (${pkg.pricePerCredit}/credit)
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-center text-sm text-gray-600 mb-4">
                {pkg.description}
              </p>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Image Generation:</span>
                  <span>~{Math.floor(pkg.credits / 2)} images</span>
                </div>
                <div className="flex justify-between">
                  <span>Video Generation (5s):</span>
                  <span>~{Math.floor(pkg.credits / 5)} videos</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading === pkg.id}
                className="w-full"
              >
                {loading === pkg.id ? 'Processing...' : 'Purchase'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Phase 7: API Routes

### 7.1 Credit Balance API

```typescript
// app/api/credits/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserCredits } from '@/lib/credits/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const credits = await getUserCredits(session.user.id);
    
    return NextResponse.json({
      totalCredits: credits?.total_credits || 0,
      usedCredits: credits?.used_credits || 0,
      availableCredits: credits?.available_credits || 0
    });
  } catch (error) {
    console.error('Failed to get credit balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 7.2 Credit Purchase API

```typescript
// app/api/credits/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { mcp_stripe_create_customer, mcp_stripe_create_payment_link } from '@/lib/stripe/mcp-tools';

const creditPackages = {
  starter: { credits: 100, priceId: 'price_starter' },
  pro: { credits: 500, priceId: 'price_pro' },
  business: { credits: 1000, priceId: 'price_business' },
  enterprise: { credits: 5000, priceId: 'price_enterprise' }
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { packageId } = await request.json();
    const pkg = creditPackages[packageId as keyof typeof creditPackages];
    
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }
    
    // Create or get Stripe customer
    const customer = await mcp_stripe_create_customer({
      name: session.user.name || `User ${session.user.id}`,
      email: session.user.email || undefined
    });
    
    // Create payment link
    const paymentLink = await mcp_stripe_create_payment_link({
      price: pkg.priceId,
      quantity: 1
    });
    
    return NextResponse.json({
      paymentUrl: paymentLink.url,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Phase 8: Testing Strategy

### 8.1 Unit Tests

```typescript
// tests/credits/credit-manager.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CreditManager } from '@/lib/credits/credit-manager';

describe('CreditManager', () => {
  let creditManager: CreditManager;
  
  beforeEach(() => {
    creditManager = new CreditManager();
  });
  
  it('should deduct credits correctly', async () => {
    const result = await creditManager.deductCredits({
      userId: 'test-user',
      modelName: 'comfyui/flux',
      modelPrice: 1.0,
      generationType: 'image'
    });
    
    expect(result.success).toBe(true);
    expect(result.creditsUsed).toBe(1);
  });
  
  it('should throw error for insufficient credits', async () => {
    await expect(creditManager.deductCredits({
      userId: 'test-user-no-credits',
      modelName: 'google-cloud/imagen4-ultra',
      modelPrice: 3.0,
      generationType: 'image'
    })).rejects.toThrow('Insufficient credits');
  });
});
```

### 8.2 Integration Tests

```typescript
// tests/api/credits.test.ts
import { describe, it, expect } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/credits/balance/route';

describe('/api/credits/balance', () => {
  it('should return credit balance for authenticated user', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data).toHaveProperty('totalCredits');
        expect(data).toHaveProperty('usedCredits');
        expect(data).toHaveProperty('availableCredits');
      }
    });
  });
});
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Stripe products and pricing
- [ ] Create database schema and migrations
- [ ] Implement basic credit management

### Week 2: Integration
- [ ] Integrate with image/video generation APIs
- [ ] Set up Stripe webhooks
- [ ] Implement meter event tracking

### Week 3: User Interface
- [ ] Create credit balance components
- [ ] Build credit purchase flow
- [ ] Add credit usage tracking

### Week 4: Testing & Deployment
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Production deployment

## Success Metrics

- **Payment Success Rate**: >95% successful payments
- **Credit Deduction Accuracy**: 100% accurate credit calculations
- **API Response Time**: <500ms for credit operations
- **User Experience**: Seamless credit purchase and usage flow

## Risk Mitigation

1. **Credit Synchronization**: Use database transactions for atomic operations
2. **Payment Failures**: Implement retry logic and manual reconciliation
3. **Model Price Changes**: Cache pricing with TTL and fallback values
4. **Webhook Reliability**: Implement idempotency and event replay

## Next Steps

1. **Human Review**: Get approval for architecture and pricing strategy
2. **Stripe Account Setup**: Configure products, prices, and webhooks
3. **Database Migration**: Create tables and indexes
4. **Code Implementation**: Start with Phase 1 (Stripe configuration)

---

**Note**: This plan integrates with the existing SuperDuperAI API architecture and maintains compatibility with the current OpenAPI client and WebSocket/SSE systems. 