/**
 * Configuration for Retrieval-Augmented Generation (RAG) capabilities
 */

export const ragConfig = {
  // OpenAI API configuration for the Responses API
  openai: {
    // Base URL for the OpenAI API
    baseUrl: 'https://api.openai.com/v1',
    // API version header
    apiVersion: '2024-07',
    // Default model for retrievals
    model: 'gpt-4o-mini',
    // Temperature for retrieval operations (lower for more factual responses)
    temperature: 0.2,
    // Maximum tokens for completion
    maxTokens: 1000,
    // Vector store ID for file_search
    vectorStoreId: 'vs_681fd0f386388191b8d84c47a952a96b',
  },
  
  // Configuration for the retrieval functionality
  retrieval: {
    // Maximum number of documents to retrieve
    maxResults: 3,
    // Minimum relevance score (0-1) for retrieved documents to be used
    minRelevanceScore: 0.75,
    // Whether to include citations in the response
    includeCitations: true,
    // Maximum tokens to include from each retrieved document
    maxTokensPerDocument: 200,
  },
  
  // Context management
  context: {
    // Maximum tokens to include in the context window
    maxContextTokens: 4000,
    // Strategy for managing context overflow: 'truncate' | 'summarize' | 'filter'
    overflowStrategy: 'filter',
  },

  // User feedback configuration
  feedback: {
    // Whether to enable user feedback on retrieved information
    enabled: true,
    // Types of feedback to collect: relevance, accuracy, helpfulness
    types: ['relevance', 'accuracy', 'helpfulness'],
  }
}; 