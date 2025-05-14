import { config, PromptType } from './config';
import { SYSTEM_PROMPTS } from '@/constants';

/**
 * Switch the AI assistant's prompt type
 * @param type The prompt type to switch to
 * @returns The new prompt content
 * 
 * @example
 * // Switch to creative mode
 * switchPromptType('creative');
 * 
 * // Switch to technical mode for a specific query
 * switchPromptType('technical');
 * // ... send the message ...
 * // Switch back to default
 * switchPromptType('default');
 */
export function switchPromptType(type: PromptType): string {
  if (!Object.keys(SYSTEM_PROMPTS).includes(type)) {
    console.warn(`Prompt type "${type}" not found. Using default.`);
    type = 'default';
  }
  
  config.openai.promptType = type;
  return config.openai.systemPrompt;
}

/**
 * Get available prompt types with their descriptions
 * @returns An object mapping prompt types to their descriptions
 */
export function getAvailablePromptTypes(): Record<PromptType, string> {
  return {
    default: 'Standard helpful assistant mode',
    creative: 'More imaginative and creative responses',
    technical: 'Technical expert focused on programming and technology',
  };
} 