/** Rolling window for "recent" job/sub-job activity in entity listings (48 hours). */
export const RECENT_JOB_ACTIVITY_MS = 48 * 60 * 60 * 1000;

function parseTimeMs(value: unknown): number {
  if (value == null || value === "") return 0;
  const t = new Date(value as string).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function isRecentTimestamp(value: unknown): boolean {
  const ms = parseTimeMs(value);
  if (!ms) return false;
  return Date.now() - ms <= RECENT_JOB_ACTIVITY_MS;
}

/** APIs may return snake_case or camelCase */
function createdAtOf(o: any): unknown {
  return o?.created_at ?? o?.createdAt;
}

function updatedAtOf(o: any): unknown {
  return o?.updated_at ?? o?.updatedAt;
}

function jobHasRecentCreation(job: any): boolean {
  if (isRecentTimestamp(createdAtOf(job))) return true;
  for (const sj of job.subJobs || []) {
    if (isRecentTimestamp(createdAtOf(sj))) return true;
  }
  return false;
}

function jobHasRecentUpdate(job: any): boolean {
  if (isRecentTimestamp(updatedAtOf(job))) return true;
  for (const sj of job.subJobs || []) {
    if (isRecentTimestamp(updatedAtOf(sj))) return true;
  }
  return false;
}

type ListingEntity = {
  jobs?: any[];
  created_at?: unknown;
  createdAt?: unknown;
  updated_at?: unknown;
  updatedAt?: unknown;
};

/**
 * Listing sort priority (higher = closer to top):
 * - 2: customer/contractor or any job/sub-job `created_at` in last 48h → "Recently Added" badge
 * - 1: customer/contractor or any job/sub-job `updated_at` in last 48h, but no recent creation
 * - 0: neither
 */
export function entityRecentActivityRank(entity: ListingEntity): 0 | 1 | 2 {
  let hasJobCreate = false;
  let hasJobUpdate = false;
  for (const job of entity.jobs || []) {
    if (jobHasRecentCreation(job)) hasJobCreate = true;
    if (jobHasRecentUpdate(job)) hasJobUpdate = true;
  }
  const hasEntityCreate = isRecentTimestamp(createdAtOf(entity));
  const hasEntityUpdate = isRecentTimestamp(updatedAtOf(entity));
  if (hasJobCreate || hasEntityCreate) return 2;
  if (hasJobUpdate || hasEntityUpdate) return 1;
  return 0;
}

/**
 * Newest timestamp among entity + job/sub-job fields inside the 48h window.
 * Used to break ties so a just-created customer or job floats above another "recent" row.
 */
function entityRecentTouchMs(entity: ListingEntity): number {
  let max = 0;
  for (const raw of [createdAtOf(entity), updatedAtOf(entity)]) {
    const ms = parseTimeMs(raw);
    if (ms && isRecentTimestamp(raw)) max = Math.max(max, ms);
  }
  for (const job of entity.jobs || []) {
    for (const raw of [createdAtOf(job), updatedAtOf(job)]) {
      const ms = parseTimeMs(raw);
      if (ms && isRecentTimestamp(raw)) max = Math.max(max, ms);
    }
    for (const sj of job.subJobs || []) {
      for (const raw of [createdAtOf(sj), updatedAtOf(sj)]) {
        const ms = parseTimeMs(raw);
        if (ms && isRecentTimestamp(raw)) max = Math.max(max, ms);
      }
    }
  }
  return max;
}

/** Rank 2 → 1 → 0; same rank → most recently touched (within 48h) first; then `compareRest`. */
export function sortEntitiesByRecentJobActivity<T extends ListingEntity>(
  list: T[],
  compareRest: (a: T, b: T) => number,
): T[] {
  return [...list].sort((a, b) => {
    const ra = entityRecentActivityRank(a);
    const rb = entityRecentActivityRank(b);
    if (rb !== ra) return rb - ra;
    const ta = entityRecentTouchMs(a);
    const tb = entityRecentTouchMs(b);
    if (tb !== ta) return tb - ta;
    return compareRest(a, b);
  });
}

/** Badge flags: "Recently Added" if `created_at` in last 48h; "Recently Updated" if `updated_at` in last 48h. */
export function annotateJobsForListing(jobs: any[] | undefined): any[] {
  if (!jobs?.length) return [];

  return jobs.map((job: any) => {
    const createdRecent = isRecentTimestamp(createdAtOf(job));
    const updatedRecent = isRecentTimestamp(updatedAtOf(job));

    const subJobs = (job.subJobs || []).map((sj: any) => ({
      ...sj,
      __listingRecentlyAdded: isRecentTimestamp(createdAtOf(sj)),
      __listingRecentlyUpdated: isRecentTimestamp(updatedAtOf(sj)),
    }));

    return {
      ...job,
      subJobs,
      __listingRecentlyAdded: createdRecent,
      __listingRecentlyUpdated: updatedRecent,
    };
  });
}

/** Annotate entities based on their rank: 2 -> Added, 1 -> Updated. */
export function annotateEntitiesForListing<T extends ListingEntity>(
  list: T[],
): T[] {
  return list.map((entity) => {
    const rank = entityRecentActivityRank(entity);
    return {
      ...entity,
      __listingRecentlyAdded: rank === 2,
      __listingRecentlyUpdated: rank === 1 || rank === 2,
    };
  });
}

export type ListingParentSource = "customers" | "contractors";

export function jobBelongsToListingParent(
  job: any,
  parentId: string,
  source: ListingParentSource,
): boolean {
  const pid = String(parentId).trim();
  if (!pid) return false;

  const customerId = String(
    job?.customer_id ??
      job?.customer?.id ??
      (typeof job?.customer === "string" || typeof job?.customer === "number"
        ? job.customer
        : "") ??
      "",
  );
  const contractorId = String(
    job?.contractor_id ??
      job?.contractor?.id ??
      (typeof job?.contractor === "string" || typeof job?.contractor === "number"
        ? job.contractor
        : "") ??
      "",
  );

  if (source === "customers") {
    return customerId === pid;
  }
  return contractorId === pid || customerId === pid;
}

/** Create-estimate job dropdown: selected customer/contractor jobs first. */
export function sortJobsWithListingParentFirst(
  jobs: any[],
  parentId: string | null | undefined,
  source: ListingParentSource | null | undefined,
  selectedJobId?: string | null,
): any[] {
  if (!parentId || !source) return jobs;

  const first: any[] = [];
  const rest: any[] = [];
  for (const job of jobs) {
    if (jobBelongsToListingParent(job, parentId, source)) {
      first.push(job);
    } else {
      rest.push(job);
    }
  }

  if (selectedJobId) {
    const sid = String(selectedJobId);
    const idx = first.findIndex((j) => String(j?.id ?? "") === sid);
    if (idx > 0) {
      const [picked] = first.splice(idx, 1);
      first.unshift(picked);
    }
  }

  return [...first, ...rest];
}
