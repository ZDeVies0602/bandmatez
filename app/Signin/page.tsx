"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Check your email for the magic link!",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[color:var(--bg-light)] text-[color:var(--text-dark)]">
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

      <main className="max-w-[500px] w-full px-8 z-20">
        <div className="bg-white/95 backdrop-blur-[10px] border-2 border-[color:var(--text-dark)] p-12 shadow-[0_20px_40px_rgba(49,8,31,0.1)] transition-all duration-300 rounded-xl hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(49,8,31,0.15)]">
          <div className="text-center mb-10">
            <h1 className="font-['Bebas_Neue'] text-[clamp(2.5rem,6vw,3.5rem)] font-normal text-[color:var(--text-dark)] tracking-[2px] m-0 mb-4 leading-tight">
              Music Tools Suite
            </h1>
            <p className="text-lg text-[color:var(--neutral-gray)] leading-relaxed m-0">
              Sign in to access your personal music toolkit
            </p>
          </div>

          <form onSubmit={handleSignIn} className="mb-8">
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block font-semibold text-[color:var(--text-dark)] mb-2 text-sm uppercase tracking-[0.5px]"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-5 py-4 border-2 border-[color:var(--neutral-gray)] bg-[color:var(--bg-light)] text-[color:var(--text-dark)] text-base transition-all duration-300 box-border rounded-lg focus:outline-none focus:border-[color:var(--accent-red)] focus:bg-white focus:-translate-y-1 focus:shadow-[0_5px_15px_rgba(107,15,26,0.1)] placeholder:text-[color:var(--neutral-gray)] placeholder:opacity-70"
              />
            </div>

            {message && (
              <div
                className={`px-5 py-4 mb-6 border-2 font-medium text-sm rounded-lg ${
                  message.type === "success"
                    ? "bg-green-500/10 border-green-500 text-green-700"
                    : "bg-red-500/10 border-red-500 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[color:var(--accent-red)] text-[color:var(--bg-light)] px-8 py-5 border-2 border-[color:var(--accent-red)] font-bold text-lg uppercase tracking-wider cursor-pointer transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.1)] rounded-full hover:bg-[color:var(--text-dark)] hover:border-[color:var(--text-dark)] hover:-translate-y-1 hover:shadow-[0_15px_25px_rgba(49,8,31,0.2)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Sending Magic Link..." : "Send Magic Link"}
            </button>
          </form>

          <div className="text-center">
            <a
              href="/"
              className="text-[color:var(--neutral-gray)] no-underline font-medium transition-all duration-300 text-sm hover:text-[color:var(--accent-red)] hover:-translate-x-1"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
