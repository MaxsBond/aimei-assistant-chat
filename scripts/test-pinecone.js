// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Check environment variables
console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'Found' : 'Missing');
console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT);
console.log('PINECONE_INDEX:', process.env.PINECONE_INDEX);

// Test connection to Pinecone
async function testPineconeConnection() {
  const indexName = process.env.PINECONE_INDEX;
  const environment = process.env.PINECONE_ENVIRONMENT;
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey || !environment || !indexName) {
    console.error('Missing required Pinecone environment variables');
    return;
  }
  
  try {
    // First, try listing indexes using the global API endpoint
    const controllerUrl = `https://api.pinecone.io/indexes`;
    console.log(`Attempting to connect to global API: ${controllerUrl}`);
    
    const listResponse = await fetch(controllerUrl, {
      headers: {
        'Api-Key': apiKey,
        'X-Pinecone-API-Version': '2024-07'
      }
    });
    
    if (listResponse.ok) {
      const indexData = await listResponse.json();
      console.log('Available indexes:', indexData);
      
      // Find the specific index and get its host
      const indexInfo = indexData.indexes.find(idx => idx.name === indexName);
      if (indexInfo && indexInfo.host) {
        // Next, try to connect to the specific index using the returned host
        const indexUrl = `https://${indexInfo.host}/describe_index_stats`;
        console.log(`Attempting to connect to index host: ${indexUrl}`);
        
        const response = await fetch(indexUrl, {
          headers: {
            'Api-Key': apiKey
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Connection successful!');
          console.log('Index stats:', result);
        } else {
          console.error('Connection failed:', await response.text());
        }
      } else {
        console.error(`Index "${indexName}" not found or missing host information`);
      }
    } else {
      console.error('Failed to list indexes:', await listResponse.text());
    }
  } catch (error) {
    console.error('Error connecting to Pinecone:', error);
  }
}

testPineconeConnection(); 