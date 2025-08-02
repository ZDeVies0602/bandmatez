"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex items-start justify-center relative overflow-hidden bg-[linear-gradient(135deg,var(--bg-light)_0%,var(--bg-muted)_50%,var(--bg-light)_100%)] text-[color:var(--text-dark)] pt-4">
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

      <main className="max-w-3xl w-full px-2 text-center z-20 bg-white/5 backdrop-blur-[10px] rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] py-1">
        <section className="mb-1">
          <h1 className="font-['Bebas_Neue'] text-[1.2rem] font-normal text-[color:var(--text-dark)] tracking-[1px] m-0 mb-0 leading-none drop-shadow-[2px_2px_4px_rgba(0,0,0,0.1)]">
            Music Tools
          </h1>
          <Link
            href="/dashboard"
            className="inline-block bg-[color:var(--accent-red)] text-[color:var(--bg-light)] px-3 py-0.5 no-underline font-bold text-[0.6rem] transition-all duration-300 border border-[color:var(--accent-red)] rounded-full mt-1 hover:bg-[color:var(--text-dark)]"
          >
            Enter
          </Link>
        </section>

        <section className="grid grid-cols-5 gap-0.5 text-left">
          <div className="p-1 border border-white/15 transition-all duration-300 rounded-lg backdrop-blur-[10px] relative overflow-hidden bg-[rgba(107,15,26,0.1)] text-[color:var(--text-dark)] hover:bg-[rgba(107,15,26,0.2)]">
            <h3 className="font-['Bebas_Neue'] text-[0.7rem] m-0 mb-0 tracking-wider relative z-10">
              Piano
            </h3>
          </div>

          <Link href="/dashboard" className="no-underline">
            <div className="p-1 border border-white/15 transition-all duration-300 rounded-lg backdrop-blur-[10px] relative overflow-hidden bg-[rgba(89,89,89,0.1)] text-[color:var(--text-dark)] hover:bg-[rgba(89,89,89,0.2)]">
              <h3 className="font-['Bebas_Neue'] text-[0.7rem] m-0 mb-0 tracking-wider relative z-10">
                Metro
              </h3>
            </div>
          </Link>

          <div className="p-0.5 border border-white/15 transition-all duration-300 rounded-lg backdrop-blur-[10px] relative overflow-hidden bg-[rgba(128,143,133,0.1)] text-[color:var(--text-dark)] hover:bg-[rgba(128,143,133,0.2)]">
            <h3 className="font-['Bebas_Neue'] text-[0.6rem] m-0 mb-0 tracking-wider relative z-10">
              Tune
            </h3>
          </div>

          <Link href="/audio-visualizer" className="no-underline">
            <div className="p-1 border border-white/15 transition-all duration-300 rounded-lg backdrop-blur-[10px] relative overflow-hidden bg-[rgba(138,43,226,0.1)] text-[color:var(--text-dark)] hover:bg-[rgba(138,43,226,0.2)]">
              <h3 className="font-['Bebas_Neue'] text-[0.7rem] m-0 mb-0 tracking-wider relative z-10">
                Visual
              </h3>
            </div>
          </Link>

          <Link href="/music-notation" className="no-underline">
            <div className="p-1 border border-white/15 transition-all duration-300 rounded-lg backdrop-blur-[10px] relative overflow-hidden bg-[rgba(255,165,0,0.1)] text-[color:var(--text-dark)] hover:bg-[rgba(255,165,0,0.2)]">
              <h3 className="font-['Bebas_Neue'] text-[0.7rem] m-0 mb-0 tracking-wider relative z-10">
                Notes
              </h3>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
