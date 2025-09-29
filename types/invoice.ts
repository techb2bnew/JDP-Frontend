export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

export interface Job {
  id: string
  title: string
  customerId: string
  customerName: string
  location: string
  status: 'active' | 'completed' | 'pending'
}

export interface InvoiceItem {
  id: string
  sku: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  name: string
  unit: string
  supplier: string
}

export interface LaborEntry {
  id: string
  laborName: string
  hours: number
  hourlyRate: number
  total: number
  description: string
  laborEmail: string
  laborRole: string
  date: string
}

export interface AdditionalCost {
  description: string
  amount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  jobId: string | number
  jobTitle: string
  type: 'proposal_invoice' | 'estimate' | 'progressive_invoice' | 'final_invoice'
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  labor: LaborEntry[]
  additionalCosts: AdditionalCost // Single object as per your requirement
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: string
}