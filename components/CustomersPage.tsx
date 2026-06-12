"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { useListingEstimatePrefillSync } from "../contexts/EstimatePrefillContext";
import { globalApiCall } from "../utils/globalApiHandler";
import { JobDetailsPage } from "./JobDetailsPage";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
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
  Upload,
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
import Link from "next/link";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import CommonEntityListing from "./common/CommonEntityListing";
import { TableListPagination } from "./common/TableListPagination";
import {
  annotateEntitiesForListing,
  annotateJobsForListing,
  sortEntitiesByRecentJobActivity,
} from "@/lib/entityListingRecentActivity";
import { resolveEntityKind } from "@/lib/resolveEntityKind";
import {
  ADDRESS_AUTOCOMPLETE_OPTIONS,
  ADDRESS_SEARCH_PLACEHOLDER,
  GOOGLE_MAPS_API_KEY,
  resolveFormattedPlaceAddress,
} from "@/lib/googleAddressAutocomplete";
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

const normalizeJobsPayload = (data: unknown): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.jobs)) return o.jobs as any[];
    if (Array.isArray(o.data)) return o.data as any[];
  }
  return [];
};

const jobBelongsToCustomer = (job: any, customerId: string) =>
  String(job.customer_id ?? job.customer?.id ?? "") === String(customerId);

/** Resolve customer + main/sub job for deep-link (?customerId=&jobId=). */
function resolveCustomerJobNavigation(
  customers: any[],
  jobId: string,
  preferredCustomerId?: string,
): {
  customerId: string;
  parentJobId: string;
  subJobId: string | null;
} | null {
  const jid = (jobId || "").trim();
  if (!jid || !Array.isArray(customers)) return null;

  const tryCustomer = (c: any) => {
    if (!c) return null;
    for (const j of c.jobs || []) {
      if (j?.id != null && String(j.id) === jid) {
        return {
          customerId: String(c.id),
          parentJobId: String(j.id),
          subJobId: null as string | null,
        };
      }
      for (const sj of j.subJobs || []) {
        if (sj?.id != null && String(sj.id) === jid) {
          return {
            customerId: String(c.id),
            parentJobId: String(j.id),
            subJobId: String(sj.id),
          };
        }
      }
    }
    return null;
  };

  const pref = (preferredCustomerId || "").trim();
  if (pref) {
    const c = customers.find((x) => x?.id != null && String(x.id) === pref);
    const hit = tryCustomer(c);
    if (hit) return hit;
  }

  for (const c of customers) {
    const hit = tryCustomer(c);
    if (hit) return hit;
  }
  return null;
}

const mapApiCustomerToListingEntity = (
  apiCustomer: any,
  jobs: any[] = [],
) => ({
  id: apiCustomer.id,
  customer_name: apiCustomer.customer_name || "",
  name: apiCustomer.customer_name || "",
  email: apiCustomer.email || "",
  phone: apiCustomer.phone || "",
  company_name: apiCustomer.company_name || "",
  address: apiCustomer.address || "",
  created_at: apiCustomer.created_at || "",
  jobs,
  total_jobs: jobs.length,
});

