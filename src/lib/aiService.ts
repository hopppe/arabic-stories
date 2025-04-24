interface StoryGenerationParams {
  difficulty: 'simple' | 'easy' | 'normal';
  dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  words: string[];
}

interface AIResponse {
  title: {
    arabic: string;
    english: string;
  };
  story: string;
  translation: string[];
  gloss: Record<string, string>;
}

/**
 * Generate an Arabic story using our API endpoint that calls OpenAI GPT-4
 */
export async function generateArabicStory(params: StoryGenerationParams): Promise<AIResponse> {
  try {
    // Call our own API endpoint instead of OpenAI directly
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      // Parse error response
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    // Parse successful response
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response from server');
    }

    return {
      title: data.data.title,
      story: data.data.story,
      translation: data.data.translation,
      gloss: data.data.gloss
    };
  } catch (error: any) {
    console.error('Error generating story:', error);
    throw error;
  }
}

/**
 * Prepare the story content by splitting it into paragraphs
 */
export function prepareStoryContent(story: string): string[] {
  // Split the story by newlines or periods followed by space to form paragraphs
  return story
    .split(/\n+|(?<=\.)\s+/)
    .map(para => para.trim())
    .filter(para => para.length > 0);
} 