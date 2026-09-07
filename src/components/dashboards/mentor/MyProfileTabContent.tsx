"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Pencil,
  Shield,
  CheckCircle,
  Eye,
  User,
  Briefcase,
  MapPin,
  Globe,
  FileText,
  Phone,
  CreditCard,
  Award,
  Link2,
  X
} from "lucide-react";
import { getMentorByEmail, updateMentor } from "@/services/mentor.services";
import { useAuth } from "@/context/AuthContext";
import { BASE_URL, buildProfileImageUrl } from "@/services/api.services";
import DashboardDynamicModal, { DynamicField } from "@/components/dashboards/shared/DashboardDynamicModal";
import ProfileImageUploader from "@/components/profile/ProfileImageUploader";
import { useToast } from "@/context/ToastContext";

//helpers

function getInitials(firstName: string, lastName: string) {
  return `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}` || "M";
}

function parseAxiosError(err: any, fallback: string): string {
  const nested = err?.response?.data?.message;
  if (typeof nested === "string") return nested;
  if (typeof nested === "object" && nested !== null) return nested.message || fallback;
  return err?.message || fallback;
}

//Component

export default function MyProfileTabContent() {
  const { currentUser, userImage } = useAuth();
  const imageUrl = buildProfileImageUrl(userImage);
  const { showToast } = useToast();

  const userEmail = currentUser || localStorage.getItem("userEmail") || "";

  // State
  const [mentorData, setMentorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalValues, setModalValues] = useState<Record<string, any>>({});

  //Fetch mentor profile
  const fetchMentorProfile = async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMentorByEmail(userEmail);
      const data = res?.message?.data || res?.message || null;
      setMentorData(data || null);
    } catch (err: any) {
      setError(parseAxiosError(err, "Failed to load profile"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorProfile();
  }, [userEmail]);

  //Modal fields
  const profileFields: DynamicField[] = useMemo(() => [
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
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
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
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: { doctype: "State" },
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.name }));
      }
    },
    {
      name: "district", label: "District", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select District",
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: modalValues.state
        ? { doctype: "District", fields: ["name", "district_name"], filters: [["state", "=", modalValues.state]], order_by: "district_name asc", limit_page_length: 1000 }
        : undefined,
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.district_name || item.name }));
      },
      disabled: !modalValues.state
    },
    {
      name: "tahsil", label: "Taluka", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select Taluka",
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: modalValues.district
        ? { doctype: "Tahsil", fields: ["name", "tahsil_name"], filters: [["district", "=", modalValues.district]], order_by: "tahsil_name asc", limit_page_length: 1000 }
        : undefined,
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.tahsil_name || item.name }));
      },
      disabled: !modalValues.district
    },
    {
      name: "city", label: "City", type: "select",
      icon: MapPin, required: false, colSpan: 1, placeholder: "Select City",
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: modalValues.tahsil
        ? { doctype: "City", fields: ["name", "city_name"], filters: [["tahsil", "=", modalValues.tahsil]], order_by: "city_name asc", limit_page_length: 1000 }
        : undefined,
      mapOptions: (data: any) => {
        const items = data?.data || data || [];
        return items.map((item: any) => ({ value: item.name, label: item.city_name || item.name }));
      },
      disabled: !modalValues.tahsil
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
  ], [modalValues.state, modalValues.district, modalValues.tahsil]);

  //Modal initial values derived from fetched mentor data 
  const modalInitialValues = useMemo(() => {
    if (!mentorData) return {};
    return {
      first_name: mentorData.first_name || "",
      last_name: mentorData.last_name || "",
      role: mentorData.role || "",
      experience: mentorData.experience || "",
      type: mentorData.type || "",
      travelling_possible: mentorData.travelling_possible || "Yes",
      state: mentorData.state || "",
      district: mentorData.district || "",
      tahsil: mentorData.tahsil || "",
      city: mentorData.city || "",
      mobile_no: mentorData.mobile_no || "",
      profile_description: mentorData.profile_description || "",
      bank_name: mentorData.bank_name || "",
      account_number: mentorData.account_number || "",
      ifsc_code: mentorData.ifsc_code || "",
    };
  }, [mentorData]);

  useEffect(() => {
    if (isModalOpen) setModalValues(modalInitialValues);
  }, [isModalOpen, modalInitialValues]);

  //Submit update
  const handleModalSubmit = async (formData: any) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const domainArray = (mentorData?.domains || []).map((d: any) => ({ domain: d.domain || d }));
      const skillsArray = (mentorData?.mentor_skills || mentorData?.skills || []).map((s: any) => ({ skill: s.skill || s }));
      const platformUrlsPayload = (mentorData?.mentor_platform_urls || []).map((p: any) => ({ platform: p.platform, url: p.url }));

      const payload = {
        name: userEmail,
        email_id: userEmail,
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

      await updateMentor(userEmail, payload);
      window.dispatchEvent(new Event("mentor-profile-updated"));

      showToast("Profile updated successfully!", "success");
      setIsModalOpen(false);
      await fetchMentorProfile();
    } catch (err: any) {
      const msg = parseAxiosError(err, "Failed to update profile");
      setModalError(msg);
      showToast(msg, "error");
    } finally {
      setModalLoading(false);
    }
  };


  //Derived display values
  const initials = getInitials(mentorData?.first_name, mentorData?.last_name);
  const fullName = mentorData ? `${mentorData.first_name || ""} ${mentorData.last_name || ""}`.trim() : "—";
  const domains = (mentorData?.domains || []).map((d: any) => d.domain || d).filter(Boolean);
  const skills = (mentorData?.mentor_skills || mentorData?.skills || []).map((s: any) => s.skill || s).filter(Boolean);
  const platformUrls = mentorData?.mentor_platform_urls || [];

  //Loading Error states
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        {/* Left skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2 px-1">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            {/* avatar + name */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-6 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="flex gap-2 mt-2">
                  <div className="h-6 w-16 bg-slate-200 rounded-md" />
                  <div className="h-6 w-20 bg-slate-200 rounded-md" />
                </div>
              </div>
            </div>
            {/* info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-4 h-4 bg-slate-200 rounded mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-2.5 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
            {/* bio */}
            <div className="mt-6 space-y-2">
              <div className="h-3 w-10 bg-slate-200 rounded" />
              <div className="h-20 bg-slate-100 rounded-xl border border-slate-100" />
            </div>
          </div>
        </div>
        {/* Right skeleton */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="w-16 h-16 rounded-full bg-slate-200" />
              <div className="h-5 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-36 bg-slate-200 rounded" />
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-5 w-16 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-9 w-full bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <button
          onClick={fetchMentorProfile}
          className="px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  //Render
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Left Column — Profile Overview + Edit button ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 space-y-4"
      >
        {/* Header row */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-orange-500" /> My Profile
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
          {/* Avatar + name */}
          <div className="flex items-start gap-4 mb-8">
            <div
              onClick={() => imageUrl && setIsImagePreviewOpen(true)}
              className={`w-16 h-16 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center text-white font-bold text-2xl shrink-0 mt-1 relative group select-none ${
                imageUrl ? "cursor-zoom-in hover:ring-4 hover:ring-orange-100 transition-all duration-300" : ""
              }`}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt={fullName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                initials
              )}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm z-10">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px]">✨</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-slate-800">{fullName}</h2>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Shield className="w-3 h-3 text-blue-600" /> Mentor
                </span>
              </div>
              {mentorData?.type && (
                <p className="text-sm text-slate-600 mb-2">{mentorData.type}</p>
              )}
              {/* Domains */}
              {domains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {domains.map((d: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-md border border-orange-100">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Email", value: userEmail, icon: Globe },
              { label: "Mobile", value: mentorData?.mobile_no, icon: Phone },
              { label: "Current Role", value: mentorData?.role, icon: Briefcase },
              { label: "Experience", value: mentorData?.experience ? `${mentorData.experience} Years` : null, icon: Award },
              { label: "Location", value: [mentorData?.city, mentorData?.tahsil, mentorData?.district, mentorData?.state, mentorData?.country].filter(Boolean).join(", "), icon: MapPin },
              { label: "Travelling", value: mentorData?.travelling_possible, icon: MapPin },
              { label: "Bank", value: mentorData?.bank_name, icon: CreditCard },
              { label: "IFSC", value: mentorData?.ifsc_code, icon: CreditCard },
            ].map(({ label, value, icon: Icon }) =>
              value ? (
                <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-slate-700">{value}</p>
                  </div>
                </div>
              ) : null
            )}
          </div>

          {/* Bio */}
          {mentorData?.profile_description && (
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Bio
              </p>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {mentorData.profile_description}
              </p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Platform URLs */}
          {platformUrls.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" /> Platform Links
              </p>
              <div className="flex flex-col gap-2">
                {platformUrls.map((p: any, i: number) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-semibold"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-slate-500 font-bold mr-1">{p.platform}:</span>
                    {p.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Right Column — Verification + Public Preview ── */}
      <div className="space-y-6">
        {/* Verification Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" /> Verification Status
            </h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex flex-col items-center justify-center mb-8 text-center">
              <div className={`w-16 h-16 rounded-full ${mentorData?.approved_status === "Approved" ? "bg-emerald-50" : "bg-blue-50"} flex items-center justify-center mb-3`}>
                <Shield className={`w-8 h-8 ${mentorData?.approved_status === "Approved" ? "text-emerald-500 fill-emerald-50" : "text-blue-500 fill-blue-50"}`} />
              </div>
              <h3 className={`text-xl font-bold ${mentorData?.approved_status === "Approved" ? "text-emerald-600" : "text-blue-600"}`}>
                {mentorData?.approved_status || "Pending Verification"}
              </h3>
              <p className="text-xs text-slate-400 max-w-[200px]">
                {mentorData?.is_active
                  ? "Profile active & visible to students"
                  : "Profile is currently hidden from students"}
              </p>
            </div>

            <div className="space-y-4">
              {(mentorData?.mentor_verification || []).length > 0 ? (
                (mentorData.mentor_verification).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className={`w-5 h-5 ${item.status === "Verified"
                          ? "text-emerald-500 bg-emerald-50"
                          : "text-amber-500 bg-amber-50"
                          } rounded-full`}
                      />
                      <span className="text-sm font-semibold text-slate-700">{item.verification}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${item.status === "Verified"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                        : "text-amber-600 bg-amber-50 border-amber-100"
                        }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Shield className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No verification records found</p>
                  <p className="text-[10px] text-slate-400 mt-1">Contact support for verification status</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Student-Facing Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" /> Student-Facing Public Profile
            </h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
              This is how students see your profile card:
            </p>

            <div className="border border-slate-200 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div
                  onClick={() => imageUrl && setIsImagePreviewOpen(true)}
                  className={`w-12 h-12 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0 mt-1 relative group select-none ${
                    imageUrl ? "cursor-zoom-in hover:ring-4 hover:ring-orange-100 transition-all duration-300" : ""
                  }`}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt={fullName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="font-bold text-slate-800 text-lg">{fullName || "Your Name"}</h4>
                    <span className={`flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider ${mentorData?.approved_status === "Approved"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-blue-700 bg-blue-50 border-blue-200"
                      } px-1.5 py-0.5 rounded border`}>
                      <Shield className={`w-2.5 h-2.5 ${mentorData?.approved_status === "Approved" ? "text-emerald-600" : "text-blue-600"
                        }`} />
                      {mentorData?.approved_status === "Approved" ? "Verified" : "Pending"}
                    </span>
                  </div>
                  {mentorData?.role && (
                    <p className="text-sm font-bold text-slate-700 leading-tight">
                      {mentorData.role}
                      {mentorData?.experience && ` • ${mentorData.experience} years exp`}
                    </p>
                  )}
                  {mentorData?.type && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{mentorData.type}</p>
                  )}
                </div>
              </div>

              {/* Stats bar */}
              <div className="flex justify-between items-center px-3 py-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                <div className="text-center flex-1">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5 uppercase">Rating</p>
                  <p className="font-bold text-slate-800 text-sm flex items-center justify-center gap-0.5">
                    <span className="text-amber-500">⭐</span>
                    {mentorData?.avg_rating > 0
                      ? Number(mentorData.avg_rating).toFixed(1)
                      : "New"}
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center flex-1">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5 uppercase">Sessions</p>
                  <p className="font-bold text-slate-800 text-sm">{mentorData?.total_sessions ?? 0}</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center flex-1">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5 uppercase">Hours</p>
                  <p className="font-bold text-slate-800 text-sm">{Number(mentorData?.total_hours ?? 0).toFixed(1)}</p>
                </div>
              </div>

              <button className="w-full py-2.5 bg-orange-500 text-white font-bold text-sm rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
                Book Session
              </button>
            </div>
          </div>
        </motion.div>
      </div>


      {/* ── Edit Profile Modal ── */}
      <DashboardDynamicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Profile"
        subtitle="Update your mentor profile details"
        headerIcon={Pencil}
        iconBgColor="bg-orange-500"
        fields={profileFields}
        initialValues={modalInitialValues}
        onSubmit={handleModalSubmit}
        loading={modalLoading}
        error={modalError}
        headerContent={
          <div className="flex flex-col items-center py-4 border-b border-slate-100 mb-2">
            <ProfileImageUploader
              currentImageUrl={userImage}
              initials={initials}
              bgClass="bg-orange-500"
              size="md"
            />
          </div>
        }
        onValuesChange={(values, changedField) => {
          let overrides: Record<string, string> = {};
          if (changedField === "state") overrides = { district: "", tahsil: "", city: "" };
          if (changedField === "district") overrides = { tahsil: "", city: "" };
          if (changedField === "tahsil") overrides = { city: "" };
          const merged = { ...values, ...overrides };
          setModalValues(merged);
          return overrides;
        }}
      />

      {/* ── Profile Image Zoom Modal ── */}
      <AnimatePresence>
        {isImagePreviewOpen && imageUrl && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsImagePreviewOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 cursor-zoom-out"
          >
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 p-3 cursor-default"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsImagePreviewOpen(false)}
                className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image Container */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                <img
                  src={imageUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Footer info in Modal */}
              <div className="p-4 pt-5 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{fullName}</h3>
                  <p className="text-sm font-semibold text-slate-500">{mentorData?.role || "Mentor"}</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-blue-600" /> Mentor
                </span>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
