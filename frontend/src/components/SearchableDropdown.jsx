"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

/**
 * SearchableDropdown
 * Fast, lightweight searchable select component.
 * Allows searching by name, phone number, vehicle number, site/address, etc.
 */
export default function SearchableDropdown({
  label = "",
  required = false,
  value = "",
  onChange,
  options = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search name, number...",
  getOptionLabel = (opt) => opt?.name || opt?.label || "",
  getOptionSublabel = (opt) => opt?.phone || opt?.sublabel || "",
  getOptionValue = (opt) => opt?._id || opt?.id || opt?.value,
  searchFields = (opt) => [opt?.name, opt?.phone, opt?.vehicleNumber, opt?.siteAddress, opt?.address],
  icon: Icon = null,
  allowClear = false,
  disabled = false,
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((opt) => String(getOptionValue(opt)) === String(value)) || null;
  }, [options, value, getOptionValue]);

  // Filter options based on user typing
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((opt) => {
      const fields = searchFields(opt) || [];
      const labelStr = getOptionLabel(opt);
      const sublabelStr = getOptionSublabel(opt);
      const allText = [...fields, labelStr, sublabelStr]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return allText.includes(q);
    });
  }, [options, query, searchFields, getOptionLabel, getOptionSublabel]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  const handleSelect = (opt) => {
    if (disabled) return;
    const val = opt ? getOptionValue(opt) : "";
    onChange && onChange(val, opt);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange && onChange("", null);
  };

  return (
    <div className={`relative w-full max-w-full min-w-0 ${className}`} ref={containerRef}>
      {/* Hidden real input for HTML form validation if required */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: "absolute", pointerEvents: "none" }}
          value={value || ""}
          required={required}
          onChange={() => {}}
        />
      )}

      {label && (
        <label className="block text-xs font-black uppercase text-stone-700 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex items-center justify-between gap-2 w-full max-w-full min-w-0 rounded-xl border ${
          open
            ? "border-orange-500 bg-white ring-2 ring-orange-500/20"
            : "border-stone-200 bg-stone-50 hover:bg-white focus:bg-white focus:border-orange-500"
        } px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 cursor-pointer shadow-2xs transition select-none ${
          disabled ? "opacity-60 cursor-not-allowed bg-stone-100" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {Icon && <Icon size={15} className="text-orange-500 shrink-0" />}
          {selectedOption ? (
            <div className="text-left flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <span className="font-black text-stone-900 truncate shrink-0 max-w-[130px] sm:max-w-none">
                {getOptionLabel(selectedOption)}
              </span>
              {getOptionSublabel(selectedOption) && (
                <span className="text-[11px] font-medium text-stone-500 truncate min-w-0 flex-1">
                  ({getOptionSublabel(selectedOption)})
                </span>
              )}
            </div>
          ) : (
            <span className="text-stone-400 font-normal truncate min-w-0 flex-1">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="p-0.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={`text-stone-400 transition-transform duration-200 ${open ? "rotate-180 text-orange-600" : ""}`}
          />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[200] w-full max-w-full rounded-2xl bg-white border border-stone-200/90 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/70">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-stone-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                className="w-full rounded-xl border border-stone-200 bg-white pl-8 pr-7 py-2 text-xs font-semibold text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 p-0.5 text-stone-400 hover:text-stone-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-stone-50 p-1">
            {allowClear && (
              <div
                role="button"
                onClick={() => handleSelect(null)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 cursor-pointer transition"
              >
                <span className="italic text-stone-400">-- None / Clear --</span>
              </div>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const optVal = getOptionValue(opt);
                const isSelected = String(optVal) === String(value);
                const optLabel = getOptionLabel(opt);
                const optSub = getOptionSublabel(opt);

                return (
                  <div
                    key={String(optVal)}
                    role="button"
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                      isSelected
                        ? "bg-orange-50 font-bold text-orange-950"
                        : "hover:bg-stone-100/80 text-stone-800"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`truncate ${isSelected ? "font-black text-orange-900" : "font-bold text-stone-900"}`}>
                          {optLabel}
                        </span>
                      </div>
                      {optSub && (
                        <p className="text-[11px] text-stone-500 truncate mt-0.5 font-medium">
                          {optSub}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-orange-600 shrink-0 stroke-[3]" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-stone-400">
                <p className="font-bold text-stone-600">No match found</p>
                <p className="text-[11px] mt-0.5 text-stone-400">
                  Try searching with a different name or number
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

