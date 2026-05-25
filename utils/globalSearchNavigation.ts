export type GlobalSearchCategory =
  | "customers"
  | "contractors"
  | "jobs"
  | "estimates"
  | "orders"
  | "products"
  | "suppliers"
  | "labor"
  | "leadLabor"
  | "bluesheets";

export type GlobalSearchResultItem = {
  category: GlobalSearchCategory;
  categoryLabel: string;
  id: string;
  label: string;
  subtitle?: string;
  raw: Record<string, unknown>;
};

export const GLOBAL_SEARCH_CATEGORIES: {
  key: GlobalSearchCategory;
  label: string;
}[] = [
  { key: "customers", label: "Customers" },
  { key: "contractors", label: "Contractors" },
  { key: "jobs", label: "Jobs" },
  { key: "estimates", label: "Estimates" },
  { key: "orders", label: "Orders" },
  { key: "products", label: "Products" },
  { key: "suppliers", label: "Suppliers" },
  { key: "labor", label: "Labor" },
  { key: "leadLabor", label: "Lead labor" },
  { key: "bluesheets", label: "Bluesheets" },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  GLOBAL_SEARCH_CATEGORIES.map((c) => [c.key, c.label]),
) as Record<GlobalSearchCategory, string>;

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function nested(
  item: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const val = item[key];
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return null;
}

export function getGlobalSearchItemId(
  item: Record<string, unknown>,
): string | null {
  const id = item.id ?? item._id ?? item.job_id ?? item.estimate_id;
  if (id == null || String(id).trim() === "") return null;
  return String(id);
}

export function getGlobalSearchItemLabel(
  category: GlobalSearchCategory,
  item: Record<string, unknown>,
): string {
  const users = nested(item, "users");

  switch (category) {
    case "customers":
      return pickString(
        item.customer_name,
        item.name,
        item.company_name,
        `Customer #${item.id}`,
      );
    case "contractors":
      return pickString(
        item.contractor_name,
        item.company_name,
        item.name,
        `Contractor #${item.id}`,
      );
    case "jobs":
      return pickString(
        item.job_title,
        item.title,
        nested(item, "contractor")?.contractor_name,
        nested(item, "customer")?.customer_name,
        `Job #${item.id}`,
      );
    case "estimates":
      return pickString(
        item.estimate_title,
        item.invoice_number,
        item.estimate_number,
        `Estimate #${item.id}`,
      );
    case "orders":
      return pickString(
        item.order_number,
        item.order_title,
        item.title,
        `Order #${item.id}`,
      );
    case "products":
      return pickString(item.product_name, item.name, `Product #${item.id}`);
    case "suppliers":
      return pickString(
        item.company_name,
        item.supplier_name,
        users?.full_name,
        item.contact_person,
        `Supplier #${item.id}`,
      );
    case "labor":
      return pickString(
        users?.full_name,
        item.full_name,
        item.name,
        item.labor_code,
        `Labor #${item.id}`,
      );
    case "leadLabor":
      return pickString(
        users?.full_name,
        item.full_name,
        item.name,
        item.labor_code,
        `Lead labor #${item.id}`,
      );
    case "bluesheets":
      return pickString(
        item.bluesheet_number,
        item.title,
        item.name,
        `Bluesheet #${item.id}`,
      );
    default:
      return pickString(item.name, item.title, `#${item.id}`);
  }
}

export function getGlobalSearchItemSubtitle(
  category: GlobalSearchCategory,
  item: Record<string, unknown>,
): string | undefined {
  const users = nested(item, "users");
  const customer = nested(item, "customer");
  const contractor = nested(item, "contractor");
  const job = nested(item, "job");

  switch (category) {
    case "customers":
      return (
        pickString(item.email, item.phone, item.address, item.company_name) ||
        undefined
      );
    case "contractors":
      return (
        pickString(
          item.company_name,
          item.email,
          item.phone,
          item.address,
        ) || undefined
      );
    case "jobs": {
      const contractorName = pickString(
        contractor?.contractor_name,
        contractor?.company_name,
      );
      const customerName = pickString(customer?.customer_name);
      return (
        pickString(
          item.address,
          item.city_zip,
          contractorName ? `Contractor: ${contractorName}` : "",
          customerName ? `Customer: ${customerName}` : "",
          item.status,
        ) || undefined
      );
    }
    case "estimates":
      return (
        pickString(
          item.invoice_number
            ? `Invoice: ${item.invoice_number}`
            : "",
          customer?.customer_name
            ? `Customer: ${customer.customer_name}`
            : "",
          contractor?.contractor_name
            ? `Contractor: ${contractor.contractor_name}`
            : "",
          job?.job_title ? `Job: ${job.job_title}` : "",
          item.status,
          item.total_amount != null ? `Total: ${item.total_amount}` : "",
        ) || undefined
      );
    case "orders":
      return pickString(item.status, item.customer_name) || undefined;
    case "products":
      return (
        pickString(
          item.jdp_sku ? `SKU: ${item.jdp_sku}` : "",
          item.description,
          item.status,
        ) || undefined
      );
    case "suppliers":
      return (
        pickString(
          users?.email,
          users?.phone,
          item.supplier_code,
          item.contact_person,
        ) || undefined
      );
    case "labor":
    case "leadLabor":
      return (
        pickString(
          item.labor_code,
          users?.email,
          users?.phone,
          item.address,
          item.department,
        ) || undefined
      );
    case "bluesheets":
      return pickString(item.job_title, item.status) || undefined;
    default:
      return pickString(item.email, item.status) || undefined;
  }
}

