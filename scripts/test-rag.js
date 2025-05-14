// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Function to get OpenAI embeddings
async function getEmbeddings(text) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    console.log('Generating embeddings for query:', text);
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

// Function to get Pinecone host
async function getPineconeHost() {
  const indexName = process.env.PINECONE_INDEX;
  const apiKey = process.env.PINECONE_API_KEY;
  
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
    const indexInfo = indexData.indexes.find(idx => idx.name === indexName);
    
    if (!indexInfo || !indexInfo.host) {
      throw new Error(`Index "${indexName}" not found or missing host information`);
    }
    
    return indexInfo.host;
  } catch (error) {
    console.error('Error getting Pinecone host:', error);
    throw error;
  }
}

// Function to query Pinecone
async function queryPinecone(vector, topK = 3) {
  try {
    const host = await getPineconeHost();
    const apiKey = process.env.PINECONE_API_KEY;
    const queryUrl = `https://${host}/query`;
    
    console.log('Querying Pinecone at:', queryUrl);
    
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        vector,
        topK,
        includeMetadata: true,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinecone query error: ${JSON.stringify(error)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Vector store query error:', error);
    throw error;
  }
}

async function testRagSystem() {
  try {
    // Test query about franchise fee
    const testQuery = "What is Spray-Net?";
    
    console.log('Test Query:', testQuery);
    
    // Generate query embeddings
    const queryEmbedding = await getEmbeddings(testQuery);
    console.log('Generated embeddings with length:', queryEmbedding.length);
    
    // Query vector database
    const queryResult = await queryPinecone(queryEmbedding);
    
    // Process and display results
    console.log('\nRESULTS:');
    console.log('='.repeat(50));
    
    if (queryResult.matches && queryResult.matches.length > 0) {
      console.log(`Found ${queryResult.matches.length} relevant documents\n`);
      
      queryResult.matches.forEach((match, i) => {
        console.log(`[${i+1}] Score: ${match.score.toFixed(4)}`);
        console.log('Content:', match.metadata.content.substring(0, 200) + '...');
        console.log('-'.repeat(50));
      });
    } else {
      console.log('No matches found in the knowledge base');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testRagSystem(); 