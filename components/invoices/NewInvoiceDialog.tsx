import { useEffect, useState } from "react";
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
  renderInline?: boolean;
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
}: NewInvoiceDialogProps) => {
  console.log("trsting jobs", jobs);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
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

  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
  const [showInlineInvoiceForm, setShowInlineInvoiceForm] = useState(true);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    null,
  );
  const [productsList, setProductsList] = useState<any[]>([]);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [estimateCost, setEstimateCost] = useState(null);

  const currentJob = selectedJob || jobs?.find((j: any) => j.id === jobId);

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

  // Update form when job is provided
  useEffect(() => {
    if (currentJob) {
      // Determine if it's contract-based
      const isContractBased =
        currentJob.type === "contract_based" ||
        currentJob.type === "contract-based";

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

      setInlineInvoiceData((prev) => ({
        ...prev,
        customerName: customerName,
        customerAddress: customerAddress,
        project: currentJob.title || "",
        jobId: currentJob.id || jobId,
      }));
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
                parentHeaderKey: product.parent_header_key || null,
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

  const itemsTotal =
    newInvoice.items?.reduce((sum, i) => sum + i.total_cost, 0) || 0;
  const laborTotal =
    newInvoice.labor?.reduce((sum, l) => sum + l.total_cost, 0) || 0;
  const additionalTotal =
    newInvoice.additionalCosts?.reduce((sum, c) => sum + c.amount, 0) || 0;

  const subtotal = itemsTotal + laborTotal + additionalTotal;
  const taxAmount = subtotal * (newInvoice.taxRate || 0);
  const totalAmount = subtotal + taxAmount;

  // Invoice Helper Functions
  const calculateInvoiceSubtotal = () => {
    return inlineInvoiceData.lineItems
      .filter((item: any) => item.type !== "header")
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  // Send invoice to customer function
  const sendInvoiceToCustomer = async (invoiceId: number) => {
    try {
      // Get customer_id or contractor_id from viewInvoiceData if in view mode, otherwise from currentJob
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;

      if (isViewMode && viewInvoiceData) {
        // In view mode, get from viewInvoiceData
        isContractBased =
          viewInvoiceData.service_type === "contract_based" ||
          viewInvoiceData.job?.job_type === "contract_based" ||
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
        // In create mode, get from currentJob
        const currentJob = jobsList.find(
          (j: any) => j.id === inlineInvoiceData.jobId,
        );
        if (!currentJob) {
          throw new Error("Job not found");
        }

        isContractBased =
          currentJob.type === "contract_based" ||
          currentJob.type === "contract-based";

        if (isContractBased) {
          contractorId =
            currentJob.contractor_id ||
            (currentJob.contractor && typeof currentJob.contractor === "number"
              ? Number(currentJob.contractor)
              : null) ||
            (currentJob.contractor && typeof currentJob.contractor === "string"
              ? Number(currentJob.contractor)
              : null) ||
            null;
          console.log(
            "Create mode - contractor_id from currentJob:",
            contractorId,
          );
        } else {
          customerId =
            currentJob.customer_id ||
            (currentJob.customer && typeof currentJob.customer === "number"
              ? currentJob.customer
              : null) ||
            (currentJob.customer && typeof currentJob.customer === "string"
              ? Number(currentJob.customer)
              : null) ||
            Number(currentJob?.customer) ||
            null;
          console.log("Create mode - customer_id from currentJob:", customerId);
        }
      }

      if (!customerId && !contractorId) {
        console.error("Customer/Contractor ID not found");
        toast.error("Customer/Contractor ID is missing. Cannot send invoice.");
        return;
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

      // Get customer email - from viewInvoiceData in view mode, otherwise from currentJob
      let customerEmail = "customer@example.com";
      if (isViewMode && viewInvoiceData) {
        customerEmail =
          viewInvoiceData.customer?.email ||
          viewInvoiceData.email_address ||
          "customer@example.com";
      } else {
        const currentJob = jobsList.find(
          (j: any) => j.id === inlineInvoiceData.jobId,
        );
        customerEmail = currentJob?.email || "customer@example.com";
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
          ? inlineInvoiceData.billToAddress || ""
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
    } catch (error) {
      console.error("Error sending invoice to customer:", error);
      toast.error(
        `Failed to send invoice to customer: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const getFilteredProducts = (query: string) => {
    if (!query) return [];
    return products; // ✅ API se aaye results directly use karo
  };

  const selectProduct = (itemId: string, product: any) => {
    // Check if product already exists in line items (by product ID, not name)
    const currentItem = inlineInvoiceData.lineItems.find(
      (item: any) => item.id === itemId,
    );
    const currentHeaderKey = currentItem.parentHeaderKey || null;

    // Check duplicate only inside same header group
    const isDuplicateInSameGroup = inlineInvoiceData.lineItems.some(
      (item: any) => {
        if (item.id === itemId) return false;
        if (item.type === "header") return false;

        return (
          item.parentHeaderKey === currentHeaderKey &&
          item.productId === product.id
        );
      },
    );

    if (isDuplicateInSameGroup) {
      toast.error("This product is already added in this section");
      return;
    }

    setInlineInvoiceData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            productId: product.id,
            item: product.name,
            description: product.description || "",
            rate: product.jdpPrice || 0,
            estimatedPrice: product.estimatedPrice || product.jdpPrice || 0,
            total:
              (item.qty || 1) *
              (product.estimatedPrice || product.jdpPrice || 0),
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

  const fetchJobsList = async (searchQuery: string = "") => {
    try {
      const response = searchQuery
        ? await apiClient.searchJobsByQuery(searchQuery, 1, 10)
        : await apiClient.getJobs(1, 10);

      const jobsData = response.data || [];
      console.log(jobsData, "jobsData");
      setJobsList(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleJobSelection = (jobId: string) => {
    const job = jobsList.find((j: any) => j.id === jobId);
    if (job) {
      setEstimateCost(job?.estimatedCost);
      setSelectedJob(job);

      // Determine if it's contract-based
      const isContractBased =
        job.type === "contract_based" || job.type === "contract-based";

      // Get customer/contractor name and address
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
        customerName: customerName,
        customerAddress: customerAddress,
        billToAddress: job.billToAddress || "",
        project: job.title || "",
      }));

      console.log("Selected job:", job);
      console.log("isContractBased:", isContractBased);
      console.log("customerName:", customerName);
      console.log("customerAddress:", customerAddress);
      console.log("Updated inlineInvoiceData:", {
        jobId: job.id,
        customerName: customerName,
        customerAddress: customerAddress,
        project: job.title,
      });
    }
  };

  const handleSaveInvoiceAsDraft = async () => {
    // Validation
    const errors: Record<string, string> = {};

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
    console.log(inlineInvoiceData.lineItems,"inlineInvoiceData.lineItems");
    

    if (invoiceItemRows.length === 0) {
      errors.lineItems = "Please add at least one product item";
    }

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
          parent_header_key: item.parentHeaderKey || null,
          parent_header_name: item.parentHeaderName || null,
        } as any;

        if (!item.isCustomProduct && item.productId) {
          base.id = item.productId;
        }

        return base;
      });
      // Get customer_id or contractor_id - from viewInvoiceData if in view mode, otherwise from currentJob
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;

      if (isViewMode && viewInvoiceData) {
        // In view mode, get from viewInvoiceData
        isContractBased =
          viewInvoiceData.service_type === "contract_based" ||
          viewInvoiceData.job?.job_type === "contract_based" ||
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
        // In create mode, get from currentJob
        isContractBased =
          currentJob?.type === "contract_based" ||
          currentJob?.type === "contract-based";

        if (isContractBased) {
          contractorId =
            currentJob.contractor_id ||
            (currentJob.contractor && typeof currentJob.contractor === "number"
              ? Number(currentJob.contractor)
              : null) ||
            (currentJob.contractor && typeof currentJob.contractor === "string"
              ? Number(currentJob.contractor)
              : null) ||
            null;
        } else {
          customerId =
            currentJob.customer_id ||
            (currentJob.customer && typeof currentJob.customer === "number"
              ? currentJob.customer
              : null) ||
            (currentJob.customer && typeof currentJob.customer === "string"
              ? Number(currentJob.customer)
              : null) ||
            Number(currentJob?.customer) ||
            null;
        }
      }

      const payload: any = {
        job_id: Number(inlineInvoiceData.jobId),
        estimate_title: inlineInvoiceData.project || currentJob?.title,
        priority: "medium" as "low" | "medium" | "high",
        service_type: isContractBased ? "contract_based" : "service_based",
        email_address: currentJob?.email || "customer@example.com",
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        bill_to_address: inlineInvoiceData.billToAddressEnabled
          ? inlineInvoiceData.billToAddress || ""
          : "",
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

  const handlePreviewAndSend = async () => {
    // Validation
    const errors: Record<string, string> = {};

    if (!inlineInvoiceData.jobId) {
      errors.jobId = "Please select a job first";
    }

    console.log( inlineInvoiceData.lineItems.length === 0 ,
      inlineInvoiceData.lineItems[0],"inlineInvoiceData.lineItems");
    
    if (!inlineInvoiceData.project) {
      errors.project = "Project field is required";
    }

    if (
      inlineInvoiceData.lineItems.length === 0 
      // !inlineInvoiceData.lineItems[0].item
    ) {
      errors.lineItems = "Please add at least one product item";
    }

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
          parent_header_key: item.parentHeaderKey || null,
          parent_header_name: item.parentHeaderName || null,
        } as any;

        if (!item.isCustomProduct && item.productId) {
          base.id = item.productId;
        }

        return base;
      });

      // Get customer_id or contractor_id - from viewInvoiceData if in view mode, otherwise from currentJob
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;

      if (isViewMode && viewInvoiceData) {
        // In view mode, get from viewInvoiceData
        isContractBased =
          viewInvoiceData.service_type === "contract_based" ||
          viewInvoiceData.job?.job_type === "contract_based" ||
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
        // In create mode, get from currentJob
        isContractBased =
          currentJob?.type === "contract_based" ||
          currentJob?.type === "contract-based";

        if (isContractBased) {
          contractorId =
            currentJob.contractor_id ||
            (currentJob.contractor && typeof currentJob.contractor === "number"
              ? Number(currentJob.contractor)
              : null) ||
            (currentJob.contractor && typeof currentJob.contractor === "string"
              ? Number(currentJob.contractor)
              : null) ||
            null;
        } else {
          customerId =
            currentJob.customer_id ||
            (currentJob.customer && typeof currentJob.customer === "number"
              ? currentJob.customer
              : null) ||
            (currentJob.customer && typeof currentJob.customer === "string"
              ? Number(currentJob.customer)
              : null) ||
            Number(currentJob?.customer) ||
            null;
        }
      }

      const payload: any = {
        job_id: Number(inlineInvoiceData.jobId),
        estimate_title: inlineInvoiceData.project || currentJob?.title,
        priority: "medium" as "low" | "medium" | "high",
        service_type: isContractBased ? "contract_based" : "service_based",
        email_address: currentJob?.email || "customer@example.com",
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        bill_to_address: inlineInvoiceData.billToAddressEnabled
          ? inlineInvoiceData.billToAddress || ""
          : "",
        notes: inlineInvoiceData.notes || "",
        status: "sent",
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
      toast.success("Invoice created successfully!");

      // Send invoice to customer using estimate ID
      await sendInvoiceToCustomer(response.data.id);

      // Refresh the estimates list
      if (onInvoiceSaved) {
        onInvoiceSaved(payload);
      }

      onOpenChange(false);

      // Reset form
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
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    } finally {
      setSendingInvoice(false);
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
  }, []);
  console.log(renderInline, "renderInline");

  console.log(jobsList, "jobsListjobsListjobsList");
  if (renderInline) {
    return (
      <Card className="bg-white shadow-lg border-2 border-primary/20">
        {/* Invoice Type Selector */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <Label className="text-primary font-semibold">Invoice Type:</Label>
            <div className="relative w-[250px]">
              <Select
                value={inlineInvoiceData.invoiceType}
                onValueChange={(value) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    invoiceType: value,
                  }))
                }
              >
                <SelectTrigger className="border-primary/30 focus:border-primary">
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
              <div className="relative w-[300px]">
                <Input
                  value={inlineInvoiceData.customInvoiceType}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      customInvoiceType: e.target.value,
                    }))
                  }
                  placeholder="Enter custom invoice type name..."
                  className="border-primary/30 focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-end mb-8">
            <div className="flex-shrink-0">
              <Image
                src="/assets/logos/logo-jdp.png"
                alt="logo"
                width={168}
                height={63}
                className="w-[140px] "
              />
            </div>

            <div className="text-right">
              <h1 className="text-2xl font-bold mb-4">
                {inlineInvoiceData.invoiceType === "Custom"
                  ? inlineInvoiceData.customInvoiceType
                  : inlineInvoiceData.invoiceType}
              </h1>
              <div className="grid grid-cols-2">
                <Label className="text-right bg-gray-600 text-white px-3 py-2 text-sm font-semibold">
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
                  className="px-3 py-2 text-sm"
                  readOnly={isViewMode}
                />
              </div>
              {/* Show Estimate Number only in view mode */}
              {isViewMode && (
                <div className="grid grid-cols-2">
                  <Label className="text-right bg-gray-600 text-white px-3 py-2 text-sm font-semibold">
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
                      className="px-3 py-2 text-sm"
                      disabled={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Selection */}
          <div className="mb-6">
            <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">
              Select Job
            </Label>
            <div className="border border-gray-300 p-4">
              <Select
                value={inlineInvoiceData.jobId?.toString() || ""}
                onValueChange={(value) => {
                  if (!isViewMode) {
                    handleJobSelection(value);
                    setValidationErrors((prev) => ({ ...prev, jobId: "" }));
                  }
                }}
                disabled={isViewMode}
              >
                <SelectTrigger
                  className={`border-primary/30 focus:border-primary bg-white ${validationErrors.jobId ? "border-red-500" : ""} ${isViewMode ? "opacity-50" : ""}`}
                >
                  <SelectValue placeholder="Select a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobsList.length > 0 ? (
                    jobsList.map((job: any) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        #{job.id} - {job.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No jobs available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {validationErrors.jobId && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.jobId}
                </p>
              )}
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-gray-600 text-white px-3 py-2 mb-0">
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
                <Label className="text-sm font-semibold">
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
                  className={`mr-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
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
                className="mt-0 border-0 rounded-none"
                placeholder="Enter billing address (defaults to customer/supplier address, can be edited)"
                rows={3}
                readOnly={isViewMode}
              />
            )}
            {!inlineInvoiceData.billToAddressEnabled && (
              <div className="bg-gray-50 p-3 text-sm text-gray-600">
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
                  This address defaults to the customer/supplier address but can
                  be changed if billing address differs from job location
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">
              Customer Name / Address
            </Label>
            <div className="border border-gray-300 p-4 min-h-[120px]">
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
                className="mb-2 border-0 p-0 focus-visible:ring-0"
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
                className="border-0 p-0 resize-none focus-visible:ring-0"
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
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-0">
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
                P.O. No.
              </Label>
              <Label className="bg-gray-600 text-white px-3 py-2 text-center text-sm font-semibold">
                Project
              </Label>
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
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
                  className="px-3 py-2 text-sm rounded-none border-t-0"
                  placeholder="PO Number"
                  readOnly={isViewMode}
                />
              </div>
              <Input
                value={inlineInvoiceData.project || ""}
                onChange={(e) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    project: e.target.value,
                  }))
                }
                className="px-3 py-2 text-sm rounded-none border-t-0"
                placeholder="Project"
                readOnly={isViewMode}
              />
              <Input
                value={inlineInvoiceData.rep}
                onChange={(e) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    rep: e.target.value,
                  }))
                }
                className="px-3 py-2 text-sm rounded-none border-t-0"
                placeholder="Rep"
                readOnly={isViewMode}
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-3 gap-0">
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
                Due Date
              </Label>
              <Label className="bg-gray-600 text-white px-3 py-2 text-center text-sm font-semibold">
                Payment / Credits
              </Label>
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
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
                  className="px-3 py-2 text-sm rounded-none border-t-0"
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
                className="px-3 py-2 text-sm rounded-none border-t-0"
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
                className="px-3 py-2 text-sm rounded-none border-t-0"
                placeholder="Balance Due"
                readOnly={isViewMode}
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6 overflow-x-auto mt-4">
            {/* Line Items Table */}
            <InvoiceLineItemsManager
              lineItems={inlineInvoiceData.lineItems}
              setLineItems={(updater) =>
                setInlineInvoiceData((prev) => ({
                  ...prev,
                  lineItems:
                    typeof updater === "function"
                      ? updater(prev.lineItems)
                      : updater,
                }))
              }
              selectedSupplierId={selectedSupplierId}
              fetchProducts={fetchProducts}
              getFilteredProducts={getFilteredProducts}
              onSelectProductData={(rowId, product) => {
                selectProduct(rowId, product);
              }}
            />

            <div className="flex justify-end mt-4">
              <div className="text-right min-w-[200px]">
                <div className="flex justify-between mb-2">
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
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td
                    className="border border-gray-300 p-3 bg-white text-sm"
                    style={{ minHeight: "120px" }}
                  >
                    <Textarea
                      value={inlineInvoiceData.notes}
                      onChange={(e) => {
                        setInlineInvoiceData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }));
                      }}
                      className="w-full min-h-[100px] border-0 p-0 focus-visible:ring-0 resize-none"
                      placeholder="NOTES&#10;JDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE"
                      readOnly={isViewMode}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer disclaimer and Total */}
          <div className="mb-6">
            <div className="border border-gray-300 p-3 text-xs text-center bg-white">
              <p>
                JDP is not responsible for repair of lamps & landscaping, house
                owner utilities including cables, sprinkler systems, television
                or telephone cables, etc. that may be cut or damaged during
                installation. Price are subject to change prior to receipt of
                down payment.
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <div className="text-right">
                {/* <div className="flex items-center gap-4">
                      <span className="text-xl font-bold">Total</span>
                      <span className="text-2xl font-bold">
                        ${calculateInvoiceSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div> */}
              </div>
            </div>
            <div className="text-center text-sm text-blue-500 font-bold">
              <p>1432 Oakpointe Drive Waconia, MN 55387 paul@jdpelectric.us</p>
            </div>
          </div>
          <div className="secnacher">
            {/* Customer Acceptance Section */}
            <div className="mt-8">
              {/* Top separator line */}
              <div className="border-t border-gray-300 mb-6"></div>

              {/* Customer Acceptance Header */}
              <div className="flex justify-between items-center mb-5">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Customer Acceptance
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Authorized Signature
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700">Date</div>
              </div>

              {/* Signature Fields */}
              <div className="flex justify-between items-center mb-5">
                <div className="flex flex-col w-3/5">
                  <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                  <div className="text-xs text-gray-700 text-center">
                    Signature
                  </div>
                </div>
                <div className="flex flex-col w-1/3">
                  <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                  <div className="text-xs text-gray-700 text-center">Date</div>
                </div>
              </div>

              {/* Disclaimer Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-5">
                <div className="text-xs text-gray-700 leading-relaxed">
                  By signing above, you agree to the terms and pricing outlined
                  in this estimate. This becomes a binding agreement upon
                  signature.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isViewMode && (
          <div className="border-t bg-gray-50 px-8 py-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setValidationErrors({});
                }}
                className="border-gray-300"
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
                    size="lg"
                    className="border-primary text-primary hover:bg-primary/5"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {savingDraft ? "Saving..." : "Save as Draft"}
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handlePreviewAndSend}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <Eye className="h-5 w-5 mr-2" />
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
          <div className="border-t bg-gray-50 px-8 py-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300"
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
                    size="lg"
                    className="border-primary text-primary hover:bg-primary/5"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {savingDraft ? "Saving..." : "Save as Draft"}
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handlePreviewAndSend}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={savingDraft || sendingInvoice}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {sendingInvoice
                      ? "Sending..."
                      : "Preview & Send to Customer"}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        )}
        {/* </Card>
        </motion.div> */}
      </Card>
    );
  }
};
