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
  UserCheck,
  PlusCircle,
  Receipt,
  Search
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
import jsPDF from 'jspdf'
import { Invoice, CreateEstimatePayload } from '@/types/invoice'
import { LoadingSpinner } from './common/LoadingSpinner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { motion } from 'framer-motion'
import { Logo } from './common/Logo'
import Image from 'next/image'

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
  
  console.log('Job data:', job)
  console.log('Labor timesheets:', job.labor_timesheets)
  console.log('Bluesheets data:', job.bluesheets)

  // Use real job data for materials, timeLogs, and invoices
  // const materials = job.assignedMaterialsDetails || sampleJobData.materials
  // console.log(materials,"testmateris")
  const [materials, setMaterials] = useState<any[]>(job.assignedMaterialsDetails || sampleJobData.materials || []);
  const [bluesheets, setBluesheets] = useState<any[]>(job.bluesheets || []);

  const timeLogs = Array.isArray(job.labor_timesheets) ? job.labor_timesheets : (Array.isArray(sampleJobData.timeLogs) ? sampleJobData.timeLogs : []) // Ensure timeLogs is always an array
  const invoices = sampleJobData.invoices // Keep sample data for now as we don't have invoices API
console.log(materials,"testmaterials")
  // Calculate totals using real job data
  const totalMaterialCost = materials.reduce(
    (sum: number, material: any) =>
      sum +
      ((Number(material.stock_quantity ?? material.quantity ?? 0) || 0) *
        (Number(material.unit_cost ?? material.unitCost ?? material.price ?? 0) || 0)),
    0
  );

  const totalLaborCost =
    [...(job.assignedLaborDetails || []), ...(job.customLabor || [])].reduce(
      (sum: number, labor: any) => {
        const rate = Number(labor.hourly_rate ?? 0);
        const hours = Number(labor.hours_worked ?? 0);
        return sum + rate * hours;
      },
      0
    );



  job.estimatedCost || 0
  const totalHours = timeLogs.reduce((sum: number, log: any) => sum + log.hoursWorked, 0)
  const totalMaterialItems = materials.reduce((sum: number, material: any) => sum + (material.stock_quantity || material.quantity || 0), 0)
  const totalLaborEntries = job.assignedLaborDetails ? job.assignedLaborDetails.length : timeLogs.length;
  const totalInvoices = invoices.length;
  const [showEditJobModal, setShowEditJobModal] = useState(false);


  const [refreshMaterials, setRefreshMaterials] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<{
    id: number;
    company_name: string;
    users: {
      full_name: string;
    };
  }[]>([]);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
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
  const [totalEstimates, setTotalEstimates] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [projectSummary, setProjectSummary] = useState<{
    jobEstimate: number;
    materialsCost: number;
    laborCost: number;
    actualProjectCost: number;
  } | null>(null);

  // Function to parse labor IDs and fetch labor data
  const parseLaborIds = async (laborIdsString: string, isLeadLabor: boolean = false) => {
    if (!laborIdsString) return [];

    try {
      const laborIds = JSON.parse(laborIdsString);
      if (!Array.isArray(laborIds)) return [];

      const laborData = [];
      for (const id of laborIds) {
        try {
          if (isLeadLabor) {
            // For lead labor, we'll fetch all and filter by ID since getLeadLaborById doesn't exist
            const response = await apiClient.getLeadLabor(1, 100); // Get a large number to find the specific ID
            const leadLabor = response.data.find((item: any) => item.id.toString() === id.toString());
            if (leadLabor) {
              laborData.push({
                id: leadLabor.id,
                name: leadLabor.name || leadLabor.users?.full_name,
                user: { full_name: leadLabor.name || leadLabor.users?.full_name }
              });
            }
          } else {
            console.log('Fetching labor by ID:', id);
            const response = await apiClient.getLaborById(id.toString());
            console.log('Labor API response:', response);
            if (response) {
              laborData.push({
                id: response.id,
                name: response.users?.full_name || response.name || response.labor_code,
                user: response.users,
                labor_code: response.labor_code
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching ${isLeadLabor ? 'lead labor' : 'labor'} with ID ${id}:`, error);
        }
      }
      console.log('Final labor data:', laborData);
      return laborData;
    } catch (error) {
      console.error('Error parsing labor IDs:', error);
      return [];
    }
  };

  const [editedJob, setEditedJob] = useState({
    title: job.title,
    type: job.type,
    location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
    description: job.description,
    contractor: job.contractor || job.customer,
    startDate: '01/15/2025',
    priority: 'High',
    status: 'draft',
    assignedLabor: job.assignedLaborDetails || [],
    assignedLeadLabor: job.assignedLeadLaborDetails || [],
  });

  // Load labor data when component mounts
  useEffect(() => {
    const loadLaborData = async () => {
      try {
        // Parse and load lead labor data
        if (job.assigned_lead_labor_ids) {
          const leadLaborData = await parseLaborIds(job.assigned_lead_labor_ids, true);
          setEditedJob(prev => ({
            ...prev,
            assignedLeadLabor: leadLaborData
          }));
        }

        // Parse and load regular labor data
        if (job.assigned_labor_ids) {
          console.log('Loading regular labor data:', job.assigned_labor_ids);
          const laborData = await parseLaborIds(job.assigned_labor_ids, false);
          console.log('Parsed labor data:', laborData);
          setEditedJob(prev => ({
            ...prev,
            assignedLabor: laborData
          }));
        }
      } catch (error) {
        console.error('Error loading labor data:', error);
      }
    };

    loadLaborData();
  }, [job.assigned_lead_labor_ids, job.assigned_labor_ids]);

  // Form states
  const [showAddInvoiceDialog, setShowAddInvoiceDialog] = useState(false)
  const [showInlineInvoiceForm, setShowInlineInvoiceForm] = useState(false)
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false)
  const [showAddLaborDialog, setShowAddLaborDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showInvoiceViewDialog, setShowInvoiceViewDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [suppliersList, setSuppliersList] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1)
  const [invoiceValidationErrors, setInvoiceValidationErrors] = useState<Record<string, string>>({})
  const [customInvoiceTypes, setCustomInvoiceTypes] = useState<string[]>([])
  const [customerData, setCustomerData] = useState<any>(null)
  const [contractorData, setContractorData] = useState<any>(null)
  const [InvoioiceNumber, setInvoioiceNumber] = useState('')
  // Clean duplicate custom types (case-insensitive)
  const cleanCustomTypes = (types: string[]) => {
    const seen = new Set<string>()
    return types.filter(type => {
      const lower = type.toLowerCase()
      if (seen.has(lower)) {
        return false
      }
      seen.add(lower)
      return true
    })
  }

  // Debug: Log job data to see structure
  console.log('Job data:', job)

  // Inline Invoice Data State
  const [inlineInvoiceData, setInlineInvoiceData] = useState({
    date: new Date().toISOString().split('T')[0],
    estimateNumber: '',
    customerName: job.customerName || '',
    customerAddress: '', // Initialize as empty, will be set by fetchCustomerData
    billToAddress: job.billToAddress || '',
    billToAddressEnabled: true,
    poNumber: '',
    project: job.title || '',
    rep: '',
    dueDate: '',
    paymentCredits: 0,
    balanceDue: '',
    lineItems: [{
      id: Math.random().toString(36).substring(2, 9),
      productId: null,
      qty: 1,
      item: '',
      description: '',
      rate: 0,
      estimatedPrice: 0,
      total: 0,
      searchQuery: '',
      showSearchResults: false,
      supplierId: 1,
      isCustomProduct: false,
      estimate_product_id: null
    }],
    notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
    signatureText: 'ACCEPTED BY________________DATE_____',
    invoiceType: 'Estimate',
    customInvoiceType: '',
    paymentPercentage: 0,
    estimateTotal: 0,
    paymentHistory: [] as any[]
  })

  const allowedStatuses = ['draft', 'active', 'in_progress', 'completed', 'cancelled', 'on_hold'];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const status = allowedStatuses.includes(editedJob.status)
        ? editedJob.status
        : 'draft';
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

      // Update the job data with the new labor assignments
      const updatedJob = {
        ...job,
        ...editedJob,
        assigned_labor_ids: updatePayload.assigned_labor_ids,
        assigned_lead_labor_ids: updatePayload.assigned_lead_labor_ids
      };

      const updatedJobs = jobs.map((j: any) =>
        j.id === jobId ? updatedJob : j
      );
      setJobs(updatedJobs);

      // Refresh the labor data immediately after save
      try {
        if (updatePayload.assigned_lead_labor_ids) {
          const leadLaborData = await parseLaborIds(updatePayload.assigned_lead_labor_ids, true);
          setEditedJob(prev => ({
            ...prev,
            assignedLeadLabor: leadLaborData
          }));
        }

        if (updatePayload.assigned_labor_ids) {
          const laborData = await parseLaborIds(updatePayload.assigned_labor_ids, false);
          setEditedJob(prev => ({
            ...prev,
            assignedLabor: laborData
          }));
        }
      } catch (error) {
        console.error('Error refreshing labor data after save:', error);
      }

      setIsEditing(false);
      toast.success('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update job');
    } finally {
      setIsSaving(false);
    }
  };


  const currentInvoice = selectedInvoiceId == null
    ? undefined
    : estimates.find(inv => Number(inv.id) === selectedInvoiceId);




  const handleCancel = async () => {
    // Reset base fields
    setEditedJob({
      title: job.title,
      type: job.type,
      location: job.location || `${job.address || ''}, ${job.cityZip || ''}`,
      description: job.description,
      contractor: job.contractor || job.customer,
      startDate: '01/15/2025',
      priority: 'High',
      status: 'draft',
      assignedLabor: job.assignedLaborDetails || [],
      assignedLeadLabor: job.assignedLeadLaborDetails || [],
    });

    // If detailed arrays are missing, hydrate from stored ID strings
    try {
      if ((!job.assignedLeadLaborDetails || job.assignedLeadLaborDetails.length === 0) && job.assigned_lead_labor_ids) {
        const leadLaborData = await parseLaborIds(job.assigned_lead_labor_ids, true);
        setEditedJob(prev => ({ ...prev, assignedLeadLabor: leadLaborData }));
      }
      if ((!job.assignedLaborDetails || job.assignedLaborDetails.length === 0) && job.assigned_labor_ids) {
        const laborData = await parseLaborIds(job.assigned_labor_ids, false);
        setEditedJob(prev => ({ ...prev, assignedLabor: laborData }));
      }
    } catch (e) {
      // swallow errors here, view will just show what we have
      console.error('Failed to hydrate labor data on cancel', e);
    }

    setIsEditing(false);
  };



  const validateTimeLogForm = () => {
    const errors: Record<string, string> = {};

    if (!timeLogFormData.selectedLabor && !timeLogFormData.selectedLeadLabor) {
      errors.laborSelection = 'Please select either Labor or Lead Labor';
    }

    if (!timeLogFormData.hoursWorked || timeLogFormData.hoursWorked === '') {
      errors.hoursWorked = 'Hours worked is required';
    }

    if (!timeLogFormData.date) {
      errors.date = 'Please select a date';
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
      const selectedLabor = timeLogFormData.selectedLabor || timeLogFormData.selectedLeadLabor;
      const isLeadLabor = !!timeLogFormData.selectedLeadLabor;

      // Find the bluesheet ID based on the selected date
      const selectedBluesheet = bluesheets.find((bluesheet: any) => 
        bluesheet.date === timeLogFormData.date
      );

      if (selectedBluesheet) {
        // Add labor to existing bluesheet
        if (timeLogModalMode === 'create') {
          const timeLogPayload = {
            [isLeadLabor ? 'lead_labor_id' : 'labor_id']: selectedLabor?.id,
            employee_name: selectedLabor?.users?.full_name || selectedLabor?.labor_code || '',
            role: isLeadLabor ? 'lead_labor' : 'labor',
            regular_hours: timeLogFormData.hoursWorked,
            hourly_rate: selectedLabor?.hourly_rate || 0,
            date: timeLogFormData.date,
            description: timeLogFormData.description || ''
          };

          // Call the bluesheet API
          await apiClient.addLaborToBluesheet(selectedBluesheet.id, timeLogPayload);
          toast.success('Labor time log added to existing bluesheet successfully!');
        } else if (timeLogModalMode === 'edit') {
          // For edit, we might need a different API endpoint
          const updatePayload = {
            [isLeadLabor ? 'lead_labor_id' : 'labor_id']: selectedLabor?.id,
            employee_name: selectedLabor?.users?.full_name || selectedLabor?.labor_code || '',
            role: isLeadLabor ? 'lead_labor' : 'labor',
            regular_hours: timeLogFormData.hoursWorked,
            hourly_rate: selectedLabor?.hourly_rate || 0,
            date: timeLogFormData.date,
            description: timeLogFormData.description || ''
          };

          // You might need to implement updateLaborInBluesheet API method
          await apiClient.updateLaborInBluesheet(currentTimeLog.id, updatePayload);
          toast.success('Labor time log updated successfully!');
        }
      } else {
        // Create new complete bluesheet with labor
        const completeBluesheetPayload = {
          job_id: job.id,
          date: timeLogFormData.date,
          notes: `Daily work bluesheet for ${job.title || 'construction site'}`,
          additional_charges: 0,
          labor_entries: [
            {
              [isLeadLabor ? 'lead_labor_id' : 'labor_id']: selectedLabor?.id,
              employee_name: selectedLabor?.users?.full_name || selectedLabor?.labor_code || '',
              role: isLeadLabor ? 'lead_labor' : 'labor',
              regular_hours: timeLogFormData.hoursWorked,
              overtime_hours: '0h',
              hourly_rate: selectedLabor?.hourly_rate || 0
            }
          ],
          material_entries: [] // Empty material entries for now
        };

        await apiClient.createCompleteBluesheet(completeBluesheetPayload);
        toast.success('New bluesheet created with labor successfully!');
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

  // Helper function to parse hours from different formats
  const parseHoursFromString = (hoursString: string): number => {
    if (!hoursString) return 0;
    
    // Handle "8h" format
    if (hoursString.includes('h')) {
      return parseFloat(hoursString.replace('h', ''));
    }
    
    // Handle "00:01:48" format (HH:MM:SS)
    if (hoursString.includes(':')) {
      const parts = hoursString.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        
        // Convert to decimal hours
        return hours + (minutes / 60) + (seconds / 3600);
      }
    }
    
    // Handle plain number
    return parseFloat(hoursString) || 0;
  };

  const handleViewTimeLog = async (labor: any) => {
    console.log('View button clicked, labor:', labor);
    try {
      // Fetch the full labor entry details from the API
      const response = await apiClient.getLaborEntryById(labor.id);
      console.log('API Response for labor entry (view):', response);
      
      const laborEntry = response.data;
      
      // Set the current time log data
      setCurrentTimeLog(laborEntry);

      // Determine if it's labor or lead labor based on the API response
      const isLeadLabor = laborEntry.lead_labor_id !== null;
      const laborData = isLeadLabor ? laborEntry.lead_labor : laborEntry.labor;

      // Parse hours from different formats ("8h" or "00:01:48")
      const hoursWorked = parseHoursFromString(laborEntry.regular_hours || '0');

      setTimeLogFormData({
        selectedLabor: isLeadLabor ? null : laborData,
        selectedLeadLabor: isLeadLabor ? laborData : null,
        hoursWorked: hoursWorked.toString(),
        description: laborEntry.description || '',
        date: laborEntry.date || new Date().toISOString().split('T')[0]
      });

      // Set input values based on the fetched data
      if (isLeadLabor) {
        setLeadLaborInputValue(laborData?.users?.full_name || laborData?.labor_code || '');
        setLaborInputValue('');
      } else {
        setLaborInputValue(laborData?.users?.full_name || laborData?.labor_code || '');
        setLeadLaborInputValue('');
      }

      setTimeLogModalMode('view');
      setShowTimeLogModal(true);
      console.log('View modal should be open now with fetched data');
    } catch (error) {
      console.error('Error viewing labor time log:', error);
      toast.error('Failed to load labor entry details');
    }
  };

  const handleEditTimeLog = async (labor: any) => {
    try {
      console.log('Edit button clicked, labor entry:', labor);
      
      // Fetch the full labor entry details from the API
      const response = await apiClient.getLaborEntryById(labor.id);
      console.log('API Response for labor entry:', response);
      
      const laborEntry = response.data;
      
      // Set the current time log data
      setCurrentTimeLog(laborEntry);

      // Determine if it's labor or lead labor based on the API response
      const isLeadLabor = laborEntry.lead_labor_id !== null;
      const laborData = isLeadLabor ? laborEntry.lead_labor : laborEntry.labor;

      // Parse hours from different formats ("8h" or "00:01:48")
      const hoursWorked = parseHoursFromString(laborEntry.regular_hours || '0');

      setTimeLogFormData({
        selectedLabor: isLeadLabor ? null : laborData,
        selectedLeadLabor: isLeadLabor ? laborData : null,
        hoursWorked: hoursWorked.toString(),
        description: laborEntry.description || '',
        date: laborEntry.date || new Date().toISOString().split('T')[0]
      });

      // Set input values based on the fetched data
      if (isLeadLabor) {
        setLeadLaborInputValue(laborData?.users?.full_name || laborData?.labor_code || '');
        setLaborInputValue('');
      } else {
        setLaborInputValue(laborData?.users?.full_name || laborData?.labor_code || '');
        setLeadLaborInputValue('');
      }

      setTimeLogModalMode('edit');
      setShowTimeLogModal(true);
      console.log('Edit modal should be open now with fetched data');
    } catch (error) {
      console.error('Error editing labor time log:', error);
      toast.error('Failed to load labor entry details');
    }
  };

  const handleCreateTimeLog = () => {
    setCurrentTimeLog(null);
    resetTimeLogForm();
    setTimeLogModalMode('create');
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


  // Product search function
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductSearchResults([]);
      return;
    }
    
    setIsSearchingProducts(true);
    try {
      const response = await apiClient.searchProductsByQuery(query);
      console.log('Search API response:', response); // Debug log
      
      // Filter out custom products (is_custom: true)
      const filteredProducts = (response.data?.products || []).filter((product: any) => 
        product.is_custom === false || product.is_custom === undefined
      );
      
      console.log('Filtered products:', filteredProducts); // Debug log
      setProductSearchResults(filteredProducts);
    } catch (error) {
      console.error('Error searching products:', error);
      setProductSearchResults([]);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: any) => {
    console.log('Selected product:', product); // Debug log
    setSelectedProduct(product);
    setMaterialFormData({
      ...materialFormData,
      product_id: product.id,
      material_name: product.product_name || product.name,
      quantity: product.stock_quantity || 0, // Use stock_quantity from product
      unit: product.unit || 'pieces', // Use unit from product
      unit_cost: product.unit_cost || product.price || 0 // Keep for calculation
    });
    setProductSearchQuery(product.product_name || product.name);
    setProductSearchResults([]);
  };

  const handleAddProduct = async () => {
    if (!materialFormData.product_id || !materialFormData.material_name) {
      toast.error('Please select a product');
      return;
    }

    setIsLoading(true);
    try {
      // Find existing bluesheet by date
      const existingBluesheet = job.bluesheets?.find((bluesheet: any) => 
        bluesheet.date === materialFormData.date
      );

      if (existingBluesheet) {
        // Add material to existing bluesheet
        const materialPayload = {
          product_id: materialFormData.product_id,
          material_name: materialFormData.material_name,
          quantity: selectedProduct?.stock_quantity || materialFormData.quantity, // Use stock_quantity from selected product
          unit: materialFormData.unit,
          total_ordered: materialFormData.total_ordered,
          material_used: materialFormData.material_used,
          supplier_order_id: materialFormData.supplier_order_id,
          return_to_warehouse: materialFormData.return_to_warehouse,
          unit_cost: materialFormData.unit_cost
        };

        await apiClient.createBluesheetMaterial(materialPayload, existingBluesheet.id);
        toast.success('Material added to existing bluesheet successfully!');
      } else {
        // Create new complete bluesheet with material
        const completeBluesheetPayload = {
          job_id: job.id,
          date: materialFormData.date,
          notes: `Daily work bluesheet for ${job.title || 'construction site'}`,
          additional_charges: 0,
          labor_entries: [], // Empty labor entries for now
          material_entries: [
            {
              product_id: materialFormData.product_id,
              material_name: materialFormData.material_name,
              quantity: selectedProduct?.stock_quantity || materialFormData.quantity, // Use stock_quantity from selected product
              unit: materialFormData.unit,
              total_ordered: materialFormData.total_ordered,
              material_used: materialFormData.material_used,
              supplier_order_id: materialFormData.supplier_order_id,
              return_to_warehouse: materialFormData.return_to_warehouse,
              unit_cost: materialFormData.unit_cost
            }
          ]
        };

        await apiClient.createCompleteBluesheet(completeBluesheetPayload);
        toast.success('New bluesheet created with material successfully!');
      }

      // Close modal first
      setShowAddMaterialModal(false);
      
      // Reset form
      setMaterialFormData({
        product_id: null,
        material_name: '',
        quantity: 0,
        unit: 'pieces',
        total_ordered: 0,
        material_used: 0,
        supplier_order_id: '',
        return_to_warehouse: false,
        unit_cost: 0,
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedProduct(null);
      setProductSearchQuery('');
      
      // Refresh job data to show updated materials
      await refreshJobData();
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Failed to add material');
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


  const fetchEstimates = async () => {
    setIsLoadingEstimates(true);
    try {
      const response = await apiClient.getEstimatesByJob(jobId, 1, 10);
      setEstimates(response.data.estimates || []);
      setTotalEstimates(response.data.total || 0);
      setInvoioiceNumber(response.data.estimates[0]?.invoice_number || '')
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
        product_id: null,
        material_name: '',
        quantity: 0,
        unit: 'pieces',
        total_ordered: 0,
        material_used: 0,
        supplier_order_id: '',
        return_to_warehouse: false,
        unit_cost: 0,
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedProduct(null);
      setProductSearchQuery('');
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
      const selectedLabor = timeLogFormData.selectedLabor || timeLogFormData.selectedLeadLabor;
      const isLeadLabor = !!timeLogFormData.selectedLeadLabor;

      const updatePayload = {
        job_id: jobId,
        labor_id: selectedLabor?.id?.toString() || '',
        full_name: selectedLabor?.users?.full_name || selectedLabor?.labor_code || '',
        email: selectedLabor?.users?.email || '',
        role: isLeadLabor ? 'lead_labor' : 'labor',
        hours_worked: parseFloat(timeLogFormData.hoursWorked) || 0,
        hourly_rate: selectedLabor?.hourly_rate || 0,
        notes: timeLogFormData.description,
        date_of_joining: timeLogFormData.date,
        is_custom: selectedLabor?.is_custom || false
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
      selectedLabor: null,
      selectedLeadLabor: null,
      hoursWorked: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setLaborInputValue('');
    setLeadLaborInputValue('');
    setLaborSearchResults([]);
    setLeadLaborSearchResults([]);
    setShowLaborDropdown(false);
    setShowLeadLaborDropdown(false);
    setTimeLogValidationErrors({});
  };

  const refreshJobData = async () => {
    try {
      const updatedJobData = await apiClient.getJobById(jobId);
      const updatedJobs = jobs.map((j: any) => j.id === jobId ? updatedJobData : j);
      setJobs(updatedJobs);
      
      // Update the current job from the updated jobs array
      const currentJob = updatedJobs.find((j: any) => j.id === jobId);
      if (currentJob) {
        // Update the job state if it exists in the component
        // Note: This assumes you have a way to update the current job state
      }
      
      // Trigger materials refresh to show updated data
      triggerRefreshMaterials();

    } catch (error) {
      console.error('Error refreshing job data:', error);
      toast.error('Failed to refresh job data');
    }
  };


  const fetchMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      // Extract material_entries from bluesheets only
      const bluesheetMaterials: any[] = [];
      if (job.bluesheets && job.bluesheets.length > 0) {
        job.bluesheets.forEach((bluesheet: any) => {
          if (bluesheet.material_entries && bluesheet.material_entries.length > 0) {
            bluesheet.material_entries.forEach((entry: any) => {
              bluesheetMaterials.push({
                id: entry.id,
                material_name: entry.material_name,
                product_name: entry.product?.product_name || entry.product?.name,
                quantity: entry.quantity,
                unit: entry.unit,
                unit_cost: entry.unit_cost,
                unitCost: entry.unit_cost,
                price: entry.unit_cost,
                supplier: entry.product?.supplier?.company_name || entry.product?.supplier,
                supplier_sku: entry.product?.supplier_sku,
                jdp_sku: entry.product?.jdp_sku,
                sku: entry.product?.sku,
                stock_quantity: entry.quantity,
                bluesheet_id: bluesheet.id,
                bluesheet_date: bluesheet.date,
                bluesheet_notes: bluesheet.notes,
                product: entry.product, // Include full product object
                jdp_price: entry.product?.jdp_price, // Add jdp_price at root level
                is_bluesheet_material: true
              });
            });
          }
        });
      }
      
      // Set only bluesheet materials
      setMaterials(bluesheetMaterials);
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
      status: job.status || 'draft',
      assignedLabor: job.assignedLaborDetails || [],
      assignedLeadLabor: job.assignedLeadLaborDetails || [],
    });
  }, [job]);

  // Update bluesheets when job data changes
  useEffect(() => {
    if (job.bluesheets) {
      setBluesheets(job.bluesheets);
      console.log('Updated bluesheets:', job.bluesheets);
    }
  }, [job.bluesheets]);

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
    product_id: null as number | null,
    material_name: '',
    quantity: 0,
    unit: 'pieces',
    total_ordered: 0,
    material_used: 0,
    supplier_order_id: '',
    return_to_warehouse: false,
    unit_cost: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Product search states
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [timeLogFormData, setTimeLogFormData] = useState({
    selectedLabor: null as any,
    selectedLeadLabor: null as any,
    hoursWorked: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Search functionality for labor and lead labor
  const [laborSearchResults, setLaborSearchResults] = useState<any[]>([]);
  const [leadLaborSearchResults, setLeadLaborSearchResults] = useState<any[]>([]);
  const [showLaborDropdown, setShowLaborDropdown] = useState(false);
  const [showLeadLaborDropdown, setShowLeadLaborDropdown] = useState(false);
  const [isLoadingLabor, setIsLoadingLabor] = useState(false);
  const [isLoadingLeadLabor, setIsLoadingLeadLabor] = useState(false);
  const [laborInputValue, setLaborInputValue] = useState('');
  const [leadLaborInputValue, setLeadLaborInputValue] = useState('');

  // Search functions
  const searchLabor = async (query: string) => {
    if (query.length < 2) return; // Don't search for very short queries
    
    setIsLoadingLabor(true);
    try {
      const response = await apiClient.searchLaborByQuery(query, 1, 20);
      setLaborSearchResults(response.data?.labor || []);
    } catch (error) {
      console.error('Error searching labor:', error);
      setLaborSearchResults([]);
    } finally {
      setIsLoadingLabor(false);
    }
  };

  const searchLeadLabor = async (query: string) => {
    if (query.length < 2) return; // Don't search for very short queries
    
    setIsLoadingLeadLabor(true);
    try {
      const response = await apiClient.searchLeadLaborByQuery(query, 1, 20);
      setLeadLaborSearchResults(response.data?.leadLabor || []);
    } catch (error) {
      console.error('Error searching lead labor:', error);
      setLeadLaborSearchResults([]);
    } finally {
      setIsLoadingLeadLabor(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.labor-dropdown') && !target.closest('.lead-labor-dropdown')) {
        setShowLaborDropdown(false);
        setShowLeadLaborDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Invoice Helper Functions
  const calculateInvoiceSubtotal = (): number => {
    return inlineInvoiceData.lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const updateInvoiceLineItem = (itemId: string, field: string, value: any) => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value }

          // Update total calculation based on the logic:
          // If both rate and estimatedPrice are provided, use estimatedPrice
          // If only rate is provided, use rate
          if (field === 'qty' || field === 'rate' || field === 'estimatedPrice') {
            const qty = updated.qty || 0
            const rate = updated.rate || 0
            const estimatedPrice = updated.estimatedPrice || 0

            // If estimatedPrice is provided and greater than 0, use it
            // Otherwise, use rate
            const priceToUse = estimatedPrice > 0 ? estimatedPrice : rate
            updated.total = qty * priceToUse
          }
          return updated
        }
        return item
      })
    }))
  }

  const addInvoiceLineItem = () => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: Math.random().toString(36).substring(2, 9),
        productId: null,
        qty: 1,
        item: '',
        description: '',
        rate: 0,
        estimatedPrice: 0,
        total: 0,
        searchQuery: '',
        showSearchResults: false,
        supplierId: selectedSupplierId || 1,
        isCustomProduct: false,
        estimate_product_id: null
      }]
    }))
  }

  const addCustomLineItem = () => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: Math.random().toString(36).substring(2, 9),
        productId: null,
        qty: 1,
        item: '',
        description: '',
        rate: 0,
        estimatedPrice: 0,
        total: 0,
        searchQuery: '',
        showSearchResults: false,
        supplierId: selectedSupplierId || 1,
        isCustomProduct: true,
        estimate_product_id: null
      }]
    }))
  }

  const addCustomInvoiceType = (customType: string) => {
    if (customType) {
      // Check for case-insensitive duplicates
      const isDuplicate = customInvoiceTypes.some(existing =>
        existing.toLowerCase() === customType.toLowerCase()
      )
      if (!isDuplicate) {
        setCustomInvoiceTypes(prev => [...prev, customType])
      }
    }
  }

  // Fetch customer data
  const fetchCustomerData = async (customerId: string) => {
    try {
      const response = await apiClient.getCustomers(1, 100) // Get all customers 
      const customers = response.data?.customers || response.data?.data || response.data || []
      const customer = customers.find((c: any) => c.id === Number(customerId))
      if (customer) {
        setCustomerData(customer)
        // Update customer address in inline invoice data
        const newAddress = customer.address || customer.customer_address || ''

        // Force update with setTimeout to ensure state update
        setTimeout(() => {
          setInlineInvoiceData(prev => {
            const updated = {
              ...prev,
              customerAddress: newAddress
            }
            return updated
          })
        }, 100)
      } else {
        setCustomerData(null)
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
      setCustomerData(null)
    }
  }

  const fetchContractorData = async (contractorId: string) => {
    try {
      const response = await apiClient.getContractors(1, 100) // Get all contractors
      const contractors = response.data?.contractors || response.data?.data || response.data || []
      const contractor = contractors.find((c: any) => c.id === Number(contractorId))
      if (contractor) {
        setContractorData(contractor)
        console.log(contractor, 'contractor')
        // Update contractor address in inline invoice data
        const newAddress = contractor.address || contractor.contractor_address || ''
        console.log(newAddress, 'newAddress')
        // Force update with setTimeout to ensure state update
        setTimeout(() => {
          setInlineInvoiceData(prev => {
            const updated = {
              ...prev,
              customerAddress: newAddress
            }
            return updated
          })
        }, 100)
      } else {
        setContractorData(null)
      }
    } catch (error) {
      console.error('Error fetching contractor data:', error)
      setContractorData(null)
    }
  }

  const removeInvoiceLineItem = async (itemId: string) => {
    try {
      // Find the item to get estimate_product_id
      const itemToDelete = inlineInvoiceData.lineItems.find(item => item.id === itemId);
      if (itemToDelete && itemToDelete.estimate_product_id) {
        // Call delete API
        console.log(itemToDelete.estimate_product_id, 'itemToDelete.estimate_product_id')
        await apiClient.deleteProductFromEstimate(itemToDelete.estimate_product_id);
        toast.success('Product removed from estimate successfully!');
      }
      
      // Remove from local state
      setInlineInvoiceData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter(item => item.id !== itemId)
      }));
    } catch (error) {
      console.error('Error removing product from estimate:', error);
      toast.error('Failed to remove product from estimate');
    }
  }

  const getFilteredProducts = (query: string) => {
    if (!query) return []
    return products.filter(product =>
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.jdpSKU?.toLowerCase().includes(query.toLowerCase())
    )
  }

  const selectProduct = (itemId: string, product: any) => {
    // Check if product already exists in line items (by product ID, not name)
    const isDuplicate = inlineInvoiceData.lineItems.some(item =>
      item.id !== itemId && item.productId === product.id
    )

    if (isDuplicate) {
      toast.error('This product is already added to the invoice')
      return
    }

    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            productId: product.id,
            item: product.name,
            description: product.description || '',
            rate: product.jdpPrice || 0,
            estimatedPrice: product.estimatedPrice || product.jdpPrice || 0,
            total: (item.qty || 1) * (product.estimatedPrice || product.jdpPrice || 0),
            showSearchResults: false,
            searchQuery: '',
            supplierId: product.supplierId || selectedSupplierId || 1
          }
        }
        return item
      })
    }))
  }

  const addCustomProduct = (itemId: string, productName: string) => {
    // Check if custom product already exists in line items (by name for custom products)
    const isDuplicate = inlineInvoiceData.lineItems.some(item =>
      item.id !== itemId && item.productId === null && item.item.toLowerCase() === productName.toLowerCase()
    )

    if (isDuplicate) {
      toast.error('This custom product is already added to the invoice')
      return
    }

    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            item: productName,
            showSearchResults: false,
            searchQuery: ''
          }
        }
        return item
      })
    }))
  }

  const getAvailableEstimates = () => {
    return estimates.filter((est: any) => est.invoice_type === 'Estimate')
  }

  const handleEstimateSelection = (estimateId: string) => {
    setSelectedEstimateId(estimateId)
    const estimate: any = estimates.find((e: any) => e.id === estimateId)
    if (estimate) {
      setInlineInvoiceData(prev => ({
        ...prev,
        estimateTotal: estimate.total_amount || 0,
        paymentHistory: estimate.paymentHistory || []
      }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getInvoiceTypeColor = (type: string) => {
    const colors: any = {
      'Estimate': 'border-blue-200 bg-blue-50 text-blue-700',
      'Downpayment Invoice': 'border-green-200 bg-green-50 text-green-700',
      'Rough Invoice': 'border-orange-200 bg-orange-50 text-orange-700',
      'Progressive Invoice': 'border-purple-200 bg-purple-50 text-purple-700',
      'Final Invoice': 'border-gray-200 bg-gray-50 text-gray-700'
    }
    return colors[type] || 'border-gray-200 bg-gray-50 text-gray-700'
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      'Draft': 'border-gray-300 bg-gray-100 text-gray-700',
      'Sent': 'border-blue-300 bg-blue-100 text-blue-700',
      'Paid': 'border-green-300 bg-green-100 text-green-700'
    }
    return colors[status] || 'border-gray-300 bg-gray-100 text-gray-700'
  }

  const handleViewInvoice = async (invoice: any) => {
    try {
      setIsLoading(true)
      const response = await apiClient.getEstimateById(invoice.id)
      const invoiceData = response?.data || response
      
      // Populate the inline invoice form with the fetched invoice data
      setInlineInvoiceData({
        date: invoiceData.estimate_date || new Date().toISOString().split('T')[0],
        estimateNumber: invoiceData.invoice_number || '',
        customerName: invoiceData.customer_name || invoiceData.contractor?.contractor_name || '',
        customerAddress: invoiceData.customer_address || invoiceData.contractor?.address || '',
        billToAddress: invoiceData.bill_to_address || '',
        billToAddressEnabled: !!invoiceData.bill_to_address,
        poNumber: invoiceData.po_number || '',
        project: invoiceData.estimate_title || '',
        rep: invoiceData.rep || 'JDP',
        dueDate: invoiceData.due_date || '',
        paymentCredits: invoiceData.payment_credits || 0,
        balanceDue: invoiceData.balance_due || '',
        lineItems: invoiceData.products?.map((product: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          productId: product.id,
          qty: product.stock_quantity || 1,
          item: product.product_name || '',
          description: product.description || '',
          rate: product.jdp_price || 0,
          estimatedPrice: product.estimated_price || 0,
          total: product.total_cost || 0,
          searchQuery: '',
          showSearchResults: false,
          supplierId: product.supplier_id || 1,
          isCustomProduct: true,
          estimate_product_id: product.estimate_product_id || null
        })) || [{
          id: Math.random().toString(36).substring(2, 9),
          productId: null,
          qty: 1,
          item: '',
          description: '',
          rate: 0,
          estimatedPrice: 0,
          total: 0,
          searchQuery: '',
          showSearchResults: false,
          supplierId: 1,
          isCustomProduct: false,
          estimate_product_id: null
        }],
        notes: invoiceData.notes || 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
        signatureText: invoiceData.signature_text || 'ACCEPTED BY________________DATE_____',
        invoiceType: (() => {
          if (!invoiceData.invoice_type) return 'Estimate'
          
          const typeMapping: { [key: string]: string } = {
            'down_payment': 'Downpayment Invoice',
            'rough_invoice': 'Rough Invoice',
            'progressive_invoice': 'Progressive Invoice',
            'final_invoice': 'Final Invoice',
            'estimate': 'Estimate'
          }
          
          return typeMapping[invoiceData.invoice_type] || invoiceData.invoice_type.charAt(0).toUpperCase() + invoiceData.invoice_type.slice(1)
        })(),
        customInvoiceType: invoiceData.custom_invoice_type || '',
        paymentPercentage: 0,
        estimateTotal: invoiceData.total_amount || 0,
        paymentHistory: []
      })
      
      // Show the preview dialog
      setShowPreviewDialog(true)
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      toast.error('Failed to load invoice details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicateInvoice = (invoice: any) => {
    console.log('Duplicating invoice:', invoice) 
    
    // Populate the inline invoice form with the existing invoice data
    setInlineInvoiceData({
      date: invoice.date || new Date().toISOString().split('T')[0],
      estimateNumber: invoice.estimate_number || '',
      customerName: invoice.customer_name || invoice.contractor?.contractor_name || '',
      customerAddress: invoice.customer_address || invoice.contractor?.address || '',
      billToAddress: invoice.bill_to_address || '',
      billToAddressEnabled: !!invoice.bill_to_address,
      poNumber: invoice.po_number || '',
      project: invoice.estimate_title || '',
      rep: invoice.rep || '',
      dueDate: invoice.due_date || '',
      paymentCredits: invoice.payment_credits || 0,
      balanceDue: invoice.balance_due || '',
      lineItems: invoice.products?.map((product: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        productId: product.id,
        qty: product.stock_quantity || 1,
        item: product.product_name || '',
        description: product.description || '',
        rate: product.jdp_price || 0,
        estimatedPrice: product.estimated_price || 0,
        total: product.total_cost || 0,
        searchQuery: '',
        showSearchResults: false,
        supplierId: product.supplier_id || 1,
        isCustomProduct: true,
        estimate_product_id: product.estimate_product_id || null
      })) || [{
        id: Math.random().toString(36).substring(2, 9),
        productId: null,
        qty: 1,
        item: '',
        description: '',
        rate: 0,
        estimatedPrice: 0,
        total: 0,
        searchQuery: '',
        showSearchResults: false,
        supplierId: 1,
        isCustomProduct: false
      }],
      notes: invoice.notes || 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
      signatureText: invoice.signature_text || 'ACCEPTED BY________________DATE_____',
      invoiceType: (() => {
        if (!invoice.invoice_type) return 'Estimate'
        
        // Map API values to form values
        const typeMapping: { [key: string]: string } = {
          'down_payment': 'Downpayment Invoice',
          'rough_invoice': 'Rough Invoice',
          'progressive_invoice': 'Progressive Invoice',
          'final_invoice': 'Final Invoice',
          'estimate': 'Estimate'
        }
        
        return typeMapping[invoice.invoice_type] || invoice.invoice_type.charAt(0).toUpperCase() + invoice.invoice_type.slice(1)
      })(),
      customInvoiceType: invoice.custom_invoice_type || '',
      paymentPercentage: 0,
      estimateTotal: invoice.total || 0,
      paymentHistory: []
    })
    
    const mappedInvoiceType = (() => {
      if (!invoice.invoice_type) return 'Estimate'
      
      const typeMapping: { [key: string]: string } = {
        'down_payment': 'Downpayment Invoice',
        'rough_invoice': 'Rough Invoice',
        'progressive_invoice': 'Progressive Invoice',
        'final_invoice': 'Final Invoice',
        'estimate': 'Estimate'
      }
      
      return typeMapping[invoice.invoice_type] || invoice.invoice_type.charAt(0).toUpperCase() + invoice.invoice_type.slice(1)
    })()
    
    console.log('Set invoice type to:', mappedInvoiceType)
    console.log('Set customer name to:', invoice.customer_name || invoice.contractor?.company_name || invoice.contractor?.email || '')
    console.log('Set customer address to:', invoice.customer_address || invoice.contractor?.address || '')
    
    // Show the inline invoice form
    setShowInlineInvoiceForm(true)
  }

const handlePrintInvoice = async (invoice: any) => {
  console.log(invoice, 'invoice')
  try {
    // Temp container (same)
    const tempElement = document.createElement('div');
    tempElement.id = 'temp-invoice-preview';
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-10000px';
    tempElement.style.top = '0';
    tempElement.style.width = '8.5in';
    tempElement.style.background = '#ffffff';
    tempElement.style.padding = '32px';
    tempElement.style.pointerEvents = 'none';
    tempElement.style.fontFamily = 'Arial, sans-serif';
    tempElement.style.lineHeight = '1.4';
    tempElement.style.boxSizing = 'border-box';

    // === SAME HTML ===
   // === SAME HTML ===
     const invoiceHtml = `
      <div style="font-family: Arial, sans-serif; page-break-inside: avoid;">
        <!-- Header (wrapped) -->
        <div id="print-header">
          <div style="display:flex;justify-content:space-between">
            <div>
              <div style="width:200px;height:60px;background:url('/assets/logos/logo-jdp.png') no-repeat center center;background-size:contain;"></div>
              <div style="margin-top:8px;font-size:14px;color:#6b7280;">952-449-1088</div>
            </div>
            <div style="display:flex;">
              <div style="background:#1f2937;color:#fff;padding:16px;text-align:center;border:2px solid #1f2937;width:200px;">
                <div style="font-size:16px;font-weight:bold;">Date</div>
              </div>
              <div style="background:#fff;color:#374151;padding:16px;text-align:center;border:2px solid #e5e7eb;width:200px;">
                <div style="font-size:16px;font-weight:bold;">${new Date(inlineInvoiceData.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
 
          <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
            <div style="display:flex;">
              <div style="background:#1f2937;color:#fff;padding:16px;text-align:center;border:2px solid #1f2937;width:200px;">
                <div style="font-size:16px;font-weight:bold;">${invoice.invoice_type || 'Estimate'} #</div>
              </div>
              <div style="background:#fff;color:#374151;padding:16px;text-align:center;border:2px solid #e5e7eb;width:200px;">
                <div style="font-size:16px;font-weight:bold;">${InvoioiceNumber || 'INV-2025-029'}</div>
              </div>
            </div>
          </div>
        </div>
 
        ${(invoice.bill_to_address || invoice.billing_address) ? `
        <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px;">
          <div style="font-size:14px;font-weight:bold;margin-left:16px;">Bill To</div>
        </div>
        <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;color:#374151;font-size:14px;margin-bottom:16px;">
          ${invoice.bill_to_address || invoice.billing_address}
        </div>` : ''}
 
        <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px; ${(invoice.bill_to_address || invoice.billing_address) ? '' : 'margin-top:15px;'}">
          <div style="font-size:14px;font-weight:bold;margin-left:16px;">To</div>
        </div>
        <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;margin-bottom:24px;">
          <div style="font-weight:600;font-size:16px;color:#374151;">
            ${job.type === 'contract-based'
          ? (contractorData?.name || contractorData?.contractor_name || invoice.customer_name || 'Contractor')
          : (invoice.customer_name || invoice.customer?.name || job.customerName || 'Customer')}
          </div>
          <div style="color:#6b7280;font-size:14px;margin-top:4px;">
            ${inlineInvoiceData.customerAddress || invoice.customer_address || invoice.customer?.address || job.location || 'Address'}
          </div>
        </div>
 
        <!-- Project Details -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
          <div>
            <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px;">
              <div style="font-size:14px;font-weight:bold;margin-left:16px;">P.O. No.</div>
            </div>
            <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;color:#374151;font-size:14px;">${invoice.po_number || 'DFRG-678'}</div>
          </div>
          <div>
            <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px;">
              <div style="font-size:14px;font-weight:bold;margin-left:16px;">Project</div>
            </div>
            <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;color:#374151;font-size:14px;">${invoice.estimate_title || invoice.job_title || job.title || 'tech-gb-job'}</div>
          </div>
        </div>
 
        <!-- Rep & Due -->
        <div style="margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="border:1px solid #d1d5db;padding:8px 12px;text-align:left;font-size:14px;font-weight:600;color:#374151;">Rep</th>
                <th style="border:1px solid #d1d5db;padding:8px 12px;text-align:left;font-size:14px;font-weight:600;color:#374151;">Due Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:14px;color:#374151;">${inlineInvoiceData.rep || 'JDP'}</td>
                <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:14px;color:#374151;">
                  ${inlineInvoiceData.dueDate ? new Date(inlineInvoiceData.dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '10/17/2025'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
 
        <!-- Line Items -->
        <div style="margin-bottom:32px;page-break-inside:avoid;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:16px;page-break-inside:avoid;">
            <thead>
              <tr style="background:#1f2937;color:#fff;">
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-left:12px;text-align:left;font-size:14px;font-weight:600;">Qty</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-left:12px;text-align:left;font-size:14px;font-weight:600;">Item</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-left:12px;text-align:left;font-size:14px;font-weight:600;">Description</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-right:12px;text-align:right;font-size:14px;font-weight:600;">Rate</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-right:12px;text-align:right;font-size:14px;font-weight:600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.products?.map((p: any) => `
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="border:1px solid #d1d5db;padding:12px 16px;font-size:14px;font-weight:500;">${p.stock_quantity || 1}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;font-weight:600;font-size:14px;">${p.product_name || 'Item'}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;font-size:13px;color:#6b7280;line-height:1.4;">${p.description || ''}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;text-align:right;font-size:14px;font-weight:500;">$${(p.estimated_price || 0).toFixed(2)}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;text-align:right;font-weight:600;font-size:14px;">$${(p.total_cost || 0).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
 
          <div style="display:flex;justify-content:end;margin-top:20px;">
            <div style="text-align:right;">
              <div style="font-weight:bold;font-size:20px;color:#1f2937;">$${(invoice.total_amount || 0).toFixed(2)}</div>
            </div>
          </div>
 
          <div style="display:flex;justify-content:end;margin-top:16px;">
            <div style="text-align:right;min-width:200px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:14px;color:#374151;">Payments / Credits:</span>
                <span style="font-size:14px;color:#374151;">$${(inlineInvoiceData.paymentCredits || 0).toFixed(2)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:#f3f4f6;padding:8px 12px;border-radius:4px;">
                <span style="font-weight:bold;font-size:14px;color:#374151;">Balance Due:</span>
                <span style="font-weight:bold;font-size:14px;color:#374151;">$${parseFloat(inlineInvoiceData.balanceDue || (invoice.total_amount || 0).toString()).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
 
        <!-- Notes -->
        <div style="border-top:2px solid #e5e7eb;padding-top:20px;margin-bottom:32px;">
          <div style="background:#f3f4f6;padding:16px;border-radius:6px;text-align:center;border:1px solid #e5e7eb;">
            <div style="font-size:14px;font-weight:500;white-space:pre-line;color:#374151;">${invoice.notes || 'Final payment to complete project billing'}</div>
          </div>
        </div>
 
        <!-- Acceptance -->
        <div style="margin-bottom:32px;page-break-inside:avoid;">
          <div style="font-size:11px;color:#6b7280;margin-bottom:32px;line-height:1.5;">
            <p style="margin:0;">
              JDP is not responsible for repair of lamps & landscaping, house owner utilities including cables,
              sprinkler systems, television or telephone cables, etc. that may be cut or damaged during installation.
              Price are subject to change prior to receipt of down payment.
            </p>
          </div>
 
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:28px;font-weight:bold;margin-bottom:20px;color:#1f2937;">Total $${(invoice.total_amount || 0).toFixed(2)}</div>
            <div style="font-size:14px;color:blue;font-weight:500;">EMAIL: jen@jdpelectric.us 952-449-1088</div>
          </div>
 
          <div style="border-top:1px solid #e5e7eb;margin-bottom:24px;"></div>
 
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <div style="display:flex;flex-direction:column;">
              <div style="font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;">Customer Acceptance</div>
              <div style="font-size:14px;font-weight:500;color:#374151;">Authorized Signature</div>
            </div>
            <div style="font-size:14px;font-weight:500;color:#374151;">Date</div>
          </div>
 
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <div style="display:flex;flex-direction:column;width:60%;">
              <div style="border-bottom:1px solid #374151;height:2px;margin-bottom:8px;"></div>
              <div style="font-size:12px;color:#374151;text-align:center;">Signature</div>
            </div>
            <div style="display:flex;flex-direction:column;width:30%;">
              <div style="border-bottom:1px solid #374151;height:2px;margin-bottom:8px;"></div>
              <div style="font-size:12px;color:#374151;text-align:center;">Date</div>
            </div>
          </div>
 
          <div style="background:#e0f2fe;border:1px solid #81d4fa;border-radius:6px;padding:16px;margin-top:20px;">
            <div style="font-size:12px;color:#374151;line-height:1.4;">
              By signing above, you agree to the terms and pricing outlined in this estimate. This becomes a binding agreement upon signature.
            </div>
          </div>
        </div>
      </div>
    `;
    tempElement.innerHTML = invoiceHtml;
    document.body.appendChild(tempElement);

    // Header height in CSS px
    const headerEl = tempElement.querySelector('#print-header') as HTMLElement | null;
    const headerCssPx = Math.ceil(headerEl?.getBoundingClientRect().height || 0);

    // Render to canvas
    const canvas = await html2canvas(tempElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempElement.scrollWidth,
      height: tempElement.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: tempElement.scrollWidth,
      windowHeight: tempElement.scrollHeight
    });

    const scaleX = canvas.width / tempElement.scrollWidth;
    const rootRect = tempElement.getBoundingClientRect();
    const headRect = headerEl?.getBoundingClientRect();
    const headerBandCssPx = Math.max(1, Math.ceil(((headRect?.bottom ?? 0) - rootRect.top)));
    const headerPxScaled = Math.max(1, Math.round(headerBandCssPx * scaleX));

    // Slice header (use scaled px)
    let headerImgData: string | null = null;
    if (headerPxScaled > 0) {
      const headerCanvas = document.createElement('canvas');
      headerCanvas.width = canvas.width;
      headerCanvas.height = headerPxScaled;
      const hctx = headerCanvas.getContext('2d')!;
      hctx.drawImage(canvas, 0, 0, canvas.width, headerPxScaled, 0, 0, canvas.width, headerPxScaled);
      headerImgData = headerCanvas.toDataURL('image/png');
    }

    const imageData = canvas.toDataURL('image/png');


    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const footerSpace = 21;
    const pageHeight = 295 - footerSpace;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pxToMm = imgWidth / canvas.width;
    const headerHeightMM = headerPxScaled * pxToMm;


    const topPaddingMM = 10;
    const bottomPaddingMM = 0;
    const usablePageHeight = pageHeight - topPaddingMM - bottomPaddingMM;


    let yPosition = 0; 
    const pageHeightPx = (usablePageHeight / pxToMm); 


    pdf.addImage(imageData, 'PNG', 0, topPaddingMM, imgWidth, imgHeight);
    yPosition += pageHeightPx; 

  
    while (yPosition < canvas.height) {
      pdf.addPage();

  
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;
      const pageCtx = pageCanvas.getContext('2d')!;
      pageCtx.fillStyle = '#fff';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0, yPosition,                       
        canvas.width, pageHeightPx,         
        0, 0,
        canvas.width, pageHeightPx
      );

      const pageImg = pageCanvas.toDataURL('image/png');
      pdf.addImage(pageImg, 'PNG', 0, topPaddingMM, imgWidth, (pageHeightPx * pxToMm));

      yPosition += pageHeightPx;
    }

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => setTimeout(() => printWindow.print(), 1000);
    }

    document.body.removeChild(tempElement);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
  } catch (err) {
    console.error('Print error:', err);
    toast.error('Failed to print invoice');
  }
};


  const handleDeleteInvoice = async (invoiceId: string) => {
    setEstimateToDelete({ id: invoiceId })
    setShowDeleteEstimateDialog(true)
  }

  // Map UI invoice types to API values
  const mapInvoiceTypeToAPI = (uiType: string): string => {
    const mapping: Record<string, string> = {
      'Estimate': 'estimate',
      'Downpayment Invoice': 'down_payment',
      'Rough Invoice': 'proposal_invoice',
      'Progressive Invoice': 'progressive_invoice',
      'Final Invoice': 'final_invoice'
    }
    // Return mapped value if exists, otherwise return the custom value as-is
    return mapping[uiType] || uiType.toLowerCase().replace(/\s+/g, '_')
  }

  // Map API invoice type to UI format
  const mapInvoiceTypeToUI = (apiType: string): string => {
    const mapping: Record<string, string> = {
      'estimate': 'Estimate',
      'down_payment': 'Downpayment Invoice',
      'proposal_invoice': 'Rough Invoice',
      'progressive_invoice': 'Progressive Invoice',
      'final_invoice': 'Final Invoice'
    }
    // Return mapped value if exists, otherwise convert custom value back to readable format
    if (mapping[apiType]) {
      return mapping[apiType]
    }
    // Convert custom API value back to readable format
    return apiType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Fetch suppliers with search
  const fetchSuppliers = async (searchQuery: string = '') => {
    try {
      const response = searchQuery
        ? await apiClient.searchSuppliersByQuery(searchQuery)
        : await apiClient.getAllSuppliers()

      const suppliersData = response.data?.suppliers || response.data?.data || []
      setSuppliersList(suppliersData.map((s: any) => ({
        id: s.id,
        name: s.company_name || s.users?.full_name || 'Unknown',
        fullName: s.users?.full_name || '',
        companyName: s.company_name || ''
      })))
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  // Fetch products with search
  const fetchProducts = async (searchQuery: string = '') => {
    try {
      const response = searchQuery
        ? await apiClient.searchProductsByQuery(searchQuery)
        : await apiClient.getAllProducts()

      const productsData = response.data?.products || response.data?.data || []
      setProducts(productsData.map((p: any) => ({
        id: p.id,
        name: p.product_name,
        description: p.description || '',
        jdpSKU: p.jdp_sku,
        jdpPrice: p.jdp_price || p.unit_cost || 0,
        estimatedPrice: p.estimated_price || 0,
        supplierId: p.supplier_id || 1
      })))
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchSuppliers()

    // Fetch data based on job type
    if (job.type === 'contract-based' && job.contractor) {
      // For contract-based jobs, fetch contractor data 
      fetchContractorData(job.contractor)
    } else if (job.type === 'service-based' && job.customer) {
      // For service-based jobs, fetch customer data 
      fetchCustomerData(job.customer)
    } else {
      console.log('No customer/contractor ID found in job data')
    }
  }, [job.customer, job.contractor, job.type, job.id])

  // Debug: Log inlineInvoiceData changes
  useEffect(() => {
  }, [inlineInvoiceData.customerAddress])

  // Update customer address when customerData changes
  useEffect(() => {
    if (customerData?.address && customerData.address !== inlineInvoiceData.customerAddress) {
      setInlineInvoiceData(prev => ({
        ...prev,
        customerAddress: customerData.address
      }))
    }
  }, [customerData?.address])

  const handleSaveInvoiceAsDraft = async () => {
    // Validation
    const errors: Record<string, string> = {}

    if (!inlineInvoiceData.project) {
      errors.project = 'Project field is required'
    }

    // Filter out empty line items and check if we have at least one valid item
    const validLineItems = inlineInvoiceData.lineItems.filter(item =>
      item.item && item.item.trim() !== '' && item.rate > 0
    )

    if (validLineItems.length === 0) {
      errors.lineItems = 'Please add at least one product item with name and rate'
    }

    if (Object.keys(errors).length > 0) {
      setInvoiceValidationErrors(errors)
      toast.error('Please fix the validation errors')
      return
    }

    setInvoiceValidationErrors({})
    setIsLoadingDraft(true)
    try {
      const subtotal = calculateInvoiceSubtotal()

      // Only map valid line items to custom products
      const customProducts = validLineItems.map(item => {
        const productPayload: any = {
          product_name: item.item,
          description: item.description || '',
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: item.qty,
          unit: 'unit',
          job_id: Number(jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total
        }

        // Add product ID if editing existing product
        if (item.productId) {
          productPayload.id = item.productId
        }

        return productPayload
      })

      const payload = {
        job_id: Number(jobId),
        estimate_title: inlineInvoiceData.project || job.title,
        ...(job.type === 'contract-based'
          ? { contractor_id: Number(job.contractor) || 0 }
          : { customer_id: Number(job.customer?.id || job.customer) || 0 }
        ),
        priority: 'medium' as 'low' | 'medium' | 'high',
        service_type: job.type === 'contract-based' ? 'contract_based' : 'service_based',
        email_address: job.type === 'contract-based'
          ? (contractorData?.email || job.email || 'contractor@example.com')
          : (customerData?.email || job.customer?.email || job.email || 'customer@example.com'),
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || '',
        rep: inlineInvoiceData.rep || '',
        due_date: inlineInvoiceData.dueDate || '',
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || '',
        ...(inlineInvoiceData.billToAddressEnabled && { bill_to_address: inlineInvoiceData.billToAddress || '' }),
        status: 'draft',
        invoice_type: mapInvoiceTypeToAPI(inlineInvoiceData.invoiceType === 'Custom' ? inlineInvoiceData.customInvoiceType : inlineInvoiceData.invoiceType),
        notes: inlineInvoiceData.notes || '',
        custom_products: customProducts
      }

      // Check if we're editing an existing invoice
      if (editingInvoiceId) {
        await apiClient.updateEstimate(Number(editingInvoiceId), payload as any)
        toast.success('Invoice updated successfully!')
      } else {
        await apiClient.createEstimate(payload as any)
        toast.success('Invoice saved as draft!')
      }

      // Refresh estimates list
      await fetchEstimates()
      try {
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setShowInlineInvoiceForm(false)
      setEditingInvoiceId(null)

      // Reset form
      setInlineInvoiceData({
        date: new Date().toISOString().split('T')[0],
        estimateNumber: '',
        customerName: job.customerName || '',
        customerAddress: job.address || '',
        billToAddress: job.billToAddress || '',
        billToAddressEnabled: true,
        poNumber: '',
        project: job.title || '',
        rep: '',
        dueDate: '',
        paymentCredits: 0,
        balanceDue: '',
        lineItems: [{
          id: Math.random().toString(36).substring(2, 9),
          productId: null,
          qty: 1,
          item: '',
          description: '',
          rate: 0,
          estimatedPrice: 0,
          total: 0,
          searchQuery: '',
          showSearchResults: false,
          supplierId: 1,
          isCustomProduct: false,
          estimate_product_id: null
        }],
        notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
        signatureText: 'ACCEPTED BY________________DATE_____',
        invoiceType: 'Estimate',
        customInvoiceType: '',
        paymentPercentage: 0,
        estimateTotal: 0,
        paymentHistory: []
      })
      setInvoiceValidationErrors({})
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Failed to save invoice')
    } finally {
      setIsLoadingDraft(false)
    }
  }

  const handlePreviewAndSend = async () => {
    // Validation
    const errors: Record<string, string> = {}

    if (!inlineInvoiceData.project) {
      errors.project = 'Project field is required'
    }

    // Filter out empty line items and check if we have at least one valid item
    const validLineItems = inlineInvoiceData.lineItems.filter(item =>
      item.item && item.item.trim() !== '' && item.rate > 0
    )

    if (validLineItems.length === 0) {
      errors.lineItems = 'Please add at least one product item with name and rate'
    }

    if (Object.keys(errors).length > 0) {
      setInvoiceValidationErrors(errors)
      toast.error('Please fix the validation errors')
      return
    }

    // First save as draft
    try {
      setIsLoadingPreview(true)

      const subtotal = calculateInvoiceSubtotal()

      // Only map valid line items to custom products
      const customProducts = validLineItems.map(item => {
        const productPayload: any = {
          product_name: item.item,
          description: item.description || '',
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: item.qty,
          unit: 'unit',
          job_id: Number(jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total
        }

        // Add product ID if editing existing product
        if (item.productId) {
          productPayload.id = item.productId
        }

        return productPayload
      })

      const payload = {
        job_id: Number(jobId),
        estimate_title: inlineInvoiceData.project || job.title,
        ...(job.type === 'contract-based'
          ? { contractor_id: Number(job.contractor) || 0 }
          : { customer_id: Number(job.customer?.id || job.customer) || 0 }
        ),
        priority: 'medium' as 'low' | 'medium' | 'high',
        service_type: job.type === 'contract-based' ? 'contract_based' : 'service_based',
        email_address: job.type === 'contract-based'
          ? (contractorData?.email || job.email || 'contractor@example.com')
          : (customerData?.email || job.customer?.email || job.email || 'customer@example.com'),
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || '',
        rep: inlineInvoiceData.rep || '',
        due_date: inlineInvoiceData.dueDate || '',
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || '',
        ...(inlineInvoiceData.billToAddressEnabled && { bill_to_address: inlineInvoiceData.billToAddress || '' }),
        status: 'draft',
        invoice_type: mapInvoiceTypeToAPI(inlineInvoiceData.invoiceType === 'Custom' ? inlineInvoiceData.customInvoiceType : inlineInvoiceData.invoiceType),
        notes: inlineInvoiceData.notes || '',
        custom_products: customProducts
      }

      if (editingInvoiceId) {
        await apiClient.updateEstimate(Number(editingInvoiceId), payload as any)
      } else {
        const response = await apiClient.createEstimate(payload as any)
        setEditingInvoiceId(response.id)
      }

      // Clear validation errors
      setInvoiceValidationErrors({})

      // Show single success message
      toast.success('Invoice saved successfully!')

      // Refresh estimates to update count
      await fetchEstimates()

      // Refresh dashboard data
      try {
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }

      // Then open preview dialog
      setShowPreviewDialog(true)

    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Failed to save invoice. Please try again.')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleSendFromPreview = async () => {
    setIsLoading(true)
    try {
      // Prepare API payload
      const subtotal = calculateInvoiceSubtotal()
      const total = subtotal // You can add tax calculation here if needed

      const payload = {
        estimateNumber: inlineInvoiceData.estimateNumber || 'Draft',
        estimateDate: new Date(inlineInvoiceData.date).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }),
        ...(job.type === 'contract-based'
          ? {
            customerName: inlineInvoiceData.customerName || 'Contractor',
            customerEmail: contractorData?.email || job.email || 'contractor@example.com',
            customerAddress: inlineInvoiceData.customerAddress || ''
          }
          : {
            customerName: inlineInvoiceData.customerName || 'Customer',
            customerEmail: customerData?.email || job.customer?.email || job.customerEmail || 'customer@example.com',
            customerAddress: inlineInvoiceData.customerAddress || ''
          }
        ),
        billToAddress: inlineInvoiceData.billToAddressEnabled ? inlineInvoiceData.billToAddress || '' : '',
        poNumber: inlineInvoiceData.poNumber || '',
        projectName: inlineInvoiceData.project || job.title || '',
        items: inlineInvoiceData.lineItems.map(item => ({
          quantity: item.qty.toString(),
          item: item.item,
          description: item.description || '',
          rate: (item.rate || 0).toFixed(2),
          amount: (item.estimatedPrice || 0).toFixed(2)
        })),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        dueDate: inlineInvoiceData.dueDate || '',
        rep: inlineInvoiceData.rep || 'JDP',
        paymentCredits: inlineInvoiceData.paymentCredits || 0,
        balanceDue: (subtotal - (inlineInvoiceData.paymentCredits || 0)).toFixed(2),
        notes: inlineInvoiceData.notes ? inlineInvoiceData.notes.split('\n').filter(note => note.trim()) : [],
        email: 'jen@jdpelectric.us',
        phone: '952-449-1088',
        status: 'sent'
      }

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const token = getAuthToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/invoices/sendInvoiceToCustomer/${editingInvoiceId || estimates[0]?.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to send invoice')
      }

      toast.success('Invoice sent successfully to customer!')

      // Also save the invoice data to backend
      const customProducts = inlineInvoiceData.lineItems.map(item => {
        const productPayload: any = {
          product_name: item.item,
          description: item.description || '',
          jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stock_quantity: item.qty,
          unit: 'unit',
          job_id: Number(jobId),
          unit_cost: item.rate,
          jdp_price: item.rate,
          estimated_price: item.estimatedPrice || 0,
          total_cost: item.total
        }

        // Add product ID if editing existing product
        if (item.productId) {
          productPayload.id = item.productId
        }

        return productPayload
      })

      const backendPayload = {
        job_id: Number(jobId),
        estimate_title: inlineInvoiceData.project || job.title,
        ...(job.type === 'contract-based'
          ? { contractor_id: Number(job.contractor) || 0 }
          : { customer_id: Number(job.customer?.id || job.customer) || 0 }
        ),
        priority: 'medium' as 'low' | 'medium' | 'high',
        service_type: job.type === 'contract-based' ? 'contract_based' : 'service_based',
        email_address: job.type === 'contract-based'
          ? (contractorData?.email || job.email || 'contractor@example.com')
          : (customerData?.email || job.customer?.email || job.email || 'customer@example.com'),
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || '',
        rep: inlineInvoiceData.rep || '',
        due_date: inlineInvoiceData.dueDate || '',
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || '',
        ...(inlineInvoiceData.billToAddressEnabled && { bill_to_address: inlineInvoiceData.billToAddress || '' }),
        status: 'sent',
        invoice_type: mapInvoiceTypeToAPI(inlineInvoiceData.invoiceType === 'Custom' ? inlineInvoiceData.customInvoiceType : inlineInvoiceData.invoiceType),
        notes: inlineInvoiceData.notes || '',
        custom_products: customProducts
      }

      // Check if we're editing an existing invoice
      if (editingInvoiceId) {
        await apiClient.updateEstimate(Number(editingInvoiceId), backendPayload as any)
        // toast.success('Invoice updated and sent successfully!')
      } else {
        // Don't create new estimate when sending - it should already exist from preview step
        // toast.success('Invoice sent successfully!')
      }

      // Refresh estimates list
      await fetchEstimates()
      try {
        const res = await apiClient.getJobDashboard(jobId);
        setDashboardMetrics(res.data.dashboardMetrics);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setShowInlineInvoiceForm(false)
      setShowPreviewDialog(false)
      setEditingInvoiceId(null)

      // Reset form
      setInlineInvoiceData({
        date: new Date().toISOString().split('T')[0],
        estimateNumber: '',
        customerName: job.customerName || '',
        customerAddress: job.address || '',
        billToAddress: job.billToAddress || '',
        billToAddressEnabled: true,
        poNumber: '',
        project: job.title || '',
        rep: '',
        dueDate: '',
        paymentCredits: 0,
        balanceDue: '',
        lineItems: [{
          id: Math.random().toString(36).substring(2, 9),
          productId: null,
          qty: 1,
          item: '',
          description: '',
          rate: 0,
          estimatedPrice: 0,
          total: 0,
          searchQuery: '',
          showSearchResults: false,
          supplierId: 1,
          isCustomProduct: false,
          estimate_product_id: null
        }],
        notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
        signatureText: 'ACCEPTED BY________________DATE_____',
        invoiceType: 'Estimate',
        customInvoiceType: '',
        paymentPercentage: 0,
        estimateTotal: 0,
        paymentHistory: []
      })
      setInvoiceValidationErrors({})
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintPreview = async () => {
    try {
      const printElement = document.getElementById('invoice-preview-print');
      if (!printElement) {
        toast.error('Unable to generate invoice for printing');
        return;
      }

      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imageData = canvas.toDataURL('image/png');
      const headerEl =
        printElement.querySelector('#print-header') ||
        printElement.querySelector('[data-print-header]') ||
        printElement.querySelector('.print-header') ||
        document.querySelector('#print-header');

      const offsetTopRel = (el: HTMLElement, ancestor: HTMLElement) => {
        let y = 0, n: any = el;
        while (n && n !== ancestor) {
          y += n.offsetTop || 0;
          n = n.offsetParent;
        }
        return y;
      };

      let headerBandCssPx = 0;
      if (headerEl instanceof HTMLElement) {
        headerBandCssPx = offsetTopRel(headerEl, printElement) + headerEl.offsetHeight;
      } else {

        headerBandCssPx = 180;
      }

      const scaleX = canvas.width / printElement.scrollWidth;
      const headerBandPx = Math.max(1, Math.round(headerBandCssPx * scaleX));

      let headerImgData: string | null = null;
      if (headerBandPx > 0) {
        const headerCanvas = document.createElement('canvas');
        headerCanvas.width = canvas.width;
        headerCanvas.height = headerBandPx;
        const hctx = headerCanvas.getContext('2d')!;
        hctx.drawImage(
          canvas,
          0, 0, canvas.width, headerBandPx,
          0, 0, canvas.width, headerBandPx
        );
        headerImgData = headerCanvas.toDataURL('image/png');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pxToMm = imgWidth / canvas.width;

      const headerBandMM = headerBandPx * pxToMm;
      const pageContentHeightMM = pageHeight - headerBandMM;

      let heightLeft = imgHeight;

      pdf.addImage(imageData, 'PNG', 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0.1) {
        const position = heightLeft - imgHeight;
        pdf.addPage();

        if (headerImgData && headerBandMM > 0) {

          pdf.addImage(imageData, 'PNG', 0, position + headerBandMM, imgWidth, imgHeight);

          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, imgWidth, headerBandMM, 'F');

          pdf.addImage(headerImgData, 'PNG', 0, 0, imgWidth, headerBandMM);

          heightLeft -= pageContentHeightMM;
        } else {

          pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }


      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => setTimeout(() => printWindow.print(), 800);
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    } catch (err) {
      console.error('Print error:', err);
      toast.error('Failed to print invoice');
    }
  };

  const handleEditInvoice = async (invoice: any) => {
    try {
      setIsLoading(true)

      // Fetch full estimate details from API
      const response = await apiClient.getEstimateById(invoice.id)
      const estimateData = response?.data || response


      // Map products to line items
      const lineItems = estimateData.products && estimateData.products.length > 0
        ? estimateData.products.map((product: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          productId: product.id, // Store original product ID for updates
          qty: product.stock_quantity || 1,
          item: product.product_name || '',
          description: product.description || '',
          rate: product.unit_cost || 0,
          estimatedPrice: product.estimated_price || product.unit_cost || 0,
          total: (product.stock_quantity || 1) * (product.estimated_price || product.unit_cost || 0),
          searchQuery: '',
          showSearchResults: false,
          supplierId: product.supplier_id || 1,
          isCustomProduct: false,
          estimate_product_id: product.estimate_product_id || null
        }))
        : [{
          id: Math.random().toString(36).substring(2, 9),
          productId: null,
          qty: 1,
          item: '',
          description: '',
          rate: 0,
          estimatedPrice: 0,
          total: 0,
          searchQuery: '',
          showSearchResults: false,
          supplierId: 1,
          isCustomProduct: false,
          estimate_product_id: null
        }]

      setInlineInvoiceData({
        date: estimateData.estimate_date || new Date().toISOString().split('T')[0],
        estimateNumber: estimateData.invoice_number || '',
        customerName: estimateData.customer?.customer_name || job.customer?.customer_name || job.customerName || '',
        customerAddress: estimateData.customer?.address || job.customer?.address || job.address || '',
        billToAddress: estimateData.bill_to_address || job.bill_to_address || '',
        rep: estimateData.rep || '',
        dueDate: estimateData.due_date || '',
        paymentCredits: estimateData.payment_credits || 0,
        balanceDue: estimateData.balance_due || '',
        billToAddressEnabled: true,
        poNumber: estimateData.po_number || '',
        project: estimateData.estimate_title || job.job_title || job.title || '',
        lineItems: lineItems,
        notes: estimateData.notes || 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
        signatureText: 'ACCEPTED BY________________DATE_____',
        invoiceType: (() => {
          const mappedType = mapInvoiceTypeToUI(estimateData.invoice_type) || 'Estimate'
          // Check if it's a custom type (not in standard mapping)
          const standardTypes = ['Estimate', 'Downpayment Invoice', 'Rough Invoice', 'Progressive Invoice', 'Final Invoice']
          if (!standardTypes.includes(mappedType)) {
            // It's a custom type, add to custom types list and set as Custom
            addCustomInvoiceType(mappedType)
            return 'Custom'
          }
          return mappedType
        })(),
        customInvoiceType: (() => {
          const mappedType = mapInvoiceTypeToUI(estimateData.invoice_type) || 'Estimate'
          const standardTypes = ['Estimate', 'Downpayment Invoice', 'Rough Invoice', 'Progressive Invoice', 'Final Invoice']
          if (!standardTypes.includes(mappedType)) {
            return mappedType
          }
          return ''
        })(),
        paymentPercentage: 0,
        estimateTotal: estimateData.total_amount || 0,
        paymentHistory: []
      })

      setEditingInvoiceId(invoice.id)
      setShowInlineInvoiceForm(true)
      toast.info('Loading invoice for editing...')
    } catch (error) {
      toast.error('Failed to load invoice details')
    } finally {
      setIsLoading(false)
    }
  }


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
            {/* <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Invoice
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Send Invoice
            </Button> */}
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
                    {isLoadingDashboard ? "Loading" : dashboardMetrics?.totalMaterialUsed?.unit ?? "items"}
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
        <div className="flex justify-between gap-6">
          {/* Left Column - Job Details */}
          {/* Job Details Card */}
          <div className='w-[70%]'>
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
                  <div className="space-y-4">
                    <div className={`flex-1 ${!isEditing ? 'bg-[#dbdaff30] p-3 rounded-md' : ''}`}>
                      <p className="text-sm text-gray-600">Status</p>
                      {isEditing ? (
                        <Select
                          value={editedJob.status}
                          onValueChange={(value) => setEditedJob({ ...editedJob, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="in_progress">In-Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>

                        // <Input
                        //   value={editedJob.type}
                        //   onChange={(e) => setEditedJob({ ...editedJob, type: e.target.value })}
                        // />
                      ) : (
                        <p className="font-medium">{editedJob.status}</p>
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
                  <Label className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-4 w-4 text-[#00A1FF]" />
                    Assigned Lead Labor
                  </Label>

                  {isEditing ? (
                    <AutoScrollMultiSelect
                      selectedValues={(() => {
                        const values = editedJob.assignedLeadLabor?.map((labor: any) => {
                          // Handle different data structures
                          if (typeof labor === 'string') return labor;
                          if (labor.id) return labor.id.toString();
                          if (labor.user?.id) return labor.user.id.toString();
                          return labor.toString();
                        }) || [];
                        console.log('Lead Labor selectedValues:', values, 'Original data:', editedJob.assignedLeadLabor);
                        return values;
                      })()}
                      selectedObjects={editedJob.assignedLeadLabor?.map((labor: any) => ({
                        id: labor.id,
                        name: labor.name || labor.user?.full_name || labor.labor_code || `Labor ${labor.id}`,
                        labor_code: labor.labor_code,
                        department: labor.department,
                        specialization: labor.specialization,
                        trade: labor.trade
                      })) || []}
                      onSelectionChange={(selectedIds, selectedItems) => {
                        console.log('Lead Labor selection changed:', { selectedIds, selectedItems });
                        const validSelectedItems = selectedItems.filter((labor: any) => labor !== undefined);

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
                  <Label className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-[#00A1FF]" />
                    Lead Labor
                  </Label>

                  {isEditing ? (
                    <AutoScrollMultiSelect
                      selectedValues={(() => {
                        const values = editedJob.assignedLabor?.map((labor: any) => {
                          // Handle different data structures
                          if (typeof labor === 'string') return labor;
                          if (labor.id) return labor.id.toString();
                          if (labor.user?.id) return labor.user.id.toString();
                          return labor.toString();
                        }) || [];
                        console.log('Labor selectedValues:', values, 'Original data:', editedJob.assignedLabor);
                        return values;
                      })()}
                      selectedObjects={editedJob.assignedLabor?.map((labor: any) => ({
                        id: labor.id,
                        name: labor.name || labor.user?.full_name || labor.labor_code || `Labor ${labor.id}`,
                        labor_code: labor.labor_code,
                        trade: labor.trade,
                        experience: labor.experience,
                        hourly_rate: labor.hourly_rate
                      })) || []}
                      onSelectionChange={(selectedIds, selectedItems) => {
                        console.log('Labor selection changed:', { selectedIds, selectedItems });
                        const validSelectedItems = selectedItems.filter((labor: any) => labor !== undefined);

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
                      {(editedJob.assignedLabor || []).map((labor: any, index: number) => {

                        return (
                          <span
                            key={labor.id || `labor-${index}`}
                            className="bg-orange-50 text-orange-700 text-sm px-2 py-1 rounded-md border border-orange-200"
                          >
                            {labor.name || labor.user?.full_name || labor.labor_code}
                          </span>
                        );
                      })}
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
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
          {/* Right Column - Project Summary */}
          <div className='w-[25%]'>
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
                    <p className="flex items-center justify-center py-16"> <LoadingSpinner /></p>
                  )}
                </CardContent>
              </Card>


            </div>
          </div>
        </div>
        {/* Transaction History Section */}
        <Card className="bg-white shadow-sm border border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-50/50 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary hover:text-white"
                onClick={() => {
                  if (!showInlineInvoiceForm) {
                    // Reset form and auto-fill when opening invoice form
                    setInlineInvoiceData({
                      date: new Date().toISOString().split('T')[0],
                      estimateNumber: '',
                      customerName: job.customerName || '',
                      customerAddress: job.address || '',
                      billToAddress: job.billToAddress || '',
                      billToAddressEnabled: true,
                      poNumber: '',
                      project: job.title || '',
                      rep: '',
                      dueDate: '',
                      paymentCredits: 0,
                      balanceDue: '',
                      lineItems: [{
                        id: Math.random().toString(36).substring(2, 9),
                        productId: null,
                        qty: 1,
                        item: '',
                        description: '',
                        rate: 0,
                        estimatedPrice: 0,
                        total: 0,
                        searchQuery: '',
                        showSearchResults: false,
                        supplierId: 1,
                        isCustomProduct: false,
                        estimate_product_id: null
                      }],
                      notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
                      signatureText: 'ACCEPTED BY________________DATE_____',
                      invoiceType: 'Estimate',
                      customInvoiceType: '',
                      paymentPercentage: 0,
                      estimateTotal: 0,
                      paymentHistory: [] as any[]
                    })
                    setEditingInvoiceId(null)
                    setInvoiceValidationErrors({})
                  }
                  setShowInlineInvoiceForm(!showInlineInvoiceForm)
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {showInlineInvoiceForm ? 'Cancel' : 'Add Invoice'}
              </Button>
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
                      <Label className="text-primary font-semibold">Invoice Type:</Label>
                      <div className="relative w-[250px]">
                        <Select
                          value={inlineInvoiceData.invoiceType}
                          onValueChange={(value) => setInlineInvoiceData(prev => ({ ...prev, invoiceType: value }))}
                        >
                          <SelectTrigger className="border-primary/30 focus:border-primary">
                            <SelectValue placeholder="Select invoice type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Estimate">Estimate</SelectItem>
                            <SelectItem value="Downpayment Invoice">Downpayment Invoice</SelectItem>
                            <SelectItem value="Rough Invoice">Rough Invoice</SelectItem>
                            <SelectItem value="Progressive Invoice">Progressive Invoice</SelectItem>
                            <SelectItem value="Final Invoice">Final Invoice</SelectItem>
                            {customInvoiceTypes.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-b">Custom Types</div>
                                {cleanCustomTypes(customInvoiceTypes).map((customType, index) => (
                                  <SelectItem key={index} value={customType}>{customType}</SelectItem>
                                ))}
                              </>
                            )}
                            <SelectItem value="Custom">+ Add Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {inlineInvoiceData.invoiceType === 'Custom' && (
                        <div className="relative w-[300px]">
                          <Input
                            value={inlineInvoiceData.customInvoiceType}
                            onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, customInvoiceType: e.target.value }))}
                            onBlur={() => {
                              if (inlineInvoiceData.customInvoiceType) {
                                addCustomInvoiceType(inlineInvoiceData.customInvoiceType)
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
                          src='/assets/logos/logo-jdp.png'
                          alt="logo"
                          width={168}
                          height={63}
                          className='w-[140px] '

                        />
                        {/* <p className="text-sm font-semibold mt-2">952-449-1088</p> */}
                      </div>

                      <div className="text-right">
                        <h1 className="text-2xl font-bold mb-4">{inlineInvoiceData.invoiceType === 'Custom' ? inlineInvoiceData.customInvoiceType : inlineInvoiceData.invoiceType}</h1>
                        <div className="grid grid-cols-2 gap-2">
                          <Label className="text-right bg-gray-600 text-white px-3 py-2 text-sm font-semibold">Date</Label>
                          <Input
                            value={inlineInvoiceData.date}
                            onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                            className="px-3 py-2 text-sm"
                          />
                          {/* Invoice Number - Only show when editing */}
                          {editingInvoiceId && (
                            <>
                              <Label className="text-right bg-gray-600 text-white px-3 py-2 text-sm font-semibold">
                                {inlineInvoiceData.invoiceType === 'Estimate' ? 'Estimate #' : 'Invoice #'}
                              </Label>
                              <div>
                                <Input
                                  value={inlineInvoiceData.estimateNumber}
                                  onChange={(e) => {
                                    setInlineInvoiceData(prev => ({ ...prev, estimateNumber: e.target.value }))
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
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                          </svg>
                          <Label className="text-sm font-semibold">Bill To (Billing Address)</Label>
                        </div>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setInlineInvoiceData(prev => ({ ...prev, billToAddressEnabled: !prev.billToAddressEnabled }))}
                            className={`mr-2 px-3 py-1 rounded text-xs font-medium transition-colors ${inlineInvoiceData.billToAddressEnabled
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                          >
                            {inlineInvoiceData.billToAddressEnabled ? (
                              <>
                                <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Disable
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Enable
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {inlineInvoiceData.billToAddressEnabled && (
                        <Textarea
                          value={inlineInvoiceData.billToAddress || ''}
                          onChange={(e) => setInlineInvoiceData({ ...inlineInvoiceData, billToAddress: e.target.value })}
                          className="mt-0 border-0 rounded-none"
                          placeholder="Enter billing address (defaults to customer/supplier address, can be edited)"
                          rows={3}
                        />
                      )}
                      {!inlineInvoiceData.billToAddressEnabled && (
                        <div className="bg-gray-50 p-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            This address defaults to the customer/supplier address but can be changed if billing address differs from job location
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Customer Information */}

                    <div className="mb-6">
                      <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">
                        {job.type === 'contract-based' ? 'Contractor Name / Address' : 'Customer Name / Address'}
                      </Label>
                      <div className="border border-gray-300 p-4 min-h-[120px]">
                        <Input
                          value={job.type === 'contract-based'
                            ? (contractorData?.name || contractorData?.contractor_name || inlineInvoiceData.customerName)
                            : (customerData?.name || customerData?.customer_name || inlineInvoiceData.customerName)
                          }
                          onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, customerName: e.target.value }))}
                          className="mb-2 border-0 p-0 focus-visible:ring-0"
                          placeholder={job.type === 'contract-based' ? 'Contractor Name' : 'Customer Name'}
                          readOnly
                        />
                        <Textarea
                          key={`customer-address-${inlineInvoiceData.customerAddress}`}
                          value={job.type === 'contract-based' ? (contractorData?.address || contractorData?.contractor_address || inlineInvoiceData.customerAddress) : inlineInvoiceData.customerAddress}
                          onChange={(e) => {
                            setInlineInvoiceData(prev => ({ ...prev, customerAddress: e.target.value }))
                          }}
                          className="border-0 p-0 resize-none focus-visible:ring-0"
                          rows={3}
                          placeholder={job.type === 'contract-based' ? 'Contractor Address' : 'Customer Address'}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* PO and Project */}
                    <div className="mb-6">
                      <div className="grid grid-cols-3 gap-0">
                        <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">P.O. No.</Label>
                        <Label className="bg-gray-600 text-white px-3 py-2 text-center text-sm font-semibold">Project</Label>
                        <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Rep</Label>
                      </div>
                      <div className="grid grid-cols-3 gap-0">
                        <div>
                          <Input
                            value={inlineInvoiceData.poNumber}
                            onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, poNumber: e.target.value }))}
                            className="px-3 py-2 text-sm rounded-none border-t-0"
                            placeholder="PO Number"
                          />
                        </div>
                        <Input
                          value={inlineInvoiceData.project}
                          onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, project: e.target.value }))}
                          className="px-3 py-2 text-sm rounded-none border-t-0"
                        />
                        <Input
                          value={inlineInvoiceData.rep}
                          onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, rep: e.target.value }))}
                          className="px-3 py-2 text-sm rounded-none border-t-0"
                          placeholder="Rep"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="grid grid-cols-3 gap-0">
                        <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Due Date</Label>
                        <Label className="bg-gray-600 text-white px-3 py-2 text-center text-sm font-semibold">Payment / Credits</Label>
                        <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Balance Due</Label>
                      </div>
                      <div className="grid grid-cols-3 gap-0">
                        <div>
                          <Input
                            type="date"
                            value={inlineInvoiceData.dueDate}
                            onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="px-3 py-2 text-sm rounded-none border-t-0"
                          />
                        </div>
                        <Input
                          value={inlineInvoiceData.paymentCredits}
                          onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, paymentCredits: parseFloat(e.target.value) || 0 }))}
                          className="px-3 py-2 text-sm rounded-none border-t-0"
                          placeholder="Payment / Credits"
                        />
                        <Input
                          value={inlineInvoiceData.balanceDue}
                          onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, balanceDue: e.target.value }))}
                          className="px-3 py-2 text-sm rounded-none border-t-0"
                          placeholder="Balance Due"
                        />
                      </div>
                    </div>
                   
                    {/* Line Items Table */}
                    <div className="mb-6 overflow-x-auto mt-4">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-600 text-white">
                            <th className="border border-gray-300 px-3 py-2 w-16 text-sm font-semibold">Qty</th>
                            <th className="border border-gray-300 px-3 py-2 w-48 text-sm font-semibold">Item</th>
                            <th className="border border-gray-300 px-3 py-2 text-sm font-semibold">Description</th>
                            <th className="border border-gray-300 px-3 py-2 w-28 text-sm font-semibold">Rate</th>
                            <th className="border border-gray-300 px-3 py-2 w-32 text-sm font-semibold">Estimated Price</th>
                            <th className="border border-gray-300 px-3 py-2 w-28 text-sm font-semibold">Total</th>
                            <th className="border border-gray-300 px-3 py-2 w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {inlineInvoiceData.lineItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="border border-gray-300 p-1">
                                <Input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => updateInvoiceLineItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                  className="text-center border-0 p-2"
                                  min="0"
                                />
                              </td>
                              <td className="border border-gray-300 p-1 relative">
                                {item.isCustomProduct ? (
                                  <Input
                                    value={item.item}
                                    onChange={(e) => updateInvoiceLineItem(item.id, 'item', e.target.value)}
                                    className="border-0 p-2"
                                    placeholder="Enter custom item name..."
                                  />
                                ) : (
                                  <div className="relative product-search-container">
                                    <Input
                                      value={item.item}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        updateInvoiceLineItem(item.id, 'item', value)
                                        updateInvoiceLineItem(item.id, 'searchQuery', value)
                                        updateInvoiceLineItem(item.id, 'showSearchResults', true)
                                        // Direct API call on input change
                                        if (value && value.length > 2) {
                                          fetchProducts(value)
                                        }
                                      }}
                                      onFocus={() => {
                                        if (item.item) {
                                          updateInvoiceLineItem(item.id, 'searchQuery', item.item)
                                          updateInvoiceLineItem(item.id, 'showSearchResults', true)
                                        }
                                      }}
                                      className="border-0 p-2 pr-8"
                                      placeholder="Search or enter product name..."
                                    />
                                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                {!item.isCustomProduct && item.showSearchResults && item.searchQuery && (
                                  <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1">
                                    {(() => {
                                      const filtered = getFilteredProducts(item.searchQuery || '')

                                      return (
                                        <>
                                          {filtered.length > 0 ? (
                                            filtered.map(product => (
                                              <div
                                                key={product.id}
                                                onMouseDown={(e) => {
                                                  e.preventDefault()
                                                  selectProduct(item.id, product)
                                                }}
                                                className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100 transition-colors"
                                              >
                                                <div className="font-medium text-sm mb-1">{product.name}</div>
                                                <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                                  {product.description}
                                                </div>
                                                <div className="text-xs text-primary mt-2">
                                                  {product.jdpSKU} • ${product.jdpPrice.toFixed(2)}
                                                  {product.estimatedPrice && product.estimatedPrice > 0 && ` • Est: $${product.estimatedPrice.toFixed(2)}`}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="p-3">
                                              <div className="text-sm text-muted-foreground mb-2">No products found</div>
                                              <Button
                                                size="sm"
                                                onMouseDown={(e) => {
                                                  e.preventDefault()
                                                  addCustomProduct(item.id, item.searchQuery || '')
                                                }}
                                                className="w-full bg-primary hover:bg-primary/90"
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add "{item.searchQuery}"
                                              </Button>
                                            </div>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </div>
                                )}
                              </td>
                              <td className="border border-gray-300 p-1">
                                <textarea
                                  value={item.description}
                                  onChange={(e) => updateInvoiceLineItem(item.id, 'description', e.target.value)}
                                  className="border-0 p-2 w-[100%]"
                                  placeholder="Enter product description"
                                  rows={4}
                                />
                              </td>

                              <td className="border border-gray-300 p-1">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                  <Input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) => updateInvoiceLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                    className="text-right border-0 p-2 pl-6"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 p-1">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                  <Input
                                    type="number"
                                    value={item.estimatedPrice || ""}
                                    onChange={(e) => updateInvoiceLineItem(item.id, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                                    className="text-right border-0 p-2 pl-6"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 p-2 text-right">
                                ${(item.total || 0).toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-1 text-center">
                                {inlineInvoiceData.lineItems.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeInvoiceLineItem(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {/* Subtotal Row */}
                          <tr>
                            <td colSpan={5} className="border border-gray-300 p-2"></td>
                            <td className="border border-gray-300 p-2 text-right font-bold">
                              ${calculateInvoiceSubtotal().toFixed(2)}
                            </td>
                            <td className="border border-gray-300 p-1"></td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Add Buttons */}
                      <div className="mt-4 flex gap-3">
                        <Button
                          onClick={addInvoiceLineItem}
                          variant="outline"
                          className="border-dashed border-2 border-primary text-primary hover:bg-primary/5"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Line Item
                        </Button>
                        <Button
                          onClick={addCustomLineItem}
                          variant="outline"
                          className="border-dashed border-2 border-green-500 text-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom
                        </Button>
                      </div>
                      {invoiceValidationErrors.lineItems && (
                        <p className="text-red-500 text-xs mt-2">{invoiceValidationErrors.lineItems}</p>
                      )}
                    </div>

                    {/* Notes Section */}
                    <div className="mb-6 overflow-x-auto">
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-3 bg-white text-sm" style={{ minHeight: '120px' }}>
                              <Textarea
                                value={inlineInvoiceData.notes}
                                onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full min-h-[100px] border-0 p-0 focus-visible:ring-0 resize-none"
                                placeholder="NOTES&#10;JDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE"
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
                          JDP is not responsible for repair of lamps & landscaping, house owner utilities including
                          cables, sprinkler systems, television or telephone cables, etc. that may be cut or damaged
                          during installation. Price are subject to change prior to receipt of down payment.
                        </p>
                      </div>
                      <div className="flex justify-end mt-4">
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold">Total</span>
                            <span className="text-2xl font-bold">
                              ${calculateInvoiceSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='text-center text-sm text-blue-500 font-bold'>
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
                            <div className="text-sm font-medium text-gray-700 mb-1">Customer Acceptance</div>
                            <div className="text-sm font-medium text-gray-700">Authorized Signature</div>
                          </div>
                          <div className="text-sm font-medium text-gray-700">Date</div>
                        </div>

                        {/* Signature Fields */}
                        <div className="flex justify-between items-center mb-5">
                          <div className="flex flex-col w-3/5">
                            <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                            <div className="text-xs text-gray-700 text-center">Signature</div>
                          </div>
                          <div className="flex flex-col w-1/3">
                            <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                            <div className="text-xs text-gray-700 text-center">Date</div>
                          </div>
                        </div>

                        {/* Disclaimer Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-5">
                          <div className="text-xs text-gray-700 leading-relaxed">
                            By signing above, you agree to the terms and pricing outlined in this estimate. This becomes a binding agreement upon signature.
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Action Buttons */}
                  <div className="border-t bg-gray-50 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowInlineInvoiceForm(false)
                          setEditingInvoiceId(null)
                          setInvoiceValidationErrors({})

                          // Reset form data
                          setInlineInvoiceData({
                            date: new Date().toISOString().split('T')[0],
                            estimateNumber: '',
                            customerName: job.customerName || '',
                            customerAddress: job.address || '',
                            billToAddress: job.billToAddress || '',
                            billToAddressEnabled: true,
                            poNumber: '',
                            project: job.title || '',
                            rep: '',
                            dueDate: '',
                            paymentCredits: 0,
                            balanceDue: '',
                            lineItems: [{
                              id: Math.random().toString(36).substring(2, 9),
                              productId: null,
                              qty: 1,
                              item: '',
                              description: '',
                              rate: 0,
                              estimatedPrice: 0,
                              total: 0,
                              searchQuery: '',
                              showSearchResults: false,
                              supplierId: 1,
                              isCustomProduct: false,
                              estimate_product_id: null
                            }],
                            notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
                            signatureText: 'ACCEPTED BY________________DATE_____',
                            invoiceType: 'Estimate',
                            customInvoiceType: '',
                            paymentPercentage: 0,
                            estimateTotal: 0,
                            paymentHistory: [] as any[]
                          })
                        }}
                        className="border-gray-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <div className="flex gap-3">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : estimates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices found for this job</p>
                </div>
              ) : (
                estimates.map((invoice: any) => (
                  <div key={invoice.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow bg-gradient-to-r from-white to-gray-50/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-foreground">{invoice.invoice_type || 'Estimate'}</h4>
                            <Badge className={`${getInvoiceTypeColor(invoice.invoice_type)} text-xs font-medium`} variant="outline">
                              {invoice.invoice_type || 'Estimate'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{invoice.description || invoice.estimate_title}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>#{invoice.invoice_number}</span>
                            <span>Created : {formatDate(invoice.estimate_date || invoice.created_at)}</span>
                            <span>Updated : {formatDate(invoice.updated_at || invoice.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-lg text-foreground">{formatCurrency(invoice.total_amount || 0)}</p>
                          <Badge className={getStatusBadgeColor(invoice.status)} variant="outline">
                            {invoice.status || 'draft'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {invoice.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            className="text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateInvoice(invoice)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Duplicate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalEstimates > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEstimates)} of {totalEstimates} invoices
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoadingEstimates}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {Math.ceil(totalEstimates / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= Math.ceil(totalEstimates / itemsPerPage) || isLoadingEstimates}
                  >
                    Next
                  </Button>
                </div>
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
              {/* <span className="text-sm text-gray-600">
                Total Cost: <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
                {materials.length > 0 && (
                  <span className="ml-2 text-green-600">
                    ({materials.length} from Bluesheets)
                  </span>
                )}
              </span> */}
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddMaterialModal(true)}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMaterials ? (
              <p className="flex items-center justify-center py-16"> <LoadingSpinner /></p>
            ) : materials.length === 0 ? (
              <p className="text-sm text-gray-500">No materials found.</p>
            ) : (
              <div className="space-y-4">
                {materials.map((material: any, index: number) => (
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
                        <p className="text-xs text-gray-600">
                          {material.supplier?.company_name || material.supplier} • SKU: {material.supplier_sku || material.jdp_sku} • {material.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          Unit Cost: ${ material.unit_cost || 0}  
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
                Total Hours: <span className="font-bold"> {(() => {
                            let totalHours = 0;
                            bluesheets.forEach((bluesheet: any) => {
                              if (bluesheet.labor_entries) {
                                bluesheet.labor_entries.forEach((entry: any) => {
                                  const hours = parseFloat(entry.regular_hours?.replace('h', '') || '0');
                                  totalHours += hours;
                                });
                              }
                            });
                            return `${totalHours}h`;
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
              {/* Show bluesheets labor entries */}
              {bluesheets && bluesheets.length > 0 && (
                <> 
                  {bluesheets.map((bluesheet: any, bluesheetIndex: number) => (
                    <div key={`bluesheet-${bluesheet.id}`} className="mb-6 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-center mb-3">
                        {/* <h5 className="font-medium text-gray-800">
                          Bluesheet #{bluesheet.id} - {bluesheet.date}
                        </h5> */}
                        <div className="text-sm text-gray-600">
                          Created by: {bluesheet.created_by_user?.full_name || 'Unknown'}
                        </div>
                      </div>
                      
                      {bluesheet.labor_entries && bluesheet.labor_entries.length > 0 && (
                        <div className="space-y-3">
                          {bluesheet.labor_entries.map((entry: any, entryIndex: number) => (
                            <div key={`entry-${entry.id}`} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-700" />
                                </div>
                                <div>
                                  <h6 className="font-medium">
                                    {entry.role === 'lead_labor' ? 'Lead Labor' : 'Labor'}
                                  </h6>
                                  <p className="text-sm text-gray-600">
                                    {entry.employee_name || entry.labor?.users?.full_name || entry.lead_labor?.users?.full_name || 'Unknown Labor'}
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
                                  {/* <p className="text-sm text-gray-600">
                                    Overtime: {entry.overtime_hours || '0h'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Total: {entry.total_hours || '0h'}
                                  </p> */}
                                  {/* <p className="text-sm text-gray-600">
                                    Rate: ${entry.hourly_rate || 0}/hr
                                  </p> */}
                                  {/* <p className="font-semibold">
                                    Total Cost: ${entry.total_cost || 0}
                                  </p> */}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    entry.role === 'lead_labor' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {entry.role === 'lead_labor' ? 'Lead' : 'Labor'}
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

              {/* Show message if no labor at all */}
              {(!bluesheets || bluesheets.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No labor entries found in bluesheets</p>
                  </div>
                )}


            </div>
          </CardContent>
        </Card>

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
            {/* Product Search */}
            <div>
              <Label className="mb-2">Search Product</Label>
              <div className="relative">
                <Input
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  placeholder="Type to search products..."
                  className="pr-10"
                />
                {isSearchingProducts && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {productSearchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {productSearchResults.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="font-medium">{product.product_name || product.name}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {product.sku || product.supplier_sku || 'N/A'} • Unit: {product.unit || 'N/A'} • Cost: ${product.unit_cost || product.price || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="bg-green-50 p-3 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Selected Product</span>
                </div>
                <div className="text-sm">
                  <div><strong>Name:</strong> {selectedProduct.product_name || selectedProduct.name}</div>
                  <div><strong>SKU:</strong> {selectedProduct.sku || selectedProduct.supplier_sku || 'N/A'}</div>
                  <div><strong>Stock Quantity:</strong> {selectedProduct.stock_quantity || 0}</div>
                  <div><strong>Unit:</strong> {selectedProduct.unit || 'N/A'}</div>
                  <div><strong>Unit Cost:</strong> ${selectedProduct.unit_cost || selectedProduct.price || 0}</div>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <Label className="mb-2">Date</Label>
              <Input
                type="date"
                value={materialFormData.date}
                onChange={(e) => setMaterialFormData({ ...materialFormData, date: e.target.value })}
              />
            </div>

            {/* <div className="grid grid-cols-2 gap-4"> 
              <div>
                <Label className="mb-2">Quantity</Label>
                <Input
                  type="number"
                  value={materialFormData.quantity}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
               
              <div>
                <Label className="mb-2">Unit</Label>
                <Input
                  value={materialFormData.unit}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div> */}

            <div className="grid grid-cols-2 gap-4">
              {/* Total Ordered */}
              <div>
                <Label className="mb-2">Total Ordered</Label>
                <Input
                  type="number"
                  value={materialFormData.total_ordered === 0 ? "" : materialFormData.total_ordered}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, total_ordered: Number(e.target.value) })}
                />
              </div>
              
              {/* Material Used */}
              <div>
                <Label className="mb-2">Material Used</Label>
                <Input
                  type="number"
                  value={materialFormData.material_used === 0 ? "" : materialFormData.material_used}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, material_used: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Supplier Order ID */}
              {/* <div>
                <Label className="mb-2">Supplier Order ID</Label>
                <Input
                  value={materialFormData.supplier_order_id}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, supplier_order_id: e.target.value })}
                  placeholder="e.g., SO-2025-001"
                />
              </div> */}
              
              {/* Unit Cost */}
             
            </div>

            {/* Return to Warehouse Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="return_to_warehouse"
                checked={materialFormData.return_to_warehouse}
                onChange={(e) => setMaterialFormData({ ...materialFormData, return_to_warehouse: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="return_to_warehouse" className="text-sm font-medium">
                Return to Warehouse
              </Label>
            </div>

            {/* Total Cost Display */}
            {/* <div className='bg-blue-100 p-3 border border-blue-300 rounded flex items-center gap-2'>
              <Building className='w-4 h-4' />
              <Label>Total Cost: ${(materialFormData.quantity * materialFormData.unit_cost).toFixed(2)}</Label>
            </div> */}
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
            {/* Labor Selection */}
            <div className="labor-dropdown">
              <Label className="mb-2">Select Labor *</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search and select labor..."
                  value={laborInputValue}
                  onChange={(e) => {
                    const searchQuery = e.target.value;
                    setLaborInputValue(searchQuery);
                    
                    if (searchQuery === '') {
                      setTimeLogFormData({ 
                        ...timeLogFormData, 
                        selectedLabor: null 
                      });
                      setShowLaborDropdown(false);
                    } else {
                      // Trigger search when user types
                      searchLabor(searchQuery);
                    }
                  }}
                  onFocus={() => setShowLaborDropdown(true)}
                  disabled={timeLogModalMode === 'view' || !!timeLogFormData.selectedLeadLabor}
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
                                selectedLeadLabor: null // Disable lead labor when labor is selected
                              });
                              setLaborInputValue(labor.users?.full_name || labor.labor_code);
                              setShowLaborDropdown(false);
                            }}
                          >
                            <span className="text-sm font-medium">
                              {labor.users?.full_name || labor.labor_code} - {labor.labor_code}
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
                <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.laborSelection}</p>
              )}
            </div>

            {/* Lead Labor Selection */}
            <div className="lead-labor-dropdown">
              <Label className="mb-2">Select Lead Labor *</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search and select lead labor..."
                  value={leadLaborInputValue}
                  onChange={(e) => {
                    const searchQuery = e.target.value;
                    setLeadLaborInputValue(searchQuery);
                    
                    if (searchQuery === '') {
                      setTimeLogFormData({ 
                        ...timeLogFormData, 
                        selectedLeadLabor: null 
                      });
                      setShowLeadLaborDropdown(false);
                    } else {
                      // Trigger search when user types
                      searchLeadLabor(searchQuery);
                    }
                  }}
                  onFocus={() => setShowLeadLaborDropdown(true)}
                  disabled={timeLogModalMode === 'view' || !!timeLogFormData.selectedLabor}
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
                                selectedLabor: null // Disable labor when lead labor is selected
                              });
                              setLeadLaborInputValue(labor.users?.full_name || labor.labor_code);
                              setShowLeadLaborDropdown(false);
                            }}
                          >
                            <span className="text-sm font-medium">
                              {labor.users?.full_name || labor.labor_code} - {labor.labor_code}
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
                <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.laborSelection}</p>
              )}
            </div>
            </div>
            {/* Date Selection */}
            <div>
              <Label className="mb-2">Date *</Label>
              <Input
                type="date"
                value={timeLogFormData.date}
                onChange={(e) => setTimeLogFormData({ ...timeLogFormData, date: e.target.value })}
                disabled={timeLogModalMode === 'view'}
              />
              {timeLogValidationErrors.date && (
                <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.date}</p>
              )}
            </div>

            {/* Hours Worked */}
            <div>
              <Label className="mb-2">Hours Worked *</Label>
              <Input
                type="text" 
                value={timeLogFormData.hoursWorked}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  setTimeLogFormData({ ...timeLogFormData, hoursWorked: timeValue });
                }}
                onBlur={(e) => {
                  const timeValue = e.target.value;
                  // Convert decimal hours to HH:MM:SS format only on blur
                  if (timeValue && !isNaN(parseFloat(timeValue)) && !timeValue.includes(':')) {
                    const hours = parseFloat(timeValue);
                    const h = Math.floor(hours);
                    const decimalPart = hours - h;
                    const m = Math.round(decimalPart * 60);
                    const s = 0;
                    const formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                    setTimeLogFormData({ ...timeLogFormData, hoursWorked: formattedTime });
                  }
                }}
                placeholder="Enter hours worked"
                disabled={timeLogModalMode === 'view'}
              />
              {timeLogValidationErrors.hoursWorked && (
                <p className="text-red-500 text-xs mt-1">{timeLogValidationErrors.hoursWorked}</p>
              )}
            </div>

            {/* Description */}
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
        <DialogContent className="w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice && `${selectedInvoice.invoice_type?.charAt(0).toUpperCase() + selectedInvoice.invoice_type?.slice(1).replace('_', ' ')} - ${selectedInvoice.invoice_number}`}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-primary">Invoice Information</Label>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Type:</span> {selectedInvoice.invoice_type?.charAt(0).toUpperCase() + selectedInvoice.invoice_type?.slice(1).replace('_', ' ')}</p>
                    <p><span className="font-medium">Number:</span> {selectedInvoice.invoice_number}</p>
                    <p><span className="font-medium">Amount:</span> {formatCurrency(selectedInvoice.total_amount)}</p>
                    <p><span className="font-medium">Status:</span>
                      <Badge className={`ml-2 ${getStatusBadgeColor(selectedInvoice.status)}`} variant="outline">
                        {selectedInvoice.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-primary">Dates</Label>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Created:</span> {formatDate(selectedInvoice.created_at)}</p>
                    {selectedInvoice.due_date && (
                      <p><span className="font-medium">Due Date:</span> {formatDate(selectedInvoice.due_date)}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-primary">Description</Label>
                <p className="mt-2 p-4 bg-gray-50 rounded-lg">{selectedInvoice.notes}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowInvoiceModal(false)
              setSelectedInvoice(null)
            }}>
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

      {/* Invoice Preview Modal */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="min-w-[80%] max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gray-100 p-6">
            {/* Print-ready Invoice Design */}
            <div id="invoice-preview-print" className="bg-white p-8 shadow-lg" style={{ width: '14.5in', margin: '0 auto' }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  {/* <Logo /> */}
                  <Image
                    src='/assets/logos/logo-jdp.png'
                    alt="logo"
                    width={168}
                    height={63}
                    className='w-[140px] '

                  />
                  <p className="text-sm text-gray-600 mt-2">952-449-1088</p>
                  {/* Invoice Number Display */}

                </div>
                <div className="text-right">
                  <div className="text-center flex justify-center items-center">
                    <div className="text-lg font-bold bg-gray-800 text-white p-[14px] w-[200px]">Date</div>
                    <div className="text-sm border border-gray-800 p-[17px] w-[200px]">{new Date(inlineInvoiceData.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                  </div>
                  <div className="text-center mb-2 flex justify-center items-center">
                    <div className="text-lg font-bold bg-gray-800 text-white p-[14px] w-[200px]">{(inlineInvoiceData.invoiceType === 'Custom' ? inlineInvoiceData.customInvoiceType : inlineInvoiceData.invoiceType) || 'ESTIMATE'} #</div>
                    <div className="text-sm border border-gray-800 p-[17px] w-[200px]">{InvoioiceNumber}</div>
                  </div>
                </div>
              </div>
              {inlineInvoiceData.billToAddressEnabled && (
                <>
                  <div className="bg-gray-800 text-white p-3 mb-4">
                    <div className="text-sm font-bold ">Bill TO</div>
                  </div>
                  {inlineInvoiceData.billToAddress && (
                    <div className="text-gray-600 mt-2 font-medium border border-gray-800 p-3"> {inlineInvoiceData.billToAddress}</div>
                  )}
                </>
              )}
              {/* To Section */}
              <div className="bg-gray-800 text-white p-3 mb-4 mt-4">
                <div className="text-sm font-bold">TO</div>
              </div>
              <div className="mb-6 border border-gray-800 p-3">
                <div className="font-semibold">
                  {job.type === 'contract-based' 
                    ? (contractorData?.name || contractorData?.contractor_name  || 'Contractor')
                    : (customerData?.customer_name || customerData?.company_name || inlineInvoiceData.customerName || 'Customer')
                  }
                </div>
                <div className="text-gray-600">
                  {job.type === 'contract-based' 
                    ? (contractorData?.address || inlineInvoiceData.customerAddress || '')
                    : (customerData?.address || inlineInvoiceData.customerAddress || '')
                  }
                </div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm font-semibold border border-gray-800 p-3">P.O. No.</div>
                  <div className="text-gray-600 border border-gray-800 p-3">{inlineInvoiceData.poNumber}</div>
                </div>
                <div>
                  <div className="bg-gray-800 text-white text-sm font-semibold border border-gray-800 p-3">Project</div>
                  <div className="text-gray-600 border border-gray-800 p-3">{inlineInvoiceData.project}</div>
                </div>
              </div>

              {/* Rep and Due Date */}
              <div className="mb-4">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Rep</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">{inlineInvoiceData.rep || 'JDP'}</td>
                      <td className="border border-gray-300 px-3 py-2">{inlineInvoiceData.dueDate || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="border border-gray-300 px-3 py-2 text-left">Qty</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Item</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                      <th className="border border-gray-300 px-3 py-2 text-right">Rate</th>
                      <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inlineInvoiceData.lineItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">{item.qty}</td>
                        <td className="border border-gray-300 px-3 py-2 font-medium">{item.item}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">{item.description}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right">${(item.rate || 0).toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right font-medium">${(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Subtotal */}
                <div className="flex justify-end mt-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">${calculateInvoiceSubtotal().toFixed(2)}</div>
                  </div>
                </div>

                {/* Payments/Credits and Balance Due */}
                <div className="flex justify-end mt-4">
                  <div className="text-right w-64">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Payments / Credits:</span>
                      <span className="text-sm text-gray-600">${(inlineInvoiceData.paymentCredits || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between bg-gray-100 p-2 rounded">
                      <span className="font-bold text-sm">Balance Due:</span>
                      <span className="font-bold text-sm">${(calculateInvoiceSubtotal() - (inlineInvoiceData.paymentCredits || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="border-t pt-4 mb-6">
                <div className="bg-gray-100 p-3 rounded text-center">
                  <div className="text-sm font-medium whitespace-pre-line">{inlineInvoiceData.notes || 'Final payment to complete project billing'}</div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-xs text-gray-600 mb-6">
                <p className="mb-2">
                  JDP is not responsible for repair of lamps & landscaping, house owner utilities including cables,
                  sprinkler systems, television or telephone cables, etc. that may be cut or damaged during installation.
                  Price are subject to change prior to receipt of down payment.
                </p>
              </div>

              {/* Total and Contact */}
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-4">Total ${calculateInvoiceSubtotal().toFixed(2)}</div>
                <div className="text-sm text-blue-600">
                  EMAIL: jen@jdpelectric.us 952-449-1088
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
                      <div className="text-sm font-medium text-gray-700 mb-1">Customer Acceptance</div>
                      <div className="text-sm font-medium text-gray-700">Authorized Signature</div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">Date</div>
                  </div>

                  {/* Signature Fields */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex flex-col w-3/5">
                      <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                      <div className="text-xs text-gray-700 text-center">Signature</div>
                    </div>
                    <div className="flex flex-col w-1/3">
                      <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                      <div className="text-xs text-gray-700 text-center">Date</div>
                    </div>
                  </div>

                  {/* Disclaimer Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-5">
                    <div className="text-xs text-gray-700 leading-relaxed">
                      By signing above, you agree to the terms and pricing outlined in this estimate. This becomes a binding agreement upon signature.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex justify-center gap-4 p-6 bg-gray-50 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewDialog(false)
                // Reset form when closing preview
                if (!editingInvoiceId) {
                  setShowInlineInvoiceForm(false)
                  setEditingInvoiceId(null)
                  setInvoiceValidationErrors({})

                  setInlineInvoiceData({
                    date: new Date().toISOString().split('T')[0],
                    estimateNumber: '',
                    customerName: job.customerName || '',
                    customerAddress: job.address || '',
                    billToAddress: job.billToAddress || '',
                    billToAddressEnabled: true,
                    poNumber: '',
                    project: job.title || '',
                    rep: '',
                    dueDate: '',
                    paymentCredits: 0,
                    balanceDue: '',
                    lineItems: [{
                      id: Math.random().toString(36).substring(2, 9),
                      productId: null,
                      qty: 1,
                      item: '',
                      description: '',
                      rate: 0,
                      estimatedPrice: 0,
                      total: 0,
                      searchQuery: '',
                      showSearchResults: false,
                      supplierId: 1,
                      isCustomProduct: false,
                      estimate_product_id: null
                    }],
                    notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
                    signatureText: 'ACCEPTED BY________________DATE_____',
                    invoiceType: 'Estimate',
                    customInvoiceType: '',
                    paymentPercentage: 0,
                    estimateTotal: 0,
                    paymentHistory: [] as any[]
                  })
                }
              }}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
             
            <Button
              onClick={handleSendFromPreview}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-900 text-white flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  )
}

export default JobDetailsPage

