"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalItems <= 0) return null;

  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Dynamic windowing: up to 5 on desktop, 3 on mobile
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, safePage + 2);

    if (safePage <= 3) {
      end = Math.min(totalPages, 5);
      start = 1;
    } else if (safePage >= totalPages - 2) {
      start = Math.max(1, totalPages - 4);
      end = totalPages;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Mobile page window: keep exactly up to 3 pages visible on mobile
  const getMobileVisiblePages = () => {
    if (totalPages <= 3) return pageNumbers;
    if (safePage <= 2) return [1, 2, 3];
    if (safePage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [safePage - 1, safePage, safePage + 1];
  };
  const mobileVisibleSet = new Set(getMobileVisiblePages());

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-2.5 px-3 sm:px-5 py-3 bg-white border-t border-stone-200 text-xs text-stone-600 rounded-b-2xl ${className}`}
    >
      {/* 1. Left/Top: Summary Count */}
      <div className="flex items-center justify-between sm:justify-start gap-1.5 text-stone-500 text-[11px] sm:text-xs w-full sm:w-auto">
        <span>
          Showing <b>{startItem}</b>–<b>{endItem}</b> of <b>{totalItems}</b> entries
        </span>
        <span className="hidden sm:inline text-stone-300">·</span>
        <span className="hidden sm:inline text-[11px] text-stone-400 font-medium">
          (कुल {totalItems} रिकॉर्ड)
        </span>
      </div>

      {/* 2. Right/Bottom: Controls Bar (Rows [Desktop Only] + Pagination Buttons) */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Desktop-only Page Size Selector (Completely hidden on mobile per screenshot) */}
        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-500 font-medium">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-bold text-stone-800 outline-none focus:border-orange-500 transition cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* First Page (Desktop only) */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            title="First Page"
            className="hidden sm:grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Prev Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            title="Previous Page"
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page Number Buttons */}
          {pageNumbers.map((p) => {
            const isActive = p === safePage;
            const isMobileVisible = mobileVisibleSet.has(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  isMobileVisible ? "grid" : "hidden sm:grid"
                } ${
                  isActive
                    ? "bg-orange-600 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600"
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            title="Next Page"
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page (Desktop only) */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages}
            title="Last Page"
            className="hidden sm:grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
