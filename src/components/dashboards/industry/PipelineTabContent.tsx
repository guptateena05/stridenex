"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, Variants } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  getApplications, 
  getAllDropdownData,
  getApplicationsCount,
  getStudentByEmail, 
  updateApplicationStatus 
} from "@/services/industry.services";
import { useIndustry } from "@/context/IndustryContext";
import { useToast } from "@/context/ToastContext";
import { Loader2, Zap, Target, FileText } from "lucide-react";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" } },
};

interface Candidate {
  id: string;
  initials: string;
  bgColor: string;
  name: string;
  owner: string;
  status: string;
  studentEmail: string;
  internship: string;
  college: string;
  skills: string[];
  match: number;
  firstName?: string;
  lastName?: string;
  course?: string;
  department?: string;
  mobileNo?: string;
  resume?: string;
}

interface DropdownOption {
  name: string;
  title: string;
}

export default function PipelineTabContent() {
  const { industryData, loading: industryLoading, error: industryError } = useIndustry();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({
    "Applied": [],
    "Shortlisted": [],
    "Tech Interview": [],
    "HR": [],
    "Rejected": [],
    "Selected": [],
    "Accepted": []
  });
  
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    "Applied": 0,
    "Shortlisted": 0,
    "Tech Interview": 0,
    "HR": 0,
    "Rejected": 0,
    "Selected": 0,
    "Accepted": 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const companyName = industryData?.company_name || "";

  // Dropdown / filter states
  const [opportunityType, setOpportunityType] = useState<string>("Internship");
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>("All");
  const [subFilterOptions, setSubFilterOptions] = useState<DropdownOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);

  const currentColumns = useMemo(() => {
    return [
      { id: "Applied", title: "Applied", color: "bg-slate-800" },
      { id: "Shortlisted", title: "Shortlisted", color: "bg-blue-600" },
      { id: "Tech Interview", title: "Tech Interview", color: "bg-orange-500" },
      { id: "HR", title: "HR", color: "bg-indigo-500" },
      { id: "Rejected", title: "Rejected", color: "bg-red-600" },
      { id: "Selected", title: "Selected", color: "bg-emerald-500" },
      { id: "Accepted", title: "Accepted", color: "bg-teal-600" }
    ];
  }, [opportunityType]);

  const handleCardClick = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSelectedStatus(candidate.status);
    setSelectedStudentEmail(candidate.studentEmail);
    setIsModalOpen(true);
    setLoadingDetails(true);
    
    // Set fallback details immediately from the card
    setStudentDetails({
      name: candidate.studentEmail,
      first_name: candidate.firstName || "",
      last_name: candidate.lastName || "",
      college: candidate.college || "",
      course: candidate.course || "",
      stream: candidate.department || ""
    });

    try {
      const response = await getStudentByEmail(candidate.studentEmail);
      if (response && response.message && response.message.data) {
        setStudentDetails(response.message.data);
      }
    } catch (err) {
      console.error("Failed to fetch student details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchApplications = useCallback(async (
    compName: string,
    type: string,
    subFilter: string
  ) => {
    try {
      setLoading(true);
      const params: any = {
        opportunity_type: type,
        industry: compName
      };

      if (subFilter && subFilter !== "All") {
        if (type === "Project") {
          params.project = subFilter;
          params.proect = subFilter;
        } else if (type === "Internship") {
          params.internship = subFilter;
        } else if (type === "Job") {
          params.job_profile = subFilter;
        }
      }

      const [response, responseCount] = await Promise.all([
        getApplications(params),
        getApplicationsCount(params).catch(err => {
          console.error("Error fetching application counts:", err);
          return null;
        })
      ]);

      const apiData =
        response?.data?.data ||
        response?.message?.data ||
        (Array.isArray(response?.data) ? response.data : []) ||
        (Array.isArray(response?.message) ? response.message : []) ||
        [];

      if (Array.isArray(apiData)) {
        const newCandidates: Record<string, Candidate[]> = {
          "Applied": [],
          "Shortlisted": [],
          "Tech Interview": [],
          "HR": [],
          "Rejected": [],
          "Selected": [],
          "Accepted": []
        };

        apiData.forEach((app: any) => {
          const email = app.email_id || app.student || "Student";
          
          const nameVal = app.first_name && app.last_name 
            ? `${app.first_name} ${app.last_name}` 
            : app.student_name || app.name || email.split('@')[0];

          const initialsVal = app.first_name
            ? (app.first_name.charAt(0) + (app.last_name ? app.last_name.charAt(0) : "")).toUpperCase()
            : email.charAt(0).toUpperCase();

          const bgColors = ["bg-red-500", "bg-blue-500", "bg-emerald-500", "bg-indigo-500", "bg-orange-500", "bg-purple-500"];
          const randomColor = bgColors[Math.floor(Math.random() * bgColors.length)];

          const candidate: Candidate = {
            id: app.name || Math.random().toString(),
            name: nameVal,
            owner: app.owner || app.modified_by || "Unknown",
            status: app.status || "Applied",
            studentEmail: email,
            internship: app.internship || app.project || app.job_profile || "Unknown",
            initials: initialsVal,
            bgColor: randomColor,
            college: app.college || (app.course && app.department ? `${app.course} (${app.department})` : "N/A"),
            skills: app.applied_on ? [new Date(app.applied_on).toLocaleDateString()] : [],
            match: Math.round(app.match_score) || 0,
            firstName: app.first_name,
            lastName: app.last_name,
            course: app.course,
            department: app.department,
            mobileNo: app.mobile_no,
            resume: app.resume || ""
          };
          
          if (newCandidates[candidate.status]) {
            newCandidates[candidate.status].push(candidate);
          } else {
            newCandidates["Applied"].push(candidate);
          }
        });

        setCandidates(newCandidates);
        setError(null);
      }

      let countData: any = {};
      if (responseCount) {
        if (responseCount.message && typeof responseCount.message === 'object') {
          if (responseCount.message.data && typeof responseCount.message.data === 'object') {
            countData = responseCount.message.data;
          } else {
            countData = responseCount.message;
          }
        } else if (responseCount.data && typeof responseCount.data === 'object') {
          if (responseCount.data.data && typeof responseCount.data.data === 'object') {
            countData = responseCount.data.data;
          } else {
            countData = responseCount.data;
          }
        } else {
          countData = responseCount;
        }
      }

      setStatusCounts({
        "Applied": countData.Applied || 0,
        "Shortlisted": countData.Shortlisted || 0,
        "Tech Interview": countData["Tech Interview"] || 0,
        "HR": countData.HR || 0,
        "Rejected": countData.Rejected || 0,
        "Selected": countData.Selected || 0,
        "Accepted": countData.Accepted || 0
      });

    } catch (err: any) {
      console.error("Error fetching applications:", err);
      setError("Failed to load applications list");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeStatus = async () => {
    if (!selectedCandidate) return;

    const confirmMessage = `Are you sure you want to change ${selectedCandidate.name}'s status to ${selectedStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setUpdateStatusLoading(true);
      await updateApplicationStatus(selectedCandidate.id, selectedStatus);
      await fetchApplications(companyName, opportunityType, selectedSubFilter);
      setSelectedCandidate(prev => prev ? { ...prev, status: selectedStatus } : null);
      showToast(`Status updated to ${selectedStatus}`, "success");
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || "Failed to update status", "error");
      console.error(err);
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  // Load sub-filter options when opportunityType or companyName changes
  useEffect(() => {
    const fetchOptions = async () => {
      if (!companyName) return;
      try {
        setLoadingOptions(true);
        const res = await getAllDropdownData({
          opportunity_type: opportunityType,
          industry: companyName
        });
        const responseData = res?.message?.data || res?.data || res?.message || [];
        const options: DropdownOption[] = Array.isArray(responseData) 
          ? responseData.map((item: any) => ({
              name: item.name || item,
              title: item.title || item.name || item
            }))
          : [];
        setSubFilterOptions(options);
      } catch (err) {
        console.error("Error loading options:", err);
        setSubFilterOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [opportunityType, companyName]);

  // Synchronize state with URL search params on load
  useEffect(() => {
    if (companyName) {
      const typeParam = searchParams.get("type");
      const projectParam = searchParams.get("project");
      const internshipParam = searchParams.get("internship");
      const jobParam = searchParams.get("job_profile");

      let resolvedType = "Internship";
      let resolvedSubFilter = "All";

      if (typeParam) {
        const typeLower = typeParam.toLowerCase();
        if (typeLower === "project") resolvedType = "Project";
        else if (typeLower === "internship" || typeLower === "internships") resolvedType = "Internship";
        else if (typeLower === "job" || typeLower === "job_profile") resolvedType = "Job";
      }
      if (resolvedType === "Project" && projectParam) {
        resolvedSubFilter = projectParam;
      } else if (resolvedType === "Internship" && internshipParam) {
        resolvedSubFilter = internshipParam;
      } else if (resolvedType === "Job" && jobParam) {
        resolvedSubFilter = jobParam;
      }

      setOpportunityType(resolvedType);
      setSelectedSubFilter(resolvedSubFilter);
      fetchApplications(companyName, resolvedType, resolvedSubFilter);
    }
  }, [companyName, searchParams, fetchApplications]);

  const handleTypeChange = (type: string) => {
    setOpportunityType(type);
    setSelectedSubFilter("All");
    if (companyName) {
      fetchApplications(companyName, type, "All");
      const newParams = new URLSearchParams();
      newParams.set("type", type);
      router.push(`/industry/dashboard/pipeline?${newParams.toString()}`);
    }
  };

  const handleSubFilterChange = (filter: string) => {
    setSelectedSubFilter(filter);
    if (companyName) {
      fetchApplications(companyName, opportunityType, filter);
      const newParams = new URLSearchParams();
      newParams.set("type", opportunityType);
      if (filter !== "All") {
        if (opportunityType === "Project") {
          newParams.set("project", filter);
        } else if (opportunityType === "Internship") {
          newParams.set("internship", filter);
        } else if (opportunityType === "Job") {
          newParams.set("job_profile", filter);
        }
      }
      router.push(`/industry/dashboard/pipeline?${newParams.toString()}`);
    }
  };

  if (industryLoading || (loading && Object.values(candidates).every(arr => arr.length === 0))) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Syncing Pipeline Data...</p>
      </div>
    );
  }

  if ((industryError || error) && Object.values(candidates).every(arr => arr.length === 0)) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <Zap className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
        <p className="text-slate-500 font-medium max-w-md">{industryError || error}</p>
        <button
          onClick={() => companyName && fetchApplications(companyName, opportunityType, selectedSubFilter)}
          className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-full space-y-6">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-slate-800 text-left">Application Pipeline</h2>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          {/* Opportunity Type Dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 sm:flex-initial text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opportunity Type</label>
            <div className="relative">
              <select
                value={opportunityType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none transition-all hover:bg-white hover:border-purple-200 cursor-pointer"
              >
                <option value="Internship">Internships</option>
                <option value="Project">Projects</option>
                <option value="Job">Jobs</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sub-filter Dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[240px] flex-1 sm:flex-initial text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {opportunityType === "Project" ? "Filter by Project" : opportunityType === "Internship" ? "Filter by Internship" : "Filter by Job"}
            </label>
            <div className="relative">
              <select
                value={selectedSubFilter}
                onChange={(e) => handleSubFilterChange(e.target.value)}
                disabled={loadingOptions}
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none transition-all hover:bg-white hover:border-purple-200 cursor-pointer disabled:opacity-60"
              >
                <option value="All">All {opportunityType === "Project" ? "Projects" : opportunityType === "Internship" ? "Internships" : "Jobs"}</option>
                {subFilterOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.title.trim()}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {loadingOptions ? (
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="flex gap-2 min-h-[600px] w-full">
        {currentColumns.map((col) => (
          <motion.div variants={item} key={col.id} className="flex-1 min-w-0 flex flex-col gap-3 bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100">
            {/* Column Header */}
            <div className={`${col.color} text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm`}>
              <h3 className="font-bold text-sm tracking-wide">{col.title}</h3>
              <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {statusCounts[col.id] || 0}
              </div>
            </div>

            {/* Candidate Cards */}
            <div className="flex flex-col gap-3 overflow-y-auto hide-scrollbar flex-1">
              {candidates[col.id]?.length > 0 ? (
                candidates[col.id].map((candidate) => (
                  <div 
                    key={candidate.id} 
                    onClick={() => handleCardClick(candidate)}
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full ${candidate.bgColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                        {candidate.initials}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="font-bold text-slate-800 text-[11px] truncate" title={candidate.name}>{candidate.name}</h4>
                        <p className="text-[9px] text-slate-400 font-semibold truncate" title={candidate.internship}>{candidate.internship}</p>
                        <p className="text-[9px] text-slate-400 font-semibold truncate flex items-center gap-1 mt-0.5" title={candidate.status}>
                          <span className={`w-1.5 h-1.5 rounded-full ${candidate.status === 'Applied' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                          {candidate.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 2).map(skill => (
                          <span key={skill} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[8px] font-semibold rounded border border-slate-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                      {candidate.match > 0 && (
                        <div className="text-emerald-600 font-bold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {candidate.match}%
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Empty Stage</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Student Details Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-slate-900 border-b border-slate-100 flex items-center justify-between p-6 relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
               <div className="relative z-10 flex items-center gap-4">
                 <div className={`w-14 h-14 rounded-2xl ${selectedCandidate?.bgColor || 'bg-white/10'} border border-white/20 text-white flex items-center justify-center text-xl font-bold shadow-2xl`}>
                    {selectedCandidate?.initials || "S"}
                 </div>
                 <div className="text-left">
                   <h2 className="text-xl font-bold text-white leading-tight">{selectedCandidate?.name || "Student Details"}</h2>
                   <p className="text-xs font-semibold text-slate-400 mt-1">{selectedCandidate?.college || "Application Record"}</p>
                 </div>
               </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="relative z-10 text-white/50 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors font-bold text-lg"
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50">
               {loadingDetails ? (
                <div className="flex justify-center items-center py-10">
                   <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
               ) : studentDetails ? (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                     {[
                       { label: "Email", value: studentDetails.name || studentDetails.email_id },
                       { label: "First Name", value: studentDetails.first_name },
                       { label: "Last Name", value: studentDetails.last_name },
                       { label: "College", value: studentDetails.college },
                       { label: "Stream", value: studentDetails.stream || studentDetails.department },
                       { label: "Course", value: studentDetails.course },
                     ].map((item, idx) => (
                       <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0 text-left">
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                         <span className="text-sm font-bold text-slate-800 text-left sm:text-right break-all sm:max-w-[200px]">{item.value || "N/A"}</span>
                       </div>
                     ))}
                  </div>
                  
                  {/* Resume Section */}
                  {(selectedCandidate?.resume || studentDetails?.resume) && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-4 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-orange-500" /> Resume
                        </span>
                        <a 
                          href={(selectedCandidate?.resume || studentDetails?.resume || "").startsWith("http") 
                            ? (selectedCandidate?.resume || studentDetails?.resume) 
                            : `https://devstridenex.quantcloud.in${selectedCandidate?.resume || studentDetails?.resume}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline transition-colors flex items-center gap-1"
                        >
                          View Resume
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-4">
                     <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest text-left flex items-center gap-2 mb-4">
                       <Target className="w-4 h-4 text-purple-500" /> Update Pipeline Status
                     </h3>
                     <div className="flex flex-col gap-3 w-full">
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Zap className="h-4 w-4 text-slate-400" />
                         </div>
                         <select 
                           value={selectedStatus}
                           onChange={(e) => setSelectedStatus(e.target.value)}
                           className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none transition-all hover:bg-white hover:border-purple-200 cursor-pointer"
                         >
                            {currentColumns.filter(col => col.id !== "Accepted").map(col => (
                              <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                         </select>
                         <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                         </div>
                       </div>
                       
                       {selectedStatus !== selectedCandidate?.status && (
                          <div className="pt-1">
                            <button 
                              onClick={handleChangeStatus}
                              disabled={updateStatusLoading}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-5 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 active:scale-[0.98]"
                            >
                               {updateStatusLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "Confirm Status Change"}
                            </button>
                          </div>
                       )}
                     </div>
                  </div>
                </div>
               ) : (
                <div className="text-center py-10 text-slate-500 font-medium">
                  No details found for this student.
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
