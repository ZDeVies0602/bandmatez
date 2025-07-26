"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[linear-gradient(135deg,var(--bg-light)_0%,var(--bg-muted)_50%,var(--bg-light)_100%)] text-[color:var(--text-dark)]">
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

      <main className="max-w-6xl w-full px-8 text-center z-20 bg-white/5 backdrop-blur-[10px] rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <section className="mb-20">
          <h1 className="font-['Bebas_Neue'] text-[clamp(3.5rem,10vw,7rem)] font-normal text-[color:var(--text-dark)] tracking-[2px] m-0 mb-4 leading-tight drop-shadow-[2px_2px_4px_rgba(0,0,0,0.1)]">
            Music Tools Suite
          </h1>
          <p className="text-[clamp(1rem,2.5vw,1.25rem)] text-[color:var(--neutral-gray)] max-w-[500px] mx-auto my-4 mb-10 leading-relaxed">
            A collection of essential tools for the modern musician. Precision,
            performance, and design in harmony.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-[color:var(--accent-red)] text-[color:var(--bg-light)] px-14 py-5 no-underline font-bold text-lg transition-all duration-300 border-2 border-[color:var(--accent-red)] shadow-[0_5px_15px_rgba(0,0,0,0.1)] rounded-full relative overflow-hidden hover:bg-[color:var(--text-dark)] hover:text-[color:var(--bg-light)] hover:-translate-y-1 hover:scale-105 hover:shadow-[0_15px_25px_rgba(49,8,31,0.2)] hover:border-[color:var(--text-dark)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] before:transition-[left_0.5s_ease] hover:before:left-[100%]"
          >
            Enter the Suite
          </Link>
        </section>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 text-left">
          <div className="p-10 border-2 border-white/15 transition-all duration-300 rounded-3xl backdrop-blur-[10px] relative overflow-hidden bg-[rgba(107,15,26,0.1)] text-[color:var(--text-dark)] hover:-translate-y-3 hover:shadow-[0_20px_40px_-10px_rgba(49,8,31,0.3)] hover:border-white/25 before:content-[''] before:absolute before:inset-0 before:opacity-5 before:transition-opacity before:duration-300 before:bg-[linear-gradient(135deg,var(--shape-color-1),var(--shape-color-2))] hover:before:opacity-10">
            <h3 className="font-['Bebas_Neue'] text-[2rem] m-0 mb-2 tracking-wider relative z-10">
              Virtual Piano
            </h3>
            <p className="text-base leading-relaxed m-0 opacity-90 relative z-10">
              Responsive keys, multiple octaves, and zero-latency sound.
            </p>
          </div>

          <div className="p-10 border-2 border-white/15 transition-all duration-300 rounded-3xl backdrop-blur-[10px] relative overflow-hidden bg-[rgba(89,89,89,0.1)] text-[color:var(--text-dark)] hover:-translate-y-3 hover:shadow-[0_20px_40px_-10px_rgba(49,8,31,0.3)] hover:border-white/25 before:content-[''] before:absolute before:inset-0 before:opacity-5 before:transition-opacity before:duration-300 before:bg-[linear-gradient(135deg,var(--shape-color-3),var(--shape-color-4))] hover:before:opacity-10">
            <h3 className="font-['Bebas_Neue'] text-[2rem] m-0 mb-2 tracking-wider relative z-10">
              Metronome
            </h3>
            <p className="text-base leading-relaxed m-0 opacity-90 relative z-10">
              Keep perfect time with customizable beats and tap tempo.
            </p>
          </div>

          <div className="p-10 border-2 border-white/15 transition-all duration-300 rounded-3xl backdrop-blur-[10px] relative overflow-hidden bg-[rgba(128,143,133,0.1)] text-[color:var(--text-dark)] hover:-translate-y-3 hover:shadow-[0_20px_40px_-10px_rgba(49,8,31,0.3)] hover:border-white/25 before:content-[''] before:absolute before:inset-0 before:opacity-5 before:transition-opacity before:duration-300 before:bg-[linear-gradient(135deg,var(--shape-color-4),var(--shape-color-5))] hover:before:opacity-10">
            <h3 className="font-['Bebas_Neue'] text-[2rem] m-0 mb-2 tracking-wider relative z-10">
              Pitch Tuner
            </h3>
            <p className="text-base leading-relaxed m-0 opacity-90 relative z-10">
              Tune any instrument with professional-grade accuracy.
            </p>
          </div>

          <Link href="/audio-visualizer" className="no-underline">
            <div className="p-10 border-2 border-white/15 transition-all duration-300 rounded-3xl backdrop-blur-[10px] relative overflow-hidden bg-[rgba(138,43,226,0.1)] text-[color:var(--text-dark)] hover:-translate-y-3 hover:shadow-[0_20px_40px_-10px_rgba(49,8,31,0.3)] hover:border-white/25 before:content-[''] before:absolute before:inset-0 before:opacity-5 before:transition-opacity before:duration-300 before:bg-[linear-gradient(135deg,#8A2BE2,#FF69B4)] hover:before:opacity-10">
              <h3 className="font-['Bebas_Neue'] text-[2rem] m-0 mb-2 tracking-wider relative z-10">
                Audio Visualizer
              </h3>
              <p className="text-base leading-relaxed m-0 opacity-90 relative z-10">
                Create unique artwork from music with real-time visualization.
              </p>
            </div>
          </Link>

          <Link href="/music-notation" className="no-underline">
            <div className="p-10 border-2 border-white/15 transition-all duration-300 rounded-3xl backdrop-blur-[10px] relative overflow-hidden bg-[rgba(255,165,0,0.1)] text-[color:var(--text-dark)] hover:-translate-y-3 hover:shadow-[0_20px_40px_-10px_rgba(49,8,31,0.3)] hover:border-white/25 before:content-[''] before:absolute before:inset-0 before:opacity-5 before:transition-opacity before:duration-300 before:bg-[linear-gradient(135deg,#FFA500,#FFD700)] hover:before:opacity-10">
              <h3 className="font-['Bebas_Neue'] text-[2rem] m-0 mb-2 tracking-wider relative z-10">
                Music Notation & Theory
              </h3>
              <p className="text-base leading-relaxed m-0 opacity-90 relative z-10">
                Create chord progressions with real-time staff notation and Roman numeral analysis.
              </p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
