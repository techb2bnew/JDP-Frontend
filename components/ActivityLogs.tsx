"use client";

import { apiClient } from "@/utils/api";
import React, { useEffect, useState } from "react";
// import { apiClient } from "@/lib/apiClient";

type ActivityType =
  | "job_created"
  | "job_started"
  | "job_updated"
  | "labour_hours_logged"
  | "document_uploaded"
  | "invoice_generated"
  | "status_updated"
  | "lead_assigned"
  | "labor_assigned"
  | "bluesheet_submitted"
  | "material_ordered";

type ActivityLogItem = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  userName: string;
  type: ActivityType;
  avatar?: string;
};

type ActivityLogsProps = {
  jobId: string;
  title?: string;
//   refreshTrigger?: number | string | boolean;
};

type ApiUser = {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  role?: string;
};

type ApiLeadLabor = {
  id: number;
  labor_code: string;
  users?: ApiUser;
};

type ApiAssignedLeadLabor = {
  id: number;
  labor_code: string;
  user?: ApiUser;
};

type ApiAssignedLabor = {
  id: number;
  labor_code: string;
  user?: ApiUser;
};

type ApiLaborTimesheet = {
  id: number;
  date: string;
  work_activity?: string;
  created_at: string;
  labor?: {
    users?: ApiUser;
  } | null;
  lead_labor?: ApiLeadLabor | null;
};

type ApiMaterialEntry = {
  id: number;
  material_name?: string;
  supplier_order_id?: string;
};

type ApiBlueSheet = {
  id: number;
  date: string;
  created_at: string;
  status?: string;
  created_by_user?: ApiUser;
  updated_by_user?:ApiUser;
  material_entries?: ApiMaterialEntry[];
};

type JobActivityApiResponse = {
  success: boolean;
  message: string;
  data: {
    job: {
      id: number;
      job_title: string;
      status: string;
      created_at: string;
      updated_at: string;
      created_by_user?: ApiUser;
      updated_by_user?:ApiUser;
    };
    total_orders?: number;
    regular_hours?: {
      total_seconds: number;
      formatted: string;
    };
    labor_timesheets?: ApiLaborTimesheet[];
    assigned_labor?: ApiAssignedLabor[];
    assigned_lead_labor?: ApiAssignedLeadLabor[];
    bluesheets?: ApiBlueSheet[];
  };
  statusCode: number;
};

const dummyActivities: ActivityLogItem[] = [
  {
    id: "1",
    title: "Job Created",
    description: "Base2brand job was created.",
    dateLabel: "Mar 16, 2026",
    userName: "deepak sharma",
    type: "job_created",
  },
  {
    id: "2",
    title: "Lead Labor Assigned",
    description: "deepak sharma was assigned as lead labor.",
    dateLabel: "Mar 17, 2026",
    userName: "deepak sharma",
    type: "lead_assigned",
  },
  {
    id: "3",
    title: "Labor Assigned",
    description: "Labor team members were assigned to this job.",
    dateLabel: "Mar 17, 2026",
    userName: "admin",
    type: "labor_assigned",
  },
];

