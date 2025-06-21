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
        <div className="shape shape5"></div>
        <div className="shape shape6"></div>
        <div className="shape shape7"></div>
        <div className="shape shape8"></div>
        <div className="shape shape9"></div>
        <div className="shape shape10"></div>
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
          --shape-color-1: #31081F;
          --shape-color-2: #6B0F1A;
          --shape-color-3: #595959;
          --shape-color-4: #808F85;
          --shape-color-5: #DCE0D9;
          background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-muted) 50%, var(--bg-light) 100%);
          color: var(--text-dark);
          min-height: 100vh;
          font-family: var(--font-inter), sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -2;
          opacity: 0.05;
          background-image: 
            radial-gradient(circle at 25% 25%, var(--shape-color-2) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, var(--shape-color-3) 1px, transparent 1px),
            linear-gradient(45deg, transparent 40%, var(--shape-color-1) 40%, var(--shape-color-1) 60%, transparent 60%),
            linear-gradient(-45deg, transparent 40%, var(--shape-color-4) 40%, var(--shape-color-4) 60%, transparent 60%);
          background-size: 50px 50px, 30px 30px, 100px 100px, 100px 100px;
          background-position: 0 0, 25px 25px, 0 0, 50px 50px;
          animation: patternShift 60s linear infinite;
        }

        @keyframes patternShift {
          0% { background-position: 0 0, 25px 25px, 0 0, 50px 50px; }
          100% { background-position: 50px 50px, 75px 75px, 100px 100px, 150px 150px; }
        }

        /* Enhanced Geometric Background Shapes */
        .background-shapes .shape {
          position: absolute;
          transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          will-change: transform;
          opacity: 0.7;
        }
        
        /* Primary geometric shapes matching the enhanced system */
        .shape1 {
          width: 30rem;
          height: 30rem;
          background: linear-gradient(135deg, var(--shape-color-1), var(--shape-color-2));
          top: -15%;
          left: -15%;
          clip-path: polygon(0 0, 100% 0, 50% 100%);
          transform: rotate(-15deg);
          filter: blur(0.5px);
        }

        .shape2 {
          width: 25rem;
          height: 25rem;
          border: 4rem solid var(--shape-color-2);
          bottom: -10%;
          right: -15%;
          border-radius: 50%;
          background: transparent;
        }

        .shape3 {
          width: 15rem;
          height: 15rem;
          background: var(--shape-color-3);
          top: 15%;
          right: 15%;
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          transform: rotate(30deg);
        }

        .shape4 {
          width: 12rem;
          height: 12rem;
          background: var(--shape-color-1);
          top: 65%;
          left: 8%;
          transform: rotate(45deg);
          border-radius: 10%;
        }

        .shape5 {
          width: 20rem;
          height: 20rem;
          background: var(--shape-color-4);
          top: 35%;
          right: -10rem;
          border-radius: 0 0 0 100%;
          transform: rotate(-25deg);
        }

        .shape6 {
          width: 8rem;
          height: 8rem;
          background: var(--shape-color-2);
          bottom: 25%;
          left: 20%;
          border-radius: 50%;
        }

        .shape6::before {
          content: '';
          position: absolute;
          width: 8rem;
          height: 8rem;
          background: var(--shape-color-3);
          border-radius: 50%;
          left: 10rem;
          top: 0;
        }

        .shape6::after {
          content: '';
          position: absolute;
          width: 8rem;
          height: 8rem;
          background: var(--shape-color-4);
          border-radius: 50%;
          left: 20rem;
          top: 0;
        }

        .shape7 {
          width: 3rem;
          height: 18rem;
          background: var(--shape-color-1);
          top: 8%;
          left: 40%;
          border-radius: 1.5rem;
        }

        .shape7::before {
          content: '';
          position: absolute;
          width: 3rem;
          height: 18rem;
          background: var(--shape-color-2);
          border-radius: 1.5rem;
          left: 5rem;
          top: 0;
        }

        .shape7::after {
          content: '';
          position: absolute;
          width: 3rem;
          height: 18rem;
          background: var(--shape-color-3);
          border-radius: 1.5rem;
          left: 10rem;
          top: 0;
        }

        .shape8 {
          width: 30rem;
          height: 30rem;
          border: 2rem solid var(--shape-color-5);
          bottom: -15rem;
          left: -8rem;
          border-radius: 50%;
          background: transparent;
        }

        .shape9 {
          width: 6rem;
          height: 6rem;
          background: var(--shape-color-4);
          top: 50%;
          right: 25%;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          transform: rotate(45deg);
        }

        .shape10 {
          width: 12rem;
          height: 12rem;
          background: var(--shape-color-5);
          bottom: 40%;
          right: 5%;
          border-radius: 50% 50% 0 50%;
          transform: rotate(-30deg);
        }

        /* Animations */
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1); 
          }
          33% { 
            transform: translateY(-15px) rotate(2deg) scale(1.02); 
          }
          66% { 
            transform: translateY(5px) rotate(-1deg) scale(0.98); 
          }
        }

        @keyframes floatReverse {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1); 
          }
          33% { 
            transform: translateY(10px) rotate(-2deg) scale(0.98); 
          }
          66% { 
            transform: translateY(-8px) rotate(1deg) scale(1.02); 
          }
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 0.7; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.05); 
          }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .shape1, .shape3, .shape5, .shape7, .shape9 {
          animation: float 12s ease-in-out infinite;
        }

        .shape2, .shape4, .shape6, .shape8, .shape10 {
          animation: floatReverse 10s ease-in-out infinite;
        }

        .shape2, .shape8 {
          animation: rotate 120s linear infinite, pulse 8s ease-in-out infinite;
        }

        .shape6::before, .shape6::after,
        .shape7::before, .shape7::after {
          animation: pulse 6s ease-in-out infinite;
          animation-delay: 1s, 2s;
        }

        .main-content {
          max-width: 1200px;
          width: 100%;
          padding: 2rem;
          text-align: center;
          z-index: 2;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
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
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
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
          padding: 1.2rem 3.5rem;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          border: 2px solid var(--accent-red);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          border-radius: 50px;
          position: relative;
          overflow: hidden;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .cta-button:hover::before {
          left: 100%;
        }

        .cta-button:hover {
          background: var(--text-dark);
          color: var(--bg-light);
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 15px 25px rgba(49, 8, 31, 0.2);
          border-color: var(--text-dark);
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          text-align: left;
        }

        .feature-card {
          padding: 2.5rem;
          border: 2px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.05;
          transition: opacity 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px -10px rgba(49, 8, 31, 0.3);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .feature-card:hover::before {
          opacity: 0.1;
        }
        
        .feature-card.card1 {
          background: rgba(107, 15, 26, 0.1);
          color: var(--text-dark);
        }

        .feature-card.card1::before {
          background: linear-gradient(135deg, var(--shape-color-1), var(--shape-color-2));
        }
        
        .feature-card.card2 {
          background: rgba(89, 89, 89, 0.1);
          color: var(--text-dark);
        }

        .feature-card.card2::before {
          background: linear-gradient(135deg, var(--shape-color-3), var(--shape-color-4));
        }

        .feature-card.card3 {
          background: rgba(128, 143, 133, 0.1);
          color: var(--text-dark);
        }

        .feature-card.card3::before {
          background: linear-gradient(135deg, var(--shape-color-4), var(--shape-color-5));
        }
        
        .feature-card h3 {
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
          letter-spacing: 1px;
          position: relative;
          z-index: 1;
        }

        .feature-card p {
          font-size: 1rem;
          line-height: 1.5;
          margin: 0;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        @media (max-width: 768px) {
          .main-content {
            text-align: center;
            padding: 1.5rem;
          }
          .features {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}