#!/bin/bash

# Check if input file is provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 input.pdf [output.md]"
  echo "Converts a PDF file to Markdown format"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${INPUT_FILE%.pdf}.md}"

echo "Converting $INPUT_FILE to $OUTPUT_FILE..."

# Attempt direct conversion with pandoc
if pandoc -f pdf -t markdown "$INPUT_FILE" -o "$OUTPUT_FILE" 2>/dev/null; then
  echo "Conversion complete: $OUTPUT_FILE"
  exit 0
fi

echo "Direct conversion failed, trying two-step conversion..."

# Create a temporary file for the extracted text
TEMP_TEXT_FILE=$(mktemp)

# Convert PDF to text using pdftotext
if pdftotext -layout "$INPUT_FILE" "$TEMP_TEXT_FILE"; then
  # Convert text to markdown using pandoc
  if pandoc "$TEMP_TEXT_FILE" -o "$OUTPUT_FILE"; then
    echo "Conversion complete: $OUTPUT_FILE"
    rm -f "$TEMP_TEXT_FILE"
    exit 0
  else
    echo "Error: Failed to convert text to markdown"
  fi
else
  echo "Error: Failed to convert PDF to text"
fi

# If we get here, both methods failed
rm -f "$TEMP_TEXT_FILE"
echo "Failed to convert PDF. The file may be corrupted or password-protected."
exit 1 