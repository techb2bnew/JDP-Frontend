'use client'

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceTemplate } from '@/components/invoices/InvoiceTemplate';
import { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Printer, Download, Mail } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceTemplatePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const invoiceRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedInvoice = localStorage.getItem('selectedInvoice');
    if (storedInvoice) {
      setInvoice(JSON.parse(storedInvoice)); 
    }
  }, [invoiceId]);

  const handlePrint = async () => {
  if (!printRef.current) return;

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
          <title>Invoice #${invoice?.invoiceNumber || ''}</title>
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


  const handleDownload = async () => {
    if (!printRef.current) return;
    
    setIsGeneratingPdf(true);
    try {
      // Add temporary class to ensure proper rendering
      printRef.current.classList.add('pdf-export');
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          return element.classList.contains('no-export');
        }
      });
      
      // Remove temporary class
      printRef.current.classList.remove('pdf-export');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice_${invoice?.invoiceNumber || 'unknown'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

const handleEmail = async () => {
  try {
    // 1. Generate the PDF properly
    const pdfDoc = new jsPDF();
    pdfDoc.text("Invoice Details", 10, 10);
    pdfDoc.text("Customer Name: John Doe", 10, 20);
    pdfDoc.text("Amount: $100.00", 10, 30);
    // Add more invoice details as needed
    
    const pdfData = pdfDoc.output('arraybuffer');
    
    // 2. Create download link
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(blob);
    
    // 3. Open email client with prefilled details
    const subject = 'Your Invoice #12345';
    const body = 'Dear Customer,\n\nPlease find your invoice attached.\n\nYou can also download it directly from this link if the attachment doesn\'t appear.\n\nBest regards,\nYour Company';
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    
    // 4. Force download the invoice
    const downloadLink = document.createElement('a');
    downloadLink.href = pdfUrl;
    downloadLink.download = 'Invoice_12345.pdf';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up after download
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  } catch (error) {
    console.error('Error generating/sending invoice:', error);
    alert('Failed to generate invoice. Please try again.');
  }
};

  if (!invoice) {
    return <div>Loading invoice...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={isGeneratingPdf}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button onClick={handleEmail} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Mail className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          </div>
        </div>
        
        {/* Invoice content for both display and print */}
        <div 
          ref={printRef}
          className="p-6 bg-white border border-black-400 rounded print:p-0 print:bg-white"
          style={{ 
            margin: '0 auto',
            width: '22cm', 
          }}
        >
          <InvoiceTemplate invoice={invoice} />
        </div>
      </div>
    </div>
  );
}