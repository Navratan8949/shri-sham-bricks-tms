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

  // Calculate visible page buttons (max 5 buttons with windowing)
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, safePage + 2);

    if (safePage <= 3) {
      end = Math.min(totalPages, 5);
    } else if (safePage >= totalPages - 2) {
      start = Math.max(1, totalPages - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-white border-t border-stone-200 text-xs text-stone-600 rounded-b-2xl ${className}`}
    >
      {/* Left: Summary Count */}
      <div className="flex items-center gap-2">
        <span>
          Showing <b>{startItem}</b>–<b>{endItem}</b> of <b>{totalItems}</b> entries
        </span>
        <span className="hidden md:inline text-stone-400">·</span>
        <span className="hidden md:inline text-[11px] text-stone-400 font-medium">
          (कुल {totalItems} में से {startItem}–{endItem})
        </span>
      </div>

      {/* Right: Controls (Page Size + Navigation) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded-lg border border-stone-200 bg-stone-50/80 px-2 py-1 font-bold text-stone-800 outline-none focus:border-orange-500 transition cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            title="First Page"
            className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            title="Previous Page"
            className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Numbered Buttons */}
          {pageNumbers.map((p) => {
            const isActive = p === safePage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-orange-600 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600"
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            title="Next Page"
            className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages}
            title="Last Page"
            className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

