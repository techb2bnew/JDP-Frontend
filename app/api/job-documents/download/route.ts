import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl = searchParams.get('fileUrl')
  const fileName = searchParams.get('fileName') || 'document'

  if (!fileUrl) {
    return NextResponse.json({ message: 'fileUrl query parameter is required' }, { status: 400 })
  }

  try {
    const response = await fetch(fileUrl)

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch document from storage' },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${decodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Failed to proxy download:', error)
    return NextResponse.json({ message: 'Failed to download document' }, { status: 500 })
  }
}

