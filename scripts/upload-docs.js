#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Dynamically import the ESM module
async function main() {
  try {
    // Compile TypeScript to JavaScript
    require('ts-node').register({
      compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true,
      },
    });

    // Import and run the upload script
    require('./upload-documents.ts');
  } catch (error) {
    console.error('Error starting upload script:', error);
    process.exit(1);
  }
}

main(); 