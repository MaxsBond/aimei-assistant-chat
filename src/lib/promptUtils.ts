import { config, PromptType } from './config';
import { SYSTEM_PROMPTS } from '@/constants';
import { useChatStore } from './store';
import { CustomPromptData } from '@/components/chat/custom-prompt';

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

/**
 * Get currently active system prompt considering custom prompts
 * @returns The system prompt to use
 */
export function getActiveSystemPrompt(): string {
  // Use this in non-React contexts
  const store = useChatStore.getState();
  const { customPromptSettings } = store;
  const activePrompt = store.getActivePrompt();
  
  // If custom prompts are enabled and there's an active prompt, use it
  if (customPromptSettings.enabled && activePrompt) {
    return buildPromptFromCustomData(activePrompt);
  }
  
  // Otherwise, use the default prompt from config
  return config.openai.systemPrompt;
}

/**
 * Build a full system prompt from custom prompt data
 * @param promptData The custom prompt data
 * @returns The full system prompt
 */
export function buildPromptFromCustomData(promptData: CustomPromptData): string {
  // Construct the full system prompt with all sections
  return `${promptData.systemPrompt} ${promptData.formattingRules} ${promptData.guardRules} ${promptData.callbackInstructions}`;
}

/**
 * Get all custom prompts
 * @returns Array of custom prompts
 */
export function getCustomPrompts(): (CustomPromptData & { id: string })[] {
  return useChatStore.getState().customPromptSettings.customPrompts;
}

/**
 * Check if custom prompts are enabled
 * @returns Whether custom prompts are enabled
 */
export function isCustomPromptEnabled(): boolean {
  const { customPromptSettings } = useChatStore.getState();
  return customPromptSettings.enabled && customPromptSettings.activePromptId !== null;
} 