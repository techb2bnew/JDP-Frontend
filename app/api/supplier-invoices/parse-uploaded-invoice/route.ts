// /app/api/supplier-invoices/parse-uploaded-invoice/route.ts
// Zero external dependencies — uses only Node.js built-in zlib.
// Correctly extracts all pages by reading the exact /Length from each stream
// dictionary, avoiding the CR+LF off-by-one that caused page 1 to be silently
// truncated and fail decompression.
import { NextRequest, NextResponse } from 'next/server'
import { inflateSync, inflateRawSync, unzipSync } from 'zlib'

// ---------------------------------------------------------------------------
// Stream extraction helpers
// ---------------------------------------------------------------------------

function tryDecompress(bytes: Buffer): string | null {
  try { return inflateSync(bytes).toString('latin1') } catch (_) {}
  try { return inflateRawSync(bytes).toString('latin1') } catch (_) {}
  try { return unzipSync(bytes).toString('latin1') } catch (_) {}
  return null
}

function extractTokensFromStream(text: string): string[] {
  const tokens: string[] = []
  const re = /\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const t = m[1].trim()
    if (t.length > 0) tokens.push(t)
  }
  return tokens
}

/**
 * Extract per-page token arrays from a PDF buffer.
 *
 * THE KEY FIX vs the original code:
 * Instead of scanning for "endstream" and stripping trailing CR/LF bytes
 * (which strips 1-2 bytes too many when both CR and LF are present), we now
 * read the exact number of bytes specified by /Length in the stream dictionary.
 * This guarantees the complete compressed data regardless of line-ending style.
 */
function extractPDFPages(buffer: ArrayBuffer): string[][] {
  const buf = Buffer.from(buffer)
  const raw = buf.toString('binary')
  const pages: string[][] = []

  let pos = 0
  while (pos < raw.length) {
    const streamStart = raw.indexOf('stream', pos)
    if (streamStart < 0) break

    // Grab dict text between nearest preceding 'obj' and the 'stream' keyword
    const objPos = raw.lastIndexOf('obj', streamStart)
    const dictText = objPos >= 0 ? raw.slice(objPos, streamStart) : ''

    const isObjStm = dictText.includes('/ObjStm')
    const isImage =
      dictText.includes('/Subtype/Image') ||
      dictText.includes('/DCTDecode') ||
      dictText.includes('/JPXDecode')

    let dataStart = streamStart + 6
    if (raw[dataStart] === '\r') dataStart++
    if (raw[dataStart] === '\n') dataStart++

    // Use /Length for exact byte count — avoids CR+LF off-by-one truncation
    const lengthMatch = dictText.match(/\/Length\s+(\d+)/)
    let streamBytes: Buffer
    let nextPos: number

    if (lengthMatch) {
      const len = parseInt(lengthMatch[1], 10)
      streamBytes = buf.subarray(dataStart, dataStart + len)
      // Advance past the stream data to find endstream
      const endPos = raw.indexOf('endstream', dataStart + len - 5)
      nextPos = endPos >= 0 ? endPos + 9 : dataStart + len + 9
    } else {
      // Fallback: scan for endstream (original method)
      const streamEnd = raw.indexOf('endstream', dataStart)
      if (streamEnd < 0) break
      let dataEnd = streamEnd
      if (raw[dataEnd - 1] === '\n') dataEnd--
      if (raw[dataEnd - 1] === '\r') dataEnd--
      streamBytes = buf.subarray(dataStart, dataEnd)
      nextPos = streamEnd + 9
    }

    pos = nextPos

    if (streamBytes.length < 10 || isImage || isObjStm) continue

    const decompressed = tryDecompress(streamBytes)
    if (!decompressed) continue

    const tokens = extractTokensFromStream(decompressed)
    if (tokens.length < 8) continue

    const joined = tokens.join(' ')
    if (
      joined.includes('INVOICE') ||
      joined.includes('CREDIT') ||
      joined.includes('SOLD TO')
    ) {
      pages.push(tokens)
    }
  }

  return pages
}

// ---------------------------------------------------------------------------
// Item-splitting helpers (unchanged)
// ---------------------------------------------------------------------------

