// Application configuration settings
import { SYSTEM_PROMPTS } from '@/constants';

/**
 * Available prompt types for the AI assistant
 * 
 * How to switch prompt types:
 * 1. Import and update the config where needed:
 *    import { config } from '@/lib/config';
 *    config.openai.promptType = 'creative'; // Switch to creative mode
 * 
 * 2. Or modify this file directly to change the default
 * 
 * Available types:
 * - default: Standard helpful assistant
 * - creative: More imaginative responses
 * - technical: Focused on programming and technical details
 */
export type PromptType = 'default' | 'creative' | 'technical';

export const config = {
  appName: 'Smart Assistant Bot',
  openai: {
    model: 'gpt-4.1-mini', // Default model
    temperature: 0.7,
    max_tokens: 1000,
    promptType: 'default' as PromptType,
    get systemPrompt() {
      return SYSTEM_PROMPTS[this.promptType];
    },
    // This will be called dynamically by the getActiveSystemPrompt function
    // which handles custom prompts
  },
  ui: {
    suggestions: {
      count: 3, // Number of suggestions to show
      maxLength: 60, // Maximum character length for suggestions
    },
    chat: {
      maxMessages: 100, // Maximum number of messages to keep in history
    },
    theme: {
      default: 'system', // 'light', 'dark', or 'system'
    },
  },
  apiEndpoints: {
    chat: '/api/chat',
    suggestions: '/api/suggestions',
  },
  // Add other configuration settings as needed
}; 