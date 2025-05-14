// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function getPineconeHost() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;
  
  try {
    console.log('Getting Pinecone host for index:', indexName);
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
    const indexInfo = indexData.indexes.find(idx => idx.name === indexName);
    
    if (!indexInfo || !indexInfo.host) {
      throw new Error(`Index "${indexName}" not found or missing host information`);
    }
    
    console.log('Found Pinecone host:', indexInfo.host);
    return indexInfo.host;
  } catch (error) {
    console.error('Error getting Pinecone host:', error);
    throw error;
  }
}

async function generateEmbeddings(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  try {
    console.log('Generating embeddings for query:', text);
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('Successfully generated embeddings with dimensions:', data.data[0].embedding.length);
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

async function searchVectorStore(query) {
  try {
    // Generate embeddings
    const embedding = await generateEmbeddings(query);
    
    // Get Pinecone host
    const host = await getPineconeHost();
    const apiKey = process.env.PINECONE_API_KEY;
    
    console.log('Searching vector store with query:', query);
    
    // Query Pinecone
    const response = await fetch(`https://${host}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vector store query failed: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('\nSearch Results:');
    console.log('='.repeat(50));
    
    if (data.matches && data.matches.length > 0) {
      console.log(`Found ${data.matches.length} relevant documents`);
      
      data.matches.forEach((match, i) => {
        console.log(`\nResult ${i+1} (Score: ${match.score.toFixed(4)}):`);
        console.log(`ID: ${match.id}`);
        console.log(`Content: ${match.metadata.content?.substring(0, 200)}...`);
        console.log(`Source: ${match.metadata.source || 'unknown'}`);
        console.log('-'.repeat(50));
      });
      
      return data.matches;
    } else {
      console.log('No matches found');
      return [];
    }
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

// Run the test with a sample query
const query = process.argv[2] || 'What is Spray-Net?';
console.log('Testing vector search with query:', query);
searchVectorStore(query); 