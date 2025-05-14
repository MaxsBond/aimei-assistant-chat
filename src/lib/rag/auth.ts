/**
 * Authentication utilities for RAG-related API calls
 */

/**
 * Get OpenAI API key from environment variables with validation
 * @returns The OpenAI API key
 * @throws Error if the API key is not configured
 */
export function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  return apiKey;
}

/**
 * Get Pinecone API credentials from environment variables
 * @returns Object containing Pinecone API key, environment, and index name
 * @throws Error if any required Pinecone credentials are missing
 */
export function getPineconeCredentials(): {
  apiKey: string;
  environment: string;
  indexName: string;
} {
  const apiKey = process.env.PINECONE_API_KEY;
  const environment = process.env.PINECONE_ENVIRONMENT;
  const indexName = process.env.PINECONE_INDEX;

  if (!apiKey) {
    throw new Error('Pinecone API key is not configured');
  }
  if (!environment) {
    throw new Error('Pinecone environment is not configured');
  }
  if (!indexName) {
    throw new Error('Pinecone index name is not configured');
  }

  return { apiKey, environment, indexName };
}

/**
 * Create authorization headers for OpenAI API requests
 * @returns Headers object with Authorization header
 */
export function createOpenAIHeaders(): HeadersInit {
  const apiKey = getOpenAIApiKey();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
}

/**
 * Create authorization headers for Pinecone API requests
 * @returns Headers object with API key header
 */
export function createPineconeHeaders(): HeadersInit {
  const { apiKey } = getPineconeCredentials();
  return {
    'Content-Type': 'application/json',
    'Api-Key': apiKey,
  };
} 