import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ensurePublicUserExists } from "@/lib/supabase/user-utils";
import rateLimiter from "@/lib/ratelimiter";
import { getBaseUrl } from "@/utils/getBaseUrl";

export async function GET(request: Request) {
  console.log('🔍 Auth callback route called');
  
  try {
    // Rate limiting by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous";
    await rateLimiter.consume(ip);
    
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    
    console.log('🔍 Request URL:', request.url);
    console.log('🔍 Code parameter:', code ? 'present' : 'missing');
    
    // Validate 'next' to avoid open redirect
    const rawNext = url.searchParams.get("next") ?? "/dashboard";
    const isValidNext =
      rawNext.startsWith("/") &&
      !rawNext.startsWith("//") &&
      !rawNext.includes("://");
    const next = isValidNext ? rawNext : "/dashboard";
    
    console.log('🔍 Next parameter:', next);
    
    if (code) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.user) {
        console.log('✅ Auth successful for user:', data.user.email);
        
        // Ensure public user record exists after successful auth
        const userCreationResult = await ensurePublicUserExists(
          supabase,
          data.user
        );
        
        if (!userCreationResult.success) {
          // Log the error but don't fail the auth flow
          console.error(
            "Failed to create public user record:",
            userCreationResult.error
          );
        }
        
        const baseUrl = getBaseUrl();
        console.log('🔍 Redirecting to:', `${baseUrl}${next}`);
        return NextResponse.redirect(`${baseUrl}${next}`);
      } else {
        console.log('❌ Auth failed:', error?.message);
      }
    } else {
      console.log('❌ No code parameter found');
    }
    
    const baseUrl = getBaseUrl();
    console.log('🔍 Redirecting to error page:', `${baseUrl}/auth/auth-code-error`);
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
  } catch (err: any) {
    console.error('❌ Callback route error:', err);
    
    if (err?.msBeforeNext) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before retrying." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 