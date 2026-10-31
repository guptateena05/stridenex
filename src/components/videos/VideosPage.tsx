"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Film, RefreshCw } from "lucide-react";
import VideoBanner from "./VideoBanner";
import VideoCard from "./VideoCard";
import VideoFilterBar, { type VideoCategoryOption } from "./VideoFilterBar";
import VideosPagination from "./VideosPagination";
import { AllShortsGrid, ShortPlayerModal, ShortsRow } from "./ShortsSection";
import {
  SHORTS_PER_PAGE,
  SHORTS_PER_PAGE_DISPLAY,
  VIDEOS_PER_PAGE,
  type ShortItem,
  type VideoItem,
  type YouTubeOEmbedMetadata,
  getShortUrl,
  getShortsEndpoint,
  getVideoTopic,
  getVideosEndpoint,
  normalizeDisplayOrder,
} from "./videos.types";

function filterAndSortVideos(rawVideos: VideoItem[]): VideoItem[] {
  const published = rawVideos.filter((item) => {
    if (!item.youtube_url) return false;
    if (item.category_details && item.category_details.is_active === 0) return false;
    if (!item.publication_status) return true;
    const status = item.publication_status.toLowerCase();
    return status === "publish" || status === "published";
  });

  published.sort((a, b) => {
    const orderA = normalizeDisplayOrder(a.category_details?.display_order);
    const orderB = normalizeDisplayOrder(b.category_details?.display_order);
    if (orderA !== orderB) return orderA - orderB;
    const dateA = new Date((a.upload_date || a.creation).replace(" ", "T")).getTime() || 0;
    const dateB = new Date((b.upload_date || b.creation).replace(" ", "T")).getTime() || 0;
    return dateB - dateA;
  });

  return published;
}

function filterAndSortShorts(rawShorts: ShortItem[]): ShortItem[] {
  const published = rawShorts.filter((item) => {
    const url = getShortUrl(item);
    if (!url) return false;
    if (!item.publication_status) return true;
    const status = item.publication_status.toLowerCase();
    return status === "publish" || status === "published";
  });

  published.sort((a, b) => {
    const dateA = new Date((a.creation || "").replace(" ", "T")).getTime() || 0;
    const dateB = new Date((b.creation || "").replace(" ", "T")).getTime() || 0;
    return dateB - dateA;
  });

  return published;
}

