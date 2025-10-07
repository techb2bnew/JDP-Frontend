export interface Job {
    id: string
    title: string
    type: 'service-based' | 'contract-based'
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
    assignedLeadLabor: string[]
    assignedLabor: string[]
    contractor?: string
    customer?: string
    description: string
    createdDate: string
    dueDate: string
    estimatedHours?: number
    actualHours?: number
    estimatedCost?: number
    actualCost?: number
    materials?: string[]
    address: string
    location?: string
    cityZip: string
    phone?: string
    email?: string
    billToAddress?: string
    billToCityZip?: string
    billToPhone?: string
    billToEmail?: string
    sameAsAddress: boolean
    priority: 'low' | 'medium' | 'high' 
    billingStatus?: 'pending' | 'invoiced' | 'paid'
    // Additional fields from API
    customerName?: string
    contractorName?: string
    createdBy?: string
    assignedLeadLaborDetails?: any[]
    assignedLaborDetails?: any[]
    assignedMaterialsDetails?: any[]
    leadLabors?:any[]
}

// Define a type for project summary
export interface ProjectSummary {
  estimate?: number
  actualCost?: number
  laborCost?: number
  materialsCost?: number
  message?: string
  success?: boolean
}

export interface Metric {
  value: number
  unit: string
  color: string
}

export interface DashboardMatrics {
  totalHoursWorked?: Metric
  totalMaterialUsed?: Metric
  totalLabourEntries?: Metric
  numberOfInvoices?: Metric
}

// Individual estimate interface
export interface Estimate {
  id: string;
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
  // items: InvoiceItem[]
  // labor: LaborEntry[]
  // additionalCosts: AdditionalCost // Single object as per your requirement
  taxRate: number
  taxAmount: number
  totalAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: string
}


export interface GetEstimatesResponse {
  estimates: Estimate[];
  message: string;
  success: boolean;
}

export interface Supplier {
  id: number;
  company_name: string;
  contact_person: string;
  supplier_code: string;
  user_id: number;
}

export interface JobDetailsPageProps {
  jobId: string
  onBack: () => void
  jobs: any[]
  setJobs: (jobs: any[]) => void
  projectSummary: ProjectSummary | null
  dashboardMetrics: DashboardMatrics | null
  estimates: Estimate[] | null
  onReload: () => void
}

export interface InvoiceStats {
  total: number;
  totalBilled: number;
  paid: number;
  pending: number;
};

export interface ApprovalItem {
  id: string
  type: 'bluesheet' | 'timesheet' | 'invoice' | 'job-completion'
  jobId: string
  jobTitle: string
  submittedBy: string
  submittedDate: string
  status: 'pending' | 'approved' | 'rejected'
  description: string
  amount?: number
}

export interface JobApprovalsProps {
  onBack: () => void
  jobs: Job[]
}

export interface JobCreationPageProps {
  onBack: () => void
  onJobCreated: (job: Job) => void
}