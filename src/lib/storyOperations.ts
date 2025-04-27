import { getSupabase, UserStory, refreshSupabaseClient, ensureValidSession } from './supabase';

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