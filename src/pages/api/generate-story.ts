import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Create a server-side OpenAI client with the private API key
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

// Define the structure of the API response
type ApiResponse = {
  success: boolean;
  data?: {
    title: {
      arabic: string;
      english: string;
    };
    story: string;
    translation: string[];
    gloss: Record<string, string>;
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse the request body
    const { difficulty, dialect, words, topic, longStory } = req.body as StoryParams;

    // Validate required parameters
    if (!difficulty || !dialect) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters. Please provide difficulty and dialect.',
      });
    }

    // Ensure words is an array even if not provided
    const wordsToUse = Array.isArray(words) ? words : [];

    // Limit the number of words to prevent abuse
    if (wordsToUse.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Too many words. Please limit to 20 words or fewer.',
      });
    }

    // Create the prompt for OpenAI
    const prompt = [
      {
        role: "system",
        content: `
You are an expert in Arabic dialects and second-language learning.
Generate a ${longStory ? 'long' : 'short'} story in Arabic using the specified dialect and difficulty level. 
${wordsToUse.length > 0 ? 'The story must include the given words.' : 'Generate an interesting story with common vocabulary.'}
${topic ? `The story should be about the following topic: "${topic}".` : ''}
${longStory ? 'The story should be approximately one and a half times the length of a regular short story and should include more detail.' : ''}
Create a meaningful title that reflects the content of the story (not just mentioning the dialect or difficulty).
Provide a sentence-by-sentence English translation that has aligned line breaks with the Arabic story.
After that, provide a mapping (gloss) of Arabic words from the story to their English meanings.

Gloss format:
- Use individual Arabic words wherever possible.
- Ensure gloss keys match the story exactly.

For difficulty levels:
- simple: Use very basic vocabulary and short, simple sentences
- easy: Use common vocabulary and straightforward grammar
- normal: Use moderate vocabulary and natural sentence structures
- advanced: Use rich vocabulary, complex sentence structures, and nuanced expressions

For dialects:
- hijazi: Use Hijazi dialect from western Saudi Arabia
- saudi: Use general Saudi dialect
- jordanian: Use Jordanian dialect
- egyptian: Use Egyptian dialect

You MUST respond with valid JSON only, with no additional text or explanation in the following format:

{
  "title": {
    "arabic": "<Arabic title>",
    "english": "<English translation of title>"
  },
  "story": "<Arabic story in dialect>",
  "translation": [
    "<English translation of first sentence>",
    "<English translation of second sentence>",
    ...
  ],
  "gloss": {
    "<arabic word>": "<english meaning 1>",
    "<arabic word>": "<english meaning 2>",
    ...
  }
}
`
      },
      {
        role: "user",
        content: `
Generate a story using:
- Difficulty: ${difficulty}
- Dialect: ${dialect}
${wordsToUse.length > 0 ? `- Required words: ${wordsToUse.join('، ')}` : ''}
${topic ? `- Topic: ${topic}` : ''}
${longStory ? '- Long story: Yes' : ''}

Return only valid JSON.
`
      }
    ];

    // Call OpenAI API - removed the response_format parameter
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: prompt as any,
      temperature: 0.7,
      max_tokens: longStory ? 4000 : 3000,
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      return res.status(500).json({
        success: false,
        error: 'No response from OpenAI',
      });
    }

    try {
      // Try to extract JSON from the response text
      let jsonText = responseText;
      
      // Check if the response contains JSON wrapped in backticks or code blocks
      const jsonMatch = responseText.match(/```(?:json)?([\s\S]*?)```|`([\s\S]*?)`/);
      if (jsonMatch) {
        // Use the content from the first matching group that contains data
        jsonText = jsonMatch[1] || jsonMatch[2];
      }
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(jsonText.trim());
      
      if (!parsedResponse.story || !parsedResponse.gloss || !parsedResponse.title || !parsedResponse.translation) {
        return res.status(500).json({
          success: false,
          error: 'Invalid response format from OpenAI',
        });
      }
      
      // Return the successful response
      return res.status(200).json({
        success: true,
        data: {
          title: parsedResponse.title,
          story: parsedResponse.story,
          translation: parsedResponse.translation,
          gloss: parsedResponse.gloss,
        }
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse the AI response. The model did not return valid JSON.',
      });
    }
  } catch (error: any) {
    console.error('Error generating story:', error);
    
    // Handle different error types
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests to the AI service. Please try again later.',
      });
    } else if (error.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'API key is invalid or missing. Please check your configuration.',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: `Failed to generate story: ${error.message || 'Unknown error'}`,
    });
  }
} 