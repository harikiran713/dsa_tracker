import { supabase, User, UserProgress } from './supabase';

// Fallback offline user storage
let offlineUsers: Map<string, User> = new Map();

// User Management
export async function getOrCreateUser(username: string): Promise<User | null> {
  try {
    // First try Supabase
    try {
      // Check if user exists
      const { data: existingUser, error: selectError } = await Promise.race([
        supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      if (!selectError) {
        return existingUser as User;
      }

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn('Warning checking user in Supabase:', selectError.message);
      }

      // Try to create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ username }])
        .select()
        .single();

      if (!insertError) {
        return newUser as User;
      }
      
      console.warn('Could not insert user to Supabase, using offline mode');
    } catch (supabaseError) {
      console.log('[v0] Supabase offline, using local storage mode');
    }

    // Fallback: use offline storage
    if (offlineUsers.has(username)) {
      return offlineUsers.get(username)!;
    }

    const newUser: User = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      created_at: new Date().toISOString(),
    };

    offlineUsers.set(username, newUser);
    localStorage.setItem('offline_users', JSON.stringify(Array.from(offlineUsers.entries())));
    return newUser;
  } catch (error) {
    console.error('Unexpected error in getOrCreateUser:', error);
    return null;
  }
}

// Progress Management
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .order('question_id', { ascending: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      if (!error) {
        return (data || []) as UserProgress[];
      }
    } catch (err) {
      console.log('[v0] Using offline progress storage');
    }

    // Fallback: get from localStorage
    const stored = localStorage.getItem(`progress_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Unexpected error in getUserProgress:', error);
    return [];
  }
}

export async function updateQuestionProgress(
  userId: string,
  questionId: number,
  questionTitle: string,
  questionPhase: string,
  status: 'todo' | 'done' | 'revise',
  notes: string
): Promise<boolean> {
  try {
    const progressItem: UserProgress = {
      id: `${userId}-${questionId}`,
      user_id: userId,
      question_id: questionId,
      question_title: questionTitle,
      question_phase: questionPhase,
      status,
      notes,
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage first (for immediate availability)
    const stored = localStorage.getItem(`progress_${userId}`);
    const progress = stored ? JSON.parse(stored) : [];
    const index = progress.findIndex((p: UserProgress) => p.question_id === questionId);
    if (index >= 0) {
      progress[index] = progressItem;
    } else {
      progress.push(progressItem);
    }
    localStorage.setItem(`progress_${userId}`, JSON.stringify(progress));

    // Try to sync with Supabase
    try {
      await Promise.race([
        supabase
          .from('user_progress')
          .upsert([progressItem], { onConflict: 'user_id,question_id' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (err) {
      console.log('[v0] Progress saved offline, will sync when connection available');
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in updateQuestionProgress:', error);
    return false;
  }
}

export async function getQuestionProgress(
  userId: string,
  questionId: number
): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching question progress:', error);
      return null;
    }

    return (data || null) as UserProgress | null;
  } catch (error) {
    console.error('Unexpected error in getQuestionProgress:', error);
    return null;
  }
}

export async function deleteUserProgress(userId: string, questionId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId);

    if (error) {
      console.error('Error deleting progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in deleteUserProgress:', error);
    return false;
  }
}

export async function resetUserProgress(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in resetUserProgress:', error);
    return false;
  }
}
