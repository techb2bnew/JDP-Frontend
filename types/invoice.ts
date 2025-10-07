export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Job {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  location: string;
  status: "active" | "completed" | "pending";
}

export interface InvoiceItem {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  supplierId?: number;
  jdp_sku?: string;
  unit?: string;
}

export interface LaborEntry {
  id: string;
  laborName: string;
  hours: number;
  hourlyRate: number;
  total: number;
  description: string;
   email?: string;
}

export interface AdditionalCost {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  jobId: number;
  jobTitle: string;
  type: "proposal_invoice" | "roughen" | "progressive" | "final";
  issueDate: string;
  dueDate: string;
  items?: InvoiceItem[];
  labor?: LaborEntry[];
  additionalCosts?: AdditionalCost[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  notes?: string;
  location?: string;
  createdBy: string;
  createdAt: string;
  emailAddress?: string;
  jobType?: string;
  priority?: string;
  materialsCost?: number;
  laborCost?: number;
  additionalCostAmount?: number;
}

export interface TimesheetEntry {
  id: string;
  employeeName: string;
  jobId: string;
  jobTitle: string;
  week: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  totalHours: number;
  billableHours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
}



export interface CreateEstimatePayload {
  estimate_title: string;
  customer_id: number;
  priority: "low" | "medium" | "high";
  valid_until: string;
  location: string;
  description: string;
  service_type: string;
  email_address: string;
  estimate_date: string;

  materials_cost: number;
  labor_cost: number;
  additional_costs: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;

  status: string;
  invoice_type: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;

  job_id: number;

  additional_cost: {
    description: string;
    amount: number;
  };

  custom_labor: {
    full_name: string;
    email: string;
    hours_worked: number;
    hourly_rate: number;
    job_id: number;
    is_custom: boolean;
  }[];

  custom_products: {
    product_name: string;
    supplier_id: number;
    supplier_sku: string;
    jdp_sku: string;
    stock_quantity: number;
    unit: string;
    job_id:number;
    is_custom: boolean;
    unit_cost: number;
  }[];
}