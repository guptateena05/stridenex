"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Clock,
  Plus,
  Search,
  Users,
  Trophy,
  ArrowLeft,
  Download,
  CheckCircle2,
  ChevronRight,
  Mail,
  Send,
  Bell,
  FileText,
  DollarSign,
  Star,
  Hourglass,
  Check,
  ChevronDown,
  TrendingUp,
  Loader2,
  Pen,
  Trash2,
  BarChart
} from "lucide-react";
import { BaseCard } from "@/components/dashboards/shared/BaseCard";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  getCollegeDetails,
  getCollegeDrives,
  createCollegeDrive,
  updateCollegeDrive,
  deleteCollegeDrive,
  getDriveCount,
  getPlacementList,
  getPlacementCounts,
  getEligibleStudents,
  getMasterData,
  updateCampusDriveApplicationStatus,
  sendCandidateStatusMail,
  getPlacementStats,
  getBranchWisePerformance,
  getPlacementFunnel,
  getSalaryBands,
  getNonEligibleStudents,
  exportEligibleStudents,
  exportNotEligibleStudents,
  createSkill
} from "@/services/college.services";
import DashboardDynamicModal, { DynamicField } from "@/components/dashboards/shared/DashboardDynamicModal";
import { FaRupeeSign } from 'react-icons/fa';
import { BASE_URL } from "@/services/api.services";
import Dropdown from "@/components/ui/Dropdown";


// Rich student dataset for the tracker and eligibility checks
const initialStudents = [
  { id: "s1", name: "Priya Sharma", branch: "CSE", cgpa: 8.7, backlogs: 0, drivesApplied: 2, shortlisted: 1, selectedId: "2394", package: "₹22 LPA", status: "Placed" },
  { id: "s2", name: "Rahul Mehta", branch: "ECE", cgpa: 7.2, backlogs: 0, drivesApplied: 2, shortlisted: 0, selectedId: "", package: "", status: "In Process" },
  { id: "s3", name: "Aisha Khan", branch: "MBA", cgpa: 8.1, backlogs: 0, drivesApplied: 1, shortlisted: 0, selectedId: "", package: "", status: "In Process" },
  { id: "s4", name: "Vikram Singh", branch: "ME", cgpa: 6.8, backlogs: 0, drivesApplied: 3, shortlisted: 1, selectedId: "", package: "", status: "Shortlisted" },
  { id: "s5", name: "Sneha Patil", branch: "CSE", cgpa: 9.1, backlogs: 0, drivesApplied: 2, shortlisted: 1, selectedId: "", package: "", status: "Shortlisted" },
  { id: "s6", name: "Arjun Nair", branch: "CSE", cgpa: 8.4, backlogs: 0, drivesApplied: 1, shortlisted: 1, selectedId: "2401", package: "₹9 LPA", status: "Placed" },
  { id: "s7", name: "Kiran Reddy", branch: "ECE", cgpa: 7.8, backlogs: 0, drivesApplied: 1, shortlisted: 0, selectedId: "", package: "", status: "In Process" },
  { id: "s8", name: "Tanya Gupta", branch: "CSE", cgpa: 6.9, backlogs: 1, drivesApplied: 0, shortlisted: 0, selectedId: "", package: "", status: "Not Applied" }
];

// Active drives data
const initialDrives = [
  {
    id: "tcs-2025",
    company: "TCS",
    role: "Software Engineer · Systems Engineer",
    driveDate: "2026-03-15",
    regDeadline: "2026-03-10",
    package: "₹7-11 LPA",
    type: "Full-Time",
    criteria: {
      minCgpa: 6,
      backlogs: 0,
      branches: ["CSE", "ECE", "IT", "ME"],
      passingYear: 2025
    },
    stats: {
      eligible: 6,
      registered: 4,
      shortlisted: 2,
      selected: 1
    },
    status: "Registrations Open",
    students: [
      { id: "s1", name: "Priya Sharma", branch: "CSE", cgpa: 8.7, backlogs: 0, status: "Registered", placementStatus: "Placed" },
      { id: "s2", name: "Rahul Mehta", branch: "ECE", cgpa: 7.2, backlogs: 0, status: "Registered", placementStatus: "" },
      { id: "s4", name: "Arjun Nair", branch: "CSE", cgpa: 8.4, backlogs: 0, status: "Registered", placementStatus: "Placed" },
      { id: "s5", name: "Sneha Patil", branch: "CSE", cgpa: 9.1, backlogs: 0, status: "Shortlisted", placementStatus: "" },
      { id: "s6", name: "Arjun Nair", branch: "CSE", cgpa: 8.4, backlogs: 0, status: "Selected", placementStatus: "Placed" },
      { id: "s7", name: "Kiran Reddy", branch: "ECE", cgpa: 7.8, backlogs: 0, status: "Eligible", placementStatus: "" }
    ]
  },
  {
    id: "infosys-2025",
    company: "Infosys",
    role: "Systems Engineer · Process Executive",
    driveDate: "2026-03-18",
    regDeadline: "2026-03-12",
    package: "₹6.5 LPA",
    type: "Full-Time",
    criteria: {
      minCgpa: 5.5,
      backlogs: 0,
      branches: ["CSE", "ECE", "ME"],
      passingYear: 2025
    },
    stats: {
      eligible: 5,
      registered: 2,
      shortlisted: 1,
      selected: 0
    },
    status: "Registrations Open",
    students: [
      { id: "s1", name: "Priya Sharma", branch: "CSE", cgpa: 8.7, backlogs: 0, status: "Registered", placementStatus: "Placed" },
      { id: "s2", name: "Rahul Mehta", branch: "ECE", cgpa: 7.2, backlogs: 0, status: "Registered", placementStatus: "" }
    ]
  },
  {
    id: "razorpay-2025",
    company: "Razorpay",
    role: "Backend Engineer · Data Scientist · PM",
    driveDate: "2026-03-25",
    regDeadline: "2026-03-18",
    package: "₹18-24 LPA",
    type: "Full-Time + PPO",
    criteria: {
      minCgpa: 7.5,
      backlogs: 0,
      branches: ["CSE", "IT", "ECE"],
      passingYear: 2025
    },
    stats: {
      eligible: 4,
      registered: 2,
      shortlisted: 1,
      selected: 0
    },
    status: "Registrations Open",
    students: [
      { id: "s1", name: "Priya Sharma", branch: "CSE", cgpa: 8.7, backlogs: 0, status: "Registered", placementStatus: "Placed" },
      { id: "s5", name: "Sneha Patil", branch: "CSE", cgpa: 9.1, backlogs: 0, status: "Registered", placementStatus: "" }
    ]
  }
];
const funnelData = [
  { label: "Final Year Students", value: 680, width: "100%", color: "bg-slate-800" },
  { label: "Eligible (Score ≥60)", value: 521, width: "80%", color: "bg-blue-900" },
  { label: "Applications Sent", value: 847, width: "120%", color: "bg-blue-600" },
  { label: "Shortlisted", value: 312, width: "50%", color: "bg-orange-500" },
  { label: "Interviews Done", value: 156, width: "25%", color: "bg-orange-400" },
  { label: "Offers Received", value: 98, width: "15%", color: "bg-emerald-500" },
  { label: "Accepted Offers", value: 89, width: "12%", color: "bg-emerald-600" },
];

const salaryBands = [
  { range: "<4 LPA", percentage: 12, color: "bg-red-500" },
  { range: "4-8 LPA", percentage: 38, color: "bg-orange-400" },
  { range: "8-15 LPA", percentage: 35, color: "bg-emerald-500" },
  { range: "15+ LPA", percentage: 15, color: "bg-blue-600" },
];

const mockRecruiters = [
  { name: "TCS", offers: 24, package: "₹3.5 LPA", color: "bg-blue-600" },
  { name: "Infosys", offers: 18, package: "₹4.5 LPA", color: "bg-emerald-600" },
  { name: "Zepto", offers: 5, package: "₹8.0 LPA", color: "bg-orange-600" },
  { name: "Razorpay", offers: 8, package: "₹15.0 LPA", color: "bg-indigo-600" },
  { name: "Google", offers: 3, package: "₹32.0 LPA", color: "bg-purple-600" },
];

