import { openai } from './client';
import { StoryGenerationResult, StoryStreamResult } from './types';
import { cleanResponse, ensureValidJsonResponse } from './utils';

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

    const cleanedResponse = cleanResponse(response);
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
        let currentStreamContent = '';
        let isInContentField = false;
        let contentStarted = false;

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;

              // Track if we're inside the content field
              if (!isInContentField && fullContent.includes('"content":')) {
                isInContentField = true;
              }

              if (isInContentField && !contentStarted) {
                // Look for the opening quote of the content value
                const contentMatch = fullContent.match(/"content":\s*"/);
                if (contentMatch) {
                  contentStarted = true;
                  // Extract everything after the content field start
                  const afterContentStart = fullContent.substring(
                    fullContent.indexOf('"content":') + '"content":'.length
                  );
                  const contentStartIndex = afterContentStart.indexOf('"') + 1;
                  currentStreamContent =
                    afterContentStart.substring(contentStartIndex);
                }
              }

              if (contentStarted) {
                // Extract current content up to the closing quote (but not including suggestions)
                const fullAfterContent = fullContent.substring(
                  fullContent.indexOf('"content":') + '"content":'.length
                );
                const contentMatch = fullAfterContent.match(
                  /^[^"]*"([^"]*(?:\\.[^"]*)*)/
                );

                if (contentMatch) {
                  const extractedContent = contentMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');

                  if (
                    extractedContent !== currentStreamContent &&
                    extractedContent.length > currentStreamContent.length
                  ) {
                    currentStreamContent = extractedContent;

                    // Send streaming update with just the content
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
