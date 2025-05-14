"use client";

import { useState } from "react";
import { MessageItem } from "./message-item";

const TEST_MESSAGES = [
  {
    id: "1",
    role: "assistant",
    content: `
# Heading Level 1

This is a primary heading demonstration.

## Heading Level 2

This is a secondary heading demonstration.

### Heading Level 3

This is a tertiary heading demonstration.

#### Heading Level 4

This is a level 4 heading demonstration.

##### Heading Level 5

This is a level 5 heading demonstration.

###### Heading Level 6

This is the smallest heading demonstration.

## Other Markdown Test Elements

This is a test of *italic*, **bold**, and ***bold-italic*** formatting.

## Emoji Support

Standard emoji characters: 🚀 🎉 💡 ⭐ 🔥 👍 

Emoji shortcodes: 
- :smile: :heart: :thumbsup:
- :rocket: :tada: :star: :fire:
- :100: :coffee: :pizza:

Emoticons that get converted:
- :) :-) :D ;) :P :(

## Lists
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3

## Code Blocks

Inline code: \`const x = 1;\`

\`\`\`javascript
// JavaScript code block
function hello() {
  console.log("Hello, world!");
  return 42;
}
\`\`\`

\`\`\`python
# Python code block
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)

print(factorial(5))
\`\`\`

## Links and Images

[Link to Google](https://www.google.com)

## Tables

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

## Horizontal Rules

---

That's all for the test!
`,
    timestamp: new Date("2023-10-15T10:30:00"),
  },
  {
    id: "2",
    role: "user",
    content: "Can you explain how to use async/await in JavaScript?",
    timestamp: new Date("2023-10-15T10:35:00"),
  },
  {
    id: "3",
    role: "assistant",
    content: `
## Async/Await in JavaScript

Async/await is a way to handle asynchronous operations in JavaScript. It's built on top of Promises and makes asynchronous code look more like synchronous code.

### Basic Syntax

\`\`\`javascript
// An async function returns a Promise
async function fetchData() {
  try {
    // await pauses execution until the Promise resolves
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Using the async function
fetchData()
  .then(data => console.log('Data:', data))
  .catch(error => console.error('Error:', error));
\`\`\`

### Key Points

1. **async** keyword marks a function as asynchronous
2. **await** can only be used inside async functions
3. **await** pauses the execution until the Promise resolves
4. Error handling can be done with try/catch blocks

### Common Patterns

- Parallel execution with Promise.all:

\`\`\`javascript
async function fetchMultipleData() {
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(res => res.json()),
    fetch('/api/posts').then(res => res.json()),
    fetch('/api/comments').then(res => res.json())
  ]);
  
  return { users, posts, comments };
}
\`\`\`

That's a basic introduction to async/await in JavaScript!
`,
    timestamp: new Date("2023-10-15T10:40:00"),
  }
];

export function MarkdownTest() {
  const [messages] = useState(TEST_MESSAGES);
  
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Markdown Rendering Test</h1>
      <div className="border rounded-lg p-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message as any} />
        ))}
      </div>
    </div>
  );
} 