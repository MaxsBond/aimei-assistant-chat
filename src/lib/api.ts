import { MessageRole } from './store';
import { Citation } from './rag/types';

export type { MessageRole };

export interface Message {
  role: MessageRole;
  content: string;
  citations?: Citation[];
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
}

// Client-side API calls to our Next.js API routes
export async function sendMessage(
  messages: Message[], 
  options?: { enableRAG?: boolean, enableFunctions?: boolean }
): Promise<Message> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages,
        enableRAG: options?.enableRAG ?? true, // Enable RAG by default
        enableFunctions: options?.enableFunctions ?? true // Enable functions by default
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ChatApiResponse = await response.json();
    return data.message;
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