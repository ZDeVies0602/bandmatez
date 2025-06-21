'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="shape shape4"></div>
      </div>
      
      <main className="main-content">
        <section className="hero">
          <h1 className="hero-title">Music Tools Suite</h1>
          <p className="hero-subtitle">
            A collection of essential tools for the modern musician.
            Precision, performance, and design in harmony.
          </p>
          <Link href="/dashboard" className="cta-button">
            Enter the Suite
          </Link>
        </section>

        <section className="features">
          <div className="feature-card card1">
            <h3>Virtual Piano</h3>
            <p>Responsive keys, multiple octaves, and zero-latency sound.</p>
          </div>
          <div className="feature-card card2">
            <h3>Metronome</h3>
            <p>Keep perfect time with customizable beats and tap tempo.</p>
          </div>
          <div className="feature-card card3">
            <h3>Pitch Tuner</h3>
            <p>Tune any instrument with professional-grade accuracy.</p>
          </div>
        </section>
      </main>

      <style jsx>{`
        /* Color Palette */
        .landing-page {
          --bg-light: #DCE0D9;
          --text-dark: #31081F;
          --accent-red: #6B0F1A;
          --neutral-gray: #595959;
          --bg-muted: #808F85;
          background-color: var(--bg-light);
          color: var(--text-dark);
          min-height: 100vh;
          font-family: var(--font-inter), sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Abstract Geometric Background */
        .background-shapes .shape {
          position: absolute;
          transition: transform 0.5s ease-out;
        }
        .shape1 {
          width: 30vw;
          height: 30vw;
          background: var(--bg-muted);
          top: -10vw;
          left: -5vw;
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }
        .shape2 {
          width: 25vmax;
          height: 25vmax;
          background: var(--accent-red);
          bottom: -15vmax;
          right: -15vmax;
          border-radius: 50%;
        }
        .shape3 {
          width: 40vw;
          height: 10px;
          background: var(--neutral-gray);
          top: 30%;
          right: -10vw;
          transform: rotate(-45deg);
        }
         .shape4 {
          width: 40vw;
          height: 40vw;
          background: var(--text-dark);
          top: 50%;
          left: 5%;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          opacity: 0.1;
        }

        .main-content {
          max-width: 1200px;
          width: 100%;
          padding: 2rem;
          text-align: center;
          z-index: 2;
        }

        .hero {
          margin-bottom: 5rem;
        }

        .hero-title {
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: clamp(3.5rem, 10vw, 7rem);
          font-weight: 400;
          color: var(--text-dark);
          letter-spacing: 2px;
          margin: 0;
          line-height: 1.1;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: var(--neutral-gray);
          max-width: 500px;
          margin: 1rem auto 2.5rem;
          line-height: 1.6;
        }
        
        .cta-button {
          display: inline-block;
          background: var(--accent-red);
          color: var(--bg-light);
          padding: 1rem 3rem;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          border: 2px solid var(--accent-red);
        }

        .cta-button:hover {
          background: transparent;
          color: var(--accent-red);
          transform: translateY(-3px);
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          text-align: left;
        }

        .feature-card {
          padding: 2rem;
          border: 2px solid var(--text-dark);
        }
        
        .feature-card.card1 {
          background-color: var(--bg-muted);
          color: var(--bg-light);
        }
        
        .feature-card.card2 {
          background-color: var(--text-dark);
           color: var(--bg-light);
        }

        .feature-card.card3 {
           background-color: var(--neutral-gray);
           color: var(--bg-light);
        }
        
        .feature-card h3 {
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
          letter-spacing: 1px;
        }

        .feature-card p {
          font-size: 1rem;
          line-height: 1.5;
          margin: 0;
          opacity: 0.9;
        }
        
        @media (max-width: 768px) {
           .main-content {
             text-align: center;
           }
           .features {
             text-align: center;
           }
        }
      `}</style>
    </div>
  );
}