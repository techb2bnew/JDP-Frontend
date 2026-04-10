import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import {
  Plus,
  Trash2,
  Search,
  PlusCircle,
  Receipt,
  Eye,
  X,
  FileText,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import {
  Invoice,
  InvoiceItem,
  LaborEntry,
  AdditionalCost,
} from "../../types/invoice";
import { customersData, jobsData } from "../../data/invoiceData";
import { toast } from "sonner";
import { addInvoice } from "@/redux/slices/jobsSlice";
import { apiClient } from "@/utils/api";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Logo } from "../common/Logo";
import Image from "next/image";
import InvoiceLineItemsManager from "../common/invoice-line-items/InvoiceLineItemsManager";
import { useRouter } from "next/navigation";
// import { formatCurrency, formatDate } from '../../utils/invoiceUtils'

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (invoice: Partial<Invoice>) => void;
  jobs: any[];
  jobId?: number;
  onInvoiceSaved?: (invoice: any) => void;
  isViewMode?: boolean;
  viewInvoiceData?: any;
  renderInline?: boolean;
  onNavigateToJobAfterSend?: (jobId: string | number, estimateId?: number) => void;

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

  // additional_cost: {
  //   description: string;
  //   amount: number;
  // };

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
    job_id: number;
    is_custom: boolean;
    unit_cost: number;
  }[];
}

interface ProductFormData {
  id: number;
  product_name: string;
  name: string;
  sku: string;
  jdpSku: string;
  unitPrice: number;
  unit: string;
  stock: number;
  supplierId: number | null;
  supplierName?: string;
  description?: string;
}

/** Job APIs use `bill_to_address`; support camelCase too. */
function resolveBillToAddressFromJob(job: any): string {
  if (!job) return "";
  const v =
    job.bill_to_address ??
    job.billToAddress ??
    job.bill_to ??
    job.billTo;
  if (v == null || v === "") return "";
  return String(v).trim();
}

/** Normalize API/UI job type (`type`, `job_type`, hyphen vs underscore). */
function normalizeJobServiceType(job: any): "contract_based" | "service_based" | null {
  if (!job) return null;
  const raw = job.type ?? job.job_type ?? job.service_type ?? "";
  const s = String(raw).toLowerCase().replace(/-/g, "_").trim();
  if (s === "contract_based") return "contract_based";
  if (s === "service_based") return "service_based";
  return null;
}

function isJobContractBased(job: any): boolean {
  return normalizeJobServiceType(job) === "contract_based";
}

