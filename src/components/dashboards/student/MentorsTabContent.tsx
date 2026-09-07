// components/dashboards/student/MentorsTabContent.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Star,
  Calendar,
  Clock,
  Briefcase,
  MapPin,
  Award,
  BookOpen,
  Code,
  Database,
  TrendingUp,
  MessageSquare,
  Target,
  Search,
  Filter,
  ChevronRight,
  X,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserSquare2
} from "lucide-react";
import { StatsCard } from "@/components/dashboards/shared/StatsCard";
import { BaseCard } from "@/components/dashboards/shared/BaseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/Pagination";
import { getMentorList, getMentorSlotCalendar, bookMentorSlot, getMentorNextAvailableSlot, getBookedSessions, getMentorOfferings, initiateSessionBooking, verifySessionPayment, getNewGroupWorkshopOfferings, getSessionNote } from "@/services/student.services";
import { submitSessionReview, getSessionReviewStatus } from "@/services/api.services";

// Types
interface Mentor {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  company: string;
  expertise: string[];
  rating: number;
  sessions: number;
  hourlyRate: string;
  availability: string;
  nextSlot?: string;
  tags: string[];
  avatarColor: string;
  profileImage: string;
  nextAvailableSlot?: string;
  offering_type?: string;
  batch_name?: string;
}

interface BookedSession {
  name: string;
  mentor: string;
  offering_type: string;
  session_date: string;
  session_type: string;
  status: string;
  priority: string;
  topic: string;
  from_time: string;
  to_time: string;
  duration: string;
  offering?: string;
  // review tracking (resolved client-side)
  already_reviewed?: boolean;
}

interface MentorOffering {
  name: string;
  mentor: string;
  mentor_full_name: string;
  title: string;
  offering_type: string;
  category: string;
  status: string;
  price_per_session: number;
  max_group_size: number;
  duration_minutes: number;
  average_rating: number;
  total_bookings: number;
  remaining_seats: number;
  lms_batch: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  description: string;
  meeting_link?: string;
  seat_status?: string;
}

const COLORS = [
  "bg-purple-600", "bg-blue-600", "bg-emerald-600",
  "bg-orange-600", "bg-pink-600", "bg-indigo-600"
];

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

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: new (options: Record<string, any>) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

