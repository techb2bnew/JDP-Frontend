'use client'

import { NewInvoiceDialog } from "@/components/invoices/NewInvoiceDialog"
import { useRouter, useSearchParams } from "next/navigation"

export default function CreateEstimatePage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <NewInvoiceDialog
        open={true}
        renderInline={true} 
        onOpenChange={() => router.back()} 
        onSave={() => {}}
        jobs={[]}
      />
    </div>
  )
}