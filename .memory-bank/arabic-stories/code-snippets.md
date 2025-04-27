# Important Code Snippets

## Story Data Structure
```typescript
interface Story {
  id: string;
  title: {
    english: string;
    arabic: string;
  };
  content: {
    english: string[];
    arabic: string[];
  };
  difficulty?: 'simple' | 'easy' | 'normal' | 'advanced';
  dialect?: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  created_at?: string;
  user_id?: string;
  word_mappings?: Record<string, string>;
}

export const stories: Story[] = [
  {
    id: "little-red-riding-hood",
    title: {
      english: "Little Red Riding Hood",
      arabic: "ذات الرداء الأحمر"
    },
    content: {
      english: [
        "Once upon a time, there was a sweet little girl...",
        // More paragraphs
      ],
      arabic: [
        "كان يا ما كان، كانت هناك فتاة صغيرة حلوة...",
        // More paragraphs
      ]
    },
    difficulty: "easy",
    dialect: "saudi"
  }
];
```

## Word Mapping Utilities
```typescript
// Helper for parsing Arabic text and removing diacritics
export const cleanArabicWord = (word: string): string => {
  // Remove punctuation marks
  const noPunctuation = word.replace(/[،.!؟:;]/g, '');
  
  // Remove diacritics (tashkeel)
  const noDiacritics = noPunctuation.replace(/[\u064B-\u065F\u0670]/g, '');
  
  return noDiacritics;
};

// Split Arabic text into words handling special cases
export const splitArabicText = (text: string): string[] => {
  // Handle special characters and whitespace
  return text.split(/\s+/).filter(word => word.length > 0);
};

// Get word mappings for a specific story
export const getWordMappingsForStory = (storyId: string): Record<string, string> => {
  // Find the story by ID
  const story = stories.find(s => s.id === storyId);
  
  // If story has explicit mappings, use those
  if (story?.word_mappings && Object.keys(story.word_mappings).length > 0) {
    return story.word_mappings;
  }
  
  // Otherwise, generate mappings from content
  const mappings: Record<string, string> = {};
  
  if (story) {
    // Create word-by-word mapping from the parallel texts
    story.content.arabic.forEach((paragraph, paragraphIndex) => {
      const arabicWords = splitArabicText(paragraph);
      const englishParagraph = story.content.english[paragraphIndex] || '';
      
      // Simple word mapping strategy - not perfect but a baseline
      // In production, we'd use more sophisticated alignment algorithms
      const englishWords = englishParagraph.split(/\s+/);
      
      // Map approximate corresponding words
      const ratio = englishWords.length / arabicWords.length;
      arabicWords.forEach((word, index) => {
        const cleanWord = cleanArabicWord(word);
        if (!mappings[cleanWord]) {
          const approxEngIndex = Math.min(
            Math.floor(index * ratio), 
            englishWords.length - 1
          );
          mappings[cleanWord] = englishWords[approxEngIndex] || 'unknown';
        }
      });
    });
  }
  
  return mappings;
};
```

## Arabic Text Component
```tsx
// ArabicText.tsx
import React, { useCallback } from 'react';
import styles from './ArabicText.module.css';

interface ArabicTextProps {
  text: string;
  onWordClick: (word: string, translation: string) => void;
  learnedWords: Set<string>;
  wordMappings: Record<string, string>;
  highlightWords?: string[];
}

const ArabicText: React.FC<ArabicTextProps> = ({
  text,
  onWordClick,
  learnedWords,
  wordMappings,
  highlightWords = []
}) => {
  // Split text into words
  const words = text.split(/\s+/);
  
  // Set of highlighted words for faster lookups
  const highlightSet = new Set(highlightWords);
  
  // Memoized handler to avoid recreating on each render
  const handleWordClick = useCallback((word: string, translation: string) => {
    onWordClick(word, translation);
  }, [onWordClick]);
  
  return (
    <p className={styles.arabicText} dir="rtl">
      {words.map((word, index) => {
        // Clean the word for dictionary lookup
        const cleanWord = word.replace(/[،.!؟:;]/g, '');
        const translation = wordMappings[cleanWord] || "Unknown";
        const isLearned = learnedWords.has(cleanWord);
        const isHighlighted = highlightSet.has(cleanWord);
        
        return (
          <span 
            key={`${index}-${word}`}
            className={`${styles.word} ${
              isLearned ? styles.learned : ''
            } ${
              isHighlighted ? styles.highlighted : ''
            }`}
            onClick={() => handleWordClick(cleanWord, translation)}
            data-translation={translation}
            title={translation}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
};

export default React.memo(ArabicText); // Memoize component for performance
```

