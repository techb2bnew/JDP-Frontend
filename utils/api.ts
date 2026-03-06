import { clearAuthData } from "./auth";
import type { BulkMaterialPayload } from '@/types/materials';
// API utility functions with authentication

const API_BASE_URL = "http://127.0.0.1:3000/api";

// Helper function to get auth token
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

// Global token revocation handler
const handleTokenRevocation = async () => {
  console.log("Token revoked - clearing auth data and redirecting to login");
  await clearAuthData();

  // Show toast notification
  if (typeof window !== "undefined") {
    // Import toast dynamically to avoid SSR issues
    const { toast } = await import("sonner");
    toast.error("Session expired. Please login again.");
  }

  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Helper function to make authenticated API calls with global token handling
const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getAuthToken();

  if (!token) {
    await handleTokenRevocation();
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle token revocation globally
    if (response.status === 401) {
      try {
        const errorData = await response.json().catch(() => ({}));

        // Check for specific token revocation message
        if (
          errorData.message &&
          (errorData.message.includes("Token has been revoked") ||
            errorData.message.includes("Token expired") ||
            errorData.message.includes("Invalid token") ||
            errorData.message.includes("Please login again"))
        ) {
          await handleTokenRevocation();
          throw new Error("Session expired. Please login again.");
        }
      } catch (parseError) {
        // If we can't parse the error, still handle as token revocation
        await handleTokenRevocation();
        throw new Error("Session expired. Please login again.");
      }
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API request failed: ${response.status}`
    );
  }

  return response.json();
};

// Global API interceptor for manual fetch calls
export const globalApiCall = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  // Add authorization header if token exists
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle token revocation globally
    if (response.status === 401) {
      try {
        const errorData = await response.json().catch(() => ({}));

        // Check for specific token revocation message
        if (
          errorData.message &&
          (errorData.message.includes("Token has been revoked") ||
            errorData.message.includes("Token expired") ||
            errorData.message.includes("Invalid token") ||
            errorData.message.includes("Please login again"))
        ) {
          await handleTokenRevocation();
          throw new Error("Session expired. Please login again.");
        }
      } catch (parseError) {
        // If we can't parse the error, still handle as token revocation
        await handleTokenRevocation();
        throw new Error("Session expired. Please login again.");
      }
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API request failed: ${response.status}`
    );
  }

  return response;
};

