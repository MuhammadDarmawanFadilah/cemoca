import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'amount';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Forward request to backend
    const backendResponse = await fetch(getApiUrl('/donations/successful'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!backendResponse.ok) {
      throw new Error('Failed to fetch from backend');
    }
    
    const data = await backendResponse.json();
    
    // Apply sorting and limiting on frontend
    // eslint-disable-next-line prefer-const
    let sortedData = [...data];
    
    // Sort based on the requested field
    if (sort === 'date') {
      sortedData.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sort === 'amount') {
      sortedData.sort((a, b) => {
        const amountA = parseFloat(a.amount);
        const amountB = parseFloat(b.amount);
        return order === 'desc' ? amountB - amountA : amountA - amountB;
      });
    }
    
    // Apply limit
    const limitedData = sortedData.slice(0, limit);
    
    return NextResponse.json(limitedData, { status: 200 });
  } catch (error) {
    console.error('Error in donations/successful API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch successful donations' },
      { status: 500 }
    );
  }
}