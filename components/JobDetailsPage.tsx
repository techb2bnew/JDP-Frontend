import React, { useState, useEffect, useRef } from 'react'
import { apiClient } from '../utils/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { addInvoice } from '@/redux/slices/jobsSlice'
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
  UserCheck
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
import { AutoScrollMultiSelect } from './ui/AutoScrollMultiSelect'
import { useDispatch } from 'react-redux'
import { addProduct, deleteProduct, deleteInvoice } from '@/redux/slices/jobsSlice'
import { NewInvoiceDialog } from './invoices/NewInvoiceDialog'
import { InvoiceTemplate } from './invoices/InvoiceTemplate'
import html2canvas from 'html2canvas'
import { Invoice,CreateEstimatePayload } from '@/types/invoice'
import { LoadingSpinner } from './common/LoadingSpinner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
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

interface JobDetailsPageProps {
  jobId: string
  onBack: () => void
  jobs: any[]
  setJobs: (jobs: any[]) => void
}

export function JobDetailsPage({ jobId, onBack, jobs, setJobs }: JobDetailsPageProps) {



  // Find the job from your jobs array or use sample data
  const job = jobs.find(j => j.id === jobId) || sampleJobData.job

  // Use real job data for materials, timeLogs, and invoices
  // const materials = job.assignedMaterialsDetails || sampleJobData.materials
  // console.log(materials,"testmateris")
  const [materials, setMaterials] = useState<any[]>(job.assignedMaterialsDetails || sampleJobData.materials || []);

  const timeLogs = sampleJobData.timeLogs // Keep sample data for now as we don't have time logs API
  const invoices = sampleJobData.invoices // Keep sample data for now as we don't have invoices API

  // Calculate totals using real job data
 const totalMaterialCost = materials.reduce(
  (sum: number, material: any) =>
    sum +
    ((Number(material.stock_quantity ?? material.quantity ?? 0) || 0) *
     (Number(material.unit_cost ?? material.unitCost ?? material.price ?? 0) || 0)),
  0
);

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
  console.log(selectedInvoice, 'invoice')


  const [refreshMaterials, setRefreshMaterials] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
const [suppliers, setSuppliers] = useState<{
  id: number;
  company_name: string;
  users: {
    full_name: string;
  };
}[]>([]);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [estimates, setEstimates] = useState<Invoice[]>([]);
  const [refreshInvoices, setRefreshInvoices] = useState(false);
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
const [productToDelete, setProductToDelete] = useState<any | null>(null); 
const [showDeleteEstimateDialog, setShowDeleteEstimateDialog] = useState(false);
const [estimateToDelete, setEstimateToDelete] = useState<any | null>(null);
const [printInvoiceId, setPrintInvoiceId] = useState<number | null>(null);
const [showPrintMount, setShowPrintMount] = useState(false);

  const [projectSummary, setProjectSummary] = useState<{
    jobEstimate: number;
    materialsCost: number;
    laborCost: number;
    actualProjectCost: number;
  } | null>(null);
  const [editedJob, setEditedJob] = useState({
    title: job.title,
    type: job.type,
    location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
    description: job.description,
    contractor: job.contractor || job.customer,
    startDate: '01/15/2025',
    priority: 'High',
    assignedLabor: job.assignedLaborDetails || [],
    assignedLeadLabor: job.assignedLeadLaborDetails || [],
  });
  const handleSave = async () => {
    try {
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

        assigned_labor_ids: (editedJob.assignedLabor || []).length > 0
          ? JSON.stringify(editedJob.assignedLabor.map((labor: any) => labor.id))
          : undefined,

        assigned_lead_labor_ids: (editedJob.assignedLeadLabor || []).length > 0
          ? JSON.stringify(editedJob.assignedLeadLabor.map((labor: any) => labor.id))
          : undefined,

        assigned_material_ids: job.materials && job.materials.length > 0
          ? JSON.stringify(job.materials)
          : undefined,

        status: ['pending', 'in-progress', 'completed'].includes(job.status)
          ? job.status === 'pending'
            ? 'active'
            : job.status === 'in-progress'
              ? 'in_progress'
              : job.status
          : 'unknown',
      };

      console.log('Updating job with payload:', updatePayload);

      const response = await apiClient.updateJob(jobId, updatePayload);
      console.log('Job updated successfully:', response);

      const updatedJobs = jobs.map((j: any) =>
        j.id === jobId ? { ...j, ...editedJob } : j
      );
      setJobs(updatedJobs);

      setIsEditing(false);
      toast.success('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update job');
    }
  };


  console.log(invoice, "invs")
  const currentInvoice = selectedInvoiceId == null
  ? undefined
  : estimates.find(inv => Number(inv.id) === selectedInvoiceId);

  console.log(currentInvoice, "current")


  const handleCancel = () => {
    setEditedJob({
      title: job.title,
      type: job.type,
      location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
      description: job.description,
      contractor: job.contractor || job.customer,
      startDate: '01/15/2025',
      priority: 'High',
      assignedLabor: job.assignedLaborDetails || [],
      assignedLeadLabor: job.assignedLeadLaborDetails || [],
    });
    setIsEditing(false);
  };



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

