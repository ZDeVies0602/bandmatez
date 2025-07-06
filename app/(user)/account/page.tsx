"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import ThemeMenu from "../../components/ThemeMenu";

export default function Account() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [userRecord, setUserRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get the authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/Signin");
          return;
        }

        setUser(user);

        // Get the user record from our database
        const { data: userRecord, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (!dbError && userRecord) {
          setUserRecord(userRecord);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen z-10 flex items-center justify-center">
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

  return (
    <div className="relative min-h-screen z-10 py-8">
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

      <ThemeMenu />

      <main className="max-w-4xl mx-auto px-8 z-20 relative">
        <div className="bg-white/8 border-2 border-white/15 rounded-3xl p-12 backdrop-blur-3xl relative z-20 shadow-[0_12px_48px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-white/12 hover:border-white/25 hover:-translate-y-1 hover:shadow-[0_16px_64px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <div className="text-center mb-12">
            <h1 className="font-['Bangers'] text-[clamp(2.5rem,6vw,4rem)] font-normal text-white tracking-[3px] m-0 mb-4 leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] uppercase">
              Account Settings
            </h1>
            <p className="text-xl text-white/80 leading-relaxed m-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
              Manage your profile and authentication settings
            </p>
          </div>

          {/* User Information */}
          <div className="mb-10 pb-8 border-b border-white/10 last:border-b-0">
            <h2 className="text-[1.6rem] font-semibold text-white mb-6 uppercase tracking-[1.5px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
              Authentication Info
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
              <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  Email
                </label>
                <span className="text-white text-base break-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed">
                  {user?.email}
                </span>
              </div>
              <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  User ID
                </label>
                <span className="font-mono text-[0.85rem] bg-black/20 p-3 border border-white/20 rounded-lg break-all text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed">
                  {user?.id}
                </span>
              </div>
              <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  Last Sign In
                </label>
                <span className="text-white text-base break-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  Email Confirmed
                </label>
                <span
                  className={`text-base break-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed ${
                    user?.email_confirmed_at
                      ? "text-green-400 font-semibold drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                      : "text-red-400 font-semibold drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]"
                  }`}
                >
                  {user?.email_confirmed_at ? "✅ Confirmed" : "❌ Unconfirmed"}
                </span>
              </div>
            </div>
          </div>

          {/* Database Record */}
          {userRecord && (
            <div className="mb-10 pb-8 border-b border-white/10 last:border-b-0">
              <h2 className="text-[1.6rem] font-semibold text-white mb-6 uppercase tracking-[1.5px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                Database Record
              </h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                  <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                    Database ID
                  </label>
                  <span className="text-white text-base break-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed">
                    {userRecord.id}
                  </span>
                </div>
                <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                  <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                    Full Name
                  </label>
                  <span className="text-white text-base break-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed">
                    {userRecord.full_name || "Not set"}
                  </span>
                </div>
                <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                  <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                    Created At
                  </label>
                  <span className="text-white text-base break-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed">
                    {new Date(userRecord.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                  <label className="font-semibold text-white/70 text-sm uppercase tracking-[0.8px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                    Updated At
                  </label>
                  <span className="text-white text-base break-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] leading-relaxed">
                    {new Date(userRecord.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-6 items-center mt-12 pt-8 border-t border-white/10">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-gradient-to-br from-red-500/90 to-red-600/90 text-white px-12 py-5 border-2 border-red-500/80 rounded-xl font-bold text-lg uppercase tracking-[1.2px] cursor-pointer transition-all duration-300 shadow-[0_8px_25px_rgba(239,68,68,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-[10px] hover:bg-gradient-to-br hover:from-red-600/95 hover:to-red-700/95 hover:border-red-600/90 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(239,68,68,0.4)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[0_4px_15px_rgba(239,68,68,0.2)] disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>

            <a
              href="/dashboard"
              className="text-white/80 no-underline font-medium transition-all duration-300 text-base drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20 hover:-translate-x-1 hover:drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
