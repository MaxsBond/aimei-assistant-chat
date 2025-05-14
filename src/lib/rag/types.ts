/**
 * Types for the RAG (Retrieval-Augmented Generation) functionality
 */

// Retrieved document from vector store
export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  score: number; // Relevance score (0-1)
}

// Metadata for retrieved documents
export interface DocumentMetadata {
  source: string;
  title?: string;
  url?: string;
  author?: string;
  createdAt?: string;
  tags?: string[];
  [key: string]: any; // Allow for additional custom metadata
}

// Citation for sources used in responses
export interface Citation {
  text: string; // The text that is being cited
  documentId: string; // ID of the source document
  metadata: DocumentMetadata; // Metadata of the source
}

// Search parameters for knowledge retrieval
export interface SearchParams {
  query: string;
  limit?: number;
  filters?: Record<string, any>;
  includeSources?: boolean;
}

// Search results returned from knowledge base
export interface SearchResults {
  documents: RetrievedDocument[];
  totalResults: number;
}

// Function schema for OpenAI to call
export interface KnowledgeSearchFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// OpenAI tool configuration
export interface Tool {
  type: string;
  function: KnowledgeSearchFunction;
}

// Tool call request from OpenAI
export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

// OpenAI assistant response with tool calls
export interface ToolCallResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
}

// Tool response to send back to OpenAI
export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string; // JSON string of search results
}

// Extension of existing Message type to include citations
export interface MessageWithCitations {
  role: string;
  content: string;
  citations?: Citation[];
}

// RAG request configuration
export interface RAGRequestConfig {
  enableRetrieval: boolean;
  retrievalOptions?: {
    maxResults?: number;
    minRelevanceScore?: number;
    includeCitations?: boolean;
  };
}

// Confidence assessment for retrieved information
export interface ConfidenceAssessment {
  score: number; // 0-1 where 1 is highest confidence
  reasoning: string; // Why this confidence level was assigned
} 