const isValidForm = () => {
  if (!materialFormData.name.trim()) {
    toast.error("Product name is required");
    return false;
  }

  if (!materialFormData.sku.trim()) {
    toast.error("SKU is required");
    return false;
  }

  if (!materialFormData.quantity || materialFormData.quantity <= 0) {
    toast.error("Quantity must be greater than 0");
    return false;
  }

  if (!materialFormData.unitCost || materialFormData.unitCost <= 0) {
    toast.error("Unit cost must be greater than 0");
    return false;
  }

  if (!materialFormData.unit) {
    toast.error("Unit is required");
    return false;
  }

  if (!materialFormData.supplier) {
    toast.error("Supplier is required");
    return false;
  }

  return true;
};


const handleAddProduct = async () => {
  if (!isValidForm()) return;

  setIsLoading(true);
  try {
    const newProduct = await apiClient.createProduct({
      product_name: materialFormData.name,
      supplier_id: Number(materialFormData.supplier) || 0,
      supplier_sku: materialFormData.sku,
      jdp_sku: '',
      stock_quantity: materialFormData.quantity,
      unit: materialFormData.unit,
      job_id: job.id || 2,
      is_custom: true,
      unit_cost: materialFormData.unitCost,
    });

    triggerRefreshMaterials();

    dispatch(addProduct(newProduct));
    toast.success('Product added successfully!');
    setShowAddMaterialModal(false); 
  } catch (error) {
    console.error('Error adding product:', error);
    toast.error('Failed to add product');
  } finally {
    setIsLoading(false);
  }
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

  const handleDeleteProduct = (product: any) => {
  setProductToDelete(product);
  setShowDeleteProductDialog(true);
};

const confirmDeleteProduct = async () => {
  if (!productToDelete) return;
  setIsDeleting(true);
  try {
    await apiClient.deleteProduct(productToDelete.id);
    dispatch(deleteProduct(String(productToDelete.id)));
    triggerRefreshMaterials();
    toast.success("Product deleted successfully!");
  } catch (error) {
    console.error("Error deleting product:", error);
    toast.error("Failed to delete product");
  } finally {
    setIsDeleting(false);
    setShowDeleteProductDialog(false);
    setProductToDelete(null);
  }
};


  const fetchEstimates = async () => {
    setIsLoadingEstimates(true);
    try {
      const response = await apiClient.getAllEstimates();
      const filtered = response.data.estimates.filter(
        (item: any) => Number(item.job_id) === Number(jobId)
      );
      setEstimates(filtered);
    } catch (error) {
      console.error('Failed to fetch estimates:', error);
    } finally {
      setIsLoadingEstimates(false);
    }
  };


  useEffect(() => {
    fetchEstimates();
  }, [jobId, refreshInvoices]);

useEffect(() => {
  if (showAddMaterialModal) {
    setMaterialFormData({
      name: '',
      quantity: 0,
      unitCost: 0,
      sku: '',
      unit: 'Pieces',
      supplier: ''
    });
  }
}, [showAddMaterialModal]);



  const handlePrint = async (currentInvoice: any) => {
    console.log('1')
    if (!printRef.current) return;
    console.log('2')

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          return element.classList.contains('no-export');
        }
      });

      const imageData = canvas.toDataURL('image/png');

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      console.log(currentInvoice, "number")

      printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${currentInvoice?.invoice_number || ''}</title>
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
      console.error('Print error:', err);
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
        0
      ) || 0;

    const laborTotal =
      newInvoice.labor?.reduce(
        (sum, labor) => sum + (labor.hours ?? 0) * (labor.hourlyRate ?? 0),
        0
      ) || 0;

    const additionalTotal =
      newInvoice.additionalCosts?.reduce(
        (sum, cost) => sum + (cost.amount ?? 0),
        0
      ) || 0;

    const subtotal = itemsTotal + laborTotal + additionalTotal;
    const taxAmount = subtotal * (newInvoice.taxRate ?? 0);
    const totalAmount = subtotal + taxAmount;

    const isPriority = (value: any): value is "high" | "medium" | "low" =>
      ["high", "medium", "low"].includes(value);

    const payload: CreateEstimatePayload = {
      estimate_title: "New Estimate",
      customer_id: Number(newInvoice.customerId),
      priority: isPriority(newInvoice.priority) ? newInvoice.priority : "medium",
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

      additional_cost: newInvoice.additionalCosts?.length
        ? {
            description: newInvoice.additionalCosts[0].description || "",
            amount: newInvoice.additionalCosts.reduce(
              (sum, c) => sum + c.amount,
              0
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
    setRefreshInvoices(prev => !prev);
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
    setRefreshInvoices(prev => !prev); 
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
      toast.error('Please fix the validation errors');
      return;
    }

    try {
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
      const updatedJobs = jobs.map((j: any) => j.id === jobId ? updatedJobData : j);
      setJobs(updatedJobs);

      console.log('Job data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing job data:', error);
      toast.error('Failed to refresh job data');
    }
  };


  const fetchMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const response = await apiClient.getJobById(jobId);
      const materialsFromAPI = response.assignedMaterialsDetails || [];
      setMaterials(materialsFromAPI);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [job.id, refreshMaterials]);


  const triggerRefreshMaterials = () => {
    setRefreshMaterials(prev => !prev);
  };

  const [jobFormData, setJobFormData] = useState({
    title: job.title,
    type: job.type,
    location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
    description: job.description
  });

  // Update editedJob when job data changes
  useEffect(() => {
    setEditedJob({
      title: job.title,
      type: job.type,
      location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
      description: job.description,
      contractor: job.contractor || job.customer,
      startDate: '01/15/2025',
      priority: job.priority || 'High',
      assignedLabor: job.assignedLaborDetails || [],
      assignedLeadLabor: job.assignedLeadLaborDetails || [],
    });
  }, [job]);






