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

// New streaming interface
export interface StoryStreamResult {
  stream: ReadableStream<Uint8Array>;
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
  } catch (_error) {
    console.error('Error generating initial story:', _error);
    throw new Error('Failed to generate story');
  }
}

// Helper function to ensure valid JSON response
function ensureValidJsonResponse(content: string): {
  content: string;
  suggestions: string[];
} {
  try {
    // Try to parse as JSON first
    const cleaned = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate the structure
    if (parsed.content && Array.isArray(parsed.suggestions)) {
      return parsed;
    }

    // If structure is invalid, treat as plain text
    throw new Error('Invalid JSON structure');
  } catch {
    // If JSON parsing fails, treat the entire content as story text
    // and generate some basic suggestions
    return {
      content: content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim(),
      suggestions: [
        'Continue with the next dramatic moment',
        'Introduce a new character or element',
        "Explore the character's thoughts and feelings",
        'Add a plot twist or unexpected development',
        'Move to a different location or time',
      ],
    };
  }
}

// New streaming function for initial story generation
export async function generateInitialStoryStream(
  prompt: string
): Promise<StoryStreamResult> {
  const stream = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `You are a creative story writer. Generate the beginning of a story based on the user's prompt.
        The story should be 200-300 words long. After the story, provide 3-5 suggestions for how the user might want to continue the story.
        
        IMPORTANT: You MUST format your response as valid JSON with this exact structure:
        {
          "content": "the story content here",
          "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
        }
        
        Do not include any markdown code blocks or additional text outside the JSON. Make the suggestions specific and engaging, giving the user clear direction options for the story.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 1000,
    stream: true,
  });

  const encoder = new TextEncoder();

  return {
    stream: new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
            }
          }

          // Ensure we have a valid JSON response
          const validResponse = ensureValidJsonResponse(fullContent);
          const wordCount = validResponse.content.split(' ').length;

          const result = {
            content: validResponse.content,
            suggestions: validResponse.suggestions,
            wordCount,
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
          );
        } catch (error) {
          console.error('Error in streaming:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: 'Failed to generate story',
              })}\n\n`
            )
          );
        }

        controller.close();
      },
    }),
  };
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
      temperature: 1.3,
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

// New streaming function for story continuation with real-time display
export async function continueStoryStream(
  previousContent: string,
  userChoice: string,
  isCustomInput: boolean,
  maxWords: number = 150
): Promise<StoryStreamResult> {
  const systemPrompt = isCustomInput
    ? `You are a creative story writer. Continue the story based on the user's custom direction, but include the user's part in your continuation. Also add plot twist if possible.
      The continuation should be around ${maxWords} words long. After the story continuation, provide 3-5 suggestions for how the user might want to continue the story next.
      
      IMPORTANT: You MUST format your response as valid JSON with this exact structure:
      {
        "content": "the story continuation here",
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
      }
      
      Do not include any markdown code blocks or additional text outside the JSON. Make the suggestions specific and engaging, giving the user clear direction options for the story.`
    : `You are a creative story writer. Continue the story based on the user's chosen suggestion.
      The continuation should be around ${maxWords} words long. After the story continuation, provide 3-5 suggestions for how the user might want to continue the story next.
      
      IMPORTANT: You MUST format your response as valid JSON with this exact structure:
      {
        "content": "the story continuation here",
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
      }
      
      Do not include any markdown code blocks or additional text outside the JSON. Make the suggestions specific and engaging, giving the user clear direction options for the story.`;

  const stream = await openai.chat.completions.create({
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
    max_tokens: Math.max(500, Math.floor(maxWords * 2)),
    stream: true,
  });

  const encoder = new TextEncoder();

  return {
    stream: new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let currentStreamContent = '';

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;

              // Try to extract just the story content for streaming display
              // Look for content field in the JSON being built
              const currentJson = fullContent;
              const contentMatch = currentJson.match(
                /"content":\s*"([^"]*(?:\\.[^"]*)*)/
              );

              if (contentMatch) {
                const extractedContent = contentMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');

                if (extractedContent !== currentStreamContent) {
                  currentStreamContent = extractedContent;

                  // Send streaming update
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'content',
                        content: currentStreamContent,
                      })}\n\n`
                    )
                  );
                }
              }
            }
          }

          // Send final complete response
          const validResponse = ensureValidJsonResponse(fullContent);
          const wordCount = validResponse.content.split(' ').length;

          const result = {
            type: 'complete',
            content: validResponse.content,
            suggestions: validResponse.suggestions,
            wordCount,
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
          );
        } catch (error) {
          console.error('Error in streaming:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: 'Failed to continue story',
              })}\n\n`
            )
          );
        }

        controller.close();
      },
    }),
  };
}
