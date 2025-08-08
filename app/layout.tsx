import type { Metadata, Viewport } from "next";
import { Bangers } from "next/font/google";
import "./styles/output.css";
import { SoundProvider } from "./contexts/SoundContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import PracticeTracker from "./components/PracticeTracker";

const bangers = Bangers({
  subsets: ["latin"],
  variable: "--font-bangers",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Music Tools Suite - Piano, Metronome & Tuner",
  description:
    "Professional music tools including virtual piano with ultra-optimized scrolling, advanced metronome with tap tempo, and precision pitch tuner.",
  keywords:
    "virtual piano, metronome, pitch tuner, music tools, piano keyboard, tempo, tuning",
  authors: [{ name: "Music Tools Suite" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={bangers.variable}>
        <ThemeProvider>
          {children}
          <PracticeTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
