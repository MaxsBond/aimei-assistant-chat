#!/usr/bin/env node
/**
 * This script tests the new OpenAI Responses API for RAG capabilities
 * using file_search with our vector store.
 */
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

const VECTOR_STORE_ID = 'vs_681fd0f386388191b8d84c47a952a96b';

// Get command line arguments
const args = process.argv.slice(2);
const query = args[0] || 'What are the main features of the application?';

async function main() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('ERROR: OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    console.log(`Testing RAG with query: "${query}"`);
    console.log(`Using vector store: ${VECTOR_STORE_ID}`);
    console.log('--------------------------------------------------');

    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.time('Response time');
    // Use the OpenAI Responses API with file_search tool
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      tools: [{
        type: "file_search",
        vector_store_ids: [VECTOR_STORE_ID],
        max_num_results: 5
      }],
      input: query
    });
    console.timeEnd('Response time');

    console.log('\nAPI Response Structure:');
    console.log(JSON.stringify(response, null, 2));

    // Extract the content from the response
    let finalContent = '';
    console.log('\n--------------------------------------------------');
    console.log('Analyzing Response Structure:');
    
    if (response.output && response.output.length > 0) {
      // Examine the structure of each output object
      response.output.forEach((output, index) => {
        console.log(`\nOutput ${index + 1} type:`, typeof output);
        console.log(`Output ${index + 1} keys:`, Object.keys(output));
        
        // Check for text property
        if (output.text) {
          console.log(`Output ${index + 1} has direct text property:`, output.text.substring(0, 100) + '...');
          finalContent += output.text;
        }
        
        // Check for content property
        if (output.content) {
          console.log(`Output ${index + 1} content type:`, typeof output.content);
          
          if (typeof output.content === 'string') {
            console.log(`Output ${index + 1} content (string):`, output.content.substring(0, 100) + '...');
            finalContent += output.content;
          } else if (Array.isArray(output.content)) {
            console.log(`Output ${index + 1} content is array with ${output.content.length} items`);
            
            output.content.forEach((item, i) => {
              console.log(`  - Content item ${i} type:`, typeof item);
              console.log(`  - Content item ${i} keys:`, Object.keys(item));
              
              if (item.text) {
                console.log(`  - Content item ${i} text:`, item.text.substring(0, 100) + '...');
                finalContent += item.text;
              }
            });
          }
        }
      });
    }

    console.log('\n--------------------------------------------------');
    console.log('Final Content:');
    console.log(finalContent);
    
    // Try to extract citations or search results
    console.log('\n--------------------------------------------------');
    console.log('Attempting to extract citations:');
    
    try {
      let citations = [];
      
      if (response.output && response.output.length > 0) {
        for (const output of response.output) {
          if (output.annotations) {
            citations = output.annotations;
            break;
          } else if (output.content && output.content[0] && output.content[0].annotations) {
            citations = output.content[0].annotations;
            break;
          } else if (output.file_search_call && output.file_search_call.search_results) {
            citations = output.file_search_call.search_results;
            break;
          }
        }
      }
      
      if (citations.length > 0) {
        console.log(`Found ${citations.length} citations:`);
        citations.forEach((citation, i) => {
          console.log(`\nCitation ${i + 1}:`);
          console.log(JSON.stringify(citation, null, 2));
        });
      } else {
        console.log('No explicit citations found in the response.');
      }
    } catch (err) {
      console.error('Error parsing citations:', err);
    }

    // Inspect content items and annotations
    if (response.output && response.output.length > 0) {
      for (const output of response.output) {
        if (output.type === 'message' && output.content && Array.isArray(output.content)) {
          console.log('\n==== Analyzing Message Content Structure ====');
          output.content.forEach((contentItem, i) => {
            console.log(`\nContent Item ${i + 1}:`);
            console.log(`- Type: ${typeof contentItem}`);
            console.log(`- Keys: ${Object.keys(contentItem).join(', ')}`);
            console.log(`- Has text: ${!!contentItem.text}`);
            console.log(`- Has annotations: ${!!contentItem.annotations}`);
            
            if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
              console.log(`\n  Found ${contentItem.annotations.length} annotations:`);
              contentItem.annotations.forEach((anno, j) => {
                console.log(`\n  Annotation ${j + 1}:`);
                console.log(`  - Type: ${anno.type}`);
                console.log(`  - Structure: ${JSON.stringify(anno, null, 2)}`);
                
                // Specifically check for file_citation structure
                if (anno.type === 'file_citation') {
                  console.log('\n  FOUND FILE CITATION:');
                  console.log(`  - File Citation Keys: ${Object.keys(anno.file_citation || {}).join(', ')}`);
                  if (anno.file_citation) {
                    console.log(`  - File ID: ${anno.file_citation.file_id}`);
                    console.log(`  - Filename: ${anno.file_citation.filename}`);
                    console.log(`  - Quote: ${anno.file_citation.quote}`);
                  }
                }
              });
            }
          });
        }
        
        if (output.type === 'file_search_call') {
          console.log('\n==== Analyzing File Search Call ====');
          console.log(`Has results: ${!!output.results}`);
          if (output.results && Array.isArray(output.results)) {
            console.log(`Found ${output.results.length} search results`);
            output.results.forEach((result, i) => {
              console.log(`\nResult ${i + 1}:`);
              console.log(`- File ID: ${result.file_id}`);
              console.log(`- Filename: ${result.filename}`);
              console.log(`- Text: ${result.text ? result.text.substring(0, 100) + '...' : 'N/A'}`);
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
  }
}

main(); 