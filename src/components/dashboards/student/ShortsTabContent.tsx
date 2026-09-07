// components/dashboards/student/ShortsTabContent.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getShortsFeed, saveShort, unsaveShort, getSavedShorts, toggleLikeShort, addShortComment, getShortComments, toggleLikeComment, createPlaylist, saveShortToPlaylist, getStudentPlaylists } from "@/services/student.services";
import { BASE_DOMAIN } from "@/services/api.services";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import ReactPlayer from "react-player";
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronRight as ChevronRightIcon,
  Heart,
  MessageSquare,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Share2,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Maximize2,
  ListPlus,
  Ban,
  Flag,
  FileText,
  Sliders,
  Plus,
  Compass,
  Repeat
} from "lucide-react";
import { BaseCard } from "@/components/dashboards/shared/BaseCard";
import { CardHeader } from "@/components/dashboards/shared/CardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types
interface ShortVideo {
  id: any;
  title: string;
  category: string;
  duration: string;
  views: string;
  author: string;
  authorAvatar: string;
  authorHandle: string;
  tags: string[];
  description?: string;
  isSaved: boolean;
  videoUrl: string;
  thumbnail?: string;
  color: string;
  likes?: string;
  commentCount?: number;
}

interface SavedShort {
  id: number;
  title: string;
  category: string;
  savedDate: string;
  icon: string;
  color: string;
}

interface RecommendedShort {
  id: number;
  title: string;
  duration: string;
  match: string;
  views: string;
  category: string;
}

// Sample video URLs
const videoUrls = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
];

// Trending shorts data
const trendingShorts: ShortVideo[] = [
  {
    id: 1,
    title: "System Design in 30s",
    category: "Architecture",
    duration: "30 sec",
    views: "128K",
    author: "techbro",
    authorHandle: "@techbro",
    authorAvatar: "TB",
    tags: ["System Design", "Architecture"],
    isSaved: false,
    videoUrl: videoUrls[0],
    color: "blue"
  },
  {
    id: 2,
    title: "Async/Await explained",
    category: "JavaScript",
    duration: "30 sec",
    views: "89K",
    author: "jsmaster",
    authorHandle: "@jsmaster",
    authorAvatar: "JM",
    tags: ["JavaScript", "Promises"],
    isSaved: true,
    videoUrl: videoUrls[1],
    color: "yellow"
  },
  {
    id: 3,
    title: "SQL Joins visualized",
    category: "SQL",
    duration: "30 sec",
    views: "210K",
    author: "databaseguru",
    authorHandle: "@databaseguru",
    authorAvatar: "DG",
    tags: ["SQL", "Database"],
    isSaved: false,
    videoUrl: videoUrls[2],
    color: "blue"
  },
  {
    id: 4,
    title: "Python List Comprehension",
    category: "Python",
    duration: "30 sec",
    views: "156K",
    author: "pythonista",
    authorHandle: "@pythonista",
    authorAvatar: "PY",
    tags: ["Python", "Coding"],
    isSaved: true,
    videoUrl: videoUrls[3],
    color: "blue"
  },
  {
    id: 5,
    title: "ML Bias in 28 seconds",
    category: "Machine Learning",
    duration: "28 sec",
    views: "74K",
    author: "mlengineer",
    authorHandle: "@mlengineer",
    authorAvatar: "ML",
    tags: ["ML", "Bias"],
    isSaved: false,
    videoUrl: videoUrls[4],
    color: "purple"
  },
  {
    id: 6,
    title: "Bias-Variance Tradeoff",
    category: "Machine Learning",
    duration: "28s",
    views: "67K",
    author: "mlguru",
    authorHandle: "@mlguru",
    authorAvatar: "MG",
    tags: ["ML", "Model Evaluation"],
    isSaved: false,
    videoUrl: videoUrls[5],
    color: "purple"
  }
];

// Saved shorts data
const savedShorts: SavedShort[] = [
  {
    id: 1,
    title: "Python List Comprehension",
    category: "Python",
    savedDate: "Saved 2d ago",
    icon: "🐍",
    color: "blue"
  },
  {
    id: 2,
    title: "SQL Joins visualized",
    category: "SQL",
    savedDate: "Saved 4d ago",
    icon: "🗄️",
    color: "blue"
  },
  {
    id: 3,
    title: "Async/Await explained",
    category: "JavaScript",
    savedDate: "Saved 1w ago",
    icon: "🟨",
    color: "yellow"
  }
];

// Recommended shorts data - enhanced for table view
const recommendedShorts: RecommendedShort[] = [
  {
    id: 1,
    title: "Bias-Variance Tradeoff",
    duration: "28s",
    match: "97%",
    views: "45K",
    category: "Machine Learning"
  },
  {
    id: 2,
    title: "Feature Scaling methods",
    duration: "30s",
    match: "94%",
    views: "38K",
    category: "Machine Learning"
  },
  {
    id: 3,
    title: "Confusion Matrix explained",
    duration: "25s",
    match: "91%",
    views: "52K",
    category: "Machine Learning"
  },
  {
    id: 4,
    title: "Gradient Descent visualized",
    duration: "32s",
    match: "89%",
    views: "41K",
    category: "Deep Learning"
  },
  {
    id: 5,
    title: "Cross Validation basics",
    duration: "27s",
    match: "86%",
    views: "29K",
    category: "Model Evaluation"
  }
];

