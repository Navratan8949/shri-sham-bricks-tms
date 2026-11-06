"use client";

import { RefreshCw } from "lucide-react";

/**
 * Reusable Table Skeleton & Loading Rows
 * Renders an animated pulse shimmer skeleton across table columns when data is being fetched.
 */
export default function TableSkeletonRows({
  cols = 7,
  rows = 5,
  message = "डेटा लोड हो रहा है, कृपया प्रतीक्षा करें... (Loading data, please wait...)",
}) {
  return (
    <>
      {/* 1. Subtle Loading Notification Banner Row */}
      <tr className="bg-orange-50/50 border-b border-orange-100/70">
        <td colSpan={cols} className="px-5 py-3 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-black text-orange-700">
            <RefreshCw size={14} className="animate-spin text-orange-600 shrink-0" />
            <span>{message}</span>
          </div>
        </td>
      </tr>

      {/* 2. Realistic Shimmering Skeleton Rows */}
      {[...Array(rows)].map((_, rIdx) => {
        // Deterministic widths for realistic variation
        const widths = ["w-3/4", "w-2/3", "w-1/2", "w-4/5", "w-3/5"];
        const rowWidth = widths[rIdx % widths.length];

        return (
          <tr
            key={`skel-row-${rIdx}`}
            className="animate-pulse border-b border-stone-100 hover:bg-stone-50/40"
          >
            {/* Col 1: Lead column with icon/avatar box and title/subtitle */}
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-stone-200/90 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className={`h-3.5 bg-stone-200/90 rounded ${rowWidth}`} />
                  <div className="h-2.5 bg-stone-200/60 rounded w-1/3" />
                </div>
              </div>
            </td>

            {/* Middle Columns (cols - 2) */}
            {[...Array(Math.max(1, cols - 2))].map((_, cIdx) => {
              const cellWidths = ["w-20", "w-24", "w-28", "w-16", "w-32", "w-20"];
              const cellW = cellWidths[(rIdx + cIdx) % cellWidths.length];
              return (
                <td key={`skel-cell-${rIdx}-${cIdx}`} className="px-4 py-3.5">
                  <div className="space-y-1.5">
                    <div className={`h-3.5 bg-stone-200/80 rounded ${cellW}`} />
                    {cIdx % 2 === 0 && (
                      <div className="h-2 bg-stone-200/50 rounded w-12" />
                    )}
                  </div>
                </td>
              );
            })}

            {/* Last Col: Actions Placeholder (Sticky right lookalike) */}
            <td className="px-2 py-2.5 sm:px-5 sm:py-3.5 text-right whitespace-nowrap min-w-[65px] sm:min-w-[120px]">
              <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-stone-200/80" />
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-stone-200/80" />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

