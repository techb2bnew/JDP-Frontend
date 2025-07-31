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
}

export interface LaborEntry {
  id: string
  laborName: string
  hours: number
  hourlyRate: number
  total: number
  description: string
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
  jobId: string
  jobTitle: string
  type: 'proposed' | 'roughen' | 'progressive' | 'final'
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  labor: LaborEntry[]
  additionalCosts: AdditionalCost[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: string
}