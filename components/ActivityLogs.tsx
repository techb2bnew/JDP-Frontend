"use client";

import { apiClient } from "@/utils/api";
import React, { useEffect, useState } from "react";

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
  sortDate?: string;
  priority?: number;
};

type ActivityLogsProps = {
  jobId: string;
  title?: string;
};

type ApiUser = {
  id: number;
  full_name?: string | null;
  /** Some endpoints use `name` instead of full_name */
  name?: string | null;
  email?: string | null;
  phone?: string;
  role?: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

type ApiLeadLabor = {
  id: number;
  labor_code: string;
  users?: ApiUser;
  user?: ApiUser;
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
    user?: ApiUser;
  } | null;
  lead_labor?: ApiLeadLabor | null;
  created_by_user?: ApiUser | null;
};

type ApiMaterialEntry = {
  id: number;
  material_name?: string;
  supplier_order_id?: string;
  quantity?: number;
  unit_cost?: number;
  total_cost?: number | null;
  material_used?: number;
  total_ordered?: number;
  product_id?: number;
  unit?: string;
  return_to_warehouse?: boolean;
  product?: {
    id: number;
    jdp_price?: number;
    product_name?: string;
    supplier_cost_price?: number;
  };
};

type ApiBlueSheet = {
  id: number;
  date: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  created_by_user?: ApiUser;
  updated_by_user?: ApiUser | null;
  material_entries?: ApiMaterialEntry[];
};

type ApiInvoiceActivity = {
  estimate_id: number;
  invoice_number: string;
  status: string;
  invoice_sent_at?: string;
  invoice_sent_to?: string;
  invoice_link?: string;
  qb_invoice_id?: string | null;
  sent_by_user?: ApiUser | null;
};

type ApiBlueSheetSubmittedBy = {
  bluesheet_id: number;
  submitted_at: string;
  submitted_by?: ApiUser;
};

type ApiActivityAudit = {
  job_created_by?: ApiUser;
  job_updated_by?: ApiUser | null;
  labor_assigned_by?: ApiUser;
  lead_labor_assigned_by?: ApiUser;
  bluesheet_submitted_by?: ApiBlueSheetSubmittedBy[];
  invoice_activity?: ApiInvoiceActivity[];
};

type JobActivityApiResponse = {
  success: boolean;
  message: string;
  data: {
    job: {
      id: number;
      job_title: string;
      job_type?: string;
      description?: string;
      status: string;
      priority?: string;
      customer_id?: number;
      contractor_id?: number | null;
      estimated_cost?: number;
      due_date?: string;
      created_at: string;
      updated_at: string;
      created_by_user?: ApiUser;
      updated_by_user?: ApiUser | null;
      /** Plain-text fallbacks when user object is not nested */
      created_by_name?: string | null;
      updated_by_name?: string | null;
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
    activity_audit?: ApiActivityAudit;
  };
  statusCode: number;
};

const activityPriority: Record<ActivityType, number> = {
  job_created: 1,
  lead_assigned: 2,
  labor_assigned: 3,
  labour_hours_logged: 4,
  material_ordered: 5,
  bluesheet_submitted: 6,
  invoice_generated: 7,
  status_updated: 8,
  job_updated: 9,
  job_started: 10,
  document_uploaded: 11,
};

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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l2.5 2.5"
            />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H11a4 4 0 00-4 4v2m10 0H7m10-10a4 4 0 11-8 0 4 4 0 018 0z"
            />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5V4H2v16h5m10 0a3 3 0 00-3-3H10a3 3 0 00-3 3m10 0H7m8-10a3 3 0 11-6 0 3 3 0 016 0zm6 2a2 2 0 11-4 0 2 2 0 014 0zM7 12a2 2 0 11-4 0 2 2 0 014 0z"
            />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
            />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0l-2.586 2.586a2 2 0 01-1.414.586H8a2 2 0 01-1.414-.586L4 13m16 0V9a2 2 0 00-2-2h-1M4 13V9a2 2 0 012-2h1"
            />
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
        {!isLast && (
          <div className="absolute top-10 bottom-[-18px] w-[2px] bg-gray-200" />
        )}
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
          <h3 className="text-[15px] font-semibold text-gray-800">
            {item.title}
          </h3>
          <span className="shrink-0 text-xs font-semibold text-blue-600">
            {item.dateLabel}
          </span>
        </div>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          {item.description}
        </p>
      </div>
    </div>
  );
};

/** Non-empty display string, or null (never treat "system" as a real name). */
const normalizeActorLabel = (raw?: string | null): string | null => {
  const s = raw?.trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (
    lower === "system" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a"
  ) {
    return null;
  }
  return s;
};

