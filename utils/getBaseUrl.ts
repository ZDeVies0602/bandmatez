/**
 * Get the base URL for the application
 * Uses environment variables instead of window.location.origin for security
 */
export function getBaseUrl(): string {
  // Server-side: Use environment variables
  if (typeof window === 'undefined') {
    // Production: Use NEXTAUTH_URL or NEXT_PUBLIC_APP_URL
    const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (url) return url;
    
    // Vercel deployment
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Development fallback
    return 'http://localhost:3000';
  }
  
  // Client-side: Use environment variable first, then fallback to window.location.origin only if needed
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Last resort: window.location.origin (only for local development)
  if (process.env.NODE_ENV === 'development') {
    return window.location.origin;
  }
  
  // Production should always have environment variables set
  throw new Error('NEXT_PUBLIC_APP_URL environment variable is required in production');
}

/**
 * Get the auth callback URL for OAuth redirects
 */
export function getAuthCallbackUrl(next: string = '/dashboard'): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/auth/callback?next=${encodeURIComponent(next)}`;
} 