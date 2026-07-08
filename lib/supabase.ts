import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://db.cnlsrwfglqyrvpyuimxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiLmNubHNyd2ZnbHF5cnZweXVpbXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNTkzMjEsImV4cCI6MjA0NjgzNTMyMX0.FcL_8vQdhJrBJaFBvEJmZvCrP4VXGk_2lhcqKuJ-2N0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function initializeDatabase() {
  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('create_users_table', {}, { count: 'exact' }).catch(() => ({ error: null }));

    // Create user_progress table
    const { error: progressError } = await supabase.rpc('create_progress_table', {}, { count: 'exact' }).catch(() => ({ error: null }));

    return { usersError, progressError };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { error };
  }
}

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: number;
  question_title?: string;
  question_phase?: string;
  status: 'todo' | 'done' | 'revise';
  notes: string;
  updated_at: string;
}
