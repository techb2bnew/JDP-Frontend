'use client'

import { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceTemplate } from '@/components/invoices/InvoiceTemplate';
import { Button } from '@/components/ui/button';
import { Printer, Download, Mail } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceTemplatePage() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');          // <-- get from URL
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList.contains('no-export'),
      });
      const imageData = canvas.toDataURL('image/png');
      const w = window.open('', '_blank'); if (!w) return;
      w.document.write(`
        <html><head><title>Invoice #${invoiceId || ''}</title>
        <style>body,html{margin:0} img{width:100%;height:auto}</style>
        </head><body><img src="${imageData}"/></body></html>
      `);
      w.document.close();
      w.onload = () => { setTimeout(() => { w.print(); w.close(); }, 400); };
    } catch (err) { console.error('Print error:', err); }
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      printRef.current.classList.add('pdf-export');
      const canvas = await html2canvas(printRef.current, {
        scale: 2, logging: false, useCORS: true, backgroundColor: '#fff',
        ignoreElements: (el) => el.classList.contains('no-export'),
      });
      printRef.current.classList.remove('pdf-export');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210, pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight, position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`invoice_${invoiceId || 'unknown'}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally { setIsGeneratingPdf(false); }
  };

  const handleEmail = async () => {
    const subject = `Your Invoice #${invoiceId || ''}`;
    const body = `Dear Customer,\n\nPlease find your invoice attached.\n\nBest regards,\nYour Company`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (!invoiceId) return <div className="p-6">No invoice id in URL.</div>; // guard

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-2xl font-semibold">Invoice Preview</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={isGeneratingPdf}>
              <Download className="h-4 w-4 mr-2" /> {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button onClick={handleEmail} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Mail className="h-4 w-4 mr-2" /> Send to Customer
            </Button>
          </div>
        </div>

        <div
          ref={printRef}
          className="p-6 bg-white border border-black-400 rounded print:p-0 print:bg-white"
          style={{ margin: '0 auto', width: '22cm' }}
        >
          {/* ✅ Pass the id down */}
          <InvoiceTemplate invoiceId={invoiceId} />
        </div>
      </div>
    </div>
  );
}