export default function CampusDrivesTabContent() {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [collegeDetails, setCollegeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drivesLoading, setDrivesLoading] = useState(false);
  const [drivesList, setDrivesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>(initialStudents);
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);
  const [editingDrive, setEditingDrive] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"drives" | "tracker" | "eligibility" | "stats">("drives");

  // Sync subtab from URL parameter (e.g. ?subtab=stats)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const subtab = searchParams.get("subtab");
      if (subtab === "stats" || subtab === "tracker" || subtab === "eligibility" || subtab === "drives") {
        setActiveSubTab(subtab);
      }
    }
  }, []);

  // Eligibility view active drive selection state
  const [eligibilityDriveId, setEligibilityDriveId] = useState("");

  // Student table filter inside details view
  const [selectedStudentStatusFilter, setSelectedStudentStatusFilter] = useState<"Eligible" | "Registered" | "Shortlisted" | "Selected">("Registered");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDriveModalOpen, setIsAddDriveModalOpen] = useState(false);
  const [isSubmittingDrive, setIsSubmittingDrive] = useState(false);
  const [isDeletingDrive, setIsDeletingDrive] = useState(false);

  // API-driven metrics for campus drives
  const [driveCounts, setDriveCounts] = useState<any>(null);
  const [placementStats, setPlacementStats] = useState<any>(null);
  const [branchPerformance, setBranchPerformance] = useState<any[] | null>(null);
  const [dynamicFunnelData, setDynamicFunnelData] = useState<any[] | null>(null);
  const [dynamicSalaryBands, setDynamicSalaryBands] = useState<any | null>(null);

  // Placement tracker API state (Student Tracker tab)
  const [placementList, setPlacementList] = useState<any[]>([]);
  const [placementCounts, setPlacementCounts] = useState<{ placed: number; shortlisted: number; applied_to_drives: number; not_applied_yet: number } | null>(null);
  const [trackerLoaded, setTrackerLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Per-drive placement state (Manage panel)
  const [drivePlacementCounts, setDrivePlacementCounts] = useState<{ placed: number; shortlisted: number; applied_to_drives: number; not_applied_yet: number } | null>(null);
  const [drivePlacementLoading, setDrivePlacementLoading] = useState(false);
  const [drivePlacementList, setDrivePlacementList] = useState<any[]>([]);
  const [driveEligibleStudents, setDriveEligibleStudents] = useState<any | null>(null);
  const [driveEligibleLoading, setDriveEligibleLoading] = useState(false);
  const [eligiblePage, setEligiblePage] = useState(1);
  const [eligiblePageSize, setEligiblePageSize] = useState(10);

  // Tab Eligibility API state
  const [tabEligibleStudents, setTabEligibleStudents] = useState<any | null>(null);
  const [tabNonEligibleStudents, setTabNonEligibleStudents] = useState<any | null>(null);
  const [tabEligibleLoading, setTabEligibleLoading] = useState(false);
  const [eligibilityBranches, setEligibilityBranches] = useState<string[]>([]);
  const [eligibilityCgpa, setEligibilityCgpa] = useState("");
  const [eligibilityBacklog, setEligibilityBacklog] = useState("");
  const [eligibilityAcademicYear, setEligibilityAcademicYear] = useState("All");
  const [availableBranches, setAvailableBranches] = useState<string[]>(["CS", "CSE", "ECE", "IT", "ME", "MBA", "Civil", "EE"]);

  // Fetch available branches from master API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await getMasterData("College Department");
        const raw = res?.data ?? res?.message?.data ?? res?.message ?? res;
        const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        if (arr.length > 0) {
          const names = arr.map((item: any) => item.branch_name || item.branch || item.name || String(item)).filter(Boolean);
          const uniqueBranches = Array.from(new Set([...names, "CS", "CSE", "ECE", "IT", "ME", "MBA", "Civil", "EE"]));
          setAvailableBranches(uniqueBranches);
        }
      } catch (err) {
        console.error("Failed to fetch branches from master:", err);
      }
    };
    fetchBranches();
  }, []);

  // Load college details from localStorage or API
  useEffect(() => {
    const loadDetails = async () => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem("collegeDetails") : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCollegeDetails(parsed);
          return;
        } catch (_) { }
      }

      if (currentUser) {
        try {
          setLoading(true);
          const res = await getCollegeDetails(currentUser);
          const data = res?.data || res?.message?.data || res?.message;
          if (data) {
            setCollegeDetails(data);
            if (typeof window !== 'undefined') {
              localStorage.setItem("collegeDetails", JSON.stringify(data));
            }
          }
        } catch (err) {
          console.error("Failed to load college details in Campus Drives:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    if (currentUser) {
      loadDetails();
    }
  }, [currentUser]);

  // Listen for details-fetched event from banner
  useEffect(() => {
    const handleDetailsFetched = () => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem("collegeDetails") : null;
      if (stored) {
        try {
          setCollegeDetails(JSON.parse(stored));
        } catch (_) { }
      }
    };
    window.addEventListener("college-details-fetched", handleDetailsFetched);
    return () => window.removeEventListener("college-details-fetched", handleDetailsFetched);
  }, []);

  const mapBackendDriveToUI = (dbDrive: any) => {
    // Parse criteria to numeric CGPA (e.g. "8.0 CGPA" -> 8.0 or "60" -> 60)
    let minCgpa = 0;
    if (dbDrive.criteria) {
      const match = String(dbDrive.criteria).match(/[\d.]+/);
      minCgpa = match ? Number(match[0]) : 0;
    }
    const maxBacklogs = dbDrive.backlog !== undefined && dbDrive.backlog !== null ? Number(dbDrive.backlog) : 0;

    const branchesList = dbDrive.branches || dbDrive.branch || [];
    const branches = branchesList.map((b: any) => b.branch_name || b.branch || (typeof b === 'string' ? b : "")).filter(Boolean);

    const designationsList = dbDrive.designation || dbDrive.designations || [];
    const designations = designationsList.map((d: any) => d.designation || d.name || (typeof d === 'string' ? d : "")).filter(Boolean);

    const skillsList = dbDrive.required_skill || dbDrive.required_skills || [];
    const required_skills = skillsList.map((s: any) => s.skill || s.skill_name || s.name || (typeof s === 'string' ? s : "")).filter(Boolean);

    const company = dbDrive.industry || dbDrive.industry_name || (dbDrive.name && dbDrive.name.includes("-") ? dbDrive.name.split("-")[0] : dbDrive.name) || "";
    const firstDesignation = designations && designations[0] ? designations[0] : "";
    const role = dbDrive.job_title || dbDrive.role || firstDesignation || "";

    // Compute stats from API response fields or stats sub-object or default
    const stats = {
      shortlisted: dbDrive.shortlisted !== undefined && dbDrive.shortlisted !== null ? Number(dbDrive.shortlisted) : (dbDrive.stats?.shortlisted ?? 0),
      registered: dbDrive.total_applications !== undefined && dbDrive.total_applications !== null ? Number(dbDrive.total_applications) : (dbDrive.stats?.registered ?? 0),
      selected: dbDrive.placed !== undefined && dbDrive.placed !== null ? Number(dbDrive.placed) : (dbDrive.stats?.selected ?? 0),
      eligible: dbDrive.stats?.eligible ?? 0
    };

    // If stats are empty/0, let's compute them dynamically from studentsList for visual richness
    if (stats.eligible === 0 && studentsList.length > 0) {
      const eligibleStudents = studentsList.filter(s => {
        const failsCgpa = s.cgpa < minCgpa;
        const failsBacklog = s.backlogs > maxBacklogs;
        const failsBranch = branches.length > 0 && !branches.includes(s.branch);
        return !failsCgpa && !failsBacklog && !failsBranch;
      });
      stats.eligible = eligibleStudents.length;
    }

    return {
      id: dbDrive.name,
      name: dbDrive.name, // keep name for reference in update API
      company,
      role,
      driveDate: dbDrive.drive_date ? dbDrive.drive_date.split(" ")[0] : "",
      regDeadline: dbDrive.registeration_deadline ? dbDrive.registeration_deadline.split(" ")[0] : "",
      package: dbDrive.package_offered || "",
      type: dbDrive.job_type || "Full-Time",
      criteria: {
        minCgpa,
        backlogs: maxBacklogs,
        branches,
        passingYear: dbDrive.passing_year || 2026
      },
      designations,
      required_skills,
      stats,
      status: dbDrive.status || (dbDrive.registeration_deadline && new Date(dbDrive.registeration_deadline) > new Date() ? "Registrations Open" : "Closed"),
      students: dbDrive.students || [
        { id: "n1", name: "Kunal Shah", branch: "CSE", cgpa: 8.5, backlogs: 0, status: "Eligible", placementStatus: "" },
        { id: "n2", name: "Meera Sen", branch: "IT", cgpa: 7.9, backlogs: 0, status: "Eligible", placementStatus: "" }
      ]
    };
  };

  const fetchMetrics = async (collegeName: string) => {
    try {
      const res = await getDriveCount(collegeName);
      const raw = res?.message ?? res;
      if (raw && raw.data) {
        setDriveCounts(raw.data);
      }
    } catch (err) {
      console.error("Failed to fetch drive metric counts:", err);
    }
  };

  const fetchDrives = async () => {
    const collegeName = collegeDetails?.name || collegeDetails?.email || currentUser || "guptateena960@gmail.com";
    if (!collegeName) return;

    try {
      setDrivesLoading(true);
      const res = await getCollegeDrives(collegeName);
      const data = res?.data || res?.message?.data || res?.message || res;

      let drivesArray: any[] = [];
      if (data && typeof data === 'object') {
        drivesArray = Array.isArray(data.campus_drives)
          ? data.campus_drives
          : (Array.isArray(data) ? data : []);
      }

      const mappedDrives = drivesArray.map((dbDrive: any) => mapBackendDriveToUI(dbDrive));
      setDrivesList(mappedDrives);

      // Always refresh the metric cards whenever drives are fetched
      fetchMetrics(collegeName);
    } catch (err) {
      console.error("Failed to fetch college drives:", err);
      showToast("Failed to load campus drives from server", "error");
    } finally {
      setDrivesLoading(false);
      setLoading(false);
    }
  };

  // Fetch drives (and metrics) when collegeDetails are available
  useEffect(() => {
    if (collegeDetails) {
      fetchDrives();
      if (activeSubTab === "tracker") {
        fetchTrackerData();
      } else if (activeSubTab === "stats") {
        fetchStatsData();
      }
    }
  }, [collegeDetails, activeSubTab]);

  const fetchTrackerData = async () => {
    const collegeName = collegeDetails?.name || collegeDetails?.email || currentUser || "guptateena960@gmail.com";
    if (!collegeName) return;
    try {
      const [listRes, countsRes] = await Promise.allSettled([
        getPlacementList(collegeName),
        getPlacementCounts(collegeName)
      ]);

      if (listRes.status === "fulfilled") {
        const raw = listRes.value?.data ?? listRes.value?.message?.data ?? listRes.value?.message;
        const arr = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        setPlacementList(arr);
      }

      if (countsRes.status === "fulfilled") {
        const raw = countsRes.value?.data ?? countsRes.value?.message?.data ?? countsRes.value?.message;
        const counts = raw?.data ?? raw;
        if (counts && typeof counts === 'object') {
          setPlacementCounts(counts);
        }
      }
      setTrackerLoaded(true);
    } catch (err) {
      console.error("Failed to fetch tracker data:", err);
    }
  };

  const fetchStatsData = async () => {
    const collegeName = collegeDetails?.name || collegeDetails?.email || currentUser || "guptateena960@gmail.com";
    if (!collegeName) return;
    try {
      const [statsRes, branchRes, funnelRes, salaryBandsRes] = await Promise.allSettled([
        getPlacementStats(collegeName),
        getBranchWisePerformance(collegeName),
        getPlacementFunnel(collegeName),
        getSalaryBands(collegeName)
      ]);

      if (statsRes.status === "fulfilled") {
        const raw = statsRes.value?.message ?? statsRes.value;
        if (raw && raw.data) {
          setPlacementStats(raw.data);
        }
      }

      if (branchRes.status === "fulfilled") {
        const raw = branchRes.value?.message ?? branchRes.value;
        if (raw && raw.data) {
          setBranchPerformance(raw.data);
        }
      }

      if (funnelRes.status === "fulfilled") {
        const raw = funnelRes.value?.message ?? funnelRes.value;
        if (raw && raw.data && Array.isArray(raw.data.funnel)) {
          const funnelArr = raw.data.funnel;
          const maxVal = Math.max(...funnelArr.map((item: any) => item.count || 0), 1);
          const mapped = funnelArr.map((stage: any) => {
            const pct = ((stage.count || 0) / maxVal) * 100;
            return {
              label: stage.label,
              value: stage.count ?? 0,
              width: `${Math.min(100, Math.max(2, pct))}%`,
              color: stage.color || "#3b82f6"
            };
          });
          setDynamicFunnelData(mapped);
        }
      }

      if (salaryBandsRes.status === "fulfilled") {
        const raw = salaryBandsRes.value?.message ?? salaryBandsRes.value;
        if (raw && raw.data) {
          setDynamicSalaryBands(raw.data);
        }
      }
      setStatsLoaded(true);
    } catch (err) {
      console.error("Failed to fetch stats data:", err);
    }
  };

  const fetchDrivePlacementListByStatus = async (driveName: string, status: string) => {
    const collegeName = collegeDetails?.name;
    if (!collegeName) return;
    try {
      const apiStatus = status === "Registered" ? "Applied" : status;
      const res = await getPlacementList(collegeName, driveName, apiStatus);
      const raw = res?.data ?? res?.message?.data ?? res?.message;
      const arr = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
      setDrivePlacementList(arr);
    } catch (err) {
      console.error(`Failed to fetch placement list for status ${status}:`, err);
    }
  };

  const fetchDriveEligibleStudents = async (driveName: string, drive: any, pageNum: number) => {
    const collegeName = collegeDetails?.name;
    if (!collegeName) return;
    setDriveEligibleLoading(true);
    try {
      const res = await getEligibleStudents({
        college: collegeName,
        branch: drive.criteria?.branches?.[0] || "",
        cgpa: drive.criteria?.minCgpa !== undefined ? drive.criteria.minCgpa : "",
        backlog: drive.criteria?.backlogs !== undefined ? drive.criteria.backlogs : "",
        page: pageNum,
        page_size: eligiblePageSize
      });
      const raw = res?.message ?? res?.data ?? res;
      if (raw) {
        setDriveEligibleStudents(raw);
      }
    } catch (err) {
      console.error("Failed to fetch drive eligible students:", err);
    } finally {
      setDriveEligibleLoading(false);
    }
  };

  // Fetch per-drive placement data when user clicks Manage
  const handleManageDrive = async (drive: any) => {
    setSelectedDrive(drive);
    setSelectedStudentStatusFilter("Registered");
    setDrivePlacementCounts(null);
    setDrivePlacementList([]);
    setDriveEligibleStudents(null);
    setEligiblePage(1);
    setDrivePlacementLoading(false);
    const collegeName = collegeDetails?.name;
    if (!collegeName) return;
    try {
      setDrivePlacementLoading(true);
      const [countsRes, listRes, eligibleRes] = await Promise.allSettled([
        getPlacementCounts(collegeName, drive.name),
        getPlacementList(collegeName, drive.name, "Applied"),
        getEligibleStudents({
          college: collegeName,
          branch: drive.criteria?.branches?.[0] || "",
          cgpa: drive.criteria?.minCgpa !== undefined ? drive.criteria.minCgpa : "",
          backlog: drive.criteria?.backlogs !== undefined ? drive.criteria.backlogs : "",
          page: 1,
          page_size: eligiblePageSize
        })
      ]);

      if (countsRes.status === "fulfilled") {
        const raw = countsRes.value?.data ?? countsRes.value?.message?.data ?? countsRes.value?.message;
        const counts = raw?.data ?? raw;
        if (counts && typeof counts === 'object') {
          setDrivePlacementCounts(counts);
        }
      }

      if (listRes.status === "fulfilled") {
        const raw = listRes.value?.data ?? listRes.value?.message?.data ?? listRes.value?.message;
        const arr = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        setDrivePlacementList(arr);
      }

      if (eligibleRes.status === "fulfilled") {
        const raw = eligibleRes.value?.message ?? eligibleRes.value?.data ?? eligibleRes.value;
        if (raw) {
          setDriveEligibleStudents(raw);
        }
      }
    } catch (err) {
      console.error("Failed to fetch drive placement data:", err);
    } finally {
      setDrivePlacementLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string, studentName: string, email?: string) => {
    try {
      showToast(`Updating status to ${status} for ${studentName}...`, "info");
      await updateCampusDriveApplicationStatus(applicationId, status);

      let successMessage = `Status updated to ${status} for ${studentName}!`;
      if (status === "Shortlisted") {
        successMessage = `${studentName} shortlisted successfully!`;
      } else if (status === "Selected") {
        successMessage = `${studentName} selected successfully!`;
      } else if (status === "Rejected") {
        successMessage = `${studentName} rejected successfully!`;
      }
      showToast(successMessage, "success");
      if (typeof window !== "undefined") {
        window.alert(successMessage);
      }

      // Send status mail to candidate
      const lowercaseStatus = status.toLowerCase(); // shortlisted, selected, rejected
      const resolvedEmail = email || drivePlacementList.find(r => r.application_id === applicationId)?.email;
      if (resolvedEmail) {
        try {
          const mailRes = await sendCandidateStatusMail({
            email: resolvedEmail,
            status: lowercaseStatus,
            candidate_name: studentName,
            drive_name: selectedDrive?.name || selectedDrive?.company || ""
          });

          if (mailRes && mailRes.message && (mailRes.message.status === 'error' || mailRes.message.status === 'failed' || mailRes.message.status === 'fail')) {
            throw new Error(mailRes.message.message || "Failed to send email notification");
          }

          const successMailMsg = mailRes?.message?.message || `Email sent successfully to ${studentName}!`;
          showToast(successMailMsg, "success");
          if (typeof window !== "undefined") {
            window.alert(successMailMsg);
          }
        } catch (mailErr: any) {
          console.error("Failed to send status email:", mailErr);
          const errorMsg = mailErr.message || `Failed to send email to ${studentName}`;
          showToast(errorMsg, "error");
          if (typeof window !== "undefined") {
            window.alert(`Error: ${errorMsg}`);
          }
        }
      }

      // Refresh current drive data
      if (selectedDrive) {
        const collegeName = collegeDetails?.name;
        if (collegeName) {
          const apiStatus = selectedStudentStatusFilter === "Eligible" ? undefined : (selectedStudentStatusFilter === "Registered" ? "Applied" : selectedStudentStatusFilter);
          const [countsRes, listRes] = await Promise.allSettled([
            getPlacementCounts(collegeName, selectedDrive.name),
            getPlacementList(collegeName, selectedDrive.name, apiStatus)
          ]);

          if (countsRes.status === "fulfilled") {
            const raw = countsRes.value?.data ?? countsRes.value?.message?.data ?? countsRes.value?.message;
            const counts = raw?.data ?? raw;
            if (counts && typeof counts === 'object') {
              setDrivePlacementCounts(counts);
            }
          }

          if (listRes.status === "fulfilled") {
            const raw = listRes.value?.data ?? listRes.value?.message?.data ?? listRes.value?.message;
            const arr = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
            setDrivePlacementList(arr);
          }
        }
      }

      // Also refresh main overall stats
      fetchTrackerData();
      if (statsLoaded) {
        fetchStatsData();
      }
    } catch (err: any) {
      console.error("Failed to update application status:", err);
      const errMsg = err.message || "Failed to update application status";
      showToast(errMsg, "error");
      if (typeof window !== "undefined") {
        window.alert(`Error: ${errMsg}`);
      }
    }
  };

  const handleNotifyCandidateMail = async (student: any, status: string, driveName: string) => {
    const email = student.email || student.email_id || student.name || student.student_id;
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || student.student_id || student.email || "Candidate";
    if (!email) {
      showToast("Student email is not available", "error");
      if (typeof window !== "undefined") {
        window.alert("Error: Student email is not available");
      }
      return;
    }
    try {
      showToast(`Sending notification email to ${fullName}...`, "info");
      const mailRes = await sendCandidateStatusMail({
        email,
        status,
        candidate_name: fullName,
        drive_name: driveName
      });

      if (mailRes && mailRes.message && (mailRes.message.status === 'error' || mailRes.message.status === 'failed' || mailRes.message.status === 'fail')) {
        throw new Error(mailRes.message.message || "Failed to send email notification");
      }

      const successMailMsg = mailRes?.message?.message || `Email sent successfully to ${fullName}!`;
      showToast(successMailMsg, "success");
      if (typeof window !== "undefined") {
        window.alert(successMailMsg);
      }
    } catch (err: any) {
      console.error("Failed to send candidate status email:", err);
      const errMsg = err.message || "Failed to send notification email";
      showToast(errMsg, "error");
      if (typeof window !== "undefined") {
        window.alert(`Error: ${errMsg}`);
      }
    }
  };

  // Resolve active eligibility drive details
  const activeEligibilityDrive = useMemo(() => {
    return drivesList.find(d => d.id === eligibilityDriveId) || null;
  }, [drivesList, eligibilityDriveId]);

  // Sync criteria when selected eligibility drive changes
  useEffect(() => {
    if (activeEligibilityDrive) {
      const branchesList = activeEligibilityDrive.criteria?.branches || [];
      const cgpaVal = activeEligibilityDrive.criteria?.minCgpa !== undefined ? String(activeEligibilityDrive.criteria.minCgpa) : "";
      const backlogVal = activeEligibilityDrive.criteria?.backlogs !== undefined ? String(activeEligibilityDrive.criteria.backlogs) : "";

      setEligibilityBranches(branchesList);
      setEligibilityCgpa(cgpaVal);
      setEligibilityBacklog(backlogVal);
      setEligibilityAcademicYear("All");
    } else {
      setEligibilityBranches([]);
      setEligibilityCgpa("");
      setEligibilityBacklog("");
      setEligibilityAcademicYear("All");
    }
  }, [activeEligibilityDrive]);

  const eligibilityBranchesStr = eligibilityBranches.join(",");

  // Fetch eligibility data for eligibility tab using custom branch, cgpa, backlog, and drive filters
  useEffect(() => {
    const fetchTabEligibility = async () => {
      setTabEligibleLoading(true);
      const collegeName = collegeDetails?.name || collegeDetails?.email || currentUser || "guptateena960@gmail.com";
      const academicYearParam = eligibilityAcademicYear === "All" ? undefined : eligibilityAcademicYear;
      try {
        const [eligibleRes, nonEligibleRes] = await Promise.allSettled([
          getEligibleStudents({
            branch: eligibilityBranchesStr,
            cgpa: eligibilityCgpa,
            backlog: eligibilityBacklog,
            college: collegeName,
            academic_year: academicYearParam
          }),
          getNonEligibleStudents({
            branch: eligibilityBranchesStr,
            cgpa: eligibilityCgpa,
            backlog: eligibilityBacklog,
            college: collegeName,
            academic_year: academicYearParam
          })
        ]);

        if (eligibleRes.status === "fulfilled") {
          const raw = eligibleRes.value?.message ?? eligibleRes.value;
          if (raw) {
            setTabEligibleStudents(raw);
          }
        } else {
          console.error("Failed to fetch tab eligible students:", eligibleRes.reason);
        }

        if (nonEligibleRes.status === "fulfilled") {
          const raw = nonEligibleRes.value?.message ?? nonEligibleRes.value;
          if (raw) {
            setTabNonEligibleStudents(raw);
          }
        } else {
          console.error("Failed to fetch tab non-eligible students:", nonEligibleRes.reason);
        }
      } catch (err) {
        console.error("Failed to fetch tab eligibility:", err);
      } finally {
        setTabEligibleLoading(false);
      }
    };

    if (activeSubTab === "eligibility") {
      fetchTabEligibility();
    }
  }, [eligibilityBranchesStr, eligibilityCgpa, eligibilityBacklog, eligibilityAcademicYear, activeSubTab, collegeDetails, currentUser]);

  // Filter drives list based on search query
  const filteredDrives = useMemo(() => {
    return drivesList.filter(drive =>
      (drive.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (drive.role || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [drivesList, searchQuery]);

  // Compute drives metrics banner
  const drivesMetrics = useMemo(() => {
    return {
      totalDrives: driveCounts?.total_drives !== undefined ? driveCounts.total_drives : drivesList.length,
      upcomingDrives: driveCounts?.upcoming_drives !== undefined ? driveCounts.upcoming_drives : drivesList.filter(d => d.status === "Registrations Open").length,
      studentsRegistered: driveCounts?.total_registered !== undefined ? driveCounts.total_registered : 0,
      offersConfirmed: driveCounts?.total_placed !== undefined ? driveCounts.total_placed : 0
    };
  }, [drivesList, driveCounts]);

  // Compute Student Tracker metrics — use API counts when available
  const trackerMetrics = useMemo(() => {
    if (placementCounts) {
      return {
        placed: placementCounts.placed,
        shortlisted: placementCounts.shortlisted,
        applied: placementCounts.applied_to_drives,
        notApplied: placementCounts.not_applied_yet
      };
    }
    // Fallback to local mock data
    const placed = studentsList.filter(s => s.status === "Placed").length;
    const shortlisted = studentsList.filter(s => s.status === "Shortlisted").length;
    const applied = studentsList.filter(s => s.drivesApplied > 0).length;
    const notApplied = studentsList.filter(s => s.drivesApplied === 0).length;
    return { placed, shortlisted, applied, notApplied };
  }, [placementCounts, studentsList]);


  // Calculate dynamic eligibility lists based on selected drive criteria
  const eligibilityLists = useMemo(() => {
    if (!activeEligibilityDrive) return { eligible: [], notEligible: [] };
    const criteria = activeEligibilityDrive.criteria;
    const eligible: any[] = [];
    const notEligible: any[] = [];

    studentsList.forEach(student => {
      const failsCgpa = student.cgpa < criteria.minCgpa;
      const failsBacklog = student.backlogs > criteria.backlogs;
      const failsBranch = !criteria.branches.includes(student.branch);

      if (failsCgpa || failsBacklog || failsBranch) {
        let reason = "Branch not eligible";
        if (failsBacklog) reason = "Has backlogs";
        else if (failsCgpa) reason = "Low CGPA";

        notEligible.push({ ...student, reason });
      } else {
        eligible.push(student);
      }
    });

    return { eligible, notEligible };
  }, [activeEligibilityDrive, studentsList]);

  // Dynamic lists from get_eligible_students and get_non_eligible_students APIs (tab)
  const tabEligibleLists = useMemo(() => {
    if (tabEligibleStudents || tabNonEligibleStudents) {
      let eligible: any[] = [];
      if (tabEligibleStudents) {
        eligible = Array.isArray(tabEligibleStudents.data)
          ? tabEligibleStudents.data
          : (Array.isArray(tabEligibleStudents.eligible?.data)
            ? tabEligibleStudents.eligible.data
            : (Array.isArray(tabEligibleStudents.eligible) ? tabEligibleStudents.eligible : []));
      }

      let notEligible: any[] = [];
      if (tabNonEligibleStudents) {
        if (Array.isArray(tabNonEligibleStudents.data)) {
          notEligible = tabNonEligibleStudents.data;
        } else if (Array.isArray(tabNonEligibleStudents.message)) {
          notEligible = tabNonEligibleStudents.message;
        } else if (tabNonEligibleStudents.message && Array.isArray(tabNonEligibleStudents.message.data)) {
          notEligible = tabNonEligibleStudents.message.data;
        } else if (Array.isArray(tabNonEligibleStudents)) {
          notEligible = tabNonEligibleStudents;
        }
      } else if (tabEligibleStudents) {
        // Fallback if non-eligible list hasn't resolved
        notEligible = Array.isArray(tabEligibleStudents.not_eligible?.data)
          ? tabEligibleStudents.not_eligible.data
          : (Array.isArray(tabEligibleStudents.not_eligible) ? tabEligibleStudents.not_eligible : []);
      }

      return { eligible, notEligible };
    }
    return eligibilityLists;
  }, [tabEligibleStudents, tabNonEligibleStudents, eligibilityLists]);

  // Compute total eligible student count for display
  const eligibleStudentsCount = useMemo(() => {
    if (driveEligibleStudents) {
      const total = driveEligibleStudents.pagination?.total ?? driveEligibleStudents.eligible?.pagination?.total;
      if (total !== undefined && total !== null) return total;

      const len = driveEligibleStudents.data?.length ?? driveEligibleStudents.eligible?.data?.length ?? driveEligibleStudents.eligible?.length;
      if (len !== undefined && len !== null) return len;
    }
    return selectedDrive?.stats?.eligible ?? 0;
  }, [driveEligibleStudents, selectedDrive]);

  // Dynamic list for the managed drive (panel)
  const eligibleStudentsToRender = useMemo(() => {
    if (driveEligibleStudents) {
      if (Array.isArray(driveEligibleStudents.data)) {
        return driveEligibleStudents.data;
      }
      if (Array.isArray(driveEligibleStudents.eligible?.data)) {
        return driveEligibleStudents.eligible.data;
      }
      if (Array.isArray(driveEligibleStudents.eligible)) {
        return driveEligibleStudents.eligible;
      }
      if (Array.isArray(driveEligibleStudents)) {
        return driveEligibleStudents;
      }
    }
    if (!selectedDrive) return [];
    const criteria = selectedDrive.criteria;
    return studentsList.filter(s => {
      const failsCgpa = s.cgpa < (criteria?.minCgpa ?? 0);
      const failsBacklog = s.backlogs > (criteria?.backlogs ?? 99);
      const failsBranch = criteria?.branches && criteria.branches.length > 0 && !criteria.branches.includes(s.branch);
      return !failsCgpa && !failsBacklog && !failsBranch;
    });
  }, [driveEligibleStudents, selectedDrive, studentsList]);

  // Add Drive Modal setup
  const addDriveFields: DynamicField[] = useMemo(() => [
    { name: "company", label: "Company Name", type: "text", required: true, placeholder: "e.g., Google", colSpan: 2, },
    // {
    //   name: "designations",
    //   label: "What position are you hiring for?",
    //   type: "select",
    //   multiple: true,
    //   required: false,
    //   colSpan: 2,
    //   apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
    //   apiParams: { doctype: "Designation" },
    //   allowCustom: true,
    //   customPlaceholder: "Enter custom designation..."
    // },
    { name: "role", label: "Job Role / Title", type: "text", required: true, colSpan: 2, placeholder: "e.g., Software Engineer" },
    { name: "driveDate", label: "Drive Date", type: "date", required: true, textTransform: "uppercase" },
    { name: "regDeadline", label: "Registration Deadline", type: "date", required: true, textTransform: "uppercase" },
    { name: "package", label: "CTC Package Offered", type: "text", required: true, placeholder: "e.g., ₹12-15 LPA" },
    {
      name: "type",
      label: "Job Type",
      type: "select",
      options: ["Full-Time", "Full-Time + PPO", "Internship"],
      required: true
    },
    { name: "minCgpa", label: "Minimum CGPA Criteria", type: "number", required: true, placeholder: "e.g. 6.0" },
    { name: "backlogs", label: "Max Allowed Backlogs", type: "number", required: true, placeholder: "e.g. 0" },
    {
      name: "branches",
      label: "Eligible Branches",
      type: "select",
      multiple: true,
      required: true,
      colSpan: 2,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "College Department" },
      allowCustom: true,
      customPlaceholder: "Enter custom branch..."
    },

    {
      name: "required_skills",
      label: "Required Skills",
      type: "select",
      multiple: true,
      required: false,
      colSpan: 2,
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Skill" },
      allowCustom: true,
      customPlaceholder: "Enter custom skill...",
      onCreateCustomValue: async (val: string) => {
        try {
          await createSkill(val);
        } catch (err) {
          console.error("Failed to create skill:", err);
          throw err;
        }
      }
    }
  ], []);

  const initialValues = useMemo(() => {
    if (editingDrive) {
      const vals = {
        company: editingDrive.company,
        role: editingDrive.role,
        driveDate: editingDrive.driveDate,
        regDeadline: editingDrive.regDeadline,
        package: editingDrive.package,
        type: editingDrive.type,
        minCgpa: editingDrive.criteria.minCgpa,
        backlogs: editingDrive.criteria.backlogs,
        branches: editingDrive.criteria.branches || [],
        designations: editingDrive.designations || [],
        required_skills: editingDrive.required_skills || []
      };
      return vals;
    }
    return {};
  }, [editingDrive]);

  const handleDriveSubmit = async (formData: any) => {
    setIsSubmittingDrive(true);
    try {
      const branchesArray = Array.isArray(formData.branches)
        ? formData.branches.map((s: string) => ({ branch_name: s }))
        : formData.branches && typeof formData.branches === 'string'
          ? formData.branches.split(",").map((s: string) => ({ branch_name: s.trim() }))
          : [];

      // const designationsArray = Array.isArray(formData.designations)
      //   ? formData.designations.map((s: string) => ({ designation: s }))
      //   : formData.designations && typeof formData.designations === 'string'
      //     ? formData.designations.split(",").map((s: string) => ({ designation: s.trim() }))
      //     : [{ designation: formData.role }];

      const skillsArray = Array.isArray(formData.required_skills)
        ? formData.required_skills.map((s: string) => ({ skill: s }))
        : formData.required_skills && typeof formData.required_skills === 'string'
          ? formData.required_skills.split(",").map((s: string) => ({ skill: s.trim() }))
          : [];

      const payload: any = {
        college: collegeDetails?.name || collegeDetails?.email || currentUser || "guptateena960@gmail.com",
        industry_name: formData.company,
        drive_date: formData.driveDate || undefined,
        registeration_deadline: formData.regDeadline || undefined,
        package_offered: isNaN(Number(formData.package)) ? formData.package : Number(formData.package),
        backlog: formData.backlogs !== undefined && formData.backlogs !== null ? Number(formData.backlogs) : 0,
        criteria: String(formData.minCgpa).includes("CGPA") || String(formData.minCgpa).includes("%")
          ? String(formData.minCgpa)
          : (Number(formData.minCgpa) <= 10
            ? `${Number(formData.minCgpa).toFixed(1)} CGPA`
            : `${formData.minCgpa}%`),
        job_title: formData.role,
        designation: [],
        branches: branchesArray,
        required_skill: skillsArray
      };

      if (editingDrive) {
        payload.name = editingDrive.name;
        await updateCollegeDrive(payload);
        showToast("Campus Drive updated successfully", "success");
      } else {
        await createCollegeDrive(payload);
        showToast("Campus Drive created successfully", "success");
      }

      setIsAddDriveModalOpen(false);
      setEditingDrive(null);
      fetchDrives();
    } catch (err: any) {
      console.error("Failed to save Campus Drive:", err);
      showToast(err?.message || "Failed to save Campus Drive", "error");
    } finally {
      setIsSubmittingDrive(false);
    }
  };

  const handleDeleteDrive = async (driveName: string) => {
    if (!window.confirm("Are you sure you want to delete this campus drive? This action cannot be undone.")) {
      return;
    }
    setIsDeletingDrive(true);
    try {
      await deleteCollegeDrive(driveName);
      showToast("Campus Drive deleted successfully", "success");
      setSelectedDrive(null);
      fetchDrives();
    } catch (err: any) {
      console.error("Failed to delete Campus Drive:", err);
      showToast(err?.message || "Failed to delete Campus Drive", "error");
    } finally {
      setIsDeletingDrive(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!selectedDrive) return [];
    return selectedDrive.students.filter((student: any) => {
      if (selectedStudentStatusFilter === "Eligible") {
        return student.status === "Eligible" || student.status === "Registered" || student.status === "Shortlisted" || student.status === "Selected";
      }
      return student.status === selectedStudentStatusFilter;
    });
  }, [selectedDrive, selectedStudentStatusFilter]);

  // Handle student shortlisting action inside details panel
  const handleStudentAction = (studentId: string, currentStatus: string) => {
    if (!selectedDrive) return;

    let nextStatus = "Registered";
    let toastMessage = "";

    if (currentStatus === "Registered") {
      nextStatus = "Shortlisted";
      toastMessage = "Student shortlisted successfully";
    } else if (currentStatus === "Shortlisted") {
      nextStatus = "Selected";
      toastMessage = "Student selected successfully";
    } else if (currentStatus === "Selected") {
      nextStatus = "Registered";
      toastMessage = "Student status reset to registered";
    }

    const updatedStudents = selectedDrive.students.map((student: any) => {
      if (student.id === studentId) {
        return { ...student, status: nextStatus };
      }
      return student;
    });

    const stats = {
      eligible: updatedStudents.length,
      registered: updatedStudents.filter((s: any) => s.status === "Registered").length,
      shortlisted: updatedStudents.filter((s: any) => s.status === "Shortlisted").length,
      selected: updatedStudents.filter((s: any) => s.status === "Selected").length
    };

    const updatedDrive = {
      ...selectedDrive,
      students: updatedStudents,
      stats
    };

    setDrivesList(prev => prev.map(d => d.id === selectedDrive.id ? updatedDrive : d));
    setSelectedDrive(updatedDrive);
    showToast(toastMessage, "success");
  };

  // Notification buttons toast triggers
  const triggerNotification = async (type: string) => {
    if (!selectedDrive) return;
    const driveName = selectedDrive.name || selectedDrive.company || "";

    switch (type) {
      case 'eligible':
        try {
          showToast("Sending notification email to all eligible students...", "info");
          const eligibleList = eligibleStudentsToRender;
          if (eligibleList.length === 0) {
            showToast("No eligible students to notify", "warning");
            if (typeof window !== "undefined") {
              window.alert("Warning: No eligible students to notify");
            }
            return;
          }
          const results = await Promise.allSettled(
            eligibleList.map(async (student: any) => {
              const email = student.email || student.email_id || student.name || student.student_id;
              const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || "Candidate";
              if (email) {
                const res = await sendCandidateStatusMail({
                  email,
                  status: "eligible",
                  candidate_name: fullName,
                  drive_name: driveName
                });
                if (res && res.message && (res.message.status === 'error' || res.message.status === 'failed' || res.message.status === 'fail')) {
                  throw new Error(res.message.message || "Failed to send email");
                }
              } else {
                throw new Error("Missing email");
              }
            })
          );

          const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
          const rejectedCount = results.filter(r => r.status === "rejected").length;

          if (fulfilledCount > 0) {
            const successMsg = `Notification email sent successfully to ${fulfilledCount} eligible students!`;
            showToast(successMsg, "success");
            if (typeof window !== "undefined") {
              window.alert(successMsg);
            }
          }
          if (rejectedCount > 0) {
            const errorMsg = `Failed to send email to ${rejectedCount} students.`;
            showToast(errorMsg, "error");
            if (typeof window !== "undefined") {
              window.alert(`Error: ${errorMsg}`);
            }
          }
        } catch (err: any) {
          console.error(err);
          const errMsg = err.message || "Failed to send notifications to students";
          showToast(errMsg, "error");
          if (typeof window !== "undefined") {
            window.alert(`Error: ${errMsg}`);
          }
        }
        break;

      case 'remind':
        try {
          showToast("Sending reminders to registered students...", "info");
          const registeredList = drivePlacementList.filter((r: any) => r.status === "Registered");
          if (registeredList.length === 0) {
            showToast("No registered students to remind", "warning");
            if (typeof window !== "undefined") {
              window.alert("Warning: No registered students to remind");
            }
            return;
          }
          const results = await Promise.allSettled(
            registeredList.map(async (record: any) => {
              const email = record.email || record.email_id || record.student_id;
              const fullName = `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Candidate";
              if (email) {
                const res = await sendCandidateStatusMail({
                  email,
                  status: "applied",
                  candidate_name: fullName,
                  drive_name: driveName
                });
                if (res && res.message && (res.message.status === 'error' || res.message.status === 'failed' || res.message.status === 'fail')) {
                  throw new Error(res.message.message || "Failed to send email");
                }
              } else {
                throw new Error("Missing email");
              }
            })
          );

          const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
          const rejectedCount = results.filter(r => r.status === "rejected").length;

          if (fulfilledCount > 0) {
            const successMsg = `Reminder email sent successfully to ${fulfilledCount} registered students!`;
            showToast(successMsg, "success");
            if (typeof window !== "undefined") {
              window.alert(successMsg);
            }
          }
          if (rejectedCount > 0) {
            const errorMsg = `Failed to send reminders to ${rejectedCount} students.`;
            showToast(errorMsg, "error");
            if (typeof window !== "undefined") {
              window.alert(`Error: ${errorMsg}`);
            }
          }
        } catch (err: any) {
          console.error(err);
          const errMsg = err.message || "Failed to send reminders";
          showToast(errMsg, "error");
          if (typeof window !== "undefined") {
            window.alert(`Error: ${errMsg}`);
          }
        }
        break;

      case 'notice':
        const noticeMsg = "Campus drive details successfully posted to College Notice Board!";
        showToast(noticeMsg, "success");
        if (typeof window !== "undefined") {
          window.alert(noticeMsg);
        }
        break;

      case 'shortlist':
        try {
          showToast("Sending shortlist results to candidates...", "info");
          const shortlistedList = drivePlacementList.filter((r: any) => r.status === "Shortlisted");
          if (shortlistedList.length === 0) {
            showToast("No shortlisted students to notify", "warning");
            if (typeof window !== "undefined") {
              window.alert("Warning: No shortlisted students to notify");
            }
            return;
          }
          const results = await Promise.allSettled(
            shortlistedList.map(async (record: any) => {
              const email = record.email || record.email_id || record.student_id;
              const fullName = `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Candidate";
              if (email) {
                const res = await sendCandidateStatusMail({
                  email,
                  status: "shortlisted",
                  candidate_name: fullName,
                  drive_name: driveName
                });
                if (res && res.message && (res.message.status === 'error' || res.message.status === 'failed' || res.message.status === 'fail')) {
                  throw new Error(res.message.message || "Failed to send email");
                }
              } else {
                throw new Error("Missing email");
              }
            })
          );

          const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
          const rejectedCount = results.filter(r => r.status === "rejected").length;

          if (fulfilledCount > 0) {
            const successMsg = `Shortlist results email sent successfully to ${fulfilledCount} candidates!`;
            showToast(successMsg, "success");
            if (typeof window !== "undefined") {
              window.alert(successMsg);
            }
          }
          if (rejectedCount > 0) {
            const errorMsg = `Failed to send shortlist notifications to ${rejectedCount} candidates.`;
            showToast(errorMsg, "error");
            if (typeof window !== "undefined") {
              window.alert(`Error: ${errorMsg}`);
            }
          }
        } catch (err: any) {
          console.error(err);
          const errMsg = err.message || "Failed to send shortlist notifications";
          showToast(errMsg, "error");
          if (typeof window !== "undefined") {
            window.alert(`Error: ${errMsg}`);
          }
        }
        break;

      default:
        break;
    }
  };

  // CSV download notification
  const handleExportCSV = () => {
    showToast("Preparing CSV export... Student list downloaded successfully.", "success");
  };

  const handleExportEligible = async () => {
    const collegeName = collegeDetails?.name || collegeDetails?.email || currentUser || "guptateena960@gmail.com";
    showToast("Preparing eligible students CSV export...", "info");
    try {
      const res = await exportEligibleStudents({
        branch: eligibilityBranches.join(","),
        cgpa: eligibilityCgpa,
        backlog: eligibilityBacklog,
        college: collegeName,
        academic_year: eligibilityAcademicYear === "All" ? undefined : eligibilityAcademicYear
      });

      const blob = res instanceof Blob ? res : (res?.data instanceof Blob ? res.data : new Blob([res]));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `eligible_students_${eligibilityBranches.join("_") || 'all'}_cgpa${eligibilityCgpa || 'any'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Eligible students list exported successfully.", "success");
      if (typeof window !== "undefined") {
        window.alert("Eligible students list exported successfully.");
      }
    } catch (err: any) {
      console.error("Failed to export eligible students:", err);
      const errMsg = err?.message || "Failed to export eligible students";
      showToast(errMsg, "error");
      if (typeof window !== "undefined") {
        window.alert(`Error: ${errMsg}`);
      }
    }
  };

  const handleExportNotEligible = async () => {
    const collegeName = collegeDetails?.name || collegeDetails?.email || currentUser || "guptateena960@gmail.com";
    showToast("Preparing non-eligible students CSV export...", "info");
    try {
      const res = await exportNotEligibleStudents({
        branch: eligibilityBranches.join(","),
        cgpa: eligibilityCgpa,
        backlog: eligibilityBacklog,
        college: collegeName,
        academic_year: eligibilityAcademicYear === "All" ? undefined : eligibilityAcademicYear
      });

      const blob = res instanceof Blob ? res : (res?.data instanceof Blob ? res.data : new Blob([res]));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `non_eligible_students_${eligibilityBranches.join("_") || 'all'}_cgpa${eligibilityCgpa || 'any'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Non-eligible students list exported successfully.", "success");
      if (typeof window !== "undefined") {
        window.alert("Non-eligible students list exported successfully.");
      }
    } catch (err: any) {
      console.error("Failed to export non-eligible students:", err);
      const errMsg = err?.message || "Failed to export non-eligible students";
      showToast(errMsg, "error");
      if (typeof window !== "undefined") {
        window.alert(`Error: ${errMsg}`);
      }
    }
  };

  if (loading && drivesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-slate-500 font-semibold">Loading Campus Drives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Placement Management Title & Header (Visible across all main sub-tabs except individual drive details) */}
      {!selectedDrive && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Placement Management</h2>
            <p className="text-sm font-semibold text-slate-500">Manage campus drives, eligibility, shortlisting, and offer tracking — end to end</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => showToast("Redirecting to Company import pipeline...", "info")}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 h-11 rounded-xl flex items-center gap-2 text-sm shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Import Companies
            </button>
            <button
              onClick={() => setIsAddDriveModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 h-11 rounded-xl flex items-center gap-2 text-sm shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Campus Drive
            </button>
          </div>
        </div>
      )}

      {/* Inner Sub Tabs bar (Hidden on individual drive details panel) */}
      {!selectedDrive && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveSubTab("drives")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "drives"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
              }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Campus Drives
          </button>
          <button
            onClick={() => {
              setActiveSubTab("tracker");
              if (!trackerLoaded) fetchTrackerData();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "tracker"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            Student Tracker
          </button>
          <button
            onClick={() => setActiveSubTab("eligibility")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "eligibility"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Eligibility Check
          </button>
          <button
            onClick={() => {
              setActiveSubTab("stats");
              if (!statsLoaded) fetchStatsData();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "stats"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
              }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Placement Stats
          </button>
        </div>
      )}

      {/* Main Switcher Content Container */}
      <AnimatePresence mode="wait">
        {selectedDrive ? (
          // ==================== 0. INDIVIDUAL DRIVE MANAGE PANELS ====================
          <motion.div
            key="details-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Back & Actions Link Row */}
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => setSelectedDrive(null)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Drives
              </button>

              <div className="flex items-center gap-2">
                <button
                  disabled={isDeletingDrive}
                  onClick={() => handleDeleteDrive(selectedDrive.name)}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingDrive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete Drive
                </button>

                <button
                  onClick={() => {
                    setEditingDrive(selectedDrive);
                    setIsAddDriveModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-200 hover:border-orange-600 px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <Pen className="w-3.5 h-3.5" />
                  Edit Drive
                </button>
              </div>
            </div>

            {/* Gradient Drive Banner Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-2xl shadow-inner shrink-0">
                    {selectedDrive.company.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-tight">{selectedDrive.company} — Campus Drive 2025</h2>
                    <p className="text-slate-200 text-sm font-semibold">{selectedDrive.role}</p>

                    <div className="flex flex-wrap gap-3 pt-1 text-xs font-semibold text-slate-100">
                      <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5 text-blue-300" />
                        Drive: {new Date(selectedDrive.driveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-orange-300" />
                        Reg closes: {new Date(selectedDrive.regDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-amber-300">
                        <FaRupeeSign className="w-3.5 h-3.5 text-amber-400" />
                        {selectedDrive.package} LPA
                      </span>
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold flex items-center gap-1">
                        ● {selectedDrive.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tab Filtering Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Eligible */}
              <div
                onClick={() => {
                  setSelectedStudentStatusFilter("Eligible");
                  if (selectedDrive) {
                    setEligiblePage(1);
                    fetchDriveEligibleStudents(selectedDrive.name, selectedDrive, 1);
                  }
                }}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all flex flex-col gap-1 ${selectedStudentStatusFilter === "Eligible"
                  ? "border-orange-400 shadow-md ring-1 ring-orange-300/60"
                  : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eligible</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-tight">
                  {drivePlacementLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500 inline-block" />
                  ) : (
                    eligibleStudentsCount
                  )}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">Students</p>
              </div>

              {/* Registered */}
              <div
                onClick={() => {
                  setSelectedStudentStatusFilter("Registered");
                  if (selectedDrive) {
                    fetchDrivePlacementListByStatus(selectedDrive.name, "Registered");
                  }
                }}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all flex flex-col gap-1 ${selectedStudentStatusFilter === "Registered"
                  ? "border-orange-400 shadow-md ring-1 ring-orange-300/60"
                  : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-tight">
                  {drivePlacementLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500 inline-block" />
                  ) : (
                    drivePlacementCounts !== null ? drivePlacementCounts.applied_to_drives : selectedDrive.stats.registered
                  )}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">Students</p>
              </div>

              {/* Shortlisted */}
              <div
                onClick={() => {
                  setSelectedStudentStatusFilter("Shortlisted");
                  if (selectedDrive) {
                    fetchDrivePlacementListByStatus(selectedDrive.name, "Shortlisted");
                  }
                }}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all flex flex-col gap-1 ${selectedStudentStatusFilter === "Shortlisted"
                  ? "border-orange-400 shadow-md ring-1 ring-orange-300/60"
                  : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shortlisted</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-tight">
                  {drivePlacementLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500 inline-block" />
                  ) : (
                    drivePlacementCounts !== null ? drivePlacementCounts.shortlisted : selectedDrive.stats.shortlisted
                  )}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">Students</p>
              </div>

              {/* Selected */}
              <div
                onClick={() => {
                  setSelectedStudentStatusFilter("Selected");
                  if (selectedDrive) {
                    fetchDrivePlacementListByStatus(selectedDrive.name, "Selected");
                  }
                }}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all flex flex-col gap-1 ${selectedStudentStatusFilter === "Selected"
                  ? "border-orange-400 shadow-md ring-1 ring-orange-300/60"
                  : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-tight">
                  {drivePlacementLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500 inline-block" />
                  ) : (
                    drivePlacementCounts !== null ? drivePlacementCounts.placed : selectedDrive.stats.selected
                  )}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">Students</p>
              </div>
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* Left Column: Student Table */}
              <div className="lg:col-span-2 space-y-4">
                <BaseCard className="bg-white border-slate-200/60 shadow-sm p-0 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                    <h3 className="text-sm font-bold text-slate-800 tracking-wide">
                      {selectedStudentStatusFilter} Students ({
                        drivePlacementLoading ? (
                          "..."
                        ) : selectedStudentStatusFilter === "Registered"
                          ? drivePlacementList.length
                          : selectedStudentStatusFilter === "Shortlisted"
                            ? (drivePlacementCounts?.shortlisted ?? selectedDrive.stats.shortlisted)
                            : selectedStudentStatusFilter === "Selected"
                              ? (drivePlacementCounts?.placed ?? selectedDrive.stats.selected)
                              : eligibleStudentsCount
                      })
                    </h3>
                    <button onClick={handleExportCSV} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">

                    {/* ELIGIBLE TABLE */}
                    {selectedStudentStatusFilter === "Eligible" && (
                      <div>
                        {driveEligibleLoading ? (
                          <div className="py-12 text-center text-slate-400 font-semibold">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
                            Loading eligible students...
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-5">Student</th>
                                <th className="py-3 px-4">Branch</th>
                                <th className="py-3 px-4">CGPA</th>
                                <th className="py-3 px-4">Backlogs</th>
                                <th className="py-3 px-5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {eligibleStudentsToRender.length === 0 ? (
                                <tr><td colSpan={5} className="py-10 text-center">
                                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                  <p className="text-xs text-slate-400 font-semibold">No eligible students</p>
                                </td></tr>
                              ) : eligibleStudentsToRender.map((student: any) => {
                                const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || student.student_id || student.email || "—";
                                const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                                const branch = student.branch || student.branch_name || student.department || "—";
                                const cgpa = student.cgpa !== undefined && student.cgpa !== null ? student.cgpa : "—";
                                const backlogs = student.backlog !== undefined && student.backlog !== null ? student.backlog : (student.backlogs !== undefined ? student.backlogs : 0);
                                return (
                                  <tr key={student.name || student.email_id || student.id || student.email || student.student_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3.5 px-5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">{initials}</div>
                                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                          {fullName}
                                          {student.placementStatus && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">✓ {student.placementStatus}</span>}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4"><span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{branch}</span></td>
                                    <td className="py-3.5 px-4 font-bold text-xs text-orange-500">{cgpa}</td>
                                    <td className="py-3.5 px-4 text-xs font-semibold text-emerald-600">
                                      {backlogs === 0 ? "✓" : backlogs}
                                    </td>
                                    <td className="py-3.5 px-5 text-right">
                                      <button onClick={() => handleNotifyCandidateMail(student, "eligible", selectedDrive?.name || selectedDrive?.company || "")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all">Notify</button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}

                        {/* Pagination Controls for Eligible Students */}
                        {!driveEligibleLoading && driveEligibleStudents?.pagination && driveEligibleStudents.pagination.total_pages > 1 && (
                          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500">
                              Showing <span className="font-bold text-slate-800">{((eligiblePage - 1) * eligiblePageSize) + 1}</span> to{" "}
                              <span className="font-bold text-slate-800">{Math.min(eligiblePage * eligiblePageSize, driveEligibleStudents.pagination.total)}</span> of{" "}
                              <span className="font-bold text-slate-800">{driveEligibleStudents.pagination.total}</span> eligible students
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (driveEligibleStudents.pagination.has_prev) {
                                    const prevPage = eligiblePage - 1;
                                    setEligiblePage(prevPage);
                                    fetchDriveEligibleStudents(selectedDrive.name, selectedDrive, prevPage);
                                  }
                                }}
                                disabled={!driveEligibleStudents.pagination.has_prev}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${driveEligibleStudents.pagination.has_prev
                                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                  }`}
                              >
                                Previous
                              </button>
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const totalPages = driveEligibleStudents.pagination.total_pages;
                                  const pages: (number | string)[] = [];
                                  const maxVisible = 5;
                                  if (totalPages <= maxVisible) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                  } else {
                                    pages.push(1);
                                    if (eligiblePage > 3) pages.push("...");
                                    const start = Math.max(2, eligiblePage - 1);
                                    const end = Math.min(totalPages - 1, eligiblePage + 1);
                                    for (let i = start; i <= end; i++) pages.push(i);
                                    if (eligiblePage < totalPages - 2) pages.push("...");
                                    pages.push(totalPages);
                                  }
                                  return pages;
                                })().map((p, idx) => (
                                  <button
                                    key={idx}
                                    disabled={p === "..."}
                                    onClick={() => {
                                      if (typeof p === 'number') {
                                        setEligiblePage(p);
                                        fetchDriveEligibleStudents(selectedDrive.name, selectedDrive, p);
                                      }
                                    }}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${p === "..."
                                      ? "text-slate-400 cursor-default"
                                      : eligiblePage === p
                                        ? "bg-orange-500 text-white shadow-sm cursor-pointer"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                                      }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  if (driveEligibleStudents.pagination.has_next) {
                                    const nextPage = eligiblePage + 1;
                                    setEligiblePage(nextPage);
                                    fetchDriveEligibleStudents(selectedDrive.name, selectedDrive, nextPage);
                                  }
                                }}
                                disabled={!driveEligibleStudents.pagination.has_next}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${driveEligibleStudents.pagination.has_next
                                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                  }`}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* REGISTERED TABLE — from drivePlacementList API */}
                    {selectedStudentStatusFilter === "Registered" && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-5">Student</th>
                            <th className="py-3 px-4">Branch</th>
                            <th className="py-3 px-4">CGPA</th>
                            <th className="py-3 px-4">Backlogs</th>
                            <th className="py-3 px-5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {drivePlacementLoading ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                                Loading registered candidates...
                              </td>
                            </tr>
                          ) : drivePlacementList.length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center">
                              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-semibold">No registered students</p>
                            </td></tr>
                          ) : drivePlacementList.map((record: any) => {
                            const fullName = `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.student_id || "—";
                            const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                            return (
                              <tr key={record.application_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">{initials}</div>
                                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      {fullName}
                                      {(record.status === "Selected" || record.status === "Placed") && (
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">✓ Placed</span>
                                      )}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4"><span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{record.course || record.stream || "—"}</span></td>
                                <td className="py-3.5 px-4 font-bold text-xs text-orange-500">{record.cgpa || "—"}</td>
                                <td className="py-3.5 px-4 text-xs font-semibold text-emerald-600">✓</td>
                                <td className="py-3.5 px-5 text-right">
                                  <button onClick={() => handleUpdateApplicationStatus(record.application_id, "Shortlisted", fullName, record.email)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all">Shortlist</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* SHORTLISTED TABLE */}
                    {selectedStudentStatusFilter === "Shortlisted" && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-5">Student</th>
                            <th className="py-3 px-4">Branch</th>
                            <th className="py-3 px-4">CGPA</th>
                            <th className="py-3 px-4">Backlogs</th>
                            <th className="py-3 px-5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {drivePlacementLoading ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                                Loading shortlisted candidates...
                              </td>
                            </tr>
                          ) : drivePlacementList.filter((r: any) => r.status === "Shortlisted").length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center">
                              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-semibold">No shortlisted students</p>
                            </td></tr>
                          ) : drivePlacementList.filter((r: any) => r.status === "Shortlisted").map((record: any) => {
                            const fullName = `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.student_id || "—";
                            const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                            return (
                              <tr key={record.application_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">{initials}</div>
                                    <p className="text-xs font-bold text-slate-800">{fullName}</p>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4"><span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{record.course || record.stream || "—"}</span></td>
                                <td className="py-3.5 px-4 font-bold text-xs text-orange-500">{record.cgpa || "—"}</td>
                                <td className="py-3.5 px-4 text-xs font-semibold text-emerald-600">✓</td>
                                <td className="py-3.5 px-5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button onClick={() => handleUpdateApplicationStatus(record.application_id, "Selected", fullName, record.email)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1">✓ Select</button>
                                    <button onClick={() => handleUpdateApplicationStatus(record.application_id, "Rejected", fullName, record.email)} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1">✕ Reject</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* SELECTED TABLE */}
                    {selectedStudentStatusFilter === "Selected" && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-5">Student</th>
                            <th className="py-3 px-4">Branch</th>
                            <th className="py-3 px-4">CGPA</th>
                            <th className="py-3 px-4">Backlogs</th>
                            <th className="py-3 px-4">Package Offered</th>
                            <th className="py-3 px-4">Offer Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {drivePlacementLoading ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                                Loading selected candidates...
                              </td>
                            </tr>
                          ) : drivePlacementList.filter((r: any) => r.status === "Selected" || r.status === "Placed").length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center">
                              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-semibold">No selected students</p>
                            </td></tr>
                          ) : drivePlacementList.filter((r: any) => r.status === "Selected" || r.status === "Placed").map((record: any) => {
                            const fullName = `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.student_id || "—";
                            const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                            return (
                              <tr key={record.application_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">{initials}</div>
                                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      {fullName}
                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">✓ Placed</span>
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4"><span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{record.course || record.stream || "—"}</span></td>
                                <td className="py-3.5 px-4 font-bold text-xs text-orange-500">{record.cgpa || "—"}</td>
                                <td className="py-3.5 px-4 text-xs font-semibold text-emerald-600">✓</td>
                                <td className="py-3.5 px-4 text-xs font-bold text-emerald-700">
                                  {record.package_lpa ? `₹${record.package_lpa} LPA` : record.package_offered ? `₹${record.package_offered} LPA` : "—"}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">Accepted</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                  </div>
                </BaseCard>
              </div>

              {/* Right Column: Criteria & Notifications Panel */}
              <div className="space-y-6">
                <BaseCard className="bg-white border-slate-200/60 shadow-sm p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Drive Criteria
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-semibold">Min CGPA</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedDrive.criteria.minCgpa}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-semibold">Active Backlogs</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedDrive.criteria.backlogs}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-semibold">Year of Passing</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedDrive.criteria.passingYear}</span>
                    </div>
                    {selectedDrive.criteria.branches?.length > 0 && (
                      <div className="space-y-2 pt-1 pb-3 border-b border-slate-100">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-widest">Eligible Branches</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDrive.criteria.branches.map((b: string) => (
                            <span key={b} className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{b}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedDrive.designations?.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-widest">Roles Offered</span>
                        <ul className="space-y-1">
                          {selectedDrive.designations.map((d: any, i: number) => (
                            <li key={i} className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                              {d.designation || d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </BaseCard>

                <BaseCard className="bg-white border-slate-200/60 shadow-sm p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-slate-500" /> Notify Students
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">
                      Send drive notifications to eligible or registered students via app, email, and notice board.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => triggerNotification('eligible')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl w-full text-[10px] uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3 h-3" /> Notify All Eligible ({drivePlacementLoading ? "..." : eligibleStudentsCount})
                    </button>
                    <button
                      onClick={() => triggerNotification('remind')}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl w-full text-[10px] uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3 h-3" /> Remind Registered ({drivePlacementLoading ? "..." : (drivePlacementCounts?.applied_to_drives ?? selectedDrive.stats.registered)})
                    </button>
                    <button
                      onClick={() => triggerNotification('notice')}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl w-full text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3 h-3 text-slate-400" /> Post to Notice Board
                    </button>
                    <button
                      onClick={() => triggerNotification('shortlist')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl w-full text-[10px] uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Send Shortlist Results
                    </button>
                  </div>
                </BaseCard>
              </div>
            </div>
          </motion.div>
        ) : activeSubTab === "tracker" ? (
          // ==================== 1. STUDENT TRACKER VIEW ====================
          <motion.div
            key="tracker-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Tracker Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Placed</p>
                  <h4 className="text-2xl font-bold text-slate-800">{trackerMetrics.placed}</h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-100">
                  <Trophy className="w-5 h-5" />
                </div>
              </BaseCard>
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Shortlisted</p>
                  <h4 className="text-2xl font-bold text-slate-800">{trackerMetrics.shortlisted}</h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm shadow-orange-100">
                  <Star className="w-5 h-5" />
                </div>
              </BaseCard>
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Applied to Drives</p>
                  <h4 className="text-2xl font-bold text-slate-800">{trackerMetrics.applied}</h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
              </BaseCard>
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Not Applied Yet</p>
                  <h4 className="text-2xl font-bold text-slate-800">{trackerMetrics.notApplied}</h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-100">
                  <Hourglass className="w-5 h-5" />
                </div>
              </BaseCard>
            </div>

            {/* Tracker Student Table */}
            <BaseCard className="bg-white border-slate-200/60 shadow-sm p-0 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <h3 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  All Final Year Students — Placement Tracker
                </h3>
                <button onClick={handleExportCSV} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-5">Student</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Current Year</th>
                      <th className="py-3 px-4">CGPA</th>
                      <th className="py-3 px-4">Drive</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Package (LPA)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {placementList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-semibold">No placement records found</p>
                        </td>
                      </tr>
                    ) : (
                      placementList.map((record: any) => {
                        const fullName = `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.student_id || "—";
                        const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                        return (
                          <tr key={record.application_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{fullName}</p>
                                  <p className="text-[10px] text-slate-400">{record.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                              {record.course || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                              {record.current_year || record.academic_year || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-emerald-600">
                              {record.cgpa || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 font-semibold">
                              {record.drive || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                              {record.company_name || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-amber-700">
                              {record.package_lpa ? `₹${record.package_lpa} LPA` : "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${record.status === "Selected" || record.status === "Placed"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                                : record.status === "Shortlisted"
                                  ? "bg-orange-50 text-orange-600 border border-orange-200/50"
                                  : record.status === "Applied"
                                    ? "bg-blue-50 text-blue-600 border border-blue-200/50"
                                    : "bg-slate-50 text-slate-500 border border-slate-200/50"
                                }`}>
                                {record.status || "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </BaseCard>
          </motion.div>
        ) : activeSubTab === "eligibility" ? (
          // ==================== 2. ELIGIBILITY CHECK VIEW ====================
          <motion.div
            key="eligibility-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {drivesList.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">No active drives available</h4>
                <p className="text-xs text-slate-400 mt-1">Create a campus drive first to check student eligibility</p>
              </div>
            ) : (
              <>
                {/* Top Selection Row & Filters */}
                <BaseCard className="p-5 bg-white border-slate-200/60 shadow-sm flex flex-col gap-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3 w-full md:max-w-md">
                      <span className="text-xs font-bold text-slate-500 shrink-0">Check eligibility for:</span>
                      <div className="relative flex-1">
                        <select
                          value={eligibilityDriveId}
                          onChange={(e) => setEligibilityDriveId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer"
                        >
                          <option value="">All Drives / General Eligibility</option>
                          {drivesList.map(drive => (
                            <option key={drive.id} value={drive.id}>
                              {drive.company} — {drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-auto">
                      {(eligibilityBranches.length > 0 || eligibilityCgpa !== "" || eligibilityBacklog !== "" || eligibilityDriveId !== "" || eligibilityAcademicYear !== "All") && (
                        <button
                          onClick={() => {
                            setEligibilityBranches([]);
                            setEligibilityCgpa("");
                            setEligibilityBacklog("");
                            setEligibilityDriveId("");
                            setEligibilityAcademicYear("All");
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-500 font-bold px-4 py-2.5 border border-slate-200 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                      <button
                        onClick={() => triggerNotification('eligible')}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Notify Eligible
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="relative flex flex-col justify-end">
                      <Dropdown
                        id="eligibility-branches-filter"
                        label="Branch"
                        placeholder="All Branches"
                        endpoint={`${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`}
                        params={{ doctype: "College Department" }}
                        mapOptions={(data) => data.map((item: any) => ({
                          value: item.branch_name || item.branch || item.name,
                          label: item.branch_name || item.branch || item.name
                        }))}
                        value={eligibilityBranches}
                        onChange={setEligibilityBranches}
                        multiSelect={true}
                        searchable={true}
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Academic Year</label>
                      <div className="relative">
                        <select
                          value={eligibilityAcademicYear}
                          onChange={(e) => setEligibilityAcademicYear(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer pr-8"
                        >
                          <option value="All">All Years</option>
                          <option value="First Year">First Year</option>
                          <option value="Second Year">Second Year</option>
                          <option value="Third Year">Third Year</option>
                          <option value="Final Year">Final Year</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Min CGPA</label>
                      <div className="relative">
                        <select
                          value={eligibilityCgpa}
                          onChange={(e) => setEligibilityCgpa(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer pr-8"
                        >
                          <option value="">All CGPA</option>
                          {["0.0", "1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0", "9.5", "10.0"].map((cg) => (
                            <option key={cg} value={cg}>{cg}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Backlog</label>
                      <div className="relative">
                        <select
                          value={eligibilityBacklog}
                          onChange={(e) => setEligibilityBacklog(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer pr-8"
                        >
                          <option value="">All Backlogs</option>
                          {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((bl) => (
                            <option key={bl} value={bl}>{bl}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </BaseCard>

                {tabEligibleLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                    <p className="text-xs font-semibold text-slate-500">Checking eligibility lists...</p>
                  </div>
                ) : (
                  <>
                    {/* Criteria Banner and Count */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Drive Criteria</span>
                        {activeEligibilityDrive ? (
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
                            <span>Min CGPA: <strong className="text-blue-600 text-sm font-bold">{activeEligibilityDrive.criteria?.minCgpa ?? "—"}</strong></span>
                            <span>Max Backlogs: <strong className="text-blue-600 text-sm font-bold">{activeEligibilityDrive.criteria?.backlogs ?? "—"}</strong></span>
                            <span>Year: <strong className="text-blue-600 text-sm font-bold">{activeEligibilityDrive.criteria?.passingYear ?? "—"}</strong></span>
                            <span className="flex items-center gap-1">
                              Eligible Branches:
                              <strong className="text-orange-600 font-bold">{activeEligibilityDrive.criteria?.branches?.join(", ") || "All"}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-slate-500">
                            Showing all final year students with no active drive criteria filter. Use filters below to search.
                          </div>
                        )}
                      </div>

                      <div className="text-center shrink-0 bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="text-right">
                          <h4 className="text-xl font-bold text-emerald-600 leading-none">{tabEligibleLists.eligible.length} Eligible</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">out of {(tabEligibleLists.eligible.length + tabEligibleLists.notEligible.length) || studentsList.length} total</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm font-bold border border-emerald-100">
                          {tabEligibleLists.eligible.length}
                        </div>
                      </div>
                    </div>

                    {/* Eligible / Non Eligible Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* Eligible Column */}
                      <BaseCard className="bg-white border-slate-200/60 shadow-sm p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-emerald-50/20 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Eligible Students ({tabEligibleLists.eligible.length})
                          </h3>
                          <button
                            onClick={handleExportEligible}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Download className="w-3 h-3 text-slate-400" />
                            Export
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Student</th>
                                <th className="py-2.5 px-4">Branch</th>
                                <th className="py-2.5 px-4">Current Year</th>
                                <th className="py-2.5 px-4">CGPA</th>
                                <th className="py-2.5 px-4">Backlogs</th>
                                <th className="py-2.5 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                              {tabEligibleLists.eligible.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">
                                    No eligible students
                                  </td>
                                </tr>
                              ) : tabEligibleLists.eligible.map((student: any) => {
                                const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || student.student_id || student.email || "—";
                                const branch = student.branch || student.branch_name || student.department || "—";
                                const cgpa = student.cgpa !== undefined && student.cgpa !== null ? student.cgpa : "—";
                                const backlogs = student.backlog !== undefined && student.backlog !== null ? student.backlog : (student.backlogs !== undefined ? student.backlogs : 0);
                                return (
                                  <tr key={student.name || student.email_id || student.id || student.email || student.student_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800">{fullName}</td>
                                    <td className="py-3 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded font-bold">{branch}</span></td>
                                    <td className="py-3 px-4 font-semibold text-slate-600">{student.current_year || student.academic_year || "—"}</td>
                                    <td className="py-3 px-4 font-bold text-emerald-600">{cgpa}</td>
                                    <td className="py-3 px-4">
                                      {backlogs === 0 ? <span className="text-emerald-600 font-bold">✓</span> : backlogs}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        onClick={() => handleNotifyCandidateMail(student, "eligible", activeEligibilityDrive?.name || activeEligibilityDrive?.company || "")}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                                      >
                                        Notify
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </BaseCard>

                      {/* Not Eligible Column */}
                      <BaseCard className="bg-white border-slate-200/60 shadow-sm p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-red-50/20 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-red-700 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-red-600" />
                            Not Eligible ({tabEligibleLists.notEligible.length})
                          </h3>
                          <button
                            onClick={handleExportNotEligible}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Download className="w-3 h-3 text-slate-400" />
                            Export
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Student</th>
                                <th className="py-2.5 px-4">CGPA</th>
                                <th className="py-2.5 px-4">Branch</th>
                                <th className="py-2.5 px-4">Current Year</th>
                                <th className="py-2.5 px-4">Reason</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                              {tabEligibleLists.notEligible.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-10 text-center text-slate-400 font-semibold">
                                    No non-eligible students
                                  </td>
                                </tr>
                              ) : tabEligibleLists.notEligible.map((student: any) => {
                                const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || student.student_id || student.email || "—";
                                const branch = student.branch || student.branch_name || student.department || "—";
                                const cgpa = student.cgpa !== undefined && student.cgpa !== null ? student.cgpa : "—";
                                const reason = Array.isArray(student.reasons)
                                  ? student.reasons.join(", ")
                                  : (student.reason || "Criteria mismatch");
                                return (
                                  <tr key={student.name || student.email_id || student.id || student.email || student.student_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-slate-800">{fullName}</td>
                                    <td className="py-3 px-4 font-bold text-slate-500">{cgpa}</td>
                                    <td className="py-3 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded font-bold">{branch}</span></td>
                                    <td className="py-3 px-4 font-semibold text-slate-600">{student.current_year || student.academic_year || "—"}</td>
                                    <td className="py-3 px-4">
                                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                                        {reason}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </BaseCard>

                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        ) : activeSubTab === "stats" ? (
          // ==================== 3. PLACEMENT STATS VIEW ====================
          (() => {
            const getNumericPackage = (pkgStr: any): number => {
              if (!pkgStr) return 0;
              const match = String(pkgStr).match(/[\d.]+/);
              return match ? parseFloat(match[0]) : 0;
            };

            const displayRecruiters = drivesList.length > 0
              ? [...drivesList].map(d => ({
                name: d.company || d.name || "Unnamed Company",
                offers: d.stats?.selected ?? 0,
                package: d.package ? (String(d.package).includes("LPA") || String(d.package).includes("₹") ? d.package : `₹${d.package} LPA`) : "—",
                rawPackage: d.package
              })).sort((a, b) => getNumericPackage(a.rawPackage) - getNumericPackage(b.rawPackage))
              : mockRecruiters;

            const finalAverageCtc = placementStats?.average_ctc ?? dynamicSalaryBands?.average_ctc;
            const averageCtcDisplay = finalAverageCtc !== undefined && finalAverageCtc !== null
              ? `₹${finalAverageCtc} LPA`
              : "₹8.4 LPA";

            const funnelToRender = dynamicFunnelData || funnelData;

            const bandsToRender = (dynamicSalaryBands && Array.isArray(dynamicSalaryBands.bands))
              ? dynamicSalaryBands.bands.map((band: any) => ({
                range: band.label,
                percentage: band.percent !== undefined ? Math.round(band.percent) : 0,
                color: band.color || "#3b82f6",
                count: band.count ?? 0
              }))
              : salaryBands;

            const getFunnelValue = (label: string, defaultVal: number) => {
              if (!dynamicFunnelData) return defaultVal;
              const item = dynamicFunnelData.find(f =>
                f.label.toLowerCase() === label.toLowerCase() ||
                (label.toLowerCase() === "interviews scheduled" && f.label.toLowerCase() === "interviews done")
              );
              return item ? item.value : 0;
            };

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* 1. Placement Metrics (4 cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Applications Sent</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {placementStats?.total_applications ?? getFunnelValue("Applications Sent", 847)}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
                      <Send className="w-5 h-5 text-slate-400" />
                    </div>
                  </BaseCard>
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Shortlisted</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {placementStats?.shortlisted ?? getFunnelValue("Shortlisted", 312)}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                      <Star className="w-5 h-5 text-orange-500" />
                    </div>
                  </BaseCard>
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Interviews Scheduled</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {getFunnelValue("Interviews Scheduled", 156)}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                      <Calendar className="w-5 h-5 text-red-500" />
                    </div>
                  </BaseCard>
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Offers Received</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {placementStats?.placed ?? getFunnelValue("Offers Received", 98)}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                      <span className="text-xl">🎉</span>
                    </div>
                  </BaseCard>
                </div>

                {/* 2. Stats Metrics banner (4 cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Placement Rate</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {placementStats === null ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400 inline" />
                        ) : (
                          `${placementStats.placement_rate ?? 0}%`
                        )}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100">
                      <FileText className="w-5 h-5" />
                    </div>
                  </BaseCard>
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Average CTC</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {placementStats === null ? (
                          <Loader2 className="w-5 h-5 animate-spin text-amber-400 inline" />
                        ) : (
                          `₹${placementStats.average_ctc ?? 0} LPA`
                        )}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-100">
                      <FaRupeeSign className="w-5 h-5" />
                    </div>
                  </BaseCard>
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Highest CTC</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {placementStats === null ? (
                          <Loader2 className="w-5 h-5 animate-spin text-purple-400 inline" />
                        ) : (
                          `₹${placementStats.highest_ctc ?? 0} LPA`
                        )}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm shadow-purple-100">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </BaseCard>
                  <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Companies Visited</p>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {placementStats === null ? (
                          <Loader2 className="w-5 h-5 animate-spin text-slate-600 inline" />
                        ) : (
                          placementStats.companies_visited ?? 0
                        )}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm shadow-slate-100">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </BaseCard>
                </div>

                {/* 3. Placement Funnel & Company-wise Selections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Placement Funnel Card */}
                  <BaseCard className="border-slate-200 p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-green-600" />
                      Placement Funnel 2024–25
                    </h3>
                    <div className="space-y-6">
                      {funnelToRender.map((stage, idx) => {
                        const isHex = stage.color && (stage.color.startsWith("#") || stage.color.startsWith("rgb"));
                        return (
                          <div key={idx} className="flex items-center gap-6">
                            <div className="w-40 text-xs font-bold text-slate-600 shrink-0">
                              {stage.label}
                            </div>
                            <div className="flex-1 flex items-center">
                              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden flex-1 relative flex items-center">
                                <motion.div
                                  className={`h-2 rounded-full ${!isHex ? stage.color : ""}`}
                                  style={isHex ? { backgroundColor: stage.color } : {}}
                                  initial={{ width: 0 }}
                                  animate={{ width: stage.width }}
                                  transition={{ duration: 1, delay: idx * 0.1 }}
                                />
                              </div>
                            </div>
                            <div className="w-8 text-right text-xs font-bold text-slate-800 shrink-0">
                              {stage.value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </BaseCard>

                  {/* Company Selections Panel */}
                  <BaseCard className="bg-white border-slate-200/60 shadow-sm p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Company-wise Selections
                    </h3>
                    <div className="space-y-4">
                      {displayRecruiters.map((recruiter, i) => {
                        const colors = ["bg-blue-600", "bg-emerald-600", "bg-orange-600", "bg-indigo-600", "bg-purple-600", "bg-pink-600", "bg-teal-600"];
                        const color = colors[i % colors.length];
                        return (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                                {recruiter.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{recruiter.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{recruiter.package}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                              {recruiter.offers} offers
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </BaseCard>
                </div>

                {/* 4. Branch-wise Placement Rate & Salary Bands (replacing CTC Distribution) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Branch Placements Panel */}
                  <BaseCard className="bg-white border-slate-200/60 shadow-sm p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Branch-wise Placement Rate</h3>
                    <div className="space-y-3.5">
                      {branchPerformance === null ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      ) : branchPerformance.length === 0 ? (
                        <p className="text-xs text-slate-400 font-semibold text-center py-4">No branch performance data found</p>
                      ) : (
                        branchPerformance.map((b: any, i: number) => {
                          const branchName = b.department || "—";
                          const placed = b.placed_students ?? 0;
                          const total = b.total_students ?? 0;
                          const rate = b.placement_rate !== undefined ? Number(b.placement_rate).toFixed(1) : "0.0";
                          const rateNum = Number(rate);
                          const color = rateNum >= 50 ? "bg-emerald-500" : "bg-red-500";
                          return (
                            <div key={i} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-700">
                                  {branchName}{" "}
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    ({placed}/{total})
                                  </span>
                                </span>
                                <span className="font-bold text-slate-800">{rate}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, Math.max(0, rateNum))}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </BaseCard>

                  {/* Salary Bands Card */}
                  <BaseCard className="border-slate-200 p-5 flex flex-col justify-between h-full bg-white shadow-sm">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Salary Bands</h3>
                      <div className="space-y-4">
                        {bandsToRender.map((band: any, idx: number) => {
                          const isHex = band.color && (band.color.startsWith("#") || band.color.startsWith("rgb"));
                          return (
                            <div key={idx} className="flex items-center gap-4">
                              <div className="w-20 text-xs font-semibold text-slate-600">
                                {band.range}
                              </div>
                              <div className="flex-1 flex justify-end">
                                <div
                                  className={`h-1.5 rounded-full ${!isHex ? band.color : ""}`}
                                  style={isHex ? { backgroundColor: band.color, width: `${band.percentage}%` } : { width: `${band.percentage}%` }}
                                />
                              </div>
                              <div className={`w-8 text-right text-xs font-bold ${band.percentage > 30 ? 'text-slate-800' : 'text-slate-500'
                                }`}>
                                {band.percentage}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-slate-100 pb-1">
                      <h2 className="text-2xl font-black text-slate-800">{averageCtcDisplay}</h2>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Average CTC 2024–25</p>
                    </div>
                  </BaseCard>
                </div>
              </motion.div>
            );
          })()
        ) : (
          // ==================== 5. GENERAL CAMPUS DRIVES LIST (Image 1) ====================
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Metrics cards banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Drives</p>
                  <h4 className="text-2xl font-bold text-slate-800">
                    {driveCounts === null ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400 inline" />
                    ) : drivesMetrics.totalDrives}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100">
                  <Briefcase className="w-5 h-5" />
                </div>
              </BaseCard>
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Upcoming Drives</p>
                  <h4 className="text-2xl font-bold text-slate-800">
                    {driveCounts === null ? (
                      <Loader2 className="w-5 h-5 animate-spin text-orange-400 inline" />
                    ) : drivesMetrics.upcomingDrives}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm shadow-orange-100">
                  <Calendar className="w-5 h-5" />
                </div>
              </BaseCard>
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Students Registered</p>
                  <h4 className="text-2xl font-bold text-slate-800">
                    {driveCounts === null ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400 inline" />
                    ) : drivesMetrics.studentsRegistered}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-100">
                  <Users className="w-5 h-5" />
                </div>
              </BaseCard>
              <BaseCard className="p-5 border-slate-200/60 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Offers Confirmed</p>
                  <h4 className="text-2xl font-bold text-slate-800">
                    {driveCounts === null ? (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400 inline" />
                    ) : drivesMetrics.offersConfirmed}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm shadow-purple-100">
                  <Trophy className="w-5 h-5" />
                </div>
              </BaseCard>
            </div>

            {/* Drives List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Campus Drives</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search drives, companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {filteredDrives.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-700">No drives match your search</h4>
                  <p className="text-xs text-slate-400 mt-1">Try refining your search keyword</p>
                </div>
              ) : (
                filteredDrives.map(drive => (
                  <BaseCard key={drive.id} className="p-5 bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${drive.company === 'TCS' ? 'bg-blue-600' : drive.company === 'Infosys' ? 'bg-emerald-600' : 'bg-orange-600'
                      }`}></div>

                    <div className="flex items-start gap-4 pl-2 max-w-xl">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm ${drive.company === 'TCS' ? 'bg-blue-600' : drive.company === 'Infosys' ? 'bg-emerald-600' : 'bg-orange-600'}`}>
                        {drive.company ? drive.company.charAt(0) : "D"}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{drive.company}</h4>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {drive.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">{drive.role}</p>

                        <div className="flex flex-wrap gap-2.5 pt-1 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Drive: {new Date(drive.driveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Reg Deadline: {new Date(drive.regDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg text-amber-700 font-semibold">
                            <FaRupeeSign className="w-3 h-3 text-amber-500" />
                            {drive.package} LPA
                          </span>
                          <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                            {drive.type}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 font-semibold pt-1">
                          Criteria: <strong className="text-slate-600 font-bold">Min CGPA: {drive.criteria.minCgpa}</strong> | <strong className="text-slate-600 font-bold">Backlogs: {drive.criteria.backlogs}</strong> | {drive.criteria.branches.join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 shrink-0">
                      <div className="flex items-center gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-orange-600">{drive.stats.registered}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered</p>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div>
                          <p className="text-lg font-bold text-blue-600">{drive.stats.shortlisted}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shortlisted</p>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div>
                          <p className="text-lg font-bold text-emerald-600">{drive.stats.selected}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDrive(drive);
                            setIsAddDriveModalOpen(true);
                          }}
                          className="bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-orange-600 p-2.5 rounded-xl transition-all shadow-sm"
                          title="Edit Campus Drive"
                        >
                          <Pen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDrive(drive.name);
                          }}
                          className="bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 p-2.5 rounded-xl transition-all shadow-sm"
                          title="Delete Campus Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleManageDrive(drive)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all uppercase tracking-wider"
                        >
                          Manage <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </BaseCard>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Drive Modal */}
      <DashboardDynamicModal
        isOpen={isAddDriveModalOpen}
        onClose={() => {
          setIsAddDriveModalOpen(false);
          setEditingDrive(null);
        }}
        title={editingDrive ? "Edit Campus Drive" : "Add Campus Drive"}
        subtitle={editingDrive ? "Update the campus recruitment drive details" : "Configure criteria and publish a new campus recruitment drive"}
        headerIcon={Briefcase}
        iconBgColor="bg-orange-500"
        fields={addDriveFields}
        initialValues={initialValues}
        onSubmit={handleDriveSubmit}
        loading={isSubmittingDrive}
      />
    </div>
  );
}
