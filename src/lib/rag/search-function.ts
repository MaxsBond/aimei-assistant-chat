/**
 * Knowledge search function definition and implementation for OpenAI to call
 */
import { searchKnowledge } from './vector-store';
import { KnowledgeSearchFunction, SearchParams, Tool } from './types';
import { ragConfig } from './config';

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
  const args = parseSearchArguments(argsString);
  
  if (!args) {
    return JSON.stringify({
      error: 'Failed to parse search arguments',
      documents: [],
    });
  }
  
  try {
    // Log the search parameters
    console.log('Searching knowledge with params:', JSON.stringify(args));
    
    // Perform the search
    const results = await searchKnowledge(args);
    
    // Return formatted results
    return JSON.stringify({
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
  } catch (error) {
    console.error('Error handling knowledge search call:', error);
    return JSON.stringify({
      error: 'Failed to search knowledge base',
      documents: [],
    });
  }
} 