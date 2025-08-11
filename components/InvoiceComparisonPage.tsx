'use client'

import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { 
  ArrowLeft,
  AlertTriangle,
  Eye,
  Send,
  DollarSign,
  CheckCircle
} from 'lucide-react'

const approvalData = [
  {
    id: 1,
    title: 'Electrical Panel Installation',
    customer: 'ABC Corporation • PO-2025-001-EP',
    discrepancy: { type: 'Minor Discrepancy', value: '1.3%' },
    status: 'Ready for Approval',
    bluesheet: { amount: '$1,910.00', items: 3, by: 'John Smith' },
    supplierInvoice: { amount: '$1,885.00', from: 'ElectroSupply Co' },
    customerDetails: { email: 'billing@abccorp.com', phone: '+1 (555) 123-4567', updated: 'Jan 23, 2025' }
  },
  {
    id: 2,
    title: 'Emergency Generator Setup',
    customer: 'Healthcare Center • PO-2025-003-GEN',
    discrepancy: { type: 'Perfect Match', value: null },
    status: 'Ready for Approval',
    bluesheet: { amount: '$8,200.00', items: 3 },
    supplierInvoice: { amount: '$8,200.00', from: 'ElectroSupply Co' },
    customerDetails: { email: 'finance@healthcenter.com', phone: '+1 (555) 987-6543' }
  }
]

export function InvoiceComparisonPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Invoice Approval & Review</h2>
          <p className="text-sm text-muted-foreground">Review, edit, and approve customer invoices</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ready for Approval</p>
              <p className="text-2xl font-bold">2</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg"><AlertTriangle className="h-6 w-6 text-yellow-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Eye className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sent to Customers</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><Send className="h-6 w-6 text-green-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">$10,085.00</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="h-6 w-6 text-green-600" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Approvals List */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Invoice Approvals</h3>
        {approvalData.map(item => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.customer}</p>
                </div>
                <div className="flex items-center gap-4">
                  {item.discrepancy.type === 'Minor Discrepancy' ? (
                    <span className="flex items-center text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-1 rounded-full">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {item.discrepancy.type} ({item.discrepancy.value})
                    </span>
                  ) : (
                     <span className="flex items-center text-xs font-medium bg-green-100 text-green-800 border border-green-300 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {item.discrepancy.type}
                    </span>
                  )}
                  <span className="flex items-center text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300 px-2 py-1 rounded-full">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* BlueSheet Details */}
                <div className="space-y-2">
                  <p className="font-semibold">BlueSheet</p>
                  <p className="text-2xl font-bold">{item.bluesheet.amount}</p>
                  <p className="text-sm text-muted-foreground">Items: {item.bluesheet.items}</p>
                  {item.bluesheet.by && <p className="text-sm text-muted-foreground">By: {item.bluesheet.by}</p>}
                </div>
                {/* Supplier Invoice */}
                <div className="space-y-2">
                  <p className="font-semibold">Supplier Invoice</p>
                  <p className="text-2xl font-bold">{item.supplierInvoice.amount}</p>
                  <p className="text-sm text-muted-foreground">From: {item.supplierInvoice.from}</p>
                </div>
                {/* Customer Details */}
                <div className="space-y-2">
                  <p className="font-semibold">Customer Details</p>
                  <p className="text-sm">Email: {item.customerDetails.email}</p>
                  <p className="text-sm">Phone: {item.customerDetails.phone}</p>
                  {item.customerDetails.updated && <p className="text-xs text-muted-foreground">Updated: {item.customerDetails.updated}</p>}
                </div>
              </div>
            </CardContent>
            <div className="bg-slate-50 px-6 py-3 flex justify-end items-center gap-3">
              <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" /> View Details</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><CheckCircle className="mr-2 h-4 w-4" /> Approval</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
