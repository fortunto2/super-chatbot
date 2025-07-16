import { auth0, savePersonalSuperduperAIToken } from '@/lib/auth0';
import { NextResponse } from 'next/server';
import { configureSuperduperAI } from '@/lib/config/superduperai-client';
import { AuthService, UserService } from '@/lib/api';
import { saveUserSuperduperAI } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    console.log('🔍 SuperDuperAI OAuth Callback START:', request.url);
    
    // AICODE-NOTE: Use Auth0 session instead of NextAuth
    const session = await auth0.getSession();
    console.log('👤 Auth0 Session check:', session?.user?.sub ? 'OK' : 'NO_USER');
    
    if (!session?.user?.sub) {
      console.log('❌ No Auth0 session, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    console.log('🔍 OAuth params check:');
    console.log('- code:', code ? `${code.substring(0, 10)}...` : 'NULL');
    console.log('- All params:', Array.from(searchParams.entries()));
    
    if (!code) {
      console.log('❌ No OAuth code, redirecting to auth_failed');
      return NextResponse.redirect(
        new URL('/profile?error=auth_failed', request.url)
      );
    }

    // AICODE-NOTE: Extract personal token from OAuth parameters or API
    const state = searchParams.get('state');
    const accessToken = searchParams.get('access_token');
    
    console.log('🔍 OAuth callback params:');
    console.log('- code:', code ? `${code.substring(0, 10)}...` : 'null');
    console.log('- state:', state);
    console.log('- access_token:', accessToken ? `${accessToken.substring(0, 10)}...` : 'null');

    let personalToken: string | null = null;
    let userId: string | null = null;

    // Try to get token directly from OAuth params first
    if (accessToken) {
      personalToken = accessToken;
      console.log('🎯 Found personal token in OAuth params');
    } else {
      // Fallback: Configure with system token to get user's personal token
      console.log('🔄 Attempting to get personal token via AuthService...');
      
      try {
        // Configure with system token first
        const systemConfig = {
          url: process.env.SUPERDUPERAI_URL || '',
          token: process.env.SUPERDUPERAI_TOKEN || '',
          wsURL: ''
        };
        await configureSuperduperAI(systemConfig);
        
        const tokenResponse = await AuthService.authToken();
        
        // AICODE-NOTE: Extract actual token from response object
        if (typeof tokenResponse === 'object' && tokenResponse !== null) {
          if ('token' in tokenResponse) {
            personalToken = tokenResponse.token as string;
          } else if ('access_token' in tokenResponse) {
            personalToken = tokenResponse.access_token as string;
          } else {
            console.log('🔍 Full token response structure:', JSON.stringify(tokenResponse, null, 2));
            // Try to find token in the response object
            personalToken = Object.values(tokenResponse).find(val => 
              typeof val === 'string' && val.length > 20
            ) as string || null;
          }
        } else if (typeof tokenResponse === 'string') {
          personalToken = tokenResponse;
        }
        
        // Get user info for the personal token
        if (personalToken) {
          console.log('🔧 Configuring SuperDuperAI with personal token for user info...');
          const personalConfig = {
            url: process.env.SUPERDUPERAI_URL || '',
            token: personalToken,
            wsURL: ''
          };
          await configureSuperduperAI(personalConfig);
          const userInfo = await UserService.userMe();
          userId = userInfo.id || null;
        }
        
      } catch (tokenError) {
        console.error('❌ Failed to get personal token:', tokenError);
      }
    }

    if (!personalToken) {
      console.log('❌ No personal token extracted, OAuth failed');
      return NextResponse.redirect(
        new URL('/profile?error=token_extraction_failed', request.url)
      );
    }

    // AICODE-NOTE: Save personal token to Auth0 session (not database)
    console.log('💾 Saving personal SuperDuperAI token to Auth0 session...');
    
    try {
      await savePersonalSuperduperAIToken(personalToken, userId || undefined);
      console.log('✅ Personal token saved to Auth0 session - user will use their own credits');
      
      // Optional: Also save to database for reference
      if (userId) {
        await saveUserSuperduperAI({
          userId: session.user.sub,
          token: personalToken,
          superduperaiUserId: userId,
          balance: 0
        });
        console.log('✅ Token also saved to database for reference');
      }
      
    } catch (saveError) {
      console.error('❌ Failed to save personal token:', saveError);
      return NextResponse.redirect(
        new URL('/profile?error=token_save_failed', request.url)
      );
    }

    console.log('🎉 SuperDuperAI OAuth completed successfully');
    console.log('💳 User will now be charged on their own SuperDuperAI account');
    
    return NextResponse.redirect(
      new URL('/profile?success=superduperai_connected', request.url)
    );

  } catch (error) {
    console.error('💥 SuperDuperAI OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/profile?error=oauth_error', request.url)
    );
  }
} 