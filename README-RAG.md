# Adding Documents to the RAG Knowledge Base

This guide explains how to add new documents (including PDFs) to the Retrieval-Augmented Generation (RAG) knowledge base powered by Pinecone.

## Prerequisites

- Node.js and npm installed
- OpenAI API key
- Pinecone API key and index
- Required environment variables set in `.env.local`:
  ```
  OPENAI_API_KEY=your_openai_key
  PINECONE_API_KEY=your_pinecone_key
  PINECONE_ENVIRONMENT=your_pinecone_environment (e.g., us-east-1-gcp)
  PINECONE_INDEX=your_pinecone_index_name
  ```

## Quick Start: All-in-One Upload Tool

The simplest way to add a document to the knowledge base is to use the provided utility script:

```bash
node scripts/add-to-knowledge-base.js ./path/to/your/document.pdf
```

This script will:
1. Convert PDF to Markdown (if needed)
2. Open the Markdown in your text editor for review
3. Wait for you to make any necessary edits
4. Upload the document to Pinecone
5. Test retrieval with a sample query

You can also specify a custom test query:

```bash
node scripts/add-to-knowledge-base.js ./path/to/your/document.pdf "What is the main topic of this document?"
```

## Manual Process: Step-by-Step

If you prefer more control over the process, you can follow these manual steps:

### Converting PDFs to Markdown

Before uploading PDFs to the knowledge base, they need to be converted to Markdown format for better processing.

1. Place your PDF files in the `data` directory:
   ```bash
   mkdir -p data
   # Copy your PDF files to the data directory
   ```

2. Use the provided conversion script to convert PDF to Markdown:
   ```bash
   ./scripts/pdf2md.sh ./data/your-document.pdf
   ```

3. The script will create a new Markdown file with the same name:
   ```
   ./data/your-document.md
   ```

4. **Review and edit the Markdown file** to ensure the conversion is accurate and to add any metadata or formatting improvements.

5. Move the generated Markdown file to the `docs` directory:
   ```bash
   mkdir -p docs
   mv ./data/your-document.md ./docs/
   ```

### Uploading Documents to Pinecone

Once you have your documents in Markdown format in the `docs` directory, you can upload them to Pinecone:

1. Run the document upload script:
   ```bash
   npm run upload-docs
   ```

   This script:
   - Scans the `docs` directory for all Markdown files
   - Processes each document, splitting it into chunks
   - Generates embeddings for each chunk using OpenAI
   - Uploads the embeddings and metadata to your Pinecone index

2. Verify the upload was successful:
   ```bash
   node scripts/test-vector-search.js "Query related to your document"
   ```

## Supported Document Formats

The following document formats are supported:
- Markdown (.md) - Preferred format
- PDF (.pdf) - Requires conversion using the pdf2md.sh script
- Plain text (.txt) - Can be directly placed in the docs directory

## Best Practices for Knowledge Base Documents

For optimal RAG performance:

1. **Structure your documents clearly**:
   - Use headings and subheadings (# and ##)
   - Keep paragraphs focused on single topics
   - Use lists and tables for structured data

2. **Optimize chunk size**:
   - The default chunk size is optimized for general knowledge
   - For technical documentation, consider smaller chunks by modifying the document splitting parameters

3. **Include metadata**:
   - Add a metadata section at the top of Markdown files with title, author, date, and source

4. **Organize by topic**:
   - Keep documents on related topics in the same directory
   - Use consistent naming conventions

## Troubleshooting

If you encounter issues:

1. **Conversion problems**:
   - Try alternative conversion methods if pdf2md.sh fails
   - Check that the PDF doesn't have excessive formatting or images
   - Manually edit the Markdown file to fix conversion errors

2. **Upload failures**:
   - Verify your API keys and environment variables
   - Check the Pinecone console to ensure your index exists
   - Look for error messages in the console output

3. **Retrieval issues**:
   - Test direct vector search using scripts/test-vector-search.js
   - Try different query formulations
   - Check that the document content is properly chunked and embedded

## Testing the Knowledge Base

To test whether your documents are correctly added and can be retrieved:

1. Run the vector search test with a relevant query:
   ```bash
   node scripts/test-vector-search.js "Specific query about your document"
   ```

2. Check the returned results to verify your document chunks appear in the results.

3. Start the application and use the chat interface with RAG enabled to test retrieval in context. 