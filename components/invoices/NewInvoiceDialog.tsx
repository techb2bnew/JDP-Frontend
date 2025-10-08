import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Invoice, InvoiceItem, LaborEntry, AdditionalCost } from '../../types/invoice'
import { customersData, jobsData } from '../../data/invoiceData'
import { toast } from "sonner"
import { addInvoice } from '@/redux/slices/jobsSlice'
import { apiClient } from '@/utils/api'
import { useDispatch } from 'react-redux'
// import { formatCurrency, formatDate } from '../../utils/invoiceUtils'

interface NewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (invoice: Partial<Invoice>) => void
  jobs: any[];
  jobId?: number;
onInvoiceSaved?: (invoice: any) => void;
  
  
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

  additional_cost: {
    description: string;
    amount: number;
  };

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
    job_id:number;
    is_custom: boolean;
    unit_cost: number;
  }[];
}



export const NewInvoiceDialog = ({ open, onOpenChange, onSave, jobId, jobs, onInvoiceSaved }: NewInvoiceDialogProps) => {
  console.log('trsting jobs', jobs);
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localJobs, setLocalJobs] = useState<any[]>(jobs || []);



  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const dispatch = useDispatch();
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerId: "",
    jobId: jobId || undefined,
    type: "proposal_invoice",
    issueDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    items: [],
    labor: [],
    additionalCosts: [],
    notes: "",
    taxRate: 0.08,
    priority: "medium",
  });




  const itemsTotal = newInvoice.items?.reduce((sum, i) => sum + i.total, 0) || 0
  const laborTotal = newInvoice.labor?.reduce((sum, l) => sum + l.total, 0) || 0
  const additionalTotal = newInvoice.additionalCosts?.reduce((sum, c) => sum + c.amount, 0) || 0

  const subtotal = itemsTotal + laborTotal + additionalTotal;
  const taxAmount = subtotal * (newInvoice.taxRate || 0);
  const totalAmount = subtotal + taxAmount;





  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}`,
      sku: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setNewInvoice((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }))
  }

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updatedItems = [...(newInvoice.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].total =
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    if (field === "total") {
      updatedItems[index].total = value;
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
      total: 0,
      description: "",
    }
    setNewInvoice((prev) => ({
      ...prev,
      labor: [...(prev.labor || []), newLabor],
    }))
  }

  const updateLaborEntry = (
    index: number,
    field: keyof LaborEntry,
    value: any
  ) => {
    const updatedLabor = [...(newInvoice.labor || [])];
    updatedLabor[index] = { ...updatedLabor[index], [field]: value };

    if (field === "hours" || field === "hourlyRate") {
      updatedLabor[index].total =
        updatedLabor[index].hours * updatedLabor[index].hourlyRate;
    }

    if (field === "total") {
      updatedLabor[index].total = value;
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
    }))
  }

  const updateAdditionalCost = (
    index: number,
    field: "description" | "amount",
    value: any
  ) => {
    const updatedCosts = [...(newInvoice.additionalCosts || [])]
    updatedCosts[index] = { ...updatedCosts[index], [field]: value }
    setNewInvoice((prev) => ({ ...prev, additionalCosts: updatedCosts }))
  }

  const removeAdditionalCost = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts?.filter((_, i) => i !== index),
    }))
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep(prev => prev + 1)
  }


  const validateStep = (step: number) => {
    let stepErrors: Record<string, string> = {}

    if (step === 1) {
      if (!newInvoice.customerId) stepErrors.customerId = "Customer is required"
      if (!newInvoice.jobId) stepErrors.jobId = "Job is required"
      if (!newInvoice.type) stepErrors.type = "Invoice type is required"
      if (!newInvoice.issueDate) stepErrors.issueDate = "Issue date is required"
      if (!newInvoice.dueDate) stepErrors.dueDate = "Due date is required"
    }

    if (step === 2 && (newInvoice.items?.length || 0) > 0) {
      newInvoice.items!.forEach((item, i) => {
        if (!item.sku) stepErrors[`item_${i}_sku`] = `Item ${i + 1}: SKU required`
        if (!item.description) stepErrors[`item_${i}_desc`] = `Item ${i + 1}: Description required`
        if (item.quantity <= 0) stepErrors[`item_${i}_qty`] = `Item ${i + 1}: Quantity must be > 0`
        if (item.unitPrice <= 0) stepErrors[`item_${i}_price`] = `Item ${i + 1}: Unit price must be > 0`
      })
    }

    if (step === 3 && (newInvoice.labor?.length || 0) > 0) {
      newInvoice.labor!.forEach((labor, i) => {
        if (!labor.laborName) stepErrors[`labor_${i}_name`] = `Labor ${i + 1}: Name required`
        if (labor.hours <= 0) stepErrors[`labor_${i}_hours`] = `Labor ${i + 1}: Hours must be > 0`
        if (labor.hourlyRate <= 0) stepErrors[`labor_${i}_rate`] = `Labor ${i + 1}: Hourly rate must be > 0`
      })
    }

    if (step === 4 && (newInvoice.additionalCosts?.length || 0) > 0) {
      newInvoice.additionalCosts!.forEach((cost, i) => {
        if (!cost.description) stepErrors[`cost_${i}_desc`] = `Cost ${i + 1}: Description required`
        if (cost.amount <= 0) stepErrors[`cost_${i}_amt`] = `Cost ${i + 1}: Amount must be > 0`
      })
    }


    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

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
        is_custom: true,
        unit_cost: i.unitPrice,
      })) || [];

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
            amount: newInvoice.additionalCosts.reduce((sum, c) => sum + c.amount, 0),
          }
        : { description: "", amount: 0 },

      custom_labor: laborPayload,
      custom_products: productsPayload,
    };

    const createdInvoice = await apiClient.createEstimate(payload);
    dispatch(addInvoice(createdInvoice));
    toast.success("Invoice created successfully!");
    onOpenChange(false);

    onInvoiceSaved?.(createdInvoice);

    // Reset invoice
    setNewInvoice({
      customerId: "",
      jobId: undefined,
      type: "proposal_invoice",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
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
    setNewInvoice(prev => ({ ...prev, jobId }))
  }, [jobId])

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true)
      try {
        const res = await apiClient.getAllCustomers()
        setCustomers(res.data.customers || [])
      } catch (err) {
        console.error("Error fetching customers:", err)
      } finally {
        setLoadingCustomers(false)
      }
    }
    fetchCustomers()
  }, [])


  // useEffect(() => {
  //   const fetchJobs = async () => {
  //     // setLoadingJobs(true);
  //     try {
  //       const res = await apiClient.getJobs();  
  //       console.log(res,)
  //       setJobs(res.data.data || []);
  //     } catch (err) {
  //       console.error("Error fetching jobs:", err);
  //     // } finally {
  //     //   setLoadingJobs(false);
  //     // }
  //   };
  //   fetchJobs();
  // }, []);

  // useEffect(() => {
  //   const fetchJobs = async () => {
  //     try {
  //       const res = await apiClient.getJobs();
  //       console.log('jonsjobssss', res);
  //       setLocalJobs(res.data?.data?.jobs || []);
  //     } catch (err) {
  //       console.error("Error fetching jobs:", err);
  //     }
  //   }
  //   fetchJobs();
  // }, []);

  // console.log(jobs,"jobsss")


console.log("jobs:", jobs);
console.log("Matching job:", jobs.find((j) => j.id === String(jobId)));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 6: Create a comprehensive invoice for your project
          </DialogDescription>
        </DialogHeader>

        <Tabs value={`step-${currentStep}`} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger className={`${currentStep === 1 ? 'bg-primary text-white' : ''}`} value="step-1" onClick={() => setCurrentStep(1)}>Basic Info</TabsTrigger>
            <TabsTrigger className={`${currentStep === 2 ? 'bg-primary text-white' : ''}`} value="step-2" onClick={() => setCurrentStep(2)}>Items</TabsTrigger>
            <TabsTrigger className={`${currentStep === 3 ? 'bg-primary text-white' : ''}`} value="step-3" onClick={() => setCurrentStep(3)}>Labor</TabsTrigger>
            <TabsTrigger className={`${currentStep === 4 ? 'bg-primary text-white' : ''}`} value="step-4" onClick={() => setCurrentStep(4)}>Additional</TabsTrigger>
            <TabsTrigger className={`${currentStep === 5 ? 'bg-primary text-white' : ''}`} value="step-5" onClick={() => setCurrentStep(5)}>Review</TabsTrigger>
            <TabsTrigger className={`${currentStep === 6 ? 'bg-primary text-white' : ''}`} value="step-6" onClick={() => setCurrentStep(6)}>Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="step-1" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">

              {/* Customer Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={newInvoice.customerId?.toString()}
                  onValueChange={(value) => {
                    const newCustomerId = Number(value);

                    setNewInvoice((prev:any) => {
                      const validJobs = jobs.filter(
                        (job) => Number(job.customerId) === newCustomerId
                      );
                      const isJobStillValid = validJobs.some(
                        (job) => job.id === prev.jobId
                      );

                      return {
                        ...prev,
                        customerId: newCustomerId,
                        jobId: isJobStillValid ? prev.jobId : undefined,
                      };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.customer_name}{" "}
                        {customer.company_name ? `- ${customer.company_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId}</p>}

              </div>


              {/* Job Field */}
              <div className="space-y-2">
                <Label htmlFor="job">Job</Label>

                {jobId ? (
                  <>
                    <Input
                      value={jobs.find((j) => j.id === String(jobId))?.title || ""}
                      disabled
                    />
                    {newInvoice.jobId !== jobId && setNewInvoice(prev => ({ ...prev, jobId: jobId }))}
                  </>
                ) : (
                  <Select
                    value={newInvoice.jobId ? newInvoice.jobId.toString() : undefined}
                    onValueChange={(value) =>
                      setNewInvoice((prev) => ({ ...prev, jobId: Number(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Job" />
                    </SelectTrigger>

                    <SelectContent>
                      {jobs
                        .map((job) => (
                          <SelectItem key={job.id} value={job.id.toString()}>
                            {job.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {errors.jobId && (
                  <p className="text-red-500 text-sm">{errors.jobId}</p>
                )}
              </div>









              {/* Invoice Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Invoice Type</Label>
                <Select
                  value={newInvoice.type}
                  onValueChange={(value: any) =>
                    setNewInvoice((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="proposal_invoice">Proposal</SelectItem>
                    <SelectItem value="progressive_invoice">Progressive</SelectItem>
                    <SelectItem value="final_invoice">Final</SelectItem>
                  </SelectContent>

                </Select>
                {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
              </div>

              {/* Tax Rate */}
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    newInvoice.taxRate && newInvoice.taxRate !== 0
                      ? (newInvoice.taxRate * 100).toString()
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewInvoice((prev) => ({
                      ...prev,
                      taxRate: val === "" ? 0 : parseFloat(val) / 100,
                    }));
                  }}
                  placeholder="Enter tax rate"
                />

                {errors.taxRate && <p className="text-red-500 text-sm">{errors.taxRate}</p>}

              </div>

              {/* Issue Date */}
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  type="date"
                  value={newInvoice.issueDate}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({ ...prev, issueDate: e.target.value }))
                  }
                />
                {errors.issueDate && <p className="text-red-500 text-sm">{errors.issueDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
                {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate}</p>}
              </div>
            </div>
          </TabsContent>


          {/* <TabsContent value="step-1" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select 
                  value={newInvoice.customerId} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersData.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job">Job</Label>
                <Select 
                  value={newInvoice.jobId} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, jobId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobsData.filter(job => !newInvoice.customerId || job.customerId === newInvoice.customerId).map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Invoice Type</Label>
                <Select 
                  value={newInvoice.type} 
                  onValueChange={(value: any) => setNewInvoice(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="roughen">Roughen</SelectItem>
                    <SelectItem value="progressive">Progressive</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={(newInvoice.taxRate || 0) * 100} 
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) / 100 }))}
                  placeholder="8.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input 
                  type="date" 
                  value={newInvoice.issueDate} 
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  type="date" 
                  value={newInvoice.dueDate} 
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent> */}

          <TabsContent value="step-2" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items/Materials</h3>
              <Button onClick={addInvoiceItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

      <div className="space-y-3">
  {(newInvoice.items ?? []).length > 0 ? (
    (newInvoice.items ?? []).map((item, index) => (
      <Card key={item.id}>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={item.sku}
                maxLength={20}
                onChange={(e) =>
                  updateInvoiceItem(index, "sku", e.target.value.slice(0, 10))
                }
                placeholder="SKU-001"
              />
              {errors[`item_${index}_sku`] && (
                <p className="text-red-500 text-sm">
                  {errors[`item_${index}_sku`]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={item.description}
                maxLength={20}
                onChange={(e) =>
                  updateInvoiceItem(index, "description", e.target.value)
                }
                placeholder="Item description"
              />
              {errors[`item_${index}_desc`] && (
                <p className="text-red-500 text-sm">
                  {errors[`item_${index}_desc`]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity === 0 ? "" : item.quantity}
                onChange={(e) =>
                  updateInvoiceItem(
                    index,
                    "quantity",
                    e.target.value === "" ? 0 : parseInt(e.target.value)
                  )
                }
                placeholder="0"
              />
              {errors[`item_${index}_qty`] && (
                <p className="text-red-500 text-sm">
                  {errors[`item_${index}_qty`]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                step="0.01"
                value={item.unitPrice === 0 ? "" : item.unitPrice}
                onChange={(e) =>
                  updateInvoiceItem(
                    index,
                    "unitPrice",
                    e.target.value === "" ? 0 : parseFloat(e.target.value)
                  )
                }
                placeholder="0.00"
              />
              {errors[`item_${index}_price`] && (
                <p className="text-red-500 text-sm">
                  {errors[`item_${index}_price`]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Total</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={item.total === 0 ? "" : item.total}
                  onChange={(e) =>
                    updateInvoiceItem(
                      index,
                      "total",
                      e.target.value === "" ? 0 : parseFloat(e.target.value)
                    )
                  }
                  placeholder="0.00"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeInvoiceItem(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )) 
  ) : (
    <p className="text-center text-muted-foreground py-8">
      No items added yet
    </p>
  )}
</div>


          </TabsContent>


          <TabsContent value="step-3" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Labor</h3>
              <Button onClick={addLaborEntry} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Labor
              </Button>
            </div>

            <div className="space-y-3">
  {(newInvoice.labor ?? []).length > 0 ? (
    (newInvoice.labor ?? []).map((labor, index) => (
      <Card key={labor.id}>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Labor Name</Label>
              <Input
                value={labor.laborName}
                maxLength={20}
                onChange={(e) =>
                  updateLaborEntry(index, "laborName", e.target.value.slice(0, 20))
                }
                placeholder="Worker name"
              />
              {errors[`labor_${index}_name`] && (
                <p className="text-red-500 text-sm">{errors[`labor_${index}_name`]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={labor.description}
                maxLength={20}
                onChange={(e) => updateLaborEntry(index, "description", e.target.value)}
                placeholder="Work description"
              />
            </div>

            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={labor.hours === 0 ? "" : labor.hours}
                onChange={(e) =>
                  updateLaborEntry(
                    index,
                    "hours",
                    e.target.value === "" ? 0 : parseFloat(e.target.value)
                  )
                }
                placeholder="0"
              />
              {errors[`labor_${index}_hours`] && (
                <p className="text-red-500 text-sm">{errors[`labor_${index}_hours`]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Hourly Rate</Label>
              <Input
                type="number"
                step="0.01"
                value={labor.hourlyRate === 0 ? "" : labor.hourlyRate}
                onChange={(e) =>
                  updateLaborEntry(
                    index,
                    "hourlyRate",
                    e.target.value === "" ? 0 : parseFloat(e.target.value)
                  )
                }
                placeholder="0.00"
              />
              {errors[`labor_${index}_rate`] && (
                <p className="text-red-500 text-sm">{errors[`labor_${index}_rate`]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Total</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={labor.total === 0 ? "" : labor.total}
                  onChange={(e) =>
                    updateLaborEntry(
                      index,
                      "total",
                      e.target.value === "" ? 0 : parseFloat(e.target.value)
                    )
                  }
                  placeholder="0.00"
                />
                <Button variant="outline" size="sm" onClick={() => removeLaborEntry(index)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))
  ) : (
    <p className="text-center text-muted-foreground py-8">
      No labor entries added yet
    </p>
  )}
</div>

          </TabsContent>

          <TabsContent value="step-4" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Additional Costs</h3>
              <Button onClick={addAdditionalCost} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Cost
              </Button>
            </div>
            <div className="space-y-3">
              {newInvoice.additionalCosts?.map((cost, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={cost.description}
                          maxLength={50}
                          onChange={(e) => updateAdditionalCost(index, 'description', e.target.value)}
                          placeholder="Cost description"
                        />
                        {errors[`cost_${index}_desc`] && <p className="text-red-500 text-sm">{errors[`cost_${index}_desc`]}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={cost.amount === 0 ? "" : cost.amount}
                            onChange={(e) =>
                              updateAdditionalCost(
                                index,
                                "amount",
                                e.target.value === "" ? 0 : parseFloat(e.target.value)
                              )
                            }
                            placeholder="0.00"
                          />

                          {errors[`cost_${index}_amt`] && <p className="text-red-500 text-sm">{errors[`cost_${index}_amt`]}</p>}
                          <Button variant="outline" size="sm" onClick={() => removeAdditionalCost(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || <p className="text-center text-muted-foreground py-8">No additional costs added yet</p>}
            </div>
          </TabsContent>

          <TabsContent value="step-5" className="space-y-4">
            <h3 className="text-lg font-medium">Invoice Summary</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">

                  {/* Customer & Job */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">
                        {customers.find(c => c.id === newInvoice.customerId)?.customer_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Job</p>
                      <p className="font-medium">
                        {jobs.find(j => Number(j.id) === Number(newInvoice.jobId))?.title || "N/A"}
                      </p>

                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {newInvoice.type
                          ? newInvoice.type.charAt(0).toUpperCase() + newInvoice.type.slice(1)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{newInvoice.dueDate || "N/A"}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Items Total:</span>
                      <span>${itemsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor Total:</span>
                      <span>${laborTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Costs:</span>
                      <span>${additionalTotal.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({((newInvoice.taxRate || 0) * 100).toFixed(1)}%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-primary">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="step-6" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                value={newInvoice.notes || ''}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes or payment terms..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < 6 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                className="bg-primary text-white"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Invoice"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}