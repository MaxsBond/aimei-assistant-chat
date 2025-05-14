// Load environment variables
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testChatWithRAG() {
  try {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is Spray-Net?' }
    ];

    console.log('Testing chat API with RAG enabled...');
    console.log('Query:', messages[1].content);
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        enableRAG: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\nRESULT:');
    console.log('='.repeat(50));
    console.log('Assistant Response:', data.message.content);
    
    if (data.message.citations && data.message.citations.length > 0) {
      console.log('\nCitations:');
      data.message.citations.forEach((citation, index) => {
        console.log(`[${index + 1}] ${citation.text}`);
        console.log(`    Source: ${citation.metadata.source}`);
        console.log('-'.repeat(50));
      });
    }
    
    console.log('\nRAG Metadata:');
    console.log('Used:', data.rag.used);
    console.log('Confidence:', data.rag.confidence);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testChatWithRAG(); 