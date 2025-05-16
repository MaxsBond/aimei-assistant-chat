import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge } from '@/lib/rag/vector-store';
import { ragConfig } from '@/lib/rag/config';

/**
 * API route for searching the knowledge base
 * This route is used by the RAG system to find relevant documents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, k = ragConfig.retrieval.maxResults, filters } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Knowledge search API called with query: "${query.substring(0, 50)}..."`);
    
    // Search the knowledge base with the provided parameters
    const searchParams = {
      query,
      limit: k,
      filters: filters || {},
      includeSources: true
    };
    
    const results = await searchKnowledge(searchParams);
    
    // Return the search results
    return NextResponse.json(results);
  } catch (error) {
    console.error('Knowledge search API error:', error);
    return NextResponse.json(
      { error: 'Error searching knowledge base', details: (error as Error).message },
      { status: 500 }
    );
  }
} 