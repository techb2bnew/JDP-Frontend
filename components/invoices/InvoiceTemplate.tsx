'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Separator } from '../ui/separator'
import { Invoice, Customer } from '../../types/invoice'
// import { formatCurrency, formatDate } from '../../utils/invoiceUtils'
import { customersData } from '../../data/invoiceData'
import { apiClient } from '../../utils/api'
import { useSearchParams } from 'next/navigation'

interface InvoiceTemplateProps {
  invoice?: Invoice
  invoiceId?: number | string
}

export const InvoiceTemplate = ({ invoice, invoiceId }: InvoiceTemplateProps) => {
  const searchParams = useSearchParams()
  const id = invoiceId?.toString() || searchParams.get('id')// string | null
  console.log('ididid', typeof (id), id);
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        setError(null)
        if (!id) return
        const res = await apiClient.getEstimateById(Number(id))
        setInvoiceData((res?.data || res))
        console.log("API Response:", res);
        console.log("Invoice being set:", res?.data || res);
      } catch (e) {
        console.error(e)
        setError("Failed to load invoice")
      } finally {
        setLoading(false)
      }
    }
    if (!invoice && id) {
      fetchInvoice()
    }
  }, [id, invoice])

  if (loading) return <p>Loading invoice...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!invoiceData) return <p>No invoice found</p>

  console.log(invoiceData, "innss")
  // const customer = customersData.find(c => c.id === invoice.customerId)

  return (

    <>
      <div className="bg-white p-8">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
            <div className="text-sm text-muted-foreground">
              <p>Invoice #: {invoiceData?.invoice_number}</p>
              <p>Issue Date: {invoiceData?.issue_date}</p>
              <p>Due Date: {invoiceData?.due_date}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold mb-2">{invoiceData?.customer?.customer_name}</h2>
            <div className="text-sm text-muted-foreground">
              <p>{invoiceData?.customer?.address}</p>
              <p>Phone:{invoiceData?.customer?.phone}</p>
              <p>Email:{invoiceData?.customer?.email}</p>
            </div>
          </div>
        </div>

        {/* Bill To & Job Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <div className="text-sm">
              <p className="font-medium">{invoiceData?.customer.customer_name}</p>
              <p>{invoiceData?.customer?.address}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Job Details:</h3>
            <div className="text-sm">
              <p><span className="font-medium">Job ID:</span> {invoiceData?.job?.id}</p>
              <p><span className="font-medium">Project:</span> {invoiceData?.job?.job_title}</p>
              <p>
                <span className="font-medium">Type:</span>{" "}
                {invoiceData?.job?.job_type}
              </p>

            </div>
          </div>
        </div>

        {/* Items */}
        {invoiceData?.products?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Items/Materials</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceData?.products?.map((item: any) => {
                  const quantity = Number(item?.stock_quantity) || 0;
                  const unitCost = Number(item?.unit_cost) || 0;
                  const total = quantity * unitCost;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item?.jdp_sku || '-'}</TableCell>
                      <TableCell>{item?.description || item?.product_name || '-'}</TableCell>
                      <TableCell>{quantity}</TableCell>
                      <TableCell>{unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{total.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}


        {/* Labor */}
        {/* Labor */}
        {invoiceData?.labor?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Labor</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Labor Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceData?.labor?.map((labor: any) => {
                  const hours = Number(labor?.hours_worked) || 0;
                  const rate = Number(labor?.hourly_rate) || 0;
                  const total = hours * rate;

                  return (
                    <TableRow key={labor.id}>
                      <TableCell>{labor?.user?.full_name || '-'}</TableCell>
                      <TableCell>{labor?.description || '-'}</TableCell>
                      <TableCell>{hours}h</TableCell>
                      <TableCell>{rate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{total.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}


        {/* Additional Costs */}
        {invoiceData?.additional_costs_details?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Additional Costs</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceData?.additional_costs_details?.map((cost: any, index: any) => (
                  <TableRow key={index}>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell className="text-right">{cost?.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Invoice Summary */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{invoiceData?.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({(invoiceData?.tax_percentage * 100).toFixed(1)}%):</span>
                <span>{invoiceData?.tax_amount}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">{invoiceData?.total_amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoiceData?.notes && (
          <div className="mt-8 pt-4 border-t text-sm">
            <h4 className="font-semibold mb-2">Notes:</h4>
            <p>{invoiceData?.notes}</p>
          </div>
        )}

        {/* Payment Terms */}
        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
          <h4 className="font-semibold mb-2">Payment Terms:</h4>
          <p>Payment is due within 14 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.</p>
          <p className="mt-2">Thank you for your business!</p>
        </div>
      </div>
    </>
  )
}