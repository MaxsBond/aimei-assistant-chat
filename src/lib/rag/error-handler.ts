/**
 * Error handling utilities for RAG functionality
 */
import { RetrievedDocument } from './types';

export enum RAGErrorType {
  API_ERROR = 'api_error',
  VECTOR_STORE_ERROR = 'vector_store_error',
  EMBEDDING_ERROR = 'embedding_error',
  TOOL_CALL_ERROR = 'tool_call_error',
  CONTEXT_ERROR = 'context_error',
  PARSE_ERROR = 'parse_error',
  AUTH_ERROR = 'auth_error',
}

export interface RAGError {
  type: RAGErrorType;
  message: string;
  originalError?: any;
  timestamp: Date;
  statusCode?: number;
}

/**
 * Create a structured RAG error object
 */
export function createRAGError(
  type: RAGErrorType,
  message: string,
  originalError?: any,
  statusCode?: number
): RAGError {
  return {
    type,
    message,
    originalError,
    timestamp: new Date(),
    statusCode,
  };
}

/**
 * Standardized error handling for RAG operations
 */
export function handleRAGError(error: any, defaultMessage: string, type: RAGErrorType): RAGError {
  console.error(`RAG Error (${type}):`, error);
  
  const statusCode = error?.status || error?.statusCode || 
    (error?.response ? error.response.status : undefined);
  
  let errorMessage = defaultMessage;
  
  // Extract the most useful error message
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error?.message) {
    errorMessage = error.error.message;
  } else if (error?.response?.data?.error) {
    errorMessage = typeof error.response.data.error === 'string' 
      ? error.response.data.error 
      : error.response.data.error.message || defaultMessage;
  }
  
  return createRAGError(type, errorMessage, error, statusCode);
}

/**
 * Generate user-friendly error messages based on error type
 */
export function getUserFriendlyErrorMessage(error: RAGError): string {
  switch (error.type) {
    case RAGErrorType.API_ERROR:
      return "Sorry, I couldn't connect to the AI service. Please try again later.";
    
    case RAGErrorType.VECTOR_STORE_ERROR:
      return "I'm having trouble accessing my knowledge base right now. Let me answer without it.";
    
    case RAGErrorType.EMBEDDING_ERROR:
      return "I encountered an issue processing your query for knowledge retrieval.";
    
    case RAGErrorType.TOOL_CALL_ERROR:
      return "I had a problem using my knowledge tools. I'll try to answer with what I know.";
    
    case RAGErrorType.CONTEXT_ERROR:
      return "I had trouble organizing information from my knowledge sources.";
    
    case RAGErrorType.PARSE_ERROR:
      return "I had trouble understanding the information from my knowledge base.";
    
    case RAGErrorType.AUTH_ERROR:
      return "I'm having authentication issues with my knowledge services.";
    
    default:
      return "I encountered an unexpected issue. Let me try to answer without using my knowledge base.";
  }
}

/**
 * Check if a retrieval was successful based on results
 */
export function isRetrievalSuccessful(documents: RetrievedDocument[]): boolean {
  // Consider retrieval successful if we have at least one document with a decent score
  return documents.length > 0 && documents.some(doc => doc.score > 0.6);
}

/**
 * Generate feedback request for user based on retrieval results
 */
export function generateFeedbackRequest(isHelpful: boolean): string {
  if (isHelpful) {
    return "Was this information helpful? Your feedback helps me improve.";
  } else {
    return "I might not have found the most relevant information. Could you rephrase your question?";
  }
}

/**
 * Implement a safe retry mechanism for RAG operations
 */
export async function safeRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  errorType: RAGErrorType,
  errorMessage: string
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't wait on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(100 * Math.pow(2, attempt), 1000) + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw handleRAGError(lastError, errorMessage, errorType);
} 