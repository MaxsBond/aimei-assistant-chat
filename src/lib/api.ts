import { MessageRole } from './store';
import { Citation } from './rag/types';

export type { MessageRole };

export interface Message {
  role: MessageRole;
  content: string;
  citations?: Citation[];
  callback?: CallbackInfo;
  showCalendly?: boolean;
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
    useCustomPrompt?: boolean,
    customPromptContent?: string,
    onChunk?: (chunk: string) => void  // New callback for handling streaming chunks
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
        useCustomPrompt: options?.useCustomPrompt ?? false, // Use custom prompt if specified
        customPromptContent: options?.customPromptContent // Send the actual prompt content
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Handle streaming response
    if (response.headers.get('Content-Type')?.includes('text/event-stream') && options?.onChunk) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      
      // Performance tracking variables
      const streamStartTime = performance.now();
      let chunkCount = 0;
      let firstChunkTime = 0;
      
      console.log(`🔄 CLIENT-STREAM: Starting to process streaming response...`);
      
      // Process the stream
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`🔄 CLIENT-STREAM: Stream complete after ${chunkCount} chunks`);
              break;
            }
            
            // Decode this chunk
            const chunk = decoder.decode(value, { stream: true });
            
            // Record first chunk timing
            if (chunkCount === 0) {
              firstChunkTime = performance.now() - streamStartTime;
              console.log(`🔄 CLIENT-STREAM: First chunk received after ${firstChunkTime.toFixed(2)}ms`);
            }
            
            chunkCount++;
            
            // Log progress for larger responses
            if (chunkCount % 10 === 0) {
              console.log(`🔄 CLIENT-STREAM: Processed ${chunkCount} chunks so far, ${(performance.now() - streamStartTime).toFixed(2)}ms elapsed`);
            }
            
            // Process SSE format
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                // Skip [DONE] marker
                if (data === '[DONE]') {
                  console.log(`🔄 CLIENT-STREAM: Received [DONE] marker`);
                  continue;
                }
                
                try {
                  const parsedData = JSON.parse(data);
                  console.log(`🔄 CLIENT-STREAM: Parsed chunk data`, {
                    hasChoices: !!parsedData.choices,
                    deltaContent: parsedData.choices?.[0]?.delta?.content || null
                  });
                  
                  if (parsedData.choices && parsedData.choices[0].delta && 
                      parsedData.choices[0].delta.content) {
                    const content = parsedData.choices[0].delta.content;
                    accumulatedContent += content;
                    
                    // Log content length to make sure we're receiving text
                    console.log(`🔄 CLIENT-STREAM: Sending chunk to UI: ${content.length} chars`);
                    
                    // Call the callback with the chunk content
                    options.onChunk(content);
                  }
                } catch (err) {
                  console.error(`Error parsing SSE data:`, err, `Raw data: ${data.substring(0, 100)}`);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          
          // Log final timing statistics
          const totalStreamTime = performance.now() - streamStartTime;
          console.log(`🔄 CLIENT-STREAM: Performance summary:`);
          console.log(`  - Total streaming time: ${totalStreamTime.toFixed(2)}ms`);
          console.log(`  - Chunks received: ${chunkCount}`);
          console.log(`  - Time to first chunk: ${firstChunkTime.toFixed(2)}ms`);
          console.log(`  - Average time per chunk: ${(totalStreamTime / Math.max(chunkCount, 1)).toFixed(2)}ms`);
          console.log(`  - Total characters: ${accumulatedContent.length}`);
          console.log(`  - Characters per second: ${(accumulatedContent.length / (totalStreamTime / 1000)).toFixed(2)}`);
        }
      }
      
      // Return a synthetic response with the accumulated content
      return {
        role: 'assistant' as MessageRole,
        content: accumulatedContent,
        // We can't get citations from streaming yet, so leave them empty
        citations: [], 
      };
    }

    // Handle non-streaming response (fallback)
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