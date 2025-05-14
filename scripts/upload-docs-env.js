#!/usr/bin/env node

// Set environment variables from command line arguments
process.env.OPENAI_API_KEY = process.argv[2] || process.env.OPENAI_API_KEY;
process.env.PINECONE_API_KEY = process.argv[3] || process.env.PINECONE_API_KEY;
process.env.PINECONE_ENVIRONMENT = process.argv[4] || process.env.PINECONE_ENVIRONMENT;
process.env.PINECONE_INDEX = process.argv[5] || process.env.PINECONE_INDEX;

// Check for required variables
if (!process.env.OPENAI_API_KEY || 
    !process.env.PINECONE_API_KEY || 
    !process.env.PINECONE_ENVIRONMENT || 
    !process.env.PINECONE_INDEX) {
  console.error('Usage: node upload-docs-env.js OPENAI_API_KEY PINECONE_API_KEY PINECONE_ENVIRONMENT PINECONE_INDEX');
  process.exit(1);
}

// Load dependencies
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    esModuleInterop: true,
  },
});

// Import and run the upload script
require('./upload-documents.ts'); 