function isProductCodeToken(token: string): boolean {
  const parts = token.trim().split(/\s+/)
  if (!parts.length) return false
  const first = parts[0]

  if (first.startsWith('*')) return false
  if (first[0] >= '0' && first[0] <= '9') return false
  const skipWords = new Set([
    'CABLE', 'HXHD', 'TR', 'SC', 'ITEM', 'IN', 'SMOOTH', '1-GANG', '68P', '11/4',
  ])
  if (skipWords.has(first)) return false

  if (parts.length >= 2) {
    const second = parts[1]
    const hasDigit = /\d/.test(second)
    const looksLikeModel = hasDigit || /^[A-Z][A-Z0-9\-]+$/.test(second)
    if (looksLikeModel) return true
  }

  if (parts.length === 1 && /\d/.test(first)) return true
  return false
}

function splitDescIntoItems(descTokens: string[], numPrices: number): string[][] {
  if (numPrices === 0) return []
  if (numPrices === 1) return [descTokens]

  const codePositions = descTokens
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => isProductCodeToken(t))
    .map(({ i }) => i)

  if (codePositions.length === numPrices) {
    return codePositions.map((start, idx) => {
      const end = codePositions[idx + 1] ?? descTokens.length
      return descTokens.slice(start, end)
    })
  }

  if (codePositions.length > numPrices) {
    const trimmed = codePositions.slice(0, numPrices)
    return trimmed.map((start, idx) => {
      const end = trimmed[idx + 1] ?? descTokens.length
      return descTokens.slice(start, end)
    })
  }

  if (codePositions.length > 0) {
    const groups: string[][] = codePositions.map((start, idx) => {
      const end = codePositions[idx + 1] ?? descTokens.length
      return descTokens.slice(start, end)
    })
    while (groups.length < numPrices) groups.push([])
    return groups
  }

  return [descTokens, ...Array(numPrices - 1).fill([])]
}

// ---------------------------------------------------------------------------
// Per-page parser (unchanged)
// ---------------------------------------------------------------------------

