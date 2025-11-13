import { NextRequest, NextResponse } from 'next/server'

// Example API proxy route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  
  if (!endpoint) {
    return NextResponse.json(
      { error: 'Endpoint parameter is required' },
      { status: 400 }
    )
  }
  
  try {
    // Proxy request to external API
    const response = await fetch(`${process.env.EXTERNAL_API_URL}/${endpoint}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`,
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}