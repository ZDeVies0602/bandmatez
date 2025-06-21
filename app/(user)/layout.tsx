import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { SoundProvider } from '../contexts/SoundContext';
import '../styles/globals.css';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check authentication status
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If there's an auth error or no user, redirect to signin
  if (authError || !user) {
    redirect('/Signin');
  }

  return (
    <SoundProvider>
      {children}
    </SoundProvider>
  );
} 