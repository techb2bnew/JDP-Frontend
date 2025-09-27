import React, { useState, useEffect } from 'react'
import { apiClient } from '../utils/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AutoScrollMultiSelect } from './ui/AutoScrollMultiSelect'
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
  MapPin
} from 'lucide-react'
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

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { globalApiCall } from '../utils/globalApiHandler';
import { Product, Branch } from '../types/product';
import { NewInvoiceDialog } from './invoices/NewInvoiceDialog'

// Sample data structure - replace with your actual data
const sampleJobData = {
  "job": {
    "id": "JOB-2025-001",
    "title": "Electrical Panel Installation",
    "type": "service-based",
    "status": "in-progress",
    "assignedLabor": [],
    "contractor": "ABC Corporation",
    "customer": "ABC Corporation",
    "description": "Install new electrical panel and upgrade wiring system",
    "createdDate": "2025-01-10",
    "dueDate": "2025-01-30",
    "estimatedHours": 40,
    "actualHours": 32,
    "estimatedCost": 5000,
    "actualCost": 5330,
    "location": "123 Business Ave, New York",
    "priority": "high",
    "billingStatus": "invoiced"
  },
  "materials": [
    {
      "id": "1",
      "name": "Electrical Panel",
      "quantity": 1,
      "unit": "unit",
      "unitCost": 450,
      "totalCost": 450,
      "supplier": "ElectroSupply Co"
    },
    {
      "id": "2",
      "name": "Copper Wire - 12 AWG",
      "quantity": 500,
      "unit": "feet",
      "unitCost": 2.5,
      "totalCost": 1250,
      "supplier": "Wire World"
    },
    {
      "id": "3",
      "name": "Circuit Breakers - 20A",
      "quantity": 6,
      "unit": "unit",
      "unitCost": 35,
      "totalCost": 210,
      "supplier": "ElectroSupply Co"
    }
  ],
  "timeLogs": [
    {
      "id": "1",
      "laborName": "Mike Johnson",
      "date": "2025-01-18",
      "hoursWorked": 8,
      "description": "Panel installation and wiring",
      "billable": true
    },
    {
      "id": "2",
      "laborName": "David Wilson",
      "date": "2025-01-20",
      "hoursWorked": 6,
      "description": "Assisted with panel installation",
      "billable": true
    },
    {
      "id": "3",
      "laborName": "Mike Johnson",
      "date": "2025-01-21",
      "hoursWorked": 10,
      "description": "Circuit breaker installation",
      "billable": true
    },
    {
      "id": "4",
      "laborName": "Sarah Davis",
      "date": "2025-01-22",
      "hoursWorked": 6,
      "description": "Final connections and cleanup",
      "billable": false
    }
  ],
  "invoices": [
    {
      "id": "INV-2025-001",
      "type": "Estimate",
      "description": "Initial project estimate with detailed breakdown",
      "amount": 15000,
      "status": "Sent",
      "createdDate": "2025-01-14",
      "dueDate": "2025-01-28"
    },
    {
      "id": "INV-2025-002",
      "type": "Proposal Invoice",
      "description": "Project proposal accepted by client",
      "amount": 15000,
      "status": "Paid",
      "createdDate": "2025-01-16",
      "dueDate": "2025-01-30"
    },
    {
      "id": "INV-2025-003",
      "type": "Progressive Invoice",
      "description": "50% completion milestone payment",
      "amount": 7500,
      "status": "Paid",
      "createdDate": "2025-01-30",
      "dueDate": "2025-02-13"
    },
    {
      "id": "INV-2025-004",
      "type": "Final Invoice",
      "description": "Project completion final payment",
      "amount": 7500,
      "status": "Paid",
      "createdDate": "2025-02-15",
      "dueDate": "2025-03-01"
    }
  ]
}

interface ProjectSummary {
  estimate: number
  actualCost: number
  laborCost: number
  materialsCost: number
  message: string
  success: boolean
}

interface Metric {
  value: number
  unit: string
  color: string
}

interface DashboardMetrics {
  totalHoursWorked?: Metric
  totalMaterialUsed?: Metric
  totalLabourEntries?: Metric
  numberOfInvoices?: Metric
}

interface Estimates {
  id: string,
  customer_id: string,
  job_id: string,
  invoice_number: string,
  invoice_type:string,
  due_date:string,
  issue_date:string,
  status:string,
  description:string,
  additional_costs: string,
  labor_cost: string,
  subtotal: string,
  total_amount: string,
}

interface JobDetailsPageProps {
  jobId: string
  onBack: () => void
  jobs: any[]
  setJobs: (jobs: any[]) => void
  projectSummary: ProjectSummary 
  dashboardMetrics: DashboardMetrics | null
  estimates: Estimates | null
  onReload: () => void
}

interface Supplier {
  id: number;
  company_name: string;
  contact_person: string;
  supplier_code: string;
  user_id: number;
}

