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