const formatDateLabel = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name: string) => {
  const cleanName = (name || "").trim();
  if (!cleanName) return "NA";
  const parts = cleanName.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const getTypeStyles = (type: ActivityType) => {
  switch (type) {
    case "job_created":
      return {
        iconBg: "bg-blue-500",
        cardBg: "bg-blue-50",
        cardBorder: "border-blue-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
            />
          </svg>
        ),
      };
    case "job_updated":
      return {
        iconBg: "bg-yellow-500",
        cardBg: "bg-yellow-50",
        cardBorder: "border-yellow-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5h2m-1-1v2m6.364 1.636l-1.414 1.414M19 11h-2m1 7v-2m-5 3h-2m-5.364-1.636l1.414-1.414M5 13h2m-1-7v2m1.636 1.636L6.222 8.222M12 8a4 4 0 100 8 4 4 0 000-8z"
            />
          </svg>
        ),
      };
    case "job_started":
      return {
        iconBg: "bg-emerald-500",
        cardBg: "bg-emerald-50",
        cardBorder: "border-emerald-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7-11-7z" />
          </svg>
        ),
      };

    case "labour_hours_logged":
      return {
        iconBg: "bg-amber-500",
        cardBg: "bg-amber-50",
        cardBorder: "border-amber-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5" />
          </svg>
        ),
      };

    case "document_uploaded":
      return {
        iconBg: "bg-violet-500",
        cardBg: "bg-violet-50",
        cardBorder: "border-violet-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01.88-7.903A5 5 0 1115.9 6L16 6a4 4 0 011 7.874M12 12v7m0 0l-3-3m3 3l3-3"
            />
          </svg>
        ),
      };

    case "invoice_generated":
      return {
        iconBg: "bg-rose-500",
        cardBg: "bg-rose-50",
        cardBorder: "border-rose-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 14l2 2 4-4M7 4h10a2 2 0 012 2v12l-3-2-2 2-2-2-2 2-3-2V6a2 2 0 012-2z"
            />
          </svg>
        ),
      };

    case "status_updated":
      return {
        iconBg: "bg-sky-500",
        cardBg: "bg-sky-50",
        cardBorder: "border-sky-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
      };

    case "lead_assigned":
      return {
        iconBg: "bg-indigo-500",
        cardBg: "bg-indigo-50",
        cardBorder: "border-indigo-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H11a4 4 0 00-4 4v2m10 0H7m10-10a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      };

    case "labor_assigned":
      return {
        iconBg: "bg-teal-500",
        cardBg: "bg-teal-50",
        cardBorder: "border-teal-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V4H2v16h5m10 0a3 3 0 00-3-3H10a3 3 0 00-3 3m10 0H7m8-10a3 3 0 11-6 0 3 3 0 016 0zm6 2a2 2 0 11-4 0 2 2 0 014 0zM7 12a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      };

    case "bluesheet_submitted":
      return {
        iconBg: "bg-cyan-500",
        cardBg: "bg-cyan-50",
        cardBorder: "border-cyan-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
        ),
      };

    case "material_ordered":
      return {
        iconBg: "bg-orange-500",
        cardBg: "bg-orange-50",
        cardBorder: "border-orange-100",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0l-2.586 2.586a2 2 0 01-1.414.586H8a2 2 0 01-1.414-.586L4 13m16 0V9a2 2 0 00-2-2h-1M4 13V9a2 2 0 012-2h1" />
          </svg>
        ),
      };

    default:
      return {
        iconBg: "bg-gray-500",
        cardBg: "bg-gray-50",
        cardBorder: "border-gray-100",
        icon: null,
      };
  }
};

