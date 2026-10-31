"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Film,
  Layers,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

export interface VideoCategoryOption {
  id: string;
  label: string;
  count: number;
  displayOrder: number;
  hasDisplayOrder: boolean;
}

interface VideoFilterBarProps {
  categories: VideoCategoryOption[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  shortsCount?: number;
}

export default function VideoFilterBar({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalCount,
  shortsCount = 0,
}: VideoFilterBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const allMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [allMenuOpen, setAllMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Only categories with display_order >= 1 appear in the horizontal slider
  const sliderCategories = categories.filter((cat) => cat.hasDisplayOrder);

  // Check if the user selected a category from the dropdown that has display_order === 0
  const selectedUnorderedCategory = categories.find(
    (cat) => cat.id === selectedCategory && !cat.hasDisplayOrder
  );

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [sliderCategories.length, selectedCategory, updateScrollButtons]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (allMenuRef.current && !allMenuRef.current.contains(event.target as Node)) {
        setAllMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(120, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // All categories (ordered 1, 2, 3... first, then display_order = 0) appear in the Topics dropdown
  const filteredDropdownCategories = categories.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );

  const combinedTotalCount = totalCount + shortsCount;
  const isMainTabActive =
    selectedCategory === "All" ||
    selectedCategory === "Videos" ||
    selectedCategory === "Shorts";
  const isShortsSelected = selectedCategory === "Shorts";
  const isVideosOnlySelected = selectedCategory === "Videos";

  const mainTabLabel = isShortsSelected
    ? "Shorts"
    : isVideosOnlySelected
      ? "Videos"
      : "All";
  const mainTabCount = isShortsSelected
    ? shortsCount
    : isVideosOnlySelected
      ? totalCount
      : combinedTotalCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between"
    >
      {/* All / Videos / Shorts Dropdown Tab + YouTube-style Scrollable Ordered Chips + Topics Dropdown */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div ref={allMenuRef} className="relative flex min-w-0 flex-1 items-center">
          {/* Left Scroll Arrow & Gradient Fade */}
          {canScrollLeft && (
            <div className="absolute left-0 z-10 flex h-full items-center bg-gradient-to-r from-white via-white/95 to-transparent pr-3">
              <button
                type="button"
                onClick={() => scrollByAmount("left")}
                aria-label="Scroll categories left"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Horizontal Chip Strip (All/Videos/Shorts dropdown button + display_order >= 1 categories) */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <button
              type="button"
              onClick={() => setAllMenuOpen((prev) => !prev)}
              aria-expanded={allMenuOpen}
              aria-label="Switch between All, Videos, and Shorts"
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                isShortsSelected
                  ? "bg-red-600 text-white shadow-sm shadow-red-200"
                  : isMainTabActive
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-300"
                    : "border border-slate-200/80 bg-slate-100/80 text-slate-700 hover:bg-slate-200/70 hover:text-slate-950"
              }`}
            >
              {isShortsSelected ? (
                <Zap className="h-3.5 w-3.5 fill-white text-white" />
              ) : isVideosOnlySelected ? (
                <Film className="h-3.5 w-3.5 text-blue-400" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>{mainTabLabel}</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] ${
                  isMainTabActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/90 text-slate-600"
                }`}
              >
                {mainTabCount}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  allMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {sliderCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm shadow-slate-300"
                      : "border border-slate-200/80 bg-slate-100/80 text-slate-700 hover:bg-slate-200/70 hover:text-slate-950"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200/90 text-slate-600"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Scroll Arrow & Gradient Fade */}
          {canScrollRight && (
            <div className="absolute right-0 z-10 flex h-full items-center bg-gradient-to-l from-white via-white/95 to-transparent pl-3">
              <button
                type="button"
                onClick={() => scrollByAmount("right")}
                aria-label="Scroll categories right"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Dropdown Menu Rendered Outside overflow-x-auto so it never clips */}
          {allMenuOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory("All");
                  setAllMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                  selectedCategory === "All"
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check
                    className={`h-3.5 w-3.5 ${
                      selectedCategory === "All" ? "opacity-100 text-amber-400" : "opacity-0"
                    }`}
                  />
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>All</span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    selectedCategory === "All"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {combinedTotalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory("Videos");
                  setAllMenuOpen(false);
                }}
                className={`mt-0.5 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                  selectedCategory === "Videos"
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check
                    className={`h-3.5 w-3.5 ${
                      selectedCategory === "Videos" ? "opacity-100 text-blue-400" : "opacity-0"
                    }`}
                  />
                  <Film
                    className={`h-3.5 w-3.5 ${
                      selectedCategory === "Videos" ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <span>Videos</span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    selectedCategory === "Videos"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory("Shorts");
                  setAllMenuOpen(false);
                }}
                className={`mt-0.5 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                  selectedCategory === "Shorts"
                    ? "bg-red-600 font-semibold text-white"
                    : "text-slate-700 hover:bg-red-50 hover:text-red-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check
                    className={`h-3.5 w-3.5 ${
                      selectedCategory === "Shorts" ? "opacity-100 text-white" : "opacity-0"
                    }`}
                  />
                  <Zap
                    className={`h-3.5 w-3.5 ${
                      selectedCategory === "Shorts"
                        ? "fill-white text-white"
                        : "fill-red-500 text-red-500"
                    }`}
                  />
                  <span>Shorts</span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    selectedCategory === "Shorts"
                      ? "bg-white/20 text-white"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {shortsCount}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Topics Dropdown (Includes ALL categories: ordered + display_order = 0) */}
        {categories.length > 0 && (
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-label="Browse all topics"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                dropdownOpen || selectedUnorderedCategory
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>
                {selectedUnorderedCategory ? selectedUnorderedCategory.label : "Topics"}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  selectedUnorderedCategory
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {selectedUnorderedCategory
                  ? selectedUnorderedCategory.count
                  : categories.length}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
                {categories.length > 4 && (
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Filter topics..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory("All");
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                      selectedCategory === "All"
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Check
                        className={`h-3.5 w-3.5 ${
                          selectedCategory === "All" ? "opacity-100 text-blue-600" : "opacity-0"
                        }`}
                      />
                      All Videos
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {totalCount}
                    </span>
                  </button>

                  {filteredDropdownCategories.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No matching topics
                    </div>
                  ) : (
                    filteredDropdownCategories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onSelectCategory(cat.id);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-blue-50 font-semibold text-blue-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Check
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isSelected ? "opacity-100 text-blue-600" : "opacity-0"
                              }`}
                            />
                            <span className="truncate">{cat.label}</span>
                          </span>
                          <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {cat.count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Search Input */}
      <div className="relative w-full shrink-0 lg:w-72 xl:w-80">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search videos or topics..."
          aria-label="Search videos or topics"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