// Video Player Component
function VideoPlayer({ 
  video, 
  isActive, 
  isMuted, 
  setIsMuted,
  playing,
  setPlaying
}: { 
  video: ShortVideo; 
  isActive: boolean; 
  isMuted: boolean; 
  setIsMuted: (m: boolean) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
}) {
  const [played, setPlayed] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (isActive) {
      setPlaying(true);
      if (playerRef.current) {
        playerRef.current.seekTo(0);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!video.videoUrl) return;

    let active = true;
    let objectUrl = "";

    const loadVideo = async () => {
      try {
        setLoadingVideo(true);
        const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
        const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;
        
        const headers: Record<string, string> = {};
        if (apiKey && apiSecret) {
          headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
        }
        
        const response = await fetch(video.videoUrl, { headers });
        if (!response.ok) {
          console.warn(`Secure video fetch returned status ${response.status}, falling back to direct URL.`);
          if (active) {
            setVideoSrc(video.videoUrl);
          }
          return;
        }
        
        const blob = await response.blob();
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setVideoSrc(objectUrl);
        }
      } catch (err) {
        console.warn("Error fetching video blob, falling back to direct url:", err);
        if (active) {
          setVideoSrc(video.videoUrl);
        }
      } finally {
        if (active) {
          setLoadingVideo(false);
        }
      }
    };

    loadVideo();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [video.videoUrl]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(!playing);
  };

  const handleProgress = (state: any) => {
    setPlayed(state.played);
  };

  return (
    <div 
      className="w-full h-full relative flex items-center justify-center cursor-pointer select-none"
      onClick={handlePlayPause}
    >
      {loadingVideo && !videoSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {videoSrc ? (
        <ReactPlayer
          ref={playerRef}
          url={videoSrc}
          width="100%"
          height="100%"
          playing={playing && isActive}
          muted={isMuted}
          loop={true}
          playsInline={true}
          onProgress={handleProgress}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: true,
                style: { objectFit: 'cover', width: '100%', height: '100%', pointerEvents: 'none', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' },
                playsInline: true
              }
            }
          }}
        />
      ) : null}
      
      {/* Transient Play/Pause Overlay indicator */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 z-10 transition-all pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center text-white scale-110 transition-transform shadow-lg">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Progress Bar at the very bottom edge of the player */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/80 z-20">
        <div
          className="h-full bg-orange-500 transition-all duration-100"
          style={{ width: `${played * 100}%` }}
        />
      </div>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ShortsTabContent() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [activeVideoId, setActiveVideoId] = useState<any>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [shortsList, setShortsList] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "saved">("all");
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState<ShortVideo | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name?: string; author: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [isSavedListOpen, setIsSavedListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // YouTube Overlay Menu States
  const [openMenuShortId, setOpenMenuShortId] = useState<any>(null);
  const [ambientMode, setAmbientMode] = useState(true);
  const [showCaptionsShortId, setShowCaptionsShortId] = useState<any>(null);
  const [showDescriptionShort, setShowDescriptionShort] = useState<ShortVideo | null>(null);
  const [activePlaying, setActivePlaying] = useState(true);
  const likedIdsFromFeedOnLoad = useRef<Set<string>>(new Set());
  const lastFetchedWebShortIdRef = useRef<string | null>(null);
  const [localCommentCounts, setLocalCommentCounts] = useState<Record<string, number>>({});

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistShortId, setPlaylistShortId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [selectedPlaylistForView, setSelectedPlaylistForView] = useState<any | null>(null);

  const playPlaylistShort = (shortItem: any) => {
    const shortId = String(shortItem.name || shortItem.id);
    const exists = shortsList.some(s => String(s.id) === shortId);
    if (!exists) {
      const videoUrl = shortItem.video ? (shortItem.video.startsWith('http') ? shortItem.video : `${BASE_DOMAIN}${shortItem.video}`) : '';
      const thumbnail = shortItem.thumbnail ? (shortItem.thumbnail.startsWith('http') ? shortItem.thumbnail : `${BASE_DOMAIN}${shortItem.thumbnail}`) : undefined;
      const mappedShort: ShortVideo = {
        id: shortId,
        title: shortItem.title || "Untitled Short",
        category: shortItem.skill || "Skill",
        duration: shortItem.duration_display || `${shortItem.duration_seconds || 30} sec`,
        views: shortItem.views_display || `${shortItem.view_count || 0}`,
        likes: String(shortItem.like_count || 0),
        commentCount: Number(shortItem.comment_count || 0),
        author: "StrideNex",
        authorHandle: "@stridenex",
        authorAvatar: (shortItem.skill || "Skill").substring(0, 2).toUpperCase(),
        tags: [],
        description: shortItem.description || "",
        isSaved: true,
        videoUrl: videoUrl,
        thumbnail: thumbnail,
        color: "orange"
      };
      setShortsList(prev => [...prev, mappedShort]);
    }
    
    setTimeout(() => {
      const el = document.getElementById(`short-card-${shortId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setActiveVideoId(shortId);
      }
    }, 150);
    setIsSavedListOpen(false);
  };

  const fetchPlaylists = async () => {
    if (!currentUser) return;
    try {
      setPlaylistsLoading(true);
      const res = await getStudentPlaylists(currentUser);
      let rawPlaylists = [];
      if (res && Array.isArray(res.message)) {
        rawPlaylists = res.message;
      } else if (res && Array.isArray(res.data)) {
        rawPlaylists = res.data;
      } else if (res && res.message && Array.isArray(res.message.data)) {
        rawPlaylists = res.message.data;
      }
      setPlaylists(rawPlaylists);
    } catch (err) {
      console.error("Error loading student playlists:", err);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaylistModalOpen) {
      fetchPlaylists();
    }
  }, [isPlaylistModalOpen]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !currentUser) return;
    try {
      setIsCreatingPlaylist(true);
      const res = await createPlaylist({
        student: currentUser,
        playlist_name: newPlaylistName.trim()
      });
      const alertMsg = res?.message?.message || "Playlist created!";
      showToast(alertMsg, "success");
      setNewPlaylistName("");
      await fetchPlaylists();
    } catch (err: any) {
      console.error("Error creating playlist:", err);
      showToast(err.message || "Failed to create playlist", "error");
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handleSaveToPlaylist = async (playlistId: string) => {
    if (!playlistShortId) return;
    try {
      const res = await saveShortToPlaylist({
        playlist: playlistId,
        shorts: String(playlistShortId)
      });
      const alertMsg = res?.message?.message || "Short added to playlist!";
      showToast(alertMsg, "success");
      setIsPlaylistModalOpen(false);
      setPlaylistShortId(null);
    } catch (err: any) {
      console.error("Error saving short to playlist:", err);
      showToast(err.message || "Failed to add short to playlist", "error");
    }
  };

  const formatComments = (rawList: any[]): any[] => {
    if (!Array.isArray(rawList)) return [];

    const mapComment = (item: any): any => {
      const commentId = String(item.name || item.id || Math.random());
      const authorEmail = item.comment_by || item.owner || item.user || item.author || "Anonymous";
      const authorName = authorEmail.includes("@") 
        ? authorEmail.split("@")[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : authorEmail;
      const initials = authorName.substring(0, 2).toUpperCase() || "AN";
      const timeStr = item.creation ? item.creation.substring(0, 16) : (item.time || "Just now");
      
      const nestedReplies = Array.isArray(item.replies) ? item.replies.map(mapComment) : [];

      return {
        id: commentId,
        name: item.name || item.id || commentId,
        short: item.short,
        content: item.content || item.comment || item.text || "",
        author: authorName,
        authorEmail: authorEmail,
        avatar: initials,
        time: timeStr,
        parent_comment: item.parent_comment || "",
        likes: item.like_count ?? item.likes ?? 0,
        isLiked: Boolean(item.is_liked),
        isPinned: Boolean(item.is_pinned),
        replies: nestedReplies
      };
    };

    const isAlreadyNested = rawList.some(item => Array.isArray(item.replies));
    if (isAlreadyNested) {
      return rawList.map(mapComment);
    }

    const map: Record<string, any> = {};
    const rootComments: any[] = [];

    rawList.forEach((item: any) => {
      const formatted = mapComment(item);
      map[formatted.id] = formatted;
    });

    rawList.forEach((item: any) => {
      const commentId = String(item.name || item.id);
      const parentId = item.parent_comment ? String(item.parent_comment) : "";
      const commentObj = map[commentId];

      if (parentId && map[parentId]) {
        if (!map[parentId].replies.some((r: any) => r.id === commentId)) {
          map[parentId].replies.push(commentObj);
        }
      } else if (!parentId || !map[parentId]) {
        if (!rootComments.some((c: any) => c.id === commentId)) {
          rootComments.push(commentObj);
        }
      }
    });

    return rootComments;
  };

  const fetchComments = async (shortId: string) => {
    if (!shortId) return;
    try {
      setCommentsLoading(true);
      const res = await getShortComments(String(shortId));
      let rawList = [];
      let commentCountVal = 0;

      if (res && res.message && typeof res.message === 'object' && !Array.isArray(res.message)) {
        rawList = res.message.comments || [];
        commentCountVal = res.message.comment_count || 0;
      } else if (res && Array.isArray(res.message)) {
        rawList = res.message;
        commentCountVal = res.message.length;
      } else if (res && Array.isArray(res.data)) {
        rawList = res.data;
        commentCountVal = res.data.length;
      } else if (res && res.message && Array.isArray(res.message.data)) {
        rawList = res.message.data;
        commentCountVal = res.message.data.length;
      }

      setLocalCommentCounts(prev => ({
        ...prev,
        [String(shortId)]: commentCountVal
      }));

      const formatted = formatComments(rawList);
      setCommentsList(formatted);
    } catch (err) {
      console.error("Error loading short comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenComments = (short: ShortVideo) => {
    setSelectedShort(short);
    setReplyingTo(null);
    setIsCommentsOpen(true);
    fetchComments(String(short.id));
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !selectedShort) return;
    const shortId = String(selectedShort.id);
    const contentText = newCommentText.trim();
    const parentCommentId = replyingTo ? (replyingTo.name || replyingTo.id) : "";

    setNewCommentText("");
    setReplyingTo(null);

    try {
      await addShortComment({
        short: shortId,
        content: contentText,
        parent_comment: parentCommentId
      });
      showToast("Comment posted!", "success");
      setLocalCommentCounts(prev => ({
        ...prev,
        [shortId]: (prev[shortId] || 0) + 1
      }));
      await fetchComments(shortId);
    } catch (err: any) {
      console.error("Error posting short comment:", err);
      showToast(err.message || "Failed to post comment", "error");
    }
  };

  const updateCommentInList = (list: any[], id: string, updater: (c: any) => any): any[] => {
    return list.map(c => {
      if (c.id === id) {
        return updater(c);
      }
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: updateCommentInList(c.replies, id, updater)
        };
      }
      return c;
    });
  };

  const handleToggleLikeComment = async (commentId: string) => {
    if (!currentUser) {
      showToast("Authentication required to like comments.", "warning");
      return;
    }

    let currentComment: any = null;
    const findComment = (list: any[]): boolean => {
      for (const c of list) {
        if (c.id === commentId) {
          currentComment = c;
          return true;
        }
        if (c.replies && c.replies.length > 0) {
          if (findComment(c.replies)) return true;
        }
      }
      return false;
    };
    findComment(commentsList);

    if (!currentComment) return;

    const isAlreadyLiked = currentComment.isLiked;

    // Optimistic UI Update
    setCommentsList(prev => updateCommentInList(prev, commentId, (c) => ({
      ...c,
      isLiked: !isAlreadyLiked,
      likes: isAlreadyLiked ? Math.max(0, c.likes - 1) : c.likes + 1
    })));

    try {
      const res = await toggleLikeComment({ comment: commentId });

      const serverLikeCount = res?.message?.like_count !== undefined 
        ? Number(res.message.like_count) 
        : (res?.data?.message?.like_count !== undefined 
            ? Number(res.data.message.like_count) 
            : null);

      const serverIsLiked = res?.message?.is_liked !== undefined
        ? Boolean(res.message.is_liked)
        : (res?.data?.message?.is_liked !== undefined
            ? Boolean(res.data.message.is_liked)
            : !isAlreadyLiked);

      if (serverLikeCount !== null) {
        setCommentsList(prev => updateCommentInList(prev, commentId, (c) => ({
          ...c,
          likes: serverLikeCount,
          isLiked: serverIsLiked
        })));
      }
    } catch (err: any) {
      console.error("Error toggling comment like:", err);
      showToast(err.message || "Failed to toggle comment like", "error");

      // Revert Optimistic UI Update on failure
      setCommentsList(prev => updateCommentInList(prev, commentId, (c) => ({
        ...c,
        isLiked: isAlreadyLiked,
        likes: isAlreadyLiked ? c.likes + 1 : Math.max(0, c.likes - 1)
      })));
    }
  };

  const renderWebCommentItem = (comment: any, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? "ml-6 mt-3" : ""}`}>
      <Avatar className={isReply ? "w-6 h-6" : "w-8 h-8"}>
        <AvatarFallback className="text-xs bg-zinc-800 text-zinc-300 font-medium">
          {comment.avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-200">{comment.author}</span>
          <span className="text-[10px] text-zinc-500">{comment.time}</span>
        </div>
        <p className="text-xs text-zinc-300 mt-0.5">{comment.content}</p>
        <div className="flex items-center gap-3.5 mt-1">
          <button
            onClick={() => handleToggleLikeComment(comment.id)}
            className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              comment.isLiked ? "text-orange-500" : "text-zinc-500 hover:text-orange-500"
            }`}
          >
            <Heart className={`w-3 h-3 ${comment.isLiked ? "fill-orange-500 text-orange-500" : ""}`} />
            <span>{comment.likes}</span>
          </button>
          <button
            onClick={() => setReplyingTo({ id: comment.id, name: comment.name || comment.id, author: comment.author })}
            className="text-[11px] font-semibold text-zinc-500 hover:text-orange-500 flex items-center gap-1 transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            Reply
          </button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 mt-2 pl-2 border-l border-zinc-800">
            {comment.replies.map((reply: any) => renderWebCommentItem(reply, true))}
          </div>
        )}
      </div>
    </div>
  );


  const fetchSaved = async () => {
    if (!currentUser) return;
    try {
      setLoadingSaved(true);
      const res = await getSavedShorts(currentUser);
      let rawSaved = [];
      if (res && Array.isArray(res.message)) {
        rawSaved = res.message;
      } else if (res && Array.isArray(res.data)) {
        rawSaved = res.data;
      }

      // Match the correct property "short" from the Frappe response
      const savedIds = rawSaved.map((item: any) => String(item.short));
      setSavedItems(savedIds);
    } catch (err) {
      console.error("Error loading saved shorts:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        setLoading(true);
        const res = await getShortsFeed(currentUser || undefined);

        let rawShorts = [];
        if (res && Array.isArray(res.message)) {
          rawShorts = res.message;
        } else if (res && Array.isArray(res.data)) {
          rawShorts = res.data;
        } else if (res && res.message && Array.isArray(res.message.data)) {
          rawShorts = res.message.data;
        }

        const savedIdsFromFeed: string[] = [];
        const likedIdsFromFeed: string[] = [];
        const mapped = rawShorts.map((item: any): ShortVideo => {
          const videoUrl = item.video ? (item.video.startsWith('http') ? item.video : `${BASE_DOMAIN}${item.video}`) : '';
          const thumbnail = item.thumbnail ? (item.thumbnail.startsWith('http') ? item.thumbnail : `${BASE_DOMAIN}${item.thumbnail}`) : undefined;
          
          const skill = item.skill || "Skill";
          const authorAvatar = skill.substring(0, 2).toUpperCase();

          if (item.is_saved) {
            savedIdsFromFeed.push(String(item.name));
          }
          if (item.is_liked) {
            likedIdsFromFeed.push(String(item.name));
          }

          let tagsArray: string[] = [];
          if (Array.isArray(item.tags)) {
            tagsArray = item.tags;
          } else if (typeof item.tags === "string" && item.tags.trim() !== "") {
            tagsArray = item.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
          }
          tagsArray = tagsArray.map((t: string) => t.startsWith('#') ? t : `#${t}`);

          return {
            id: item.name,
            title: item.title || "Untitled Short",
            category: skill,
            duration: item.duration_display || `${item.duration_seconds || 30} sec`,
            views: item.views_display || `${item.view_count || 0}`,
            likes: item.like_count !== undefined 
              ? String(item.like_count) 
              : (item.likes_count !== undefined 
                  ? String(item.likes_count) 
                  : (item.likes !== undefined ? String(item.likes) : "0")),
            commentCount: item.comment_count !== undefined ? Number(item.comment_count) : (item.comments_count !== undefined ? Number(item.comments_count) : 0),
            author: "StrideNex",
            authorHandle: "@stridenex",
            authorAvatar: authorAvatar,
            tags: tagsArray,
            description: item.description || "",
            isSaved: Boolean(item.is_saved),
            videoUrl: videoUrl,
            thumbnail: thumbnail,
            color: "orange"
          };
        });
        setShortsList(mapped);

        likedIdsFromFeedOnLoad.current = new Set(likedIdsFromFeed);
        const counts: Record<string, number> = {};
        const likesMap: Record<string, number> = {};
        rawShorts.forEach((item: any) => {
          const commentCountVal = item.comment_count !== undefined 
            ? item.comment_count 
            : (item.comments_count !== undefined 
                ? item.comments_count 
                : (item.comments !== undefined && Array.isArray(item.comments) ? item.comments.length : 0));
          counts[String(item.name)] = Number(commentCountVal);
          likesMap[String(item.name)] = item.like_count !== undefined 
            ? Number(item.like_count) 
            : (item.likes_count !== undefined 
                ? Number(item.likes_count) 
                : (item.likes !== undefined ? Number(item.likes) : 0));
        });
        setLocalCommentCounts(counts);
        setLikeCounts(likesMap);
        if (savedIdsFromFeed.length > 0) {
          setSavedItems(prev => {
            const combined = new Set([...prev, ...savedIdsFromFeed]);
            return Array.from(combined);
          });
        }
        if (likedIdsFromFeed.length > 0) {
          setLikedItems(prev => {
            const combined = new Set([...prev, ...likedIdsFromFeed]);
            return Array.from(combined);
          });
        }
      } catch (err) {
        console.error("Error fetching shorts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShorts();
    fetchSaved(); // Sync checks on mount
  }, [currentUser]);

  const toggleSave = async (id: any) => {
    if (!currentUser) {
      showToast("Authentication required to save shorts.", "warning");
      return;
    }

    const isAlreadySaved = savedItems.includes(String(id));

    try {
      // Opt-in UI update
      setSavedItems(prev =>
        prev.includes(String(id)) ? prev.filter(item => item !== String(id)) : [...prev, String(id)]
      );

      // Call API
      if (isAlreadySaved) {
        const res = await unsaveShort({
          user: currentUser,
          short_name: String(id)
        });
      } else {
        const res = await saveShort({
          user: currentUser,
          short_name: String(id)
        });
      }

      // Refresh list to keep in sync
      fetchSaved();
      
      if (!isAlreadySaved) {
        showToast("Short saved successfully!", "success");
      } else {
        showToast("Short unsaved.", "info");
      }
    } catch (err: any) {
      console.error("Error saving short via API:", err);
      showToast(err.message || "Failed to save short", "error");
      
      // Rollback UI update
      setSavedItems(prev =>
        isAlreadySaved ? [...prev, String(id)] : prev.filter(item => item !== String(id))
      );
    }
  };

  const toggleLike = async (id: any) => {
    if (!currentUser) {
      showToast("Authentication required to like shorts.", "warning");
      return;
    }

    const isAlreadyLiked = likedItems.includes(String(id));

    try {
      // Opt-in UI update
      setLikedItems(prev =>
        prev.includes(String(id)) ? prev.filter(item => item !== String(id)) : [...prev, String(id)]
      );

      // Call API
      const res = await toggleLikeShort({
        short: String(id)
      });

      const serverLikeCount = res?.message?.like_count !== undefined 
        ? Number(res.message.like_count) 
        : (res?.data?.message?.like_count !== undefined 
            ? Number(res.data.message.like_count) 
            : null);
      if (serverLikeCount !== null) {
        setLikeCounts(prev => ({
          ...prev,
          [String(id)]: serverLikeCount
        }));
      }

      if (!isAlreadyLiked) {
        showToast("Short liked!", "success");
      } else {
        showToast("Short unliked.", "info");
      }
    } catch (err: any) {
      console.error("Error liking short via API:", err);
      showToast(err.message || "Failed to toggle like", "error");

      // Rollback UI update
      setLikedItems(prev =>
        isAlreadyLiked ? [...prev, String(id)] : prev.filter(item => item !== String(id))
      );
    }
  };

  // Derive saved shorts list details on-the-fly to prevent sync issues
  const savedShortsList: SavedShort[] = shortsList
    .filter(short => savedItems.map(String).includes(String(short.id)))
    .map((short: ShortVideo): SavedShort => {
      const icon = short.category.toLowerCase().includes("python") ? "🐍" : short.category.toLowerCase().includes("pandas") ? "🐼" : "🗄️";
      return {
        id: short.id,
        title: short.title,
        category: short.category,
        savedDate: "Saved",
        icon: icon,
        color: "blue"
      };
    });

  // Calculate displayed list based on active sub tab
  const displayedShorts = activeSubTab === "saved"
    ? shortsList.filter(short => savedItems.map(String).includes(String(short.id)))
    : shortsList;

  // Set default active video on load/filter
  useEffect(() => {
    if (displayedShorts.length > 0 && !activeVideoId) {
      setActiveVideoId(displayedShorts[0].id);
    }
  }, [displayedShorts, activeVideoId]);

  useEffect(() => {
    setActivePlaying(true);
    setOpenMenuShortId(null);
    if (activeVideoId && lastFetchedWebShortIdRef.current !== String(activeVideoId)) {
      lastFetchedWebShortIdRef.current = String(activeVideoId);
      const activeShort = displayedShorts.find(s => String(s.id) === String(activeVideoId));
      if (activeShort) {
        setSelectedShort(activeShort);
      }
      fetchComments(String(activeVideoId));
    }
  }, [activeVideoId, displayedShorts]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenuShortId(null);
    };
    if (openMenuShortId !== null) {
      document.addEventListener("click", handleGlobalClick);
    }
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, [openMenuShortId]);

  // Set up intersection observer for vertical snapping scroll
  useEffect(() => {
    if (loading || (activeSubTab === "saved" && loadingSaved)) return;

    const observerOptions = {
      root: containerRef.current,
      rootMargin: "0px",
      threshold: 0.6,
    };

    let timeoutId: NodeJS.Timeout;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("data-short-id");
          if (id) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              setActiveVideoId(id);
            }, 100);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Give DOM a small moment to render
    const t = setTimeout(() => {
      displayedShorts.forEach((short) => {
        const el = document.getElementById(`short-card-${short.id}`);
        if (el) observer.observe(el);
      });
    }, 150);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
      clearTimeout(t);
    };
  }, [displayedShorts, loading, activeSubTab, loadingSaved]);

  const handleFullscreen = (id: any) => {
    const el = document.getElementById(`player-wrapper-${id}`);
    if (el) {
      if (!document.fullscreenElement) {
        el.requestFullscreen().catch((err) => {
          console.error("Error enabling fullscreen:", err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleShare = async (videoUrl: string) => {
    const shareUrl = videoUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StrideNex Short',
          url: shareUrl,
        });
        return;
      } catch (err) {}
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!", "success");
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast("Link copied to clipboard!", "success");
      }
    } catch (err) {
      showToast("Failed to copy link.", "error");
    }
  };

  const getLikesCount = (short: ShortVideo) => {
    if (likeCounts[String(short.id)] !== undefined) {
      return likeCounts[String(short.id)];
    }
    const originallyLiked = likedIdsFromFeedOnLoad.current.has(String(short.id));
    const isCurrentlyLiked = likedItems.includes(String(short.id));
    const baseLikes = parseInt(short.likes || "0") || 0;
    
    if (originallyLiked && !isCurrentlyLiked) {
      return Math.max(0, baseLikes - 1);
    } else if (!originallyLiked && isCurrentlyLiked) {
      return baseLikes + 1;
    }
    return baseLikes;
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-[#0f0f0f] text-white flex flex-col font-sans select-none">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>



      {/* Top Right Floating Toolbar Actions */}
      <div className="absolute top-4 right-6 flex items-center gap-3.5 z-30">
        <button
          onClick={() => setIsRecommendationsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-full text-xs font-bold text-zinc-200 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>Gaps & Recommendations</span>
        </button>
        <button
          onClick={() => {
            fetchPlaylists();
            setSelectedPlaylistForView(null);
            setIsSavedListOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-full text-xs font-bold text-zinc-200 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl backdrop-blur-md"
        >
          <Bookmark className="w-3.5 h-3.5 text-orange-400" />
          <span>Saved & Playlists</span>
        </button>
      </div>

      {/* Vertical Snapping Feed Container */}
      {loading || (activeSubTab === "saved" && loadingSaved) ? (
        <div className="flex-1 flex flex-col justify-center items-center h-full bg-[#0f0f0f]">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-xs mt-4 font-semibold tracking-wider uppercase">Loading Shorts...</p>
        </div>
      ) : displayedShorts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-[#0f0f0f]">
          <Sparkles className="w-12 h-12 text-zinc-700 mb-4 animate-pulse" />
          <p className="text-zinc-400 font-bold text-base">
            {activeSubTab === "all" ? "No study shorts available yet." : "No saved shorts yet."}
          </p>
          <p className="text-zinc-650 text-zinc-500 text-xs mt-1.5">Check back later or save shorts from the home feed</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="w-full flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth flex flex-col items-center hide-scrollbar select-none"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            height: '100%'
          }}
        >
          {displayedShorts.map((short) => {
            const isActive = String(activeVideoId) === String(short.id);
            const isLiked = likedItems.includes(String(short.id));
            const isSaved = savedItems.includes(String(short.id));

            return (
              <div
                key={short.id}
                id={`short-card-${short.id}`}
                data-short-id={short.id}
                className="w-full h-full flex-shrink-0 flex items-center justify-center snap-start relative py-4 lg:py-6"
                style={{ height: 'calc(100vh - 4rem)' }}
              >
                {/* Ambient Mode Backdrop Glow */}
                {ambientMode && (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-30 blur-[120px] pointer-events-none z-0">
                    <div 
                      className="w-[360px] aspect-[9/16] rounded-full transition-all duration-1000 bg-orange-500/80"
                      style={{
                        background: 'radial-gradient(circle, rgba(249,115,22,0.8) 0%, rgba(249,115,22,0) 70%)'
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-center w-full max-w-4xl h-full px-4 relative z-10">
                  {/* Relative container matching card size to align actions panel at the bottom right */}
                  <div className="relative aspect-[9/16] h-full max-h-[720px] flex items-end">
                    {/* Centered Video Player Card */}
                    <div 
                      id={`player-wrapper-${short.id}`}
                      className="w-full h-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex items-center justify-center group animate-fadeIn"
                    >
                    <VideoPlayer 
                      video={short} 
                      isActive={isActive} 
                      isMuted={isMuted} 
                      setIsMuted={setIsMuted}
                      playing={activePlaying}
                      setPlaying={setActivePlaying}
                    />

                    {/* Video Header Controls overlay */}
                    <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/70 to-transparent p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
                      {/* Top Left: Play/Pause and Volume controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePlaying(!activePlaying);
                          }}
                          className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all backdrop-blur-sm shadow-md"
                          title={activePlaying ? "Pause" : "Play"}
                        >
                          {activePlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted(!isMuted);
                          }}
                          className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all backdrop-blur-sm shadow-md"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Top Right: Three-dots and Floating Options Menu */}
                      <div className="flex items-center gap-2 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuShortId(openMenuShortId === short.id ? null : short.id);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-sm shadow-md ${
                            openMenuShortId === short.id 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-black/40 hover:bg-black/60 text-white'
                          }`}
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuShortId === short.id && (
                          <div 
                            className="absolute right-0 top-11 bg-white rounded-xl py-1.5 shadow-2xl z-40 text-slate-800 pointer-events-auto border border-slate-200/85 w-44 animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Options List */}
                            <div className="flex flex-col">
                              {/* Saved / Unsave item */}
                              <button
                                onClick={() => {
                                  toggleSave(short.id);
                                  setOpenMenuShortId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                              >
                                {isSaved ? (
                                  <BookmarkCheck className="w-4 h-4 text-orange-500" />
                                ) : (
                                  <Bookmark className="w-4 h-4 text-slate-500" />
                                )}
                                <span>Saved</span>
                              </button>

                              {/* Add to Playlist */}
                              <button
                                onClick={() => {
                                  setPlaylistShortId(short.id);
                                  setIsPlaylistModalOpen(true);
                                  setOpenMenuShortId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                              >
                                <Plus className="w-4 h-4 text-slate-500" />
                                <span>Add to Playlist</span>
                              </button>

                              {/* Not Interested */}
                              <button
                                onClick={() => {
                                  showToast("We will recommend fewer videos like this.", "success");
                                  setOpenMenuShortId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                              >
                                <Compass className="w-4 h-4 text-slate-500" />
                                <span>Not Interested</span>
                              </button>

                              <div className="h-[1px] bg-slate-100 my-1" />

                              {/* Report Video */}
                              <button
                                onClick={() => {
                                  showToast("Thank you. Video has been flagged for review.", "info");
                                  setOpenMenuShortId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors text-xs font-semibold text-red-500"
                              >
                                <X className="w-4 h-4 text-red-500" />
                                <span>Report Video</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom-left Details Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-20 flex flex-col justify-end text-white z-20 pointer-events-none">
                      {/* Author/Creator details */}
                      <div className="flex items-center gap-2.5 mb-3 pointer-events-auto">
                        <Avatar className="w-9 h-9 border border-white/20 shadow-md">
                          <AvatarFallback className="text-xs bg-orange-500 text-white font-bold">
                            {short.authorAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold tracking-wide text-zinc-100 drop-shadow-sm">{short.authorHandle}</span>
                      </div>
 
                      {/* Video Title and Description */}
                      <h3 className="font-semibold text-sm text-zinc-100 line-clamp-2 mb-2 leading-snug pointer-events-auto select-text drop-shadow">
                        {short.title}
                      </h3>
                      {short.description && (
                        <p className="text-xs text-zinc-300 line-clamp-2 mb-3.5 leading-relaxed pointer-events-auto select-text drop-shadow-sm">
                          {short.description}
                        </p>
                      )}
 
                      {/* Video Tags */}
                      {short.tags && short.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap pointer-events-auto">
                          {short.tags.map((tag) => (
                            <span key={tag} className="text-xs font-semibold text-orange-400 hover:text-orange-500 hover:underline cursor-pointer transition-all drop-shadow-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
 
                    {/* Right Side Vertical Action Panel (aligned to bottom right of video card) */}
                    <div className="absolute left-full ml-4 bottom-0 flex flex-col items-center gap-2.5 pb-4 z-10 shrink-0 select-none">
                      {/* Like Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => toggleLike(short.id)}
                          className="w-11 h-11 rounded-full bg-zinc-800/60 hover:bg-zinc-700/80 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                          <Heart className={`w-5 h-5 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
                        </button>
                        <span className="text-[11px] font-bold mt-1 text-zinc-300 tracking-wide drop-shadow-sm">{getLikesCount(short)}</span>
                      </div>

                      {/* Comments Button - Hidden for now
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleOpenComments(short)}
                          className="w-11 h-11 rounded-full bg-zinc-800/60 hover:bg-zinc-700/80 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                          <MessageSquare className="w-5 h-5 text-white" />
                        </button>
                        <span className="text-[11px] font-bold mt-1 text-zinc-300 tracking-wide drop-shadow-sm">
                          {localCommentCounts[String(short.id)] !== undefined ? localCommentCounts[String(short.id)] : short.commentCount}
                        </span>
                      </div>
                      */}

                      {/* Share Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleShare(short.videoUrl)}
                          className="w-11 h-11 rounded-full bg-zinc-800/60 hover:bg-zinc-700/80 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
                          </svg>
                        </button>
                        <span className="text-[11px] font-bold mt-1 text-zinc-300 tracking-wide drop-shadow-sm">Share</span>
                      </div>

                      {/* Save Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => toggleSave(short.id)}
                          className="w-11 h-11 rounded-full bg-zinc-800/60 hover:bg-zinc-700/80 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
                        </button>
                        <span className="text-[11px] font-bold mt-1 text-zinc-300 tracking-wide drop-shadow-sm">
                          {isSaved ? 'Saved' : 'Save'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Scroll Snap Navigation Controls */}
      {!loading && displayedShorts.length > 0 && (
        <div className="absolute right-8 bottom-8 flex flex-col gap-3.5 z-30">
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollBy({
                  top: -containerRef.current.clientHeight,
                  behavior: "smooth",
                });
              }
            }}
            className="w-12 h-12 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white flex items-center justify-center shadow-2xl border border-zinc-800 hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
            title="Previous Video"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollBy({
                  top: containerRef.current.clientHeight,
                  behavior: "smooth",
                });
              }
            }}
            className="w-12 h-12 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white flex items-center justify-center shadow-2xl border border-zinc-800 hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
            title="Next Video"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Recommendations Slide-out Drawer */}
      <AnimatePresence>
        {isRecommendationsOpen && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-800 text-white shadow-2xl flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                  <h2 className="text-base font-bold">Recommended for Your Gaps</h2>
                </div>
                <button 
                  onClick={() => setIsRecommendationsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800 mb-2">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Top Focus Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs px-2.5 py-1 rounded-md font-semibold">Machine Learning</span>
                    <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs px-2.5 py-1 rounded-md font-semibold">Feature Engineering</span>
                    <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs px-2.5 py-1 rounded-md font-semibold">Model Evaluation</span>
                  </div>
                </div>

                <div className="overflow-hidden border border-zinc-800 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Short</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Match</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-zinc-800/85">
                      {recommendedShorts.map((short) => (
                        <tr 
                          key={short.id} 
                          className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                          onClick={() => {
                            const found = shortsList.find(s => String(s.title).toLowerCase() === String(short.title).toLowerCase() || s.category === short.category);
                            if (found) {
                              const el = document.getElementById(`short-card-${found.id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                                setActiveVideoId(found.id);
                              }
                            }
                            setIsRecommendationsOpen(false);
                          }}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                                <Play className="w-3 h-3 fill-current" />
                              </div>
                              <span className="font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors line-clamp-1">
                                {short.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-md font-semibold">
                              {short.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-xs text-emerald-400 font-bold">{short.match}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Saved List Slide-out Drawer */}
      <AnimatePresence>
        {isSavedListOpen && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 text-white shadow-2xl flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-orange-500" />
                  <h2 className="text-base font-bold">
                    {selectedPlaylistForView ? `Playlist: ${selectedPlaylistForView.playlist_name}` : "Saved & Playlists"}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsSavedListOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedPlaylistForView ? (
                  // View Playlist shorts
                  <div className="space-y-4">
                    <button
                      onClick={() => setSelectedPlaylistForView(null)}
                      className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1 mb-4"
                    >
                      &larr; Back to Playlists
                    </button>
                    {(!selectedPlaylistForView.shorts || selectedPlaylistForView.shorts.length === 0) ? (
                      <div className="text-center py-12 text-zinc-500 text-sm">
                        No videos in this playlist yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPlaylistForView.shorts.map((shortItem: any, idx: number) => {
                          const icon = (shortItem.skill || "Skill").toLowerCase().includes("python") ? "🐍" : "🗄️";
                          return (
                            <div 
                              key={shortItem.name || shortItem.id || `short-${idx}`} 
                              className="flex items-center gap-3.5 p-3.5 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl group cursor-pointer transition-all"
                              onClick={() => playPlaylistShort(shortItem)}
                            >
                              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform border border-zinc-700/50">
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-200 group-hover:text-orange-400 transition-colors truncate">
                                  {shortItem.title || "Untitled Short"}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5">{shortItem.skill}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  // Main View with default saved list + user playlists
                  <div className="space-y-6">
                    {/* Playlists section */}
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">My Playlists</h3>
                      {playlistsLoading ? (
                        <div className="flex justify-center py-6">
                          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : playlists.length === 0 ? (
                        <div className="text-center py-4 bg-zinc-800/20 border border-zinc-800 rounded-xl text-zinc-500 text-xs font-medium">
                          No custom playlists created yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {playlists.map((pl, idx) => (
                            <div
                              key={pl.playlist_id || pl.name || `pl-${idx}`}
                              onClick={() => setSelectedPlaylistForView(pl)}
                              className="flex items-center justify-between p-3.5 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all cursor-pointer group"
                            >
                              <div>
                                <h4 className="text-sm font-bold text-zinc-200 group-hover:text-orange-400 transition-colors">
                                  {pl.playlist_name}
                                </h4>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {pl.total_shorts || (pl.shorts ? pl.shorts.length : 0)} shorts
                                </p>
                              </div>
                              <ChevronRightIcon className="w-4 h-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Standard saved shorts list */}
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Library Saved Shorts</h3>
                      {savedShortsList.length === 0 ? (
                        <div className="text-center py-6 bg-zinc-800/20 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                          No saved shorts in Library yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {savedShortsList.map((saved) => (
                            <div 
                              key={saved.id} 
                              className="flex items-center gap-3.5 p-3.5 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl group cursor-pointer transition-all"
                              onClick={() => {
                                const el = document.getElementById(`short-card-${saved.id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth' });
                                  setActiveVideoId(saved.id);
                                } else {
                                  setActiveSubTab("saved");
                                }
                                setIsSavedListOpen(false);
                              }}
                            >
                              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform border border-zinc-700/50">
                                {saved.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-200 group-hover:text-orange-400 transition-colors truncate">
                                  {saved.title}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5">{saved.category}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Redesigned Dark Comments Drawer */}
      <AnimatePresence>
        {isCommentsOpen && selectedShort && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 text-white shadow-2xl flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">Comments ({localCommentCounts[String(selectedShort.id)] !== undefined ? localCommentCounts[String(selectedShort.id)] : (selectedShort.commentCount ?? 0)})</h2>
                  <p className="text-xs text-zinc-400 line-clamp-1">{selectedShort.title}</p>
                </div>
                <button 
                  onClick={() => setIsCommentsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comment List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4.5">
                {commentsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : commentsList.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-sm">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  commentsList.map((comment) => renderWebCommentItem(comment))
                )}
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className="px-5 py-2.5 bg-zinc-800/80 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    Replying to <span className="font-bold text-zinc-200">@{replyingTo.author}</span>
                  </span>
                  <button onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Comment Input */}
              <div className="p-5 border-t border-zinc-800 bg-zinc-950 flex gap-2">
                <input
                  type="text"
                  placeholder={replyingTo ? `Reply to @${replyingTo.author}...` : "Add a comment..."}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                  className="flex-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={!newCommentText.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Description Modal Overlay */}
      <AnimatePresence>
        {showDescriptionShort && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full text-zinc-100 shadow-2xl relative"
            >
              <button
                onClick={() => setShowDescriptionShort(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-800/80 hover:bg-zinc-800 transition-all pointer-events-auto"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-zinc-100 mb-2 mt-1 select-text">
                {showDescriptionShort.title}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-orange-500 text-white font-bold">
                    {showDescriptionShort.authorAvatar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-zinc-300 select-text">{showDescriptionShort.authorHandle}</span>
                <span className="text-zinc-600 text-xs select-none">•</span>
                <span className="text-zinc-500 text-xs font-medium select-text">{showDescriptionShort.views} views</span>
              </div>
              <div className="max-h-60 overflow-y-auto pr-2 text-sm text-zinc-300 leading-relaxed hide-scrollbar select-text whitespace-pre-line">
                {showDescriptionShort.description || "No description available."}
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Playlist Modal Overlay */}
      <AnimatePresence>
        {isPlaylistModalOpen && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full text-zinc-100 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsPlaylistModalOpen(false);
                  setPlaylistShortId(null);
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-800/80 hover:bg-zinc-800 transition-all pointer-events-auto"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-zinc-100 mb-4 mt-1 select-none">
                Add to Playlist
              </h3>
              
              {/* Playlists List */}
              <div className="max-h-60 overflow-y-auto pr-2 mb-4 space-y-2 hide-scrollbar">
                {playlistsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs font-medium">
                    No playlists found. Create one below!
                  </div>
                ) : (
                  playlists.map((playlist, index) => (
                    <button
                      key={playlist.playlist_id || playlist.name || `playlist-${index}`}
                      onClick={() => handleSaveToPlaylist(playlist.playlist_id || playlist.name)}
                      className="w-full flex items-center justify-between p-3 bg-zinc-850/40 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-left text-xs font-semibold text-zinc-200"
                    >
                      <span>{playlist.playlist_name}</span>
                      <Plus className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  ))
                )}
              </div>

              {/* Create Playlist Input */}
              <div className="border-t border-zinc-800 pt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPlaylistName.trim()) {
                      handleCreatePlaylist();
                    }
                  }}
                  className="flex-1 text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold px-4"
                >
                  {isCreatingPlaylist ? "Creating..." : "Create"}
                </Button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}