export const apiClient = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  },

  signup: async (email: string, role: string, otp: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Registration failed");
    }

    return response.json();
  },

  // Jobs
  getJobById: async (jobId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/getJobById/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch job details");
    }

    const result = await response.json();
    console.log("Job Details API Response:", result);

    if (!result.data) {
      console.error("Job Details API: Unexpected response structure:", result);
      throw new Error("Invalid job data received");
    }

    const job = result.data;

    // Transform the API response to match our Job interface
    const transformedJob = {
      id: job.id.toString(),
      title: job.job_title,
      type: (job.job_type === "service_based"
        ? "service-based"
        : "contract-based") as "service-based" | "contract-based",
      status: (job.status === "active"
        ? "pending"
        : job.status === "in_progress"
          ? "in-progress"
          : job.status) as "pending" | "in-progress" | "completed" | "cancelled",
      assignedLeadLabor: job.assigned_lead_labor
        ? job.assigned_lead_labor.map((ll: any) => ll.id.toString())
        : [],
      assignedLabor: job.assigned_labor
        ? job.assigned_labor.map((l: any) => l.user?.full_name || l.labor_code)
        : [],
      contractor: job.contractor_id ? job.contractor_id.toString() : undefined,
      customer: job.customer_id ? job.customer_id.toString() : undefined,
      description: job.description,
      createdDate: job.created_at
        ? job.created_at.split("T")[0]
        : new Date().toISOString().split("T")[0],
      dueDate: job.due_date,
      estimatedHours: job.estimated_hours,
      estimatedCost: job.estimated_cost,
      actualCost: job.estimated_cost, // Use estimated cost as actual cost for now
      materials: job.assigned_material_ids
        ? JSON.parse(job.assigned_material_ids)
        : [],
      address: job.address,
      cityZip: job.city_zip,
      location: `${job.address}, ${job.city_zip}`, // Add location field for JobDetailsPage
      phone: job.phone,
      email: job.email,
      billToAddress: job.bill_to_address,
      billToCityZip: job.bill_to_city_zip,
      billToPhone: job.bill_to_phone,
      billToEmail: job.bill_to_email,
      sameAsAddress: job.same_as_address,
      priority: job.priority as "low" | "medium" | "high" | "urgent",
      billingStatus: "pending" as "pending" | "invoiced" | "paid",
      // Additional fields from API
      customerName: job.customer?.customer_name || job.customer?.company_name,
      contractorName:
        job.contractor?.contractor_name || job.contractor?.company_name,
      createdBy: job.created_by_user?.full_name,
      assignedLeadLaborDetails: job.assigned_lead_labor || [],
      assignedLaborDetails: job.assigned_labor || [],
      assignedMaterialsDetails: job.assigned_materials || [],
      customLabor: job.custom_labor || [],
      bluesheets: job.bluesheets || [],
    };

    console.log("Transformed job details:", transformedJob);
    console.log("Location field:", transformedJob.location);
    console.log("Bluesheets data:", transformedJob.bluesheets);
    return transformedJob;
  },

  getJobs: async (page: number = 1, limit: number = 5) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/job/getJobs?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch jobs");
    }

    const result = await response.json();
    console.log("Jobs API Response:", result);

    if (!result.data || !result.data.jobs) {
      console.error("Jobs API: Unexpected response structure:", result);
      return {
        data: [],
        totalPages: 1,
        currentPage: 1,
        total: 0,
      };
    }

    // Transform the API response to match our Job interface
    const transformedData = {
      data: result.data.jobs.map((job: any) => ({
        id: job.id.toString(),
        title: job.job_title,
        type:
          job.job_type,
        status:
          job.status === "active"
            ? "pending"
            : job.status === "in_progress"
              ? "in-progress"
              : job.status,
        assignedLeadLabor: job.assigned_lead_labor
          ? job.assigned_lead_labor.map((ll: any) => ll.id.toString())
          : [],
        assignedLabor: job.assigned_labor
          ? job.assigned_labor.map(
            (l: any) => l.user?.full_name || l.labor_code
          )
          : [],
        contractor: job.contractor_id
          ? job.contractor_id.toString()
          : undefined,
        customer: job.customer_id ? job.customer_id.toString() : undefined,
        description: job.description,
        createdDate: job.created_at
          ? job.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
        dueDate: job.due_date,
        estimatedHours: job.estimated_hours,
        estimatedCost: job.estimated_cost,
        actualCost: job.estimated_cost, // Use estimated cost as actual cost for now
        materials: job.assigned_material_ids
          ? JSON.parse(job.assigned_material_ids)
          : [],
        address: job.address,
        cityZip: job.city_zip,
        location: `${job.address}, ${job.city_zip}`, // Add location field for JobDetailsPage
        phone: job.phone,
        email: job.email,
        billToAddress: job.bill_to_address,
        billToCityZip: job.bill_to_city_zip,
        billToPhone: job.bill_to_phone,
        billToEmail: job.bill_to_email,
        sameAsAddress: job.same_as_address,
        priority: job.priority,
        billingStatus: "pending",
        // Additional fields from API
        customerName: job.customer?.customer_name || job.customer?.company_name,
        contractorName:
          job.contractor?.contractor_name || job.contractor?.company_name,
        contractorAddress: job.contractor?.address,
        createdBy: job.created_by_user?.full_name,
        assignedLeadLaborDetails: job.assigned_lead_labor || [],
        assignedLaborDetails: job.assigned_labor || [],
        assignedMaterialsDetails: job.assigned_materials || [],
        customLabor: job.custom_labor || [],
      })),
      totalPages: result.data.pagination?.totalPages || 1,
      currentPage: result.data.pagination?.page || 1,
      total: result.data.pagination?.total || 0,
    };

    console.log("Transformed jobs data:", transformedData);
    return transformedData;
  },

  updateJob: async (
    jobId: string,
    jobData: {
      job_title: string;
      job_type: string;
      customer_id?: number;
      contractor_id?: number;
      description: string;
      priority: string;
      address: string;
      city_zip: string;
      phone?: string;
      email?: string;
      bill_to_address?: string;
      bill_to_city_zip?: string;
      bill_to_phone?: string;
      bill_to_email?: string;
      same_as_address: boolean;
      due_date: string;
      estimated_hours?: number;
      estimated_cost?: number;
      assigned_lead_labor_ids?: string;
      assigned_labor_ids?: string;
      assigned_material_ids?: string;
      status: string;
    }
  ) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/updateJob/${jobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update job");
    }

    return response.json();
  },

  getJobDocuments: async (jobId: number | string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job-documents/job/${jobId}/documents`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch job documents");
    }

    return response.json();
  },

  uploadJobDocument: async ({
    jobId,
    title,
    file,
  }: {
    jobId: number | string;
    title: string;
    file: File;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const formData = new FormData();
    formData.append("job_id", jobId.toString());
    formData.append("document_title", title);
    formData.append("document_file", file);

    const response = await fetch(`${apiBaseUrl}/job-documents/document`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to upload document");
    }

    return response.json();
  },

  deleteJobDocument: async (documentId: number | string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job-documents/document/${documentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete document");
    }

    return response.json();
  },

  deleteJob: async (jobId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/deleteJob/${jobId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete job");
    }

    return response.json();
  },

  // Mark Job as Completed
  completeJob: async (jobId: string | number, status: string = "completed") => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/jobCompleted/${jobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to complete job");
    }

    return response.json();
  },

  deleteProduct: async (productId: string | number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/products/deleteProduct/${productId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete product");
    }

    return response.json();
  },

  deleteEstimate: async (estimateId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/estimates/deleteEstimate/${estimateId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete estimate");
    }

    return response.json();
  },

  getJobStats: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/getJobStats/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch job statistics");
    }

    const result = await response.json();
    console.log("Job Stats API Response:", result);

    if (!result.data) {
      console.error("Job Stats API: Unexpected response structure:", result);
      return {
        total: 0,
        active: 0,
        completed: 0,
        draft: 0,
        pending: 0,
        totalRevenue: "0.00",
        activePercentage: "0.0",
        completedPercentage: "0.0",
        draftPercentage: "0.0",
        pendingPercentage: "0.0",
      };
    }

    return result.data;
  },

  // Dashboard Summary
  getDashboardSummary: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/dashboard/summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch dashboard summary");
    }

    const result = await response.json();
    return result?.data;
  },

  getManagementStats: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/dashboard/management-stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch management statistics");
    }

    const result = await response.json();
    return result;
  },

  getAnalyticsOverview: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/analytics/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch analytics overview");
    }

    const result = await response.json();
    return result?.data;
  },

  // Job Status Distribution (for dashboard pie chart)
  getJobStatusDistribution: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/dashboard/job-status-distribution`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch job status distribution");
    }

    const result = await response.json();
    return result?.data;
  },

  // Recent Activities with pagination
  getRecentActivities: async (page: number = 1, limit: number = 5) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/dashboard/recent-activities?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch recent activities");
    }

    const result = await response.json();
    // Expecting { data: { items: [...], total_found: number } }
    return result?.data || { items: [], total_found: 0 };
  },

  // Profiles
  getProfiles: async (type?: string) => {
    const endpoint = type ? `/profiles?type=${type}` : "/profiles";
    return authenticatedFetch(endpoint);
  },

  createProfile: async (profileData: any) => {
    return authenticatedFetch("/profiles", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },

  updateProfile: async (profileId: string, profileData: any) => {
    return authenticatedFetch(`/profiles/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  // Invoices
  getInvoices: async () => {
    return authenticatedFetch("/invoices");
  },

  createInvoice: async (invoiceData: any) => {
    return authenticatedFetch("/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
  },

  // Notifications
  getNotifications: async () => {
    return authenticatedFetch("/notifications");
  },

  sendNotification: async (payload: {
    notification_title: string;
    message: string;
    custom_link?: string;
    send_to_all: boolean;
    recipient_roles: string[];
    job_id?: number | string;
    labor_ids?: string;
    lead_labor_ids?: string;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/notifications/sendNotification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to send notification");
    }

    return response.json();
  },

  // User management
  getCurrentUser: async () => {
    return authenticatedFetch("/user/profile");
  },

  getUserProfile: async (userId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await globalApiCall(
      `${apiBaseUrl}/staff/getStaffById/${userId}`,
      {
        method: "GET",
      }
    );
    return response.json();
  },

  // Update User Profile
  updateUserProfile: async (
    userId: string,
    profileData: {
      full_name: string;
      email: string;
      phone: string;
      position: string;
      department: string;
      address: string;
      bio?: string;
      emergency_contact?: string;
      date_of_birth: string;
      employee_id: string;
      system_role: string;
    }
  ) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/staff/updateStaff/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update profile");
    }

    return response.json();
  },

  // Change Password
  changePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Password change failed");
    }

    return response.json();
  },

  // Create Staff
  createStaff: async (staffData: {
    full_name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    date_of_joining: string;
    address: string;
    role: string;
    status: string;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log(
        "API: Starting createStaff request to:",
        `${apiBaseUrl}/staff/createStaff`
      );
      console.log("API: Request payload:", staffData);

      const response = await fetch(`${apiBaseUrl}/staff/createStaff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("API: Response received, status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API: Error response:", errorData);
        throw new Error(errorData.message || "Failed to create staff");
      }

      const result = await response.json();
      console.log("API: Success response:", result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("API: Request failed:", error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout - please try again");
      }
      throw error;
    }
  },

  // Get All Staff
  getAllStaff: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/staff/getAllStaff`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch staff");
    }

    return response.json();
  },

  // Get All Suppliers
  getAllSuppliers: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/suppliers/getAllSuppliers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch suppliers");
    }

    return response.json();
  },

  // Get All Products
  getAllProducts: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/products/getAllProducts?is_custom=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch products");
    }

    return response.json();
  },

  // Get All Customers
  getAllCustomers: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/customer/getCustomers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch customers");
    }

    return response.json();
  },
  // Get All Estimates
  getAllEstimates: async (page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/estimates/getEstimates?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch estimates");
    }

    return response.json();
  },
  // Get Estimates by Job ID
  getEstimatesByJob: async (jobId: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/estimates/getEstimatesByJob/${jobId}?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch estimates by job");
    }

    return response.json();
  },

  // Get All Timesheets
  getAllTimesheets: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/job/getAllJobsWeeklyTimesheetSummary`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch timesheets");
    }

    return response.json();
  },

  // Get Weekly Timesheet View
  getWeeklyTimesheetView: async (params: {
    labor_id?: number | string;
    lead_labor_id?: number | string;
    start_date: string;
    end_date: string;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const queryParams = new URLSearchParams();
    if (params.labor_id) {
      queryParams.append('labor_id', params.labor_id.toString());
    }
    if (params.lead_labor_id) {
      queryParams.append('lead_labor_id', params.lead_labor_id.toString());
    }
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);

    const url = `${apiBaseUrl}/job/getWeeklyTimesheetView?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch weekly timesheet view");
    }

    return response.json();
  },

  // Search Products by Status
  searchProductsByStatus: async (status: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/products/searchProducts?status=${status}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search products by status");
    }

    return response.json();
  },
  // Search Products by Query
  searchProductsByQuery: async (query: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/products/searchProducts?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search products by query");
    }

    return response.json();
  },
  // Search Jobs by Query
  searchJobsByQuery: async (query: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/job/searchJobs?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search jobs by query");
    }

    return response.json();
  },

  // Search Jobs by Job Type
  searchJobsByType: async (jobType: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/searchJobs?job_type=${encodeURIComponent(jobType)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search jobs by job type");
    }

    return response.json();
  },
  // Search Jobs by Status
  searchJobsByStatus: async (status: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/searchJobs?status=${encodeURIComponent(status)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search jobs by status");
    }

    return response.json();
  },
  // Search Jobs by Priority
  searchJobsByPriority: async (priority: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/searchJobs?priority=${encodeURIComponent(priority)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search jobs by priority");
    }

    return response.json();
  },

  // Search Orders by Query (email, order ID, etc.)
  searchOrdersByQuery: async (query: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/orders/searchOrders?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search orders by query");
    }

    return response.json();
  },

  // Search Orders by Status
  searchOrdersByStatus: async (status: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/orders/searchOrders?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search orders by status");
    }

    return response.json();
  },
  // Search Orders by Date Range
  searchOrdersByDateRange: async (fromDate: string, toDate: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/orders/searchOrders?order_date_from=${fromDate}&order_date_to=${toDate}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search orders by date range");
    }

    return response.json();
  },

  // Search Estimates by Query 
  searchEstimatesByQuery: async (query: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/estimates/searchEstimates?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search estimates by query");
    }

    return response.json();
  },
  // Search Estimates by Status 
  searchEstimatesByStatus: async (status: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/estimates/searchEstimates?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search estimates by status");
    }

    return response.json();
  },
  // Search Estimates by Invoice Type 
  searchEstimatesByInvoiceType: async (invoiceType: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/estimates/searchEstimates?invoice_type=${encodeURIComponent(invoiceType)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search estimates by invoice type");
    }

    return response.json();
  },
  // Search Timesheets by Query 
  searchTimesheetsByQuery: async (
    query: string,
    page = 1,
    limit = 10,
    startDate: string | null = null,
    endDate: string | null = null,
    name: string | null = null,
    status: string | null = null
  ) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Build query params dynamically
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (name) params.append("name", name);
    if (status) params.append("status", status);

    const url = `${apiBaseUrl}/job/searchTimesheets?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search timesheets by query");
    }

    return response.json();
  },

  // Search Timesheets by Status 
  searchTimesheetsByStatus: async (status: string, page = 1, limit = 10, name: string | null = null) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const params = new URLSearchParams({
      status: status,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (name) params.append("name", name);

    const url = `${apiBaseUrl}/job/searchTimesheets?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search timesheets by status");
    }

    return response.json();
  },
  // Search Staff by Query 
  searchStaffByQuery: async (query: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/staff/searchStaff?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search staff");
    }

    return response.json();
  },
  searchLeadLaborByQuery: async (query: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/lead-labor/searchLeadLabor?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search lead labor");
    }

    return response.json();
  },
  searchLaborByQuery: async (query: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/labor/searchLabor?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search labor");
    }

    return response.json();
  },
  searchSuppliersByQuery: async (query: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/suppliers/searchSuppliers?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search suppliers");
    }

    return response.json();
  },
  searchCutomerByQuery: async (search: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/customer/getCustomers?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to get customers");
    }

    return response.json();
  },

  searchStaffByStatus: async (status: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/staff/searchStaff?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search staff by status");
    }

    return response.json();
  },
  searchLeadLaborByStatus: async (status: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/lead-labor/searchLeadLabor?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search lead labor by status");
    }

    return response.json();
  },
  searchLaborByStatus: async (status: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/labor/searchLabor?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search labor by status");
    }

    return response.json();
  },
  searchSuppliersByStatus: async (status: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/suppliers/searchSuppliers?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search suppliers by status");
    }

    return response.json();
  },
  getCustomersByStatus: async (status: string, page = 1, limit = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/customer/getCustomers?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch customers by status");
    }

    return response.json();
  },



















  approveWeekTimesheet: async ({
    jobId,
    laborId,
    lead_labor_id,
    startDate,
    endDate,
    status,
  }: {
    jobId: number;
    laborId: number;
    lead_labor_id: number;
    startDate: string;
    endDate: string;
    status: string;
  }) => {

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/job/approveWeekTimesheet`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobId,
        laborId,
        lead_labor_id,
        startDate,
        endDate,
        status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to approve timesheet");
    }

    return response.json();
  },



  // Get Estimate By Id
  getEstimateById: async (id: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/estimates/getEstimateById/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch estimate with ID ${id}`);
    }
    return response.json();
  },

  getEstimateStats: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/estimates/getEstimateStats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch estimate stats");
    }

    console.log("Fetch Estimate Stats", response);
    return response.json();
  },


  getTimesheetDashboardStats: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/getTimesheetDashboardStats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch timesheet dashboard stats");
    }

    console.log("Fetch Timesheet Dashboard Stats", response);
    return response.json();
  },



  getProjectSummary: async (jobId: string | number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/job/getProjectSummary/${jobId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch project summary");
    }

    return response.json();
  },
  getJobDashboard: async (jobId: string | number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/getJobDashboard/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch job dashboard");
    }

    return response.json();
  },

  // Get Staff by ID
  getStaffById: async (staffId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/staff/getStaffById/${staffId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch staff details");
    }

    return response.json();
  },

  // Get Staff Statistics
  getStaffStats: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/staff/getStaffStats`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch staff statistics");
    }

    return response.json();
  },

  // Update Staff
  updateStaff: async (
    staffId: string,
    staffData: {
      full_name: string;
      email: string;
      phone: string;
      position: string;
      department: string;
      date_of_joining: string;
      dob: string;
      address: string;
      role: string;
      status: string;
    }
  ) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log(
        "API: Starting updateStaff request to:",
        `${apiBaseUrl}/staff/updateStaff/${staffId}`
      );
      console.log("API: Request payload:", staffData);

      const response = await fetch(
        `${apiBaseUrl}/staff/updateStaff/${staffId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(staffData),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      console.log("API: Response received, status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API: Error response:", errorData);
        throw new Error(errorData.message || "Failed to update staff");
      }

      const result = await response.json();
      console.log("API: Success response:", result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("API: Request failed:", error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout - please try again");
      }
      throw error;
    }
  },

  // Delete Staff
  deleteStaff: async (staffId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/staff/deleteStaff/${staffId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete staff");
    }

    return response.json();
  },

  // Customers
  getCustomers: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/customer/getCustomers?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch customers");
    }

    const result = await response.json();

    // Check if the response has the expected structure
    if (!result.data || !result.data.customers) {
      return {
        data: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // Transform the response to match the expected structure
    const transformedData = {
      data: result.data.customers.map((customer: any) => {
        const transformedCustomer = {
          id: customer.id,
          name:
            customer.customer_name ||
            customer.name ||
            customer.company_name ||
            `Customer ${customer.id}`,
          company_name: customer.company_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        };
        return transformedCustomer;
      }),
      totalPages: result.data.pagination?.totalPages || 1,
      currentPage: result.data.pagination?.page || 1,
    };

    return transformedData;
  },

  // Get jobs by customer ID
  getJobsByCustomer: async (customerId: string | number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/job/getJobsByCustomer/${customerId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch customer jobs");
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return {
        success: false,
        data: [],
      };
    }

    return {
      success: true,
      data: result.data,
    };
  },

  // Contractors
  getContractors: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/contractor/getContractors?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch contractors");
    }

    const result = await response.json();

    // Check if the response has the expected structure
    if (!result.data) {
      return {
        data: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // Transform the response to match the expected structure
    // Handle different possible response structures
    let contractorsArray = [];
    if (result.data.contractors) {
      contractorsArray = result.data.contractors;
    } else if (Array.isArray(result.data)) {
      contractorsArray = result.data;
    } else {
      console.error("Contractor API: No contractors array found in response");
      return {
        data: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    const transformedData = {
      data: contractorsArray.map((contractor: any) => {
        const transformedContractor = {
          id: contractor.id,
          name:
            contractor.contractor_name ||
            contractor.name ||
            contractor.company_name ||
            `Contractor ${contractor.id}`,
          company_name: contractor.company_name,
          email: contractor.email,
          phone: contractor.phone,
          address: contractor.address,
        };
        return transformedContractor;
      }),
      totalPages:
        result.data.pagination?.totalPages ||
        result.pagination?.totalPages ||
        1,
      currentPage:
        result.data.pagination?.page || result.pagination?.page || page,
    };

    return transformedData;
  },

  // Lead Labor
  getLeadLabor: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/lead-labor/getAllLeadLabor?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch lead labor");
    }

    const result = await response.json();

    // Transform the response to match the expected structure
    // The API returns: result.data.data (array) and result.data.pagination
    return {
      data: result.data.data.map((leadLabor: any) => ({
        id: leadLabor.id,
        name: leadLabor.users.full_name,
        email: leadLabor.email,
        phone: leadLabor.phone,
        position: leadLabor.position,
        department: leadLabor.department,
        labor_code: leadLabor.labor_code,
        address: leadLabor.address,
        dob: leadLabor.dob,
      })),
      totalPages: result.data.pagination.totalPages,
      currentPage: result.data.pagination.currentPage,
    };
  },

  // Labor
  getLabor: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/labor/getAllLabor?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch labor");
    }

    const result = await response.json();

    // Transform the response to match the expected structure
    // The API returns: result.data.data (array) and result.data.pagination
    return {
      data: result.data.data.map((labor: any) => ({
        id: labor.id,
        name: labor.users.full_name,
        email: labor.email,
        phone: labor.phone,
        position: labor.position,
        department: labor.department,
        labor_code: labor.labor_code,
        address: labor.address,
        dob: labor.dob,
      })),
      totalPages: result.data.pagination.totalPages,
      currentPage: result.data.pagination.currentPage,
    };
  },

  // Create Job
  createJob: async (jobData: {
    job_title: string;
    job_type: string;
    customer_id?: number;
    contractor_id?: number;
    description: string;
    priority: string;
    address: string;
    city_zip: string;
    phone?: string;
    email?: string;
    bill_to_address?: string;
    bill_to_city_zip?: string;
    bill_to_phone?: string;
    bill_to_email?: string;
    same_as_address: boolean;
    due_date: string;
    estimated_hours?: number;
    estimated_cost?: number;
    assigned_lead_labor_ids?: string;
    assigned_labor_ids?: string;
    assigned_material_ids?: string;
    status: string;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/job/createJob`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create job");
    }

    return response.json();
  },

  // Create Product
  createProduct: async (productData: {
    product_name: string;
    supplier_id: number;
    supplier_sku: string;
    jdp_sku: string;
    stock_quantity: number;
    unit: string;
    job_id: string;
    is_custom: boolean;
    unit_cost: number;
    total_cost: number;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/products/createProduct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create product");
    }

    return response.json();
  },

  // Create Invoice
  createEstimate: async (estimateData: {
    estimate_title: string;
    customer_id: number;
    priority: "low" | "medium" | "high";
    valid_until: string;
    location: string;
    description: string;
    service_type: string;
    email_address: string;
    estimate_date: string;

    status: string;
    invoice_type: string;
    invoice_number: string;
    issue_date: string;
    due_date: string;

    job_id: number;

    total_amount: number;

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
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/estimates/createEstimate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(estimateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create estimate");
    }

    return response.json();
  },

  updateEstimate: async (estimateId: number, estimateData: {
    estimate_title?: string;
    customer_id?: number;
    priority?: "low" | "medium" | "high";
    valid_until?: string;
    location?: string;
    description?: string;
    service_type?: string;
    email_address?: string;
    estimate_date?: string;

    materials_cost?: number;
    labor_cost?: number;
    additional_costs?: number;
    subtotal?: number;
    tax_percentage?: number;
    tax_amount?: number;
    total_amount?: number;

    status?: string;
    invoice_type?: string;
    invoice_number?: string;
    issue_date?: string;
    due_date?: string;

    job_id?: number;

    custom_labor?: {
      full_name: string;
      email: string;
      hours_worked: number;
      hourly_rate: number;
      job_id: number;
      is_custom: boolean;
    }[];

    custom_products?: {
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
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiBaseUrl}/estimates/updateEstimate/${estimateId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(estimateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update estimate");
    }

    return response.json();
  },

  // Roles API
  getRoles: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    const response = await fetch(
      `${apiBaseUrl}/permissions/roles-with-permissions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch roles");
    }
    const result = await response.json();
    console.log("Roles API Response:", result);
    if (!result.success || !result.data) {
      console.error("Roles API: Unexpected response structure:", result);
      return [];
    }
    // Transform API response to match component's expected format
    const transformedRoles = result.data.map((apiRole: any) => ({
      id: apiRole.id.toString(),
      roleName: apiRole.role_name || "",
      roleType: apiRole.role_type || "",
      permissions: apiRole.permissions || [],
    }));
    return transformedRoles;
  },

  // Labor Time Log APIs
  createLaborTimeLog: async (timeLogData: {
    job_id: string;
    labor_id: string;
    full_name: string;
    email: string;
    role: string;
    hours_worked: number;
    hourly_rate: number;
    notes: string;
    date_of_joining: string;
    is_custom: boolean;
    total_cost: number;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    const response = await fetch(`${apiBaseUrl}/labor/createLabor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(timeLogData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create labor time log");
    }
    return response.json();
  },

  updateLaborTimeLog: async (
    timeLogId: string,
    timeLogData: {
      job_id: string;
      labor_id: string;
      full_name: string;
      email: string;
      role: string;
      hours_worked: number;
      hourly_rate: number;
      notes: string;
      date_of_joining: string;
      is_custom: boolean;
    }
  ) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    const response = await fetch(
      `${apiBaseUrl}/labor/updateLabor/${timeLogId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(timeLogData),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update labor time log");
    }
    return response.json();
  },

  deleteLaborTimeLog: async (timeLogId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    const response = await fetch(
      `${apiBaseUrl}/labor/deleteLabor/${timeLogId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete labor time log");
    }
    return response.json();
  },

  getLaborById: async (laborId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    const response = await fetch(
      `${apiBaseUrl}/labor/getLaborById/${laborId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch labor details");
    }
    const result = await response.json();
    console.log("Labor Details API Response:", result);
    if (!result.success || !result.data) {
      console.error(
        "Labor Details API: Unexpected response structure:",
        result
      );
      throw new Error("Invalid labor data received");
    }
    return result.data;
  },

  // Logout
  logout: async () => {
    try {
      // Try to call the logout API endpoint
      await authenticatedFetch("/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local authentication data
      await clearAuthData();
    }
  },

  // Configuration
  getFullConfiguration: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/configuration/getFullConfiguration`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch configuration");
    }

    return response.json();
  },

  createOrUpdateConfiguration: async (configurationData: {
    hourly_rates: Array<{
      id?: number;
      description: string;
      max_hours: number | null;
      rate: number;
    }>;
    markup_percentage: number;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/configuration/createOrUpdateConfiguration`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(configurationData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to save configuration");
    }

    return response.json();
  },

  removeHourlyRates: async (rateIds: number[]) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${apiBaseUrl}/configuration/removeHourlyRates`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rate_ids: rateIds }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to remove hourly rates");
    }

    return response.json();
  },

  // Bluesheet Labor Management APIs
  addLaborToBluesheet: async (bluesheetId: number, laborData: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiBaseUrl}/bluesheet/bluesheet/${bluesheetId}/labor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(laborData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to add labor to bluesheet");
    }

    return response.json();
  },

  updateLaborInBluesheet: async (laborEntryId: number, laborData: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/labor/${laborEntryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(laborData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update labor in bluesheet");
    }

    return response.json();
  },

  getLaborEntryById: async (laborEntryId: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/labor/${laborEntryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch labor entry");
    }

    return response.json();
  },

  // Add this to your apiClient
// Add this to your apiClient
createBulkBluesheetMaterials: async (bulkData: BulkMaterialPayload, bluesheetId: number): Promise<any> => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${apiBaseUrl}/bluesheet/bluesheet/${bluesheetId}/material`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(bulkData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create bulk bluesheet materials");
  }

  return response.json();
},

  createBluesheetMaterial: async (materialData: any, bluesheetId: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/bluesheet/${bluesheetId}/material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(materialData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create bluesheet material");
    }

    return response.json();
  },

  createCompleteBluesheet: async (bluesheetData: any) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/bluesheet/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(bluesheetData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create complete bluesheet");
    }

    return response.json();
  },

  deleteBluesheetMaterial: async (materialId: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/material/${materialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete bluesheet material");
    }

    return response.json();
  },

  // Get all bluesheets with pagination
  getBluesheets: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/bluesheets?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch bluesheets");
    }

    return response.json();
  },

  // Auto-fetch supplier invoice from email for a given PO number
  autoFetchSupplierInvoiceFromEmail: async (payload: { poNumber: string }) => {
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Call Next.js app router API route, which in turn talks to backend/Gmail
    const response = await fetch(`/api/supplier-invoices/auto-fetch-from-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        "Failed to auto-fetch supplier invoice from email"
      );
    }

    return response.json();
  },
