import { MessageRole } from './store';
import { Citation } from './rag/types';

export type { MessageRole };

export interface Message {
  role: MessageRole;
  content: string;
  citations?: Citation[];
  callback?: CallbackInfo;
  showCalendly?: boolean;
  confidence?: number; // Confidence score from direct RAG
}

export interface CallbackInfo {
  needed: boolean;
  reason: string;
  urgency?: string;
  topic?: string;
}

export interface CalendlyInfo {
  show: boolean;
  reason: string;
  meetingType?: string;
  topic?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: object;
    };
  }>;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }[];
}

export interface FollowUpSuggestionsResponse {
  suggestions: string[];
}

export interface RAGResponse {
  used: boolean;
  confidence?: number; 
}

export interface ChatApiResponse {
  message: Message;
  rag?: RAGResponse;
  callback?: CallbackInfo;
  calendly?: CalendlyInfo;
}

// Client-side API calls to our Next.js API routes
export async function sendMessage(
  messages: Message[], 
  options?: { 
    enableRAG?: boolean, 
    enableFunctions?: boolean,
    useDirectRAG?: boolean,
    useCustomPrompt?: boolean,
    customPromptContent?: string
  }
): Promise<Message & { callback?: CallbackInfo, calendly?: CalendlyInfo }> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages,
        enableRAG: options?.enableRAG ?? true, // Enable RAG by default
        enableFunctions: options?.enableFunctions ?? true, // Enable functions by default
        useDirectRAG: options?.useDirectRAG ?? false, // Use direct RAG approach when specified
        useCustomPrompt: options?.useCustomPrompt ?? false, // Use custom prompt if specified
        customPromptContent: options?.customPromptContent // Send the actual prompt content
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ChatApiResponse = await response.json();
    
    // Include callback and calendly information in the returned message
    return {
      ...data.message,
      callback: data.callback,
      calendly: data.calendly
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message. Please try again.');
  }
}

export async function getSuggestions(messages: Message[]): Promise<string[]> {
  try {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: FollowUpSuggestionsResponse = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
} 