## Authentication Context and Hook
```typescript
// auth.tsx - Complete authentication context with providers
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, refreshSupabaseClient } from './supabase';
import { useRouter } from 'next/router';

// Type definitions for the auth context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, user: User | null }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  isPaid: boolean;
  refreshPaymentStatus: () => Promise<boolean>;
  recoverConnection: () => Promise<boolean>;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: () => Promise.resolve({ error: null }),
  signInWithGoogle: () => Promise.resolve({ error: null }),
  signUp: () => Promise.resolve({ error: null, user: null }),
  signOut: () => Promise.resolve({ error: null }),
  resetPassword: () => Promise.resolve({ error: null }),
  isPaid: false,
  refreshPaymentStatus: () => Promise.resolve(false),
  recoverConnection: () => Promise.resolve(false),
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const router = useRouter();

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        setConnectionError(false);
      }
      
      return { error };
    } catch (error) {
      console.error("Sign in error:", error);
      setConnectionError(true);
      return { error };
    }
  }, []);

  // Sign out current user
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        // Clear user state on successful signout
        setUser(null);
        setSession(null);
        setIsPaid(false);
        
        // Redirect to home page
        router.push('/');
      }
      
      return { error };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error };
    }
  }, [router]);

  // Hook usage
  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signIn,
      signInWithGoogle: () => Promise.resolve({ error: null }), // Implemented in full component
      signUp: () => Promise.resolve({ error: null, user: null }), // Implemented in full component
      signOut,
      resetPassword: () => Promise.resolve({ error: null }), // Implemented in full component
      isPaid,
      refreshPaymentStatus: () => Promise.resolve(false), // Implemented in full component
      recoverConnection: () => Promise.resolve(false), // Implemented in full component
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

## Story Reader Component
```tsx
// Simplified StoryReader.tsx with core functionality
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ArabicText from './ArabicText';
import LearnedWords from './LearnedWords';
import TranslationPopup from './TranslationPopup';
import { getWordMappingsForStory } from '../data/mappings';
import { stories } from '../data/stories';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../lib/auth';

const StoryReader: React.FC = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const storyIdFromUrl = searchParams.get('id');
  
  // State for the selected story
  const [selectedStoryId, setSelectedStoryId] = useState(storyIdFromUrl || stories[0].id);
  const selectedStory = stories.find((story) => story.id === selectedStoryId) || stories[0];

  // State for story-specific word mappings
  const [wordMappings, setWordMappings] = useState<Record<string, string>>({});

  // State for translation popup
  const [popupInfo, setPopupInfo] = useState({
    word: '',
    translation: '',
    isVisible: false,
  });

  // Persistent learned words with local storage
  const [learnedWords, setLearnedWords] = useLocalStorage<Array<{ 
    word: string; 
    translation: string;
    timestamp?: number;
    reviewCount?: number;
  }>>(
    `learned-words-${user?.id || 'anonymous'}`,
    []
  );
  
  // Create a Set for faster lookups
  const learnedWordsSet = new Set(learnedWords.map((item) => item.word));

  // Load mappings when story changes
  useEffect(() => {
    const mappings = getWordMappingsForStory(selectedStoryId);
    setWordMappings(mappings);
  }, [selectedStoryId]);

  // Handle URL parameter changes
  useEffect(() => {
    if (storyIdFromUrl && stories.some(story => story.id === storyIdFromUrl)) {
      setSelectedStoryId(storyIdFromUrl);
    }
  }, [storyIdFromUrl]);

  // Handle word click with useCallback for performance
  const handleWordClick = useCallback((word: string, translation: string) => {
    // Show popup
    setPopupInfo({
      word,
      translation,
      isVisible: true,
    });

    // Add to learned words if not already there
    if (!learnedWordsSet.has(word)) {
      setLearnedWords(prev => [{
        word,
        translation,
        timestamp: Date.now(),
        reviewCount: 1
      }, ...prev]);
    } else {
      // Update existing word's review count
      setLearnedWords(prev => {
        const existingIndex = prev.findIndex(item => item.word === word);
        if (existingIndex === -1) return prev;
        
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          timestamp: Date.now(),
          reviewCount: (updated[existingIndex].reviewCount || 0) + 1
        };
        
        // Move to the top of the list
        return [
          updated[existingIndex],
          ...updated.slice(0, existingIndex),
          ...updated.slice(existingIndex + 1)
        ];
      });
    }
  }, [learnedWordsSet, setLearnedWords]);

  return (
    <div className="story-reader-container">
      {/* Story selection and content rendering */}
      <div className="story-content">
        {selectedStory.content.arabic.map((paragraph, index) => (
          <ArabicText
            key={`paragraph-${index}`}
            text={paragraph}
            onWordClick={handleWordClick}
            learnedWords={learnedWordsSet}
            wordMappings={wordMappings}
          />
        ))}
      </div>
      
      {/* Translation popup */}
      <TranslationPopup
        word={popupInfo.word}
        translation={popupInfo.translation}
        isVisible={popupInfo.isVisible}
        onClose={() => setPopupInfo(prev => ({ ...prev, isVisible: false }))}
      />
      
      {/* Other component parts... */}
    </div>
  );
};

