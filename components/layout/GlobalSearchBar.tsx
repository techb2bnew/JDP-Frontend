"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  X,
  ChevronRight,
  User,
  UserCheck,
  Briefcase,
  FileText,
  ShoppingCart,
  Package,
  Truck,
  HardHat,
  Users,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../ui/utils";
import { apiClient } from "@/utils/api";
import {
  mergeGlobalSearchResults,
  getGlobalSearchNavigatePath,
  type GlobalSearchCategory,
  type GlobalSearchResultItem,
} from "@/utils/globalSearchNavigation";

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_LIMIT = 5;
const MIN_QUERY_LENGTH = 1;

const CATEGORY_ICONS: Record<GlobalSearchCategory, LucideIcon> = {
  customers: User,
  contractors: UserCheck,
  jobs: Briefcase,
  estimates: FileText,
  orders: ShoppingCart,
  products: Package,
  suppliers: Truck,
  labor: HardHat,
  leadLabor: Users,
  bluesheets: ClipboardList,
};

/** Per-category chip + icon tint for quick visual scan */
const CATEGORY_STYLES: Record<
  GlobalSearchCategory,
  { chip: string; iconBg: string; icon: string }
> = {
  customers: {
    chip: "bg-sky-50 text-sky-700 ring-sky-200/80",
    iconBg: "bg-sky-100",
    icon: "text-sky-600",
  },
  contractors: {
    chip: "bg-violet-50 text-violet-700 ring-violet-200/80",
    iconBg: "bg-violet-100",
    icon: "text-violet-600",
  },
  jobs: {
    chip: "bg-amber-50 text-amber-800 ring-amber-200/80",
    iconBg: "bg-amber-100",
    icon: "text-amber-700",
  },
  estimates: {
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
    iconBg: "bg-emerald-100",
    icon: "text-emerald-600",
  },
  orders: {
    chip: "bg-rose-50 text-rose-700 ring-rose-200/80",
    iconBg: "bg-rose-100",
    icon: "text-rose-600",
  },
  products: {
    chip: "bg-cyan-50 text-cyan-800 ring-cyan-200/80",
    iconBg: "bg-cyan-100",
    icon: "text-cyan-700",
  },
  suppliers: {
    chip: "bg-slate-100 text-slate-700 ring-slate-200/80",
    iconBg: "bg-slate-200",
    icon: "text-slate-600",
  },
  labor: {
    chip: "bg-orange-50 text-orange-800 ring-orange-200/80",
    iconBg: "bg-orange-100",
    icon: "text-orange-700",
  },
  leadLabor: {
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200/80",
    iconBg: "bg-indigo-100",
    icon: "text-indigo-600",
  },
  bluesheets: {
    chip: "bg-teal-50 text-teal-700 ring-teal-200/80",
    iconBg: "bg-teal-100",
    icon: "text-teal-600",
  },
};

function CategoryChip({
  label,
  category,
}: {
  label: string;
  category: GlobalSearchCategory;
}) {
  const style = CATEGORY_STYLES[category];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        style.chip,
      )}
    >
      {label}
    </span>
  );
}

function SearchResultRow({
  item,
  onSelect,
}: {
  item: GlobalSearchResultItem;
  onSelect: (item: GlobalSearchResultItem) => void;
}) {
  const Icon = CATEGORY_ICONS[item.category];
  const style = CATEGORY_STYLES[item.category];

  return (
    <li>
      <button
        type="button"
        className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSelect(item)}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            style.iconBg,
          )}
        >
          <Icon className={cn("h-4 w-4", style.icon)} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-snug text-slate-900">
            {item.label}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-2">
            <CategoryChip label={item.categoryLabel} category={item.category} />
            {item.subtitle && (
              <>
                <span className="shrink-0 text-slate-300" aria-hidden>
                  ·
                </span>
                <span className="min-w-0 truncate text-xs text-slate-500">
                  {item.subtitle}
                </span>
              </>
            )}
          </span>
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-primary" />
      </button>
    </li>
  );
}

export function GlobalSearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.universalGlobalSearch(trimmed, SEARCH_LIMIT);
      setResults(mergeGlobalSearchResults(data));
    } catch (err) {
      console.error("Global search failed:", err);
      setResults([]);
      setError(
        err instanceof Error ? err.message : "Search failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!open) return;

    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: GlobalSearchResultItem) => {
    const path = getGlobalSearchNavigatePath(item.category, item.raw);
    if (!path) return;

    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(path);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setError(null);
  };

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;
  const showDropdown = open && hasQuery;
  const trimmedQuery = query.trim();

  return (
    <div ref={containerRef} className="relative w-full max-w-lg min-w-[240px]">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="text"
        value={query}
        placeholder="Search customers, jobs, estimates..."
        className={cn(
          "h-10 w-full rounded-full border-slate-200 bg-slate-50/80 pl-10 pr-10 text-sm shadow-sm transition-all",
          "placeholder:text-slate-400 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/15",
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
        )}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label="Global search"
        aria-expanded={showDropdown}
        autoComplete="off"
      />
      {query.length > 0 && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/80 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showDropdown && (
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+6px)] z-[100] overflow-hidden",
            "rounded-xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50",
          )}
        >
          <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Search results
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Searching…
                </span>
              ) : error ? (
                <span className="text-red-600">{error}</span>
              ) : results.length === 0 ? (
                <>
                  No matches for{" "}
                  <span className="font-medium text-slate-800">
                    &ldquo;{trimmedQuery}&rdquo;
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900">
                    {results.length}
                  </span>{" "}
                  {results.length === 1 ? "match" : "matches"} for{" "}
                  <span className="font-medium text-slate-800">
                    &ldquo;{trimmedQuery}&rdquo;
                  </span>
                </>
              )}
            </p>
          </div>

          {!loading && !error && results.length > 0 && (
            <ul className="max-h-[min(60vh,380px)] divide-y divide-slate-100 overflow-y-auto py-1">
              {results.map((item) => (
                <SearchResultRow
                  key={`${item.category}-${item.id}`}
                  item={item}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Nothing found
              </p>
              <p className="max-w-[220px] text-xs text-slate-500">
                Try a name, email, job title, SKU, or invoice number
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