const nameFromUser = (u?: ApiUser | null): string | null => {
  if (!u) return null;
  const combined = [u.first_name, u.last_name]
    .map(normalizeActorLabel)
    .filter(Boolean)
    .join(" ")
    .trim();

  const fullName = normalizeActorLabel(u.full_name);
  const name = normalizeActorLabel(u.name);
  const combinedName = normalizeActorLabel(combined || null);

  if (fullName) return fullName;
  if (name) return name;
  if (combinedName) return combinedName;

  const email = normalizeActorLabel(u.email);
  if (email && email.includes("@")) {
    // lead@yopmail.com -> lead, john.doe@example.com -> john doe
    return email.split("@")[0].replace(/[._]/g, " ");
  }

  return email || normalizeActorLabel(u.username);
};

/** Try to format a string if it looks like an email */
const formatIfEmail = (s?: string | null): string | null => {
  const n = normalizeActorLabel(s);
  if (!n) return null;
  if (n.includes("@")) {
    return n.split("@")[0].replace(/[._]/g, " ");
  }
  return n;
};

/** Try each user object or plain string; avoid falsely showing "System" when a real actor exists later in the list. */
const resolveActor = (
  ...candidates: Array<ApiUser | string | null | undefined>
): string => {
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === "string") {
      const n = formatIfEmail(c);
      if (n) return n;
      continue;
    }
    const n = nameFromUser(c);
    if (n) return n;
  }
  return "Unknown user";
};

