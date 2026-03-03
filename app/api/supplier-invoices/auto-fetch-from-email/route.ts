import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { extractText } from 'unpdf'

const GMAIL_USER = process.env.GMAIL_USER_EMAIL
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN

function parseInvoice(text: string, poNumber: string) {
  // Invoice number
  const invMatch = text.match(/INV[-\s]?[\d\-]+/i)
  const invoiceNumber = invMatch?.[0]?.trim() || `INV-${Date.now().toString().slice(-6)}`

  // Supplier
  const supplierMatch = text.match(/^([A-Za-z][A-Za-z\s]+(?:LLC|Inc|Corp|Services|Ltd|Electric)[,.]?)/i)
  const supplier = supplierMatch?.[1]?.trim() || 'Unknown Supplier'

  // Date
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/)
  let date = new Date().toISOString()
  if (dateMatch?.[1]) {
    try { date = new Date(dateMatch[1]).toISOString() } catch {}
  }

  // Balance Due ya Total
  const balanceMatch = text.match(/[Bb]alance\s*[Dd]ue\s*\$?\s*([\d,]+\.?\d*)/i)
  const totalMatch = text.match(/\bTotal\b\s*\$?\s*([\d,]+\.?\d*)/i)
  const amount = parseFloat((balanceMatch?.[1] || totalMatch?.[1] || '0').replace(/,/g, ''))

  // =============================================
  // Materials parse karo
  // PDF text ek line mein hai:
  // "... Qty Item Description Price Amount 1 Circuit Breaker Installation Circuit breaker installation $250.00 $250.00 1 Light test $60.06 $230.00 ..."
  // =============================================

  const materials: { name: string; quantity: number; unitPrice: number; total: number }[] = []

  // "Qty Item Description Price Amount" ke baad ka text lo
  const afterHeader = text.split(/Qty\s+Item\s+Description\s+Price\s+Amount/i)[1] || text

  // Stop words — yahan tak hi items hain
  const stopPattern = /It'?s been|Notes:|NOTES|Total\s+\$|Balance Due|Customer Acceptance/i
  const cleanText = afterHeader.split(stopPattern)[0].trim()

  console.log('Clean items text:', cleanText)

  // Pattern: "1 Name Description $price $amount" ya "1 Name $price $amount" (bina description)
  // Greedy match — dollar sign se pehle ka sab name+description hai
  const itemRegex = /(\d{1,2})\s+([A-Za-z][A-Za-z\s\-]+?)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})/g
  let m: RegExpExecArray | null

  while ((m = itemRegex.exec(cleanText)) !== null) {
    const qty = parseInt(m[1])
    const nameAndDesc = m[2].trim()
    const unitPrice = parseFloat(m[3].replace(/,/g, ''))
    const total = parseFloat(m[4].replace(/,/g, ''))

    if (qty > 999 || nameAndDesc.length < 2) continue

    // Name aur description alag karo — pehla capitalized word group name hai
    // "Circuit Breaker Installation Circuit breaker installation" → "Circuit Breaker Installation"
    const nameParts = nameAndDesc.match(/^((?:[A-Z][a-z]*\s*)+)/)
    const name = nameParts?.[1]?.trim() || nameAndDesc

    const isDuplicate = materials.some(mat => mat.unitPrice === unitPrice && mat.total === total)
    if (!isDuplicate) {
      materials.push({ name, quantity: qty, unitPrice, total })
    }
  }

  // Fallback
  if (materials.length === 0 && amount > 0) {
    materials.push({ name: 'Invoice Item', quantity: 1, unitPrice: amount, total: amount })
  }

  console.log('Parsed materials:', materials)

  return { invoiceNumber, supplier, date, amount, materials }
}

// Gmail attachment buffer fetch
async function getAttachmentBuffer(
  gmail: ReturnType<typeof google.gmail>,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  const res = await gmail.users.messages.attachments.get({
    userId: GMAIL_USER!,
    messageId,
    id: attachmentId
  })
  const urlSafeBase64 = res.data.data || ''
  const base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64')
}

// PDF attachment dhundo
function findPdfAttachment(parts: any[]): { attachmentId: string; mimeType: string } | null {
  for (const part of parts) {
    const mime = part.mimeType || ''
    if (part.body?.attachmentId && (mime === 'application/pdf' || mime.includes('pdf'))) {
      return { attachmentId: part.body.attachmentId, mimeType: mime }
    }
    if (part.parts) {
      const found = findPdfAttachment(part.parts)
      if (found) return found
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const poNumber: string | undefined = body?.poNumber

    if (!poNumber || typeof poNumber !== 'string') {
      return NextResponse.json({ success: false, message: 'poNumber is required' }, { status: 400 })
    }

    if (!GMAIL_USER || !GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
      return NextResponse.json({ success: false, message: 'Gmail not configured.' }, { status: 500 })
    }

    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    )
    oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const listRes = await gmail.users.messages.list({
      userId: GMAIL_USER,
      q: poNumber,
      maxResults: 5
    })

    const messages = listRes.data.messages
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: `No email found for PO ${poNumber}` },
        { status: 404 }
      )
    }

    let targetMessage = null
    let targetPayload = null

    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({
        userId: GMAIL_USER,
        id: msg.id as string,
        format: 'full'
      })
      const payload = msgRes.data.payload
      if (findPdfAttachment(payload?.parts || [])) {
        targetMessage = msg
        targetPayload = payload
        break
      }
    }

    if (!targetMessage || !targetPayload) {
      return NextResponse.json(
        { success: false, message: `No PDF attachment found for PO ${poNumber}` },
        { status: 404 }
      )
    }

    const attachmentInfo = findPdfAttachment(targetPayload.parts || [])!
    const pdfBuffer = await getAttachmentBuffer(
      gmail,
      targetMessage.id as string,
      attachmentInfo.attachmentId
    )

    const { text } = await extractText(new Uint8Array(pdfBuffer), { mergePages: true })
    const pdfText = Array.isArray(text) ? text.join(' ') : text

    const parsed = parseInvoice(pdfText, poNumber)

    const headers = targetPayload.headers || []
    const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || ''

    return NextResponse.json({
      success: true,
      data: {
        id: `EMAIL-${Date.now()}`,
        poNumber,
        invoiceNumber: parsed.invoiceNumber,
        supplier: parsed.supplier,
        amount: parsed.amount,
        date: parsed.date,
        emailSubject: subject,
        materials: parsed.materials
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error in auto-fetch-from-email:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
