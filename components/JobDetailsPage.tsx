import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { apiClient } from "../utils/api";
import { usePermissions } from '../contexts/PermissionContext';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "./ui/checkbox";
import { addInvoice } from "@/redux/slices/jobsSlice";
import {
  ArrowLeft,
  Edit,
  FileText,
  Send,
  Printer,
  Clock,
  Package,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Trash2,
  Building,
  ClockIcon,
  X,
  Check,
  MapPin,
  UserCheck,
  PlusCircle,
  Receipt,
  Search,
  Download,
  File,
  MoreVertical,
  Briefcase,
  Upload,
  UploadCloud,
} from "lucide-react";
import {
  BlueSheetApprovalDialog,
  type BlueSheetItem as DialogBlueSheetItem,
} from "./invoices/BlueSheetApprovalDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AutoScrollMultiSelect } from "./ui/AutoScrollMultiSelect";
import { useDispatch } from "react-redux";
import {
  addProduct,
  deleteProduct,
  deleteInvoice,
} from "@/redux/slices/jobsSlice";
import { NewInvoiceDialog } from "./invoices/NewInvoiceDialog";
import { InvoiceTemplate } from "./invoices/InvoiceTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Invoice, CreateEstimatePayload } from "@/types/invoice";
import { LoadingSpinner } from "./common/LoadingSpinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { motion } from "framer-motion";
import { Logo } from "./common/Logo";
import Image from "next/image";
import TimeRangePicker from "@wojtekmaj/react-timerange-picker";
import "@wojtekmaj/react-timerange-picker/dist/TimeRangePicker.css";
import Autocomplete from "react-google-autocomplete";
import {
  ADDRESS_AUTOCOMPLETE_OPTIONS,
  ADDRESS_SEARCH_PLACEHOLDER,
  GOOGLE_MAPS_API_KEY,
  parsePlaceToAddressFields,
  resolveFormattedPlaceAddress,
} from "@/lib/googleAddressAutocomplete";
import ActivityLogs from "./ActivityLogs";
import { CheckCircle } from "lucide-react";
import { invoicesData } from "@/data/invoiceData";
import InvoiceLineItemsManager from "./common/invoice-line-items/InvoiceLineItemsManager";
import {
  createDefaultEmptyLineItems,
  getFilledLineItemRows,
  hasAtLeastOneFilledLineItem,
  validateInvoiceLineItemsForSubmit,
} from "./common/invoice-line-items/lineItemHelpers";
import { INVOICE_DESCRIPTION } from "@/utils/invoiceConstants";
// Sample data structure - replace with your actual data
const sampleJobData = {
  job: {
    id: "JOB-2025-001",
    title: "Electrical Panel Installation",
    type: "service-based",
    status: "in-progress",
    assignedLabor: [],
    contractor: "ABC Corporation",
    customer: "ABC Corporation",
    description: "Install new electrical panel and upgrade wiring system",
    createdDate: "2025-01-10",
    dueDate: "2025-01-30",
    estimatedHours: 40,
    actualHours: 32,
    estimatedCost: 5000,
    actualCost: 5330,
    location: "123 Business Ave, New York",
    priority: "high",
    billingStatus: "invoiced",
  },
  materials: [
    {
      id: "1",
      name: "Electrical Panel",
      quantity: 1,
      unit: "unit",
      unitCost: 450,
      totalCost: 450,
      supplier: "ElectroSupply Co",
    },
    {
      id: "2",
      name: "Copper Wire - 12 AWG",
      quantity: 500,
      unit: "feet",
      unitCost: 2.5,
      totalCost: 1250,
      supplier: "Wire World",
    },
    {
      id: "3",
      name: "Circuit Breakers - 20A",
      quantity: 6,
      unit: "unit",
      unitCost: 35,
      totalCost: 210,
      supplier: "ElectroSupply Co",
    },
  ],
  timeLogs: [
    {
      id: "1",
      laborName: "Mike Johnson",
      date: "2025-01-18",
      hoursWorked: 8,
      description: "Panel installation and wiring",
      billable: true,
    },
    {
      id: "2",
      laborName: "David Wilson",
      date: "2025-01-20",
      hoursWorked: 6,
      description: "Assisted with panel installation",
      billable: true,
    },
    {
      id: "3",
      laborName: "Mike Johnson",
      date: "2025-01-21",
      hoursWorked: 10,
      description: "Circuit breaker installation",
      billable: true,
    },
    {
      id: "4",
      laborName: "Sarah Davis",
      date: "2025-01-22",
      hoursWorked: 6,
      description: "Final connections and cleanup",
      billable: false,
    },
  ],
  invoices: [
    {
      id: "INV-2025-001",
      type: "Estimate",
      description: "Initial project estimate with detailed breakdown",
      amount: 15000,
      status: "Sent",
      createdDate: "2025-01-14",
      dueDate: "2025-01-28",
    },
    {
      id: "INV-2025-002",
      type: "Proposal Invoice",
      description: "Project proposal accepted by client",
      amount: 15000,
      status: "Paid",
      createdDate: "2025-01-16",
      dueDate: "2025-01-30",
    },
    {
      id: "INV-2025-003",
      type: "Progressive Invoice",
      description: "50% completion milestone payment",
      amount: 7500,
      status: "Paid",
      createdDate: "2025-01-30",
      dueDate: "2025-02-13",
    },
    {
      id: "INV-2025-004",
      type: "Final Invoice",
      description: "Project completion final payment",
      amount: 7500,
      status: "Paid",
      createdDate: "2025-02-15",
      dueDate: "2025-03-01",
    },
  ],
};

interface JobDetailsPageProps {
  jobId: string;
  onBack: () => void;
  jobs: any[];
  setJobs: (jobs: any[]) => void;
  onJobsRefresh?: () => void;
  /** When provided, auto-scroll + briefly highlight the matching estimate row */
  focusEstimateId?: string;
  /** Sub-jobs table: navigate to this sub-job’s full detail view */
  onViewSubJob?: (subJobId: string) => void;
}

type JobDocumentItem = {
  id: number;
  jobId: number;
  title: string;
  fileUrl: string | null;
  fileName: string;
  uploadedAt: string;
  updatedAt?: string;
};

// Add these interfaces at the top of your file or in a types file
interface Product {
  id: number;
  product_name?: string;
  name?: string;
  sku?: string;
  supplier_sku?: string;
  unit?: string;
  unit_cost?: number;
  price?: number;
  stock_quantity?: number;
  supplier_order_id?: string;
}

interface ProductQuantity {
  total_ordered: number;
  material_used: number;
  return_to_warehouse: boolean;
  unit_cost: number;
}

interface MaterialFormData {
  product_id: number | null;
  material_name: string;
  quantity: number;
  unit: string;
  total_ordered: number;
  material_used: number;
  supplier_order_id: string;
  return_to_warehouse: boolean;
  unit_cost: number;
  date: string;
}

interface MaterialErrors {
  product?: string;
  date?: string;
  total_ordered?: string;
  material_used?: string;
}

interface MaterialEntry {
  product_id: number;
  material_name: string;
  quantity: number;
  unit: string;
  total_ordered: number;
  material_used: number;
  supplier_order_id: string;
  return_to_warehouse: boolean;
  unit_cost: number;
}

interface BulkMaterialPayload {
  materials: MaterialEntry[];
}

interface CompleteBluesheetPayload {
  job_id: number;
  date: string;
  notes: string;
  additional_charges: number;
  status: string;
  labor_entries: any[];
  material_entries: MaterialEntry[];
}

