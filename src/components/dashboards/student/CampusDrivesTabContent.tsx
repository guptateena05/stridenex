"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Loader2,
  Search,
  Building2,
  Calendar,
  DollarSign,
  Award,
  Briefcase,
  GraduationCap,
  Clock,
  Check,
  X
} from "lucide-react";
import { BaseCard } from "@/components/dashboards/shared/BaseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Dropdown from "@/components/ui/Dropdown";
import { BASE_URL } from "@/services/api.services";
import { getCampusDriveList, applyCampusDrive, getStudentByEmail } from "@/services/student.services";
import { useAuth } from "@/context/AuthContext";
import StatsWidget from "@/components/dashboards/widgets/StatsWidget";

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

export default function CampusDrivesTabContent() {
  const { currentUser } = useAuth();
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [successfullyApplied, setSuccessfullyApplied] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState("");
  const [studentCollege, setStudentCollege] = useState("");
  const [filterSkill, setFilterSkill] = useState<string[]>([]);

  useEffect(() => {
    // Load successfully applied drive IDs from localStorage
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`applied_campus_drives_${currentUser}`);
        if (saved) {
          setSuccessfullyApplied(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Error loading applied drives from localStorage:", err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      getStudentByEmail(currentUser).then(res => {
        const studentData = res?.data?.data || res?.message?.data || res?.data || res;
        if (studentData?.college) {
          setStudentCollege(studentData.college);
        }
      }).catch(err => console.error("Error fetching student profile:", err));
    }
  }, [currentUser]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentUser) {
        fetchDrives();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [currentUser, studentCollege, filterSkill]);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const response = await getCampusDriveList({ 
        student: currentUser || undefined,
        college: studentCollege || undefined,
        required_skill: filterSkill.length > 0 ? filterSkill.join(",") : undefined
      });
      let drivesArray = response?.data?.drives || response?.message?.data?.drives || response?.message?.drives || response?.drives;
      
      if (!drivesArray) {
        if (Array.isArray(response?.data)) drivesArray = response.data;
        else if (Array.isArray(response?.message?.data)) drivesArray = response.message.data;
        else if (Array.isArray(response?.message)) drivesArray = response.message;
        else if (Array.isArray(response)) drivesArray = response;
      }
      
      const driveList = Array.isArray(drivesArray) ? drivesArray.map((d: any) => ({
        ...d,
        company: d.industry_name || d.industry || d.company,
        role: d.job_title || d.role,
        branch: d.college || d.branch
      })) : [];
      
      setDrives(driveList);
    } catch (err) {
      console.error("Error fetching campus drives:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (drive: any) => {
    if (!currentUser) {
      alert("Authentication Required: Please log in to apply for campus drives.");
      return;
    }

    try {
      setApplying(drive.name);
      const payload = {
        student: currentUser,
        drive: drive.name,
        remarks: "Applying to campus drive."
      };

      const response = await applyCampusDrive(payload);

      // Check if successful (or duplicate warning 409)
      const isSuccess = response && (response.status === 200 || response.status === "200" || response.message?.status === 200 || response.message?.message?.includes("success"));
      const errMsg = response && typeof response.message === "object"
        ? response.message.message
        : response?.message;

      if (isSuccess || (errMsg && errMsg.toLowerCase().includes("already applied"))) {
        setDrives(prev => prev.map(d => d.name === drive.name ? { ...d, applied_status: "Applied" } : d));
        setFeedback({
          type: "success",
          message: isSuccess 
            ? `Successfully applied for Campus Drive with ${drive.company || drive.name}!`
            : "You have already applied for this campus drive."
        });
      } else {
        setFeedback({
          type: "error",
          message: errMsg || "Failed to apply. Please try again."
        });
      }
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error("Application error:", err);
      setFeedback({
        type: "error",
        message: err?.message || "Something went wrong. Please try again."
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setApplying(null);
    }
  };

  // Filter drives based on search
  const filteredDrives = drives.filter(drive => {
    const query = search.toLowerCase();
    const company = (drive.company || "").toLowerCase();
    const designation = (drive.job_title || drive.role || "").toLowerCase();
    const branch = (drive.branch || "").toLowerCase();
    return company.includes(query) || designation.includes(query) || branch.includes(query);
  });

  // Calculate statistics
  const statsData = [
    {
      id: 1,
      title: "ACTIVE DRIVES",
      value: drives.filter(d => d.status !== "Closed").length.toString(),
      icon: Briefcase,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      id: 2,
      title: "APPLIED DRIVES",
      value: drives.filter(d => d.applied_status && d.applied_status !== "Not Applied").length.toString(),
      icon: Check,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      id: 3,
      title: "UPCOMING DRIVES",
      value: drives.filter(d => d.status === "Registrations Open").length.toString(),
      icon: Calendar,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      id: 4,
      title: "TOTAL DRIVES",
      value: drives.length.toString(),
      icon: Award,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600"
    }
  ];

  if (loading && drives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Fetching college campus drives...</p>
      </div>
    );
  }

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
          className={`p-4 rounded-xl border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          } text-sm font-medium mb-4 flex items-center justify-between shadow-sm`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-4 opacity-50 hover:opacity-100">×</button>
        </motion.div>
      )}

      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row items-center justify-between gap-4 px-1">
        <div className="text-center md:text-left flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">College Campus Drives</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 opacity-90 font-outfit">
            Participate and apply in active campus placement drives organized by your institution
          </p>
        </div>

        {/* Filter Fields */}
        <div className="flex flex-wrap items-center gap-3">

          <div className="w-full md:w-48 z-10">
            <Dropdown
              id="skill-filter"
              modalTitle="Skills"
              placeholder="Filter by Skill"
              endpoint={`${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`}
              params={{ doctype: "Skill" }}
              mapOptions={(data: any) => data.map((item: any) => ({
                value: item.name,
                label: item.name
              }))}
              value={filterSkill}
              onChange={setFilterSkill}
              multiSelect={true}
              searchable={true}
            />
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search drives or roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <StatsWidget
            key={stat.id}
            title={stat.title}
            data={{
              value: stat.value,
              icon: stat.icon,
              iconBg: stat.iconBg,
              iconColor: stat.iconColor
            }}
          />
        ))}
      </motion.div>

      {/* Drives Grid */}
      {filteredDrives.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">No campus drives found matching your search.</p>
        </div>
      ) : (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrives.map((drive, idx) => {
            const hasApplied = drive.applied_status && drive.applied_status !== "Not Applied";
            const isClosed = drive.status?.toLowerCase() === "closed";
            const roleTitle = drive.job_title || drive.role || "Special Placement Drive";
            const rawPackage = drive.package_offered || drive.package || "As per industry";
            const formattedPackage = !isNaN(Number(rawPackage)) ? `${rawPackage} LPA` : rawPackage;

            return (
              <BaseCard
                key={drive.name || idx}
                padding="none"
                className="h-full flex flex-col justify-between overflow-hidden border-slate-200 hover:shadow-lg transition-all group bg-white shadow-sm"
              >
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-lg font-bold text-violet-600 group-hover:scale-105 transition-transform shadow-sm">
                          {(drive.company || drive.name || "C")[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 line-clamp-1">{roleTitle}</h3>
                          <p className="text-xs text-slate-500 font-medium">{drive.company || "Industry Partner"}</p>
                          {drive.college && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1 line-clamp-1">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {drive.college}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={`${
                        hasApplied 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : isClosed
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                      } rounded-full text-[9px] px-2 py-0.5 font-bold border`}>
                        {hasApplied ? drive.applied_status : isClosed ? "Closed" : "Active"}
                      </Badge>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{formattedPackage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{drive.job_type || "Full-Time"}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">Criteria: {drive.criteria || "All students eligible"}</span>
                      </div>
                    </div>

                    {/* Branch and Date Info */}
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Drive Date</span>
                        <span className="text-slate-800">{drive.drive_date ? drive.drive_date.split(" ")[0] : "TBD"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Registration Deadline</span>
                        <span className="text-red-500">{drive.registeration_deadline ? drive.registeration_deadline.split(" ")[0] : "TBD"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDrive(drive);
                        setShowDetails(true);
                      }}
                      className="flex-1 rounded-xl h-10 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      View Details
                    </Button>

                    <Button
                      size="sm"
                      disabled={hasApplied || isClosed || applying === drive.name}
                      onClick={() => handleApply(drive)}
                      className={`flex-1 rounded-xl h-10 text-xs font-bold shadow-sm transition-all ${
                        hasApplied
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-not-allowed border border-emerald-200"
                          : isClosed
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      }`}
                    >
                      {applying === drive.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : hasApplied ? (
                        "Applied"
                      ) : (
                        "Apply Now"
                      )}
                    </Button>
                  </div>
                </div>
              </BaseCard>
            );
          })}
        </motion.div>
      )}

      {/* Details Dialog */}
      {showDetails && selectedDrive && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col"
          >
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-lg font-bold text-violet-600">
                    {(selectedDrive.company || selectedDrive.name || "C")[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedDrive.job_title || selectedDrive.role || "Placement Drive"}</h2>
                    <p className="text-sm font-semibold text-slate-500">{selectedDrive.company || "Industry Partner"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Package Offered</p>
                  <p className="mt-0.5 font-bold text-slate-800">{!isNaN(Number(selectedDrive.package_offered || selectedDrive.package)) ? `${selectedDrive.package_offered || selectedDrive.package} LPA` : (selectedDrive.package_offered || selectedDrive.package || "As per industry")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Job Type</p>
                  <p className="mt-0.5 font-bold text-slate-800">{selectedDrive.job_type || "Full-Time"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Passing Year</p>
                  <p className="mt-0.5 font-bold text-slate-800">{selectedDrive.passing_year || "2026 Batch"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</p>
                  <p className="mt-0.5 font-bold text-slate-800">{(selectedDrive.applied_status && selectedDrive.applied_status !== "Not Applied") ? selectedDrive.applied_status : (selectedDrive.status || "Active")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Eligibility</h3>
                <p className="text-sm text-slate-700 font-semibold p-3 bg-orange-50/50 border border-orange-100 rounded-xl">
                  {selectedDrive.criteria || "All students are eligible to apply."}
                </p>
              </div>

              {selectedDrive.required_skill && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedDrive.required_skill)
                      ? selectedDrive.required_skill.map((s: any) => (typeof s === 'string' ? s : s.skill)).filter(Boolean)
                      : String(selectedDrive.required_skill).split(",")
                    ).map((s: string, i: number) => (
                      <Badge key={i} className="bg-slate-100 text-slate-700 border-none rounded-lg text-xs font-medium px-2.5 py-1">
                        {s.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDrive.branches && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligible Branches</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {String(selectedDrive.branches).split(",").map((b: string, i: number) => (
                      <Badge key={i} className="bg-blue-50 text-blue-700 border-blue-100 rounded-lg text-xs font-medium px-2.5 py-1">
                        {b.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDetails(false)}
                className="rounded-xl h-10 border-slate-200 text-slate-600"
              >
                Close
              </Button>
              <Button
                disabled={successfullyApplied.includes(selectedDrive.name) || selectedDrive.status?.toLowerCase() === "closed" || applying === selectedDrive.name}
                onClick={() => {
                  handleApply(selectedDrive);
                  setShowDetails(false);
                }}
                className={`rounded-xl h-10 font-bold px-6 ${
                  successfullyApplied.includes(selectedDrive.name)
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-not-allowed border border-emerald-200"
                    : selectedDrive.status?.toLowerCase() === "closed"
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {successfullyApplied.includes(selectedDrive.name) ? "Applied" : "Apply to Drive"}
              </Button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}
