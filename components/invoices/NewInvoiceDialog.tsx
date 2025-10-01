import { useState, useEffect } from 'react'
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
import { apiClient } from '../../utils/api'
import { toast } from 'sonner'

interface NewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: any[];
  jobs: any[];
  roles: any [];
  job?: {            // <--- make optional
    id: number;
    title: string;
  };
  suppliers: any[]
  onReload: () => void
  setIsLoading: boolean
}

interface Job {
  id: number;
  title: string;
  
};

export const NewInvoiceDialog = ({ open, onOpenChange, customers, job, jobs, suppliers, onReload, setIsLoading }: NewInvoiceDialogProps) => {
 
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1)
  
  const [selectJob, setSelectJob] = useState<Job | null>(null);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerId: '',
    jobId: Number(job?.id || selectJob?.id),
    // jobId: job?.id || selectJob.id,
    type: 'estimate',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [],
    labor: [],
    additionalCosts: { description: '', amount: 0 }, // Changed to single object
    notes: '',
    taxRate: 0.08,
    invoiceNumber:''
  })

  const [formErrors, setFormErrors] = useState([]);

  useEffect(() => {
    if (job?.id) {
      setNewInvoice(prev => ({ ...prev, jobId: job.id }));
    }
  }, [job]);

  const calculateSubtotal = () => {
    const itemsTotal = newInvoice.items?.reduce((sum, item) => sum + item.total, 0) || 0
    const laborTotal = newInvoice.labor?.reduce((sum, labor) => sum + labor.total, 0) || 0
    const additionalTotal = newInvoice.additionalCosts?.amount || 0
    return itemsTotal + laborTotal + additionalTotal
  }

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}`,
      sku: '',
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      unit:'pieces',
      supplier: ''
    }
    setNewInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }))
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...(newInvoice.items || [])]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }
    
    setNewInvoice(prev => ({ ...prev, items: updatedItems }))
  }

  const removeInvoiceItem = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }))
  }

  const addLaborEntry = () => {
    const newLabor: LaborEntry = {
      id: `LAB-${Date.now()}`,
      laborName: '',
      laborEmail:'',
      hours: 0,
      hourlyRate: 0,
      total: 0,
      description: '',
      laborRole: '',
      date: format(new Date(), 'yyyy-MM-dd')
    }
    setNewInvoice(prev => ({
      ...prev,
      labor: [...(prev.labor || []), newLabor]
    }))
  }

  const updateLaborEntry = (index: number, field: keyof LaborEntry, value: any) => {
    const updatedLabor = [...(newInvoice.labor || [])]
    updatedLabor[index] = { ...updatedLabor[index], [field]: value }
    
    if (field === 'hours' || field === 'hourlyRate') {
      updatedLabor[index].total = updatedLabor[index].hours * updatedLabor[index].hourlyRate
    }
    
    setNewInvoice(prev => ({ ...prev, labor: updatedLabor }))
  }

  const removeLaborEntry = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      labor: prev.labor?.filter((_, i) => i !== index)
    }))
  }

  // Updated to handle single additional cost object
  const updateAdditionalCost = (field: 'description' | 'amount', value: any) => {
    setNewInvoice(prev => ({
      ...prev,
      additionalCosts: { 
        description: prev.additionalCosts?.description || '',
        amount: prev.additionalCosts?.amount || 0,
        [field]: value 
      }
    }))
  }

  const calculateTotalMaterialsCost = () => {
    return (newInvoice.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateTotalLaborCost = () => {
    return (newInvoice.labor || []).reduce((sum, entry) => sum + (entry.total || 0), 0);
  };

  const calculateTotalAdditionalCost = () => {
    return newInvoice.additionalCosts?.amount || 0;
  };

  // Get selected customer for email
  const getSelectedCustomerEmail = () => {
    const selectedCustomer = customers.find(c => c.id.toString() === newInvoice.customerId);
    return selectedCustomer?.email || "customer@example.com";
  };

  const validateStep = (step: number) => {
    let errors: Record<string, string> = {};
    console.log(JSON.stringify(newInvoice));
    switch (step) {
      case 1: // Customer, Type, Issue Date, Due Date
        if (!newInvoice.customerId) {
          errors.customerId = "Customer is required";
        }
        if (!newInvoice.jobId) {
          errors.jobId = "Select the job";
        }
        if (!newInvoice.type) {
          errors.type = "Invoice type is required";
        }
        if (!newInvoice.invoiceNumber) {
          errors.invoiceNumber = "Invoice number is required";
        }
        if (!newInvoice.taxRate) {
          errors.taxRate = "Tax rate is required";
        }
        if (!newInvoice.issueDate) {
          errors.issueDate = "Issue date is required";
        }
        if (!newInvoice.dueDate) {
          errors.dueDate = "Due date is required";
        }
        break;

      case 2: // Items/Materials
        if (newInvoice.items && newInvoice.items.length > 0) {
          newInvoice.items.forEach((item, index) => {
            if (!item.name || item.name.trim() === "") {
              errors[`items[${index}].name`] = "Item name is required";
            }
            if (!item.quantity || item.quantity <= 0) {
              errors[`items[${index}].quantity`] = "Quantity must be greater than 0";
            }
            if (!item.unitPrice || item.unitPrice <= 0) {
              errors[`items[${index}].unitPrice`] = "Unit price must be greater than 0";
            }
            if (!item.sku ) {
              errors[`items[${index}].sku`] = "SKU is required";
            }
            if (!item.unit) {
              errors[`items[${index}].unit`] = "Unit is required";
            }
            if (!item.supplier) {
              errors[`items[${index}].supplier`] = "Supplier is required";
            }
            // Optional fields like description, supplier, etc. are skipped
          });
        }
        break;


      case 3: // Labor (optional, but if filled validate)
        if (newInvoice.labor?.length) {
          newInvoice.labor.forEach((labor, index) => {
            if (!labor.laborName?.trim()) {
              errors[`labor[${index}].laborName`] = "Name is required";
            }
            if (!labor.laborEmail?.trim()) {
              errors[`labor[${index}].laborEmail`] = "Email is required";
            }
            if (!labor.hours || labor.hours <= 0) {
              errors[`labor[${index}].hours`] = "Hours must be greater than 0";
            }
            if (!labor.hourlyRate || labor.hourlyRate <= 0) {
              errors[`labor[${index}].hourlyRate`] = "Hourly rate must be greater than 0";
            }
          });
        }
        break;

     case 4: // Additional cost (optional, so usually no hard validation)
      if (newInvoice.additionalCosts?.description && !newInvoice.additionalCosts?.amount) {
        errors.additionalCosts = errors.additionalCosts || {};
        errors.additionalCosts.amount = "Additional amount is required";
      }

      if (newInvoice.additionalCosts?.amount && !newInvoice.additionalCosts?.description) {
        errors.additionalCosts = errors.additionalCosts || {};
        errors.additionalCosts.description = "Additional description is required";
      }
      break;

      default:
        break;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors); // you can store errors in a state
      return false;
    }

    setFormErrors({});
    return true;
  };



  const saveInvoiceData = async () => {
    try {
      // setIsLoading(true);

      // Validate form data
      // const validationErrors = validateFormData();
     // Check if there are any errors
      if (Object.keys(formErrors).length > 0) {
        // Convert all error messages into a single string
        const errorMessages = Object.values(formErrors).join(", ");
        toast.error(`Validation errors: ${errorMessages}`);
        return false;
      }


      // Calculate totals
      const materialsTotal = calculateTotalMaterialsCost();
      const laborTotal = calculateTotalLaborCost();
      const additionalTotal = calculateTotalAdditionalCost();
      const subtotal = materialsTotal + laborTotal + additionalTotal;
      const taxAmount = subtotal * (newInvoice.taxRate || 0);
      const totalAmount = subtotal + taxAmount;

      // Ensure we have at least default additional cost
      const additionalCost = newInvoice.additionalCosts?.description || newInvoice.additionalCosts?.amount
        ? newInvoice.additionalCosts
        : { description: 'No additional costs', amount: 0 };

      const payload = {
        estimate_title: `${newInvoice.type?.charAt(0).toUpperCase()}${newInvoice.type?.slice(1)} Invoice - ${job?.title || 'Project'}`,
        customer_id: Number(newInvoice.customerId),
        job_id: Number(newInvoice.jobId),
        // job_id: job?.id || selectJob.id,
        priority: "medium",
        valid_until: newInvoice.dueDate || format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        location: "Project Location", // You may want to make this dynamic
        description: newInvoice.notes ,
        service_type: "service_based",
        email_address: getSelectedCustomerEmail(),
        estimate_date: newInvoice.issueDate || format(new Date(), 'yyyy-MM-dd'),
        
        // Financial calculations
        materials_cost: materialsTotal,
        labor_cost: laborTotal,
        additional_costs: additionalTotal,
        subtotal: subtotal,
        tax_percentage: (newInvoice.taxRate || 0) * 100,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        
        // Invoice specific fields
        status: "draft",
        invoice_type: newInvoice.type || 'estimate',
        // invoice_number: `INV-${format(new Date(), 'yyyy')}-${Date.now().toString().slice(-6)}`, // Generate invoice number
        invoice_number: `INV-${newInvoice.invoiceNumber}`, 
        issue_date: newInvoice.issueDate || format(new Date(), 'yyyy-MM-dd'),
        due_date: newInvoice.dueDate || format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        
        // Additional cost object
        additional_cost: additionalCost,
        
        // Custom labor array
        custom_labor: (newInvoice.labor || []).map(labor => ({
          full_name: labor.laborName,
          email: labor.laborEmail,
          hours_worked: labor.hours,
          hourly_rate: labor.hourlyRate,
          job_id: Number(newInvoice.jobId),
          is_custom: true,
          // role: labor.laborRole,
          // date: labor.date,
          // description: labor.description
        })),
        
        // Custom products array
        custom_products: (newInvoice.items || []).map(item => ({
          product_name: item.name,
          supplier_id: item.supplier, // You may want to make this dynamic
          supplier_sku: item.sku,
          jdp_sku: `JDP-${item.sku}`,
          stock_quantity: item.quantity,
          unit: "pieces", // You may want to make this dynamic
          job_id: newInvoice.jobId?.toString(),
          is_custom: true,
          unit_cost: item.unitPrice,
          // description: item.description
        }))
      };

      console.log('Sending payload:', payload); // For debugging

      const response = await apiClient.createEstimate(payload);
      console.log('Invoice saved successfully:', response);
      toast.success('Invoice saved successfully!');
      onReload();
      // setIsLoading(false);
      setNewInvoice({
        jobId:job?.id || selectJob.id
      });

      return true;
    } catch (error: any) {
      console.error('Error creating estimate:', error);
      
      // More detailed error handling
      let errorMessage = 'Error creating estimate';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      // setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const success = await saveInvoiceData();
    
    if (success) {
     
      
      // Reset form
      setNewInvoice({
        customerId: '',
        jobId: 0,
        type: 'estimate',
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        items: [],
        labor: [],
        additionalCosts: { description: '', amount: 0 },
        notes: '',
        taxRate: 0.08
      });
      
      setCurrentStep(1);
      onOpenChange(false);
    }
  }

  const subtotal = calculateSubtotal();
  const taxAmount = subtotal * (newInvoice.taxRate || 0);
  const totalAmount = subtotal + taxAmount;

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
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select 
                  value={newInvoice.customerId} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem> 
                    ))}
                  </SelectContent>
                </Select>
               
                <p className="text-red-500 text-sm">
                  {formErrors?.customerId}
                </p>

              </div>
              <div className="space-y-2">
                <Label htmlFor="job">Job *</Label>

                {/* <Input 
                  type="text" 
                  value={job?.title || ''} 
                  disabled
                  placeholder="No job selected"
                /> */}
                <div className="space-y-2">
  {/* <Label htmlFor="job">Job *</Label> */}

  {job ? (
    <Input 
      type="text" 
      value={job?.title || ''} 
      disabled 
      placeholder="No job selected" 
    />
  ) : (
 <select
  id="job"
  className="w-full border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
  value={newInvoice.jobId || ""}
  onChange={(e) => {
    const selectedJobId = Number(e.target.value);
  
     const selected = jobs.find((j) => j.id == selectedJobId) || null;
    setSelectJob(selected);
    setNewInvoice((prev) => ({ ...prev, jobId: selectedJobId }));
  }}
>
  <option value="">Select a job</option>
  {jobs.map((j) => (
    <option key={j.id} value={j.id}>
      {j.title}
    </option>
  ))}
</select>

  )}
</div>

 <p className="text-red-500 text-sm">
                  {formErrors?.jobId}
                </p>

               
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Invoice Type *</Label>
                <Select
                  value={newInvoice.type} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, type: value }))}
                >

                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposal_invoice">Proposed</SelectItem>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="progressive_invoice">Progressive</SelectItem>
                    <SelectItem value="final_invoice">Final</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="text-red-500 text-sm">
                  {formErrors?.type}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input 
                  value={newInvoice.invoiceNumber || ''} 
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="EST-2024-002"
                />
                 <p className="text-red-500 text-sm">
                  {formErrors?.invoiceNumber}
                </p>
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
                 <p className="text-red-500 text-sm">
                  {formErrors?.taxRate}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input 
                  type="date" 
                  value={newInvoice.issueDate} 
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
                />
                 <p className="text-red-500 text-sm">
                  {formErrors?.issueDate}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input 
                  type="date" 
                  value={newInvoice.dueDate} 
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                />
                 <p className="text-red-500 text-sm">
                  {formErrors?.dueDate}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="step-2" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items/Materials</h3>
              <Button onClick={addInvoiceItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {newInvoice.items?.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                       <div className="space-y-2">
                          <Label>Product Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => updateInvoiceItem(index, 'name', e.target.value)}
                            placeholder="Product name"
                          />
                          {/* <p className="text-red-500 text-sm">
                            {formErrors?.formErrors[`items[${index}].name`]}
                          </p> */}
                          {formErrors[`items[${index}].name`] && (
                            <p className="text-red-500 text-sm">
                              {formErrors[`items[${index}].name`]}
                            </p>
                          )}
                        </div>
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input 
                          value={item.sku} 
                          onChange={(e) => updateInvoiceItem(index, 'sku', e.target.value)}
                          placeholder="SKU-001"
                        />
                        {formErrors[`items[${index}].sku`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`items[${index}].sku`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="mb-2">Unit</Label>
                        <Select
                          value={item.unit || 'pieces'}
                          onValueChange={(value) => updateInvoiceItem(index, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pieces">Pieces</SelectItem>
                            <SelectItem value="feet">Feet</SelectItem>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="roll">Roll</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors[`items[${index}].unit`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`items[${index}].unit`]}
                          </p>
                        )}
                      </div>

                        <div>
                          <Label className="mb-2">Supplier</Label>
                          <select
                            value={item.supplier || ''}
                            onChange={(e) => updateInvoiceItem(index, 'supplier', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Supplier</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.contact_person} 
                              </option>
                            ))}
                          </select>
                           {formErrors[`items[${index}].supplier`] && (
                              <p className="text-red-500 text-sm">
                                {formErrors[`items[${index}].supplier`]}
                              </p>
                            )}
                        </div>
                      {/* <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                          value={item.description} 
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div> */}
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                        {formErrors[`items[${index}].quantity`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`items[${index}].quantity`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={item.unitPrice} 
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                        {formErrors[`items[${index}].unitPrice`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`items[${index}].unitPrice`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">

                        <Label>Total</Label>
                        <div className="flex items-center gap-2">
                          <Input value={(item.quantity * item.unitPrice).toFixed(2)} readOnly />
                          <Button variant="outline" size="sm" onClick={() => removeInvoiceItem(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || <p className="text-center text-muted-foreground py-8">No items added yet</p>}
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
              {newInvoice.labor?.map((labor, index) => (
                <Card key={labor.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input 
                          value={labor.laborName} 
                          onChange={(e) => updateLaborEntry(index, 'laborName', e.target.value)}
                          placeholder="Worker name"
                        />
                        {formErrors[`labor[${index}].laborName`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`labor[${index}].laborName`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="mb-2">Email </Label>
                        <Input
                          type="email"
                          value={labor.laborEmail}
                          onChange={(e) => updateLaborEntry(index, 'laborEmail', e.target.value)}
                          placeholder="Enter email address"
                        />   
                        {formErrors[`labor[${index}].laborEmail`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`labor[${index}].laborEmail`]}
                          </p>
                        )}                    
                      </div>
                      
                      {/* <div>
                        <Label className="mb-2">Role </Label>
                        <Select 
                          value={labor.laborRole} 
                          onValueChange={(value) => updateLaborEntry(index, 'laborRole', value)}
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
                      </div> */}

                      {/* <div className="space-y-2">
                        <Label htmlFor="issueDate">Date</Label>
                        <Input 
                          type="date" 
                          value={labor.date} 
                          onChange={(e) => updateLaborEntry(index, 'date', e.target.value)}
                        />
                      </div>      */}

                      <div className="space-y-2">
                        <Label>Hours Worked</Label>
                        <Input 
                          type="number" 
                          step="0.5"
                          value={labor.hours} 
                          onChange={(e) => updateLaborEntry(index, 'hours', parseFloat(e.target.value) || 0)}
                        />
                        {formErrors[`labor[${index}].hours`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`labor[${index}].hours`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Hourly Rate</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={labor.hourlyRate} 
                          onChange={(e) => updateLaborEntry(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                        />
                        {formErrors[`labor[${index}].hourlyRate`] && (
                          <p className="text-red-500 text-sm">
                            {formErrors[`labor[${index}].hourlyRate`]}
                          </p>
                        )}
                      </div>

                       {/* <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={labor.description}
                          onChange={(e) => updateLaborEntry(index, 'description', e.target.value)}
                          placeholder="Describe the work performed"
                          rows={3}
                        />
                      </div> */}

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center gap-2">
                          <Input value={(labor.hours * labor.hourlyRate).toFixed(2)} readOnly />
                          <Button variant="outline" size="sm" onClick={() => removeLaborEntry(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || <p className="text-center text-muted-foreground py-8">No labor entries added yet</p>}
            </div>
          </TabsContent>

          <TabsContent value="step-4" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Additional Cost</h3>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      value={newInvoice.additionalCosts?.description || ''} 
                      onChange={(e) => updateAdditionalCost('description', e.target.value)}
                      placeholder="Additional cost description"
                    />
                    {formErrors.additionalCosts?.description && (
                      <p className="text-red-500 text-sm">
                        {formErrors.additionalCosts.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={newInvoice.additionalCosts?.amount || 0} 
                      onChange={(e) => updateAdditionalCost('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    {formErrors.additionalCosts?.amount && (
                      <p className="text-red-500 text-sm">
                        {formErrors.additionalCosts.amount}
                      </p>
                    )}

                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="step-5" className="space-y-4">
            <h3 className="text-lg font-medium">Invoice Summary</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">
                        {customers.find(c => c.id.toString() === newInvoice.customerId)?.name || 'Not selected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Job</p>
                      <p className="font-medium">{job?.title || selectJob?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{newInvoice.type?.charAt(0).toUpperCase()}{newInvoice.type?.slice(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{newInvoice.dueDate}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Items Total:</span>
                      <span>${calculateTotalMaterialsCost().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor Total:</span>
                      <span>${calculateTotalLaborCost().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Costs:</span>
                      <span>${calculateTotalAdditionalCost().toFixed(2)}</span>
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
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < 6 ? (
              <Button className='bg-primary text-white' 
              // onClick={() => setCurrentStep(prev => prev + 1)}
              onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep((prev) => prev + 1);
                } else {
                  // show validation error (toast, inline message, etc.)
                  console.log("Validation failed for step", currentStep);
                }
              }}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? 'Saving...' : 'Save Invoice'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
  )
}