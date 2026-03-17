import React from "react";
import { ChevronDown, ChevronRight, Edit, Trash2, User } from "lucide-react";
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
  subJobs?: {
    id: string | number;
    job_title?: string;
    title?: string;
    status?: string;
  }[];
};

type EntityType = {
  id: string | number;
  customer_name?: string;
  contractor_name?: string;
  name?: string;
  total_jobs?: number;
  jobs?: JobType[];
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
}: CommonEntityListingProps) {
  return (
    <ScrollArea className="min-w-0  flex-1 h-full overflow-hidden border border-sky-100 bg-gradient-to-b from-white via-sky-50/40 to-blue-50/40 shadow-[0_8px_22px_rgba(59,130,246,0.08)]">
      <div className={`p-3 ${!isLoading ? 'max-h-[700px] overflow-y-scroll' : ''}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
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
              <div key={entity.id} className="mb-3  min-w-0">
                <Collapsible
                  open={hasJobs ? isExpanded : false}
                  onOpenChange={() => {
                    if (!hasJobs) return;
                    onToggleParent(parentId);
                  }}
                  className={` min-w-0 overflow-hidden rounded-[22px] border transition-all duration-300
                            ${
                              isExpanded && hasJobs
                                ? "border-sky-200 bg-white shadow-[0_10px_24px_rgba(14,165,233,0.08)]"
                                : "border-sky-100 bg-white shadow-[0_4px_14px_rgba(14,165,233,0.05)]"
                            }`}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => onSelectParent(parentId)}
                      className="w-full group h-auto  min-w-0 justify-start rounded-[20px] p-0 text-left whitespace-normal hover:bg-transparent"
                    >
                      <div
                        className={`w-full rounded-[20px] border px-4 py-4 transition-all duration-300
                          ${
                            isSelected || (isExpanded && hasJobs)
                              ? "border-sky-200 bg-gradient-to-r from-sky-200 via-blue-200 to-cyan-100 text-slate-800 shadow-[0_8px_18px_rgba(59,130,246,0.10)]"
                              : "border-sky-100 bg-gradient-to-r from-sky-100 via-blue-100 to-cyan-50 text-slate-800 shadow-[0_4px_12px_rgba(59,130,246,0.06)]"
                          }`}
                      >
                        <div className="flex  min-w-0 items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <div className="flex items-center gap-2 shrink-0">
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

                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 ring-1 ring-sky-100">
                                <User className="h-4 w-4 text-sky-600" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              {/* <div className="truncate text-[15px] font-semibold text-slate-800">
                                {getParentName(entity)}
                              </div> */}
                              <div className="max-w-[100px] text-[15px] font-semibold text-slate-800">
                                {getParentName(entity)?.length > 10
                                    ? getParentName(entity).slice(0, 10) + "..."
                                    : getParentName(entity)}
                                </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {totalJobs} jobs
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
                    <CollapsibleContent className="px-2 pb-3 pt-2">
                      <div className="relative ml-2 border-l-2 border-sky-100 pl-3 min-w-0">
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
                                    onClick={() => onSelectJob(jobId, parentId)}
                                    className="w-full h-auto  min-w-0 justify-start rounded-2xl border p-0 text-left whitespace-normal hover:bg-transparent"
                                  >
                                    <div
                                      className={`w-full rounded-2xl border px-4 py-3 transition-all duration-300
                                        ${
                                          isJobSelected || isJobExpanded
                                            ? "border-sky-200 bg-gradient-to-r from-sky-100 via-blue-50 to-cyan-50 shadow-[0_6px_14px_rgba(14,165,233,0.07)]"
                                            : "border-sky-100 bg-gradient-to-r from-slate-50 via-sky-50 to-cyan-50/60 shadow-[0_3px_10px_rgba(14,165,233,0.04)]"
                                        }`}
                                    >
                                      <div className="flex  min-w-0 items-center justify-between gap-3">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                          <div className="flex items-center gap-2 shrink-0">
                                            {hasSubJobs ? (
                                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-sky-100">
                                                {isJobExpanded ? (
                                                  <ChevronDown className="h-3.5 w-3.5 text-sky-600" />
                                                ) : (
                                                  <ChevronRight className="h-3.5 w-3.5 text-sky-600" />
                                                )}
                                              </div>
                                            ) : (
                                              <div className="h-6 w-6" />
                                            )}

                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 ring-2 ring-amber-300">
                                              {getStatusIcon(job.status)}
                                            </div>
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold text-slate-700">
                                              {job.job_title || job.title}
                                            </div>
                                            <div className="text-xs font-medium capitalize text-slate-500">
                                              {job.status}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Button>
                                </CollapsibleTrigger>

                                {hasSubJobs && (
                                  <CollapsibleContent className="mt-2 pl-3">
                                    <div className="relative min-w-0 border-l-2 border-cyan-100 pl-2.5">
                                      {job.subJobs?.map((subJob) => {
                                        const subJobId = subJob.id.toString();
                                        const isSubJobSelected =
                                          selectedSubJob === subJobId;
                                          const subJobTitle = subJob.job_title || subJob.title || "";

                                        return (
                                          <div
                                            key={subJob.id}
                                            className="relative mb-2 last:mb-0 min-w-0"
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
                                              className="w-full h-auto  min-w-0 justify-start rounded-xl p-0 text-left whitespace-normal hover:bg-transparent"
                                            >
                                              <div
                                                className={`w-full min-w-0  rounded-xl border px-3 py-2.5 transition-all duration-300
                                                ${
                                                  isSubJobSelected
                                                    ? "border-cyan-200 bg-gradient-to-r from-white via-sky-50/70 to-cyan-50/70 shadow-[0_4px_12px_rgba(6,182,212,0.06)]"
                                                    : "border-slate-100 bg-white hover:border-cyan-100 hover:bg-sky-50/40"
                                                }`}
                                              >
                                                <div className="flex min-w-0 items-center gap-1.5 ">
                                                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-50 ring-[1.5px] ring-amber-300 shrink-0">
                                                    <div className="scale-[0.75]">
                                                      {getStatusIcon(
                                                        subJob.status,
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5 overflow-hidden">
                                                    <div className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                                                         {subJobTitle?.length > 10
                                                            ? subJobTitle.slice(0, 10) + "..."
                                                            : subJobTitle}
                                                    </div>

                                                    <div className="shrink rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-600 whitespace-nowrap">
                                                      Change Order
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

      {footer && (
        <div className="sticky bottom-0  border-t border-sky-100 bg-white/95 backdrop-blur-xl px-3 py-4">
          {footer}
        </div>
      )}
    </ScrollArea>
  );
}
