import React from "react";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

type JobType = {
  id: string | number;
  job_title?: string;
  title?: string;
  status?: string;
  address?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
  /** Set by listing pages when job was created in last 48h (optional). */
  __listingRecentlyAdded?: boolean;
  /** Set by listing pages when job was updated in last 48h (optional). */
  __listingRecentlyUpdated?: boolean;
  subJobs?: {
    id: string | number;
    job_title?: string;
    title?: string;
    status?: string;
    address?: string;
    location?: string;
    job_address?: string;
    full_address?: string;
    bill_to_address?: string;
    city_zip?: string;
    created_at?: string;
    updated_at?: string;
    __listingRecentlyAdded?: boolean;
    __listingRecentlyUpdated?: boolean;
    /** API: marks rows created via Change Order flow */
    changes_order?: string;
    changesOrder?: string;
  }[];
};

type EntityType = {
  id: string | number;
  customer_name?: string;
  contractor_name?: string;
  name?: string;
  total_jobs?: number;
  jobs?: JobType[];
  /** Set by listing pages when any job was created in last 48h (optional). */
  __listingRecentlyAdded?: boolean;
  /** Set by listing pages when any job was updated in last 48h (optional). */
  __listingRecentlyUpdated?: boolean;
};

type CommonEntityListingProps = {
  data: EntityType[];
  isLoading?: boolean;
  emptyText?: string;

  expandedParents: Set<string>;
  expandedJobs: Set<string>;

  selectedParent?: string | null;
  selectedJob?: string | null;
  selectedSubJob?: string | null;

  onToggleParent: (id: string) => void;
  onToggleJob: (id: string) => void;

  onSelectParent: (id: string) => void;
  onSelectJob: (jobId: string, parentId: string) => void;
  onSelectSubJob: (subJobId: string, jobId: string, parentId: string) => void;

  onEditParent?: (entity: EntityType) => void;
  onDeleteParent?: (entity: EntityType) => void;

  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;

  getParentName: (entity: EntityType) => string;
  getParentJobCount?: (entity: EntityType) => number;

  getStatusIcon: (status?: string) => React.ReactNode;

  footer?: React.ReactNode;
  itemsPerPage?: number;
  totalItems?: number;
};

