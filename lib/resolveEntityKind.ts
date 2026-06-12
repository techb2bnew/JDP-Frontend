export type EntityKind = "customer" | "contractor";

export function resolveEntityKind(
  entity:
    | {
        customer_type?: string;
        type?: string;
        tag?: string;
      }
    | null
    | undefined,
): EntityKind | null {
  const raw = String(
    entity?.customer_type || entity?.type || entity?.tag || "",
  ).toLowerCase();
  if (raw === "customer" || raw === "contractor") return raw;
  return null;
}
