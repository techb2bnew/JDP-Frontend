import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Separator } from '../ui/separator'
import { Invoice, Customer } from '../../types/invoice'
// import { formatCurrency, formatDate } from '../../utils/invoiceUtils'
import { customersData } from '../../data/invoiceData'

interface InvoiceTemplateProps {
  invoice: Invoice
}

export const InvoiceTemplate = ({ invoice }: InvoiceTemplateProps) => {
  const customer = customersData.find(c => c.id === invoice.customerId)

  return (
    <div className="bg-white p-8">
      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
          <div className="text-sm text-muted-foreground">
            <p>Invoice #: {invoice.invoiceNumber}</p>
            <p>Issue Date: 23523</p>
            <p>Due Date: 3255</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold mb-2">JDP Corporation</h2>
          <div className="text-sm text-muted-foreground">
            <p>1234 Business Street</p>
            <p>City, State 12345</p>
            <p>Phone: (555) 123-4567</p>
            <p>Email: billing@jdpcorp.com</p>
          </div>
        </div>
      </div>

      {/* Bill To & Job Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <div className="text-sm">
            <p className="font-medium">{invoice.customerName}</p>
            <p>{customer?.address}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Job Details:</h3>
          <div className="text-sm">
            <p><span className="font-medium">Job ID:</span> {invoice.jobId}</p>
            <p><span className="font-medium">Project:</span> {invoice.jobTitle}</p>
            <p><span className="font-medium">Type:</span> {invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)} Invoice</p>
          </div>
        </div>
      </div>

      {/* Items */}
      {invoice.items.length > 0 && (
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
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>235</TableCell>
                  <TableCell className="text-right">55</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Labor */}
      {invoice.labor.length > 0 && (
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
              {invoice.labor.map((labor) => (
                <TableRow key={labor.id}>
                  <TableCell>{labor.laborName}</TableCell>
                  <TableCell>{labor.description}</TableCell>
                  <TableCell>{labor.hours}h</TableCell>
                  <TableCell>43/h</TableCell>
                  <TableCell className="text-right">234</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Additional Costs */}
      {invoice.additionalCosts.length > 0 && (
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
              {invoice.additionalCosts.map((cost, index) => (
                <TableRow key={index}>
                  <TableCell>{cost.description}</TableCell>
                  <TableCell className="text-right">879</TableCell>
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
              <span>657</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({(invoice.taxRate * 100).toFixed(1)}%):</span>
              <span>666</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount:</span>
              <span className="text-primary">6575</span>
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