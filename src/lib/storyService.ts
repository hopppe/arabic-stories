/**
 * @deprecated This file is deprecated and will be removed in a future update.
 * All functionality has been moved to specialized modules:
 * - Story generation: storyGeneration.ts
 * - Story operations (save/delete): storyOperations.ts
 * - Story retrieval: storyRetrieval.ts
 * - Story utilities: storyUtils.ts
 * 
 * Import from storyManager.ts instead, which provides a unified API for all story-related functionality.
 */

import { getSupabase, UserStory, refreshSupabaseClient, ensureValidSession } from './supabase';
import { generateArabicStory, prepareStoryContent } from './aiService';

interface StoryCreationParams {
  difficulty: 'simple' | 'easy' | 'normal' | 'advanced';
  dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  words: string[] | [];
  topic?: string;
  longStory?: boolean;
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
      wordCount: params.words ? params.words.length : 0,
      userId: params.userId ? '[PRESENT]' : '[NOT PROVIDED]',
      longStory: params.longStory || false,
      topic: params.topic ? 'Present' : 'Not provided'
    });
    
    // Ensure words is always an array
    const words = params.words || [];
    
    // Use the AI service to generate the story and translations
    const aiResponse = await generateArabicStory({
      difficulty: params.difficulty,
      dialect: params.dialect,
      words: words,
      topic: params.topic,
      longStory: params.longStory
    });
    
    console.log('generateStory - AI response received, processing data...');
    
    // Process the AI response
    const arabicParagraphs = prepareStoryContent(aiResponse.story);
    
    // Use the sentence-by-sentence translations from the AI
    const englishParagraphs = aiResponse.translation || [];
    
    // Create the story object - using known database compatible fields
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
      user_id: params.userId,
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
function validateStoryData(story: any): void {  // Use 'any' to allow longStory which won't be in UserStory
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
  
  // Check if difficulty is valid, including 'advanced'
  if (!['simple', 'easy', 'normal', 'advanced'].includes(story.difficulty)) {
    throw new Error('Invalid difficulty level');
  }
  
  // Ensure word_mappings is an object if provided
  if (story.word_mappings && typeof story.word_mappings !== 'object') {
    story.word_mappings = {}; // Reset to empty object if invalid
  }
  
  // Remove any longStory property as it's not stored in the database
  delete story.longStory;
  
  console.log('Story data validated successfully');
}

/**
 * Save a user story to Supabase
 */
