"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { usePermissions } from "../contexts/PermissionContext";
import { globalApiCall } from "../utils/globalApiHandler";
import { JobDetailsPage } from "./JobDetailsPage";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  Eye,
  Download,
  Trash2,
  Edit,
  Users,
  UserCheck,
  UserRoundX,
  ArrowUpAZ,
  ChevronDown,
  ChevronRight,
  User,
  Building,
  Circle,
  Minus,
  CheckCircle,
  Activity,
  Plus,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { apiClient } from "@/utils/api";
import Autocomplete from "react-google-autocomplete";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
// Static customers data removed - now using API data from /customer/getCustomers

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export function CustomersPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contactPerson: "",
    address: "",
    company: "",
    status: "active",
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [viewCustomerData, setViewCustomerData] = useState<any>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [currentAction, setCurrentAction] = useState<"add" | "edit" | "view">(
    "add",
  );
  const [filteredCustomers, setFilteredCustomers] = useState<any>(null);
  // Add these state variables

  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    activePercentage: "0.0",
    inactivePercentage: "0.0",
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Customer Listing Page State (similar to ContractorListingPage)
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedSubJob, setSelectedSubJob] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [enhancedJobData, setEnhancedJobData] = useState<any>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(
    new Set(),
  );
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [expandedSubJobs, setExpandedSubJobs] = useState<Set<string>>(
    new Set(),
  );
  const [customersWithJobs, setCustomersWithJobs] = useState<any[]>([]);
  const [allCustomersWithJobs, setAllCustomersWithJobs] = useState<any[]>([]); // Store original list for filtering
  const [paginatedCustomers, setPaginatedCustomers] = useState<any[]>([]);

  // Fetch customers data and stats on component mount and when page changes
  useEffect(() => {
    fetchCustomersData(currentPage, itemsPerPage);
    fetchCustomerStats();
  }, [currentPage, itemsPerPage]);

  // Fix Google Autocomplete dropdown z-index and pointer events for modal
  useEffect(() => {
    if (!showAddCustomerModal) return;

    const style = document.createElement("style");
    style.id = "google-autocomplete-styles";
    style.textContent = `
      .pac-container {
        z-index: 999999 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        margin-top: 4px !important;
        position: absolute !important;
      }
      .pac-item {
        padding: 8px 12px !important;
        cursor: pointer !important;
        pointer-events: auto !important;
      }
      .pac-item:hover {
        background-color: #f3f4f6 !important;
      }
      .pac-item-selected {
        background-color: #e5e7eb !important;
      }
      /* Disable DialogOverlay when pac-container is visible */
      .pac-container:not([style*="display: none"]) ~ * [data-radix-dialog-overlay],
      body:has(.pac-container:not([style*="display: none"])) [data-radix-dialog-overlay] {
        pointer-events: none !important;
      }
      /* Re-enable DialogContent */
      [data-radix-dialog-content] {
        pointer-events: auto !important;
      }
    `;
    // Remove existing style if present
    const existingStyle = document.getElementById("google-autocomplete-styles");
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
    document.head.appendChild(style);

    // Prevent modal close when clicking on autocomplete dropdown
    const handleOverlayClick = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if click is on pac-container or its children
      if (target.closest(".pac-container")) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    // Monitor for pac-container visibility and disable overlay
    const observer = new MutationObserver(() => {
      const pacContainer = document.querySelector(".pac-container");
      const overlay = document.querySelector("[data-radix-dialog-overlay]");

      if (pacContainer && overlay) {
        const isVisible =
          pacContainer.getAttribute("style")?.includes("display: none") ===
          false;
        if (
          isVisible ||
          window.getComputedStyle(pacContainer).display !== "none"
        ) {
          (overlay as HTMLElement).style.pointerEvents = "none";
          // Add click handler to prevent modal close
          overlay.addEventListener(
            "click",
            handleOverlayClick as EventListener,
            true,
          );
        } else {
          (overlay as HTMLElement).style.pointerEvents = "auto";
          overlay.removeEventListener(
            "click",
            handleOverlayClick as EventListener,
            true,
          );
        }
      }
    });

    // Observe body for pac-container changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // Also check on focus/blur of address input
    const handleFocus = () => {
      const overlay = document.querySelector("[data-radix-dialog-overlay]");
      if (overlay) {
        (overlay as HTMLElement).style.pointerEvents = "none";
      }
    };

    const handleBlur = () => {
      // Longer delay to allow click on dropdown item to complete
      setTimeout(() => {
        const pacContainer = document.querySelector(".pac-container");
        const overlay = document.querySelector("[data-radix-dialog-overlay]");
        if (
          overlay &&
          (!pacContainer ||
            window.getComputedStyle(pacContainer).display === "none")
        ) {
          (overlay as HTMLElement).style.pointerEvents = "auto";
        }
      }, 500);
    };

    // Wait for input to be rendered, then attach event listeners
    const attachListeners = () => {
      const addressInput = document.querySelector(
        'input[placeholder="Enter full address"]',
      );
      if (addressInput) {
        addressInput.addEventListener("focus", handleFocus);
        addressInput.addEventListener("blur", handleBlur);
        return addressInput;
      }
      return null;
    };

    // Try immediately
    let addressInput = attachListeners();

    // If not found, wait a bit and try again
    if (!addressInput) {
      const timer = setTimeout(() => {
        addressInput = attachListeners();
      }, 100);

      return () => {
        clearTimeout(timer);
        observer.disconnect();
        const styleToRemove = document.getElementById(
          "google-autocomplete-styles",
        );
        if (styleToRemove) {
          document.head.removeChild(styleToRemove);
        }
        if (addressInput) {
          addressInput.removeEventListener("focus", handleFocus);
          addressInput.removeEventListener("blur", handleBlur);
        }
      };
    }

    return () => {
      observer.disconnect();
      const overlay = document.querySelector("[data-radix-dialog-overlay]");
      if (overlay) {
        overlay.removeEventListener(
          "click",
          handleOverlayClick as EventListener,
          true,
        );
      }
      const styleToRemove = document.getElementById(
        "google-autocomplete-styles",
      );
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
      if (addressInput) {
        addressInput.removeEventListener("focus", handleFocus);
        addressInput.removeEventListener("blur", handleBlur);
      }
    };
  }, [showAddCustomerModal]);

  // Expand all customers, jobs, and sub-jobs when data is loaded
  useEffect(() => {
    if (customersWithJobs.length > 0) {
      const allCustomerIds = new Set<string>();
      const allJobIds = new Set<string>();
      const allSubJobIds = new Set<string>();

      customersWithJobs.forEach((customer) => {
        // Add customer ID
        allCustomerIds.add(customer.id.toString());

        // Add all job IDs
        const customerJobs = customer.jobs || [];
        customerJobs.forEach((job: any) => {
          allJobIds.add(job.id.toString());

          // Add all sub-job IDs
          if (job.subJobs && job.subJobs.length > 0) {
            job.subJobs.forEach((subJob: any) => {
              allSubJobIds.add(subJob.id.toString());
            });
          }
        });
      });

      setExpandedCustomers(allCustomerIds);
      setExpandedJobs(allJobIds);
      setExpandedSubJobs(allSubJobIds);
    }
  }, [customersWithJobs]);

  // Auto-select first customer when customers are loaded
  useEffect(() => {
    if (customersWithJobs.length > 0 && !selectedCustomer) {
      const firstCustomer = customersWithJobs[0];
      if (firstCustomer && firstCustomer.id) {
        // Use a timeout to avoid dependency issues
        const timer = setTimeout(() => {
          selectCustomer(firstCustomer.id.toString());
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customersWithJobs.length]);

  // Helper functions for customer listing (similar to ContractorListingPage)
  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const toggleJob = (jobId: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const toggleSubJob = (subJobId: string) => {
    setExpandedSubJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subJobId)) {
        newSet.delete(subJobId);
      } else {
        newSet.add(subJobId);
      }
      return newSet;
    });
  };

  const selectCustomer = (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedJob(null);
    setSelectedSubJob(null);
    setEnhancedJobData(null);
    // Jobs are already loaded in fetchCustomersWithJobs, no need to fetch again
  };

  const selectJob = async (jobId: string, customerId: string) => {
    setSelectedJob(jobId);
    setSelectedCustomer(customerId);
    setSelectedSubJob(null);

    // Clear previous enhanced job data
    setEnhancedJobData(null);

    // Fetch enhanced job data for the main job
    try {
      const jobDetails = await apiClient.getJobById(jobId);

      // Store the enhanced job data for use in JobDetailsPage
      setEnhancedJobData(jobDetails);
      console.log("Enhanced main job data set:", jobDetails);
    } catch (error) {
      console.error("Error fetching main job details:", error);
    }
  };

  const selectSubJob = async (
    subJobId: string,
    jobId: string,
    customerId: string,
  ) => {
    setSelectedSubJob(subJobId);
    setSelectedJob(jobId);
    setSelectedCustomer(customerId);

    // Clear previous enhanced job data
    setEnhancedJobData(null);

    // Fetch the latest job details from API exactly like JobManagementPage does
    try {
      const jobDetails = await apiClient.getJobById(subJobId);

      // Store the enhanced job data for use in JobDetailsPage
      setEnhancedJobData(jobDetails);
      console.log("Enhanced job data set:", jobDetails);
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  // Helper functions for status badges and icons (similar to ContractorListingPage)
  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs font-medium px-2 py-1 rounded-full border";
    switch (status) {
      case "complete":
      case "completed":
        return (
          <Badge
            className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}
          >
            Complete
          </Badge>
        );
      case "ongoing":
      case "in_progress":
        return (
          <Badge
            className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200`}
          >
            Ongoing
          </Badge>
        );
      case "pending":
        return (
          <Badge
            className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`}
          >
            Pending
          </Badge>
        );
      default:
        return (
          <Badge
            className={`${baseClasses} bg-gray-100 text-gray-700 border-gray-300`}
          >
            {status}
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "ongoing":
      case "in_progress":
        return <Activity className="h-3 w-3 text-blue-600" />;
      case "pending":
        return <Circle className="h-3 w-3 text-yellow-600" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const selectedCustomerData = selectedCustomer
    ? customersWithJobs.find((c) => c.id.toString() === selectedCustomer)
    : null;
  const selectedJobData = selectedJob
    ? selectedCustomerData?.jobs?.find(
        (j: any) => j.id.toString() === selectedJob,
      )
    : null;

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!customerFormData.name.trim()) {
      errors.name = "Customer name is required";
    }
    if (!customerFormData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!customerFormData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else {
      // Remove all non-digit characters for validation
      const phoneDigits = customerFormData.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        errors.phone = "Phone number must be exactly 10 digits";
      }
    }
    if (!customerFormData.address.trim()) {
      errors.address = "Address is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchCustomerStats = async () => {
    try {
      setIsLoadingStats(true);

      const response = await globalApiCall(
        `${apiBaseUrl}/customer/getCustomerStats/stats`,
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      console.log("Customer Stats API Response:", responseData);

      if (responseData.success && responseData.data) {
        setCustomerStats({
          total: responseData.data.total || 0,
          active: responseData.data.active || 0,
          inactive: responseData.data.inactive || 0,
          activePercentage: responseData.data.activePercentage || "0.0",
          inactivePercentage: responseData.data.inactivePercentage || "0.0",
        });
      } else {
        console.error(
          "Invalid customer stats API response structure:",
          responseData,
        );
      }
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      // Error is already handled by globalApiCall (token revocation, etc.)
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Get system IP address
      const getSystemIP = async () => {
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();
          return data.ip;
        } catch (error) {
          console.error("Error fetching IP:", error);
          return "unknown";
        }
      };

      const systemIP = await getSystemIP();

      const payload = {
        customer_name: customerFormData.name,
        company_name: customerFormData.company || "",
        email: customerFormData.email.toLowerCase(),
        phone: customerFormData.phone || "",
        contact_person: customerFormData.contactPerson || "",
        address: customerFormData.address || "",
        status: customerFormData.status,
        system_ip: systemIP,
      };

      console.log("Creating customer with payload:", payload);

      const response = await globalApiCall(
        `${apiBaseUrl}/customer/createCustomer`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json();
      console.log("Customer creation response:", responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== "undefined") {
          const { toast } = await import("sonner");
          toast.success("Customer created successfully!");
        }

        setShowAddCustomerModal(false);
        setEditingCustomer(null);
        setCustomerFormData({
          name: "",
          email: "",
          phone: "",
          contactPerson: "",
          address: "",
          company: "",
          status: "active",
        });
        setValidationErrors({});
        // Refresh the customers list and stats
        fetchCustomersData(currentPage, itemsPerPage);
        fetchCustomerStats();
      } else {
        throw new Error(responseData.message || "Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error(
          error instanceof Error ? error.message : "Failed to create customer",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch customers with jobs - fetch all customers first, then merge with jobs
  const fetchCustomersWithJobs = async () => {
    try {
      setIsLoadingCustomers(true);

      // Step 1: Fetch paginated customers
      const customersResponse = await globalApiCall(
        `${apiBaseUrl}/customer/getCustomers?page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
        },
      );
      const customersData = await customersResponse.json();
      console.log("Paginated Customers API Response:", customersData);

      // Extract pagination info
      if (customersData.success && customersData.data) {
        const pagination = customersData.data.pagination || {};
        const totalPagesFromApi = pagination.totalPages || 1;
        const totalCustomersFromApi = pagination.total || 0;

        // Update pagination state
        setTotalCustomers(totalCustomersFromApi);

        // Step 2: Fetch jobs by customer
        let jobsByCustomer: any[] = [];
        try {
          const jobsResponse = await globalApiCall(
            `${apiBaseUrl}/job/getJobsByCustomer`,
            {
              method: "GET",
            },
          );
          const jobsData = await jobsResponse.json();
          console.log("Jobs by Customer API Response:", jobsData);

          if (
            jobsData.success &&
            jobsData.data &&
            Array.isArray(jobsData.data)
          ) {
            jobsByCustomer = jobsData.data;
          }
        } catch (jobsError) {
          console.error(
            "Error fetching jobs by customer (continuing with customers only):",
            jobsError,
          );
          // Continue even if jobs fetch fails
        }

        // Step 3: Create a map of customer_id to jobs
        const jobsMap = new Map<number, any[]>();
        jobsByCustomer.forEach((job: any) => {
          const customerId = job.customer_id || job.customer?.id;
          if (!customerId) return;

          if (!jobsMap.has(customerId)) {
            jobsMap.set(customerId, []);
          }
          jobsMap.get(customerId)!.push(job);
        });

        // Step 4: Merge customers with their jobs
        let allCustomers: any[] = [];

        if (customersData.data.customers) {
          allCustomers = customersData.data.customers;
        } else if (Array.isArray(customersData.data)) {
          allCustomers = customersData.data;
        }

        const customersWithJobsArray = allCustomers.map((customer: any) => {
          const customerId = customer.id;
          const customerJobs = jobsMap.get(customerId) || [];

          return {
            id: customerId,
            customer_name: customer.customer_name || "",
            name: customer.customer_name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            company_name: customer.company_name || "",
            address: customer.address || "",
            created_at: customer.created_at || "",
            jobs: customerJobs,
            total_jobs: customerJobs.length,
          };
        });

        // Sort by total_jobs descending, then by name
        customersWithJobsArray.sort((a: any, b: any) => {
          if (b.total_jobs !== a.total_jobs) {
            return b.total_jobs - a.total_jobs;
          }
          return (a.customer_name || "").localeCompare(b.customer_name || "");
        });

        // Set customers directly from API response (server-side pagination)
        setCustomersWithJobs(customersWithJobsArray);
        setPaginatedCustomers(customersWithJobsArray); // Use API response directly
        setAllCustomersWithJobs(customersWithJobsArray); // Store current page list

        // Also set for table view compatibility
        const transformedCustomers = customersWithJobsArray.map(
          (apiCustomer: any) => ({
            id: apiCustomer.id?.toString() || `CUST-${Date.now()}`,
            name: apiCustomer.customer_name || apiCustomer.name || "",
            email: apiCustomer.email || "",
            phone: apiCustomer.phone || "",
            location: apiCustomer.address || "",
            orders: 0,
            totalSpent: 0,
            joinDate: apiCustomer.created_at
              ? new Date(apiCustomer.created_at).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            status: "active",
            company: apiCustomer.company_name || "",
            contactPerson: "",
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
            jobs: apiCustomer.jobs || [],
            total_jobs: apiCustomer.total_jobs || 0,
          }),
        );
        setCustomersData(transformedCustomers);
        setFilteredCustomers(transformedCustomers);
      }
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchCustomersData = async (page: number, limit: number) => {
    // Use the new function that includes jobs
    await fetchCustomersWithJobs();
  };

  // Server-side search by customer/job using globalSearch API (handles large data + pagination)
  useEffect(() => {
    const runSearch = async () => {
      const term = searchTerm.trim();

      // When search is cleared, just use the current page customers
      if (!term) {
        setCustomersWithJobs(allCustomersWithJobs);
        setPaginatedCustomers(allCustomersWithJobs);
        return;
      }

      try {
        setIsLoadingCustomers(true);

        // Use globalSearch API: returns customers + their jobs for the query
        const response = await apiClient.globalSearch(term, 1, itemsPerPage);
        const customersFromApi: any[] = response.data?.customers || [];

        const customersFromSearch = customersFromApi.map((entry: any) => {
          const customer = entry.customer;
          const jobsForCustomer = entry.jobs || [];
          return {
            id: customer.id,
            customer_name: customer.customer_name || "",
            name: customer.customer_name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            company_name: customer.company_name || "",
            address: customer.address || "",
            created_at: customer.created_at || "",
            jobs: jobsForCustomer,
            total_jobs: jobsForCustomer.length,
          };
        });

        // If nothing from API, fall back to simple name filter on current page
        if (customersFromSearch.length === 0) {
          const searchLower = term.toLowerCase();
          const fallback = allCustomersWithJobs.filter((customer: any) =>
            (customer.customer_name || customer.name || "")
              .toLowerCase()
              .includes(searchLower),
          );
          setCustomersWithJobs(fallback);
          setPaginatedCustomers(fallback);
        } else {
          setCustomersWithJobs(customersFromSearch);
          setPaginatedCustomers(customersFromSearch);
        }
      } catch (error) {
        console.error("Error searching customers/jobs:", error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    runSearch();
  }, [searchTerm, allCustomersWithJobs, itemsPerPage]);

  // Server-side pagination - no client-side pagination needed
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleEditCustomer = async (customer: any) => {
    try {
      setCurrentAction("edit");
      setEditingCustomer(customer);

      // Fetch customer details for editing
      await fetchCustomerById(customer.id.toString());

      setShowAddCustomerModal(true);
    } catch (error) {
      console.error("Error preparing customer for edit:", error);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error("Failed to load customer for editing");
      }
    }
  };

  const handleDeleteCustomerClick = (customer: any) => {
    setCustomerToDelete(customer);
    setShowDeleteAlert(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) {
      console.error("No customer selected for editing");
      return;
    }

    try {
      setIsLoading(true);

      // Get system IP address
      const getSystemIP = async () => {
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();
          return data.ip;
        } catch (error) {
          console.error("Error fetching IP:", error);
          return "unknown";
        }
      };

      const systemIP = await getSystemIP();

      const payload = {
        customer_name: customerFormData.name,
        company_name: customerFormData.company || "",
        email: customerFormData.email.toLowerCase(),
        phone: customerFormData.phone || "",
        contact_person: customerFormData.contactPerson || "",
        address: customerFormData.address || "",
        status: customerFormData.status,
        system_ip: systemIP,
      };

      console.log("Updating customer with payload:", payload);

      const response = await globalApiCall(
        `${apiBaseUrl}/customer/updateCustomer/${editingCustomer.id}`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json();
      console.log("Customer update response:", responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== "undefined") {
          const { toast } = await import("sonner");
          toast.success("Customer updated successfully!");
        }

        setShowAddCustomerModal(false);
        setEditingCustomer(null);
        setCustomerFormData({
          name: "",
          email: "",
          phone: "",
          contactPerson: "",
          address: "",
          company: "",
          status: "active",
        });
        setValidationErrors({});
        // Refresh the customers list and stats
        fetchCustomersData(currentPage, itemsPerPage);
        fetchCustomerStats();
      } else {
        throw new Error(responseData.message || "Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error(
          error instanceof Error ? error.message : "Failed to update customer",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("jdp_auth")
        ? JSON.parse(localStorage.getItem("jdp_auth")!).token
        : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${apiBaseUrl}/customer/deleteCustomer/${customerToDelete.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      const responseData = await response.json();
      console.log("Customer deletion response:", responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== "undefined") {
          const { toast } = await import("sonner");
          toast.success("Customer deleted successfully!");
        }

        setShowDeleteAlert(false);
        setCustomerToDelete(null);
        // Refresh the customers list and stats
        fetchCustomersData(currentPage, itemsPerPage);
        fetchCustomerStats();
      } else {
        throw new Error(responseData.message || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error(
          error instanceof Error ? error.message : "Failed to delete customer",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerForView = async (customerId: string) => {
    try {
      setIsLoadingView(true);

      const response = await globalApiCall(
        `${apiBaseUrl}/customer/getCustomerById/${customerId}`,
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      console.log("Customer View API Response:", responseData);

      if (responseData.success && responseData.data) {
        setViewCustomerData(responseData.data);
        return responseData.data;
      } else {
        throw new Error(
          responseData.message || "Failed to fetch customer details",
        );
      }
    } catch (error) {
      console.error("Error fetching customer for view:", error);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch customer details",
        );
      }
      throw error;
    } finally {
      setIsLoadingView(false);
    }
  };

  const fetchCustomerById = async (customerId: string) => {
    try {
      setIsLoading(true);

      const response = await globalApiCall(
        `${apiBaseUrl}/customer/getCustomerById/${customerId}`,
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      console.log("Customer by ID API Response:", responseData);

      if (responseData.success && responseData.data) {
        const apiCustomer = responseData.data;

        // Transform API response to match form data format
        const customerData = {
          name: apiCustomer.customer_name || "",
          email: apiCustomer.email || "",
          phone: apiCustomer.phone || "",
          contactPerson: apiCustomer.contact_person || "",
          address: apiCustomer.address || "",
          company: apiCustomer.company_name || "",
          status: apiCustomer.status || "active",
        };

        setCustomerFormData(customerData);
        return customerData;
      } else {
        throw new Error(
          responseData.message || "Failed to fetch customer details",
        );
      }
    } catch (error) {
      console.error("Error fetching customer by ID:", error);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch customer details",
        );
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCustomers = () => {
    // Prepare CSV headers
    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Location",
      "Company",
      "Status",
    ];

    // Prepare CSV rows
    const rows = customersData.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.location,
      customer.company,
      customer.status.toUpperCase(),
    ]);

    // Convert to CSV string
    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
    });

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "customers_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  useEffect(() => {
    const fetchCustomersByStatus = async () => {
      if (!statusFilter || statusFilter === "all") {
        // Reset to full list when 'all' is selected
        fetchCustomersData(currentPage, itemsPerPage);
        return;
      }

      setIsLoadingCustomers(true);

      try {
        const res = await apiClient.getCustomersByStatus(statusFilter);
        const customers = res.data?.customers || [];

        // Transform API response to match component's expected format
        const transformedCustomers = customers.map((apiCustomer: any) => ({
          id: apiCustomer.id?.toString() || `CUST-${Date.now()}`,
          name: apiCustomer.customer_name || "",
          email: apiCustomer.email || "",
          phone: apiCustomer.phone || "",
          location: apiCustomer.address || "",
          orders: apiCustomer.total_orders || 0,
          totalSpent: apiCustomer.total_spent || 0,
          joinDate: apiCustomer.created_at
            ? new Date(apiCustomer.created_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          status: apiCustomer.status || "active",
          company: apiCustomer.company_name || "",
          contactPerson: apiCustomer.contact_person || "",
          avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        }));

        setFilteredCustomers(transformedCustomers);
        setTotalCustomers(
          res.data?.pagination?.total ?? transformedCustomers.length ?? 0,
        );
      } catch (error) {
        console.error("Customer fetch error:", error);
        setFilteredCustomers([]);
        setTotalCustomers(0);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomersByStatus();
  }, [statusFilter, currentPage, itemsPerPage]);

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Customer Listings */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Customers & Jobs</h2>
              <p className="text-sm text-gray-500">Select to view details</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-gray-200">
          <input
            type="text"
            placeholder="Search customers or jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
          />
        </div>

        {/* Customer Listings */}
        <ScrollArea className="flex-1 overflow-y-auto h-full rounded-2xl border border-sky-100 bg-gradient-to-b from-white via-sky-50/40 to-blue-50/40 shadow-[0_8px_22px_rgba(59,130,246,0.08)]">
          <div className="p-3">
            {isLoadingCustomers ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-sky-500"></div>
                <span className="ml-2 text-sm text-slate-500">
                  Loading customers...
                </span>
              </div>
            ) : paginatedCustomers.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No customers found
              </div>
            ) : (
              paginatedCustomers.map((customer) => {
                const customerJobs = customer.jobs || [];
                const hasCustomerJobs = customerJobs.length > 0;
                const isExpanded = expandedCustomers.has(
                  customer.id.toString(),
                );
                const isSelected =
                  selectedCustomer === customer.id.toString() && !selectedJob;

                return (
                  <div key={customer.id} className="mb-3">
                    <Collapsible
                      open={hasCustomerJobs ? isExpanded : false}
                      onOpenChange={(open) => {
                        if (!hasCustomerJobs) return;
                        toggleCustomer(customer.id.toString());
                      }}
                      className={`w-[75%] overflow-hidden rounded-[22px] border transition-all duration-300
    ${
      isExpanded && hasCustomerJobs
        ? "border-sky-200 bg-white shadow-[0_10px_24px_rgba(14,165,233,0.08)]"
        : "border-sky-100 bg-white shadow-[0_4px_14px_rgba(14,165,233,0.05)]"
    }`}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            selectCustomer(customer.id.toString());
                          }}
                          className="group h-auto w-full justify-start rounded-[20px] p-0 text-left hover:bg-transparent"
                        >
                          <div
                            className={`w-full rounded-[20px] border px-4 py-4 transition-all duration-300
                      ${
                        isSelected || (isExpanded && hasCustomerJobs)
                          ? "border-sky-200 bg-gradient-to-r from-sky-200 via-blue-200 to-cyan-100 text-slate-800 shadow-[0_8px_18px_rgba(59,130,246,0.10)]"
                          : "border-sky-100 bg-gradient-to-r from-sky-100 via-blue-100 to-cyan-50 text-slate-800 shadow-[0_4px_12px_rgba(59,130,246,0.06)]"
                      }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 ring-1 ring-sky-100">
                                    {hasCustomerJobs ? (
                                      isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-sky-600" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-sky-600" />
                                      )
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-sky-300 opacity-40" />
                                    )}
                                  </div>

                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 ring-1 ring-sky-100">
                                    <User className="h-4 w-4 text-sky-600" />
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate text-[15px] font-semibold text-slate-800">
                                    {customer.customer_name || customer.name}
                                  </div>
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    {customer.total_jobs || customerJobs.length}{" "}
                                    jobs
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {hasPermission("customers", "edit") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Edit Customer"
                                    className="h-8 w-8 rounded-full p-0 hover:bg-white/70"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditCustomer(customer);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 text-sky-600" />
                                  </Button>
                                )}

                                {hasPermission("customers", "delete") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Delete Customer"
                                    className="h-8 w-8 rounded-full p-0 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomerClick(customer);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Button>
                      </CollapsibleTrigger>

                      {hasCustomerJobs && (
                        <CollapsibleContent className="px-3 pb-3 pt-2">
                          <div className="relative ml-3 border-l-2 border-sky-100 pl-4">
                            {customerJobs.map((job: any) => {
                              const hasSubJobs =
                                job.subJobs && job.subJobs.length > 0;
                              const isJobExpanded = expandedJobs.has(
                                job.id.toString(),
                              );
                              const isJobSelected =
                                selectedJob === job.id.toString() &&
                                !selectedSubJob;

                              return (
                                <div
                                  key={job.id}
                                  className="relative mb-3 last:mb-0"
                                >
                                  {/* fixed horizontal connector line for jobs */}
                                  <span className="absolute -left-[15px] top-5 h-[2px] w-3 rounded-full bg-sky-200" />

                                  <Collapsible
                                    open={isJobExpanded}
                                    onOpenChange={() =>
                                      selectedJob === job.id.toString() &&
                                      toggleJob(job.id.toString())
                                    }
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        onClick={() =>
                                          selectJob(
                                            job.id.toString(),
                                            customer.id.toString(),
                                          )
                                        }
                                        className="h-auto w-full justify-start rounded-2xl border p-0 text-left hover:bg-transparent"
                                      >
                                        <div
                                          className={`w-full rounded-2xl border px-4 py-3 transition-all duration-300
                                    ${
                                      isJobSelected || isJobExpanded
                                        ? "border-sky-200 bg-gradient-to-r from-sky-100 via-blue-50 to-cyan-50 shadow-[0_6px_14px_rgba(14,165,233,0.07)]"
                                        : "border-sky-100 bg-gradient-to-r from-slate-50 via-sky-50 to-cyan-50/60 shadow-[0_3px_10px_rgba(14,165,233,0.04)]"
                                    }`}
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                              <div className="flex items-center gap-2">
                                                {hasSubJobs ? (
                                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-sky-100">
                                                    {isJobExpanded ? (
                                                      <ChevronDown className="h-3.5 w-3.5 text-sky-600" />
                                                    ) : (
                                                      <ChevronRight className="h-3.5 w-3.5 text-sky-600" />
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="h-6 w-6" />
                                                )}

                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 ring-2 ring-amber-300">
                                                  {getStatusIcon(job.status)}
                                                </div>
                                              </div>

                                              <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-slate-700">
                                                  {job.job_title || job.title}
                                                </div>
                                                <div className="text-xs font-medium capitalize text-slate-500">
                                                  {job.status}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </Button>
                                    </CollapsibleTrigger>

                                    {hasSubJobs && (
                                      <CollapsibleContent className="mt-2 pl-5">
                                        <div className="relative border-l-2 border-cyan-100 pl-3">
                                          {job.subJobs?.map((subJob: any) => {
                                            const isSubJobSelected =
                                              selectedSubJob ===
                                              subJob.id.toString();

                                            return (
                                              <div
                                                key={subJob.id}
                                                className="relative mb-2 last:mb-0"
                                              >
                                                <span className="absolute -left-[15px] top-5 h-[2px] w-3 rounded-full bg-cyan-100" />

                                                <Button
                                                  variant="ghost"
                                                  onClick={() =>
                                                    selectSubJob(
                                                      subJob.id.toString(),
                                                      job.id.toString(),
                                                      customer.id.toString(),
                                                    )
                                                  }
                                                  className="h-auto w-full justify-start rounded-xl p-0 text-left hover:bg-transparent"
                                                >
                                                  <div
                                                    className={`w-full rounded-xl border px-3 py-2.5 transition-all duration-300
                                              ${
                                                isSubJobSelected
                                                  ? "border-cyan-200 bg-gradient-to-r from-white via-sky-50/70 to-cyan-50/70 shadow-[0_4px_12px_rgba(6,182,212,0.06)]"
                                                  : "border-slate-100 bg-white hover:border-cyan-100 hover:bg-sky-50/40"
                                              }`}
                                                  >
                                                    <div className="flex items-center gap-2 w-full">
                                                      {/* reduced circle size for sub-jobs */}
                                                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-50 ring-[1.5px] ring-amber-300 shrink-0">
                                                        <div className="scale-[0.75]">
                                                          {getStatusIcon(
                                                            subJob.status,
                                                          )}
                                                        </div>
                                                      </div>

                                                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                        <div className="truncate text-xs font-medium text-slate-700">
                                                          {subJob.job_title ||
                                                            subJob.title}
                                                        </div>

                                                        <div className="shrink-0 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-semibold text-sky-600">
                                                          Change Order
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </Button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </CollapsibleContent>
                                    )}
                                  </Collapsible>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </div>
                );
              })
            )}
          </div>

          <div className="w-[75%] sticky bottom-0 border-t border-sky-100 bg-white/95 backdrop-blur-xl px-3 py-4">
            <div className="mx-auto text-center">
              <div className="mb-3 text-sm text-slate-600">
                Showing {customersWithJobs.length} of {totalCustomers} Customer
                • Page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-9 w-9 rounded-full border-sky-100 bg-white p-0 text-sky-600 shadow-sm hover:bg-sky-50"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 rounded-full border-sky-100 bg-white p-0 text-sky-600 shadow-sm hover:bg-sky-50"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right Content - Job Details */}
      <div
        className="flex-1 bg-white"
        style={{ width: "80%", margin: "0 auto" }}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-medium text-[#2b2b2b]">
                Customer Management
              </h1>
              <p className="text-muted-foreground">
                Manage and track all customer relationships and service history
              </p>
            </div>
            <div className="flex gap-2">
              {hasPermission("customers", "view") && (
                <Button variant="outline" onClick={handleExportCustomers}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Customers
                </Button>
              )}
              {hasPermission("customers", "create") && (
                <Button
                  className="text-white"
                  onClick={() => {
                    setCurrentAction("add");
                    setEditingCustomer(null);
                    setViewCustomerData(null);
                    setShowAddCustomerModal(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Job Details or Summary Cards */}
        {selectedJobData && selectedCustomerData ? (
          <div className="p-6 space-y-6">
            {/* Job Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Job Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {getStatusBadge(selectedJobData.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
                    <p className="font-medium text-primary">
                      {formatCurrency(selectedJobData.estimated_cost || 0)}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Job Title</p>
                    <p className="font-medium">
                      {selectedJobData.job_title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-medium">
                      {selectedJobData.address || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium">
                      {formatDate(selectedJobData.created_at || "")}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Due Date</p>
                    <p className="font-medium">
                      {formatDate(selectedJobData.due_date || "")}
                    </p>
                  </div>
                  {selectedJobData.actualCost && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Actual Cost</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(selectedJobData.actualCost)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Details - Show main job or sub-job based on selection */}
            {selectedJobData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-medium text-gray-900">
                    {selectedSubJob ? "Sub-Job Details" : "Job Details"}
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {selectedJobData.subJobs?.length || 0} Sub-Jobs
                  </Badge>
                </div>

                {/* Show sub-job details if sub-job is selected */}
                {selectedSubJob
                  ? selectedJobData.subJobs?.map((subJob: any) => {
                      if (subJob.id.toString() !== selectedSubJob) return null;

                      const jobData =
                        enhancedJobData &&
                        enhancedJobData.id.toString() === subJob.id.toString()
                          ? enhancedJobData
                          : subJob;

                      const jobWithCustomerData = {
                        ...jobData,
                        id: subJob.id.toString(),
                        customer:
                          subJob.customer?.id?.toString() ||
                          subJob.customer_id?.toString(),
                        customerName:
                          subJob.customer?.customer_name ||
                          subJob.customer?.company_name,
                        customerEmail: subJob.customer?.email,
                        title: subJob.job_title,
                        type:
                          subJob.job_type === "contract_based"
                            ? "contract-based"
                            : "service-based",
                        location: subJob.address,
                        address: subJob.address,
                        cityZip: subJob.city_zip,
                        estimatedCost: subJob.estimated_cost,
                        estimatedHours: subJob.estimated_hours,
                        startDate: subJob.created_at,
                        dueDate: subJob.due_date,
                        priority: subJob.priority,
                        status: subJob.status,
                        progress: subJob.progress || 0,
                        labor_timesheets: subJob.labor_timesheets || [],
                        assigned_labor_ids: subJob.assigned_labor_ids,
                        assigned_lead_labor_ids: subJob.assigned_lead_labor_ids,
                        assignedLaborDetails:
                          jobData.assignedLaborDetails || [],
                        assignedLeadLaborDetails:
                          jobData.assignedLeadLaborDetails || [],
                      };

                      const allJobs = [jobWithCustomerData];

                      const handleSetJobs = (updatedJobs: any[]) => {
                        if (updatedJobs.length > 0) {
                          const updatedJob = updatedJobs[0];
                          setCustomersWithJobs((prevCustomers) =>
                            prevCustomers.map((customer) => {
                              if (customer.id.toString() === selectedCustomer) {
                                return {
                                  ...customer,
                                  jobs: customer.jobs.map((job: any) => {
                                    if (job.id.toString() === selectedJob) {
                                      return {
                                        ...job,
                                        subJobs:
                                          job.subJobs?.map((subJobItem: any) =>
                                            subJobItem.id.toString() ===
                                            updatedJob.id
                                              ? { ...subJobItem, ...updatedJob }
                                              : subJobItem,
                                          ) || [],
                                      };
                                    }
                                    return job;
                                  }),
                                };
                              }
                              return customer;
                            }),
                          );
                        }
                      };

                      return (
                        <JobDetailsPage
                          key={subJob.id}
                          jobId={subJob.id.toString()}
                          onBack={() => setSelectedSubJob(null)}
                          jobs={allJobs}
                          setJobs={handleSetJobs}
                          onJobsRefresh={fetchCustomersWithJobs}
                        />
                      );
                    })
                  : /* Show main job details if no sub-job is selected */
                    (() => {
                      const jobData =
                        enhancedJobData &&
                        enhancedJobData.id.toString() ===
                          selectedJobData.id.toString()
                          ? enhancedJobData
                          : selectedJobData;

                      const jobWithCustomerData = {
                        ...jobData,
                        id: selectedJobData.id.toString(),
                        customer:
                          selectedJobData.customer?.id?.toString() ||
                          selectedJobData.customer_id?.toString(),
                        customerName:
                          selectedJobData.customer?.customer_name ||
                          selectedJobData.customer?.company_name,
                        customerEmail: selectedJobData.customer?.email,
                        title: selectedJobData.job_title,
                        type:
                          selectedJobData.job_type === "contract_based"
                            ? "contract-based"
                            : "service-based",
                        location: selectedJobData.address,
                        address: selectedJobData.address,
                        cityZip: selectedJobData.city_zip,
                        estimatedCost: selectedJobData.estimated_cost,
                        estimatedHours: selectedJobData.estimated_hours,
                        startDate: selectedJobData.created_at,
                        dueDate: selectedJobData.due_date,
                        priority: selectedJobData.priority,
                        status: selectedJobData.status,
                        progress: selectedJobData.progress || 0,
                        labor_timesheets:
                          selectedJobData.labor_timesheets || [],
                        assigned_labor_ids: selectedJobData.assigned_labor_ids,
                        assigned_lead_labor_ids:
                          selectedJobData.assigned_lead_labor_ids,
                        assignedLaborDetails:
                          jobData.assignedLaborDetails || [],
                        assignedLeadLaborDetails:
                          jobData.assignedLeadLaborDetails || [],
                      };

                      const allJobs = [jobWithCustomerData];

                      const handleSetJobs = (updatedJobs: any[]) => {
                        if (updatedJobs.length > 0) {
                          const updatedJob = updatedJobs[0];
                          setCustomersWithJobs((prevCustomers) =>
                            prevCustomers.map((customer) => {
                              if (customer.id.toString() === selectedCustomer) {
                                return {
                                  ...customer,
                                  jobs: customer.jobs.map((job: any) =>
                                    job.id.toString() === selectedJob
                                      ? { ...job, ...updatedJob }
                                      : job,
                                  ),
                                };
                              }
                              return customer;
                            }),
                          );
                        }
                      };

                      return (
                        <JobDetailsPage
                          key={selectedJobData.id}
                          jobId={selectedJobData.id.toString()}
                          onBack={() => setSelectedJob(null)}
                          jobs={allJobs}
                          setJobs={handleSetJobs}
                          onJobsRefresh={fetchCustomersWithJobs}
                        />
                      );
                    })()}
              </div>
            )}
          </div>
        ) : selectedCustomerData ? (
          <div className="p-6">
            {/* Customer Details Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedCustomerData.customer_name ||
                    selectedCustomerData.name}
                </h1>
                <p className="text-lg text-gray-600">Customer Details</p>
              </div>
              <Badge
                variant="default"
                className="px-3 py-1 bg-green-100 text-green-800 border-green-200"
              >
                Active
              </Badge>
            </div>

            {/* Contact Information Card */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contact Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-600">Email</span>
                          <p className="text-gray-900">
                            {selectedCustomerData.email || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-600">Address</span>
                          <p className="text-gray-900">
                            {selectedCustomerData.address || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-600">Phone</span>
                          <p className="text-gray-900">
                            {selectedCustomerData.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-600">
                            Join Date
                          </span>
                          <p className="text-gray-900">
                            {selectedCustomerData.created_at
                              ? formatDate(selectedCustomerData.created_at)
                              : selectedCustomerData.jobs?.[0]?.customer
                                    ?.created_at
                                ? formatDate(
                                    selectedCustomerData.jobs[0].customer
                                      .created_at,
                                  )
                                : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Statistics Cards */}
            {(() => {
              const jobs = selectedCustomerData.jobs || [];
              const totalJobs = jobs.length;
              const completedJobs = jobs.filter(
                (job: any) =>
                  job.status === "completed" || job.status === "complete",
              ).length;
              const ongoingJobs = jobs.filter(
                (job: any) =>
                  job.status === "in_progress" ||
                  job.status === "ongoing" ||
                  job.status === "in-progress",
              ).length;
              const totalRevenue = jobs.reduce((sum: number, job: any) => {
                return (
                  sum + (job.totalEstimatedCost || job.estimated_cost || 0)
                );
              }, 0);

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Total Jobs */}
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Briefcase className="w-8 h-8 text-primary mx-auto mb-3" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {totalJobs}
                      </div>
                      <div className="text-sm text-gray-600">Total Jobs</div>
                    </CardContent>
                  </Card>

                  {/* Completed */}
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {completedJobs}
                      </div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </CardContent>
                  </Card>

                  {/* Ongoing */}
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Activity className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {ongoingJobs}
                      </div>
                      <div className="text-sm text-gray-600">Ongoing</div>
                    </CardContent>
                  </Card>

                  {/* Total Revenue */}
                  <Card>
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Select a customer to view details</p>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={showAddCustomerModal}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCustomer(null);
            setViewCustomerData(null);
            setCustomerFormData({
              name: "",
              email: "",
              phone: "",
              contactPerson: "",
              address: "",
              company: "",
              status: "active",
            });
            setValidationErrors({});
          }
          setShowAddCustomerModal(open);
        }}
      >
        <DialogContent
          className="max-w-2xl overflow-visible"
          style={{ zIndex: 100 }}
          onInteractOutside={(e) => {
            // Prevent modal close when clicking on autocomplete dropdown
            const target = e.target as HTMLElement;
            if (target.closest(".pac-container")) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {currentAction === "add"
                ? "Add New Customer"
                : currentAction === "edit"
                  ? "Edit Customer"
                  : "Customer Details"}
            </DialogTitle>
            <DialogDescription>
              {currentAction === "add"
                ? "Create a new customer profile for service management"
                : currentAction === "edit"
                  ? "Update customer profile"
                  : "View complete customer details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentAction === "view" && viewCustomerData ? (
              // View Mode - Customer Details
              <div className="space-y-6">
                {isLoadingView ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading customer details...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Customer Information Section */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Customer Name
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.customer_name}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Company Name
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.company_name || "N/A"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Email Address
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.email}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Phone Number
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.phone || "N/A"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Contact Person
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.contact_person || "N/A"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Status
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          <Badge
                            className={getStatusColor(
                              viewCustomerData.status || "active",
                            )}
                          >
                            {(
                              viewCustomerData.status || "active"
                            ).toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Address
                      </Label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 min-h-[60px]">
                        {viewCustomerData.address || "No address provided"}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Created At
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.created_at
                            ? new Date(
                                viewCustomerData.created_at,
                              ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Last Updated
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.updated_at
                            ? new Date(
                                viewCustomerData.updated_at,
                              ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Add/Edit Mode - Form
              <>
                {/* Customer/Company Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="mb-2" htmlFor="name">
                      Customer Name *
                    </Label>
                    <Input
                      id="name"
                      value={customerFormData.name}
                      onChange={(e) => {
                        setCustomerFormData({
                          ...customerFormData,
                          name: e.target.value,
                        });
                        clearValidationError("name");
                      }}
                      placeholder="Enter customer name"
                      className={`mt-1 ${validationErrors.name ? "border-red-500" : ""}`}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="mb-2" htmlFor="email">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerFormData.email}
                      onChange={(e) => {
                        setCustomerFormData({
                          ...customerFormData,
                          email: e.target.value,
                        });
                        clearValidationError("email");
                      }}
                      placeholder="Enter email address"
                      className={`mt-1 ${validationErrors.email ? "border-red-500" : ""}`}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Phone */}
                  <div>
                    <Label className="mb-2" htmlFor="phone">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="number"
                      value={customerFormData.phone}
                      onChange={(e) => {
                        setCustomerFormData({
                          ...customerFormData,
                          phone: e.target.value,
                        });
                        clearValidationError("phone");
                      }}
                      placeholder="Enter phone number"
                      className={`mt-1 ${validationErrors.phone ? "border-red-500" : ""}`}
                      required
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Contact Person */}
                  <div>
                    <Label className="mb-2" htmlFor="contact">
                      Contact Person
                    </Label>
                    <Input
                      id="contact"
                      value={customerFormData.contactPerson}
                      onChange={(e) =>
                        setCustomerFormData({
                          ...customerFormData,
                          contactPerson: e.target.value,
                        })
                      }
                      placeholder="Enter contact person name"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="relative">
                  <Label className="mb-2" htmlFor="address">
                    Address *
                  </Label>
                  <Autocomplete
                    apiKey="AIzaSyBtb6hSmwJ9_OznDC5e8BcZM90ms4WD_DE"
                    onPlaceSelected={(place: any) => {
                      console.log("Place selected:", place);
                      if (place) {
                        // Keep overlay disabled during selection to prevent modal close
                        const overlay = document.querySelector(
                          "[data-radix-dialog-overlay]",
                        );
                        if (overlay) {
                          (overlay as HTMLElement).style.pointerEvents = "none";
                        }

                        // Use formatted_address if available, otherwise use name
                        const address =
                          place.formatted_address || place.name || "";
                        if (address) {
                          setCustomerFormData({ ...customerFormData, address });
                          if (validationErrors.address) {
                            setValidationErrors({
                              ...validationErrors,
                              address: "",
                            });
                          }
                        }

                        // Re-enable overlay after a short delay
                        setTimeout(() => {
                          const pacContainer =
                            document.querySelector(".pac-container");
                          if (
                            overlay &&
                            (!pacContainer ||
                              window.getComputedStyle(pacContainer).display ===
                                "none")
                          ) {
                            (overlay as HTMLElement).style.pointerEvents =
                              "auto";
                          }
                        }, 300);
                      }
                    }}
                    options={{
                      types: ["address"],
                      componentRestrictions: { country: "us" },
                    }}
                    defaultValue={customerFormData.address}
                    onChange={(e: any) => {
                      const value = e.target.value;
                      setCustomerFormData({
                        ...customerFormData,
                        address: value,
                      });
                      if (validationErrors.address) {
                        setValidationErrors({
                          ...validationErrors,
                          address: "",
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mt-1 ${
                      validationErrors.address
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter full address"
                  />
                  {validationErrors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.address}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <Label className="mb-2" htmlFor="company">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={customerFormData.company}
                    onChange={(e) =>
                      setCustomerFormData({
                        ...customerFormData,
                        company: e.target.value,
                      })
                    }
                    placeholder="Enter company name"
                    className="mt-1"
                  />
                </div>

                {/* Status */}
                <div>
                  <Label className="mb-2" htmlFor="status">
                    Status *
                  </Label>
                  <Select
                    value={customerFormData.status}
                    onValueChange={(value) =>
                      setCustomerFormData({
                        ...customerFormData,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {currentAction === "view" ? (
              <div className="flex gap-2">
                {hasPermission("customers", "edit") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentAction("edit");
                      // Create customer object from view data to ensure consistency
                      const customerToEdit = {
                        id: viewCustomerData.id?.toString() || "",
                        name: viewCustomerData.customer_name || "",
                        email: viewCustomerData.email || "",
                        phone: viewCustomerData.phone || "",
                        location: viewCustomerData.address || "",
                        orders: 0, // Default value
                        totalSpent: 0, // Default value
                        joinDate: viewCustomerData.created_at
                          ? new Date(viewCustomerData.created_at)
                              .toISOString()
                              .split("T")[0]
                          : "",
                        status: viewCustomerData.status || "active",
                        company: viewCustomerData.company_name || "",
                        contactPerson: viewCustomerData.contact_person || "",
                        avatar:
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                      };
                      setEditingCustomer(customerToEdit);
                      // Fetch customer details for editing
                      fetchCustomerById(viewCustomerData.id).catch((error) => {
                        console.error(
                          "Failed to load customer for editing:",
                          error,
                        );
                      });
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setEditingCustomer(null);
                    setViewCustomerData(null);
                    setCustomerFormData({
                      name: "",
                      email: "",
                      phone: "",
                      contactPerson: "",
                      address: "",
                      company: "",
                      status: "active",
                    });
                    setValidationErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="text-white"
                  disabled={isLoading}
                  onClick={() => {
                    if (editingCustomer) {
                      handleUpdateCustomer();
                    } else {
                      handleCreateCustomer();
                    }
                  }}
                >
                  {isLoading
                    ? editingCustomer
                      ? "Updating..."
                      : "Creating..."
                    : editingCustomer
                      ? "Update Customer"
                      : "Add Customer"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this customer?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              customer &quot;{customerToDelete?.name}&quot; from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Deleting..." : "Yes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