// Approve a Bulk Bluesheet
    approveBulkBluesheet: async (ids: number[], status: string = "approved") => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/bluesheetApproved/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ ids, status }),  // { "ids": [66, 65, 67], "status": "approved" }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to approve bluesheet");
    }

    return response.json();
},
  // Approve a Bluesheet
  approveBluesheet: async (bluesheetId: number, status: string = "approved") => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/bluesheet/bluesheetApproved/${bluesheetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to approve bluesheet");
    }

    return response.json();
  },

  getJobBluesheets: async (jobId: number) => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiBaseUrl}/bluesheet/job/${jobId}/bluesheets`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch job bluesheets");
  }

  return response.json();
},
  // Update/Create Bluesheet Materials
  updateBluesheetMaterials: async (bluesheetId: number, materials: any[]) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const payload = {
      materials: materials.map((item: any) => {
        const base: any = {
          material_name: item.material_name,
          unit: item.unit || 'pieces',
          total_ordered: item.total_ordered || 0,
          material_used: item.material_used || 0,
          unit_cost: item.unit_cost || 0,
          supplier_order_id: item.supplier_order_id || '',
          return_to_warehouse: item.return_to_warehouse || false,
          date: item.date || new Date().toISOString().split('T')[0],
          product_id: item.product_id || null,
        }


        // Add total_cost if exists
        if (item.total_cost) {
          base.total_cost = item.total_cost
        }
        // Existing material — id bajao
        if (item.id && String(item.id).length < 13 && !item._isNew) {
          base.id = item.id
        }

        return base
      })
    }

    const response = await fetch(
      `${apiBaseUrl}/bluesheet/bluesheet/${bluesheetId}/materialupdatecreate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to update bluesheet materials')
    }

    return response.json()
  },

  deleteProductFromEstimate: async (estimateProductId: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/estimates/deleteProductFromEstimate/${estimateProductId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete product from estimate");
    }

    return response.json();
  },

  // Staff Timesheet APIs
  createStaffTimesheet: async (timesheetData: {
    job_id?: number;
    staff_id: number;
    date: string;
    start_time: string;
    end_time: string;
    total_hours: number;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/staff-timesheet/createStaffTimesheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(timesheetData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create staff timesheet");
    }

    return response.json();
  },

  getStaffTimesheetById: async (timesheetId: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/staff-timesheet/getStaffTimesheetById/${timesheetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch staff timesheet");
    }

    return response.json();
  },

  getAllStaffTimesheets: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/staff-timesheet/getAllStaffTimesheets?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch staff timesheets");
    }

    return response.json();
  },

  updateStaffTimesheet: async (timesheetId: number, timesheetData: {
    job_id?: number;
    date?: string;
    start_time?: string;
    end_time?: string;
    total_hours?: number;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/staff-timesheet/updateStaffTimesheet/${timesheetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(timesheetData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update staff timesheet");
    }

    return response.json();
  },

  deleteStaffTimesheet: async (timesheetId: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiBaseUrl}/staff-timesheet/deleteStaffTimesheet/${timesheetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete staff timesheet");
    }

    return response.json();
  },

  // Staff Timeline Admin APIs
  getAllStaffWeeklyTimesheetSummary: async (startDate?: string, endDate?: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Build query params
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = `${apiBaseUrl}/staff-timesheet/getAllStaffWeeklyTimesheetSummary${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch staff weekly timesheet summary");
    }

    return response.json();
  },

  searchStaffTimesheets: async (query: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${apiBaseUrl}/staff-timesheet/searchStaffTimesheets?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to search staff timesheets");
    }

    return response.json();
  },

  getStaffWeeklyTimesheetView: async (params: {
    staff_id: number | string;
    start_date: string;
    end_date: string;
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const queryParams = new URLSearchParams();
    queryParams.append('staff_id', params.staff_id.toString());
    queryParams.append('start_date', params.start_date);
    queryParams.append('end_date', params.end_date);

    const url = `${apiBaseUrl}/staff-timesheet/getWeeklyTimesheetView?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch staff weekly timesheet view");
    }

    return response.json();
  },
};
