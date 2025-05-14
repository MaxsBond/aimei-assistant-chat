/**
 * Context management utilities for RAG capabilities
 */
import { Message } from '@/lib/api';
import { RetrievedDocument } from './types';
import { ragConfig } from './config';

// Approximate token count based on characters
// This is a simple approximation, actual token count varies based on tokenizer
const APPROX_CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for a string
 * @param text - The text to estimate tokens for
 * @returns Approximate token count
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

/**
 * Estimate token count for a conversation
 * @param messages - The conversation messages
 * @returns Estimated token count
 */
export function estimateConversationTokens(messages: Message[]): number {
  return messages.reduce((total, message) => {
    // Count message content tokens
    let messageTokens = estimateTokenCount(message.content);
    
    // Add overhead for message formatting (role, formatting chars, etc)
    messageTokens += 4; // Approximate overhead per message
    
    return total + messageTokens;
  }, 0);
}

/**
 * Fit retrieved documents into available context window
 * @param documents - Retrieved documents to fit
 * @param maxTokens - Maximum tokens available for documents
 * @returns Documents truncated to fit token limit
 */
export function fitDocumentsToContextWindow(
  documents: RetrievedDocument[],
  maxTokens: number = ragConfig.context.maxContextTokens
): RetrievedDocument[] {
  // Sort by relevance score (highest first)
  const sortedDocs = [...documents].sort((a, b) => b.score - a.score);
  
  const result: RetrievedDocument[] = [];
  let totalTokens = 0;
  
  for (const doc of sortedDocs) {
    const docTokens = estimateTokenCount(doc.content);
    
    if (totalTokens + docTokens <= maxTokens) {
      // Document fits completely
      result.push(doc);
      totalTokens += docTokens;
    } else {
      // Truncate document to fit remaining space
      const remainingTokens = maxTokens - totalTokens;
      if (remainingTokens > 50) { // Only include if we can keep a meaningful amount
        const truncatedContent = truncateText(doc.content, remainingTokens);
        result.push({
          ...doc,
          content: truncatedContent,
        });
      }
      break; // We've filled the available space
    }
  }
  
  return result;
}

/**
 * Truncate text to an approximate token count
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens to keep
 * @returns Truncated text
 */
export function truncateText(text: string, maxTokens: number): string {
  const approxCharLimit = maxTokens * APPROX_CHARS_PER_TOKEN;
  if (text.length <= approxCharLimit) return text;
  
  // Truncate to character limit
  const truncated = text.substring(0, approxCharLimit);
  
  // Find the last sentence boundary to make truncation more natural
  const sentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (sentenceEnd > approxCharLimit * 0.7) {
    // Only use sentence boundary if it doesn't cut off too much text
    return truncated.substring(0, sentenceEnd + 1) + ' [...]';
  }
  
  return truncated + ' [...]';
}

/**
 * Filter documents by relevance
 * @param documents - Documents to filter
 * @param minScore - Minimum relevance score (0-1)
 * @returns Filtered documents
 */
export function filterDocumentsByRelevance(
  documents: RetrievedDocument[],
  minScore: number = ragConfig.retrieval.minRelevanceScore
): RetrievedDocument[] {
  return documents.filter(doc => doc.score >= minScore);
}

/**
 * Build context from retrieved documents
 * @param documents - Retrieved documents
 * @returns Formatted context string
 */
export function buildRetrievalContext(documents: RetrievedDocument[]): string {
  if (documents.length === 0) return '';
  
  return documents.map((doc, index) => {
    const sourceInfo = doc.metadata.title 
      ? `${doc.metadata.source}: ${doc.metadata.title}` 
      : doc.metadata.source;
    
    return `===== DOCUMENT ${index + 1}: ${sourceInfo} =====\n${doc.content}\n`;
  }).join('\n');
}

/**
 * Manage context window for a conversation with retrieved information
 * @param messages - Current conversation messages
 * @param retrievedDocuments - Documents retrieved for the query
 * @returns Object with optimized messages and context
 */
export function manageContextWindow(
  messages: Message[],
  retrievedDocuments: RetrievedDocument[]
): { optimizedMessages: Message[], retrievalContext: string } {
  // Step 1: Calculate tokens used by conversation history
  const conversationTokens = estimateConversationTokens(messages);
  
  // Step 2: Determine available space for retrieved documents
  const maxContextTokens = ragConfig.context.maxContextTokens;
  const availableTokens = Math.max(0, maxContextTokens - conversationTokens);
  
  // Step 3: Filter documents by relevance
  const relevantDocuments = filterDocumentsByRelevance(retrievedDocuments);
  
  // Step 4: Fit documents to available space
  const fittedDocuments = fitDocumentsToContextWindow(relevantDocuments, availableTokens);
  
  // Step 5: Build context from fitted documents
  const retrievalContext = buildRetrievalContext(fittedDocuments);
  
  // Step 6: If still too large, truncate message history
  let optimizedMessages = [...messages];
  if (conversationTokens + estimateTokenCount(retrievalContext) > maxContextTokens) {
    // Keep the most recent messages and system message
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system')
      .slice(-Math.floor((maxContextTokens - estimateTokenCount(retrievalContext)) / 50)); // Rough approximation
    
    optimizedMessages = [...systemMessages, ...nonSystemMessages];
  }
  
  return {
    optimizedMessages,
    retrievalContext,
  };
} 