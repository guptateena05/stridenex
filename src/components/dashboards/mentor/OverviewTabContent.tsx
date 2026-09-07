"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUpcomingSessions, getPendingRequests, rescheduleSession, getMentorDashboardStats, getMentorPendingVerifications, getMentorDashboardData } from "@/services/mentor.services";
import { useToast } from "@/context/ToastContext";

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  GraduationCap,
  Calendar,
  Star,
  IndianRupee,
  Clock,
  Video,
  ChevronRight,
  TrendingUp,
  FileText,
  CheckCircle,
  Activity,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";

// Dummy Data for fallback
const defaultOverviewStats = [
  { label: "TOTAL STUDENTS MENTORED", value: "0", trend: "+0 this month", trendUp: true, icon: GraduationCap, iconBg: "bg-orange-50", iconColor: "text-orange-600", borderStyle: "border-t-4 border-t-slate-800" },
  { label: "SESSIONS THIS MONTH", value: "0", trend: "0 upcoming", trendUp: true, icon: Calendar, iconBg: "bg-blue-50", iconColor: "text-blue-600", borderStyle: "border-t-4 border-t-blue-500" },
  { label: "AVERAGE RATING", value: "0/5", trend: "from 0 reviews", trendUp: true, icon: Star, iconBg: "bg-yellow-50", iconColor: "text-yellow-600", borderStyle: "border-t-4 border-t-amber-400" },
  { label: "PENDING PAYOUT (FEB)", value: "₹0.00", trend: "released Mar 1", trendUp: true, icon: IndianRupee, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", borderStyle: "border-t-4 border-t-emerald-500" }
];

const upcomingSessions = [
  { id: "PS", initials: "PS", name: "Priya Sharma", topic: "ML Project Milestone Review", date: "Feb 26 4:00 PM", duration: "60 min", type: "Technical", color: "bg-orange-500" },
  { id: "AN", initials: "AN", name: "Arjun Nair", topic: "FAANG Prep Check-In", date: "Feb 27 3:00 PM", duration: "45 min", type: "Career", color: "bg-blue-500" },
  { id: "TG", initials: "TG", name: "Tanya Gupta", topic: "Data Science Roadmap", date: "Mar 1 12:00 PM", duration: "60 min", type: "Career", color: "bg-emerald-500" },
  { id: "RV", initials: "RV", name: "Rohan Verma", topic: "DSA: Trees & Graphs", date: "Mar 2 5:00 PM", duration: "90 min", type: "Technical", color: "bg-purple-500" }
];


const pendingRequests = [
  { initials: "AK", name: "Aisha Khan", topic: "Product Management Intro", priority: "high", color: "bg-pink-100 text-pink-700" },
  { initials: "RM", name: "Rahul Mehta", topic: "DSA Mock Interview", priority: "medium", color: "bg-blue-100 text-blue-700" },
  { initials: "TG", name: "Tanya Gupta", topic: "Career Switch Counselling", priority: "medium", color: "bg-emerald-100 text-emerald-700" }
];

// verifyQueue is now fetched dynamically from API and managed as a state variable in OverviewTabContent

const thisMonthStats = [
  { label: "Sessions completed", value: "18", icon: GraduationCap },
  { label: "5-star reviews", value: "14", icon: Star },
  { label: "Notes shared", value: "22", icon: FileText },
  { label: "Skills verified", value: "6", icon: CheckCircle },
  { label: "Hours mentored", value: "21h", icon: Clock },
  { label: "Profile views", value: "840", icon: Activity }
];

export default function OverviewTabContent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [verifyQueue, setVerifyQueue] = useState<any[]>([]);
  const [totalPendingCount, setTotalPendingCount] = useState<number>(0);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [payoutData, setPayoutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      const email = currentUser || localStorage.getItem("userEmail") || "";
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

  useEffect(() => {
    const fetchData = async () => {
      const email = currentUser || localStorage.getItem("userEmail") || "";
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const [upcomingRes, pendingRes, statsRes, verifyQueueRes, payoutDataRes] = await Promise.all([
          getUpcomingSessions(email).catch(e => { console.error(e); return null; }),
          getPendingRequests(email, 3).catch(e => { console.error(e); return null; }),
          getMentorDashboardStats(email).catch(e => { console.error(e); return null; }),
          getMentorPendingVerifications(email, 3).catch(e => { console.error(e); return null; }),
          getMentorDashboardData(email).catch(e => { console.error(e); return null; })
        ]);
        if (upcomingRes?.message && Array.isArray(upcomingRes.message)) {
          setUpcoming(upcomingRes.message);
        } else {
          setUpcoming([]);
        }
        if (pendingRes?.message) {
          setPending(pendingRes.message.records || []);
          setPendingRequestsCount(pendingRes.message.total_pending_count || 0);
        } else {
          setPending([]);
          setPendingRequestsCount(0);
        }
        if (statsRes?.message) {
          setDashboardStats(statsRes.message);
        }
        if (verifyQueueRes?.message) {
          setVerifyQueue(verifyQueueRes.message.records || []);
          setTotalPendingCount(verifyQueueRes.message.total_pending_count || 0);
        } else {
          setVerifyQueue([]);
          setTotalPendingCount(0);
        }
        if (payoutDataRes) {
          setPayoutData(payoutDataRes);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "??";
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const getRandomColorClass = (name: string) => {
    const colors = [
      "bg-pink-100 text-pink-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-indigo-100 text-indigo-700",
      "bg-amber-100 text-amber-700"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const dynamicUpcomingSessions = (Array.isArray(upcoming) ? upcoming : []).slice(0, 4).map((s, index) => {
    const studentName = s.student_full_name || s.student_name || (s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : null) || s.student?.split('@')[0] || "Unknown";
    const initials = getInitials(studentName);
    const colors = ["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500"];
    const color = colors[index % colors.length];

    const dateObj = new Date(s.session_date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeStr = formatTime(s.from_time);

    return {
      id: s.name,
      initials,
      name: studentName,
      mentor: s.mentor || "",
      student: s.student || "",
      topic: s.topic || "Session",
      date: `${dateStr} ${timeStr}`,
      duration: `${s.duration} min`,
      type: "Mentorship",
      color,
      meeting_link: s.meeting_link
    };
  });

  const dynamicPendingRequests = (Array.isArray(pending) ? pending : []).slice(0, 3).map((req) => {
    const name = req.student_name || "Student";
    const priority = req.priority || 'Normal';

    const dateObj = req.session_date ? new Date(req.session_date) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    const timeStr = req.from_time ? formatTime(req.from_time) : "";

    return {
      initials: getInitials(name),
      name,
      topic: req.topic || "Mentorship Session",
      priority: priority.toLowerCase(),
      color: getRandomColorClass(name),
      sessionDate: dateStr,
      sessionTime: timeStr,
      sessionType: req.session_type || "",
      amountPaid: req.amount_paid ?? null,
      offeringTitle: req.offering_title || ""
    };
  });

  const parseINR = (str: string) => {
    if (!str) return 0;
    const numStr = str.replace(/[₹,]/g, "");
    const val = parseFloat(numStr);
    return isNaN(val) ? 0 : val;
  };

  const latestHistory = payoutData?.history?.[0];
  const currentMonthLive = payoutData?.summary?.current_month_live || "₹0";
  const liveNetVal = parseINR(currentMonthLive);
  const liveGrossVal = Math.round(liveNetVal / 0.85);
  const liveCommissionVal = liveGrossVal - liveNetVal;

  const currentMonthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const dynamicOverviewStats = [
    {
      label: "TOTAL STUDENTS MENTORED",
      value: dashboardStats?.total_students_mentored?.toString() || defaultOverviewStats[0].value,
      trend: `+${dashboardStats?.this_month_mentored_students || 0} this month`,
      trendUp: true,
      icon: GraduationCap,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      borderStyle: "border-t-4 border-t-slate-800"
    },
    {
      label: "SESSIONS THIS MONTH",
      value: dashboardStats?.sessions_this_month?.toString() || defaultOverviewStats[1].value,
      trend: `${dashboardStats?.upcoming_sessions || 0} upcoming`,
      trendUp: true,
      icon: Calendar,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderStyle: "border-t-4 border-t-blue-500"
    },
    {
      label: "AVERAGE RATING",
      value: dashboardStats?.this_month?.five_star_reviews ? "5/5" : "0/5",
      trend: `from ${dashboardStats?.this_month?.five_star_reviews || 0} reviews`,
      trendUp: true,
      icon: Star,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderStyle: "border-t-4 border-t-amber-400"
    },
    {
      label: latestHistory?.month
        ? `PENDING PAYOUT (${latestHistory.month.split(" ")[0].toUpperCase()})`
        : "PENDING PAYOUT",
      value: payoutData?.summary?.pending_payout || "₹0.00",
      trend: latestHistory?.date && latestHistory?.date !== "TBD"
        ? `Releases ${latestHistory.date}`
        : "Processing",
      trendUp: true,
      icon: IndianRupee,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderStyle: "border-t-4 border-t-emerald-500"
    }
  ];

  const dynamicThisMonthStats = [
    { label: "Sessions completed", value: dashboardStats?.this_month?.sessions_completed?.toString() || "0", icon: GraduationCap },
    { label: "5-star reviews", value: dashboardStats?.this_month?.five_star_reviews?.toString() || "0", icon: Star },
    { label: "Skills verified", value: dashboardStats?.this_month?.skills_verified?.toString() || "0", icon: CheckCircle },
    { label: "Hours mentored", value: dashboardStats?.this_month?.hours_mentored || "0.0h", icon: Clock }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicOverviewStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${stat.borderStyle} flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" /> Upcoming Sessions
              </h3>
              <button
                onClick={() => router.push('/mentor/dashboard/schedule')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Manage Schedule <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading upcoming sessions...</div>
              ) : dynamicUpcomingSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No upcoming sessions.</div>
              ) : dynamicUpcomingSessions.map((session, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <div className={`w-10 h-10 rounded-full ${session.color} flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1`}>
                      {session.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{session.name}</h4>
                      <p className="text-sm text-slate-600 mb-2">{session.topic}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          <Calendar className="w-3 h-3" /> {session.date}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" /> {session.duration}
                        </span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                          {session.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center ml-14 sm:ml-0">
                    {session.meeting_link && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Video className="w-4 h-4" /> Join
                      </a>
                    )}
                    <button
                      onClick={() => handleRescheduleClick(session.id, session.mentor, session.student)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Requests */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Video className="w-4 h-4 text-orange-500" /> Pending Requests
                </h3>
                <button
                  onClick={() => router.push('/mentor/dashboard/requests')}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 flex-1 space-y-4">
                {loading ? (
                  <div className="py-4 text-center text-sm text-slate-500">Loading requests...</div>
                ) : dynamicPendingRequests.length === 0 ? (
                  <div className="py-4 text-center text-sm text-slate-500">No pending requests.</div>
                ) : dynamicPendingRequests.map((req, i) => (
                  <div key={i} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${req.color} flex items-center justify-center font-bold text-xs shrink-0`}>
                          {req.initials}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{req.name}</h4>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]" title={req.topic}>{req.topic}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md shrink-0 ${req.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        {req.priority}
                      </span>
                    </div>
                    <div className="mt-2 ml-12 flex flex-wrap items-center gap-2">
                      {req.sessionDate && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3" />{req.sessionDate}{req.sessionTime ? ` ${req.sessionTime}` : ""}
                        </span>
                      )}
                      {req.sessionType && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {req.sessionType}
                        </span>
                      )}
                      {req.amountPaid !== null && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          ₹{req.amountPaid}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 pt-0">
                <button
                  onClick={() => router.push('/mentor/dashboard/requests')}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {pendingRequestsCount} Pending — Review Now
                </button>
              </div>
            </motion.div>

            {/* Skill Verify Queue */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-slate-500" /> Skill Verify Queue
                </h3>
                <button
                  onClick={() => router.push('/mentor/dashboard/requests')}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 flex-1 space-y-4">
                {loading ? (
                  <div className="py-4 text-center text-sm text-slate-500">Loading queue...</div>
                ) : verifyQueue.length === 0 ? (
                  <div className="py-4 text-center text-sm text-slate-500">No pending verifications.</div>
                ) : verifyQueue.map((item, i) => (
                  <div key={item.evidence_name} className="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-400" />
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800">{item.student_name}</h4>
                        <p className="text-xs text-slate-500">{item.skill}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600">
                      {item.evidence_type}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-5 pt-0">
                <button
                  onClick={() => router.push('/mentor/dashboard/requests')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {totalPendingCount} Awaiting Review
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Earnings Widget */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600 bg-emerald-50 rounded" /> {currentMonthName} Earnings
              </h3>
            </div>
            <div className="p-6 text-center">
              <h2 className="text-4xl font-extrabold text-emerald-500 mb-1">{currentMonthLive}</h2>
              <p className="text-xs text-slate-500 mb-6">Net payout • Live estimate</p>

              <div className="space-y-3 mb-6">
                {[
                  { label: "Gross Earned", value: "₹" + liveGrossVal.toLocaleString("en-IN") },
                  {
                    label: "Platform Commission (15%)",
                    value: liveCommissionVal > 0 ? "-₹" + liveCommissionVal.toLocaleString("en-IN") : "-₹0",
                    valueColor: "text-red-500"
                  },
                  {
                    label: "Net to Bank",
                    value: currentMonthLive,
                    valueColor: "text-emerald-600",
                    bold: true
                  }
                ].map((detail, i) => (
                  <div key={i} className={`flex justify-between items-center text-sm ${detail.bold ? 'font-bold pt-3 border-t border-slate-100' : 'text-slate-600'}`}>
                    <span>{detail.label}</span>
                    <span className={detail.valueColor || 'text-slate-800 font-medium'}>{detail.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50/50 rounded-lg text-left">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-bold">Commission Breakdown:</span> Stridenex charges 15% on all bookings for platform access, AI matching, payment processing, and student trust & safety. Rate reduces to 12% above ₹50k/month.
                </p>
              </div>
            </div>
          </motion.div>

          {/* This Month Summary */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> This Month
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {dynamicThisMonthStats.map((stat, i) => (
                <div key={i} className="px-5 py-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <stat.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">{stat.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

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
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{rescheduleError}</p>
              </div>
            )}

            <div className="p-5 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  style={{ textTransform: 'uppercase' }}
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
    </div>
  );
}
