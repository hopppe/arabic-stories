import { UserStory } from './supabase';

// Import from our specialized modules
import { generateStory } from './storyGeneration';
import { saveUserStory, deleteUserStory } from './storyOperations';
import { getUserStories, getUserCreatedStories, getUserStoryById } from './storyRetrieval';
import { normalizeStoryData, validateStoryData } from './storyUtils';

// Export all story-related functionality through this single entry point
export {
  // Story generation
  generateStory,
  
  // Story operations (save, delete)
  saveUserStory,
  deleteUserStory,
  
  // Story retrieval
  getUserStories,
  getUserCreatedStories,
  getUserStoryById,
  
  // Story utilities
  normalizeStoryData,
  validateStoryData,
};

// Types
export type { UserStory }; 