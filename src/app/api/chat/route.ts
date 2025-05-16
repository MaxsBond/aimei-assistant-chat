import { config } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';
import { Message, ChatCompletionRequest, MessageRole } from '@/lib/api';
import { knowledgeSearchTool } from '@/lib/rag/search-function';
import { weatherTool } from '@/lib/functions/weather-function';
import { callbackTool } from '@/lib/functions/callback-function';
import { calendlyTool, handleCalendlySuggestion } from '@/lib/functions/calendly-function';
import { 
  handleAllToolCalls,
  parseToolCalls,
  extractCitations,
  assessConfidence,
  createFallbackResponse,
  checkIfNeedsCallback
} from '@/lib/rag/response-processor';
import { MessageWithCitations, ToolCallResponse } from '@/lib/rag/types';
import { createOpenAIHeaders } from '@/lib/rag/auth';
import { ragConfig } from '@/lib/rag/config';
import { manageContextWindow } from '@/lib/rag/context-manager';
import { useChatStore } from '@/lib/store';

// Rate limiting variables
const API_RATE_LIMIT = 10; // requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Performance tracking helper
function trackPerformance(label: string, startTime: number): number {
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`⏱️ PERF: ${label} took ${duration.toFixed(2)}ms`);
  return endTime;
}

// Function to check rate limiting
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(ip) || { count: 0, resetTime: now + 60000 };
  
  // Reset counter if the time has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + 60000;
  }
  
  // Increment count and update in the map
  clientData.count++;
  requestCounts.set(ip, clientData);
  
  return clientData.count > API_RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const totalStartTime = performance.now();
  let currentTime = totalStartTime;
  
  try {
    // IP-based rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const requestStartTime = performance.now();
    const body = await request.json();
    currentTime = trackPerformance('Request parsing', requestStartTime);
    
    const messages: Message[] = body.messages;
    const enableRAG: boolean = body.enableRAG ?? true; // Enable RAG by default
    const enableFunctions: boolean = body.enableFunctions ?? true; // Enable function calling by default
    const customPromptContent: string | undefined = body.customPromptContent; // Get custom prompt content

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Determine which system prompt to use
    let systemPrompt = config.openai.systemPrompt;
    
    // If we have custom prompt content, use it (for backward compatibility)
    if (customPromptContent) {
      systemPrompt = customPromptContent;
    }

    // Add system message if not already present
    const systemMessageExists = messages.some(msg => msg.role === 'system');
    const messagesWithSystem = customPromptContent 
      ? [{ role: 'system' as MessageRole, content: customPromptContent }, ...messages]
      : [{ role: 'system' as MessageRole, content: systemPrompt }, ...messages];

    // Prepare the request payload for OpenAI
    const prepareStartTime = performance.now();
    const tools = [];
    
    // Add RAG tool if enabled
    if (enableRAG) {
      tools.push(knowledgeSearchTool);
    }
    
    // Add function calling tools if enabled
    if (enableFunctions) {
      tools.push(weatherTool);
      tools.push(callbackTool);
      tools.push(calendlyTool);
    }
    
    const payload: ChatCompletionRequest & { tools?: any[] } = {
      model: config.openai.model,
      messages: messagesWithSystem as Message[],
      temperature: config.openai.temperature,
      max_tokens: config.openai.max_tokens,
    };
    
    // Add tools array if we have any tools
    if (tools.length > 0) {
      payload.tools = tools;
    }
    currentTime = trackPerformance('Request preparation', prepareStartTime);

    // Make the request to OpenAI API
    console.log(`⏱️ PERF: Starting first OpenAI API call...`);
    const openaiStartTime = performance.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: createOpenAIHeaders(),
      body: JSON.stringify(payload),
    });
    currentTime = trackPerformance('First OpenAI API call', openaiStartTime);

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Error from OpenAI API' },
        { status: response.status }
      );
    }

    const parseStartTime = performance.now();
    const data = await response.json() as ToolCallResponse;
    currentTime = trackPerformance('First response parsing', parseStartTime);
    
    // Check if the response contains tool calls that need to be processed
    const toolCalls = parseToolCalls(data);
    
    if (toolCalls.length > 0) {
      console.log(`Processing ${toolCalls.length} tool calls from OpenAI...`);
      
      // Process all tool calls
      const toolCallsStartTime = performance.now();
      const toolResults = await handleAllToolCalls(data);
      currentTime = trackPerformance('Tool calls execution', toolCallsStartTime);
      
      // Check if any of the tool calls was a callback suggestion
      const callbackToolResult = toolResults.find(result => result.name === 'suggestCallback');
      const calendlyToolResult = toolResults.find(result => result.name === 'suggestCalendlyBooking');
      
      if (callbackToolResult) {
        // If the AI suggested a callback, parse the result and use it
        try {
          const callbackData = JSON.parse(callbackToolResult.content);
          
          trackPerformance('Total callback response time', totalStartTime);
          // Return the response with callback needed
          return NextResponse.json({
            message: {
              role: 'assistant',
              content: callbackData.message || "I don't have enough information to answer this question completely. Would you like a callback from our team?",
            },
            callback: {
              needed: true,
              reason: callbackData.reason || "Incomplete information available",
              urgency: callbackData.urgency || "medium",
              topic: callbackData.topic || "the question"
            }
          });
        } catch (error) {
          console.error('Error processing callback suggestion:', error);
        }
      }
      
      // If the AI suggested a Calendly booking, parse the result and use it
      if (calendlyToolResult) {
        try {
          const calendlyData = JSON.parse(calendlyToolResult.content);
          
          trackPerformance('Total calendly response time', totalStartTime);
          // Return the response with Calendly booking option
          return NextResponse.json({
            message: {
              role: 'assistant',
              content: calendlyData.message || "I'd recommend scheduling a meeting to discuss this further. You can book a time below.",
              showCalendly: true
            },
            calendly: {
              show: true,
              reason: calendlyData.reason || "Further discussion needed",
              meetingType: calendlyData.meetingType || "general",
              topic: calendlyData.topic || "your question"
            }
          });
        } catch (error) {
          console.error('Error processing Calendly suggestion:', error);
        }
      }
      
      // For the first tool (assuming it's a knowledge search), parse the results
      const parseSearchStartTime = performance.now();
      let retrievedDocuments = [];
      try {
        // Only attempt to parse if we have results
        if (toolResults.length > 0) {
          const searchResults = JSON.parse(toolResults[0].content);
          retrievedDocuments = searchResults.documents || [];
        }
      } catch (error) {
        console.error('Error parsing search results:', error);
      }
      currentTime = trackPerformance('Search results parsing', parseSearchStartTime);
      
      // Manage context window with retrieved documents
      const contextWindowStartTime = performance.now();
      const { optimizedMessages, retrievalContext } = manageContextWindow(
        messagesWithSystem, 
        retrievedDocuments
      );
      
      // Add context to system message
      const messagesWithContext = optimizedMessages.map(msg => {
        if (msg.role === 'system') {
          return {
            ...msg,
            content: `${msg.content}\n\nUse the following information to help answer the user's question:\n\n${retrievalContext}`,
          };
        }
        return msg;
      });
      currentTime = trackPerformance('Context window management', contextWindowStartTime);
      
      // Send a second request with the results from the tool calls
      const secondPayload = {
        model: config.openai.model,
        messages: [
          ...messagesWithContext, // Use context-enriched messages instead of original
          data.choices[0].message,
          ...toolResults,
        ],
        temperature: ragConfig.openai.temperature, // Use RAG-specific temperature
        max_tokens: ragConfig.openai.maxTokens,
        stream: true,
      };
      
      console.log(`⏱️ PERF: Starting second OpenAI API call with streaming enabled...`);
      const secondApiStartTime = performance.now();
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: createOpenAIHeaders(),
        body: JSON.stringify(secondPayload),
      });
      currentTime = trackPerformance('Second OpenAI API call connection', secondApiStartTime);
      
      if (!secondResponse.ok) {
        const error = await secondResponse.json();
        console.error('OpenAI API error in second request:', error);
        return NextResponse.json(
          { error: 'Error from OpenAI API during knowledge retrieval' },
          { status: secondResponse.status }
        );
      }
      
      // Handle streaming response
      if (secondResponse.headers.get('content-type')?.includes('text/event-stream')) {
        console.log(`⏱️ STREAM: Starting to process streaming response...`);
        const streamStartTime = performance.now();
        
        // Set up streaming response
        const streamingResponse = new ReadableStream({
          async start(controller) {
            let accumulatedContent = '';
            let chunkCount = 0;
            let firstChunkTime = 0;
            
            try {
              const reader = secondResponse.body?.getReader();
              if (!reader) {
                throw new Error('Failed to get reader from response');
              }
              
              // Process the stream
              const decoder = new TextDecoder();
              let done = false;
              
              console.log(`⏱️ STREAM: Waiting for first chunk...`);
              while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                
                if (done) {
                  console.log(`⏱️ STREAM: Completed reading stream after ${chunkCount} chunks`);
                  break;
                }
                
                // Process this chunk
                const chunk = decoder.decode(value, { stream: true });
                if (chunkCount === 0) {
                  firstChunkTime = performance.now() - streamStartTime;
                  console.log(`⏱️ STREAM: Received first chunk after ${firstChunkTime.toFixed(2)}ms`);
                }
                chunkCount++;
                
                // Parse the SSE format
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    // Handle the completion case
                    if (data === '[DONE]') {
                      console.log(`⏱️ STREAM: Received [DONE] signal`);
                      continue;
                    }
                    
                    try {
                      const parsedData = JSON.parse(data);
                      if (parsedData.choices && parsedData.choices[0].delta.content) {
                        accumulatedContent += parsedData.choices[0].delta.content;
                      }
                      
                      // Send the chunk to the client
                      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                      
                      if (chunkCount % 10 === 0) {
                        console.log(`⏱️ STREAM: Processed ${chunkCount} chunks so far, ${(performance.now() - streamStartTime).toFixed(2)}ms elapsed`);
                      }
                    } catch (err) {
                      console.error(`Error parsing SSE data: ${err}`);
                    }
                  }
                }
              }
              
              const streamEndTime = performance.now();
              const totalStreamTime = streamEndTime - streamStartTime;
              console.log(`⏱️ STREAM: Total streaming time: ${totalStreamTime.toFixed(2)}ms for ${chunkCount} chunks`);
              console.log(`⏱️ STREAM: Average chunk processing time: ${(totalStreamTime / Math.max(chunkCount, 1)).toFixed(2)}ms per chunk`);
              console.log(`⏱️ STREAM: Time to first chunk: ${firstChunkTime.toFixed(2)}ms`);
              
              // Process the final content once streaming is complete
              if (ragConfig.retrieval.includeCitations) {
                const citations = extractCitations(accumulatedContent, toolResults[0].content);
                console.log(`⏱️ STREAM: Extracted ${citations.length} citations from streamed content`);
              }
              
              trackPerformance('Total streaming response time', totalStartTime);
            } catch (error) {
              console.error('Error processing stream:', error);
              controller.error(error);
            } finally {
              controller.close();
            }
          }
        });
        
        // Return the streaming response
        return new Response(streamingResponse, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Prevents Nginx from buffering the response
          }
        });
      } else {
        // Handle non-streaming response (fallback)
        console.log(`⏱️ PERF: Non-streaming response received despite stream:true setting`);
        const secondParseStartTime = performance.now();
        const secondData = await secondResponse.json();
        const finalContent = secondData.choices[0].message.content;
        currentTime = trackPerformance('Second response parsing', secondParseStartTime);
        
        // Extract citations if enabled
        const citationsStartTime = performance.now();
        const citations = ragConfig.retrieval.includeCitations 
          ? extractCitations(finalContent, toolResults[0].content)
          : [];
        
        // Create response with citations
        const messageWithCitations: MessageWithCitations = {
          role: 'assistant',
          content: finalContent,
        };
        
        if (citations.length > 0) {
          messageWithCitations.citations = citations;
        }
        currentTime = trackPerformance('Citations extraction', citationsStartTime);
        
        // Assess confidence in the retrieved information
        const confidenceStartTime = performance.now();
        const confidence = assessConfidence(toolResults[0].content);
        console.log('Response confidence:', confidence);
        
        // Determine if the response needs a callback option
        const { needsCallback, reason } = checkIfNeedsCallback(
          confidence, 
          finalContent,
          citations.length
        );
        
        console.log(`Needs callback: ${needsCallback}, Reason: ${reason}`);
        currentTime = trackPerformance('Confidence assessment', confidenceStartTime);
        
        trackPerformance('Total RAG response time', totalStartTime);
        return NextResponse.json({
          message: messageWithCitations,
          rag: {
            used: true,
            confidence: confidence.score,
          },
          callback: {
            needed: needsCallback,
            reason: reason
          }
        });
      }
    } else {
      // Standard response without RAG
      trackPerformance('Total standard response time', totalStartTime);
      return NextResponse.json({
        message: data.choices[0].message,
        rag: {
          used: false,
        },
        callback: {
          needed: false,
          reason: "No knowledge retrieval was performed"
        }
      });
    }
  } catch (error) {
    trackPerformance('Total error handling time', totalStartTime);
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 