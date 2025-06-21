import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

export interface UserCreationResult {
  success: boolean;
  error?: string;
}

export async function ensurePublicUserExists(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<UserCreationResult> {
  try {
    // Ensure user has an email
    if (!user.email) {
      return {
        success: false,
        error: 'User email is required'
      };
    }

    // Check if user already exists in our users table using auth_id
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    // If user exists, return success
    if (existingUser && !selectError) {
      return { success: true };
    }

    // If user doesn't exist, create a new record
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        auth_id: user.id, // Link to Supabase auth user
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      return {
        success: false,
        error: `Failed to create user record: ${insertError.message}`
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
} 