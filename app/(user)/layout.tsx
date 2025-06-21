import { SoundProvider } from '../contexts/SoundContext';
import '../styles/globals.css';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SoundProvider>
      {children}
    </SoundProvider>
  );
} 