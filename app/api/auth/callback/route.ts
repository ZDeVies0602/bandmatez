import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ensurePublicUserExists } from "@/lib/supabase/user-utils";
import rateLimiter from "@/lib/ratelimiter";
import { getBaseUrl } from "@/utils/getBaseUrl";

export async function GET(request: Request) {
  try {
    // Rate limiting by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous";
    await rateLimiter.consume(ip);
    
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    
    // Validate 'next' to avoid open redirect
    const rawNext = url.searchParams.get("next") ?? "/dashboard";
    const isValidNext =
      rawNext.startsWith("/") &&
      !rawNext.startsWith("//") &&
      !rawNext.includes("://");
    const next = isValidNext ? rawNext : "/dashboard";
    
    if (code) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.user) {
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
        return NextResponse.redirect(`${baseUrl}${next}`);
      }
    }
    
    const baseUrl = getBaseUrl();
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
  } catch (err: any) {
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