export default StoryReader;
```

## OpenAI Story Generation API
```typescript
// src/pages/api/generate-story.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getServerSupabase } from '../../lib/supabase';

// Create a server-side OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define parameter types for story generation
type StoryParams = {
  difficulty: 'simple' | 'easy' | 'normal' | 'advanced';
  dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  words: string[];
  topic?: string;
  longStory?: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Authenticate the user
  const supabase = getServerSupabase(req);
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Parse request body
    const { difficulty, dialect, words, topic, longStory } = req.body as StoryParams;

    // Validate parameters
    if (!difficulty || !dialect) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }
    
    // Check if user has paid (for premium features)
    const { data: userData } = await supabase
      .from('profiles')
      .select('has_paid')
      .eq('id', session.user.id)
      .single();
    
    // Free users can only create simple and easy stories
    if (!userData?.has_paid && (difficulty === 'normal' || difficulty === 'advanced')) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required for this difficulty level',
      });
    }

    // Call OpenAI to generate the story
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `Generate an Arabic story in ${dialect} dialect at ${difficulty} difficulty level.`
        },
        {
          role: "user",
          content: `Create a story about ${topic || 'everyday life'}.`
        }
      ],
      temperature: 0.7,
      max_tokens: longStory ? 4000 : 2000,
    });

    // Process the response
    const generatedText = completion.choices[0].message.content;
    if (!generatedText) {
      return res.status(500).json({ success: false, error: 'No response from AI' });
    }

    // Return the generated story
    return res.status(200).json({
      success: true,
      data: {
        content: generatedText,
        // Additional processing would happen here in the full implementation
      }
    });
  } catch (error: any) {
    console.error('Story generation error:', error);
    return res.status(500).json({
      success: false,
      error: `Generation failed: ${error.message}`,
    });
  }
}
```

## Custom Hooks
```typescript
// useLocalStorage.ts - Custom hook for persistent storage
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize on mount
  useEffect(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      const value = item ? JSON.parse(item) : initialValue;
      setStoredValue(value);
    } catch (error) {
      // If error, use the initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// useMediaQuery.ts - Hook for responsive design
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set initial value
      setMatches(media.matches);
      
      // Define listener for changes
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };
      
      // Add listener for changes
      media.addEventListener('change', listener);
      
      // Clean up
      return () => {
        media.removeEventListener('change', listener);
      };
    }
  }, [query]);

  return matches;
}

// useDebounce.ts - Utility for form inputs
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update debounced value after specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel timeout on value change or unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## Stripe Integration
```typescript
// Create checkout session API endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getServerSupabase } from '../../lib/supabase';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the user
    const supabase = getServerSupabase(req);
    if (!supabase) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = session.user.id;
    
    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Arabic Stories Premium',
              description: 'Full access to all premium features and content',
            },
            unit_amount: 999, // $9.99
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    // Return the session ID to the client
    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
}
``` 