export async function saveUserStory(story: UserStory): Promise<{ success: boolean; message?: string; id?: string }> {
  console.log('1. saveUserStory called with story:', { 
    id: story.id, 
    title: story.title, 
    user_id: story.user_id,
    dialect: story.dialect,
    difficulty: story.difficulty
  });
  
  try {
    // Step 1: Ensure we have a valid session before proceeding
    const isSessionValid = await ensureValidSession();
    
    if (!isSessionValid) {
      console.error('2. Session validation failed before story save');
      return { 
        success: false, 
        message: 'Authentication error. Please sign in again to save your story.' 
      };
    }
    
    console.log('2. Session validated successfully');
    
    // Make a copy to avoid modifying the original
    const storyToSave = { ...story };
    
    // Step 2: Get Supabase client
    const supabase = getSupabase();
    
    if (!supabase) {
      console.error('3. Supabase client not initialized');
      return { 
        success: false, 
        message: 'Connection error. Please try again.' 
      };
    }
    
    console.log('3. Supabase client obtained successfully');
    
    // Make sure we have the authenticated user's ID
    const { data: { session } } = await supabase.auth.getSession();
    const authenticatedUserId = session?.user?.id;
    
    // Check if the story has a user_id, if not, use the authenticated user's ID
    let usingProvidedUserId = false;
    if (!storyToSave.user_id && authenticatedUserId) {
      console.log('4. No user_id in story, using authenticated user ID:', authenticatedUserId);
      storyToSave.user_id = authenticatedUserId;
    } else if (storyToSave.user_id) {
      // If the story has a user_id, make sure it matches the authenticated user
      if (authenticatedUserId && storyToSave.user_id !== authenticatedUserId) {
        console.warn('5. Story user_id does not match authenticated user:', {
          storyUserId: storyToSave.user_id,
          authUserId: authenticatedUserId
        });
        // Override with the authenticated user's ID for security
        storyToSave.user_id = authenticatedUserId;
      } else {
        usingProvidedUserId = true;
      }
    } else {
      console.error('6. No user_id available - authentication required');
      return { 
        success: false, 
        message: 'Authentication required to save stories.' 
      };
    }
    
    // Log if we're using the provided user_id (helpful for debugging mobile issues)
    if (usingProvidedUserId) {
      console.log('6. Using user_id provided by story object:', authenticatedUserId);
    }
    
    // Step 3: Insert data - simple approach with one retry
    console.log('7. Preparing to save story with data:', { 
      id: storyToSave.id,
      user_id: storyToSave.user_id,
      dialect: storyToSave.dialect,
      difficulty: storyToSave.difficulty
    });
    
    // Convert nested objects to strings
    const storyWithStringifiedFields = {
      id: storyToSave.id,
      title: JSON.stringify(storyToSave.title),
      content: JSON.stringify(storyToSave.content),
      word_mappings: JSON.stringify(storyToSave.word_mappings || {}),
      difficulty: storyToSave.difficulty,
      dialect: storyToSave.dialect,
      created_at: storyToSave.created_at,
      user_id: storyToSave.user_id
    };
    
    console.log('8. Fields stringified and ready for insert');
    
    // Insert with only one retry for simplicity
    let insertAttempts = 0;
    const maxInsertAttempts = 2;
    
    while (insertAttempts < maxInsertAttempts) {
      try {
        insertAttempts++;
        console.log(`9. Insert attempt ${insertAttempts}/${maxInsertAttempts}`);
        
        // If this is a retry, refresh the client first
        if (insertAttempts > 1) {
          console.log('Refreshing Supabase client for retry');
          refreshSupabaseClient();
          const isValid = await ensureValidSession();
          if (!isValid) {
            console.error('Session validation failed on retry');
            continue;  // Try again if possible
          }
        }
        
        const { data, error } = await supabase
          .from('user_stories')
          .upsert(storyWithStringifiedFields)
          .select('id')
          .single();
          
        if (error) {
          console.error(`Insert attempt ${insertAttempts} failed:`, error);
          
          // If we have more attempts, wait briefly and try again
          if (insertAttempts < maxInsertAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          // If it's a permission error, it's likely an auth issue
          if (error.code === '42501' || error.message.includes('permission') || error.message.includes('auth')) {
            return { 
              success: false, 
              message: 'Authentication error. Please sign in again to save your story.' 
            };
          }
          
          return { 
            success: false, 
            message: `Database error: ${error.message}` 
          };
        }
        
        // Get the ID from the response or use the original ID
        const savedId: string = (data && typeof data.id === 'string') ? data.id : storyToSave.id;
        
        console.log('10. Story saved successfully:', savedId);
        return { 
          success: true, 
          id: savedId
        };
      } catch (err) {
        console.error(`Unexpected error on insert attempt ${insertAttempts}:`, err);
        
        if (insertAttempts < maxInsertAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        return { 
          success: false, 
          message: 'An unexpected error occurred while saving your story.' 
        };
      }
    }
    
    // Should never reach here but just in case
    return { 
      success: false, 
      message: 'Failed to save story after multiple attempts.' 
    };
  } catch (error) {
    console.error('Unexpected error in saveUserStory:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while processing your request.' 
    };
  }
}

/**
 * Fetch predefined user stories from Supabase
 */
export async function getUserStories(maxRetries = 3): Promise<UserStory[]> {
  let retryCount = 0;
  let lastError: any = null;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}: getUserStories called`);
      
      // Force a fresh client on each retry after the first attempt
      if (retryCount > 0) {
        console.log(`Retry ${retryCount}/${maxRetries}: Refreshing Supabase client`);
        refreshSupabaseClient();
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Increasing backoff
      }
      
      // Ensure we have a valid session - this is important even for "public" data
      // as we may have permissions issues otherwise
      await ensureValidSession();
      
      const supabase = getSupabase();
      if (!supabase) {
        console.error(`Attempt ${retryCount + 1}: Supabase client not initialized in getUserStories`);
        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('difficulty');
        
      if (error) {
        lastError = error;
        console.error(`Attempt ${retryCount + 1}: Supabase query error in getUserStories:`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        throw error;
      }
      
      // Normalize each story's data structure
      const normalizedStories = (data || []).map(storyData => normalizeStoryData(storyData));
      
      console.log(`getUserStories returned ${normalizedStories.length} stories successfully`);
      return normalizedStories;
    } catch (error) {
      lastError = error;
      if (retryCount < maxRetries) {
        console.warn(`Retry ${retryCount + 1}/${maxRetries}: Failed to load stories:`, error);
        retryCount++;
        continue;
      }
      console.error('Final error fetching user stories:', error);
      throw new Error('Failed to load user stories. Please try again.');
    }
  }
  
  // This should never be reached due to the return/throw in the loop
  console.error('Unexpected exit from retry loop with error:', lastError);
  return [];
}

/**
 * Fetch stories created by a specific user from Supabase
 */
export async function getUserCreatedStories(userId: string, maxRetries = 3): Promise<UserStory[]> {
  let retryCount = 0;
  let lastError: any = null;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}: getUserCreatedStories called with userId:`, userId);
      
      // Force a fresh client on each retry after the first attempt
      if (retryCount > 0) {
        console.log(`Retry ${retryCount}/${maxRetries}: Refreshing Supabase client`);
        refreshSupabaseClient();
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Increasing backoff
      }
      
      // Validate session before proceeding
      const isSessionValid = await ensureValidSession();
      
      if (!isSessionValid) {
        console.warn(`Attempt ${retryCount + 1}: Session validation failed`);
        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        throw new Error('Authentication error. Please sign in again.');
      }
      
      const supabase = getSupabase();
      
      if (!supabase) {
        console.error(`Attempt ${retryCount + 1}: Supabase client not initialized in getUserCreatedStories`);
        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        return []; // Return empty array after max retries
      }
      
      console.log('Executing query for user stories with user_id:', userId);
      
      // Get current auth session to log for debugging
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.warn(`Attempt ${retryCount + 1}: No valid session found or session error`);
        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        // If we've exhausted retries but still have no session, return empty
        return [];
      }
      
      console.log('Current auth session user ID:', sessionData.session?.user?.id);
      console.log('Do IDs match?', userId === sessionData.session?.user?.id);
      
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error(`Attempt ${retryCount + 1}: Supabase query error in getUserCreatedStories:`, error);
        lastError = error;
        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        throw error;
      }
      
      // Normalize each story's data structure
      const normalizedStories = (data || []).map(storyData => normalizeStoryData(storyData));
      
      console.log('Query results:', {
        count: normalizedStories.length,
        first_item: normalizedStories.length > 0 ? { 
          id: normalizedStories[0].id,
          created_at: normalizedStories[0].created_at
        } : null
      });
      
      return normalizedStories;
    } catch (error) {
      lastError = error;
      if (retryCount < maxRetries) {
        console.error(`Retry ${retryCount + 1}/${maxRetries}: Error fetching stories for user ${userId}:`, error);
        retryCount++;
        continue;
      }
      console.error(`Final error fetching stories for user ${userId}:`, error);
      throw new Error('Failed to load your stories. Please try again.');
    }
  }
  
  // This should never be reached due to the return/throw in the loop
  console.error('Unexpected exit from retry loop with error:', lastError);
  return [];
}

