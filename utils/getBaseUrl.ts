/**
 * Get the base URL for the application
 * Uses environment variables instead of window.location.origin for security
 */
export function getBaseUrl(): string {
  // Server-side: Use environment variables
  if (typeof window === 'undefined') {
    console.log('🔍 getBaseUrl (server-side) - Environment variables:');
    console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('  VERCEL_URL:', process.env.VERCEL_URL);
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    
    // Production: Use NEXTAUTH_URL or NEXT_PUBLIC_APP_URL
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (url) {
      console.log('✅ Using NEXT_PUBLIC_APP_URL:', url);
      return url;
    }
    
    // Vercel deployment
    if (process.env.VERCEL_URL) {
      const vercelUrl = `https://${process.env.VERCEL_URL}`;
      console.log('✅ Using VERCEL_URL:', vercelUrl);
      return vercelUrl;
    }
    
    // Development fallback
    console.log('⚠️ Falling back to localhost:3000');
    return 'http://localhost:3000';
  }
  
  // Client-side: Use environment variable first, then fallback to window.location.origin only if needed
  console.log('🔍 getBaseUrl (client-side) - Environment variables:');
  console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('  NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  
  if (envUrl) {
    console.log('✅ Using client-side env URL:', envUrl);
    return envUrl;
  }
  
  // Last resort: window.location.origin (only for local development)
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Using window.location.origin for development:', window.location.origin);
    return window.location.origin;
  }
  
  // Production should always have environment variables set
  console.log('❌ No environment variables found in production');
  throw new Error('NEXT_PUBLIC_APP_URL environment variable is required in production');
}

/**
 * Get the auth callback URL for OAuth redirects
 */
export function getAuthCallbackUrl(next: string = '/dashboard'): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/auth/callback?next=${encodeURIComponent(next)}`;
} 