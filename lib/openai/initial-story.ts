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
        let contentCompleted = false;
        let suggestionNotificationSent = false;
        let lastSentLength = 0;
        let isInSuggestionsField = false;
        let suggestionsStarted = false;
        const currentSuggestions: string[] = [];

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
