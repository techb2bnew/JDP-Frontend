import { DateObject } from "react-multi-date-picker";

export const normalizeSingleRangeSelection = (value: unknown): DateObject[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    if (value.length === 0) return [];

    // If picker sends multiple ranges, keep only the latest range.
    if (Array.isArray(value[0])) {
      const lastRange = value[value.length - 1];
      if (!Array.isArray(lastRange)) return [];
      return lastRange.filter(Boolean) as DateObject[];
    }

    return value.filter(Boolean) as DateObject[];
  }

  return [value as DateObject];
};

export const sortedDatesFromPickerRange = (values: DateObject[]): Date[] => {
  const allDates = values
    .map((d) => (d instanceof DateObject ? d.toDate() : new Date(d as unknown as string)))
    .filter((d) => !Number.isNaN(d.getTime()));

  return allDates.sort((a, b) => a.getTime() - b.getTime());
};
