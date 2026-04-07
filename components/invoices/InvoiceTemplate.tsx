'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../utils/api';
import type { Invoice } from '../../types/invoice';

interface InvoiceTemplateProps {
  invoice?: Invoice;                 // optional: agar list se partial object pass karna ho
  invoiceId?: number | string;       // optional: modal/page se id pass karna ho
}

export const InvoiceTemplate = ({ invoice, invoiceId }: InvoiceTemplateProps) => {
  const searchParams = useSearchParams();

  const [finalId, setFinalId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(invoice ?? null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Prefer prop id; fallback to URL ?id=
  useEffect(() => {
    if (invoiceId != null) {
      setFinalId(String(invoiceId));
    } else {
      const urlId = searchParams.get('id');
      if (urlId) setFinalId(urlId);
    }
  }, [invoiceId, searchParams]);

  // Fetch only if we don't already have full invoice object
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!finalId || invoice) return;
      const idNum = Number(finalId);
      if (Number.isNaN(idNum)) {
        setError('Invalid invoice id');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.getEstimateById(idNum);
        setInvoiceData(res?.data || res);
      } catch (e: any) {
        console.error(e);
        setError(e?.response?.status === 401
          ? "You're not signed in. Please log in to view this invoice."
          : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [finalId, invoice]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!invoiceData) return <p>No invoice found</p>;

  const fmtMoney = (n: number | string | undefined) => `$${Number(n || 0).toFixed(2)}`;
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : 'N/A');

  return (
    <div className="bg-white p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
          <div className="text-sm text-muted-foreground">
            <p>Invoice #: {invoiceData?.invoice_number ?? '-'}</p>
            <p>Issue Date: {fmtDate(invoiceData?.issue_date)}</p>
            <p>Due Date: {fmtDate(invoiceData?.due_date)}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold mb-2">
            {invoiceData?.customer?.customer_name ?? '—'}
          </h2>
          <div className="text-sm text-muted-foreground">
            <p>{invoiceData?.customer?.address ?? '—'}</p>
            <p>Phone: {invoiceData?.customer?.phone ?? '—'}</p>
            <p>Email: {invoiceData?.customer?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Bill To & Job */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <div className="text-sm">
            <p className="font-medium">{invoiceData?.customer?.customer_name ?? '—'}</p>
            <p>{invoiceData?.customer?.address ?? '—'}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Job Details:</h3>
          <div className="text-sm">
            <p><span className="font-medium">Job ID:</span> {invoiceData?.job?.id ?? '—'}</p>
            <p><span className="font-medium">Project:</span> {invoiceData?.job?.job_title ?? '—'}</p>
            <p><span className="font-medium">Type:</span> {invoiceData?.job?.job_type ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      {Array.isArray(invoiceData?.products) && invoiceData.products.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-4">Items/Materials</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>SKU</TableHead> */}
                <TableHead>Pruduct Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceData.products.map((item: any) => {
                const qty = Number(item?.stock_quantity) || 0;
                const rate = Number(item?.unit_cost) || 0;
                const total = qty * rate;
                return (
                  <TableRow key={item.id}>
                    {/* <TableCell className="font-mono text-sm">{item?.jdp_sku || '-'}</TableCell> */}
                    <TableCell>{ item?.product_name || '-'}</TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell>{fmtMoney(rate)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {Array.isArray(invoiceData?.labor) && invoiceData.labor.length > 0 && (
  <div className="mb-8">
    {/* <h3 className="font-semibold mb-4">Time & Material</h3> */}
    <div className="flex items-center justify-between border rounded-lg p-3 text-sm">
      <span>Time & Material</span>
      <span className="font-semibold">
        {fmtMoney(
          invoiceData.labor.reduce((sum: number, lab: any) => {
            const hours = Number(lab?.hours_worked) || 0;
            const rate = Number(lab?.hourly_rate) || 0;
            return sum + hours * rate;
          }, 0)
        )}
      </span>
    </div>
  </div>
)}
      {/* Additional Costs */}
      {Array.isArray(invoiceData?.additional_costs_details) &&
        invoiceData.additional_costs_details.length > 0 && (
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
                {invoiceData.additional_costs_details.map((cost: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{cost?.description || '-'}</TableCell>
                    <TableCell className="text-right">{fmtMoney(cost?.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="space-y-2 text-sm">
            {/* <div className="flex justify-between">
              <span>Subtotal:</span> 
              <span>{fmtMoney(invoiceData?.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                Tax ({Number((invoiceData?.tax_percentage || 0) ).toFixed(1)}%):
              </span>
              <span>{fmtMoney(invoiceData?.tax_amount)}</span>
            </div> */}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount:</span>
              <span className="text-primary">{fmtMoney(invoiceData?.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoiceData?.notes && (
        <div className="mt-8 pt-4 border-t text-sm">
          <h4 className="font-semibold mb-2">Notes:</h4>
          <p>{invoiceData.notes}</p>
        </div>
      )}

      {/* Payment Terms */}
      <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
        <h4 className="font-semibold mb-2">Payment Terms:</h4>
        <p>Payment is due within 14 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.</p>
        <p className="mt-2">Thank you for your business!</p>
      </div>
    </div>
  );
};
