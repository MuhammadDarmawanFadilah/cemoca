import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    // Forward request to backend
    const backendResponse = await fetch(getApiUrl(`/donations/verify-payment/${orderId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await backendResponse.json();
    
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in verify-payment API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}