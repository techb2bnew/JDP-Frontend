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

/**
 * Listing sort priority (higher = closer to top):
 * - 2: any job/sub-job `created_at` in last 48h → also eligible for "Recently Added" badge
 * - 1: any job/sub-job `updated_at` in last 48h, but no recent creation → sort only, no badge
 * - 0: neither
 */
export function entityRecentActivityRank(entity: { jobs?: any[] }): 0 | 1 | 2 {
  let hasCreate = false;
  let hasUpdate = false;
  for (const job of entity.jobs || []) {
    if (jobHasRecentCreation(job)) hasCreate = true;
    if (jobHasRecentUpdate(job)) hasUpdate = true;
  }
  if (hasCreate) return 2;
  if (hasUpdate) return 1;
  return 0;
}

/**
 * Newest timestamp among job/sub-job fields that still fall inside the 48h window.
 * Used to break ties so a just-updated job floats above another "recent" customer.
 */
function entityRecentTouchMs(entity: { jobs?: any[] }): number {
  let max = 0;
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
export function sortEntitiesByRecentJobActivity<T extends { jobs?: any[] }>(
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

/** Badge flags: only "Recently Added" when `created_at` is within 48h (not for updates). */
export function annotateJobsForListing(jobs: any[] | undefined): any[] {
  if (!jobs?.length) return [];

  return jobs.map((job: any) => {
    const createdRecent = isRecentTimestamp(createdAtOf(job));
    const subJobs = (job.subJobs || []).map((sj: any) => ({
      ...sj,
      __listingRecentlyAdded: isRecentTimestamp(createdAtOf(sj)),
    }));
    return {
      ...job,
      subJobs,
      __listingRecentlyAdded: createdRecent,
    };
  });
}
