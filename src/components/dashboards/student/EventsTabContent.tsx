"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Clock,
  Trophy,
  Bell,
  Megaphone,
  ChevronRight,
  Sparkles,
  Eye,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { BaseCard } from "@/components/dashboards/shared/BaseCard";
import { CardHeader } from "@/components/dashboards/shared/CardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMasterData, getStudentByEmail, createStudentEventRegistration, getCollegeEventList } from "@/services/student.services";
import { useAuth } from "@/context/AuthContext";

// Types
interface Event {
  id: number;
  title: string;
  type: "Hackathon" | "Competition" | "Pitch Battle" | "Case Study" | "Workshop";
  daysLeft: number;
  date: string;
  participants: string;
  prize: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
  registrationStatus: string;
  name: string; // Document name
  college?: string;
  description?: string;
  location?: string;
}

interface Notice {
  id: number;
  title: string;
  category: "Placement" | "Events" | "Academic" | "Compliance";
  date: string;
  icon: any;
  color: string;
}

// Notice board data
const mockNotices: Notice[] = [
  {
    id: 1,
    title: "VJTI-TCS iON Internship Drive – Applications Open",
    category: "Placement",
    date: "Feb 24",
    icon: Bell,
    color: "text-blue-600"
  },
  {
    id: 2,
    title: "HackIndia 2025 – Team Formation Begins",
    category: "Events",
    date: "Feb 22",
    icon: Megaphone,
    color: "text-orange-600"
  },
  {
    id: 3,
    title: "NEP 2020 Workshop: Credit Transfer & ABC Portal",
    category: "Academic",
    date: "Feb 23",
    icon: Calendar,
    color: "text-purple-600"
  },
  {
    id: 4,
    title: "UGC Equity Audit: Equal Opportunity Centre Open",
    category: "Compliance",
    date: "Feb 20",
    icon: Bell,
    color: "text-emerald-600"
  }
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

const getNoticeStyles = (type: string) => {
  switch (type) {
    case "Placement":
      return { icon: Bell, color: "text-blue-600" };
    case "Events":
      return { icon: Megaphone, color: "text-orange-600" };
    case "Academic":
      return { icon: Calendar, color: "text-purple-600" };
    case "Compliance":
      return { icon: Bell, color: "text-emerald-600" };
    default:
      return { icon: Bell, color: "text-slate-600" };
  }
};

const getEventStyles = (type: string) => {
  const styles: Record<string, any> = {
    "Hackathon": { color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    "Competition": { color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    "Pitch Battle": { color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    "Case Study": { color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
    "Workshop": { color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" }
  };
  return styles[type] || { color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-200" };
};

const calculateDaysLeft = (dateString: string) => {
  if (!dateString) return 0;
  try {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  } catch (e) {
    return 0;
  }
};

export default function EventsTabContent() {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [studentCollege, setStudentCollege] = useState<string>("");
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRegister = async (event: Event) => {
    if (!currentUser) {
      alert("Authentication Required: Please log in to register for events.");
      return;
    }

    try {
      setRegisteringId(event.name);
      const payload = {
        student: currentUser,
        event: event.name,
        college: studentCollege || event.college || "", 
        status: "Register"
      };

      const response = await createStudentEventRegistration(payload);

      if (response && (response.status === 200 || response.status === "200" || response.message?.status === 200)) {
        setRegisteredEventIds(prev => [...prev, event.name]);
        setFeedback({
          type: 'success',
          message: `Successfully registered for ${event.title}!`
        });
        // Refresh events to get updated registration status
        fetchInitialData();
      } else {
        setFeedback({
          type: 'error',
          message: response?.message || "Registration failed. Please try again."
        });
      }

      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error("Registration error:", err);
      setFeedback({
        type: 'error',
        message: err?.message || "Registration failed. Please try again."
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setRegisteringId(null);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Use currentUser from context if available, otherwise fallback to localStorage
      const email = currentUser || localStorage.getItem("currentUser") || "";

      if (!email) {
        setLoading(false);
        return;
      }

      // 1. Fetch student details to get the college
      const studentRes = await getStudentByEmail(email);
      const collegeName = studentRes?.message?.data?.college;

      if (collegeName) {
        setStudentCollege(collegeName);
        // 2. Fetch notices and events for that specific college in parallel
        await Promise.all([
          fetchNotices(collegeName),
          fetchEvents(collegeName)
        ]);
      } else {
        console.warn("No college found for student:", email);
        setNotices([]);
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotices = async (college: string) => {
    try {
      const response = await getMasterData("College Notice", {
        filters: { college: college },
        fields: ["college", "notice", "notice_type", "date"]
      });

      const apiData = response?.data || response?.message || [];
      if (Array.isArray(apiData)) {
        const mappedNotices: Notice[] = apiData.map((item: any, index: number) => {
          const styles = getNoticeStyles(item.notice_type);
          return {
            id: index + 1,
            title: item.notice || "Untitled Notice",
            category: item.notice_type || "General",
            date: item.date || "",
            icon: styles.icon,
            color: styles.color
          };
        });
        setNotices(mappedNotices);
      } else {
        setNotices([]);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      setNotices([]);
    }
  };

  const fetchEvents = async (college: string) => {
    try {
      const email = currentUser || localStorage.getItem("currentUser") || "";
      if (!email) return;

      const response = await getCollegeEventList(college, email);
      const eventsList = response?.data?.events || response?.message?.data?.events || response?.events || (Array.isArray(response?.data) ? response.data : []);
      
      if (Array.isArray(eventsList)) {
        const mappedEvents: Event[] = eventsList.map((item: any, index: number) => {
          const styles = getEventStyles(item.event_type);
          return {
            id: index + 1,
            name: item.name,
            title: item.event || "Untitled Event",
            type: item.event_type || "Event",
            college: item.college,
            daysLeft: calculateDaysLeft(item.start_date),
            date: `${item.start_date}${item.end_date ? ` - ${item.end_date}` : ''}`,
            participants: "Join Now",
            prize: item.price || "Exciting Rewards",
            registrationStatus: item.registration_status || "Not Registered",
            description: item.description || "Detailed information about this event will be updated soon.",
            location: item.location || "Campus / Virtual",
            ...styles,
            icon: Trophy
          };
        });
        setEvents(mappedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
            } text-sm font-medium mb-4 flex items-center justify-between shadow-sm`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Sparkles className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {feedback.message}
          </div>
          <button onClick={() => setFeedback(null)} className="ml-4 opacity-50 hover:opacity-100 font-bold">×</button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-slate-800">Events & Competitions</h1>
        <p className="text-slate-500 mt-1">Inter-college hackathons, pitch battles, and case studies</p>
      </motion.div>

      {/* Events Grid */}
      <motion.div variants={item}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-200">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
            <p className="text-slate-500 font-medium tracking-wide">Syncing events & competitions...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((event) => {
              const Icon = event.icon;
              return (
                <BaseCard key={event.id} className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className="p-5">
                    {/* Header with Type and Days Left */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg ${event.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${event.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{event.title}</h3>
                          <p className="text-xs text-slate-500">{event.type}</p>
                        </div>
                      </div>
                      {event.daysLeft > 0 && (
                        <Badge variant="outline" className={`${event.bgColor} ${event.color} border-${event.borderColor} font-medium`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {event.daysLeft} days left
                        </Badge>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{event.participants}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">{event.prize}</span>
                      </div>
                    </div>

                    {/* Action Buttons - Register Now and Details */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleRegister(event)}
                        disabled={
                          registeringId === event.name || 
                          registeredEventIds.includes(event.name) || 
                          event.registrationStatus === "Register"
                        }
                        className={`flex-1 ${
                          registeredEventIds.includes(event.name) || event.registrationStatus === "Register"
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-orange-500 hover:bg-orange-600'
                          } text-white shadow-sm active:scale-95 transition-all font-bold rounded-xl`}
                      >
                        {registeringId === event.name ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (registeredEventIds.includes(event.name) || event.registrationStatus === "Register") ? (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        ) : null}
                        {registeredEventIds.includes(event.name) || event.registrationStatus === "Register" ? "Registered" : "Register Now"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedEventForDetails(event)}
                        className="px-4 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-orange-600 hover:border-orange-200 transition-all active:scale-95 shadow-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </BaseCard>
              );
            })}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-3xl">
            <Trophy className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No Events Found</h3>
            <p className="text-sm text-slate-500">There are no upcoming events or competitions at the moment.</p>
          </div>
        )}
      </motion.div>

      {/* Digital Notice Board */}
      <motion.div variants={item} className="mt-8">
        <CardHeader
          title="Digital Notice Board"
          icon={<Bell className="w-4 h-4 text-orange-500" />}
          action={{ label: "View All" }}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-200 mt-4">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
            <p className="text-sm text-slate-500 font-medium">Fetching notices...</p>
          </div>
        ) : notices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {notices.map((notice) => {
              const Icon = notice.icon;
              return (
                <BaseCard key={notice.id} className="hover:shadow-md transition-all cursor-pointer group">
                  <div className="p-4 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${notice.color.replace('text', 'bg').replace('600', '50')} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${notice.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-2">{notice.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0">
                          {notice.category}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-medium">{notice.date}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                  </div>
                </BaseCard>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center bg-white/50 rounded-2xl border border-dashed border-slate-200 mt-4">
            <Bell className="w-10 h-10 text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Notices Posted</h3>
            <p className="text-xs text-slate-500">Check back later for updates from your college.</p>
          </div>
        )}
      </motion.div>

      {/* Featured Event - Hidden temporarily as requested */}
      {/* <motion.div variants={item} className="mt-6">
        <BaseCard className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100">
          <div className="p-5 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Tech Summit 2025</h3>
                <p className="text-sm text-slate-600 mt-1">India's largest student tech conference</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Apr 5-7</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    <span>500+ colleges</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300 transition-all"
              >
                <Eye className="w-4 h-4 mr-1" />
                Details
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Register
              </Button>
            </div>
          </div>
        </BaseCard>
      </motion.div> */}

      {/* Event Details Modal */}
      {selectedEventForDetails && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedEventForDetails(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden z-10"
          >
            {/* Modal Header */}
            <div className={`p-6 ${selectedEventForDetails.bgColor} border-b ${selectedEventForDetails.borderColor} relative`}>
              <button 
                onClick={() => setSelectedEventForDetails(null)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 bg-white/50 hover:bg-white rounded-full transition-colors font-bold"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center ${selectedEventForDetails.color}`}>
                  {selectedEventForDetails.icon && <selectedEventForDetails.icon className="w-7 h-7" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 pr-8">{selectedEventForDetails.title}</h2>
                  <Badge variant="outline" className={`mt-2 ${selectedEventForDetails.bgColor} ${selectedEventForDetails.color} border-${selectedEventForDetails.borderColor} font-bold`}>
                    {selectedEventForDetails.type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Event Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Date & Time</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedEventForDetails.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Location</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedEventForDetails.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <IndianRupee className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Prize Pool</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedEventForDetails.prize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Eligibility</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedEventForDetails.participants}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">About the Event</h3>
                <div className="text-sm text-slate-600 leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar bg-slate-50/50 p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: selectedEventForDetails.description || '' }}>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedEventForDetails(null)}
                className="font-bold border-slate-200"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const eventToRegister = selectedEventForDetails;
                  setSelectedEventForDetails(null);
                  handleRegister(eventToRegister);
                }}
                disabled={
                  registeringId === selectedEventForDetails.name || 
                  registeredEventIds.includes(selectedEventForDetails.name) || 
                  selectedEventForDetails.registrationStatus === "Register"
                }
                className={`font-bold shadow-sm ${
                  registeredEventIds.includes(selectedEventForDetails.name) || selectedEventForDetails.registrationStatus === "Register"
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white`}
              >
                {registeredEventIds.includes(selectedEventForDetails.name) || selectedEventForDetails.registrationStatus === "Register" ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Registered</>
                ) : (
                  "Register Now"
                )}
              </Button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}