import fs from 'fs';
import path from 'path';
import { createPineconeHeaders, getPineconeCredentials } from '../src/lib/rag/auth';

// Get Pinecone host for a specific index
async function getPineconeHost(): Promise<string> {
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
    
    return indexInfo.host;
  } catch (error) {
    console.error('Error getting Pinecone host:', error);
    throw error;
  }
}

// Function to get OpenAI embeddings
async function getEmbeddings(text: string): Promise<number[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
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

// Split text into chunks for processing
function splitTextIntoChunks(text: string, maxChunkSize: number = 4000): string[] {
  // Simple chunking by paragraphs and then size
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Function to upload vectors to Pinecone
async function uploadVectorsToPinecone(vectors: any[]): Promise<void> {
  const host = await getPineconeHost();
  const upsertUrl = `https://${host}/vectors/upsert`;
  const headers = createPineconeHeaders();

  try {
    const response = await fetch(upsertUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vectors,
        namespace: '', // Use default namespace
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinecone API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log('Upload result:', result);
  } catch (error) {
    console.error('Error uploading vectors to Pinecone:', error);
    throw error;
  }
}

// Process a directory of documents
async function processDocuments(
  directoryPath: string, 
  metadataFn?: (filePath: string) => Record<string, any>
): Promise<void> {
  // Get all files in the directory
  const files = fs.readdirSync(directoryPath)
    .filter(file => file.endsWith('.txt') || file.endsWith('.md'));

  let successCount = 0;
  let errorCount = 0;

  console.log(`Processing ${files.length} files...`);

  for (const file of files) {
    try {
      const filePath = path.join(directoryPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Generate metadata
      const metadata = metadataFn ? metadataFn(filePath) : {
        source: file,
        title: file.replace(/\.(txt|md)$/, ''),
        url: '',
        author: '',
        createdAt: new Date().toISOString(),
      };

      // Split content into chunks
      const chunks = splitTextIntoChunks(content);
      console.log(`Split "${file}" into ${chunks.length} chunks`);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${file.replace(/\.(txt|md)$/, '')}-chunk-${i}`;
        
        // Generate embedding
        const embedding = await getEmbeddings(chunk);
        
        // Create vector object
        const vector = {
          id: chunkId,
          values: embedding,
          metadata: {
            ...metadata,
            content: chunk,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
        };

        // Upload in batches of 1 for simplicity
        // For production, batch multiple vectors in one request
        await uploadVectorsToPinecone([vector]);
        console.log(`Uploaded chunk ${i+1}/${chunks.length} for file "${file}"`);
      }

      successCount++;
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
      errorCount++;
    }
  }

  console.log(`\nProcessing complete: ${successCount} files successful, ${errorCount} files with errors`);
}

// Example metadata extractor for Markdown files
function extractMarkdownMetadata(filePath: string): Record<string, any> {
  const content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  
  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : filename.replace(/\.md$/, '');
  
  // Very simple frontmatter extraction (you can enhance this)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let metadata: Record<string, any> = {
    source: 'markdown',
    title,
    url: '',
    author: '',
    createdAt: new Date().toISOString(),
  };
  
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        if (value) metadata[key.trim()] = value;
      }
    }
  }
  
  return metadata;
}

// Main function
async function main() {
  // Ensure environment variables are loaded
  if (!process.env.OPENAI_API_KEY || 
      !process.env.PINECONE_API_KEY || 
      !process.env.PINECONE_ENVIRONMENT || 
      !process.env.PINECONE_INDEX) {
    console.error('Environment variables not configured properly');
    console.error('Required: OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX');
    process.exit(1);
  }

  try {
    // Directory containing documents to process
    const docsDir = path.join(process.cwd(), 'docs');
    
    // Check if directory exists
    if (!fs.existsSync(docsDir)) {
      console.log('Creating docs directory...');
      fs.mkdirSync(docsDir, { recursive: true });
      
      // Create a sample document
      const sampleDoc = path.join(docsDir, 'sample.md');
      fs.writeFileSync(sampleDoc, `# Sample Document\n\nThis is a sample document to demonstrate the RAG capabilities.\n\nYou can replace this with your own documents.`);
      
      console.log('Created sample document at:', sampleDoc);
    }
    
    console.log('Starting document processing from:', docsDir);
    await processDocuments(docsDir, extractMarkdownMetadata);
    
  } catch (error) {
    console.error('Error in document processing:', error);
    process.exit(1);
  }
}

// Run the script
main(); 