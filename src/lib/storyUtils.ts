import { UserStory } from './supabase';

/**
 * Get Arabic translation for difficulty level
 */
export function getDifficultyInArabic(difficulty: 'simple' | 'easy' | 'normal' | 'advanced'): string {
  const translations = {
    simple: 'بسيط',
    easy: 'سهل',
    normal: 'عادي',
    advanced: 'متقدم'
  };
  return translations[difficulty];
}

/**
 * Get Arabic translation for dialect
 */
export function getDialectInArabic(dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian'): string {
  const translations = {
    hijazi: 'حجازية',
    saudi: 'سعودية',
    jordanian: 'أردنية',
    egyptian: 'مصرية'
  };
  return translations[dialect];
}

/**
 * Validate story data to ensure it can be saved properly
 */
export function validateStoryData(story: any): void {  // Use 'any' to allow longStory which won't be in UserStory
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
 * Normalize story data structure to handle potential database inconsistencies
 * This ensures backward compatibility if the database structure changes
 */
export function normalizeStoryData(storyData: any): UserStory {
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