'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Search,
  Edit,
  PlusCircle,
  ArrowLeft,
  XCircle,
  Trash2
} from 'lucide-react'
import { apiClient, globalApiCall } from '@/utils/api'
import { toast } from 'sonner';
import PhoneInput from "react-phone-number-input";


export function AddEditOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const isEditMode = !!orderId
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  // Form data state
  const [orderFormData, setOrderFormData] = useState({
    lead_labour_id: '',
    customer_id: '',
    job_id: '',
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_address: '',
    delivery_city_zip: '',
    delivery_phone: '',
    notes: '',
    internal_notes: '',
    cartItems: [] as Array<{ product_id: number; quantity: number }>
  })

  // Searchable select states
  const [leadLaborSearch, setLeadLaborSearch] = useState('')
  const [leadLaborList, setLeadLaborList] = useState<any[]>([])
  const [showLeadLaborResults, setShowLeadLaborResults] = useState(false)
  const [selectedLeadLabor, setSelectedLeadLabor] = useState<any>(null)

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerList, setCustomerList] = useState<any[]>([])
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const [jobSearch, setJobSearch] = useState('')
  const [jobList, setJobList] = useState<any[]>([])
  const [showJobResults, setShowJobResults] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)

  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierList, setSupplierList] = useState<any[]>([])
  const [showSupplierResults, setShowSupplierResults] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)

  const [productSearch, setProductSearch] = useState('')
  const [productList, setProductList] = useState<any[]>([])
  const [showProductResults, setShowProductResults] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [productQuantities, setProductQuantities] = useState<Record<number, number>>({})

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch order data if in edit mode
  useEffect(() => {
    if (isEditMode && orderId) {
      fetchOrderById(orderId)
    }
  }, [isEditMode, orderId])

  // Sync search fields with selected values
  useEffect(() => {
    if (selectedLeadLabor) {
      setLeadLaborSearch(selectedLeadLabor.user?.full_name || selectedLeadLabor.users?.full_name || selectedLeadLabor.name || selectedLeadLabor.labor_code || '')
    }
  }, [selectedLeadLabor])

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerSearch(selectedCustomer.customer_name || selectedCustomer.customerName || selectedCustomer.name || '')
    }
  }, [selectedCustomer])

  useEffect(() => {
    if (selectedJob) {
      setJobSearch(selectedJob.job_title || selectedJob.title || '')
    }
  }, [selectedJob])

  useEffect(() => {
    if (selectedSupplier) {
      setSupplierSearch(selectedSupplier.company_name || selectedSupplier.fullName || selectedSupplier.name || '')
    }
  }, [selectedSupplier])

  const fetchOrderById = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await globalApiCall(`${apiBaseUrl}/orders/getOrderById/${id}`, {
        method: 'GET'
      })

      const responseData = await response.json()

      if (responseData.success && responseData.data) {
        const apiOrder = responseData.data

        setOrderFormData({
          lead_labour_id: apiOrder.lead_labour_id?.toString() || '',
          customer_id: apiOrder.customer_id?.toString() || '',
          job_id: apiOrder.job_id?.toString() || '',
          supplier_id: apiOrder.supplier_id?.toString() || '',
          order_date: apiOrder.order_date || new Date().toISOString().split('T')[0],
          delivery_address: apiOrder.delivery_address || '',
          delivery_city_zip: apiOrder.delivery_city_zip || '',
          delivery_phone: apiOrder.delivery_phone || '',
          notes: apiOrder.notes || '',
          internal_notes: apiOrder.internal_notes || '',
          cartItems: apiOrder.order_items?.map((item: any) => ({
            product_id: item.product_id || item.product?.id,
            quantity: item.quantity || 1
          })) || []
        })

        // Set selected items for dropdowns
        if (apiOrder.lead_labour) {
          setSelectedLeadLabor(apiOrder.lead_labour)
          // Use user.full_name if available, otherwise use name or labor_code
          const leadLaborName = apiOrder.lead_labour.users?.full_name  
            || ''
          setLeadLaborSearch(leadLaborName)
        }
        if (apiOrder.customer) {
          setSelectedCustomer(apiOrder.customer)
          setCustomerSearch(apiOrder.customer.customer_name || apiOrder.customer.company_name || '')
        }
        if (apiOrder.job) {
          setSelectedJob(apiOrder.job)
          setJobSearch(apiOrder.job.job_title || '')
        }
        if (apiOrder.supplier) {
          setSelectedSupplier(apiOrder.supplier)
          setSupplierSearch(apiOrder.supplier.company_name || '')
        }
        if (apiOrder.order_items && apiOrder.order_items.length > 0) {
          const products = apiOrder.order_items.map((item: any) => ({
            ...item.product,
            id: item.product_id || item.product?.id,
            quantity: item.quantity || 1
          }))
          setSelectedProducts(products)
          const quantities: Record<number, number> = {}
          products.forEach((p: any) => {
            quantities[p.id] = p.quantity || 1
          })
          setProductQuantities(quantities)
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to fetch order details')
    } finally {
      setIsLoading(false)
    }
  }

  const getSystemIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || '127.0.0.1'
    } catch (error) {
      return '127.0.0.1'
    }
  }

  // Search handlers
  const fetchLeadLaborList = async (searchQuery: string = '') => {
    try {
      const response = searchQuery 
        ? await apiClient.searchLeadLaborByQuery(searchQuery, 1, 10)
        : await apiClient.getLeadLabor(1, 10)
      const leadLaborData = response.data?.leadLabor || response.data?.data || []
      setLeadLaborList(leadLaborData)
    } catch (error) {
      console.error('Error fetching lead labor:', error)
      setLeadLaborList([])
    }
  }

  const fetchCustomerList = async (searchQuery: string = '') => {
    try {
      const response = searchQuery 
        ? await apiClient.searchCutomerByQuery(searchQuery, 1, 10)
        : await apiClient.getAllCustomers()
      const customersData = response.data?.customers || response.data || []
      setCustomerList(customersData)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomerList([])
    }
  }

  const fetchJobList = async (searchQuery: string = '') => {
    try {
      setIsLoadingJobs(true)
      const response = await apiClient.searchJobsByQuery(searchQuery, 1, 10)
      const jobsData = response.data?.jobs || response.data || []
      setJobList(jobsData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobList([])
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const fetchSupplierList = async (searchQuery: string = '') => {
    try {
      const response = searchQuery 
        ? await apiClient.searchSuppliersByQuery(searchQuery, 1, 10)
        : await apiClient.getAllSuppliers()
      const suppliersData = response.data?.suppliers || []
      setSupplierList(suppliersData)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      setSupplierList([])
    }
  }

  const fetchProductList = async (searchQuery: string = '') => {
    try {
      if (searchQuery) {
        const response = await apiClient.searchProductsByQuery(searchQuery)
        const productsData = response.data?.products || response.data || []
        setProductList(productsData)
      } else {
        const response = await globalApiCall(`${apiBaseUrl}/products/getAllProducts?page=1&limit=10`, {
          method: 'GET'
        })
        const responseData = await response.json()
        const productsData = responseData.data?.products || responseData.data || []
        setProductList(productsData)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProductList([])
    }
  }

  // Handle job selection and auto-fill delivery fields
  const handleJobSelection = (job: any) => {
    setSelectedJob(job)
      console.log('asssss>>>', job)
    
    // Clear lead labor - user will select manually
    setSelectedLeadLabor(null)
    setLeadLaborSearch('')
    setOrderFormData(prev => ({
      ...prev,
      lead_labour_id: ''
    }))
    
    // Auto-populate Customer or Contractor based on job_type
    if (job.job_type === 'service_based' && job.customer) {
      setSelectedCustomer(job.customer)
      const customerName = job.customer.customer_name || job.customer.customerName || ''
      setCustomerSearch(customerName)
      setOrderFormData(prev => ({
        ...prev,
        job_id: job.id?.toString() || '',
        customer_id: job.customer.id?.toString() || job.customer_id?.toString() || '',
        delivery_address: job.bill_to_address || job.billToAddress || job.address || '',
        delivery_city_zip: job.bill_to_city_zip || job.billToCityZip || job.city_zip || job.cityZip || '',
        delivery_phone: job.bill_to_phone || job.billToPhone || job.phone || '',
        notes: job.description || '',
        internal_notes: job.description || ''
      }))
    } else if (job.job_type === 'contract_based' && job.contractor) {
      // Contract based job with contractor
      const contractorData = {
        id: job.contractor.id,
        customer_name: job.contractor.contractor_name || job.contractorName,
        company_name: job.contractor.company_name,
        email: job.contractor.email,
        phone: job.contractor.phone,
        address: job.contractor.address
      }
      setSelectedCustomer(contractorData)
      const contractorName = job.contractor.contractor_name || job.contractor.company_name || ''
      setCustomerSearch(contractorName)
      setOrderFormData(prev => ({
        ...prev,
        job_id: job.id?.toString() || '',
        customer_id: job.contractor.id?.toString() || job.contractor_id?.toString() || '',
        delivery_address: job.bill_to_address || job.billToAddress || job.address || '',
        delivery_city_zip: job.bill_to_city_zip || job.billToCityZip || job.city_zip || job.cityZip || '',
        delivery_phone: job.bill_to_phone || job.billToPhone || job.phone || '',
        notes: job.description || '',
        internal_notes: job.description || ''
      }))
    } else if (job.customer) {
      // Fallback: if customer exists (even for contract_based without contractor), use customer
      setSelectedCustomer(job.customer)
      const customerName = job.customer.customer_name || job.customer.customerName || job.customer.company_name || ''
      setCustomerSearch(customerName)
      setOrderFormData(prev => ({
        ...prev,
        job_id: job.id?.toString() || '',
        customer_id: job.customer.id?.toString() || job.customer_id?.toString() || '',
        delivery_address: job.bill_to_address || job.billToAddress || job.address || '',
        delivery_city_zip: job.bill_to_city_zip || job.billToCityZip || job.city_zip || job.cityZip || '',
        delivery_phone: job.bill_to_phone || job.billToPhone || job.phone || '',
        notes: job.description || '',
        internal_notes: job.description || ''
      }))
    } else {
      // Clear customer/contractor if not available
      setSelectedCustomer(null)
      setCustomerSearch('')
      setOrderFormData(prev => ({
        ...prev,
        job_id: job.id?.toString() || '',
        customer_id: '',
        delivery_address: job.bill_to_address || job.billToAddress || job.address || '',
        delivery_city_zip: job.bill_to_city_zip || job.billToCityZip || job.city_zip || job.cityZip || '',
        delivery_phone: job.bill_to_phone || job.billToPhone || job.phone || '',
        notes: job.description || '',
        internal_notes: job.description || ''
      }))
    }
    
    // Clear supplier - user will select manually
    setSelectedSupplier(null)
    setSupplierSearch('')
    setOrderFormData(prev => ({
      ...prev,
      supplier_id: ''
    }))
    
    setShowJobResults(false)
    setJobSearch(job.job_title || job.title || '')
  }

  const handleProductSelection = (product: any) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      const newProducts = [...selectedProducts, product]
      const newQuantities = { ...productQuantities, [product.id]: 1 }
      setSelectedProducts(newProducts)
      setProductQuantities(newQuantities)
      setOrderFormData(prev => ({
        ...prev,
        cartItems: newProducts.map(p => ({
          product_id: Number(p.id),
          quantity: productQuantities[p.id] || 1
        }))
      }))
      setProductSearch('')
      setShowProductResults(false)
    }
  }

  const removeProduct = (productId: number) => {
    const newProducts = selectedProducts.filter(p => p.id !== productId)
    const newQuantities = { ...productQuantities }
    delete newQuantities[productId]
    setSelectedProducts(newProducts)
    setProductQuantities(newQuantities)
    setOrderFormData(prev => ({
      ...prev,
      cartItems: newProducts.map(p => ({
        product_id: Number(p.id),
        quantity: productQuantities[p.id] || 1
      }))
    }))
  }

  const updateProductQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId)
      return
    }
    const newQuantities = { ...productQuantities, [productId]: quantity }
    setProductQuantities(newQuantities)
    setOrderFormData(prev => ({
      ...prev,
      cartItems: selectedProducts.map(p => ({
        product_id: Number(p.id),
        quantity: newQuantities[p.id] || 1
      }))
    }))
  }

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const errors: Record<string, string> = {}
      
      if (!orderFormData.lead_labour_id) {
        errors.lead_labour_id = 'Please select lead labor'
      }
      if (!orderFormData.customer_id) {
        errors.customer_id = 'Please select customer'
      }
      if (!orderFormData.job_id) {
        errors.job_id = 'Please select job'
      }
      if (!orderFormData.supplier_id) {
        errors.supplier_id = 'Please select supplier'
      }
      if (!orderFormData.order_date) {
        errors.order_date = 'Please select order date'
      }
      if (orderFormData.cartItems.length === 0) {
        errors.cartItems = 'Please add at least one product'
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        return
      }
      setValidationErrors({})

      setIsSubmitting(true)

      // Get system IP
      const systemIp = await getSystemIP()

      const normalizedJobType = selectedJob?.job_type?.toLowerCase()?.replace('-', '_')
      const isContractJob = normalizedJobType === 'contract_based'
      const customerOrContractorId = parseInt(orderFormData.customer_id)

      const payload: Record<string, any> = {
        lead_labour_id: parseInt(orderFormData.lead_labour_id),
        job_id: parseInt(orderFormData.job_id),
        supplier_id: parseInt(orderFormData.supplier_id),
        order_date: orderFormData.order_date,
        delivery_address: orderFormData.delivery_address,
        delivery_city_zip: orderFormData.delivery_city_zip,
        delivery_phone: orderFormData.delivery_phone,
        created_from: 'admin',
        status: 'completed',
        system_ip: systemIp,
        notes: orderFormData.notes,
        internal_notes: orderFormData.internal_notes,
        cartItems: orderFormData.cartItems
      }

      if (isContractJob) {
        payload.contractor_id = customerOrContractorId
      } else {
        payload.customer_id = customerOrContractorId
      }

      if (isEditMode) {
        // Update order
        const response = await globalApiCall(`${apiBaseUrl}/orders/updateOrder/${orderId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const responseData = await response.json()

        if (responseData.success) {
          toast.success('Order updated successfully!')
          router.push('/orders')
        } else {
          toast.error(responseData.message || 'Failed to update order')
        }
      } else {
        // Create order
        const response = await globalApiCall(`${apiBaseUrl}/orders/createOrder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const responseData = await response.json()
        if (responseData.success) {
          toast.success('Order created successfully!')
          router.push('/orders')
        } else {
          toast.error(responseData.message || 'Failed to create order')
        }
      }
    } catch (error) { 
      const errorMessage = error instanceof Error ? error.message : (error as any)?.message || 'Failed to save order'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/orders')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Order' : 'Add New Order'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode ? 'Update the order details below' : 'Fill in the order details below.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Lead Labor, Customer, Job, Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lead Labor Selection */}
                  {/* Job Selection */}
                  <div className="space-y-2">
                  <Label htmlFor="job">Job *</Label>
                  <div className="relative">
                    <Input
                      id="job"
                      value={jobSearch}
                      onChange={(e) => {
                        const value = e.target.value
                        setJobSearch(value)
                        if (selectedJob && value !== (selectedJob.job_title || selectedJob.title || '')) {
                          setSelectedJob(null)
                          // Clear all related fields when job is cleared
                          setSelectedLeadLabor(null)
                          setSelectedCustomer(null)
                          setSelectedSupplier(null)
                          setLeadLaborSearch('')
                          setCustomerSearch('')
                          setSupplierSearch('')
                          setOrderFormData(prev => ({
                            ...prev,
                            job_id: '',
                            lead_labour_id: '',
                            customer_id: '',
                            supplier_id: '',
                            delivery_address: '',
                            delivery_city_zip: '',
                            delivery_phone: '',
                            notes: '',
                            internal_notes: ''
                          }))
                        }
                        setShowJobResults(true)
                        if (value && value.length > 0) {
                          fetchJobList(value)
                        } else if (value.length === 0) {
                          fetchJobList('')
                        }
                        if (validationErrors.job_id) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.job_id
                            return newErrors
                          })
                        }
                      }}
                      onFocus={() => {
                        if (selectedJob) {
                          setJobSearch(selectedJob.job_title || selectedJob.title || '')
                        } else {
                          fetchJobList('')
                          setShowJobResults(true)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowJobResults(false), 200)
                      }}
                      placeholder="Search job..."
                      className={`pr-10 ${validationErrors.job_id ? 'border-red-500' : ''}`}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {showJobResults && (
                      <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1">
                        {isLoadingJobs ? (
                          <div className="p-3 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                            <span className="text-sm text-muted-foreground">Loading jobs...</span>
                          </div>
                        ) : jobList.length > 0 ? (
                          jobList.map((job: any) => (
                            <div
                              key={job.id}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleJobSelection(job)
                                if (validationErrors.job_id) {
                                  setValidationErrors(prev => {
                                    const newErrors = { ...prev }
                                    delete newErrors.job_id
                                    return newErrors
                                  })
                                }
                              }}
                              className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100"
                            >
                              <div className="font-medium">{job.job_title || job.title}</div>
                              <div className="text-sm text-muted-foreground">{job.customer?.customer_name || job.customer?.company_name || job.contractor?.company_name}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground text-center">No jobs found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {validationErrors.job_id && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.job_id}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-labor">Lead Labor *</Label>
                  <div className="relative">
                    <Input
                      id="lead-labor"
                      value={leadLaborSearch}
                      onChange={(e) => {
                        const value = e.target.value
                        setLeadLaborSearch(value)
                        // Check if value matches selected lead labor (use user.full_name, not users.full_name)
                        const selectedName = selectedLeadLabor?.user?.full_name || selectedLeadLabor?.users?.full_name || selectedLeadLabor?.labor_code || ''
                        if (selectedLeadLabor && value !== selectedName) {
                          setSelectedLeadLabor(null)
                          setOrderFormData(prev => ({ ...prev, lead_labour_id: '' }))
                        }
                        setShowLeadLaborResults(true)
                        if (value && value.length > 0) {
                          fetchLeadLaborList(value)
                        } else if (value.length === 0) {
                          fetchLeadLaborList('')
                        }
                        if (validationErrors.lead_labour_id) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.lead_labour_id
                            return newErrors
                          })
                        }
                      }}
                      onFocus={() => {
                        if (selectedLeadLabor) {
                          // Use user.full_name (singular), not users.full_name
                          const selectedName = selectedLeadLabor.user?.full_name || selectedLeadLabor.users?.full_name || selectedLeadLabor.labor_code || ''
                          setLeadLaborSearch(selectedName)
                        } else {
                          fetchLeadLaborList('')
                          setShowLeadLaborResults(true)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowLeadLaborResults(false), 200)
                      }}
                      placeholder="Search lead labor..."
                      className={`pr-10 ${validationErrors.lead_labour_id ? 'border-red-500' : ''}`}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {showLeadLaborResults && leadLaborList.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1">
                        {leadLaborList.map((leadLabor: any) => (
                          <div
                            key={leadLabor.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setSelectedLeadLabor(leadLabor)
                              setOrderFormData(prev => ({ ...prev, lead_labour_id: leadLabor.id?.toString() || '' }))
                              setShowLeadLaborResults(false)
                              setLeadLaborSearch(leadLabor.users?.full_name || leadLabor.name || leadLabor.labor_code || '')
                              if (validationErrors.lead_labour_id) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors.lead_labour_id
                                  return newErrors
                                })
                              }
                            }}
                            className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100"
                          >
                            <div className="font-medium">{leadLabor.users?.full_name || leadLabor.name || leadLabor.labor_code}</div>
                            <div className="text-sm text-muted-foreground">{leadLabor.labor_code || leadLabor.users?.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.lead_labour_id && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.lead_labour_id}</p>
                  )}
                </div>

                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <div className="relative">
                    <Input
                      id="customer"
                      value={customerSearch}
                      onChange={(e) => {
                        const value = e.target.value
                        setCustomerSearch(value)
                        if (selectedCustomer && value !== (selectedCustomer.customer_name || selectedCustomer.company_name || selectedCustomer.name || '')) {
                          setSelectedCustomer(null)
                          setOrderFormData(prev => ({ ...prev, customer_id: '' }))
                        }
                        setShowCustomerResults(true)
                        if (value && value.length > 0) {
                          fetchCustomerList(value)
                        } else if (value.length === 0) {
                          fetchCustomerList('')
                        }
                        if (validationErrors.customer_id) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.customer_id
                            return newErrors
                          })
                        }
                      }}
                      onFocus={() => {
                        if (selectedCustomer) {
                          setCustomerSearch(selectedCustomer.customer_name || selectedCustomer.company_name || selectedCustomer.name || '')
                        } else {
                          fetchCustomerList('')
                          setShowCustomerResults(true)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowCustomerResults(false), 200)
                      }}
                      placeholder="Search customer..."
                      className={`pr-10 ${validationErrors.customer_id ? 'border-red-500' : ''}`}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {showCustomerResults && customerList.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1">
                        {customerList.map((customer: any) => (
                          <div
                            key={customer.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setSelectedCustomer(customer)
                              setOrderFormData(prev => ({ ...prev, customer_id: customer.id?.toString() || '' }))
                              setShowCustomerResults(false)
                              setCustomerSearch(customer.customer_name || customer.company_name || customer.name || '')
                              if (validationErrors.customer_id) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors.customer_id
                                  return newErrors
                                })
                              }
                            }}
                            className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100"
                          >
                            <div className="font-medium">{customer.customer_name || customer.company_name || customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email || customer.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.customer_id && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.customer_id}</p>
                  )}
                </div>

              

                {/* Supplier Selection */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <div className="relative">
                    <Input
                      id="supplier"
                      value={supplierSearch}
                      onChange={(e) => {
                        const value = e.target.value
                        setSupplierSearch(value)
                        if (selectedSupplier && value !== (selectedSupplier.company_name || selectedSupplier.fullName || selectedSupplier.name || '')) {
                          setSelectedSupplier(null)
                          setOrderFormData(prev => ({ ...prev, supplier_id: '' }))
                        }
                        setShowSupplierResults(true)
                        if (value && value.length > 0) {
                          fetchSupplierList(value)
                        } else if (value.length === 0) {
                          fetchSupplierList('')
                        }
                        if (validationErrors.supplier_id) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.supplier_id
                            return newErrors
                          })
                        }
                      }}
                      onFocus={() => {
                        if (selectedSupplier) {
                          setSupplierSearch(selectedSupplier.company_name || selectedSupplier.fullName || selectedSupplier.name || '')
                        } else {
                          fetchSupplierList('')
                          setShowSupplierResults(true)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSupplierResults(false), 200)
                      }}
                      placeholder="Search supplier..."
                      className={`pr-10 ${validationErrors.supplier_id ? 'border-red-500' : ''}`}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {showSupplierResults && supplierList.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1">
                        {supplierList.map((supplier: any) => (
                          <div
                            key={supplier.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setSelectedSupplier(supplier)
                              setOrderFormData(prev => ({ ...prev, supplier_id: supplier.id?.toString() || '' }))
                              setShowSupplierResults(false)
                              setSupplierSearch(supplier.company_name || supplier.fullName || supplier.name || '')
                              if (validationErrors.supplier_id) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors.supplier_id
                                  return newErrors
                                })
                              }
                            }}
                            className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100"
                          >
                            <div className="font-medium">{supplier.company_name || supplier.fullName || supplier.name}</div>
                            <div className="text-sm text-muted-foreground">{supplier.users?.email || supplier.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.supplier_id && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.supplier_id}</p>
                  )}
                </div>

                {/* Order Date */}
                <div className="space-y-2">
                  <Label htmlFor="order-date">Order Date *</Label>
                  <Input
                    id="order-date"
                    type="date"
                    value={orderFormData.order_date}
                    onChange={(e) => {
                      setOrderFormData(prev => ({ ...prev, order_date: e.target.value }))
                      if (validationErrors.order_date) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.order_date
                          return newErrors
                        })
                      }
                    }}
                    className={validationErrors.order_date ? 'border-red-500' : ''}
                  />
                  {validationErrors.order_date && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.order_date}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-address">Delivery Address</Label>
                  <Textarea
                    id="delivery-address"
                    value={orderFormData.delivery_address}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                    placeholder="Delivery address..."
                    rows={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Customer notes..."
                    rows={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-city-zip">Delivery City/Zip</Label>
                  <Input
                    id="delivery-city-zip"
                    value={orderFormData.delivery_city_zip}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, delivery_city_zip: e.target.value }))}
                    placeholder="City, ZIP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-phone">Delivery Phone</Label>
                  <PhoneInput
                      id="delivery-phone"
                      value={orderFormData.delivery_phone}
                      onChange={(value) =>
                        setOrderFormData((prev) => ({
                          ...prev,
                          delivery_phone: value || "",
                        }))
                      }
                      limitMaxLength
                      international
                      defaultCountry="US"
                      placeholder="Phone number"
                      className="border border-gray-300 rounded-md px-2 py-2"
                    />
                </div>

                
              </div>

              {/* Product Selection */}
              <div className="space-y-4">
                <Label>Products *</Label>
                <div className="relative">
                  <Input
                    value={productSearch}
                    onChange={(e) => {
                      const value = e.target.value
                      setProductSearch(value)
                      setShowProductResults(true)
                      if (value && value.length > 0) {
                        fetchProductList(value)
                      } else if (value.length === 0) {
                        fetchProductList('')
                      }
                      if (validationErrors.cartItems) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.cartItems
                          return newErrors
                        })
                      }
                    }}
                    onFocus={() => {
                      fetchProductList('')
                      setShowProductResults(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowProductResults(false), 200)
                    }}
                    placeholder="Search products..."
                    className={`pr-10 ${validationErrors.cartItems ? 'border-red-500' : ''}`}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {showProductResults && productList.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1">
                      {productList
                        .filter((p: any) => !selectedProducts.find(sp => sp.id === p.id))
                        .map((product: any) => (
                          <div
                            key={product.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleProductSelection(product)
                              if (validationErrors.cartItems) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors.cartItems
                                  return newErrors
                                })
                              }
                            }}
                            className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100"
                          >
                            <div className="font-medium">{product.product_name || product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.jdp_sku || product.sku || product.supplier_sku} • ${product.unit_cost || product.jdp_price || 0}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {validationErrors.cartItems && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.cartItems}</p>
                )}

                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Selected Products</Label>
                    {selectedProducts.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium">{product.product_name || product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.jdp_sku || product.sku || product.supplier_sku}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={productQuantities[product.id] || 1}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1
                              updateProductQuantity(product.id, qty)
                            }}
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => router.push('/orders')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Order
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Order
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

