"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { globalApiCall } from "../utils/globalApiHandler";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { apiClient } from "../utils/api";
import { JobDetailsPage } from "./JobDetailsPage";
import { TableListPagination } from "./common/TableListPagination";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

interface Job {
  id: number;
  job_title: string;
  job_type: string;
  address: string;
  due_date: string;
  estimated_cost: number;
  status: string;
  subJobs?: Job[];
}

interface ContractorDetails {
  id: number;
  contractor_name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  created_at: string;
  total_jobs?: number;
  completed_jobs?: number;
  ongoing_jobs?: number;
  total_revenue?: number;
  jobs?: Job[];
}

interface ContractorDetailsPageProps {
  contractorId: string;
  onBack: () => void;
  /** When jobs are deleted/updated here, parent listing can refetch (e.g. contractors sidebar). */
  onJobsMutated?: () => void;
  /** List mixes customers + contractors; prefer matching details API. */
  parentEntityKind?: "customer" | "contractor" | null;
}

export function ContractorDetailsPage({
  contractorId,
  onBack,
  onJobsMutated,
  parentEntityKind = null,
}: ContractorDetailsPageProps) {
  const [contractor, setContractor] = useState<ContractorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedSubJob, setSelectedSubJob] = useState<string | null>(null);
  const [enhancedJobData, setEnhancedJobData] = useState<any>(null);
  const [isJobDetailsLoading, setIsJobDetailsLoading] = useState(false);
  
  useEffect(() => {
    setSelectedJob(null);
    setSelectedSubJob(null);
    setEnhancedJobData(null);
    setJobsPage(1);
    setSubJobsPageByJobId({});
    setExpandedTableJobs(new Set());
  }, [contractorId]);
  // Pagination state
  const [jobsPage, setJobsPage] = useState(1);
  const jobsPerPage = 10;
  const subJobsPerPage = 10;
  const [subJobsPageByJobId, setSubJobsPageByJobId] = useState<
    Record<string, number>
  >({});
  const [jobDeleteTarget, setJobDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [expandedTableJobs, setExpandedTableJobs] = useState<Set<string>>(
    new Set(),
  );
  const [contractorActivity, setContractorActivity] = useState<any[]>([]);
  const [isLoadingContractorActivity, setIsLoadingContractorActivity] =
    useState(false);
  const [contractorActivityPage, setContractorActivityPage] = useState(1);
  const contractorActivityPerPage = 5;

  const contractorDetailsFetchRef = useRef<{
    id: string;
    promise: Promise<void>;
  } | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  const mapToDetails = (data: any, jobsFallback: Job[] = []): ContractorDetails => {
    const jobs =
      Array.isArray(data?.jobs) && data.jobs.length > 0
        ? data.jobs
        : jobsFallback;
    return {
      id: data.id,
      contractor_name:
        data.contractor_name || data.customer_name || data.name || "N/A",
      company_name: data.company_name || "N/A",
      email: data.email || "N/A",
      phone: data.phone || "N/A",
      address: data.address || "N/A",
      status: data.status || "inactive",
      created_at: data.created_at || new Date().toISOString(),
      total_jobs:
        data.statistics?.total_jobs ?? data.total_jobs ?? jobs.length ?? 0,
      completed_jobs:
        data.statistics?.completed_jobs ?? data.completed_jobs ?? 0,
      ongoing_jobs: data.statistics?.ongoing_jobs ?? data.ongoing_jobs ?? 0,
      total_revenue:
        data.statistics?.total_estimated_cost ?? data.total_revenue ?? 0,
      jobs,
    };
  };

  const fetchJobsForParent = async (id: string): Promise<Job[]> => {
    try {
      const jobsResult = await apiClient.getJobsByCustomer(id);
      const jobsData = jobsResult?.data;
      if (Array.isArray(jobsData)) return jobsData;
      if (Array.isArray(jobsData?.jobs)) return jobsData.jobs;
      if (Array.isArray(jobsData?.data)) return jobsData.data;
      return [];
    } catch {
      return [];
    }
  };

  const fetchAsContractor = async (
    id: string,
  ): Promise<ContractorDetails | null> => {
    const response = await globalApiCall(
      `${apiBaseUrl}/contractor/getContractorById/${id}?include_jobs=true`,
      { method: "GET" },
    );
    const responseData = await response.json();
    if (responseData.success && responseData.data) {
      return mapToDetails(responseData.data);
    }
    return null;
  };

  const fetchAsCustomer = async (
    id: string,
  ): Promise<ContractorDetails | null> => {
    const response = await globalApiCall(
      `${apiBaseUrl}/customer/getCustomerById/${id}`,
      { method: "GET" },
    );
    const responseData = await response.json();
    if (!responseData.success || !responseData.data) return null;
    const jobs = await fetchJobsForParent(id);
    return mapToDetails(responseData.data, jobs);
  };

  const fetchContractorDetails = async (options?: { force?: boolean }) => {
    if (!contractorId) return;

    if (options?.force) {
      contractorDetailsFetchRef.current = null;
    }
    if (!options?.force) {
      const existing = contractorDetailsFetchRef.current;
      if (existing?.id === contractorId) {
        return existing.promise;
      }
    }

    const id = contractorId;
    const preferCustomer = parentEntityKind === "customer";
    const promise = (async () => {
      try {
        setIsLoading(true);

        let details: ContractorDetails | null = null;
        if (preferCustomer) {
          try {
            details = await fetchAsCustomer(id);
          } catch (e) {
            console.error("Customer details fetch failed:", e);
          }
          if (!details) {
            try {
              details = await fetchAsContractor(id);
            } catch (e) {
              console.error("Contractor details fallback failed:", e);
            }
          }
        } else {
          try {
            details = await fetchAsContractor(id);
          } catch (e) {
            console.error("Contractor details fetch failed:", e);
          }
          if (!details) {
            try {
              details = await fetchAsCustomer(id);
            } catch (e) {
              console.error("Customer details fallback failed:", e);
            }
          }
        }

        if (details) {
          setContractor(details);
          setJobsPage(1);
          setSubJobsPageByJobId({});
        } else {
          setContractor(null);
        }
      } catch (error) {
        console.error("Error fetching parent details:", error);
        setContractor(null);
      } finally {
        setIsLoading(false);
        if (contractorDetailsFetchRef.current?.id === id) {
          contractorDetailsFetchRef.current = null;
        }
      }
    })();

    contractorDetailsFetchRef.current = { id, promise };
    return promise;
  };

  const fetchContractorActivity = async (id: string) => {
    if (!id) {
      setContractorActivity([]);
      return;
    }
    try {
      setIsLoadingContractorActivity(true);
      const response = await globalApiCall(
        `${apiBaseUrl}/contractor/getContractorActivity/${id}`,
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

      setContractorActivity(activityRows);
      setContractorActivityPage(1);
    } catch (error) {
      console.error("Error fetching contractor activity:", error);
      setContractorActivity([]);
    } finally {
      setIsLoadingContractorActivity(false);
    }
  };

  useEffect(() => {
    if (contractorId) {
      fetchContractorDetails({ force: true });
      void fetchContractorActivity(contractorId);
    } else {
      setContractorActivity([]);
      setContractorActivityPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractorId, parentEntityKind]);

  const selectedJobData = selectedJob
    ? contractor?.jobs?.find((j: any) => j.id.toString() === selectedJob)
    : null;
  const allJobs = contractor?.jobs || [];
  const totalJobsCount = allJobs.length;
  const totalJobsPages = Math.max(1, Math.ceil(totalJobsCount / jobsPerPage));

  const paginatedJobs = useMemo(() => {
    const start = (jobsPage - 1) * jobsPerPage;
    const end = start + jobsPerPage;
    return allJobs.slice(start, end);
  }, [allJobs, jobsPage]);

  const getPaginatedSubJobs = (subJobs: Job[], jobId: string) => {
    const total = subJobs.length;
    const totalPages = Math.max(1, Math.ceil(total / subJobsPerPage));
    const page = Math.min(subJobsPageByJobId[jobId] ?? 1, totalPages);
    const start = (page - 1) * subJobsPerPage;
    return {
      items: subJobs.slice(start, start + subJobsPerPage),
      page,
      totalPages,
      total,
    };
  };

  const setSubJobsPageForJob = (jobId: string, page: number) => {
    setSubJobsPageByJobId((prev) => ({ ...prev, [jobId]: page }));
  };

  const totalContractorActivityCount = contractorActivity.length;
  const totalContractorActivityPages = Math.max(
    1,
    Math.ceil(totalContractorActivityCount / contractorActivityPerPage),
  );
  const paginatedContractorActivity = useMemo(() => {
    const start = (contractorActivityPage - 1) * contractorActivityPerPage;
    return contractorActivity.slice(start, start + contractorActivityPerPage);
  }, [contractorActivity, contractorActivityPage]);

  useEffect(() => {
    if (jobsPage > totalJobsPages) {
      setJobsPage(totalJobsPages);
    }
  }, [jobsPage, totalJobsPages]);

  useEffect(() => {
    if (contractorActivityPage > totalContractorActivityPages) {
      setContractorActivityPage(totalContractorActivityPages);
    }
  }, [contractorActivityPage, totalContractorActivityPages]);

  const selectJob = async (jobId: string) => {
    setIsJobDetailsLoading(true);
    setSelectedJob(jobId);
    setSelectedSubJob(null);
    setEnhancedJobData(null);

    try {
      const jobDetails = await apiClient.getJobById(jobId);
      setEnhancedJobData(jobDetails);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setIsJobDetailsLoading(false);
    }
  };

  /** `parentJobId` required when opening a sub-job from the jobs table (main job not yet selected). */
  const selectSubJob = async (
    subJobId: string,
    parentJobId?: string | null,
  ) => {
    const parentId =
      parentJobId != null && String(parentJobId).trim() !== ""
        ? String(parentJobId)
        : selectedJob;
    if (!parentId) return;

    setSelectedJob(parentId);
    setSelectedSubJob(subJobId);
    setIsJobDetailsLoading(true);
    setEnhancedJobData(null);
    try {
      const jobDetails = await apiClient.getJobById(subJobId);
      setEnhancedJobData(jobDetails);
    } catch (error) {
      console.error("Error fetching sub-job details:", error);
    } finally {
      setIsJobDetailsLoading(false);
    }
  };

  const handleBackFromJobDetails = () => {
    setSelectedJob(null);
    setSelectedSubJob(null);
    setEnhancedJobData(null);
    setIsJobDetailsLoading(false);
  };

  const toggleTableJobExpansion = (jobId: string) => {
    setExpandedTableJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const handleConfirmDeleteJob = async () => {
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
      await fetchContractorDetails({ force: true });
      onJobsMutated?.();
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete job",
      );
    } finally {
      setIsDeletingJob(false);
    }
  };

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
            {status || "N/A"}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatActivityDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  /** Match CustomersPage job statistics: derive from `jobs` when present; else API aggregates */
  const listingJobStats = useMemo(() => {
    if (!contractor) {
      return {
        totalJobs: 0,
        completedJobs: 0,
        ongoingJobs: 0,
        totalRevenue: 0,
      };
    }
    const jobs = contractor.jobs || [];
    if (jobs.length === 0) {
      return {
        totalJobs: contractor.total_jobs ?? 0,
        completedJobs: contractor.completed_jobs ?? 0,
        ongoingJobs: contractor.ongoing_jobs ?? 0,
        totalRevenue: Number(contractor.total_revenue ?? 0),
      };
    }
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
      return sum + (job.totalEstimatedCost || job.estimated_cost || 0);
    }, 0);
    return { totalJobs, completedJobs, ongoingJobs, totalRevenue };
  }, [contractor]);

  if (isLoading) {
    return (
      <div className="bg-white p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="bg-white p-8 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Contractor Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The contractor you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contractors
          </Button>
        </div>
      </div>
    );
  };

  console.log(contractorId,"contractoriddd");
  

  return (
    <div className="bg-white p-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button> */}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {contractor.contractor_name}
            </h1>
            <p className="text-lg text-gray-600">Contractor Details</p>
          </div>
        </div>

        <Badge
          variant={contractor.status === "active" ? "default" : "secondary"}
          className={`px-3 py-1 ${
            contractor.status === "active"
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-gray-100 text-gray-800 border-gray-200"
          }`}
        >
          {contractor.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Email</span>
                    <p className="text-gray-900">{contractor.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Address</span>
                    <p className="text-gray-900">{contractor.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Phone</span>
                    <p className="text-gray-900">{contractor.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Join Date</span>
                    <p className="text-gray-900">
                      {formatDate(contractor.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Briefcase className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {listingJobStats.totalJobs}
            </div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {listingJobStats.completedJobs}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {listingJobStats.ongoingJobs}
            </div>
            <div className="text-sm text-gray-600">In Progess</div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(listingJobStats.totalRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card> */}
      </div>

      {selectedJob ? (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium text-gray-900">
              {selectedSubJob ? "Sub-Job Details" : "Job Details"}
            </h3>
            {selectedJobData &&
            !selectedSubJob &&
            selectedJobData.subJobs?.length ? (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {selectedJobData.subJobs?.length || 0} Sub-Jobs
              </Badge>
            ) : null}
          </div>

          {isJobDetailsLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-sm text-muted-foreground">
                    Loading job details...
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : selectedJobData ? (
            selectedSubJob ? (
              (() => {
                const subFromList = selectedJobData.subJobs?.find(
                  (s: Job) => s.id.toString() === selectedSubJob,
                );
                const subJob: Job | any =
                  subFromList ??
                  (enhancedJobData != null &&
                  String(enhancedJobData.id) === selectedSubJob
                    ? enhancedJobData
                    : null);

                if (!subJob) {
                  return (
                    <Card key="subjob-loading" className="border-0 shadow-sm">
                      <CardContent className="p-10 text-center">
                        <p className="text-sm text-muted-foreground">
                          Loading sub-job…
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                const jobData =
                  enhancedJobData &&
                  enhancedJobData.id?.toString() === subJob.id.toString()
                    ? enhancedJobData
                    : subJob;

                const jobWithContractorData = {
                  ...jobData,
                  id: subJob.id.toString(),
                  contractor: (selectedJobData as any).contractor_id?.toString(),
                  customer:
                    (subJob as any).customer?.id?.toString() ||
                    (subJob as any).customer_id?.toString(),
                  customerName:
                    (subJob as any).customer?.customer_name ||
                    (subJob as any).customer?.company_name,
                  customerEmail: (subJob as any).customer?.email,
                  title: subJob.job_title,
                  type:
                    subJob.job_type === "contract_based"
                      ? "contract-based"
                      : "service-based",
                  location: subJob.address,
                  address: subJob.address,
                  cityZip: (subJob as any).city_zip,
                  estimatedCost: (subJob as any).estimated_cost,
                  estimatedHours: (subJob as any).estimated_hours,
                  startDate: (subJob as any).created_at,
                  dueDate: subJob.due_date,
                  priority: (subJob as any).priority,
                  status: jobData.status ?? subJob.status,
                  progress: (subJob as any).progress || 0,
                  labor_timesheets:
                    jobData.labor_timesheets ||
                    (subJob as any).labor_timesheets ||
                    [],
                  assigned_labor_ids:
                    jobData.assigned_labor_ids ||
                    (subJob as any).assigned_labor_ids,
                  assigned_lead_labor_ids:
                    jobData.assigned_lead_labor_ids ||
                    (subJob as any).assigned_lead_labor_ids,
                  assignedLaborDetails: jobData.assignedLaborDetails || [],
                  assignedLeadLaborDetails:
                    jobData.assignedLeadLaborDetails || [],
                  assignedMaterialsDetails:
                    jobData.assignedMaterialsDetails || [],
                  bluesheets: jobData.bluesheets || [],
                  /* Sub-job detail: do not pass parent's subJobs — table is main-job only */
                  subJobs: [],
                };

                const allJobs = [jobWithContractorData];

                const handleSetJobs = async (updatedJobs: any[]) => {
                  if (updatedJobs.length > 0) {
                    const updatedJob = updatedJobs[0];
                    try {
                      const freshJobData = await apiClient.getJobById(
                        updatedJob.id,
                      );
                      setEnhancedJobData(freshJobData);
                    } catch (error) {
                      console.error("Error refreshing job data:", error);
                    }

                    setContractor((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        jobs:
                          prev.jobs?.map((job: any) =>
                            job.id.toString() === selectedJob
                              ? {
                                  ...job,
                                  subJobs:
                                    job.subJobs?.map((sj: any) =>
                                      sj.id.toString() === updatedJob.id
                                        ? { ...sj, ...updatedJob }
                                        : sj,
                                    ) || [],
                                }
                              : job,
                          ) || [],
                      };
                    });
                  }
                };

                return (
                  <JobDetailsPage
                    key={subJob.id}
                    jobId={subJob.id.toString()}
                    onBack={() => setSelectedSubJob(null)}
                    jobs={allJobs}
                    setJobs={handleSetJobs}
                    onJobsRefresh={() => void fetchContractorDetails({ force: true })}
                    onViewSubJob={(id) =>
                      void selectSubJob(id, selectedJob ?? undefined)
                    }
                  />
                );
              })()
            ) : (
              (() => {
                const jobData =
                  enhancedJobData &&
                  enhancedJobData.id?.toString() ===
                    selectedJobData.id.toString()
                    ? enhancedJobData
                    : selectedJobData;

                const jobWithContractorData = {
                  ...jobData,
                  id: selectedJobData.id.toString(),
                  contractor: (selectedJobData as any).contractor_id?.toString(),
                  customer:
                    (selectedJobData as any).customer?.id?.toString() ||
                    (selectedJobData as any).customer_id?.toString(),
                  customerName:
                    (selectedJobData as any).customer?.customer_name ||
                    (selectedJobData as any).customer?.company_name,
                  customerEmail: (selectedJobData as any).customer?.email,
                  title: selectedJobData.job_title,
                  type:
                    selectedJobData.job_type === "contract_based"
                      ? "contract-based"
                      : "service-based",
                  location: selectedJobData.address,
                  address: selectedJobData.address,
                  cityZip: (selectedJobData as any).city_zip,
                  estimatedCost: (selectedJobData as any).estimated_cost,
                  estimatedHours: (selectedJobData as any).estimated_hours,
                  startDate: (selectedJobData as any).created_at,
                  dueDate: selectedJobData.due_date,
                  priority: (selectedJobData as any).priority,
                  status: jobData.status ?? selectedJobData.status,
                  progress: (selectedJobData as any).progress || 0,
                  labor_timesheets:
                    jobData.labor_timesheets ||
                    (selectedJobData as any).labor_timesheets ||
                    [],
                  assigned_labor_ids:
                    jobData.assigned_labor_ids ||
                    (selectedJobData as any).assigned_labor_ids,
                  assigned_lead_labor_ids:
                    jobData.assigned_lead_labor_ids ||
                    (selectedJobData as any).assigned_lead_labor_ids,
                  assignedLaborDetails: jobData.assignedLaborDetails || [],
                  assignedLeadLaborDetails:
                    jobData.assignedLeadLaborDetails || [],
                  assignedMaterialsDetails:
                    jobData.assignedMaterialsDetails || [],
                  bluesheets: jobData.bluesheets || [],
                  subJobs:
                    (selectedJobData as any).subJobs ??
                    (jobData as any)?.subJobs ??
                    [],
                };

                const allJobs = [jobWithContractorData];

                const handleSetJobs = async (updatedJobs: any[]) => {
                  if (updatedJobs.length > 0) {
                    const updatedJob = updatedJobs[0];

                    try {
                      const freshJobData = await apiClient.getJobById(
                        updatedJob.id,
                      );
                      setEnhancedJobData(freshJobData);
                    } catch (error) {
                      console.error("Error refreshing job data:", error);
                    }

                    setContractor((prev) => {
                      if (!prev) return prev;

                      return {
                        ...prev,
                        jobs:
                          prev.jobs?.map((job: any) =>
                            job.id.toString() === selectedJob
                              ? { ...job, ...updatedJob }
                              : job,
                          ) || [],
                      };
                    });
                  }
                };

                return (
                  <JobDetailsPage
                    key={selectedJobData.id}
                    jobId={selectedJobData.id.toString()}
                    onBack={handleBackFromJobDetails}
                    jobs={allJobs}
                    setJobs={handleSetJobs}
                    onJobsRefresh={() => void fetchContractorDetails({ force: true })}
                    onViewSubJob={(id) =>
                      void selectSubJob(id, selectedJob ?? undefined)
                    }
                  />
                );
              })()
            )
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Job details not found.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleBackFromJobDetails}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Jobs
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Jobs
            </CardTitle>
          </CardHeader>

          <CardContent>
            {contractor.jobs && contractor.jobs.length > 0 ? (
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
                    {paginatedJobs.map((job) => {
                      const jobId = job.id.toString();
                      const hasSubJobs =
                        Array.isArray(job.subJobs) && job.subJobs.length > 0;
                      const isExpanded = expandedTableJobs.has(jobId);
                      const subJobsPagination = hasSubJobs
                        ? getPaginatedSubJobs(job.subJobs!, jobId)
                        : null;

                      return (
                        <React.Fragment key={jobId}>
                          <TableRow>
                            <TableCell className="max-w-[240px] font-medium">
                              <span
                                className="block truncate"
                                title={job.job_title || "N/A"}
                              >
                                {job.job_title || "N/A"}
                              </span>
                            </TableCell>

                            <TableCell className="capitalize">
                              {(job.job_type || "N/A").replace(/_/g, " ")}
                            </TableCell>

                            <TableCell className="max-w-[240px] truncate">
                              {job.address || "N/A"}
                            </TableCell>

                            <TableCell>
                              {job.due_date ? formatDate(job.due_date) : "N/A"}
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
                                    onClick={() => toggleTableJobExpansion(jobId)}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 " />
                                    )}
                                    {isExpanded ? "Hide Sub Jobs" : "Show Sub Jobs"}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => selectJob(jobId)}
                                >
                                  <Eye className="h-4 w-4 " />
                                  
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Delete job"
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    setJobDeleteTarget({
                                      id: jobId,
                                      title: job.job_title || "this job",
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {hasSubJobs && (
                            <TableRow className="border-b-0 hover:bg-transparent data-[state=selected]:bg-transparent">
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
                                            {(subJobsPagination?.items ?? []).map(
                                              (subJob: Job) => (
                                                <TableRow
                                                  key={`${jobId}-${subJob.id}`}
                                                >
                                                <TableCell className="max-w-[200px] font-medium">
                                                  <span
                                                    className="block truncate"
                                                    title={subJob.job_title || "N/A"}
                                                  >
                                                    {subJob.job_title || "N/A"}
                                                  </span>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                  {(
                                                    subJob.job_type || "N/A"
                                                  ).replace(/_/g, " ")}
                                                </TableCell>
                                                <TableCell className="max-w-[240px] truncate">
                                                  {subJob.address || "N/A"}
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
                                                    subJob.estimated_cost || 0,
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
                                                        void selectSubJob(
                                                          subJob.id.toString(),
                                                          jobId,
                                                        )
                                                      }
                                                    >
                                                      <Eye className="h-4 w-4" />
                                                      
                                                    </Button>
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
                                                            "this sub-job",
                                                        })
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
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
                                            itemsPerPage={subJobsPerPage}
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
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No jobs found</p>
                <p className="text-sm text-gray-400 mt-1">
                  This contractor does not have any jobs yet.
                </p>
              </div>
            )}

            <TableListPagination
              page={jobsPage}
              totalPages={totalJobsPages}
              totalItems={totalJobsCount}
              itemsPerPage={jobsPerPage}
              itemLabel="jobs"
              onPageChange={setJobsPage}
            />
          </CardContent>
          </Card>

          <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingContractorActivity ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : paginatedContractorActivity.length > 0 ? (
              <div className="space-y-3">
                {paginatedContractorActivity.map((item: any, index: number) => {
                  const status = item?.status || item?.payment_status || "N/A";
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
                    {(contractorActivityPage - 1) * contractorActivityPerPage + 1}{" "}
                    to{" "}
                    {Math.min(
                      contractorActivityPage * contractorActivityPerPage,
                      totalContractorActivityCount,
                    )}{" "}
                    of {totalContractorActivityCount} invoices
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setContractorActivityPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={contractorActivityPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {contractorActivityPage} of {totalContractorActivityPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setContractorActivityPage((prev) =>
                          Math.min(prev + 1, totalContractorActivityPages),
                        )
                      }
                      disabled={
                        contractorActivityPage === totalContractorActivityPages
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
                  This contractor has no transactions yet.
                </p>
              </div>
            )}
          </CardContent>
          </Card>
        </>
      )}

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