export function JobDetailsPage({
  jobId,
  onBack,
  jobs,
  setJobs,
  onJobsRefresh,
  focusEstimateId,
  onViewSubJob,
}: JobDetailsPageProps) {
  const getJobTitle = (jobData: any) =>
    jobData?.title || jobData?.job_title || "";
  const getJobDescription = (jobData: any) =>
    jobData?.description ?? jobData?.job_description ?? "";
  

  const { hasPermission } = usePermissions();
  const canAssignLeadLabor =
    hasPermission("jobs", "assign") ||
    hasPermission("jobs", "assigned leader") ||
    hasPermission("jobs", "assigned lead labor");
  const canAssignLabor =
    hasPermission("jobs", "assign") ||
    hasPermission("jobs", "assigned labor");

  // Find the job from your jobs array or use sample data
  const job =
    jobs.find((j) => String(j?.id) === String(jobId)) || {};


  console.log("Job data:", job);
  console.log("Labour timesheets:", job.labor_timesheets);
  console.log("Bluesheets data:", job.bluesheets);
  console.log(job.subJobs,"job.subJobs");

  

  /** Sub-jobs table only for main jobs — hide if `subJobs` wrongly includes current job (siblings from parent). */
  const subJobsForTable = useMemo(() => {
    const list = job?.subJobs;
    if (!Array.isArray(list) || list.length === 0) return [];
    const idStr = String(jobId);
    if (list.some((sj: any) => String(sj?.id) === idStr)) return [];
    return list;
  }, [job, jobId]);

  
  
  // Use real job data for materials, timeLogs, and invoices
  // const materials = job.assignedMaterialsDetails || sampleJobData.materials
  // console.log(materials,"testmateris")
  const [materials, setMaterials] = useState<any[]>(
    job.assignedMaterialsDetails || sampleJobData.materials || [],
  );
  const [bluesheets, setBluesheets] = useState<any[]>(job.bluesheets || []);
  const [isLoadingBluesheets, setIsLoadingBluesheets] = useState(false);
  const [selectedBlueSheetForReview, setSelectedBlueSheetForReview] =
    useState<DialogBlueSheetItem | null>(null);
  const [isBlueSheetDialogOpen, setIsBlueSheetDialogOpen] = useState(false);
  const [selectedBluesheetIds, setSelectedBluesheetIds] = useState<number[]>(
    [],
  );

  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [changeOrderJob, setChangeOrderJob] = useState<any>(null);
  const [changeOrderTitle, setChangeOrderTitle] = useState("");
  const [isUpdatingChangeOrder, setIsUpdatingChangeOrder] = useState(false);
  const [changeOrderErrors, setChangeOrderErrors] = useState<
    Record<string, string>
  >({});
  const [changeOrderEstimate, setChangeOrderEstimate] = useState<
    number | string
  >("");
  console.log(job,":job");
  

  const timeLogs = Array.isArray(job.labor_timesheets)
    ? job.labor_timesheets
    : Array.isArray(sampleJobData.timeLogs)
      ? sampleJobData.timeLogs
      : []; // Ensure timeLogs is always an array
  const invoices = sampleJobData.invoices; // Keep sample data for now as we don't have invoices API
  console.log(materials, "testmaterials");
  // Calculate totals using real job data
  const totalMaterialCost = materials.reduce(
    (sum: number, material: any) =>
      sum +
      (Number(material.stock_quantity ?? material.quantity ?? 0) || 0) *
        (Number(
          material.unit_cost ?? material.unitCost ?? material.price ?? 0,
        ) || 0),
    0,
  );

  const totalLaborCost = [
    ...(job.assignedLaborDetails || []),
    ...(job.customLabor || []),
  ].reduce((sum: number, labor: any) => {
    const rate = Number(labor.hourly_rate ?? 0);
    const hours = Number(labor.hours_worked ?? 0);
    return sum + rate * hours;
  }, 0);

    const sanitizeCustomProductsForPayload = (products: any[] = [], jobId: number) => {
      return products
        .filter((item: any) => {
          const productName = String(item.product_name || item.item || "").trim();

          // header / empty rows payload me nahi jani chahiye
          if (!productName) return false;

          return true;
        })
        .map((item: any) => {
          const productPayload: any = {
            product_name: String(item.product_name || item.item || "").trim(),
            description: item.description || "",
            jdp_sku:
              item.jdpSKU ||
              item.jdp_sku ||
              `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            stock_quantity: Number(item.stock_quantity || item.qty || 1),
            unit: item.unit || "unit",
            job_id: Number(jobId),
            unit_cost: Number(item.unit_cost || item.rate || 0),
            jdp_price: Number(item.jdp_price || item.rate || 0),
            estimated_price: Number(
              item.estimated_price || item.estimatedPrice || 0,
            ),
            total_cost: Number(item.total_cost || item.total || 0),
            is_custom: item.is_custom === true || item.isCustomProduct === true,
            section_name: null,
            section_type: null,
            parent_header_name:
              item.parent_header_name || item.parentHeaderName || null,
          };

          // searched/selected products ke liye id bhejo
          if (item.isCustomProduct !== true && item.productId) {
            productPayload.id = item.productId;
          }

          // existing backend product id ho to usko bhi preserve karo
          if (!productPayload.id && item.id && !item.type) {
            productPayload.id = item.id;
          }

          return productPayload;
        });
    };

  const refreshJobBluesheetsList = useCallback(async () => {
    try {
      if (!jobId) return;
      setIsLoadingBluesheets(true);
      const numericJobId = Number(jobId);
      const response = await apiClient.getJobBluesheets(numericJobId);
      const responseData = response.data || response;
      const blues =
        responseData?.bluesheets || responseData?.data || responseData || [];
      const totalLaborCost = responseData?.total_labor_cost;

      const normalized = (Array.isArray(blues) ? blues : []).map(
        (sheet: any) => ({
          ...sheet,
          id: sheet.id ?? sheet.latest_bluesheet_id,
          date: sheet.date ?? sheet.latest_bluesheet_date ?? "",
          status:
            sheet.status ?? (sheet.approved_by ? "approved" : "pending"),
          notes: sheet.notes ?? "",
          additional_charges: sheet.additional_charges ?? 0,
          created_by: sheet.created_by ?? sheet.submitted_by?.id ?? 0,
          created_by_user: sheet.created_by_user ??
            sheet.submitted_by ?? { id: 0, email: "", full_name: "N/A" },
          labor_entries: sheet.labor_entries ?? [],
          material_entries: sheet.material_entries ?? [],
          materials_invoiced: sheet.materials_invoiced,
          total_labor_hours: sheet.total_labor_hours ?? null,
          total_labor_cost: sheet.total_labor_cost ?? totalLaborCost ?? 0,
          created_at: sheet.created_at ?? "",
          updated_at: sheet.updated_at ?? "",
        }),
      );

      setBluesheets(normalized);
    } catch (error) {
      console.error("Error fetching job bluesheets:", error);
      setBluesheets(job.bluesheets || []);
    } finally {
      setIsLoadingBluesheets(false);
    }
  }, [jobId, job.bluesheets]);

  // Refresh bluesheets for this job from API whenever jobId changes
  useEffect(() => {
    void refreshJobBluesheetsList();
  }, [refreshJobBluesheetsList]);

  job.estimatedCost || 0;
  const totalHours = timeLogs.reduce(
    (sum: number, log: any) => sum + log.hoursWorked,
    0,
  );
  const totalMaterialItems = materials.reduce(
    (sum: number, material: any) =>
      sum + (material.stock_quantity || material.quantity || 0),
    0,
  );
  const totalLaborEntries = job.assignedLaborDetails
    ? job.assignedLaborDetails.length
    : timeLogs.length;
  const totalInvoices = invoices.length;
  const [showEditJobModal, setShowEditJobModal] = useState(false);

  const [refreshMaterials, setRefreshMaterials] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const isRefreshingMaterialsRef = useRef(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<
    {
      id: number;
      company_name: string;
      users: {
        full_name: string;
      };
    }[]
  >([]);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [quickbookActionLoading, setQuickbookActionLoading] = useState<
    "send" | "save" | null
  >(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [estimates, setEstimates] = useState<Invoice[]>([]);
  const [refreshInvoices, setRefreshInvoices] = useState(false);
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);
  const [highlightEstimateId, setHighlightEstimateId] = useState<string | null>(
    null,
  );

  // Job Documents state
  const [jobDocuments, setJobDocuments] = useState<JobDocumentItem[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [deletingDocumentIds, setDeletingDocumentIds] = useState<number[]>([]);
  const [downloadingDocumentIds, setDownloadingDocumentIds] = useState<
    number[]
  >([]);
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);

  const [documentFormData, setDocumentFormData] = useState({
    title: "",
    file: null as File | null,
  });
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const [documentFilePreviewUrl, setDocumentFilePreviewUrl] = useState<
    string | null
  >(null);

  const resetDocumentUploadForm = useCallback(() => {
    setDocumentFormData({ title: "", file: null });
    if (documentFileInputRef.current) {
      documentFileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    const file = documentFormData.file;
    if (!file) {
      setDocumentFilePreviewUrl(null);
      return;
    }
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name);
    if (!isImage) {
      setDocumentFilePreviewUrl(null);
      return;
    }
    objectUrl = URL.createObjectURL(file);
    setDocumentFilePreviewUrl(objectUrl);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentFormData.file]);
  const documentsApiClient = apiClient as typeof apiClient & {
    getJobDocuments: (jobId: number) => Promise<any>;
    uploadJobDocument: (params: {
      jobId: number;
      title: string;
      file: File;
    }) => Promise<any>;
    deleteJobDocument: (documentId: number) => Promise<any>;
  };
  const [showReinvoiceAlert, setShowReinvoiceAlert] = useState(false);
  const [pendingReviewSheets, setPendingReviewSheets] = useState<any[] | null>(
    null,
  );
  const [invalidHeaderKeys, setInvalidHeaderKeys] = useState<string[]>([]);
  

  const extractDocumentFileName = (fileUrl: string | null): string => {
    if (!fileUrl) return "Document";
    try {
      const decodedUrl = decodeURIComponent(fileUrl);
      const segments = decodedUrl.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      return lastSegment || "Document";
    } catch (error) {
      console.error("Failed to parse document file name:", error);
      return "Document";
    }
  };

  const formatDocumentTimestamp = (timestamp?: string): string => {
    if (!timestamp) {
      return "—";
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };



  const fetchJobDocuments = useCallback(async () => {
    if (!jobId) {
      return;
    }

    const numericJobId = Number(jobId);
    if (Number.isNaN(numericJobId)) {
      return;
    }

    setIsLoadingDocuments(true);
    try {
      const response = await documentsApiClient.getJobDocuments(numericJobId);
      const documents = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      const formattedDocuments: JobDocumentItem[] = documents.map(
        (doc: any) => ({
          id: doc.id,
          jobId: doc.job_id,
          title: doc.document_title || "Untitled Document",
          fileUrl: doc.document_file || null,
          fileName: extractDocumentFileName(doc.document_file || null),
          uploadedAt: doc.created_at || "",
          updatedAt: doc.updated_at,
        }),
      );

      setJobDocuments(formattedDocuments);
    } catch (error) {
      console.error("Failed to fetch job documents:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch job documents",
      );
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [documentsApiClient, jobId]);

  useEffect(() => {
    fetchJobDocuments();
  }, [fetchJobDocuments]);

  const handleUploadDocument = useCallback(async () => {
    if (!documentFormData.title || !documentFormData.file) {
      toast.error("Please fill in all fields");
      return;
    }

    const numericJobId = Number(jobId);
    if (Number.isNaN(numericJobId)) {
      toast.error("Invalid job ID. Unable to upload document.");
      return;
    }

    setIsUploadingDocument(true);
    try {
      await documentsApiClient.uploadJobDocument({
        jobId: numericJobId,
        title: documentFormData.title,
        file: documentFormData.file,
      });

      toast.success("Document uploaded successfully");
      setShowUploadDocumentModal(false);
      resetDocumentUploadForm();
      await fetchJobDocuments();
    } catch (error) {
      console.error("Failed to upload document:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document",
      );
    } finally {
      setIsUploadingDocument(false);
    }
  }, [
    documentFormData.file,
    documentFormData.title,
    documentsApiClient,
    fetchJobDocuments,
    jobId,
    resetDocumentUploadForm,
  ]);

  const handleDeleteDocument = useCallback(
    async (documentId: number) => {
      setDeletingDocumentIds((prev) =>
        prev.includes(documentId) ? prev : [...prev, documentId],
      );
      try {
        await documentsApiClient.deleteJobDocument(documentId);
        setJobDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        toast.success("Document deleted successfully");
      } catch (error) {
        console.error("Failed to delete document:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete document",
        );
      } finally {
        setDeletingDocumentIds((prev) =>
          prev.filter((id) => id !== documentId),
        );
      }
    },
    [documentsApiClient],
  );

  const handleDownloadDocument = useCallback((doc: JobDocumentItem) => {
    if (!doc.fileUrl) {
      toast.error("Document URL not available");
      return;
    }

    setDownloadingDocumentIds((prev) =>
      prev.includes(doc.id) ? prev : [...prev, doc.id],
    );
    try {
      const resolvedName = doc.fileName?.trim() || "document";
      const encodedUrl = encodeURIComponent(doc.fileUrl);
      const encodedName = encodeURIComponent(resolvedName);
      const proxyUrl = `/api/job-documents/download?fileUrl=${encodedUrl}&fileName=${encodedName}`;
      const hasExtension = /\.[A-Za-z0-9]{2,6}$/.test(resolvedName);
      const finalFileName = hasExtension ? resolvedName : `${resolvedName}.pdf`;
      const link = document.createElement("a");
      link.href = proxyUrl;
      link.setAttribute("download", finalFileName);
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download document:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download document",
      );
    } finally {
      setDownloadingDocumentIds((prev) => prev.filter((id) => id !== doc.id));
    }
  }, []);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [showDeleteEstimateDialog, setShowDeleteEstimateDialog] =
    useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<any | null>(null);
  const [printInvoiceId, setPrintInvoiceId] = useState<number | null>(null);
  const [showPrintMount, setShowPrintMount] = useState(false);
  const [totalEstimates, setTotalEstimates] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [projectSummary, setProjectSummary] = useState<{
    jobEstimate: number;
    materialsCost: number;
    laborCost: number;
    actualProjectCost: number;
  } | null>(null);

  const getLastHeaderMeta = (lineItems: any[] = []) => {
    for (let i = lineItems.length - 1; i >= 0; i--) {
      const row = lineItems[i];
      if (row.type === "header") {
        return {
          parentHeaderKey: row.headerKey,
          parentHeaderName: row.headerName || null,
        };
      }
    }

    return {
      parentHeaderKey: null,
      parentHeaderName: null,
    };
  };

  // Function to parse labor IDs and fetch labor data
  const parseLaborIds = async (
    laborIdsInput: string | string[] | null | undefined,
    isLeadLabor: boolean = false,
  ) => {
    if (laborIdsInput == null || laborIdsInput === "") return [];

    let laborIds: unknown[] = [];
    try {
      if (Array.isArray(laborIdsInput)) {
        laborIds = laborIdsInput;
      } else {
        const trimmed = String(laborIdsInput).trim();
        if (!trimmed) return [];
        const parsed = JSON.parse(trimmed);
        laborIds = Array.isArray(parsed) ? parsed : [parsed];
      }
      if (!Array.isArray(laborIds) || laborIds.length === 0) return [];

      const laborData = [];
      for (const rawId of laborIds) {
        const id = String(rawId);
        try {
          if (isLeadLabor) {
            // For lead labor, we'll fetch all and filter by ID since getLeadLaborById doesn't exist
            const response = await apiClient.getLeadLabor(1, 100); // Get a large number to find the specific ID
            const leadLabor = response.data.find(
              (item: any) => item.id.toString() === id,
            );
            if (leadLabor) {
              laborData.push({
                id: leadLabor.id,
                name: leadLabor.name || leadLabor.users?.full_name,
                user: {
                  full_name: leadLabor.name || leadLabor.users?.full_name,
                },
              });
            }
          } else {
            console.log("Fetching labor by ID:", id);
            const response = await apiClient.getLaborById(id);
            console.log("Labour API response:", response);
            if (response) {
              laborData.push({
                id: response.id,
                name:
                  response.users?.full_name ||
                  response.name ||
                  response.labor_code,
                user: response.users,
                labor_code: response.labor_code,
              });
            }
          }
        } catch (error) {
          console.error(
            `Error fetching ${isLeadLabor ? "lead labor" : "labor"} with ID ${id}:`,
            error,
          );
        }
      }
      console.log("Final labor data:", laborData);
      return laborData;
    } catch (error) {
      console.error("Error parsing labor IDs:", error);
      return [];
    }
  };

  /** API expects JSON stringified id arrays. Include existing job IDs when edited lists are still empty (async load / list view without details). */
  const buildAssignedLaborIdsField = (
    editedList: unknown[] | undefined,
    rawJobIds: unknown,
    isTouched: boolean,
  ): string | undefined => {
    if (Array.isArray(editedList) && editedList.length > 0) {
      return JSON.stringify(
        editedList.map((labor: any) => String(labor?.id ?? labor)),
      );
    }
    if (isTouched) {
      // User explicitly cleared the field; send empty ids instead of fallback.
      return JSON.stringify([]);
    }
    if (rawJobIds == null || rawJobIds === "") return undefined;
    if (Array.isArray(rawJobIds)) {
      const ids = rawJobIds.filter(
        (x) => x != null && String(x).length > 0,
      ) as unknown[];
      return ids.length ? JSON.stringify(ids.map(String)) : undefined;
    }
    if (typeof rawJobIds === "string") {
      const t = rawJobIds.trim();
      if (!t) return undefined;
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) {
          return parsed.length
            ? JSON.stringify(parsed.map((x: unknown) => String(x)))
            : undefined;
        }
        return JSON.stringify([String(parsed)]);
      } catch {
        return JSON.stringify([t]);
      }
    }
    return undefined;
  };
  const resolveLaborDetailsFromResponse = async (
    responseJobData: any,
    fallbackLaborIds: unknown,
    fallbackLeadLaborIds: unknown,
  ) => {
    const laborIdsSource =
      responseJobData?.assigned_labor_ids ?? fallbackLaborIds;
    const leadLaborIdsSource =
      responseJobData?.assigned_lead_labor_ids ?? fallbackLeadLaborIds;

    const [assignedLaborDetails, assignedLeadLaborDetails] = await Promise.all([
      laborIdsSource ? parseLaborIds(laborIdsSource, false) : Promise.resolve([]),
      leadLaborIdsSource ? parseLaborIds(leadLaborIdsSource, true) : Promise.resolve([]),
    ]);

    return {
      assignedLaborDetails,
      assignedLeadLaborDetails,
      assigned_labor_ids: laborIdsSource,
      assigned_lead_labor_ids: leadLaborIdsSource,
    };
  };

  // Normalize status helper function
  const normalizeStatus = (status: string | undefined): string => {
    if (!status) return "draft";
    // Convert hyphen to underscore for consistency
    if (status === "in-progress") return "in_progress";
    return status;
  };

  /**
   * updateJob / complete responses often return only IDs or strip nested customer/contractor.
   * Keep display names and stable party refs from the job we had before the API round-trip.
   */
  const preserveJobPartyFieldsFromPrevious = (
    previousJob: any,
    mergedJob: any,
  ) => {
    if (!mergedJob) return mergedJob;
    const out = { ...mergedJob };

    const copyNameIfLost = (key: "customerName" | "contractorName") => {
      const prev = previousJob?.[key];
      const next = out[key];
      const prevOk =
        prev !== undefined &&
        prev !== null &&
        String(prev).trim() !== "";
      const nextEmpty =
        next === undefined ||
        next === null ||
        (typeof next === "string" && next.trim() === "");
      if (prevOk && nextEmpty) {
        out[key] = prev;
      }
    };
    copyNameIfLost("customerName");
    copyNameIfLost("contractorName");

    if (out.customer == null && previousJob?.customer != null) {
      out.customer = previousJob.customer;
    }
    if (out.contractor == null && previousJob?.contractor != null) {
      out.contractor = previousJob.contractor;
    }

    const cid = out.customer_id ?? out.customerId;
    const ctid = out.contractor_id ?? out.contractorId;
    if (out.customer == null && cid != null) {
      out.customer = String(cid);
    }
    if (out.contractor == null && ctid != null) {
      out.contractor = String(ctid);
    }

    const restoreObjectIfApiSentOnlyId = (key: "customer" | "contractor") => {
      const next = out[key];
      const prev = previousJob?.[key];
      const prevWasObject =
        prev && typeof prev === "object" && !Array.isArray(prev);
      const nextIsPrimitive =
        next === undefined ||
        next === null ||
        typeof next === "string" ||
        typeof next === "number";
      if (prevWasObject && nextIsPrimitive) {
        out[key] = prev;
      }
    };
    restoreObjectIfApiSentOnlyId("customer");
    restoreObjectIfApiSentOnlyId("contractor");

    const pickCustomerName = (source: any): string =>
      source?.customer_name || source?.company_name || source?.name || "";
    const pickContractorName = (source: any): string =>
      source?.contractor_name ||
      source?.company_name ||
      source?.name ||
      source?.full_name ||
      source?.users?.full_name ||
      "";

    if (!out.customerName || String(out.customerName).trim() === "") {
      out.customerName =
        pickCustomerName(out.customer) ||
        pickCustomerName(previousJob?.customer) ||
        previousJob?.customerName ||
        out.customerName;
    }

    if (!out.contractorName || String(out.contractorName).trim() === "") {
      out.contractorName =
        pickContractorName(out.contractor) ||
        pickContractorName(previousJob?.contractor) ||
        previousJob?.contractorName ||
        out.contractorName;
    }

    return out;
  };

  const resolveJobPartyDisplayName = () => {
    const normalizedType = String(job?.type || "").toLowerCase();
    const contractName =
      job.contractorName ||
      contractorData?.contractor_name ||
      job.contractor?.contractor_name ||
      job.contractor?.company_name ||
      job.contractor?.name ||
      job.contractor?.full_name ||
      job.contractor?.users?.full_name ||
      "";
    const customerName =
      job.customerName ||
      customerData?.customer_name ||
      job.customer?.customer_name ||
      job.customer?.company_name ||
      job.customer?.name ||
      job.subJobs?.[0]?.customer?.customer_name ||
      "";

    if (normalizedType === "contract-based" || normalizedType === "contract_based") {
      return contractName || customerName || "No customer assigned";
    }
    return customerName || contractName || "No customer assigned";
  };

  const [editedJob, setEditedJob] = useState({
    title: getJobTitle(job),
    type: job.type,
    location: job.location || `${job.address || ""}, ${job.cityZip || ""}`,
    address: job.address || "",
    cityZip: job.cityZip || "",
    description: getJobDescription(job),
    contractor: job.contractor || job.customer,
    startDate: "01/15/2025",
    priority: "High",
    status: normalizeStatus(job.status),
    assignedLabor: job.assignedLaborDetails || [],
    assignedLeadLabor: job.assignedLeadLaborDetails || [],
  });
  const [isLaborSelectionTouched, setIsLaborSelectionTouched] = useState(false);
  const [isLeadLaborSelectionTouched, setIsLeadLaborSelectionTouched] =
    useState(false);
  const skipNextEditedJobSyncRef = useRef(false);

  // Load labor data when component mounts
  useEffect(() => {
    const loadLaborData = async () => {
      try {
        // Parse and load lead labor data
        if (job.assigned_lead_labor_ids) {
          console.log(job.assigned_lead_labor_ids,"job.assigned_lead_labor_ids");
          
          const leadLaborData = await parseLaborIds(
            job.assigned_lead_labor_ids,
            true,
          );
          console.log(job.assigned_lead_labor_ids,leadLaborData,"leadLaborData");
          
          setEditedJob((prev) => ({
            ...prev,
            assignedLeadLabor: leadLaborData,
          }));
        }

        // Parse and load regular labor data
        if (job.assigned_labor_ids) {
          console.log("Loading regular labor data:", job.assigned_labor_ids);
          const laborData = await parseLaborIds(job.assigned_labor_ids, false);
          console.log("Parsed labor data:", laborData);
          setEditedJob((prev) => ({
            ...prev,
            assignedLabor: laborData,
          }));
        }
      } catch (error) {
        console.error("Error loading labor data:", error);
      }
    };

    loadLaborData();
  }, [job.assigned_lead_labor_ids, job.assigned_labor_ids]);

  // Form states
  const [showAddInvoiceDialog, setShowAddInvoiceDialog] = useState(false);
  const [showInlineInvoiceForm, setShowInlineInvoiceForm] = useState(false);
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false);
  const [showAddLaborDialog, setShowAddLaborDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceViewDialog, setShowInvoiceViewDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    null,
  );
        console.log(job,editedJob,"jobjob");

  // After navigation from send flow: scroll + highlight the created estimate
  useEffect(() => {
    const targetId = (focusEstimateId || "").toString().trim();
    if (!targetId) return;
    if (!estimates || estimates.length === 0) return;

    const exists = estimates.some((e: any) => e?.id?.toString?.() === targetId);
    if (!exists) return;

    const el = document.getElementById(`estimate-row-${targetId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightEstimateId(targetId);
  }, [focusEstimateId, estimates]);

  // Keep highlight until user clicks anywhere once, then clear it
  useEffect(() => {
    if (!highlightEstimateId) return;

    const handleDocumentClick = () => {
      setHighlightEstimateId(null);
    };

    document.addEventListener("click", handleDocumentClick, { once: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [highlightEstimateId]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
  const [invoiceValidationErrors, setInvoiceValidationErrors] = useState<
    Record<string, string>
  >({});
  const [customInvoiceTypes, setCustomInvoiceTypes] = useState<string[]>([]);
  const [customerData, setCustomerData] = useState<any>(null);
  const [contractorData, setContractorData] = useState<any>(null);
  const [InvoioiceNumber, setInvoioiceNumber] = useState("");
  const [isMarkingPaidId, setIsMarkingPaidId] = useState<number | null>(null);
  const [isPaidLoading, setIsPaidLoading] = useState(false);
  const [isApprovingId, setIsApprovingId] = useState<number | null>(null);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<any | null>(null);
  const handleApproveInvoice = async (invoice: any) => {
    if (!invoice?.id) {
      toast.error("Invoice ID not found");
      return;
    }

    const invoiceStatus = String(invoice.status || "").toLowerCase();
    if (invoiceStatus === "approved") {
      return;
    }

    try {
      setIsApprovingId(invoice.id);

      const estimateResponse = await apiClient.getEstimateById(invoice.id);
      const estimateData = estimateResponse?.data || estimateResponse;

      const customProducts = sanitizeCustomProductsForPayload(
        Array.isArray(estimateData?.products) ? estimateData.products : [],
        Number(estimateData.job_id),
      );

      const payload = {
        job_id: Number(estimateData.job_id),
        estimate_title: estimateData.estimate_title || "",
        ...(estimateData.contractor_id
          ? { contractor_id: Number(estimateData.contractor_id) }
          : { customer_id: Number(estimateData.customer_id) }),
        priority: estimateData.priority || "medium",
        service_type: estimateData.service_type || "service_based",
        email_address: estimateData.email_address || "",
        estimate_date: estimateData.estimate_date || "",
        po_number: estimateData.po_number || "",
        rep: estimateData.rep || "",
        due_date: estimateData.due_date || "",
        payment_credits: Number(estimateData.payment_credits || 0),
        balance_due: estimateData.balance_due || "",
        ...(estimateData.bill_to_address && {
          bill_to_address: estimateData.bill_to_address,
        }),
        invoice_type: estimateData.invoice_type || "estimate",
        notes: (estimateData.notes ?? estimateData.description) || "",
        custom_products: customProducts,
        status: "approved",
      };

      await apiClient.updateEstimate(Number(invoice.id), payload as any);

      setEstimates((prev) =>
        prev.map((item: any) =>
          Number(item.id) === Number(invoice.id)
            ? { ...item, status: "approved" }
            : item,
        ),
      );

      toast.success("Invoice approved successfully");
      await fetchEstimates();
      onJobsRefresh?.();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to approve invoice";
      toast.error(apiMessage);
    } finally {
      setIsApprovingId(null);
    }
  };

  // Clean duplicate custom types (case-insensitive)
  const cleanCustomTypes = (types: string[]) => {
    const seen = new Set<string>();
    return types.filter((type) => {
      const lower = type.toLowerCase();
      if (seen.has(lower)) {
        return false;
      }
      seen.add(lower);
      return true;
    });
  };

  // Debug: Log job data to see structure
  console.log("Job data:", job);

  // Inline Invoice Data State
  const [inlineInvoiceData, setInlineInvoiceData] = useState({
    date: new Date().toISOString().split("T")[0],
    estimateNumber: "",
    customerName: job.customerName || "",
    customerAddress: "", // Initialize as empty, will be set by fetchCustomerData
    billToAddress: job.billToAddress || "",
    billToAddressEnabled: true,
    poNumber: "",
    project: job.title || "",
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

  /** Latest invoice notes for create/update/send payloads (matches NewInvoiceDialog ref pattern). */
  const invoiceNotesRef = useRef<string | null>(null);
  useEffect(() => {
    invoiceNotesRef.current = inlineInvoiceData.notes;
  }, [inlineInvoiceData.notes]);

  const getInvoiceNotesForPayload = () =>
    (invoiceNotesRef.current ?? inlineInvoiceData.notes) || "";

// parent component
const [invalidLineItemIds, setInvalidLineItemIds] = useState<string[]>([]);

const validateLineItems = (lineItems: any[] = []) => {
  const result = validateInvoiceLineItemsForSubmit(lineItems);
  if (!result.valid) {
    setInvalidLineItemIds(result.invalidIds);
    toast.error(result.message || "Please fix line item errors");
    return false;
  }
  setInvalidLineItemIds([]);
  return true;
};
  const allowedStatuses = [
    "draft",
    "pending",
    "active",
    "in_progress",
    "completed",
    "cancelled",
    "on_hold",
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const status = allowedStatuses.includes(editedJob.status)
        ? editedJob.status
        : "draft";
      const updatePayload = {
        job_title: editedJob.title,
        job_type:
          editedJob.type === "service_based" || editedJob.type === "service-based"
            ? "service_based"
            : "contract_based",
        // Only send customer_id for service-based jobs, contractor_id for contract-based jobs
        ...(editedJob.type === "contract_based" || editedJob.type === "contract-based"
          ? {
              contractor_id: job.contractor
                ? Number(job.contractor)
                : undefined,
            }
          : {
              customer_id: job.customer
                ? Number(job.customer?.id || job.customer)
                : undefined,
            }),
        description: editedJob.description,
        priority: editedJob.priority.toLowerCase(),
        address: editedJob.address || job.address || "",
        city_zip: editedJob.cityZip || job.cityZip || "",
        phone: job.phone || undefined,
        email: job.email || undefined,
        bill_to_address: job.billToAddress || undefined,
        bill_to_city_zip: job.billToCityZip || undefined,
        bill_to_phone: job.billToPhone || undefined,
        bill_to_email: job.billToEmail || undefined,
        same_as_address: job.sameAsAddress || false,
        due_date: job.dueDate || "",
        estimated_hours: job.estimatedHours || undefined,
        estimated_cost: job.estimatedCost || undefined,

        assigned_labor_ids: buildAssignedLaborIdsField(
          editedJob.assignedLabor,
          job.assigned_labor_ids,
          isLaborSelectionTouched,
        ),

        assigned_lead_labor_ids: buildAssignedLaborIdsField(
          editedJob.assignedLeadLabor,
          job.assigned_lead_labor_ids,
          isLeadLaborSelectionTouched,
        ),

        assigned_material_ids:
          job.materials && job.materials.length > 0
            ? JSON.stringify(job.materials)
            : undefined,
        status,

        // status: ['pending', 'in-progress', 'completed'].includes(job.status)
        //   ? job.status === 'pending'
        //     ? 'active'
        //     : job.status === 'in-progress'
        //       ? 'in_progress'
        //       : job.status
        //   : 'unknown',
      };

      const response = await apiClient.updateJob(jobId, updatePayload);
      const responseJob = response?.data || {};
      console.log(responseJob,"responseJob");
      

      const resolvedAssignments = await resolveLaborDetailsFromResponse(
        responseJob,
        updatePayload.assigned_labor_ids ?? job.assigned_labor_ids,
        updatePayload.assigned_lead_labor_ids ?? job.assigned_lead_labor_ids,
      );

      const nextDescription =
        responseJob?.job_description ??
        responseJob?.description ??
        editedJob.description;

      // Update local job object with normalized keys used across the UI.
      const updatedJob = preserveJobPartyFieldsFromPrevious(job, {
        ...job,
        ...responseJob,
        ...editedJob,
        title: editedJob.title,
        job_title: editedJob.title,
        description: nextDescription,
        job_description: nextDescription,
        assignedLaborDetails: resolvedAssignments.assignedLaborDetails,
        assignedLeadLaborDetails: resolvedAssignments.assignedLeadLaborDetails,
        assigned_labor_ids: resolvedAssignments.assigned_labor_ids,
        assigned_lead_labor_ids: resolvedAssignments.assigned_lead_labor_ids,
      });
      console.log(updatedJob,"updatedJob");
      

      const updatedJobs = jobs.map((j: any) =>
        String(j?.id) === String(jobId) ? updatedJob : j,
      );
      skipNextEditedJobSyncRef.current = true;
      setJobs(updatedJobs);

      setIsEditing(false);
      setIsLaborSelectionTouched(false);
      setIsLeadLaborSelectionTouched(false);
      setIsSaving(false);
      toast.success("Job updated successfully!");
      
      setEditedJob((prev) => ({
        ...prev,
        title: editedJob.title,
        description: nextDescription,
        status,
        assignedLabor: resolvedAssignments.assignedLaborDetails,
        assignedLeadLabor: resolvedAssignments.assignedLeadLaborDetails,
      }));
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update job",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const handleCompleteJob = async () => {
  if (isEditing) {
    toast.error("Please save or cancel job edits before completing the job.");
    return;
  }

  if (editedJob.status === "completed") {
    return;
  }

  try {
    setIsSaving(true);

    const updatedJob = {
      ...job,
      ...editedJob,
      status: "completed",
    };

    const normalizedJobType =
      updatedJob.type === "service_based" || updatedJob.type === "service-based"
        ? "service_based"
        : "contract_based";

    const completionPayload = {
      job_title: updatedJob.title,
      job_type: normalizedJobType,
      ...(normalizedJobType === "contract_based"
        ? {
            contractor_id: job.contractor
              ? Number(job.contractor?.id || job.contractor)
              : undefined,
          }
        : {
            customer_id: job.customer
              ? Number(job.customer?.id || job.customer)
              : undefined,
          }),
      description: updatedJob.description,
      priority: updatedJob.priority.toLowerCase(),
      address: updatedJob.address || job.address || "",
      city_zip: updatedJob.cityZip || job.cityZip || "",
      phone: job.phone || undefined,
      email: job.email || undefined,
      bill_to_address: job.billToAddress || undefined,
      bill_to_city_zip: job.billToCityZip || undefined,
      bill_to_phone: job.billToPhone || undefined,
      bill_to_email: job.billToEmail || undefined,
      same_as_address: job.sameAsAddress || false,
      due_date: job.dueDate || "",
      estimated_hours: job.estimatedHours || undefined,
      estimated_cost: job.estimatedCost || undefined,
      assigned_labor_ids: buildAssignedLaborIdsField(
        editedJob.assignedLabor,
        job.assigned_labor_ids,
        isLaborSelectionTouched,
      ),
      assigned_lead_labor_ids: buildAssignedLaborIdsField(
        editedJob.assignedLeadLabor,
        job.assigned_lead_labor_ids,
        isLeadLaborSelectionTouched,
      ),
      assigned_material_ids:
        job.materials && job.materials.length > 0
          ? JSON.stringify(job.materials)
          : undefined,
      status: "completed",
    };

    const response = await apiClient.updateJob(jobId, completionPayload);
    const responseJob = response?.data || {};
    console.log(responseJob, "responseJob");

    const resolvedAssignments = await resolveLaborDetailsFromResponse(
      responseJob,
      completionPayload.assigned_labor_ids ?? job.assigned_labor_ids,
      completionPayload.assigned_lead_labor_ids ?? job.assigned_lead_labor_ids,
    );

    const partyFields =
      normalizedJobType === "service_based"
        ? {
            customer: responseJob.customer || job.customer || null,
            customer_id:
              responseJob.customer?.id ??
              responseJob.customer_id ??
              job.customer?.id ??
              job.customer_id ??
              null,
            contractor: null,
            contractor_id: null,
          }
        : {
            contractor: responseJob.contractor || job.contractor || null,
            contractor_id:
              responseJob.contractor?.id ??
              responseJob.contractor_id ??
              job.contractor?.id ??
              job.contractor_id ??
              null,
            customer: null,
            customer_id: null,
          };

    const completedJob = preserveJobPartyFieldsFromPrevious(job, {
      ...job,
      ...responseJob,
      ...updatedJob,
      ...partyFields,
      title: updatedJob.title,
      job_title: updatedJob.title,
      description: updatedJob.description,
      job_description: updatedJob.description,
      assignedLaborDetails: resolvedAssignments.assignedLaborDetails,
      assignedLeadLaborDetails: resolvedAssignments.assignedLeadLaborDetails,
      assigned_labor_ids: resolvedAssignments.assigned_labor_ids,
      assigned_lead_labor_ids: resolvedAssignments.assigned_lead_labor_ids,
      status: "completed",
    });

    const updatedJobs = jobs.map((j: any) =>
      String(j?.id) === String(jobId) ? completedJob : j,
    );

    skipNextEditedJobSyncRef.current = true;
    setJobs(updatedJobs);

    setEditedJob((prev) => ({
      ...prev,
      title: updatedJob.title,
      description: updatedJob.description,
      status: "completed",
      assignedLabor: resolvedAssignments.assignedLaborDetails,
      assignedLeadLabor: resolvedAssignments.assignedLeadLaborDetails,
      ...(normalizedJobType === "service_based"
        ? {
            customer: responseJob.customer || job.customer || null,
            customer_id:
              responseJob.customer?.id ??
              responseJob.customer_id ??
              job.customer?.id ??
              job.customer_id ??
              null,
            contractor: null,
            contractor_id: null,
          }
        : {
            contractor: responseJob.contractor || job.contractor || null,
            contractor_id:
              responseJob.contractor?.id ??
              responseJob.contractor_id ??
              job.contractor?.id ??
              job.contractor_id ??
              null,
            customer: null,
            customer_id: null,
          }),
    }));

    toast.success("Job marked as completed");
  } catch (error) {
    console.error("Error completing job:", error);
    toast.error("Failed to complete job", {
      description:
        error instanceof Error ? error.message : "Failed to complete job",
    });
  } finally {
    setIsSaving(false);
  }
};
  // const handleCompleteJob = async () => {
  //   if (isEditing) {
  //     toast.error("Please save or cancel job edits before completing the job.");
  //     return;
  //   }
  //   if (editedJob.status === "completed") {
  //     return;
  //   }

  //   try {
  //     setIsSaving(true);

  //     const updatedJob = {
  //       ...job,
  //       ...editedJob,
  //       status: "completed",
  //     };

  //     const completionPayload = {
  //       job_title: updatedJob.title,
  //       job_type:
  //         updatedJob.type === "service_based" || updatedJob.type === "service-based"
  //           ? "service_based"
  //           : "contract_based",
  //       ...(updatedJob.type === "contract_based" || updatedJob.type === "contract-based"
  //         ? {
  //             contractor_id: job.contractor
  //               ? Number(job.contractor)
  //               : undefined,
  //           }
  //         : {
  //             customer_id: job.customer
  //               ? Number(job.customer?.id || job.customer)
  //               : undefined,
  //           }),
  //       description: updatedJob.description,
  //       priority: updatedJob.priority.toLowerCase(),
  //       address: updatedJob.address || job.address || "",
  //       city_zip: updatedJob.cityZip || job.cityZip || "",
  //       phone: job.phone || undefined,
  //       email: job.email || undefined,
  //       bill_to_address: job.billToAddress || undefined,
  //       bill_to_city_zip: job.billToCityZip || undefined,
  //       bill_to_phone: job.billToPhone || undefined,
  //       bill_to_email: job.billToEmail || undefined,
  //       same_as_address: job.sameAsAddress || false,
  //       due_date: job.dueDate || "",
  //       estimated_hours: job.estimatedHours || undefined,
  //       estimated_cost: job.estimatedCost || undefined,
  //       // Use current edited selections while completing, so assignments do not revert.
  //       assigned_labor_ids: buildAssignedLaborIdsField(
  //         editedJob.assignedLabor,
  //         job.assigned_labor_ids,
  //         isLaborSelectionTouched,
  //       ),
  //       assigned_lead_labor_ids: buildAssignedLaborIdsField(
  //         editedJob.assignedLeadLabor,
  //         job.assigned_lead_labor_ids,
  //         isLeadLaborSelectionTouched,
  //       ),
  //       assigned_material_ids:
  //         job.materials && job.materials.length > 0
  //           ? JSON.stringify(job.materials)
  //           : undefined,
  //       status: updatedJob.status,
  //     };
  //     const response = await apiClient.updateJob(jobId, completionPayload);
  //     const responseJob = response?.data || {};
  //     console.log(responseJob,"responseJob");
      

  //     const resolvedAssignments = await resolveLaborDetailsFromResponse(
  //       responseJob,
  //       completionPayload.assigned_labor_ids ?? job.assigned_labor_ids,
  //       completionPayload.assigned_lead_labor_ids ?? job.assigned_lead_labor_ids,
  //     );

  //     const completedJob = preserveJobPartyFieldsFromPrevious(job, {
  //       ...job,
  //       ...responseJob,
  //       ...updatedJob,
  //       title: updatedJob.title,
  //       job_title: updatedJob.title,
  //       description: updatedJob.description,
  //       job_description: updatedJob.description,
  //       assignedLaborDetails: resolvedAssignments.assignedLaborDetails,
  //       assignedLeadLaborDetails: resolvedAssignments.assignedLeadLaborDetails,
  //       assigned_labor_ids: resolvedAssignments.assigned_labor_ids,
  //       assigned_lead_labor_ids: resolvedAssignments.assigned_lead_labor_ids,
  //       status: "completed",
  //     });

  //     const updatedJobs = jobs.map((j: any) =>
  //       String(j?.id) === String(jobId) ? completedJob : j,
  //     );
  //     skipNextEditedJobSyncRef.current = true;
  //     setJobs(updatedJobs);
  //     setEditedJob((prev) => ({
  //       ...prev,
  //       title: updatedJob.title,
  //       description: updatedJob.description,
  //       status: "completed",
  //       assignedLabor: resolvedAssignments.assignedLaborDetails,
  //       assignedLeadLabor: resolvedAssignments.assignedLeadLaborDetails,
  //     }));
    
  //     toast.success("Job marked as completed");
  //   } catch (error) {
  //     console.error("Error completing job:", error);
  //     toast.error("Failed to complete job", {
  //       description:
  //         error instanceof Error ? error.message : "Failed to complete job",
  //     });
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const currentInvoice =
    selectedInvoiceId == null
      ? undefined
      : estimates.find((inv) => Number(inv.id) === selectedInvoiceId);

  const handleCancel = async () => {
    // Reset base fields
    setEditedJob({
      title: getJobTitle(job),
      type: job.type,
      location: job.location || `${job.address || ""}, ${job.cityZip || ""}`,
      address: job.address || "",
      cityZip: job.cityZip || "",
      description: getJobDescription(job),
      contractor: job.contractor || job.customer,
      startDate: "01/15/2025",
      priority: "High",
      status: job.status,
      assignedLabor: job.assignedLaborDetails || [],
      assignedLeadLabor: job.assignedLeadLaborDetails || [],
    });

    // If detailed arrays are missing, hydrate from stored ID strings
    try {
      if (
        (!job.assignedLeadLaborDetails ||
          job.assignedLeadLaborDetails.length === 0) &&
        job.assigned_lead_labor_ids
      ) {
        const leadLaborData = await parseLaborIds(
          job.assigned_lead_labor_ids,
          true,
        );
        setEditedJob((prev) => ({ ...prev, assignedLeadLabor: leadLaborData }));
      }
      if (
        (!job.assignedLaborDetails || job.assignedLaborDetails.length === 0) &&
        job.assigned_labor_ids
      ) {
        const laborData = await parseLaborIds(job.assigned_labor_ids, false);
        setEditedJob((prev) => ({ ...prev, assignedLabor: laborData }));
      }
    } catch (e) {
      // swallow errors here, view will just show what we have
      console.error("Failed to hydrate labor data on cancel", e);
    }

    setIsLaborSelectionTouched(false);
    setIsLeadLaborSelectionTouched(false);
    setIsEditing(false);
  };

  const validateTimeLogForm = () => {
    const errors: Record<string, string> = {};

    if (!timeLogFormData.selectedLabor && !timeLogFormData.selectedLeadLabor) {
      errors.laborSelection = "Please select either Labour or Lead Labour";
    }

    if (!timeLogFormData.hoursWorked || timeLogFormData.hoursWorked === "") {
      errors.hoursWorked = "Hours worked is required";
    } else {
      // Validate hoursWorked format - should be HH:MM:SS and not contain NaN
      if (
        timeLogFormData.hoursWorked.includes("NaN") ||
        timeLogFormData.hoursWorked.includes("NaN")
      ) {
        errors.hoursWorked =
          "Invalid time format. Please select a valid time range.";
      } else {
        // Check if it's in HH:MM:SS format
        const timePattern = /^\d{2}:\d{2}:\d{2}$/;
        if (!timePattern.test(timeLogFormData.hoursWorked)) {
          errors.hoursWorked = "Invalid time format. Expected format: HH:MM:SS";
        } else {
          // Validate that all parts are valid numbers
          const parts = timeLogFormData.hoursWorked.split(":");
          const h = parseInt(parts[0]);
          const m = parseInt(parts[1]);
          const s = parseInt(parts[2]);
          if (isNaN(h) || isNaN(m) || isNaN(s)) {
            errors.hoursWorked =
              "Invalid time values. Please select a valid time range.";
          }
        }
      }
    }

    if (!timeLogFormData.date) {
      errors.date = "Please select a date";
    }

    setTimeLogValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTimeLog = async () => {
    if (timeLogModalMode === "view") {
      setShowTimeLogModal(false);
      setCurrentTimeLog(null);
      return;
    }

    if (!validateTimeLogForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      const selectedLabor =
        timeLogFormData.selectedLabor || timeLogFormData.selectedLeadLabor;
      const isLeadLabor = !!timeLogFormData.selectedLeadLabor;

      // Find the bluesheet ID based on the selected date
      const selectedBluesheet = bluesheets.find(
        (bluesheet: any) => bluesheet.date === timeLogFormData.date,
      );

      if (selectedBluesheet) {
        // Add labor to existing bluesheet
        if (timeLogModalMode === "create") {
          // Validate hoursWorked before sending
          const hoursWorked =
            timeLogFormData.hoursWorked &&
            !timeLogFormData.hoursWorked.includes("NaN")
              ? timeLogFormData.hoursWorked
              : "00:00:00";

          const timeLogPayload = {
            [isLeadLabor ? "lead_labor_id" : "labor_id"]: selectedLabor?.id,
            employee_name:
              selectedLabor?.users?.full_name ||
              selectedLabor?.labor_code ||
              "",
            role: isLeadLabor ? "lead_labor" : "labor",
            regular_hours: hoursWorked,
            hourly_rate: selectedLabor?.hourly_rate || 0,
            date: timeLogFormData.date,
            description: timeLogFormData.description || "",
            status: "approved",
          };

          // Call the bluesheet API
          await apiClient.addLaborToBluesheet(
            selectedBluesheet.id,
            timeLogPayload,
          );
          toast.success(
            "Labour time log added to existing bluesheet successfully!",
          );
        } else if (timeLogModalMode === "edit") {
          // For edit, we might need a different API endpoint
          // Validate hoursWorked before sending
          const hoursWorked =
            timeLogFormData.hoursWorked &&
            !timeLogFormData.hoursWorked.includes("NaN")
              ? timeLogFormData.hoursWorked
              : "00:00:00";

          const updatePayload = {
            [isLeadLabor ? "lead_labor_id" : "labor_id"]: selectedLabor?.id,
            employee_name:
              selectedLabor?.users?.full_name ||
              selectedLabor?.labor_code ||
              "",
            role: isLeadLabor ? "lead_labor" : "labor",
            regular_hours: hoursWorked,
            hourly_rate: selectedLabor?.hourly_rate || 0,
            date: timeLogFormData.date,
            description: timeLogFormData.description || "",
          };

          // You might need to implement updateLaborInBluesheet API method
          await apiClient.updateLaborInBluesheet(
            currentTimeLog.id,
            updatePayload,
          );
          toast.success("Labour time log updated successfully!");
        }
      } else {
        // Create new complete bluesheet with labor
        const completeBluesheetPayload = {
          job_id: job.id,
          date: timeLogFormData.date,
          notes: `Daily work bluesheet for ${job.title || "construction site"}`,
          additional_charges: 0,
          status: "approved",
          labor_entries: [
            {
              [isLeadLabor ? "lead_labor_id" : "labor_id"]: selectedLabor?.id,
              employee_name:
                selectedLabor?.users?.full_name ||
                selectedLabor?.labor_code ||
                "",
              role: isLeadLabor ? "lead_labor" : "labor",
              regular_hours:
                timeLogFormData.hoursWorked &&
                !timeLogFormData.hoursWorked.includes("NaN")
                  ? timeLogFormData.hoursWorked
                  : "00:00:00",
              overtime_hours: "0h",
              hourly_rate: selectedLabor?.hourly_rate || 0,
            },
          ],
          material_entries: [], // Empty material entries for now
        };

        await apiClient.createCompleteBluesheet(completeBluesheetPayload);
        toast.success("New bluesheet created with labor successfully!");
      }

      setShowTimeLogModal(false);
      setCurrentTimeLog(null);
      resetTimeLogForm();

      // Refresh job data to show the new/updated labor time log
      await refreshJobData();
    } catch (error) {
      console.error("Error saving labor time log:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save labor time log",
      );
    }
  };

  // Helper function to parse hours from different formats
  const parseHoursFromString = (hoursString: string): number => {
    if (!hoursString) return 0;

    // Handle "8h" format
    if (hoursString.includes("h")) {
      return parseFloat(hoursString.replace("h", ""));
    }

    // Handle "00:01:48" format (HH:MM:SS)
    if (hoursString.includes(":")) {
      const parts = hoursString.split(":");
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;

        // Convert to decimal hours
        return hours + minutes / 60 + seconds / 3600;
      }
    }

    // Handle plain number
    return parseFloat(hoursString) || 0;
  };

  const handleViewTimeLog = async (labor: any) => {
    console.log("View button clicked, labor:", labor);
    try {
      // Fetch the full labor entry details from the API
      const response = await apiClient.getLaborEntryById(labor.id);
      console.log("API Response for labor entry (view):", response);

      const laborEntry = response.data;

      // Set the current time log data
      setCurrentTimeLog(laborEntry);

      // Determine if it's labor or lead labor based on the API response
      const isLeadLabor = laborEntry.lead_labor_id !== null;
      const laborData = isLeadLabor ? laborEntry.lead_labor : laborEntry.labor;

      // Keep hoursWorked in HH:MM:SS format for TimeRangePicker
      // If it's already in HH:MM:SS format, use it directly
      // Otherwise, convert from other formats
      let hoursWorkedStr = "";
      if (laborEntry.regular_hours) {
        if (laborEntry.regular_hours.includes(":")) {
          // Already in HH:MM:SS or HH:MM format
          const parts = laborEntry.regular_hours.split(":");
          if (parts.length === 2) {
            // HH:MM format, add seconds
            hoursWorkedStr = `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
          } else if (parts.length === 3) {
            // HH:MM:SS format, use as is (ensure proper padding)
            hoursWorkedStr = `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
          } else {
            hoursWorkedStr = laborEntry.regular_hours;
          }
        } else {
          // Convert from "8h" or decimal format to HH:MM:SS
          const hours = parseHoursFromString(laborEntry.regular_hours);
          const h = Math.floor(hours);
          const m = Math.floor((hours - h) * 60);
          const s = Math.floor(((hours - h) * 60 - m) * 60);
          hoursWorkedStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }
      }

      setTimeLogFormData({
        selectedLabor: isLeadLabor ? null : laborData,
        selectedLeadLabor: isLeadLabor ? laborData : null,
        hoursWorked: hoursWorkedStr,
        description: laborEntry.description || "",
        date: laborEntry.date || new Date().toISOString().split("T")[0],
      });

      // Set input values based on the fetched data
      if (isLeadLabor) {
        setLeadLaborInputValue(
          laborData?.users?.full_name || laborData?.labor_code || "",
        );
        setLaborInputValue("");
      } else {
        setLaborInputValue(
          laborData?.users?.full_name || laborData?.labor_code || "",
        );
        setLeadLaborInputValue("");
      }

      // Reset the ref to allow useEffect to sync timeRangeValue
      timeRangeValueRef.current = false;

      setTimeLogModalMode("view");
      setShowTimeLogModal(true);
      console.log("View modal should be open now with fetched data");
    } catch (error) {
      console.error("Error viewing labor time log:", error);
      toast.error("Failed to load labor entry details");
    }
  };

  // const handleEditTimeLog = async (labor: any) => {
  //   try {
  //     console.log('Edit button clicked, labor entry:', labor);

  //     // Fetch the full labor entry details from the API
  //     const response = await apiClient.getLaborEntryById(labor.id);
  //     console.log('API Response for labor entry:', response);

  //     const laborEntry = response.data;

  //     // Set the current time log data
  //     setCurrentTimeLog(laborEntry);

  //     // Determine if it's labor or lead labor based on the API response
  //     const isLeadLabor = laborEntry.lead_labor_id !== null;
  //     const laborData = isLeadLabor ? laborEntry.lead_labor : laborEntry.labor;

  //     // Keep hoursWorked in HH:MM:SS format for TimeRangePicker
  //     // If it's already in HH:MM:SS format, use it directly
  //     // Otherwise, convert from other formats
  //     let hoursWorkedStr = '';
  //     if (laborEntry.regular_hours) {
  //       if (laborEntry.regular_hours.includes(':')) {
  //         // Already in HH:MM:SS or HH:MM format
  //         const parts = laborEntry.regular_hours.split(':');
  //         if (parts.length === 2) {
  //           // HH:MM format, add seconds
  //           hoursWorkedStr = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
  //         } else if (parts.length === 3) {
  //           // HH:MM:SS format, use as is (ensure proper padding)
  //           hoursWorkedStr = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  //         } else {
  //           hoursWorkedStr = laborEntry.regular_hours;
  //         }
  //       } else {
  //         // Convert from "8h" or decimal format to HH:MM:SS
  //         const hours = parseHoursFromString(laborEntry.regular_hours);
  //         const h = Math.floor(hours);
  //         const m = Math.floor((hours - h) * 60);
  //         const s = Math.floor(((hours - h) * 60 - m) * 60);
  //         hoursWorkedStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  //       }
  //     }

  //     setTimeLogFormData({
  //       selectedLabor: isLeadLabor ? null : laborData,
  //       selectedLeadLabor: isLeadLabor ? laborData : null,
  //       hoursWorked: hoursWorkedStr,
  //       description: laborEntry.description || '',
  //       date: laborEntry.date || new Date().toISOString().split('T')[0]
  //     });

  //     // Set input values based on the fetched data
  //     if (isLeadLabor) {
  //       setLeadLaborInputValue(laborData?.users?.full_name || laborData?.labor_code || '');
  //       setLaborInputValue('');
  //     } else {
  //       setLaborInputValue(laborData?.users?.full_name || laborData?.labor_code || '');
  //       setLeadLaborInputValue('');
  //     }

  //     setTimeLogModalMode('edit');
  //     setShowTimeLogModal(true);
  //     console.log('Edit modal should be open now with fetched data');
  //   } catch (error) {
  //     console.error('Error editing labor time log:', error);
  //     toast.error('Failed to load labor entry details');
  //   }
  // };

  const handleCreateTimeLog = () => {
    setCurrentTimeLog(null);
    resetTimeLogForm();
    setTimeLogModalMode("create");
    setShowTimeLogModal(true);
  };

  const isValidForm = () => {
    if (!materialFormData.product_id) {
      toast.error("Please select a product");
      return false;
    }

    if (!materialFormData.material_name.trim()) {
      toast.error("Material name is required");
      return false;
    }

    if (!materialFormData.quantity || materialFormData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return false;
    }

    if (!materialFormData.unit_cost || materialFormData.unit_cost <= 0) {
      toast.error("Unit cost must be greater than 0");
      return false;
    }

    if (!materialFormData.unit) {
      toast.error("Unit is required");
      return false;
    }

    return true;
  };

  const searchProducts = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setProductSearchResults([]);
      return;
    }

    setIsSearchingProducts(true);
    try {
      // Replace with your actual API call
      const response = await apiClient.searchProductsByQuery(query);
      setProductSearchResults(response.data.products || []);
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products");
    } finally {
      setIsSearchingProducts(false);
    }
  };
  // Handle product selection
  const handleProductSelect = (product: Product): void => {
    // Check if product already selected
    const exists = selectedProducts.some((p) => p.id === product.id);

    if (!exists) {
      setSelectedProducts([...selectedProducts, product]);
      // Initialize quantities for this product
      setProductQuantities({
        ...productQuantities,
        [product.id]: {
          total_ordered: 0,
          material_used: 0,
          return_to_warehouse: false,
          unit_cost: product.unit_cost || product.price || 0,
        },
      });
    }

    // Clear search and close dropdown
    setProductSearchQuery("");
    setProductSearchResults([]);
    setShowProductDropdown(false);
  };

  const handleAddMultipleProducts = async (): Promise<void> => {
    if (!validateMultipleProducts()) {
      return;
    }

    setIsLoading(true);
    try {
      // Find existing bluesheet by date
      const existingBluesheet = job.bluesheets?.find(
        (bluesheet: any) => bluesheet.date === materialFormData.date,
      );

      // Prepare bulk material entries
      const materialEntries: MaterialEntry[] = selectedProducts.map(
        (product) => ({
          product_id: product.id,
          material_name: product.product_name || product.name || "",
          quantity: product.stock_quantity || 0,
          unit: product.unit || "pieces",
          total_ordered:
            Number(productQuantities[product.id]?.total_ordered) || 0,
          material_used:
            Number(productQuantities[product.id]?.material_used) || 0,
          supplier_order_id: product.supplier_order_id || "",
          return_to_warehouse:
            productQuantities[product.id]?.return_to_warehouse || false,
          unit_cost: Number(product.unit_cost || product.price || 0),
        }),
      );

      if (existingBluesheet) {
        // Add multiple materials to existing bluesheet
        const bulkPayload: BulkMaterialPayload = {
          materials: materialEntries,
        };
        const completeBluesheetPayload: CompleteBluesheetPayload = {
          job_id: job.id,
          date: materialFormData.date,
          notes: `Daily work bluesheet for ${job.title || "construction site"}`,
          additional_charges: 0,
          status: "approved",
          labor_entries: [],
          material_entries: materialEntries,
        };
        // await apiClient.createBulkBluesheetMaterials(bulkPayload, existingBluesheet.id);
        await apiClient.createCompleteBluesheet(completeBluesheetPayload);

        toast.success(
          `${selectedProducts.length} product(s) added to existing bluesheet successfully!`,
        );
      } else {
        // Create new complete bluesheet with multiple materials
        const completeBluesheetPayload: CompleteBluesheetPayload = {
          job_id: job.id,
          date: materialFormData.date,
          notes: `Daily work bluesheet for ${job.title || "construction site"}`,
          additional_charges: 0,
          status: "approved",
          labor_entries: [],
          material_entries: materialEntries,
        };

        await apiClient.createCompleteBluesheet(completeBluesheetPayload);
        toast.success(
          `New bluesheet created with ${selectedProducts.length} product(s) successfully!`,
        );
      }

      // Close modal and reset
      setShowAddMaterialModal(false);
      resetForm();

      // Refresh job data
      await refreshJobData();
    } catch (error) {
      console.error("Error adding materials:", error);
      toast.error("Failed to add materials");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form with proper types
  const resetForm = (): void => {
    setSelectedProducts([]);
    setProductQuantities({});
    setMaterialFormData({
      product_id: null,
      material_name: "",
      quantity: 0,
      unit: "pieces",
      total_ordered: 0,
      material_used: 0,
      supplier_order_id: "",
      return_to_warehouse: false,
      unit_cost: 0,
      date: new Date().toISOString().split("T")[0],
    });
    setProductSearchQuery("");
    setMaterialErrors({});
  };

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

  const removeSelectedProduct = (productId: number): void => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
    const newQuantities = { ...productQuantities };
    delete newQuantities[productId];
    setProductQuantities(newQuantities);
  };

  const handleQuantityChange = (
    productId: number,
    field: keyof ProductQuantity,
    value: string | number | boolean,
  ): void => {
    const existing = productQuantities[productId] || {};

    let updatedValue =
      field === "return_to_warehouse" ? value : Number(value) || 0;

    let updatedData = {
      ...existing,
      [field]: updatedValue,
    };

    const totalOrdered =
      field === "total_ordered"
        ? Number(value)
        : Number(updatedData.total_ordered || 0);

    const materialUsed =
      field === "material_used"
        ? Number(value)
        : Number(updatedData.material_used || 0);

    // ❌ material used total ordered se jyada nahi hona chahiye
    if (materialUsed > totalOrdered) {
      updatedData.material_used = totalOrdered;
    }

    setProductQuantities({
      ...productQuantities,
      [productId]: updatedData,
    });
  };

  const validateMultipleProducts = (): boolean => {
    const errors: MaterialErrors = {};

    if (!materialFormData.date) {
      errors.date = "Date is required";
      setMaterialErrors(errors);
      toast.error("Please select a date");
      return false;
    }

    // Check if any products are selected
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return false;
    }

    // Validate each product has required fields
    for (const product of selectedProducts) {
      const quantities = productQuantities[product.id];
      if (
        !quantities ||
        (!quantities.total_ordered && !quantities.material_used)
      ) {
        toast.error(
          `Please enter quantities for ${product.product_name || product.name}`,
        );
        return false;
      }
    }

    setMaterialErrors({});
    return true;
  };

  const validateMaterialForm = () => {
    const errors: any = {
      product: "",
      date: "",
      total_ordered: "",
      material_used: "",
    };
    if (!materialFormData.product_id) {
      errors.product = "Please select a product";
    }
    if (!materialFormData.date) {
      errors.date = "Please select a date";
    }
    if (
      !materialFormData.total_ordered ||
      materialFormData.total_ordered <= 0
    ) {
      errors.total_ordered = "Enter total ordered greater than 0";
    }
    if (
      materialFormData.material_used == null ||
      materialFormData.material_used < 0
    ) {
      errors.material_used = "Material used cannot be negative";
    } else if (
      materialFormData.total_ordered &&
      materialFormData.material_used > materialFormData.total_ordered
    ) {
      errors.material_used = "Material used cannot exceed total ordered";
    }
    setMaterialErrors(errors);
    return (
      !errors.product &&
      !errors.date &&
      !errors.total_ordered &&
      !errors.material_used
    );
  };

  const handleAddProduct = async () => {
    if (!validateMaterialForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsLoading(true);
    try {
      // Find existing bluesheet by date
      const existingBluesheet = job.bluesheets?.find(
        (bluesheet: any) => bluesheet.date === materialFormData.date,
      );

      if (existingBluesheet) {
        // Add material to existing bluesheet
        const materialPayload = {
          product_id: materialFormData.product_id,
          material_name: materialFormData.material_name,
          quantity:
            selectedProduct?.stock_quantity || materialFormData.quantity, // Use stock_quantity from selected product
          unit: materialFormData.unit,
          total_ordered: materialFormData.total_ordered,
          material_used: materialFormData.material_used,
          supplier_order_id: materialFormData.supplier_order_id,
          return_to_warehouse: materialFormData.return_to_warehouse,
          unit_cost: materialFormData.unit_cost,
          status: "approved",
        };

        await apiClient.createBluesheetMaterial(
          materialPayload,
          existingBluesheet.id,
        );
        toast.success("Material added to existing bluesheet successfully!");
      } else {
        // Create new complete bluesheet with material
        const completeBluesheetPayload = {
          job_id: job.id,
          date: materialFormData.date,
          notes: `Daily work bluesheet for ${job.title || "construction site"}`,
          additional_charges: 0,
          status: "approved",
          labor_entries: [], // Empty labor entries for now
          material_entries: [
            {
              product_id: materialFormData.product_id,
              material_name: materialFormData.material_name,
              quantity:
                selectedProduct?.stock_quantity || materialFormData.quantity, // Use stock_quantity from selected product
              unit: materialFormData.unit,
              total_ordered: materialFormData.total_ordered,
              material_used: materialFormData.material_used,
              supplier_order_id: materialFormData.supplier_order_id,
              return_to_warehouse: materialFormData.return_to_warehouse,
              unit_cost: materialFormData.unit_cost,
            },
          ],
        };

        await apiClient.createCompleteBluesheet(completeBluesheetPayload);
        toast.success("New bluesheet created with material successfully!");
      }

      // Close modal first
      setShowAddMaterialModal(false);

      // Reset form
      setMaterialFormData({
        product_id: null,
        material_name: "",
        quantity: 0,
        unit: "pieces",
        total_ordered: 0,
        material_used: 0,
        supplier_order_id: "",
        return_to_warehouse: false,
        unit_cost: 0,
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedProduct(null);
      setProductSearchQuery("");

      // Refresh job data to show updated materials
      await refreshJobData();
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Failed to add material");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoice: any) => {
    if (!invoice?.id) {
      toast.error("Invoice ID not found");
      return;
    }

    const invoiceStatus = String(invoice.status || "").toLowerCase();
    if (invoiceStatus === "paid") {
      return;
    }

    try {
      setIsPaidLoading(true);
      setIsMarkingPaidId(invoice.id);

      const estimateResponse = await apiClient.getEstimateById(invoice.id);
      const estimateData = estimateResponse?.data || estimateResponse;

      const customProducts = sanitizeCustomProductsForPayload(
  Array.isArray(estimateData?.products) ? estimateData.products : [],
  Number(estimateData.job_id)
);

      const payload = {
        job_id: Number(estimateData.job_id),
        estimate_title: estimateData.estimate_title || "",
        ...(estimateData.contractor_id
          ? { contractor_id: Number(estimateData.contractor_id) }
          : { customer_id: Number(estimateData.customer_id) }),
        priority: estimateData.priority || "medium",
        service_type: estimateData.service_type || "service_based",
        email_address: estimateData.email_address || "",
        estimate_date: estimateData.estimate_date || "",
        po_number: estimateData.po_number || "",
        rep: estimateData.rep || "",
        due_date: estimateData.due_date || "",
        payment_credits: Number(estimateData.payment_credits || 0),
        balance_due: estimateData.balance_due || "",
        ...(estimateData.bill_to_address && {
          bill_to_address: estimateData.bill_to_address,
        }),
        invoice_type: estimateData.invoice_type || "estimate",
        notes: (estimateData.notes ?? estimateData.description) || "",
        custom_products: customProducts,

        status: "paid",
      };

      await apiClient.updateEstimate(Number(invoice.id), payload as any);

      setEstimates((prev) =>
        prev.map((item: any) =>
          Number(item.id) === Number(invoice.id)
            ? { ...item, status: "paid" }
            : item,
        ),
      );
      setIsPaidLoading(false);
      toast.success("Invoice marked as paid");
      await fetchEstimates();
      onJobsRefresh?.();
    } catch (error: any) {
      setIsPaidLoading(false);
      console.error("Error marking invoice as paid:", error);

      const apiMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to mark invoice as paid";

      toast.error(apiMessage);
    } finally {
      setIsMarkingPaidId(null);
    }
  };

  const openMarkAsPaidDialog = (invoice: any) => {
    if (!invoice?.id) return;
    if (String(invoice.status || "").toLowerCase() === "paid") return;
    setInvoiceToMarkPaid(invoice);
    setShowMarkPaidDialog(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!invoiceToMarkPaid) return;
    await handleMarkAsPaid(invoiceToMarkPaid);
    setShowMarkPaidDialog(false);
    setInvoiceToMarkPaid(null);
  };
  // const handleDeleteProduct = async (productId: string | number) => {
  //   try {
  //     const confirmDelete = window.confirm("Are you sure you want to delete this product?");
  //     if (!confirmDelete) return;

  //     setIsDeleting(true);

  //     await apiClient.deleteProduct(productId);
  //     dispatch(deleteProduct(String(productId)));

  //     toast.success("Product deleted successfully!");
  //   } catch (error) {
  //     console.error("Error deleting product:", error);
  //     toast.error("Failed to delete product");
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  console.log(inlineInvoiceData, "inlineInvoiceData");

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product);
    setShowDeleteProductDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      // Call bluesheet material delete API
      await apiClient.deleteBluesheetMaterial(productToDelete.id);

      // Close dialog first
      setShowDeleteProductDialog(false);
      setProductToDelete(null);

      // Refresh job data to show updated materials
      await refreshJobData();

      toast.success("Material deleted successfully!");
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchEstimates = useCallback(async () => {
    setIsLoadingEstimates(true);
    try {
      const response = await apiClient.getEstimatesByJob(
        jobId,
        currentPage,
        itemsPerPage,
      );
      const responseData = response?.data ?? response;
      const nextEstimates = Array.isArray(responseData?.estimates)
        ? responseData.estimates
        : [];
      setEstimates([...nextEstimates]);
      setTotalEstimates(Number(responseData?.total ?? nextEstimates.length));
      setInvoioiceNumber(nextEstimates[0]?.invoice_number || "");
    } catch (error) {
      console.error("Failed to fetch estimates:", error);
    } finally {
      setIsLoadingEstimates(false);
    }
  }, [jobId, currentPage, itemsPerPage]);

  useEffect(() => {
    void fetchEstimates();
  }, [fetchEstimates, refreshInvoices]);

  useEffect(() => {
    if (showAddMaterialModal) {
      setMaterialFormData({
        product_id: null,
        material_name: "",
        quantity: 0,
        unit: "pieces",
        total_ordered: 0,
        material_used: 0,
        supplier_order_id: "",
        return_to_warehouse: false,
        unit_cost: 0,
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedProduct(null);
      setProductSearchQuery("");
    }
  }, [showAddMaterialModal]);

  const handlePrint = async (currentInvoice: any) => {
    console.log("1");
    if (!printRef.current) return;
    console.log("2");

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        ignoreElements: (element) => {
          return element.classList.contains("no-export");
        },
      });

      const imageData = canvas.toDataURL("image/png");

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${currentInvoice?.invoice_number || ""}</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              text-align: center;
            }
            img {
              max-width: 100%;
              width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${imageData}" />
        </body>
      </html>
    `);

      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } catch (err) {
      console.error("Print error:", err);
    }
  };

  const handleSaveInvoice = async (newInvoice: Partial<Invoice>) => {
    setIsLoading(true);
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
          is_custom: true,
          unit_cost: i.unitPrice,
        })) || [];

      const itemsTotal =
        newInvoice.items?.reduce(
          (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
          0,
        ) || 0;

      const laborTotal =
        newInvoice.labor?.reduce(
          (sum, labor) => sum + (labor.hours ?? 0) * (labor.hourlyRate ?? 0),
          0,
        ) || 0;

      const additionalTotal =
        newInvoice.additionalCosts?.reduce(
          (sum, cost) => sum + (cost.amount ?? 0),
          0,
        ) || 0;

      const subtotal = itemsTotal + laborTotal + additionalTotal;
      const taxAmount = subtotal * (newInvoice.taxRate ?? 0);
      const totalAmount = subtotal + taxAmount;

      const isPriority = (value: any): value is "high" | "medium" | "low" =>
        ["high", "medium", "low"].includes(value);

      const payload: CreateEstimatePayload = {
        estimate_title: "New Estimate",
        customer_id: Number(newInvoice.customerId),
        priority: isPriority(newInvoice.priority)
          ? newInvoice.priority
          : "medium",
        valid_until: newInvoice.dueDate || "",
        location: newInvoice.location || "N/A",
        notes: newInvoice.notes || "",
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

        additional_cost: newInvoice.additionalCosts?.length
          ? {
              description: newInvoice.additionalCosts[0].description || "",
              amount: newInvoice.additionalCosts.reduce(
                (sum, c) => sum + c.amount,
                0,
              ),
            }
          : { description: "", amount: 0 },

        custom_labor: laborPayload,
        custom_products: productsPayload,
      };

      const createdInvoice = await apiClient.createEstimate(payload);

      dispatch(addInvoice(createdInvoice));
      toast.success("Invoice created successfully!");
      fetchEstimates();
      setShowNewInvoiceDialog(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerRefresh = () => {
    setRefreshInvoices((prev) => !prev);
  };

  // const handleDeleteEstimate = async (estimateId: any) => {
  //   try {
  //     const confirmDelete = window.confirm("Are you sure you want to delete this estimate?");
  //     if (!confirmDelete) return;
  //     setIsDeleting(true);
  //     await apiClient.deleteEstimate(estimateId);
  //     console.log(estimateId, "IDD")
  //     dispatch(deleteInvoice(String(estimateId)));
  //     toast.success("Estimate deleted successfully!");
  //     setRefreshInvoices(prev => !prev);
  //   } catch (error) {
  //     console.error("Error deleting estimate:", error);
  //     toast.error("Failed to delete estimate");
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  const handleDeleteEstimate = (estimate: any) => {
    setEstimateToDelete(estimate);
    setShowDeleteEstimateDialog(true);
  };
  const confirmDeleteEstimate = async () => {
    if (!estimateToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteEstimate(estimateToDelete.id);
      dispatch(deleteInvoice(String(estimateToDelete.id)));
      toast.success("Estimate deleted successfully!");
      setRefreshInvoices((prev) => !prev);
    } catch (error) {
      console.error("Error deleting estimate:", error);
      toast.error("Failed to delete estimate");
    } finally {
      setIsDeleting(false);
      setShowDeleteEstimateDialog(false);
      setEstimateToDelete(null);
    }
  };

  const handleUpdateTimeLog = async () => {
    if (!validateTimeLogForm() || !currentTimeLog) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      const selectedLabor =
        timeLogFormData.selectedLabor || timeLogFormData.selectedLeadLabor;
      const isLeadLabor = !!timeLogFormData.selectedLeadLabor;

      const updatePayload = {
        job_id: jobId,
        labor_id: selectedLabor?.id?.toString() || "",
        full_name:
          selectedLabor?.users?.full_name || selectedLabor?.labor_code || "",
        email: selectedLabor?.users?.email || "",
        role: isLeadLabor ? "lead_labor" : "labor",
        hours_worked: parseFloat(timeLogFormData.hoursWorked) || 0,
        hourly_rate: selectedLabor?.hourly_rate || 0,
        notes: timeLogFormData.description,
        date_of_joining: timeLogFormData.date,
        is_custom: selectedLabor?.is_custom || false,
      };

      await apiClient.updateLaborTimeLog(currentTimeLog.id, updatePayload);
      toast.success("Labour time log updated successfully!");
      setShowTimeLogModal(false);
      setCurrentTimeLog(null);
      resetTimeLogForm();
    } catch (error) {
      console.error("Error updating labor time log:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update labor time log",
      );
    }
  };

  const handleDeleteTimeLog = async (timeLogId: string) => {
    try {
      await apiClient.deleteLaborTimeLog(timeLogId);
      toast.success("Labour time log deleted successfully!");

      // Refresh job data to remove the deleted labor time log
      await refreshJobData();
    } catch (error) {
      console.error("Error deleting labor time log:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete labor time log",
      );
    }
  };

  const resetTimeLogForm = () => {
    setTimeRangeValue(null);
    setTimeLogFormData({
      selectedLabor: null,
      selectedLeadLabor: null,
      hoursWorked: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setLaborInputValue("");
    setLeadLaborInputValue("");
    setLaborSearchResults([]);
    setLeadLaborSearchResults([]);
    setShowLaborDropdown(false);
    setShowLeadLaborDropdown(false);
    setTimeLogValidationErrors({});
  };

  console.log(job,"job.customer");
  

  const refreshJobData = async () => {
    try {
      // Set flag to prevent useEffect from running
      isRefreshingMaterialsRef.current = true;

      const updatedJobData = await apiClient.getJobById(jobId);
      const updatedJobs = jobs.map((j: any) =>
        String(j?.id) === String(jobId) ? updatedJobData : j,
      );
      setJobs(updatedJobs);

      // Update the current job from the updated jobs array
      const currentJob = updatedJobs.find(
        (j: any) => String(j?.id) === String(jobId),
      );
      if (currentJob) {
        // Update bluesheets state immediately with fresh data
        if (currentJob.bluesheets) {
          setBluesheets(currentJob.bluesheets);
        }

        // Fetch materials immediately with the fresh job data
        const bluesheetMaterials: any[] = [];
        if (currentJob.bluesheets && currentJob.bluesheets.length > 0) {
          currentJob.bluesheets.forEach((bluesheet: any) => {
            if (
              bluesheet.material_entries &&
              bluesheet.material_entries.length > 0
            ) {
              bluesheet.material_entries.forEach((entry: any) => {
                bluesheetMaterials.push({
                  id: entry.id,
                  material_name: entry.material_name,
                  product_name:
                    entry.product?.product_name || entry.product?.name,
                  quantity: entry.quantity,
                  unit: entry.unit,
                  unit_cost: entry.unit_cost,
                  unitCost: entry.unit_cost,
                  price: entry.unit_cost,
                  supplier:
                    entry.product?.supplier?.company_name ||
                    entry.product?.supplier,
                  supplier_sku: entry.product?.supplier_sku,
                  jdp_sku: entry.product?.jdp_sku,
                  sku: entry.product?.sku,
                  stock_quantity: entry.quantity,
                  bluesheet_id: bluesheet.id,
                  bluesheet_date: bluesheet.date,
                  bluesheet_notes: bluesheet.notes,
                  product: entry.product,
                  jdp_price: entry.product?.jdp_price,
                  is_bluesheet_material: true,
                });
              });
            }
          });
        }
        // Update materials state directly with fresh data
        setMaterials(bluesheetMaterials);
      }

      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isRefreshingMaterialsRef.current = false;
      }, 100);
    } catch (error) {
      console.error("Error refreshing job data:", error);
      toast.error("Failed to refresh job data");
      isRefreshingMaterialsRef.current = false;
    }
  };

  const fetchMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      // Extract material_entries from bluesheets only
      const bluesheetMaterials: any[] = [];
      if (job.bluesheets && job.bluesheets.length > 0) {
        job.bluesheets.forEach((bluesheet: any) => {
          if (
            bluesheet.material_entries &&
            bluesheet.material_entries.length > 0
          ) {
            bluesheet.material_entries.forEach((entry: any) => {
              bluesheetMaterials.push({
                id: entry.id,
                material_name: entry.material_name,
                product_name:
                  entry.product?.product_name || entry.product?.name,
                quantity: entry.quantity,
                unit: entry.unit,
                unit_cost: entry.unit_cost,
                unitCost: entry.unit_cost,
                price: entry.unit_cost,
                supplier:
                  entry.product?.supplier?.company_name ||
                  entry.product?.supplier,
                supplier_sku: entry.product?.supplier_sku,
                jdp_sku: entry.product?.jdp_sku,
                sku: entry.product?.sku,
                stock_quantity: entry.quantity,
                bluesheet_id: bluesheet.id,
                bluesheet_date: bluesheet.date,
                bluesheet_notes: bluesheet.notes,
                product: entry.product, // Include full product object
                jdp_price: entry.product?.jdp_price, // Add jdp_price at root level
                is_bluesheet_material: true,
              });
            });
          }
        });
      }

      // Set only bluesheet materials
      setMaterials(bluesheetMaterials);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  useEffect(() => {
    // Skip fetch if we're in the middle of refreshing materials (to prevent blinking)
    if (isRefreshingMaterialsRef.current) {
      return;
    }

    // Only fetch materials if job.bluesheets has actually changed
    if (job.bluesheets) {
      fetchMaterials();
    }
  }, [job.id, job.bluesheets]);

  const triggerRefreshMaterials = () => {
    setRefreshMaterials((prev) => !prev);
  };

  useEffect(() => {
    if (!job || !jobId) return;

    // Save/complete ke turant baad local edited state ko stale job se overwrite mat karo
    if (skipNextEditedJobSyncRef.current) {
      skipNextEditedJobSyncRef.current = false;
      return;
    }

    setEditedJob((prev) => ({
      ...prev,
      title: getJobTitle(job),
      type: job.type,
      location: job.location || `${job.address || ""}, ${job.cityZip || ""}`,
      address: job.address || "",
      cityZip: job.cityZip || "",
      description: getJobDescription(job),
      contractor: job.contractor || job.customer,
      startDate:
        (job.created_at && formatDate(job.created_at)) ||
        (job.createdDate && formatDate(job.createdDate)) ||
        "",
      priority: job.priority || "High",
      status: normalizeStatus(job.status),
      assignedLabor: job.assignedLaborDetails || [],
      assignedLeadLabor: job.assignedLeadLaborDetails || [],
    }));
  }, [
    jobId,
    job?.id,
    job?.title,
    job?.job_title,
    job?.description,
    job?.job_description,
    job?.type,
    job?.location,
    job?.address,
    job?.cityZip,
    job?.contractor,
    job?.customer,
    job?.created_at,
    job?.createdDate,
    job?.priority,
    job?.status,
    job?.assignedLaborDetails,
    job?.assignedLeadLaborDetails,
  ]);

  // Update bluesheets when job data changes
  useEffect(() => {
    if (job.bluesheets) {
      setBluesheets(job.bluesheets);
      console.log("Updated bluesheets:", job.bluesheets);
    }
  }, [job.bluesheets]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await apiClient.getAllSuppliers();
        // response structure: { success, message, data: { data: [ ...suppliers ] } }

        setSuppliers(response.data.data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  // useEffect(() => {
  //   if (job.assignedMaterialsDetails) {
  //     setMaterials(job.assignedMaterialsDetails);
  //   }
  // }, [job.assignedMaterialsDetails]);

  useEffect(() => {
    const fetchProjectSummary = async () => {
      try {
        const res = await apiClient.getProjectSummary(jobId);
        setProjectSummary(res.data.projectSummary);
      } catch (error) {
        console.error("Failed to fetch project summary", error);
      }
    };

    if (jobId) fetchProjectSummary();
  }, [jobId]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoadingDashboard(true);
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    if (jobId) fetchDashboard();
  }, [jobId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const rolesData = await apiClient.getRoles();
        setRoles(rolesData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load initial data");
      }
    };

    fetchInitialData();
  }, [jobId]);

  const [invoiceFormData, setInvoiceFormData] = useState({
    type: "Estimate",
    dueDate: "",
    description: "",
    amount: 0,
  });

  const [materialFormData, setMaterialFormData] = useState({
    product_id: null as number | null,
    material_name: "",
    quantity: 0,
    unit: "pieces",
    total_ordered: 0,
    material_used: 0,
    supplier_order_id: "",
    return_to_warehouse: false,
    unit_cost: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Product search states
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productQuantities, setProductQuantities] = useState<
    Record<number, ProductQuantity>
  >({});
  const [productSearchResults, setProductSearchResults] = useState<Product[]>(
    [],
  );
  const [showProductDropdown, setShowProductDropdown] =
    useState<boolean>(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");
  const [materialErrors, setMaterialErrors] = useState<MaterialErrors>({});

  const [timeLogFormData, setTimeLogFormData] = useState({
    selectedLabor: null as any,
    selectedLeadLabor: null as any,
    hoursWorked: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // State for time range picker value
  const [timeRangeValue, setTimeRangeValue] = useState<[Date, Date] | null>(
    null,
  );
  // Flag to prevent useEffect from overwriting user-selected time range
  const timeRangeValueRef = useRef(false);

  // Sync timeRangeValue when hoursWorked changes (for edit mode only, not when user selects time)
  useEffect(() => {
    // Only sync if timeRangeValueRef is false (meaning change came from edit mode, not from user selection)
    if (
      !timeRangeValueRef.current &&
      timeLogFormData.hoursWorked &&
      timeLogFormData.hoursWorked.includes(":")
    ) {
      try {
        const parts = timeLogFormData.hoursWorked.split(":");
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const s = parseInt(parts[2]) || 0;

        // Default start at 9 AM, end at start + hours worked
        const startTime = new Date();
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(
          startTime.getHours() + h,
          startTime.getMinutes() + m,
          startTime.getSeconds() + s,
          0,
        );

        // Convert to time strings for TimeRangePicker (format: "HH:MM")
        const startTimeStr = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;
        const endTimeStr = `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`;

        // TimeRangePicker accepts time strings or Date objects
        // Try using time strings first
        setTimeRangeValue([startTimeStr, endTimeStr] as any);

        console.log("Syncing timeRangeValue from hoursWorked:", {
          hoursWorked: timeLogFormData.hoursWorked,
          startTimeStr,
          endTimeStr,
          startTime: startTime.toString(),
          endTime: endTime.toString(),
        });
      } catch (e) {
        console.error("Error syncing timeRangeValue:", e);
        setTimeRangeValue(null);
      }
    } else if (!timeLogFormData.hoursWorked && !timeRangeValueRef.current) {
      setTimeRangeValue(null);
    }
    // Reset the flag after processing
    timeRangeValueRef.current = false;
  }, [timeLogFormData.hoursWorked]);

  // Search functionality for labor and lead labor
  const [laborSearchResults, setLaborSearchResults] = useState<any[]>([]);
  const [leadLaborSearchResults, setLeadLaborSearchResults] = useState<any[]>(
    [],
  );
  const [showLaborDropdown, setShowLaborDropdown] = useState(false);
  const [showLeadLaborDropdown, setShowLeadLaborDropdown] = useState(false);
  const [isLoadingLabor, setIsLoadingLabor] = useState(false);
  const [isLoadingLeadLabor, setIsLoadingLeadLabor] = useState(false);
  const [laborInputValue, setLaborInputValue] = useState("");
  const [leadLaborInputValue, setLeadLaborInputValue] = useState("");

  // Search functions
  const searchLabor = async (query: string) => {
    if (query.length < 1) return; // Don't search for empty queries

    setIsLoadingLabor(true);
    try {
      const response = await apiClient.searchLaborByQuery(query, 1, 20);
      setLaborSearchResults(response.data?.labor || []);
    } catch (error) {
      console.error("Error searching labor:", error);
      setLaborSearchResults([]);
    } finally {
      setIsLoadingLabor(false);
    }
  };

  const searchLeadLabor = async (query: string) => {
    if (query.length < 1) return; // Don't search for empty queries

    setIsLoadingLeadLabor(true);
    try {
      const response = await apiClient.searchLeadLaborByQuery(query, 1, 20);
      setLeadLaborSearchResults(response.data?.leadLabor || []);
    } catch (error) {
      console.error("Error searching lead labor:", error);
      setLeadLaborSearchResults([]);
    } finally {
      setIsLoadingLeadLabor(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".labor-dropdown") &&
        !target.closest(".lead-labor-dropdown")
      ) {
        setShowLaborDropdown(false);
        setShowLeadLaborDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Labour Time Log states
  const [laborTimeLogs, setLaborTimeLogs] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingTimeLogs, setIsLoadingTimeLogs] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [timeLogModalMode, setTimeLogModalMode] = useState<
    "create" | "edit" | "view"
  >("create");
  const [currentTimeLog, setCurrentTimeLog] = useState<any>(null);
  const [timeLogValidationErrors, setTimeLogValidationErrors] = useState<
    Record<string, string>
  >({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatCurrencyWholeUSD = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  type StatusType = "in-progress" | "sent" | "paid" | "approved" | "pending";

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<StatusType, { color: string; text: string }> = {
      "in-progress": {
        color: "bg-blue-100 text-blue-800",
        text: "In Progress",
      },
      sent: { color: "bg-gray-100 text-gray-800", text: "Sent" },
      paid: { color: "bg-green-100 text-green-800", text: "Paid" },
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
    };

    // Type assertion for known status values
    const normalizedStatus = status.toLowerCase() as StatusType;
    const config = statusConfig[normalizedStatus] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        High Priority
      </span>
    );
  };

  // Invoice Helper Functions
  // const calculateInvoiceSubtotal = (): number => {
  //   return inlineInvoiceData.lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
  // }
  const calculateInvoiceSubtotal = (): number => {
    return inlineInvoiceData.lineItems.reduce((sum, item) => {
      if (item.type === "header") return sum;
      return sum + (item.total || 0);
    }, 0);
  };

  const addCustomInvoiceType = (customType: string) => {
    if (customType) {
      // Check for case-insensitive duplicates
      const isDuplicate = customInvoiceTypes.some(
        (existing) => existing.toLowerCase() === customType.toLowerCase(),
      );
      if (!isDuplicate) {
        setCustomInvoiceTypes((prev) => [...prev, customType]);
      }
    }
  };
  console.log(inlineInvoiceData, "::inlineInvoiceData");

  // Fetch customer data
  const fetchCustomerData = async (customerRef: any) => {
    try {
      const customerId =
        typeof customerRef === "object" && customerRef !== null
          ? customerRef.id
          : customerRef;
      if (!customerId) {
        setCustomerData(null);
        return;
      }
      const response = await apiClient.getCustomers(1, 100); // Get all customers
      const customers =
        response.data?.customers || response.data?.data || response.data || [];
      const customer = customers.find(
        (c: any) => String(c.id) === String(customerId),
      );
      if (customer) {
        setCustomerData(customer);
        // Update customer address in inline invoice data
        const newAddress = customer.address || customer.customer_address || "";

        // Force update with setTimeout to ensure state update
        setTimeout(() => {
          setInlineInvoiceData((prev) => {
            const updated = {
              ...prev,
              customerAddress: newAddress,
            };
            return updated;
          });
        }, 100);
      } else {
        setCustomerData(null);
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setCustomerData(null);
    }
  };

  const fetchContractorData = async (contractorId: string) => {
    try {
      const response = await apiClient.getContractors(1, 100); // Get all contractors
      const contractors =
        response.data?.contractors ||
        response.data?.data ||
        response.data ||
        [];
      const contractor = contractors.find(
        (c: any) => c.id === Number(contractorId),
      );
      if (contractor) {
        setContractorData(contractor);
        console.log(contractor, "contractor");
        // Update contractor address in inline invoice data
        const newAddress =
          contractor.address || contractor.contractor_address || "";
        console.log(newAddress, "newAddress");
        // Force update with setTimeout to ensure state update
        setTimeout(() => {
          setInlineInvoiceData((prev) => {
            const updated = {
              ...prev,
              customerAddress: newAddress,
            };
            return updated;
          });
        }, 100);
      } else {
        setContractorData(null);
      }
    } catch (error) {
      console.error("Error fetching contractor data:", error);
      setContractorData(null);
    }
  };

  console.log(inlineInvoiceData, "::inlineInvoiceData");

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

  // const addCustomProduct = (itemId: string, productName: string) => {
  //   // Check if custom product already exists in line items (by name for custom products)
  //   const isDuplicate = inlineInvoiceData.lineItems.some(item =>
  //     item.id !== itemId && item.productId === product.id
  //   )

  //   if (isDuplicate) {
  //     toast.error('This custom product is already added to the invoice')
  //     return
  //   }

  //   setInlineInvoiceData(prev => ({
  //     ...prev,
  //     lineItems: prev.lineItems.map(item => {
  //       if (item.id === itemId) {
  //         return {
  //           ...item,
  //           item: productName,
  //           // Manual/custom product => mark custom and remove any selected product reference
  //           productId: null,
  //           isCustomProduct: true,
  //           showSearchResults: false,
  //           searchQuery: ''
  //         }
  //       }
  //       return item
  //     })
  //   }))
  // }

  // const getAvailableEstimates = () => {
  //   return estimates.filter((est: any) => est.invoice_type === 'Estimate')
  // }

  // const handleEstimateSelection = (estimateId: string) => {
  //   setSelectedEstimateId(estimateId)
  //   const estimate: any = estimates.find((e: any) => e.id === estimateId)
  //   if (estimate) {
  //     setInlineInvoiceData(prev => ({
  //       ...prev,
  //       estimateTotal: estimate.total_amount || 0,
  //       paymentHistory: estimate.paymentHistory || []
  //     }))
  //   }
  // }

  const selectProduct = (itemId: string, product: any) => {
  const currentItem = inlineInvoiceData.lineItems.find(
    (item: any) => item.id === itemId,
  );

  if (!currentItem) return;

  const currentHeaderKey = currentItem.parentHeaderKey || null;
  const selectedSku = String(product.jdpSKU || "").trim().toLowerCase();

  // duplicate check only inside same header group and by jdpSKU
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
        const qty = Number(item.qty || 1);

        return {
          ...item,
          productId: product.id,
          estimate_product_id: product.id,
          item: product.name || "",
          description: product.description || "",
          rate,
          estimatedPrice,
          total: qty * estimatedPrice,
          showSearchResults: false,
          searchQuery: "",
          supplierId: product.supplierId || selectedSupplierId || 1,
          isCustomProduct: false,
        };
      }
      return item;
    }),
  }));
};
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDueDateMMDDYYYY = (dateString: string) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const subJobTypeLabel = (sj: any) => {
    const t = (sj.job_type ?? sj.type ?? "") as string;
    if (t === "contract_based" || t === "contract-based")
      return "Contract Based";
    if (t === "service_based" || t === "service-based")
      return "Service Based";
    if (typeof t === "string" && t.trim())
      return t
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    return "—";
  };

  const subJobAddress = (sj: any) => {
    const parts = [sj.address, sj.city_zip].filter(Boolean);
    if (parts.length) return parts.join(", ");
    return ((sj.location ?? "") as string) || "";
  };

  const getInvoiceTypeColor = (type: string) => {
    const colors: any = {
      Estimate: "border-blue-200 bg-blue-50 text-blue-700",
      "Downpayment Invoice": "border-green-200 bg-green-50 text-green-700",
      "Rough Invoice": "border-orange-200 bg-orange-50 text-orange-700",
      "Progressive Invoice": "border-purple-200 bg-purple-50 text-purple-700",
      "Final Invoice": "border-gray-200 bg-gray-50 text-gray-700",
    };
    return colors[type] || "border-gray-200 bg-gray-50 text-gray-700";
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      Draft: "border-gray-300 bg-gray-100 text-gray-700",
      Sent: "border-blue-300 bg-blue-100 text-blue-700",
      Paid: "border-green-300 bg-green-100 text-green-700",
    };
    return colors[status] || "border-gray-300 bg-gray-100 text-gray-700";
  };

  const getSentDeliveryTag = (invoice: {
    status?: string;
    qb_invoice_id?: string | number | null;
  }) => {
    if (String(invoice.status || "").toLowerCase() !== "sent") return null;
    const hasQuickBooksId =
      invoice.qb_invoice_id != null &&
      String(invoice.qb_invoice_id).trim() !== "";
    return hasQuickBooksId
      ? {
          label: "QuickBooks",
          className: "border-indigo-200 bg-indigo-50 text-indigo-800",
        }
      : {
          label: "Custom",
          className: "border-teal-200 bg-teal-50 text-teal-800",
        };
  };

  const handleViewInvoice = async (invoice: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getEstimateById(invoice.id);
      const invoiceData = response?.data || response;

      console.log(invoiceData.products, "::invoiceData.products");

      // Populate the inline invoice form with the fetched invoice data
      setInlineInvoiceData({
        date:
          invoiceData.estimate_date || new Date().toISOString().split("T")[0],
        estimateNumber: invoiceData.invoice_number || "",
        customerName:
          invoiceData.customer_name ||
          invoiceData.contractor?.contractor_name ||
          "",
        customerAddress:
          invoiceData.customer_address || invoiceData.contractor?.address || "",
        billToAddress: invoiceData.bill_to_address || "",
        billToAddressEnabled: !!invoiceData.bill_to_address,
        poNumber: invoiceData.po_number || "",
        project: invoiceData.estimate_title || "",
        rep: invoiceData.rep || "JDP",
        dueDate: invoiceData.due_date || "",
        paymentCredits: invoiceData.payment_credits || 0,
        balanceDue: invoiceData.balance_due || "",
        lineItems: invoiceData.products?.map((product: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          productId: product.id,
          qty: product.stock_quantity || 1,
          item: product.product_name || "",
          description: product.description || "",
          rate: product.jdp_price || 0,
          estimatedPrice: product.estimated_price || 0,
          total: product.total_cost || 0,
          searchQuery: "",
          showSearchResults: false,
          supplierId: product.supplier_id || 1,
          isCustomProduct: true,
          estimate_product_id: product.estimate_product_id || null,
          parent_header_name: product.parent_header_name,
        })) || createDefaultEmptyLineItems(5),
        notes:
          (invoiceData.notes ?? invoiceData.description) ||
          "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
        signatureText:
          invoiceData.signature_text || "ACCEPTED BY________________DATE_____",
        invoiceType: (() => {
          if (!invoiceData.invoice_type) return "Estimate";

          const typeMapping: { [key: string]: string } = {
            down_payment: "Downpayment Invoice",
            rough_invoice: "Rough Invoice",
            progressive_invoice: "Progressive Invoice",
            final_invoice: "Final Invoice",
            estimate: "Estimate",
          };

          return (
            typeMapping[invoiceData.invoice_type] ||
            invoiceData.invoice_type.charAt(0).toUpperCase() +
              invoiceData.invoice_type.slice(1)
          );
        })(),
        customInvoiceType: invoiceData.custom_invoice_type || "",
        paymentPercentage: 0,
        estimateTotal: invoiceData.total_amount || 0,
        paymentHistory: [],
      });

      // Show the preview dialog
      setShowPreviewDialog(true);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast.error("Failed to load invoice details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateInvoice = (invoice: any) => {
    console.log("Duplicating invoice:", invoice);

    // Populate the inline invoice form with the existing invoice data
    setInlineInvoiceData({
      date: invoice.date || new Date().toISOString().split("T")[0],
      estimateNumber: invoice.estimate_number || "",
      customerName:
        invoice.customer_name || invoice.contractor?.contractor_name || "",
      customerAddress:
        invoice.customer_address || invoice.contractor?.address || "",
      billToAddress: invoice.bill_to_address || "",
      billToAddressEnabled: !!invoice.bill_to_address,
      poNumber: invoice.po_number || "",
      project: invoice.estimate_title || "",
      rep: invoice.rep || "",
      dueDate: invoice.due_date || "",
      paymentCredits: invoice.payment_credits || 0,
      balanceDue: invoice.balance_due || "",
      lineItems: invoice.products?.map((product: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        productId: product.id,
        qty: product.stock_quantity || 1,
        item: product.product_name || "",
        description: product.description || "",
        rate: product.jdp_price || 0,
        estimatedPrice: product.estimated_price || 0,
        total: product.total_cost || 0,
        searchQuery: "",
        showSearchResults: false,
        supplierId: product.supplier_id || 1,
        isCustomProduct: true,
        estimate_product_id: product.estimate_product_id || null,
      })) || createDefaultEmptyLineItems(5),
      notes:
        (invoice.notes ?? invoice.description) ||
        "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
      signatureText:
        invoice.signature_text || "ACCEPTED BY________________DATE_____",
      invoiceType: (() => {
        if (!invoice.invoice_type) return "Estimate";

        // Map API values to form values
        const typeMapping: { [key: string]: string } = {
          down_payment: "Downpayment Invoice",
          rough_invoice: "Rough Invoice",
          progressive_invoice: "Progressive Invoice",
          final_invoice: "Final Invoice",
          estimate: "Estimate",
        };

        return (
          typeMapping[invoice.invoice_type] ||
          invoice.invoice_type.charAt(0).toUpperCase() +
            invoice.invoice_type.slice(1)
        );
      })(),
      customInvoiceType: invoice.custom_invoice_type || "",
      paymentPercentage: 0,
      estimateTotal: invoice.total || 0,
      paymentHistory: [],
    });

    const mappedInvoiceType = (() => {
      if (!invoice.invoice_type) return "Estimate";

      const typeMapping: { [key: string]: string } = {
        down_payment: "Downpayment Invoice",
        rough_invoice: "Rough Invoice",
        progressive_invoice: "Progressive Invoice",
        final_invoice: "Final Invoice",
        estimate: "Estimate",
      };

      return (
        typeMapping[invoice.invoice_type] ||
        invoice.invoice_type.charAt(0).toUpperCase() +
          invoice.invoice_type.slice(1)
      );
    })();

    console.log("Set invoice type to:", mappedInvoiceType);
    console.log(
      "Set customer name to:",
      invoice.customer_name ||
        invoice.contractor?.company_name ||
        invoice.contractor?.email ||
        "",
    );
    console.log(
      "Set customer address to:",
      invoice.customer_address || invoice.contractor?.address || "",
    );

    // Show the inline invoice form
    setShowInlineInvoiceForm(true);
  };
const buildGroupedInvoiceRowsForPrint = (products: any[] = []) => {
  const directItems: any[] = [];
  const groupedMap: Record<string, any[]> = {};

  products.forEach((item: any) => {
    const productName = String(item.product_name || item.item || "").trim();

    // print me blank/header placeholder product rows skip kar do
    if (!productName) return;

    const headerName =
      item.parent_header_name ||
      item.parentHeaderName ||
      null;

    const normalizedItem = {
      qty: Number(item.stock_quantity || item.qty || 1),
      item: productName,
      description: item.description || "",
      rate: Number(item.unit_cost || item.jdp_price || item.rate || 0),
      total: Number(item.total_cost || item.total || 0),
      parent_header_name: headerName,
    };

    if (!headerName) {
      directItems.push(normalizedItem);
    } else {
      if (!groupedMap[headerName]) {
        groupedMap[headerName] = [];
      }
      groupedMap[headerName].push(normalizedItem);
    }
  });

  return [
    ...directItems,
    ...Object.entries(groupedMap).flatMap(([headerName, items]) => [
      {
        type: "synthetic-header",
        headerName,
      },
      ...items,
    ]),
  ];
};

const escapeHtml = (value: any) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
//   const handlePrintInvoice = async (invoice: any) => {
//     console.log(invoice, "invoice");
//     try {
//       // Temp container (same)
//       const tempElement = document.createElement("div");
//       tempElement.id = "temp-invoice-preview";
//       tempElement.style.position = "absolute";
//       tempElement.style.left = "-10000px";
//       tempElement.style.top = "0";
//       tempElement.style.width = "8.5in";
//       tempElement.style.background = "#ffffff";
//       tempElement.style.padding = "32px";
//       tempElement.style.pointerEvents = "none";
//       tempElement.style.fontFamily = "Arial, sans-serif";
//       tempElement.style.lineHeight = "1.1";
//       tempElement.style.boxSizing = "border-box";
//       const groupedPrintRows = buildGroupedInvoiceRowsForPrint(
//         invoice.products || [],
//       );
//        console.log(groupedPrintRows,"groupedPrintRows");
       
//       // === SAME HTML ===
//       // === SAME HTML ===
//         const invoiceHtml = `
//         <div style="
//           font-family: Arial, sans-serif;
//           color:#374151;
//           background:#ffffff;
//           box-sizing:border-box;
//           width:100%;
//         ">
//           <div id="print-header" style="margin-bottom:24px;">
//             <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px; margin-bottom:24px;">
//               <div>
//                 <div style="
//                   width:200px;
//                   height:60px;
//                   background:url('/assets/logos/logo-jdp.png') no-repeat center center;
//                   background-size:contain;
//                 "></div>
//                 <div style="margin-top:8px; font-size:14px; color:#6b7280;">
//                   952-449-1088
//                 </div>
//               </div>

//               <div style="min-width:400px;">
//                 <div style="display:flex;">
//                   <div style="
//                     background:#1f2937;
//                     color:#fff;
//                     height:40px;
//                     display:flex;
//                     align-items:center;
//                     justify-content:center;
//                     border:2px solid #1f2937;
//                     width:200px;
//                     font-size:16px;
//                     font-weight:700;
//                   ">
//                     Date
//                   </div>
//                   <div style="
//                     background:#fff;
//                     color:#374151;
//                     height:40px;
//                     display:flex;
//                     align-items:center;
//                     justify-content:center;
//                     border:2px solid #e5e7eb;
//                     width:200px;
//                     font-size:16px;
//                     font-weight:700;
//                   ">
//                     ${new Date(inlineInvoiceData.date).toLocaleDateString("en-US", {
//                       month: "2-digit",
//                       day: "2-digit",
//                       year: "numeric",
//                     })}
//                   </div>
//                 </div>

//                 <div style="display:flex;">
//                   <div style="
//                     background:#1f2937;
//                     color:#fff;
//                     height:40px;
//                     display:flex;
//                     align-items:center;
//                     justify-content:center;
//                     border:2px solid #1f2937;
//                     width:200px;
//                     font-size:16px;
//                     font-weight:700;
//                     text-transform:capitalize;
//                   ">
//                     ${invoice.invoice_type || "Estimate"} #
//                   </div>
//                   <div style="
//                     background:#fff;
//                     color:#374151;
//                     height:40px;
//                     display:flex;
//                     align-items:center;
//                     justify-content:center;
//                     border:2px solid #e5e7eb;
//                     width:200px;
//                     font-size:16px;
//                     font-weight:700;
//                   ">
//                     ${InvoioiceNumber || "INV-2025-029"}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           ${
//             invoice.bill_to_address || invoice.billing_address
//               ? `
//             <div style="
//               background:#1f2937;
//               color:#fff;
//               height:36px;
//               display:flex;
//               align-items:center;
//               margin-bottom:8px;
//               padding:0 16px;
//               font-size:14px;
//               font-weight:700;
//             ">
//               Bill To
//             </div>
//             <div style="
//               background:#fff;
//               border:2px solid #e5e7eb;
//               padding:12px 14px;
//               color:#374151;
//               font-size:14px;
//               margin-bottom:16px;
//               font-weight:600;
//             ">
//               ${invoice.bill_to_address || invoice.billing_address}
//             </div>
//           `
//               : ""
//           }

//           <div style="
//             background:#1f2937;
//             color:#fff;
//             height:36px;
//             display:flex;
//             align-items:center;
//             margin-bottom:8px;
//             padding:0 16px;
//             font-size:14px;
//             font-weight:700;
//             ${invoice.bill_to_address || invoice.billing_address ? "" : "margin-top:15px;"}
//           ">
//             To
//           </div>

//           <div style="
//             background:#fff;
//             border:2px solid #e5e7eb;
//             padding:14px;
//             margin-bottom:24px;
//           ">
//             <div style="font-weight:600; font-size:16px; color:#374151;">
//               ${
//                 job.type === "contract-based"
//                   ? contractorData?.name ||
//                     contractorData?.contractor_name ||
//                     invoice.customer_name ||
//                     "Contractor"
//                   : invoice.customer_name ||
//                     invoice.customer?.name ||
//                     job.customerName ||
//                     "Customer"
//               }
//             </div>
//             <div style="color:#6b7280; font-size:14px; margin-top:4px; line-height:1.5;">
//               ${inlineInvoiceData.customerAddress || invoice.customer_address || invoice.customer?.address || job.location || "Address"}
//             </div>
//           </div>

//           <div style="
//             display:grid;
//             grid-template-columns:1fr 1fr;
//             gap:24px;
//             margin-bottom:32px;
//           ">
//             <div>
//               <div style="
//                 background:#1f2937;
//                 color:#fff;
//                 height:36px;
//                 display:flex;
//                 align-items:center;
//                 margin-bottom:8px;
//                 padding:0 16px;
//                 font-size:14px;
//                 font-weight:700;
//               ">
//                 P.O. No.
//               </div>
//               <div style="
//                 background:#fff;
//                 border:2px solid #e5e7eb;
//                 padding:12px 14px;
//                 color:#374151;
//                 font-size:14px;
//               ">
//                 ${invoice.po_number || "DFRG-678"}
//               </div>
//             </div>

//             <div>
//               <div style="
//                 background:#1f2937;
//                 color:#fff;
//                 height:36px;
//                 display:flex;
//                 align-items:center;
//                 margin-bottom:8px;
//                 padding:0 16px;
//                 font-size:14px;
//                 font-weight:700;
//               ">
//                 Project
//               </div>
//               <div style="
//                 background:#fff;
//                 border:2px solid #e5e7eb;
//                 padding:12px 14px;
//                 color:#374151;
//                 font-size:14px;
//               ">
//                 ${invoice.estimate_title || invoice.job_title || job.title || "tech-gb-job"}
//               </div>
//             </div>
//           </div>

//           <div style="margin-bottom:24px;">
//             <table style="width:100%; border-collapse:collapse; border:1px solid #d1d5db;">
//               <thead>
//                 <tr style="background:#f3f4f6;">
//                   <th style="
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     text-align:left;
//                     font-size:14px;
//                     font-weight:600;
//                     color:#374151;
//                   ">
//                     Rep
//                   </th>
//                   <th style="
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     text-align:left;
//                     font-size:14px;
//                     font-weight:600;
//                     color:#374151;
//                   ">
//                     Due Date
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td style="
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     font-size:14px;
//                     color:#374151;
//                   ">
//                     ${inlineInvoiceData.rep || "JDP"}
//                   </td>
//                   <td style="
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     font-size:14px;
//                     color:#374151;
//                   ">
//                     ${
//                       inlineInvoiceData.dueDate
//                         ? new Date(inlineInvoiceData.dueDate).toLocaleDateString("en-US", {
//                             month: "2-digit",
//                             day: "2-digit",
//                             year: "numeric",
//                           })
//                         : "10/17/2025"
//                     }
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           <div style="margin-bottom:32px; page-break-inside:auto;">
//             <table style="
//               width:100%;
//               border-collapse:collapse;
//               table-layout:fixed;
//               border:1px solid #d1d5db;
//               margin-bottom:16px;
//             ">
//               <thead>
//                 <tr style="background:#1f2937; color:#fff;">
//                   <th style="
//                     width:8%;
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     text-align:left;
//                     font-size:14px;
//                     font-weight:600;
//                   ">
//                     Qty
//                   </th>
//                   <th style="
//                     width:18%;
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     text-align:left;
//                     font-size:14px;
//                     font-weight:600;
//                   ">
//                     Item
//                   </th>
//                   <th style="
//                     width:46%;
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     text-align:left;
//                     font-size:14px;
//                     font-weight:600;
//                   ">
//                     Description
//                   </th>
//                   <th style="
//                     width:14%;
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     text-align:right;
//                     font-size:14px;
//                     font-weight:600;
//                   ">
//                     Rate
//                   </th>
//                   <th style="
//                     width:14%;
//                     border:1px solid #d1d5db;
//                     padding:10px 12px;
//                     text-align:right;
//                     font-size:14px;
//                     font-weight:600;
//                   ">
//                     Total
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${groupedPrintRows
//                   .map((row: any) => {
//                     if (row.type === "synthetic-header") {
//                       return `
//                         <tr style="page-break-inside:avoid;">
//                           <td colspan="5" style="
//                             border:1px solid #d1d5db;
//                             background:#374151;
//                             color:#ffffff;
//                             padding:0px 10px 20px 14px;
//                             font-size:14px;
//                             font-weight:700;
//                             text-align:left;
//                           ">
//                             ${escapeHtml(row.headerName || "")}
//                           </td>
//                         </tr>
//                       `;
//                     }

//                     return `
//                       <tr style="page-break-inside:avoid;">
//                         <td style="
//                           border:1px solid #d1d5db;
//                           padding:14px 12px;
//                           vertical-align:top;
//                           font-size:14px;
//                           color:#111827;
//                         ">
//                           ${row.qty || 0}
//                         </td>
//                         <td style="
//                           border:1px solid #d1d5db;
//                           padding:14px 12px;
//                           vertical-align:top;
//                           font-size:14px;
//                           font-weight:600;
//                           color:#111827;
//                           word-break:break-word;
//                           white-space:normal;
//                         ">
//                           ${escapeHtml(row.item || "-")}
//                         </td>
//                         <td style="
//                           border:1px solid #d1d5db;
//                           padding:14px 12px;
//                           vertical-align:top;
//                           font-size:13px;
//                           color:#4b5563;
//                           line-height:1.5;
//                           word-break:break-word;
//                           white-space:normal;
//                         ">
//                           ${escapeHtml(row.description || "")}
//                         </td>
//                         <td style="
//                           border:1px solid #d1d5db;
//                           padding:14px 12px;
//                           vertical-align:top;
//                           text-align:right;
//                           font-size:14px;
//                           font-weight:500;
//                           color:#111827;
//                           white-space:nowrap;
//                         ">
//                           $${Number(row.rate || 0).toFixed(2)}
//                         </td>
//                         <td style="
//                           border:1px solid #d1d5db;
//                           padding:14px 12px;
//                           vertical-align:top;
//                           text-align:right;
//                           font-size:14px;
//                           font-weight:700;
//                           color:#111827;
//                           white-space:nowrap;
//                         ">
//                           $${Number(row.total || 0).toFixed(2)}
//                         </td>
//                       </tr>
//                     `;
//                   })
//                   .join("")}
//               </tbody>
//             </table>

//             <div style="display:flex; justify-content:flex-end; margin-top:20px;">
//               <div style="text-align:right;">
//                 <div style="font-weight:700; font-size:20px; color:#1f2937;">
//                   $${(invoice.total_amount || 0).toFixed(2)}
//                 </div>
//               </div>
//             </div>

//             <div style="display:flex; justify-content:flex-end; margin-top:16px;">
//               <div style="text-align:right; min-width:220px;">
//                 <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
//                   <span style="font-size:14px; color:#374151;">Payments / Credits:</span>
//                   <span style="font-size:14px; color:#374151;">$${(invoice.payment_credits || 0).toFixed(2)}</span>
//                 </div>
//                 <div style="
//                   display:flex;
//                   justify-content:space-between;
//                   background:#f3f4f6;
//                   padding:10px 12px;
//                   border-radius:4px;
//                 ">
//                   <span style="font-weight:700; font-size:14px; color:#374151;">
//                     Balance Due:
//                   </span>
//                   <span style="font-weight:700; font-size:14px; color:#374151;">
//                     $${parseFloat(invoice.balance_due || (invoice.total_amount || 0).toString()).toFixed(2)}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div style="
//             border-top:2px solid #e5e7eb;
//             padding-top:20px;
//             margin-bottom:32px;
//           ">
//             <div style="
//               background:#f3f4f6;
//               padding:16px;
//               border-radius:6px;
//               text-align:center;
//               border:1px solid #e5e7eb;
//             ">
//               <div style="
//                 font-size:14px;
//                 font-weight:500;
//                 white-space:pre-line;
//                 color:#374151;
//                 line-height:1.5;
//               ">
//                 ${invoice.notes || "Final payment to complete project billing"}
//               </div>
//             </div>
//           </div>

//           <div style="margin-bottom:32px; page-break-inside:avoid;">
//             <div style="
//               font-size:11px;
//               color:#6b7280;
//               margin-bottom:32px;
//               line-height:1.5;
//             ">
//               <p style="margin:0;">
//                 JDP is not responsible for repair of lamps & landscaping, house owner
//                 utilities including cables, sprinkler systems, television or telephone
//                 cables, etc. that may be cut or damaged during installation. Price are
//                 subject to change prior to receipt of down payment.
//               </p>
//             </div>

//             <div style="text-align:center; margin-bottom:32px;">
//               <div style="font-size:14px; color:blue; font-weight:500;">
//                 EMAIL: jen@jdpelectric.us 952-449-1088
//               </div>
//             </div>

//             <div style="border-top:1px solid #e5e7eb; margin-bottom:24px;"></div>

//             <div style="
//               display:flex;
//               justify-content:space-between;
//               align-items:center;
//               margin-bottom:20px;
//             ">
//               <div style="display:flex; flex-direction:column;">
//                 <div style="font-size:14px; font-weight:500; color:#374151; margin-bottom:4px;">
//                   Customer Acceptance
//                 </div>
//                 <div style="font-size:14px; font-weight:500; color:#374151;">
//                   Authorized Signature
//                 </div>
//               </div>
//               <div style="font-size:14px; font-weight:500; color:#374151;">Date</div>
//             </div>

//             <div style="
//               display:flex;
//               justify-content:space-between;
//               align-items:center;
//               margin-bottom:20px;
//             ">
//               <div style="display:flex; flex-direction:column; width:60%;">
//                 <div style="border-bottom:1px solid #374151; height:2px; margin-bottom:8px;"></div>
//                 <div style="font-size:12px; color:#374151; text-align:center;">Signature</div>
//               </div>
//               <div style="display:flex; flex-direction:column; width:30%;">
//                 <div style="border-bottom:1px solid #374151; height:2px; margin-bottom:8px;"></div>
//                 <div style="font-size:12px; color:#374151; text-align:center;">Date</div>
//               </div>
//             </div>

//             <div style="
//               background:#e0f2fe;
//               border:1px solid #81d4fa;
//               border-radius:6px;
//               padding:16px;
//               margin-top:20px;
//             ">
//               <div style="font-size:12px; color:#374151; line-height:1.4;">
//                 By signing above, you agree to the terms and pricing outlined in this
//                 estimate. This becomes a binding agreement upon signature.
//               </div>
//             </div>
//           </div>
//         </div>
//       `;
//       tempElement.innerHTML = invoiceHtml;
//       const printTableRows = Array.from(
//         tempElement.querySelectorAll("tbody tr")
//       ) as HTMLElement[];
//       document.body.appendChild(tempElement);

//       // Header height in CSS px
//       const headerEl = tempElement.querySelector(
//         "#print-header",
//       ) as HTMLElement | null;
//       const headerCssPx = Math.ceil(
//         headerEl?.getBoundingClientRect().height || 0,
//       );

//       // Render to canvas
//       const canvas = await html2canvas(tempElement, {
//         scale: 2,
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: "#ffffff",
//         logging: false,
//         width: tempElement.scrollWidth,
//         height: tempElement.scrollHeight,
//         scrollX: 0,
//         scrollY: 0,
//         windowWidth: tempElement.scrollWidth,
//         windowHeight: tempElement.scrollHeight,
//       });

//       const scaleX = canvas.width / tempElement.scrollWidth;
//       const rootRect = tempElement.getBoundingClientRect();
//       const headRect = headerEl?.getBoundingClientRect();
//       const headerBandCssPx = Math.max(
//         1,
//         Math.ceil((headRect?.bottom ?? 0) - rootRect.top),
//       );
//       const headerPxScaled = Math.max(1, Math.round(headerBandCssPx * scaleX));

//       // Slice header (use scaled px)
//       let headerImgData: string | null = null;
//       if (headerPxScaled > 0) {
//         const headerCanvas = document.createElement("canvas");
//         headerCanvas.width = canvas.width;
//         headerCanvas.height = headerPxScaled;
//         const hctx = headerCanvas.getContext("2d")!;
//         hctx.drawImage(
//           canvas,
//           0,
//           0,
//           canvas.width,
//           headerPxScaled,
//           0,
//           0,
//           canvas.width,
//           headerPxScaled,
//         );
//         headerImgData = headerCanvas.toDataURL("image/png");
//       }

//       const imageData = canvas.toDataURL("image/png");

//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgWidth = 210;
// const pageHeight = 297;
// const imgHeight = (canvas.height * imgWidth) / canvas.width;

// const pxToMm = imgWidth / canvas.width;

// // more breathing space top + bottom
// const topPaddingMM = 10;
// const bottomPaddingMM = 14;

// // keep some extra safe space so content doesn't touch bottom
// const usablePageHeight = pageHeight - topPaddingMM - bottomPaddingMM;

// let yPosition = 0;
// const pageHeightPx = Math.floor(usablePageHeight / pxToMm);

// // first page
// {
//   const firstPageCanvas = document.createElement("canvas");
//   firstPageCanvas.width = canvas.width;
//   firstPageCanvas.height = pageHeightPx;

//   const firstCtx = firstPageCanvas.getContext("2d")!;
//   firstCtx.fillStyle = "#fff";
//   firstCtx.fillRect(0, 0, firstPageCanvas.width, firstPageCanvas.height);
//   firstCtx.drawImage(
//     canvas,
//     0,
//     0,
//     canvas.width,
//     pageHeightPx,
//     0,
//     0,
//     canvas.width,
//     pageHeightPx,
//   );

//   const firstPageImg = firstPageCanvas.toDataURL("image/png");
//   pdf.addImage(
//     firstPageImg,
//     "PNG",
//     0,
//     topPaddingMM,
//     imgWidth,
//     pageHeightPx * pxToMm,
//   );

//   yPosition += pageHeightPx;
// }

// // remaining pages
// while (yPosition < canvas.height) {
//   pdf.addPage();

//   const remainingHeightPx = Math.min(pageHeightPx, canvas.height - yPosition);

//   const pageCanvas = document.createElement("canvas");
//   pageCanvas.width = canvas.width;
//   pageCanvas.height = remainingHeightPx;

//   const pageCtx = pageCanvas.getContext("2d")!;
//   pageCtx.fillStyle = "#fff";
//   pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

//   pageCtx.drawImage(
//     canvas,
//     0,
//     yPosition,
//     canvas.width,
//     remainingHeightPx,
//     0,
//     0,
//     canvas.width,
//     remainingHeightPx,
//   );

//   const pageImg = pageCanvas.toDataURL("image/png");
//   pdf.addImage(
//     pageImg,
//     "PNG",
//     0,
//     topPaddingMM,
//     imgWidth,
//     remainingHeightPx * pxToMm,
//   );

//   yPosition += remainingHeightPx;
// }
     

//       const pdfBlob = pdf.output("blob");
//       const pdfUrl = URL.createObjectURL(pdfBlob);
//       const printWindow = window.open(pdfUrl, "_blank");
//       if (printWindow) {
//         printWindow.onload = () => setTimeout(() => printWindow.print(), 1000);
//       }

//       document.body.removeChild(tempElement);
//       setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
//     } catch (err) {
//       console.error("Print error:", err);
//       toast.error("Failed to print invoice");
//     }
//   };
const handlePrintInvoice = async (invoice: any) => {
  console.log(invoice, "invoice");

  try {
    const tempElement = document.createElement("div");
    tempElement.id = "temp-invoice-preview";
    tempElement.style.position = "absolute";
    tempElement.style.left = "-10000px";
    tempElement.style.top = "0";
    tempElement.style.width = "8.5in";
    tempElement.style.background = "#ffffff";
    tempElement.style.padding = "32px";
    tempElement.style.pointerEvents = "none";
    tempElement.style.fontFamily = "Arial, sans-serif";
    tempElement.style.lineHeight = "1.2";
    tempElement.style.boxSizing = "border-box";

    const groupedPrintRows = buildGroupedInvoiceRowsForPrint(
      invoice.products || []
    );

    const invoiceHtml = `
      <div style="
        font-family: Arial, sans-serif;
        color:#374151;
        background:#ffffff;
        box-sizing:border-box;
        width:100%;
      ">
        <div id="print-header" style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px; margin-bottom:24px;">
            <div>
              <div style="
                width:200px;
                height:60px;
                background:url('/assets/logos/logo-jdp.png') no-repeat center center;
                background-size:contain;
              "></div>
              <div style="margin-top:8px; font-size:14px; color:#6b7280;">
                952-449-1088
              </div>
            </div>

            <div style="min-width:400px;">
              <div style="display:flex;">
                <div style="
                  background:#1f2937;
                  color:#fff;
                  height:40px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border:2px solid #1f2937;
                  width:200px;
                  font-size:16px;
                  font-weight:700;
                ">
                  Date
                </div>
                <div style="
                  background:#fff;
                  color:#374151;
                  height:40px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border:2px solid #e5e7eb;
                  width:200px;
                  font-size:16px;
                  font-weight:700;
                ">
                  ${new Date(inlineInvoiceData.date).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div style="display:flex;">
                <div style="
                  background:#1f2937;
                  color:#fff;
                  height:40px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border:2px solid #1f2937;
                  width:200px;
                  font-size:16px;
                  font-weight:700;
                  text-transform:capitalize;
                ">
                  ${invoice.invoice_type || "Estimate"} #
                </div>
                <div style="
                  background:#fff;
                  color:#374151;
                  height:40px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border:2px solid #e5e7eb;
                  width:200px;
                  font-size:16px;
                  font-weight:700;
                ">
                  ${InvoioiceNumber || "INV-2025-029"}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${
          invoice.bill_to_address || invoice.billing_address
            ? `
          <div style="
            background:#1f2937;
            color:#fff;
            height:36px;
            display:flex;
            align-items:center;
            margin-bottom:8px;
            padding:0 16px;
            font-size:14px;
            font-weight:700;
          ">
            Bill To
          </div>
          <div style="
            background:#fff;
            border:2px solid #e5e7eb;
            padding:12px 14px;
            color:#374151;
            font-size:14px;
            margin-bottom:16px;
            font-weight:600;
          ">
            ${invoice.bill_to_address || invoice.billing_address}
          </div>
        `
            : ""
        }

        <div style="
          background:#1f2937;
          color:#fff;
          height:36px;
          display:flex;
          align-items:center;
          margin-bottom:8px;
          padding:0 16px;
          font-size:14px;
          font-weight:700;
          ${invoice.bill_to_address || invoice.billing_address ? "" : "margin-top:15px;"}
        ">
          To
        </div>

        <div style="
          background:#fff;
          border:2px solid #e5e7eb;
          padding:14px;
          margin-bottom:24px;
        ">
          <div style="font-weight:600; font-size:16px; color:#374151;">
            ${
              job.type === "contract-based"
                ? contractorData?.name ||
                  contractorData?.contractor_name ||
                  invoice.customer_name ||
                  "Contractor"
                : invoice.customer_name ||
                  invoice.customer?.name ||
                  job.customerName ||
                  "Customer"
            }
          </div>
          <div style="color:#6b7280; font-size:14px; margin-top:4px; line-height:1.5;">
            ${inlineInvoiceData.customerAddress || invoice.customer_address || invoice.customer?.address || job.location || "Address"}
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:24px;
          margin-bottom:32px;
        ">
          <div>
            <div style="
              background:#1f2937;
              color:#fff;
              height:36px;
              display:flex;
              align-items:center;
              margin-bottom:8px;
              padding:0 16px;
              font-size:14px;
              font-weight:700;
            ">
              P.O. No.
            </div>
            <div style="
              background:#fff;
              border:2px solid #e5e7eb;
              padding:12px 14px;
              color:#374151;
              font-size:14px;
            ">
              ${invoice.po_number || "DFRG-678"}
            </div>
          </div>

          <div>
            <div style="
              background:#1f2937;
              color:#fff;
              height:36px;
              display:flex;
              align-items:center;
              margin-bottom:8px;
              padding:0 16px;
              font-size:14px;
              font-weight:700;
            ">
              Project
            </div>
            <div style="
              background:#fff;
              border:2px solid #e5e7eb;
              padding:12px 14px;
              color:#374151;
              font-size:14px;
            ">
              ${invoice.estimate_title || invoice.job_title || job.title || "tech-gb-job"}
            </div>
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <table style="width:100%; border-collapse:collapse; border:1px solid #d1d5db;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  text-align:left;
                  font-size:14px;
                  font-weight:600;
                  color:#374151;
                ">
                  Rep
                </th>
                <th style="
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  text-align:left;
                  font-size:14px;
                  font-weight:600;
                  color:#374151;
                ">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  font-size:14px;
                  color:#374151;
                ">
                  ${inlineInvoiceData.rep || "JDP"}
                </td>
                <td style="
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  font-size:14px;
                  color:#374151;
                ">
                  ${
                    inlineInvoiceData.dueDate
                      ? new Date(inlineInvoiceData.dueDate).toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : "10/17/2025"
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-bottom:32px; page-break-inside:auto;">
          <table style="
            width:100%;
            border-collapse:collapse;
            table-layout:fixed;
            border:1px solid #d1d5db;
            margin-bottom:16px;
          ">
            <thead>
              <tr style="background:#1f2937; color:#fff;">
                <th style="
                  width:8%;
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  text-align:left;
                  font-size:14px;
                  font-weight:600;
                ">
                  Qty
                </th>
                <th style="
                  width:18%;
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  text-align:left;
                  font-size:14px;
                  font-weight:600;
                ">
                  Item
                </th>
                <th style="
                  width:46%;
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  text-align:left;
                  font-size:14px;
                  font-weight:600;
                ">
                  Description
                </th>
                <th style="
                  width:14%;
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  text-align:right;
                  font-size:14px;
                  font-weight:600;
                ">
                  Rate
                </th>
                <th style="
                  width:14%;
                  border:1px solid #d1d5db;
                  padding:10px 12px;
                  text-align:right;
                  font-size:14px;
                  font-weight:600;
                ">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              ${groupedPrintRows
                .map((row: any) => {
                  if (row.type === "synthetic-header") {
                    return `
                      <tr style="page-break-inside:avoid;">
                        <td colspan="5" style="
                          border:1px solid #d1d5db;
                          background:#374151;
                          color:#ffffff;
                          padding:0px 10px 20px 14px;
                          font-size:14px;
                          font-weight:700;
                          text-align:left;
                        ">
                          ${escapeHtml(row.headerName || "")}
                        </td>
                      </tr>
                    `;
                  }

                  return `
                    <tr style="page-break-inside:avoid;">
                      <td style="
                        border:1px solid #d1d5db;
                        padding:14px 12px;
                        vertical-align:top;
                        font-size:14px;
                        color:#111827;
                      ">
                        ${row.qty || 0}
                      </td>
                      <td style="
                        border:1px solid #d1d5db;
                        padding:14px 12px;
                        vertical-align:top;
                        font-size:14px;
                        font-weight:600;
                        color:#111827;
                        word-break:break-word;
                        white-space:normal;
                      ">
                        ${escapeHtml(row.item || "-")}
                      </td>
                      <td style="
                        border:1px solid #d1d5db;
                        padding:14px 12px;
                        vertical-align:top;
                        font-size:13px;
                        color:#4b5563;
                        line-height:1.5;
                        word-break:break-word;
                        white-space:normal;
                      ">
                        ${escapeHtml(row.description || "")}
                      </td>
                      <td style="
                        border:1px solid #d1d5db;
                        padding:14px 12px;
                        vertical-align:top;
                        text-align:right;
                        font-size:14px;
                        font-weight:500;
                        color:#111827;
                        white-space:nowrap;
                      ">
                        $${Number(row.rate || 0).toFixed(2)}
                      </td>
                      <td style="
                        border:1px solid #d1d5db;
                        padding:14px 12px;
                        vertical-align:top;
                        text-align:right;
                        font-size:14px;
                        font-weight:700;
                        color:#111827;
                        white-space:nowrap;
                      ">
                        $${Number(row.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>

          <div style="display:flex; justify-content:flex-end; margin-top:20px;">
            <div style="text-align:right;">
              <div style="font-weight:700; font-size:20px; color:#1f2937;">
                $${(invoice.total_amount || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:16px;">
            <div style="text-align:right; min-width:220px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="font-size:14px; color:#374151;">Payments / Credits:</span>
                <span style="font-size:14px; color:#374151;">$${(invoice.payment_credits || 0).toFixed(2)}</span>
              </div>
              <div style="
                display:flex;
                justify-content:space-between;
                background:#f3f4f6;
                padding:10px 12px;
                border-radius:4px;
              ">
                <span style="font-weight:700; font-size:14px; color:#374151;">
                  Balance Due:
                </span>
                <span style="font-weight:700; font-size:14px; color:#374151;">
                  $${parseFloat(invoice.balance_due || (invoice.total_amount || 0).toString()).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style="
          border-top:2px solid #e5e7eb;
          padding-top:20px;
          margin-bottom:32px;
        ">
          <div style="
            background:#f3f4f6;
            padding:16px;
            border-radius:6px;
            text-align:center;
            border:1px solid #e5e7eb;
          ">
            <div style="
              font-size:14px;
              font-weight:500;
              white-space:pre-line;
              color:#374151;
              line-height:1.5;
            ">
              ${invoice.notes || "Final payment to complete project billing"}
            </div>
          </div>
        </div>

        <div style="margin-bottom:32px; page-break-inside:avoid;">
          <div style="
            font-size:11px;
            color:#6b7280;
            margin-bottom:32px;
            line-height:1.5;
          ">
            <p style="margin:0;">
              JDP is not responsible for repair of lamps & landscaping, house owner
              utilities including cables, sprinkler systems, television or telephone
              cables, etc. that may be cut or damaged during installation. Price are
              subject to change prior to receipt of down payment.
            </p>
          </div>

          <div style="text-align:center; margin-bottom:32px;">
            <div style="font-size:14px; color:blue; font-weight:500;">
              EMAIL: jen@jdpelectric.us 952-449-1088
            </div>
          </div>

          <div style="border-top:1px solid #e5e7eb; margin-bottom:24px;"></div>

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:20px;
          ">
            <div style="display:flex; flex-direction:column;">
              <div style="font-size:14px; font-weight:500; color:#374151; margin-bottom:4px;">
                Customer Acceptance
              </div>
              <div style="font-size:14px; font-weight:500; color:#374151;">
                Authorized Signature
              </div>
            </div>
            <div style="font-size:14px; font-weight:500; color:#374151;">Date</div>
          </div>

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:20px;
          ">
            <div style="display:flex; flex-direction:column; width:60%;">
              <div style="border-bottom:1px solid #374151; height:2px; margin-bottom:8px;"></div>
              <div style="font-size:12px; color:#374151; text-align:center;">Signature</div>
            </div>
            <div style="display:flex; flex-direction:column; width:30%;">
              <div style="border-bottom:1px solid #374151; height:2px; margin-bottom:8px;"></div>
              <div style="font-size:12px; color:#374151; text-align:center;">Date</div>
            </div>
          </div>

          <div style="
            background:#e0f2fe;
            border:1px solid #81d4fa;
            border-radius:6px;
            padding:16px;
            margin-top:20px;
          ">
            <div style="font-size:12px; color:#374151; line-height:1.4;">
              By signing above, you agree to the terms and pricing outlined in this
              estimate. This becomes a binding agreement upon signature.
            </div>
          </div>
        </div>
      </div>
    `;

      tempElement.innerHTML = invoiceHtml;
      document.body.appendChild(tempElement);

      const printTableRows = Array.from(
        tempElement.querySelectorAll("tbody tr")
      ) as HTMLElement[];

      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: tempElement.scrollWidth,
        height: tempElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tempElement.scrollWidth,
        windowHeight: tempElement.scrollHeight,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const pxToMm = imgWidth / canvas.width;

      const topPaddingMM = 10;
      const bottomPaddingMM = 14;
      const usablePageHeight = pageHeight - topPaddingMM - bottomPaddingMM;
      const pageHeightPx = Math.floor(usablePageHeight / pxToMm);

      const scaleX = canvas.width / tempElement.scrollWidth;
      const rootRect = tempElement.getBoundingClientRect();

      const rowBottomBreakpoints = printTableRows
        .map((row) => {
          const rect = row.getBoundingClientRect();
          return Math.round((rect.bottom - rootRect.top) * scaleX);
        })
        .filter((v) => v > 0)
        .sort((a, b) => a - b);

      const getSafeSliceEnd = (startY: number, targetEndY: number) => {
        const possibleBreaks = rowBottomBreakpoints.filter(
          (point) => point > startY + 40 && point <= targetEndY
        );

        if (possibleBreaks.length > 0) {
          return possibleBreaks[possibleBreaks.length - 1];
        }

        return Math.min(targetEndY, canvas.height);
      };

      let startY = 0;
      let isFirstPage = true;

      while (startY < canvas.height) {
        const rawEndY = Math.min(startY + pageHeightPx, canvas.height);
        const endY =
          rawEndY >= canvas.height
            ? canvas.height
            : getSafeSliceEnd(startY, rawEndY);

        const sliceHeight = endY - startY;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const pageCtx = pageCanvas.getContext("2d")!;
        pageCtx.fillStyle = "#fff";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        pageCtx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const pageImg = pageCanvas.toDataURL("image/png");

        if (!isFirstPage) {
          pdf.addPage();
        }

        pdf.addImage(
          pageImg,
          "PNG",
          0,
          topPaddingMM,
          imgWidth,
          sliceHeight * pxToMm
        );

        startY = endY;
        isFirstPage = false;
      }

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => setTimeout(() => printWindow.print(), 1000);
      }

      document.body.removeChild(tempElement);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print invoice");
    }
  };
  const handleDeleteInvoice = async (invoiceId: string) => {
    setEstimateToDelete({ id: invoiceId });
    setShowDeleteEstimateDialog(true);
  };

  // Map UI invoice types to API values
  const mapInvoiceTypeToAPI = (uiType: string): string => {
    const mapping: Record<string, string> = {
      Estimate: "estimate",
      "Downpayment Invoice": "down_payment",
      "Rough Invoice": "proposal_invoice",
      "Progressive Invoice": "progressive_invoice",
      "Final Invoice": "final_invoice",
    };
    // Return mapped value if exists, otherwise return the custom value as-is
    return mapping[uiType] || uiType.toLowerCase().replace(/\s+/g, "_");
  };

  // Map API invoice type to UI format
  const mapInvoiceTypeToUI = (apiType: string): string => {
    const mapping: Record<string, string> = {
      estimate: "Estimate",
      down_payment: "Downpayment Invoice",
      proposal_invoice: "Rough Invoice",
      progressive_invoice: "Progressive Invoice",
      final_invoice: "Final Invoice",
    };
    // Return mapped value if exists, otherwise convert custom value back to readable format
    if (mapping[apiType]) {
      return mapping[apiType];
    }
    // Convert custom API value back to readable format
    return apiType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getSelectedInvoiceTypeLabel = () => {
    if (inlineInvoiceData.invoiceType === "Custom") {
      const customType = String(inlineInvoiceData.customInvoiceType || "").trim();
      return customType || "Invoice";
    }
    return inlineInvoiceData.invoiceType || "Invoice";
  };

  /**
   * Edit-Invoice: update only the prefix before the first `-` in `estimateNumber`,
   * while keeping the rest (year/sequence) exactly the same.
   *
   * Example: `EST-2026-035` => `FINAL-2026-035`
   */
  const getInvoiceNumberPrefixFromUIType = (
    uiInvoiceType: string,
    customPrefix?: string,
  ): string => {
    if (uiInvoiceType === "Estimate") return "EST";
    if (uiInvoiceType === "Downpayment Invoice") return "DOWN";
    if (uiInvoiceType === "Rough Invoice") return "PRO";
    if (uiInvoiceType === "Progressive Invoice") return "PRG";
    if (uiInvoiceType === "Final Invoice") return "FINAL";
    if (uiInvoiceType === "Custom") return String(customPrefix || "").trim();
    return "";
  };

  const replaceInvoiceNumberPrefix = (
    currentInvoiceNumber: string,
    nextUiInvoiceType: string,
    nextCustomPrefix?: string,
  ): string => {
    const current = String(currentInvoiceNumber || "");
    if (!current) return current;

    const hyphenIndex = current.indexOf("-");
    if (hyphenIndex === -1) return current; // invalid format; keep as-is

    const nextPrefix = getInvoiceNumberPrefixFromUIType(
      nextUiInvoiceType,
      nextCustomPrefix,
    );
    if (!nextPrefix) return current;

    const suffix = current.slice(hyphenIndex); // includes leading hyphen
    return `${nextPrefix}${suffix}`;
  };

  // Fetch suppliers with search
  const fetchSuppliers = async (searchQuery: string = "") => {
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

  // Fetch products with search
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
          supplierSKU: p.supplier_sku || "",
          jdpPrice: p.jdp_price || p.unit_cost || 0,
          estimatedPrice: p.estimated_price || 0,
          supplierId: p.supplier_id || 1,
        })),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  console.log(inlineInvoiceData.lineItems, "::lineItems");

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();

    // Fetch data based on job type
    const contractorRef = job.contractor ?? job.contractor_id;
    const customerRef = job.customer ?? job.customer_id;

    if (job.type === "contract-based" && contractorRef) {
      // Contract-based jobs may return only contractor_id after completion.
      const contractorId =
        typeof contractorRef === "object" && contractorRef !== null
          ? contractorRef.id
          : contractorRef;
      fetchContractorData(String(contractorId));
    } else if (customerRef) {
      // Service-based jobs (and fallback) may return only customer_id.
      fetchCustomerData(customerRef);
    } else {
      console.log("No customer/contractor ID found in job data");
    }
  }, [job.customer, job.customer_id, job.contractor, job.contractor_id, job.type, job.id]);

  // Debug: Log inlineInvoiceData changes
  useEffect(() => {}, [inlineInvoiceData.customerAddress]);

  // Update customer address when customerData changes
  useEffect(() => {
    if (
      customerData?.address &&
      customerData.address !== inlineInvoiceData.customerAddress
    ) {
      setInlineInvoiceData((prev) => ({
        ...prev,
        customerAddress: customerData.address,
      }));
    }
  }, [customerData?.address]);

  const handleSaveInvoiceAsDraft = async () => {
    // Validation
    const errors: Record<string, string> = {};

    if (!inlineInvoiceData.project) {
      errors.project = "Project field is required";
    }

    if (!hasAtLeastOneFilledLineItem(inlineInvoiceData.lineItems)) {
      errors.lineItems = "Please fill at least one line item";
    }
    if (!validateHeaderGroupsBeforeSubmit(inlineInvoiceData.lineItems)) {
      return;
    }
    if (!validateLineItems(inlineInvoiceData.lineItems)) return;

    if (Object.keys(errors).length > 0) {
      setInvoiceValidationErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    const validLineItems = getFilledLineItemRows(inlineInvoiceData.lineItems);



    setInvoiceValidationErrors({});
    setIsLoadingDraft(true);
    try {
      const subtotal = calculateInvoiceSubtotal();

      // Only map valid line items to custom products
      const customProducts = validLineItems.map((item) => {
        const productPayload: any = {
          product_name: item.item,
          description: item.description || "",
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: Number(item.qty) || 0,
          unit: "unit",
          job_id: Number(jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total,
          is_custom: item.isCustomProduct === true,
          section_name: item.headerName || null,
          section_type: item.type ? "room_header" : null,
          // parent_header_key: item.parentHeaderKey || null,
          parent_header_name: item.parentHeaderName || null,
        };

        // Add product ID only for searched/selected products
        if (item.isCustomProduct !== true && item.productId) {
          productPayload.id = item.productId;
        }

        return productPayload;
      });

      console.log(customProducts,"customProductscustomProducts");
      

      const payload = {
        job_id: Number(jobId),
        estimate_title: inlineInvoiceData.project || job.title,
        ...(job.type === "contract-based"
          ? { contractor_id: Number(job.contractor) || 0 }
          : { customer_id: Number(job.customer?.id || job.customer) || 0 }),
        priority: "medium" as "low" | "medium" | "high",
        service_type:
          job.type === "contract-based" ? "contract_based" : "service_based",
        email_address:
          job.type === "contract-based"
            ? contractorData?.email || job.email || "contractor@example.com"
            : customerData?.email ||
              job.customer?.email ||
              job.email ||
              "customer@example.com",
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        ...(inlineInvoiceData.billToAddressEnabled && {
          bill_to_address: inlineInvoiceData.billToAddress || "",
        }),
        status: "draft",
        invoice_type: mapInvoiceTypeToAPI(
          inlineInvoiceData.invoiceType === "Custom"
            ? inlineInvoiceData.customInvoiceType
            : inlineInvoiceData.invoiceType,
        ),
        notes: getInvoiceNotesForPayload(),
        total_amount: subtotal,
        custom_products: customProducts,
      };

      // Check if we're editing an existing invoice
      if (editingInvoiceId) {
        await apiClient.updateEstimate(
          Number(editingInvoiceId),
          payload as any,
        );
        toast.success("Invoice updated successfully!");
      } else {
        await apiClient.createEstimate(payload as any);
        toast.success("Invoice saved as draft!");
      }

      // Refresh estimates list
      await fetchEstimates();
      try {
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setShowInlineInvoiceForm(false);
      setEditingInvoiceId(null);

      // Reset form
      setInlineInvoiceData({
        date: new Date().toISOString().split("T")[0],
        estimateNumber: "",
        customerName: job.customerName || "",
        customerAddress: job.address || "",
        billToAddress: job.billToAddress || "",
        billToAddressEnabled: true,
        poNumber: "",
        project: job.title || "",
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
      setInvoiceValidationErrors({});
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setIsLoadingDraft(false);
    }
  };
  const buildCustomProductsWithSections = () => {
    let currentSectionName = "";

    return inlineInvoiceData.lineItems.reduce((acc: any[], lineItem: any) => {
      if (lineItem.type === "header") {
        currentSectionName = (lineItem.headerName || "").trim();
        return acc;
      }

      acc.push({
        ...(lineItem.estimate_product_id
          ? { id: lineItem.estimate_product_id }
          : {}),
        product_name: lineItem.item || "",
        description: lineItem.description || "",
        jdp_sku:
          lineItem.jdp_sku ||
          `JDP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        stock_quantity: Number(lineItem.qty || 0),
        unit: lineItem.unit || "unit",
        job_id: Number(jobId),
        unit_cost: Number(lineItem.rate || 0),
        jdp_price: Number(lineItem.rate || 0),
        estimated_price: Number(lineItem.estimatedPrice || 0),
        total_cost: Number(lineItem.total || 0),
        is_custom: !!lineItem.isCustomProduct,

        // NEW FIELDS FOR BACKEND
        section_name: currentSectionName || null,
        section_type: currentSectionName ? "room_header" : null,
      });

      return acc;
    }, []);
  };

  const handlePreviewAndSend = async () => {
    // Validation
    const errors: Record<string, string> = {};

    if (!inlineInvoiceData.project) {
      errors.project = "Project field is required";
    }

    if (!hasAtLeastOneFilledLineItem(inlineInvoiceData.lineItems)) {
      errors.lineItems = "Please fill at least one line item";
    }
    if (!validateHeaderGroupsBeforeSubmit(inlineInvoiceData.lineItems)) {
      return;
    }
    if (!validateLineItems(inlineInvoiceData.lineItems)) return;

    if (Object.keys(errors).length > 0) {
      setInvoiceValidationErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    const validLineItems = getFilledLineItemRows(inlineInvoiceData.lineItems);

    // First save as draft
    try {
      setIsLoadingPreview(true);

      const subtotal = calculateInvoiceSubtotal();

      // Only map valid line items to custom products
      const customProducts = validLineItems.map((item) => {
        console.log(item, "itemitem");

        const productPayload: any = {
          product_name: item.item,
          description: item.description || "",
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: Number(item.qty) || 0,
          unit: "unit",
          job_id: Number(jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total,
          is_custom: item.isCustomProduct === true,
          // NEW FIELDS FOR BACKEND
          section_name: item.headerName || null,
          section_type: item.type ? "room_header" : null,
          // parent_header_key: item.parentHeaderKey || null,
          parent_header_name: item.parentHeaderName || null,
        };

        // Add product ID only for searched/selected products
        if (item.isCustomProduct !== true && item.productId) {
          productPayload.id = item.productId;
        }

        return productPayload;
      });

      const payload = {
        job_id: Number(jobId),
        estimate_title: inlineInvoiceData.project || job.title,
        ...(job.type === "contract-based"
          ? { contractor_id: Number(job.contractor) || 0 }
          : { customer_id: Number(job.customer?.id || job.customer) || 0 }),
        priority: "medium" as "low" | "medium" | "high",
        service_type:
          job.type === "contract-based" ? "contract_based" : "service_based",
        email_address:
          job.type === "contract-based"
            ? contractorData?.email || job.email || "contractor@example.com"
            : customerData?.email ||
              job.customer?.email ||
              job.email ||
              "customer@example.com",
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        ...(inlineInvoiceData.billToAddressEnabled && {
          bill_to_address: inlineInvoiceData.billToAddress || "",
        }),
        status: "draft",
        invoice_type: mapInvoiceTypeToAPI(
          inlineInvoiceData.invoiceType === "Custom"
            ? inlineInvoiceData.customInvoiceType
            : inlineInvoiceData.invoiceType,
        ),
        notes: getInvoiceNotesForPayload(),
        custom_products: customProducts,
        estimate_source_type: job?.estimatedCost
          ? "estimate_job"
          : "time_material_job",
        total_amount: subtotal,
      };

      if (editingInvoiceId) {
        await apiClient.updateEstimate(
          Number(editingInvoiceId),
          payload as any,
        );
      } else {
        const response = await apiClient.createEstimate(payload as any);
        setEditingInvoiceId(response.id);
      }

      // Clear validation errors
      setInvoiceValidationErrors({});

      // Show single success message
      toast.success("Invoice saved successfully!");

      // Refresh estimates to update count
      await fetchEstimates();

      // Refresh dashboard data
      try {
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }

      // Then open preview dialog
      setShowPreviewDialog(true);
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice. Please try again.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSendFromPreview = async () => {
    setIsLoading(true);
    try {
      // Prepare API payload
      const subtotal = calculateInvoiceSubtotal();
      const total = subtotal; // You can add tax calculation here if needed
      const notesTextForEmail = getInvoiceNotesForPayload();

      const payload = {
        estimateNumber: inlineInvoiceData.estimateNumber || "Draft",
        estimateDate: new Date(inlineInvoiceData.date).toLocaleDateString(
          "en-US",
          {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          },
        ),
        ...(job.type === "contract-based"
          ? {
              customerName: inlineInvoiceData.customerName || "Contractor",
              customerEmail:
                contractorData?.email || job.email || "contractor@example.com",
              customerAddress: inlineInvoiceData.customerAddress || "",
            }
          : {
              customerName: inlineInvoiceData.customerName || "Customer",
              customerEmail:
                customerData?.email ||
                job.customer?.email ||
                job.customerEmail ||
                "customer@example.com",
              customerAddress: inlineInvoiceData.customerAddress || "",
            }),
        billToAddress: inlineInvoiceData.billToAddressEnabled
          ? inlineInvoiceData.billToAddress || ""
          : "",
        poNumber: inlineInvoiceData.poNumber || "",
        projectName: inlineInvoiceData.project || job.title || "",
        items: (inlineInvoiceData.lineItems || [])
        // Only send rows that actually have an item name filled.
        // Empty seeded rows should not affect payload calculations.
        .filter((item: any) => {
          if (item.type === "header") return false;
          return String(item.item || "").trim() !== "";
        })
        .map((item: any) => {
          const qtyNum = Number(item.qty || 0);
          const rateNum = Number(item.rate || 0);
          const amountNum = qtyNum * rateNum;

          return {
            quantity: String(qtyNum),
            item: item.item || "",
            description: item.description || "",
            rate: rateNum.toFixed(2),
            amount: amountNum.toFixed(2),
            parent_header_name:
              item.parentHeaderName || item.parent_header_name || null,
          };
        }),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        dueDate: inlineInvoiceData.dueDate || "",
        rep: inlineInvoiceData.rep || "JDP",
        paymentCredits: inlineInvoiceData.paymentCredits || 0,
        balanceDue: (
          subtotal - (inlineInvoiceData.paymentCredits || 0)
        ).toFixed(2),
        notes: notesTextForEmail
          ? notesTextForEmail.split("\n").filter((note) => note.trim())
          : [],
        invoice_description: INVOICE_DESCRIPTION,
        invoice_type: mapInvoiceTypeToAPI(
          inlineInvoiceData.invoiceType === "Custom"
            ? inlineInvoiceData.customInvoiceType
            : inlineInvoiceData.invoiceType,
        ),
        email: "jen@jdpelectric.us",
        phone: "952-449-1088",
        status: "sent",
      };

      // Get auth token
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

      // Call API to send invoice
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const token = getAuthToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${apiUrl}/invoices/sendInvoiceToCustomer/${editingInvoiceId || estimates[0]?.id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send invoice");
      }

      toast.success("Invoice sent successfully to customer!");

      const sentInvoiceId = Number(
        editingInvoiceId || estimates[0]?.id,
      );
      if (sentInvoiceId) {
        setEstimates((prev) =>
          prev.map((item: any) =>
            Number(item.id) === sentInvoiceId
              ? { ...item, status: "sent" }
              : item,
          ),
        );
      }

      // Also save the invoice data to backend
    const customProducts = sanitizeCustomProductsForPayload(
      inlineInvoiceData.lineItems,
      Number(jobId),
    );
      const backendPayload = {
        job_id: Number(jobId),
        estimate_title: inlineInvoiceData.project || job.title,
        ...(job.type === "contract-based"
          ? { contractor_id: Number(job.contractor) || 0 }
          : { customer_id: Number(job.customer?.id || job.customer) || 0 }),
        priority: "medium" as "low" | "medium" | "high",
        service_type:
          job.type === "contract-based" ? "contract_based" : "service_based",
        email_address:
          job.type === "contract-based"
            ? contractorData?.email || job.email || "contractor@example.com"
            : customerData?.email ||
              job.customer?.email ||
              job.email ||
              "customer@example.com",
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        ...(inlineInvoiceData.billToAddressEnabled && {
          bill_to_address: inlineInvoiceData.billToAddress || "",
        }),
        status: "sent",
        invoice_type: mapInvoiceTypeToAPI(
          inlineInvoiceData.invoiceType === "Custom"
            ? inlineInvoiceData.customInvoiceType
            : inlineInvoiceData.invoiceType,
        ),
        notes: getInvoiceNotesForPayload(),
        custom_products: customProducts,
      };

      // Check if we're editing an existing invoice
      if (editingInvoiceId) {
        await apiClient.updateEstimate(
          Number(editingInvoiceId),
          backendPayload as any,
        );
      }

      // Refresh estimates list from server (fresh data after send)
      await fetchEstimates();
      try {
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setShowInlineInvoiceForm(false);
      setShowPreviewDialog(false);
      setEditingInvoiceId(null);

      // Reset form
      setInlineInvoiceData({
        date: new Date().toISOString().split("T")[0],
        estimateNumber: "",
        customerName: job.customerName || "",
        customerAddress: job.address || "",
        billToAddress: job.billToAddress || "",
        billToAddressEnabled: true,
        poNumber: "",
        project: job.title || "",
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
      setInvoiceValidationErrors({});
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickbookFromPreview = async (action: "send" | "save") => {
    setQuickbookActionLoading(action);
    try {
      const customProducts = sanitizeCustomProductsForPayload(
        inlineInvoiceData.lineItems,
        Number(jobId),
      );

      const selectedInvoiceType =
        inlineInvoiceData.invoiceType === "Custom"
          ? inlineInvoiceData.customInvoiceType
          : inlineInvoiceData.invoiceType;

      const payload = {
        job_id: Number(jobId),
        estimate_title: inlineInvoiceData.project || job.title,
        ...(job.type === "contract-based"
          ? { contractor_id: Number(job.contractor) || 0 }
          : { customer_id: Number(job.customer?.id || job.customer) || 0 }),
        priority: "medium" as "low" | "medium" | "high",
        service_type:
          job.type === "contract-based" ? "contract_based" : "service_based",
        email_address:
          job.type === "contract-based"
            ? contractorData?.email || job.email || "contractor@example.com"
            : customerData?.email ||
              job.customer?.email ||
              job.email ||
              "customer@example.com",
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || "",
        rep: inlineInvoiceData.rep || "",
        due_date: inlineInvoiceData.dueDate || "",
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || "",
        ...(inlineInvoiceData.billToAddressEnabled && {
          bill_to_address: inlineInvoiceData.billToAddress || "",
        }),
        status: "draft",
        invoice_type: mapInvoiceTypeToAPI(selectedInvoiceType),
        notes: getInvoiceNotesForPayload(),
        custom_products: customProducts,
        total_amount: calculateInvoiceSubtotal(),
        invoice_source: "quickbook",
        quickbook_action:
          action === "send" ? "sendtoquickbook" : "sevetoquickbook",
      };

      const response = await apiClient.createEstimate(payload as any);
      const created = response?.data ?? response;
      const estimateId = Number(
        editingInvoiceId ?? created?.id ?? created?.estimate?.id,
      );
      const qbInvoiceId =
        created?.qb_invoice_id ?? created?.estimate?.qb_invoice_id ?? null;

      if (action === "send" && estimateId) {
        setEstimates((prev) => {
          const exists = prev.some(
            (item: any) => Number(item.id) === estimateId,
          );
          if (!exists) return prev;
          return prev.map((item: any) =>
            Number(item.id) === estimateId
              ? {
                  ...item,
                  status: "sent",
                  ...(qbInvoiceId != null && String(qbInvoiceId).trim() !== ""
                    ? { qb_invoice_id: qbInvoiceId }
                    : {}),
                }
              : item,
          );
        });
      }

      toast.success(
        action === "send"
          ? "Send Invoice from QuickBooks"
          : "Save Invoice to QuickBooks",
      );

      await fetchEstimates();
      try {
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }

      // Close add-invoice popup flow after successful QuickBooks action.
      setShowPreviewDialog(false);
      setShowInlineInvoiceForm(false);
      setEditingInvoiceId(null);
    } catch (error) {
      console.error("Quickbook action failed:", error);
      toast.error(
        action === "send"
          ? "Failed to send invoice from QuickBooks"
          : "Failed to save invoice to QuickBooks",
      );
    } finally {
      setQuickbookActionLoading(null);
    }
  };

  const handlePrintPreview = async () => {
    try {
      const printElement = document.getElementById("invoice-preview-print");
      if (!printElement) {
        toast.error("Unable to generate invoice for printing");
        return;
      }

      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imageData = canvas.toDataURL("image/png");
      const headerEl =
        printElement.querySelector("#print-header") ||
        printElement.querySelector("[data-print-header]") ||
        printElement.querySelector(".print-header") ||
        document.querySelector("#print-header");

      const offsetTopRel = (el: HTMLElement, ancestor: HTMLElement) => {
        let y = 0,
          n: any = el;
        while (n && n !== ancestor) {
          y += n.offsetTop || 0;
          n = n.offsetParent;
        }
        return y;
      };

      let headerBandCssPx = 0;
      if (headerEl instanceof HTMLElement) {
        headerBandCssPx =
          offsetTopRel(headerEl, printElement) + headerEl.offsetHeight;
      } else {
        headerBandCssPx = 180;
      }

      const scaleX = canvas.width / printElement.scrollWidth;
      const headerBandPx = Math.max(1, Math.round(headerBandCssPx * scaleX));

      let headerImgData: string | null = null;
      if (headerBandPx > 0) {
        const headerCanvas = document.createElement("canvas");
        headerCanvas.width = canvas.width;
        headerCanvas.height = headerBandPx;
        const hctx = headerCanvas.getContext("2d")!;
        hctx.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          headerBandPx,
          0,
          0,
          canvas.width,
          headerBandPx,
        );
        headerImgData = headerCanvas.toDataURL("image/png");
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pxToMm = imgWidth / canvas.width;

      const headerBandMM = headerBandPx * pxToMm;
      const pageContentHeightMM = pageHeight - headerBandMM;

      let heightLeft = imgHeight;

      pdf.addImage(imageData, "PNG", 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0.1) {
        const position = heightLeft - imgHeight;
        pdf.addPage();

        if (headerImgData && headerBandMM > 0) {
          pdf.addImage(
            imageData,
            "PNG",
            0,
            position + headerBandMM,
            imgWidth,
            imgHeight,
          );

          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, imgWidth, headerBandMM, "F");

          pdf.addImage(headerImgData, "PNG", 0, 0, imgWidth, headerBandMM);

          heightLeft -= pageContentHeightMM;
        } else {
          pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => setTimeout(() => printWindow.print(), 800);
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print invoice");
    }
  };
  console.log(inlineInvoiceData.lineItems, "::lineItems");

  const createRowKey = () =>
    `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const createHeaderKey = () =>
    `header_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const buildLineItemsFromProducts = (products: any[] = []) => {
    const grouped: Record<string, any[]> = {};
    const ungrouped: any[] = [];

    products.forEach((product: any) => {
      const headerName = product.parent_header_name || null;

      const baseItem = {
        id: createRowKey(),
        type: "item",
        headerKey: null,
        headerName: "",
        parentHeaderKey: null,
        parentHeaderName: headerName,
        qty: product.stock_quantity || 1,
        item: product.product_name || "",
        description: product.description || "",
        rate: product.unit_cost || product.jdp_price || 0,
        estimatedPrice:
          product.estimated_price ||
          product.unit_cost ||
          product.jdp_price ||
          0,
        total:
          product.total_cost ??
          (product.stock_quantity || 1) *
            (product.estimated_price ||
              product.unit_cost ||
              product.jdp_price ||
              0),
        searchQuery: "",
        showSearchResults: false,
        supplierId: product.supplier_id || 1,
        isCustomProduct: !!product.is_custom,
        productId: product.id || null,
        estimate_product_id: product.estimate_product_id || null,
      };

      if (!headerName) {
        ungrouped.push(baseItem);
      } else {
        if (!grouped[headerName]) {
          grouped[headerName] = [];
        }
        grouped[headerName].push(baseItem);
      }
    });

    const finalLineItems: any[] = [...ungrouped];

    Object.entries(grouped).forEach(([headerName, items]) => {
      const headerKey = createHeaderKey();

      finalLineItems.push({
        id: createRowKey(),
        type: "header",
        headerName,
        headerKey,
        parentHeaderKey: null,
        parentHeaderName: null,
        qty: 0,
        item: "",
        description: "",
        rate: 0,
        estimatedPrice: 0,
        total: 0,
        searchQuery: "",
        showSearchResults: false,
        supplierId: 1,
        isCustomProduct: true,
        productId: null,
        estimate_product_id: null,
      });

      items.forEach((item) => {
        finalLineItems.push({
          ...item,
          parentHeaderKey: headerKey,
          parentHeaderName: headerName,
        });
      });
    });

    return finalLineItems;
  };

  const handleEditInvoice = async (invoice: any) => {
    try {
      setIsLoading(true);

      const response = await apiClient.getEstimateById(invoice.id);
      const estimateData = response?.data || response;

      console.log(estimateData.products, "estimateData.products");

      const lineItems =
        estimateData.products && estimateData.products.length > 0
          ? buildLineItemsFromProducts(estimateData.products)
          : createDefaultEmptyLineItems(5);
      console.log(lineItems, "lineItemslineItems");
      setInlineInvoiceData({
        date:
          estimateData.estimate_date || new Date().toISOString().split("T")[0],
        estimateNumber: estimateData.invoice_number || "",
        customerName:
          estimateData.customer?.customer_name ||
          job.customer?.customer_name ||
          job.customerName ||
          "",
        customerAddress:
          estimateData.customer?.address ||
          job.customer?.address ||
          job.address ||
          "",
        billToAddress:
          estimateData.bill_to_address || job.bill_to_address || "",
        rep: estimateData.rep || "",
        dueDate: estimateData.due_date || "",
        paymentCredits: estimateData.payment_credits || 0,
        balanceDue: estimateData.balance_due || "",
        billToAddressEnabled: true,
        poNumber: estimateData.po_number || "",
        project:
          estimateData.estimate_title || job.job_title || job.title || "",
        lineItems,
        notes:
          (estimateData.notes ?? estimateData.description) ||
          "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
        signatureText: "ACCEPTED BY________________DATE_____",
        invoiceType: (() => {
          const mappedType =
            mapInvoiceTypeToUI(estimateData.invoice_type) || "Estimate";
          const standardTypes = [
            "Estimate",
            "Downpayment Invoice",
            "Rough Invoice",
            "Progressive Invoice",
            "Final Invoice",
          ];
          if (!standardTypes.includes(mappedType)) {
            addCustomInvoiceType(mappedType);
            return "Custom";
          }
          return mappedType;
        })(),
        customInvoiceType: (() => {
          const mappedType =
            mapInvoiceTypeToUI(estimateData.invoice_type) || "Estimate";
          const standardTypes = [
            "Estimate",
            "Downpayment Invoice",
            "Rough Invoice",
            "Progressive Invoice",
            "Final Invoice",
          ];
          if (!standardTypes.includes(mappedType)) {
            return mappedType;
          }
          return "";
        })(),
        paymentPercentage: 0,
        estimateTotal: estimateData.total_amount || 0,
        paymentHistory: [],
      });

      setEditingInvoiceId(invoice.id);
      setShowInlineInvoiceForm(true);
      toast.info("Invoice loaded for editing");
    } catch (error) {
      console.error("Edit invoice load error:", error);
      toast.error("Failed to load invoice details");
    } finally {
      setIsLoading(false);
    }
  };
  // const handleEditInvoice = async (invoice: any) => {
  //   try {
  //     setIsLoading(true)

  //     // Fetch full estimate details from API
  //     const response = await apiClient.getEstimateById(invoice.id)
  //     const estimateData = response?.data || response
  //     console.log(estimateData.products,"estimateData.products");

  //     // Map products to line items
  //     const lineItems = estimateData.products && estimateData.products.length > 0
  //       ? estimateData.products.map((product: any) => ({
  //         id: Math.random().toString(36).substring(2, 9),
  //         productId: product.id, // Store original product ID for updates
  //         qty: product.stock_quantity || 1,
  //         item: product.product_name || '',
  //         description: product.description || '',
  //         rate: product.unit_cost || 0,
  //         estimatedPrice: product.estimated_price || product.unit_cost || 0,
  //         total: (product.stock_quantity || 1) * (product.estimated_price || product.unit_cost || 0),
  //         searchQuery: '',
  //         showSearchResults: false,
  //         supplierId: product.supplier_id || 1,
  //         isCustomProduct: false,
  //         estimate_product_id: product.estimate_product_id || null,
  //         parent_header_name: product.estimate_product_id || null,
  //       }))
  //       : [{
  //         id: Math.random().toString(36).substring(2, 9),
  //         productId: null,
  //         qty: 1,
  //         item: '',
  //         description: '',
  //         rate: 0,
  //         estimatedPrice: 0,
  //         total: 0,
  //         searchQuery: '',
  //         showSearchResults: false,
  //         supplierId: 1,
  //         isCustomProduct: false,
  //         estimate_product_id: null
  //       }]

  //     setInlineInvoiceData({
  //       date: estimateData.estimate_date || new Date().toISOString().split('T')[0],
  //       estimateNumber: estimateData.invoice_number || '',
  //       customerName: estimateData.customer?.customer_name || job.customer?.customer_name || job.customerName || '',
  //       customerAddress: estimateData.customer?.address || job.customer?.address || job.address || '',
  //       billToAddress: estimateData.bill_to_address || job.bill_to_address || '',
  //       rep: estimateData.rep || '',
  //       dueDate: estimateData.due_date || '',
  //       paymentCredits: estimateData.payment_credits || 0,
  //       balanceDue: estimateData.balance_due || '',
  //       billToAddressEnabled: true,
  //       poNumber: estimateData.po_number || '',
  //       project: estimateData.estimate_title || job.job_title || job.title || '',
  //       lineItems: lineItems,
  //       notes: estimateData.notes || 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
  //       signatureText: 'ACCEPTED BY________________DATE_____',
  //       invoiceType: (() => {
  //         const mappedType = mapInvoiceTypeToUI(estimateData.invoice_type) || 'Estimate'
  //         // Check if it's a custom type (not in standard mapping)
  //         const standardTypes = ['Estimate', 'Downpayment Invoice', 'Rough Invoice', 'Progressive Invoice', 'Final Invoice']
  //         if (!standardTypes.includes(mappedType)) {
  //           // It's a custom type, add to custom types list and set as Custom
  //           addCustomInvoiceType(mappedType)
  //           return 'Custom'
  //         }
  //         return mappedType
  //       })(),
  //       customInvoiceType: (() => {
  //         const mappedType = mapInvoiceTypeToUI(estimateData.invoice_type) || 'Estimate'
  //         const standardTypes = ['Estimate', 'Downpayment Invoice', 'Rough Invoice', 'Progressive Invoice', 'Final Invoice']
  //         if (!standardTypes.includes(mappedType)) {
  //           return mappedType
  //         }
  //         return ''
  //       })(),
  //       paymentPercentage: 0,
  //       estimateTotal: estimateData.total_amount || 0,
  //       paymentHistory: []
  //     })

  //     setEditingInvoiceId(invoice.id)
  //     setShowInlineInvoiceForm(true)
  //     toast.info('Loading invoice for editing...')
  //   } catch (error) {
  //     toast.error('Failed to load invoice details')
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // Change order
  const handleChangeOrderClick = (
    job: any,
    customerId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent job selection
    setChangeOrderJob({
      ...job, // Store the entire job object
      customerId: customerId,
      originalId: job.id, // Store original ID for reference
    });
    // Set default title as "Change Order - [Original Title]"
    setChangeOrderTitle(`${""}`);
    setChangeOrderEstimate(job.estimated_cost || job.estimatedCost || "");
    setChangeOrderErrors({});
    setShowChangeOrderModal(true);
  };

  const handleChangeOrderSave = async () => {
    // Validate
    const errors: Record<string, string> = {};
    if (!changeOrderTitle.trim()) {
      errors.title = "Job title is required";
    }

    if (Object.keys(errors).length > 0) {
      setChangeOrderErrors(errors);
      return;
    }

    setIsUpdatingChangeOrder(true);
    try {
      // Original job data
      const originalJob = changeOrderJob;

      // Prepare payload for NEW JOB (Change Order)
      // Normalize job type to API expected values
      const normalizedJobType =
        originalJob.job_type === "service_based" ||
        originalJob.job_type === "contract_based"
          ? originalJob.job_type
          : originalJob.type === "contract-based" ||
              originalJob.type === "contract_based"
            ? "contract_based"
            : "service_based";

      // Copy most fields from original job but with new title
      const payload: any = {
        job_title: changeOrderTitle, // New title
        job_type: normalizedJobType,
        changes_order: "change order",
        description: originalJob.description || "",
        priority: originalJob.priority || "medium",
        address: originalJob.address || "",
        city_zip: originalJob.city_zip || originalJob.cityZip || "",
        phone: originalJob.phone || "",
        email: originalJob.email || "",
        bill_to_address:
          originalJob.bill_to_address || originalJob.billToAddress || "",
        bill_to_city_zip:
          originalJob.bill_to_city_zip || originalJob.billToCityZip || "",
        bill_to_phone:
          originalJob.bill_to_phone || originalJob.billToPhone || "",
        bill_to_email:
          originalJob.bill_to_email || originalJob.billToEmail || "",
        same_as_address:
          originalJob.same_as_address || originalJob.sameAsAddress || false,
        due_date: originalJob.due_date || originalJob.dueDate || "",
        // estimated_hours: originalJob.estimated_hours || originalJob.estimatedHours || 0,
        estimated_cost: Number(changeOrderEstimate),

        status: "pending", // New job starts as pending

        // Copy assigned labor if exists
        assigned_lead_labor_ids:
          originalJob.assigned_lead_labor_ids ||
          (originalJob.assignedLeadLabor
            ? JSON.stringify(originalJob.assignedLeadLabor)
            : undefined),
        assigned_labor_ids:
          originalJob.assigned_labor_ids ||
          (originalJob.assignedLabor
            ? JSON.stringify(originalJob.assignedLabor)
            : undefined),
      };

      // Match service vs contract by API job_type (hyphen/underscore UI variants already normalized above)
      if (normalizedJobType === "service_based") {
        const rawCustomerId =
          originalJob.customer_id ??
          originalJob.customer?.id ??
          originalJob.customer;
        if (rawCustomerId != null && String(rawCustomerId).trim() !== "") {
          payload.customer_id = Number(rawCustomerId);
        }
      } else if (normalizedJobType === "contract_based") {
        const rawContractorId =
          originalJob.contractor_id ??
          originalJob.contractor?.id ??
          originalJob.contractor;
        if (rawContractorId != null && String(rawContractorId).trim() !== "") {
          payload.contractor_id = Number(rawContractorId);
        }
      }

      console.log("Creating change order with payload:", payload);

      // Call API to CREATE NEW JOB (not update)
      const response = await apiClient.createJob(payload); // Remove changeOrderJob.id
      console.log("Change order creation response:", response);

      // Get the newly created job from response
      const newJob = response.data || response;

      // Update local jobs state - add the new change order job
      setJobs([
        ...jobs,
        {
          ...newJob,
          id: newJob.id,
          job_title: changeOrderTitle,
          estimated_cost: Number(changeOrderEstimate),
          title: changeOrderTitle,
          isChangeOrder: true,
          originalJobId: originalJob.id,
        },
      ]);

      // Ask parent (CustomersPage) to refresh listing so sub-jobs appear
      if (onJobsRefresh) {
        onJobsRefresh();
      }

      toast.success("Change order created successfully!");
      setShowChangeOrderModal(false);
      setChangeOrderJob(null);
      setChangeOrderTitle("");
    } catch (error) {
      console.error("Error creating change order:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create change order",
      );
    } finally {
      setIsUpdatingChangeOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                title="Change Order"
                className="  pl-2 pr-2 bg-primary text-white"
                onClick={(e) =>
                  handleChangeOrderClick(
                    job,
                    job.type === "contract-based"
                      ? job.contractor?.toString?.() ||
                          job.contractor_id?.toString?.() ||
                          ""
                      : job.customer?.toString?.() ||
                          job.customer_id?.toString?.() ||
                          "",
                    e,
                  )
                }
              >
                Change Order
              </Button>
            </div>
            {/* <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Invoice
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Send Invoice
            </Button> */}
            {/* <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              setEditedJob({
                ...job,
                assignedLeadLabor: job.assignedLeadLaborDetails || [],
                assignedLabor: job.assignedLaborDetails || [],
              });
              setIsEditing(true);
            }}
            >
              
              <Edit className="h-4 w-4" />
              Edit Job
            </Button> */}
          </div>
        </div>

        {/* Job Title and Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {getJobTitle(job)}
            </h1>
            <p className="text-sm text-gray-600">#{job.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Hours Worked */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Total Hours Worked
                  </p>
                  {isLoadingDashboard ? (
                    <div className="h-6 flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-blue-900">
                      {dashboardMetrics?.totalHoursWorked?.value ?? 0}
                    </p>
                  )}
                  <p className="text-xs text-blue-600">
                    {isLoadingDashboard
                      ? "Loading"
                      : (dashboardMetrics?.totalHoursWorked?.unit ?? "hours")}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Total Material Used */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Total Material Used
                  </p>
                  {isLoadingDashboard ? (
                    <div className="h-6 flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-green-900">
                      {dashboardMetrics?.totalMaterialUsed?.value ?? 0}
                    </p>
                  )}
                  <p className="text-xs text-green-600">
                    {isLoadingDashboard
                      ? "Loading"
                      : (dashboardMetrics?.totalMaterialUsed?.unit ?? "items")}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Total Labour Entries */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    Total Labour Entries
                  </p>
                  {isLoadingDashboard ? (
                    <div className="h-6 flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-purple-900">
                      {dashboardMetrics?.totalLabourEntries?.value ?? 0}
                    </p>
                  )}
                  <p className="text-xs text-purple-600">
                    {isLoadingDashboard
                      ? "Loading"
                      : (dashboardMetrics?.totalLabourEntries?.unit ??
                        "entries")}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* Number of Invoices */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    Number of Invoices
                  </p>
                  {isLoadingDashboard ? (
                    <div className="h-6 flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-orange-900">
                      {dashboardMetrics?.numberOfInvoices?.value ?? 0}
                    </p>
                  )}
                  <p className="text-xs text-orange-600">
                    {isLoadingDashboard
                      ? "Loading"
                      : (dashboardMetrics?.numberOfInvoices?.unit ??
                        "invoices")}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex justify-between gap-6">
          {/* Left Column - Job Details */}
          {/* Job Details Card */}
          <div className="w-[70%]">
            <Card className="gap-0 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 px-6 py-4 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Details
                </CardTitle>
                <div className="flex items-center gap-3">
                  {!isEditing && hasPermission("jobs", "edit") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setIsLaborSelectionTouched(false);
                        setIsLeadLaborSelectionTouched(false);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCompleteJob}
                    disabled={isSaving || isEditing || editedJob.status === "completed"}
                  >
                    Complete Job
                  </Button>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {showJobDetails ? "Hide Details" : "Show Details"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowJobDetails((prev) => !prev)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showJobDetails ? "bg-[#0EA5E9]" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            showJobDetails ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              {(isEditing || showJobDetails) ? (
                <CardContent className="space-y-6 px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div
                        className={`flex items-center gap-3 ${!isEditing ? "bg-[#f2f0f0] p-3 rounded-md" : ""}`}
                      >
                        {!isEditing && (
                          <Users className="h-4 w-4 text-black-600" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            {" "}
                            {isEditing ? "Job Title" : "Customer / Contractor"}
                          </p>
                          {isEditing ? (
                            <Input
                              value={editedJob.title}
                              onChange={(e) =>
                                setEditedJob({
                                  ...editedJob,
                                  title: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <p className="font-medium">{resolveJobPartyDisplayName()}</p>
                          )}
                        </div>
                      </div>
                      {!isEditing && (
                        <div
                          className={`flex items-center gap-3 ${!isEditing ? "bg-[#dae8ff80] p-3 rounded-md" : ""}`}
                        >
                          <Clock className="h-4 w-4 text-black-600" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Created At</p>
                            {isEditing ? (
                              <Input
                                value={editedJob.startDate}
                                onChange={(e) =>
                                  setEditedJob({
                                    ...editedJob,
                                    startDate: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <p className="font-medium">
                                {editedJob.startDate}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {!isEditing && (
                        <div
                          className={`flex items-center gap-3 ${!isEditing ? "bg-[#bbf7d021] p-3 rounded-md" : ""}`}
                        >
                          <MapPin className="h-4 w-4 text-black-600" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Location</p>
                            <p className="font-medium">{editedJob.location}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* <div className={`flex-1 ${!isEditing ? 'bg-[#dbdaff30] p-3 rounded-md' : ''}`}>
                        <p className="text-sm text-gray-600">Job Type</p>
                        {isEditing ? (
                          <Select
                            value={editedJob.type}
                            onValueChange={(value) => setEditedJob({ ...editedJob, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="service-based">Service-based</SelectItem>
                              <SelectItem value="contract-based">Contract-based</SelectItem>
                            </SelectContent>
                          </Select> 
                        ) : (
                          <p className="font-medium">{editedJob.type}</p>
                        )}
                      </div> */}

                      <div
                        className={`flex-1 ${!isEditing ? "bg-[#dbdaff30] p-3 rounded-md" : ""}`}
                      >
                        <p className="text-sm text-gray-600">Status</p>
                        {isEditing ? (
                          <Select
                            value={editedJob.status}
                            onValueChange={(value) =>
                              setEditedJob({ ...editedJob, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="in_progress">
                                In-Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          // <Input
                          //   value={editedJob.type}
                          //   onChange={(e) => setEditedJob({ ...editedJob, type: e.target.value })}
                          // />
                          <p className="font-medium">{editedJob.status}</p>
                        )}
                      </div>
                      {!isEditing && (
                        <div
                          className={`flex-1 ${!isEditing ? "bg-[#fff7ed8c] p-3 rounded-md" : ""}`}
                        >
                          <p className="text-sm text-gray-600">Job Estimate</p>
                          <p className="font-medium">
                            {formatCurrency(job.estimatedCost)}
                          </p>
                        </div>
                      )}
                      {!isEditing && (
                        <div
                          className={`flex-1 ${!isEditing ? "bg-[#9f6b290d] p-3 rounded-md" : ""}`}
                        >
                          <p className="text-sm text-gray-600">Job Title</p>
                          <span className="inline-block  text-black-600 text-xs font-medium  ">
                            {editedJob.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4"></div>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Location</p>
                        <Autocomplete
                          apiKey={GOOGLE_MAPS_API_KEY}
                          options={ADDRESS_AUTOCOMPLETE_OPTIONS}
                          onPlaceSelected={(place: any) => {
                            if (!place) return;

                            try {
                              const { address: fullAddress, cityZip } =
                                parsePlaceToAddressFields(place);
                              const formattedAddress =
                                resolveFormattedPlaceAddress(place) ||
                                fullAddress;
                              setEditedJob({
                                ...editedJob,
                                location: formattedAddress,
                                // Keep payload address as full selected address
                                address: formattedAddress,
                                cityZip,
                              });
                            } catch (error) {
                              console.error("Error parsing place:", error);
                              const address =
                                resolveFormattedPlaceAddress(place) ||
                                editedJob.location;
                              setEditedJob({
                                ...editedJob,
                                location: address,
                                address,
                              });
                            }
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder={ADDRESS_SEARCH_PLACEHOLDER}
                          defaultValue={editedJob.location}
                          onChange={(e: any) => {
                            setEditedJob({
                              ...editedJob,
                              location: e.target.value,
                              address: e.target.value,
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    {isEditing ? (
                      <Textarea
                        value={editedJob.description}
                        maxLength={30}
                        onChange={(e) =>
                          setEditedJob({
                            ...editedJob,
                            description: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <p className="text-sm bg-gray-100 p-3 rounded-md">
                        {editedJob.description}
                      </p>
                    )}
                  </div>

                  {canAssignLeadLabor && (
                    <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-[#00A1FF]" />
                      Assigned Lead Labour
                    </Label>

                    {isEditing ? (
                      <AutoScrollMultiSelect
                        selectedValues={(() => {
                          const values =
                            editedJob.assignedLeadLabor?.map((labor: any) => {
                              // Handle different data structures
                              if (typeof labor === "string") return labor;
                              if (labor.id) return labor.id.toString();
                              if (labor.user?.id)
                                return labor.user.id.toString();
                              return labor.toString();
                            }) || [];
                          console.log(
                            "Lead Labour selectedValues:",
                            values,
                            "Original data:",
                            editedJob.assignedLeadLabor,
                          );
                          return values;
                        })()}
                        selectedObjects={
                          editedJob.assignedLeadLabor?.map((labor: any) => ({
                            id: labor.id,
                            name:
                              labor.name ||
                              labor.user?.full_name ||
                              labor.labor_code ||
                              `Labour ${labor.id}`,
                            labor_code: labor.labor_code,
                            department: labor.department,
                            specialization: labor.specialization,
                            trade: labor.trade,
                          })) || []
                        }
                        onSelectionChange={(selectedIds, selectedItems) => {
                          console.log("Lead Labour selection changed:", {
                            selectedIds,
                            selectedItems,
                          });
                          const validSelectedItems = selectedItems.filter(
                            (labor: any) => labor !== undefined,
                          );

                          setIsLeadLaborSelectionTouched(true);
                          setEditedJob((prev) => ({
                            ...prev,
                            assignedLeadLabor: validSelectedItems,
                          }));
                        }}
                        placeholder="Select lead labor"
                        fetchData={apiClient.getLeadLabor}
                        displayField="name"
                        valueField="id"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(editedJob.assignedLeadLabor || []).map(
                          (labor: any, index: number) => (
                            <span
                              key={labor.id || `labor-${index}`}
                              className="bg-blue-50 text-blue-700 text-sm px-2 py-1 rounded-md border border-blue-200"
                            >
                              {labor.name ||
                                labor.user?.full_name ||
                                labor.labor_code}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {canAssignLabor && (
                    <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-[#00A1FF]" />
                      Assigned Labour
                    </Label>

                    {isEditing ? (
                      <AutoScrollMultiSelect
                        selectedValues={(() => {
                          const values =
                            editedJob.assignedLabor?.map((labor: any) => {
                              // Handle different data structures
                              if (typeof labor === "string") return labor;
                              if (labor.id) return labor.id.toString();
                              if (labor.user?.id)
                                return labor.user.id.toString();
                              return labor.toString();
                            }) || [];
                          console.log(
                            "Labour selectedValues:",
                            values,
                            "Original data:",
                            editedJob.assignedLabor,
                          );
                          return values;
                        })()}
                        selectedObjects={
                          editedJob.assignedLabor?.map((labor: any) => ({
                            id: labor.id,
                            name:
                              labor.name ||
                              labor.user?.full_name ||
                              labor.labor_code ||
                              `Labour ${labor.id}`,
                            labor_code: labor.labor_code,
                            trade: labor.trade,
                            experience: labor.experience,
                            hourly_rate: labor.hourly_rate,
                          })) || []
                        }
                        onSelectionChange={(selectedIds, selectedItems) => {
                          console.log("Labour selection changed:", {
                            selectedIds,
                            selectedItems,
                          });
                          const validSelectedItems = selectedItems.filter(
                            (labor: any) => labor !== undefined,
                          );

                          setIsLaborSelectionTouched(true);
                          setEditedJob((prev) => ({
                            ...prev,
                            assignedLabor: validSelectedItems,
                          }));
                        }}
                        placeholder="Select labor"
                        fetchData={apiClient.getLabor}
                        displayField="name"
                        valueField="id"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(editedJob.assignedLabor || []).map(
                          (labor: any, index: number) => {
                            return (
                              <span
                                key={labor.id || `labor-${index}`}
                                className="bg-orange-50 text-orange-700 text-sm px-2 py-1 rounded-md border border-orange-200"
                              >
                                {labor.name ||
                                  labor.user?.full_name ||
                                  labor.labor_code}
                              </span>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Assigned Labour Section */}
                  {/* {job.assignedLaborDetails && job.assignedLaborDetails.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Assigned Labour</p>
                    <div className="space-y-2">
                      {job.assignedLaborDetails.map((labor: any, index: number) => (
                        <div key={index} className="bg-gray-100 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{labor.users?.full_name || labor.labor_code}</p>
                              <p className="text-xs text-gray-600">{labor.trade} - {labor.experience}</p>
                              <p className="text-xs text-gray-500">Code: {labor.labor_code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${labor.hourly_rate || 0}/hr</p>
                              <p className="text-xs text-gray-600">{labor.availability}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                  {/* Assigned Lead Labour Section */}
                  {/* {job.assignedLeadLaborDetails && job.assignedLeadLaborDetails.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Lead Labour</p>
                    <div className="space-y-2">
                      {job.assignedLeadLaborDetails.map((leadLabor: any, index: number) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-md border border-blue-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-blue-900">{leadLabor.user?.full_name || leadLabor.labor_code}</p>
                              <p className="text-xs text-blue-700">{leadLabor.department} - {leadLabor.specialization}</p>
                              <p className="text-xs text-blue-600">Code: {leadLabor.labor_code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-blue-900">{leadLabor.trade}</p>
                              <p className="text-xs text-blue-600">{leadLabor.experience}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}
                </CardContent>
              ) : (
                <CardContent className="px-6 py-6">
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3">
                    <div className="flex items-start gap-2.5 rounded-md bg-[#f2f0f0] px-3 py-2.5">
                      <Users className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">
                          Customer / Contractor
                        </p>
                        <p className="truncate text-sm font-medium text-[#2b2b2b]">
                          {resolveJobPartyDisplayName()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-md bg-[#9f6b290d] px-3 py-2.5">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Job title</p>
                        <p className="truncate text-sm font-medium text-[#2b2b2b]">
                          {editedJob.title || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-md bg-[#dbdaff30] px-3 py-2.5">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Status</p>
                        <p className="truncate text-sm font-medium capitalize">
                          {(editedJob.status || "—").replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
              {isEditing && (
                <CardFooter className="border-t border-gray-100 bg-transparent px-6 pt-4 pb-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
          {/* Right Column - Project Summary */}
          <div className="w-[25%]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Project Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {projectSummary ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Job Estimate
                        </span>
                        <span className="font-medium">
                          {formatCurrency(projectSummary.jobEstimate)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Products Cost
                        </span>
                        <span className="font-medium">
                          {formatCurrency(projectSummary.materialsCost)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Labour Cost
                        </span>
                        <span className="font-medium">
                          {formatCurrency(projectSummary.laborCost)}
                        </span>
                      </div>

                      <hr />

                      <div className="flex justify-between">
                        <span className="font-medium">Actual Project Cost</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(projectSummary.actualProjectCost)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="flex items-center justify-center py-16">
                      {" "}
                      <LoadingSpinner />
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Sub-Jobs (change orders) — main job only; listed above Transaction History */}
        {subJobsForTable.length > 0 && (
          <Card className="bg-white shadow-sm border border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-50/50 border-b border-primary/10">
              <CardTitle className="text-primary flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Sub-Jobs
                <Badge variant="secondary" className="ml-1 font-normal">
                  {subJobsForTable.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto rounded-md border border-slate-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-700">
                        Job Title
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 min-w-[140px] max-w-[280px]">
                        Address
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                        Due Date
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 whitespace-nowrap">
                        Est. Cost
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Status
                      </TableHead>
                      {onViewSubJob ? (
                        <TableHead className="w-14 text-center font-semibold text-slate-700 p-2">
                          Action
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subJobsForTable.map((sj: any) => {
                      const addr = subJobAddress(sj);
                      const sid = String(sj.id);
                      const isCurrentSubJob = sid === String(jobId);
                      return (
                        <TableRow key={sid}>
                          <TableCell className="font-medium text-slate-900 max-w-[220px]">
                            {sj.job_title || sj.title || "—"}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {subJobTypeLabel(sj)}
                          </TableCell>
                          <TableCell
                            className="max-w-[280px] text-slate-700 truncate"
                            title={addr || undefined}
                          >
                            {addr || "—"}
                          </TableCell>
                          <TableCell className="text-slate-600 whitespace-nowrap tabular-nums">
                            {sj.due_date || sj.dueDate
                              ? formatDueDateMMDDYYYY(
                                  sj.due_date || sj.dueDate,
                                )
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {formatCurrencyWholeUSD(
                              Number(
                                sj.estimated_cost ??
                                  sj.estimatedCost ??
                                  0,
                              ),
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(sj.status || "")}
                          </TableCell>
                          {onViewSubJob ? (
                            <TableCell className="p-1 text-center w-14">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={isCurrentSubJob}
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 disabled:opacity-40 disabled:pointer-events-none"
                                title={
                                  isCurrentSubJob
                                    ? "Current job"
                                    : "View sub-job details"
                                }
                                aria-label={`View sub-job ${sj.job_title || sj.title || sid}`}
                                onClick={() =>
                                  !isCurrentSubJob && onViewSubJob(sid)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History Section */}
        {hasPermission('invoices', 'view') && (
        <Card className="bg-white shadow-sm border border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-50/50 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Transaction History
              </CardTitle>
              {hasPermission("invoices", "create") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    if (!showInlineInvoiceForm) {
                      // Reset form and auto-fill when opening invoice form
                      setInlineInvoiceData({
                        date: new Date().toISOString().split("T")[0],
                        estimateNumber: "",
                        customerName: job.customerName || "",
                        customerAddress: job.address || "",
                        billToAddress: job.billToAddress || "",
                        billToAddressEnabled: true,
                        poNumber: "",
                        project: job.title || "",
                        rep: "",
                        dueDate: "",
                        paymentCredits: 0,
                        balanceDue: "",
                        lineItems: createDefaultEmptyLineItems(5),
                        notes:
                          "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
                        signatureText: "ACCEPTED BY________________DATE_____",
                        invoiceType: "Estimate",
                        customInvoiceType: "",
                        paymentPercentage: 0,
                        estimateTotal: 0,
                        paymentHistory: [] as any[],
                      });
                      setEditingInvoiceId(null);
                      setInvoiceValidationErrors({});
                    }
                    setShowInlineInvoiceForm(!showInlineInvoiceForm);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {showInlineInvoiceForm ? "Cancel" : "Create Invoice"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Inline Invoice Form - Matches AddInvoiceForm.tsx exactly */}
            {showInlineInvoiceForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <Card className="bg-white shadow-lg border-2 border-primary/20">
                  {/* Invoice Type Selector */}
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Label className="text-primary font-semibold">
                        Invoice Type:
                      </Label>
                      <div className="relative w-[250px]">
                        <Select
                          value={inlineInvoiceData.invoiceType}
                          onValueChange={(value) => {
                            setInlineInvoiceData((prev) => {
                              const nextState = {
                                ...prev,
                                invoiceType: value,
                              };

                              // Only update invoice number prefix in Edit mode.
                              if (editingInvoiceId) {
                                nextState.estimateNumber =
                                  replaceInvoiceNumberPrefix(
                                    prev.estimateNumber,
                                    value,
                                    prev.customInvoiceType,
                                  );
                              }

                              return nextState;
                            });
                          }}
                        >
                          <SelectTrigger className="border-primary/30 focus:border-primary">
                            <SelectValue placeholder="Select invoice type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Estimate">Estimate</SelectItem>
                            <SelectItem value="Downpayment Invoice">
                              Downpayment Invoice
                            </SelectItem>
                            <SelectItem value="Rough Invoice">
                              Rough Invoice
                            </SelectItem>
                            <SelectItem value="Progressive Invoice">
                              Progressive Invoice
                            </SelectItem>
                            <SelectItem value="Final Invoice">
                              Final Invoice
                            </SelectItem>
                            {customInvoiceTypes.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-b">
                                  Custom Types
                                </div>
                                {cleanCustomTypes(customInvoiceTypes).map(
                                  (customType, index) => (
                                    <SelectItem key={index} value={customType}>
                                      {customType}
                                    </SelectItem>
                                  ),
                                )}
                              </>
                            )}
                            <SelectItem value="Custom">+ Add Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {inlineInvoiceData.invoiceType === "Custom" && (
                        <div className="relative w-[300px]">
                          <Input
                            value={inlineInvoiceData.customInvoiceType}
                            onChange={(e) => {
                              const nextCustomInvoiceType = e.target.value;
                              setInlineInvoiceData((prev) => {
                                const nextState = {
                                  ...prev,
                                  customInvoiceType: nextCustomInvoiceType,
                                };

                                // Only update invoice number when the selected type is Custom.
                                if (
                                  editingInvoiceId &&
                                  prev.invoiceType === "Custom"
                                ) {
                                  nextState.estimateNumber =
                                    replaceInvoiceNumberPrefix(
                                      prev.estimateNumber,
                                      "Custom",
                                      nextCustomInvoiceType,
                                    );
                                }

                                return nextState;
                              });
                            }}
                            onBlur={() => {
                              if (inlineInvoiceData.customInvoiceType) {
                                addCustomInvoiceType(
                                  inlineInvoiceData.customInvoiceType,
                                );
                              }
                            }}
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
                        {/* <p className="text-sm font-semibold mt-2">952-449-1088</p> */}
                      </div>

                      <div className="text-right">
                        <h1 className="text-2xl font-bold mb-4">
                          {inlineInvoiceData.invoiceType === "Custom"
                            ? inlineInvoiceData.customInvoiceType
                            : inlineInvoiceData.invoiceType}
                        </h1>
                        <div className="grid grid-cols-2 gap-2">
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
                          />
                          {/* Invoice Number - Only show when editing */}
                          {editingInvoiceId && (
                            <>
                              <Label className="text-right bg-gray-600 text-white px-3 py-2 text-sm font-semibold">
                                {inlineInvoiceData.invoiceType === "Estimate"
                                  ? "Estimate #"
                                  : "Invoice #"}
                              </Label>
                              <div>
                                <Input
                                  value={inlineInvoiceData.estimateNumber}
                                  onChange={(e) => {
                                    setInlineInvoiceData((prev) => ({
                                      ...prev,
                                      estimateNumber: e.target.value,
                                    }));
                                  }}
                                  className="px-3 py-2 text-sm"
                                  disabled={true}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
                                billToAddressEnabled:
                                  !prev.billToAddressEnabled,
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
                            This address defaults to the customer/supplier
                            address but can be changed if billing address
                            differs from job location
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Customer Information */}

                    <div className="mb-6">
                      <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">
                        {job.type === "contract-based"
                          ? "Contractor Name / Address"
                          : "Customer Name / Address"}
                      </Label>
                      <div className="border border-gray-300 p-4 min-h-[120px]">
                        <Input
                          value={
                            job.type === "contract-based"
                              ? contractorData?.name ||
                                contractorData?.contractor_name ||
                                inlineInvoiceData.customerName
                              : customerData?.name ||
                                customerData?.customer_name ||
                                inlineInvoiceData.customerName
                          }
                          onChange={(e) =>
                            setInlineInvoiceData((prev) => ({
                              ...prev,
                              customerName: e.target.value,
                            }))
                          }
                          className="mb-2 border-0 p-0 focus-visible:ring-0"
                          placeholder={
                            job.type === "contract-based"
                              ? "Contractor Name"
                              : "Customer Name"
                          }
                          readOnly
                        />
                        <Textarea
                          key={`customer-address-${inlineInvoiceData.customerAddress}`}
                          value={
                            job.type === "contract-based"
                              ? contractorData?.address ||
                                contractorData?.contractor_address ||
                                inlineInvoiceData.customerAddress
                              : inlineInvoiceData.customerAddress
                          }
                          onChange={(e) => {
                            setInlineInvoiceData((prev) => ({
                              ...prev,
                              customerAddress: e.target.value,
                            }));
                          }}
                          className="border-0 p-0 resize-none focus-visible:ring-0"
                          rows={3}
                          placeholder={
                            job.type === "contract-based"
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
                          />
                        </div>
                        <Input
                          value={inlineInvoiceData.project}
                          onChange={(e) =>
                            setInlineInvoiceData((prev) => ({
                              ...prev,
                              project: e.target.value,
                            }))
                          }
                          className="px-3 py-2 text-sm rounded-none border-t-0"
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
                        />
                      </div>
                    </div>

                    {/* Line Items Table */}
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
                      isJobDetail={true}
                      selectedSupplierId={selectedSupplierId}
                      fetchProducts={fetchProducts}
                      getFilteredProducts={getFilteredProducts}
                      onSelectProductData={(rowId, product) => {
                        // optional: agar existing autofill logic already hai
                        selectProduct(rowId, product);
                      }}
                    />

                    {/* Notes (editable; synced to estimate notes/description on save/preview) */}
                    <div className="mb-6 overflow-x-auto">
                      <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">
                        NOTES
                      </Label>
                      <div className="border border-t-0 border-gray-300 p-3 bg-white">
                        <Textarea
                          value={inlineInvoiceData.notes}
                          onChange={(e) => {
                            const v = e.target.value;
                            invoiceNotesRef.current = v;
                            setInlineInvoiceData((prev) => ({
                              ...prev,
                              notes: v,
                            }));
                          }}
                          className="w-full min-h-[84px] border-0 p-0 focus-visible:ring-0 resize-none text-sm"
                          placeholder={
                            "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE"
                          }
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Footer disclaimer and Total */}
                    <div className="mb-6">
                      <div className="border border-gray-300 p-3 text-xs text-center bg-white">
                        <p>
                          JDP is not responsible for repair of lamps &
                          landscaping, house owner utilities including cables,
                          sprinkler systems, television or telephone cables,
                          etc. that may be cut or damaged during installation.
                          Price are subject to change prior to receipt of down
                          payment.
                        </p>
                      </div>
                      <div className="flex justify-end mt-4">
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold">Total</span>
                            <span className="text-2xl font-bold">
                              $
                              {calculateInvoiceSubtotal().toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center text-sm text-blue-500 font-bold">
                        <p>
                          1432 Oakpointe Drive Waconia, MN 55387
                          paul@jdpelectric.us
                        </p>
                      </div>
                    </div>
                    {inlineInvoiceData.invoiceType === "Estimate" && (
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
                          <div className="text-sm font-medium text-gray-700">
                            Date
                          </div>
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
                            <div className="text-xs text-gray-700 text-center">
                              Date
                            </div>
                          </div>
                        </div>

                        {/* Disclaimer Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-5">
                          <div className="text-xs text-gray-700 leading-relaxed">
                            By signing above, you agree to the terms and pricing
                            outlined in this estimate. This becomes a binding
                            agreement upon signature.
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t bg-gray-50 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowInlineInvoiceForm(false);
                          setEditingInvoiceId(null);
                          setInvoiceValidationErrors({});

                          // Reset form data
                          setInlineInvoiceData({
                            date: new Date().toISOString().split("T")[0],
                            estimateNumber: "",
                            customerName: job.customerName || "",
                            customerAddress: job.address || "",
                            billToAddress: job.billToAddress || "",
                            billToAddressEnabled: true,
                            poNumber: "",
                            project: job.title || "",
                            rep: "",
                            dueDate: "",
                            paymentCredits: 0,
                            balanceDue: "",
                            lineItems: [],
                            notes:
                              "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
                            signatureText:
                              "ACCEPTED BY________________DATE_____",
                            invoiceType: "Estimate",
                            customInvoiceType: "",
                            paymentPercentage: 0,
                            estimateTotal: 0,
                            paymentHistory: [] as any[],
                          });
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
                            disabled={isLoadingDraft || isLoadingPreview}
                          >
                            {isLoadingDraft ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <FileText className="h-5 w-5 mr-2" />
                                Save as Draft
                              </>
                            )}
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
                            disabled={isLoadingPreview || isLoadingDraft}
                          >
                            {isLoadingPreview ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <Eye className="h-5 w-5 mr-2" />
                                Preview & Send to Customer
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <div className="space-y-4">
              {isLoadingEstimates ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : estimates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices found for this job</p>
                </div>
              ) : (
                estimates.map((invoice: any) => {
                  const sentDeliveryTag = getSentDeliveryTag(invoice);
                  return (
                  <div
                    key={invoice.id}
                    id={`estimate-row-${invoice.id}`}
                    className={`p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow bg-gradient-to-r from-white to-gray-50/30 ${
                      highlightEstimateId &&
                      invoice?.id?.toString?.() === highlightEstimateId
                        ? "shadow-[0px_5px_15px_rgba(22,205,255,0.35)] scale-[1.009]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground capitalize">
                              {invoice.invoice_type || "Estimate"}
                            </h4>
                            <Badge
                              className={`${getInvoiceTypeColor(invoice.invoice_type)} text-xs font-medium capitalize`}
                              variant="outline"
                            >
                              {invoice.invoice_type || "Estimate"}
                            </Badge>
                            {sentDeliveryTag && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-medium leading-tight ${sentDeliveryTag.className}`}
                              >
                                {sentDeliveryTag.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {invoice.description || invoice.estimate_title}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>#{invoice.invoice_number}</span>
                            <span>
                              Created :{" "}
                              {formatDate(
                                invoice.estimate_date || invoice.created_at,
                              )}
                            </span>
                            <span>
                              Updated :{" "}
                              {formatDate(
                                invoice.updated_at || invoice.updated_at,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-lg text-foreground">
                            {formatCurrency(invoice.total_amount || 0)}
                          </p>
                          <Badge
                            className={`mt-1 ${getStatusBadgeColor(invoice.status)}`}
                            variant="outline"
                          >
                            {invoice.status || "draft"}
                          </Badge>
                        </div>
                        {/* {String(invoice.invoice_type || "").toLowerCase() !==
                          "estimate" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMarkAsPaidDialog(invoice)}
                            disabled={
                              isMarkingPaidId === invoice.id ||
                              String(invoice.status || "").toLowerCase() ===
                                "paid"
                            }
                            className={`${
                              String(invoice.status || "").toLowerCase() ===
                              "paid"
                                ? "opacity-60 cursor-default"
                                : ""
                            }`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            {String(invoice.status || "").toLowerCase() === "paid"
                              ? "Already Paid"
                              : isMarkingPaidId === invoice.id
                                ? "Marking..."
                                : "Mark As Paid"}
                          </Button>
                        )} */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {invoice.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => handleEditInvoice(invoice)}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2 text-orange-600" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleViewInvoice(invoice)}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2 text-primary" />
                              <span>View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePrintInvoice(invoice)}
                              className="cursor-pointer"
                            >
                              <Printer className="h-4 w-4 mr-2 text-blue-600" />
                              <span>Print</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateInvoice(invoice)}
                              className="cursor-pointer"
                            >
                              <FileText className="h-4 w-4 mr-2 text-green-600" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            {String(invoice.invoice_type || "").toLowerCase() !==
                              "estimate" && (
                              <DropdownMenuItem
                                onClick={() => openMarkAsPaidDialog(invoice)}
                                className={`cursor-pointer ${
                                  String(invoice.status || "").toLowerCase() ===
                                  "paid"
                                    ? "opacity-60 cursor-default"
                                    : ""
                                }`}
                                disabled={
                                  isMarkingPaidId === invoice.id ||
                                  String(invoice.status || "").toLowerCase() ===
                                    "paid"
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                <span>
                                  {String(invoice.status || "").toLowerCase() ===
                                  "paid"
                                    ? "Already Paid"
                                    : isMarkingPaidId === invoice.id
                                      ? "Marking..."
                                      : "Mark As Paid"}
                                </span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                const currentStatus = String(
                                  invoice.status || "",
                                ).toLowerCase();
                                if (currentStatus !== "approved") {
                                  handleApproveInvoice(invoice);
                                }
                              }}
                              className={`cursor-pointer ${
                                String(invoice.status || "").toLowerCase() ===
                                "approved"
                                  ? "opacity-60 cursor-default"
                                  : ""
                              }`}
                              disabled={
                                isApprovingId === invoice.id ||
                                String(invoice.status || "").toLowerCase() ===
                                  "approved"
                              }
                            >
                              <Check className="h-4 w-4 mr-2 text-green-600" />
                              <span>
                                {String(invoice.status || "").toLowerCase() ===
                                "approved"
                                  ? "Already Approved"
                                  : isApprovingId === invoice.id
                                    ? "Approving..."
                                    : "Approve"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
            {totalEstimates > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalEstimates)} of{" "}
                  {totalEstimates} invoices
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1 || isLoadingEstimates}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of{" "}
                    {Math.ceil(totalEstimates / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={
                      currentPage >= Math.ceil(totalEstimates / itemsPerPage) ||
                      isLoadingEstimates
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Bluesheets Data */}
        {hasPermission('bluesheet', 'view') && (<>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bluesheets Data
            </CardTitle>
            <div className="flex items-center gap-3">
              {selectedBluesheetIds.length > 0 && (
                <p className="text-xs text-gray-600">
                  {selectedBluesheetIds.length} selected
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={selectedBluesheetIds.length === 0}
                className="gap-2"
                onClick={() => {
                  const selectedSheets = bluesheets.filter((s: any) =>
                    selectedBluesheetIds.includes(s.id),
                  );
                  if (selectedSheets.length === 0) return;

                  // If any selected sheet is already invoiced, show confirmation first
                  const hasInvoiced = selectedSheets.some(
                    (s: any) => s.materials_invoiced,
                  );
                  if (hasInvoiced) {
                    setPendingReviewSheets(selectedSheets);
                    setShowReinvoiceAlert(true);
                    return;
                  }

                  const firstSheet = selectedSheets[0];
                  const mergedMaterials = selectedSheets.flatMap((sheet: any) =>
                    (sheet.material_entries ?? []).map((m: any) => ({
                      ...m,
                      // preserve or attach source bluesheet id so the dialog can show correct BS-XX
                      job_bluesheet_id:
                        m.job_bluesheet_id ??
                        m.bluesheet_id ??
                        m.bluesheetId ??
                        sheet.id,
                    })),
                  );
                  const mergedLabor = selectedSheets.flatMap(
                    (sheet: any) => sheet.labor_entries ?? [],
                  );
                  const mergedTotalCost = selectedSheets.reduce(
                    (sum: number, sheet: any) => sum + (sheet.total_cost ?? 0),
                    0,
                  );
                  const mergedNotes = selectedSheets
                    .map((sheet: any) => sheet.notes)
                    .filter(Boolean)
                    .join(" | ");

                  const dialogSheet: DialogBlueSheetItem = {
                    ...(firstSheet as any),
                    id: firstSheet.id ?? firstSheet.latest_bluesheet_id ?? 0,
                    date:
                      firstSheet.date ?? firstSheet.latest_bluesheet_date ?? "",
                    notes: mergedNotes || firstSheet.notes || "",
                    additional_charges: selectedSheets.reduce(
                      (sum: number, s: any) =>
                        sum + (s.additional_charges ?? 0),
                      0,
                    ),
                    total_cost: mergedTotalCost,
                    labor_entries: mergedLabor,
                    material_entries: mergedMaterials,
                    total_labor_hours: firstSheet.total_labor_hours ?? null,
                  };

                  setSelectedBlueSheetForReview(dialogSheet);
                  setIsBlueSheetDialogOpen(true);
                }}
              >
                Review Selected
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingBluesheets ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <LoadingSpinner />
                <p className="mt-3 text-sm text-gray-500">
                  Loading bluesheets...
                </p>
              </div>
            ) : Array.isArray(bluesheets) && bluesheets.length > 0 ? (
              <div className="space-y-3">
                {bluesheets.map((sheet: any) => (
                  <div
                    key={sheet.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedBluesheetIds.includes(sheet.id)}
                        onCheckedChange={(checked) => {
                          setSelectedBluesheetIds((prev) =>
                            checked
                              ? [...prev, sheet.id]
                              : prev.filter((id) => id !== sheet.id),
                          );
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            Bluesheet #{sheet.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              sheet.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {sheet.status === "approved"
                              ? "Approved"
                              : "Pending"}
                          </span>
                          {sheet.materials_invoiced === true && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                              Invoiced
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Date: {sheet.date || sheet.created_at || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // If this sheet is already invoiced, show confirmation alert first
                          if (sheet.materials_invoiced) {
                            setPendingReviewSheets([sheet]);
                            setShowReinvoiceAlert(true);
                            return;
                          }
                          setSelectedBlueSheetForReview(
                            sheet as DialogBlueSheetItem,
                          );
                          setIsBlueSheetDialogOpen(true);
                        }}
                      >
                        Review &amp; Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-gray-500">
                  No bluesheets found for this job.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <AlertDialog
          open={showReinvoiceAlert}
          onOpenChange={setShowReinvoiceAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Invoice already submitted</AlertDialogTitle>
              <AlertDialogDescription>
                One or more selected BlueSheets are already marked as invoiced.
                Are you sure you want to review and invoice these BlueSheets
                again?
                {pendingReviewSheets && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pendingReviewSheets
                      .filter((b: any) => b.materials_invoiced)
                      .map((b: any) => (
                        <Badge
                          key={b.id}
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          BS-{b.id} — {b.job?.job_title || job.job_title}
                        </Badge>
                      ))}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowReinvoiceAlert(false);
                  setPendingReviewSheets(null);
                }}
              >
                No
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingReviewSheets && pendingReviewSheets.length > 0) {
                    const selectedSheets = pendingReviewSheets;
                    const firstSheet = selectedSheets[0];
                    const mergedMaterials = selectedSheets.flatMap(
                      (sheet: any) =>
                        (sheet.material_entries ?? []).map((m: any) => ({
                          ...m,
                          job_bluesheet_id:
                            m.job_bluesheet_id ??
                            m.bluesheet_id ??
                            m.bluesheetId ??
                            sheet.id,
                        })),
                    );
                    const mergedLabor = selectedSheets.flatMap(
                      (sheet: any) => sheet.labor_entries ?? [],
                    );
                    const mergedTotalCost = selectedSheets.reduce(
                      (sum: number, sheet: any) =>
                        sum + (sheet.total_cost ?? 0),
                      0,
                    );
                    const mergedNotes = selectedSheets
                      .map((sheet: any) => sheet.notes)
                      .filter(Boolean)
                      .join(" | ");

                    const dialogSheet: DialogBlueSheetItem = {
                      ...(firstSheet as any),
                      id: firstSheet.id ?? firstSheet.latest_bluesheet_id ?? 0,
                      date:
                        firstSheet.date ??
                        firstSheet.latest_bluesheet_date ??
                        "",
                      notes: mergedNotes || firstSheet.notes || "",
                      additional_charges: selectedSheets.reduce(
                        (sum: number, s: any) =>
                          sum + (s.additional_charges ?? 0),
                        0,
                      ),
                      total_cost: mergedTotalCost,
                      labor_entries: mergedLabor,
                      material_entries: mergedMaterials,
                      total_labor_hours: firstSheet.total_labor_hours ?? null,
                    };

                    setSelectedBlueSheetForReview(dialogSheet);
                    setIsBlueSheetDialogOpen(true);
                  }
                  setShowReinvoiceAlert(false);
                  setPendingReviewSheets(null);
                }}
              >
                Yes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </>)}
        {/* Material Usage */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Usage
            </CardTitle>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddMaterialModal(true)}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMaterials ? (
              <p className="flex items-center justify-center py-16"> <LoadingSpinner /></p>
            ) : (() => {
              const approvedIds = Array.isArray(bluesheets)
                ? bluesheets.filter((b: any) => b?.status === 'approved').map((b: any) => b.id)
                : []
              const filteredMaterials = Array.isArray(materials)
                ? materials.filter((m: any) => approvedIds.includes(m?.bluesheet_id))
                : []
              if (filteredMaterials.length === 0) {
                return <p className="text-sm text-gray-500">No approved bluesheet materials found.</p>
              }
              return (
                <div className="space-y-4">
                  {filteredMaterials.map((material: any, index: number) => (
                    <div key={material.id ?? material.sku ?? index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-green-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{material.material_name || material.product_name || material.name}</h4>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Bluesheet #{material.bluesheet_id}
                            </span>
                          </div>
                         
                          <p className="text-xs text-gray-500">
                            Unit Cost: ${material.unit_cost || 0}
                          </p>
                          {material.bluesheet_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Date: {material.bluesheet_date}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            $ {material.jdp_price || 0}

                          </p>

                          <p className="text-sm text-gray-600">  {material.unit}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                          setProductToDelete(material);
                          setShowDeleteProductDialog(true);
                        }}>
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardContent>

        </Card> */}

        {/* Labour & Time Logs */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Labour & Time Logs
            </CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Total Hours: <span className="font-bold"> {(() => {
                  let totalSeconds = 0; 
                  const approvedBluesheets = bluesheets.filter((b: any) => b.status === 'approved');

                  approvedBluesheets.forEach((bluesheet: any) => {
                    if (bluesheet.labor_entries && Array.isArray(bluesheet.labor_entries)) {
                      bluesheet.labor_entries.forEach((entry: any) => {
                        const timeString = entry.regular_hours || '0h';

                        // Handle different time formats
                        if (timeString.includes(':')) {
                          // Format: HH:MM:SS or HH:MM
                          const parts = timeString.split(':');
                          const hours = parseInt(parts[0]) || 0;
                          const minutes = parseInt(parts[1]) || 0;
                          const seconds = parts.length > 2 ? (parseInt(parts[2]) || 0) : 0;
                          totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
                        } else if (timeString.includes('h')) {
                          // Format: Xh, XhYm, optionally XhYmZs
                          const hMatch = timeString.match(/(\d+(?:\.\d+)?)h/);
                          const mMatch = timeString.match(/(\d+)m/);
                          const sMatch = timeString.match(/(\d+)s/);
                          const hours = hMatch ? parseFloat(hMatch[1]) : 0;
                          const minutes = mMatch ? parseInt(mMatch[1]) : 0;
                          const seconds = sMatch ? parseInt(sMatch[1]) : 0;
                          totalSeconds += Math.round(hours * 3600) + (minutes * 60) + seconds;
                        } else if (timeString && !isNaN(parseFloat(timeString))) {
                          // Just a number (assume hours)
                          totalSeconds += Math.round(parseFloat(timeString) * 3600);
                        }
                      });
                    }
                  });

                  // If no time, show 0h
                  if (totalSeconds === 0) {
                    return '0h';
                  }

                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  const seconds = Math.floor(totalSeconds % 60);

                  let result = '';
                  if (hours > 0) result += `${hours}h`;
                  if (minutes > 0) result += `${minutes}m`;
                  if (seconds > 0) result += `${seconds}s`;

                  // Ensure at least minutes show if hours exist but minutes are zero
                  if (result === '' && hours > 0) result = `${hours}h`;
                  return result || '0h';
                })()} </span>
              </span>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCreateTimeLog}>
                <Plus className="h-4 w-4" />
                Add Time Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4"> 
              {bluesheets && bluesheets.filter((b: any) => b.status === 'approved').length > 0 && (
                <>
                  {bluesheets.filter((bluesheet: any) => bluesheet.status === 'approved').map((bluesheet: any, bluesheetIndex: number) => (
                    <div key={`bluesheet-${bluesheet.id}`} className="mb-6 ">
                      

                      {bluesheet.labor_entries && bluesheet.labor_entries.length > 0 && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                          {bluesheet.labor_entries.map((entry: any, entryIndex: number) => (
                            <div key={`entry-${entry.id}`} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-700" />
                                </div>
                                <div>
                                  <h6 className="font-medium">
                                    {entry.role === 'lead_labor' ? 'Lead Labour' : 'Labour'}
                                  </h6>
                                  <p className="text-sm text-gray-600">
                                    {entry.employee_name || entry.labor?.users?.full_name || entry.lead_labor?.users?.full_name || 'Unknown Labour'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Code: {entry.labor?.labor_code || entry.lead_labor?.labor_code || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">
                                    Regular: {entry.regular_hours || '0h'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Hourly Rate: ${entry.hourly_rate || 0}/hr
                                  </p>
                                  <p className="font-semibold">
                                    Total Cost: ${entry.total_cost || 0}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.role === 'lead_labor'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {entry.role === 'lead_labor' ? 'Lead' : 'Labour'}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => handleViewTimeLog(entry)}
                                  >
                                    <Eye className="h-3 w-3" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => handleEditTimeLog(entry)}
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ))}

                </>
              )}
 
              {(!bluesheets || bluesheets.filter((b: any) => b.status === 'approved').length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No approved bluesheet labor entries found</p>
                </div>
              )}


            </div>
          </CardContent>
        </Card> */}

        {/* Job Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Documents
            </CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Total: {jobDocuments.length} document
                {jobDocuments.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDocumentModal(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingDocuments ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <LoadingSpinner />
                <p className="mt-3 text-sm text-muted-foreground">
                  Loading documents...
                </p>
              </div>
            ) : jobDocuments.length === 0 ? (
              // Empty State
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">No documents uploaded yet</p>
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDocumentModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Upload First Document
                </Button>
              </div>
            ) : (
              // Documents List
              <div className="space-y-3">
                {jobDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <File className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDocumentTimestamp(doc.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!doc.fileUrl) {
                            toast.error("Document URL not available");
                            return;
                          }
                          window.open(doc.fileUrl, "_blank");
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                        disabled={downloadingDocumentIds.includes(doc.id)}
                        className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <Download
                          className={`h-4 w-4 ${downloadingDocumentIds.includes(doc.id) ? "animate-spin" : ""}`}
                        />
                        {downloadingDocumentIds.includes(doc.id)
                          ? "Downloading..."
                          : "Download"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingDocumentIds.includes(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2
                          className={`h-4 w-4 ${deletingDocumentIds.includes(doc.id) ? "animate-pulse" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Document Modal */}
      <Dialog
        open={showUploadDocumentModal}
        onOpenChange={(open) => {
          setShowUploadDocumentModal(open);
          if (!open) {
            resetDocumentUploadForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Job Document</DialogTitle>
            <DialogDescription>
              Upload a document related to this job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-title">Document Title</Label>
              <Input
                id="document-title"
                placeholder="e.g., Project Blueprint, Safety Certificate, etc."
                value={documentFormData.title}
                onChange={(e) =>
                  setDocumentFormData({
                    ...documentFormData,
                    title: e.target.value,
                  })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="document-file">Select File</Label>
              <div
                className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => documentFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add(
                    "border-blue-500",
                    "bg-blue-50",
                  );
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove(
                    "border-blue-500",
                    "bg-blue-50",
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove(
                    "border-blue-500",
                    "bg-blue-50",
                  );
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    setDocumentFormData((prev) => ({ ...prev, file }));
                  }
                }}
              >
                <UploadCloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-gray-600 mb-2">
                  {documentFormData.file
                    ? "Click to change file or drag and drop"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, or any other file type
                </p>
              </div>
              <input
                ref={documentFileInputRef}
                id="document-file"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDocumentFormData((prev) => ({ ...prev, file }));
                  }
                }}
              />
              {documentFormData.file ? (
                <div className="mt-4 rounded-lg border border-border bg-muted/40 overflow-hidden">
                  {documentFilePreviewUrl ? (
                    <div className="p-4 bg-background">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Preview
                      </p>
                      <div className="flex justify-center rounded-md border bg-white p-2">
                        <img
                          src={documentFilePreviewUrl}
                          alt=""
                          className="max-h-52 max-w-full rounded object-contain"
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground truncate text-center">
                        {documentFormData.file.name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 p-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm">
                        <FileText className="h-7 w-7 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 text-left space-y-1">
                        <p className="text-sm font-semibold text-foreground break-all">
                          {documentFormData.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(documentFormData.file.size / 1024).toFixed(1)} KB
                          {documentFormData.file.type
                            ? ` · ${documentFormData.file.type}`
                            : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Preview not available for this file type. It will
                          upload as selected.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDocumentModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={isUploadingDocument}
              className="gap-2 text-white"
            >
              <Upload className="h-4 w-4" />
              {isUploadingDocument ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Modal */}
      {/* <NewInvoiceDialog
        renderInline={true}
        open={showNewInvoiceDialog}
        onOpenChange={setShowNewInvoiceDialog}
        onSave={handleSaveInvoice}
        jobId={Number(jobId)}
        jobs={jobs}
        onInvoiceSaved={triggerRefresh}
      /> */}
      {/* <Dialog open={showAddInvoiceModal} onOpenChange={setShowAddInvoiceModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className='mb-2'>Invoice Type</Label>
                <Select
                  value={invoiceFormData.type}
                  onValueChange={(value) => setInvoiceFormData({ ...invoiceFormData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estimate">Estimate</SelectItem>
                    <SelectItem value="Proposal Invoice">Proposal Invoice</SelectItem>
                    <SelectItem value="Progressive Invoice">Progressive Invoice</SelectItem>
                    <SelectItem value="Final Invoice">Final Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className='mb-2'>Amount</Label>
                <Input
                  type="number"
                  value={invoiceFormData.amount}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label className='mb-2'>Due Date</Label>
              <Input
                type="date"
                value={invoiceFormData.dueDate}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
              />
            </div>

            <div>
              <Label className='mb-2'>Description</Label>
              <Textarea
                value={invoiceFormData.description}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInvoiceModal(false)}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              // Save logic here
              setShowAddInvoiceModal(false);
            }}>
              Add Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Add Material Modal */}
      <Dialog
        open={showAddMaterialModal}
        onOpenChange={(open) => {
          setShowAddMaterialModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Products to Job</DialogTitle>
            <DialogDescription>
              Select multiple products to add to this job
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product Search */}
            <div>
              <Label className="mb-2">Search and Add Products</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={productSearchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setProductSearchQuery(e.target.value);
                        searchProducts(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      placeholder="Type to search products..."
                      className={`pr-10 ${materialErrors.product ? "border-red-500" : ""}`}
                    />
                    {isSearchingProducts && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Results Dropdown */}
                {showProductDropdown && productSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                    {productSearchResults.map((product: Product) => {
                      const isSelected = selectedProducts.some(
                        (p) => p.id === product.id,
                      );
                      return (
                        <div
                          key={product.id}
                          className={`p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                            isSelected ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">
                                {product.product_name || product.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                SKU:{" "}
                                {product.sku || product.supplier_sku || "N/A"} •
                                Unit: {product.unit || "N/A"} • Cost: $
                                {product.unit_cost || product.price || 0} •
                                Stock: {product.stock_quantity || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {materialErrors.product && (
                <p className="text-xs text-red-600 mt-1">
                  {materialErrors.product}
                </p>
              )}
            </div>

            {/* Selected Products List */}
            {selectedProducts.length > 0 && (
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">
                    Selected Products ({selectedProducts.length})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProducts([]);
                      setProductQuantities({});
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>

                <div className=" max-h-80 overflow-y-auto grid grid-cols-2 gap-3">
                  {selectedProducts.map((product: Product) => (
                    <div key={product.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">
                            {product.product_name || product.name}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            (SKU: {product.sku || product.supplier_sku || "N/A"}
                            )
                          </span>
                        </div>
                        <button
                          onClick={() => removeSelectedProduct(product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-xs">Unit Cost</Label>
                          <div className="font-medium">
                            ${product.unit_cost || product.price || 0}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Available Stock</Label>
                          <div className="font-medium">
                            {product.stock_quantity || 0}{" "}
                            {product.unit || "units"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-2">Total Ordered</Label>
                          <Input
                            type="number"
                            value={
                              productQuantities[product.id]?.total_ordered || ""
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              handleQuantityChange(
                                product.id,
                                "total_ordered",
                                e.target.value,
                              )
                            }
                            placeholder="Qty"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-2">Material Used</Label>
                          <Input
                            type="number"
                            value={
                              productQuantities[product.id]?.material_used || ""
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              handleQuantityChange(
                                product.id,
                                "material_used",
                                e.target.value,
                              )
                            }
                            placeholder="Used"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Return to Warehouse Checkbox for each product */}
                      {productQuantities[product.id]?.total_ordered !==
                        productQuantities[product.id]?.material_used && (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`return_${product.id}`}
                            checked={
                              productQuantities[product.id]
                                ?.return_to_warehouse || false
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              handleQuantityChange(
                                product.id,
                                "return_to_warehouse",
                                e.target.checked,
                              )
                            }
                            className="rounded border-gray-300"
                          />
                          <Label
                            htmlFor={`return_${product.id}`}
                            className="text-xs"
                          >
                            Return to Warehouse
                          </Label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Date for all products */}
            <div>
              <Label className="mb-2">Date for All Products</Label>
              <Input
                type="date"
                value={materialFormData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaterialFormData({
                    ...materialFormData,
                    date: e.target.value,
                  })
                }
                className={materialErrors.date ? "border-red-500" : ""}
              />
              {materialErrors.date && (
                <p className="text-xs text-red-600 mt-1">
                  {materialErrors.date}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowAddMaterialModal(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAddMultipleProducts}
              disabled={isLoading || selectedProducts.length === 0}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Adding...
                </div>
              ) : (
                `Add ${selectedProducts.length} Product${selectedProducts.length > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Time Log Modal */}
      <Dialog open={showTimeLogModal} onOpenChange={setShowTimeLogModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {timeLogModalMode === "create" && "Add Labour Time Log"}
              {timeLogModalMode === "edit" && "Edit Labour Time Log"}
              {timeLogModalMode === "view" && "View Labour Time Log"}
            </DialogTitle>
            <DialogDescription>
              {timeLogModalMode === "create" &&
                "Add a new labor time entry for this job"}
              {timeLogModalMode === "edit" && "Edit the labor time entry"}
              {timeLogModalMode === "view" &&
                "View the labor time entry details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {/* Labour Selection */}
              <div className="labor-dropdown">
                <Label className="mb-2">Select Labour *</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search and select labor..."
                    value={laborInputValue}
                    onChange={(e) => {
                      const searchQuery = e.target.value;
                      setLaborInputValue(searchQuery);

                      if (searchQuery === "") {
                        setTimeLogFormData({
                          ...timeLogFormData,
                          selectedLabor: null,
                        });
                        setShowLaborDropdown(false);
                      } else {
                        // Trigger search when user types
                        searchLabor(searchQuery);
                      }
                    }}
                    onFocus={() => setShowLaborDropdown(true)}
                    disabled={
                      timeLogModalMode === "view" ||
                      !!timeLogFormData.selectedLeadLabor
                    }
                  />
                  {showLaborDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingLabor ? (
                        <div className="flex items-center justify-center p-4">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <>
                          {laborSearchResults.map((labor: any) => (
                            <div
                              key={labor.id}
                              className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setTimeLogFormData({
                                  ...timeLogFormData,
                                  selectedLabor: labor,
                                  selectedLeadLabor: null, // Disable lead labor when labor is selected
                                });
                                setLaborInputValue(
                                  labor.users?.full_name || labor.labor_code,
                                );
                                setShowLaborDropdown(false);
                              }}
                            >
                              <span className="text-sm font-medium">
                                {labor.users?.full_name || labor.labor_code} -{" "}
                                {labor.labor_code}
                              </span>
                            </div>
                          ))}
                          {laborSearchResults.length === 0 && (
                            <div className="text-center text-sm text-gray-500 p-2">
                              No labor found
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {timeLogValidationErrors.laborSelection && (
                  <p className="text-red-500 text-xs mt-1">
                    {timeLogValidationErrors.laborSelection}
                  </p>
                )}
              </div>

              {/* Lead Labour Selection */}
              <div className="lead-labor-dropdown">
                <Label className="mb-2">Select Lead Labour *</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search and select lead labor..."
                    value={leadLaborInputValue}
                    onChange={(e) => {
                      const searchQuery = e.target.value;
                      setLeadLaborInputValue(searchQuery);

                      if (searchQuery === "") {
                        setTimeLogFormData({
                          ...timeLogFormData,
                          selectedLeadLabor: null,
                        });
                        setShowLeadLaborDropdown(false);
                      } else {
                        // Trigger search when user types
                        searchLeadLabor(searchQuery);
                      }
                    }}
                    onFocus={() => setShowLeadLaborDropdown(true)}
                    disabled={
                      timeLogModalMode === "view" ||
                      !!timeLogFormData.selectedLabor
                    }
                  />
                  {showLeadLaborDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingLeadLabor ? (
                        <div className="flex items-center justify-center p-4">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <>
                          {leadLaborSearchResults.map((labor: any) => (
                            <div
                              key={labor.id}
                              className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setTimeLogFormData({
                                  ...timeLogFormData,
                                  selectedLeadLabor: labor,
                                  selectedLabor: null, // Disable labor when lead labor is selected
                                });
                                setLeadLaborInputValue(
                                  labor.users?.full_name || labor.labor_code,
                                );
                                setShowLeadLaborDropdown(false);
                              }}
                            >
                              <span className="text-sm font-medium">
                                {labor.users?.full_name || labor.labor_code} -{" "}
                                {labor.labor_code}
                              </span>
                            </div>
                          ))}
                          {leadLaborSearchResults.length === 0 && (
                            <div className="text-center text-sm text-gray-500 p-2">
                              No lead labor found
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {timeLogValidationErrors.laborSelection && (
                  <p className="text-red-500 text-xs mt-1">
                    {timeLogValidationErrors.laborSelection}
                  </p>
                )}
              </div>
            </div>
            {/* Date Selection */}
            <div>
              <Label className="mb-2">Date *</Label>
              <Input
                type="date"
                value={timeLogFormData.date}
                onChange={(e) =>
                  setTimeLogFormData({
                    ...timeLogFormData,
                    date: e.target.value,
                  })
                }
                disabled={timeLogModalMode === "view"}
              />
              {timeLogValidationErrors.date && (
                <p className="text-red-500 text-xs mt-1">
                  {timeLogValidationErrors.date}
                </p>
              )}
            </div>

            {/* Hours Worked */}
            <div>
              <Label className="mb-2">Hours Worked *</Label>
              <div
                className="timerange-picker-wrapper"
                style={{
                  zIndex: 1000,
                  borderRadius: "0.5rem",
                  border: "1px solid #e0e0e0",
                  padding: "0.5rem",
                }}
              >
                <TimeRangePicker
                  // @ts-ignore - TimeRangePicker types may vary
                  onChange={(value: any) => {
                    console.log(
                      "TimeRangePicker onChange:",
                      value,
                      "Type:",
                      typeof value,
                      "IsArray:",
                      Array.isArray(value),
                    );
                    // Set flag to prevent useEffect from overwriting user selection
                    timeRangeValueRef.current = true;
                    setTimeRangeValue(value);

                    if (
                      value &&
                      Array.isArray(value) &&
                      value.length === 2 &&
                      value[0] &&
                      value[1]
                    ) {
                      try {
                        let startHours = 0,
                          startMinutes = 0,
                          startSeconds = 0;
                        let endHours = 0,
                          endMinutes = 0,
                          endSeconds = 0;

                        // Parse start time - can be Date object or time string (HH:MM or HH:MM:SS)
                        if (value[0] instanceof Date) {
                          startHours = value[0].getHours();
                          startMinutes = value[0].getMinutes();
                          startSeconds = value[0].getSeconds();
                        } else if (typeof value[0] === "string") {
                          // Parse time string like "08:34" or "08:34:00" or "10:00 AM"
                          let timeStr = value[0].trim();
                          // Handle 12-hour format with AM/PM
                          const isPM = timeStr.toUpperCase().includes("PM");
                          const isAM = timeStr.toUpperCase().includes("AM");
                          if (isPM || isAM) {
                            timeStr = timeStr.replace(/[AP]M/gi, "").trim();
                            const parts = timeStr.split(":");
                            let parsedHours = parseInt(parts[0]) || 0;
                            if (isPM && parsedHours !== 12) {
                              parsedHours += 12;
                            } else if (isAM && parsedHours === 12) {
                              parsedHours = 0;
                            }
                            startHours = parsedHours;
                            startMinutes = parseInt(parts[1]) || 0;
                            startSeconds = parseInt(parts[2]) || 0;
                          } else {
                            // 24-hour format
                            const startParts = timeStr.split(":");
                            startHours = parseInt(startParts[0]) || 0;
                            startMinutes = parseInt(startParts[1]) || 0;
                            startSeconds = parseInt(startParts[2]) || 0;
                          }
                        } else {
                          // Try to create Date from value
                          const startDate = new Date(value[0]);
                          if (!isNaN(startDate.getTime())) {
                            startHours = startDate.getHours();
                            startMinutes = startDate.getMinutes();
                            startSeconds = startDate.getSeconds();
                          } else {
                            console.error(
                              "Invalid start time format:",
                              value[0],
                            );
                            setTimeLogFormData({
                              ...timeLogFormData,
                              hoursWorked: "",
                            });
                            return;
                          }
                        }

                        // Parse end time - can be Date object or time string (HH:MM or HH:MM:SS)
                        if (value[1] instanceof Date) {
                          endHours = value[1].getHours();
                          endMinutes = value[1].getMinutes();
                          endSeconds = value[1].getSeconds();
                        } else if (typeof value[1] === "string") {
                          // Parse time string like "20:45" or "20:45:00" or "8:00 PM"
                          let timeStr = value[1].trim();
                          // Handle 12-hour format with AM/PM
                          const isPM = timeStr.toUpperCase().includes("PM");
                          const isAM = timeStr.toUpperCase().includes("AM");
                          if (isPM || isAM) {
                            timeStr = timeStr.replace(/[AP]M/gi, "").trim();
                            const parts = timeStr.split(":");
                            let parsedHours = parseInt(parts[0]) || 0;
                            if (isPM && parsedHours !== 12) {
                              parsedHours += 12;
                            } else if (isAM && parsedHours === 12) {
                              parsedHours = 0;
                            }
                            endHours = parsedHours;
                            endMinutes = parseInt(parts[1]) || 0;
                            endSeconds = parseInt(parts[2]) || 0;
                          } else {
                            // 24-hour format
                            const endParts = timeStr.split(":");
                            endHours = parseInt(endParts[0]) || 0;
                            endMinutes = parseInt(endParts[1]) || 0;
                            endSeconds = parseInt(endParts[2]) || 0;
                          }
                        } else {
                          // Try to create Date from value
                          const endDate = new Date(value[1]);
                          if (!isNaN(endDate.getTime())) {
                            endHours = endDate.getHours();
                            endMinutes = endDate.getMinutes();
                            endSeconds = endDate.getSeconds();
                          } else {
                            console.error("Invalid end time format:", value[1]);
                            setTimeLogFormData({
                              ...timeLogFormData,
                              hoursWorked: "",
                            });
                            return;
                          }
                        }

                        // Validate parsed time components
                        if (
                          isNaN(startHours) ||
                          isNaN(startMinutes) ||
                          isNaN(endHours) ||
                          isNaN(endMinutes)
                        ) {
                          console.error("Invalid time components:", {
                            startHours,
                            startMinutes,
                            endHours,
                            endMinutes,
                          });
                          setTimeLogFormData({
                            ...timeLogFormData,
                            hoursWorked: "",
                          });
                          return;
                        }

                        // Calculate total minutes for each time
                        const startTotalMinutes =
                          startHours * 60 + startMinutes + startSeconds / 60;
                        const endTotalMinutes =
                          endHours * 60 + endMinutes + endSeconds / 60;

                        // Calculate difference in minutes
                        let diffMinutes = endTotalMinutes - startTotalMinutes;

                        // Handle case where end time is before start time (next day)
                        if (diffMinutes < 0) {
                          // If end is before start, assume it's next day (add 24 hours)
                          diffMinutes = 24 * 60 + diffMinutes;
                        }

                        // Convert minutes to hours
                        const diffHours = diffMinutes / 60;

                        console.log("Time calculation:", {
                          startHours,
                          startMinutes,
                          startSeconds,
                          endHours,
                          endMinutes,
                          endSeconds,
                          startTotalMinutes,
                          endTotalMinutes,
                          diffMinutes,
                          diffHours,
                        });

                        // Validate calculated hours
                        if (
                          isNaN(diffHours) ||
                          !isFinite(diffHours) ||
                          diffHours < 0
                        ) {
                          console.error(
                            "Invalid hours calculation:",
                            diffHours,
                          );
                          setTimeLogFormData({
                            ...timeLogFormData,
                            hoursWorked: "",
                          });
                          return;
                        }

                        // Convert to HH:MM:SS format
                        const h = Math.floor(diffHours);
                        const remainingMinutes = diffMinutes - h * 60;
                        const m = Math.floor(remainingMinutes);
                        const s = Math.floor((remainingMinutes - m) * 60);

                        console.log("Time components:", {
                          h,
                          m,
                          s,
                          diffHours,
                          diffMinutes,
                        });

                        // Validate all values are numbers
                        if (isNaN(h) || isNaN(m) || isNaN(s)) {
                          console.error("Invalid time components:", {
                            h,
                            m,
                            s,
                            diffHours,
                            diffMinutes,
                          });
                          setTimeLogFormData({
                            ...timeLogFormData,
                            hoursWorked: "",
                          });
                          return;
                        }

                        const formattedTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                        console.log("Formatted time:", formattedTime);

                        setTimeLogFormData({
                          ...timeLogFormData,
                          hoursWorked: formattedTime,
                        });
                      } catch (error) {
                        console.error(
                          "Error calculating hours from time range:",
                          error,
                          value,
                        );
                        setTimeLogFormData({
                          ...timeLogFormData,
                          hoursWorked: "",
                        });
                      }
                    } else if (value === null || !value) {
                      console.log("TimeRangePicker value cleared");
                      setTimeLogFormData({
                        ...timeLogFormData,
                        hoursWorked: "",
                      });
                    } else {
                      console.log(
                        "Invalid TimeRangePicker value format:",
                        value,
                      );
                    }
                  }}
                  value={timeRangeValue}
                  disabled={timeLogModalMode === "view"}
                  format="h:mm a"
                  clearIcon={null}
                  clockIcon={null}
                />
              </div>
              {timeLogValidationErrors.hoursWorked && (
                <p className="text-red-500 text-xs mt-1">
                  {timeLogValidationErrors.hoursWorked}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label className="mb-2">Description</Label>
              <Textarea
                value={timeLogFormData.description}
                onChange={(e) =>
                  setTimeLogFormData({
                    ...timeLogFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the work performed"
                rows={3}
                disabled={timeLogModalMode === "view"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTimeLogModal(false);
                setCurrentTimeLog(null);
                resetTimeLogForm();
              }}
            >
              {timeLogModalMode === "view" ? "Close" : "Cancel"}
            </Button>
            {timeLogModalMode !== "view" && (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveTimeLog}
              >
                {timeLogModalMode === "create"
                  ? "Add Time Log"
                  : "Update Time Log"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice &&
                `${selectedInvoice.invoice_type?.charAt(0).toUpperCase() + selectedInvoice.invoice_type?.slice(1).replace("_", " ")} - ${selectedInvoice.invoice_number}`}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-primary">Invoice Information</Label>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {selectedInvoice.invoice_type?.charAt(0).toUpperCase() +
                        selectedInvoice.invoice_type
                          ?.slice(1)
                          .replace("_", " ")}
                    </p>
                    <p>
                      <span className="font-medium">Number:</span>{" "}
                      {selectedInvoice.invoice_number}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{" "}
                      {formatCurrency(selectedInvoice.total_amount)}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <Badge
                        className={`ml-2 ${getStatusBadgeColor(selectedInvoice.status)}`}
                        variant="outline"
                      >
                        {selectedInvoice.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-primary">Dates</Label>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {formatDate(selectedInvoice.created_at)}
                    </p>
                    {selectedInvoice.due_date && (
                      <p>
                        <span className="font-medium">Due Date:</span>{" "}
                        {formatDate(selectedInvoice.due_date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-primary">Description</Label>
                <p className="mt-2 p-4 bg-gray-50 rounded-lg">
                  {selectedInvoice.notes}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInvoiceModal(false);
                setSelectedInvoice(null);
              }}
            >
              Close
            </Button>
            {/* {selectedInvoice && (
              <Button onClick={() => handlePrintInvoice(selectedInvoice)} className="bg-primary hover:bg-primary/90">
                <Printer className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
            )} */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedInvoiceId && (
        <div
          ref={printRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-10000px",
            top: 0,
            width: "22cm",
            background: "#ffffff",
            padding: "24px",
            pointerEvents: "none",
          }}
        >
          <InvoiceTemplate invoiceId={selectedInvoiceId} />
        </div>
      )}

      <AlertDialog
        open={showDeleteProductDialog}
        onOpenChange={setShowDeleteProductDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteEstimateDialog}
        onOpenChange={setShowDeleteEstimateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this estimate?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              estimate &quot;{estimateToDelete?.name || estimateToDelete?.id}
              &quot; from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEstimate}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark invoice as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update invoice status to paid for
              {" "}
              <span className="font-medium">
                #{invoiceToMarkPaid?.invoice_number || invoiceToMarkPaid?.id}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPaidLoading}
              onClick={() => setInvoiceToMarkPaid(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkAsPaid}
              disabled={isPaidLoading}
              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isPaidLoading ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Preview Modal */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
  <DialogContent className="min-w-[80%] max-h-[90vh] overflow-y-auto p-0">
    <div className="bg-gray-100 p-3 md:p-4">
      {/* Print-ready Invoice Design */}
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
                {new Date(inlineInvoiceData.date).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
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
                {InvoioiceNumber}
              </div>
            </div>
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
            {job.type === "contract-based"
              ? contractorData?.name ||
                contractorData?.contractor_name ||
                "Contractor"
              : customerData?.customer_name ||
                customerData?.company_name ||
                inlineInvoiceData.customerName ||
                "Customer"}
          </div>
          <div className="text-gray-600 text-sm leading-5">
            {job.type === "contract-based"
              ? contractorData?.address || inlineInvoiceData.customerAddress || ""
              : customerData?.address || inlineInvoiceData.customerAddress || ""}
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
                  {inlineInvoiceData.dueDate ||
                    new Date().toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })}
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
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {(() => {
                const lineItems = inlineInvoiceData.lineItems || [];

                const getHeaderName = (item: any) =>
                  item.parent_header_name || item.parentHeaderName || null;

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
                  ...Object.entries(groupedMap).flatMap(([headerName, items]) => [
                    {
                      id: `header-${headerName}`,
                      type: "synthetic-header",
                      headerName,
                    },
                    ...items,
                  ]),
                ];

                return orderedRows.map((lineItem: any, index: number) => {
                  if (lineItem.type === "synthetic-header") {
                    return (
                      <tr key={lineItem.id} className="bg-transparent">
                        <td
                          colSpan={5}
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
                        <div className="flex items-center justify-center gap-2">
                          <span>{lineItem.qty || 0}</span>
                        </div>
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {lineItem.item || "-"}
                          </span>
                        </div>
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-top">
                        <div className="max-h-[72px] overflow-y-auto pr-1 text-sm leading-5 text-gray-700">
                          {lineItem.description || "-"}
                        </div>
                      </td>

                      <td className="border border-gray-300 px-3 py-2 text-right align-middle text-sm">
                        ${Number(lineItem.rate || 0).toFixed(2)}
                      </td>

                      <td className="border border-gray-300 px-3 py-2 text-right font-medium align-middle text-sm">
                        ${(lineItem.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          {/* Subtotal */}
          <div className="flex justify-end mt-3">
            <div className="text-right">
              <div className="font-bold text-base">
                ${calculateInvoiceSubtotal().toFixed(2)}
              </div>
            </div>
          </div>

          {/* Payments/Credits and Balance Due */}
          <div className="flex justify-end mt-3">
            <div className="text-right w-60">
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-gray-600">
                  Payments / Credits:
                </span>
                <span className="text-sm text-gray-600">
                  ${(inlineInvoiceData.paymentCredits || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                <span className="font-bold text-sm">Balance Due:</span>
                <span className="font-bold text-sm">
                  $
                  {(
                    calculateInvoiceSubtotal() -
                    (inlineInvoiceData.paymentCredits || 0)
                  ).toFixed(2)}
                </span>
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
            JDP is not responsible for repair of lamps & landscaping, house
            owner utilities including cables, sprinkler systems, television or
            telephone cables, etc. that may be cut or damaged during
            installation. Price are subject to change prior to receipt of down
            payment.
          </p>
        </div>

        {/* Total and Contact */}
        <div className="text-center mb-4">
          <div className="text-sm text-blue-600">
            EMAIL: jen@jdpelectric.us 952-449-1088
          </div>
        </div>

        {inlineInvoiceData.invoiceType === "Estimate" && (
        <div className="secnacher">
          {/* Customer Acceptance Section */}
          <div className="mt-5">
            <div className="border-t border-gray-300 mb-4"></div>

            <div className="flex justify-between items-center mb-4">
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

            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col w-3/5">
                <div className="border-b border-gray-800 h-0.5 mb-1.5"></div>
                <div className="text-xs text-gray-700 text-center">
                  Signature
                </div>
              </div>
              <div className="flex flex-col w-1/3">
                <div className="border-b border-gray-800 h-0.5 mb-1.5"></div>
                <div className="text-xs text-gray-700 text-center">Date</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2.5 mt-3">
              <div className="text-xs text-gray-700 leading-5">
                By signing above, you agree to the terms and pricing outlined
                in this estimate. This becomes a binding agreement upon
                signature.
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>

    {/* Modal Footer Buttons */}
    <div className="sticky bottom-0 z-20 flex justify-center gap-3 border-t bg-gray-50 p-4">
      <Button
        variant="outline"
        onClick={() => {
          setShowPreviewDialog(false);
          if (!editingInvoiceId) {
            setShowInlineInvoiceForm(false);
            setEditingInvoiceId(null);
            setInvoiceValidationErrors({});

            setInlineInvoiceData({
              date: new Date().toISOString().split("T")[0],
              estimateNumber: "",
              customerName: job.customerName || "",
              customerAddress: job.address || "",
              billToAddress: job.billToAddress || "",
              billToAddressEnabled: true,
              poNumber: "",
              project: job.title || "",
              rep: "",
              dueDate: "",
              paymentCredits: 0,
              balanceDue: "",
              lineItems: createDefaultEmptyLineItems(5),
              notes:
                "NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE",
              signatureText: "ACCEPTED BY________________DATE_____",
              invoiceType: "Estimate",
              customInvoiceType: "",
              paymentPercentage: 0,
              estimateTotal: 0,
              paymentHistory: [] as any[],
            });
          }
        }}
        className="flex items-center gap-2"
      >
        <X className="h-4 w-4" />
        Close
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

      <Button
        onClick={handleSendFromPreview}
        disabled={isLoading}
        className="bg-gray-800 hover:bg-gray-900 text-white flex items-center gap-2"
      >
        <Send className="h-4 w-4" />
        {isLoading ? "Sending..." : `Send ${getSelectedInvoiceTypeLabel()}`}
      </Button>

      
    </div>
  </DialogContent>
      </Dialog>

      {/* Bluesheet approval dialog (opens from Bluesheets Data card) */}
      <BlueSheetApprovalDialog
        isOpen={isBlueSheetDialogOpen}
        onClose={() => {
          setIsBlueSheetDialogOpen(false);
          setSelectedBlueSheetForReview(null);
        }}
        selectedBlueSheetIds={selectedBluesheetIds}
        blueSheet={selectedBlueSheetForReview}
        selectedBlueSheets={
          selectedBlueSheetForReview ? [selectedBlueSheetForReview] : []
        }
        onBluesheetsRefresh={refreshJobBluesheetsList}
        onApprovalComplete={() => {
          setIsBlueSheetDialogOpen(false);
          setSelectedBlueSheetForReview(null);
          void refreshJobBluesheetsList();
        }}
      />

      {/* Change Order Modal */}
      <Dialog
        open={showChangeOrderModal}
        onOpenChange={setShowChangeOrderModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Job ID Display */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">Job ID</Label>
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                <p className="text-sm font-medium">
                  {changeOrderJob?.id || "N/A"}
                </p>
              </div>
            </div>

            {/* New Job Title Input */}
            <div className="space-y-2">
              <Label htmlFor="changeOrderTitle" className="text-sm font-medium">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="changeOrderTitle"
                value={changeOrderTitle}
                onChange={(e) => {
                  setChangeOrderTitle(e.target.value);
                  if (changeOrderErrors.title) {
                    setChangeOrderErrors({ ...changeOrderErrors, title: "" });
                  }
                }}
                placeholder="Enter new job title"
                className={changeOrderErrors.title ? "border-red-500" : ""}
                autoFocus
              />
              {changeOrderErrors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {changeOrderErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="changeOrderEstimate"
                className="text-sm font-medium"
              >
                Estimate Amount ($) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="changeOrderEstimate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={changeOrderEstimate}
                  onChange={(e) => {
                    setChangeOrderEstimate(e.target.value);
                    if (changeOrderErrors.estimate) {
                      setChangeOrderErrors({
                        ...changeOrderErrors,
                        estimate: "",
                      });
                    }
                  }}
                  placeholder="0.00"
                  className={`pl-7 ${changeOrderErrors.estimate ? "border-red-500" : ""}`}
                />
              </div>
              {changeOrderErrors.estimate && (
                <p className="text-red-500 text-xs mt-1">
                  {changeOrderErrors.estimate}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeOrderModal(false);
                setChangeOrderJob(null);
                setChangeOrderTitle("");
                setChangeOrderErrors({});
              }}
              disabled={isUpdatingChangeOrder}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeOrderSave}
              disabled={isUpdatingChangeOrder || !changeOrderTitle.trim()}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isUpdatingChangeOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Change Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {hasPermission('activity_logs', 'view') && <ActivityLogs jobId={jobId} />}
    </div>
  );
}

export default JobDetailsPage;
