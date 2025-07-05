# Environment Variables Setup

Your app has been updated to use environment variables instead of `window.location.origin` for better security and reliability.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication URLs (Required)
# Choose one of these patterns:
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # For production

# Alternative for NextAuth.js compatibility
NEXTAUTH_URL=http://localhost:3000  # For development
# NEXTAUTH_URL=https://yourdomain.com  # For production

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Application Environment
NODE_ENV=development
```

## For Different Environments

### Development (Local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### Production
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

### Vercel Deployment
The utility function will automatically detect Vercel's `VERCEL_URL` environment variable if `NEXT_PUBLIC_APP_URL` is not set.

## Changes Made

1. **Created `utils/getBaseUrl.ts`** - A utility function that safely gets the base URL using environment variables
2. **Updated `app/Signin/page.tsx`** - Now uses `getAuthCallbackUrl()` instead of `window.location.origin`
3. **Updated `app/api/auth/callback/route.ts`** - Uses environment variables for redirects
4. **Updated `app/lib/email.ts`** - Email templates now use the utility function for consistent URLs

## Security Benefits

- ✅ Server-controlled URLs that can't be manipulated by client-side code
- ✅ Consistent URLs across all requests in an environment
- ✅ Protection against XSS-based redirect attacks
- ✅ Explicit configuration that's auditable
- ✅ Compatible with OAuth provider requirements for pre-registered redirect URLs

## Testing

After setting up your environment variables:

1. Restart your development server
2. Test the magic link authentication flow
3. Verify that email links point to the correct domain
4. Check that OAuth callbacks work properly

The app will gracefully fallback to `window.location.origin` only in development mode if environment variables are not set, but will throw an error in production to ensure proper configuration. 