export function JobDetailsPage({ jobId, onBack, jobs, setJobs, projectSummary, dashboardMetrics, estimates, onReload }: JobDetailsPageProps) {
  // Find the job from your jobs array or use sample data
  const job = jobs.find(j => j.id === jobId) || sampleJobData.job
 
  //Jyoti

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [selectedLabor, setSelectedLabor] = useState<{ [jobId: string]: string[] }>({});
  const [open, setOpen] = useState(false);

  const [selectedLeadLabor, setSelectedLeadLabor] = useState<{ [jobId: string]: string[] }>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const[customers, setCustomers] = useState([]);
  
  const resetMaterialForm = () => {
    setMaterialFormData({
      name: '',
      supplier: '',
      sku: '',
      quantity: 0,
      unit: '',
      unitCost: 0
    });
    setMaterialValidationErrors({});
  };

// For storing validation errors
const [materialValidationErrors, setMaterialValidationErrors] = useState<Record<string, string>>({});



  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  const handleChangeLabor = (
    jobId: string,
    selectedIds: string[],
    selectedItems: any[]
  ) => {
    setSelectedLabor((prev) => ({
      ...prev,
      [jobId]: selectedIds, // or selectedItems, depending on what you want to store
    }));
  };

  const handleChangeLead = (
    jobId: string,
    selectedIds: string[],
    selectedItems: any[]
  ) => {
    setSelectedLeadLabor((prev) => ({
      ...prev,
      [jobId]: selectedIds,
    }));

    // Optionally handle selectedItems too
  };

const fetchProductsData = async () => {
    try {
      setIsLoadingProducts(true);

      // Fetch the latest job details from API
      const jobDetails = await apiClient.getJobById(jobId);

      // Update the jobs array with the fetched job details
      const updatedJobs = jobs.map(j => j.id === jobId ? jobDetails : j);
      setJobs(updatedJobs);
      
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setIsLoadingProducts(false); // ✅ stop loading
    }
};

const handleDeleteProduct = async () => {
  if (!productToDelete) return;

  try {
    setIsLoading(true); // Global loading for delete action
    
    const token = localStorage.getItem("jdp_auth")
      ? JSON.parse(localStorage.getItem("jdp_auth")!).token
      : null;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${apiBaseUrl}/products/deleteProduct/${productToDelete.id}`,
        { method: "DELETE", headers }
      );

      const responseData = await response.json();
      console.log("Product deletion response:", responseData);

      if (responseData.success) {
        if (typeof window !== "undefined") {
          const { toast } = await import("sonner");
          toast.success("Product deleted successfully!");
        }

        // Close dialog and reset state
        setShowDeleteAlert(false);
        setProductToDelete(null);
        
      // Optional: Refetch data to ensure sync with server
      await fetchProductsData();
      onReload();
      } else {
        throw new Error(responseData.message || "Failed to delete product");
      }
  } catch (error) {
    console.error("Error deleting product:", error);
    if (typeof window !== "undefined") {
      const { toast } = await import("sonner");
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    }
  } finally {
    setIsLoading(false);
  }
};

const handleAction = (action: string, material: any) => {
  if (action === 'delete') {
    setProductToDelete(material);
    setShowDeleteAlert(true);
  }
  // Add other actions here if needed
};

  useEffect(() => {
    const initialSelection: { [jobId: string]: string[] } = {};
    const initialLabor: { [jobId: string]: string[] } = {};

    jobs.forEach((job) => {
      // Wrap assigned lead labor codes in arrays for multi-select
      const assignedLeadLaborCodes = job.assignedLeadLaborDetails?.map(
        (labor: any) => labor.user.full_name
      ) || [];
      initialSelection[job.id] = assignedLeadLaborCodes;

      // Similarly for assigned labor
      console.log('job.assignedLaborDetails', job.assignedLaborDetails);
      const assignedLaborCodes = job.assignedLaborDetails?.map(
        (labor: any) => labor.user.full_name
        
      ) || [];
      initialLabor[job.id] = assignedLaborCodes;
      console.log('initialLabor', initialLabor);
    });

    setSelectedLeadLabor(initialSelection);
    setSelectedLabor(initialLabor); // ✅ Keep this
  }, [jobs]);

  useEffect(() => {
    fetchProductsData(); // Fetch products for current page
  }, []);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const fetchData = async () => {


    try {
      const response = await globalApiCall(`${apiBaseUrl}/suppliers/getAllSuppliers`, {
        method: 'GET'
      });
      
      return await response.json();
    } catch (error) {
      // Token revocation is automatically handled
      // Only handle other errors here
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        console.error('Other error:', error);
      }
    }
  }
  useEffect(() => {
    const loadSuppliers = async () => {
      const data = await fetchData(); 
      console.log("Suppliersss", data.data, data.data.data[0]);
      if (data?.data) {
        setSuppliers(data.data.data);
      }
      console.log('suppiersSet', suppliers);
    };

    loadSuppliers();
  }, []);

const handleSaveProduct = async () => {
  // ✅ Run validation first
  const errors: Record<string, string> = {};

  if (!materialFormData.name?.trim()) {
    errors.name = "Product name is required";
  }
  if (!materialFormData.supplier) {
    errors.supplier = "Supplier is required";
  }
  if (!materialFormData.sku?.trim()) {
    errors.sku = "Supplier SKU is required";
  }
  if (materialFormData.quantity <= 0) {
    errors.quantity = "Quantity must be greater than 0";
  }
  if (!materialFormData.unit?.trim()) {
    errors.unit = "Unit is required";
  }
  if (materialFormData.unitCost <= 0) {
    errors.unitCost = "Unit cost must be greater than 0";
  }

  if (Object.keys(errors).length > 0) {
    setMaterialValidationErrors(errors);
    toast.error("Please fix the validation errors");
    return;
  }

  try {
    const payload = {
      product_name: materialFormData.name,
      supplier_id: Number(materialFormData.supplier),
      supplier_sku: materialFormData.sku,
      jdp_sku: `JDP-${materialFormData.sku}`,
      stock_quantity: materialFormData.quantity,
      unit: materialFormData.unit.toLowerCase(),
      job_id: jobId,
      is_custom: true,
      unit_cost: materialFormData.unitCost,
    };

    await globalApiCall(`${apiBaseUrl}/products/createProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    toast.success("Product created successfully!");
    setShowAddMaterialModal(false);
    resetMaterialForm(); // <- same like resetTimeLogForm
    await fetchProductsData();
    onReload();
 
  } catch (error) {
    console.error("Error creating product:", error);
    toast.error(error instanceof Error ? error.message : "Failed to create product");
  }
};



  const fetchAllCustomers = async() => {
    try {
      setIsLoading(true)
      const customers = await apiClient.getCustomers()
      console.log('customers', customers);
      setCustomers(customers.data);

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      toast.error('Failed to load Dashboard Metrics')
    }finally {
      setIsLoading(false)
    }
  }

  //Jyoti

  const materials = job.assignedMaterialsDetails || sampleJobData.materials

  const timeLogs = sampleJobData.timeLogs // Keep sample data for now as we don't have time logs API
  const invoices = estimates || sampleJobData.invoices // Keep sample data for now as we don't have invoices API

  // Calculate totals using real job data
  const totalMaterialCost = materials.reduce((sum: number, material: any) => sum + (material.unit_cost || material.totalCost || 0), 0)
  const totalLaborCost = job.assignedLaborDetails && job.assignedLaborDetails.length > 0 ? 
    job.assignedLaborDetails.reduce((sum: number, labor: any) => {
      const hourlyRate = labor.hourly_rate || 0;
      const estimatedHours = job.estimatedHours || 0;
      return sum + (hourlyRate * estimatedHours);
    }, 0) : 
    job.estimatedCost || 0
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hoursWorked, 0)
  const totalMaterialItems = materials.reduce((sum: number, material: any) => sum + (material.stock_quantity || material.quantity || 0), 0)
  const totalLaborEntries = job.assignedLaborDetails ? job.assignedLaborDetails.length : timeLogs.length;
  const totalInvoices = invoices.length;
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState({
    title: job.title,
    type: job.type,
    location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
    description: job.description,
    contractor: job.contractor || job.customer,
    startDate: '01/15/2025',
    priority: 'High'
  });
  const handleSave = async () => {
    try {
      // Map edited job data to API payload structure
      const updatePayload = {
        job_title: editedJob.title,
        job_type: editedJob.type === 'service-based' ? 'service_based' : 'contract_based',
        customer_id: job.customer ? parseInt(job.customer) : undefined,
        contractor_id: job.contractor ? parseInt(job.contractor) : undefined,
        description: editedJob.description,
        priority: editedJob.priority.toLowerCase(),
        address: job.address || '',
        city_zip: job.cityZip || '',
        phone: job.phone || undefined,
        email: job.email || undefined,
        bill_to_address: job.billToAddress || undefined,
        bill_to_city_zip: job.billToCityZip || undefined,
        bill_to_phone: job.billToPhone || undefined,
        bill_to_email: job.billToEmail || undefined,
        same_as_address: job.sameAsAddress || false,
        due_date: job.dueDate || '',
        estimated_hours: job.estimatedHours || undefined,
        estimated_cost: job.estimatedCost || undefined,
        assigned_lead_labor_ids: job.assignedLeadLaborDetails && job.assignedLeadLaborDetails.length > 0 ? JSON.stringify(job.assignedLeadLaborDetails.map((labor: any) => labor.id)) : undefined,
        assigned_labor_ids: job.assignedLaborDetails && job.assignedLaborDetails.length > 0 ? JSON.stringify(job.assignedLaborDetails.map((labor: any) => labor.id)) : undefined,
        assigned_material_ids: job.materials && job.materials.length > 0 ? JSON.stringify(job.materials) : undefined,
        status: job.status === 'pending' ? 'active' : job.status === 'in-progress' ? 'in_progress' : job.status
      };

      console.log('Updating job with payload:', updatePayload);
      const response = await apiClient.updateJob(jobId, updatePayload);
      console.log('Job updated successfully:', response);
      
      // Update the job data in the parent component
      const updatedJobs = jobs.map((j: any) => j.id === jobId ? { ...j, ...editedJob } : j);
      setJobs(updatedJobs);
      
    setIsEditing(false);
      toast.success('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update job');
    }
  };

  const handleCancel = () => {
    setEditedJob({
      title: job.title,
      type: job.type,
      location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
      description: job.description,
      contractor: job.contractor || job.customer,
      startDate: '01/15/2025',
      priority: 'High'
    });
    setIsEditing(false);
  };

  const handleInvoiceDelete = () =>{

  }
  const validateTimeLogForm = () => {
    const errors: Record<string, string> = {};

    if (!timeLogFormData.workerName.trim()) {
      errors.workerName = 'Full name is required';
    }

    if (!timeLogFormData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(timeLogFormData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!timeLogFormData.role) {
      errors.role = 'Role is required';
    }

    if (timeLogFormData.hoursWorked <= 0) {
      errors.hoursWorked = 'Hours worked must be greater than 0';
    }

    if (timeLogFormData.hourlyRate <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    setTimeLogValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTimeLog = async () => {
    if (timeLogModalMode === 'view') {
      setShowTimeLogModal(false);
      setCurrentTimeLog(null);
      return;
    }

    if (!validateTimeLogForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      if (timeLogModalMode === 'create') {
        const timeLogPayload = {
          job_id: jobId,
          labor_id: '', // Will be set by backend or can be selected from assigned labor
          full_name: timeLogFormData.workerName,
          email: timeLogFormData.email,
          role: timeLogFormData.role,
          hours_worked: timeLogFormData.hoursWorked,
          hourly_rate: timeLogFormData.hourlyRate,
          notes: timeLogFormData.description,
          date_of_joining: timeLogFormData.date,
          is_custom: true
        };

        await apiClient.createLaborTimeLog(timeLogPayload);
        toast.success('Labor time log created successfully!');
      } else if (timeLogModalMode === 'edit') {
        // Determine is_custom value based on labor type
        const isCustom = currentTimeLog.isCustomLabor || false;
        
        const updatePayload = {
          job_id: jobId,
          labor_id: currentTimeLog.id,
          full_name: timeLogFormData.workerName,
          email: timeLogFormData.email,
          role: timeLogFormData.role,
          hours_worked: timeLogFormData.hoursWorked,
          hourly_rate: timeLogFormData.hourlyRate,
          notes: timeLogFormData.description,
          date_of_joining: timeLogFormData.date,
          is_custom: isCustom
        };

        await apiClient.updateLaborTimeLog(currentTimeLog.id, updatePayload);
        toast.success('Labor time log updated successfully!');
      }

      setShowTimeLogModal(false);
      setCurrentTimeLog(null);
      resetTimeLogForm();
      
      // Refresh job data to show the new/updated labor time log
      await refreshJobData();
    } catch (error) {
      console.error('Error saving labor time log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save labor time log');
    }
  };

  const handleViewTimeLog = async (labor: any) => {
    console.log('View button clicked, labor:', labor);
    try {
      // Fetch detailed labor data from API
      const laborDetails = await apiClient.getLaborById(labor.id);
      console.log('Fetched labor details:', laborDetails);
      
      setCurrentTimeLog(laborDetails);
      setTimeLogFormData({
        workerName: laborDetails.users?.full_name || '',
        email: laborDetails.users?.email || '',
        role: laborDetails.users.role || '',
        hoursWorked: laborDetails.hours_worked || 0,
        hourlyRate: laborDetails.hourly_rate || 0,
        description: laborDetails.notes || '',
        date: laborDetails.date_of_joining || new Date().toISOString().split('T')[0]
      });
      setTimeLogModalMode('view');
      setShowTimeLogModal(true);
      console.log('View modal should be open now');
    } catch (error) {
      console.error('Error fetching labor details:', error);
      toast.error('Failed to fetch labor details');
    }
  };

  const handleEditTimeLog = async (labor: any) => {
    console.log('Edit button clicked, labor:', labor);
    try {
      // Fetch detailed labor data from API
      const laborDetails = await apiClient.getLaborById(labor.id);
      console.log('Fetched labor details for edit:', laborDetails);
      
      // Check if this is assigned labor or custom labor
      const isAssignedLabor = job.assignedLaborDetails && job.assignedLaborDetails.some((al: any) => al.id === labor.id);
      const isCustomLabor = job.customLabor && job.customLabor.some((cl: any) => cl.id === labor.id);
      
      // Store the labor type for use in save operation
      setCurrentTimeLog({
        ...laborDetails,
        isAssignedLabor: isAssignedLabor,
        isCustomLabor: isCustomLabor
      });
      
      setTimeLogFormData({
        workerName: laborDetails.users?.full_name || laborDetails.labor_code || '',
        email: laborDetails.users?.email || '',
        role: laborDetails.users.role || '',
        hoursWorked: laborDetails.hours_worked || 0,
        hourlyRate: laborDetails.hourly_rate || 0,
        description: laborDetails.notes || '',
        date: laborDetails.date_of_joining || new Date().toISOString().split('T')[0]
      });
      setTimeLogModalMode('edit');
      setShowTimeLogModal(true);
      console.log('Edit modal should be open now');
    } catch (error) {
      console.error('Error fetching labor details for edit:', error);
      toast.error('Failed to fetch labor details');
    }
  };

  const handleCreateTimeLog = () => {
    setCurrentTimeLog(null);
    resetTimeLogForm();
    setTimeLogModalMode('create');
    setShowTimeLogModal(true);
  };

  const handleUpdateTimeLog = async () => {
    if (!validateTimeLogForm() || !currentTimeLog) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      // Determine is_custom value based on labor type
      const isCustom = currentTimeLog.isCustomLabor || false;
      
      const updatePayload = {
        job_id: jobId,
        labor_id: currentTimeLog.id,
        full_name: timeLogFormData.workerName,
        email: timeLogFormData.email,
        role: timeLogFormData.role,
        hours_worked: timeLogFormData.hoursWorked,
        hourly_rate: timeLogFormData.hourlyRate,
        notes: timeLogFormData.description,
        date_of_joining: timeLogFormData.date,
        is_custom: isCustom
      };

      await apiClient.updateLaborTimeLog(currentTimeLog.id, updatePayload);
      toast.success('Labor time log updated successfully!');
      setShowTimeLogModal(false);
      setCurrentTimeLog(null);
      resetTimeLogForm(); 
    } catch (error) {
      console.error('Error updating labor time log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update labor time log');
    }
  };

  const handleDeleteTimeLog = async (timeLogId: string) => {
    try {
      await apiClient.deleteLaborTimeLog(timeLogId);
      toast.success('Labor time log deleted successfully!');
      
      // Refresh job data to remove the deleted labor time log
      await refreshJobData();
     } catch (error) {
      console.error('Error deleting labor time log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete labor time log');
    }
  };

  const resetTimeLogForm = () => {
    setTimeLogFormData({
      workerName: '',
      email: '',
      role: '',
      hoursWorked: 0,
      hourlyRate: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setTimeLogValidationErrors({});
  };

  const refreshJobData = async () => {
    try {
      console.log('Refreshing job data...');
      const updatedJobData = await apiClient.getJobById(jobId);
      console.log('Updated job data:', updatedJobData);
      
      // Update the jobs array in the parent component
      const updatedJobs = jobs.map((j: any) => j.id === jobId ? updatedJobData : j);
      setJobs(updatedJobs);
      
      console.log('Job data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing job data:', error);
      toast.error('Failed to refresh job data');
    }
  };

  const [jobFormData, setJobFormData] = useState({
    title: job.title,
    type: job.type,
    location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
    description: job.description
  });

  // Update editedJob when job data changes
  useEffect(() => {
    console.log('JobDetailsPage: Job data updated:', job);
    console.log('JobDetailsPage: Job location:', job.location);
    console.log('JobDetailsPage: Job address:', job.address);
    console.log('JobDetailsPage: Job cityZip:', job.cityZip);
    
    setEditedJob({
      title: job.title,
      type: job.type,
      location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
      description: job.description,
      contractor: job.contractor || job.customer,
      startDate: '01/15/2025',
      priority: 'High'
    });
  }, [job]);

  // Fetch roles and labor time logs on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch roles
        const rolesData = await apiClient.getRoles();
        setRoles(rolesData); 
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load initial data');
      }
    };

    fetchInitialData();
  }, [jobId]);

  const [invoiceFormData, setInvoiceFormData] = useState({
    type: 'Estimate',
    dueDate: '',
    description: '',
    amount: 0
  });

  const [materialFormData, setMaterialFormData] = useState({
    name: '',
    quantity: 0,
    unitCost: 0,
    sku: '',
    unit: 'Pieces',
    supplier: ''
  });

  const [timeLogFormData, setTimeLogFormData] = useState({
    workerName: '',
    email: '',
    role: '',
    hoursWorked: 0,
    hourlyRate: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Labor Time Log states
  const [laborTimeLogs, setLaborTimeLogs] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingTimeLogs, setIsLoadingTimeLogs] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [timeLogModalMode, setTimeLogModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentTimeLog, setCurrentTimeLog] = useState<any>(null);
  const [timeLogValidationErrors, setTimeLogValidationErrors] = useState<Record<string, string>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (input: string | Date): string => {
  const date = input instanceof Date ? input : new Date(input);

  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

  type StatusType = 'in-progress' | 'sent' | 'paid' | 'approved' | 'pending';

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<StatusType, { color: string; text: string }> = {
      'in-progress': { color: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      'sent': { color: 'bg-gray-100 text-gray-800', text: 'Sent' },
      'paid': { color: 'bg-green-100 text-green-800', text: 'Paid' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    };

    // Type assertion for known status values
    const normalizedStatus = status.toLowerCase() as StatusType;
    const config = statusConfig[normalizedStatus] || { color: 'bg-gray-100 text-gray-800', text: status };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        High Priority
      </span>
    )
  }


  console.log("Assigned Lead Labor Details:", jobs);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Invoice
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Send Invoice
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
              Edit Job
            </Button>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Job Title and Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-600">#{job.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(job.status)}
            {getPriorityBadge(job.priority)}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Hours Worked</p>
                  <p className="text-2xl font-bold text-blue-900">{dashboardMetrics?.totalHoursWorked?.value}</p>
                  <p className="text-xs text-blue-600">{dashboardMetrics?.totalHoursWorked?.unit}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Product Used</p>
                  <p className="text-2xl font-bold text-green-900">{dashboardMetrics?.totalMaterialUsed?.value}</p>
                  <p className="text-xs text-green-600">{dashboardMetrics?.totalMaterialUsed?.unit}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Labour Entries</p>
                  <p className="text-2xl font-bold text-purple-900">{dashboardMetrics?.totalLabourEntries?.value}</p>
                  <p className="text-xs text-purple-600">{dashboardMetrics?.totalLabourEntries?.unit}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Number of Invoices</p>
                  <p className="text-2xl font-bold text-orange-900">{dashboardMetrics?.numberOfInvoices?.value}</p>
                  <p className="text-xs text-orange-600">{dashboardMetrics?.numberOfInvoices?.unit}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Details
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className={`flex items-center gap-3 ${!isEditing ? 'bg-[#f2f0f0] p-3 rounded-md' : ''}`}>
                      {!isEditing && (
                        <Users className="h-4 w-4 text-black-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600"> {isEditing ? "Job Title" : "Customer"}</p>
                        {isEditing ? (
                          <Input
                            value={editedJob.title}
                            onChange={(e) => setEditedJob({ ...editedJob, title: e.target.value })}
                          />
                        ) : (
                          <p className="font-medium">{job.customerName || 'No customer assigned'}</p>
                        )}
                      </div>
                    </div>
                    {!isEditing && (
                      <div className={`flex items-center gap-3 ${!isEditing ? 'bg-[#dae8ff80] p-3 rounded-md' : ''}`}>
                        <Clock className="h-4 w-4 text-black-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Start Date</p>
                          {isEditing ? (
                            <Input
                              value={editedJob.startDate}
                              onChange={(e) => setEditedJob({ ...editedJob, startDate: e.target.value })}
                            />
                          ) : (
                            <p className="font-medium">{editedJob.startDate}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {!isEditing && (
                      <div className={`flex items-center gap-3 ${!isEditing ? 'bg-[#bbf7d021] p-3 rounded-md' : ''}`}>
                        <MapPin className="h-4 w-4 text-black-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{editedJob.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className={`flex-1 ${!isEditing ? 'bg-[#dbdaff30] p-3 rounded-md' : ''}`}>
                      <p className="text-sm text-gray-600">Job Type</p>
                      {isEditing ? (
                        <Select
                          value={editedJob.priority}
                          onValueChange={(value) => setEditedJob({ ...editedJob, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">Service-based</SelectItem>
                            <SelectItem value="Medium">Contract-based</SelectItem>
                            <SelectItem value="Low">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>

                        // <Input
                        //   value={editedJob.type}
                        //   onChange={(e) => setEditedJob({ ...editedJob, type: e.target.value })}
                        // />
                      ) : (
                        <p className="font-medium">{editedJob.type}</p>
                      )}
                    </div>
                    {!isEditing && (
                      <div className={`flex-1 ${!isEditing ? 'bg-[#fff7ed8c] p-3 rounded-md' : ''}`}>
                        <p className="text-sm text-gray-600">Job Estimate</p>
                        <p className="font-medium">{formatCurrency(job.estimatedCost)}</p>
                      </div>
                    )}
                    {!isEditing && (

                      <div className={`flex-1 ${!isEditing ? 'bg-[#9f6b290d] p-3 rounded-md' : ''}`}>
                        <p className="text-sm text-gray-600">Priority</p>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {editedJob.priority}
                        </span>
                      </div>
                    )}

                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Location</p>
                      <Input
                        value={editedJob.location}
                        onChange={(e) => setEditedJob({ ...editedJob, location: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  {isEditing ? (
                    <Textarea
                      value={editedJob.description}
                      onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm bg-gray-100 p-3 rounded-md">{editedJob.description}</p>
                  )}
                </div>

                {/* Assigned Labor Section */}
                {/* {job.assignedLaborDetails && job.assignedLaborDetails.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Assigned Labor</p>
                    <div className="space-y-2">
                      {job.assignedLaborDetails.map((labor: any, index: number) => (
                        <div key={index} className="bg-gray-100 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{labor.user?.full_name || labor.labor_code}</p>
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
                  
                  {/* Jyoti */}
                  {/* Labor Selection */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Labor</p>
                  <AutoScrollMultiSelect
                    selectedValues={selectedLabor[job.id] || []}
                    onSelectionChange={(selectedIds, selectedItems) => {
                      handleChangeLabor(job.id, selectedIds, selectedItems);
                      clearValidationError('assignedLabor');
                    }}
                    placeholder="Select labor"
                    fetchData={apiClient.getLabor}
                    displayField="name"
                    valueField="name"
                    className="w-full"
                  />
                </div>

                {/* Jyoti */}

                {/* Assigned Lead Labor Section */}
                {/* {job.assignedLeadLaborDetails && job.assignedLeadLaborDetails.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Lead Labor</p>
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

                
                {/* Jyoti */}
                {/* Lead Labor Selection */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lead Labor</p>
                  <AutoScrollMultiSelect
                    selectedValues={selectedLeadLabor[job.id] || []}
                    onSelectionChange={(selectedIds, selectedItems) => {
                      handleChangeLead(job.id, selectedIds, selectedItems);
                      clearValidationError('assignedLabor');
                      clearValidationError('assignedLeadLabor');
                    }}
                    placeholder="Select lead labor"
                    fetchData={apiClient.getLeadLabor}
                    displayField="name"
                    valueField="name"
                    className="w-full"
                  />
                </div>
                {/* Jyoti */}

              </CardContent>
              <CardFooter>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                      <Check className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction History
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => {setOpen(true); fetchAllCustomers();}}>
                  <Plus className="h-4 w-4" />
                  Add Invoice
                </Button>
                <NewInvoiceDialog
                  open={open}
                  onOpenChange={setOpen}
                  onSave={handleSave}
                  customers={customers}
                  roles={roles}
                  job={job}
                  suppliers={suppliers}
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{invoice.invoice_type}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${invoice.invoice_type === 'estimate' ? 'bg-blue-100 text-blue-800' :
                              invoice.type === 'Proposal Invoice' ? 'bg-purple-100 text-purple-800' :
                                invoice.type === 'Progressive Invoice' ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                              }`}>
                              {invoice.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{invoice.description}</p>
                          <p className="text-xs text-gray-500">
                            #{invoice.invoice_number} • Created: {invoice.issue_date} • Due: {invoice.due_date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold mb-1">{formatCurrency(invoice.total_amount)}</p>
                          <span>
                            {getStatusBadge(job.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-1"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceModal(true);
                            }}>
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick = {() => {handleInvoiceDelete(invoice)}}>
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Material Usage */}
            <Card>
  <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
    <CardTitle className="flex items-center gap-2">
      <Package className="h-5 w-5" />
      Product Usage
      {isLoadingProducts && (
        <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin ml-2"></div>
      )}
    </CardTitle>
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        Total Cost: <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
      </span>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2" 
        onClick={() => setShowAddMaterialModal(true)}
        disabled={isLoadingProducts}
      >
        <Plus className="h-4 w-4" />
        Add Product
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {isLoadingProducts ? (
      // Loading skeleton
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
              <div>
                <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="h-4 w-16 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 w-12 bg-gray-300 rounded"></div>
              </div>
              <div className="h-8 w-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    ) : materials.length === 0 ? (
      // Empty state
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No products found</p>
        <Button 
          variant="outline" 
          onClick={() => setShowAddMaterialModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add First Product
        </Button>
      </div>
    ) : (
      // Products list
      <div className="space-y-4">
        {job.assignedMaterialsDetails.map((material: any) => (
          <div 
            key={material.id} 
            className={`flex items-center justify-between p-4 bg-blue-50 rounded-lg transition-opacity ${
              isLoading && productToDelete?.id === material.id ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h4 className="font-medium">{material.product_name || material.name}</h4>
                <p className="text-xs text-gray-600">
                  {material.supplier?.company_name || material.supplier}     SKU: {material.supplier_sku || material.jdp_sku}    {formatDate(material.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(material.unit_cost || material.totalCost || 0)}</p>
                <p className="text-sm text-gray-600">{material.stock_quantity || material.quantity || 0} {material.unit}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1" 
                onClick={() => handleAction('delete', material)}
                disabled={isLoading}
              >
                {isLoading && productToDelete?.id === material.id ? (
                  <div className="h-3 w-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="h-3 w-3 text-red-600" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>

            {/* Labour & Time Logs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Labour & Time Logs
                </CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Total Cost: <span className="font-semibold">{formatCurrency(totalLaborCost)}</span>
                  </span>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleCreateTimeLog}>
                    <Plus className="h-4 w-4" />
                    Add Time Log
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show assigned labor data */}
                  {job.assignedLaborDetails && job.assignedLaborDetails.length > 0 && (
                    <>
                      {job.assignedLaborDetails.map((labor: any, index: number) => (
                        <div key={`assigned-${labor.id}`} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                              <h4 className="font-medium">{labor.user?.full_name || labor.labor_code}</h4>
                            <p className="text-xs text-gray-600">
                                {labor.trade} • {labor.experience} • {labor.availability}
                            </p>
                              <p className="text-xs text-gray-500">Code: {labor.labor_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                              <p className="font-semibold">${labor.hourly_rate || 0}/hr</p>
                            <p className="text-sm text-gray-600">
                                {labor.hours_worked || 0} hrs worked
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Assigned
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleViewTimeLog(labor)}
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleEditTimeLog(labor)}
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Show custom labor data */}
                  {job.customLabor && job.customLabor.length > 0 && (
                    <>
                      {job.customLabor.map((labor: any, index: number) => (
                        <div key={`custom-${labor.id}`} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                              <h4 className="font-medium">{labor.user?.full_name || labor.labor_code}</h4>
                            <p className="text-xs text-gray-600">
                                {labor.trade || 'Custom Labor'} • {labor.experience || 'N/A'} • {labor.availability || 'Available'}
                            </p>
                              <p className="text-xs text-gray-500">Code: {labor.labor_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                              <p className="font-semibold">${labor.hourly_rate || 0}/hr</p>
                            <p className="text-sm text-gray-600">
                                {labor.hours_worked || 0} hrs worked
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Custom
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleViewTimeLog(labor)}
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleEditTimeLog(labor)}
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Show message if no labor at all */}
                  {(!job.assignedLaborDetails || job.assignedLaborDetails.length === 0) && 
                   (!job.customLabor || job.customLabor.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No labor assigned to this job</p>
                    </div>
                  )}


                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Project Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Project Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Job Estimate</span>
                    <span className="font-medium">{formatCurrency(projectSummary?.estimate)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Products Cost</span>
                    <span className="font-medium">{formatCurrency(projectSummary?.materialsCost)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Labor Cost</span>
                    <span className="font-medium">{formatCurrency(projectSummary?.laborCost)}</span>
                  </div>

                  <hr />

                  <div className="flex justify-between">
                    <span className="font-medium">Actual Project Cost</span>
                    <span className="font-bold text-lg">{formatCurrency(projectSummary?.actualCost)}</span>
                  </div>
                </div> 
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <FileText className="h-4 w-4" />
                  Generate Invoice
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Send to Customer
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


      {/* Add Invoice Modal */}
      <Dialog open={showAddInvoiceModal} onOpenChange={setShowAddInvoiceModal}>
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
      </Dialog>

      {/* Add Material Modal */}
      <Dialog open={showAddMaterialModal} onOpenChange={setShowAddMaterialModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a new material to this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className="mb-2">Product Name</Label>
                <Input
                  value={materialFormData.name}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                />
                {materialValidationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{materialValidationErrors.name}</p>
                )}
              </div>
              <div>
                <Label className="mb-2">SKU</Label>
                <Input
                  value={materialFormData.sku}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, sku: e.target.value })}
                />
                {materialValidationErrors.sku && (
                  <p className="text-red-500 text-sm mt-1">{materialValidationErrors.sku}</p>
                )}
              </div>

            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Quantity</Label>
                <Input
                  type="number"
                  value={materialFormData.quantity === 0 ? "" : materialFormData.quantity}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
                />
                {materialValidationErrors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{materialValidationErrors.quantity}</p>
                )}
              </div>
              <div>
                <Label className="mb-2">Unit</Label>
                <Select
                  value={materialFormData.unit}
                  onValueChange={(value) => setMaterialFormData({ ...materialFormData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pieces">Pieces</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Roll">Roll</SelectItem>
                  </SelectContent>
                </Select>
                {materialValidationErrors.unit && (
                  <p className="text-red-500 text-sm mt-1">{materialValidationErrors.unit}</p>
                )}
              </div>


            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Unit Cost</Label>
                <Input
                  type="number"
                  value={materialFormData.unitCost === 0 ? "" : materialFormData.unitCost}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, unitCost: e.target.value === "" ? 0 : Number(e.target.value) })}
                />
                {materialValidationErrors.unitCost && (
                  <p className="text-red-500 text-sm mt-1">{materialValidationErrors.unitCost}</p>
                )}
              </div>
              <div>
                <Label className="mb-2">Supplier</Label>
                
                {/* <Input
                  value={materialFormData.supplier}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, supplier: e.target.value })}
                /> */}
                
                {/* Jyoti */}
                <select
                  value={materialFormData.supplier}
                  onChange={(e) =>
                    setMaterialFormData({ ...materialFormData, supplier: e.target.value })
                  }
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.contact_person} 
                    </option>
                  ))}
                </select>
                {materialValidationErrors.supplier && (
                  <p className="text-red-500 text-sm mt-1">{materialValidationErrors.supplier}</p>
                )}
                {/* Jyoti */}

              </div>
            </div>
            <div className='bg-blue-100 p-3 border border-blue-300 rounded flex items-center gap-2'>
              <Building className='w-4 h-4' />
              <Label>Total Cost: ${(materialFormData.quantity * materialFormData.unitCost).toFixed(2)}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {resetMaterialForm(); setShowAddMaterialModal(false)}}>
              Cancel
            </Button>
            {/* <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              // Save logic here
              setShowAddMaterialModal(false);
            }}>
              Add Material
            </Button> */}
            {/* Jyoti */}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              // onClick={async () => {
              //   const result = await createProduct(materialFormData);

              //   if (result?.success) {
              //     setShowAddMaterialModal(false);
              //     setMaterialFormData({
              //       name: '',
              //       quantity: 0,
              //       unitCost: 0,
              //       sku: '',
              //       unit: 'Pieces',
              //       supplier: ''
              //     });
              //     await fetchProductsData();
              //     console.log("✅ Product created:", result);
              //   } else {
              //     console.error("❌ Failed to create product", result);
              //   }
              // }}
              onClick={async () => handleSaveProduct()}
            >

              Add Material
            </Button>
            {/* Jyoti */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Time Log Modal */}
      <Dialog open={showTimeLogModal} onOpenChange={setShowTimeLogModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {timeLogModalMode === 'create' && 'Add Labor Time Log'}
              {timeLogModalMode === 'edit' && 'Edit Labor Time Log'}
              {timeLogModalMode === 'view' && 'View Labor Time Log'}
            </DialogTitle>
            <DialogDescription>
              {timeLogModalMode === 'create' && 'Add a new labor time entry for this job'}
              {timeLogModalMode === 'edit' && 'Edit the labor time entry'}
              {timeLogModalMode === 'view' && 'View the labor time entry details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Full Name *</Label>
                <Input
                  value={timeLogFormData.workerName}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, workerName: e.target.value })}
                  placeholder="Enter full name"
                  disabled={timeLogModalMode === 'view'}
                />
                {timeLogValidationErrors.workerName && (
                  <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.workerName}</p>
                )}
              </div>
              <div>
                <Label className="mb-2">Email *</Label>
                <Input
                  type="email"
                  value={timeLogFormData.email}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, email: e.target.value })}
                  placeholder="Enter email address"
                  disabled={timeLogModalMode === 'view'}
                />
                {timeLogValidationErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.email}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Role *</Label>
                <Select 
                  value={timeLogFormData.role} 
                  onValueChange={(value) => setTimeLogFormData({ ...timeLogFormData, role: value })}
                  disabled={timeLogModalMode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.roleName}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {timeLogValidationErrors.role && (
                  <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.role}</p>
                )}
              </div>
              <div>
                <Label className="mb-2">Date</Label>
                <Input
                  type="date"
                  value={timeLogFormData.date}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, date: e.target.value })}
                  disabled={timeLogModalMode === 'view'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Hours Worked *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={timeLogFormData.hoursWorked}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, hoursWorked: Number(e.target.value) })}
                  placeholder="0"
                  disabled={timeLogModalMode === 'view'}
                />
                {timeLogValidationErrors.hoursWorked && (
                  <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.hoursWorked}</p>
                )}
              </div>
              <div>
                <Label className="mb-2">Hourly Rate *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={timeLogFormData.hourlyRate}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, hourlyRate: Number(e.target.value) })}
                  placeholder="0.00"
                  disabled={timeLogModalMode === 'view'}
                />
                {timeLogValidationErrors.hourlyRate && (
                  <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.hourlyRate}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-2">Description</Label>
              <Textarea
                value={timeLogFormData.description}
                onChange={(e) => setTimeLogFormData({ ...timeLogFormData, description: e.target.value })}
                placeholder="Describe the work performed"
                rows={3}
                disabled={timeLogModalMode === 'view'}
              />
            </div>
            
            <div className='bg-blue-100 p-3 border border-blue-300 rounded flex items-center gap-2'>
              <ClockIcon className='w-4 h-4' />
              <Label>Total Cost: ${(timeLogFormData.hoursWorked * timeLogFormData.hourlyRate).toFixed(2)}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTimeLogModal(false);
              setCurrentTimeLog(null);
              resetTimeLogForm();
            }}>
              {timeLogModalMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {timeLogModalMode !== 'view' && (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveTimeLog}>
                {timeLogModalMode === 'create' ? 'Add Time Log' : 'Update Time Log'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Invoice Details
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold">
              {selectedInvoice?.invoice_type} - {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Invoice Information</h3>
            <div className="border-t border-gray-200 my-4"></div> 
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{selectedInvoice?.invoice_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number</p>
                  <p className="font-medium">{selectedInvoice?.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice?.total_amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {selectedInvoice && getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Created Date</p>
                <p className="font-medium">{selectedInvoice?.issue_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">{selectedInvoice?.due_date}</p>
              </div>
            </div>
            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-sm mt-2">{selectedInvoice?.description}</p>
            </div>


            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setShowInvoiceModal(false)}>
                <X className="h-4 w-4" />
                Close
              </Button>
              <Button variant="outline" className="gap-2 bg-primary text-primary-foreground">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the product "{productToDelete?.product_name}" from your inventory.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDeleteProduct} 
        disabled={isLoading}
        className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Deleting...
          </div>
        ) : (
          'Delete Product'
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </div>
  )
}

export default JobDetailsPage

