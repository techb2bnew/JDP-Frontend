import { useState } from 'react'
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
import { apiClient } from '../../utils/api'
import { toast } from 'sonner'
// import { formatCurrency, formatDate } from '../../utils/invoiceUtils'

interface NewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (invoice: Partial<Invoice>) => void
  customers: any[];
  job: any[];
}

export const NewInvoiceDialog = ({ open, onOpenChange, onSave, customers, job }: NewInvoiceDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerId: '',
    jobId: '',
    type: 'proposed',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [],
    labor: [],
    additionalCosts: [],
    notes: '',
    taxRate: 0.08
  })

  const calculateSubtotal = () => {
    const itemsTotal = newInvoice.items?.reduce((sum, item) => sum + item.total, 0) || 0
    const laborTotal = newInvoice.labor?.reduce((sum, labor) => sum + labor.total, 0) || 0
    const additionalTotal = newInvoice.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0
    return itemsTotal + laborTotal + additionalTotal
  }

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}`,
      sku: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
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
      hours: 0,
      hourlyRate: 0,
      total: 0,
      description: ''
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

  const addAdditionalCost = () => {
    setNewInvoice(prev => ({
      ...prev,
      additionalCosts: [...(prev.additionalCosts || []), { description: '', amount: 0 }]
    }))
  }

  const updateAdditionalCost = (index: number, field: 'description' | 'amount', value: any) => {
    const updatedCosts = [...(newInvoice.additionalCosts || [])]
    updatedCosts[index] = { ...updatedCosts[index], [field]: value }
    setNewInvoice(prev => ({ ...prev, additionalCosts: updatedCosts }))
  }

  const removeAdditionalCost = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      additionalCosts: prev.additionalCosts?.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    onSave(newInvoice)
    setNewInvoice({
      customerId: '',
      jobId: '',
      type: 'proposed',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: [],
      labor: [],
      additionalCosts: [],
      notes: '',
      taxRate: 0.08
    })
    setCurrentStep(1)
    onOpenChange(false)
  }

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
                <Label htmlFor="customer">Customer</Label>
                
                <Select 
                  value={newInvoice.customerId} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                    
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem> 
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job">Job</Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <p className="text-sm font-medium">
                    {job?.title}
                  </p>
                </div>
                {/* <Select 
                  value={job.title} 
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
                </Select> */}
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
                        <Label>SKU</Label>
                        <Input 
                          value={item.sku} 
                          onChange={(e) => updateInvoiceItem(index, 'sku', e.target.value)}
                          placeholder="SKU-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                          value={item.description} 
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={item.unitPrice} 
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center gap-2">
                          <Input value='342' readOnly />
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
                        <Label>Labor Name</Label>
                        <Input 
                          value={labor.laborName} 
                          onChange={(e) => updateLaborEntry(index, 'laborName', e.target.value)}
                          placeholder="Worker name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                          value={labor.description} 
                          onChange={(e) => updateLaborEntry(index, 'description', e.target.value)}
                          placeholder="Work description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hours</Label>
                        <Input 
                          type="number" 
                          step="0.5"
                          value={labor.hours} 
                          onChange={(e) => updateLaborEntry(index, 'hours', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hourly Rate</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={labor.hourlyRate} 
                          onChange={(e) => updateLaborEntry(index, 'hourlyRate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center gap-2">
                          <Input value='2323' readOnly />
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
                          onChange={(e) => updateAdditionalCost(index, 'description', e.target.value)}
                          placeholder="Cost description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            step="0.01"
                            value={cost.amount} 
                            onChange={(e) => updateAdditionalCost(index, 'amount', parseFloat(e.target.value) || 0)}
                          />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      {/* <p className="font-medium">{customersData.find(c => c.id === newInvoice.customerId)?.name}</p> */}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Job</p>
                      <p className="font-medium">{jobsData.find(j => j.id === newInvoice.jobId)?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{newInvoice.type?.charAt(0).toUpperCase()}{newInvoice.type?.slice(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">423432</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Items Total:</span>
                      <span>234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor Total:</span>
                      <span>324</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Costs:</span>
                      <span>33</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>654</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({((newInvoice.taxRate || 0) * 100).toFixed(1)}%):</span>
                      <span>44</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-primary">44</span>
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
              <Button className='bg-primary text-white' onClick={() => setCurrentStep(prev => prev + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save Invoice
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}