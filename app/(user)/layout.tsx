"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { SoundProvider } from "../contexts/SoundContext";
import "../styles/globals.css";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/Signin");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          setUser(null);
          router.push("/Signin");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center z-10">
        <div className="dashboard-background">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
          <div className="shape shape-7"></div>
          <div className="shape shape-8"></div>
          <div className="shape shape-9"></div>
          <div className="shape shape-10"></div>
        </div>
        <div className="relative z-20 bg-white/10 border-2 border-white/20 rounded-3xl p-12 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="text-2xl font-semibold text-white text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Don't render children if no user (will redirect)
  if (!user) {
    return null;
  }

  return <SoundProvider>{children}</SoundProvider>;
}
