import 'server-only';

import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, document } from './schema';

// Create database connection
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getAdminOverviewStats() {
  try {
    // Get total users count and type breakdown
    const totalUsersResult = await db.select({ count: count() }).from(user);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get guest vs regular users
    const guestUsersResult = await db
      .select({ count: count() })
      .from(user)
      .where(sql`${user.email} LIKE '%guest%'`);
    const guestUsers = guestUsersResult[0]?.count || 0;
    const regularUsers = totalUsers - guestUsers;

    // Get total credits and average
    const balanceStats = await db
      .select({
        total: sql<number>`COALESCE(SUM(${user.balance}), 0)`,
        average: sql<number>`COALESCE(AVG(${user.balance}), 0)`
      })
      .from(user);
    
    const totalCredits = balanceStats[0]?.total || 0;
    const averageCredits = Math.round(balanceStats[0]?.average || 0);

    // Get document counts
    const totalDocsResult = await db.select({ count: count() }).from(document);
    const totalDocuments = totalDocsResult[0]?.count || 0;

    // Get images count
    const imagesResult = await db
      .select({ count: count() })
      .from(document)
      .where(eq(document.kind, 'image'));
    const imagesCount = imagesResult[0]?.count || 0;

    // Get videos count
    const videosResult = await db
      .select({ count: count() })
      .from(document)
      .where(eq(document.kind, 'video'));
    const videosCount = videosResult[0]?.count || 0;

    // Get recent activity (documents created in last 24h as proxy for transactions)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentDocsResult = await db
      .select({ count: count() })
      .from(document)
      .where(gte(document.createdAt, yesterday));
    const recentTransactions = recentDocsResult[0]?.count || 0;

    // Get recent users (last 10)
    const recentUsersResult = await db
      .select({
        id: user.id,
        email: user.email,
        balance: user.balance,
        createdAt: sql<string>`'2025-01-01'` // Placeholder since createdAt doesn't exist in schema
      })
      .from(user)
      .orderBy(desc(user.id))
      .limit(10);

    // Add user type detection
    const recentUsers = recentUsersResult.map(u => ({
      ...u,
      type: u.email.includes('guest') ? 'guest' : 'regular'
    }));

    return {
      totalUsers,
      guestUsers,
      regularUsers,
      totalCredits,
      averageCredits,
      totalDocuments,
      imagesCount,
      videosCount,
      recentTransactions,
      recentUsers
    };
  } catch (error) {
    console.error('Error fetching admin overview stats:', error);
    // Return default stats on error
    return {
      totalUsers: 0,
      guestUsers: 0,
      regularUsers: 0,
      totalCredits: 0,
      averageCredits: 0,
      totalDocuments: 0,
      imagesCount: 0,
      videosCount: 0,
      recentTransactions: 0,
      recentUsers: []
    };
  }
}

export async function getAllUsers(page = 1, limit = 20, search = '') {
  try {
    const offset = (page - 1) * limit;
    
    // Build search condition
    const searchCondition = search 
      ? sql`${user.email} ILIKE ${'%' + search + '%'}`
      : sql`1=1`;

    // Get users with pagination
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        balance: user.balance,
      })
      .from(user)
      .where(searchCondition)
      .orderBy(desc(user.id))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(user)
      .where(searchCondition);
    
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Add user type detection
    const usersWithType = users.map(u => ({
      ...u,
      type: u.email.includes('guest') ? 'guest' : 'regular'
    }));

    return {
      users: usersWithType,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function getUserById(userId: string) {
  try {
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        balance: user.balance,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (users.length === 0) {
      return null;
    }

    const userData = users[0];
    return {
      ...userData,
      type: userData.email.includes('guest') ? 'guest' : 'regular'
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

export async function updateUserBalance(userId: string, newBalance: number) {
  try {
    await db
      .update(user)
      .set({ balance: newBalance })
      .where(eq(user.id, userId));

    return { success: true };
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    // Note: This will also delete related documents due to foreign key constraints
    await db.delete(user).where(eq(user.id, userId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
} 