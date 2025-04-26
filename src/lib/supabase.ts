import { createClient } from '@supabase/supabase-js';
import { NextApiRequest } from 'next';

// Initialize Supabase client
// Can be used in both client and server contexts
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  // Only create the client once
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables:', {
        url: !supabaseUrl ? 'missing' : 'present',
        key: !supabaseAnonKey ? 'missing' : 'present'
      });
      return null;
    }
    
    try {
      console.log('Creating new Supabase client with URL:', supabaseUrl.substring(0, 15) + '...');
      
      // Get current origin for site URL
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      // Create client with additional options for better compatibility
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',  // Use PKCE flow for better security
        },
        global: {
          fetch: fetch
        }
      });
      
      // Test if the client is valid
      if (!supabaseInstance || !supabaseInstance.auth) {
        console.error('Supabase client created but appears invalid');
        return null;
      }
      
      console.log('Supabase client initialized successfully', { siteUrl });
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return null;
    }
  }
  
  return supabaseInstance;
};

/**
 * Get a Supabase client specifically for server-side API handlers, with proper auth context
 */
export const getServerSupabase = (req: NextApiRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  
  try {
    // Create a new client with the request cookies for auth context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: req.headers.cookie || '',
        },
      },
    });
    
    return supabase;
  } catch (error) {
    console.error('Error creating server Supabase client:', error);
    return null;
  }
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