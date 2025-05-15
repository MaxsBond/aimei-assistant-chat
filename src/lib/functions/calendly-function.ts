/**
 * Calendly function definition for the AI to suggest booking a meeting
 */
import { Tool } from '@/lib/rag/types';

/**
 * Definition of the function schema for AI to suggest booking a meeting
 */
export const calendlyTool: Tool = {
  type: 'function',
  function: {
    name: 'suggestCalendlyBooking',
    description: 'Use when the user asks to schedule a meeting.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

/**
 * Handle the function call from the AI to suggest a Calendly booking
 * 
 * @param args - JSON string arguments from the AI (not used)
 * @returns JSON formatted response
 */
export async function handleCalendlySuggestion(args: string): Promise<string> {
  try {
    // Hardcoded message for Calendly scheduling
    const message = "I'd be happy to help you schedule a meeting. You can use the calendar below to find a suitable time.";
    
    // Create a response that will trigger the Calendly component with the hardcoded message
    return JSON.stringify({
      showCalendly: true,
      message: message
    });
  } catch (error) {
    console.error('Error handling Calendly suggestion:', error);
    return JSON.stringify({
      showCalendly: true,
      message: "I'd be happy to help you schedule a meeting. You can use the calendar below to find a suitable time."
    });
  }
} 