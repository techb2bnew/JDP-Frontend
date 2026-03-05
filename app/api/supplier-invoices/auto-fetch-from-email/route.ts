import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { extractText } from 'unpdf'

const GMAIL_USER = process.env.GMAIL_USER_EMAIL
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN

function parseInvoice(text: string, poNumber: string) {
  // ─── Invoice Number (first one found) ────────────────────────────────────
  const invMatch = text.match(/(?:INVOICE\s+NUMBER|Invoice\s+no\.?:?)\s*([A-Z0-9\-\.]+)/i)
  const invoiceNumber = invMatch?.[1]?.trim() || `INV-${Date.now().toString().slice(-6)}`

  // ─── Supplier ─────────────────────────────────────────────────────────────
  // Look for the ACTUAL supplier name — for Viking Electric invoices,
  // the supplier is "VIKING ELECTRIC" (the company sending the invoice),
  // not "JDP ELECTRICAL" (the customer in SOLD TO)
  // Try: company name near top before "SOLD TO" block
  let supplier = ''

  // Pattern 1: "TEL xxx SOLD TO: <customer>" — supplier is typically in header before SOLD TO
  // For Viking Electric: text starts with "TEL 612-627-1234 SOLD TO: JDP..."
  // The actual supplier name is in the PDF header/logo area — try to get it from REMIT TO section
  const remitMatch = text.match(/PLEASE\s+REMIT\s+PAYMENT\s+TO:\s*([A-Z][A-Z\s]+?)(?=PO\s+BOX|\d{3,}|$)/i)
  if (remitMatch?.[1]) {
    supplier = remitMatch[1].trim().replace(/\s+/g, ' ')
  }

  // Pattern 2: Intuit invoices — "SOLD TO:" before billing address, supplier is the invoice sender
  // Usually found at start: "Larry's Bakery 2500 Garcia Ave..."
  if (!supplier) {
    const topMatch = text.match(/^([A-Za-z][A-Za-z0-9'\s]+(?:LLC|Inc|Corp|Services|Ltd|Electric|Bakery|Supply)[,.]?)/im)
    if (topMatch?.[1]) supplier = topMatch[1].trim()
  }

  if (!supplier || supplier.length < 3) supplier = 'Unknown Supplier'

  // ─── Date ─────────────────────────────────────────────────────────────────
  const dateMatch = text.match(/(?:INVOICE\s+DATE|Invoice\s+date:?)\s*(\d{2}\/\d{2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i)
  let date = new Date().toISOString()
  if (dateMatch?.[1]) {
    try { date = new Date(dateMatch[1]).toISOString() } catch {}
  }

  // ─── Amount: sum only POSITIVE TOTAL DUE values (invoices only, skip credits) ──
  // Credits have negative TOTAL DUE — we do NOT subtract them from the total
  // because the supplier total should reflect what was invoiced, not net after returns
  let amount = 0
  const totalDueRegex = /TOTAL\s+DUE\s+(-?[\d,]+\.\d{2})/gi
  let tdMatch: RegExpExecArray | null
  while ((tdMatch = totalDueRegex.exec(text)) !== null) {
    const val = parseFloat(tdMatch[1].replace(/,/g, ''))
    if (val > 0) amount += val   // only add positive invoices, ignore credits
  }
  if (amount === 0) {
    const balanceMatch = text.match(/[Bb]alance\s*[Dd]ue\s*\$?\s*([\d,]+\.?\d*)/i)
    amount = parseFloat((balanceMatch?.[1] || '0').replace(/,/g, ''))
  }
  amount = Math.round(amount * 100) / 100

  // ─── Materials ────────────────────────────────────────────────────────────
  const materials: { name: string; quantity: number; unitPrice: number; total: number }[] = []

  // Split on each ORDER QTY block (one per invoice page in the merged PDF text)
  const orderBlocks = text.split(/(?=ORDER\s+QTY\s+(?:-?\d[\d\s]*?)\s+SHIP\s+QTY)/i)

  for (const block of orderBlocks) {
    if (!block.match(/ORDER\s+QTY/i)) continue

    // Skip credit blocks (all order qtys negative)
    const orderQtySection = block.match(/ORDER\s+QTY\s+([\d\s\-]+?)\s+SHIP\s+QTY/i)?.[1] || ''
    const orderQtys = orderQtySection.trim().split(/\s+/).map(Number)
    if (orderQtys.length > 0 && orderQtys.every(q => q <= 0)) continue

    // Extract core: DESCRIPTION ... UNIT PRICE ... UOM ... EXT PRICE ... SUBTOTAL
    const coreMatch = block.match(
      /DESCRIPTION\s+([\s\S]+?)\s+UNIT\s+PRICE\s+([\d,\.\s]+?)\s+UOM\s+([\w\s]+?)\s+EXT\s+PRICE\s+([\d,\.\s]+?)\s+SUBTOTAL/i
    )
    if (!coreMatch) continue

    const descRaw = coreMatch[1].trim()
    const unitPricesRaw = coreMatch[2].trim()
    const extPricesRaw = coreMatch[4].trim()

    const unitPrices = (unitPricesRaw.match(/[\d,]+\.\d{2}/g) || []).map(p => parseFloat(p.replace(/,/g, '')))
    const extPrices = (extPricesRaw.match(/[\d,]+\.\d{2}/g) || []).map(p => parseFloat(p.replace(/,/g, '')))

    if (unitPrices.length === 0) continue

    // Ship quantities (positive only)
    const shipQtySection = block.match(/SHIP\s+QTY\s+([\d\s]+?)\s+DESCRIPTION/i)?.[1] || ''
    const shipQtys = shipQtySection.trim().split(/\s+/).map(Number).filter(q => q > 0)

    // Split description into individual item names
    const names = parseDescriptions(descRaw, unitPrices.length, unitPrices, extPrices)

    for (let i = 0; i < unitPrices.length; i++) {
      const shipQty = shipQtys[i] ?? shipQtys[0] ?? Math.abs(orderQtys[i] ?? 1)
      if (shipQty <= 0) continue

      const unitPrice = unitPrices[i]
      const extPrice = extPrices[i] ?? unitPrice * shipQty
      const name = names[i] || 'Invoice Item'

      const isDuplicate = materials.some(
        x => Math.abs(x.unitPrice - unitPrice) < 0.01 &&
             Math.abs(x.total - extPrice) < 0.01 &&
             x.name === name
      )
      if (!isDuplicate) {
        materials.push({ name, quantity: shipQty, unitPrice, total: extPrice })
      }
    }
  }

  // ── Strategy B: Intuit / "$price $amount" format ─────────────────────────
  if (materials.length === 0) {
    const afterQtyHeader = text.split(/(?:Qty|QTY)\s+(?:Item|SHIP\s+QTY)\s+(?:Description|DESCRIPTION)/i)[1] || ''
    if (afterQtyHeader) {
      const cleanText = afterQtyHeader.split(/It'?s been|Notes:|NOTES|Total\s+\$|Balance Due|SUBTOTAL/i)[0].trim()
      const itemRegex = /(\d{1,3})\s+([A-Za-z][A-Za-z0-9\s\-\/\+\'&]+?)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})/g
      let m: RegExpExecArray | null
      while ((m = itemRegex.exec(cleanText)) !== null) {
        const qty = parseInt(m[1])
        const rawName = m[2].trim()
        const unitPrice = parseFloat(m[3].replace(/,/g, ''))
        const total = parseFloat(m[4].replace(/,/g, ''))
        if (qty > 999 || rawName.length < 2) continue
        if (!materials.some(x => x.unitPrice === unitPrice && x.total === total)) {
          materials.push({ name: rawName, quantity: qty, unitPrice, total })
        }
      }
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (materials.length === 0 && amount > 0) {
    materials.push({ name: 'Invoice Item', quantity: 1, unitPrice: amount, total: amount })
  }

  console.log('Parsed invoice:', { invoiceNumber, supplier, amount, materialsCount: materials.length })
  console.log('Parsed materials:', JSON.stringify(materials, null, 2))

  return { invoiceNumber, supplier, date, amount, materials }
}

// ─────────────────────────────────────────────────────────────────────────────
// parseDescriptions: split flat merged description text into `count` item names
//
// Uses a smarter boundary detection:
// Instead of splitting on generic ALL-CAPS patterns, we use the UNIT PRICES
// as anchors — we know how many items there are (count = unitPrices.length),
// so we find the most logical split points in the description text.
//
// Key insight: each item in Viking Electric invoices follows one of these patterns:
//   PARTCODE DESCRIPTION  (e.g. "BETSWI BS200 3/8IN LV MAGNETIC DOOR SWITCH")
//   BRAND CODE DESCRIPTION (e.g. "RAY-NUH N1C015 CABLE 120V 15 SQUARE FEET")
//   BRAND CODE DESC *TAG BRAND CODE DESC *TAG (multi-item, tags separate them)
// ─────────────────────────────────────────────────────────────────────────────
function parseDescriptions(
  raw: string,
  count: number,
  unitPrices: number[],
  extPrices: number[]
): string[] {
  if (count === 1) return [cleanItemName(raw)]

  // Remove noise: ** blocks and *DIGITS+LETTERS tags (e.g. *269MUS)
  let clean = raw
    .replace(/\*\*[^*]+\*\*/g, '')
    .replace(/\*\d+[A-Z]{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // ── Method 1: Split on *NNNXXX tags (Viking Electric uses these as item separators) ──
  // Original text (before cleaning) often has "*269MUS" between items
  // Check raw for these tags
  const tagSplit = raw.split(/\*\d+[A-Z]{2,}/)
  if (tagSplit.length === count) {
    return tagSplit.map(s => cleanItemName(s))
  }
  if (tagSplit.length > count) {
    // Merge excess: last tag parts may belong to last item
    const parts = tagSplit.slice(0, count - 1)
    parts.push(tagSplit.slice(count - 1).join(' '))
    return parts.map(s => cleanItemName(s))
  }

  // ── Method 2: Find brand+code boundary patterns ───────────────────────────
  // A new item starts when we see: WORD(S) followed by a product code containing digits
  // e.g. "RAY-NUH N1C030", "LITH LBR6PFW", "CTX 5133766", "CUL 77016J"
  // We collect ALL such positions, then pick the best count-1 split points

  // Pattern: optional preceding space + uppercase brand (possibly hyphenated) + space + code-with-digits
  const boundaryRe = /(?<!\w)([A-Z][A-Z\-]{1,12})\s+([A-Z0-9]{2,}[0-9][A-Z0-9\/]*)/g
  const candidates: Array<{ index: number; text: string }> = []
  let bm: RegExpExecArray | null

  while ((bm = boundaryRe.exec(clean)) !== null) {
    if (bm.index > 0) {
      candidates.push({ index: bm.index, text: bm[0] })
    }
  }

  if (candidates.length >= count - 1) {
    // Pick count-1 candidates that are most evenly spread
    const splitPoints = pickEvenSplitPoints(candidates.map(c => c.index), count - 1, clean.length)
    if (splitPoints.length === count - 1) {
      return splitAtPoints(clean, splitPoints).map(s => cleanItemName(s))
    }
  }

  // ── Method 3: Split by equal word chunks (last resort) ───────────────────
  const words = clean.split(/\s+/)
  const chunkSize = Math.ceil(words.length / count)
  return Array.from({ length: count }, (_, i) =>
    cleanItemName(words.slice(i * chunkSize, (i + 1) * chunkSize).join(' '))
  )
}

function pickEvenSplitPoints(candidates: number[], needed: number, totalLength: number): number[] {
  if (candidates.length === needed) return candidates.sort((a, b) => a - b)

  // Greedily pick the `needed` candidates that divide string most evenly
  const result: number[] = []
  const segmentSize = totalLength / (needed + 1)

  for (let i = 1; i <= needed; i++) {
    const ideal = segmentSize * i
    const best = candidates.reduce((prev, cur) => {
      const prevDist = Math.abs(prev - ideal)
      const curDist = Math.abs(cur - ideal)
      return curDist < prevDist ? cur : prev
    })
    if (!result.includes(best)) result.push(best)
  }

  return result.sort((a, b) => a - b)
}

function splitAtPoints(s: string, points: number[]): string[] {
  const parts: string[] = []
  let prev = 0
  for (const pt of points) {
    parts.push(s.substring(prev, pt).trim())
    prev = pt
  }
  parts.push(s.substring(prev).trim())
  return parts
}

function cleanItemName(s: string): string {
  return s
    .replace(/\*\*[^*]+\*\*/g, '')
    .replace(/\*\d+[A-Z]{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100)
}
  
// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanDesc(raw: string): string {
  // Remove asterisk-notes like "*269MUS"
  return raw.replace(/\*\d+[A-Z]+/g, '').replace(/\s+/g, ' ').trim().substring(0, 100)
}

function splitDescriptions(desc: string, count: number): string[] {
  if (count === 1) return [cleanDesc(desc)]

  // Remove credit notes
  const clean = desc.replace(/\*\*[^*]+\*\*/g, '').replace(/\*\d+[A-Z]+/g, '').trim()

  // Try splitting by brand/part-code patterns
  // Common patterns: "RAY-NUH", "LITH", "LTH", "CTX", "CUL", "P&S", "W-MOLD", "STL-CTY", "MINRLAC", "BETSWI"
  // Heuristic: an item boundary is where a new "WORD CODE" or "BRAND-WORD CODE" sequence starts
  // after at least some text
  //
  // We'll look for: (optional hyphenated-word) ALLCAPS_WORD  ALPHANUMERIC_CODE
  // that is preceded by a non-start position and some text
  const boundaryRegex = /\s+(?=[A-Z][A-Z0-9\-]{1,10}\s+[A-Z0-9]{2,})/g

  const parts: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Collect all potential split points
  const splitPoints: number[] = []
  while ((match = boundaryRegex.exec(clean)) !== null) {
    if (match.index > 0) splitPoints.push(match.index)
  }

  if (splitPoints.length >= count - 1) {
    // Use the split points that best divide into `count` parts
    // Pick every nth split point if there are too many
    const step = Math.floor(splitPoints.length / count)
    const chosen = Array.from({ length: count - 1 }, (_, i) => splitPoints[i * step] ?? splitPoints[i])

    let prev = 0
    for (const pt of chosen) {
      parts.push(clean.substring(prev, pt).trim())
      prev = pt
    }
    parts.push(clean.substring(prev).trim())
  } else {
    // Fallback: split by whitespace into roughly equal chunks
    const words = clean.split(/\s+/)
    const chunkSize = Math.ceil(words.length / count)
    for (let i = 0; i < count; i++) {
      parts.push(words.slice(i * chunkSize, (i + 1) * chunkSize).join(' '))
    }
  }

  return parts.map(p => p.substring(0, 100).trim())
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
