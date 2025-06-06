import { openai } from './client';
import { StoryGenerationResult, StoryStreamResult } from './types';
import { cleanResponse, ensureValidJsonResponse } from './utils';

// Add timeout wrapper for OpenAI calls
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
};

export async function continueStory(
  previousContent: string,
  userChoice: string,
  isCustomInput: boolean,
  maxWords: number = 300,
  initialPrompt?: string,
  previousSuggestions?: string[]
): Promise<StoryGenerationResult> {
  try {
    const contextInfo = initialPrompt
      ? `\n\nOriginal story concept: ${initialPrompt}`
      : '';

    const suggestionHistory =
      previousSuggestions && previousSuggestions.length > 0
        ? `\n\nPrevious suggestions that were available (for context): ${previousSuggestions.join(
            ', '
          )}`
        : '';

    const systemPrompt = `You are continuing a story with observational commentary woven into the narrative. The user has provided ${
      isCustomInput ? 'a custom direction' : 'a chosen suggestion'
    } for how the story should continue.
    
    IMPORTANT RULES:
    1. The user's choice is NOT already part of the story. You must incorporate their choice/direction into your continuation.
    2. Stay focused ONLY on the suggestion provided. Do not introduce new characters, locations, or plot elements unless they are directly implied by the suggestion.
    3. Keep the continuation simple and directly related to the user's direction.
    4. Do not expand the scope beyond what the suggestion implies.
    5. Write a natural continuation that flows from the previous content and incorporates the user's choice.
    6. Consider the original story concept and maintain thematic consistency with the initial vision.
    7. Be aware of previous suggestions to maintain narrative coherence and avoid contradictions.
    8. Include thoughtful observations and commentary about the events, character decisions, dramatic moments, and interesting details. Express these as narrative observations rather than personal opinions (avoid using "I think" or "I believe"). Present insights as natural commentary within the storytelling voice without breaking the fourth wall.
    
    Continue the story with approximately ${maxWords} words (aim for ${Math.floor(
      maxWords * 0.8
    )} to ${Math.floor(
      maxWords * 1.2
    )} words). After the story continuation, provide 3-5 new suggestions for how the user might want to continue further.
    
    Format your response as JSON with this structure:
    {
      "content": "the story continuation here with observational commentary woven in",
      "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
    }`;

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Previous story content:\n${previousContent}${contextInfo}${suggestionHistory}\n\nUser's direction for continuation: ${userChoice}\n\nPlease write the next part of the story that incorporates this direction and moves the story forward.`,
          },
        ],
        temperature: 0.8,
        max_tokens: Math.max(500, Math.floor(maxWords * 2)),
      }),
      50000 // 50 second timeout for API call
    );

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
    if (error instanceof Error && error.message === 'Request timeout') {
      throw new Error('Story continuation timed out. Please try again.');
    }
    throw new Error('Failed to continue story');
  }
}

