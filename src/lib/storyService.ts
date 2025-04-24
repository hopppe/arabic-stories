import { getSupabase, UserStory } from './supabase';
import { generateArabicStory, prepareStoryContent } from './aiService';

interface StoryCreationParams {
  difficulty: 'simple' | 'easy' | 'normal';
  dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  words: string[];
}

/**
 * Generate a story using AI based on the provided parameters
 */
export async function generateStory(params: StoryCreationParams): Promise<UserStory> {
  try {
    // Generate a unique ID
    const id = `story-${Date.now()}`;
    
    // Use the AI service to generate the story and translations
    const aiResponse = await generateArabicStory(params);
    
    // Process the AI response
    const arabicParagraphs = prepareStoryContent(aiResponse.story);
    
    // Use the sentence-by-sentence translations from the AI
    const englishParagraphs = aiResponse.translation || [];
    
    // Create the story object
    const storyData: UserStory = {
      id,
      title: {
        english: aiResponse.title.english,
        arabic: aiResponse.title.arabic
      },
      content: {
        english: englishParagraphs,
        arabic: arabicParagraphs
      },
      difficulty: params.difficulty,
      dialect: params.dialect,
      created_at: new Date().toISOString(),
      // Use the glossary provided by the AI
      word_mappings: aiResponse.gloss
    };
    
    return storyData;
  } catch (error) {
    console.error('Error generating story:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate story. Please try again.');
  }
}

/**
 * Save a user-generated story to Supabase
 */
export async function saveUserStory(story: UserStory): Promise<void> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { error } = await supabase
      .from('user_stories')
      .insert([story as unknown as Record<string, unknown>]);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error saving story to Supabase:', error);
    throw new Error('Failed to save story. Please try again.');
  }
}

/**
 * Fetch all user-generated stories from Supabase
 */
export async function getUserStories(): Promise<UserStory[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return []; // Return empty array if client not initialized (e.g., during SSR)
    }
    
    const { data, error } = await supabase
      .from('user_stories')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return (data as unknown as UserStory[]) || [];
  } catch (error) {
    console.error('Error fetching user stories:', error);
    throw new Error('Failed to load user stories. Please try again.');
  }
}

/**
 * Get a specific user story by ID
 */
export async function getUserStoryById(id: string): Promise<UserStory | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return null; // Return null if client not initialized (e.g., during SSR)
    }
    
    const { data, error } = await supabase
      .from('user_stories')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return (data as unknown as UserStory) || null;
  } catch (error) {
    console.error(`Error fetching user story with ID ${id}:`, error);
    throw new Error('Failed to load story. Please try again.');
  }
}

// Helper functions for Arabic translations
function getDifficultyInArabic(difficulty: 'simple' | 'easy' | 'normal'): string {
  const translations = {
    simple: 'بسيط',
    easy: 'سهل',
    normal: 'عادي'
  };
  return translations[difficulty];
}

function getDialectInArabic(dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian'): string {
  const translations = {
    hijazi: 'حجازية',
    saudi: 'سعودية',
    jordanian: 'أردنية',
    egyptian: 'مصرية'
  };
  return translations[dialect];
} 