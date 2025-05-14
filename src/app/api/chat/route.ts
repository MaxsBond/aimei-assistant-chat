import { config } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';
import { Message, ChatCompletionRequest } from '@/lib/api';

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

    // Optional: Switch prompt type based on request parameter
    // Example: if(body.promptType && ['default', 'creative', 'technical'].includes(body.promptType)) {
    //   config.openai.promptType = body.promptType;
    // }

    // Add system message if not already present
    const systemMessageExists = messages.some(msg => msg.role === 'system');
    const messagesWithSystem = systemMessageExists 
      ? messages 
      : [{ role: 'system', content: config.openai.systemPrompt }, ...messages];

    // Prepare the request payload for OpenAI
    const payload: ChatCompletionRequest = {
      model: config.openai.model,
      messages: messagesWithSystem,
      temperature: config.openai.temperature,
      max_tokens: config.openai.max_tokens,
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
    
    return NextResponse.json({
      message: data.choices[0].message,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 