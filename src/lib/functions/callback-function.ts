/**
 * Callback function definition for the AI to request user's phone number
 */
import { Tool } from '@/lib/rag/types';

/**
 * Definition of the function schema for AI to suggest callback
 */
export const callbackTool: Tool = {
  type: 'function',
  function: {
    name: 'suggestCallback',
    description: 'Suggest a phone callback when the AI cannot provide a complete or satisfactory answer from the knowledge base',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'The reason why a callback is needed or why the AI cannot provide a complete answer',
        },
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'How urgent the callback request is'
        },
        topic: {
          type: 'string',
          description: 'The general topic of the question that requires human assistance'
        }
      },
      required: ['reason']
    }
  }
};

/**
 * Handle the function call from the AI to suggest a callback
 * 
 * @param args - JSON string arguments from the AI
 * @returns JSON formatted response
 */
export async function handleCallbackSuggestion(args: string): Promise<string> {
  try {
    // Parse the arguments
    const params = JSON.parse(args);
    
    // Extract data
    const reason = params.reason || 'Incomplete information available';
    const urgency = params.urgency || 'medium';
    const topic = params.topic || 'your question';
    
    // Create a response that will trigger the callback form
    return JSON.stringify({
      needsCallback: true,
      reason,
      urgency,
      topic,
      message: "Amazing! Please leave your phone number, and we'll call you back when we have the information you need."
    });
  } catch (error) {
    console.error('Error handling callback suggestion:', error);
    return JSON.stringify({
      needsCallback: true,
      reason: 'Error processing callback suggestion',
      message: "Amazing! Please leave your phone number, and we'll call you back when we have the information you need."
    });
  }
} 