console.log(suppliers,"supp")
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await apiClient.getAllSuppliers();
        // response structure: { success, message, data: { data: [ ...suppliers ] } }
        
        setSuppliers(response.data.data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
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
        console.error('Failed to fetch project summary', error);
      }
    };

    if (jobId) fetchProjectSummary();
  }, [jobId]);



  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoadingDashboard(true);
        const res = await apiClient.getJobDashboard(jobId);
        console.log(res, 'dashres')
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

  console.log("Parent selectedInvoiceId:", selectedInvoiceId);


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
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              setEditedJob({
                ...job,
                assignedLeadLabor: job.assignedLeadLaborDetails || [],
                assignedLabor: job.assignedLaborDetails || [],
              });
              setIsEditing(true);
            }}
            >
              {/* <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsEditing(true)}> */}

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Hours Worked */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Hours Worked</p>
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
                    {isLoadingDashboard ? "Loading" : dashboardMetrics?.totalHoursWorked?.unit ?? "hours"}
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
                  <p className="text-sm font-medium text-green-600">Total Material Used</p>
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
                    {isLoadingDashboard ?  "Loading" : dashboardMetrics?.totalMaterialUsed?.unit ?? "items"}
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
                  <p className="text-sm font-medium text-purple-600">Total Labour Entries</p>
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
                    {isLoadingDashboard ? "Loading" : dashboardMetrics?.totalLabourEntries?.unit ?? "entries"}
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
                  <p className="text-sm font-medium text-orange-600">Number of Invoices</p>
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
                    {isLoadingDashboard ? "Loading" : dashboardMetrics?.numberOfInvoices?.unit ?? "invoices"}
                  </p>
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
                      maxLength={30}
                      onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm bg-gray-100 p-3 rounded-md">{editedJob.description}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#00A1FF]" />
                    Assigned Lead Labor
                  </Label>

                  {isEditing ? (
                    <AutoScrollMultiSelect
                      selectedValues={editedJob.assignedLeadLabor?.map((labor: any) => labor.id.toString()) || []}
                      onSelectionChange={(selectedIds, selectedItems) => {
                        const validSelectedItems = selectedItems.filter((labor: any) => labor !== undefined);

                        setEditedJob((prev) => ({
                          ...prev,
                          assignedLeadLabor: validSelectedItems,
                        }));

                        console.log('Selected Lead Labor IDs:', selectedIds);
                        console.log('Selected Lead Labor Items:', validSelectedItems);
                      }}
                      placeholder="Select lead labor"
                      fetchData={apiClient.getLeadLabor}
                      displayField="name"
                      valueField="id"
                    />


                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(editedJob.assignedLeadLabor || []).map((labor: any, index: number) => (
                        <span
                          key={labor.id || `labor-${index}`}
                          className="bg-blue-50 text-blue-700 text-sm px-2 py-1 rounded-md border border-blue-200"
                        >
                          {labor.name || labor.user?.full_name || labor.labor_code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>


                <div>
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#00A1FF]" />
                    Lead Labor
                  </Label>

                  {isEditing ? (
                    <AutoScrollMultiSelect
                      selectedValues={editedJob.assignedLabor?.map((labor: any) => labor.id.toString()) || []}
                      onSelectionChange={(selectedIds, selectedItems) => {
                        const validSelectedItems = selectedItems.filter((labor: any) => labor !== undefined);

                        setEditedJob((prev) => ({
                          ...prev,
                          assignedLabor: validSelectedItems,
                        }));

                        console.log('Selected Lead Labor IDs:', selectedIds);
                        console.log('Selected Lead Labor Items:', validSelectedItems);
                      }}
                      placeholder="Select lead labor"
                      fetchData={apiClient.getLabor}
                      displayField="name"
                      valueField="id"
                    />

                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(editedJob.assignedLabor || []).map((labor: any, index: number) => (
                        <span
                          key={labor.id || `labor-${index}`}
                          className="bg-orange-50 text-orange-700 text-sm px-2 py-1 rounded-md border border-orange-200"
                        >
                          {labor.user?.full_name || labor.labor_code}
                        </span>
                      ))}
                    </div>
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
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowNewInvoiceDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Invoice
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingEstimates ? (
                  <p className="text-sm text-gray-500"> <LoadingSpinner /></p>
                ) : estimates.length === 0 ? (
                  <p className="text-sm text-gray-500">No invoices found for this job.</p>
                ) : (
                  <div className="space-y-4">
                    {estimates.map((invoice: any, index: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-gray-700" />
                          </div>
                                              <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{invoice.estimate_title}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.invoice_type === 'estimate'
                              ? 'bg-blue-100 text-blue-800'
                              : invoice.invoice_type === 'proposal_invoice'
                              ? 'bg-purple-100 text-purple-800'
                              : invoice.invoice_type === 'progressive_invoice'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {invoice.invoice_type.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">{invoice.description}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        #{invoice.invoice_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {invoice.issue_date} • Due: {invoice.due_date}
                      </p>
                    </div>

                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 font-semibold">
                          <span>{formatCurrency(invoice.total_amount)}</span>
                          <span>{getStatusBadge(invoice.status)}</span>
                        </div>
                          <div className="flex items-center gap-2">
                            {/* <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceModal(true);
                            }}>
                              <Eye className="h-3 w-3" />
                              View
                            </Button> */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                console.log("Selected invoice ID:", invoice.id);
                                setSelectedInvoiceId(Number(invoice.id));
                                setShowInvoiceModal(true);
                              }}

                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handlePrint(currentInvoice)}>
                              <Printer className="h-3 w-3" />
                              Print
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDeleteEstimate(invoice)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>



            {/* Material Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Usage
                </CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Total Cost: <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
                  </span>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddMaterialModal(true)}>
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMaterials ? (
                  <p className="text-sm text-gray-500"> <LoadingSpinner /></p>
                ) : materials.length === 0 ? (
                  <p className="text-sm text-gray-500">No materials found.</p>
                ) : (
                  <div className="space-y-4">
                    {materials.map((material: any, index: number) => (
                      <div key={material.id ?? material.sku ?? index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                            <h4 className="font-medium">{material.product_name || material.name}</h4>
                            <p className="text-xs text-gray-600">
                              {material.supplier?.company_name || material.supplier} • SKU: {material.supplier_sku || material.jdp_sku} • {material.unit}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">
                          {formatCurrency(
                            (Number(material.stock_quantity ?? material.quantity ?? 0) || 0) *
                            (Number(material.unit_cost ?? material.unitCost ?? material.price ?? 0) || 0)
                          )}
                        </p>

                            <p className="text-sm text-gray-600">{material.stock_quantity || material.quantity || 0} {material.unit}</p>
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
                {projectSummary ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Job Estimate</span>
                      <span className="font-medium">{formatCurrency(projectSummary.jobEstimate)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Products Cost</span>
                      <span className="font-medium">{formatCurrency(projectSummary.materialsCost)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Labor Cost</span>
                      <span className="font-medium">{formatCurrency(projectSummary.laborCost)}</span>
                    </div>

                    <hr />

                    <div className="flex justify-between">
                      <span className="font-medium">Actual Project Cost</span>
                      <span className="font-bold text-lg">{formatCurrency(projectSummary.actualProjectCost)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500"> <LoadingSpinner /></p>
                )}
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
                <Button variant="outline" className="w-full gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


      {/* Add Invoice Modal */}
      <NewInvoiceDialog
        open={showNewInvoiceDialog}
        onOpenChange={setShowNewInvoiceDialog}
        onSave={handleSaveInvoice}
        jobId={Number(jobId)}
        jobs={jobs}
        onInvoiceSaved={triggerRefresh}
      />
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
      <Dialog open={showAddMaterialModal} onOpenChange={setShowAddMaterialModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a new product to this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className="mb-2">Product Name</Label>
                <Input
                  value={materialFormData.name}
                  maxLength={15}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2">SKU</Label>
                <Input
                  value={materialFormData.sku}
                   maxLength={15}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, sku: e.target.value })}
                />
              </div>

            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Quantity</Label>
                <Input
                  type="number"
                  maxLength={10}
                   value={materialFormData.quantity === 0 ? "" : materialFormData.quantity}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, quantity: Number(e.target.value) })}
                />
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
              </div>


            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Unit Cost</Label>
                <Input
                  type="number"
                  maxLength={10}
                  value={materialFormData.unitCost === 0 ? "" : materialFormData.unitCost}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, unitCost: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-2">Supplier</Label>
                <Select
                  value={materialFormData.supplier}
                  onValueChange={(value) =>
                    setMaterialFormData({ ...materialFormData, supplier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier?.users?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* <div>
                <Label className="mb-2">Supplier</Label>
                <Input
                  value={materialFormData.supplier}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, supplier: e.target.value })}
                />
              </div> */}
            </div>
            <div className='bg-blue-100 p-3 border border-blue-300 rounded flex items-center gap-2'>
              <Building className='w-4 h-4' />
              <Label>Total Cost: ${(materialFormData.quantity * materialFormData.unitCost).toFixed(2)}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMaterialModal(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAddProduct}
              disabled={isLoading}
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
                'Add Product'
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
                maxLength={20}
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
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Invoice Preview
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Preview of selected invoice
            </DialogDescription>
          </DialogHeader>

          {selectedInvoiceId && (
            <div className="mt-4 max-h-[70vh] overflow-auto">
              <InvoiceTemplate invoiceId={selectedInvoiceId} />
            </div>
          )}

          <div className="flex justify-end mt-6 gap-4">
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
              Close
            </Button>
            <Button variant="outline" className="gap-2 bg-primary text-primary-foreground" onClick={() => handlePrint(currentInvoice)}>
              <Printer className="h-4 w-4" />
              Print Estimate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    {selectedInvoiceId && (
  <div
    ref={printRef}
    aria-hidden="true"
    style={{
      position: 'absolute',
      left: '-10000px',
      top: 0,
      width: '22cm',
      background: '#ffffff',
      padding: '24px',
      pointerEvents: 'none',
    }}
  >
    <InvoiceTemplate invoiceId={selectedInvoiceId} />
  </div>
)}



      <AlertDialog open={showDeleteProductDialog} onOpenChange={setShowDeleteProductDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the product.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>No</AlertDialogCancel>
      <AlertDialogAction
        onClick={confirmDeleteProduct}
        disabled={isDeleting}
        className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Yes, delete'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>


<AlertDialog open={showDeleteEstimateDialog} onOpenChange={setShowDeleteEstimateDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure you want to delete this estimate?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the estimate &quot;{estimateToDelete?.name || estimateToDelete?.id}&quot; from your records.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>No</AlertDialogCancel>
      <AlertDialogAction
        onClick={confirmDeleteEstimate}
        disabled={isDeleting}
        className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Yes, delete'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>


    </div>
  )
}

export default JobDetailsPage

