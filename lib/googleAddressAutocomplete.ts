/**
 * Shared Google Places Autocomplete settings for address fields.
 * Use `geocode` (not `address`) for better coverage of sectors, phases, plots, and international locations.
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyBEQp-ZFMYZjsTNyximu2pAifQ9EWA4W3M";

export const ADDRESS_AUTOCOMPLETE_OPTIONS = {
  types: ["geocode"],
  fields: ["formatted_address", "address_components", "geometry", "name"],
};

export const ADDRESS_SEARCH_PLACEHOLDER =
  "Search address";

export function resolveFormattedPlaceAddress(place: {
  formatted_address?: string;
  name?: string;
  vicinity?: string;
  address_components?: Array<{ long_name?: string }>;
} | null | undefined): string {
  if (!place) return "";

  const formatted = String(place.formatted_address || "").trim();
  if (formatted) return formatted;

  const placeName = String(place.name || "").trim();
  const vicinity = String(place.vicinity || "").trim();
  if (placeName && vicinity) return `${placeName}, ${vicinity}`;
  if (placeName) return placeName;
  if (vicinity) return vicinity;

  const components = Array.isArray(place.address_components)
    ? place.address_components
    : [];
  const fromComponents = components
    .map((c) => c?.long_name)
    .filter((part): part is string => typeof part === "string" && !!part.trim())
    .join(", ");

  return fromComponents.trim();
}

/** Split job/customer address + city/state/zip from a Places result. */
export function parsePlaceToAddressFields(place: {
  formatted_address?: string;
  name?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
} | null | undefined): { address: string; cityZip: string } {
  if (!place) return { address: "", cityZip: "" };

  const formatted = resolveFormattedPlaceAddress(place);
  const parts = formatted
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const components = place.address_components || [];
  let streetNumber = "";
  let route = "";
  let city = "";
  let state = "";
  let zipCode = "";
  let sublocality = "";

  for (const component of components) {
    const types = component.types || [];
    if (types.includes("street_number")) {
      streetNumber = component.long_name;
    } else if (types.includes("route")) {
      route = component.long_name;
    } else if (types.includes("locality")) {
      city = component.long_name;
    } else if (
      types.includes("postal_town") ||
      types.includes("administrative_area_level_2")
    ) {
      if (!city) city = component.long_name;
    } else if (
      types.includes("sublocality") ||
      types.includes("sublocality_level_1") ||
      types.includes("neighborhood")
    ) {
      if (!sublocality) sublocality = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = component.short_name || component.long_name;
    } else if (types.includes("postal_code")) {
      zipCode = component.long_name;
    }
  }

  if (!city && sublocality) city = sublocality;

  let address = `${streetNumber} ${route}`.trim();
  let cityZip = "";

  if (city && state && zipCode) {
    cityZip = `${city}, ${state} ${zipCode}`;
  } else if (city && state) {
    cityZip = `${city}, ${state}`;
  } else if (city && zipCode) {
    cityZip = `${city} ${zipCode}`;
  } else if (state && zipCode) {
    cityZip = `${state} ${zipCode}`;
  } else if (city) {
    cityZip = city;
  } else if (zipCode) {
    cityZip = zipCode;
  } else if (state) {
    cityZip = state;
  }

  if (!address && formatted) {
    address = parts[0] || formatted;
    if (!cityZip && parts.length > 1) {
      cityZip = parts.slice(1).join(", ");
    }
  } else if (!cityZip && parts.length > 1) {
    const rest = parts.slice(1).join(", ");
    if (rest && !cityZip) cityZip = rest;
  }

  return { address, cityZip };
}
