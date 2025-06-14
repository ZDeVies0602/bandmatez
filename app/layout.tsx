import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
