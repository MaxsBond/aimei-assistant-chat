#!/usr/bin/env node

/**
 * A utility script to add documents to the knowledge base in one step
 * Supports both PDF and Markdown files
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Check if required environment variables are set
function checkEnvironment() {
  const requiredVars = [
    'OPENAI_API_KEY',
    'PINECONE_API_KEY',
    'PINECONE_ENVIRONMENT',
    'PINECONE_INDEX'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease add these to your .env.local file');
    return false;
  }
  
  return true;
}

// Create required directories if they don't exist
function prepareDirectories() {
  const dirs = ['data', 'docs'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating ${dir} directory...`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Convert PDF to Markdown if necessary
function convertPdfToMarkdown(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // If already a markdown file, just return the path
  if (ext === '.md') {
    return filePath;
  }
  
  // Only convert PDF files
  if (ext !== '.pdf') {
    throw new Error(`Unsupported file format: ${ext}. Only .pdf and .md files are supported.`);
  }
  
  console.log(`Converting PDF to Markdown: ${filePath}`);
  
  try {
    // Check if pdf2md.sh exists and is executable
    if (!fs.existsSync('./scripts/pdf2md.sh')) {
      throw new Error('Conversion script not found. Make sure scripts/pdf2md.sh exists.');
    }
    
    // Get the base name without extension
    const baseName = path.basename(filePath, ext);
    const outputPath = path.join('data', `${baseName}.md`);
    
    // Run the conversion script
    execSync(`./scripts/pdf2md.sh "${filePath}" "${outputPath}"`, { stdio: 'inherit' });
    
    console.log(`✅ PDF converted to Markdown: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('❌ PDF conversion failed:', error.message);
    throw error;
  }
}

// Copy file to docs directory if it's not already there
function prepareForUpload(filePath) {
  const fileName = path.basename(filePath);
  const destPath = path.join('docs', fileName);
  
  // If the file is already in docs, return the path
  if (filePath === destPath) {
    return filePath;
  }
  
  // Copy the file to docs directory
  console.log(`Copying ${filePath} to docs directory...`);
  fs.copyFileSync(filePath, destPath);
  
  return destPath;
}

// Upload document to Pinecone
function uploadToPinecone() {
  console.log('\n📤 Uploading documents to Pinecone...');
  
  try {
    // Run the upload-documents script
    execSync('npm run upload-docs', { stdio: 'inherit' });
    console.log('✅ Documents successfully uploaded to Pinecone');
    return true;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    return false;
  }
}

// Test whether document can be retrieved
function testRetrieval(query) {
  console.log(`\n🔍 Testing retrieval with query: "${query}"`);
  
  try {
    execSync(`node scripts/test-vector-search.js "${query}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Retrieval test failed:', error.message);
    return false;
  }
}

// Add a function to prompt for user confirmation
function promptForConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Open file for editing if user wants to review
async function reviewMarkdownFile(filePath) {
  console.log(`\n📄 Markdown file generated: ${filePath}`);
  console.log('You should review this file before uploading to ensure the conversion is correct.');
  
  const shouldReview = await promptForConfirmation('Would you like to review/edit the file now?');
  
  if (shouldReview) {
    try {
      // Try to open the file with the default editor
      console.log('Opening file in your default text editor...');
      
      // Determine the appropriate command based on the platform
      let command;
      if (process.platform === 'win32') {
        command = `start "" "${filePath}"`;
      } else if (process.platform === 'darwin') {
        command = `open "${filePath}"`;
      } else {
        command = `xdg-open "${filePath}"`;
      }
      
      execSync(command, { stdio: 'ignore' });
      
      // Wait for user to confirm they're done editing
      console.log('Please edit the file and save your changes.');
      return await promptForConfirmation('Have you completed your edits?');
    } catch (error) {
      console.error('Could not open the file automatically. Please edit it manually.');
      return await promptForConfirmation('Press y when you have reviewed and edited the file');
    }
  }
  
  return true;
}

// Main function
async function main() {
  // Check if file path is provided
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node add-to-knowledge-base.js <file_path> [test_query]');
    console.error('Example: node add-to-knowledge-base.js ./data/document.pdf "What is this document about?"');
    process.exit(1);
  }
  
  const filePath = args[0];
  const testQuery = args[1] || `Tell me about ${path.basename(filePath, path.extname(filePath))}`;
  
  console.log('🚀 Adding document to knowledge base...');
  
  try {
    // Check environment variables
    if (!checkEnvironment()) {
      process.exit(1);
    }
    
    // Prepare directories
    prepareDirectories();
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Convert PDF if needed
    const markdownPath = convertPdfToMarkdown(filePath);
    
    // Let the user review the markdown file
    const reviewCompleted = await reviewMarkdownFile(markdownPath);
    
    if (!reviewCompleted) {
      console.log('Document upload cancelled.');
      process.exit(0);
    }
    
    // Confirm upload after review
    const shouldUpload = await promptForConfirmation('Ready to upload to Pinecone?');
    
    if (!shouldUpload) {
      console.log('Document upload cancelled.');
      process.exit(0);
    }
    
    // Prepare file for upload
    const docsPath = prepareForUpload(markdownPath);
    
    // Upload to Pinecone
    const uploadSuccess = uploadToPinecone();
    
    if (uploadSuccess) {
      // Test retrieval
      testRetrieval(testQuery);
      
      console.log('\n✅ Document successfully added to the knowledge base!');
      console.log('You can now query this information through the chat interface with RAG enabled.');
    }
  } catch (error) {
    console.error('\n❌ Failed to add document to knowledge base:', error.message);
    process.exit(1);
  }
}

// Run the main function
main(); 