"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import {
  type ShortItem,
  type YouTubeOEmbedMetadata,
  extractYouTubeId,
  fetchShortOEmbedMetadata,
  getCanonicalYouTubeShortsUrl,
  getShortUrl,
  getYouTubeShortEmbedUrl,
  getYouTubeThumbnail,
} from "./videos.types";

interface ShortCardProps {
  short: ShortItem;
  index: number;
  metadata?: YouTubeOEmbedMetadata | null;
  onMetadataLoaded: (shortName: string, meta: YouTubeOEmbedMetadata) => void;
  onSelectShort: (short: ShortItem) => void;
}

function ShortCard({
  short,
  index,
  metadata: propMetadata,
  onMetadataLoaded,
  onSelectShort,
}: ShortCardProps) {
  const [fetchedMeta, setFetchedMeta] = useState<YouTubeOEmbedMetadata | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [thumbQuality, setThumbQuality] = useState<"maxresdefault" | "hqdefault">("maxresdefault");
  const [imgError, setImgError] = useState(false);

  const shortUrl = getShortUrl(short);
  const meta = propMetadata || fetchedMeta;
  const metaLoading = !propMetadata && !short.title && !hasFetched;

  useEffect(() => {
    if (propMetadata || !shortUrl) {
      setHasFetched(true);
      return;
    }

    let isMounted = true;
    fetchShortOEmbedMetadata(shortUrl)
      .then((result) => {
        if (!isMounted) return;
        if (result) {
          setFetchedMeta(result);
          onMetadataLoaded(short.name, result);
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasFetched(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [short.name, shortUrl, propMetadata, onMetadataLoaded]);

  const primaryThumb =
    short.thumbnail ||
    getYouTubeThumbnail(shortUrl, thumbQuality) ||
    meta?.thumbnail_url ||
    "";

  const displayTitle = short.title || meta?.title || `StrideNex Short — ${short.name}`;

  const handleImageError = () => {
    if (thumbQuality === "maxresdefault") {
      setThumbQuality("hqdefault");
    } else {
      setImgError(true);
    }
  };

  const handleClick = () => {
    const videoId = extractYouTubeId(shortUrl);
    if (!videoId) {
      window.open(getCanonicalYouTubeShortsUrl(shortUrl), "_blank", "noopener,noreferrer");
      return;
    }
    onSelectShort(short);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={`Play short: ${displayTitle}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.1 }}
      className="group flex h-full w-full flex-col rounded-2xl border border-slate-200/80 bg-white p-1.5 sm:p-2.5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-100/40 focus:outline-none focus:ring-2 focus:ring-red-500/40"
    >
      {/* Vertical 9:16 Thumbnail Container */}
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-slate-950">
        {primaryThumb && !imgError ? (
          <Image
            src={primaryThumb}
            alt={displayTitle}
            fill
            unoptimized
            onError={handleImageError}
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-950 p-3 sm:p-5 text-center">
            <Play className="mb-2 h-8 w-8 sm:h-10 sm:w-10 text-white/75" />
            <span className="line-clamp-3 text-xs font-semibold text-white/90">
              {displayTitle}
            </span>
          </div>
        )}

        {/* Top-Left Shorts Badge */}
        <div className="pointer-events-none absolute left-2 top-2 sm:left-2.5 sm:top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-wide text-white backdrop-blur-md">
          <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-red-500 text-red-500" />
          <span>Shorts</span>
        </div>

        {/* Subtle Bottom Gradient & Hover Play Indicator */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 scale-90 group-hover:scale-100 group-hover:opacity-100">
          <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/50 ring-4 ring-white/30">
            <Play className="ml-0.5 h-5 w-5 sm:h-6 sm:w-6 fill-current" />
          </div>
        </div>

        {/* Title Overlay at Bottom of Vertical Card */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2.5 sm:p-3.5">
          {metaLoading ? (
            <div className="space-y-1.5">
              <div className="h-3.5 w-11/12 animate-pulse rounded bg-white/30" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/20" />
            </div>
          ) : (
            <h3
              title={displayTitle}
              className="line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-white drop-shadow-sm"
            >
              {displayTitle}
            </h3>
          )}
        </div>
      </div>
    </motion.button>
  );
}

interface ShortsRowProps {
  shorts: ShortItem[];
  totalShortsCount?: number;
  metadataMap: Record<string, YouTubeOEmbedMetadata>;
  onMetadataLoaded: (shortName: string, meta: YouTubeOEmbedMetadata) => void;
  onSelectShort: (short: ShortItem) => void;
  onViewAllShorts?: () => void;
}

export function ShortsRow({
  shorts,
  totalShortsCount,
  metadataMap,
  onMetadataLoaded,
  onSelectShort,
  onViewAllShorts,
}: ShortsRowProps) {
  if (shorts.length === 0) return null;

  return (
    <div className="my-10 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 sm:p-6">
      {/* YouTube-Style Inline Shelf Header with "View all" Button */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/25">
            <Zap className="h-3.5 w-3.5 fill-current" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Shorts
          </h3>
        </div>

        {onViewAllShorts && (
          <button
            type="button"
            onClick={onViewAllShorts}
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <span>View all shorts</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* 2 Shorts per Row on Mobile, 4 Shorts per Row on Desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {shorts.map((short, index) => (
          <ShortCard
            key={short.name}
            short={short}
            index={index}
            metadata={metadataMap[short.name]}
            onMetadataLoaded={onMetadataLoaded}
            onSelectShort={onSelectShort}
          />
        ))}
      </div>
    </div>
  );
}

interface AllShortsGridProps {
  shorts: ShortItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  metadataMap: Record<string, YouTubeOEmbedMetadata>;
  onMetadataLoaded: (shortName: string, meta: YouTubeOEmbedMetadata) => void;
  onSelectShort: (short: ShortItem) => void;
  onBackToVideos: () => void;
}

export function AllShortsGrid({
  shorts,
  loading,
  error,
  onRetry,
  metadataMap,
  onMetadataLoaded,
  onSelectShort,
  onBackToVideos,
}: AllShortsGridProps) {
  return (
    <div>
      {/* Header for All Shorts View */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                All Shorts
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Quick bite-sized insights and highlights from StrideNex
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToVideos}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-2xl border border-slate-100 bg-white p-1.5 sm:p-2.5 shadow-sm"
            >
              <div className="aspect-[9/16] w-full animate-pulse rounded-xl bg-slate-200/80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/70 p-8 text-center">
          <p className="text-sm font-medium text-red-700">
            We couldn&apos;t load Shorts right now. Please try again.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : shorts.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            No Shorts found
          </h3>
          <p className="mt-1.5 text-sm text-slate-500">
            Check back soon for new StrideNex Shorts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {shorts.map((short, index) => (
            <ShortCard
              key={short.name}
              short={short}
              index={index}
              metadata={metadataMap[short.name]}
              onMetadataLoaded={onMetadataLoaded}
              onSelectShort={onSelectShort}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ShortPlayerModalProps {
  shorts: ShortItem[];
  activeShort: ShortItem | null;
  onClose: () => void;
  onSelectShort: (short: ShortItem) => void;
  metadataMap: Record<string, YouTubeOEmbedMetadata>;
}

export function ShortPlayerModal({
  shorts,
  activeShort,
  onClose,
  onSelectShort,
  metadataMap,
}: ShortPlayerModalProps) {
  const activeIndex = activeShort
    ? shorts.findIndex((s) => s.name === activeShort.name)
    : -1;

  useEffect(() => {
    if (!activeShort) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && shorts.length > 1 && activeIndex !== -1) {
        const nextIdx = (activeIndex + 1) % shorts.length;
        onSelectShort(shorts[nextIdx]);
      } else if (e.key === "ArrowLeft" && shorts.length > 1 && activeIndex !== -1) {
        const prevIdx = (activeIndex - 1 + shorts.length) % shorts.length;
        onSelectShort(shorts[prevIdx]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeShort, activeIndex, shorts, onClose, onSelectShort]);

  const activeShortUrl = activeShort ? getShortUrl(activeShort) : "";
  const activeEmbedUrl = activeShort ? getYouTubeShortEmbedUrl(activeShortUrl) : "";
  const activeExternalShortsUrl = activeShort
    ? getCanonicalYouTubeShortsUrl(activeShortUrl)
    : "https://www.youtube.com/@stridenex/shorts";
  const activeTitle = activeShort
    ? activeShort.title ||
      metadataMap[activeShort.name]?.title ||
      `StrideNex Short — ${activeShort.name}`
    : "";

  const handlePrevShort = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shorts.length === 0 || activeIndex === -1) return;
    const prevIdx = (activeIndex - 1 + shorts.length) % shorts.length;
    onSelectShort(shorts[prevIdx]);
  };

  const handleNextShort = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shorts.length === 0 || activeIndex === -1) return;
    const nextIdx = (activeIndex + 1) % shorts.length;
    onSelectShort(shorts[nextIdx]);
  };

  return (
    <AnimatePresence>
      {activeShort && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 lg:p-6 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full items-center justify-center lg:w-auto lg:gap-5"
          >
            {/* Desktop/Laptop Outside Left (Previous) Button */}
            <button
              type="button"
              onClick={handlePrevShort}
              aria-label="Previous Short"
              className="hidden lg:flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-slate-900/90 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-slate-800"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Center 9:16 Modal Card (Larger on Mobile/Tablet, Taller & Neat on Laptop/Desktop) */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative flex h-[90vh] max-h-[840px] w-[92vw] max-w-[420px] sm:h-[90vh] sm:w-[76vw] sm:max-w-[440px] lg:h-[91vh] lg:max-h-[840px] lg:w-[calc((91vh-80px)*9/16)] lg:max-w-[390px] flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-slate-950 shadow-2xl"
            >
              {/* Slim Top Bar with Close (X) Button Properly Separated */}
              <div className="flex shrink-0 items-center justify-end border-b border-white/10 bg-slate-900/95 px-3 py-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Short modal"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/85 transition hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 9:16 YouTube Embed Player */}
              <div className="relative w-full flex-1 overflow-hidden bg-black">
                {activeEmbedUrl ? (
                  <iframe
                    key={activeShort.name}
                    src={activeEmbedUrl}
                    title={activeTitle}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
                    <p className="mb-4 text-sm text-slate-300">
                      This Short cannot be embedded directly.
                    </p>
                    <a
                      href={activeExternalShortsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                    >
                      <span>Watch on YouTube Shorts</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {/* Mobile & Tablet Inside Left/Right Navigation Arrows */}
                <button
                  type="button"
                  onClick={handlePrevShort}
                  aria-label="Previous Short"
                  className="lg:hidden absolute left-2.5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur-sm transition active:scale-95 hover:bg-black/85"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextShort}
                  aria-label="Next Short"
                  className="lg:hidden absolute right-2.5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur-sm transition active:scale-95 hover:bg-black/85"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Compact Modal Footer with Open on YouTube Link */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-slate-900/95 px-3.5 py-2">
                <span className="text-[11px] font-medium text-slate-400">
                  StrideNex Official
                </span>

                <a
                  href={activeExternalShortsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                >
                  <span>Open on YouTube</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>

            {/* Desktop/Laptop Outside Right (Next) Button */}
            <button
              type="button"
              onClick={handleNextShort}
              aria-label="Next Short"
              className="hidden lg:flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-slate-900/90 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-slate-800"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
