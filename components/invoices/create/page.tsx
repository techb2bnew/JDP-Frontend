'use client'

import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { NewInvoiceDialog } from "@/components/invoices/NewInvoiceDialog";
import { apiClient } from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreateEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");
  const invoiceId = searchParams.get("id");
  const jobIdParam = searchParams.get("jobId");
  const parentIdParam = searchParams.get("parentId");
  const listingSourceParam = searchParams.get("listingSource");
  const fromListing = searchParams.get("fromListing") === "1";
  const prefillJobId =
    fromListing && jobIdParam ? Number(jobIdParam) : undefined;
  const listingParentId =
    fromListing && parentIdParam ? parentIdParam : undefined;
  const listingSource =
    fromListing &&
    (listingSourceParam === "customers" ||
      listingSourceParam === "contractors")
      ? listingSourceParam
      : undefined;

  const isViewMode = mode === "view" && !!invoiceId;

  console.log(mode , invoiceId,"invoiceIdinvoiceId");
    console.log("helloooo");

  
  

  const [loading, setLoading] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true);

        // jobs optional but useful for dropdown / selected job
        try {
          const jobsResponse = await apiClient.getJobs(1, 100);
          const jobsData = jobsResponse?.data || jobsResponse || [];
          setJobs(Array.isArray(jobsData) ? jobsData : jobsData.data || []);
        } catch (err) {
          console.error("Failed to load jobs:", err);
        }

        if (isViewMode && invoiceId) {
          const response = await apiClient.getEstimateById(invoiceId);
          const estimateData = response?.data || response;

          const customerName =
            estimateData?.customer?.customer_name ||
            estimateData?.customer_name ||
            "No customer name";

          const customerAddress =
            estimateData?.customer?.address ||
            estimateData?.customer_address ||
            "No address available";

          const project =
            estimateData?.estimate_title || "No project name";

          const customerId =
            estimateData.customer_id ||
            estimateData.customer?.id ||
            (typeof estimateData.customer === "number"
              ? estimateData.customer
              : null);

          const contractorId =
            estimateData.contractor_id ||
            estimateData.contractor?.id ||
            (typeof estimateData.contractor === "number"
              ? estimateData.contractor
              : null);

          const processedData = {
            ...estimateData,
            customer_id: customerId,
            contractor_id: contractorId,
            customer: {
              ...estimateData.customer,
              id:
                estimateData.customer?.id ||
                estimateData.customer_id ||
                (typeof estimateData.customer === "number"
                  ? estimateData.customer
                  : null),
              customer_name: customerName,
              address: customerAddress,
            },
            estimate_title: project,
          };

          setViewInvoiceData(processedData);
        }
      } catch (error) {
        console.error("Error loading invoice page:", error);
        toast.error("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [invoiceId, isViewMode]);
  console.log(isViewMode,"isViewMode");
  

  if (loading) {
    return  <div className="flex justify-center align-middle w-[100%] h-[80vh] items-center"><LoadingSpinner /></div>
    ;
  }

  return (
    <div className="p-6">
      <NewInvoiceDialog
        open={true}
        renderInline={true}
        onOpenChange={() => router.push("/invoices")}
        onSave={() => {}}
        jobs={jobs}
        jobId={prefillJobId}
        prefillFromListing={fromListing && !!jobIdParam}
        listingParentId={listingParentId}
        listingSource={listingSource}
        isViewMode={isViewMode}
        viewInvoiceData={viewInvoiceData}
        onInvoiceSaved={() => router.push("/invoices")}
      />
    </div>
  );
}