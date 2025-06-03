import { openai } from './client';
import { StoryGenerationResult, StoryStreamResult } from './types';
import { cleanResponse, ensureValidJsonResponse } from './utils';

export async function continueStory(
  previousContent: string,
  userChoice: string,
  isCustomInput: boolean,
  maxWords: number = 300
): Promise<StoryGenerationResult> {
  try {
    const systemPrompt = `You are continuing a story. The user has provided ${
      isCustomInput ? 'a custom direction' : 'a chosen suggestion'
    } for how the story should continue.
    
    IMPORTANT RULES:
    1. The user's choice is NOT already part of the story. You must incorporate their choice/direction into your continuation.
    2. Stay focused ONLY on the suggestion provided. Do not introduce new characters, locations, or plot elements unless they are directly implied by the suggestion.
    3. Keep the continuation simple and directly related to the user's direction.
    4. Do not expand the scope beyond what the suggestion implies.
    5. Write a natural continuation that flows from the previous content and incorporates the user's choice.
    
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
          content: `Previous story content:\n${previousContent}\n\nUser's direction for continuation: ${userChoice}\n\nPlease write the next part of the story that incorporates this direction and moves the story forward.`,
        },
      ],
      temperature: 1.3,
      max_tokens: Math.max(500, Math.floor(maxWords * 2)),
    });

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
  } catch (error) {
    console.error('Error continuing story:', error);
    throw new Error('Failed to continue story');
  }
}

export async function continueStoryStream(
  previousContent: string,
  userChoice: string,
  isCustomInput: boolean,
  maxWords: number = 150
): Promise<StoryStreamResult> {
  const systemPrompt = isCustomInput
    ? `You are a creative story writer. The user has provided a custom direction for how the story should continue.
      
      IMPORTANT RULES:
      1. The user's direction is NOT already part of the story. You must incorporate their direction into your continuation.
      2. Stay focused ONLY on the direction provided. Do not introduce new characters, locations, or major plot elements unless they are directly implied by the user's direction.
      3. Keep the continuation simple and directly related to the user's input.
      4. Do not expand the scope beyond what the direction implies.
      5. Write a natural continuation that flows from the previous content and incorporates the user's direction.
      
      The continuation should be around ${maxWords} words long. After the story continuation, provide 3-5 suggestions for how the user might want to continue the story next.
      
      IMPORTANT: You MUST format your response as valid JSON with this exact structure:
      {
        "content": "the story continuation here",
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
      }
      
      Do not include any markdown code blocks or additional text outside the JSON. Make the suggestions specific and engaging, giving the user clear direction options for the story.`
    : `You are a creative story writer. The user has chosen a suggestion for how the story should continue.
      
      IMPORTANT RULES:
      1. The user's chosen suggestion is NOT already part of the story. You must incorporate their choice into your continuation.
      2. Stay focused ONLY on the chosen suggestion. Do not introduce new characters, locations, or major plot elements unless they are directly implied by the suggestion.
      3. Keep the continuation simple and directly related to the chosen suggestion.
      4. Do not expand the scope beyond what the suggestion implies.
      5. Write a natural continuation that flows from the previous content and incorporates the chosen suggestion.
      
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
        content: `Previous story content:\n${previousContent}\n\nUser's direction for continuation: ${userChoice}\n\nPlease write the next part of the story that incorporates this direction and moves the story forward.`,
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
        let isInContentField = false;
        let contentStarted = false;
        let contentCompleted = false;
        let suggestionNotificationSent = false;

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
                }
              }

              if (contentStarted && !contentCompleted) {
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

                // Improved detection for content field completion
                // Look for the closing quote of the content field followed by comma and next field
                const contentFieldCompletePattern =
                  /"content"\s*:\s*"[^"]*(?:\\.[^"]*)*"\s*,/;
                if (contentFieldCompletePattern.test(fullContent)) {
                  contentCompleted = true;

                  // Send suggestions generation notification immediately when content is done
                  if (!suggestionNotificationSent) {
                    suggestionNotificationSent = true;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'generating_suggestions',
                        })}\n\n`
                      )
                    );
                  }
                }
              }
            }
          }

          // Send final complete response
          console.log('Raw AI response for debugging:', fullContent);
          const validResponse = ensureValidJsonResponse(fullContent);
          console.log('Parsed response:', validResponse);
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
