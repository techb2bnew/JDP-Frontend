import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { ArrowLeft, Upload, Download, Send, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

interface Job {
  id: string
  title: string
  type: 'service-based' | 'contract-based'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedLabor: string[]
  contractor?: string
  customer: string
  description: string
  createdDate: string
  dueDate: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  materials?: string[]
  location: string
  priority: 'low' | 'medium' | 'high'
  billingStatus?: 'pending' | 'invoiced' | 'paid'
}

interface ComparisonItem {
  id: string
  productName: string
  sku: string
  bluesheetQty: number
  bluesheetPrice: number
  supplierQty: number
  supplierPrice: number
  qtyDelta: number
  priceDelta: number
  status: 'match' | 'variance' | 'missing'
}

interface InvoiceComparisonProps {
  onBack: () => void
  jobs: Job[]
}

export function InvoiceComparison({ onBack }: InvoiceComparisonProps) {
  const [hasBluesheet, setHasBluesheet] = useState(true)
  const [hasSupplierInvoice, setHasSupplierInvoice] = useState(true)

  const [comparisonData] = useState<ComparisonItem[]>([
    {
      id: '1',
      productName: 'Electrical Panel - 200A',
      sku: 'EP-200A-001',
      bluesheetQty: 1,
      bluesheetPrice: 450.00,
      supplierQty: 1,
      supplierPrice: 465.00,
      qtyDelta: 0,
      priceDelta: 15.00,
      status: 'variance'
    },
    {
      id: '2',
      productName: 'Copper Wire 12 AWG',
      sku: 'CW-12AWG-500',
      bluesheetQty: 500,
      bluesheetPrice: 2.50,
      supplierQty: 500,
      supplierPrice: 2.50,
      qtyDelta: 0,
      priceDelta: 0,
      status: 'match'
    },
    {
      id: '3',
      productName: 'Circuit Breaker 20A',
      sku: 'CB-20A-001',
      bluesheetQty: 6,
      bluesheetPrice: 35.00,
      supplierQty: 8,
      supplierPrice: 32.00,
      qtyDelta: 2,
      priceDelta: -3.00,
      status: 'variance'
    }
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Match
          </Badge>
        )
      case 'variance':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Variance
          </Badge>
        )
      case 'missing':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Missing
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDelta = (delta: number, isCurrency: boolean = false) => {
    const prefix = delta > 0 ? '+' : ''
    if (isCurrency) {
      return `${prefix}${formatCurrency(delta)}`
    }
    return `${prefix}${delta}`
  }

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-red-600'
    if (delta < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
          <div>
            <h1 className="text-2xl font-medium text-[#2b2b2b]">Invoice Comparison</h1>
            <p className="text-sm text-[#2b2b2b]/60 mt-1">Compare bluesheet with supplier invoices</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2">
            <Send className="h-4 w-4" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00A1FF]" />
              Bluesheet Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-sm font-medium text-green-800">Bluesheet uploaded</p>
              <p className="text-xs text-green-600">bluesheet_JOB-2025-001.pdf</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00A1FF]" />
              Supplier Invoice Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-sm font-medium text-green-800">Supplier invoice uploaded</p>
              <p className="text-xs text-green-600">supplier_invoice_001.pdf</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle>Item Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">Product</TableHead>
                <TableHead className="text-white font-medium">SKU</TableHead>
                <TableHead className="text-white font-medium">Bluesheet Qty</TableHead>
                <TableHead className="text-white font-medium">Bluesheet Price</TableHead>
                <TableHead className="text-white font-medium">Supplier Qty</TableHead>
                <TableHead className="text-white font-medium">Supplier Price</TableHead>
                <TableHead className="text-white font-medium">Qty Delta</TableHead>
                <TableHead className="text-white font-medium">Price Delta</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((item, index) => (
                <TableRow key={item.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{item.sku}</TableCell>
                  <TableCell className="text-center">{item.bluesheetQty}</TableCell>
                  <TableCell className="text-center">{formatCurrency(item.bluesheetPrice)}</TableCell>
                  <TableCell className="text-center">{item.supplierQty}</TableCell>
                  <TableCell className="text-center">{formatCurrency(item.supplierPrice)}</TableCell>
                  <TableCell className={`text-center font-medium ${getDeltaColor(item.qtyDelta)}`}>
                    {formatDelta(item.qtyDelta)}
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getDeltaColor(item.priceDelta)}`}>
                    {formatDelta(item.priceDelta, true)}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}