# Aimei Assistant Chat

A web-based chat interface for interacting with OpenAI's language models.

## Features

- Real-time chat interface with AI assistant
- Markdown rendering support for rich text responses
- Conversation history management
- Suggested follow-up actions
- Dark/light theme support
- Responsive design for all device sizes

## Getting Started

### Prerequisites

- Node.js 18.0.0 or newer
- An OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

Then, start the production server:

```bash
npm start
```

## Project Structure

- `/src/app` - Next.js application and API routes
- `/src/components` - React components
- `/src/lib` - Utility functions and shared code

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn UI
- Zustand (state management)
- React Markdown
