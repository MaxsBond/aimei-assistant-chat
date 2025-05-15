/**
 * Process responses from OpenAI that involve function calling and knowledge retrieval
 */
import { Citation, ConfidenceAssessment, ToolCall, ToolCallResponse, ToolResult } from './types';
import { handleKnowledgeSearchCall } from './search-function';
import { handleWeatherCall } from '../functions/weather-function';
import { handleCallbackSuggestion } from '../functions/callback-function';
import { handleCalendlySuggestion } from '../functions/calendly-function';
import { detectLowQualityAnswer, getAnswerQualityAssessment } from './answer-quality';

/**
 * Parse function calls from OpenAI response
 * @param response - The raw response from OpenAI API
 * @returns Array of tool calls or empty array if none
 */
export function parseToolCalls(response: ToolCallResponse): ToolCall[] {
  try {
    const toolCalls = response.choices[0]?.message?.tool_calls;
    return toolCalls || [];
  } catch (error) {
    console.error('Error parsing tool calls:', error);
    return [];
  }
}

/**
 * Handle a single tool call and get the result
 * @param toolCall - The tool call to handle
 * @returns Promise with the tool result
 */
export async function handleToolCall(toolCall: ToolCall): Promise<ToolResult> {
  try {
    const { id, function: functionCall } = toolCall;
    const { name, arguments: args } = functionCall;
    
    let content = '';
    
    // Match the function name to the appropriate handler
    if (name === 'searchKnowledge') {
      content = await handleKnowledgeSearchCall(args);
    } else if (name === 'getWeather') {
      content = await handleWeatherCall(args);
    } else if (name === 'suggestCallback') {
      content = await handleCallbackSuggestion(args);
    } else if (name === 'suggestCalendlyBooking') {
      content = await handleCalendlySuggestion(args);
    } else {
      content = JSON.stringify({ error: `Unknown function: ${name}` });
    }
    
    return {
      tool_call_id: id,
      role: 'tool',
      name,
      content,
    };
  } catch (error) {
    console.error('Error handling tool call:', error);
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
  const toolCalls = parseToolCalls(response);
  const toolResults = await Promise.all(toolCalls.map(handleToolCall));
  return toolResults;
}

/**
 * Extract citations from a response that used knowledge retrieval
 * @param content - The AI-generated content
 * @param rawSearchResults - The raw search results returned from the tool
 * @returns Array of citations
 */
export function extractCitations(content: string, rawSearchResults: string): Citation[] {
  try {
    const searchResults = JSON.parse(rawSearchResults);
    const documents = searchResults.documents || [];
    
    if (documents.length === 0) {
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
    
    return citations;
  } catch (error) {
    console.error('Error extracting citations:', error);
    return [];
  }
}

/**
 * Assess the confidence of retrieved information
 * @param searchResults - The raw search results
 * @returns Confidence assessment
 */
export function assessConfidence(searchResults: string): ConfidenceAssessment {
  try {
    const results = JSON.parse(searchResults);
    const documents = results.documents || [];
    
    if (documents.length === 0) {
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
    
    return {
      score: confidenceScore,
      reasoning,
    };
  } catch (error) {
    console.error('Error assessing confidence:', error);
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
  return detectLowQualityAnswer(confidence, citationsCount, responseContent);
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