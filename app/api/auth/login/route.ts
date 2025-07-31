import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Mock authentication logic
    // In a real app, you would validate credentials against your database
    if (email && password) {
      // Mock successful login
      const token = 'mock-jwt-token-' + Date.now()
      console.log(token, 'token>>>');
      
      const response = NextResponse.json({
        success: true,
        user: {
          id: 1,
          email,
          name: 'Admin User',
          role: 'admin'
        },
        token
      })
      
      // Set HTTP-only cookie for authentication
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      
      return response
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}