function staffEntityPath(
  tab: "staff" | "lead-labour" | "labor" | "supplier",
  entityId: string,
): string {
  const q = new URLSearchParams({
    tab,
    entityId,
  });
  return `/staff?${q.toString()}`;
}

function isContractJob(item: Record<string, unknown>): boolean {
  const raw = String(item.job_type ?? item.type ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
  if (raw.includes("contract")) return true;
  return !!(nested(item, "contractor")?.id ?? item.contractor_id);
}

export function getGlobalSearchNavigatePath(
  category: GlobalSearchCategory,
  item: Record<string, unknown>,
): string | null {
  const id = getGlobalSearchItemId(item);
  if (!id) return null;

  switch (category) {
    case "customers":
      return `/customers?customerId=${encodeURIComponent(id)}`;
    case "contractors":
      return `/contractors?contractorId=${encodeURIComponent(id)}`;
    case "jobs": {
      const customer = nested(item, "customer");
      const contractor = nested(item, "contractor");
      const customerId = pickString(item.customer_id, customer?.id);
      const contractorId = pickString(item.contractor_id, contractor?.id);

      if (isContractJob(item) || contractorId) {
        const q = new URLSearchParams({ jobId: id });
        if (contractorId) q.set("contractorId", contractorId);
        return `/contractors?${q.toString()}`;
      }

      const q = new URLSearchParams({ jobId: id });
      if (customerId) q.set("customerId", customerId);
      return `/customers?${q.toString()}`;
    }
    case "estimates":
      return `/invoices/create?mode=view&id=${encodeURIComponent(id)}`;
    case "orders":
      return `/orders/form?id=${encodeURIComponent(id)}`;
    case "products":
      return `/products?viewProductId=${encodeURIComponent(id)}`;
    case "suppliers":
      return `/suppliers?supplierId=${encodeURIComponent(id)}`;
    case "labor":
      return staffEntityPath("labor", id);
    case "leadLabor":
      return staffEntityPath("lead-labour", id);
    case "bluesheets": {
      const jobId = pickString(
        item.job_id,
        item.jobId,
        nested(item, "job")?.id,
      );
      const bluesheetId = pickString(
        item.id,
        item.bluesheet_id,
        item.latest_bluesheet_id,
      );
      const q = new URLSearchParams({ tab: "approvals" });
      if (jobId) q.set("jobId", jobId);
      if (bluesheetId) q.set("bluesheetId", bluesheetId);
      return `/invoices?${q.toString()}`;
    }
    default:
      return null;
  }
}

/** Merge all API category arrays into one flat list for the header dropdown. */
export function mergeGlobalSearchResults(
  data: Record<string, unknown> | null | undefined,
): GlobalSearchResultItem[] {
  if (!data || typeof data !== "object") return [];

  const merged: GlobalSearchResultItem[] = [];

  for (const { key, label } of GLOBAL_SEARCH_CATEGORIES) {
    const list = data[key];
    if (!Array.isArray(list)) continue;

    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const raw = entry as Record<string, unknown>;
      const id = getGlobalSearchItemId(raw);
      if (!id) continue;

      merged.push({
        category: key,
        categoryLabel: label,
        id,
        label: getGlobalSearchItemLabel(key, raw),
        subtitle: getGlobalSearchItemSubtitle(key, raw),
        raw,
      });
    }
  }

  return merged;
}

/** @deprecated Use mergeGlobalSearchResults for flat list UI */
export function parseGlobalSearchResponse(
  data: Record<string, unknown> | null | undefined,
): GlobalSearchResultItem[] {
  return mergeGlobalSearchResults(data);
}

export function groupGlobalSearchResults(
  items: GlobalSearchResultItem[],
): {
  category: GlobalSearchCategory;
  label: string;
  items: GlobalSearchResultItem[];
}[] {
  const groups: {
    category: GlobalSearchCategory;
    label: string;
    items: GlobalSearchResultItem[];
  }[] = [];

  for (const cat of GLOBAL_SEARCH_CATEGORIES) {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) {
      groups.push({
        category: cat.key,
        label: CATEGORY_LABEL_MAP[cat.key] ?? cat.label,
        items: catItems,
      });
    }
  }

  return groups;
}
