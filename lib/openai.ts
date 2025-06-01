import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Please add your OpenAI API key to .env.local');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface StoryGenerationResult {
  content: string;
  suggestions: string[];
  wordCount: number;
}

export async function generateInitialStory(
  prompt: string
): Promise<StoryGenerationResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a creative story writer. Generate the beginning of a story based on the user's prompt. 
          The story should be 200-300 words long. After the story, provide 3-5 suggestions for how the user might want to continue the story.
          
          Format your response as JSON with this structure:
          {
            "content": "the story content here",
            "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
          }
          
          Make the suggestions specific and engaging, giving the user clear direction options for the story.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    console.log(completion.choices[0].message);

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response by removing markdown code blocks if present
    const cleanedResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanedResponse);
    const wordCount = parsed.content.split(' ').length;

    return {
      content: parsed.content,
      suggestions: parsed.suggestions,
      wordCount,
    };
  } catch (error) {
    console.error('Error generating initial story:', error);
    throw new Error('Failed to generate story');
  }
}

export async function continueStory(
  previousContent: string,
  userChoice: string,
  isCustomInput: boolean,
  maxWords: number = 300
): Promise<StoryGenerationResult> {
  try {
    const systemPrompt = `You are continuing a story. The user has chosen how to continue based on ${
      isCustomInput ? 'their custom input' : 'one of the provided suggestions'
    }.
    
    Continue the story with approximately ${maxWords} words (aim for ${Math.floor(
      maxWords * 0.8
    )} to ${Math.floor(
      maxWords * 1.2
    )} words). After the story continuation, provide 3-5 new suggestions for how the user might want to continue further.
    
    Format your response as JSON with this structure:
    {
      "content": "the story continuation here",
      "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
    }`;

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Previous story content:\n${previousContent}\n\nUser's choice for continuation: ${userChoice}\n\nPlease continue the story based on this choice.`,
        },
      ],
      temperature: 0.8,
      max_tokens: Math.max(500, Math.floor(maxWords * 2)), // Ensure enough tokens for the response
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response by removing markdown code blocks if present
    const cleanedResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanedResponse);
    const wordCount = parsed.content.split(' ').length;

    return {
      content: parsed.content,
      suggestions: parsed.suggestions,
      wordCount,
    };
  } catch (error) {
    console.error('Error continuing story:', error);
    throw new Error('Failed to continue story');
  }
}
