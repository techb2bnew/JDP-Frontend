export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company_name: string
  customer_name: string
  
}

export interface Job {
  id: string
  title: string
  customerId: string
  customerName: string
  location: string
  job_title: string
  status: 'active' | 'completed' | 'pending'
  type: 'service-based' | 'contract-based'
  assignedLabor?: [string, string],
  contractor: string
  customer: string
  description: string
  createdDate: string
  dueDate: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  priority: string
  billingStatus: string
  materials?: string[]
 
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

export type AdditionalCostArray = {
  description: string;
  amount: number;
}[];


export interface Invoice {
  id: string 
  customer_id: string;
  job_id: string;
  invoice_number: string;
  invoice_type: string;
  due_date: string;
  issue_date: string;
  description: string;
  additional_costs: string;
  labor_cost: string;
  subtotal: string;
  total_amount: string;
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
  // subtotal: number
    location: string
  taxRate: number
  taxAmount: number
  totalAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: string
  customer: Customer
  job: Job
  products: InvoiceItem[]
  additional_costs_details?: AdditionalCostArray
  tax_percentage: string
  tax_amount: string
}

export interface InvoiceTemplateProps {
  // inv: Invoice
  invoice: Invoice
}

export interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: any[];
  job?: {
    id: number;
    title: string;
  };
  jobs: Job[];
  suppliers: any[];
  onReload: () => void;
  onSave: (newInvoiceData: Partial<Invoice>) => void; // ✅ add this line
}
