"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUpcomingSessions, getSlotCalendar, getWeeklyBookedSessions, getMonthlyBookedSessions, blockTime, rescheduleSession, saveMentorAvailability, deleteMentorAvailability, getSessionNote, saveSessionNotes, markSessionCompleted } from "@/services/mentor.services";
import { useToast } from "@/context/ToastContext";

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Edit3,
  List,
  X,
  Loader2,
  Video,
  Trash2,
  FileText,
  User,
  Lock,
  AlertCircle,
  Check
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";



const availabilityGrid = [
  { day: "MONDAY", slots: [{ time: "10 AM", status: "booked" }, { time: "11 AM", status: "booked" }, { time: "4 PM", status: "available" }, { time: "5 PM", status: "available" }] },
  { day: "TUESDAY", slots: [{ time: "3 PM", status: "available" }, { time: "4 PM", status: "available" }, { time: "5 PM", status: "booked_locked" }, { time: "6 PM", status: "available" }] },
  { day: "WEDNESDAY", slots: [{ time: "10 AM", status: "available" }, { time: "11 AM", status: "available" }, { time: "2 PM", status: "available" }] },
  { day: "THURSDAY", slots: [{ time: "4 PM", status: "booked" }, { time: "5 PM", status: "booked" }, { time: "6 PM", status: "booked" }] },
  { day: "FRIDAY", slots: [{ time: "11 AM", status: "available" }, { time: "12 PM", status: "booked" }, { time: "4 PM", status: "available" }] },
  { day: "SATURDAY", slots: [{ time: "10 AM", status: "available" }, { time: "11 AM", status: "available" }, { time: "12 PM", status: "available" }] },
];

const upcomingBookings = [
  { id: "SES-2410", initials: "PS", name: "Priya Sharma", color: "bg-orange-500", topic: "ML Project Milestone Review", date: "Feb 26 • 4:00 PM", duration: "60 min", type: "Technical", typeColor: "text-blue-600 bg-blue-50", fee: "₹1,200" },
  { id: "SES-2411", initials: "AN", name: "Arjun Nair", color: "bg-blue-500", topic: "FAANG Prep Check-In", date: "Feb 27 • 3:00 PM", duration: "45 min", type: "Career", typeColor: "text-orange-600 bg-orange-50", fee: "₹1,200" },
  { id: "SES-2412", initials: "TG", name: "Tanya Gupta", color: "bg-emerald-500", topic: "Data Science Roadmap", date: "Mar 1 • 2:00 PM", duration: "60 min", type: "Career", typeColor: "text-orange-600 bg-orange-50", fee: "₹1,200" },
];

const getMentorEmail = (currentUser: string | null) => {
  return currentUser || (typeof window !== "undefined" ? (localStorage.getItem("currentUser") || localStorage.getItem("userEmail")) : null) || "";
};

