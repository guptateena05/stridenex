"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Play, Tag } from "lucide-react";
import {
  type VideoItem,
  type YouTubeOEmbedMetadata,
  fetchYouTubeMetadata,
  formatDuration,
  formatVideoDate,
  getVideoTopic,
  getYouTubeThumbnail,
} from "./videos.types";

interface VideoCardProps {
  video: VideoItem;
  index: number;
  metadata?: YouTubeOEmbedMetadata | null;
  onMetadataLoaded?: (videoName: string, meta: YouTubeOEmbedMetadata) => void;
}

export default function VideoCard({
  video,
  index,
  metadata: propMetadata,
  onMetadataLoaded,
}: VideoCardProps) {
  const [fetchedMeta, setFetchedMeta] = useState<YouTubeOEmbedMetadata | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [thumbQuality, setThumbQuality] = useState<"maxresdefault" | "hqdefault">("maxresdefault");
  const [imgError, setImgError] = useState(false);

  const meta = propMetadata || fetchedMeta;
  const metaLoading = !propMetadata && !video.title && !hasFetched;
  const topic = getVideoTopic(video);

  useEffect(() => {
    if (propMetadata) {
      return;
    }

    let isMounted = true;

    fetchYouTubeMetadata(video.youtube_url)
      .then((result) => {
        if (!isMounted) return;
        if (result) {
          setFetchedMeta(result);
          onMetadataLoaded?.(video.name, result);
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
  }, [video.name, video.youtube_url, propMetadata, onMetadataLoaded]);

  const primaryThumb =
    video.thumbnail ||
    getYouTubeThumbnail(video.youtube_url, thumbQuality) ||
    meta?.thumbnail_url ||
    "";

  const displayTitle =
    video.title ||
    meta?.title ||
    `${topic} Episode — ${video.name}`;

  const authorName = meta?.author_name || "StrideNex";

  const formattedDate = formatVideoDate(video.upload_date || "");
  const durationLabel = formatDuration(meta?.lengthSeconds);

  const handleImageError = () => {
    if (thumbQuality === "maxresdefault") {
      setThumbQuality("hqdefault");
    } else {
      setImgError(true);
    }
  };

  return (
    <motion.a
      href={video.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch ${displayTitle} on YouTube`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.12 }}
      className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
    >
      {/* Clean, Unobstructed YouTube 16:9 Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
        {primaryThumb && !imgError ? (
          <Image
            src={primaryThumb}
            alt={displayTitle}
            fill
            priority={index < 3}
            unoptimized
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out sm:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 text-center">
            <Play className="mb-2 h-10 w-10 text-white/70" />
            <span className="line-clamp-2 text-sm font-semibold text-white/90">
              {displayTitle}
            </span>
          </div>
        )}

        {/* Desktop-Only Hover Overlay & Center Play Button (Never blocks mobile thumbnail) */}
        <div className="pointer-events-none absolute inset-0 hidden bg-slate-950/35 opacity-0 transition-opacity duration-300 sm:block sm:group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center opacity-0 transition-all duration-300 sm:flex sm: scale-90 sm:group-hover:scale-100 sm:group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 ring-4 ring-white/30">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </div>
        </div>

        {/* Classic YouTube Bottom-Right Duration Badge */}
        {durationLabel && (
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex items-center rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-sm">
            {durationLabel}
          </span>
        )}
      </div>

      {/* Neat Topic & Action Guide Bar Below Thumbnail */}
      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
          <Tag className="h-3 w-3 text-blue-600" />
          {topic}
        </span>

        <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50/70 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 transition-colors group-hover:border-red-200 group-hover:bg-red-600 group-hover:text-white">
          <Play className="h-2.5 w-2.5 fill-current" />
          <span>Watch on YouTube</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </span>
      </div>

      {/* YouTube-Style Info Row (Avatar + Title + Channel + Upload Date & Relative Time) */}
      <div className="mt-2.5 flex flex-1 gap-3 px-1 pb-1">
        {/* Channel Avatar (Company Circular Logo) */}
        <div
          title={authorName}
          className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm"
        >
          <Image
            src="/images/circularLogo.jpg"
            alt={authorName}
            fill
            unoptimized
            sizes="36px"
            className="object-cover"
          />
        </div>

        {/* Title & YouTube Metadata */}
        <div className="flex min-w-0 flex-1 flex-col">
          {metaLoading ? (
            <div className="my-0.5 space-y-2">
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            <h3
              title={displayTitle}
              className="line-clamp-2 text-[15px] sm:text-[16px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600"
            >
              {displayTitle}
            </h3>
          )}

          {/* Channel Name */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{authorName}</span>
          </div>

          {/* DocType Upload Date */}
          {formattedDate && (
            <div className="mt-auto pt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-100/80 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.a>
  );
}