export async function continueStoryStream(
  previousContent: string,
  userChoice: string,
  isCustomInput: boolean,
  maxWords: number = 150,
  initialPrompt?: string,
  previousSuggestions?: string[]
): Promise<StoryStreamResult> {
  const contextInfo = initialPrompt
    ? `\n\nOriginal story concept: ${initialPrompt}`
    : '';

  const suggestionHistory =
    previousSuggestions && previousSuggestions.length > 0
      ? `\n\nPrevious suggestions that were available (for context): ${previousSuggestions.join(
          ', '
        )}`
      : '';

  const systemPrompt = isCustomInput
    ? `You are a creative story writer who weaves observational commentary into the narrative. The user has provided a custom direction for how the story should continue.
      
      IMPORTANT RULES:
      1. The user's direction is NOT already part of the story. You must incorporate their direction into your continuation.
      2. Stay focused ONLY on the direction provided. Do not introduce new characters, locations, or major plot elements unless they are directly implied by the user's direction.
      3. Keep the continuation simple and directly related to the user's input.
      4. Do not expand the scope beyond what the direction implies.
      5. Write a natural continuation that flows from the previous content and incorporates the user's direction.
      6. Consider the original story concept and maintain thematic consistency with the initial vision.
      7. Be aware of previous suggestions to maintain narrative coherence and avoid contradictions.
      8. Include thoughtful observations and commentary about the events, character decisions, dramatic moments, and interesting details. Express these as narrative observations rather than personal opinions (avoid using "I think" or "I believe"). Present insights as natural commentary within the storytelling voice without breaking the fourth wall.
      
      The continuation should be around ${maxWords} words long. After the story continuation, provide 3-5 suggestions for how the user might want to continue the story next.
      
      IMPORTANT: You MUST format your response as valid JSON with this exact structure:
      {
        "content": "the story continuation here with observational commentary woven in",
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
      }
      
      Do not include any markdown code blocks or additional text outside the JSON. Make the suggestions specific and engaging, giving the user clear direction options for the story. Your narrative voice should include insightful commentary without breaking the fourth wall or referring to yourself as the writer.`
    : `You are a creative story writer who weaves observational commentary into the narrative. The user has chosen a suggestion for how the story should continue.
      
      IMPORTANT RULES:
      1. The user's chosen suggestion is NOT already part of the story. You must incorporate their choice into your continuation.
      2. Stay focused ONLY on the chosen suggestion. Do not introduce new characters, locations, or major plot elements unless they are directly implied by the suggestion.
      3. Keep the continuation simple and directly related to the chosen suggestion.
      4. Do not expand the scope beyond what the suggestion implies.
      5. Write a natural continuation that flows from the previous content and incorporates the chosen suggestion.
      6. Consider the original story concept and maintain thematic consistency with the initial vision.
      7. Be aware of previous suggestions to maintain narrative coherence and avoid contradictions.
      8. Include thoughtful observations and commentary about the events, character decisions, dramatic moments, and interesting details. Express these as narrative observations rather than personal opinions (avoid using "I think" or "I believe"). Present insights as natural commentary within the storytelling voice without breaking the fourth wall.
      
      The continuation should be around ${maxWords} words long. After the story continuation, provide 3-5 suggestions for how the user might want to continue the story next.
      
      IMPORTANT: You MUST format your response as valid JSON with this exact structure:
      {
        "content": "the story continuation here with observational commentary woven in",
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
      }
      
      Do not include any markdown code blocks or additional text outside the JSON. Make the suggestions specific and engaging, giving the user clear direction options for the story. Your narrative voice should include insightful commentary without breaking the fourth wall or referring to yourself as the writer.`;

  const stream = await withTimeout(
    openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Previous story content:\n${previousContent}${contextInfo}${suggestionHistory}\n\nUser's direction for continuation: ${userChoice}\n\nPlease write the next part of the story that incorporates this direction and moves the story forward.`,
        },
      ],
      temperature: 0.8,
      max_tokens: Math.max(500, Math.floor(maxWords * 2)),
      stream: true,
    }),
    50000 // 50 second timeout for stream initialization
  );

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
        let lastSentLength = 0;
        let isInSuggestionsField = false;
        let suggestionsStarted = false;
        const currentSuggestions: string[] = [];

        try {
          // Only timeout if no data is received for extended period
          let lastDataReceived = Date.now();
          const maxIdleTime = 30000; // 30 seconds without any data

          for await (const chunk of stream) {
            lastDataReceived = Date.now();
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
                // Extract current content up to the closing quote
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

                  // Send updates more frequently - even for small changes
                  if (extractedContent.length > lastSentLength) {
                    currentStreamContent = extractedContent;
                    lastSentLength = extractedContent.length;

                    // Send streaming update immediately for each new content
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

                // Check if content field is complete
                const contentFieldCompletePattern =
                  /"content"\s*:\s*"[^"]*(?:\\.[^"]*)*"\s*,/;
                if (contentFieldCompletePattern.test(fullContent)) {
                  contentCompleted = true;

                  // Send suggestions generation notification
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

              // Track if we're inside the suggestions field
              if (
                contentCompleted &&
                !isInSuggestionsField &&
                fullContent.includes('"suggestions":')
              ) {
                isInSuggestionsField = true;
              }

              if (isInSuggestionsField && !suggestionsStarted) {
                // Look for the opening bracket of the suggestions array
                const suggestionsMatch =
                  fullContent.match(/"suggestions":\s*\[/);
                if (suggestionsMatch) {
                  suggestionsStarted = true;
                }
              }

              if (suggestionsStarted) {
                // Extract suggestions as they're being generated
                const suggestionsStart =
                  fullContent.indexOf('"suggestions":') +
                  '"suggestions":'.length;
                const suggestionsContent =
                  fullContent.substring(suggestionsStart);

                // Match individual suggestions within the array
                const suggestionPattern = /"([^"]*(?:\\.[^"]*)*)"/g;
                const matches = [
                  ...suggestionsContent.matchAll(suggestionPattern),
                ];

                // Process new suggestions
                for (
                  let i = currentSuggestions.length;
                  i < matches.length;
                  i++
                ) {
                  if (matches[i] && matches[i][1]) {
                    const suggestion = matches[i][1]
                      .replace(/\\n/g, '\n')
                      .replace(/\\"/g, '"')
                      .replace(/\\\\/g, '\\');

                    currentSuggestions.push(suggestion);

                    // Send individual suggestion as it's completed
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'suggestion',
                          suggestion: suggestion,
                          suggestionIndex: i,
                        })}\n\n`
                      )
                    );
                  }
                }
              }
            }

            // Check for idle timeout only
            if (Date.now() - lastDataReceived > maxIdleTime) {
              console.warn(
                'Stream idle timeout - no data received for 30 seconds'
              );
              break;
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