// Loads the Razorpay checkout.js SDK dynamically (idempotent).
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function MentorsTabContent() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Review Modal State
  const [reviewSession, setReviewSession] = useState<BookedSession | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // View Note Modal State
  const [viewingNoteSession, setViewingNoteSession] = useState<BookedSession | null>(null);
  const [sessionNoteText, setSessionNoteText] = useState<string | null>(null);
  const [isLoadingNote, setIsLoadingNote] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const PAGE_SIZE = 20;

  // Search states
  const [searchVal, setSearchVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Offerings states
  const [offerings, setOfferings] = useState<MentorOffering[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [offeringTypeFilter, setOfferingTypeFilter] = useState<string>("Group Session");
  const [offeringSearchVal, setOfferingSearchVal] = useState("");
  const [offeringSearchQuery, setOfferingSearchQuery] = useState("");
  const offeringDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOfferingSearchChange = (val: string) => {
    setOfferingSearchVal(val);
    if (offeringDebounceTimeoutRef.current) {
      clearTimeout(offeringDebounceTimeoutRef.current);
    }
    offeringDebounceTimeoutRef.current = setTimeout(() => {
      setOfferingSearchQuery(val);
    }, 1000);
  };

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val);
      setCurrentPage(1);
    }, 1000);
  };

  const handleSearchSubmit = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setSearchQuery(searchVal);
    setCurrentPage(1);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (offeringDebounceTimeoutRef.current) {
        clearTimeout(offeringDebounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && searchVal && document.activeElement !== searchInputRef.current) {
      searchInputRef.current?.focus();
    }
  }, [loading, searchVal]);

  // Booking Modal States
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<Mentor | null>(null);
  const [mentorOfferings, setMentorOfferings] = useState<any[]>([]);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [selectedOfferingForBooking, setSelectedOfferingForBooking] = useState<any | null>(null);
  const [slotCalendarData, setSlotCalendarData] = useState<{ [date: string]: any[] }>({});
  const [groupSessionData, setGroupSessionData] = useState<any | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<any | null>(null);
  const [bookingTopic, setBookingTopic] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const handleBookSession = async (mentor: Mentor) => {
    setSelectedMentorForBooking(mentor);
    setSelectedOfferingForBooking(null);
    setSelectedSlotForBooking(null);
    setSelectedDate(null);
    setBookingTopic("");
    setSlotCalendarData({});
    setIsLoadingOfferings(true);
    try {
      const response = await getMentorOfferings(mentor.email);
      const data = response?.message?.data || response?.message || response?.data || [];
      setMentorOfferings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading mentor offerings:", err);
      setMentorOfferings([]);
    } finally {
      setIsLoadingOfferings(false);
    }
  };

  const handleSelectOffering = async (offering: any, mentorOverride?: Mentor) => {
    setSelectedOfferingForBooking(offering);
    const mentor = mentorOverride || selectedMentorForBooking;
    if (!mentor) return;
    setIsLoadingSlots(true);
    setSelectedSlotForBooking(null);
    setSelectedDate(null);
    setBookingTopic("");
    setSlotCalendarData({});
    setGroupSessionData(null);
    try {
      const response = await getMentorSlotCalendar(
        mentor.email,
        offering.name
      );
      const msg = response?.message;
      if (!msg) {
        setSlotCalendarData({});
        setSelectedDate(null);
        return;
      }
      // Detect Group Session response (has offering_type field at top level)
      if (msg.offering_type === "Group Session") {
        setGroupSessionData(msg);
        setSlotCalendarData({});
      } else {
        // 1:1 Mentorship — message is { "YYYY-MM-DD": [...slots] }
        setGroupSessionData(null);
        setSlotCalendarData(msg);
        const dates = Object.keys(msg).sort();
        setSelectedDate(dates.length > 0 ? dates[0] : null);
      }
    } catch (err) {
      console.error("Error loading slot calendar:", err);
      setSlotCalendarData({});
      setGroupSessionData(null);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedMentorForBooking || !selectedOfferingForBooking) return;
    if (!selectedDate || !selectedSlotForBooking) return;

    setIsBooking(true);

    try {
      const studentEmail = localStorage.getItem("currentUser") || "";

      const sessionPayload = {
        mentor: selectedMentorForBooking.email,
        student: studentEmail,
        offering: selectedOfferingForBooking.name,
        session_date: selectedDate,
        from_time: selectedSlotForBooking.from_time,
        to_time: selectedSlotForBooking.to_time,
        topic: bookingTopic || selectedOfferingForBooking.title || "General Mentorship",
        amount: selectedOfferingForBooking.price_per_session ?? 0,
      };

      // Phase 1: Create booking / Razorpay order on the backend
      const initResponse = await initiateSessionBooking(sessionPayload);
      const initData = initResponse?.message ?? initResponse;

      // Free-session fast path
      if (initData?.payment_required === false) {
        setSelectedMentorForBooking(null);
        setSelectedOfferingForBooking(null);
        setMentorOfferings([]);
        setSelectedDate(null);
        setSelectedSlotForBooking(null);
        setBookingTopic("");
        setSlotCalendarData({});
        alert(`Session booked successfully! ID: ${initData?.booking_id ?? ""}`);
        fetchMentors();
        fetchBookedSessions();
        return;
      }

      // Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert("Failed to load payment gateway. Please check your internet connection and try again.");
        setIsBooking(false);
        return;
      }

      const { order_id, api_key, booking_id } = initData as {
        order_id: string;
        api_key: string;
        booking_id: string;
      };

      if (!api_key || !order_id || !booking_id) {
        throw new Error(
          `Backend did not return the required payment fields. ` +
          `Received → api_key: "${api_key}", order_id: "${order_id}", booking_id: "${booking_id}". ` +
          `Check the server logs for the 500 error details.`
        );
      }

      // Phase 2: Open Razorpay checkout
      const options: Record<string, any> = {
        key: api_key,
        order_id: order_id,
        name: "StrideNex Mentorship",
        description: sessionPayload.topic,
        prefill: {
          email: studentEmail,
        },
        theme: { color: "#f97316" },

        // Payment success
        handler: async (razorpayResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifySessionPayment({
              booking_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            // Reset UI and refresh lists
            setSelectedMentorForBooking(null);
            setSelectedOfferingForBooking(null);
            setMentorOfferings([]);
            setSelectedDate(null);
            setSelectedSlotForBooking(null);
            setBookingTopic("");
            setSlotCalendarData({});
            alert("Payment successful! Your session has been confirmed.");
            fetchMentors();
            fetchBookedSessions();
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            alert("Payment received but verification failed. Please contact support.");
          } finally {
            setIsBooking(false);
          }
        },

        // Payment failure
        modal: {
          ondismiss: () => {
            // User closed the popup without paying
            setIsBooking(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure events
      rzp.on("payment.failed", (failResponse: any) => {
        console.error("Razorpay payment failed:", failResponse);
        alert(
          `Payment failed: ${failResponse?.error?.description ?? "Unknown error"}. Please try again.`
        );
        setIsBooking(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Error during booking flow:", err);
      alert(err instanceof Error ? err.message : "Failed to initiate booking. Please try again.");
      setIsBooking(false);
    }
  };

  const handleConfirmGroupBooking = async () => {
    if (!selectedMentorForBooking || !selectedOfferingForBooking || !groupSessionData) return;
    setIsBooking(true);
    try {
      const studentEmail = localStorage.getItem("currentUser") || "";
      const sessionPayload = {
        mentor: selectedMentorForBooking.email,
        student: studentEmail,
        offering: selectedOfferingForBooking.name,
        session_date: groupSessionData.start_date,
        from_time: groupSessionData.start_time,
        to_time: groupSessionData.end_time,
        topic: bookingTopic || groupSessionData.title || "Group Session",
        amount: groupSessionData.price_per_session ?? 0,
      };

      const initResponse = await initiateSessionBooking(sessionPayload);
      const initData = initResponse?.message ?? initResponse;

      if (initData?.payment_required === false) {
        setSelectedMentorForBooking(null);
        setSelectedOfferingForBooking(null);
        setMentorOfferings([]);
        setGroupSessionData(null);
        setBookingTopic("");
        setSlotCalendarData({});
        alert(`Group session joined! ID: ${initData?.booking_id ?? ""}`);
        fetchMentors();
        fetchBookedSessions();
        return;
      }

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert("Failed to load payment gateway. Check your internet connection.");
        setIsBooking(false);
        return;
      }

      const { order_id, api_key, booking_id } = initData as {
        order_id: string; api_key: string; booking_id: string;
      };

      if (!api_key || !order_id || !booking_id) {
        throw new Error("Backend did not return required payment fields.");
      }

      const options: Record<string, any> = {
        key: api_key,
        order_id,
        name: "StrideNex Mentorship",
        description: groupSessionData.title,
        prefill: { email: studentEmail },
        theme: { color: "#6366f1" },
        handler: async (razorpayResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifySessionPayment({
              booking_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });
            setSelectedMentorForBooking(null);
            setSelectedOfferingForBooking(null);
            setMentorOfferings([]);
            setGroupSessionData(null);
            setBookingTopic("");
            setSlotCalendarData({});
            alert("Payment successful! You have joined the group session.");
            fetchMentors();
            fetchBookedSessions();
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            alert("Payment received but verification failed. Please contact support.");
          } finally {
            setIsBooking(false);
          }
        },
        modal: { ondismiss: () => setIsBooking(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (failResponse: any) => {
        alert(`Payment failed: ${failResponse?.error?.description ?? "Unknown error"}`);
        setIsBooking(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Error during group booking:", err);
      alert(err instanceof Error ? err.message : "Failed to initiate booking.");
      setIsBooking(false);
    }
  };



  useEffect(() => {
    fetchMentors(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchBookedSessions();
  }, []);

  useEffect(() => {
    fetchOfferings();
  }, [offeringTypeFilter, offeringSearchQuery]);

  const fetchOfferings = async () => {
    try {
      setLoadingOfferings(true);
      const response = await getNewGroupWorkshopOfferings({
        offering_type: offeringTypeFilter,
        search: offeringSearchQuery,
      });
      const dataObj = response?.message?.data || [];
      setOfferings(Array.isArray(dataObj) ? dataObj : []);
    } catch (err) {
      console.error("Error loading offerings:", err);
      setOfferings([]);
    } finally {
      setLoadingOfferings(false);
    }
  };

  const fetchBookedSessions = async () => {
    try {
      setLoadingSessions(true);
      const studentEmail = localStorage.getItem("currentUser") || "";
      const response = await getBookedSessions(studentEmail);

      if (response && response.message && Array.isArray(response.message)) {
        const sessions: BookedSession[] = response.message;
        // Resolve review status for each completed session in parallel
        const reviewChecks = await Promise.allSettled(
          sessions
            .filter(s => s.status === "Completed")
            .map(async s => {
              try {
                const r = await getSessionReviewStatus({ booking_name: s.name });
                return { name: s.name, already_reviewed: r?.message?.already_reviewed ?? false };
              } catch {
                return { name: s.name, already_reviewed: false };
              }
            })
        );
        const reviewMap: Record<string, boolean> = {};
        reviewChecks.forEach(result => {
          if (result.status === "fulfilled") {
            reviewMap[result.value.name] = result.value.already_reviewed;
          }
        });
        setBookedSessions(sessions.map(s => ({
          ...s,
          already_reviewed: reviewMap[s.name] ?? false,
        })));
      } else {
        setBookedSessions([]);
      }
    } catch (err) {
      console.error("Error loading booked sessions:", err);
      setBookedSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleOpenReview = (session: BookedSession) => {
    setReviewSession(session);
    setReviewRating(0);
    setReviewHover(0);
    setReviewText("");
    setReviewError(null);
    setReviewSuccess(false);
  };

  const handleOpenNote = async (session: BookedSession) => {
    setViewingNoteSession(session);
    setIsLoadingNote(true);
    setNoteError(null);
    setSessionNoteText(null);
    try {
      const studentEmail = localStorage.getItem("currentUser") || "";
      const res = await getSessionNote(session.name, studentEmail);
      if (res?.message && res.message.status === "success") {
        setSessionNoteText(res.message.data?.shared_with_student || "");
      } else {
        setNoteError(res?.message?.message || "Failed to load session note.");
      }
    } catch (err: any) {
      setNoteError(err?.message || "Failed to load session note.");
    } finally {
      setIsLoadingNote(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewSession) return;
    if (reviewRating < 1) {
      setReviewError("Please select a star rating.");
      return;
    }
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      await submitSessionReview({
        booking_name: reviewSession.name,
        rating: reviewRating,
        review: reviewText.trim() || "Great session!",
      });
      setReviewSuccess(true);
      // Mark reviewed locally
      setBookedSessions(prev =>
        prev.map(s => s.name === reviewSession.name ? { ...s, already_reviewed: true } : s)
      );
      setTimeout(() => setReviewSession(null), 1500);
    } catch (err: any) {
      setReviewError(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Helper function to check if a session is already booked
  const isSessionAlreadyBooked = (mentor: Mentor) => {
    return bookedSessions.some(session =>
      session.mentor === mentor.email &&
      session.offering_type === mentor.offering_type &&
      (session.status === 'Scheduled' || session.status === 'Accepted')
    );
  };

  const isOfferingExpired = (offering: any) => {
    if (!offering.start_date && !offering.end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (offering.end_date) {
      const endDate = new Date(offering.end_date);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < today) return true;
    } else if (offering.start_date) {
      const startDate = new Date(offering.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (startDate < today) return true;
    }
    return false;
  };

  const fetchMentors = async (page: number = currentPage, search: string = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMentorList(page, PAGE_SIZE, search);

      const dataObj = response?.data || {};
      const mentorList = dataObj.Mentor || [];
      const paginationData = dataObj.pagination || {
        total: mentorList.length,
        page: page,
        page_size: PAGE_SIZE,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      };

      if (Array.isArray(mentorList)) {
        const mappedMentors = mentorList.map((m: any, index: number) => {
          const name = `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.name || "Unknown Mentor";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "M";

          const expertise = m.domain
            ? [m.domain, m.other_domain].filter(Boolean)
            : (m.type && m.type !== "RAW" ? [m.type] : []);

          return {
            id: m.name || `mentor-${index}`,
            name: name,
            email: m.email_id || m.name || "unknown@example.com",
            initials,
            role: m.role || m.type || "Mentor",
            company: m.company || "Independent",
            expertise: expertise,
            rating: m.avg_rating || 0,
            sessions: m.total_sessions || 0,
            hourlyRate: "",
            availability: "Contact for availability",
            tags: expertise,
            avatarColor: COLORS[index % COLORS.length],
            profileImage: m.profile_image || "",
            offering_type: "1:1 Mentorship",
            batch_name: ""
          };
        });
        setMentors(mappedMentors);
        setPagination(paginationData);
      } else {
        setMentors([]);
      }
    } catch (err) {
      console.error("Error loading mentors:", err);
      setError("Failed to load mentor listings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch next available slots in background
  useEffect(() => {
    if (mentors.length > 0 && mentors.some(m => !m.nextAvailableSlot)) {
      const fetchSlots = async () => {
        const updateMentorSlot = async (mentorEmail: string) => {
          try {
            const response = await getMentorNextAvailableSlot(mentorEmail);
            if (response && response.message) {
              setMentors(currentMentors =>
                currentMentors.map(m =>
                  m.email === mentorEmail
                    ? { ...m, nextAvailableSlot: response.message }
                    : m
                )
              );
            }
          } catch (err) {
            console.error(`Error fetching slot for ${mentorEmail}:`, err);
          }
        };

        // Fetch concurrently for all mentors
        await Promise.all(mentors.map(m => updateMentorSlot(m.email)));
      };

      fetchSlots();
    }
  }, [mentors.length]);



  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Offerings */}
        <div className="lg:col-span-8 space-y-6">
          {/* Offerings Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setOfferingTypeFilter("Group Session")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${offeringTypeFilter === "Group Session" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Group Sessions
              </button>
              <button
                onClick={() => setOfferingTypeFilter("Workshop")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${offeringTypeFilter === "Workshop" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Workshops
              </button>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={`Search ${offeringTypeFilter.toLowerCase()}s...`}
                className="pl-9 pr-4 py-2 w-full bg-white border-slate-200 text-sm"
                value={offeringSearchVal}
                onChange={(e) => handleOfferingSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Offerings Grid (3 in a row) */}
          {loadingOfferings ? (
            <div className="flex justify-center items-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="animate-pulse flex items-center gap-2">
                <Loader2 className="animate-spin w-5 h-5 text-orange-500" />
                <span>Loading {offeringTypeFilter.toLowerCase()}s...</span>
              </div>
            </div>
          ) : (() => {
            const activeOfferings = offerings.filter(o => !isOfferingExpired(o));
            if (activeOfferings.length === 0) {
              return (
                <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                  No {offeringTypeFilter.toLowerCase()}s found.
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {activeOfferings.map((offering) => {
                  const isBooked = bookedSessions.some(session => session.offering === offering.name);
                  const isFull = offering.remaining_seats <= 0 || offering.seat_status === 'full';
                  return (
                    <BaseCard key={offering.name} className="overflow-hidden hover:shadow-lg transition-all flex flex-col h-full border-slate-200 group">
                      <div className="p-4 flex flex-col h-full gap-3">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2" title={offering.title}>
                            {offering.title}
                          </h3>
                          <div className="flex gap-1 shrink-0">
                            {isBooked && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 px-2 py-0.5">
                                Booked
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 px-2 py-0.5">
                              {offering.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Avatar className="w-6 h-6 shrink-0 ring-1 ring-slate-100 shadow-sm">
                            <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                              {offering.mentor_full_name ? offering.mentor_full_name.charAt(0).toUpperCase() : "M"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{offering.mentor_full_name}</span>
                        </div>

                        {offering.description && (
                          <p className="text-xs text-slate-500 line-clamp-2" title={offering.description}>
                            {offering.description}
                          </p>
                        )}

                        <div className="space-y-1.5 text-xs text-slate-500 mt-auto pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-orange-500" />
                            <span>{offering.start_date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                            <span>{offering.start_time.substring(0, 5)} ({offering.duration_minutes}m)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-orange-500" />
                            <span>{offering.remaining_seats} seats left</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center mt-auto">
                        <div className="font-semibold text-slate-900 text-sm">
                          {offering.price_per_session > 0 ? `₹${offering.price_per_session}` : ""}
                        </div>
                        {isBooked ? (
                          <Button
                            size="sm"
                            disabled
                            className="bg-slate-100 text-slate-500 border border-slate-200 shadow-sm h-8 px-3 text-xs cursor-not-allowed"
                          >
                            Booked
                          </Button>
                        ) : isFull ? (
                          <Button
                            size="sm"
                            disabled
                            className="bg-red-50 text-red-500 border border-red-200 shadow-sm h-8 px-3 text-xs cursor-not-allowed"
                          >
                            Full
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm h-8 px-3 text-xs"
                            onClick={() => {
                              const mentorObj = mentors.find(m => m.email === offering.mentor) || {
                                id: offering.mentor,
                                name: offering.mentor_full_name,
                                email: offering.mentor,
                                initials: offering.mentor_full_name ? offering.mentor_full_name.charAt(0).toUpperCase() : "M",
                                role: "Mentor",
                                company: "",
                                expertise: [],
                                rating: 5,
                                sessions: 0,
                                hourlyRate: "",
                                availability: "",
                                tags: [],
                                avatarColor: "bg-purple-600",
                                profileImage: "",
                              };
                              setSelectedMentorForBooking(mentorObj);
                              handleSelectOffering(offering, mentorObj);
                            }}
                          >
                            Book Now
                          </Button>
                        )}
                      </div>
                    </BaseCard>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Booked Sessions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-lg font-semibold text-slate-800">Booked Sessions</h2>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {bookedSessions.length}
            </Badge>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {loadingSessions ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : bookedSessions.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500">
                <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="font-medium text-slate-700">No sessions booked yet</p>
                <p className="text-sm mt-1">Book a mentor to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {bookedSessions.map((session, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] font-medium border-0 px-2 py-0.5 rounded-sm ${session.priority === 'High' ? 'bg-red-50 text-red-700' :
                          session.priority === 'Medium' ? 'bg-orange-50 text-orange-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                          {session.priority}
                        </Badge>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm ${session.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' :
                          session.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                          {session.status}
                        </span>
                      </div>
                      {session.offering_type && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                          {session.offering_type}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 text-sm mb-1">{session.topic}</h4>
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                        <UserSquare2 className="w-3.5 h-3.5" />
                        {session.mentor}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-600 bg-white rounded-lg border border-slate-100 p-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          <span>{session.session_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          <span>{session.from_time?.substring(0, 5)} - {session.to_time?.substring(0, 5)}</span>
                        </div>
                      </div>

                      {/* Actions for sessions */}
                      <div className="flex items-center gap-2 mt-2">
                        {session.status === 'Completed' && (
                          session.already_reviewed ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              Reviewed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenReview(session)}
                              className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md px-2.5 py-1 transition-colors"
                            >
                              <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                              Rate Session
                            </button>
                          )
                        )}

                        <button
                          onClick={() => handleOpenNote(session)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-2.5 py-1 transition-colors"
                        >
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          View Note
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="my-8 border-b border-slate-200"></div>

      {/* Mentors Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mentors List</h1>
          <p className="text-slate-500 mt-1">Connect with industry experts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              ref={searchInputRef}
              placeholder="search for email"
              className="pl-9 pr-4 py-2 w-full md:w-64 bg-white border-slate-200 text-sm"
              value={searchVal}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-200 shrink-0">
            <Filter className="w-4 h-4 text-slate-600" />
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="animate-pulse flex items-center gap-2">
            <Loader2 className="animate-spin w-5 h-5 text-orange-500" />
            <span>Loading mentors...</span>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 bg-white rounded-xl border border-slate-200 border-dashed">
          {error}
        </div>
      ) : mentors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed"
        >
          {searchQuery ? "No mentors found matching your search." : "No mentors available at the moment."}
        </motion.div>
      ) : (
        <>
          {/* Mentors Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {mentors.map((mentor) => (
              <BaseCard key={mentor.id} className="overflow-hidden hover:shadow-lg transition-all group">
                <div className="p-5 flex flex-col h-full">
                  <div className="flex-1">
                    {/* Header with Avatar and Company */}
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <Avatar className="w-11 h-11 shrink-0">
                          {mentor.profileImage ? (
                            <AvatarImage src={mentor.profileImage} alt={mentor.name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className={`${mentor.avatarColor} text-white font-medium`}>
                            {mentor.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 break-all text-sm leading-tight mt-0.5" title={mentor.name}>
                            {mentor.name}
                          </h3>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1" title={`${mentor.role} • ${mentor.company}`}>
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span className="truncate">{mentor.role} • {mentor.company}</span>
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${isSessionAlreadyBooked(mentor)
                          ? 'bg-slate-50 text-slate-600 border-slate-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          } text-[10px] px-1.5 py-0 shrink-0 h-fit mt-0.5`}
                      >
                        {isSessionAlreadyBooked(mentor) ? 'Booked' : 'Available'}
                      </Badge>
                    </div>

                    {/* Expertise Tags */}
                    {mentor.expertise && mentor.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mentor.expertise.map((exp, i) => (
                          <Badge key={i} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mb-4 mt-auto">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold text-slate-800">{mentor.rating.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({mentor.sessions})</span>
                      </div>
                    </div>

                    {/* Next Available */}
                    <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600">Next available: </span>
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {mentor.nextAvailableSlot || mentor.availability}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-auto">
                    <Button
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                      onClick={() => handleBookSession(mentor)}
                    >
                      Book Session
                    </Button>
                    {/* <Button variant="outline" size="icon" className="border-slate-200 shrink-0">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </Button> */}
                  </div>
                </div>
              </BaseCard>
            ))}
          </motion.div>
          {pagination.total_pages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.total_pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}



      {/* ── Review Modal ── */}
      {reviewSession && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* StrideNex Logo brought to front */}
          <div className="absolute top-4 left-6 z-[60] pointer-events-none">
            <img
              src="/images/Logo.png"
              alt="StrideNex Logo"
              className="w-48 h-12 object-contain drop-shadow-sm"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100">
              <button
                onClick={() => setReviewSession(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rate this Session</h2>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]" title={reviewSession.topic}>
                    {reviewSession.topic}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {reviewSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Review Submitted!</h3>
                  <p className="text-sm text-slate-500 mt-1">Thank you for your feedback.</p>
                </motion.div>
              ) : (
                <>
                  {/* Star Rating */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-3">Your Rating <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHover(star)}
                          onMouseLeave={() => setReviewHover(0)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${star <= (reviewHover || reviewRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-100 text-slate-300'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                    {reviewRating > 0 && (
                      <p className="text-center text-xs text-slate-500 mt-1.5">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                      </p>
                    )}
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Your Review <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with the mentor..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition resize-none"
                    />
                  </div>

                  {reviewError && (
                    <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {reviewError}
                    </div>
                  )}

                  {/* Session Info */}
                  <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                    <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>{reviewSession.session_date}</span>
                    <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0 ml-2" />
                    <span>{reviewSession.from_time?.substring(0, 5)} – {reviewSession.to_time?.substring(0, 5)}</span>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview || reviewRating < 1}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingReview ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><Star className="w-4 h-4 fill-white" /> Submit Review</>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ── View Note Modal ── */}
      {viewingNoteSession && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* StrideNex Logo brought to front */}
          <div className="absolute top-4 left-6 z-[60] pointer-events-none">
            <img
              src="/images/Logo.png"
              alt="StrideNex Logo"
              className="w-48 h-12 object-contain drop-shadow-sm"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100">
              <button
                onClick={() => setViewingNoteSession(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Mentor's Shared Note</h2>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]" title={viewingNoteSession.topic}>
                    {viewingNoteSession.topic}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {isLoadingNote ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Fetching shared notes...</p>
                </div>
              ) : noteError ? (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">{noteError}</p>
                </div>
              ) : sessionNoteText ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-[250px] overflow-y-auto">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {sessionNoteText}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between items-center px-1">
                    <span>Shared by {viewingNoteSession.mentor}</span>
                    <span>{viewingNoteSession.session_date}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-600 font-semibold">No notes shared yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                    The mentor has not shared any preparation or follow-up notes for this session.
                  </p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setViewingNoteSession(null)}
                className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}


      {/* Booking Modal */}
      {selectedMentorForBooking && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          {/* StrideNex Logo brought to front */}
          <div className="absolute top-4 left-6 z-[60] pointer-events-none">
            <img
              src="/images/Logo.png"
              alt="StrideNex Logo"
              className="w-48 h-12 object-contain drop-shadow-sm"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Book Session</h2>
                <p className="text-sm text-slate-500 mt-1">with {selectedMentorForBooking.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedMentorForBooking(null);
                  setSelectedOfferingForBooking(null);
                  setMentorOfferings([]);
                  setSelectedDate(null);
                  setSelectedSlotForBooking(null);
                  setBookingTopic("");
                  setSlotCalendarData({});
                  setGroupSessionData(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {!selectedOfferingForBooking ? (
                // Step 1: Offerings Selection Screen
                isLoadingOfferings ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="animate-spin w-8 h-8 mb-4 text-orange-500" />
                    <span>Loading mentor offerings...</span>
                  </div>
                ) : (() => {
                  const activeMentorOfferings = mentorOfferings.filter(o => !isOfferingExpired(o));
                  if (activeMentorOfferings.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                        No offerings available for this mentor.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-800 mb-2">Select an Offering</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {activeMentorOfferings.map((offering) => {
                          const isBooked = offering.offering_type !== "1:1 Mentorship" &&
                            bookedSessions.some(session => session.offering === offering.name);

                          return (
                            <div
                              key={offering.name}
                              onClick={() => {
                                if (!isBooked) {
                                  handleSelectOffering(offering);
                                }
                              }}
                              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isBooked
                                ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                                : "bg-white border-slate-200 hover:border-orange-500 hover:shadow-md cursor-pointer"
                                }`}
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-slate-800 text-sm">{offering.title}</h4>
                                  <Badge className="bg-orange-50 text-orange-600 border-orange-200 text-[10px] px-2 py-0">
                                    {offering.offering_type}
                                  </Badge>
                                  <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-2 py-0">
                                    {offering.category}
                                  </Badge>
                                  {isBooked && (
                                    <Badge className="bg-slate-100 text-slate-500 border-slate-300 text-[10px] px-2 py-0">
                                      Booked
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{offering.description}</p>
                                <div className="flex gap-4 text-[11px] font-semibold text-slate-400">
                                  <span>Duration: {offering.duration_minutes} mins</span>
                                  {offering.max_group_size > 1 && <span>Max Size: {offering.max_group_size}</span>}
                                </div>
                              </div>
                              <div className="text-left sm:text-right shrink-0">
                                <div className="text-lg font-extrabold text-slate-800">
                                  {offering.price_per_session ? `₹${offering.price_per_session}` : ""}
                                </div>
                                <div className="text-xs text-slate-400">Per Session</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Step 2: Slot/Booking Screen
                <div className="space-y-6">
                  {/* Selected Offering Summary */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Selected Offering</span>
                      <h4 className="font-bold text-slate-800 text-sm">{selectedOfferingForBooking.title}</h4>
                      <span className="text-xs text-slate-500">{selectedOfferingForBooking.offering_type} • {selectedOfferingForBooking.price_per_session ? `₹${selectedOfferingForBooking.price_per_session}` : ""}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOfferingForBooking(null);
                        setSelectedSlotForBooking(null);
                        setSelectedDate(null);
                        setBookingTopic("");
                        setSlotCalendarData({});
                        setGroupSessionData(null);
                      }}
                      className="border-slate-200 text-xs font-semibold hover:bg-slate-50 shrink-0"
                    >
                      Change
                    </Button>
                  </div>

                  {isLoadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <Loader2 className="animate-spin w-8 h-8 mb-4 text-orange-500" />
                      <span>Loading available slots...</span>
                    </div>

                  ) : groupSessionData ? (
                    /* ── Group Session: fixed schedule info card ── */
                    <div className="space-y-4">
                      {/* Session info banner */}
                      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-transparent rounded-2xl border border-indigo-100 p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 text-sm">{groupSessionData.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{groupSessionData.description}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-base font-extrabold text-indigo-700">
                              {groupSessionData.price_per_session ? `₹${groupSessionData.price_per_session}` : ""}
                            </div>
                            <div className="text-[10px] text-slate-400">Per Session</div>
                          </div>
                        </div>

                        {/* Schedule row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📅 Date</div>
                            <div className="text-sm font-semibold text-slate-800">
                              {new Date(groupSessionData.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {groupSessionData.end_date && groupSessionData.end_date !== groupSessionData.start_date && (
                                <span className="text-slate-400"> – {new Date(groupSessionData.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">🕐 Time</div>
                            <div className="text-sm font-semibold text-slate-800">
                              {groupSessionData.start_time?.slice(0, 5)} – {groupSessionData.end_time?.slice(0, 5)}
                            </div>
                            <div className="text-[10px] text-slate-400">{groupSessionData.duration_minutes} mins</div>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">👥 Seats</div>
                            <div className="text-sm font-semibold text-slate-800">
                              {groupSessionData.seats_left} / {groupSessionData.max_group_size} left
                            </div>
                            <div className={`text-[10px] font-semibold ${groupSessionData.seat_status === 'open' ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                              {groupSessionData.seat_status === 'open' ? '● Open' : '● Full'}
                            </div>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📂 Category</div>
                            <div className="text-sm font-semibold text-slate-800">{groupSessionData.category}</div>
                          </div>
                        </div>
                      </div>

                      {/* Topic input + confirm */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Message / Question for the Mentor (Optional)</label>
                          <Input
                            placeholder="e.g. I want to learn about Docker in this session"
                            className="bg-white border-slate-200 text-sm"
                            value={bookingTopic}
                            onChange={(e) => setBookingTopic(e.target.value)}
                          />
                        </div>
                        {(() => {
                          const isOfferingAlreadyBooked = selectedOfferingForBooking && bookedSessions.some(session => session.offering === selectedOfferingForBooking.name);
                          return (
                            <Button
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-bold shadow-xl shadow-indigo-500/10"
                              onClick={handleConfirmGroupBooking}
                              disabled={isBooking || groupSessionData.seat_status !== 'open' || isOfferingAlreadyBooked}
                            >
                              {isBooking ? "Booking..." : isOfferingAlreadyBooked ? "Already Registered" : groupSessionData.seat_status !== 'open' ? "Session Full" : "Join Group Session"}
                            </Button>
                          );
                        })()}
                      </div>
                    </div>

                  ) : Object.keys(slotCalendarData).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                      No slots available for this offering.
                    </div>
                  ) : (
                    /* ── 1:1 Mentorship: date + time slot picker ── */
                    <div className="space-y-6">
                      {/* Date Selector */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          Select Date
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                          {Object.keys(slotCalendarData).sort().map((date) => (
                            <button
                              key={date}
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedSlotForBooking(null);
                              }}
                              className={`snap-start shrink-0 px-4 py-3 rounded-xl border transition-all ${selectedDate === date
                                ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50/50"
                                }`}
                            >
                              <div className="text-xs font-medium uppercase opacity-70 mb-1">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="font-semibold whitespace-nowrap">
                                {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {slotCalendarData[date].filter((s: any) => s.status === 'available').length} open
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Slots Grid */}
                      {selectedDate && slotCalendarData[selectedDate] && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            Available Slots
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {slotCalendarData[selectedDate].map((slot: any, idx: number) => {
                              const isAvailable = slot.status === "available";
                              const isSelected = selectedSlotForBooking === slot;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => { if (isAvailable) setSelectedSlotForBooking(slot); }}
                                  className={`p-3 rounded-xl border text-center transition-all ${!isAvailable
                                    ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                                    : isSelected
                                      ? "bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 cursor-pointer"
                                      : "bg-white border-emerald-200 hover:border-emerald-500 hover:shadow-md cursor-pointer group"
                                    }`}
                                >
                                  <div className={`text-sm font-semibold ${isAvailable ? (isSelected ? "text-emerald-800" : "text-slate-800 group-hover:text-emerald-700") : "text-slate-500"
                                    }`}>
                                    {slot.from_time.slice(0, 5)} – {slot.to_time.slice(0, 5)}
                                  </div>
                                  <div className={`text-[10px] mt-1 font-medium ${isAvailable ? "text-emerald-600" : "text-slate-400"
                                    }`}>
                                    {isAvailable ? "Available" : "Booked"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Topic and Confirm */}
                      {selectedSlotForBooking && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">What you expect from session</label>
                            <Input
                              placeholder="e.g. Mock Interview Prep"
                              className="bg-white border-slate-200 text-sm"
                              value={bookingTopic}
                              onChange={(e) => setBookingTopic(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-bold shadow-xl shadow-emerald-500/10"
                            onClick={handleConfirmBooking}
                            disabled={isBooking}
                          >
                            {isBooking ? "Booking..." : "Confirm Booking"}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}