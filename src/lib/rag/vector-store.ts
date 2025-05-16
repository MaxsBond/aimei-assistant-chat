/**
 * Vector store connection for RAG capabilities
 */
import { createPineconeHeaders, getPineconeCredentials } from './auth';
import { RetrievedDocument, SearchParams, SearchResults } from './types';
import { ragConfig } from './config';

// Performance tracking helper
function trackPerformance(label: string, startTime: number): number {
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`⏱️ VECTOR-STORE: ${label} took ${duration.toFixed(2)}ms`);
  return endTime;
}

/**
 * Get the Pinecone host for the specified index
 * @returns Promise with the host URL
 */
async function getPineconeHost(): Promise<string> {
  const hostStartTime = performance.now();
  const { apiKey, indexName } = getPineconeCredentials();
  
  try {
    // Get the index information from the global API
    const response = await fetch('https://api.pinecone.io/indexes', {
      headers: {
        'Api-Key': apiKey,
        'X-Pinecone-API-Version': '2024-07'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get index information: ${await response.text()}`);
    }
    
    const indexData = await response.json();
    const indexInfo = indexData.indexes.find((idx: any) => idx.name === indexName);
    
    if (!indexInfo || !indexInfo.host) {
      throw new Error(`Index "${indexName}" not found or missing host information`);
    }
    
    trackPerformance('Get Pinecone host', hostStartTime);
    return indexInfo.host;
  } catch (error) {
    console.error('Error getting Pinecone host:', error);
    throw error;
  }
}

/**
 * Query embeddings from Pinecone vector store
 * @param vector - The embedding vector to query with
 * @param options - Query options including top_k, filters, etc.
 * @returns Promise with query results
 */
export async function queryPinecone(
  vector: number[],
  options: {
    topK?: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
    includeValues?: boolean;
    namespace?: string;
  } = {}
): Promise<any> {
  const queryStartTime = performance.now();
  const { topK = ragConfig.retrieval.maxResults, filter, includeMetadata = true, includeValues = false, namespace } = options;
  
  try {
    const hostTime = performance.now();
    const host = await getPineconeHost();
    trackPerformance('Get host in queryPinecone', hostTime);
    
    const queryUrl = `https://${host}/query`;
    const headers = createPineconeHeaders();
    
    const fetchTime = performance.now();
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vector,
        topK,
        filter,
        includeMetadata,
        includeValues,
        namespace,
      }),
    });
    trackPerformance('Pinecone API request', fetchTime);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinecone query error: ${error.message || response.statusText}`);
    }
    
    const parseTime = performance.now();
    const results = await response.json();
    trackPerformance('Parse Pinecone response', parseTime);
    
    trackPerformance('Total queryPinecone', queryStartTime);
    return results;
  } catch (error) {
    console.error('Vector store query error:', error);
    throw error;
  }
}

/**
 * Generate embeddings for a text using OpenAI's embeddings API
 * @param text - The text to generate embeddings for
 * @returns Promise with the embedding vector
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  const embedStartTime = performance.now();
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Generating embeddings for text:', text.substring(0, 50) + '...');

    const fetchTime = performance.now();
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large', // Use the latest embedding model
        input: text,
      }),
    });
    trackPerformance('OpenAI embeddings API request', fetchTime);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const parseTime = performance.now();
    const data = await response.json();
    trackPerformance('Parse embeddings response', parseTime);
    
    trackPerformance('Total embeddings generation', embedStartTime);
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Search knowledge base for relevant information
 * @param params - Search parameters
 * @returns Search results with matching documents
 */
export async function searchKnowledge(params: SearchParams): Promise<SearchResults> {
  const searchStartTime = performance.now();
  let currentTime = searchStartTime;
  
  const { query, limit = 3, filters, includeSources = true } = params;
  
  console.log('Searching knowledge with query:', query);
  
  try {
    // Generate embeddings for the query
    const embedTime = performance.now();
    const embedding = await generateEmbeddings(query);
    currentTime = trackPerformance('Generate embeddings', embedTime);
    
    // Get the Pinecone index host
    const hostTime = performance.now();
    const host = await getPineconeHost();
    const { apiKey } = getPineconeCredentials();
    currentTime = trackPerformance('Get Pinecone host', hostTime);
    
    // Query the vector store
    const queryTime = performance.now();
    const response = await fetch(`https://${host}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        vector: embedding,
        topK: limit,
        includeMetadata: true,
      }),
    });
    currentTime = trackPerformance('Pinecone query request', queryTime);
    
    if (!response.ok) {
      throw new Error(`Vector store query failed with status ${response.status}: ${await response.text()}`);
    }
    
    const parseTime = performance.now();
    const data = await response.json();
    const matches = data.matches || [];
    currentTime = trackPerformance('Parse Pinecone query response', parseTime);
    
    // Validate and process matches
    const processTime = performance.now();
    const documents = matches.map((match: any) => {
      const metadata = match.metadata || {};
      
      return {
        id: match.id,
        content: metadata.content || 'No content available',
        score: match.score,
        metadata: {
          source: metadata.source || 'unknown',
          title: metadata.title || 'Untitled Document',
          url: metadata.url,
          chunkIndex: metadata.chunkIndex,
        },
      };
    });
    currentTime = trackPerformance('Process matches', processTime);
    
    console.log(`Found ${documents.length} relevant documents for query: "${query}"`);
    
    trackPerformance('Total searchKnowledge', searchStartTime);
    return {
      documents,
      totalResults: documents.length,
    };
  } catch (error) {
    console.error('Search knowledge error:', error);
    trackPerformance('Total searchKnowledge (error)', searchStartTime);
    // Return empty results on error
    return {
      documents: [],
      totalResults: 0,
    };
  }
}

/**
 * Format search results for AI consumption
 * @param results - The search results to format
 * @returns Formatted string of search results for the AI
 */
export function formatSearchResultsForAI(results: SearchResults): string {
  if (results.totalResults === 0) {
    return JSON.stringify({
      message: 'No relevant information found.',
      documents: []
    });
  }
  
  const formattedDocuments = results.documents.map(doc => ({
    id: doc.id,
    content: doc.content,
    metadata: {
      source: doc.metadata.source,
      title: doc.metadata.title,
      url: doc.metadata.url,
    },
    relevanceScore: doc.score,
  }));
  
  return JSON.stringify({
    message: `Found ${results.totalResults} relevant documents.`,
    documents: formattedDocuments,
  });
} 