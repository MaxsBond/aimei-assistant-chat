import { config } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';
import { Message, ChatCompletionRequest } from '@/lib/api';
import { knowledgeSearchTool } from '@/lib/rag/search-function';
import { 
  handleAllToolCalls,
  parseToolCalls,
  extractCitations,
  assessConfidence,
  createFallbackResponse
} from '@/lib/rag/response-processor';
import { MessageWithCitations, ToolCallResponse } from '@/lib/rag/types';
import { createOpenAIHeaders } from '@/lib/rag/auth';
import { ragConfig } from '@/lib/rag/config';
import { manageContextWindow } from '@/lib/rag/context-manager';

// Rate limiting variables
const API_RATE_LIMIT = 10; // requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

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
  try {
    // IP-based rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const messages: Message[] = body.messages;
    const enableRAG: boolean = body.enableRAG ?? true; // Enable RAG by default

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

    // Add system message if not already present
    const systemMessageExists = messages.some(msg => msg.role === 'system');
    const messagesWithSystem = systemMessageExists 
      ? messages 
      : [{ role: 'system', content: config.openai.systemPrompt }, ...messages];

    // Prepare the request payload for OpenAI
    const tools = enableRAG ? [knowledgeSearchTool] : [];
    const payload: ChatCompletionRequest & { tools?: any[] } = {
      model: config.openai.model,
      messages: messagesWithSystem,
      temperature: config.openai.temperature,
      max_tokens: config.openai.max_tokens,
    };
    
    // Add tools array for RAG if enabled
    if (enableRAG && tools.length > 0) {
      payload.tools = tools;
    }

    // Make the request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: createOpenAIHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Error from OpenAI API' },
        { status: response.status }
      );
    }

    const data = await response.json() as ToolCallResponse;
    
    // Check if the response contains tool calls that need to be processed
    const toolCalls = parseToolCalls(data);
    
    if (toolCalls.length > 0) {
      console.log(`Processing ${toolCalls.length} tool calls from OpenAI...`);
      
      // Process all tool calls
      const toolResults = await handleAllToolCalls(data);
      
      // For the first tool (assuming it's a knowledge search), parse the results
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
      
      // Manage context window with retrieved documents
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
      };
      
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: createOpenAIHeaders(),
        body: JSON.stringify(secondPayload),
      });
      
      if (!secondResponse.ok) {
        const error = await secondResponse.json();
        console.error('OpenAI API error in second request:', error);
        return NextResponse.json(
          { error: 'Error from OpenAI API during knowledge retrieval' },
          { status: secondResponse.status }
        );
      }
      
      const secondData = await secondResponse.json();
      const finalContent = secondData.choices[0].message.content;
      
      // Extract citations if enabled
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
      
      // Assess confidence in the retrieved information
      const confidence = assessConfidence(toolResults[0].content);
      console.log('Response confidence:', confidence);
      
      return NextResponse.json({
        message: messageWithCitations,
        rag: {
          used: true,
          confidence: confidence.score,
        },
      });
    } else {
      // Standard response without RAG
      return NextResponse.json({
        message: data.choices[0].message,
        rag: {
          used: false,
        },
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 