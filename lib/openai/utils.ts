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

export function cleanResponse(response: string): string {
  return response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
}
