"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EntityKind } from "@/lib/resolveEntityKind";

export type ListingEstimateSource = "customers" | "contractors" | null;

interface EstimatePrefillContextType {
  listingEstimateJobId: string | null;
  listingEstimateParentId: string | null;
  listingEstimateSource: ListingEstimateSource;
  listingEstimateParentKind: EntityKind | null;
  setListingEstimateSelection: (
    jobId: string | null,
    parentId: string | null,
    source: ListingEstimateSource,
    parentKind: EntityKind | null,
  ) => void;
}

const EstimatePrefillContext = createContext<
  EstimatePrefillContextType | undefined
>(undefined);

export function useEstimatePrefill() {
  const context = useContext(EstimatePrefillContext);
  if (context === undefined) {
    throw new Error(
      "useEstimatePrefill must be used within an EstimatePrefillProvider",
    );
  }
  return context;
}

export function useListingEstimatePrefillSync(
  source: "customers" | "contractors",
  selectedParent: string | null,
  selectedJob: string | null,
  selectedSubJob: string | null,
  parentEntityKind: EntityKind | null,
) {
  const { setListingEstimateSelection } = useEstimatePrefill();

  useEffect(() => {
    const effectiveJobId = selectedSubJob || selectedJob;
    setListingEstimateSelection(
      effectiveJobId,
      selectedParent,
      source,
      parentEntityKind,
    );
  }, [
    selectedParent,
    selectedJob,
    selectedSubJob,
    source,
    parentEntityKind,
    setListingEstimateSelection,
  ]);

  useEffect(() => {
    return () => setListingEstimateSelection(null, null, null, null);
  }, [setListingEstimateSelection]);
}

export function EstimatePrefillProvider({ children }: { children: ReactNode }) {
  const [listingEstimateJobId, setJobId] = useState<string | null>(null);
  const [listingEstimateParentId, setParentId] = useState<string | null>(null);
  const [listingEstimateSource, setSource] =
    useState<ListingEstimateSource>(null);
  const [listingEstimateParentKind, setParentKind] =
    useState<EntityKind | null>(null);

  const setListingEstimateSelection = useCallback(
    (
      jobId: string | null,
      parentId: string | null,
      source: ListingEstimateSource,
      parentKind: EntityKind | null,
    ) => {
      setJobId(jobId);
      setParentId(parentId);
      setSource(source);
      setParentKind(parentKind);
    },
    [],
  );

  const value = useMemo(
    () => ({
      listingEstimateJobId,
      listingEstimateParentId,
      listingEstimateSource,
      listingEstimateParentKind,
      setListingEstimateSelection,
    }),
    [
      listingEstimateJobId,
      listingEstimateParentId,
      listingEstimateSource,
      listingEstimateParentKind,
      setListingEstimateSelection,
    ],
  );

  return (
    <EstimatePrefillContext.Provider value={value}>
      {children}
    </EstimatePrefillContext.Provider>
  );
}
