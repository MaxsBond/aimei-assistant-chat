import { config } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';
import { Message, ChatCompletionRequest, MessageRole } from '@/lib/api';
import { SUGGESTION_RULES } from '@/constants/prompts';

// Rate limiting variables
const API_RATE_LIMIT = 10; // requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Function to check rate limiting
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(ip) || { count: 0, resetTime: now + 60000 };
  
  // Reset counter if the time has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + 60000;
  }
  
  // Increment count and update in the map
  clientData.count++;
  requestCounts.set(ip, clientData);
  
  return clientData.count > API_RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    // IP-based rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const messages: Message[] = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Add system message asking for suggestions
    const promptMessages: Message[] = [
      ...messages,
      {
        role: 'system' as MessageRole,
        content: SUGGESTION_RULES.replace('{count}', config.ui.suggestions.count.toString())
                                 .replace('{maxLength}', config.ui.suggestions.maxLength.toString())
      }
    ];

    // Prepare the request payload for OpenAI
    const payload: ChatCompletionRequest = {
      model: config.openai.model,
      messages: promptMessages,
      temperature: 0.9, // Higher diversity for suggestions
      max_tokens: 150,
    };

    // Make the request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Error from OpenAI API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the numbered list into an array of suggestions
    const suggestionLines = content.split('\n');
    const suggestions = suggestionLines
      .filter((line: string) => /^\d+\./.test(line.trim())) // Filter out lines that don't start with a number
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim()) // Remove the numbers
      .filter((suggestion: string) => suggestion.length > 0 && suggestion.length <= config.ui.suggestions.maxLength)
      .slice(0, config.ui.suggestions.count);

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 