/**
 * Get a specific user story by ID
 */
export async function getUserStoryById(id: string, maxRetries = 3): Promise<UserStory | null> {
  let retryCount = 0;
  let lastError: any = null;
  
  while (retryCount <= maxRetries) {
    try {
      // Use a fresh client on retries
      if (retryCount > 0) {
        console.log(`Retry ${retryCount}/${maxRetries}: Refreshing Supabase client`);
        refreshSupabaseClient();
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Increasing backoff
      }
      
      const supabase = getSupabase();
      if (!supabase) {
        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount + 1}/${maxRetries}: Supabase client not initialized. Retrying...`);
          retryCount++;
          continue;
        }
        return null; // Return null after max retries
      }
      
      // Check session validity
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn(`Attempt ${retryCount + 1}: Session error when fetching story ${id}`);
        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
      }
      
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        lastError = error;
        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount + 1}/${maxRetries}: Error fetching story. Retrying...`);
          retryCount++;
          continue;
        }
        throw error;
      }
      
      // Return null if no data
      if (!data) return null;
      
      // Normalize the story's data structure
      return normalizeStoryData(data);
    } catch (error) {
      lastError = error;
      if (retryCount < maxRetries) {
        console.error(`Retry ${retryCount + 1}/${maxRetries}: Error fetching user story with ID ${id}:`, error);
        retryCount++;
        continue;
      }
      console.error(`Final error fetching user story with ID ${id}:`, error);
      throw new Error('Failed to load story. Please try again.');
    }
  }
  
  // This should never be reached due to the return/throw in the loop
  console.error('Unexpected exit from retry loop with error:', lastError);
  return null;
}

