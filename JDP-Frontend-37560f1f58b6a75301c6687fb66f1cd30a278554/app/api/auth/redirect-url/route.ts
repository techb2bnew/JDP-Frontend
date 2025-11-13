import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUrl = request.cookies.get('redirect-url')?.value
  
  if (redirectUrl) {
    // Clear the redirect URL cookie
    const response = NextResponse.json({ redirectUrl })
    response.cookies.set('redirect-url', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })
    return response
  }
  
  return NextResponse.json({ redirectUrl: '/dashboard' })
}