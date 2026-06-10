// Loading placeholder for the dossier hub — mirrors the real layout (header, parcours
// timeline, chat, pipeline kanban, documents) so switching centres reads as a smooth
// transition instead of a blank/frozen screen. Uses the shared shimmer Skeleton.

import { Skeleton } from "@/components/ui/Skeleton";

export default function DossierDetailSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="h-11 w-full md:w-[280px] rounded-xl" />
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>

        {/* Parcours timeline + chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parcours card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-5">
            <Skeleton className="h-3 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <div className="space-y-2 flex-1 pt-0.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>

          {/* Chat card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
            <Skeleton className="h-5 w-40" />
            {[".self", "", ".self", ""].map((side, i) => (
              <div key={i} className={`flex ${i % 2 === 1 ? "justify-end" : "justify-start"}`}>
                <Skeleton className={`h-16 rounded-2xl ${i % 2 === 1 ? "w-1/2" : "w-3/4"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline kanban */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0 rounded-2xl border border-slate-200/40 bg-slate-100/60 p-4 space-y-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Documents grid */}
        <div className="bg-white p-7 rounded-3xl border border-slate-100 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
