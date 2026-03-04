import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AdminPageLoader({ cards = 4, rows = 5, className = "" }) {
  return (
    <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8", className)}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3 shadow-sm"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="p-4 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-3">
                  <Skeleton className="h-12 col-span-2" />
                  <Skeleton className="h-12 col-span-1" />
                  <Skeleton className="h-12 col-span-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSectionLoader({ rows = 3, className = "" }) {
  return (
    <div className={cn("p-8 text-center", className)}>
      <div className="mx-auto mb-6 flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
      <div className="space-y-2 max-w-lg mx-auto">
        <Skeleton className="h-4 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AdminContentSkeleton({ lines = 2, imageHeight = 180, className = "" }) {
  const safeLines = Math.max(0, Number(lines) || 0);
  const lineWidths = Array.from({ length: safeLines }).map((_, index) =>
    safeLines > 1 && index === safeLines - 1 ? "50%" : "90%"
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-3 shadow-sm",
        className
      )}
      aria-hidden
    >
      <div className="fs-skeleton-block h-5" style={{ width: "60%" }} />
      {lineWidths.map((width, idx) => (
        <div key={idx} className="fs-skeleton-block h-3" style={{ width }} />
      ))}
      <div className="fs-skeleton-block w-full rounded-xl" style={{ height: imageHeight }} />
    </div>
  );
}
