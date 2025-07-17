import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * AICODE: Auth0 Client Configuration
 * Using existing environment variables from NextAuth setup:
 * - AUTH_AUTH0_ID -> clientId  
 * - AUTH_AUTH0_SECRET -> clientSecret
 * - AUTH_AUTH0_ISSUER -> domain (extracting domain from issuer URL)
 * - NEXTAUTH_URL -> appBaseUrl
 * - NEXTAUTH_SECRET -> secret
 */

// Extract domain from Auth0 issuer URL
function extractDomainFromIssuer(issuer: string): string {
  try {
    const url = new URL(issuer);
    return url.hostname;
  } catch (error) {
    console.error('Failed to extract domain from issuer:', issuer, error);
    throw new Error(`Invalid Auth0 issuer URL: ${issuer}`);
  }
}

// AICODE: Determine base URL - support for development and production
function getAppBaseUrl(): string {
  // For development: http://localhost:3000 must be added to Auth0 Dashboard
  // For production: Use your production domain
  // See docs/auth0-localhost-fix.md for setup instructions
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log('🔧 Using Auth0 base URL:', baseUrl);
  return baseUrl;
}

// AICODE: Initialize Auth0 client with existing environment variables
export const auth0 = new Auth0Client({
  // Use existing Auth0 environment variables from NextAuth setup
  domain: extractDomainFromIssuer(process.env.AUTH_AUTH0_ISSUER!),
  clientId: process.env.AUTH_AUTH0_ID!,
  clientSecret: process.env.AUTH_AUTH0_SECRET!,
  
  // Use NextAuth URLs and secrets
  appBaseUrl: getAppBaseUrl(),
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET!,
  
  // Auth0 routes configuration
  routes: {
    login: '/auth/login',
    logout: '/auth/logout', 
    callback: '/auth/callback',
  },
  
  // Session configuration
  session: {
    rolling: true,
    absoluteDuration: 60 * 60 * 24 * 30, // 30 days in seconds
    inactivityDuration: 60 * 60 * 24 * 7,  // 7 days in seconds
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    }
  }
});

// AICODE: Personal SuperDuperAI token management
export async function getPersonalSuperduperAIToken(): Promise<string | null> {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      console.log('🔒 No Auth0 session found - user not authenticated');
      return null;
    }

    // Get personal token from Auth0 session
    const personalToken = session.user.superduperai_token;
    
    if (personalToken) {
      console.log('✅ Using personal SuperDuperAI token from Auth0 session');
      return personalToken;
    }
    
    console.log('⚠️ No personal SuperDuperAI token found - user needs to connect account');
    return null;
    
  } catch (error) {
    console.error('❌ Error getting personal SuperDuperAI token:', error);
    return null;
  }
}

// AICODE: Save personal SuperDuperAI token to Auth0 session
export async function savePersonalSuperduperAIToken(token: string): Promise<void> {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      throw new Error('No Auth0 session found - cannot save token');
    }

    // Update session with personal token - preserve all session data
    const updatedSession = {
      ...session,
      user: {
        ...session.user,
        superduperai_token: token
      }
    };

    await auth0.updateSession(updatedSession);
    console.log('✅ Personal SuperDuperAI token saved to Auth0 session');
    
  } catch (error) {
    console.error('❌ Error saving personal SuperDuperAI token:', error);
    throw error;
  }
} 