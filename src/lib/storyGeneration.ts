import { UserStory } from './supabase';
import { generateArabicStory, prepareStoryContent } from './aiService';
import { validateStoryData } from './storyUtils';

export interface StoryCreationParams {
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