import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { FREE_BALANCE_BY_USER_TYPE, calculateOperationCost } from '@/lib/config/tools-pricing';
import type { UserType } from '@/app/(auth)/auth';

// Create database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Balance check result
 */
export interface BalanceCheckResult {
  hasEnoughBalance: boolean;
  currentBalance: number;
  requiredBalance: number;
  shortfall?: number;
}

/**
 * Balance transaction record
 */
export interface BalanceTransaction {
  userId: string;
  operationType: string;
  operationCategory: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Get current tools balance for a user
 */
export async function getUserToolsBalance(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ balance: user.balance })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (result.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    return result[0].balance || 0;
  } catch (error) {
    console.error('Error getting user tools balance:', error);
    throw error;
  }
}

/**
 * Check if user has enough balance for an operation
 */
export async function checkOperationBalance(
  userId: string,
  toolCategory: keyof typeof import('@/lib/config/tools-pricing').TOOLS_PRICING,
  operationType: string,
  multipliers: string[] = []
): Promise<BalanceCheckResult> {
  try {
    const currentBalance = await getUserToolsBalance(userId);
    const requiredBalance = calculateOperationCost(toolCategory, operationType, multipliers);

    const hasEnoughBalance = currentBalance >= requiredBalance;
    const shortfall = hasEnoughBalance ? undefined : requiredBalance - currentBalance;

    return {
      hasEnoughBalance,
      currentBalance,
      requiredBalance,
      shortfall,
    };
  } catch (error) {
    console.error('Error checking operation balance:', error);
    throw error;
  }
}

/**
 * Deduct balance for a completed operation
 */
export async function deductOperationBalance(
  userId: string,
  toolCategory: keyof typeof import('@/lib/config/tools-pricing').TOOLS_PRICING,
  operationType: string,
  multipliers: string[] = [],
  metadata?: Record<string, any>
): Promise<BalanceTransaction> {
  try {
    const currentBalance = await getUserToolsBalance(userId);
    const amount = calculateOperationCost(toolCategory, operationType, multipliers);

    if (currentBalance < amount) {
      throw new Error(`Insufficient balance. Required: ${amount}, Available: ${currentBalance}`);
    }

    const newBalance = currentBalance - amount;

    // Update user balance
    await db
      .update(user)
      .set({ balance: newBalance })
      .where(eq(user.id, userId));

    // Create transaction record
    const transaction: BalanceTransaction = {
      userId,
      operationType,
      operationCategory: toolCategory,
      amount: -amount, // Negative for deduction
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      timestamp: new Date(),
      metadata,
    };

    console.log(`💳 Balance deducted for user ${userId}: -${amount} credits (${currentBalance} → ${newBalance})`);

    return transaction;
  } catch (error) {
    console.error('Error deducting operation balance:', error);
    throw error;
  }
}

/**
 * Add balance to user account (for admin use or top-ups)
 */
export async function addUserBalance(
  userId: string,
  amount: number,
  reason?: string,
  metadata?: Record<string, any>
): Promise<BalanceTransaction> {
  try {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const currentBalance = await getUserToolsBalance(userId);
    const newBalance = currentBalance + amount;

    // Update user balance
    await db
      .update(user)
      .set({ balance: newBalance })
      .where(eq(user.id, userId));

    // Create transaction record
    const transaction: BalanceTransaction = {
      userId,
      operationType: reason || 'manual_addition',
      operationCategory: 'admin',
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      timestamp: new Date(),
      metadata,
    };

    console.log(`💰 Balance added for user ${userId}: +${amount} credits (${currentBalance} → ${newBalance})`);

    return transaction;
  } catch (error) {
    console.error('Error adding user balance:', error);
    throw error;
  }
}

/**
 * Initialize user with free balance based on user type
 */
export async function initializeUserBalance(userId: string, userType: UserType): Promise<void> {
  try {
    const freeBalance = FREE_BALANCE_BY_USER_TYPE[userType];
    
    // Check if user already has a balance set
    const currentBalance = await getUserToolsBalance(userId);
    
    // Only initialize if balance is exactly 100 (default from schema)
    // This prevents overwriting existing balances
    if (currentBalance === 100) {
      await db
        .update(user)
        .set({ balance: freeBalance })
        .where(eq(user.id, userId));

      console.log(`🎁 Initialized ${userType} user ${userId} with ${freeBalance} credits`);
    }
  } catch (error) {
    console.error('Error initializing user balance:', error);
    // Don't throw error here - this shouldn't block user creation
  }
}

/**
 * Set specific balance for a user (admin function)
 */
export async function setUserBalance(
  userId: string,
  newBalance: number,
  reason?: string
): Promise<BalanceTransaction> {
  try {
    if (newBalance < 0) {
      throw new Error('Balance cannot be negative');
    }

    const currentBalance = await getUserToolsBalance(userId);

    await db
      .update(user)
      .set({ balance: newBalance })
      .where(eq(user.id, userId));

    const transaction: BalanceTransaction = {
      userId,
      operationType: reason || 'admin_set_balance',
      operationCategory: 'admin',
      amount: newBalance - currentBalance,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      timestamp: new Date(),
    };

    console.log(`⚖️ Balance set for user ${userId}: ${currentBalance} → ${newBalance} (${reason || 'admin action'})`);

    return transaction;
  } catch (error) {
    console.error('Error setting user balance:', error);
    throw error;
  }
}

/**
 * Get balance status for UI display
 */
export async function getBalanceStatus(userId: string): Promise<{
  balance: number;
  isLow: boolean;
  isEmpty: boolean;
  displayColor: 'green' | 'yellow' | 'red';
}> {
  try {
    const balance = await getUserToolsBalance(userId);
    
    const isEmpty = balance <= 0;
    const isLow = balance <= 10 && balance > 0;
    
    let displayColor: 'green' | 'yellow' | 'red' = 'green';
    if (isEmpty) displayColor = 'red';
    else if (isLow) displayColor = 'yellow';

    return {
      balance,
      isLow,
      isEmpty,
      displayColor,
    };
  } catch (error) {
    console.error('Error getting balance status:', error);
    throw error;
  }
}

/**
 * Validate operation before execution
 */
export async function validateOperationBalance(
  userId: string,
  toolCategory: keyof typeof import('@/lib/config/tools-pricing').TOOLS_PRICING,
  operationType: string,
  multipliers: string[] = []
): Promise<{ valid: boolean; error?: string; cost?: number }> {
  try {
    const balanceCheck = await checkOperationBalance(userId, toolCategory, operationType, multipliers);
    
    if (!balanceCheck.hasEnoughBalance) {
      return {
        valid: false,
        error: `Insufficient balance. Required: ${balanceCheck.requiredBalance} credits, Available: ${balanceCheck.currentBalance} credits`,
        cost: balanceCheck.requiredBalance,
      };
    }

    return {
      valid: true,
      cost: balanceCheck.requiredBalance,
    };
  } catch (error) {
    console.error('Error validating operation balance:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 