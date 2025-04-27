import { getSupabase, UserStory, refreshSupabaseClient, ensureValidSession } from './supabase';
import { normalizeStoryData } from './storyUtils';

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
        .from('user_stories')
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
      
      // Validate session before proceeding
      await ensureValidSession();
      
      const supabase = getSupabase();
      if (!supabase) {
        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount + 1}/${maxRetries}: Supabase client not initialized. Retrying...`);
          retryCount++;
          continue;
        }
        return null; // Return null after max retries
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