export default function VideosPage() {
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [allShorts, setAllShorts] = useState<ShortItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [metadataMap, setMetadataMap] = useState<Record<string, YouTubeOEmbedMetadata>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shortsLoading, setShortsLoading] = useState(true);
  const [shortsError, setShortsError] = useState(false);
  const [activeShort, setActiveShort] = useState<ShortItem | null>(null);

  const gridTopRef = useRef<HTMLDivElement>(null);

  const isFiltering = selectedCategory !== "All" || searchQuery.trim().length > 0;

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch(getVideosEndpoint(1, VIDEOS_PER_PAGE));
      if (!response.ok) {
        throw new Error(`Videos API returned ${response.status}`);
      }

      const result = await response.json();
      const firstPageRaw: VideoItem[] = result?.message?.data || [];
      const pagination = result?.message?.pagination;

      const resolvedTotalCount = Number(pagination?.total_count) || firstPageRaw.length;
      const resolvedTotalPages =
        Number(pagination?.total_pages) ||
        Math.max(1, Math.ceil(resolvedTotalCount / VIDEOS_PER_PAGE));

      const combinedMap = new Map<string, VideoItem>();
      for (const v of firstPageRaw) {
        if (v?.name) combinedMap.set(v.name, v);
      }

      if (resolvedTotalPages > 1) {
        const BATCH_SIZE = 5;
        for (let startPage = 2; startPage <= resolvedTotalPages; startPage += BATCH_SIZE) {
          const endPage = Math.min(resolvedTotalPages, startPage + BATCH_SIZE - 1);
          const batchPromises: Promise<VideoItem[]>[] = [];

          for (let p = startPage; p <= endPage; p += 1) {
            batchPromises.push(
              fetch(getVideosEndpoint(p, VIDEOS_PER_PAGE))
                .then((res) => (res.ok ? res.json() : null))
                .then((json) => (json?.message?.data ? (json.message.data as VideoItem[]) : []))
                .catch(() => [])
            );
          }

          const batchPages = await Promise.all(batchPromises);
          for (const pageList of batchPages) {
            for (const v of pageList) {
              if (v?.name) combinedMap.set(v.name, v);
            }
          }
        }
      }

      const globallySortedVideos = filterAndSortVideos(Array.from(combinedMap.values()));
      setAllVideos(globallySortedVideos);
    } catch (fetchError) {
      console.error("Failed to fetch videos:", fetchError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadShorts = useCallback(async () => {
    setShortsLoading(true);
    setShortsError(false);

    try {
      const response = await fetch(getShortsEndpoint(1, SHORTS_PER_PAGE));
      if (!response.ok) {
        throw new Error(`Shorts API returned ${response.status}`);
      }

      const result = await response.json();
      const firstPageRaw: ShortItem[] = result?.message?.data || [];
      const pagination = result?.message?.pagination;

      const resolvedTotalCount = Number(pagination?.total_count) || firstPageRaw.length;
      const pageSize = Number(pagination?.page_size) || SHORTS_PER_PAGE;
      const resolvedTotalPages = Math.max(1, Math.ceil(resolvedTotalCount / pageSize));

      const combinedMap = new Map<string, ShortItem>();
      for (const s of firstPageRaw) {
        if (s?.name) combinedMap.set(s.name, s);
      }

      if (resolvedTotalPages > 1) {
        const BATCH_SIZE = 5;
        for (let startPage = 2; startPage <= resolvedTotalPages; startPage += BATCH_SIZE) {
          const endPage = Math.min(resolvedTotalPages, startPage + BATCH_SIZE - 1);
          const batchPromises: Promise<ShortItem[]>[] = [];

          for (let p = startPage; p <= endPage; p += 1) {
            batchPromises.push(
              fetch(getShortsEndpoint(p, pageSize))
                .then((res) => (res.ok ? res.json() : null))
                .then((json) => (json?.message?.data ? (json.message.data as ShortItem[]) : []))
                .catch(() => [])
            );
          }

          const batchPages = await Promise.all(batchPromises);
          for (const pageList of batchPages) {
            for (const s of pageList) {
              if (s?.name) combinedMap.set(s.name, s);
            }
          }
        }
      }

      const globallySortedShorts = filterAndSortShorts(Array.from(combinedMap.values()));
      setAllShorts(globallySortedShorts);
    } catch (fetchError) {
      console.error("Failed to fetch shorts:", fetchError);
      setShortsError(true);
    } finally {
      setShortsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
    loadShorts();
  }, [loadVideos, loadShorts]);

  const handleMetadataLoaded = useCallback(
    (videoName: string, meta: YouTubeOEmbedMetadata) => {
      setMetadataMap((prev) => {
        if (prev[videoName]?.title === meta.title) return prev;
        return { ...prev, [videoName]: meta };
      });
    },
    []
  );

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const categories: VideoCategoryOption[] = useMemo(() => {
    const map = new Map<string, VideoCategoryOption>();

    for (const video of allVideos) {
      const topic = getVideoTopic(video);
      const existing = map.get(topic);
      const rawOrder = video.category_details?.display_order ?? 0;
      const displayOrder = normalizeDisplayOrder(rawOrder);
      const hasOrder = typeof rawOrder === "number" && rawOrder > 0;

      if (existing) {
        existing.count += 1;
        existing.displayOrder = Math.min(existing.displayOrder, displayOrder);
        existing.hasDisplayOrder = existing.hasDisplayOrder || hasOrder;
      } else {
        map.set(topic, {
          id: topic,
          label: topic,
          count: 1,
          displayOrder,
          hasDisplayOrder: hasOrder,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)
    );
  }, [allVideos]);

  const filteredVideos = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return allVideos.filter((video) => {
      const topic = getVideoTopic(video);
      if (
        selectedCategory !== "All" &&
        selectedCategory !== "Videos" &&
        topic !== selectedCategory
      ) {
        return false;
      }

      if (!normalizedQuery) return true;

      const meta = metadataMap[video.name];
      const titleText = (video.title || meta?.title || "").toLowerCase();
      const authorText = (meta?.author_name || "").toLowerCase();
      const topicText = topic.toLowerCase();
      const nameText = video.name.toLowerCase();

      return (
        titleText.includes(normalizedQuery) ||
        topicText.includes(normalizedQuery) ||
        authorText.includes(normalizedQuery) ||
        nameText.includes(normalizedQuery)
      );
    });
  }, [allVideos, selectedCategory, searchQuery, metadataMap]);

  const filteredShorts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return allShorts;

    return allShorts.filter((short) => {
      const meta = metadataMap[short.name];
      const titleText = (short.title || meta?.title || "").toLowerCase();
      const nameText = short.name.toLowerCase();
      return titleText.includes(normalizedQuery) || nameText.includes(normalizedQuery);
    });
  }, [allShorts, searchQuery, metadataMap]);

  const effectiveTotalCount = filteredVideos.length;
  const videoPages = Math.ceil(effectiveTotalCount / VIDEOS_PER_PAGE);
  const shortPages =
    selectedCategory === "All"
      ? Math.ceil(filteredShorts.length / SHORTS_PER_PAGE_DISPLAY)
      : 0;
  const effectiveTotalPages = Math.max(1, videoPages, shortPages);

  const displayedVideos = useMemo(
    () =>
      filteredVideos.slice(
        (currentPage - 1) * VIDEOS_PER_PAGE,
        currentPage * VIDEOS_PER_PAGE
      ),
    [filteredVideos, currentPage]
  );

  // Interleaved Video & Shorts chunks per page:
  // Rows 1 & 2: First 6 videos (3 per row)
  // Row 3: First 4 shorts of the page (4 per row)
  // Rows 4 & 5: Next 6 videos (3 per row)
  // Row 6: Next 4 shorts of the page (4 per row)
  const topVideos = useMemo(() => displayedVideos.slice(0, 6), [displayedVideos]);
  const bottomVideos = useMemo(() => displayedVideos.slice(6, 12), [displayedVideos]);

  const displayedShorts = useMemo(() => {
    if (selectedCategory !== "All") return [];
    return filteredShorts.slice(
      (currentPage - 1) * SHORTS_PER_PAGE_DISPLAY,
      currentPage * SHORTS_PER_PAGE_DISPLAY
    );
  }, [filteredShorts, currentPage, selectedCategory]);

  const middleShorts = useMemo(() => displayedShorts.slice(0, 4), [displayedShorts]);
  const bottomShorts = useMemo(() => displayedShorts.slice(4, 8), [displayedShorts]);

  const hasVideos = effectiveTotalCount > 0;
  const paginationTotalCount = hasVideos ? effectiveTotalCount : filteredShorts.length;
  const showingStart = hasVideos
    ? displayedVideos.length === 0
      ? 0
      : (currentPage - 1) * VIDEOS_PER_PAGE + 1
    : displayedShorts.length === 0
      ? 0
      : (currentPage - 1) * SHORTS_PER_PAGE_DISPLAY + 1;
  const showingEnd = hasVideos
    ? displayedVideos.length === 0
      ? 0
      : Math.min(
          effectiveTotalCount,
          (currentPage - 1) * VIDEOS_PER_PAGE + displayedVideos.length
        )
    : displayedShorts.length === 0
      ? 0
      : Math.min(
          filteredShorts.length,
          (currentPage - 1) * SHORTS_PER_PAGE_DISPLAY + displayedShorts.length
        );

  const handleViewAllShorts = useCallback(() => {
    setSelectedCategory("Shorts");
    setCurrentPage(1);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, effectiveTotalPages));
    if (nextPage === currentPage) return;
    setCurrentPage(nextPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      {/* Top Video Hero Banner */}
      <VideoBanner />

      <section
        ref={gridTopRef}
        className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-20 pt-2 sm:px-6 lg:px-8"
      >
        {/* Category Chips, Topics Dropdown & Search Bar */}
        {!error && (allVideos.length > 0 || allShorts.length > 0) && (
          <VideoFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            totalCount={allVideos.length}
            shortsCount={allShorts.length}
          />
        )}

        {/* Header for All Videos View (when user selects "Videos" from dropdown) */}
        {selectedCategory === "Videos" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30">
                <Film className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    All Videos
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Full-length podcasts, tutorials, and career insights from StrideNex
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectCategory("All")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to All</span>
            </button>
          </div>
        )}

        {selectedCategory === "Shorts" ? (
          <AllShortsGrid
            shorts={filteredShorts}
            loading={shortsLoading}
            error={shortsError}
            onRetry={loadShorts}
            metadataMap={metadataMap}
            onMetadataLoaded={handleMetadataLoaded}
            onSelectShort={setActiveShort}
            onBackToVideos={() => handleSelectCategory("All")}
          />
        ) : loading || (displayedVideos.length === 0 && shortsLoading) ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div className="aspect-video w-full animate-pulse rounded-xl bg-slate-200/80" />
                <div className="mt-3.5 flex gap-3 px-1 pb-1">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50/70 p-12 text-center">
            <p className="text-sm font-medium text-red-700">
              We couldn&apos;t load videos right now. Please try again.
            </p>
            <button
              type="button"
              onClick={() => {
                loadVideos();
                loadShorts();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : displayedVideos.length === 0 && displayedShorts.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Film className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isFiltering ? "No matching videos found" : "No videos available yet"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {isFiltering
                ? "Try selecting a different topic or clearing your search query."
                : "Check back soon for new podcasts, tutorials, and career insights."}
            </p>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  handleSelectCategory("All");
                  handleSearchChange("");
                }}
                className="mt-5 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Rows 1 & 2: First 6 Videos (3 per row) */}
            {topVideos.length > 0 && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {topVideos.map((video, index) => (
                  <VideoCard
                    key={video.name}
                    video={video}
                    index={index}
                    metadata={metadataMap[video.name]}
                    onMetadataLoaded={handleMetadataLoaded}
                  />
                ))}
              </div>
            )}

            {/* Row 3: Middle Shorts Row (or all page Shorts if no videos exist on this page) */}
            {!shortsLoading &&
              !shortsError &&
              (bottomVideos.length > 0 ? middleShorts.length > 0 : displayedShorts.length > 0) && (
                <ShortsRow
                  shorts={bottomVideos.length > 0 ? middleShorts : displayedShorts}
                  totalShortsCount={filteredShorts.length}
                  metadataMap={metadataMap}
                  onMetadataLoaded={handleMetadataLoaded}
                  onSelectShort={setActiveShort}
                  onViewAllShorts={handleViewAllShorts}
                />
              )}

            {/* Rows 4 & 5: Next 6 Videos (3 per row) */}
            {bottomVideos.length > 0 && (
              <div
                className={`grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 ${
                  middleShorts.length === 0 && topVideos.length > 0 ? "mt-8" : ""
                }`}
              >
                {bottomVideos.map((video, index) => (
                  <VideoCard
                    key={video.name}
                    video={video}
                    index={index + 6}
                    metadata={metadataMap[video.name]}
                    onMetadataLoaded={handleMetadataLoaded}
                  />
                ))}
              </div>
            )}

            {/* Row 6: Bottom Shorts Row (only when bottomVideos also exist to separate the two Shorts rows) */}
            {!shortsLoading &&
              !shortsError &&
              bottomVideos.length > 0 &&
              bottomShorts.length > 0 && (
                <ShortsRow
                  shorts={bottomShorts}
                  totalShortsCount={filteredShorts.length}
                  metadataMap={metadataMap}
                  onMetadataLoaded={handleMetadataLoaded}
                  onSelectShort={setActiveShort}
                  onViewAllShorts={handleViewAllShorts}
                />
              )}

            <VideosPagination
              currentPage={currentPage}
              totalPages={effectiveTotalPages}
              showingStart={showingStart}
              showingEnd={showingEnd}
              totalVideosCount={paginationTotalCount}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* Shared Shorts Modal Player */}
        <ShortPlayerModal
          shorts={filteredShorts}
          activeShort={activeShort}
          onClose={() => setActiveShort(null)}
          onSelectShort={setActiveShort}
          metadataMap={metadataMap}
        />
      </section>
    </main>
  );
}
