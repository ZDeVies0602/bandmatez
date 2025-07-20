"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useThemeClasses } from "../hooks/useThemeClasses";

interface AccountCircleProps {
  className?: string;
}

export default function AccountCircle({ className = "" }: AccountCircleProps) {
  const themeClasses = useThemeClasses();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!error && user) {
          setUser(user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
    setIsOpen(false);
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse border border-white/20"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${className}`}>
        <button
          onClick={() => router.push("/Signin")}
          className="px-4 py-2 rounded-lg bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/80 text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Account Circle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          ${getAvatarColor(user.email || "")}
          text-white font-bold text-lg
          border-2 border-white/20 shadow-lg
          hover:scale-105 hover:border-white/40
          transition-all duration-200
          ${isOpen ? "ring-2 ring-white/30" : ""}
        `}
      >
        {getInitials(user.email || "")}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-14 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${getAvatarColor(user.email || "")}
                  text-white font-bold
                `}
              >
                {getInitials(user.email || "")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-dark)] font-semibold text-sm truncate">
                  {user.email}
                </div>
                <div className="text-[var(--neutral-gray)] text-xs">
                  {user.email_confirmed_at ? "Verified" : "Unverified"}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                router.push("/account");
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 text-[var(--text-dark)]"
            >
              <span className="text-lg">⚙️</span>
              <span>Account Settings</span>
            </button>

            <button
              onClick={() => {
                router.push("/practice");
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 text-[var(--text-dark)]"
            >
              <span className="text-lg">📊</span>
              <span>Practice History</span>
            </button>

            <button
              onClick={() => {
                router.push("/audio-visualizer");
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 text-[var(--text-dark)]"
            >
              <span className="text-lg">🎨</span>
              <span>Audio Visualizer</span>
            </button>

            <div className="border-t border-white/10 my-2"></div>

            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-left hover:bg-red-500/20 transition-colors duration-200 flex items-center gap-3 text-red-400 hover:text-red-300"
            >
              <span className="text-lg">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
