import { getSupabase, UserStory } from './supabase';
import { generateArabicStory, prepareStoryContent } from './aiService';

interface StoryCreationParams {
  difficulty: 'simple' | 'easy' | 'normal';
  dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  words: string[];
  userId?: string;
}

/**
 * Generate a story using AI based on the provided parameters
 */
export async function generateStory(params: StoryCreationParams): Promise<UserStory> {
  try {
    // Generate a unique ID
    const id = `story-${Date.now()}`;
    
    console.log('generateStory - Starting with params:', {
      difficulty: params.difficulty,
      dialect: params.dialect,
      wordCount: params.words.length,
      userId: params.userId ? '[PRESENT]' : '[NOT PROVIDED]'
    });
    
    // Use the AI service to generate the story and translations
    const aiResponse = await generateArabicStory(params);
    
    console.log('generateStory - AI response received, processing data...');
    
    // Process the AI response
    const arabicParagraphs = prepareStoryContent(aiResponse.story);
    
    // Use the sentence-by-sentence translations from the AI
    const englishParagraphs = aiResponse.translation || [];
    
    // Create the story object
    const storyData: UserStory = {
      id,
      title: {
        english: aiResponse.title.english || 'Untitled Story',
        arabic: aiResponse.title.arabic || 'قصة بدون عنوان'
      },
      content: {
        english: englishParagraphs,
        arabic: arabicParagraphs
      },
      difficulty: params.difficulty,
      dialect: params.dialect,
      created_at: new Date().toISOString(),
      // Add user_id if provided
      user_id: params.userId,
      // Use the glossary provided by the AI
      word_mappings: aiResponse.gloss || {}
    };
    
    console.log('generateStory - Story data created with ID:', id);
    
    // Validate the generated data to ensure it's ready for database storage
    validateStoryData(storyData);
    
    return storyData;
  } catch (error) {
    console.error('Error generating story:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate story. Please try again.');
  }
}

/**
 * Validate story data to ensure it can be saved properly
 */
function validateStoryData(story: UserStory): void {
  // Check required fields
  if (!story.id) {
    throw new Error('Story ID is missing');
  }
  
  // Check title structure
  if (!story.title || typeof story.title !== 'object') {
    throw new Error('Invalid title format');
  }
  
  if (!story.title.english || !story.title.arabic) {
    console.warn('Missing title languages, using defaults');
    story.title = {
      english: story.title.english || 'Untitled Story',
      arabic: story.title.arabic || 'قصة بدون عنوان'
    };
  }
  
  // Check content structure
  if (!story.content || typeof story.content !== 'object') {
    throw new Error('Invalid content format');
  }
  
  if (!Array.isArray(story.content.english) || !Array.isArray(story.content.arabic)) {
    throw new Error('Story content must be arrays of paragraphs');
  }
  
  // Ensure arrays have content
  if (story.content.english.length === 0 || story.content.arabic.length === 0) {
    throw new Error('Story content cannot be empty');
  }
  
  // Ensure dialect and difficulty are valid
  if (!['hijazi', 'saudi', 'jordanian', 'egyptian'].includes(story.dialect)) {
    throw new Error('Invalid dialect');
  }
  
  if (!['simple', 'easy', 'normal'].includes(story.difficulty)) {
    throw new Error('Invalid difficulty level');
  }
  
  // Ensure word_mappings is an object if provided
  if (story.word_mappings && typeof story.word_mappings !== 'object') {
    story.word_mappings = {}; // Reset to empty object if invalid
  }
  
  console.log('Story data validated successfully');
}

/**
 * Save a user-generated story to Supabase
 */
