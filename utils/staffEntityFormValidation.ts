export function validateRequiredNameEmailAddress(params: {
  name?: string;
  full_name?: string;
  email?: string;
  address?: string;
  nameFieldKey?: "name" | "full_name";
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameKey =
    params.nameFieldKey ?? (params.name !== undefined ? "name" : "full_name");
  const nameValue = (params.name ?? params.full_name ?? "").trim();
  const emailValue = (params.email ?? "").trim();
  const addressValue = (params.address ?? "").trim();

  if (!nameValue) {
    errors[nameKey] =
      nameKey === "name" ? "Name is required" : "Full name is required";
  }

  if (!emailValue) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    errors.email = "Please enter a valid email address";
  }

  if (!addressValue) {
    errors.address = "Address is required";
  }

  return errors;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  full_name: "Full Name",
  email: "Email",
  address: "Address",
  dob: "Date of Birth",
  date_of_joining: "Date of Joining",
  dateOfJoining: "Date of Joining",
  position: "Position",
  department: "Department",
  phone: "Phone",
  role: "Role",
  experience: "Experience",
  trade: "Trade",
  supervisor_id: "Supervisor",
  idProof: "ID Proof",
};

function humanizeFieldKey(key: string): string {
  return (
    FIELD_LABELS[key] ??
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatFieldList(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function getValidationToastMessage(
  errors: Record<string, string>,
): string {
  const entries = Object.entries(errors).filter(([, message]) =>
    Boolean(String(message || "").trim()),
  );
  if (entries.length === 0) return "Please fix the validation errors";
  if (entries.length === 1) return entries[0][1];

  const fieldLabels = entries.map(([key]) => humanizeFieldKey(key));
  return `Please enter ${formatFieldList(fieldLabels)}`;
}

export function validateAddressValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Address is required";
  return "";
}

export function formatEmailForListing(email: string | null | undefined): string {
  const raw = String(email ?? "").trim();
  if (!raw) return "";
  if (raw.toUpperCase() === "N/A") return "N/A";
  return raw.toLowerCase();
}

/** For table display only: shows "N/A" instead of a blank cell when a field has no value. */
export function displayOrNA(
  value: string | number | null | undefined
): string | number {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string" && value.trim() === "") return "N/A";
  return value;
}
