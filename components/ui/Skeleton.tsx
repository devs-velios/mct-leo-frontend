// Shimmering skeleton placeholder (see `.skeleton` in globals.css). Use instead of
// spinners while content loads.

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`skeleton rounded-lg ${className}`} {...props} />;
}

/** A list of card-shaped skeleton rows (alerts, generic lists). */
export function SkeletonCards({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 rounded-3xl border border-slate-100/80 bg-white p-5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2.5 py-0.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** A table-shaped skeleton (reminders, generic tables). */
export function SkeletonTable({ rows = 6, cols = 4, className = "" }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-100/80 bg-white ${className}`}>
      <div className="bg-slate-50 px-5 py-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A responsive grid of tile skeletons (drive, folder grids). */
export function SkeletonGrid({ count = 9, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
