# Auth0 Callback URL Configuration

## Problem

When accessing the application, users see an Auth0 error:

```
Callback URL mismatch.
The provided redirect_uri is not in the list of allowed callback URLs.
```

This happens because the Auth0 application configuration doesn't include the required callback URLs for the Next.js application.

## Solution

### Step 1: Access Auth0 Dashboard

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → **Applications**
3. Select your application (the one with client ID: `lWC7w2zUX3Czl93GBeaeMJFB6Cdk68h3`)

### Step 2: Update Application Settings

In the **Settings** tab, configure the following URLs:

#### Allowed Callback URLs

```
http://localhost:3000/auth/callback,
https://your-production-domain.com/auth/callback
```

#### Allowed Logout URLs

```
http://localhost:3000,
https://your-production-domain.com
```

#### Allowed Web Origins

```
http://localhost:3000,
https://your-production-domain.com
```

#### Allowed Origins (CORS)

```
http://localhost:3000,
https://your-production-domain.com
```

### Step 3: Save Configuration

Click **Save Changes** at the bottom of the settings page.

## Environment Variables

Ensure your `.env.local` file contains:

```env
# Auth0 Configuration (from existing NextAuth setup)
AUTH_AUTH0_ID=lWC7w2zUX3Czl93GBeaeMJFB6Cdk68h3
AUTH_AUTH0_SECRET=your-client-secret
AUTH_AUTH0_ISSUER=https://life2film.uk.auth0.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
AUTH_SECRET=your-auth-secret
```

## Expected Behavior After Fix

1. Navigate to `http://localhost:3000`
2. Get redirected to Auth0 login page
3. After successful authentication, get redirected back to `http://localhost:3000/auth/callback`
4. Auth0 SDK processes the callback and establishes a session
5. User gets redirected to the application with authenticated session

## Troubleshooting

### Common Issues

1. **URLs not saved**: Make sure to click "Save Changes" in Auth0 dashboard
2. **Cache issues**: Clear browser cache and cookies
3. **Environment mismatch**: Ensure NEXTAUTH_URL matches the callback URL

### Testing the Fix

```bash
# Start the development server
pnpm dev

# Access the application
# Should redirect to Auth0 and back successfully
```

## Production Configuration

For production deployment, update the URLs to match your production domain:

```
https://your-domain.com/auth/callback
https://your-domain.com
```

## Security Notes

- Never include `http://` URLs in production settings
- Always use HTTPS for production callback URLs
- Keep client secrets secure and never commit them to version control
