import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Use a function to create the client to avoid SSR issues
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  // Only create the client once and only in the browser
  if (!supabaseInstance && typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
};

// Define types for our custom stories
export interface UserStory {
  id: string;
  title: {
    english: string;
    arabic: string;
  };
  content: {
    english: string[];
    arabic: string[];
  };
  difficulty: 'simple' | 'easy' | 'normal';
  dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  created_at: string;
  user_id?: string;
  word_mappings?: Record<string, string>;
} 