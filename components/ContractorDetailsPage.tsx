"use client";

import { useState, useEffect, useMemo } from "react";
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
}

export function ContractorDetailsPage({
  contractorId,
  onBack,
}: ContractorDetailsPageProps) {
  const [contractor, setContractor] = useState<ContractorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedSubJob, setSelectedSubJob] = useState<string | null>(null);
  const [enhancedJobData, setEnhancedJobData] = useState<any>(null);
  const [isJobDetailsLoading, setIsJobDetailsLoading] = useState(false);
  
  useEffect(()=>{
    setSelectedJob(null);
    setSelectedSubJob(null);
    setEnhancedJobData(null);
  },[contractorId])
  // Pagination state
  const [jobsPage, setJobsPage] = useState(1);
  const jobsPerPage = 10;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchContractorDetails = async () => {
    try {
      setIsLoading(true);

      const response = await globalApiCall(
        `${apiBaseUrl}/contractor/getContractorById/${contractorId}?include_jobs=true`,
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      console.log("Contractor Details API Response:", responseData);

      if (responseData.success && responseData.data) {
        const contractorData = responseData.data;

        setContractor({
          id: contractorData.id,
          contractor_name: contractorData.contractor_name || "N/A",
          company_name: contractorData.company_name || "N/A",
          email: contractorData.email || "N/A",
          phone: contractorData.phone || "N/A",
          address: contractorData.address || "N/A",
          status: contractorData.status || "inactive",
          created_at: contractorData.created_at || new Date().toISOString(),
          total_jobs:
            contractorData.statistics?.total_jobs ??
            contractorData.total_jobs ??
            contractorData.jobs?.length ??
            0,
          completed_jobs:
            contractorData.statistics?.completed_jobs ??
            contractorData.completed_jobs ??
            0,
          ongoing_jobs:
            contractorData.statistics?.ongoing_jobs ??
            contractorData.ongoing_jobs ??
            0,
          total_revenue:
            contractorData.statistics?.total_estimated_cost ??
            contractorData.total_revenue ??
            0,
          jobs: contractorData.jobs || [],
        });

        // Reset to first page whenever fresh contractor data loads
        setJobsPage(1);
      } else {
        console.error("Invalid contractor details API response:", responseData);
        setContractor(null);
      }
    } catch (error) {
      console.error("Error fetching contractor details:", error);
      setContractor(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contractorId) {
      fetchContractorDetails();
    }
  }, [contractorId]);

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

  useEffect(() => {
    if (jobsPage > totalJobsPages) {
      setJobsPage(totalJobsPages);
    }
  }, [jobsPage, totalJobsPages]);

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

  const handleBackFromJobDetails = () => {
    setSelectedJob(null);
    setSelectedSubJob(null);
    setEnhancedJobData(null);
    setIsJobDetailsLoading(false);
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
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Briefcase className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {contractor.total_jobs || 0}
            </div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {contractor.completed_jobs || 0}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {contractor.ongoing_jobs || 0}
            </div>
            <div className="text-sm text-gray-600">Ongoing</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(contractor.total_revenue || 0)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {selectedJob ? (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium text-gray-900">Job Details</h3>
            {selectedJobData && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {selectedJobData.subJobs?.length || 0} Sub-Jobs
              </Badge>
            )}
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
            (() => {
              const jobData =
                enhancedJobData &&
                enhancedJobData.id?.toString() === selectedJobData.id.toString()
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
                status: selectedJobData.status,
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
                  onJobsRefresh={fetchContractorDetails}
                />
              );
            })()
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
                    {paginatedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          {job.job_title || "N/A"}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectJob(job.id.toString())}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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

            {totalJobsPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="text-sm text-gray-500">
                  Showing {(jobsPage - 1) * jobsPerPage + 1} to{" "}
                  {Math.min(jobsPage * jobsPerPage, totalJobsCount)} of{" "}
                  {totalJobsCount} jobs
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setJobsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={jobsPage === 1}
                  >
                    Previous
                  </Button>

                  <span className="text-sm text-gray-600">
                    Page {jobsPage} of {totalJobsPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setJobsPage((prev) => Math.min(prev + 1, totalJobsPages))
                    }
                    disabled={jobsPage === totalJobsPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
