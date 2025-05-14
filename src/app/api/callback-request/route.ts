import { NextRequest, NextResponse } from 'next/server';

// In a real app, you would store these in a database
const callbackRequests: Array<{
  id: string;
  phoneNumber: string;
  query: string;
  messageId: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed';
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, query, messageId } = body;
    
    // Validate required fields
    if (!phoneNumber || !query || !messageId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Basic phone number validation
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    
    // Create a new callback request
    const newRequest = {
      id: crypto.randomUUID(),
      phoneNumber,
      query,
      messageId,
      timestamp: new Date(),
      status: 'pending' as const,
    };
    
    // In a real app, save to database
    callbackRequests.push(newRequest);
    
    // Log for demonstration purposes
    console.log('New callback request:', newRequest);
    
    return NextResponse.json({
      success: true,
      message: 'Callback request received',
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error('Error processing callback request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // In a real app, this would be protected with authentication
  return NextResponse.json({
    requests: callbackRequests,
  });
} 