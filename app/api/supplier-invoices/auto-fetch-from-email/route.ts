import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// This API route runs on the server (Next.js App Router).
// It connects directly to Gmail using Google APIs and returns a normalized invoice JSON.

const GMAIL_USER = process.env.GMAIL_USER_EMAIL
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN

// Very simple helper to parse invoice-like info from an email body subject/text
const parseInvoiceFromEmailBody = (body: string, poNumber: string) => {
  const amountMatch = body.match(/total[:\s]+\$?([0-9.,]+)/i)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0

  return {
    id: `EMAIL-${Date.now()}`,
    poNumber,
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    supplier: 'Email Supplier',
    amount,
    date: new Date().toISOString(),
    materials: [
      {
        name: 'Email Parsed Material',
        quantity: 1,
        unitPrice: amount || 0,
        total: amount || 0
      }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const poNumber: string | undefined = body?.poNumber

    if (!poNumber || typeof poNumber !== 'string') {
      return NextResponse.json(
        { success: false, message: 'poNumber is required' },
        { status: 400 }
      )
    }

    if (!GMAIL_USER || !GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Gmail integration is not configured. Please set GMAIL_USER_EMAIL, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN env vars.'
        },
        { status: 500 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    )

    oauth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Search for latest email containing this PO number with attachment
    const query = `${poNumber} has:attachment`

    const listRes = await gmail.users.messages.list({
      userId: GMAIL_USER,
      q: query,
      maxResults: 1
    })

    const message = listRes.data.messages?.[0]

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: `No email found in Gmail for PO ${poNumber}`
        },
        { status: 404 }
      )
    }

    const msgRes = await gmail.users.messages.get({
      userId: GMAIL_USER,
      id: message.id as string,
      format: 'full'
    })

    const payload = msgRes.data.payload

    const headers = payload?.headers || []
    const subjectHeader = headers.find((h) => h.name?.toLowerCase() === 'subject')
    const subject = subjectHeader?.value || ''

    // Try to get plain text body
    let bodyText = ''
    const parts = payload?.parts || []

    const plainPart =
      parts.find((p) => p.mimeType === 'text/plain') ||
      (payload?.mimeType === 'text/plain' ? payload : undefined)

    if (plainPart?.body?.data) {
      bodyText = Buffer.from(plainPart.body.data, 'base64').toString('utf-8')
    }

    const combinedText = `${subject}\n${bodyText}`

    const invoice = parseInvoiceFromEmailBody(combinedText, poNumber)

    return NextResponse.json(
      {
        success: true,
        data: invoice
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in /api/supplier-invoices/auto-fetch-from-email:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Unexpected error while auto-fetching supplier invoice'
      },
      { status: 500 }
    )
  }
}