function resolveContractorIdFromJob(job: any): number | null {
  if (!job) return null;
  const raw =
    job.contractor_id ??
    job.contractorId ??
    (job.contractor && typeof job.contractor === "object"
      ? (job.contractor as { id?: unknown }).id
      : null) ??
    (typeof job.contractor === "number" ? job.contractor : null) ??
    (typeof job.contractor === "string" && String(job.contractor).trim() !== ""
      ? Number(job.contractor)
      : null);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveCustomerIdFromJob(job: any): number | null {
  if (!job) return null;
  const raw =
    job.customer_id ??
    job.customerId ??
    (job.customer && typeof job.customer === "object"
      ? (job.customer as { id?: unknown }).id
      : null) ??
    (typeof job.customer === "number" ? job.customer : null) ??
    (typeof job.customer === "string" && String(job.customer).trim() !== ""
      ? Number(job.customer)
      : null);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveJobForInvoicePayload(
  inlineJobId: string | number | null | undefined,
  jobsList: any[],
  jobs?: any[] | null,
  selectedJob?: any | null,
  currentJob?: any | null,
): any | null {
  const idStr =
    inlineJobId !== undefined && inlineJobId !== null
      ? String(inlineJobId).trim()
      : "";
  if (!idStr) {
    return selectedJob || currentJob || null;
  }
  return (
    jobsList.find((j: any) => String(j?.id ?? "") === idStr) ||
    jobs?.find((j: any) => String(j?.id ?? "") === idStr) ||
    (selectedJob && String(selectedJob?.id ?? "") === idStr
      ? selectedJob
      : null) ||
    (currentJob && String(currentJob?.id ?? "") === idStr ? currentJob : null) ||
    null
  );
}

function resolveInvoiceEmailFromJob(job: any, contractBased: boolean): string {
  if (!job) return "";
  if (contractBased) {
    const e =
      job.contractor_email ?? job.contractor?.email ?? job.email;
    return e != null && String(e).trim() !== "" ? String(e).trim() : "";
  }
  const e = job.customer_email ?? job.customer?.email ?? job.email;
  return e != null && String(e).trim() !== "" ? String(e).trim() : "";
}

function resolveInvoiceLocationFromJob(
  job: any,
  contractBased: boolean,
): string {
  if (!job) return "";
  const jobAddr = String(job.address ?? job.location ?? "").trim();
  if (jobAddr) return jobAddr;
  if (contractBased) {
    return String(
      job.contractorAddress ?? job.contractor?.address ?? "",
    ).trim();
  }
  return String(
    job.customerAddress ?? job.customer?.address ?? "",
  ).trim();
}

/** Secondary line under job title in job picker (customer vs contractor). */
function resolveJobListSubLabel(job: any): string {
  if (!job) return "";
  if (isJobContractBased(job)) {
    const raw =
      job.contractorName ??
      job.contractor_name ??
      (job.contractor &&
      typeof job.contractor === "object" &&
      !Array.isArray(job.contractor)
        ? (job.contractor as any).contractor_name ??
          (job.contractor as any).company_name ??
          (job.contractor as any).name ??
          (job.contractor as any).full_name
        : null) ??
      job.contractor_company_name ??
      job.contractorCompanyName;
    if (raw != null && String(raw).trim() !== "") return String(raw).trim();
    return "No contractor linked";
  }
  const raw =
    job.customerName ??
    (job.customer &&
    typeof job.customer === "object" &&
    !Array.isArray(job.customer)
      ? (job.customer as any).customer_name ??
        (job.customer as any).company_name ??
        (job.customer as any).name
      : null);
  if (raw != null && String(raw).trim() !== "") return String(raw).trim();
  return "No customer linked";
}

export const NewInvoiceDialog = ({
  open,
  onOpenChange,
  onSave,
  jobId,
  jobs,
  onInvoiceSaved,
  isViewMode = false,
  viewInvoiceData,
  renderInline,
  onNavigateToJobAfterSend
}: NewInvoiceDialogProps) => {
  console.log("trsting jobs", jobs);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [quickbookActionLoading, setQuickbookActionLoading] = useState<
    "send" | "save" | null
  >(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localJobs, setLocalJobs] = useState<any[]>(jobs || []);
  const [suppliers, setSuppliers] = useState<
    {
      id: number;
      company_name: string;
      users: {
        full_name: string;
      };
    }[]
  >([]);
  const [products, setProducts] = useState<ProductFormData[]>([]);

  console.log(jobs, "jobsjobs");

  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const dispatch = useDispatch();
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerId: "",
    jobId: jobId || undefined,
    type: "proposal_invoice",
    issueDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd",
    ),
    items: [],
    labor: [],
    additionalCosts: [],
    notes: "",
    taxRate: 0.08,
    priority: "medium",
  });

  console.log(products, "products", isViewMode, "isViewMode");

  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
  const [showInlineInvoiceForm, setShowInlineInvoiceForm] = useState(true);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    null,
  );
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewEstimateId, setPreviewEstimateId] = useState<number | null>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [estimateCost, setEstimateCost] = useState(null);

  const currentJob = selectedJob || jobs?.find((j: any) => j.id === jobId);
  /** Avoid re-applying bill from job on re-renders after user edits (same job id). */
  const billToSyncedJobIdRef = useRef<string | number | null>(null);
  const [invalidHeaderKeys, setInvalidHeaderKeys] = useState<string[]>([]);

  // Inline Invoice Data State
  const [inlineInvoiceData, setInlineInvoiceData] = useState({
    date: new Date().toISOString().split("T")[0],
    estimateNumber: "",
    customerName: "",
    customerAddress: "",
    billToAddress: "",
    billToAddressEnabled: true,
    poNumber: "",
    project: "",
    jobId: jobId || "",
    rep: "",
    dueDate: "",
    paymentCredits: 0,
    balanceDue: "",
    lineItems: [],
    notes: "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
    signatureText: "ACCEPTED BY________________DATE_____",
    invoiceType: "Estimate",
    customInvoiceType: "",
    paymentPercentage: 0,
    estimateTotal: 0,
    paymentHistory: [] as any[],
  });

  const previewJobId = useMemo(() => {
    const fromInline = (inlineInvoiceData as any)?.jobId;
    if (
      fromInline !== undefined &&
      fromInline !== null &&
      String(fromInline).trim() !== ""
    ) {
      return String(fromInline);
    }
    if (jobId !== undefined && jobId !== null) return String(jobId);
    return "";
  }, [inlineInvoiceData.jobId, jobId]);

  const previewSelectedJob = useMemo(() => {
    const activeJobId = String(inlineInvoiceData.jobId || jobId || "").trim();
    const jobFromState =
      selectedJob ||
      jobsList.find((j: any) => String(j?.id || "") === activeJobId) ||
      jobs?.find((j: any) => String(j?.id || "") === activeJobId) ||
      currentJob;

    const jobName =
      jobFromState?.title ||
      jobFromState?.job_title ||
      (activeJobId ? `Job #${activeJobId}` : "No job selected");

    return {
      id: activeJobId || "no-job",
      name: jobName,
    };
  }, [inlineInvoiceData.jobId, jobId, selectedJob, jobsList, jobs, currentJob]);

  const navigateAfterInvoiceSent = useCallback(
    (estimateId: number) => {
      const jid = previewJobId;
      const est = String(estimateId);
      const jobForNav = jid
        ? resolveJobForInvoicePayload(
            jid,
            jobsList,
            jobs,
            selectedJob,
            currentJob,
          )
        : null;

      if (isJobContractBased(jobForNav) && jid) {
        const cid = resolveContractorIdFromJob(jobForNav);
        const q = new URLSearchParams();
        q.set("jobId", jid);
        q.set("estimateId", est);
        if (cid) q.set("contractorId", String(cid));
        router.push(`/contractors?${q.toString()}`);
        return;
      }

      router.push(
        `/customers?jobId=${encodeURIComponent(jid)}&estimateId=${encodeURIComponent(est)}`,
      );
    },
    [previewJobId, jobsList, jobs, selectedJob, currentJob, router],
  );

  const [jobSearch, setJobSearch] = useState("");
  const [showJobResults, setShowJobResults] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const JOB_SEARCH_DEBOUNCE_MS = 800;
  const jobSearchFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (jobSearchFetchTimeoutRef.current !== null) {
        clearTimeout(jobSearchFetchTimeoutRef.current);
        jobSearchFetchTimeoutRef.current = null;
      }
    };
  }, []);

  const fetchJobsList = useCallback(async (searchQuery: string = "") => {
    try {
      setIsLoadingJobs(true);

      const response = searchQuery
        ? await apiClient.searchJobsByQuery(searchQuery, 1, 10)
        : await apiClient.getJobs(1, 10);

      const jobsData =
        response.data?.jobs ||
        response.data?.data ||
        response.data ||
        [];

      setJobsList(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobsList([]);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  // Update form when job is provided
  useEffect(() => {
    if (currentJob) {
      // Determine if it's contract-based (API often uses job_type)
      const isContractBased = isJobContractBased(currentJob);

      // Get customer/contractor name and address
      let customerName = "";
      let customerAddress = "";

      if (isContractBased) {
        customerName =
          currentJob.contractorName ||
          currentJob.contractor?.contractor_name ||
          currentJob.contractor?.name ||
          currentJob.contractor?.full_name ||
          "";
        customerAddress =
          currentJob.contractorAddress ||
          currentJob.contractor?.address ||
          currentJob.location ||
          currentJob.address ||
          "";
      } else {
        customerName =
          currentJob.customerName ||
          currentJob.customer?.customer_name ||
          currentJob.customer?.name ||
          "";
        customerAddress =
          currentJob.location ||
          currentJob.address ||
          currentJob.customer?.address ||
          "";
      }

      const stableJobKey = currentJob.id ?? jobId;
      const shouldApplyBillTo =
        billToSyncedJobIdRef.current === null ||
        String(billToSyncedJobIdRef.current) !== String(stableJobKey);

      if (shouldApplyBillTo) {
        billToSyncedJobIdRef.current = stableJobKey;
        setInlineInvoiceData((prev) => ({
          ...prev,
          customerName: customerName,
          customerAddress: customerAddress,
          billToAddress: resolveBillToAddressFromJob(currentJob),
          project: currentJob.title || currentJob.job_title || "",
          jobId: currentJob.id || jobId,
        }));
      } else {
        setInlineInvoiceData((prev) => ({
          ...prev,
          customerName: customerName,
          customerAddress: customerAddress,
          project: currentJob.title || currentJob.job_title || "",
          jobId: currentJob.id || jobId,
        }));
      }
    }
  }, [currentJob, jobId]);

  // Populate data from viewInvoiceData (used for preview/custom flows)
  useEffect(() => {
    if (viewInvoiceData) {
      console.log("Setting customer data:", {
        customer_name: viewInvoiceData?.contractor?.contractor_name,
        address: viewInvoiceData?.contractor?.address,
      });

      const customerName =
        viewInvoiceData?.contractor?.contractor_name ??
        viewInvoiceData?.customer?.customer_name;
      const customerAddress =
        viewInvoiceData?.contractor?.address ??
        viewInvoiceData?.customer?.address;
      const project = viewInvoiceData?.estimate_title || "No project name";

      console.log("Processed customer data:", {
        customerName,
        customerAddress,
        project,
      });

      // Force update with multiple approaches
      const updateData = () => {
        console.log("Updating inlineInvoiceData with:", {
          customerName,
          customerAddress,
          project,
        });

        setInlineInvoiceData((prev) => {
          const newData = {
            ...prev,
            date:
              viewInvoiceData.estimate_date ||
              new Date().toISOString().split("T")[0],
            estimateNumber: viewInvoiceData.invoice_number || "",
            customerName: customerName,
            customerAddress: customerAddress,
            billToAddress: viewInvoiceData.bill_to_address || "",
            billToAddressEnabled: !!viewInvoiceData.bill_to_address,
            poNumber: viewInvoiceData.po_number || "",
            project: project,
            jobId: viewInvoiceData.job_id || "",
            rep: viewInvoiceData.rep || "",
            dueDate: viewInvoiceData.due_date || "",
            paymentCredits: viewInvoiceData.payment_credits || 0,
            balanceDue: viewInvoiceData.balance_due || "",
            notes:
              viewInvoiceData.notes ||
              "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
            invoiceType:
              viewInvoiceData.invoice_type === "estimate"
                ? "Estimate"
                : viewInvoiceData.invoice_type === "down_payment"
                  ? "Downpayment Invoice"
                  : viewInvoiceData.invoice_type === "proposal_invoice"
                    ? "Rough Invoice"
                    : viewInvoiceData.invoice_type === "progressive_invoice"
                      ? "Progressive Invoice"
                      : viewInvoiceData.invoice_type === "final_invoice"
                        ? "Final Invoice"
                        : "Estimate",
            lineItems:
              viewInvoiceData.products?.map((product: any, index: number) => ({
                id: `item-${index}`,
                type: "item",
                headerKey: null,
                headerName: "",
                // parentHeaderKey: product.parent_header_key || null,
                parentHeaderName: product.parent_header_name || null,
                productId: product.id,
                qty: product.stock_quantity || 1,
                item: product.product_name || "",
                description: product.description || "",
                rate: product.jdp_price || product.unit_cost || 0,
                estimatedPrice: product.estimated_price || 0,
                total: product.total_cost || 0,
                searchQuery: "",
                showSearchResults: false,
                supplierId: product.supplier_id || 1,
                isCustomProduct: true,
              })) || [],
          };

          console.log("New data being set:", newData);
          return newData;
        });

        // Set selected job for proper display
        if (viewInvoiceData.job) {
          setSelectedJob(viewInvoiceData.job);
        }
      };

      // Try multiple approaches
      updateData();

      // Force update after a delay
      setTimeout(() => {
        console.log("Force updating after timeout...");
        updateData();
      }, 100);

      // Another force update
      setTimeout(() => {
        console.log("Second force update...");
        setInlineInvoiceData((prev) => ({
          ...prev,
          customerName: customerName,
          customerAddress: customerAddress,
          project: project,
        }));
      }, 200);
    }
  }, [viewInvoiceData]);

  // Seed jobsList from jobs prop so job appears selected
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setJobsList(jobs);
    }
  }, [jobs]);

  console.log(
    inlineInvoiceData.lineItems.map((item: any) => ({
      id: item.id,
      type: item.type,
      headerKey: item.headerKey,
      headerName: item.headerName,
      parentHeaderKey: item.parentHeaderKey,
      parentHeaderName: item.parentHeaderName,
      item: item.item,
    })),
    "dialog-line-items",
  );
  console.log(inlineInvoiceData, "inlineInvoiceData.lineItems");

  const itemsTotal = (inlineInvoiceData.lineItems || [])
    .filter((item: any) => item.type !== "header")
    .reduce((sum: number, item: any) => {
      return sum + Number(item.total || 0);
    }, 0);

  const laborTotal =
    newInvoice.labor?.reduce((sum, l) => sum + l.total_cost, 0) || 0;

  const additionalTotal =
    newInvoice.additionalCosts?.reduce((sum, c) => sum + c.amount, 0) || 0;

  const calculateInvoiceSubtotal = () => {
    return (
      (inlineInvoiceData.lineItems || [])
        .filter((item: any) => item.type !== "header")
        .reduce((sum: number, item: any) => {
          return sum + Number(item.total || 0);
        }, 0) +
      laborTotal +
      additionalTotal
    );
  };

  const subtotal = calculateInvoiceSubtotal();

  const taxRate = Number(inlineInvoiceData.taxRate ?? newInvoice.taxRate ?? 0);

  const taxAmount = Number((subtotal * taxRate).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  // Invoice Helper Functions
  // const calculateInvoiceSubtotal = () => {
  //   return inlineInvoiceData.lineItems
  //     .filter((item: any) => item.type !== "header")
  //     .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  // };

  // Send invoice to customer function
  const sendInvoiceToCustomer = async (invoiceId: number): Promise<boolean> => {
    try {
      // Get customer_id or contractor_id from viewInvoiceData if in view mode, otherwise from currentJob
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;
      /** Resolved job row for create mode (email / bill-to fallbacks) */
      let createModeJob: any | null = null;

      if (isViewMode && viewInvoiceData) {
        // In view mode, get from viewInvoiceData
        isContractBased =
          viewInvoiceData.service_type === "contract_based" ||
          viewInvoiceData.job?.job_type === "contract_based" ||
          isJobContractBased(viewInvoiceData.job) ||
          (viewInvoiceData.contractor_id !== null &&
            viewInvoiceData.contractor_id !== undefined);

        // Try multiple ways to get the IDs
        customerId =
          viewInvoiceData.customer_id ||
          viewInvoiceData.customer?.id ||
          (viewInvoiceData.customer &&
          typeof viewInvoiceData.customer === "number"
            ? viewInvoiceData.customer
            : null) ||
          null;

        contractorId =
          viewInvoiceData.contractor_id ||
          viewInvoiceData.contractor?.id ||
          (viewInvoiceData.contractor &&
          typeof viewInvoiceData.contractor === "number"
            ? viewInvoiceData.contractor
            : null) ||
          null;

        console.log("View mode - IDs from viewInvoiceData:", {
          customer_id: customerId,
          contractor_id: contractorId,
          isContractBased: isContractBased,
          viewInvoiceData: viewInvoiceData,
        });
      } else {
        createModeJob = resolveJobForInvoicePayload(
          inlineInvoiceData.jobId,
          jobsList,
          jobs,
          selectedJob,
          currentJob,
        );
        if (!createModeJob) {
          throw new Error("Job not found");
        }

        isContractBased = isJobContractBased(createModeJob);

        if (isContractBased) {
          contractorId = resolveContractorIdFromJob(createModeJob);
          console.log("Create mode - contractor_id from jobRow:", contractorId);
        } else {
          customerId = resolveCustomerIdFromJob(createModeJob);
          console.log("Create mode - customer_id from jobRow:", customerId);
        }
      }

      if (!customerId && !contractorId) {
        console.error("Customer/Contractor ID not found");
        toast.error("Customer/Contractor ID is missing. Cannot send invoice.");
        return false;
      }

      // Get token properly
      const getAuthToken = (): string | null => {
        if (typeof window !== "undefined") {
          const savedAuth = localStorage.getItem("jdp_auth");
          if (savedAuth) {
            try {
              const authData = JSON.parse(savedAuth);
              if (authData.token && authData.expires > Date.now()) {
                return authData.token;
              }
            } catch (error) {
              console.error("Error parsing auth data:", error);
            }
          }
        }
        return null;
      };

      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Get customer / contractor email
      let customerEmail = "customer@example.com";
      if (isViewMode && viewInvoiceData) {
        customerEmail =
          (isContractBased
            ? viewInvoiceData.contractor?.email
            : viewInvoiceData.customer?.email) ||
          viewInvoiceData.email_address ||
          "customer@example.com";
      } else if (createModeJob) {
        const partyEmail = resolveInvoiceEmailFromJob(
          createModeJob,
          isContractBased,
        );
        customerEmail =
          partyEmail || createModeJob.email || "customer@example.com";
      }

      const payload: any = {
        estimateNumber: inlineInvoiceData.estimateNumber || "Draft",
        estimateDate: new Date(inlineInvoiceData.date).toLocaleDateString(
          "en-US",
          {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          },
        ),
        customerName: inlineInvoiceData.customerName || "Customer",
        customerEmail: customerEmail,
        customerAddress: inlineInvoiceData.customerAddress || "",
        billToAddress: inlineInvoiceData.billToAddressEnabled
          ? inlineInvoiceData.billToAddress ||
            (createModeJob
              ? resolveBillToAddressFromJob(createModeJob)
              : "")
          : "",
        poNumber: inlineInvoiceData.poNumber || "",
        project: inlineInvoiceData.project || "",
        rep: inlineInvoiceData.rep || "",
        dueDate: inlineInvoiceData.dueDate || "",
        paymentCredits: inlineInvoiceData.paymentCredits || 0,
        balanceDue: inlineInvoiceData.balanceDue || "",
        lineItems: inlineInvoiceData.lineItems
          .filter((item: any) => item.type !== "header")
          .map((item: any) => ({
            id: item.id,
            qty: item.qty,
            item: item.item,
            type: item.type,
            parentHeaderKey: item.parentHeaderKey || null,
            parentHeaderName: item.parentHeaderName || null,
            description: item.description,
            rate: item.rate,
            total: item.total,
            is_custom: item.isCustomProduct === true,
          })),
        notes: inlineInvoiceData.notes || "",
        signatureText: inlineInvoiceData.signatureText || "",
        invoiceType:
          inlineInvoiceData.invoiceType === "Custom"
            ? inlineInvoiceData.customInvoiceType
            : inlineInvoiceData.invoiceType,
        subtotal: calculateInvoiceSubtotal(),
        total: calculateInvoiceSubtotal(),
      };

      // Add customer_id or contractor_id based on job type
      if (isContractBased && contractorId) {
        payload.contractor_id = contractorId;
      } else if (customerId) {
        payload.customer_id = customerId;
      }

      console.log("Sending invoice to customer with ID:", invoiceId);
      console.log("Payload:", payload);
      console.log(
        "isContractBased:",
        isContractBased,
        "customerId:",
        customerId,
        "contractorId:",
        contractorId,
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/sendInvoiceToCustomer/${invoiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      console.log("Response status:", response.status);
      console.log("Response:", response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to send invoice to customer: ${response.status}`,
        );
      }

      toast.success("Invoice sent successfully to customer!");
      return true;
    } catch (error) {
      console.error("Error sending invoice to customer:", error);
      toast.error(
        `Failed to send invoice to customer: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    }
  };

  const getFilteredProducts = (query: string) => {
    if (!query) return [];
    return products; // ✅ API se aaye results directly use karo
  };

  // const selectProduct = (itemId: string, product: any) => {
  //   // Check if product already exists in line items (by product ID, not name)
  //   const currentItem = inlineInvoiceData.lineItems.find(
  //     (item: any) => item.id === itemId,
  //   );
  //   const currentHeaderKey = currentItem.parentHeaderKey || null;

  //   // Check duplicate only inside same header group
  //   const isDuplicateInSameGroup = inlineInvoiceData.lineItems.some(
  //     (item: any) => {
  //       if (item.id === itemId) return false;
  //       if (item.type === "header") return false;

  //       return (
  //         item.parentHeaderKey === currentHeaderKey &&
  //         item.productId === product.id
  //       );
  //     },
  //   );

  //   if (isDuplicateInSameGroup) {
  //     toast.error("This product is already added in this section");
  //     return;
  //   }

  //   setInlineInvoiceData((prev) => ({
  //     ...prev,
  //     lineItems: prev.lineItems.map((item) => {
  //       if (item.id === itemId) {
  //         return {
  //           ...item,
  //           productId: product.id,
  //           item: product.name,
  //           description: product.description || "",
  //           rate: product.jdpPrice || 0,
  //           estimatedPrice: product.estimatedPrice || product.jdpPrice || 0,
  //           total:
  //             (item.qty || 1) *
  //             (product.estimatedPrice || product.jdpPrice || 0),
  //           showSearchResults: false,
  //           searchQuery: "",
  //           supplierId: product.supplierId || selectedSupplierId || 1,
  //           // Searched/selected product => not custom
  //           isCustomProduct: false,
  //         };
  //       }
  //       return item;
  //     }),
  //   }));
  // };

  const selectProduct = (itemId: string, product: any) => {
    const currentItem = inlineInvoiceData.lineItems.find(
      (item: any) => item.id === itemId,
    );

    if (!currentItem) return;

    const currentHeaderKey = currentItem.parentHeaderKey || null;
    const selectedSku = String(product.jdpSKU || "")
      .trim()
      .toLowerCase();

    // Check duplicate only inside same header group and by jdpSKU
    const isDuplicateInSameGroup = inlineInvoiceData.lineItems.some(
      (item: any) => {
        if (item.id === itemId) return false;
        if (item.type === "header") return false;
        if ((item.parentHeaderKey || null) !== currentHeaderKey) return false;

        const existingSku = String(item.jdpSKU || "")
          .trim()
          .toLowerCase();

        return !!selectedSku && !!existingSku && existingSku === selectedSku;
      },
    );

    if (isDuplicateInSameGroup) {
      toast(
        "This product is already added in this section. You can increase its quantity instead.",
        {
          duration: 3000,
        },
      );
      return;
    }

    setInlineInvoiceData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item: any) => {
        if (item.id === itemId) {
          const rate = Number(product.jdpPrice || 0);
          const estimatedPrice = Number(
            product.estimatedPrice || product.jdpPrice || 0,
          );
          const priceToUse = estimatedPrice > 0 ? estimatedPrice : rate;

          return {
            ...item,
            productId: product.id,
            estimate_product_id: product.id,
            jdpSKU: product.jdpSKU || null,
            item: product.name || "",
            description: product.description || "",
            rate,
            estimatedPrice,
            total: (item.qty || 1) * priceToUse,
            showSearchResults: false,
            searchQuery: "",
            supplierId: product.supplierId || selectedSupplierId || 1,
            // Searched/selected product => not custom
            isCustomProduct: false,
          };
        }
        return item;
      }),
    }));
  };
  const mapInvoiceTypeToAPI = (uiType: string): string => {
    const mapping: Record<string, string> = {
      Estimate: "estimate",
      "Downpayment Invoice": "down_payment",
      "Rough Invoice": "proposal_invoice",
      "Progressive Invoice": "progressive_invoice",
      "Final Invoice": "final_invoice",
    };
    return mapping[uiType] || "estimate";
  };

  const getSelectedInvoiceTypeLabel = () => {
    if (inlineInvoiceData.invoiceType === "Custom") {
      const customType = String(inlineInvoiceData.customInvoiceType || "").trim();
      return customType || "Invoice";
    }
    return inlineInvoiceData.invoiceType || "Invoice";
  };

  const getAvailableEstimates = () => {
    return [];
  };

  const handleEstimateSelection = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
  };

  const fetchSuppliersList = async (searchQuery: string = "") => {
    try {
      const response = searchQuery
        ? await apiClient.searchSuppliersByQuery(searchQuery)
        : await apiClient.getAllSuppliers();

      const suppliersData =
        response.data?.suppliers || response.data?.data || [];
      setSuppliersList(
        suppliersData.map((s: any) => ({
          id: s.id,
          name: s.company_name || s.users?.full_name || "Unknown",
          fullName: s.users?.full_name || "",
          companyName: s.company_name || "",
        })),
      );
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchProductsList = async (searchQuery: string = "") => {
    try {
      const response = searchQuery
        ? await apiClient.searchProductsByQuery(searchQuery)
        : await apiClient.getAllProducts();

      const productsData = response.data?.products || response.data?.data || [];
      setProductsList(
        productsData.map((p: any) => ({
          id: p.id,
          name: p.product_name,
          description: p.description || "",
          jdpSKU: p.jdp_sku,
          jdpPrice: p.jdp_price || p.unit_cost || 0,
          estimatedPrice: p.estimated_price || 0,
          supplierId: p.supplier_id || 1,
        })),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  console.log(productsList, "productss");
  const validateHeaderGroupsBeforeSubmit = (lineItems: any[] = []) => {
    const invalidHeaders = lineItems.filter(
      (item: any) =>
        item?.type === "header" &&
        item?.headerKey !== "standalone_header_key" &&
        !String(item?.headerName || "").trim(),
    );

    if (invalidHeaders.length > 0) {
      const invalidKeys = invalidHeaders
        .map((item: any) => item.headerKey)
        .filter(Boolean);

      setInvalidHeaderKeys(invalidKeys);

      toast.error("Please fill in all header group names before submitting");
      return false;
    }

    setInvalidHeaderKeys([]);
    return true;
  };

  // const fetchJobsList = async (searchQuery: string = "") => {
  //   try {
  //     const response = searchQuery
  //       ? await apiClient.searchJobsByQuery(searchQuery, 1, 10)
  //       : await apiClient.getJobs(1, 10);

  //     const jobsData = response.data || [];
  //     console.log(jobsData, "jobsData");
  //     setJobsList(jobsData);
  //   } catch (error) {
  //     console.error("Error fetching jobs:", error);
  //   }
  // };

   const handleJobSelection = (job: any) => {
  if (!job) return;

  billToSyncedJobIdRef.current = job.id;
  setEstimateCost(job?.estimatedCost);
  setSelectedJob(job);

  const isContractBased = isJobContractBased(job);

  let customerName = "";
  let customerAddress = "";

  if (isContractBased) {
    customerName =
      job.contractorName ||
      job.contractor?.contractor_name ||
      job.contractor?.name ||
      job.contractor?.full_name ||
      "";

    customerAddress =
      job.contractorAddress ||
      job.contractor?.address ||
      job.location ||
      job.address ||
      "";
  } else {
    customerName =
      job.customerName ||
      job.customer?.customer_name ||
      job.customer?.name ||
      "";

    customerAddress =
      job.location || job.address || job.customer?.address || "";
  }

  setInlineInvoiceData((prev) => ({
    ...prev,
    jobId: job.id,
    customerName,
    customerAddress,
    billToAddress: resolveBillToAddressFromJob(job),
    project: job.title || job.job_title || "",
  }));

  setJobSearch(job.title || job.job_title || "");
  setShowJobResults(false);

  if (validationErrors.jobId) {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.jobId;
      return newErrors;
    });
  }
};

  const handleSaveInvoiceAsDraft = async () => {
    // Validation
    const errors: Record<string, string> = {};
        console.log(errors, "::errors");


    if (!inlineInvoiceData.jobId) {
      errors.jobId = "Please select a job first";
    }

    if (!inlineInvoiceData.project) {
      errors.project = "Project field is required";
    }

    // if (inlineInvoiceData.lineItems.length === 0 || !inlineInvoiceData.lineItems[0].item) {
    //   errors.lineItems = 'Please add at least one product item'
    // }
    const invoiceItemRows = inlineInvoiceData.lineItems.filter(
      (item: any) => item.type !== "header",
    );
    console.log(inlineInvoiceData.lineItems, "inlineInvoiceData.lineItems");

    if (invoiceItemRows.length === 0) {
      errors.lineItems = "Please add at least one product item";
    }
        if (!validateHeaderGroupsBeforeSubmit(inlineInvoiceData.lineItems)) {
          return;
        }
        if (!validateLineItems(inlineInvoiceData.lineItems)) return;

        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          toast.error("Please fix the validation errors");
          return;
        }


    setValidationErrors({});
    setSavingDraft(true);
    try {
      const subtotal = calculateInvoiceSubtotal();

      const invoiceItemRows = inlineInvoiceData.lineItems.filter(
        (item: any) => item.type !== "header",
      );

      const customProducts = invoiceItemRows.map((item: any) => {
        const base = {
          product_name: item.item,
          description: item.description || "",
          supplier_id: item.supplierId || selectedSupplierId || 1,
          supplier_sku: item.item.substring(0, 10),
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: item.qty,
          unit: "unit",
          job_id: Number(inlineInvoiceData.jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total,
          is_custom: item.isCustomProduct === true,
          section_name: item.parentHeaderName || null,
          // parent_header_key: item.parentHeaderKey || null,
          parent_header_name: item.parentHeaderName || null,
        } as any;

        if (!item.isCustomProduct && item.productId) {
          base.id = item.productId;
        }

        return base;
      });
      // Get customer_id or contractor_id - from viewInvoiceData if in view mode, otherwise from resolved job row
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;
      let draftJob: any | null = null;

      if (isViewMode && viewInvoiceData) {
        // In view mode, get from viewInvoiceData
        isContractBased =
          viewInvoiceData.service_type === "contract_based" ||
          viewInvoiceData.job?.job_type === "contract_based" ||
          isJobContractBased(viewInvoiceData.job) ||
          (viewInvoiceData.contractor_id !== null &&
            viewInvoiceData.contractor_id !== undefined);

        customerId =
          viewInvoiceData.customer_id ||
          viewInvoiceData.customer?.id ||
          (viewInvoiceData.customer &&
          typeof viewInvoiceData.customer === "number"
            ? viewInvoiceData.customer
            : null) ||
          null;

        contractorId =
          viewInvoiceData.contractor_id ||
          viewInvoiceData.contractor?.id ||
          (viewInvoiceData.contractor &&
          typeof viewInvoiceData.contractor === "number"
            ? viewInvoiceData.contractor
            : null) ||
          null;
      } else {
        draftJob = resolveJobForInvoicePayload(
          inlineInvoiceData.jobId,
          jobsList,
          jobs,
          selectedJob,
          currentJob,
        );
        if (!draftJob) {
          toast.error("Job not found");
          setSavingDraft(false);
          return;
        }
        isContractBased = isJobContractBased(draftJob);
        contractorId = isContractBased
          ? resolveContractorIdFromJob(draftJob)
          : null;
        customerId = !isContractBased
          ? resolveCustomerIdFromJob(draftJob)
          : null;
      }

      const emailForDraft =
        isViewMode && viewInvoiceData
          ? (isContractBased
              ? viewInvoiceData.contractor?.email
              : viewInvoiceData.customer?.email) ||
            viewInvoiceData.email_address ||
            "customer@example.com"
          : draftJob
            ? resolveInvoiceEmailFromJob(draftJob, isContractBased) ||
              draftJob.email ||
              "customer@example.com"
            : currentJob?.email || "customer@example.com";

      const billToForDraft = inlineInvoiceData.billToAddressEnabled
        ? inlineInvoiceData.billToAddress ||
          (draftJob ? resolveBillToAddressFromJob(draftJob) : "") ||
          (isViewMode && viewInvoiceData
            ? viewInvoiceData.bill_to_address || ""
            : "")
        : "";

      const locationForDraft =
        (draftJob || currentJob
          ? resolveInvoiceLocationFromJob(
              draftJob || currentJob,
              isContractBased,
            )
          : "") ||
        (isViewMode && viewInvoiceData
          ? String(
              viewInvoiceData.job?.address ||
                viewInvoiceData.location ||
                viewInvoiceData.customer?.address ||
                viewInvoiceData.contractor?.address ||
                "",
            ).trim()
          : "") ||
        String(inlineInvoiceData.customerAddress || "").trim();

      const payload: any = {
        job_id: Number(inlineInvoiceData.jobId),
        estimate_title:
          inlineInvoiceData.project ||
          draftJob?.title ||
          draftJob?.job_title ||
          (isViewMode && viewInvoiceData?.estimate_title) ||
          currentJob?.title ||
          currentJob?.job_title,
        priority: "medium" as "low" | "medium" | "high",
        service_type: isContractBased ? "contract_based" : "service_based",
        email_address: emailForDraft,
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        bill_to_address: billToForDraft,
        location: locationForDraft,
        description: inlineInvoiceData.notes || "",
        notes: inlineInvoiceData.notes || "",
        status: "draft",
        invoice_type: mapInvoiceTypeToAPI(inlineInvoiceData.invoiceType),
        total_amount: subtotal,
        custom_products: customProducts,
      };

      // Add customer_id or contractor_id based on job type
      if (isContractBased && contractorId) {
        payload.contractor_id = contractorId;
      } else if (customerId) {
        payload.customer_id = customerId;
      }

      console.log("Draft invoice payload with IDs:", {
        customer_id: payload.customer_id,
        contractor_id: payload.contractor_id,
        isContractBased: isContractBased,
      });

      await apiClient.createEstimate(payload as any);
      toast.success("Invoice saved as draft!");

      // Refresh the estimates list
      if (onInvoiceSaved) {
        onInvoiceSaved(payload);
      }

      onOpenChange(false);

      // Reset form
      billToSyncedJobIdRef.current = null;
      setInlineInvoiceData({
        date: new Date().toISOString().split("T")[0],
        estimateNumber: "",
        customerName: "",
        customerAddress: "",
        billToAddress: "",
        billToAddressEnabled: true,
        poNumber: "",
        project: "",
        jobId: jobId || "",
        rep: "",
        dueDate: "",
        paymentCredits: 0,
        balanceDue: "",
        lineItems: [],
        notes: "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
        signatureText: "ACCEPTED BY________________DATE_____",
        invoiceType: "Estimate",
        customInvoiceType: "",
        paymentPercentage: 0,
        estimateTotal: 0,
        paymentHistory: [],
      });
      setSelectedJob(null);
      setValidationErrors({});
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setSavingDraft(false);
    }
  };
// parent component
const [invalidLineItemIds, setInvalidLineItemIds] = useState<string[]>([]);

const validateLineItems = (lineItems: any[] = []) => {
  const invalidItems = lineItems.filter((row) => {
    if (row.type !== "item") return false;

    const name = String(row.item || row.product_name || "").trim();
    return !name;
  });

  if (invalidItems.length > 0) {
    setInvalidLineItemIds(invalidItems.map((row) => row.id));
    toast.error("Item's product_name is not allowed to be empty");
    return false;
  }

  setInvalidLineItemIds([]);
  return true;
};

  const handlePreviewAndSend = async () => {
    // Validation
    const errors: Record<string, string> = {};
    

    if (!inlineInvoiceData.jobId) {
      errors.jobId = "Please select a job first";
    }

    if (!inlineInvoiceData.project) {
      errors.project = "Project field is required";
    }

    if (
      inlineInvoiceData.lineItems.length === 0
      // !inlineInvoiceData.lineItems[0].item
    ) {
      errors.lineItems = "Please add at least one product item";
    }
      if (!validateHeaderGroupsBeforeSubmit(inlineInvoiceData.lineItems)) {
        return;
      }
      if (!validateLineItems(inlineInvoiceData.lineItems)) return;

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Please fix the validation errors");
        return;
      }
  


    setValidationErrors({});
    setSendingInvoice(true);
    try {
      const subtotal = calculateInvoiceSubtotal();

      const invoiceItemRows = inlineInvoiceData.lineItems.filter(
        (item: any) => item.type !== "header",
      );

      const customProducts = invoiceItemRows.map((item: any) => {
        const base = {
          product_name: item.item,
          description: item.description || "",
          supplier_id: item.supplierId || selectedSupplierId || 1,
          supplier_sku: item.item.substring(0, 10),
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: item.qty,
          unit: "unit",
          job_id: Number(inlineInvoiceData.jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total,
          is_custom: item.isCustomProduct === true,
          section_name: item.parentHeaderName || null,
          // parent_header_key: item.parentHeaderKey || null,
          parent_header_name: item.parentHeaderName || null,
        } as any;

        if (!item.isCustomProduct && item.productId) {
          base.id = item.productId;
        }

        return base;
      });
      console.log(inlineInvoiceData.lineItems,"customProducts");
      // return;
      

      // Get customer_id or contractor_id - from viewInvoiceData if in view mode, otherwise from resolved job row
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;
      let previewJob: any | null = null;

      if (isViewMode && viewInvoiceData) {
        // In view mode, get from viewInvoiceData
        isContractBased =
          viewInvoiceData.service_type === "contract_based" ||
          viewInvoiceData.job?.job_type === "contract_based" ||
          isJobContractBased(viewInvoiceData.job) ||
          (viewInvoiceData.contractor_id !== null &&
            viewInvoiceData.contractor_id !== undefined);

        customerId =
          viewInvoiceData.customer_id ||
          viewInvoiceData.customer?.id ||
          (viewInvoiceData.customer &&
          typeof viewInvoiceData.customer === "number"
            ? viewInvoiceData.customer
            : null) ||
          null;

        contractorId =
          viewInvoiceData.contractor_id ||
          viewInvoiceData.contractor?.id ||
          (viewInvoiceData.contractor &&
          typeof viewInvoiceData.contractor === "number"
            ? viewInvoiceData.contractor
            : null) ||
          null;
      } else {
        previewJob = resolveJobForInvoicePayload(
          inlineInvoiceData.jobId,
          jobsList,
          jobs,
          selectedJob,
          currentJob,
        );
        if (!previewJob) {
          toast.error("Job not found");
          setSendingInvoice(false);
          return;
        }
        isContractBased = isJobContractBased(previewJob);
        contractorId = isContractBased
          ? resolveContractorIdFromJob(previewJob)
          : null;
        customerId = !isContractBased
          ? resolveCustomerIdFromJob(previewJob)
          : null;
      }

      const emailForPreview =
        isViewMode && viewInvoiceData
          ? (isContractBased
              ? viewInvoiceData.contractor?.email
              : viewInvoiceData.customer?.email) ||
            viewInvoiceData.email_address ||
            "customer@example.com"
          : previewJob
            ? resolveInvoiceEmailFromJob(previewJob, isContractBased) ||
              previewJob.email ||
              "customer@example.com"
            : currentJob?.email || "customer@example.com";

      const billToForPreview = inlineInvoiceData.billToAddressEnabled
        ? inlineInvoiceData.billToAddress ||
          (previewJob ? resolveBillToAddressFromJob(previewJob) : "") ||
          (isViewMode && viewInvoiceData
            ? viewInvoiceData.bill_to_address || ""
            : "")
        : "";

      const locationForPreview =
        (previewJob || currentJob
          ? resolveInvoiceLocationFromJob(
              previewJob || currentJob,
              isContractBased,
            )
          : "") ||
        (isViewMode && viewInvoiceData
          ? String(
              viewInvoiceData.job?.address ||
                viewInvoiceData.location ||
                viewInvoiceData.customer?.address ||
                viewInvoiceData.contractor?.address ||
                "",
            ).trim()
          : "") ||
        String(inlineInvoiceData.customerAddress || "").trim();

      const payload: any = {
        job_id: Number(inlineInvoiceData.jobId),
        estimate_title:
          inlineInvoiceData.project ||
          previewJob?.title ||
          previewJob?.job_title ||
          (isViewMode && viewInvoiceData?.estimate_title) ||
          currentJob?.title ||
          currentJob?.job_title,
        priority: "medium" as "low" | "medium" | "high",
        service_type: isContractBased ? "contract_based" : "service_based",
        email_address: emailForPreview,
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        bill_to_address: billToForPreview,
        location: locationForPreview,
        description: inlineInvoiceData.notes || "",
        notes: inlineInvoiceData.notes || "",
        // Create as draft first; send happens from preview modal confirmation
        status: "draft",
        invoice_type: mapInvoiceTypeToAPI(inlineInvoiceData.invoiceType),
        custom_products: customProducts,
        total_amount: subtotal,
        estimate_source_type: estimateCost
          ? "estimate_job"
          : "time_material_job",
      };

      // Add customer_id or contractor_id based on job type
      if (isContractBased && contractorId) {
        payload.contractor_id = contractorId;
      } else if (customerId) {
        payload.customer_id = customerId;
      }

      console.log("Send invoice payload with IDs:", {
        customer_id: payload.customer_id,
        contractor_id: payload.contractor_id,
        isContractBased: isContractBased,
      });

      const response = await apiClient.createEstimate(payload as any);
      const createdId =
        Number((response as any)?.data?.id) ||
        Number((response as any)?.id) ||
        Number((response as any)?.data?.data?.id) ||
        null;

      if (!createdId) {
        throw new Error("Estimate ID not returned from createEstimate");
      }

      setPreviewEstimateId(createdId);
      toast.success("Invoice created successfully!");

      // Open preview dialog; send is triggered from modal button
      setShowPreviewDialog(true);
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleSendFromPreview = async () => {
    if (!previewEstimateId) {
      toast.error("Estimate not found. Please try preview again.");
      return;
    }

    setSendingInvoice(true);
    try {
      const ok = await sendInvoiceToCustomer(previewEstimateId);
      if (!ok) return;

      // Now that the flow is complete, allow parent to refresh/navigate if it wants
      onInvoiceSaved?.({
        id: previewEstimateId,
        job_id: previewJobId,
      });

      setShowPreviewDialog(false);
      onOpenChange(false);

      // Reset form (same shape as existing reset logic)
      billToSyncedJobIdRef.current = null;
      setInlineInvoiceData({
        date: new Date().toISOString().split("T")[0],
        estimateNumber: "",
        customerName: "",
        customerAddress: "",
        billToAddress: "",
        billToAddressEnabled: true,
        poNumber: "",
        project: "",
        jobId: jobId || "",
        rep: "",
        dueDate: "",
        paymentCredits: 0,
        balanceDue: "",
        lineItems: [],
        notes: "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
        signatureText: "ACCEPTED BY________________DATE_____",
        invoiceType: "Estimate",
        customInvoiceType: "",
        paymentPercentage: 0,
        estimateTotal: 0,
        paymentHistory: [],
      });
      setSelectedJob(null);
      setValidationErrors({});
      setPreviewEstimateId(null);

      if (onNavigateToJobAfterSend) {
        onNavigateToJobAfterSend(previewJobId, previewEstimateId);
      }

      navigateAfterInvoiceSent(previewEstimateId);
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleQuickbookFromPreview = async (action: "send" | "save") => {
    if (!previewEstimateId) {
      toast.error("Estimate not found. Please try preview again.");
      return;
    }

    setQuickbookActionLoading(action);
    try {
      const invoiceItemRows = inlineInvoiceData.lineItems.filter(
        (item: any) => item.type !== "header",
      );

      const customProducts = invoiceItemRows.map((item: any) => {
        const base = {
          product_name: item.item,
          description: item.description || "",
          supplier_id: item.supplierId || selectedSupplierId || 1,
          supplier_sku: item.item?.substring?.(0, 10) || "",
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: item.qty,
          unit: "unit",
          job_id: Number(inlineInvoiceData.jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total,
          is_custom: item.isCustomProduct === true,
          section_name: item.parentHeaderName || null,
          parent_header_name: item.parentHeaderName || null,
        } as any;

        if (!item.isCustomProduct && item.productId) {
          base.id = item.productId;
        }
        return base;
      });

      const selectedInvoiceType =
        inlineInvoiceData.invoiceType === "Custom"
          ? inlineInvoiceData.customInvoiceType
          : inlineInvoiceData.invoiceType;
      const selectedJobFromList = resolveJobForInvoicePayload(
        inlineInvoiceData.jobId,
        jobsList,
        jobs,
        selectedJob,
        currentJob,
      );

      const isContractBased = isJobContractBased(selectedJobFromList);

      const customerId = !isContractBased
        ? resolveCustomerIdFromJob(selectedJobFromList)
        : null;

      const contractorId = isContractBased
        ? resolveContractorIdFromJob(selectedJobFromList)
        : null;

      const qbEmail = selectedJobFromList
        ? resolveInvoiceEmailFromJob(selectedJobFromList, isContractBased) ||
          selectedJobFromList.email ||
          "customer@example.com"
        : currentJob?.email || "customer@example.com";

      const payload: any = {
        job_id: Number(inlineInvoiceData.jobId),
        invoice_type: mapInvoiceTypeToAPI(selectedInvoiceType),
        estimate_title:
          inlineInvoiceData.project ||
          selectedJobFromList?.title ||
          selectedJobFromList?.job_title ||
          currentJob?.title,
        priority: "medium" as "low" | "medium" | "high",
        service_type: isContractBased ? "contract_based" : "service_based",
        email_address: qbEmail,
        estimate_date: inlineInvoiceData.date,
        due_date: inlineInvoiceData.dueDate || "",
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        bill_to_address: inlineInvoiceData.billToAddressEnabled
          ? inlineInvoiceData.billToAddress ||
            (selectedJobFromList
              ? resolveBillToAddressFromJob(selectedJobFromList)
              : "")
          : "",
        location: selectedJobFromList
          ? resolveInvoiceLocationFromJob(
              selectedJobFromList,
              isContractBased,
            )
          : "",
        description: inlineInvoiceData.notes || "",
        notes: inlineInvoiceData.notes || "",
        total_amount: calculateInvoiceSubtotal(),
        custom_products: customProducts,
        invoice_source: "quickbook",
        quickbook_action:
          action === "send" ? "sendtoquickbook" : "sevetoquickbook",
        ...(isContractBased && contractorId
          ? { contractor_id: contractorId }
          : customerId
            ? { customer_id: customerId }
            : {}),
      };

      const qbResponse = await apiClient.createEstimate(payload as any);
      const createdId =
        Number((qbResponse as any)?.data?.id) ||
        Number((qbResponse as any)?.id) ||
        Number((qbResponse as any)?.data?.data?.id) ||
        previewEstimateId;
      toast.success(
        action === "send"
          ? "Send Invoice from QuickBooks"
          : "Save Invoice to QuickBooks",
      );

      onInvoiceSaved?.({
        id: createdId,
        job_id: previewJobId,
      });

      setShowPreviewDialog(false);
      onOpenChange(false);

      billToSyncedJobIdRef.current = null;
      setInlineInvoiceData({
        date: new Date().toISOString().split("T")[0],
        estimateNumber: "",
        customerName: "",
        customerAddress: "",
        billToAddress: "",
        billToAddressEnabled: true,
        poNumber: "",
        project: "",
        jobId: jobId || "",
        rep: "",
        dueDate: "",
        paymentCredits: 0,
        balanceDue: "",
        lineItems: [],
        notes: "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
        signatureText: "ACCEPTED BY________________DATE_____",
        invoiceType: "Estimate",
        customInvoiceType: "",
        paymentPercentage: 0,
        estimateTotal: 0,
        paymentHistory: [],
      });
      setSelectedJob(null);
      setValidationErrors({});
      setPreviewEstimateId(null);

      if (onNavigateToJobAfterSend) {
        onNavigateToJobAfterSend(previewJobId, createdId);
      }

      navigateAfterInvoiceSent(createdId);
    } catch (error: any) {
      console.error("Quickbook action failed:", error);
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "";

      toast.error(
        apiMessage ||
          (action === "send"
            ? "Failed to send invoice from QuickBooks"
            : "Failed to save invoice to QuickBooks"),
      );
    } finally {
      setQuickbookActionLoading(null);
    }
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}`,
      sku: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total_cost: 0,
      supplierId: 1,
      productId: 0,
    };
    setNewInvoice((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const updatedItems = [...(newInvoice.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].total_cost =
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    if (field === "total_cost") {
      updatedItems[index].total_cost = value;
    }

    setNewInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const removeInvoiceItem = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index),
    }));
  };

  const addLaborEntry = () => {
    const newLabor: LaborEntry = {
      id: `LAB-${Date.now()}`,
      laborName: "",
      hours: 0,
      hourlyRate: 0,
      total_cost: 0,
      description: "",
    };
    setNewInvoice((prev) => ({
      ...prev,
      labor: [...(prev.labor || []), newLabor],
    }));
  };

  const updateLaborEntry = (
    index: number,
    field: keyof LaborEntry,
    value: any,
  ) => {
    const updatedLabor = [...(newInvoice.labor || [])];
    updatedLabor[index] = { ...updatedLabor[index], [field]: value };

    if (field === "hours" || field === "hourlyRate") {
      updatedLabor[index].total_cost =
        updatedLabor[index].hours * updatedLabor[index].hourlyRate;
    }

    if (field === "total_cost") {
      updatedLabor[index].total_cost = value;
    }

    setNewInvoice((prev) => ({ ...prev, labor: updatedLabor }));
  };

  const removeLaborEntry = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      labor: prev.labor?.filter((_, i) => i !== index),
    }));
  };

  const addAdditionalCost = () => {
    setNewInvoice((prev) => ({
      ...prev,
      additionalCosts: [
        ...(prev.additionalCosts || []),
        { description: "", amount: 0 },
      ],
    }));
  };

  const updateAdditionalCost = (
    index: number,
    field: "description" | "amount",
    value: any,
  ) => {
    const updatedCosts = [...(newInvoice.additionalCosts || [])];
    updatedCosts[index] = { ...updatedCosts[index], [field]: value };
    setNewInvoice((prev) => ({ ...prev, additionalCosts: updatedCosts }));
  };

  const removeAdditionalCost = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts?.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => prev + 1);
  };

  const validateStep = (step: number) => {
    let stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!newInvoice.customerId)
        stepErrors.customerId = "Customer is required";
      if (!newInvoice.jobId) stepErrors.jobId = "Job is required";
      if (!newInvoice.type) stepErrors.type = "Invoice type is required";
      if (!newInvoice.issueDate)
        stepErrors.issueDate = "Issue date is required";
      if (!newInvoice.dueDate) stepErrors.dueDate = "Due date is required";
    }

    if (step === 2 && (newInvoice.items?.length || 0) > 0) {
      newInvoice.items!.forEach((item, i) => {
        if (!item.sku)
          stepErrors[`item_${i}_sku`] = `Item ${i + 1}: SKU required`;
        if (!item.description)
          stepErrors[`item_${i}_desc`] = `Item ${i + 1}: Description required`;
        if (item.quantity <= 0)
          stepErrors[`item_${i}_qty`] = `Item ${i + 1}: Quantity must be > 0`;
        if (item.unitPrice <= 0)
          stepErrors[`item_${i}_price`] =
            `Item ${i + 1}: Unit price must be > 0`;
      });
    }

    if (step === 3 && (newInvoice.labor?.length || 0) > 0) {
      newInvoice.labor!.forEach((labor, i) => {
        if (!labor.laborName)
          stepErrors[`labor_${i}_name`] = `Labor ${i + 1}: Name required`;
        if (labor.hours <= 0)
          stepErrors[`labor_${i}_hours`] = `Labor ${i + 1}: Hours must be > 0`;
        if (labor.hourlyRate <= 0)
          stepErrors[`labor_${i}_rate`] =
            `Labor ${i + 1}: Hourly rate must be > 0`;
      });
    }

    // if (step === 4 && (newInvoice.additionalCosts?.length || 0) > 0) {
    //   newInvoice.additionalCosts!.forEach((cost, i) => {
    //     if (!cost.description) stepErrors[`cost_${i}_desc`] = `Cost ${i + 1}: Description required`
    //     if (cost.amount <= 0) stepErrors[`cost_${i}_amt`] = `Cost ${i + 1}: Amount must be > 0`
    //   })
    // }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const isPriority = (value: any): value is "low" | "medium" | "high" =>
    ["low", "medium", "high"].includes(value);

  const handleSave = async () => {
    setLoading(true);
    try {
      const laborPayload =
        newInvoice.labor?.map((l) => ({
          full_name: l.laborName,
          email: l.email || "customer@example.com",
          hours_worked: l.hours,
          hourly_rate: l.hourlyRate,
          job_id: Number(newInvoice.jobId),
          is_custom: true,
        })) || [];

      const productsPayload =
        newInvoice.items?.map((i) => ({
          product_name: i.description,
          supplier_id: i.supplierId && i.supplierId > 0 ? i.supplierId : 1,
          supplier_sku: i.sku || "",
          jdp_sku: i.jdp_sku || "SKU-DEFAULT",
          stock_quantity: i.quantity,
          job_id: Number(newInvoice.jobId),
          unit: i.unit ? i.unit.toString() : "1",
          is_custom: false,
          unit_cost: i.unitPrice,
        })) || [];

      const payload: CreateEstimatePayload = {
        estimate_title: "New Estimate",
        customer_id: Number(newInvoice.customerId),

        priority: isPriority(newInvoice.priority)
          ? newInvoice.priority
          : "medium",
        valid_until: newInvoice.dueDate || "",
        location: newInvoice.location || "N/A",
        description: newInvoice.notes || "",
        service_type: "service_based",
        email_address: newInvoice.emailAddress || "customer@example.com",
        estimate_date: newInvoice.issueDate || "",

        materials_cost: itemsTotal,
        labor_cost: laborTotal,
        additional_costs: additionalTotal,
        subtotal,
        tax_percentage: (newInvoice.taxRate || 0) * 100,
        tax_amount: taxAmount,
        total_amount: totalAmount,

        status: "draft",
        invoice_type: newInvoice.type || "proposal_invoice",
        invoice_number: `INV-${Date.now()}`,
        issue_date: newInvoice.issueDate || "",
        due_date: newInvoice.dueDate || "",

        job_id: Number(newInvoice.jobId),

        // additional_cost: newInvoice.additionalCosts?.length
        //   ? {
        //       description: newInvoice.additionalCosts[0].description || "",
        //       amount: newInvoice.additionalCosts.reduce((sum, c) => sum + c.amount, 0),
        //     }
        //   : { description: "", amount: 0 },

        custom_labor: laborPayload,
        custom_products: productsPayload,
      };

      const createdInvoice = await apiClient.createEstimate(payload);
      dispatch(addInvoice(createdInvoice));
      toast.success("Invoice created successfully!");
      onOpenChange(false);

      onInvoiceSaved?.(createdInvoice);

      setNewInvoice({
        customerId: "",
        jobId: undefined,
        type: "proposal_invoice",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd",
        ),
        items: [],
        labor: [],
        additionalCosts: [],
        notes: "",
        taxRate: 0.08,
        priority: "medium",
      });

      setCurrentStep(1);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNewInvoice((prev) => ({ ...prev, jobId }));
  }, [jobId]);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await apiClient.getAllCustomers();
        setCustomers(res.data.customers || []);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  console.log(suppliers, "supp");
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await apiClient.getAllSuppliers();
        setSuppliers(response.data.data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  console.log(products, "products");
  const fetchProducts = async (searchQuery: string = "") => {
    try {
      const response = searchQuery
        ? await apiClient.searchProductsByQuery(searchQuery)
        : await apiClient.getAllProducts();

      const productsData = response.data?.products || response.data?.data || [];
      setProducts(
        productsData.map((p: any) => ({
          id: p.id,
          name: p.product_name,
          description: p.description || "",
          jdpSKU: p.jdp_sku,
          jdpPrice: p.jdp_price || p.unit_cost || 0,
          estimatedPrice: p.estimated_price || 0,
          supplierId: p.supplier_id || 1,
        })),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  useEffect(() => {
    // const fetchProducts = async () => {
    //   try {
    //     const response = await apiClient.getAllProducts();
    //     setProducts(response.data.data);
    //   } catch (error) {
    //     console.error("Error fetching products:", error);
    //   }
    // };

    fetchProducts();
    fetchProductsList();
    fetchSuppliersList();
    fetchJobsList();
  }, [fetchJobsList]);
  console.log(renderInline, "renderInline");

  console.log(jobsList, "jobsListjobsListjobsList");
  if (renderInline) {
    return (
      <Card className="bg-white shadow-lg border-2 border-primary/20 overflow-hidden">
        {/* Invoice Type Selector */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-primary font-semibold text-sm">
              Invoice Type:
            </Label>

            <div className="relative w-[220px]">
              <Select
                value={inlineInvoiceData.invoiceType}
                onValueChange={(value) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    invoiceType: value,
                  }))
                }
              >
                <SelectTrigger className="h-9 border-primary/30 focus:border-primary">
                  <SelectValue placeholder="Select invoice type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estimate">Estimate</SelectItem>
                  <SelectItem value="Downpayment Invoice">
                    Downpayment Invoice
                  </SelectItem>
                  <SelectItem value="Rough Invoice">Rough Invoice</SelectItem>
                  <SelectItem value="Progressive Invoice">
                    Progressive Invoice
                  </SelectItem>
                  <SelectItem value="Final Invoice">Final Invoice</SelectItem>
                  <SelectItem value="Custom">+ Add Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inlineInvoiceData.invoiceType === "Custom" && (
              <div className="relative w-[260px]">
                <Input
                  value={inlineInvoiceData.customInvoiceType}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      customInvoiceType: e.target.value,
                    }))
                  }
                  placeholder="Enter custom invoice type name..."
                  className="h-9 border-primary/30 focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        <div className="">
          <div className="p-5">
            {/* Header */}
            <div className="flex justify-between items-end mb-5 gap-4">
              <div className="flex-shrink-0">
                <Image
                  src="/assets/logos/logo-jdp.png"
                  alt="logo"
                  width={168}
                  height={63}
                  className="w-[120px]"
                />
              </div>

              <div className="text-right">
                <h1 className="text-xl font-bold mb-2">
                  {inlineInvoiceData.invoiceType === "Custom"
                    ? inlineInvoiceData.customInvoiceType
                    : inlineInvoiceData.invoiceType}
                </h1>

                <div className="grid grid-cols-2">
                  <Label className="text-right bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
                    Date
                  </Label>
                  <Input
                    value={inlineInvoiceData.date}
                    onChange={(e) =>
                      setInlineInvoiceData((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-2 text-sm rounded-none"
                    readOnly={isViewMode}
                  />
                </div>

                {isViewMode && (
                  <div className="grid grid-cols-2">
                    <Label className="text-right bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
                      {inlineInvoiceData.invoiceType === "Estimate"
                        ? "Estimate #"
                        : "Invoice #"}
                    </Label>
                    <div>
                      <Input
                        value={
                          inlineInvoiceData.estimateNumber ||
                          viewInvoiceData?.invoice_number ||
                          ""
                        }
                        className="h-9 px-3 py-2 text-sm rounded-none"
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Selection */}

            <div className="border border-gray-300 p-3">
              <div className="mb-4">
                <Label className="block bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
                  Select Job
                </Label>
                <div className="border border-gray-300 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="job">Job *</Label>
                    <div className="relative">
                      <Input
                        id="job"
                        value={jobSearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          setJobSearch(value);

                          const selectedName =
                            selectedJob?.title || selectedJob?.job_title || "";

                          if (selectedJob && value !== selectedName) {
                            billToSyncedJobIdRef.current = null;
                            setSelectedJob(null);
                            setInlineInvoiceData((prev) => ({
                              ...prev,
                              jobId: "",
                              customerName: "",
                              customerAddress: "",
                              billToAddress: "",
                              project: "",
                            }));
                          }

                          setShowJobResults(true);

                          if (jobSearchFetchTimeoutRef.current !== null) {
                            clearTimeout(jobSearchFetchTimeoutRef.current);
                          }
                          jobSearchFetchTimeoutRef.current = setTimeout(() => {
                            jobSearchFetchTimeoutRef.current = null;
                            if (value.trim().length > 0) {
                              void fetchJobsList(value);
                            } else {
                              void fetchJobsList("");
                            }
                          }, JOB_SEARCH_DEBOUNCE_MS);

                          if (validationErrors.jobId) {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.jobId;
                              return newErrors;
                            });
                          }
                        }}
                        onFocus={() => {
                          if (selectedJob) {
                            setJobSearch(
                              selectedJob.title || selectedJob.job_title || "",
                            );
                          } else {
                            fetchJobsList("");
                            setShowJobResults(true);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowJobResults(false), 200);
                        }}
                        placeholder="Search job..."
                        disabled={isViewMode}
                        className={`pr-10 ${
                          validationErrors.jobId ? "border-red-500" : ""
                        } ${isViewMode ? "opacity-50 cursor-not-allowed" : ""}`}
                      />

                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                      {showJobResults && !isViewMode && (
                        <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1 rounded-md">
                          {isLoadingJobs ? (
                            <div className="p-3 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                              <span className="text-sm text-muted-foreground">
                                Loading jobs...
                              </span>
                            </div>
                          ) : jobsList.length > 0 ? (
                            jobsList.map((job: any) => (
                              <div
                                key={job.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleJobSelection(job);
                                }}
                                className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium">
                                  {job.title || job.job_title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {resolveJobListSubLabel(job)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              No jobs found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* {validationErrors.jobId && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.jobId}
                    </p>
                  )} */}
                  </div>

                  {validationErrors.jobId && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.jobId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between bg-gray-600 text-white px-3 py-2">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Label className="text-xs font-semibold">
                    Bill To (Billing Address)
                  </Label>
                </div>

                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setInlineInvoiceData((prev) => ({
                        ...prev,
                        billToAddressEnabled: !prev.billToAddressEnabled,
                      }))
                    }
                    className={`mr-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                      inlineInvoiceData.billToAddressEnabled
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {inlineInvoiceData.billToAddressEnabled ? (
                      <>
                        <svg
                          className="w-3 h-3 inline mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Disable
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3 inline mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Enable
                      </>
                    )}
                  </button>
                </div>
              </div>

              {inlineInvoiceData.billToAddressEnabled && (
                <Textarea
                  value={inlineInvoiceData.billToAddress || ""}
                  onChange={(e) =>
                    setInlineInvoiceData({
                      ...inlineInvoiceData,
                      billToAddress: e.target.value,
                    })
                  }
                  className="mt-0 border-0 rounded-none min-h-[76px]"
                  placeholder="Enter billing address (defaults to customer/supplier address, can be edited)"
                  rows={3}
                  readOnly={isViewMode}
                />
              )}

              {!inlineInvoiceData.billToAddressEnabled && (
                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    This address defaults to the customer/supplier address but
                    can be changed if billing address differs from job location
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="mb-4">
              <Label className="block bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
                Customer Name / Address
              </Label>
              <div className="border border-gray-300 p-3 min-h-[92px]">
                <Input
                  value={
                    selectedJob?.type === "contract-based"
                      ? selectedJob?.contractorName ||
                        selectedJob?.contractor?.name ||
                        inlineInvoiceData.customerName
                      : inlineInvoiceData.customerName
                  }
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                    }))
                  }
                  className="mb-1 h-8 border-0 p-0 focus-visible:ring-0"
                  placeholder={
                    selectedJob?.type === "contract-based"
                      ? "Contractor Name"
                      : "Customer Name"
                  }
                  readOnly
                />
                <Textarea
                  value={
                    selectedJob?.type === "contract-based"
                      ? selectedJob?.contractorAddress ||
                        selectedJob?.contractor?.address ||
                        inlineInvoiceData.customerAddress
                      : inlineInvoiceData.customerAddress
                  }
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      customerAddress: e.target.value,
                    }))
                  }
                  className="border-0 p-0 resize-none focus-visible:ring-0 min-h-[64px]"
                  rows={3}
                  placeholder={
                    selectedJob?.type === "contract-based"
                      ? "Contractor Address"
                      : "Customer Address"
                  }
                  readOnly
                />
              </div>
            </div>

            {/* PO and Project */}
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-0">
                <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                  P.O. No.
                </Label>
                <Label className="bg-gray-600 text-white px-3 py-2 text-center text-xs font-semibold">
                  Project
                </Label>
                <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                  Rep
                </Label>
              </div>

              <div className="grid grid-cols-3 gap-0">
                <div>
                  <Input
                    value={inlineInvoiceData.poNumber}
                    onChange={(e) =>
                      setInlineInvoiceData((prev) => ({
                        ...prev,
                        poNumber: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                    placeholder="PO Number"
                    readOnly={isViewMode}
                  />
                </div>

                <div className="space-y-1">
                  <Input
                    value={inlineInvoiceData.project || ""}
                    onChange={(e) =>
                      setInlineInvoiceData((prev) => ({
                        ...prev,
                        project: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-2 text-sm rounded-none border-t-0 transition-all border-gray-300 focus:border-primary"
                    placeholder="Project"
                    readOnly={isViewMode}
                  />

                  {validationErrors.project && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zm-9-4a1 1 0 00-2 0v4a1 1 0 002 0V6zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{validationErrors.project}</span>
                    </div>
                  )}
                </div>

                <Input
                  value={inlineInvoiceData.rep}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      rep: e.target.value,
                    }))
                  }
                  className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                  placeholder="Rep"
                  readOnly={isViewMode}
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-3 gap-0">
                <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                  Due Date
                </Label>
                <Label className="bg-gray-600 text-white px-3 py-2 text-center text-xs font-semibold">
                  Payment / Credits
                </Label>
                <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                  Balance Due
                </Label>
              </div>

              <div className="grid grid-cols-3 gap-0">
                <div>
                  <Input
                    type="date"
                    value={inlineInvoiceData.dueDate}
                    onChange={(e) =>
                      setInlineInvoiceData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                    readOnly={isViewMode}
                  />
                </div>

                <Input
                  value={inlineInvoiceData.paymentCredits}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      paymentCredits: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                  placeholder="Payment / Credits"
                  readOnly={isViewMode}
                />

                <Input
                  value={inlineInvoiceData.balanceDue}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      balanceDue: e.target.value,
                    }))
                  }
                  className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                  placeholder="Balance Due"
                  readOnly={isViewMode}
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-4 mt-3">
              {isViewMode ? (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-700 text-white">
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold w-[90px]">
                          Qty
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                          Item
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                          Description
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold w-[120px]">
                          Rate
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold w-[140px]">
                          Estimated Price
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold w-[120px]">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(() => {
                        const lineItems = inlineInvoiceData.lineItems || [];

                        const getHeaderName = (item: any) =>
                          item.parent_header_name ||
                          item.parentHeaderName ||
                          null;

                        const normalizedItems = lineItems
                          .filter((item: any) => item.type !== "header")
                          .map((item: any) => ({
                            ...item,
                            qty: item.qty ?? item.stock_quantity ?? 0,
                            item: item.item ?? item.product_name ?? "-",
                            rate: item.rate ?? item.unit_cost ?? 0,
                            estimatedPrice:
                              item.estimatedPrice ?? item.estimated_price ?? 0,
                            total: item.total ?? item.total_cost ?? 0,
                            parent_header_name: getHeaderName(item),
                          }));

                        const directItems = normalizedItems.filter(
                          (item: any) => !item.parent_header_name,
                        );

                        const groupedMap = normalizedItems.reduce(
                          (acc: Record<string, any[]>, item: any) => {
                            const headerName = item.parent_header_name;
                            if (!headerName) return acc;

                            if (!acc[headerName]) {
                              acc[headerName] = [];
                            }

                            acc[headerName].push(item);
                            return acc;
                          },
                          {},
                        );

                        const orderedRows: any[] = [
                          ...directItems,
                          ...Object.entries(groupedMap).flatMap(
                            ([headerName, items]) => [
                              {
                                id: `header-${headerName}`,
                                type: "synthetic-header",
                                headerName,
                              },
                              ...items,
                            ],
                          ),
                        ];

                        return orderedRows.map(
                          (lineItem: any, index: number) => {
                            if (lineItem.type === "synthetic-header") {
                              return (
                                <tr
                                  key={lineItem.id}
                                  className="bg-transparent"
                                >
                                  <td
                                    colSpan={6}
                                    className="px-0 py-0 border border-gray-300 bg-white"
                                  >
                                    <div className="w-full bg-gray-700 px-3 py-2 text-white">
                                      <span className="text-sm font-semibold tracking-wide">
                                        {lineItem.headerName || ""}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr
                                key={lineItem.id || index}
                                className="bg-white transition-colors hover:bg-gray-50"
                              >
                                <td className="border border-gray-300 px-3 py-2 text-center align-middle text-sm">
                                  <span>{lineItem.qty || 0}</span>
                                </td>

                                <td className="border border-gray-300 px-3 py-2 align-middle">
                                  <span className="text-sm font-medium text-gray-900">
                                    {lineItem.item || "-"}
                                  </span>
                                </td>

                                <td className="border border-gray-300 px-3 py-2 align-top">
                                  <div className="max-h-[72px] overflow-y-auto pr-1 text-sm leading-5 text-gray-700">
                                    {lineItem.description || "-"}
                                  </div>
                                </td>

                                <td className="border border-gray-300 px-3 py-2 text-right align-middle text-sm">
                                  ${Number(lineItem.rate || 0).toFixed(2)}
                                </td>

                                <td className="border border-gray-300 px-3 py-2 text-right align-middle text-sm">
                                  $
                                  {Number(lineItem.estimatedPrice || 0).toFixed(
                                    2,
                                  )}
                                </td>

                                <td className="border border-gray-300 px-3 py-2 text-right font-medium align-middle text-sm">
                                  ${(lineItem.total || 0).toFixed(2)}
                                </td>
                              </tr>
                            );
                          },
                        );
                      })()}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td
                          colSpan={5}
                          className="border border-gray-300 px-3 py-2"
                        />
                        <td className="border border-gray-300 px-3 py-2 text-right font-bold text-sm">
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <InvoiceLineItemsManager
                  lineItems={inlineInvoiceData.lineItems}
                  invalidHeaderKeys={invalidHeaderKeys}
                  setInvalidHeaderKeys={setInvalidHeaderKeys}
                  setLineItems={(updater) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      lineItems:
                        typeof updater === "function"
                          ? updater(prev.lineItems)
                          : updater,
                    }))
                  }
                  invalidLineItemIds={invalidLineItemIds}
                  setInvalidLineItemIds={setInvalidLineItemIds}
                  selectedSupplierId={selectedSupplierId}
                  fetchProducts={fetchProducts}
                  getFilteredProducts={getFilteredProducts}
                  onSelectProductData={(rowId, product) => {
                    selectProduct(rowId, product);
                  }}
                />
              )}

              <div className="flex justify-end mt-3">
                <div className="text-right min-w-[200px]">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-gray-700">
                      Payments / Credits:
                    </span>
                    <span className="text-sm text-gray-700">
                      ${(inlineInvoiceData.paymentCredits || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-bold text-sm text-gray-700">
                      Balance Due:
                    </span>
                    <span className="font-bold text-sm text-gray-700">
                      $
                      {parseFloat(
                        (inlineInvoiceData.balanceDue || 0).toString(),
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {validationErrors.lineItems && (
                <p className="text-red-500 text-xs mt-2">
                  {validationErrors.lineItems}
                </p>
              )}
            </div>

            {/* Notes Section */}
            <div className="mb-4 overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td
                      className="border border-gray-300 p-3 bg-white text-sm"
                      style={{ minHeight: "96px" }}
                    >
                      <Textarea
                        value={inlineInvoiceData.notes}
                        onChange={(e) => {
                          setInlineInvoiceData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }));
                        }}
                        className="w-full min-h-[84px] border-0 p-0 focus-visible:ring-0 resize-none"
                        placeholder="NOTES&#10;JDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE"
                        readOnly={isViewMode}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer disclaimer and Total */}
            <div className="mb-4">
              <div className="border border-gray-300 px-3 py-2.5 text-xs text-center bg-white leading-5">
                <p>
                  JDP is not responsible for repair of lamps & landscaping,
                  house owner utilities including cables, sprinkler systems,
                  television or telephone cables, etc. that may be cut or
                  damaged during installation. Price are subject to change prior
                  to receipt of down payment.
                </p>
              </div>

              <div className="text-center text-sm text-blue-500 font-bold mt-3">
                <p>
                  1432 Oakpointe Drive Waconia, MN 55387 paul@jdpelectric.us
                </p>
              </div>
            </div>

            <div className="secnacher">
              {/* Customer Acceptance Section */}
              <div className="mt-5">
                <div className="border-t border-gray-300 mb-4"></div>

                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-700">
                      Customer Acceptance
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      Authorized Signature
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Date</div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col w-3/5">
                    <div className="border-b border-gray-800 h-0.5 mb-1.5"></div>
                    <div className="text-xs text-gray-700 text-center">
                      Signature
                    </div>
                  </div>
                  <div className="flex flex-col w-1/3">
                    <div className="border-b border-gray-800 h-0.5 mb-1.5"></div>
                    <div className="text-xs text-gray-700 text-center">
                      Date
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2.5 mt-3">
                  <div className="text-xs text-gray-700 leading-5">
                    By signing above, you agree to the terms and pricing
                    outlined in this estimate. This becomes a binding agreement
                    upon signature.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isViewMode && (
          <div className="sticky bottom-0 border-t bg-gray-50 px-5 py-3 z-20">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setValidationErrors({});
                }}
                className="border-gray-300 h-9"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <div className="flex gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSaveInvoiceAsDraft}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 h-9"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {savingDraft ? "Saving..." : "Save as Draft"}
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handlePreviewAndSend}
                    className="bg-primary hover:bg-primary/90 text-white h-9"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {sendingInvoice
                      ? "Sending..."
                      : "Preview & Send to Customer"}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode - Only Close Button */}
        {isViewMode && (
          <div className="sticky bottom-0 border-t bg-gray-50 px-5 py-3 z-20">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300 h-9"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>

              <div className="flex gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSaveInvoiceAsDraft}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 h-9"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {savingDraft ? "Saving..." : "Save as Draft"}
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handlePreviewAndSend}
                    className="bg-primary hover:bg-primary/90 text-white h-9"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {sendingInvoice
                      ? "Sending..."
                      : "Preview & Send to Customer"}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Preview Modal (reused from JobDetailsPage pattern) */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="min-w-[80%] max-h-[90vh] overflow-y-auto p-0">
            <div className="bg-gray-100 p-3 md:p-4">
              <div
                id="invoice-preview-print"
                className="bg-white p-4 md:p-5 shadow-lg"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Image
                      src="/assets/logos/logo-jdp.png"
                      alt="logo"
                      width={168}
                      height={63}
                      className="w-[120px]"
                    />
                    <p className="text-xs text-gray-600 mt-1">952-449-1088</p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-center flex justify-center items-center">
                      <div className="text-sm font-bold bg-gray-800 text-white px-4 py-2 w-[160px]">
                        Date
                      </div>
                      <div className="text-sm border border-gray-800 px-4 py-2 w-[160px]">
                        {new Date(inlineInvoiceData.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>

                    <div className="text-center flex justify-center items-center">
                      <div className="text-sm font-bold bg-gray-800 text-white px-4 py-2 w-[160px]">
                        {(inlineInvoiceData.invoiceType === "Custom"
                          ? inlineInvoiceData.customInvoiceType
                          : inlineInvoiceData.invoiceType) || "ESTIMATE"}{" "}
                        #
                      </div>
                      <div className="text-sm border border-gray-800 px-4 py-2 w-[160px]">
                        {previewEstimateId || inlineInvoiceData.estimateNumber || "Draft"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Job (display-only) */}
                <div className="mb-4">
                  <Label className="block bg-gray-800 text-white px-3 py-2 text-xs font-bold">
                     Job
                  </Label>
                  <div className="border border-gray-800 px-3 py-2">
                    <Select value={previewSelectedJob.id} disabled>
                      <SelectTrigger className="h-9 border-primary/30 bg-gray-100 text-gray-700 cursor-not-allowed">
                        <SelectValue>{previewSelectedJob.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={previewSelectedJob.id}>
                          {previewSelectedJob.name}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {inlineInvoiceData.billToAddressEnabled && (
                  <>
                    <div className="bg-gray-800 text-white px-3 py-2 mb-2">
                      <div className="text-xs font-bold">Bill TO</div>
                    </div>
                    {inlineInvoiceData.billToAddress && (
                      <div className="text-gray-600 mt-1 font-medium border border-gray-800 px-3 py-2 text-sm mb-3">
                        {inlineInvoiceData.billToAddress}
                      </div>
                    )}
                  </>
                )}

                {/* To Section */}
                <div className="bg-gray-800 text-white px-3 py-2 mb-2 mt-2">
                  <div className="text-xs font-bold">TO</div>
                </div>
                <div className="mb-4 border border-gray-800 px-3 py-2">
                  <div className="font-semibold text-sm">
                    {inlineInvoiceData.customerName || "Customer"}
                  </div>
                  <div className="text-gray-600 text-sm leading-5">
                    {inlineInvoiceData.customerAddress || ""}
                  </div>
                </div>

                

                {/* Project Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-sm font-semibold border border-gray-800 px-3 py-2">
                      P.O. No.
                    </div>
                    <div className="text-gray-600 border border-gray-800 px-3 py-2 text-sm min-h-[40px]">
                      {inlineInvoiceData.poNumber}
                    </div>
                  </div>
                  <div>
                    <div className="bg-gray-800 text-white text-sm font-semibold border border-gray-800 px-3 py-2">
                      Project
                    </div>
                    <div className="text-gray-600 border border-gray-800 px-3 py-2 text-sm min-h-[40px]">
                      {inlineInvoiceData.project}
                    </div>
                  </div>
                </div>

                {/* Rep and Due Date */}
                <div className="mb-3">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">
                          Rep
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {inlineInvoiceData.rep || "JDP"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {inlineInvoiceData.dueDate || ""}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Line Items Table */}
                <div className="mb-4">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                          Qty
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                          Item
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                          Description
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm">
                          Rate
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm">
                          Amount
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(() => {
                        const lineItems = inlineInvoiceData.lineItems || [];

                        const getHeaderName = (item: any) =>
                          item.parent_header_name ||
                          item.parentHeaderName ||
                          null;

                        const normalizedItems = lineItems
                          .filter((item: any) => item.type !== "header")
                          .map((item: any) => ({
                            ...item,
                            qty: item.qty ?? item.stock_quantity ?? 0,
                            item: item.item ?? item.product_name ?? "-",
                            rate: item.rate ?? item.unit_cost ?? 0,
                            estimatedPrice:
                              item.estimatedPrice ?? item.estimated_price ?? 0,
                            total: item.total ?? item.total_cost ?? 0,
                            parent_header_name: getHeaderName(item),
                          }));

                        const directItems = normalizedItems.filter(
                          (item: any) => !item.parent_header_name,
                        );

                        const groupedMap = normalizedItems.reduce(
                          (acc: Record<string, any[]>, item: any) => {
                            const headerName = item.parent_header_name;
                            if (!headerName) return acc;

                            if (!acc[headerName]) {
                              acc[headerName] = [];
                            }

                            acc[headerName].push(item);
                            return acc;
                          },
                          {},
                        );

                        const orderedRows: any[] = [
                          ...directItems,
                          ...Object.entries(groupedMap).flatMap(
                            ([headerName, items]) => [
                              {
                                id: `header-${headerName}`,
                                type: "synthetic-header",
                                headerName,
                              },
                              ...items,
                            ],
                          ),
                        ];

                        return orderedRows.map(
                          (lineItem: any, index: number) => {
                            if (lineItem.type === "synthetic-header") {
                              return (
                                <tr key={lineItem.id} className="bg-transparent">
                                  <td
                                    colSpan={6}
                                    className="px-0 py-0 border border-gray-300 bg-white"
                                  >
                                    <div className="w-full bg-gray-800 px-3 py-2 text-white">
                                      <span className="text-sm font-semibold tracking-wide">
                                        {lineItem.headerName || ""}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr
                                key={lineItem.id || index}
                                className="bg-white transition-colors hover:bg-gray-50"
                              >
                                <td className="border border-gray-300 px-3 py-2 text-center align-middle text-sm">
                                  <span>{lineItem.qty || 0}</span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle">
                                  <span className="text-sm font-medium text-gray-900">
                                    {lineItem.item || "-"}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-top">
                                  <div className="max-h-[72px] overflow-y-auto pr-1 text-sm leading-5 text-gray-700">
                                    {lineItem.description || "-"}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-right align-middle text-sm">
                                  ${Number(lineItem.rate || 0).toFixed(2)}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-right align-middle text-sm">
                                  $
                                  {Number(lineItem.estimatedPrice || 0).toFixed(
                                    2,
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-medium align-middle text-sm">
                                  ${(lineItem.total || 0).toFixed(2)}
                                </td>
                              </tr>
                            );
                          },
                        );
                      })()}
                    </tbody>
                  </table>

                  <div className="flex justify-end mt-3">
                    <div className="text-right">
                      <div className="font-bold text-base">
                        ${calculateInvoiceSubtotal().toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="border-t pt-3 mb-4">
                  <div className="bg-gray-100 px-3 py-2 rounded text-center">
                    <div className="text-sm font-medium whitespace-pre-line leading-5">
                      {inlineInvoiceData.notes ||
                        "Final payment to complete project billing"}
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-xs text-gray-600 mb-4 leading-5">
                  <p>
                    JDP is not responsible for repair of lamps & landscaping,
                    house owner utilities including cables, sprinkler systems,
                    television or telephone cables, etc. that may be cut or
                    damaged during installation. Price are subject to change
                    prior to receipt of down payment.
                  </p>
                </div>

                {/* Total and Contact */}
                <div className="text-center mb-4">
                  <div className="text-sm text-blue-600">
                    EMAIL: jen@jdpelectric.us 952-449-1088
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="sticky bottom-0 z-20 flex justify-center gap-3 border-t bg-gray-50 p-4">
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>

              <Button
                onClick={handleSendFromPreview}
                disabled={sendingInvoice}
                className="bg-gray-800 hover:bg-gray-900 text-white flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sendingInvoice
                  ? "Sending..."
                  : `Send ${getSelectedInvoiceTypeLabel()}`}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleQuickbookFromPreview("save")}
                disabled={quickbookActionLoading !== null}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {quickbookActionLoading === "save"
                  ? "Saving..."
                  : `Save ${getSelectedInvoiceTypeLabel()} to QuickBooks`}
              </Button>

              <Button
                onClick={() => handleQuickbookFromPreview("send")}
                disabled={quickbookActionLoading !== null}
                className="bg-gray-800 hover:bg-gray-900 text-white flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {quickbookActionLoading === "send"
                  ? "Sending..."
                  : `Send ${getSelectedInvoiceTypeLabel()} from QuickBooks`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }
};
