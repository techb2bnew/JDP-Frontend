import React from "react";

type Person = {
  name: string;
  avatar?: string;
};

type JobActivitySource = {
  labour?: Person | null;
  lead_labour?: Person | null;
  invoice?: string | null;
  created_by?: string | null;
  blue_sheet?: string | null;
  edited_By?: string | null;
};

type ApiJobItem = {
  job?: JobActivitySource;
};

type ApiResponse = {
  data: ApiJobItem[];
};

type ActivityType =
  | "lead_assigned"
  | "document_uploaded"
  | "order_sent"
  | "status_updated"
  | "bluesheet_submitted"
  | "invoice_generated";

type ActivityLogItem = {
  id: string;
  date: string;
  time: string;
  userName: string;
  userRole?: string;
  action: string;
  detail: string;
  type: ActivityType;
  avatar?: string;
};

type ActivityLogsProps = {
  activities?: ActivityLogItem[];
  title?: string;
};

const dummyActivities: ActivityLogItem[] = [
  {
    id: "1",
    date: "10 Oct",
    time: "02:30 PM",
    userName: "Rahul S.",
    userRole: "Admin",
    action: "Lead Labor Assigned",
    detail: "Rajesh Kumar assigned as Lead Labor to Job #1024",
    type: "lead_assigned",
  },
  {
    id: "2",
    date: "10 Oct",
    time: "01:15 PM",
    userName: "Priya M.",
    userRole: "Project Mgr",
    action: "Document Uploaded",
    detail: "Site Survey Report_v2.pdf uploaded to Job #1024",
    type: "document_uploaded",
  },
  {
    id: "3",
    date: "10 Oct",
    time: "11:00 AM",
    userName: "Supply Dept.",
    action: "Order Sent to Supplier",
    detail: "Purchase Order #5678 for materials sent to ABC Supplies",
    type: "order_sent",
  },
  {
    id: "4",
    date: "09 Oct",
    time: "04:45 PM",
    userName: "System",
    action: 'Job Status Updated: "Pending" to "In-Progress"',
    detail: "Status changed for Job #1024",
    type: "status_updated",
  },
  {
    id: "5",
    date: "09 Oct",
    time: "10:20 AM",
    userName: "Rohit V.",
    userRole: "Field Staff",
    action: "Bluesheet Submitted",
    detail: "Daily work bluesheet submitted successfully for Job #1024",
    type: "bluesheet_submitted",
  },
  {
    id: "6",
    date: "08 Oct",
    time: "06:10 PM",
    userName: "Accounts Team",
    action: "Invoice Generated",
    detail: "Invoice #INV-2048 generated for Job #1024",
    type: "invoice_generated",
  },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const getBadgeStyles = (type: ActivityType) => {
  switch (type) {
    case "lead_assigned":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "document_uploaded":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "order_sent":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "status_updated":
      return "bg-green-50 text-green-700 border-green-200";
    case "bluesheet_submitted":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "invoice_generated":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const ActivityCard = ({ item }: { item: ActivityLogItem }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-500">
            {item.date}, {item.time}
          </p>

          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">User:</span> {item.userName}
              {item.userRole ? (
                <span className="text-gray-500"> ({item.userRole})</span>
              ) : null}
            </p>

            <p className="text-sm text-gray-900">
              <span className="font-semibold">Action:</span> {item.action}
            </p>

            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Detail:</span>{" "}
              {item.detail}
            </p>
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getBadgeStyles(
                item.type
              )}`}
            >
              {item.type.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.avatar ? (
            <img
              src={item.avatar}
              alt={item.userName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
              {getInitials(item.userName)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ActivityLogs({
  activities = dummyActivities,
  title = "Activity Logs",
}: ActivityLogsProps) {
  return (
    <div className="mt-6  w-full rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">
            Latest job-related updates and actions
          </p>
        </div>

        <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          View All
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1">
        {activities.map((item) => (
          <ActivityCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}