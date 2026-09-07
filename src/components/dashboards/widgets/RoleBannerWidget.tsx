// components/dashboards/widgets/RoleBannerWidget.tsx
"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Flame,
  Check,
  Briefcase,
  Users,
  Building2,
  GraduationCap,
  Target,
  Award,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Pen,
  Mail,
  Phone,
  Shield,
  FileText,
  Layers,
  Globe,
  MapPin,
  Github,
  Linkedin,
  User,
  CreditCard,
  Eye
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getStudentByEmail, updateStudent, mapYearToWord, getDashboardStats } from "@/services/student.services";
import { updateIndustry } from "@/services/industry.services";
import { getMentorByEmail, getMentorDashboardStats, updateMentor } from "@/services/mentor.services";
import { getCollegeDetails, updateCollegeDetails, getPlacementStats, getDashboardSummary } from "@/services/college.services";
import DashboardDynamicModal, { DynamicField } from "@/components/dashboards/shared/DashboardDynamicModal";
import { useToast } from "@/context/ToastContext";
import { OperatingHoursTable, OperatingHour } from "@/components/dashboards/shared/OperatingHoursTable";
import ProfileImageUploader from "@/components/profile/ProfileImageUploader";
import MarksheetUploader from "@/components/profile/MarksheetUploader";
import { buildProfileImageUrl, uploadFileApi, BASE_DOMAIN } from "@/services/api.services";


import { createPortal } from "react-dom";

interface BannerMetric {
  key: string;
  value: string | number;
  label: string;
  icon?: any;
  color?: string;
}

interface RoleBannerWidgetProps {
  role: "student" | "college" | "mentor" | "industry";
  customData?: {
    title?: string;
    subtitle?: string | React.ReactNode;
    metrics?: BannerMetric[];
    profileProgress?: number;
    rawIndustryData?: any;
    onUpdateSuccess?: () => Promise<void>;
    fields?: DynamicField[];
  };
  onlyModal?: boolean;
}

const roleConfig = {
  student: {
    greeting: "Good Morning",
    roleName: "Student",
    icon: GraduationCap,
    gradient: "from-[#1e3a8a] to-[#0a1929]",
    accentColor: "orange",
    textColor: "text-blue-200",
    progressBg: "bg-blue-900/50",
    progressBorder: "border-blue-800/50",
    metrics: [
      { key: "employability", default: 73, label: "Employability", icon: TrendingUp },
      { key: "streak", default: 18, label: "Day Streak", icon: Flame },
      { key: "verified", default: 6, label: "Verified Skills", icon: Check }
    ],
    defaultTitle: "Student",
    defaultSubtitle: "B.Tech CSE • 3rd Year • VJTI Mumbai",
    defaultProgress: 78
  },
  college: {
    greeting: "Good Morning",
    roleName: "College Admin",
    icon: Building2,
    gradient: "from-[#0d4f30] to-[#10b981]", // A deep vibrant green gradient
    accentColor: "emerald",
    textColor: "text-emerald-100", // Soft text on the green gradient
    progressBg: "bg-emerald-900/50",
    progressBorder: "border-emerald-800/50",
    metrics: [
      { key: "students", default: "2,847", label: "Active Students", icon: Users },
      { key: "placements", default: "0%", label: "Placement Rate", icon: Briefcase }, // Updated default value based on new screenshot
      { key: "partners", default: "0%", label: "Avg Employability", icon: TrendingUp } // Updated generic metric based on new screenshot
    ],
    defaultTitle: "Veermata Jijabai Technological Institute",
    defaultSubtitle: "Mumbai University Affiliate • NAAC A++ • Estd. 1887",
    defaultProgress: 68
  },
  mentor: {
    greeting: "Good Morning",
    roleName: "Verified Mentor",
    icon: Users,
    gradient: "from-[#2e1065] to-[#4c1d95]", // Deep violet
    accentColor: "violet",
    textColor: "text-violet-200",
    progressBg: "bg-violet-900/50",
    progressBorder: "border-violet-800/50",
    metrics: [
      { key: "students", default: 0, label: "Total Students", icon: Users },
      { key: "sessions", default: 0, label: "Sessions Done", icon: Calendar },
      { key: "rating", default: "—", label: "Avg Rating", icon: Award }
    ],
    defaultTitle: "Mentor Profile",
    defaultSubtitle: "Verified Mentor",
    defaultProgress: 100
  },
  industry: {
    greeting: "Industry Portal",
    roleName: "Recruiter",
    icon: Building2,
    gradient: "from-[#1e1b4b] to-[#312e81]", // Deep purplish blue
    accentColor: "purple",
    textColor: "text-blue-200",
    progressBg: "bg-purple-900/50",
    progressBorder: "border-purple-800/50",
    metrics: [
      { key: "positions", default: 8, label: "Open Roles", icon: Briefcase },
      { key: "applications", default: 247, label: "Applications", icon: Users },
      { key: "match", default: "00%", label: "Match Quality", icon: Target }
    ],
    defaultTitle: "Razorpay Technologies",
    defaultSubtitle: "Fintech • Bengaluru • 2000+ employees • Industry Pro Plan",
    defaultProgress: 100
  }
};