export default function ScheduleTabContent() {
  const { currentUser, isInitialized } = useAuth();
  const { showToast } = useToast();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [slotCalendar, setSlotCalendar] = useState<Record<string, any[]>>({});
  const [weeklyBooked, setWeeklyBooked] = useState<any[]>([]);
  const [monthlyBooked, setMonthlyBooked] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const [bookedSessionsPage, setBookedSessionsPage] = useState<number>(1);
  const [upcomingBookingsPage, setUpcomingBookingsPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    setBookedSessionsPage(1);
  }, [viewType]);

  // Block time states
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockFromTime, setBlockFromTime] = useState("");
  const [blockToTime, setBlockToTime] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockWholeDay, setBlockWholeDay] = useState(false);
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedSessionMentor, setSelectedSessionMentor] = useState("");
  const [selectedSessionStudent, setSelectedSessionStudent] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleFromTime, setRescheduleFromTime] = useState("");
  const [rescheduleToTime, setRescheduleToTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  // Availability Modal states
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'Each Day Same Schedule' | 'Each Day Different Schedule'>('Each Day Same Schedule');

  // For 'Each Day Same Schedule'
  const [sameScheduleFromTime, setSameScheduleFromTime] = useState("");
  const [sameScheduleToTime, setSameScheduleToTime] = useState("");
  const [sameScheduleSelectedDays, setSameScheduleSelectedDays] = useState<string[]>([]);

  // For 'Each Day Different Schedule'
  const [differentScheduleDays, setDifferentScheduleDays] = useState<Record<string, { active: boolean; fromTime: string; toTime: string }>>({
    Monday: { active: false, fromTime: "", toTime: "" },
    Tuesday: { active: false, fromTime: "", toTime: "" },
    Wednesday: { active: false, fromTime: "", toTime: "" },
    Thursday: { active: false, fromTime: "", toTime: "" },
    Friday: { active: false, fromTime: "", toTime: "" },
    Saturday: { active: false, fromTime: "", toTime: "" },
    Sunday: { active: false, fromTime: "", toTime: "" }
  });
  const [submittingAvailability, setSubmittingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Prep Notes modal states
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesSessionId, setNotesSessionId] = useState("");
  const [notesStudentEmail, setNotesStudentEmail] = useState("");
  const [notesStudentName, setNotesStudentName] = useState("");
  const [notesTopic, setNotesTopic] = useState("");
  const [notesShared, setNotesShared] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const [completingSessionId, setCompletingSessionId] = useState<string | null>(null);

  const handleCompleteSession = async (sessionName: string) => {
    if (!sessionName) return;
    if (!confirm("Are you sure you want to mark this session as completed?")) return;

    try {
      setCompletingSessionId(sessionName);
      await markSessionCompleted(sessionName);
      showToast("Session marked as completed successfully.", "success");

      const email = getMentorEmail(currentUser);
      if (email) {
        if (viewType === 'week') {
          fetchWeeklyData();
        } else {
          fetchMonthlyData();
        }
        const upcomingRes = await getUpcomingSessions(email);
        if (upcomingRes?.message && Array.isArray(upcomingRes.message)) {
          setUpcoming(upcomingRes.message);
        } else {
          setUpcoming([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to mark session as completed", err);
      let errorMessage = "Failed to mark session as completed. Please try again.";
      const errorData = err.data || err.response?.data;
      if (errorData?._server_messages) {
        try {
          const messages = JSON.parse(errorData._server_messages);
          if (messages.length > 0) {
            const msgObj = JSON.parse(messages[0]);
            errorMessage = msgObj.message || errorMessage;
          }
        } catch (e) { }
      } else if (err.message && !err.message.includes("Traceback")) {
        errorMessage = err.message;
      }
      showToast(errorMessage, "error");
    } finally {
      setCompletingSessionId(null);
    }
  };

  const handleOpenNotes = async (sessionId: string, studentEmail: string, studentName: string, topic: string) => {
    setNotesSessionId(sessionId);
    setNotesStudentEmail(studentEmail);
    setNotesStudentName(studentName);
    setNotesTopic(topic);
    setNotesShared("");
    setNotesInternal("");
    setNotesError("");
    setNotesSaved(false);
    setNotesModalOpen(true);
    setLoadingNotes(true);

    try {
      const res = await getSessionNote(sessionId, studentEmail);
      if (res?.message?.data) {
        setNotesShared(res.message.data.shared_with_student || "");
        setNotesInternal(res.message.data.notes || "");
      }
    } catch (err) {
      console.error("Failed to fetch session notes", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!notesSessionId || !notesStudentEmail) return;
    setSavingNotes(true);
    setNotesError("");
    setNotesSaved(false);
    try {
      await saveSessionNotes({
        session_name: notesSessionId,
        student: notesStudentEmail,
        notes: notesInternal,
        shared_with_student: notesShared
      });
      showToast("Session notes saved successfully.", "success");
      setNotesModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save notes", err);
      let errorMessage = "Failed to save notes. Please try again.";
      const errorData = err.data || err.response?.data;
      if (errorData?._server_messages) {
        try {
          const messages = JSON.parse(errorData._server_messages);
          if (messages.length > 0) {
            const msgObj = JSON.parse(messages[0]);
            errorMessage = msgObj.message || errorMessage;
          }
        } catch (e) { }
      } else if (err.message && !err.message.includes("Traceback")) {
        errorMessage = err.message;
      }
      setNotesError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRescheduleClick = (sessionId: string, mentor: string, student: string) => {
    setSelectedSessionId(sessionId);
    setSelectedSessionMentor(mentor);
    setSelectedSessionStudent(student);
    setRescheduleDate("");
    setRescheduleFromTime("");
    setRescheduleToTime("");
    setRescheduleReason("");
    setRescheduleError("");
    setRescheduleModalOpen(true);
  };

  const submitReschedule = async () => {
    if (!selectedSessionId || !rescheduleDate || !rescheduleFromTime || !rescheduleToTime) return;
    try {
      setRescheduleError("");
      setSubmittingReschedule(true);
      const formatTimeToSeconds = (t: string) => {
        if (t.split(':').length === 2) return `${t}:00`;
        return t;
      };
      await rescheduleSession({
        session_name: selectedSessionId,
        new_date: rescheduleDate,
        new_from_time: formatTimeToSeconds(rescheduleFromTime),
        new_to_time: formatTimeToSeconds(rescheduleToTime),
        reason: rescheduleReason,
        mentor: selectedSessionMentor,
        student: selectedSessionStudent
      });
      showToast("Session rescheduled successfully.", "success");
      setRescheduleModalOpen(false);
      const email = getMentorEmail(currentUser);
      if (email) {
        const upcomingRes = await getUpcomingSessions(email);
        if (upcomingRes?.message && Array.isArray(upcomingRes.message)) {
          setUpcoming(upcomingRes.message);
        } else {
          setUpcoming([]);
        }
      }
    } catch (error: any) {
      console.error("Failed to reschedule", error);
      let errorMessage = "Failed to reschedule session. Please try again.";

      const errorData = error.data || error.response?.data;

      if (errorData) {
        if (errorData._server_messages) {
          try {
            const messages = JSON.parse(errorData._server_messages);
            if (messages.length > 0) {
              const msgObj = JSON.parse(messages[0]);
              errorMessage = msgObj.message || errorMessage;
            }
          } catch (e) { }
        } else if (errorData.exception) {
          errorMessage = errorData.exception.split(":").slice(1).join(":").trim() || errorData.exception;
        } else if (error.message && !error.message.includes("Traceback")) {
          errorMessage = error.message;
        }
      } else if (error.message && !error.message.includes("Traceback")) {
        errorMessage = error.message;
      }

      setRescheduleError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const reloadSlotCalendar = async () => {
    const email = getMentorEmail(currentUser);
    if (!email) return;
    try {
      const calendarRes = await getSlotCalendar(email);
      if (calendarRes?.message && typeof calendarRes.message === 'object') {
        setSlotCalendar(calendarRes.message);
      } else {
        setSlotCalendar({});
      }
    } catch (err) {
      console.error("Failed to reload slot calendar", err);
    }
  };

  const handleClearAvailability = async () => {
    const email = getMentorEmail(currentUser);
    if (!email) return;

    if (!confirm("Are you sure you want to clear all your availability slots? This cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await deleteMentorAvailability(email);
      await reloadSlotCalendar();
      showToast("Availability cleared successfully.", "success");
    } catch (err: any) {
      console.error("Failed to delete availability", err);
      showToast(err.message || "Failed to clear availability.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    const email = getMentorEmail(currentUser);
    if (!email) return;

    try {
      setAvailabilityError("");
      setSubmittingAvailability(true);

      const formatTimeToSeconds = (t: string) => {
        if (!t) return "";
        if (t.split(':').length === 2) return `${t}:00`;
        return t;
      };

      let payload: any = {
        mentor: email,
        schedule_type: scheduleType
      };

      if (scheduleType === 'Each Day Same Schedule') {
        if (sameScheduleSelectedDays.length === 0) {
          throw new Error("Please select at least one day.");
        }
        if (!sameScheduleFromTime || !sameScheduleToTime) {
          throw new Error("Please fill in both From and To times.");
        }
        payload.from_time = formatTimeToSeconds(sameScheduleFromTime);
        payload.to_time = formatTimeToSeconds(sameScheduleToTime);
        payload.days_multi = sameScheduleSelectedDays.map(day => ({ day }));
      } else {
        const dailySchedule = Object.entries(differentScheduleDays)
          .filter(([_, data]) => data.active)
          .map(([day, data]) => {
            if (!data.fromTime || !data.toTime) {
              throw new Error(`Please fill in both From and To times for ${day}.`);
            }
            return {
              day,
              from_time: formatTimeToSeconds(data.fromTime),
              to_time: formatTimeToSeconds(data.toTime)
            };
          });

        if (dailySchedule.length === 0) {
          throw new Error("Please enable and configure at least one day.");
        }
        payload.daily_schedule = dailySchedule;
      }

      await saveMentorAvailability(payload);

      // Reset state and close modal
      setSameScheduleFromTime("");
      setSameScheduleToTime("");
      setSameScheduleSelectedDays([]);
      setDifferentScheduleDays({
        Monday: { active: false, fromTime: "", toTime: "" },
        Tuesday: { active: false, fromTime: "", toTime: "" },
        Wednesday: { active: false, fromTime: "", toTime: "" },
        Thursday: { active: false, fromTime: "", toTime: "" },
        Friday: { active: false, fromTime: "", toTime: "" },
        Saturday: { active: false, fromTime: "", toTime: "" },
        Sunday: { active: false, fromTime: "", toTime: "" }
      });

      showToast("Availability saved successfully.", "success");
      setAvailabilityModalOpen(false);
      await reloadSlotCalendar();
    } catch (err: any) {
      console.error("Failed to save availability", err);
      setAvailabilityError(err.message || "Failed to save availability. Please try again.");
      showToast(err.message || "Failed to save availability.", "error");
    } finally {
      setSubmittingAvailability(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const email = getMentorEmail(currentUser);
      if (!email) {
        if (isInitialized) {
          setLoading(false);
        }
        return;
      }
      try {
        const [upcomingRes, calendarRes, weeklyRes] = await Promise.all([
          getUpcomingSessions(email).catch(err => {
            console.error("Failed to fetch upcoming sessions", err);
            return null;
          }),
          getSlotCalendar(email).catch(err => {
            console.error("Failed to fetch slot calendar", err);
            return null;
          }),
          getWeeklyBookedSessions(email).catch(err => {
            console.error("Failed to fetch weekly booked sessions", err);
            return null;
          })
        ]);
        if (upcomingRes?.message && Array.isArray(upcomingRes.message)) {
          setUpcoming(upcomingRes.message);
        } else {
          setUpcoming([]);
        }
        if (calendarRes?.message && typeof calendarRes.message === 'object') {
          setSlotCalendar(calendarRes.message);
        } else {
          setSlotCalendar({});
        }
        if (weeklyRes?.message && Array.isArray(weeklyRes.message)) {
          setWeeklyBooked(weeklyRes.message);
        } else {
          setWeeklyBooked([]);
        }
      } catch (err) {
        console.error("Failed to fetch schedule data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, isInitialized]);

  const fetchMonthlyData = async () => {
    const email = getMentorEmail(currentUser);
    if (!email) return;
    try {
      setLoadingMonthly(true);
      const monthlyRes = await getMonthlyBookedSessions(email);
      if (monthlyRes?.message && Array.isArray(monthlyRes.message)) {
        setMonthlyBooked(monthlyRes.message);
      } else {
        setMonthlyBooked([]);
      }
    } catch (err) {
      console.error("Failed to fetch monthly booked sessions", err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const fetchWeeklyData = async () => {
    const email = getMentorEmail(currentUser);
    if (!email) return;
    try {
      setLoadingWeekly(true);
      const weeklyRes = await getWeeklyBookedSessions(email);
      if (weeklyRes?.message && Array.isArray(weeklyRes.message)) {
        setWeeklyBooked(weeklyRes.message);
      } else {
        setWeeklyBooked([]);
      }
    } catch (err) {
      console.error("Failed to fetch weekly booked sessions", err);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const handleSwitchView = (type: 'week' | 'month') => {
    if (type === viewType) return;
    setViewType(type);
    if (type === 'month') {
      fetchMonthlyData();
    } else {
      fetchWeeklyData();
    }
  };

  const handleBlockTime = async () => {
    const email = getMentorEmail(currentUser);
    if (!email || !blockDate) return;
    if (!blockWholeDay && (!blockFromTime || !blockToTime)) return;
    try {
      setSubmittingBlock(true);

      const formatTimeToSeconds = (t: string) => {
        if (t.split(':').length === 2) return `${t}:00`;
        return t;
      };

      await blockTime({
        mentor: email,
        date: blockDate,
        from_time: blockWholeDay ? undefined : formatTimeToSeconds(blockFromTime),
        to_time: blockWholeDay ? undefined : formatTimeToSeconds(blockToTime),
        reason: blockReason,
        whole_day: blockWholeDay ? 1 : 0
      });

      showToast("Time blocked successfully.", "success");
      setBlockDate("");
      setBlockFromTime("");
      setBlockToTime("");
      setBlockReason("");
      setBlockWholeDay(false);
      setBlockModalOpen(false);

      if (viewType === 'week') {
        fetchWeeklyData();
      } else {
        fetchMonthlyData();
      }

      const calendarRes = await getSlotCalendar(email);
      if (calendarRes?.message && typeof calendarRes.message === 'object') {
        setSlotCalendar(calendarRes.message);
      } else {
        setSlotCalendar({});
      }
    } catch (err: any) {
      console.error("Failed to block time", err);
      showToast(err?.message || "Failed to block time.", "error");
    } finally {
      setSubmittingBlock(false);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    if (minutes === '00') return `${h12} ${ampm}`;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    return `${dayName} (${dateFormatted})`;
  };

  const dynamicAvailabilityGrid = Object.keys(slotCalendar || {}).map(dateStr => {
    const slots = slotCalendar[dateStr];
    const slotsArr = Array.isArray(slots) ? slots : [];

    // Detect whole-day block: single entry with status "blocked"
    const isWholeDayBlocked = slotsArr.length === 1 && slotsArr[0].status === 'blocked';

    return {
      day: getDayName(dateStr),
      isWholeDayBlocked,
      wholeDayReason: isWholeDayBlocked ? (slotsArr[0].reason || '') : '',
      slots: slotsArr.map(slot => ({
        time: formatTimeSlot(slot.from_time),
        status: slot.status,
        reason: slot.reason
      }))
    };
  });

  const dynamicWeeklyBooked = (Array.isArray(weeklyBooked) ? weeklyBooked : []).map((s, index) => {
    const studentName = s.student_full_name || s.student_name || s.student?.split('@')[0] || "Unknown";
    const initials = studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || "??";
    const colors = ["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500"];
    const color = colors[index % colors.length];
    const borderColors = ["border-l-orange-500", "border-l-blue-500", "border-l-emerald-500", "border-l-purple-500"];
    const borderColor = borderColors[index % borderColors.length];

    let dateStr = "";
    if (s.session_date) {
      const dateObj = new Date(s.session_date);
      dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    const timeStr = formatTime(s.from_time);

    return {
      id: s.name,
      initials,
      name: studentName,
      studentEmail: s.student || "",
      mentor: s.mentor || "",
      student: s.student || "",
      topic: s.topic || "Session",
      date: `${dateStr} - ${timeStr}`,
      duration: `${s.duration || 60} min`,
      color,
      borderColor,
      meeting_link: s.meeting_link
    };
  });

  const dynamicMonthlyBooked = (Array.isArray(monthlyBooked) ? monthlyBooked : []).map((s, index) => {
    const studentName = s.student_full_name || s.student_name || s.student?.split('@')[0] || "Unknown";
    const initials = studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || "??";
    const colors = ["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500"];
    const color = colors[index % colors.length];
    const borderColors = ["border-l-orange-500", "border-l-blue-500", "border-l-emerald-500", "border-l-purple-500"];
    const borderColor = borderColors[index % borderColors.length];

    let dateStr = "";
    if (s.session_date) {
      const dateObj = new Date(s.session_date);
      dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    const timeStr = formatTime(s.from_time);

    return {
      id: s.name,
      initials,
      name: studentName,
      studentEmail: s.student || "",
      mentor: s.mentor || "",
      student: s.student || "",
      topic: s.topic || "Session",
      date: `${dateStr} - ${timeStr}`,
      duration: `${s.duration || 60} min`,
      color,
      borderColor,
      meeting_link: s.meeting_link
    };
  });

  const dynamicUpcomingBookings = (Array.isArray(upcoming) ? upcoming : []).map((s, index) => {
    const studentName = s.student_full_name || s.student_name || (s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : null) || s.student?.split('@')[0] || "Unknown";
    const initials = studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || "??";
    const colors = ["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500"];
    const color = colors[index % colors.length];

    const dateObj = new Date(s.session_date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeStr = formatTime(s.from_time);

    return {
      id: s.name,
      initials,
      name: studentName,
      studentEmail: s.student || "",
      mentor: s.mentor || "",
      student: s.student || "",
      color,
      topic: s.topic || "Session",
      date: `${dateStr} • ${timeStr}`,
      duration: `${s.duration} min`,
      type: "Mentorship",
      typeColor: "text-blue-600 bg-blue-50",
      fee: "—",
      meeting_link: s.meeting_link
    };
  });

  const currentBookedSessions = useMemo(() => {
    return viewType === 'week' ? dynamicWeeklyBooked : dynamicMonthlyBooked;
  }, [viewType, dynamicWeeklyBooked, dynamicMonthlyBooked]);

  const totalBookedPages = Math.ceil(currentBookedSessions.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentBookedSessions.length > 0) {
      const maxPage = Math.ceil(currentBookedSessions.length / ITEMS_PER_PAGE);
      if (bookedSessionsPage > maxPage) {
        setBookedSessionsPage(maxPage);
      }
    } else {
      setBookedSessionsPage(1);
    }
  }, [currentBookedSessions.length, bookedSessionsPage]);

  const paginatedBookedSessions = useMemo(() => {
    const startIndex = (bookedSessionsPage - 1) * ITEMS_PER_PAGE;
    return currentBookedSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentBookedSessions, bookedSessionsPage]);

  const totalUpcomingPages = Math.ceil(dynamicUpcomingBookings.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (dynamicUpcomingBookings.length > 0) {
      const maxPage = Math.ceil(dynamicUpcomingBookings.length / ITEMS_PER_PAGE);
      if (upcomingBookingsPage > maxPage) {
        setUpcomingBookingsPage(maxPage);
      }
    } else {
      setUpcomingBookingsPage(1);
    }
  }, [dynamicUpcomingBookings.length, upcomingBookingsPage]);

  const paginatedUpcomingBookings = useMemo(() => {
    const startIndex = (upcomingBookingsPage - 1) * ITEMS_PER_PAGE;
    return dynamicUpcomingBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [dynamicUpcomingBookings, upcomingBookingsPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Schedule & Availability</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your bookings and block off time</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 rounded-full p-1 flex">
            <button
              onClick={() => handleSwitchView('week')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewType === 'week' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => handleSwitchView('month')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewType === 'month' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Month
            </button>
          </div>
          <button
            onClick={() => setBlockModalOpen(true)}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Block Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booked Sessions List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="px-6 py-4 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" /> {viewType === 'week' ? 'This Week — Booked Sessions' : 'This Month — Booked Sessions'}
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            {(viewType === 'week' ? (loading || loadingWeekly) : loadingMonthly) ? (
              <div className="text-center text-slate-500 py-8">Loading booked sessions...</div>
            ) : currentBookedSessions.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                {viewType === 'week' ? 'No booked sessions for this week.' : 'No booked sessions for this month.'}
              </div>
            ) : (
              <>
                {paginatedBookedSessions.map((session, i) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl border-slate-200 ${session.borderColor} border-l-[4px] shadow-sm`}>
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className={`w-10 h-10 rounded-full ${session.color} flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1`}>
                        {session.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{session.name}</h4>
                        <p className="text-sm text-slate-600 mb-2">{session.topic}</p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                            <Calendar className="w-3.5 h-3.5" /> {session.date} • {session.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {session.meeting_link && (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Video className="w-3.5 h-3.5" /> Join
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenNotes(session.id, session.studentEmail, session.name, session.topic)}
                        className="px-3 py-1.5 text-orange-600 hover:bg-orange-50 bg-orange-50/50 border border-orange-100 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Prep Notes
                      </button>
                      <button
                        onClick={() => handleCompleteSession(session.id)}
                        disabled={completingSessionId === session.id}
                        className="px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50 border border-emerald-100 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1 justify-center disabled:opacity-50"
                      >
                        {completingSessionId === session.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
                <Pagination
                  currentPage={bookedSessionsPage}
                  totalPages={totalBookedPages}
                  onPageChange={setBookedSessionsPage}
                  className="mt-4"
                />
              </>
            )}
          </div>
        </motion.div>

        {/* Availability Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> Weekly Availability Grid
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAvailabilityModalOpen(true)}
                className="flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Set Availability
              </button>
              <button
                onClick={handleClearAvailability}
                className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-5">
              {loading ? (
                <div className="text-center text-slate-500 py-4">Loading availability...</div>
              ) : dynamicAvailabilityGrid.length === 0 ? (
                <div className="text-center text-slate-500 py-4">No availability data for this week.</div>
              ) : dynamicAvailabilityGrid.map((dayLine, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="w-44 text-xs font-bold text-slate-500 tracking-wider shrink-0 mt-1.5">{dayLine.day}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {dayLine.isWholeDayBlocked ? (
                      <div
                        title={dayLine.wholeDayReason ? `Reason: ${dayLine.wholeDayReason}` : 'Whole day blocked'}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm"
                      >
                        <span>🚫</span>
                        <span>Not Available</span>
                        {dayLine.wholeDayReason ? (
                          <span className="text-rose-500 font-medium">· {dayLine.wholeDayReason}</span>
                        ) : (
                          <span className="text-rose-400 font-medium">· Day Blocked</span>
                        )}
                      </div>
                    ) : dayLine.slots.length === 0 ? (
                      <span className="text-xs text-slate-400 italic mt-1.5">No slots available</span>
                    ) : dayLine.slots.map((slot, j) => {
                      const isBooked = slot.status.includes('booked');
                      const isBlocked = slot.status === 'blocked';

                      let slotClass = "";
                      if (isBooked) {
                        slotClass = "bg-orange-500 text-white shadow-sm border-transparent";
                      } else if (isBlocked) {
                        slotClass = "bg-rose-50 text-rose-600 border border-rose-200 shadow-sm";
                      } else {
                        slotClass = "bg-slate-100 text-slate-600 border border-slate-200";
                      }

                      return (
                        <div
                          key={j}
                          title={isBlocked ? (slot.reason ? `Reason: ${slot.reason}` : "Blocked") : undefined}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ${slotClass}`}
                        >
                          {slot.time}
                          {slot.status === 'booked_locked' && <span className="opacity-70">🔒</span>}
                          {isBlocked && <span className="opacity-80">🚫</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-6 border-t border-slate-100 pt-5 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div> Booked
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full border border-slate-300 bg-white"></div> Available
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full border border-rose-200 bg-rose-50"></div> Blocked
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* All Upcoming Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <List className="w-4 h-4 text-slate-500" /> All Upcoming Bookings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="py-4 px-6 font-bold">Session ID</th>
                <th className="py-4 px-6 font-bold">Student</th>
                <th className="py-4 px-6 font-bold">Topic</th>
                <th className="py-4 px-6 font-bold">Date & Time</th>
                <th className="py-4 px-6 font-bold">Duration</th>
                <th className="py-4 px-6 font-bold">Type</th>
                <th className="py-4 px-6 font-bold">Fee</th>
                <th className="py-4 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading bookings...</td>
                </tr>
              ) : dynamicUpcomingBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No upcoming bookings.</td>
                </tr>
              ) : paginatedUpcomingBookings.map((session, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{session.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${session.color} flex items-center justify-center text-white font-bold text-[10px]`}>
                        {session.initials}
                      </div>
                      <span className="font-bold text-slate-800 whitespace-nowrap">{session.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 min-w-[200px]">{session.topic}</td>
                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap font-medium">{session.date}</td>
                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap">{session.duration}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${session.typeColor}`}>
                      {session.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-emerald-600">{session.fee}</td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {session.meeting_link && (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Video className="w-3.5 h-3.5" /> Join
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenNotes(session.id, session.studentEmail, session.name, session.topic)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Notes
                      </button>
                      <button
                        onClick={() => handleRescheduleClick(session.id, session.mentor, session.student)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors">Reschedule</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={upcomingBookingsPage}
          totalPages={totalUpcomingPages}
          onPageChange={setUpcomingBookingsPage}
          className="border-0 border-t border-slate-100 rounded-none shadow-none p-4"
        />
      </motion.div>

      {/* Block Time Modal */}
      {blockModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col mx-4">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Block Time</h3>
              <button
                onClick={() => setBlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={blockDate}
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
                  required
                />
              </div>

              {/* Whole Day Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    id="block-whole-day"
                    type="checkbox"
                    checked={blockWholeDay}
                    onChange={(e) => {
                      setBlockWholeDay(e.target.checked);
                      if (e.target.checked) {
                        setBlockFromTime("");
                        setBlockToTime("");
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${blockWholeDay
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-slate-300 bg-white group-hover:border-orange-400'
                    }`}>
                    {blockWholeDay && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-700">Whole Day</span>
                  <p className="text-xs text-slate-400 leading-tight">Block the entire day — no specific time range needed</p>
                </div>
              </label>

              {/* Time Fields — hidden when Whole Day is selected */}
              {!blockWholeDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">From Time</label>
                    <input
                      type="time"
                      value={blockFromTime}
                      onChange={(e) => setBlockFromTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">To Time</label>
                    <input
                      type="time"
                      value={blockToTime}
                      onChange={(e) => setBlockToTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Reason (Optional)</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Personal holiday, out of town..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium resize-none text-slate-700"
                />
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => { setBlockModalOpen(false); setBlockWholeDay(false); }}
                className="flex-1 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
                disabled={submittingBlock}
              >
                Cancel
              </button>
              <button
                onClick={handleBlockTime}
                disabled={!blockDate || (!blockWholeDay && (!blockFromTime || !blockToTime)) || submittingBlock}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2"
              >
                {submittingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col mx-4">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Reschedule Session</h3>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rescheduleError && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-start gap-2">
                <div className="w-4 h-4 text-red-500 shrink-0 mt-0.5 font-bold flex items-center justify-center">!</div>
                <p className="text-sm text-red-600 font-medium">{rescheduleError}</p>
              </div>
            )}

            <div className="p-5 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">From Time</label>
                  <input
                    type="time"
                    value={rescheduleFromTime}
                    onChange={(e) => setRescheduleFromTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">To Time</label>
                  <input
                    type="time"
                    value={rescheduleToTime}
                    onChange={(e) => setRescheduleToTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Reason for Rescheduling <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Emergency came up, need to move to next week..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700 resize-none"
                  required
                />
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="flex-1 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
                disabled={submittingReschedule}
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                disabled={!rescheduleDate || !rescheduleFromTime || !rescheduleToTime || !rescheduleReason.trim() || submittingReschedule}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2"
              >
                {submittingReschedule ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Set Availability Modal */}
      {availabilityModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col mx-4 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Configure Availability</h3>
              <button
                onClick={() => setAvailabilityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availabilityError && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-start gap-2">
                <div className="w-4 h-4 text-red-500 shrink-0 mt-0.5 font-bold flex items-center justify-center">!</div>
                <p className="text-sm text-red-600 font-medium">{availabilityError}</p>
              </div>
            )}

            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-700">
              {/* Schedule Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Schedule Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setScheduleType('Each Day Same Schedule')}
                    className={`py-2 text-xs font-bold rounded-md transition-all ${scheduleType === 'Each Day Same Schedule' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Same Time Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('Each Day Different Schedule')}
                    className={`py-2 text-xs font-bold rounded-md transition-all ${scheduleType === 'Each Day Different Schedule' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Different Time Daily
                  </button>
                </div>
              </div>

              {scheduleType === 'Each Day Same Schedule' ? (
                <>
                  {/* Same schedule days selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Days</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                        const isSelected = sameScheduleSelectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSameScheduleSelectedDays(sameScheduleSelectedDays.filter(d => d !== day));
                              } else {
                                setSameScheduleSelectedDays([...sameScheduleSelectedDays, day]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSelected
                              ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Same schedule time fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">From Time</label>
                      <input
                        type="time"
                        value={sameScheduleFromTime}
                        onChange={(e) => setSameScheduleFromTime(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 font-medium text-slate-700 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">To Time</label>
                      <input
                        type="time"
                        value={sameScheduleToTime}
                        onChange={(e) => setSameScheduleToTime(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 font-medium text-slate-700 bg-white"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Different schedule days fields */
                <div className="space-y-3.5 divide-y divide-slate-100">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, idx) => {
                    const dayConfig = differentScheduleDays[day];
                    return (
                      <div key={day} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${idx > 0 ? 'pt-3.5' : ''}`}>
                        <label className="flex items-center gap-2 cursor-pointer shrink-0 min-w-[120px]">
                          <input
                            type="checkbox"
                            checked={dayConfig.active}
                            onChange={(e) => {
                              setDifferentScheduleDays({
                                ...differentScheduleDays,
                                [day]: {
                                  ...dayConfig,
                                  active: e.target.checked
                                }
                              });
                            }}
                            className="rounded border-slate-300 text-slate-800 focus:ring-slate-800 h-4 w-4"
                          />
                          <span className={`text-sm font-bold ${dayConfig.active ? 'text-slate-800' : 'text-slate-400'}`}>
                            {day}
                          </span>
                        </label>

                        <div className="flex items-center gap-2 flex-1 sm:justify-end">
                          <input
                            type="time"
                            disabled={!dayConfig.active}
                            value={dayConfig.fromTime}
                            onChange={(e) => {
                              setDifferentScheduleDays({
                                ...differentScheduleDays,
                                [day]: {
                                  ...dayConfig,
                                  fromTime: e.target.value
                                }
                              });
                            }}
                            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 font-medium text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-400 w-28"
                          />
                          <span className="text-slate-400 text-xs font-medium">to</span>
                          <input
                            type="time"
                            disabled={!dayConfig.active}
                            value={dayConfig.toTime}
                            onChange={(e) => {
                              setDifferentScheduleDays({
                                ...differentScheduleDays,
                                [day]: {
                                  ...dayConfig,
                                  toTime: e.target.value
                                }
                              });
                            }}
                            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 font-medium text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-400 w-28"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end shrink-0">
              <button
                onClick={() => setAvailabilityModalOpen(false)}
                className="flex-1 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
                disabled={submittingAvailability}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvailability}
                disabled={submittingAvailability}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2"
              >
                {submittingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Availability"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Prep Notes Modal */}
      {notesModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col mx-4 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" /> Prep Notes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {notesStudentName} — {notesTopic}
                </p>
              </div>
              <button
                onClick={() => setNotesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {notesError && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{notesError}</p>
              </div>
            )}

            {notesSaved && (
              <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-start gap-2">
                <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-600 font-medium">Notes saved successfully!</p>
              </div>
            )}

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {loadingNotes ? (
                <div className="py-8 flex flex-col items-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading notes...</span>
                </div>
              ) : (
                <>
                  {/* Shared with Student */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                        <User className="w-3 h-3" /> Shared with Student
                      </div>
                      <span className="text-xs text-slate-400">Visible on student&apos;s profile</span>
                    </div>
                    <textarea
                      className="w-full text-sm text-slate-700 bg-white border border-emerald-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                      rows={4}
                      value={notesShared}
                      onChange={(e) => { setNotesShared(e.target.value); setNotesSaved(false); }}
                      placeholder="Enter notes to share with student..."
                    />
                  </div>

                  {/* Internal Note */}
                  <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-orange-600 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 bg-orange-100/50">
                        <Lock className="w-3 h-3" /> Internal Note Only
                      </div>
                      <span className="text-xs text-slate-400">Not visible to student</span>
                    </div>
                    <textarea
                      className="w-full text-sm text-slate-700 bg-white border border-orange-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                      rows={4}
                      value={notesInternal}
                      onChange={(e) => { setNotesInternal(e.target.value); setNotesSaved(false); }}
                      placeholder="Enter internal prep notes..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end shrink-0">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="flex-1 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
                disabled={savingNotes}
              >
                Close
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes || loadingNotes}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2"
              >
                {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Notes"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}