export async function saveUserStory(story: UserStory): Promise<void> {
  console.log('==== STORY SAVING DEBUG ====');
  console.log('1. saveUserStory called with story ID:', story.id);
  
  try {
    // Step 1: Initialize Supabase
    console.log('2. Getting Supabase client');
    const supabase = getSupabase();
    if (!supabase) {
      console.error('3. ERROR: Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    console.log('3. Supabase client obtained successfully');
    
    // Step 2: Verify authentication
    console.log('4. Checking authentication session');
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('5. ERROR: Failed to get session:', sessionError);
        throw new Error(`Authentication session error: ${sessionError.message}`);
      }
      
      if (!session.session) {
        console.error('5. ERROR: No active session found');
        throw new Error('User not authenticated, please sign in again');
      }
      
      console.log('5. User authenticated successfully');
      
      // Step 3: Set user ID
      const authenticatedUserId = session.session.user.id;
      console.log('6. Authenticated user ID:', authenticatedUserId);
      
      // If story user_id doesn't match authenticated user, this is a problem
      if (story.user_id && story.user_id !== authenticatedUserId) {
        console.warn('7. WARNING: Story user_id does not match authenticated user, updating to correct user');
        console.log({
          storyUserId: story.user_id,
          authUserId: authenticatedUserId
        });
      } else {
        console.log('7. User IDs match or story user_id not set, will use auth user ID');
      }
      
      // Always use the authenticated user's ID to ensure proper permissions
      const storyToSave = {
        ...story,
        user_id: authenticatedUserId
      };
      
      // Step 4: Log story data
      console.log('8. Preparing to save story with data:', { 
        id: storyToSave.id,
        user_id: storyToSave.user_id,
        dialect: storyToSave.dialect,
        difficulty: storyToSave.difficulty
      });
      
      // Step 9: Insert data - GOING BACK TO THE ORIGINAL APPROACH THAT WORKED
      console.log('9. Executing insert query with original approach (stringify)');
      try {
        // Convert nested objects to strings - THIS APPROACH WORKED BEFORE
        const storyWithStringifiedFields = {
          ...storyToSave,
          title: JSON.stringify(storyToSave.title),
          content: JSON.stringify(storyToSave.content),
          word_mappings: JSON.stringify(storyToSave.word_mappings || {})
        };
        
        console.log('9.1 Fields stringified and ready for insert');
        
        const { data, error } = await supabase
          .from('user_stories')
          .insert([storyWithStringifiedFields as unknown as Record<string, unknown>])
          .select('id, user_id')
          .single();
          
        if (error) {
          console.error('10. ERROR: Insert query failed:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('10. Story saved successfully:', data);
      } catch (insertError) {
        console.error('9.5 Insert operation error:', insertError);
        throw insertError;
      }
      
    } catch (innerError) {
      console.error('Inner try-catch error:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('==== STORY SAVING ERROR ====');
    console.error('Error saving story to Supabase:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to save story: ${error.message}. Please try again.`);
    } else {
      throw new Error('Failed to save story. Please try again.');
    }
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
    
    // Normalize each story's data structure
    return (data || []).map(storyData => normalizeStoryData(storyData));
  } catch (error) {
    console.error('Error fetching user stories:', error);
    throw new Error('Failed to load user stories. Please try again.');
  }
}

/**
 * Fetch stories created by a specific user from Supabase
 */
export async function getUserCreatedStories(userId: string): Promise<UserStory[]> {
  try {
    console.log('getUserCreatedStories called with userId:', userId);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Supabase client not initialized in getUserCreatedStories');
      return []; // Return empty array if client not initialized (e.g., during SSR)
    }
    
    console.log('Executing query for user stories with user_id:', userId);
    
    // Get current auth session to log for debugging
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Current auth session user ID:', sessionData.session?.user?.id);
    console.log('Do IDs match?', userId === sessionData.session?.user?.id);
    
    const { data, error } = await supabase
      .from('user_stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase query error in getUserCreatedStories:', error);
      throw error;
    }
    
    // Normalize each story's data structure
    const normalizedStories = (data || []).map(storyData => normalizeStoryData(storyData));
    
    console.log('Query results:', {
      count: normalizedStories.length,
      first_item: normalizedStories.length > 0 ? { 
        id: normalizedStories[0].id,
        user_id: normalizedStories[0].user_id,
        created_at: normalizedStories[0].created_at
      } : null
    });
    
    return normalizedStories;
  } catch (error) {
    console.error(`Error fetching stories for user ${userId}:`, error);
    throw new Error('Failed to load your stories. Please try again.');
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
    
    // Return null if no data
    if (!data) return null;
    
    // Normalize the story's data structure
    return normalizeStoryData(data);
  } catch (error) {
    console.error(`Error fetching user story with ID ${id}:`, error);
    throw new Error('Failed to load story. Please try again.');
  }
}

/**
 * Delete a user story from Supabase
 */
export async function deleteUserStory(storyId: string): Promise<boolean> {
  try {
    console.log('==== STORY DELETION DEBUG ====');
    console.log('1. deleteUserStory called with story ID:', storyId);
    
    // Step 1: Initialize Supabase
    console.log('2. Getting Supabase client');
    const supabase = getSupabase();
    
    if (!supabase) {
      console.error('3. ERROR: Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    console.log('3. Supabase client obtained successfully');
    
    // Step 2: Verify authentication
    console.log('4. Checking authentication session');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('5. ERROR: Failed to get session:', sessionError);
      throw new Error(`Authentication session error: ${sessionError.message}`);
    }
    
    if (!session.session) {
      console.error('5. ERROR: No active session found');
      throw new Error('User not authenticated, please sign in again');
    }
    
    console.log('5. User authenticated successfully, user ID:', session.session.user.id);
    
    // Step 3: Delete the story - let Supabase RLS handle permission checks
    console.log('6. Attempting to delete story directly using RLS');
    const { error: deleteError } = await supabase
      .from('user_stories')
      .delete()
      .eq('id', storyId);
      
    if (deleteError) {
      console.error('7. ERROR: Failed to delete story:', deleteError);
      throw new Error(`Failed to delete story: ${deleteError.message}`);
    }
    
    console.log('7. Story deleted successfully');
    return true;
    
  } catch (error) {
    console.error('==== STORY DELETION ERROR ====');
    console.error('Error deleting story from Supabase:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete story. Please try again.');
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

/**
 * Normalize story data structure to handle potential database inconsistencies
 * This ensures backward compatibility if the database structure changes
 */
function normalizeStoryData(storyData: any): UserStory {
  // Create a normalized story object with defaults
  const normalized: UserStory = {
    id: storyData.id || `story-${Date.now()}`,
    title: {
      english: '',
      arabic: ''
    },
    content: {
      english: [],
      arabic: []
    },
    difficulty: (storyData.difficulty as any) || 'normal',
    dialect: (storyData.dialect as any) || 'hijazi',
    created_at: storyData.created_at || new Date().toISOString(),
    user_id: storyData.user_id,
    word_mappings: {}
  };

  // Handle title object or string
  if (storyData.title) {
    try {
      // If it's already an object with the right structure
      if (typeof storyData.title === 'object' && !Array.isArray(storyData.title)) {
        normalized.title.english = storyData.title.english || '';
        normalized.title.arabic = storyData.title.arabic || '';
      } 
      // If it's a JSON string
      else if (typeof storyData.title === 'string') {
        try {
          const parsed = JSON.parse(storyData.title);
          normalized.title.english = parsed.english || '';
          normalized.title.arabic = parsed.arabic || '';
        } catch (e) {
          // If JSON parsing fails, use the string as english title
          normalized.title.english = storyData.title;
        }
      }
    } catch (err) {
      console.error('Error normalizing title:', err);
    }
  }

  // Handle content object or string
  if (storyData.content) {
    try {
      // If it's already an object with the right structure
      if (typeof storyData.content === 'object' && !Array.isArray(storyData.content)) {
        normalized.content.english = Array.isArray(storyData.content.english) ? 
          storyData.content.english : [];
        normalized.content.arabic = Array.isArray(storyData.content.arabic) ? 
          storyData.content.arabic : [];
          
        // If the arrays are swapped (english has arabic content and vice versa)
        // Check by looking for Arabic characters in english content and vice versa
        const hasArabicChars = (text: string): boolean => /[\u0600-\u06FF]/.test(text);
        const hasLatinChars = (text: string): boolean => /[a-zA-Z]/.test(text);
        
        if (normalized.content.english.length > 0 && normalized.content.arabic.length > 0) {
          const sampleEnglish = normalized.content.english[0];
          const sampleArabic = normalized.content.arabic[0];
          
          // If arrays appear to be swapped, swap them back
          if (hasArabicChars(sampleEnglish) && hasLatinChars(sampleArabic)) {
            console.log('Content arrays appear to be swapped, fixing...');
            [normalized.content.english, normalized.content.arabic] = 
              [normalized.content.arabic, normalized.content.english];
          }
        }
      } 
      // If it's a JSON string
      else if (typeof storyData.content === 'string') {
        try {
          const parsed = JSON.parse(storyData.content);
          normalized.content.english = Array.isArray(parsed.english) ? parsed.english : [];
          normalized.content.arabic = Array.isArray(parsed.arabic) ? parsed.arabic : [];
        } catch (e) {
          // If JSON parsing fails, can't recover the content structure
          console.error('Failed to parse content JSON:', e);
        }
      }
    } catch (err) {
      console.error('Error normalizing content:', err);
    }
  }

  // Handle word_mappings
  if (storyData.word_mappings) {
    try {
      if (typeof storyData.word_mappings === 'object' && !Array.isArray(storyData.word_mappings)) {
        normalized.word_mappings = storyData.word_mappings;
      } else if (typeof storyData.word_mappings === 'string') {
        try {
          normalized.word_mappings = JSON.parse(storyData.word_mappings);
        } catch (e) {
          console.error('Failed to parse word_mappings JSON:', e);
        }
      }
    } catch (err) {
      console.error('Error normalizing word_mappings:', err);
    }
  }

  return normalized;
} 