const ActivityTimelineItem = ({
  item,
  isLast,
}: {
  item: ActivityLogItem;
  isLast: boolean;
}) => {
  const styles = getTypeStyles(item.type);

  return (
    <div className="relative flex gap-4">
      <div className="relative flex w-10 shrink-0 justify-center">
        {!isLast && <div className="absolute top-10 bottom-[-18px] w-[2px] bg-gray-200" />}
        <div
          className={`relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full ${styles.iconBg} shadow-sm`}
        >
          {styles.icon}
        </div>
      </div>

      <div
        className={`mb-4 w-full rounded-2xl border p-4 shadow-sm ${styles.cardBg} ${styles.cardBorder}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-gray-800">{item.title}</h3>
          <span className="shrink-0 text-xs font-semibold text-blue-600">
            {item.dateLabel}
          </span>
        </div>

        <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          {item.avatar ? (
            <img
              src={item.avatar}
              alt={item.userName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">
              {getInitials(item.userName)}
            </div>
          )}
          <span className="capitalize">{item.userName}</span>
        </div>
      </div>
    </div>
  );
};

const mapApiResponseToActivities = (
  response: JobActivityApiResponse
): ActivityLogItem[] => {
  const result: ActivityLogItem[] = [];
  const payload = response?.data;

  if (!payload?.job) return [];

  const job = payload.job;
  console.log(job,"job.updated_by_user");
  

  result.push({
    id: `job-created-${job.id}`,
    title: "Job Created",
    description: `${job.job_title} was created.`,
    dateLabel: formatDateLabel(job.created_at),
    userName: job.created_by_user?.full_name?.trim() || "system",
    type: "job_created",
  });

  if(job.updated_by_user){
      result.push({
    id: `job-updated-${job.id}`,
    title: "Job Updated",
    description: `${job.job_title} was updated.`,
    dateLabel: formatDateLabel(job.updated_at),
    userName: job.updated_by_user?.full_name?.trim() || "system",
    type: "job_updated",
  });
  }

  if (payload.assigned_lead_labor?.length) {
    payload.assigned_lead_labor.forEach((lead) => {
      result.push({
        id: `lead-${lead.id}`,
        title: "Lead Labor Assigned",
        description: `${lead.user?.full_name?.trim() || "Lead labor"} was assigned as lead labor.`,
        dateLabel: formatDateLabel(job.updated_at || job.created_at),
        userName: lead.user?.full_name?.trim() || "admin",
        type: "lead_assigned",
      });
    });
  }

  if (payload.assigned_labor?.length) {
    payload.assigned_labor.forEach((labor) => {
      result.push({
        id: `labor-${labor.id}`,
        title: "Labor Assigned",
        description: `${labor.user?.full_name?.trim() || "Labor"} was assigned to this job.`,
        dateLabel: formatDateLabel(job.updated_at || job.created_at),
        userName: labor.user?.full_name?.trim() || "admin",
        type: "labor_assigned",
      });
    });
  }

  if (payload.labor_timesheets?.length) {
    payload.labor_timesheets.forEach((timesheet) => {
      const workerName =
        timesheet.lead_labor?.users?.full_name?.trim() ||
        timesheet.labor?.users?.full_name?.trim() ||
        "Labor";

      result.push({
        id: `timesheet-${timesheet.id}`,
        title: "Labour Hours Logged",
        description: `${workerName} logged ${timesheet.work_activity || "00:00:00"} labour hours.`,
        dateLabel: formatDateLabel(timesheet.created_at || timesheet.date),
        userName: workerName,
        type: "labour_hours_logged",
      });
    });
  }

  if (payload.bluesheets?.length) {
    payload.bluesheets.forEach((sheet) => {
      result.push({
        id: `bluesheet-${sheet.id}`,
        title: "Bluesheet Submitted",
        description: `Bluesheet was submitted with status ${sheet.status || "draft"}.`,
        dateLabel: formatDateLabel(sheet.created_at || sheet.date),
        userName: sheet.created_by_user?.full_name?.trim() || "staff",
        type: "bluesheet_submitted",
      });

      const uniqueOrderIds = Array.from(
        new Set(
          (sheet.material_entries || [])
            .map((entry) => entry.supplier_order_id)
            .filter(Boolean)
        )
      );

      uniqueOrderIds.forEach((orderId, index) => {
        result.push({
          id: `material-order-${sheet.id}-${index}`,
          title: "Material Ordered",
          description: `Supplier order ${orderId} was linked with this bluesheet.`,
          dateLabel: formatDateLabel(sheet.created_at || sheet.date),
          userName: sheet.created_by_user?.full_name?.trim() || "staff",
          type: "material_ordered",
        });
      });
    });
  }

  if (job.status) {
    result.push({
      id: `status-${job.id}`,
      title: "Status Updated",
      description: `Job status is currently "${job.status}".`,
      dateLabel: formatDateLabel(job.updated_at || job.created_at),
      userName: job.created_by_user?.full_name?.trim() || "system",
      type: "status_updated",
    });
  }

  return result.sort((a, b) => {
    const dateA = new Date(a.dateLabel).getTime();
    const dateB = new Date(b.dateLabel).getTime();
    return dateA - dateB;
  });
};

export default function ActivityLogs({
  jobId,
  title = "Activity Timeline",
//   refreshTrigger,
}: ActivityLogsProps) {
  const [activities, setActivities] = useState<ActivityLogItem[]>(dummyActivities);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActivityLogs = async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const response: JobActivityApiResponse = await apiClient.getActivityLogsByJob(jobId);

      if (response?.success && response?.data) {
        const mappedActivities = mapApiResponseToActivities(response);
        setActivities(mappedActivities.length ? mappedActivities : dummyActivities);
      } else {
        setActivities(dummyActivities);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      setActivities(dummyActivities);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [jobId]);

  return (
    <div className="mt-6 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l6-6 4 4 6-6" />
        </svg>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="max-h-[600px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex gap-4">
                <div className="flex w-10 shrink-0 justify-center">
                  <div className="mt-1 h-9 w-9 animate-pulse rounded-full bg-gray-200" />
                </div>
                <div className="mb-4 w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-full rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-3/4 rounded bg-gray-200" />
                  <div className="mt-4 h-6 w-24 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          activities.map((item, index) => (
            <ActivityTimelineItem
              key={item.id}
              item={item}
              isLast={index === activities.length - 1}
            />
          ))
        ) : (
          <div className="py-10 text-center text-sm text-gray-500">
            No activity logs found.
          </div>
        )}
      </div>
    </div>
  );
}