const mapApiResponseToActivities = (
  response: JobActivityApiResponse
): ActivityLogItem[] => {
  const result: ActivityLogItem[] = [];
  const payload = response?.data;
  const activityAudit = payload?.activity_audit;

  if (!payload?.job) return [];

  const job = payload.job;

  const createdBy = resolveActor(
    activityAudit?.job_created_by,
    job.created_by_user,
    job.created_by_name,
  );

  const updatedBy = resolveActor(
    activityAudit?.job_updated_by,
    job.updated_by_user,
    job.updated_by_name,
  );

  result.push({
    id: `job-created-${job.id}`,
    title: "Job Created",
    description: `${createdBy} created the job "${job.job_title}".`,
    dateLabel: formatDateLabel(job.created_at),
    userName: createdBy,
    type: "job_created",
    sortDate: job.created_at,
    priority: activityPriority.job_created,
  });

  if (job.updated_by_user || activityAudit?.job_updated_by) {
    result.push({
      id: `job-updated-${job.id}`,
      title: "Job Updated",
      description: `${updatedBy} updated the job "${job.job_title}".`,
      dateLabel: formatDateLabel(job.updated_at),
      userName: updatedBy,
      type: "job_updated",
      sortDate: job.updated_at,
      priority: activityPriority.job_updated,
    });
  }

  if (payload.assigned_lead_labor?.length) {
    payload.assigned_lead_labor.forEach((lead) => {
      const assignedLeadName =
        nameFromUser(lead.user) ||
        formatIfEmail(lead.labor_code) ||
        "Lead labor";
      const assignedBy = resolveActor(
        activityAudit?.lead_labor_assigned_by,
        job.updated_by_user,
        job.updated_by_name,
        job.created_by_user,
        job.created_by_name,
      );
      const sortDate = job.updated_at || job.created_at;

      result.push({
        id: `lead-${lead.id}`,
        title: "Lead Labour Assigned",
        description: `${assignedBy} assigned ${assignedLeadName} as lead labor.`,
        dateLabel: formatDateLabel(sortDate),
        userName: assignedBy,
        type: "lead_assigned",
        sortDate,
        priority: activityPriority.lead_assigned,
      });
    });
  }

  if (payload.assigned_labor?.length) {
    payload.assigned_labor.forEach((labor) => {
      const assignedLaborName =
        nameFromUser(labor.user) ||
        formatIfEmail(labor.labor_code) ||
        "Labour";
      const assignedBy = resolveActor(
        activityAudit?.labor_assigned_by,
        job.updated_by_user,
        job.updated_by_name,
        job.created_by_user,
        job.created_by_name,
      );
      const sortDate = job.updated_at || job.created_at;

      result.push({
        id: `labor-${labor.id}`,
        title: "Labour Assigned",
        description: `${assignedBy} assigned ${assignedLaborName} to this job.`,
        dateLabel: formatDateLabel(sortDate),
        userName: assignedBy,
        type: "labor_assigned",
        sortDate,
        priority: activityPriority.labor_assigned,
      });
    });
  }

  if (payload.labor_timesheets?.length) {
    payload.labor_timesheets.forEach((timesheet) => {
      const workerName = resolveActor(
        timesheet.created_by_user,
        timesheet.lead_labor?.users,
        timesheet.lead_labor?.user,
        timesheet.labor?.users,
        timesheet.labor?.user,
      );

      const sortDate = timesheet.created_at || timesheet.date;

      result.push({
        id: `timesheet-${timesheet.id}`,
        title: "Labour Hours Logged",
        description: `${workerName} logged ${
          timesheet.work_activity || "00:00:00"
        } labor hours.`,
        dateLabel: formatDateLabel(sortDate),
        userName: workerName,
        type: "labour_hours_logged",
        sortDate,
        priority: activityPriority.labour_hours_logged,
      });
    });
  }

  if (activityAudit?.invoice_activity?.length) {
    activityAudit.invoice_activity.forEach((invoice, index) => {
      const sentBy = resolveActor(
        invoice.sent_by_user,
        job.updated_by_user,
        job.updated_by_name,
        job.created_by_user,
        job.created_by_name,
      );
      const sortDate = invoice.invoice_sent_at || job.updated_at || job.created_at;

      result.push({
        id: `invoice-${invoice.estimate_id}-${index}`,
        title: "Invoice Sent",
        description: `${sentBy} sent invoice ${invoice.invoice_number} to ${
          formatIfEmail(invoice.invoice_sent_to) || "the customer"
        }.`,
        dateLabel: formatDateLabel(sortDate),
        userName: sentBy,
        type: "invoice_generated",
        sortDate,
        priority: activityPriority.invoice_generated,
      });
    });
  }

  if (payload.bluesheets?.length) {
    payload.bluesheets.forEach((sheet) => {
      const bluesheetAuditEntry = activityAudit?.bluesheet_submitted_by?.find(
        (entry) => entry.bluesheet_id === sheet.id
      );

      const submittedBy = resolveActor(
        bluesheetAuditEntry?.submitted_by,
        sheet.created_by_user,
        sheet.updated_by_user,
        job.updated_by_user,
        job.updated_by_name,
        job.created_by_user,
        job.created_by_name,
      );

      const sortDate =
        bluesheetAuditEntry?.submitted_at || sheet.created_at || sheet.date;

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
          description: `${submittedBy} linked supplier order ${orderId} to BlueSheet #${sheet.id}.`,
          dateLabel: formatDateLabel(sortDate),
          userName: submittedBy,
          type: "material_ordered",
          sortDate,
          priority: activityPriority.material_ordered,
        });
      });

      result.push({
        id: `bluesheet-${sheet.id}`,
        title: "Bluesheet Submitted",
        description: `${submittedBy} submitted BlueSheet #${sheet.id} with status "${
          sheet.status || "draft"
        }".`,
        dateLabel: formatDateLabel(sortDate),
        userName: submittedBy,
        type: "bluesheet_submitted",
        sortDate,
        priority: activityPriority.bluesheet_submitted,
      });
    });
  }

  if (job.status) {
    const statusActor = resolveActor(
      activityAudit?.job_updated_by,
      job.updated_by_user,
      job.updated_by_name,
      job.created_by_user,
      job.created_by_name,
    );

    const sortDate = job.updated_at || job.created_at;

    result.push({
      id: `status-${job.id}`,
      title: "Status Updated",
      description: `${statusActor} changed the job status to "${job.status.replace(
        /_/g,
        " "
      )}".`,
      dateLabel: formatDateLabel(sortDate),
      userName: statusActor,
      type: "status_updated",
      sortDate,
      priority: activityPriority.status_updated,
    });
  }

  return result.sort((a, b) => {
    const dateA = new Date(a.sortDate || "").getTime();
    const dateB = new Date(b.sortDate || "").getTime();

    if (dateA === dateB) {
      // If dates are the same, show higher priority (later events in sequence) first
      return (b.priority || 0) - (a.priority || 0);
    }

    // Newest first
    return dateB - dateA;
  });
};

export default function ActivityLogs({
  jobId,
  title = "Activity Timeline",
}: ActivityLogsProps) {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActivityLogs = async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const response: JobActivityApiResponse =
        await apiClient.getActivityLogsByJob(jobId);

      if (response?.success && response?.data) {
        const mappedActivities = mapApiResponseToActivities(response);
        setActivities(mappedActivities.length ? mappedActivities : []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      setActivities([]);
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 17l6-6 4 4 6-6"
          />
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