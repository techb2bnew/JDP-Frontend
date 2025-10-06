import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Job {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "cancelled";
  customerId: string;
  customerName: string;
  location: string;
  startDate: string;
  endDate?: string;
  assignedTo: string[];
  priority: "low" | "medium" | "high";
  budget: number;
  actualCost?: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  product_name: string;
  supplier_id: number;
  supplier_sku: string;
  jdp_sku: string;
  stock_quantity: number;
  unit: string;
  job_id: string;
  is_custom: boolean;
  unit_cost: number;
  createdAt: string;
  updatedAt: string;
}

interface Invoice {
  id: string;
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
  custom_labor: any[];
  custom_products: any[];
}

interface JobsState {
  jobs: Job[];
  selectedJob: Job | null;
  products: Product[];
  invoices: Invoice[];
  filter: {
    status: string;
    priority: string;
    search: string;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  jobs: [],
  selectedJob: null,
  products: [],
  invoices: [],
  filter: {
    status: "all",
    priority: "all",
    search: "",
  },
  isLoading: false,
  error: null,
};

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.jobs = action.payload;
    },
    addJob: (state, action: PayloadAction<Job>) => {
      state.jobs.push(action.payload);
    },
    updateJob: (state, action: PayloadAction<Job>) => {
      const index = state.jobs.findIndex((job) => job.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
    },
    deleteJob: (state, action: PayloadAction<string>) => {
      state.jobs = state.jobs.filter((job) => job.id !== action.payload);
    },
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter((p) => p.id !== action.payload);
    },
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.invoices = action.payload;
    },
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.invoices.push(action.payload);
    },
    deleteInvoice: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter(
        (inv) => inv.id !== action.payload
      );
    },
    setFilter: (state, action: PayloadAction<Partial<JobsState["filter"]>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setJobs,
  addJob,
  updateJob,
  deleteJob,
  setSelectedJob,
  setFilter,
  setLoading,
  setError,
  addProduct,
  deleteProduct,
  setInvoices,
  addInvoice,
  deleteInvoice,
} = jobsSlice.actions;

export default jobsSlice.reducer;
