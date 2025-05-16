/**
 * Process responses from OpenAI that involve function calling and knowledge retrieval
 */
import { Citation, ConfidenceAssessment, ToolCall, ToolCallResponse, ToolResult } from './types';
import { handleKnowledgeSearchCall } from './search-function';
import { handleWeatherCall } from '../functions/weather-function';
import { handleCallbackSuggestion } from '../functions/callback-function';
import { handleCalendlySuggestion } from '../functions/calendly-function';
import { detectLowQualityAnswer, getAnswerQualityAssessment } from './answer-quality';

// Performance tracking helper
function trackPerformance(label: string, startTime: number): number {
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`⏱️ RESPONSE-PROC: ${label} took ${duration.toFixed(2)}ms`);
  return endTime;
}

/**
 * Parse function calls from OpenAI response
 * @param response - The raw response from OpenAI API
 * @returns Array of tool calls or empty array if none
 */
export function parseToolCalls(response: ToolCallResponse): ToolCall[] {
  const parseStart = performance.now();
  try {
    const toolCalls = response.choices[0]?.message?.tool_calls;
    const result = toolCalls || [];
    trackPerformance('Parse tool calls', parseStart);
    return result;
  } catch (error) {
    console.error('Error parsing tool calls:', error);
    trackPerformance('Parse tool calls (error)', parseStart);
    return [];
  }
}

/**
 * Handle a single tool call and get the result
 * @param toolCall - The tool call to handle
 * @returns Promise with the tool result
 */
export async function handleToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const handlerStart = performance.now();
  try {
    const { id, function: functionCall } = toolCall;
    const { name, arguments: args } = functionCall;
    
    let content = '';
    let operationName = '';
    
    // Match the function name to the appropriate handler
    if (name === 'searchKnowledge') {
      operationName = 'Knowledge search';
      const searchStart = performance.now();
      content = await handleKnowledgeSearchCall(args);
      trackPerformance(operationName, searchStart);
    } else if (name === 'getWeather') {
      operationName = 'Weather lookup';
      const weatherStart = performance.now();
      content = await handleWeatherCall(args);
      trackPerformance(operationName, weatherStart);
    } else if (name === 'suggestCallback') {
      operationName = 'Callback suggestion';
      const callbackStart = performance.now();
      content = await handleCallbackSuggestion(args);
      trackPerformance(operationName, callbackStart);
    } else if (name === 'suggestCalendlyBooking') {
      operationName = 'Calendly suggestion';
      const calendlyStart = performance.now();
      content = await handleCalendlySuggestion(args);
      trackPerformance(operationName, calendlyStart);
    } else {
      operationName = `Unknown function: ${name}`;
      content = JSON.stringify({ error: `Unknown function: ${name}` });
    }
    
    trackPerformance(`Total tool call: ${operationName}`, handlerStart);
    return {
      tool_call_id: id,
      role: 'tool',
      name,
      content,
    };
  } catch (error) {
    console.error('Error handling tool call:', error);
    trackPerformance('Tool call handling (error)', handlerStart);
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name: toolCall.function.name,
      content: JSON.stringify({ error: 'Tool execution failed', details: String(error) }),
    };
  }
}

/**
 * Handle all tool calls from a response
 * @param response - The raw response from OpenAI API
 * @returns Promise with array of tool results
 */
export async function handleAllToolCalls(response: ToolCallResponse): Promise<ToolResult[]> {
  const allToolsStart = performance.now();
  const toolCalls = parseToolCalls(response);
  const toolResults = await Promise.all(toolCalls.map(handleToolCall));
  trackPerformance(`All tool calls (${toolCalls.length})`, allToolsStart);
  return toolResults;
}

/**
 * Extract citations from a response that used knowledge retrieval
 * @param content - The AI-generated content
 * @param rawSearchResults - The raw search results returned from the tool
 * @returns Array of citations
 */
