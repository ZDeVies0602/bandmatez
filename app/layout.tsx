import type { Metadata } from 'next';
import { Inter, Bebas_Neue, VT323, Press_Start_2P, Orbitron, Russo_One, Righteous, Bangers } from 'next/font/google';
import './styles/globals.css';
import { SoundProvider } from './contexts/SoundContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bebasNeue = Bebas_Neue({ subsets: ['latin'], variable: '--font-bebas-neue', weight: '400' });
const vt323 = VT323({ subsets: ['latin'], variable: '--font-vt323', weight: '400' });
const pressStart2P = Press_Start_2P({ subsets: ['latin'], variable: '--font-press-start-2p', weight: '400' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const russoOne = Russo_One({ subsets: ['latin'], variable: '--font-russo-one', weight: '400' });
const righteous = Righteous({ subsets: ['latin'], variable: '--font-righteous', weight: '400' });
const bangers = Bangers({ subsets: ['latin'], variable: '--font-bangers', weight: '400' });

export const metadata: Metadata = {
  title: 'Music Tools Suite - Piano, Metronome & Tuner',
  description: 'Professional music tools including virtual piano with ultra-optimized scrolling, advanced metronome with tap tempo, and precision pitch tuner.',
  keywords: 'virtual piano, metronome, pitch tuner, music tools, piano keyboard, tempo, tuning',
  authors: [{ name: 'Music Tools Suite' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={[
          inter.variable,
          bebasNeue.variable,
          vt323.variable,
          pressStart2P.variable,
          orbitron.variable,
          russoOne.variable,
          righteous.variable,
          bangers.variable
        ].join(' ')}
      >
        <SoundProvider>
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
