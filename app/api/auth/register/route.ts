import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, role, otp } = await request.json()
    
    // Validate input
    if (!email || !role || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email, role, and OTP are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['Staff', 'Admin', 'Labour', 'Lead Labour']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role selected' },
        { status: 400 }
      )
    }

    // Call external signup API
    const signupResponse = await fetch('https://techrepairtracker.base2brand.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role, otp }),
    })

    if (!signupResponse.ok) {
      // Handle different error status codes
      if (signupResponse.status === 400) {
        return NextResponse.json(
          { success: false, message: 'Invalid OTP or email' },
          { status: 400 }
        )
      }
      
      if (signupResponse.status === 409) {
        return NextResponse.json(
          { success: false, message: 'User already exists with this email' },
          { status: 409 }
        )
      }
      
      const errorData = await signupResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Registration failed. Please try again.' 
        },
        { status: signupResponse.status }
      )
    }

    const signupData = await signupResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: signupData.user || {
        email,
        role,
        id: signupData.id || Date.now().toString()
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