/**
 * Delete a user story from Supabase
 */
export async function deleteUserStory(storyId: string): Promise<boolean> {
  try {
    console.log('==== STORY DELETION DEBUG ====');
    console.log('1. deleteUserStory called with story ID:', storyId);
    
    // Step 1: Get a fresh Supabase client
    console.log('2. Getting a fresh Supabase client');
    refreshSupabaseClient(); // Clear any stale clients
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const supabase = getSupabase();
    if (!supabase) {
      console.error('3. ERROR: Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    console.log('3. Supabase client obtained successfully');
    
    // Step 2: Verify authentication with retries
    console.log('4. Checking authentication session');
    let sessionAttempts = 0;
    const maxSessionAttempts = 3;
    
    while (sessionAttempts < maxSessionAttempts) {
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error(`5. Attempt ${sessionAttempts + 1}/${maxSessionAttempts}: Session error:`, sessionError);
          sessionAttempts++;
          
          if (sessionAttempts < maxSessionAttempts) {
            console.log('Refreshing client and retrying...');
            refreshSupabaseClient();
            await new Promise(resolve => setTimeout(resolve, 500 * sessionAttempts));
            continue;
          }
          throw new Error(`Authentication error: ${sessionError.message}`);
        }
        
        if (!session.session || !session.session.user) {
          console.error(`5. Attempt ${sessionAttempts + 1}/${maxSessionAttempts}: No valid session found`);
          sessionAttempts++;
          
          if (sessionAttempts < maxSessionAttempts) {
            console.log('Refreshing client and retrying...');
            refreshSupabaseClient();
            await new Promise(resolve => setTimeout(resolve, 500 * sessionAttempts));
            continue;
          }
          throw new Error('No active user session. Please sign in again.');
        }
        
        // Success - we have a valid session
        console.log(`5. Authentication successful on attempt ${sessionAttempts + 1}. User ID:`, session.session.user.id);
        
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
        if (sessionAttempts < maxSessionAttempts - 1) {
          console.error(`Authentication error on attempt ${sessionAttempts + 1}:`, error);
          sessionAttempts++;
          await new Promise(resolve => setTimeout(resolve, 500 * sessionAttempts));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Failed to authenticate after multiple attempts');
    
  } catch (error) {
    console.error('==== STORY DELETION ERROR ====');
    console.error('Error deleting story from Supabase:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('session') || error.message.includes('auth') || 
          error.message.includes('permission') || error.message.includes('sign in')) {
        throw new Error('Authentication error. Please refresh the page and sign in again.');
      }
      throw new Error(error.message);
    } else {
      throw new Error('Failed to delete story. Please try again.');
    }
  }
}

// Helper functions for Arabic translations
function getDifficultyInArabic(difficulty: 'simple' | 'easy' | 'normal' | 'advanced'): string {
  const translations = {
    simple: 'بسيط',
    easy: 'سهل',
    normal: 'عادي',
    advanced: 'متقدم'
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
    // longStory is not stored in the database so we don't need to normalize it
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