/**
 * Knowledge search function definition and implementation for OpenAI to call
 */
import { searchKnowledge } from './vector-store';
import { KnowledgeSearchFunction, SearchParams, Tool } from './types';
import { ragConfig } from './config';

// Performance tracking helper
function trackPerformance(label: string, startTime: number): number {
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`⏱️ RAG-SEARCH: ${label} took ${duration.toFixed(2)}ms`);
  return endTime;
}

/**
 * Function schema definition for OpenAI
 */
export const knowledgeSearchFunctionDefinition: KnowledgeSearchFunction = {
  name: 'searchKnowledge',
  description: 'Search for relevant information in the knowledge base to answer user questions.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find relevant information. Should be specific and focused on what information is needed to answer the user\'s question.',
      },
      limit: {
        type: 'integer',
        description: 'Maximum number of results to return.',
      },
      filters: {
        type: 'object',
        description: 'Optional filters to apply to the search, such as source, topic, or date ranges.',
        properties: {
          source: {
            type: 'string',
            description: 'Filter results by source name.',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Filter results by tags.',
          },
          minDate: {
            type: 'string',
            description: 'Filter results to those created after this date (ISO format).',
          },
          maxDate: {
            type: 'string',
            description: 'Filter results to those created before this date (ISO format).',
          },
        },
      },
    },
    required: ['query'],
  },
};

/**
 * Create a Tool object to include in OpenAI API requests
 */
export const knowledgeSearchTool: Tool = {
  type: 'function',
  function: knowledgeSearchFunctionDefinition,
};

/**
 * Parse arguments from an OpenAI function call
 * @param argsString - JSON string of arguments
 * @returns Parsed arguments or null if parsing fails
 */
export function parseSearchArguments(argsString: string): SearchParams | null {
  try {
    const parsedArgs = JSON.parse(argsString);
    return {
      query: parsedArgs.query,
      limit: parsedArgs.limit || ragConfig.retrieval.maxResults,
      filters: parsedArgs.filters || {},
      includeSources: true,
    };
  } catch (error) {
    console.error('Error parsing search arguments:', error);
    return null;
  }
}

/**
 * Handle a knowledge search function call from OpenAI
 * @param argsString - JSON string of arguments from OpenAI
 * @returns JSON string of search results
 */
export async function handleKnowledgeSearchCall(argsString: string): Promise<string> {
  const totalStartTime = performance.now();
  let currentTime = totalStartTime;
  
  const parseStartTime = performance.now();
  const args = parseSearchArguments(argsString);
  currentTime = trackPerformance('Parse arguments', parseStartTime);
  
  if (!args) {
    trackPerformance('Total (failed parse)', totalStartTime);
    return JSON.stringify({
      error: 'Failed to parse search arguments',
      documents: [],
    });
  }
  
  try {
    // Log the search parameters
    console.log('Searching knowledge with params:', JSON.stringify(args));
    console.log('Searching knowledge with query:', args.query);
    
    // Perform the search
    const searchStartTime = performance.now();
    const results = await searchKnowledge(args);
    currentTime = trackPerformance('Vector search', searchStartTime);
    
    // Format the results
    const formatStartTime = performance.now();
    const formattedResults = JSON.stringify({
      query: args.query,
      totalResults: results.totalResults,
      documents: results.documents.map(doc => ({
        content: doc.content,
        source: doc.metadata.source,
        title: doc.metadata.title || 'Untitled',
        url: doc.metadata.url,
        relevanceScore: doc.score,
      })),
    });
    currentTime = trackPerformance('Format results', formatStartTime);
    
    trackPerformance('Total search time', totalStartTime);
    // Return formatted results
    return formattedResults;
  } catch (error) {
    trackPerformance('Total (error)', totalStartTime);
    console.error('Error handling knowledge search call:', error);
    return JSON.stringify({
      error: 'Failed to search knowledge base',
      documents: [],
    });
  }
} 