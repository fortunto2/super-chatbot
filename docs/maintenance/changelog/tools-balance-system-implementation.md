# Tools Balance System Implementation

**Date**: January 2025  
**Type**: Feature Implementation  
**Impact**: All AI tools (Image, Video, Script Generation)

## Summary

Implemented a comprehensive credit-based balance system for controlling access to AI tools. Users now consume credits when using generation tools, with different costs for different operations and quality levels.

## Changes Made

### 🗄️ Database Schema

- **Added `balance` field** to User table with default value 100 credits
- **Migration ready** - generates new migration for database update

### ⚙️ Core System Components

1. **Pricing Configuration** (`lib/config/tools-pricing.ts`)

   - Comprehensive pricing structure for all tools
   - Support for cost multipliers (quality, duration, etc.)
   - Easy pricing adjustments for future changes

2. **Balance Management** (`lib/utils/tools-balance.ts`)
   - Complete balance operation utilities
   - Real-time balance checking and deduction
   - Transaction logging for audit trails
   - User balance initialization based on user type

### 🌐 API Integration

3. **New API Endpoints**

   - `GET /api/tools-balance` - User balance information
   - `POST/PUT/GET /api/admin/balance` - Admin balance management

4. **Generation Endpoints Updated**
   - `POST /api/generate/image` - Balance checking + deduction
   - `POST /api/generate/video` - Balance checking + deduction
   - `POST /api/generate/script` - Balance checking + deduction
   - Returns 402 (Payment Required) for insufficient balance

### 🎨 UI Components

5. **Balance Display** (`components/tools-balance.tsx`)

   - Header variant for navigation display
   - Detailed variant for full balance info
   - Compact variant for quick reference
   - Real-time balance updates
   - Pricing information component

6. **Interface Integration**
   - Added balance display to chat header
   - Color-coded status (green/yellow/red)
   - Tooltips with pricing information

## Pricing Structure

### Credits Allocation

- **Guest Users**: 50 credits (trial experience)
- **Registered Users**: 200 credits (extended usage)

### Operation Costs

- **Image Generation**: 2-6 credits

  - Text to image: 2 credits
  - Image to image: 3 credits
  - Quality multipliers: +50% to +100%

- **Video Generation**: 10-90 credits

  - Text to video: 10+ credits
  - Image to video: 15+ credits
  - Duration multipliers: 1x to 6x
  - Quality multipliers: +50% to +150%

- **Script Generation**: 1-2 credits

  - Basic script: 1 credit
  - Long form: 2 credits

- **Prompt Enhancement**: 1-2 credits

## Technical Features

### ✅ Security & Validation

- Server-side balance validation only
- Authentication required for all operations
- Admin endpoints with email-based authorization
- Balance deduction only after successful operations

### 📊 Real-time Updates

- Balance checking before operations
- Automatic deduction after success
- UI updates every 30 seconds
- Error handling for network issues

### 🔧 Admin Features

- Get user balance by userId
- Add credits to user accounts
- Set specific balance amounts
- Transaction logging with metadata

## Implementation Quality

### ⚡ Performance

- Efficient database queries
- Minimal UI re-renders
- Parallel balance checks
- Optimized API responses

### 🛡️ Error Handling

- Graceful insufficient balance errors
- Network failure recovery
- Transaction rollback safety
- User-friendly error messages

### 📱 User Experience

- Clear balance visibility
- Intuitive pricing information
- Status indicators (low/empty balance)
- Responsive design across devices

## Future Ready

### 🔮 Extensibility

- Easy to add new tools
- Configurable pricing adjustments
- Support for cost multipliers
- Modular component architecture

### 📈 Enhancement Potential

- Payment integration ready
- Subscription plan support
- Usage analytics foundation
- Referral system compatibility

## Files Created/Modified

### New Files

- `lib/config/tools-pricing.ts` - Pricing configuration
- `lib/utils/tools-balance.ts` - Balance management utilities
- `app/api/tools-balance/route.ts` - User balance API
- `app/api/admin/balance/route.ts` - Admin balance API
- `components/tools-balance.tsx` - UI components
- `docs/ai-capabilities/tools-balance-system.md` - Documentation

### Modified Files

- `lib/db/schema.ts` - Added balance field
- `app/api/generate/image/route.ts` - Balance integration
- `app/api/generate/video/route.ts` - Balance integration
- `app/api/generate/script/route.ts` - Balance integration
- `components/chat-header.tsx` - Added balance display

## Testing & Validation

### ✅ Verified Functionality

- Balance checking prevents operations when insufficient
- Successful operations deduct correct amounts
- Admin can manage user balances
- UI displays accurate balance information
- Error handling works correctly

### 🔍 Quality Assurance

- Type safety with TypeScript
- Proper error boundaries
- Database transaction safety
- API response validation

## Migration Notes

1. Run database migration to add `balance` field
2. Set `ADMIN_EMAILS` environment variable for admin access
3. Existing users get balance initialized automatically
4. No breaking changes to existing functionality

## Success Metrics

- **User Control**: Users can see exactly how many credits they have
- **Cost Transparency**: Clear pricing for all operations
- **Admin Control**: Full balance management capabilities
- **System Protection**: Prevents unlimited resource usage
- **User Experience**: Seamless integration with existing workflows

## Documentation

Complete documentation available at:

- `docs/ai-capabilities/tools-balance-system.md`

Includes API reference, implementation guide, troubleshooting, and future enhancement plans.

---

This implementation provides a robust foundation for monetization, resource control, and user management while maintaining the excellent user experience Super Chatbot is known for.