export function CustomersPage() {
  const { hasPermission } = usePermissions();
  const canDeleteJob = hasPermission("jobs", "delete");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  useListingEstimatePrefillSync(
    "customers",
    selectedCustomer,
    selectedJob,
    selectedSubJob,
  );
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
  /** Cross-page URL target — pinned to top of sidebar so they stay visible outside page 1. */
  const [pinnedListingCustomer, setPinnedListingCustomer] =
    useState<any | null>(null);
  const [jobDeleteTarget, setJobDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [expandedTableJobs, setExpandedTableJobs] = useState<Set<string>>(
    new Set(),
  );
  const [customerJobsPage, setCustomerJobsPage] = useState(1);
  const [subJobsPageByJobId, setSubJobsPageByJobId] = useState<
    Record<string, number>
  >({});
  const jobsTablePerPage = 10;
  const subJobsTablePerPage = 10;
  const [customerActivity, setCustomerActivity] = useState<any[]>([]);
  const [isLoadingCustomerActivity, setIsLoadingCustomerActivity] =
    useState(false);
  const [customerActivityPage, setCustomerActivityPage] = useState(1);
  const customerActivityPerPage = 5;

  /** Same page+limit in-flight: collapse duplicate calls (e.g. React Strict Mode). */
  const customersListFetchRef = useRef<{
    key: string;
    promise: Promise<void>;
  } | null>(null);

  const focusFromUrl = useMemo(() => {
    const jobId = searchParams?.get("jobId") || "";
    const estimateId = searchParams?.get("estimateId") || "";
    const customerId = searchParams?.get("customerId") || "";
    return {
      jobId: jobId.trim(),
      estimateId: estimateId.trim(),
      customerId: customerId.trim(),
    };
  }, [searchParams]);

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

  // Auto-select first customer when customers are loaded (skip when URL targets a specific customer)
  useEffect(() => {
    if (focusFromUrl.customerId || focusFromUrl.jobId) return;
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
  }, [customersWithJobs.length, focusFromUrl.customerId, focusFromUrl.jobId]);

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

  const toggleTableJobExpansion = (jobId: string) => {
    setExpandedTableJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const clearDeepLinkParamsIfDifferentParent = (parentId: string) => {
    const urlParentId = focusFromUrl.customerId;
    if (!urlParentId || urlParentId === parentId) return;

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("customerId");
    params.delete("contractorId");
    params.delete("jobId");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setPinnedListingCustomer(null);
  };

  const selectCustomer = (customerId: string) => {
    clearDeepLinkParamsIfDifferentParent(customerId);
    setSelectedCustomer(customerId);
    setSelectedJob(null);
    setSelectedSubJob(null);
    setEnhancedJobData(null);
    setExpandedTableJobs(new Set());
    setCustomerJobsPage(1);
    setSubJobsPageByJobId({});
    // Jobs are already loaded in fetchCustomersWithJobs, no need to fetch again
  };

  const fetchAllJobsBulk = async (): Promise<any[]> => {
    const jobsResponse = await globalApiCall(
      `${apiBaseUrl}/job/getJobsByCustomer`,
      { method: "GET" },
    );
    const jobsData = await jobsResponse.json();
    if (jobsData.success) {
      return normalizeJobsPayload(jobsData.data);
    }
    return [];
  };

  const fetchJobsForCustomerListing = async (customerId: string) => {
    try {
      const result = await apiClient.getJobsByCustomer(customerId);
      if (result.success) {
        const jobs = normalizeJobsPayload(result.data);
        if (jobs.length > 0) {
          return annotateJobsForListing(jobs);
        }
      }
    } catch (error) {
      console.error(
        "Per-customer jobs API failed, trying bulk filter:",
        customerId,
        error,
      );
    }

    try {
      const allJobs = await fetchAllJobsBulk();
      const filtered = allJobs.filter((job) =>
        jobBelongsToCustomer(job, customerId),
      );
      if (filtered.length > 0) {
        return annotateJobsForListing(filtered);
      }
    } catch (error) {
      console.error("Bulk jobs fetch for customer failed:", customerId, error);
    }
    return [];
  };

  const buildCustomerListingEntry = async (
    base: any,
    customerId: string,
  ) => {
    const jobs = base.jobs?.length
      ? annotateJobsForListing(base.jobs)
      : await fetchJobsForCustomerListing(customerId);
    return {
      ...base,
      jobs,
      total_jobs: jobs.length,
    };
  };

  const loadCustomerForUrlSelection = async (customerId: string) => {
    const inList =
      paginatedCustomers.find((c) => c.id?.toString?.() === customerId) ||
      customersWithJobs.find((c) => c.id?.toString?.() === customerId);

    if (inList) {
      const entry = await buildCustomerListingEntry(inList, customerId);
      setPinnedListingCustomer(entry);
      return entry;
    }

    const response = await globalApiCall(
      `${apiBaseUrl}/customer/getCustomerById/${customerId}`,
      { method: "GET" },
    );
    const responseData = await response.json();
    if (!responseData.success || !responseData.data) {
      throw new Error(
        responseData.message || "Failed to fetch customer details",
      );
    }
    const jobs = await fetchJobsForCustomerListing(customerId);
    const entry = mapApiCustomerToListingEntity(responseData.data, jobs);
    setPinnedListingCustomer(entry);
    return entry;
  };

  const findListingCustomer = (parentId: string) => {
    if (pinnedListingCustomer?.id?.toString?.() === parentId) {
      return pinnedListingCustomer;
    }
    return (
      paginatedCustomers.find((c) => c.id?.toString?.() === parentId) ||
      customersWithJobs.find((c) => c.id?.toString?.() === parentId) ||
      null
    );
  };

  const mergeListingCustomersForJobResolve = () => {
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const c of [
      pinnedListingCustomer,
      ...customersWithJobs,
      ...paginatedCustomers,
    ]) {
      if (!c?.id) continue;
      const id = c.id.toString();
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(c);
    }
    return merged;
  };

  const getListingEntityType = (entity: any) => {
    return (
      entity?.tag?.toString?.().trim().toLowerCase() ||
      entity?.type?.toString?.().trim().toLowerCase() ||
      entity?.customer_type?.toString?.().trim().toLowerCase() ||
      ""
    );
  };

  const handleSelectParent = (parentId: string) => {
    const entity = findListingCustomer(parentId);

    if (getListingEntityType(entity) === "contractor") {
      router.push(`/contractors?contractorId=${parentId}`);
      return;
    }
    selectCustomer(parentId);
  };

  const handleSelectJob = (jobId: string, parentId: string) => {
    const entity = findListingCustomer(parentId);
    if (getListingEntityType(entity) === "contractor") {
      router.push(`/contractors?contractorId=${parentId}&jobId=${jobId}`);
      return;
    }
    selectJob(jobId, parentId);
  };

  const handleSelectSubJob = (
    subJobId: string,
    jobId: string,
    parentId: string,
  ) => {
    const entity = findListingCustomer(parentId);
    if (getListingEntityType(entity) === "contractor") {
      router.push(
        `/contractors?contractorId=${parentId}&jobId=${subJobId}`,
      );
      return;
    }
    selectSubJob(subJobId, jobId, parentId);
  };

  // Pin + select customer from cross-page navigation (?customerId=)
  useEffect(() => {
    const customerId = focusFromUrl.customerId;
    if (!customerId) {
      setPinnedListingCustomer(null);
      return;
    }
    if (focusFromUrl.jobId) return;

    let cancelled = false;
    (async () => {
      try {
        await loadCustomerForUrlSelection(customerId);
        if (cancelled) return;
        setExpandedCustomers((prev) => {
          const next = new Set(prev);
          next.add(customerId);
          return next;
        });
        selectCustomer(customerId);
      } catch (error) {
        console.error("Error selecting customer from URL:", error);
        toast.error("Could not load customer");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusFromUrl.customerId, focusFromUrl.jobId]);

  // After page fetch, merge page row into pin without dropping jobs fetched for off-page users
  useEffect(() => {
    const customerId = focusFromUrl.customerId;
    if (!customerId || focusFromUrl.jobId) return;
    const fromPage =
      paginatedCustomers.find((c) => c.id?.toString?.() === customerId) ||
      customersWithJobs.find((c) => c.id?.toString?.() === customerId);
    if (!fromPage) return;

    setPinnedListingCustomer((prev: any) => {
      const pageJobs = fromPage.jobs?.length
        ? annotateJobsForListing(fromPage.jobs)
        : [];
      const prevJobs =
        prev?.id?.toString?.() === customerId && prev.jobs?.length
          ? prev.jobs
          : [];
      const jobs = pageJobs.length > 0 ? pageJobs : prevJobs;
      return {
        ...fromPage,
        jobs,
        total_jobs: jobs.length,
      };
    });
  }, [
    paginatedCustomers,
    customersWithJobs,
    focusFromUrl.customerId,
    focusFromUrl.jobId,
  ]);

  // Retry jobs when bulk getJobsByCustomer finishes after pin was created with 0 jobs
  useEffect(() => {
    const customerId = focusFromUrl.customerId;
    if (!customerId || focusFromUrl.jobId) return;
    if (pinnedListingCustomer?.id?.toString?.() !== customerId) return;
    if ((pinnedListingCustomer?.jobs?.length ?? 0) > 0) return;

    let cancelled = false;
    (async () => {
      const jobs = await fetchJobsForCustomerListing(customerId);
      if (cancelled || jobs.length === 0) return;
      setPinnedListingCustomer((prev: any) => {
        if (prev?.id?.toString?.() !== customerId) return prev;
        return { ...prev, jobs, total_jobs: jobs.length };
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    focusFromUrl.customerId,
    focusFromUrl.jobId,
    pinnedListingCustomer?.id,
    customersWithJobs.length,
    isLoadingCustomers,
  ]);

  const selectJob = async (jobId: string, customerId: string) => {
    clearDeepLinkParamsIfDifferentParent(customerId);
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

  // Deep-link: ?customerId= & ?jobId= (main job or sub-job)
  useEffect(() => {
    const jobId = focusFromUrl.jobId;
    if (!jobId) return;
    const listingCustomers = mergeListingCustomersForJobResolve();
    if (!listingCustomers.length) return;

    const resolved = resolveCustomerJobNavigation(
      listingCustomers,
      jobId,
      focusFromUrl.customerId,
    );
    if (!resolved) return;

    if (resolved.subJobId) {
      if (
        selectedSubJob === resolved.subJobId &&
        selectedJob === resolved.parentJobId &&
        selectedCustomer === resolved.customerId
      ) {
        return;
      }
    } else if (
      selectedJob === resolved.parentJobId &&
      selectedCustomer === resolved.customerId &&
      !selectedSubJob
    ) {
      return;
    }

    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      next.add(resolved.customerId);
      return next;
    });
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      next.add(resolved.parentJobId);
      return next;
    });

    if (resolved.subJobId) {
      setExpandedSubJobs((prev) => {
        const next = new Set(prev);
        next.add(resolved.subJobId!);
        return next;
      });
      void selectSubJob(
        resolved.subJobId,
        resolved.parentJobId,
        resolved.customerId,
      );
    } else {
      void selectJob(resolved.parentJobId, resolved.customerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    focusFromUrl.jobId,
    focusFromUrl.customerId,
    customersWithJobs,
    paginatedCustomers,
    pinnedListingCustomer,
  ]);

  // Load pinned customer when landing with ?customerId= & ?jobId= together
  useEffect(() => {
    const customerId = focusFromUrl.customerId;
    const jobId = focusFromUrl.jobId;
    if (!customerId || !jobId) return;

    let cancelled = false;
    (async () => {
      try {
        await loadCustomerForUrlSelection(customerId);
        if (cancelled) return;
        setExpandedCustomers((prev) => {
          const next = new Set(prev);
          next.add(customerId);
          return next;
        });
      } catch (error) {
        console.error("Error loading customer for job deep-link:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusFromUrl.customerId, focusFromUrl.jobId]);

  const selectSubJob = async (
    subJobId: string,
    jobId: string,
    customerId: string,
  ) => {
    clearDeepLinkParamsIfDifferentParent(customerId);
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

  const handleConfirmDeleteJob = async () => {
    if (!canDeleteJob) {
      toast.error("You do not have permission to delete jobs.");
      return;
    }
    if (!jobDeleteTarget) return;
    setIsDeletingJob(true);
    try {
      await apiClient.deleteJob(jobDeleteTarget.id);
      toast.success("Job deleted successfully");
      const deletedId = jobDeleteTarget.id;
      setJobDeleteTarget(null);
      if (selectedJob === deletedId) {
        setSelectedJob(null);
        setSelectedSubJob(null);
        setEnhancedJobData(null);
      }
      await fetchCustomersWithJobs({ force: true });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete job",
      );
    } finally {
      setIsDeletingJob(false);
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

  const getStatusIcon = (status?: string) => {
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

  const formatActivityDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const sidebarListingCustomers = useMemo(() => {
    const base = paginatedCustomers;
    if (!pinnedListingCustomer) return base;
    const pinId = pinnedListingCustomer.id?.toString?.();
    if (!pinId) return base;
    const withoutPin = base.filter((c) => c.id?.toString?.() !== pinId);
    return [pinnedListingCustomer, ...withoutPin];
  }, [paginatedCustomers, pinnedListingCustomer]);

  const selectedCustomerData = selectedCustomer
    ? customersWithJobs.find((c) => c.id.toString() === selectedCustomer) ||
      paginatedCustomers.find((c) => c.id.toString() === selectedCustomer) ||
      (pinnedListingCustomer?.id?.toString() === selectedCustomer
        ? pinnedListingCustomer
        : null)
    : null;
  const selectedJobData = selectedJob
    ? selectedCustomerData?.jobs?.find(
        (j: any) => j.id.toString() === selectedJob,
      )
    : null;

  const customerJobsList = selectedCustomerData?.jobs || [];
  const totalCustomerJobsCount = customerJobsList.length;
  const totalCustomerJobsPages = Math.max(
    1,
    Math.ceil(totalCustomerJobsCount / jobsTablePerPage),
  );
  const paginatedCustomerJobs = useMemo(() => {
    const start = (customerJobsPage - 1) * jobsTablePerPage;
    return customerJobsList.slice(start, start + jobsTablePerPage);
  }, [customerJobsList, customerJobsPage, jobsTablePerPage]);

  const getPaginatedSubJobs = (subJobs: any[], jobId: string) => {
    const total = subJobs.length;
    const totalPages = Math.max(1, Math.ceil(total / subJobsTablePerPage));
    const page = Math.min(subJobsPageByJobId[jobId] ?? 1, totalPages);
    const start = (page - 1) * subJobsTablePerPage;
    return {
      items: subJobs.slice(start, start + subJobsTablePerPage),
      page,
      totalPages,
      total,
    };
  };

  const setSubJobsPageForJob = (jobId: string, page: number) => {
    setSubJobsPageByJobId((prev) => ({ ...prev, [jobId]: page }));
  };

  useEffect(() => {
    if (customerJobsPage > totalCustomerJobsPages) {
      setCustomerJobsPage(totalCustomerJobsPages);
    }
  }, [customerJobsPage, totalCustomerJobsPages]);

  useEffect(() => {
    setCustomerJobsPage(1);
    setSubJobsPageByJobId({});
    setExpandedTableJobs(new Set());
  }, [selectedCustomer]);

  const totalCustomerActivityCount = customerActivity.length;
  const totalCustomerActivityPages = Math.max(
    1,
    Math.ceil(totalCustomerActivityCount / customerActivityPerPage),
  );
  const paginatedCustomerActivity = useMemo(() => {
    const start = (customerActivityPage - 1) * customerActivityPerPage;
    return customerActivity.slice(start, start + customerActivityPerPage);
  }, [customerActivity, customerActivityPage]);

  useEffect(() => {
    if (customerActivityPage > totalCustomerActivityPages) {
      setCustomerActivityPage(totalCustomerActivityPages);
    }
  }, [customerActivityPage, totalCustomerActivityPages]);

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const fetchCustomerActivity = async (customerId: string) => {
    if (!customerId) {
      setCustomerActivity([]);
      return;
    }
    try {
      setIsLoadingCustomerActivity(true);
      const response = await globalApiCall(
        `${apiBaseUrl}/customer/getCustomerActivity/${customerId}`,
        {
          method: "GET",
        },
      );
      const responseData = await response.json();
      const payload = responseData?.data ?? responseData ?? {};
      const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
      const invoiceActivity = Array.isArray(payload?.invoice_activity)
        ? payload.invoice_activity
        : [];

      const jobTitleById = new Map<string, string>();
      jobs.forEach((job: any) => {
        if (job?.job_id != null) {
          jobTitleById.set(String(job.job_id), job?.job_title || "N/A");
        }
      });

      const activityRows = invoiceActivity.map((activity: any) => ({
        ...activity,
        job_title: jobTitleById.get(String(activity?.job_id ?? "")) || "N/A",
      }));

      setCustomerActivity(activityRows);
      setCustomerActivityPage(1);
    } catch (error) {
      console.error("Error fetching customer activity:", error);
      setCustomerActivity([]);
    } finally {
      setIsLoadingCustomerActivity(false);
    }
  };

  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerActivity([]);
      setCustomerActivityPage(1);
      return;
    }
    void fetchCustomerActivity(selectedCustomer);
  }, [selectedCustomer]);

  // Normalize phone to E.164 so react-phone-number-input can infer country/flag
  const normalizePhoneToE164 = (rawPhone: string) => {
    const raw = (rawPhone || "").trim();
    if (!raw) return "";
    if (raw.startsWith("+")) return raw;

    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  };

  /** API payload: hyphen after country code, e.g. +1-2025550123, +91-9876543210 */
  const formatPhoneForPayload = (rawPhone: string): string => {
    const e164 = normalizePhoneToE164(rawPhone);
    if (!e164) return "";
    const digits = e164.replace(/[^\d+]/g, "");
    if (!digits.startsWith("+")) return e164;

    if (digits.startsWith("+1") && digits.length > 2) {
      const rest = digits.slice(2);
      return rest ? `+1-${rest}` : "+1";
    }

    const match = digits.match(/^\+(\d{2,3})(\d*)$/);
    if (!match) return e164;
    const country = match[1];
    const rest = match[2];
    return rest ? `+${country}-${rest}` : `+${country}`;
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
    }
    if (!customerFormData.address.trim()) {
      errors.address = "Address is required";
    }
    if (!customerFormData.company.trim()) {
      errors.company = "Company name is required";
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
        phone: formatPhoneForPayload(customerFormData.phone) || "",
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
        fetchCustomersData(currentPage, itemsPerPage, true);
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
  const fetchCustomersWithJobs = async (options?: { force?: boolean }) => {
    const key = `${currentPage}|${itemsPerPage}`;
    if (options?.force) {
      customersListFetchRef.current = null;
    }
    if (!options?.force) {
      const existing = customersListFetchRef.current;
      if (existing?.key === key) {
        return existing.promise;
      }
    }

    const promise = (async () => {
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

            if (jobsData.success && jobsData.data != null) {
              jobsByCustomer = normalizeJobsPayload(jobsData.data);
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
              tag: customer.tag || "customer",
              type: customer.type || "customer",
              customer_type: customer.customer_type || "customer",
              email: customer.email || "",
              phone: customer.phone || "",
              company_name: customer.company_name || "",
              address: customer.address || "",
              created_at: customer.created_at || "",
              jobs: customerJobs,
              total_jobs: customerJobs.length,
            };
          });

          const annotated = annotateEntitiesForListing(
            customersWithJobsArray.map((c: any) => ({
              ...c,
              jobs: annotateJobsForListing(c.jobs || []),
            })),
          );

          const sortedWithRecent = sortEntitiesByRecentJobActivity(
            annotated,
            (a: any, b: any) => {
              if (b.total_jobs !== a.total_jobs) {
                return b.total_jobs - a.total_jobs;
              }
              return (a.customer_name || "").localeCompare(b.customer_name || "");
            },
          );

          // Set customers directly from API response (server-side pagination)
          setCustomersWithJobs(sortedWithRecent);
          setPaginatedCustomers(sortedWithRecent);
          setAllCustomersWithJobs(sortedWithRecent);

          // URL deep-link: attach jobs from bulk map when user is not on page 1
          const urlCustomerId = searchParams?.get("customerId")?.trim();
          if (urlCustomerId) {
            const numericId = Number(urlCustomerId);
            const urlJobs =
              jobsMap.get(numericId) ||
              jobsMap.get(Number(urlCustomerId) as unknown as number) ||
              [];
            if (urlJobs.length > 0) {
              const annotatedUrlJobs = annotateJobsForListing(urlJobs);
              setPinnedListingCustomer((prev: any) => {
                if (prev?.id?.toString?.() !== urlCustomerId) return prev;
                return {
                  ...prev,
                  jobs: annotatedUrlJobs,
                  total_jobs: annotatedUrlJobs.length,
                };
              });
            }
          }

          // Also set for table view compatibility
          const transformedCustomers = sortedWithRecent.map(
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
        if (customersListFetchRef.current?.key === key) {
          customersListFetchRef.current = null;
        }
      }
    })();

    customersListFetchRef.current = { key, promise };
    return promise;
  };

  const fetchCustomersData = async (
    page: number,
    limit: number,
    forceRefresh = false,
  ) => {
    await fetchCustomersWithJobs({ force: forceRefresh });
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
            tag: customer.tag || "customer",
            type: customer.type || "customer",
            customer_type: customer.customer_type || "",
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
          const fallbackRaw = allCustomersWithJobs.filter((customer: any) =>
            (customer.customer_name || customer.name || "")
              .toLowerCase()
              .includes(searchLower),
          );
          const fallback = annotateEntitiesForListing(
            fallbackRaw.map((c: any) => {
              return {
                ...c,
                jobs: annotateJobsForListing(c.jobs || []),
              };
            }),
          );
          setCustomersWithJobs(fallback);
          setPaginatedCustomers(fallback);
        } else {
          const searchResults = annotateEntitiesForListing(
            customersFromSearch.map((c: any) => ({
              ...c,
              jobs: annotateJobsForListing(c.jobs || []),
            })),
          );
          setCustomersWithJobs(searchResults);
          setPaginatedCustomers(searchResults);
        }
      } catch (error) {
        console.error("Error searching customers/jobs:", error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    runSearch();
  }, [searchTerm, itemsPerPage]);

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
      if (!validateForm()) {
        return;
      }
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
        phone: formatPhoneForPayload(customerFormData.phone) || "",
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
        fetchCustomersData(currentPage, itemsPerPage, true);
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

    const entityKind = resolveEntityKind(customerToDelete) ?? "customer";
    const deleteUrl =
      entityKind === "contractor"
        ? `${apiBaseUrl}/contractor/deleteContractor/${customerToDelete.id}`
        : `${apiBaseUrl}/customer/deleteCustomer/${customerToDelete.id}`;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("jdp_auth")
        ? JSON.parse(localStorage.getItem("jdp_auth")!).token
        : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers,
      });

      const responseData = await response.json();
      console.log("Entity deletion response:", responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== "undefined") {
          const { toast } = await import("sonner");
          toast.success(
            entityKind === "contractor"
              ? "Contractor deleted successfully!"
              : "Customer deleted successfully!",
          );
        }

        setShowDeleteAlert(false);
        setCustomerToDelete(null);
        // Refresh the customers list and stats
        fetchCustomersData(currentPage, itemsPerPage, true);
        fetchCustomerStats();
      } else {
        throw new Error(
          responseData.message ||
            (entityKind === "contractor"
              ? "Failed to delete contractor"
              : "Failed to delete customer"),
        );
      }
    } catch (error) {
      console.error("Error deleting entity:", error);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error(
          error instanceof Error ? error.message : "Failed to delete record",
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
          phone: normalizePhoneToE164(apiCustomer.phone || ""),
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
    void fetchCustomerStats();

    const fetchCustomersByStatus = async () => {
      if (!statusFilter || statusFilter === "all") {
        await fetchCustomersData(currentPage, itemsPerPage);
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

    void fetchCustomersByStatus();
  }, [statusFilter, currentPage, itemsPerPage]);

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Customer Listings */}
      <div className="w-80 shrink-0  bg-gray-50 border-r border-gray-200 flex flex-col sticky top-0 h-screen">
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

        {/* Customer Listings */}
        <div className="min-w-0 flex-1 min-h-0">
            <CommonEntityListing
              data={sidebarListingCustomers}
              isLoading={isLoadingCustomers}
              emptyText="No customers found"
              searchPlaceholder="Search customers or jobs..."
              onSearchChange={setSearchTerm}
              expandedParents={expandedCustomers}
              expandedJobs={expandedJobs}
              selectedParent={selectedCustomer}
              selectedJob={selectedJob}
              selectedSubJob={selectedSubJob}
              onToggleParent={toggleCustomer}
              onToggleJob={toggleJob}
              onSelectParent={handleSelectParent}
              onSelectJob={handleSelectJob}
              onSelectSubJob={handleSelectSubJob}
              onEditParent={(customer) => handleEditCustomer(customer)}
              onDeleteParent={(customer) => handleDeleteCustomerClick(customer)}
              hasEditPermission={hasPermission("customers", "edit")}
              hasDeletePermission={hasPermission("customers", "delete")}
              getParentName={(customer) =>
                customer.customer_name || customer.name || ""
              }
              getParentJobCount={(customer) =>
                customer.total_jobs || customer.jobs?.length || 0
              }
              itemsPerPage={itemsPerPage}
              getStatusIcon={getStatusIcon}
              totalItems={totalCustomers}
              footer={
                <div className="mx-auto text-center">
                  <div className="mb-3 text-sm text-slate-600">
                    Showing {customersWithJobs.length} of {totalCustomers}{" "}
                    Customer • Page {currentPage} of {totalPages}
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
              }
            />
        </div>
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
                  <Upload className="h-4 w-4 mr-2" />
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
                  {!selectedSubJob && selectedJobData.subJobs?.length ? (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      {selectedJobData.subJobs?.length || 0} Sub-Jobs
                    </Badge>
                  ) : null}
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
                        /* Sub-job detail: do not pass parent's subJobs — table is main-job only */
                        subJobs: [],
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
                          onJobsRefresh={() => void fetchCustomersWithJobs({ force: true })}
                          focusEstimateId={focusFromUrl.estimateId}
                          onViewSubJob={(subJobId) =>
                            selectSubJob(
                              subJobId,
                              selectedJob!,
                              selectedCustomer!,
                            )
                          }
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
                        subJobs:
                          selectedJobData.subJobs ??
                          (jobData as any)?.subJobs ??
                          [],
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
                          onJobsRefresh={() => void fetchCustomersWithJobs({ force: true })}
                          focusEstimateId={focusFromUrl.estimateId}
                          onViewSubJob={(subJobId) =>
                            selectSubJob(
                              subJobId,
                              selectedJobData.id.toString(),
                              selectedCustomer!,
                            )
                          }
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
              <div className="flex items-center gap-2">
                {/* `/jobs` route disabled */}
                {/* <Link
                  href={"/jobs?create=true"}
                  className="flex items-center w-[120px] p-2 justify-center border rounded gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Add Jobs
                </Link> */}
                <Badge
                  variant="default"
                  className="p-2 bg-green-100 text-green-800 border-green-200"
                >
                  Active
                </Badge>
              </div>
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
                  job.status === "pending" ||
                  job.status === "in-progress",
              ).length;
              const totalRevenue = jobs.reduce((sum: number, job: any) => {
                return (
                  sum + (job.totalEstimatedCost || job.estimated_cost || 0)
                );
              }, 0);

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <div className="text-sm text-gray-600">In Progess</div>
                    </CardContent>
                  </Card>

                  {/* Total Revenue */}
                  {/* <Card>
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </CardContent>
                  </Card> */}
                </div>
              );
            })()}
            {/* Jobs Table */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Jobs
                </CardTitle>
              </CardHeader>

              <CardContent>
                {selectedCustomerData.jobs &&
                selectedCustomerData.jobs.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Est. Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {paginatedCustomerJobs.map((job: any) => {
                          const jobId = job.id.toString();
                          const hasSubJobs =
                            Array.isArray(job.subJobs) && job.subJobs.length > 0;
                          const isExpanded = expandedTableJobs.has(jobId);
                          const subJobsPagination = hasSubJobs
                            ? getPaginatedSubJobs(job.subJobs, jobId)
                            : null;

                          return (
                            <React.Fragment key={jobId}>
                              <TableRow key={jobId}>
                                <TableCell className="max-w-[240px] font-medium">
                                  <span
                                    className="block truncate"
                                    title={job.job_title || "N/A"}
                                  >
                                    {job.job_title || "N/A"}
                                  </span>
                                </TableCell>

                                <TableCell className="capitalize">
                                  {(job.job_type || "N/A").replace("_", " ")}
                                </TableCell>

                                <TableCell className="max-w-[240px] truncate">
                                  {job.address || "N/A"}
                                </TableCell>

                                <TableCell>
                                  {job.due_date
                                    ? formatDate(job.due_date)
                                    : "N/A"}
                                </TableCell>

                                <TableCell>
                                  {formatCurrency(job.estimated_cost || 0)}
                                </TableCell>
                                <TableCell>{getStatusBadge(job.status)}</TableCell>

                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {hasSubJobs && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          toggleTableJobExpansion(jobId)
                                        }
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-4 w-4 mr-1" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 mr-1" />
                                        )}
                                        {isExpanded
                                          ? "Hide Sub Jobs"
                                          : "Show Sub Jobs"}
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        selectJob(
                                          jobId,
                                          selectedCustomerData.id.toString(),
                                        )
                                      }
                                    >
                                      <Eye className="h-4 w-4 " />
                                      
                                    </Button>
                                    {canDeleteJob && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        title="Delete job"
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() =>
                                          setJobDeleteTarget({
                                            id: jobId,
                                            title:
                                              job.job_title ||
                                              job.title ||
                                              "this job",
                                          })
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>

                              {hasSubJobs && (
                                <TableRow
                                  key={`${jobId}-subjobs`}
                                  className="border-b-0 hover:bg-transparent data-[state=selected]:bg-transparent"
                                >
                                  <TableCell colSpan={7} className="p-0">
                                    <div
                                      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                                        isExpanded
                                          ? "grid-rows-[1fr]"
                                          : "grid-rows-[0fr]"
                                      }`}
                                    >
                                      <div className="min-h-0 overflow-hidden">
                                        <div className="border-border bg-muted/30 border-b border-t px-3 pb-3 pt-2">
                                          <div className="overflow-x-auto rounded-lg border bg-background">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Job Title</TableHead>
                                                  <TableHead>Type</TableHead>
                                                  <TableHead>Address</TableHead>
                                                  <TableHead>Due Date</TableHead>
                                                  <TableHead>Est. Cost</TableHead>
                                                  <TableHead>Status</TableHead>
                                                  <TableHead className="text-right">
                                                    Action
                                                  </TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {(
                                                  subJobsPagination?.items ??
                                                  []
                                                ).map((subJob: any) => (
                                                    <TableRow
                                                      key={`${jobId}-${subJob.id}`}
                                                    >
                                                      <TableCell className="max-w-[200px] font-medium">
                                                        <span
                                                          className="block truncate"
                                                          title={
                                                            subJob.job_title ||
                                                            "N/A"
                                                          }
                                                        >
                                                          {subJob.job_title ||
                                                            "N/A"}
                                                        </span>
                                                      </TableCell>
                                                      <TableCell className="capitalize">
                                                        {(
                                                          subJob.job_type ||
                                                          "N/A"
                                                        ).replace("_", " ")}
                                                      </TableCell>
                                                      <TableCell className="max-w-[240px] truncate">
                                                        {subJob.address ||
                                                          "N/A"}
                                                      </TableCell>
                                                      <TableCell>
                                                        {subJob.due_date
                                                          ? formatDate(
                                                              subJob.due_date,
                                                            )
                                                          : "N/A"}
                                                      </TableCell>
                                                      <TableCell>
                                                        {formatCurrency(
                                                          subJob.estimated_cost ||
                                                            0,
                                                        )}
                                                      </TableCell>
                                                      <TableCell>
                                                        {getStatusBadge(
                                                          subJob.status,
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                          <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                              selectSubJob(
                                                                subJob.id.toString(),
                                                                jobId,
                                                                selectedCustomerData.id.toString(),
                                                              )
                                                            }
                                                          >
                                                            <Eye className="h-4 w-4" />
                                                            
                                                          </Button>
                                                          {canDeleteJob && (
                                                            <Button
                                                              variant="outline"
                                                              size="sm"
                                                              title="Delete sub-job"
                                                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                              onClick={() =>
                                                                setJobDeleteTarget({
                                                                  id: subJob.id.toString(),
                                                                  title:
                                                                    subJob.job_title ||
                                                                    subJob.title ||
                                                                    "this sub-job",
                                                                })
                                                              }
                                                            >
                                                              <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                          )}
                                                        </div>
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                              </TableBody>
                                            </Table>
                                            {subJobsPagination && (
                                              <TableListPagination
                                                compact
                                                page={subJobsPagination.page}
                                                totalPages={
                                                  subJobsPagination.totalPages
                                                }
                                                totalItems={subJobsPagination.total}
                                                itemsPerPage={subJobsTablePerPage}
                                                itemLabel="sub-jobs"
                                                onPageChange={(page) =>
                                                  setSubJobsPageForJob(jobId, page)
                                                }
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <TableListPagination
                      page={customerJobsPage}
                      totalPages={totalCustomerJobsPages}
                      totalItems={totalCustomerJobsCount}
                      itemsPerPage={jobsTablePerPage}
                      itemLabel="jobs"
                      onPageChange={setCustomerJobsPage}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No jobs found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      This customer does not have any jobs yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCustomerActivity ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : paginatedCustomerActivity.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedCustomerActivity.map((item: any, index: number) => {
                      const status =
                        item?.status || item?.payment_status || "N/A";
                      const invoiceNumber =
                        item?.invoice_number ||
                        item?.estimate_number ||
                        item?.invoice_no ||
                        `EST-${item?.estimate_id || index + 1}`;
                      const sentDate = formatActivityDate(item?.invoice_sent_at);
                      const sentTo = item?.invoice_sent_to || "N/A";
                      const sentByName = item?.sent_by_user?.full_name || "N/A";
                      const sentByRole = item?.sent_by_user?.role || "N/A";
                      const jobTitle = item?.job_title || "N/A";
                      const rowKey = `${invoiceNumber}-${index}`;

                      return (
                        <div
                          key={rowKey}
                          className="rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  Estimate
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  Estimate
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">
                                {jobTitle}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                #{invoiceNumber} &nbsp; Sent: {sentDate}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Sent to: {sentTo}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Sent by: {sentByName} ({sentByRole})
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                {invoiceNumber}
                              </p>
                              <Badge variant="secondary" className="mt-1">
                                {String(status).replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="text-sm text-gray-500">
                        Showing{" "}
                        {(customerActivityPage - 1) * customerActivityPerPage + 1}{" "}
                        to{" "}
                        {Math.min(
                          customerActivityPage * customerActivityPerPage,
                          totalCustomerActivityCount,
                        )}{" "}
                        of {totalCustomerActivityCount} invoices
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCustomerActivityPage((prev) =>
                              Math.max(prev - 1, 1),
                            )
                          }
                          disabled={customerActivityPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {customerActivityPage} of{" "}
                          {totalCustomerActivityPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCustomerActivityPage((prev) =>
                              Math.min(prev + 1, totalCustomerActivityPages),
                            )
                          }
                          disabled={
                            customerActivityPage === totalCustomerActivityPages
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-gray-500 font-medium">
                      No transaction history found
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      This customer has no transactions yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                    <PhoneInput
                      id="phone"
                      international
                      withCountryCallingCode
                      defaultCountry="US"
                      countryCallingCodeEditable={false}
                      limitMaxLength
                      value={customerFormData.phone}
                      onChange={(value) => {
                        const safeValue = value || "";
                        setCustomerFormData({
                          ...customerFormData,
                          phone: safeValue,
                        });
                        clearValidationError("phone");
                      }}
                      className={
                        validationErrors.phone
                          ? "mt-1 border border-red-500 rounded-md px-3 py-2"
                          : "mt-1 border border-gray-300 rounded-md px-3 py-2"
                      }
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
                    apiKey={GOOGLE_MAPS_API_KEY}
                    options={ADDRESS_AUTOCOMPLETE_OPTIONS}
                    onPlaceSelected={(place: any) => {
                      if (place) {
                        // Keep overlay disabled during selection to prevent modal close
                        const overlay = document.querySelector(
                          "[data-radix-dialog-overlay]",
                        );
                        if (overlay) {
                          (overlay as HTMLElement).style.pointerEvents = "none";
                        }

                        const address = resolveFormattedPlaceAddress(place);
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
                    placeholder={ADDRESS_SEARCH_PLACEHOLDER}
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
                    Company Name *
                  </Label>
                  <Input
                    id="company"
                    value={customerFormData.company}
                    onChange={(e) => {
                      setCustomerFormData({
                        ...customerFormData,
                        company: e.target.value,
                      });
                      clearValidationError("company");
                    }}
                    placeholder="Enter company name"
                    className={`mt-1 ${validationErrors.company ? "border-red-500" : ""}`}
                  />
                  {validationErrors.company && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.company}
                    </p>
                  )}
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
              Are you sure you want to delete this{" "}
              {resolveEntityKind(customerToDelete) === "contractor"
                ? "contractor"
                : "customer"}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              record &quot;{customerToDelete?.name}&quot; from your database.
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

      <AlertDialog
        open={!!jobDeleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeletingJob) setJobDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The job &quot;
              {jobDeleteTarget?.title}&quot; will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingJob}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingJob}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              onClick={() => void handleConfirmDeleteJob()}
            >
              {isDeletingJob ? "Deleting…" : "Delete job"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
