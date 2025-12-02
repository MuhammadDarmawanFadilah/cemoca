import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to backend
    const backendResponse = await fetch(getApiUrl('/donations/create-payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    const data = await backendResponse.json();
    
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in create-payment API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}