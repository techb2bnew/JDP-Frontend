import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Call external login API
    const loginResponse = await fetch('https://techrepairtracker.base2brand.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!loginResponse.ok) {
      // Handle different error status codes
      if (loginResponse.status === 401) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        )
      }
      
      const errorData = await loginResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Login failed. Please try again.' 
        },
        { status: loginResponse.status }
      )
    }

    const loginData = await loginResponse.json()
    
    // Check if we received a token
    if (!loginData.token) {
      return NextResponse.json(
        { success: false, message: 'Invalid response from server' },
        { status: 500 }
      )
    }

    // Extract user information from token or response
    // You might need to decode the JWT token to get user details
    // For now, we'll use the token as is
    const token = loginData.token
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: loginData.user?.id || 1,
        email,
        name: loginData.user?.name || 'User',
        role: loginData.user?.role || 'user'
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
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}