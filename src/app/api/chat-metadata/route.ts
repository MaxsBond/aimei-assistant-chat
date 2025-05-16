import { NextRequest, NextResponse } from 'next/server';
import { Message } from '@/lib/api';
import { knowledgeSearchTool } from '@/lib/rag/search-function';
import { callbackTool } from '@/lib/functions/callback-function';
import { 
  extractCitations,
  assessConfidence,
  checkIfNeedsCallback
} from '@/lib/rag/response-processor';
import { ragConfig } from '@/lib/rag/config';

/**
 * API route to extract metadata for a streamed response
 * This is used to provide citations, callback info, and other metadata
 * after streaming is complete, to avoid breaking the stream.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, content, enableRAG, enableFunctions } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    // Get content from the last assistant message if not explicitly provided
    const effectiveContent = content || 
      messages.filter(m => m.role === 'assistant').pop()?.content || '';
    
    const metadata: Record<string, any> = {};
    
    // Only process citations if RAG is enabled
    if (enableRAG) {
      try {
        console.log('Processing RAG metadata for streamed content');
        // Run a search with the final content to get citations
        const searchTool = knowledgeSearchTool.function;
        
        // Extract the user's last question from messages
        const lastUserMessage = [...messages]
          .reverse()
          .find(msg => msg.role === 'user')?.content;
          
        if (lastUserMessage) {
          const searchResult = await fetch('/api/knowledge/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: lastUserMessage,
              k: ragConfig.retrieval.maxResults
            }),
          });
          
          if (searchResult.ok) {
            const searchData = await searchResult.json();
            console.log(`✅ Knowledge search successful, found ${searchData.totalResults || 0} results`);
            
            // Extract citations from the response
            if (ragConfig.retrieval.includeCitations) {
              const citations = extractCitations(effectiveContent, JSON.stringify(searchData));
              if (citations.length > 0) {
                metadata.citations = citations;
                console.log(`📚 Extracted ${citations.length} citations from content`);
              } else {
                console.log('⚠️ No citations extracted from content');
              }
            }
            
            // Assess confidence and check if callback is needed
            const confidence = assessConfidence(JSON.stringify(searchData));
            metadata.rag = {
              used: true,
              confidence: confidence.score
            };
            
            // Determine if the response needs a callback option
            const { needsCallback, reason } = checkIfNeedsCallback(
              confidence,
              effectiveContent,
              metadata.citations?.length || 0
            );
            
            if (needsCallback) {
              metadata.callback = {
                needed: needsCallback,
                reason: reason
              };
            }
          } else {
            const errorText = await searchResult.text();
            console.error(`❌ Knowledge search API error: ${searchResult.status} - ${errorText}`);
          }
        }
      } catch (error) {
        console.error('Error processing RAG metadata:', error);
        // Continue without RAG metadata
      }
    }
    
    // Handle function-specific metadata if needed
    if (enableFunctions) {
      // Check for calendly patterns in the content
      if (effectiveContent.includes('schedule a meeting') || 
          effectiveContent.includes('book a time') || 
          effectiveContent.includes('book an appointment')) {
        metadata.calendly = {
          show: true,
          reason: "Response suggests scheduling a meeting"
        };
      }
    }
    
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Server error in chat-metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 