export default function CommonEntityListing({
  data,
  isLoading = false,
  emptyText = "No data found",

  expandedParents,
  expandedJobs,

  selectedParent,
  selectedJob,
  selectedSubJob,

  onToggleParent,
  onToggleJob,

  onSelectParent,
  onSelectJob,
  onSelectSubJob,

  onEditParent,
  onDeleteParent,

  hasEditPermission = false,
  hasDeletePermission = false,

  getParentName,
  getParentJobCount,

  getStatusIcon,
  footer,
  itemsPerPage,
  totalItems,
}: CommonEntityListingProps) {
  const truncateWords = (value?: string, maxWords = 2) => {
    if (!value) return "";
    const words = value.trim().split(/\s+/);
    if (words.length <= maxWords) return value.trim();
    return `${words.slice(0, maxWords).join(" ")}...`;
  };

  const truncateChars = (value?: string, maxChars = 15) => {
    if (!value) return "";
    const text = value.trim();
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars)}...`;
  };

  const subJobListingBadgeLabel = (subJob: {
    changes_order?: string;
    changesOrder?: string;
  }) => {
    const v = subJob.changes_order ?? subJob.changesOrder;
    if (v === "change order") return "Change Order";
    return "Sub job";
  };

  /** Address line for any sub-job row (change order or regular sub job). */
  const subJobAddressLine = (subJob: {
    address?: string;
    location?: string;
    job_address?: string;
    full_address?: string;
    bill_to_address?: string;
    city_zip?: string;
  }) => {
    const direct =
      subJob.address ||
      subJob.location ||
      subJob.job_address ||
      subJob.full_address ||
      subJob.bill_to_address ||
      "";
    if (typeof direct === "string" && direct.trim()) return direct.trim();
    const cz = subJob.city_zip?.trim();
    if (cz) return cz;
    return "";
  };

  const shouldShowFooter =
    !!footer &&
    !isLoading &&
    data.length > 0 &&
    typeof itemsPerPage === "number" &&
    typeof totalItems === "number" &&
    totalItems > itemsPerPage;

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-sky-100 bg-gradient-to-b from-white via-sky-50/40 to-blue-50/40 shadow-[0_8px_22px_rgba(59,130,246,0.08)]">
      <ScrollArea className="min-h-0 flex-1">
        <div className={`px-2.5 pt-2.5 pb-2 ${shouldShowFooter ? "pb-16" : ""}`}>
          {isLoading ? (
            <div className="flex min-h-[64vh] items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-sky-500"></div>
              <span className="ml-2 text-sm text-slate-500">Loading...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              {emptyText}
            </div>
          ) : (
            data.map((entity) => {
              const parentId = entity.id.toString();
              const entityJobs = entity.jobs || [];
              const hasJobs = entityJobs.length > 0;
              const isExpanded = expandedParents.has(parentId);
              const isSelected = selectedParent === parentId && !selectedJob;
              const totalJobs = getParentJobCount
                ? getParentJobCount(entity)
                : entity.total_jobs || entityJobs.length;

              return (
                <div key={entity.id} className="mb-3 min-w-0">
                  <Collapsible
                    open={hasJobs ? isExpanded : false}
                    onOpenChange={() => {
                      if (!hasJobs) return;
                      onToggleParent(parentId);
                      /* Always re-focus parent: clears job/sub-job in listing pages so detail + jobs table shows */
                      onSelectParent(parentId);
                    }}
                    className={`min-w-0 overflow-hidden rounded-[22px] border transition-all duration-300 ${
                      isExpanded && hasJobs
                        ? "border-sky-200 bg-white shadow-[0_10px_24px_rgba(14,165,233,0.08)]"
                        : "border-sky-100 bg-white shadow-[0_4px_14px_rgba(14,165,233,0.05)]"
                    }`}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => onSelectParent(parentId)}
                        className="group h-auto w-full min-w-0 justify-start rounded-[20px] p-0 text-left whitespace-normal hover:bg-transparent"
                      >
                        <div
                          className={`w-full rounded-[20px] border px-4 py-4 transition-all duration-300 ${
                            isSelected || (isExpanded && hasJobs)
                              ? "border-sky-200 bg-gradient-to-r from-sky-200 via-blue-200 to-cyan-100 text-slate-800 shadow-[0_8px_18px_rgba(59,130,246,0.10)]"
                              : "border-sky-100 bg-gradient-to-r from-sky-100 via-blue-100 to-cyan-50 text-slate-800 shadow-[0_4px_12px_rgba(59,130,246,0.06)]"
                          }`}
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <div className="flex shrink-0 items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 ring-1 ring-sky-100">
                                  {hasJobs ? (
                                    isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-sky-600" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-sky-600" />
                                    )
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-sky-300 opacity-40" />
                                  )}
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="text-[13.4px] font-semibold leading-snug text-slate-800 break-words capitalize">
                                  {getParentName(entity)}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                  <span>{totalJobs} jobs</span>
                                  {entity.__listingRecentlyAdded && (
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[8px] font-semibold leading-none text-emerald-800">
                                      Recently Added
                                    </span>
                                  )}
                                  {entity.__listingRecentlyUpdated && !entity.__listingRecentlyAdded && (
                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-1 py-0.5 text-[8px] font-semibold leading-none text-blue-800">
                                      Recently Updated
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1 self-start">
                              {hasEditPermission && onEditParent && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Edit"
                                  className="h-8 w-8 rounded-full p-0 hover:bg-white/70"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditParent(entity);
                                  }}
                                >
                                  <Edit className="h-4 w-4 text-sky-600" />
                                </Button>
                              )}

                              {hasDeletePermission && onDeleteParent && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete"
                                  className="h-8 w-8 rounded-full p-0 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteParent(entity);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    {hasJobs && (
                      <CollapsibleContent className="px-1.5 pb-2.5 pt-1.5">
                        <div className="relative ml-1.5 min-w-0 border-l-2 border-sky-100 pl-2">
                          {entityJobs.map((job) => {
                            const jobId = job.id.toString();
                            const hasSubJobs =
                              job.subJobs && job.subJobs.length > 0;
                            const isJobExpanded = expandedJobs.has(jobId);
                            const isJobSelected =
                              selectedJob === jobId && !selectedSubJob;

                            return (
                              <div
                                key={job.id}
                                className="relative mb-3 last:mb-0"
                              >
                                <span className="absolute -left-[11px] top-5 h-[2px] w-2.5 rounded-full bg-sky-200" />

                                <Collapsible
                                  open={isJobExpanded}
                                  onOpenChange={() => {
                                    if (!hasSubJobs) return;
                                    onToggleJob(jobId);
                                  }}
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      onClick={() =>
                                        onSelectJob(jobId, parentId)
                                      }
                                      className="h-auto w-full min-w-0 justify-start rounded-2xl border p-0 text-left whitespace-normal hover:bg-transparent"
                                    >
                                      <div
                                        className={`w-full rounded-2xl border px-2.5 py-2 transition-all duration-300 ${
                                          isJobSelected || isJobExpanded
                                            ? "border-sky-200 bg-gradient-to-r from-sky-100 via-blue-50 to-cyan-50 shadow-[0_6px_14px_rgba(14,165,233,0.07)]"
                                            : "border-sky-100 bg-gradient-to-r from-slate-50 via-sky-50 to-cyan-50/60 shadow-[0_3px_10px_rgba(14,165,233,0.04)]"
                                        }`}
                                      >
                                        <div className="flex min-w-0 items-center gap-2">
                                          <div className="flex shrink-0 items-center">
                                            {hasSubJobs ? (
                                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-sky-100">
                                                {isJobExpanded ? (
                                                  <ChevronDown className="h-3 w-3 text-sky-600" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3 text-sky-600" />
                                                )}
                                              </div>
                                            ) : (
                                              <div className="h-5 w-5 shrink-0" aria-hidden />
                                            )}
                                          </div>

                                          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                              <span className="block text-[11px] font-semibold leading-snug text-slate-800 break-words capitalize">
                                                {truncateWords(
                                                  job.job_title || job.title,
                                                  2,
                                                )}
                                              </span>
                                              <div className="text-[10px] font-medium capitalize leading-snug text-slate-500 break-words">
                                                {truncateChars(
                                                  job.address ||
                                                    job.location,
                                                  15,
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex max-w-[min(100%,52%)] shrink-0 flex-wrap items-center justify-end gap-0.5">
                                              {job.__listingRecentlyAdded && (
                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[8px] font-semibold leading-none text-emerald-800">
                                                  Recently Added
                                                </span>
                                              )}
                                              {job.__listingRecentlyUpdated && !job.__listingRecentlyAdded && (
                                                <span className="rounded-full border border-blue-200 bg-blue-50 px-1 py-0.5 text-[8px] font-semibold leading-none text-blue-800">
                                                  Recently Updated
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </Button>
                                  </CollapsibleTrigger>

                                  {hasSubJobs && (
                                    <CollapsibleContent className="mt-1.5 pl-2">
                                      <div className="relative min-w-0 border-l-2 border-cyan-100 pl-2">
                                        {job.subJobs?.map((subJob) => {
                                          const subJobId = subJob.id.toString();
                                          const isSubJobSelected =
                                            selectedSubJob === subJobId;
                                          const subJobTitle =
                                            subJob.job_title ||
                                            subJob.title ||
                                            "";
                                          const subJobAddr =
                                            subJobAddressLine(subJob);

                                          return (
                                            <div
                                              key={subJob.id}
                                              className="relative mb-2 min-w-0 last:mb-0"
                                            >
                                              <span className="absolute -left-[11px] top-5 h-[2px] w-2.5 rounded-full bg-cyan-100" />

                                              <Button
                                                variant="ghost"
                                                onClick={() =>
                                                  onSelectSubJob(
                                                    subJobId,
                                                    jobId,
                                                    parentId,
                                                  )
                                                }
                                                className="h-auto w-full min-w-0 justify-start rounded-xl p-0 text-left whitespace-normal hover:bg-transparent"
                                              >
                                                <div
                                                  className={`w-full min-w-0 rounded-xl border px-2.5 py-1.5 transition-all duration-300 ${
                                                    isSubJobSelected
                                                      ? "border-cyan-200 bg-gradient-to-r from-white via-sky-50/70 to-cyan-50/70 shadow-[0_4px_12px_rgba(6,182,212,0.06)]"
                                                      : "border-slate-100 bg-white hover:border-cyan-100 hover:bg-sky-50/40"
                                                  }`}
                                                >
                                                  <div className="flex min-w-0 items-start gap-1.5">
                                                    <div
                                                      className="h-3.5 w-3.5 shrink-0"
                                                      aria-hidden
                                                    />

                                                    {/* Title + address stack together; badges sit in a separate column so they never push the address down */}
                                                    <div className="flex min-w-0 flex-1 items-start gap-2">
                                                      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                        <span className="text-[10px] font-bold leading-snug text-slate-800 break-words capitalize">
                                                          {subJobTitle}
                                                        </span>
                                                        {subJobAddr.length > 0 ? (
                                                          <p className="text-[9px] font-medium leading-snug text-slate-500 capitalize">
                                                            {truncateChars(
                                                              subJobAddr,
                                                              15,
                                                            )}
                                                          </p>
                                                        ) : null}
                                                      </div>
                                                      <div className="flex shrink-0 flex-col items-end gap-1 self-start">
                                                        {subJob.__listingRecentlyAdded && (
                                                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-semibold leading-none text-emerald-800">
                                                            Recently Added
                                                          </span>
                                                        )}
                                                        {subJob.__listingRecentlyUpdated && !subJob.__listingRecentlyAdded && (
                                                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[8px] font-semibold leading-none text-blue-800">
                                                            Recently Updated
                                                          </span>
                                                        )}
                                                        <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-1 text-[9px] font-semibold leading-none text-sky-600">
                                                          {subJobListingBadgeLabel(
                                                            subJob,
                                                          )}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </Button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </CollapsibleContent>
                                  )}
                                </Collapsible>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* {shouldShowFooter && (
        <div className="sticky bottom-0 z-10 border-t border-sky-100 bg-white/95 px-3 py-4 backdrop-blur-xl">
          {footer}
        </div>
      )} */}
      {shouldShowFooter && (
        <div className="sticky bottom-0 z-20 border-t border-sky-100 bg-white/95 px-3 pt-4 pb-5 backdrop-blur-xl">
          {footer}
        </div>
      )}
    </div>
  );
}