export function extractCitations(content: string, rawSearchResults: string): Citation[] {
  const citationsStart = performance.now();
  try {
    const searchResults = JSON.parse(rawSearchResults);
    const documents = searchResults.documents || [];
    
    if (documents.length === 0) {
      trackPerformance('Citations extraction (empty)', citationsStart);
      return [];
    }
    
    const citations: Citation[] = [];
    
    // Simple citation extraction - could be enhanced with better NLP
    documents.forEach((doc: any) => {
      const docContent = doc.content || '';
      const sentences = docContent.split(/[.!?]+/).filter(Boolean);
      
      sentences.forEach((sentence: string) => {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length > 10 && content.includes(trimmedSentence)) {
          citations.push({
            text: trimmedSentence,
            documentId: doc.id || 'unknown',
            metadata: {
              source: doc.source || 'unknown',
              title: doc.title || 'Untitled',
              url: doc.url,
            },
          });
        }
      });
    });
    
    trackPerformance(`Citations extraction (found ${citations.length})`, citationsStart);
    return citations;
  } catch (error) {
    console.error('Error extracting citations:', error);
    trackPerformance('Citations extraction (error)', citationsStart);
    return [];
  }
}

/**
 * Assess the confidence of retrieved information
 * @param searchResults - The raw search results
 * @returns Confidence assessment
 */
export function assessConfidence(searchResults: string): ConfidenceAssessment {
  const confidenceStart = performance.now();
  try {
    const results = JSON.parse(searchResults);
    const documents = results.documents || [];
    
    if (documents.length === 0) {
      trackPerformance('Confidence assessment (no docs)', confidenceStart);
      return { score: 0, reasoning: 'No documents were retrieved' };
    }
    
    // Calculate average relevance score
    const totalScore = documents.reduce((sum: number, doc: any) => sum + (doc.relevanceScore || 0), 0);
    const avgScore = totalScore / documents.length;
    
    // Consider the number of sources
    const sourceCount = new Set(documents.map((doc: any) => doc.source)).size;
    const sourceBonus = Math.min(sourceCount / 3, 0.2); // Max 0.2 bonus for multiple sources
    
    // Final confidence score (0-1)
    const confidenceScore = Math.min(avgScore + sourceBonus, 1);
    
    // Generate reasoning
    let reasoning = '';
    if (confidenceScore > 0.8) {
      reasoning = `High confidence with ${documents.length} relevant documents from ${sourceCount} sources`;
    } else if (confidenceScore > 0.5) {
      reasoning = `Moderate confidence with some relevant information from ${sourceCount} sources`;
    } else {
      reasoning = `Low confidence as retrieved information has low relevance scores`;
    }
    
    trackPerformance(`Confidence assessment (score: ${confidenceScore.toFixed(2)})`, confidenceStart);
    return {
      score: confidenceScore,
      reasoning,
    };
  } catch (error) {
    console.error('Error assessing confidence:', error);
    trackPerformance('Confidence assessment (error)', confidenceStart);
    return { score: 0, reasoning: 'Failed to assess confidence due to error' };
  }
}

/**
 * Check if a response needs a callback based on quality assessment
 * @param confidence - The confidence assessment
 * @param responseContent - The response content
 * @param citationsCount - Number of citations
 * @returns Object with needsCallback flag and reason
 */
export function checkIfNeedsCallback(
  confidence: ConfidenceAssessment, 
  responseContent: string,
  citationsCount: number = 0
): { needsCallback: boolean; reason: string } {
  const callbackCheckStart = performance.now();
  const result = detectLowQualityAnswer(confidence, citationsCount, responseContent);
  trackPerformance(`Callback check (needed: ${result.needsCallback})`, callbackCheckStart);
  return result;
}

/**
 * Create a fallback response when retrieval fails
 * @param query - The original query
 * @returns Fallback response
 */
export function createFallbackResponse(query: string): string {
  return JSON.stringify({
    query,
    fallback: true,
    message: 'Knowledge retrieval failed. Please try with more specific information.',
  });
} 