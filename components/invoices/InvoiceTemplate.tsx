import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Separator } from '../ui/separator'
import { Invoice, Customer } from '../../types/invoice'
import { apiClient } from '../../utils/api'
// import { formatCurrency, formatDate } from '../../utils/invoiceUtils'
import { toast } from 'sonner'
import { LoadingSpinner } from '../common/LoadingSpinner'
import {InvoiceTemplateProps} from '../../types/invoice'
import { Estimate } from '@/types/jobManagement'

export const InvoiceTemplate = ({ invoice }: InvoiceTemplateProps ) => {
  console.log('InvoiceTemplate invoice', invoice);
  const formattedDate = (date: string | number | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
  });

  // const customer = customersData.find(c => c.id === invoice.customerId) //invoice.customerId
  console.log('invoiceinvoice', invoice);
  if (!invoice) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="bg-white p-8">
      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
          <div className="text-sm text-muted-foreground">
            <p>Invoice #: {invoice.invoice_number}</p>
            <p>Issue Date: {invoice.issue_date}</p>
            <p>Due Date: {invoice.due_date}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold mb-2">{invoice.customer?.company_name}</h2>
          <div className="text-sm text-muted-foreground">
            <p>{invoice?.location}</p>
            <p>City, State 12345</p>
            <p>Phone: {invoice?.customer?.phone}</p>
            <p>Email: {invoice?.customer?.email}</p>
          </div>
        </div>
      </div>

      {/* Bill To & Job Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <div className="text-sm">
            <p className="font-medium">{invoice.customer?.customer_name}</p>
            {/* <p>{customer?.address}</p> */}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Job Details:</h3>
          <div className="text-sm">
            <p><span className="font-medium">Job ID:</span> {invoice.job.id}</p>
            <p><span className="font-medium">Project:</span> {invoice.job.job_title}</p>
            <p><span className="font-medium">Type:</span> {invoice.invoice_type} Invoice</p>
          </div>
        </div>
      </div>

      {/* Items */}
      {invoice.products && invoice.products.length > 0 && (
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
              {invoice.products.map((item:any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.jdp_sku}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.stock_quantity}</TableCell>
                  <TableCell>{item.unit_price}</TableCell>
                  <TableCell className="text-right">{item.total_price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Labor */}
      {invoice.labor && invoice.labor.length > 0 && (
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
              {invoice.labor.map((labor:any) => (
                <TableRow key={labor.id}>
                  <TableCell>{labor.user.full_name}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{labor.hours_worked}h</TableCell>
                  <TableCell>{labor.hourly_rate}/h</TableCell>
                  <TableCell className="text-right">{labor.total_cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Additional Costs */}
      
      {invoice.additional_costs_details && invoice.additional_costs_details.length > 0 && (
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
              {invoice.additional_costs_details.map((cost: any, index: number) => {
                console.log("Cost at index", index, ":", cost); // <-- console.log here
                return (
                  <TableRow key={index}>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell className="text-right">{cost.amount}</TableCell>
                  </TableRow>
                );
              })}
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
              <span>{invoice.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax: {invoice.tax_percentage }</span>
              <span>{invoice.tax_amount}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount:</span>
              <span className="text-primary">{invoice.total_amount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-8 pt-4 border-t text-sm">
          <h4 className="font-semibold mb-2">Notes:</h4>
          <p>{invoice.notes}</p>
        </div>
      )}

      {/* Payment Terms */}
      <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
        <h4 className="font-semibold mb-2">Payment Terms:</h4>
        <p>Payment is due within 14 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.</p>
        <p className="mt-2">Thank you for your business!</p>
      </div>
    </div>
  )
}