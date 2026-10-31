import { getYouTubeVideoDetailsServer } from "./videoMetadata.action";

export interface VideoCategoryDetails {
  name: string;
  category_name: string;
  display_order?: number;
  is_active?: number;
}

export interface VideoItem {
  name: string;
  youtube_url: string;
  upload_date?: string | null;
  category?: string;
  publication_status?: string;
  creation: string;
  category_details?: VideoCategoryDetails;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface ShortItem {
  name: string;
  youtube_short_url: string;
  youtube_url?: string;
  publication_status?: string;
  creation: string;
  title?: string;
  thumbnail?: string;
}

export interface VideosPaginationMeta {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface YouTubeOEmbedMetadata {
  title: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  provider_name?: string;
  uploadDate?: string;
  lengthSeconds?: number;
  viewCount?: number;
}

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") || "";
export const VIDEOS_PER_PAGE = 12;
export const SHORTS_PER_PAGE = 10;
export const SHORTS_PER_PAGE_DISPLAY = 8;

export function getVideosEndpoint(page: number, pageSize: number = VIDEOS_PER_PAGE) {
  return `${BASE_URL}/api/method/stridenex_app.api_stridenex_app.videos.get_videos?page=${page}&page_size=${pageSize}`;
}

export function getShortsEndpoint(page: number = 1, pageSize: number = SHORTS_PER_PAGE) {
  return `${BASE_URL}/api/method/stridenex_app.api_stridenex_app.shorts.get_shorts?page=${page}&page_size=${pageSize}`;
}

export function getShortUrl(short: ShortItem): string {
  return (short.youtube_short_url || short.youtube_url || "").trim();
}

export function getCanonicalYouTubeShortsUrl(shortUrl?: string): string {
  const id = extractYouTubeId(shortUrl);
  if (id) {
    return `https://www.youtube.com/shorts/${id}`;
  }
  return shortUrl || "https://www.youtube.com/@stridenex/shorts";
}

export function getYouTubeShortEmbedUrl(shortUrl?: string): string {
  const id = extractYouTubeId(shortUrl);
  if (!id) return "";
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1&loop=1&playlist=${encodeURIComponent(id)}`;
}

export function extractYouTubeId(value?: string): string {
  if (!value) return "";
  try {
    const trimmed = value.trim();
    const url = new URL(trimmed);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    const vParam = url.searchParams.get("v");
    if (vParam) return vParam;

    const segments = url.pathname.split("/").filter(Boolean);
    const embedIdx = segments.findIndex(
      (s) => s === "embed" || s === "shorts" || s === "v" || s === "live"
    );
    if (embedIdx !== -1 && segments[embedIdx + 1]) {
      return segments[embedIdx + 1];
    }

    return segments.pop() || "";
  } catch {
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = value.match(regExp);
    return match && match[1].length === 11 ? match[1] : "";
  }
}

export function getYouTubeThumbnail(
  youtubeUrl?: string,
  quality: "maxresdefault" | "sddefault" | "hqdefault" | "mqdefault" = "maxresdefault"
): string {
  const id = extractYouTubeId(youtubeUrl);
  if (!id) return "";
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

export function getCanonicalYouTubeWatchUrl(youtubeUrl?: string): string {
  const id = extractYouTubeId(youtubeUrl);
  if (id) {
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return youtubeUrl || "https://www.youtube.com";
}

const metadataCache = new Map<string, YouTubeOEmbedMetadata>();

export async function fetchYouTubeMetadata(
  youtubeUrl: string
): Promise<YouTubeOEmbedMetadata | null> {
  const videoId = extractYouTubeId(youtubeUrl);
  const cacheKey = videoId || youtubeUrl;

  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey)!;
  }

  // 1. Fetch full YouTube metadata (title, author, uploadDate, lengthSeconds, viewCount) via Server Action
  if (videoId) {
    try {
      const serverDetails = await getYouTubeVideoDetailsServer(videoId);
      if (serverDetails && serverDetails.title) {
        const meta: YouTubeOEmbedMetadata = {
          title: serverDetails.title,
          author_name: serverDetails.author_name || "StrideNex",
          thumbnail_url: serverDetails.thumbnail_url,
          provider_name: "YouTube",
          uploadDate: serverDetails.uploadDate,
          lengthSeconds: serverDetails.lengthSeconds,
          viewCount: serverDetails.viewCount,
        };
        metadataCache.set(cacheKey, meta);
        return meta;
      }
    } catch {
      // Fallback to client oEmbed below
    }
  }

  // 2. Fallback to public oEmbed endpoints
  const watchUrl = getCanonicalYouTubeWatchUrl(youtubeUrl);
  const endpoints = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.title) {
        const meta: YouTubeOEmbedMetadata = {
          title: data.title,
          author_name: data.author_name || "StrideNex",
          author_url: data.author_url,
          thumbnail_url: data.thumbnail_url,
          provider_name: data.provider_name || "YouTube",
        };
        metadataCache.set(cacheKey, meta);
        return meta;
      }
    } catch {
      // Try next fallback endpoint
    }
  }

  return null;
}

const shortMetadataCache = new Map<string, YouTubeOEmbedMetadata>();

/**
 * Lightweight client-side metadata fetcher for YouTube Shorts (Title & Thumbnail only).
 * Uses public browser-accessible oEmbed endpoints with zero API keys or server-IP scraping.
 */
export async function fetchShortOEmbedMetadata(
  shortUrl: string
): Promise<YouTubeOEmbedMetadata | null> {
  const videoId = extractYouTubeId(shortUrl);
  const cacheKey = videoId || shortUrl;

  if (shortMetadataCache.has(cacheKey)) {
    return shortMetadataCache.get(cacheKey)!;
  }

  const watchUrl = getCanonicalYouTubeWatchUrl(shortUrl);
  const endpoints = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.title) {
        const meta: YouTubeOEmbedMetadata = {
          title: data.title,
          author_name: data.author_name || "StrideNex",
          author_url: data.author_url,
          thumbnail_url: data.thumbnail_url,
          provider_name: data.provider_name || "YouTube",
        };
        shortMetadataCache.set(cacheKey, meta);
        return meta;
      }
    } catch {
      // Try next fallback endpoint
    }
  }

  return null;
}

export function getVideoTopic(video: VideoItem): string {
  return (
    video.category_details?.category_name?.trim() ||
    video.category?.trim() ||
    "General"
  );
}

/**
 * Normalizes `display_order` so 1 = 1st, 2 = 2nd, etc.
 * A value of 0 (or undefined/negative) means "no order" and is placed after ordered items.
 */
export function normalizeDisplayOrder(order?: number): number {
  return typeof order === "number" && order > 0 ? order : Number.MAX_SAFE_INTEGER;
}

function parseDateValue(value?: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatVideoDate(value?: string): string {
  const date = parseDateValue(value);
  if (!date) return value || "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(value?: string): string {
  const date = parseDateValue(value);
  if (!date) return "";

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

export function formatDuration(lengthSeconds?: number): string {
  if (!lengthSeconds || lengthSeconds <= 0) return "";
  const total = Math.floor(lengthSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours > 0) {
    const paddedMinutes = String(minutes).padStart(2, "0");
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

export function formatViews(viewCount?: number): string {
  if (viewCount === undefined || viewCount === null || viewCount < 0) return "";
  if (viewCount < 1000) return `${viewCount} view${viewCount === 1 ? "" : "s"}`;
  if (viewCount < 1_000_000) {
    const k = (viewCount / 1000).toFixed(viewCount < 10_000 ? 1 : 0).replace(/\.0$/, "");
    return `${k}K views`;
  }
  const m = (viewCount / 1_000_000).toFixed(1).replace(/\.0$/, "");
  return `${m}M views`;
}

export function getPaginationItems(
  currentPage: number,
  totalPages: number
): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-end", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-start", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
}
