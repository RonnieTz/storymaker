// Helper function to ensure valid JSON response
export function ensureValidJsonResponse(content: string): {
  content: string;
  suggestions: string[];
} {
  try {
    // Try to parse as JSON first
    const cleaned = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    console.log('Attempting to parse cleaned content:', cleaned);
    const parsed = JSON.parse(cleaned);

    // Validate the structure
    if (parsed.content && Array.isArray(parsed.suggestions)) {
      console.log(
        'Successfully parsed AI response with suggestions:',
        parsed.suggestions
      );
      return parsed;
    }

    // If structure is invalid, treat as plain text
    console.warn(
      'Invalid JSON structure, missing content or suggestions array'
    );
    throw new Error('Invalid JSON structure');
  } catch (error) {
    console.error('JSON parsing failed:', error);
    console.warn(
      'Falling back to default suggestions for content:',
      content.substring(0, 100) + '...'
    );

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

export function cleanResponse(response: string): string {
  return response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
}