export default function RoleBannerWidget({ role, customData, onlyModal = false }: RoleBannerWidgetProps) {
  const { fullName, currentUser, userImage } = useAuth();
  const config = roleConfig[role];
  const profileImageUrl = buildProfileImageUrl(userImage);

  // Student specific state
  const [studentData, setStudentData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("studentDetails");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (_) { }
      }
    }
    return null;
  });
  const [statsData, setStatsData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("studentStats");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (_) { }
      }
    }
    return null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isResumeDropdownOpen, setIsResumeDropdownOpen] = useState(false);
  const { showToast } = useToast();
  const [showCompletenessPopup, setShowCompletenessPopup] = useState(false);

  // Mentor specific state
  const [mentorData, setMentorData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mentorDetails");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (_) { }
      }
    }
    return null;
  });
  const [mentorStats, setMentorStats] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mentorStats");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (_) { }
      }
    }
    return null;
  });

  // College specific state
  const [collegeData, setCollegeData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("collegeDetails");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (_) { }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      if (role === "college" && localStorage.getItem("collegeDetails")) return false;
      if (role === "student" && localStorage.getItem("studentDetails")) return false;
      if (role === "mentor" && localStorage.getItem("mentorDetails")) return false;
    }
    return true;
  });
  const [placementStats, setPlacementStats] = useState<any>(null);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [collegeFormState, setCollegeFormState] = useState<any>({});
  const [mentorFormState, setMentorFormState] = useState<any>({});
  const [studentFormState, setStudentFormState] = useState<any>({});
  const [studentDepartmentOptions, setStudentDepartmentOptions] = useState<Array<{
    value: string;
    label: string;
    academicYears: string;
    semester: string;
  }>>([]);

  const fetchStudentData = async () => {
    const email = currentUser || (typeof window !== "undefined" ? (localStorage.getItem("currentUser") || localStorage.getItem("userEmail")) : "") || "";
    if (role !== "student" || !email) return;
    try {
      const response = await getStudentByEmail(email);
      // Handle the nested structure: response.message.data
      const data = response?.data || response?.message?.data || response?.message;
      if (data && typeof data === 'object') {
        setStudentData(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem("studentDetails", JSON.stringify(data));
        }
      }

      // Fetch student stats
      const statsRes = await getDashboardStats(email);
      const stats = statsRes?.data || statsRes?.message;
      if (stats) {
        setStatsData(stats);
        if (typeof window !== 'undefined') {
          localStorage.setItem("studentStats", JSON.stringify(stats));
          window.dispatchEvent(new Event("student-stats-updated"));
        }
      }
    } catch (error) {
      console.error("Error fetching student data in banner:", error);
    }
  };

  const fetchMentorData = async () => {
    const email = currentUser || (typeof window !== "undefined" ? (localStorage.getItem("currentUser") || localStorage.getItem("userEmail")) : "") || "";
    if (role !== "mentor" || !email) return;
    try {
      const [profileRes, statsRes] = await Promise.all([
        getMentorByEmail(email),
        getMentorDashboardStats(email).catch(() => null)
      ]);
      const profileData = profileRes?.message?.data || profileRes?.message || null;
      if (profileData && typeof profileData === 'object') {
        setMentorData(profileData);
        if (typeof window !== 'undefined') {
          localStorage.setItem("mentorDetails", JSON.stringify(profileData));
        }
      }
      const statsData = statsRes?.message?.data || statsRes?.message || null;
      if (statsData) {
        setMentorStats(statsData);
        if (typeof window !== 'undefined') {
          localStorage.setItem("mentorStats", JSON.stringify(statsData));
        }
      }
    } catch (error) {
      console.error("Error fetching mentor data in banner:", error);
    }
  };

  const fetchCollegeData = async () => {
    const email = currentUser || (typeof window !== "undefined" ? (localStorage.getItem("currentUser") || localStorage.getItem("userEmail")) : "") || "";
    if (role !== "college" || !email) return;
    try {
      const response = await getCollegeDetails(email);
      const data = response?.data || response?.message?.data || response?.message;
      if (data && typeof data === 'object') {
        setCollegeData(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem("collegeDetails", JSON.stringify(data));
          window.dispatchEvent(new Event("college-details-fetched"));
        }

        const collegeName = data.college_name || data.name || data.email || email;
        const collegeEmail = data.email || email;
        const [statsRes, summaryRes] = await Promise.allSettled([
          getPlacementStats(collegeName),
          getDashboardSummary(collegeEmail)
        ]);

        if (statsRes.status === "fulfilled") {
          const raw = statsRes.value?.message ?? statsRes.value;
          if (raw && raw.data) {
            setPlacementStats(raw.data);
          }
        }
        if (summaryRes.status === "fulfilled") {
          const raw = summaryRes.value?.message ?? summaryRes.value;
          if (raw && raw.data) {
            setDashboardSummary(raw.data);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching college data in banner:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const hasCache = typeof window !== "undefined" && (
        (role === "college" && localStorage.getItem("collegeDetails")) ||
        (role === "student" && localStorage.getItem("studentDetails")) ||
        (role === "mentor" && localStorage.getItem("mentorDetails"))
      );
      if (!hasCache) setLoading(true);

      try {
        if (role === "student") {
          await fetchStudentData();
        } else if (role === "mentor") {
          await fetchMentorData();
        } else if (role === "college") {
          await fetchCollegeData();
        }
      } catch (err) {
        console.error("Error loading banner details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, currentUser]);

  useEffect(() => {
    const handleUpdate = () => {
      if (role === "mentor") {
        fetchMentorData();
      }
    };
    window.addEventListener("mentor-profile-updated", handleUpdate);
    return () => window.removeEventListener("mentor-profile-updated", handleUpdate);
  }, [role, currentUser]);

  useEffect(() => {
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener("open-update-profile", handleOpenModal);
    return () => window.removeEventListener("open-update-profile", handleOpenModal);
  }, []);

  useEffect(() => {
    const handleStatsUpdate = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("studentStats");
        if (stored) {
          try {
            setStatsData(JSON.parse(stored));
          } catch (_) { }
        }
      }
    };
    window.addEventListener("student-stats-updated", handleStatsUpdate);
    return () => window.removeEventListener("student-stats-updated", handleStatsUpdate);
  }, []);

  useEffect(() => {
    if (role === "student" && statsData) {
      const completeness = statsData?.profile_completeness;
      if (completeness !== undefined && completeness !== null && Number(completeness) < 60) {
        setShowCompletenessPopup(true);
      } else {
        setShowCompletenessPopup(false);
      }
    }
  }, [role, statsData]);

  const handleCloseCompletenessPopup = () => {
    const completeness = statsData?.profile_completeness ?? 0;
    if (completeness < 50) {
      showToast(`Your profile completeness is currently at ${completeness}%. You must complete your profile to at least 90% to access all dashboard features.`, "error");
      setTimeout(() => {
        setShowCompletenessPopup(true);
      }, 500);
    } else {
      setShowCompletenessPopup(false);
    }
  };

  const handleOpenUpdateProfile = () => {
    setShowCompletenessPopup(false);
    setIsModalOpen(true);
  };

  const handleCloseUpdateProfileModal = () => {
    setIsModalOpen(false);
    const completeness = statsData?.profile_completeness ?? 0;
    if (role === "student" && completeness < 50) {
      setTimeout(() => {
        setShowCompletenessPopup(true);
      }, 500);
    }
  };

  const renderCompletenessPopup = () => {
    if (!showCompletenessPopup) return null;
    return createPortal(
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/30 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Complete Your Profile
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your profile completeness is currently at <strong className="text-orange-600 font-extrabold">{progressValue}%</strong>. You must complete at least <strong className="text-slate-700">90%</strong> of your profile to access all features.
              </p>
            </div>
          </div>

          {/* Progress Bar in pop-up */}
          <div className="mb-6 bg-slate-50 border border-slate-100 p-3 rounded-xl">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>Completeness</span>
              <span className="text-orange-600">{progressValue}% / 90%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (progressValue / 90) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenUpdateProfile}
              className="w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 text-center"
            >
              Complete Profile Now
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  const studentFields: DynamicField[] = useMemo(() => [
    { name: "first_name", label: "First Name", type: "text", icon: Users, required: true, disabled: true },
    { name: "last_name", label: "Last Name", type: "text", icon: Users, required: true, disabled: true },
    { name: "email_id", label: "Email ID", type: "email", icon: Mail, required: true, disabled: true, colSpan: 2 },
    { name: "mobile_no", label: "Mobile No", type: "text", icon: Phone, required: true },
    { name: "college", label: "College", type: "text", icon: Building2, required: true, disabled: true, colSpan: 2 },
    { 
      name: "course_type", 
      label: "Course Type", 
      type: "select", 
      icon: GraduationCap, 
      required: true,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Course Type" },
      mapOptions: (data: any) => {
        let items = Array.isArray(data) ? data : (data?.data?.data || data?.message?.data || data?.message || data?.data || []);
        items = Array.isArray(items) ? items : [];
        return items.map((item: any) => ({ value: item.name || item.course_type, label: item.course_type || item.name }));
      }
    },
    { 
      name: "stream", 
      label: "Stream", 
      type: "select", 
      icon: Layers, 
      required: true,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Stream" },
      mapOptions: (data: any) => {
        let items = Array.isArray(data) ? data : (data?.data?.data || data?.message?.data || data?.message || data?.data || []);
        items = Array.isArray(items) ? items : [];
        return items.map((item: any) => ({ value: item.name, label: item.name }));
      }
    },
    { 
      name: "course", 
      label: "Course", 
      type: "select", 
      icon: GraduationCap, 
      required: true,
      disabled: !studentFormState.stream || !studentFormState.course_type,
      apiEndpoint: (studentFormState.stream && studentFormState.course_type)
        ? "method/stridenex_app.api_stridenex_app.college.master.get_courses_by_type"
        : undefined,
      apiParams: (studentFormState.stream && studentFormState.course_type) ? {
        stream: studentFormState.stream,
        course_type: studentFormState.course_type
      } : undefined,
      mapOptions: (data: any) => {
        const courses = data?.data?.courses || data?.courses || data?.message?.data?.courses || [];
        return courses.map((item: any) => ({ value: item.name, label: item.course_name || item.name }));
      }
    },
    { 
      name: "department", 
      label: "Department", 
      type: "select", 
      icon: Shield, 
      required: true,
      disabled: !studentFormState.course,
      apiEndpoint: studentFormState.course
        ? "method/stridenex_app.stridenex_app.doctype.college_department.college_department.get_departments_by_course"
        : undefined,
      apiParams: studentFormState.course ? {
        courses: studentFormState.course
      } : undefined,
      mapOptions: (data: any) => {
        const depts = data?.data || data?.message?.data || [];
        const deptOptions = depts.map((d: any) => ({
          value: d.name,
          label: d.department_name || d.name,
          academicYears: d.academic_years || "",
          semester: d.semester || "" // Will fallback to empty if missing
        }));
        setStudentDepartmentOptions(deptOptions);
        return deptOptions.map(({ value, label }: { value: string; label: string }) => ({ value, label }));
      }
    },
    { 
      name: "semester", 
      label: "Semester", 
      type: "select", 
      icon: Calendar, 
      required: true,
      disabled: !studentFormState.department,
      apiEndpoint: studentFormState.department
        ? "method/stridenex_app.api_stridenex_app.student.masters.get_semester"
        : undefined,
      apiMethod: "GET",
      apiParams: studentFormState.department ? {
        semester: studentDepartmentOptions.find(d => d.value === studentFormState.department)?.semester || ""
      } : undefined,
      mapOptions: (data: any) => {
        const semesters = data.data || data || [];
        return semesters.map((sem: any) => ({
          value: sem.name,
          label: sem.name
        }));
      }
    },
    { name: "current_year", label: "Current Year", type: "select", icon: Target, options: ["First Year", "Second Year", "Third Year", "Final Year"], required: true },
    { name: "date_of_birth", label: "Date of Birth", type: "date", icon: Calendar, required: true, textTransform: "uppercase" },
    { name: "gender", label: "Gender", type: "select", icon: Users, options: ["Male", "Female", "Other"], required: true, disabled: true },
    { name: "linkedin", label: "LinkedIn URL", type: "url", icon: Linkedin },
    { name: "github", label: "GitHub URL", type: "url", icon: Github },
    { name: "cgpa", label: "CGPA", type: "number", icon: Award, required: true },
    {
      name: "marksheet",
      label: "Upload Marksheet / Result",
      type: "custom",
      colSpan: 2,
      customRender: (formData, onChange) => (
        <MarksheetUploader
          value={formData.marksheet}
          onChange={(val) => onChange(val)}
        />
      )
    },
  ], [studentFormState.course_type, studentFormState.stream, studentFormState.course, studentFormState.department, studentDepartmentOptions]);

  const mentorFields: DynamicField[] = useMemo(() => [
    {
      name: "first_name", label: "First Name", type: "text",
      icon: User, required: true, colSpan: 1, placeholder: "e.g. Kavya"
    },
    {
      name: "last_name", label: "Last Name", type: "text",
      icon: User, required: true, colSpan: 1, placeholder: "e.g. Reddy"
    },
    {
      name: "role", label: "Current Role", type: "text",
      icon: Briefcase, required: false, colSpan: 1, placeholder: "e.g. Senior Software Engineer"
    },
    {
      name: "experience", label: "Experience (Years)", type: "number",
      icon: Award, required: false, colSpan: 1, placeholder: "e.g. 5"
    },
    {
      name: "type", label: "Mentor Type", type: "select",
      icon: Briefcase, required: false, colSpan: 1, placeholder: "Select Type",
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Type" },
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.name }));
      }
    },
    {
      name: "travelling_possible", label: "Willing to Travel", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select",
      options: ["Yes", "No", "Maybe"]
    },
    {
      name: "state", label: "State", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select State",
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "State" },
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.name }));
      }
    },
    {
      name: "district", label: "District", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select District",
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: mentorFormState.state
        ? { doctype: "District", fields: ["name", "district_name"], filters: [["state", "=", mentorFormState.state]], order_by: "district_name asc", limit_page_length: 1000 }
        : undefined,
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.district_name || item.name }));
      },
      disabled: !mentorFormState.state
    },
    {
      name: "tahsil", label: "Taluka", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select Taluka",
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: mentorFormState.district
        ? { doctype: "Tahsil", fields: ["name", "tahsil_name"], filters: [["district", "=", mentorFormState.district]], order_by: "tahsil_name asc", limit_page_length: 1000 }
        : undefined,
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.tahsil_name || item.name }));
      },
      disabled: !mentorFormState.district
    },
    {
      name: "city", label: "City", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select City",
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: mentorFormState.tahsil
        ? { doctype: "City", fields: ["name", "city_name"], filters: [["tahsil", "=", mentorFormState.tahsil]], order_by: "city_name asc", limit_page_length: 1000 }
        : undefined,
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.city_name || item.name }));
      },
      disabled: !mentorFormState.tahsil
    },
    {
      name: "mobile_no", label: "Mobile Number", type: "text",
      icon: Phone, required: false, colSpan: 1, placeholder: "e.g. +91-9876543210"
    },
    {
      name: "profile_description", label: "Bio / Profile Description", type: "textarea",
      icon: FileText, required: false, colSpan: 2,
      placeholder: "Describe your expertise and mentoring approach..."
    },
    {
      name: "bank_name", label: "Bank Name", type: "text",
      icon: CreditCard, required: false, colSpan: 1, placeholder: "e.g. HDFC Bank"
    },
    {
      name: "account_number", label: "Account Number", type: "text",
      icon: CreditCard, required: false, colSpan: 1, placeholder: "e.g. 123456789012"
    },
    {
      name: "ifsc_code", label: "IFSC Code", type: "text",
      icon: CreditCard, required: false, colSpan: 1, placeholder: "e.g. HDFC0001234"
    },
  ], [mentorFormState.state, mentorFormState.district, mentorFormState.tahsil]);

  const collegeFields: DynamicField[] = useMemo(() => [
    { name: "college_name", label: "College Name", type: "text", icon: Building2, required: true, colSpan: 2 },
    { name: "trust__governing_body", label: "Trust / Governing Body", type: "text", icon: Shield, required: true, colSpan: 2 },
    { name: "year_of_establishment", label: "Year of Establishment", type: "number", icon: Calendar, required: true },
    { name: "intake_capacity", label: "Intake Capacity", type: "number", icon: Users, required: true },
    { name: "college_code", label: "College Code", type: "text", icon: Target, required: true },
    { name: "email", label: "Email Address", type: "email", icon: Mail, required: true, disabled: true },
    {
      name: "university",
      label: "Affiliated University",
      type: "select",
      icon: GraduationCap,
      required: true,
      colSpan: 2,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "University" },
      mapOptions: (data) => data.map((u: any) => ({ value: u.name, label: u.name }))
    },
    {
      name: "college_type",
      label: "College Type",
      type: "select",
      icon: Layers,
      required: true,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "College Type" },
      mapOptions: (data) => data.map((ct: any) => ({ value: ct.name, label: ct.name }))
    },
    { name: "website", label: "Website", type: "url", icon: Globe, required: false },
    {
      name: "state",
      label: "State",
      type: "select",
      icon: MapPin,
      required: true,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "State" },
      mapOptions: (data) => data.map((s: any) => ({ value: s.name, label: s.name }))
    },
    {
      name: "district",
      label: "District",
      type: "select",
      icon: MapPin,
      required: true,
      disabled: !collegeFormState.state,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: collegeFormState.state ? {
        doctype: "District",
        fields: ["name", "district_name"],
        filters: [["state", "=", collegeFormState.state]],
        order_by: "district_name asc",
        limit_page_length: 1000
      } : undefined,
      mapOptions: (data) => data.map((d: any) => ({ value: d.name, label: d.district_name || d.name }))
    },
    {
      name: "taluka",
      label: "Taluka / Tahsil",
      type: "select",
      icon: MapPin,
      required: true,
      disabled: !collegeFormState.district,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: collegeFormState.district ? {
        doctype: "Tahsil",
        fields: ["name", "tahsil_name"],
        filters: [["district", "=", collegeFormState.district]],
        order_by: "tahsil_name asc",
        limit_page_length: 1000
      } : undefined,
      mapOptions: (data) => data.map((t: any) => ({ value: t.name, label: t.name }))
    },
    {
      name: "city",
      label: "City",
      type: "select",
      icon: MapPin,
      required: true,
      disabled: !collegeFormState.taluka,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: collegeFormState.taluka ? {
        doctype: "City",
        fields: ["name", "city_name"],
        filters: [["tahsil", "=", collegeFormState.taluka]],
        order_by: "city_name asc",
        limit_page_length: 1000
      } : undefined,
      mapOptions: (data) => data.map((c: any) => ({ value: c.name, label: c.name }))
    },
  ], [collegeFormState]);

  const industryFields: DynamicField[] = useMemo(() => {
    const fields: DynamicField[] = [
      { name: "company_name", label: "Company Name", type: "text", icon: Building2, required: true, colSpan: 2 },
      { name: "business_type", label: "Business Type", type: "text", icon: Layers, required: false },
    ];

    if (customData?.rawIndustryData?.other_business_type) {
      fields.push({ name: "other_business_type", label: "Other Business Type", type: "text", icon: Layers, required: false });
    }

    fields.push({ name: "industry_sector", label: "Industry Sector", type: "text", icon: Target, required: false });

    if (customData?.rawIndustryData?.other_industry_sector) {
      fields.push({ name: "other_industry_sector", label: "Other Industry Sector", type: "text", icon: Target, required: false });
    }

    fields.push(
      { name: "company_website", label: "Website", type: "url", icon: Globe, required: true, colSpan: 2 },
      { name: "employee_head_count", label: "Employee Count", type: "number", icon: Users, required: true },
      { name: "cin", label: "CIN", type: "text", icon: Mail, required: true },
      { name: "about", label: "About Company", type: "textarea", icon: FileText, required: true, colSpan: 2 },
      {
        name: "specializations",
        label: "Specializations",
        type: "select",
        multiple: true,
        icon: Target,
        colSpan: 2,
        apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
        apiParams: { doctype: "Specialization" },
        allowCustom: true,
        customPlaceholder: "Enter custom specialization...",
        onCreateCustomValue: async (val: string) => {
          try {
            const { createSpecialization } = await import("@/services/industry.services");
            await createSpecialization(val);
          } catch (err) {
            console.error("Failed to create specialization:", err);
            throw err;
          }
        }
      },
      {
        name: "operating_hours",
        label: "Operating Hours",
        type: "custom",
        colSpan: 2,
        customRender: (formData, onChange) => (
          <OperatingHoursTable
            value={formData.operating_hours || []}
            onChange={onChange}
          />
        )
      },
      { name: "address_line_1", label: "Address Line 1", type: "text", icon: MapPin, required: true, colSpan: 2 },
      { name: "address_line_2", label: "Address Line 2", type: "text", icon: MapPin, required: false, colSpan: 2 },
      { name: "pincode", label: "Pincode", type: "text", icon: MapPin, required: true },
      { name: "map_link", label: "Map Link", type: "url", icon: Globe, required: false },
      { name: "latitude", label: "Latitude", type: "number", icon: MapPin, required: false },
      { name: "longitude", label: "Longitude", type: "number", icon: MapPin, required: false },
    );

    return fields;
  }, [customData?.rawIndustryData]);

  const handleUpdateProfile = async (formData: any) => {
    if (!currentUser) return;
    setModalLoading(true);
    setModalError(null);
    try {
      if (role === "student") {
        let marksheetUrl = formData.marksheet;

        if (formData.marksheet instanceof File) {
          const uploadRes = await uploadFileApi(
            formData.marksheet,
            "Student",
            currentUser,
            "marksheet"
          );
          marksheetUrl = uploadRes.file_url || uploadRes.file_name;
        }

        const payload = {
          ...formData,
          marksheet: marksheetUrl || null,
          name: currentUser
        };
        await updateStudent(currentUser, payload);
        await fetchStudentData();
      } else if (role === "industry") {
        // Transform the payload to match the requested nested structure
        const transformedPayload = {
          ...formData,
          specializations: (formData.specializations || []).map((s: string) => ({ specialization: s })),
          location: formData.location,
          operating_hours: (formData.operating_hours || []).map(({ name, ...rest }: any) => rest)
        };


        await updateIndustry(currentUser, formData.company_name, transformedPayload);
        if (customData?.onUpdateSuccess) {
          await customData.onUpdateSuccess();
        }
      } else if (role === "college") {
        const payload = {
          ...collegeData,
          college_name: formData.college_name,
          trust__governing_body: formData.trust__governing_body,
          year_of_establishment: formData.year_of_establishment ? Number(formData.year_of_establishment) : undefined,
          intake_capacity: formData.intake_capacity ? Number(formData.intake_capacity) : undefined,
          college_code: formData.college_code,
          university: formData.university,
          college_type: formData.college_type,
          website: formData.website,
          state: formData.state,
          district: formData.district,
          taluka: formData.taluka,
          tahsil: formData.taluka,
          city: formData.city,
          address_line_1: collegeData?.address_line_1 || collegeData?.address_line1,
          address_line_2: collegeData?.address_line_2 || collegeData?.address_line2,
        };
        await updateCollegeDetails(currentUser, payload);
        await fetchCollegeData();
      } else if (role === "mentor") {
        const email = currentUser || (typeof window !== "undefined" ? (localStorage.getItem("currentUser") || localStorage.getItem("userEmail")) : "") || "";
        const domainArray = (mentorData?.domains || []).map((d: any) => ({ domain: d.domain || d }));
        const skillsArray = (mentorData?.mentor_skills || mentorData?.skills || []).map((s: any) => ({ skill: s.skill || s }));
        const platformUrlsPayload = (mentorData?.mentor_platform_urls || []).map((p: any) => ({ platform: p.platform, url: p.url }));

        const payload = {
          name: email,
          email_id: email,
          first_name: formData.first_name || mentorData?.first_name || "",
          last_name: formData.last_name || mentorData?.last_name || "",
          mobile_no: formData.mobile_no || mentorData?.mobile_no || null,
          type: formData.type || null,
          travelling_possible: formData.travelling_possible || "Yes",
          country: mentorData?.country || "India",
          state: formData.state || null,
          district: formData.district || null,
          tahsil: formData.tahsil || null,
          city: formData.city || null,
          profile_description: formData.profile_description?.trim() || null,
          role: formData.role || mentorData?.role || null,
          experience: formData.experience || mentorData?.experience || null,
          bank_name: formData.bank_name?.trim() || null,
          account_number: formData.account_number?.trim() || null,
          ifsc_code: formData.ifsc_code?.trim() || null,
          doctype: "Mentor",
          domain: domainArray,
          mentor_skills: skillsArray,
          mentor_platform_urls: platformUrlsPayload,
        };

        await updateMentor(email, payload);
        window.dispatchEvent(new Event("mentor-profile-updated"));
        await fetchMentorData();
      }
      showToast("Profile updated successfully", "success");
      setIsModalOpen(false);
    } catch (error: any) {
      setModalError(error?.message || "Failed to update profile");
      showToast(error?.message || "Failed to update profile", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Compute initial values for the modal
  const computedInitialValues = useMemo(() => {
    if (role === "mentor") {
      return {
        first_name: mentorData?.first_name || "",
        last_name: mentorData?.last_name || "",
        role: mentorData?.role || "",
        experience: mentorData?.experience || "",
        type: mentorData?.type || "",
        travelling_possible: mentorData?.travelling_possible || "Yes",
        state: mentorData?.state || "",
        district: mentorData?.district || "",
        tahsil: mentorData?.tahsil || "",
        city: mentorData?.city || "",
        mobile_no: mentorData?.mobile_no || "",
        profile_description: mentorData?.profile_description || "",
        bank_name: mentorData?.bank_name || "",
        account_number: mentorData?.account_number || "",
        ifsc_code: mentorData?.ifsc_code || "",
      };
    }

    if (role === "college") {
      return {
        college_name: collegeData?.college_name || "",
        trust__governing_body: collegeData?.trust__governing_body || "",
        year_of_establishment: collegeData?.year_of_establishment || "",
        intake_capacity: collegeData?.intake_capacity || "",
        college_code: collegeData?.college_code || "",
        email: collegeData?.email || currentUser || "",
        university: collegeData?.university || "",
        college_type: collegeData?.college_type || "",
        website: collegeData?.website || "",
        state: collegeData?.state || "",
        district: collegeData?.district || "",
        taluka: collegeData?.taluka || collegeData?.tahsil || "",
        city: collegeData?.city || "",
      };
    }

    if (role === "industry") {
      const raw = customData?.rawIndustryData || {};
      return {
        ...raw,
        specializations: (raw.specializations || []).map((s: any) => s.specialization || s),
        location: raw.location || {
          address_line_1: "",
          address_line_2: "",
          pincode: "",
          map_link: "",
          latitude: null,
          longitude: null
        },
        operating_hours: (raw.operating_hours || []).map((oh: any) => {
          const formatTime = (t: string) => {
            if (!t) return "";
            const parts = t.split(":");
            if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
            return t;
          };
          return {
            ...oh,
            opening_time: formatTime(oh.opening_time),
            closing_time: formatTime(oh.closing_time)
          };
        })
      };
    }

    if (!studentData && !fullName) return {};

    // Split fullName from local storage for first/last name
    const [firstName = "", ...lastNameParts] = (fullName || "").split(" ");
    const lastName = lastNameParts.join(" ");

    const extractString = (val: any, key: string) => {
      if (Array.isArray(val)) return val.length > 0 ? (val[0][key] || val[0].name || val[0]) : "";
      if (val && typeof val === "object") return val[key] || val.name || "";
      return val || "";
    };

    return {
      // API Data
      course_type: extractString(studentData?.course_type || studentData?.courses_type, "course_type"),
      department: extractString(studentData?.department, "department"),
      stream: extractString(studentData?.stream, "stream"),
      course: extractString(studentData?.course, "course"),
      semester: extractString(studentData?.semester, "semester"),
      current_year: mapYearToWord(studentData?.current_year || studentData?.academic_year) || "",
      date_of_birth: studentData?.date_of_birth || "",
      mobile_no: studentData?.mobile_no || "",
      college: studentData?.college || "",
      linkedin: studentData?.linkedin || "",
      github: studentData?.github || "",
      gender: studentData?.gender || "",
      cgpa: studentData?.cgpa || "",
      marksheet: studentData?.marksheet || studentData?.marksheet_file || "",

      // Local Storage priority
      first_name: firstName || studentData?.first_name || "",
      last_name: lastName || studentData?.last_name || "",
      email_id: currentUser || studentData?.email_id || "",
    };
  }, [studentData, collegeData, mentorData, fullName, currentUser, customData?.rawIndustryData, role]);

  useEffect(() => {
    if (isModalOpen && role === "college") {
      setCollegeFormState(computedInitialValues);
    }
    if (isModalOpen && role === "mentor") {
      setMentorFormState(computedInitialValues);
    }
    if (isModalOpen && role === "student") {
      setStudentFormState(computedInitialValues);
    }
  }, [isModalOpen, role, computedInitialValues]);

  const userFullName = useMemo(() => {
    if (role === "mentor") {
      if (mentorData) {
        return `${mentorData.first_name || ""} ${mentorData.last_name || ""}`.trim();
      }
      return fullName || (typeof window !== "undefined" ? localStorage.getItem("fullName") : "") || "";
    }
    return fullName || "";
  }, [mentorData, role, fullName]);

  // Get title from customData or userFullName or default
  const title = useMemo(() => {
    if (role === "college") {
      return collegeData?.college_name || config.defaultTitle;
    }
    return customData?.title || userFullName || config.defaultTitle;
  }, [role, collegeData, config.defaultTitle, customData?.title, userFullName]);

  const mentorSubtitle = useMemo(() => {
    if (role !== "mentor") return null;
    if (mentorData) {
      const roleStr = mentorData.role || "";
      const expStr = mentorData.experience ? `${mentorData.experience} Years Exp` : "";
      const domainsList = (mentorData.domains || []).map((d: any) => d.domain || d).filter(Boolean);
      const domainsStr = domainsList.length > 0 ? domainsList.join(", ") : "";

      const parts = [roleStr, expStr, domainsStr].filter(Boolean);
      return parts.join(" • ") || "Verified Mentor";
    }
    return "Verified Mentor";
  }, [mentorData, role]);

  const collegeSubtitle = useMemo(() => {
    if (role !== "college" || !collegeData) return null;
    const parts = [];
    if (collegeData.university) parts.push(collegeData.university);
    if (collegeData.college_type) parts.push(collegeData.college_type);
    if (collegeData.year_of_establishment) parts.push(`Estd. ${collegeData.year_of_establishment}`);
    const locationParts = [];
    if (collegeData.city) locationParts.push(collegeData.city);
    if (collegeData.state) locationParts.push(collegeData.state);
    if (locationParts.length > 0) {
      parts.push(locationParts.join(", "));
    }
    return parts.join(" • ");
  }, [collegeData, role]);

  // Get subtitle from customData or default
  const subtitle = customData?.subtitle ||
    (role === "student" && studentData ? (
      <div className="space-y-0.5">
        <p className="font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-300" />
          {studentData.college || "College Not Specified"}
        </p>
        <p className={`text-xs ${config.textColor} opacity-80`}>
          {studentData.course} • {studentData.department || ""} • Stream {studentData.stream || "N/A"}
        </p>
      </div>
    ) : role === "mentor" ? (
      mentorSubtitle
    ) : role === "college" && collegeData ? (
      collegeSubtitle
    ) : config.defaultSubtitle);

  // Get progress value
  const progressValue = useMemo(() => {
    if (role === "college") {
      if (placementStats?.placement_rate !== undefined) {
        return Math.round(Number(placementStats.placement_rate));
      }
    }
    if (role === "student") {
      if (statsData?.profile_completeness !== undefined && statsData?.profile_completeness !== null) {
        return Math.round(Number(statsData.profile_completeness));
      }
    }
    return customData?.profileProgress ?? config.defaultProgress;
  }, [role, placementStats, statsData, customData?.profileProgress, config.defaultProgress]);

  // Get initials
  const getInitials = () => {
    if (role === "mentor" && mentorData) {
      const fn = mentorData.first_name || "";
      const ln = mentorData.last_name || "";
      if (fn || ln) {
        return `${fn?.[0] || ""}${ln?.[0] || ""}`.toUpperCase();
      }
    }
    if (role === "college" && collegeData?.college_name) {
      const parts = collegeData.college_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return collegeData.college_name.slice(0, 2).toUpperCase();
    }
    const nameVal = fullName || (typeof window !== "undefined" ? localStorage.getItem("fullName") : "") || "";
    if (nameVal) {
      return nameVal.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    const emailVal = currentUser || (typeof window !== "undefined" ? (localStorage.getItem("currentUser") || localStorage.getItem("userEmail")) : "") || "";
    if (emailVal) {
      return emailVal[0].toUpperCase();
    }
    return role === "college" ? "VJ" : role === "student" ? "AP" : "U";
  };

  // Get accent color classes
  const getIconColor = () => {
    switch (config.accentColor) {
      case "violet": return "text-violet-400";
      case "orange": return "text-orange-400";
      case "emerald": return "text-emerald-400";
      case "purple": return "text-purple-400";
      case "blue": return "text-blue-400";
      default: return "text-orange-400";
    }
  };

  const getProgressGradient = () => {
    switch (config.accentColor) {
      case "violet": return "from-violet-400 to-violet-500";
      case "orange": return "from-orange-400 to-orange-500";
      case "emerald": return "from-emerald-400 to-emerald-500";
      case "purple": return "from-purple-400 to-purple-500";
      case "blue": return "from-blue-400 to-blue-500";
      default: return "from-orange-400 to-orange-500";
    }
  };

  const getMetricBg = () => {
    switch (config.accentColor) {
      case "violet": return "bg-violet-600/40 border-violet-500/30";
      case "orange": return "bg-blue-600/40 border-blue-500/30";
      case "emerald": return "bg-emerald-600/40 border-emerald-500/30";
      case "purple": return "bg-purple-600/40 border-purple-500/30";
      case "blue": return "bg-blue-600/40 border-blue-500/30";
      default: return "bg-blue-600/40 border-blue-500/30";
    }
  };

  // Get metrics from customData or use defaults
  const metrics = customData?.metrics || (
    role === "student" && studentData ? [
      { key: "employability", value: studentData.employability_score !== undefined && studentData.employability_score !== null ? studentData.employability_score : 73, label: "Employability", icon: TrendingUp },
      { key: "cgpa", value: studentData.cgpa || 0, label: "Current CGPA", icon: Award },
      { key: "semester", value: studentData.semester || "N/A", label: "Semester", icon: Calendar }
    ] : role === "mentor" && (mentorData || mentorStats) ? [
      {
        key: "students",
        value: mentorStats?.total_students_mentored ?? mentorData?.total_students ?? 0,
        label: "Total Students",
        icon: Users
      },
      {
        key: "sessions",
        value: mentorData?.total_sessions ?? mentorStats?.sessions_this_month ?? 0,
        label: "Sessions Done",
        icon: Calendar
      },
      {
        key: "rating",
        value: mentorData?.avg_rating > 0 ? Number(mentorData.avg_rating).toFixed(1) : "New",
        label: "Avg Rating",
        icon: Award
      }
    ] : role === "college" && collegeData ? [
      {
        key: "students",
        value: collegeData.intake_capacity ? Number(collegeData.intake_capacity).toLocaleString() : "2,847",
        label: "Intake Capacity",
        icon: Users
      },
      {
        key: "placements",
        value: placementStats?.placement_rate !== undefined
          ? `${Math.round(Number(placementStats.placement_rate))}%`
          : "0%",
        label: "Placement Rate",
        icon: Briefcase
      },
      {
        key: "partners",
        value: dashboardSummary?.avg_employability !== undefined
          ? `${Math.round(Number(dashboardSummary.avg_employability))}%`
          : "0%",
        label: "Avg Employability",
        icon: TrendingUp
      }
    ] : config.metrics.map(m => ({
      key: m.key,
      value: m.default,
      label: m.label,
      icon: m.icon
    }))
  );

  const isWidgetLoading = useMemo(() => {
    if (role === "college" && !collegeData && loading) return true;
    if (role === "student" && !studentData && loading) return true;
    if (role === "mentor" && !mentorData && loading) return true;
    return false;
  }, [role, collegeData, studentData, mentorData, loading]);

  if (isWidgetLoading) {
    if (onlyModal) return null;
    return (
      <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-4 md:p-6 text-white relative overflow-hidden animate-pulse min-h-[180px] flex items-center`}>
        {/* Background shapes for aesthetics */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded w-24" />
              <div className="h-6 bg-white/20 rounded w-48" />
              <div className="h-4 bg-white/10 rounded w-64" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-16 w-24 bg-white/10 rounded-xl" />
            <div className="h-16 w-24 bg-white/10 rounded-xl" />
            <div className="h-16 w-24 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (onlyModal) {
    return (
      <>
        {(role === "student" || role === "industry" || role === "college" || role === "mentor") && (
          <DashboardDynamicModal
            isOpen={isModalOpen}
            onClose={handleCloseUpdateProfileModal}
            title={role === "student" || role === "mentor" ? "Update Profile" : role === "college" ? "Edit College Details" : "Edit Company Profile"}
            subtitle={role === "student" ? "Keep your academic details up to date" : role === "mentor" ? "Keep your profile details up to date" : role === "college" ? "Update your college onboarding information" : (customData?.title || "Manage your company's presence")}
            headerIcon={role === "student" || role === "mentor" ? Pen : role === "college" ? Building2 : Building2}
            iconBgColor={role === "student" ? "bg-orange-500" : role === "college" ? "bg-emerald-600" : role === "mentor" ? "bg-violet-600" : "bg-blue-600"}
            fields={role === "student" ? studentFields : role === "college" ? collegeFields : role === "mentor" ? mentorFields : (customData?.fields || industryFields)}
            initialValues={computedInitialValues}
            onSubmit={handleUpdateProfile}
            loading={modalLoading}
            error={modalError}
            headerContent={
              <div className="flex flex-col items-center py-4 border-b border-slate-100 mb-2">
                <ProfileImageUploader
                  currentImageUrl={userImage}
                  initials={getInitials()}
                  bgClass={
                    role === "student" ? "bg-gradient-to-tr from-blue-600 to-orange-500" :
                      role === "college" ? "bg-emerald-600" :
                        role === "industry" ? "bg-purple-600" :
                          "bg-violet-600"
                  }
                  size="md"
                />
              </div>
            }
            onValuesChange={(updatedValues, changedFieldName) => {
              if (role === "student") {
                const sideEffects: any = {};
                if (changedFieldName === "course_type") {
                  sideEffects.course = "";
                  sideEffects.department = "";
                  sideEffects.semester = "";
                }
                if (changedFieldName === "stream") {
                  sideEffects.course = "";
                  sideEffects.department = "";
                  sideEffects.semester = "";
                }
                if (changedFieldName === "course") {
                  sideEffects.department = "";
                  sideEffects.semester = "";
                }
                if (changedFieldName === "department") {
                  sideEffects.semester = "";
                }
                const newFormState = { ...updatedValues, ...sideEffects };
                setStudentFormState(newFormState);
                return sideEffects;
              }
              if (role === "college") {
                const sideEffects: any = {};
                if (changedFieldName === "state") {
                  sideEffects.district = "";
                  sideEffects.taluka = "";
                  sideEffects.city = "";
                } else if (changedFieldName === "district") {
                  sideEffects.taluka = "";
                  sideEffects.city = "";
                } else if (changedFieldName === "taluka") {
                  sideEffects.city = "";
                }
                const newFormState = { ...updatedValues, ...sideEffects };
                setCollegeFormState(newFormState);
                return sideEffects;
              }
              if (role === "mentor") {
                const sideEffects: any = {};
                if (changedFieldName === "state") {
                  sideEffects.district = "";
                  sideEffects.tahsil = "";
                  sideEffects.city = "";
                } else if (changedFieldName === "district") {
                  sideEffects.tahsil = "";
                  sideEffects.city = "";
                } else if (changedFieldName === "tahsil") {
                  sideEffects.city = "";
                }
                const newFormState = { ...updatedValues, ...sideEffects };
                setMentorFormState(newFormState);
                return sideEffects;
              }
            }}
          />
        )}
        {renderCompletenessPopup()}
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-4 md:p-6 text-white relative overflow-hidden`}
    >
      {/* Background shapes for aesthetics */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`${role === "industry" ? "w-20 h-20 md:w-24 md:h-24" : "w-14 h-14"} rounded-full bg-gradient-to-r ${getProgressGradient()} flex items-center justify-center shadow-lg border-2 border-white/20 overflow-hidden shrink-0`}>
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImageUrl} alt={userFullName} className="w-full h-full object-cover" />
            ) : (
              <span className={`${role === "industry" ? "text-3xl md:text-4xl font-bold" : "text-xl font-bold"} text-white`}>{getInitials()}</span>
            )}
          </div>
          <div>
            <p className={`text-[10px] ${config.textColor} font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1`}>
              {config.greeting} {role !== "industry" && <span>👋</span>}
              <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {config.roleName}
              </span>
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-0.5 flex items-center gap-3">
              {title}
              {role === "industry" && customData?.rawIndustryData?.status === "Active" && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  <Shield className="w-3 h-3" /> VERIFIED
                </span>
              )}
              {(role === "student" || role === "industry" || role === "college" || role === "mentor") && (
                <button
                  onClick={() => {
                    if (role === "college") {
                      fetchCollegeData();
                    }
                    if (role === "mentor") {
                      fetchMentorData();
                    }
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group/edit"
                >
                  <Pen className="w-[18px] h-[18px] text-white/50 group-hover/edit:text-white transition-colors" strokeWidth={2.5} />
                </button>
              )}
              {role === "student" && !onlyModal && (
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    href="/student/dashboard/resume"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Create Resume
                  </Link>

                  <Link
                    href="/student/dashboard?preview=resume"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-300" />
                    Preview Resume
                  </Link>
                </div>
              )}
            </h2>
            <div className={`text-sm ${config.textColor}`}>
              {subtitle}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className={`${getMetricBg()} backdrop-blur-md rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[90px] cursor-pointer hover:scale-105 transition-transform`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xl font-bold text-white">
                  {metric.value}
                </span>
                {metric.icon && (
                  <metric.icon className={`w-4 h-4 ${getIconColor()}`} />
                )}
              </div>
              <span className={`text-[10px] ${config.textColor} uppercase tracking-wide`}>
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar - Only for student and college */}
      {(role === "student" || role === "college") && (
        <div className="relative z-10 mt-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] ${config.textColor} font-medium`}>
              {role === "student" ? "Profile Completeness" : "Placement Target Progress"}
            </span>
            <span className="text-xs font-bold text-white">
              {progressValue}%
            </span>
          </div>
          <div className={`h-2 ${config.progressBg} rounded-full overflow-hidden backdrop-blur-sm border ${config.progressBorder}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient()} relative`}
            >
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-sm translate-x-4 mix-blend-overlay"></div>
            </motion.div>
          </div>
        </div>
      )}

      {(role === "student" || role === "industry" || role === "college" || role === "mentor") && (
        <DashboardDynamicModal
          isOpen={isModalOpen}
          onClose={handleCloseUpdateProfileModal}
          title={role === "student" || role === "mentor" ? "Update Profile" : role === "college" ? "Edit College Details" : "Edit Company Profile"}
          subtitle={role === "student" ? "Keep your academic details up to date" : role === "mentor" ? "Keep your profile details up to date" : role === "college" ? "Update your college onboarding information" : (customData?.title || "Manage your company's presence")}
          headerIcon={role === "student" || role === "mentor" ? Pen : role === "college" ? Building2 : Building2}
          iconBgColor={role === "student" ? "bg-orange-500" : role === "college" ? "bg-emerald-600" : role === "mentor" ? "bg-violet-600" : "bg-blue-600"}
          fields={role === "student" ? studentFields : role === "college" ? collegeFields : role === "mentor" ? mentorFields : (customData?.fields || industryFields)}
          initialValues={computedInitialValues}
          onSubmit={handleUpdateProfile}
          loading={modalLoading}
          error={modalError}
          headerContent={
            <div className="flex flex-col items-center py-4 border-b border-slate-100 mb-2">
              <ProfileImageUploader
                currentImageUrl={userImage}
                initials={getInitials()}
                bgClass={
                  role === "student" ? "bg-gradient-to-tr from-blue-600 to-orange-500" :
                    role === "college" ? "bg-emerald-600" :
                      role === "industry" ? "bg-purple-600" :
                        "bg-violet-600"
                }
                size="md"
              />
            </div>
          }
          onValuesChange={(updatedValues, changedFieldName) => {
            if (role === "student") {
              const sideEffects: any = {};
              if (changedFieldName === "course_type") {
                sideEffects.course = "";
                sideEffects.department = "";
                sideEffects.semester = "";
              }
              if (changedFieldName === "stream") {
                sideEffects.course = "";
                sideEffects.department = "";
                sideEffects.semester = "";
              }
              if (changedFieldName === "course") {
                sideEffects.department = "";
                sideEffects.semester = "";
              }
              if (changedFieldName === "department") {
                sideEffects.semester = "";
              }
              const newFormState = { ...updatedValues, ...sideEffects };
              setStudentFormState(newFormState);
              return sideEffects;
            }
            if (role === "college") {
              const sideEffects: any = {};
              if (changedFieldName === "state") {
                sideEffects.district = "";
                sideEffects.taluka = "";
                sideEffects.city = "";
              } else if (changedFieldName === "district") {
                sideEffects.taluka = "";
                sideEffects.city = "";
              } else if (changedFieldName === "taluka") {
                sideEffects.city = "";
              }
              const newFormState = { ...updatedValues, ...sideEffects };
              setCollegeFormState(newFormState);
              return sideEffects;
            }
            if (role === "mentor") {
              const sideEffects: any = {};
              if (changedFieldName === "state") {
                sideEffects.district = "";
                sideEffects.tahsil = "";
                sideEffects.city = "";
              } else if (changedFieldName === "district") {
                sideEffects.tahsil = "";
                sideEffects.city = "";
              } else if (changedFieldName === "tahsil") {
                sideEffects.city = "";
              }
              const newFormState = { ...updatedValues, ...sideEffects };
              setMentorFormState(newFormState);
              return sideEffects;
            }
          }}
        />
      )}
      {renderCompletenessPopup()}
    </motion.div>
  );
}