function parsePage(tokens: string[]): {
  invoiceNumber: string
  poNumber: string
  date: string
  isCreditNote: boolean
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>
  totalDue: number
} | null {
  const findIdx = (label: string): number =>
    tokens.findIndex(t => t.toUpperCase() === label.toUpperCase())

  const isCreditNote = tokens.some(
    t => t.toUpperCase() === 'CREDIT DATE' || t.toUpperCase() === 'CREDIT NUMBER'
  )

  const invNumIdx = findIdx('INVOICE NUMBER')
  const creditNumIdx = findIdx('CREDIT NUMBER')
  const numIdx = invNumIdx >= 0 ? invNumIdx : creditNumIdx
  const invoiceNumber = numIdx >= 0 ? (tokens[numIdx + 1] || '') : ''

  const poIdx = findIdx('CUSTOMER PO NUMBER')
  const poNumber = poIdx >= 0 ? (tokens[poIdx + 1] || '') : ''

  const dateIdx = findIdx('INVOICE DATE')
  const creditDateIdx = findIdx('CREDIT DATE')
  const dIdx = dateIdx >= 0 ? dateIdx : creditDateIdx
  const date = dIdx >= 0 ? (tokens[dIdx + 1] || '') : ''

  const descIdx = findIdx('DESCRIPTION')
  const unitPriceIdx = findIdx('UNIT PRICE')
  const extPriceIdx = findIdx('EXT PRICE')
  const subtotalIdx = findIdx('SUBTOTAL')
  const totalIdx = findIdx('TOTAL DUE')

  let totalDue = 0
  if (totalIdx >= 0) {
    totalDue = parseFloat((tokens[totalIdx + 1] || '0').replace(',', '')) || 0
  }

  if (descIdx < 0 || unitPriceIdx < 0 || extPriceIdx < 0) return null

  const shipQtyIdx = findIdx('SHIP QTY')
  const qtys: number[] = []
  if (shipQtyIdx >= 0) {
    for (let i = shipQtyIdx + 1; i < descIdx; i++) {
      const n = parseFloat(tokens[i])
      if (!isNaN(n)) qtys.push(n)
    }
  }

  const descTokens = tokens.slice(descIdx + 1, unitPriceIdx)

  const uomIdx = findIdx('UOM')
  const prices: number[] = []
  const priceEnd = uomIdx > unitPriceIdx ? uomIdx : extPriceIdx
  for (let i = unitPriceIdx + 1; i < priceEnd; i++) {
    const n = parseFloat(tokens[i].replace(',', ''))
    if (!isNaN(n) && n > 0) prices.push(n)
  }

  const extPrices: number[] = []
  const extEnd = subtotalIdx >= 0 ? subtotalIdx : tokens.length
  for (let i = extPriceIdx + 1; i < extEnd; i++) {
    const n = parseFloat(tokens[i].replace(',', ''))
    if (!isNaN(n) && n > 0) extPrices.push(n)
  }

  if (prices.length === 0) return null

  const itemGroups = splitDescIntoItems(descTokens, prices.length)

  const items: Array<{ name: string; quantity: number; unitPrice: number; total: number }> = []

  itemGroups.forEach((group, i) => {
    const unitPrice = prices[i] || 0
    const extTotal = extPrices[i] || 0
    const rawQty =
      qtys[i] !== undefined
        ? qtys[i]
        : unitPrice > 0 && extTotal > 0
          ? Math.round(extTotal / unitPrice)
          : 1
    const qty = Math.abs(rawQty)

    if (qty <= 0 || unitPrice <= 0) return

    const nameParts = group.filter(
      t =>
        !/^\*[\d]+[A-Z]+\*?$/.test(t) &&
        !/^\*\*\s*(Original Sale|Cus PO)/.test(t) &&
        !/^Item is subject/.test(t)
    )
    const name = nameParts.join(' ').trim().substring(0, 80)
    if (!name) return

    items.push({ name, quantity: qty, unitPrice, total: extTotal || qty * unitPrice })
  })

  return { invoiceNumber, poNumber, date, isCreditNote, items, totalDue }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const pages = extractPDFPages(arrayBuffer)

    console.log(`Found ${pages.length} pages in PDF`)

    const allMaterials: Array<{
      name: string
      quantity: number
      unitPrice: number
      total: number
      invoiceNumber: string
      poNumber: string
      page: number
    }> = []

    let primaryDate = ''
    let grandTotal = 0
    const invoiceNumbersMap: Record<string, boolean> = {}

    pages.forEach((tokens, pageIdx) => {
      const parsed = parsePage(tokens)
      if (!parsed) return

      if (parsed.isCreditNote) {
        console.log(`Page ${pageIdx + 1} (${parsed.invoiceNumber}) — credit note skipped`)
        return
      }

      if (!primaryDate && parsed.date) primaryDate = parsed.date
      if (parsed.invoiceNumber) invoiceNumbersMap[parsed.invoiceNumber] = true
      grandTotal += parsed.totalDue

      console.log(`Page ${pageIdx + 1} (${parsed.invoiceNumber}): ${parsed.items.length} items`)
      parsed.items.forEach(item => {
        allMaterials.push({
          ...item,
          invoiceNumber: parsed.invoiceNumber,
          poNumber: parsed.poNumber,
          page: pageIdx + 1,
        })
      })
    })

    if (allMaterials.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `PDF parsed (${pages.length} pages) but no line items found.`,
        },
        { status: 422 }
      )
    }

    const invoiceNumbers = Object.keys(invoiceNumbersMap)

    return NextResponse.json({
      success: true,
      data: {
        id: `PARSED-${Date.now()}`,
        invoiceNumber: invoiceNumbers.join(', '),
        supplier: 'Viking Electric',
        date: primaryDate || new Date().toISOString().split('T')[0],
        poNumber: '',
        amount: grandTotal,
        totalPages: pages.length,
        invoiceCount: invoiceNumbers.length,
        materials: allMaterials,
      },
      message: `Extracted ${allMaterials.length} materials from ${invoiceNumbers.length} invoices (${pages.length} pages)`,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('PDF parse error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to parse PDF' },
      { status: 500 }
    )
  }
}