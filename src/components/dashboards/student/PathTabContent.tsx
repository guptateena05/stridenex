"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Target,
  Loader2,
  ArrowRight,
  Compass,
  Search,
  Plus,
  X,
  Lock,
  Check,
  Sparkles,
  BookOpen,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Calendar,
  Heart,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SkipForward,
  Award,
  ShieldCheck,
  Download,
  Eye,
  FileText
} from "lucide-react";
import {
  getStudentCareerPath,
  getRecommendedPaths,
  getAllCareerPaths,
  enrollStudentPath,
  deleteStudentEnrollment,
  createStudentSkill,
  logMilestoneProgress,
  getMasterData,
  getCareerPathDetail,
  getCareerRecommendations,
  getHierarchySkillsForPath,
  getStudentSkills,
  completeMilestonePoint,
  getSkillTestQuestions,
  submitSkillTest,
  getSkillTestResult
} from "@/services/student.services";
import { useToast } from "@/context/ToastContext";
import { parseBackendError } from "@/utils/error.utils";

function ConfettiEffect() {
  const particles = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: -10 - Math.random() * 20, // start above screen
      size: 5 + Math.random() * 10,
      color: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'][Math.floor(Math.random() * 6)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[9999]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: `${p.y}vh`,
            rotate: p.rotation,
            opacity: 1
          }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 720,
            opacity: 0
          }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '20%',
          }}
        />
      ))}
    </div>
  );
}

export default function PathTabContent() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState<any>(null);
  const [recommendedPaths, setRecommendedPaths] = useState<any[]>([]);
  const [allCareerPaths, setAllCareerPaths] = useState<any[]>([]);
  const [masterSearchQuery, setMasterSearchQuery] = useState<string>("");
  const [showMasterSearch, setShowMasterSearch] = useState<boolean>(false);
  const [masterPage, setMasterPage] = useState<number>(1);
  const [masterTotalPages, setMasterTotalPages] = useState<number>(0);
  const [masterTotalCount, setMasterTotalCount] = useState<number>(0);
  const [masterPathsLoading, setMasterPathsLoading] = useState<boolean>(false);
  const [enrollingPath, setEnrollingPath] = useState<string | null>(null);

  const fetchMasterCareerPaths = async (query = "", page = 1) => {
    setMasterPathsLoading(true);
    try {
      const res = await getAllCareerPaths(query, page, 10);
      if (res?.message) {
        const msg = res.message;
        setAllCareerPaths(Array.isArray(msg.paths) ? msg.paths : []);
        setMasterTotalPages(msg.total_pages || 0);
        setMasterTotalCount(msg.total_count || 0);
        setMasterPage(msg.page || 1);
      } else {
        setAllCareerPaths([]);
        setMasterTotalPages(0);
        setMasterTotalCount(0);
        setMasterPage(1);
      }
    } catch (err) {
      console.error("Error fetching master career paths:", err);
      showToast("Failed to load career knowledgebase library.", "error");
    } finally {
      setMasterPathsLoading(false);
    }
  };

  useEffect(() => {
    if (!showMasterSearch) return;
    const delayDebounce = setTimeout(() => {
      fetchMasterCareerPaths(masterSearchQuery, 1);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [masterSearchQuery, showMasterSearch]);

  // Wizard state variables
  const [inWizardMode, setInWizardMode] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");
  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [selectedPathDetails, setSelectedPathDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Student Profile fields
  const [degree, setDegree] = useState<string>("");
  const [specialisation, setSpecialisation] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<number>(3);
  const [interests, setInterests] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false);

  // Hierarchy skills retrieved for the selected career path
  const [hierarchySkills, setHierarchySkills] = useState<any>(null);

  // Student skills ledger entries
  const [studentSkills, setStudentSkills] = useState<any[]>([]);
  const [revisedMilestones, setRevisedMilestones] = useState<Record<string, boolean>>({});
  const [collapsedChecklists, setCollapsedChecklists] = useState<Record<string, boolean>>({});

  // Skill Assessment Test States
  const [mounted, setMounted] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [testSkill, setTestSkill] = useState<string>("");
  const [testLevel, setTestLevel] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<string>("");
  const [activeStepName, setActiveStepName] = useState<string>("");

  // AI Generation simulation states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationPhase, setGenerationPhase] = useState<string>("");
  const [isGenerationFailed, setIsGenerationFailed] = useState<boolean>(false);
  const [failedPathTitle, setFailedPathTitle] = useState<string>("");
  const [failedEnrollmentName, setFailedEnrollmentName] = useState<string>("");

  // Skill acquisition celebration states
  const [showCelebration, setShowCelebration] = useState(false);
  const [acquiredSkillName, setAcquiredSkillName] = useState("");
  const [acquiredSkillLevel, setAcquiredSkillLevel] = useState("");

  // PDF Report states
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportBlobUrl, setReportBlobUrl] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handlePreviewReport = async () => {
    setIsReportLoading(true);
    setShowReportPreview(true);
    setReportError(null);
    setReportBlobUrl(null);
    try {
      const studentEmail = localStorage.getItem("currentUser") || "ac1@gmail.com";
      const url = `https://devstridenex.quantcloud.in/api/method/nexedu.path_finder.app_api.get_career_path_pdf?student=${encodeURIComponent(studentEmail)}`;

      const response = await fetch(url);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to generate PDF. Server returned JSON instead of PDF.");
      }

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Empty PDF received");
      }

      const blobUrl = URL.createObjectURL(blob);
      setReportBlobUrl(blobUrl);
    } catch (err: any) {
      console.error("Error fetching report:", err);
      setReportError(err.message || "Failed to load report. Please try again.");
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (reportBlobUrl) {
        URL.revokeObjectURL(reportBlobUrl);
      }
    };
  }, [reportBlobUrl]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const studentEmail = localStorage.getItem("currentUser") || "ac1@gmail.com";

      // Fetch active career path and student skills in parallel
      const [careerPathRes, studentSkillsRes] = await Promise.all([
        getStudentCareerPath(studentEmail).catch(err => {
          console.warn("getStudentCareerPath API failed, using fallback data:", err);
          return null;
        }),
        getStudentSkills(studentEmail).catch(err => {
          console.warn("getStudentSkills API failed:", err);
          return null;
        })
      ]);

      if (studentSkillsRes?.message) {
        setStudentSkills(Array.isArray(studentSkillsRes.message) ? studentSkillsRes.message : []);
      } else if (Array.isArray(studentSkillsRes)) {
        setStudentSkills(studentSkillsRes);
      }

      if (careerPathRes?.message) {
        const msg = careerPathRes.message;
        setActivePath(msg);
        if (msg.type === "active_plan" || (msg.data && msg.data.has_active_plan)) {
          setInWizardMode(false);
          setIsGenerating(false);
          setIsGenerationFailed(false);
        } else if (msg.type === "generating") {
          setInWizardMode(false);
          setIsGenerating(true);
          setIsGenerationFailed(false);
          if (!generationPhase) {
            setGenerationPhase("🤖 AI is generating your customized milestones...");
          }
        } else if (msg.type === "failed") {
          setInWizardMode(false);
          setIsGenerating(false);
          setIsGenerationFailed(true);
          setFailedPathTitle(msg.career_path || "");
          setFailedEnrollmentName(msg.enrollment || "");
        } else {
          setInWizardMode(true);
          setIsGenerating(false);
          setIsGenerationFailed(false);
        }
      } else {
        setInWizardMode(true);
        setIsGenerating(false);
        setIsGenerationFailed(false);
      }
    } catch (error) {
      console.error("Error loading path tab content:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const res = await getMasterData("Skill", { page_size: 150 });
      if (res?.data) {
        const names = res.data.map((item: any) => item.skill_name || item.name || item.skill);
        const uniqueNames = Array.from(new Set(names.filter(Boolean))) as string[];
        setSkillsList(uniqueNames.sort());
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      console.warn("Failed to fetch skills from master, using default list:", err);
      setSkillsList([
        "Python", "HTML", "CSS", "JavaScript", "SQL", "Machine Learning", "Git", "React",
        "Django", "Flask", "TailwindCSS", "Node.js", "Docker", "AWS", "Frappe", "Jinja",
        "Deep Learning", "Data Analysis", "TypeScript", "Next.js", "PostgreSQL", "Linux"
      ]);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
    fetchSkills();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isGenerating) {
      interval = setInterval(() => {
        fetchData(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  useEffect(() => {
    const parsed = skillsInput
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    setSelectedSkills(parsed);
  }, [skillsInput]);

  useEffect(() => {
    if (studentSkills.length > 0 && !skillsInput) {
      const list = studentSkills.map((s: any) => s.skill || s.skill_name || s.name).filter(Boolean);
      setSkillsInput(list.join(", "));
    }
  }, [studentSkills]);

  const handleEnrollPath = async (careerPathName: string, generationMode: string = "Standard") => {
    const studentEmail = localStorage.getItem("currentUser") || "ac1@gmail.com";
    let hasSucceeded = false;
    try {
      setEnrollingPath(careerPathName);
      if (generationMode === "AI") {
        setIsGenerating(true);
        setGenerationPhase("🤖 Initiating AI roadmap generation...");
      }
      const res = await enrollStudentPath(studentEmail, careerPathName, generationMode);
      if (res) {
        hasSucceeded = true;
        if (generationMode === "AI") {
          setInWizardMode(false);
        }
        await fetchData();
      }
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      showToast(parseBackendError(err) || "Failed to switch career path. Please try again.", "error");
    } finally {
      setEnrollingPath(null);
      if (!hasSucceeded || generationMode !== "AI") {
        setIsGenerating(false);
        setGenerationPhase("");
      }
    }
  };

  const handleCompleteMilestone = async (milestoneName: string) => {
    if (!pathData?.enrollment_id) return;
    try {
      setLoading(true);
      await logMilestoneProgress(pathData.enrollment_id, milestoneName);
      showToast("Milestone marked as completed! You have gained the corresponding skills.", "success");
      await fetchData();
    } catch (err: any) {
      console.error("Failed to complete milestone:", err);
      showToast(parseBackendError(err) || "Failed to mark milestone as complete.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePoint = async (milestoneTitle: string, pointTitle: string, currentStatus: string) => {
    if (!pathData?.enrollment_id) return;

    const newCompleted = currentStatus !== 'Completed';

    if (newCompleted) {
      const confirmMessage = `Are you sure you want to mark the point "${pointTitle}" as complete?`;
      if (!window.confirm(confirmMessage)) return;
    }

    try {
      setLoading(true);
      const res = await completeMilestonePoint({
        enrollment: pathData.enrollment_id,
        milestone_title: milestoneTitle,
        point_title: pointTitle,
        completed: newCompleted
      });
      if (res?.message?.milestone_completed) {
        showToast("🎉 Milestone fully completed! You have gained the corresponding skills.", "success");
      }
      await fetchData();
    } catch (err: any) {
      console.error("Failed to toggle checklist point:", err);
      showToast(parseBackendError(err) || "Failed to update checklist item.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async (skillName: string, level: string, stepName: string) => {
    try {
      setLoading(true);
      const studentEmail = localStorage.getItem("currentUser") || "ac1@gmail.com";
      const response = await getSkillTestQuestions(studentEmail, skillName, level);
      const data = response?.message || response?.data || response;

      if (data && data.questions && data.questions.length > 0) {
        setTestQuestions(data.questions);
        setTestSkill(skillName);
        setTestLevel(level);
        setActiveStepName(stepName);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setTestResult(null);
        setIsEvaluating(false);
        setIsTestModalOpen(true);
        showToast("Skill assessment questions loaded successfully!", "success");
      } else {
        showToast("No assessment questions available for this skill.", "error");
      }
    } catch (err: any) {
      console.error("Error starting assessment:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to load assessment questions.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTest = async () => {
    const unansweredCount = testQuestions.length - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      showToast(`Please answer all questions before submitting. (${unansweredCount} remaining)`, "warning");
      return;
    }

    try {
      setIsSubmittingTest(true);
      const studentEmail = localStorage.getItem("currentUser") || "ac1@gmail.com";
      const answersPayload: Record<string, string> = {};
      testQuestions.forEach((q, idx) => {
        const questionText = q.question;
        const answerText = userAnswers[idx] || "";
        answersPayload[questionText] = answerText;
      });

      const response = await submitSkillTest({
        student: studentEmail,
        skill: testSkill,
        level: testLevel,
        answers: answersPayload
      });
      const data = response?.message || response?.data || response;

      if (data && data.skill_test) {
        const skillTestId = data.skill_test;
        setTestResult(data);

        if (data.feedback_status === "ready") {
          setIsEvaluating(false);
          setIsSubmittingTest(false);
          if (data.passed) {
            showToast("🎉 Excellent! You passed the assessment and completed the milestone!", "success");
            setAcquiredSkillName(testSkill);
            setAcquiredSkillLevel(testLevel);
            setShowCelebration(true);
            await fetchData(true); // silent refresh
          } else {
            showToast("Assessment not passed. You can review the feedback and retry.", "warning");
          }
        } else {
          setIsEvaluating(true);
          setEvaluationStatus("Evaluating answers...");
          pollTestResult(skillTestId);
        }
      } else {
        showToast("Failed to initiate assessment submission.", "error");
        setIsSubmittingTest(false);
      }
    } catch (err: any) {
      console.error("Error submitting test:", err);
      showToast(err?.message || "Failed to submit assessment.", "error");
      setIsSubmittingTest(false);
    }
  };

  const pollTestResult = async (skillTestId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await getSkillTestResult(skillTestId);
        const data = response?.message || response?.data || response;

        if (data && data.feedback_status === "ready") {
          clearInterval(interval);
          setTestResult(data);
          setIsEvaluating(false);
          setIsSubmittingTest(false);

          if (data.passed) {
            showToast("🎉 Excellent! You passed the assessment and completed the milestone!", "success");
            setAcquiredSkillName(testSkill);
            setAcquiredSkillLevel(testLevel);
            setShowCelebration(true);
            await fetchData(true); // silent refresh
          } else {
            showToast("Assessment not passed. You can review the feedback and retry.", "warning");
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsEvaluating(false);
          setIsSubmittingTest(false);
          showToast("AI evaluation is taking longer than expected. Please check back later.", "info");
          setIsTestModalOpen(false);
          await fetchData(true);
        }
      } catch (err) {
        console.error("Error polling test result:", err);
      }
    }, 2000);
  };

  // Submit profile details to fetch career recommendations
  const handleGetRecommendations = async () => {
    setShowValidationErrors(true);
    if (!degree || !degree.trim()) {
      showToast("Degree / Qualification is required.", "warning");
      return;
    }
    if (!specialisation || !specialisation.trim()) {
      showToast("Branch / Specialisation is required.", "warning");
      return;
    }
    if (!academicYear) {
      showToast("Academic Year is required.", "warning");
      return;
    }
    if (!interests || !interests.trim()) {
      showToast("Core Interests are required.", "warning");
      return;
    }
    if (!skillsInput || !skillsInput.trim()) {
      showToast("Please enter the skills you already possess.", "warning");
      return;
    }

    setLoading(true);
    try {
      const params = {
        degree: degree,
        branch: specialisation,
        year: academicYear,
        country: "India",
        interests: interests,
        skills: selectedSkills
      };

      const res = await getCareerRecommendations(params);
      if (res?.message?.recommended_paths) {
        setRecommendedPaths(res.message.recommended_paths);
        setWizardStep(2);
      } else if (res?.recommended_paths) {
        setRecommendedPaths(res.recommended_paths);
        setWizardStep(2);
      } else {
        showToast("No recommendations found for this profile.", "warning");
        setRecommendedPaths([]);
        setWizardStep(2);
      }
    } catch (err: any) {
      console.error("Failed to get career recommendations:", err);
      showToast(parseBackendError(err) || "Error generating recommendations.", "error");
      setRecommendedPaths([]);
      setWizardStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Select a recommended path and load its hierarchy skills
  const handleSelectPathForSkills = async (path: any) => {
    setSelectedPath(path);
    setDetailsLoading(true);
    try {
      const pathTitle = path.career || path.title || path.path_name;
      const res = await getHierarchySkillsForPath(pathTitle);
      if (res?.message) {
        setHierarchySkills(res.message);
      } else if (res) {
        setHierarchySkills(res);
      }
    } catch (err) {
      console.error("Error getting hierarchy skills for path:", err);
      setHierarchySkills({
        foundation_skills: path.skills ? path.skills.slice(0, 2) : [],
        core_domain_skills: path.skills ? path.skills.slice(2, 4) : [],
        industry_skills: path.skills ? path.skills.slice(4, 5) : [],
        emerging_skills: path.skills ? path.skills.slice(5) : []
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Move to gap analysis preview step
  const handleGoToGapAnalysis = async () => {
    if (!selectedPath) return;
    setDetailsLoading(true);
    try {
      const pathTitle = selectedPath.career || selectedPath.title || selectedPath.path_name;
      const res = await getCareerPathDetail(pathTitle);
      if (res?.message) {
        setSelectedPathDetails(res.message);
      } else {
        setSelectedPathDetails(selectedPath);
      }
      setWizardStep(3);
    } catch (err) {
      console.error("Error getting career path detail:", err);
      setSelectedPathDetails(selectedPath);
      setWizardStep(3);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Start AI personalized roadmap wizard execution
  const handleStartPersonalizedRoadmap = async (confirmed = false) => {
    if (!selectedPath) return;

    if (!confirmed) {
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    const studentEmail = localStorage.getItem("currentUser") || "ac1@gmail.com";
    const pathTitle = selectedPath.career || selectedPath.title || selectedPath.path_name;
    let hasSucceeded = false;

    try {
      setIsGenerating(true);
      setGenerationPhase("🤖 Self-declaring selected skills into Skill Ledger...");

      // Call createStudentSkill in parallel for all selected skills
      await Promise.all(
        selectedSkills.map(async (skillName) => {
          try {
            await createStudentSkill({
              student: studentEmail,
              skill: skillName,
              current_level: "Intermediate",
              self_declared: 1,
              ai_verified: 1,
              status: "Verified"
            });
          } catch (e) {
            console.warn("Skill already exists or failed to declare:", skillName, e);
          }
        })
      );

      setGenerationPhase("🤖 Enrolling student and generating personalized roadmap...");

      const res = await enrollStudentPath(studentEmail, pathTitle, "AI");
      if (res) {
        hasSucceeded = true;
        setInWizardMode(false);
        setWizardStep(1);
        setSelectedPath(null);
        setSelectedPathDetails(null);
        setHierarchySkills(null);
        setSelectedSkills([]);
        await fetchData();
      }
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      showToast(parseBackendError(err) || "Failed to generate AI roadmap. Please try again.", "error");
    } finally {
      if (!hasSucceeded) {
        setIsGenerating(false);
        setGenerationPhase("");
      }
    }
  };

  // Default roadmaps / fallback values
  const defaultRoadmap = [
    { title: "Python Fundamentals", subtitle: "Complete Python Basics course", date: "Jan 12", status: "completed" },
    { title: "Data Structures & Algo", subtitle: "DSA + 30 LeetCode problems", date: "Jan 28", status: "completed" },
    { title: "SQL & Database Design", subtitle: "Advanced SQL + 2 projects", date: "Feb 5", status: "completed" },
    { title: "Machine Learning Basics", subtitle: "Sklearn, Pandas - Active", date: "Due Mar 1", status: "active" },
    { title: "ML Capstone Project", subtitle: "Industry live project submission", date: "Mar 30", status: "upcoming" },
    { title: "Data Science Internship", subtitle: "Apply to shortlisted companies", date: "Apr-Jun", status: "upcoming" },
  ];



  // Map Active Path
  const pathData = activePath?.data || activePath;
  const activePathTitle = pathData?.career_path || pathData?.career_path_name || pathData?.path_name || pathData?.title || "Data Scientist";
  const activePathProgress = pathData?.progress_percent !== undefined
    ? pathData.progress_percent
    : 0;
  const isPathCompleted = pathData?.is_completed === 1 || pathData?.is_completed === true || activePathProgress >= 100;
  const estCompletion = pathData?.estimated_completion || pathData?.est_completion || (pathData?.estimated_duration ? `${pathData.estimated_duration} Year(s)` : "Apr 2025");
  const targetRole = pathData?.target_role || pathData?.target || "Data Scientist @ Startup";

  const rawSteps = pathData?.milestones || pathData?.roadmap || pathData?.steps || pathData?.path_items || pathData?.items;

  const roadmap = Array.isArray(rawSteps) && rawSteps.length > 0
    ? rawSteps.map((step: any) => {
      return {
        name: step.name || "",
        title: step.milestone_title || step.title || step.step_name || "Untitled Step",
        skill: step.skill || "",
        required_skill_level: step.required_skill_level || step.level || "Beginner",
        category: step.category || "Fundamental",
        topic: step.topic || "",
        subtopic: step.subtopic || "",
        is_mandatory: step.is_mandatory !== undefined ? step.is_mandatory : 1,
        milestone_type: step.milestone_type || "Learn",
        linked_resource_type: step.linked_resource_type || "Course",
        linked_resource: step.linked_resource || "",
        objective: step.objective || "",
        project: step.project || "",
        date: step.display_date || (step.duration_days ? `${step.duration_days} Days` : ""),
        status: step.status || "upcoming",
        points: step.points || []
      };
    })
    : defaultRoadmap;

  // Map Recommended / Alternate Paths
  const rawAlternatePaths = recommendedPaths;
  const alternatePaths = rawAlternatePaths.map((path: any) => ({
    title: path.career || path.career_path || path.path_name || path.title || "Career Path",
    fitScore: typeof path.confidence === 'number' ? path.confidence : (typeof path.fit_score === 'number' ? path.fit_score : 80),
    targetRole: path.target_role || path.category || "N/A",
    difficulty: path.career_stage || "Growing",
    matchedCount: path.matched_count !== undefined ? path.matched_count : 0,
    missingCount: path.missing_count !== undefined ? path.missing_count : 0,
    totalSkills: path.total_skills !== undefined ? path.total_skills : 0,
    duration: path.estimated_duration !== undefined ? path.estimated_duration : 1,
    salary: path.average_salary !== undefined ? path.average_salary : 0,
    skills: Array.isArray(path.skills)
      ? path.skills
      : (typeof path.skills === 'string'
        ? path.skills.split(',').map((s: string) => s.trim())
        : (path.tags || []))
  }));

  // Map Master / Custom selected Paths
  const filteredMasterPaths = allCareerPaths.map((path: any) => ({
    title: path.path_name || path.name || "Career Path",
    fitScore: 100,
    targetRole: path.target_role || "Knowledgebase Path",
    difficulty: path.difficulty_level || "Growing",
    matchedCount: 0,
    missingCount: 0,
    totalSkills: 0,
    duration: path.estimated_duration_months || 0,
    salary: path.average_salary_lpa || 0,
    skills: Array.isArray(path.skills)
      ? path.skills
      : (typeof path.skills === 'string'
        ? path.skills.split(',').map((s: string) => s.trim())
        : [])
  }));

  // Toggle skills selected by user
  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Filter skills based on user search
  const filteredSkills = skillsList.filter(skill =>
    skill.toLowerCase().includes(skillSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium italic tracking-widest uppercase opacity-70">Syncing Career Paths...</span>
      </div>
    );
  }

  // Render the AI Roadmap Generation Failed state
  if (isGenerationFailed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto bg-white rounded-2xl border border-red-100 p-8 shadow-md">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
          <AlertCircle className="w-16 h-16 text-red-600 relative z-10 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
          AI Roadmap Generation Failed
        </h3>
        <p className="text-sm font-medium text-slate-600 max-w-sm mb-4 leading-relaxed">
          The AI system encountered a transient error while customizing milestones for <span className="font-semibold text-slate-800">{failedPathTitle}</span>.
        </p>
        <p className="text-xs text-slate-400 max-w-sm mb-8 leading-relaxed">
          This is usually caused by temporary backend instability or timeout. Your progress has been saved. You can retry the generation now.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={async () => {
              setIsGenerating(true);
              setIsGenerationFailed(false);
              setGenerationPhase("🤖 Retrying AI roadmap generation...");
              try {
                const studentEmail = localStorage.getItem("currentUser") || "ac1@gmail.com";
                const res = await enrollStudentPath(studentEmail, failedPathTitle, "AI");
                if (res) {
                  await fetchData();
                }
              } catch (err: any) {
                console.error("Retry failed:", err);
                setIsGenerating(false);
                setIsGenerationFailed(true);
                showToast(parseBackendError(err) || "Retry failed. Please try again later.", "error");
              }
            }}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition duration-200 shadow-sm"
          >
            Retry Generation
          </button>
          <button
            onClick={async () => {
              try {
                if (failedEnrollmentName) {
                  await deleteStudentEnrollment(failedEnrollmentName);
                }
                setIsGenerationFailed(false);
                setInWizardMode(true);
                await fetchData();
              } catch (err: any) {
                console.error("Cancel failed:", err);
                setIsGenerationFailed(false);
                setInWizardMode(true);
              }
            }}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render the AI Roadmap Generation overlay
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto bg-white rounded-2xl border border-slate-100 p-8 shadow-md">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 relative z-10 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
          AI Personalized Roadmap Builder
        </h3>
        <p className="text-sm font-bold text-slate-600 max-w-sm mb-2 leading-relaxed">
          Stay tuned! Your personalized learning roadmap is being built by AI.
        </p>
        <p className="text-xs font-medium text-slate-400 max-w-sm mb-6 leading-relaxed">
          Once completed, your new custom milestones and checklists will appear instantly on your active dashboard journey path. Please do not refresh or close this page.
        </p>
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
          <motion.div
            initial={{ width: "10%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 6, ease: "easeInOut" }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>
        <div className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full inline-block animate-pulse">
          {generationPhase}
        </div>
      </div>
    );
  }

  const onboardingSteps = [
    {
      num: 1,
      title: "Academic Profile",
      desc: "Tell us about your degree, specialisation, and core interests.",
      action: "Fill out the fields on the left and click 'Find Recommended Paths'."
    },
    {
      num: 2,
      title: "Select Career Path",
      desc: "Explore AI-recommended career paths matching your profile.",
      action: "Click a path to view its skill hierarchy, then click 'Find Skill Gap'."
    },
    {
      num: 3,
      title: "Skill Gap Analysis",
      desc: "Compare your claimed skills against path requirements.",
      action: "Review your matched/missing skills, then click 'Proceed & Activate Path'."
    }
  ];

  const futureSteps = [
    {
      title: "AI Roadmap Builder",
      icon: Sparkles,
      desc: "AI dynamically constructs milestones to close only your specific skill gaps."
    },
    {
      title: "Skill Verification",
      icon: Award,
      desc: "Complete short interactive assessments to verify and unlock milestones."
    },
    {
      title: "Opportunity Matching",
      icon: Briefcase,
      desc: "Get matched with tailored industry projects, internships, and job profiles."
    }
  ];

  return (
    <div>
      {inWizardMode ? (
        /* WIZARD FLOW SCREEN */
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-[1360px] mx-auto px-4">
          {/* Main Wizard Card */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8">

            {/* Go back button */}
            {(activePath?.type === "active_plan" || activePath?.data?.has_active_plan) && (
              <button
                onClick={() => setInWizardMode(false)}
                className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Go back to active path
              </button>
            )}

            {/* Header & Steps indicators */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                  AI Career Pathfinder Onboarding
                </h2>
                <p className="text-xs text-slate-500 mt-1">Design your custom, gap-optimized milestone learning path</p>
              </div>

              {/* Steps indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${wizardStep === stepNum
                      ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                      : wizardStep > stepNum
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                      }`}>
                      {wizardStep > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-8 h-0.5 ${wizardStep > stepNum ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: DEFINE PROFILE & DECLARED SKILLS */}
            {wizardStep === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Degree */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>Degree / Qualification <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g. B.Tech, B.Sc, M.Tech, BCA, MBA"
                      className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-700 ${showValidationErrors && !degree.trim() ? "border-red-500 ring-1 ring-red-500" : "border-slate-200"
                        }`}
                    />
                    {showValidationErrors && !degree.trim() && (
                      <span className="text-[10px] font-bold text-red-500 mt-1 block">Degree is required.</span>
                    )}
                  </div>

                  {/* Specialisation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>Branch / Specialisation <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={specialisation}
                      onChange={(e) => setSpecialisation(e.target.value)}
                      placeholder="e.g. Computer Science, Electronics, Mechanical, Civil"
                      className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-700 ${showValidationErrors && !specialisation.trim() ? "border-red-500 ring-1 ring-red-500" : "border-slate-200"
                        }`}
                    />
                    {showValidationErrors && !specialisation.trim() && (
                      <span className="text-[10px] font-bold text-red-500 mt-1 block">Branch / Specialisation is required.</span>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Academic Year <span className="text-red-500">*</span></span>
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-700 ${showValidationErrors && !academicYear ? "border-red-500 ring-1 ring-red-500" : "border-slate-200"
                        }`}
                    >
                      <option value="">Select Year...</option>
                      <option value="1">First Year (1st)</option>
                      <option value="2">Second Year (2nd)</option>
                      <option value="3">Third Year (3rd)</option>
                      <option value="4">Fourth Year (4th)</option>
                      <option value="5">Graduate / Completed</option>
                    </select>
                    {showValidationErrors && !academicYear && (
                      <span className="text-[10px] font-bold text-red-500 mt-1 block">Academic Year is required.</span>
                    )}
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-blue-600" />
                      <span>Core Interests (Comma Separated) <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="e.g. Machine Learning, Web Development, Cybersecurity, Cloud Computing"
                      className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-700 ${showValidationErrors && !interests.trim() ? "border-red-500 ring-1 ring-red-500" : "border-slate-200"
                        }`}
                    />
                    {showValidationErrors && !interests.trim() && (
                      <span className="text-[10px] font-bold text-red-500 mt-1 block">Core Interests are required.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>What Skills Do You Already Possess? (Comma Separated) <span className="text-red-500">*</span></span>
                  </label>
                  <p className="text-xs text-slate-500 mb-4">We will use these skills to run gap analysis and offer milestone revision options.</p>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. HTML, CSS, JavaScript, React, Node.js"
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-700 ${showValidationErrors && !skillsInput.trim() ? "border-red-500 ring-1 ring-red-500" : "border-slate-200"
                      }`}
                  />
                  {showValidationErrors && !skillsInput.trim() && (
                    <span className="text-[10px] font-bold text-red-500 mt-1 block">Please enter the skills you already possess.</span>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleGetRecommendations}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm active:scale-98"
                  >
                    Find Recommended Paths
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: PATH RECOMMENDATIONS & SKILLAGENT HIERARCHY */}
            {wizardStep === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-600" />
                      {showMasterSearch ? "AI Career Knowledgebase Library" : "Recommended Career Paths (Retrieved/Generated by AI Agents)"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {showMasterSearch
                        ? "Browse or search through our extensive knowledgebase of careers mapped by AI agents. Select any path to initiate skill gap analysis and generate a personalized roadmap."
                        : "These paths were hand-picked by our AI based on your background and interests."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    <button
                      onClick={() => {
                        setShowMasterSearch(false);
                        setSelectedPath(null);
                        setHierarchySkills(null);
                      }}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all border ${!showMasterSearch
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      Recommended
                    </button>
                    <button
                      onClick={() => {
                        setShowMasterSearch(true);
                        setSelectedPath(null);
                        setHierarchySkills(null);
                        setMasterSearchQuery("");
                        fetchMasterCareerPaths("", 1);
                      }}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all border ${showMasterSearch
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      Explore Other Paths
                    </button>
                  </div>
                </div>

                {showMasterSearch && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search career knowledgebase (e.g. AI Engineer, UX Designer, Fashion Designer)..."
                      value={masterSearchQuery}
                      onChange={(e) => setMasterSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-700 shadow-inner"
                    />
                  </div>
                )}

                <div>
                  {showMasterSearch && masterPathsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="p-5 rounded-xl border border-slate-100 bg-white space-y-4 animate-pulse">
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                          </div>
                          <div className="flex gap-2">
                            <div className="h-5 bg-slate-100 rounded w-16"></div>
                            <div className="h-5 bg-slate-100 rounded w-20"></div>
                          </div>
                          <div className="flex gap-1.5 pt-2">
                            <div className="h-4 bg-slate-50 rounded w-12"></div>
                            <div className="h-4 bg-slate-50 rounded w-12"></div>
                            <div className="h-4 bg-slate-50 rounded w-12"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(showMasterSearch ? filteredMasterPaths : alternatePaths).map((path: any, idx: number) => {
                          const isSelected = selectedPath?.title === path.title;
                          return (
                            <div
                              key={`${path.title}-${idx}`}
                              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                                ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-500 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                                }`}
                              onClick={() => handleSelectPathForSkills(path)}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-800">{path.title}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{path.targetRole}</span>
                                  </div>
                                  {!showMasterSearch && (
                                    <div className="text-right">
                                      <span className="text-xs font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
                                        {path.fitScore}% Match
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-1.5 my-3">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">
                                    {path.difficulty}
                                  </span>
                                  {path.salary > 0 && (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded">
                                      {path.salary} LPA Avg
                                    </span>
                                  )}
                                  {path.duration > 0 && (
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded">
                                      {path.duration} Months Est.
                                    </span>
                                  )}
                                </div>

                                {path.skills && path.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {path.skills.slice(0, 4).map((skill: string, skillIdx: number) => (
                                      <span key={skillIdx} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-medium rounded border border-slate-100">
                                        {skill}
                                      </span>
                                    ))}
                                    {path.skills.length > 4 && (
                                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-medium rounded">
                                        +{path.skills.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-600' : 'text-slate-400'} flex items-center gap-0.5`}>
                                  {isSelected ? "Selected" : "Click to View Details"}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {!showMasterSearch && alternatePaths.length === 0 && (
                          <div className="col-span-2 text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
                            <p className="text-sm font-semibold text-slate-700">
                              No match found for your profile.
                            </p>
                            <p className="text-xs text-slate-400 mt-1 mb-4 max-w-md mx-auto">
                              We couldn&apos;t generate career recommendations matching your profile degree, interests, and skills. Don&apos;t worry, you can explore other paths directly from our library.
                            </p>
                            <button
                              onClick={() => {
                                setShowMasterSearch(true);
                                setSelectedPath(null);
                                setHierarchySkills(null);
                                setMasterSearchQuery("");
                                fetchMasterCareerPaths("", 1);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-98"
                            >
                              Explore Other Paths
                            </button>
                          </div>
                        )}
                        {showMasterSearch && filteredMasterPaths.length === 0 && (
                          <div className="col-span-2 text-center py-10 text-slate-400 text-sm font-semibold">
                            No matching career paths found in the master library.
                          </div>
                        )}
                      </div>

                      {showMasterSearch && masterTotalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-6 border-t border-slate-100">
                          <span className="text-xs text-slate-400 font-medium">
                            Showing <span className="font-bold text-slate-700">{(masterPage - 1) * 10 + 1}</span> - <span className="font-bold text-slate-700">{Math.min(masterPage * 10, masterTotalCount)}</span> of <span className="font-bold text-slate-700">{masterTotalCount}</span> available paths
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={masterPage <= 1 || masterPathsLoading}
                              onClick={() => fetchMasterCareerPaths(masterSearchQuery, masterPage - 1)}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                              Previous
                            </button>

                            {Array.from({ length: masterTotalPages }).map((_, i) => {
                              const pageNum = i + 1;
                              const isEdge = pageNum === 1 || pageNum === masterTotalPages;
                              const isNear = Math.abs(pageNum - masterPage) <= 1;

                              if (isEdge || isNear) {
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => fetchMasterCareerPaths(masterSearchQuery, pageNum)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${masterPage === pageNum
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                      }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              }

                              if (pageNum === 2 || pageNum === masterTotalPages - 1) {
                                return (
                                  <span key={pageNum} className="text-slate-400 text-xs px-1 font-bold">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })}

                            <button
                              disabled={masterPage >= masterTotalPages || masterPathsLoading}
                              onClick={() => fetchMasterCareerPaths(masterSearchQuery, masterPage + 1)}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Hierarchy-wise skills found by Skill Agent for the selected path */}
                {selectedPath && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 rounded-xl border border-slate-150 p-6 space-y-4 shadow-inner"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className={`w-4 h-4 text-blue-600 ${detailsLoading ? 'animate-spin' : ''}`} />
                        SkillAgent Hierarchy Analysis: {selectedPath.title}
                      </h4>
                      {detailsLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                    </div>

                    {hierarchySkills ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Foundation */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-2">Foundation</span>
                          <div className="flex flex-col gap-1">
                            {hierarchySkills.foundation_skills?.length > 0 ? (
                              hierarchySkills.foundation_skills.map((s: string) => (
                                <span key={s} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-blue-500"></span>{s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">None found</span>
                            )}
                          </div>
                        </div>

                        {/* Core Domain */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-2">Core Domain</span>
                          <div className="flex flex-col gap-1">
                            {hierarchySkills.core_domain_skills?.length > 0 ? (
                              hierarchySkills.core_domain_skills.map((s: string) => (
                                <span key={s} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-indigo-500"></span>{s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">None found</span>
                            )}
                          </div>
                        </div>

                        {/* Industry */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-2">Industry</span>
                          <div className="flex flex-col gap-1">
                            {hierarchySkills.industry_skills?.length > 0 ? (
                              hierarchySkills.industry_skills.map((s: string) => (
                                <span key={s} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>{s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">None found</span>
                            )}
                          </div>
                        </div>

                        {/* Emerging */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm">
                          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-2">Emerging</span>
                          <div className="flex flex-col gap-1">
                            {hierarchySkills.emerging_skills?.length > 0 ? (
                              hierarchySkills.emerging_skills.map((s: string) => (
                                <span key={s} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-orange-500"></span>{s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">None found</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs font-medium text-slate-400 italic">
                        Click on a career path card to parse hierarchy skills via SkillAgent...
                      </div>
                    )}

                    <div className="flex justify-end pt-3">
                      <button
                        onClick={handleGoToGapAnalysis}
                        disabled={!hierarchySkills}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Find Skill Gap
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setWizardStep(1);
                      setShowValidationErrors(false);
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Back to Profile
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: HIERARCHICAL SKILL GAP ANALYSIS & CONFIRM ENROLL */}
            {wizardStep === 3 && selectedPath && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Career Goal: {selectedPath.title}</h4>
                  <p className="text-xs text-slate-500">Comparing your claimed skills against SkillAgent requirements</p>
                </div>

                {hierarchySkills && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-indigo-500" />
                      <h4 className="text-sm font-bold text-slate-800">Hierarchical Gap Assessment</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Foundation Tiers", icon: <BookOpen className="w-4 h-4 text-blue-500" />, matched: hierarchySkills.foundation_skills?.filter((s: string) => selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [], missing: hierarchySkills.foundation_skills?.filter((s: string) => !selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [] },
                        { label: "Core Domains", icon: <Briefcase className="w-4 h-4 text-indigo-500" />, matched: hierarchySkills.core_domain_skills?.filter((s: string) => selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [], missing: hierarchySkills.core_domain_skills?.filter((s: string) => !selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [] },
                        { label: "Industry Applications", icon: <GraduationCap className="w-4 h-4 text-emerald-500" />, matched: hierarchySkills.industry_skills?.filter((s: string) => selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [], missing: hierarchySkills.industry_skills?.filter((s: string) => !selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [] },
                        { label: "Emerging Fields", icon: <Sparkles className="w-4 h-4 text-orange-500" />, matched: hierarchySkills.emerging_skills?.filter((s: string) => selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [], missing: hierarchySkills.emerging_skills?.filter((s: string) => !selectedSkills.some(k => k.toLowerCase() === s.toLowerCase())) || [] },
                      ].map((group, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                              {group.icon}
                            </div>
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{group.label}</h5>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matched</span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{group.matched.length}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {group.matched.length > 0 ? (
                                  group.matched.map((s: string) => (
                                    <span key={s} className="px-2.5 py-1 bg-emerald-50/50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-100/50 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100/50">None matched</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gap (To Learn)</span>
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{group.missing.length}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {group.missing.length > 0 ? (
                                  group.missing.map((s: string) => (
                                    <span key={s} className="px-2.5 py-1 bg-slate-50 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200/60 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50/30 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                                    <Check className="w-3 h-3" /> Fully covered!
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard Milestones Preview */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Roadmap Sequence Preview</h4>
                  <div className="space-y-2 border border-slate-100 rounded-xl p-4 max-h-40 overflow-y-auto bg-slate-50/20">
                    {selectedPathDetails?.milestones ? (
                      selectedPathDetails.milestones.map((m: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 font-medium">{m.milestone_title}</div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                            {m.milestone_type}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No milestones preview available.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Back to Suggestions
                  </button>
                  <button
                    onClick={() => handleStartPersonalizedRoadmap()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    Proceed & Activate Path
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* RIGHT SIDEBAR — Onboarding Step Guide & Future Journey */}
          <div className="w-full lg:w-80 shrink-0 sticky top-6 self-start space-y-6">
            {/* Onboarding Guide Card */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Onboarding Guide</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Follow these steps to generate your path</p>
              </div>

              {/* Steps timeline */}
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {onboardingSteps.map((step) => {
                  const isCompleted = wizardStep > step.num;
                  const isActive = wizardStep === step.num;

                  return (
                    <div key={step.num} className="relative pl-8 flex gap-3 flex-col">
                      {/* Circle indicator */}
                      <div className={`absolute left-0 top-0.5 w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                        : isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-white border-slate-200 text-slate-400"
                        }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className={`text-xs font-bold transition-colors ${isActive ? "text-blue-600" : isCompleted ? "text-slate-700" : "text-slate-400"}`}>
                          {step.title}
                        </h4>
                        <p className={`text-[11px] mt-0.5 leading-relaxed font-medium ${isActive ? "text-slate-600" : "text-slate-400"}`}>
                          {step.desc}
                        </p>
                      </div>

                      {/* Active Step Action Instruction */}
                      {isActive && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 mt-0.5 animate-pulse">
                          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">👉 What to do now:</p>
                          <p className="text-[11px] text-blue-800 leading-relaxed font-semibold">{step.action}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Future Working / What's Next Card */}
            <div className="bg-gray-100 rounded-2xl border border-gray-300/70 shadow-sm p-5 space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
              <div className="absolute left-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

              <div>
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest font-mono bg-gray-200/80 px-2 py-0.5 rounded border border-gray-300">Future Journey</span>
                <h3 className="text-sm font-bold text-slate-800 mt-2">What happens next?</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">Once onboarding is complete, here is your learning journey:</p>
              </div>

              {/* Process flow */}
              <div className="space-y-4 pt-2">
                {futureSteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">{step.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-medium">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Active Path Confirmation Modal */}
          {mounted && createPortal(
            <AnimatePresence>
              {showConfirmModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
                  
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-200"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 animate-pulse" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      Set as Active Career Path?
                    </h3>

                    <p className="text-xs font-semibold text-slate-500 mb-6 leading-relaxed px-2">
                      Are you sure you want to select <span className="text-slate-800 font-bold">"{selectedPath?.career || selectedPath?.title || selectedPath?.path_name || 'this path'}"</span>? This path will be set as your Active Journey, and you will need to continue with it to build your profile.
                    </p>

                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all active:scale-98"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleStartPersonalizedRoadmap(true)}
                        className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-98"
                      >
                        Yes, Activate Path
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>
      ) : (

        /* ACTIVE TIMELINE JOURNEY BOARD */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Active Path Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm lg:col-span-3"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Active Journey</h3>
                  <p className="text-xs font-medium text-slate-500">{activePathTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviewReport}
                  className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Report
                </button>
                <button
                  onClick={() => setInWizardMode(true)}
                  className="px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 shadow-sm"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Switch Career Path
                </button>
              </div>
            </div>

            {isPathCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md border border-emerald-400/20 relative overflow-hidden"
              >
                <div className="absolute right-0 bottom-0 opacity-15 translate-x-4 translate-y-4">
                  <CheckCircle2 className="w-40 h-40 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shrink-0 animate-bounce">
                    🎓
                  </div>
                  <div>
                    <h4 className="text-base font-bold">Career Path Fully Mastered!</h4>
                    <p className="text-xs text-emerald-50 opacity-90 mt-1">
                      You have completed all milestones for <span className="font-bold underline">{activePathTitle}</span>. Your skill ledger is updated with the required credentials!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">Journey Progress</span>
                <span className={`text-xl font-bold ${isPathCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>{activePathProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activePathProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${isPathCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-blue-600'}`}
                />
              </div>

              {pathData && (pathData.difficulty_level || pathData.average_salary || pathData.missing_count !== undefined) && (
                <div className="flex flex-wrap gap-2 mb-4 mt-2">
                  {pathData.difficulty_level && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                      Difficulty: {pathData.difficulty_level}
                    </span>
                  )}
                  {pathData.average_salary && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md">
                      Avg Salary: {pathData.average_salary} LPA
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 flex-wrap">
                <TrendingUp className="w-3.5 h-3.5" />
                Est. completion: {estCompletion} • Target: {targetRole}
              </p>
            </div>

            {/* Acquired Skills and Missing Skills details */}
            {pathData && (
              <div className="mb-6 pt-4 border-t border-slate-100 space-y-4">
                {/* Journey Progress Bar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-transparent rounded-bl-full -z-10" />
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-500" /> Skill Acquisition Journey
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">As you complete milestones, skills will dynamically move here.</p>
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <span className="text-2xl font-black text-blue-600">
                        {Array.isArray(pathData.matched_skills) ? pathData.matched_skills.length : 0}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        / {(Array.isArray(pathData.matched_skills) ? pathData.matched_skills.length : 0) + (Array.isArray(pathData.missing_skills) ? pathData.missing_skills.length : 0)} Skills
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${((Array.isArray(pathData.matched_skills) ? pathData.matched_skills.length : 0) / Math.max(1, (Array.isArray(pathData.matched_skills) ? pathData.matched_skills.length : 0) + (Array.isArray(pathData.missing_skills) ? pathData.missing_skills.length : 0))) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', transform: 'skewX(-20deg)', animation: 'shimmer 2s infinite' }}></div>
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Acquired Skills */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        Your Acquired Skills
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                        {Array.isArray(pathData.matched_skills) ? pathData.matched_skills.length : 0} Mastered
                      </span>
                    </div>

                    {Array.isArray(pathData.matched_skills) && pathData.matched_skills.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence>
                          {pathData.matched_skills.map((matched: any) => {
                            const skillName = matched.skill || matched.name || "";
                            const skillLevel = matched.current_level || matched.level || "Beginner";
                            return (
                              <motion.div
                                layout
                                layoutId={`skill-chip-${skillName}`}
                                key={skillName}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-colors shadow-sm cursor-default"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"></div>
                                  <span className="text-xs font-bold text-slate-700">{skillName}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider">{skillLevel}</span>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed h-[150px]">
                        <Compass className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs font-medium text-slate-400">No acquired skills documented yet</p>
                      </div>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100/40 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                          <Target className="w-4 h-4" />
                        </div>
                        Skills to Acquire
                      </h4>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-wider">
                        {Array.isArray(pathData.missing_skills) ? pathData.missing_skills.length : 0} Left
                      </span>
                    </div>

                    {Array.isArray(pathData.missing_skills) && pathData.missing_skills.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence>
                          {pathData.missing_skills.map((missing: any) => {
                            const skillName = missing.skill || missing.name || "";
                            const skillLevel = missing.required_level || missing.level || "Beginner";
                            return (
                              <motion.div
                                layout
                                layoutId={`skill-chip-${skillName}`}
                                key={skillName}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl transition-colors shadow-sm cursor-default"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.6)]"></div>
                                  <span className="text-xs font-bold text-slate-700">{skillName}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider">{skillLevel}</span>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed h-[150px]">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                          <Check className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-emerald-600">All skills matched! You are fully qualified.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline milestone items */}
            <div className="relative pl-3 space-y-6 pt-4 border-t border-slate-100">
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-100 rounded-full z-0"></div>

              {roadmap.map((step: any, idx: number) => {
                const isCompleted = step.status === 'Completed' || step.status === 'completed';
                const isActive = step.status === 'In Progress' || step.status === 'active';

                const totalPoints = step.points ? step.points.length : 0;
                const completedPoints = step.points ? step.points.filter((p: any) => p.status === 'Completed').length : 0;
                const isCollapsedByDefault = isCompleted || (completedPoints === totalPoints && totalPoints > 0);
                const isCurrentlyCollapsed = collapsedChecklists[step.name] !== undefined
                  ? collapsedChecklists[step.name]
                  : isCollapsedByDefault;

                // Check if user already possesses the milestone skill
                const hasAcquiredSkill = step.skill && studentSkills.some(s => s.skill.toLowerCase() === step.skill.toLowerCase());
                const showRevisionPrompt = isActive && hasAcquiredSkill && !revisedMilestones[step.name];

                return (
                  <div key={idx} className={`relative z-10 flex gap-4 ${!isActive && !isCompleted ? 'opacity-65' : ''}`}>
                    <div className="flex-shrink-0 mt-1.5 relative z-10 bg-white">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isActive ? (
                        <div className="w-5 h-5 flex items-center justify-center">
                          <span className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-50 animate-pulse"></span>
                        </div>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-300 ml-0.5" />
                      )}
                    </div>

                    <div className="flex-1 pb-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-bold ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                            {step.title}
                          </h4>
                          {step.is_mandatory === 1 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 rounded">
                              Mandatory
                            </span>
                          )}
                          {step.milestone_type && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded uppercase font-mono">
                              {step.milestone_type}
                            </span>
                          )}
                          {totalPoints > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded">
                              {completedPoints}/{totalPoints} Tasks
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{step.date}</span>
                      </div>

                      {/* Display revision skip prompt if they already know the skill */}
                      {showRevisionPrompt ? (
                        <div className="mt-3 bg-amber-50 border border-amber-200/80 rounded-xl p-4 shadow-sm animate-fade-in">
                          <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-bold text-amber-800">Skill already in your Profile!</h5>
                              <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                                You already have the skill <strong className="font-bold">{step.skill}</strong> in your ledger. Would you like to revise this milestone, or skip it?
                              </p>
                              <div className="flex gap-2.5 mt-3">
                                <button
                                  onClick={() => setRevisedMilestones({ ...revisedMilestones, [step.name]: true })}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-md transition-colors flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Yes, Revise
                                </button>
                                <button
                                  onClick={() => handleCompleteMilestone(step.name)}
                                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <SkipForward className="w-3 h-3" />
                                  No, Skip & Complete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs font-medium text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/60">
                            <div>
                              <span className="font-bold text-slate-400">Skill: </span>
                              <span className="text-slate-700">{step.skill} ({step.required_skill_level})</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400">Category: </span>
                              <span className="text-slate-700">{step.category}</span>
                            </div>
                            {step.objective && (
                              <div className="col-span-1 md:col-span-2">
                                <span className="font-bold text-slate-400">Objective: </span>
                                <span className="text-slate-700">{step.objective}</span>
                              </div>
                            )}
                            {step.project && (
                              <div className="col-span-1 md:col-span-2">
                                <span className="font-bold text-slate-400">Practical Project: </span>
                                <span className="text-emerald-700 font-semibold">{step.project}</span>
                              </div>
                            )}
                            {step.linked_resource && (
                              <div className="col-span-1 md:col-span-2">
                                <span className="font-bold text-slate-400">Resource: </span>
                                <span className="text-blue-700 font-semibold">{step.linked_resource}{step.linked_resource_type ? ` (${step.linked_resource_type})` : ""}</span>
                              </div>
                            )}
                            {!step.linked_resource && step.linked_resource_type && (
                              <div className="col-span-1 md:col-span-2">
                                <span className="font-bold text-slate-400">Resource Type: </span>
                                <span className="text-slate-700">{step.linked_resource_type}</span>
                              </div>
                            )}
                          </div>

                          {/* Milestone Checklist Sub-Tasks */}
                          {totalPoints > 0 && (
                            <div className="mt-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                              <button
                                onClick={() => {
                                  setCollapsedChecklists(prev => ({
                                    ...prev,
                                    [step.name]: !isCurrentlyCollapsed
                                  }));
                                }}
                                className="w-full flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono hover:text-slate-900 transition-colors focus:outline-none select-none"
                              >
                                <span className="flex items-center gap-1.5">
                                  📋 Checklist Tasks ({completedPoints}/{totalPoints})
                                  {!(isActive || isCompleted) && <Lock className="w-3 h-3 text-slate-400" />}
                                </span>
                                {isCurrentlyCollapsed ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                              </button>

                              {!isCurrentlyCollapsed && (
                                <div className="space-y-2 mt-3 animate-fade-in">
                                  {step.points.map((pt: any, ptIdx: number) => {
                                    const ptCompleted = pt.status === "Completed";
                                    const isPtClickable = isActive || isCompleted;
                                    return (
                                      <div
                                        key={ptIdx}
                                        onClick={() => {
                                          if (isPtClickable) {
                                            handleTogglePoint(step.title, pt.point_title, pt.status);
                                          } else {
                                            showToast("This milestone is locked. Please complete the current active milestone first.", "warning");
                                          }
                                        }}
                                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-200 ${ptCompleted
                                          ? "bg-emerald-50/40 border-emerald-100/60 text-emerald-800"
                                          : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-300"
                                          } ${isPtClickable ? "cursor-pointer active:scale-[0.99] hover:bg-slate-50/50" : "cursor-not-allowed opacity-75"}`}
                                      >
                                        <div className="mt-0.5">
                                          {ptCompleted ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                          ) : !isPtClickable ? (
                                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                                          )}
                                        </div>
                                        <span className={`text-xs font-semibold ${ptCompleted ? "line-through opacity-60" : ""}`}>
                                          {pt.point_title}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Complete Milestone Action Button */}
                          {isActive && (
                            <div className="mt-3 flex justify-end">
                              {step.skill ? (
                                totalPoints > 0 && completedPoints < totalPoints ? (
                                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50 flex items-center gap-1.5 font-mono">
                                    🤖 Complete checklist tasks to unlock Skill Assessment
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleStartAssessment(step.skill, step.required_skill_level, step.name)}
                                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    Attempt Skill Assessment
                                  </button>
                                )
                              ) : (
                                totalPoints > 0 && completedPoints < totalPoints ? (
                                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50 flex items-center gap-1.5 font-mono">
                                    🤖 Complete checklist to finish milestone
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCompleteMilestone(step.name)}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Mark Completed
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>


          {/* Alternate Paths side lists - Hidden temporarily as requested */}
          {false && (
            <div className="space-y-6 lg:col-span-1">

              {/* AI Suggestion */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🤖</span>
                  <h3 className="text-sm font-bold text-slate-800">AI Path Suggestions</h3>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 text-white hover:shadow-lg transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-colors"></div>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed mb-4 relative z-10">
                    Based on your skill gap profile, add <span className="text-white font-bold">Deep Learning</span> next — it will boost your ML career readiness score by ~30%.
                  </p>
                  <div className="flex items-center gap-3 relative z-10">
                    <button className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1">
                      Accept
                    </button>
                    <button onClick={() => setInWizardMode(true)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition-colors">
                      Explore Paths
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Alternate Paths list */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-800">Other Career Paths</h3>
                </div>

                <div className="space-y-4">
                  {alternatePaths.map((path: any, idx: number) => (
                    <div key={`${path.title}-${idx}`} className="group cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{path.title}</h4>
                          {path.targetRole && (
                            <p className="text-xs text-slate-500 mt-0.5">Target: {path.targetRole}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-blue-600">
                            {path.fitScore}%
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">Fit Score</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 my-2">
                        {path.difficulty && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded border border-slate-200/40">
                            {path.difficulty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        {activePathTitle?.toLowerCase() === path.title?.toLowerCase() ? (
                          <span className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default">
                            Active
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnrollPath(path.title, "Standard");
                              }}
                              disabled={enrollingPath !== null}
                              className="px-3 py-1.5 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/60 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {enrollingPath === path.title ? (
                                <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                              ) : null}
                              <span>Standard Setup</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnrollPath(path.title, "AI");
                              }}
                              disabled={enrollingPath !== null}
                              className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-95 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {enrollingPath === path.title ? (
                                <Loader2 className="w-3 h-3 animate-spin text-white" />
                              ) : (
                                <span className="text-[11px]">🤖</span>
                              )}
                              <span>Generate AI Roadmap</span>
                            </button>
                          </>
                        )}
                      </div>
                      <div className="w-full h-[1px] bg-slate-100 mt-4 group-last:hidden"></div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          )}
        </div>
      )}

      {/* Skill Verification Test Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isTestModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            >
              
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/50">
                      {testResult ? (
                        <ShieldCheck className="w-6 h-6 text-white" />
                      ) : (
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        {testResult ? "Verification Result" : "Skill Verification Test"}
                      </h2>
                      <p className="text-sm text-slate-500 font-semibold">
                        {testSkill} • Level: {testLevel}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTestModalOpen(false)}
                    disabled={isSubmittingTest}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {isEvaluating ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                      <span className="text-sm font-semibold tracking-wider uppercase text-slate-700">{evaluationStatus}</span>
                      <span className="text-xs text-slate-400 italic">This usually takes around 5-10 seconds...</span>
                    </div>
                  ) : !testResult ? (
                    // Question View
                    <div className="space-y-6">
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-orange-500 h-full transition-all duration-300"
                          style={{
                            width: `${((currentQuestionIndex + 1) / (testQuestions.length || 1)) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                        <span>Progress</span>
                        <span>Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                      </div>

                      {/* Question Card */}
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-100 text-orange-600 uppercase tracking-widest mb-3 font-mono">
                          {testQuestions[currentQuestionIndex]?.difficulty || "Medium"}
                        </span>
                        <h3 className="text-base font-bold text-slate-800 leading-snug">
                          {testQuestions[currentQuestionIndex]?.question}
                        </h3>
                      </div>

                      {/* Options List / Text Box */}
                      {testQuestions[currentQuestionIndex]?.type === "mcq" ? (
                        <div className="space-y-3">
                          {testQuestions[currentQuestionIndex]?.options?.map((option: string, oIdx: number) => {
                            const isSelected = userAnswers[currentQuestionIndex] === option;
                            return (
                              <div
                                key={oIdx}
                                onClick={() => {
                                  setUserAnswers(prev => ({
                                    ...prev,
                                    [currentQuestionIndex]: option
                                  }));
                                }}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${isSelected
                                  ? "border-orange-500 bg-orange-50/30 text-orange-950 font-bold shadow-md shadow-orange-500/5"
                                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300"
                                  }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="text-sm font-semibold leading-tight">{option}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={userAnswers[currentQuestionIndex] || ""}
                            onChange={(e) => {
                              setUserAnswers(prev => ({
                                ...prev,
                                [currentQuestionIndex]: e.target.value
                              }));
                            }}
                            placeholder="Type your answer here..."
                            rows={6}
                            className="w-full px-4 py-3.5 rounded-[1.5rem] border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold text-sm text-slate-900 resize-none outline-none min-h-[150px]"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // Result Scorecard View
                    <div className="space-y-6">
                      {/* Circle Score & Status */}
                      <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="relative flex items-center justify-center">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-slate-200"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className={testResult.passed ? "stroke-emerald-500" : "stroke-rose-500"}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray="251.2"
                              strokeDashoffset={251.2 - (251.2 * (testResult.score || 0)) / 100}
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-slate-800">{testResult.score}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Score</span>
                          </div>
                        </div>

                        <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${testResult.passed
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}>
                          {testResult.passed ? "Verification Passed" : "Verification Failed"}
                        </div>

                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          Correct Answers: <span className="font-bold text-slate-800">{testResult.total_correct}</span> / {testResult.total_questions}
                        </p>
                      </div>

                      {/* Summary feedback */}
                      {testResult.feedback?.summary && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 font-mono">AI Assessment Summary</h4>
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-sm font-semibold text-slate-700 leading-relaxed">
                            {testResult.feedback.summary}
                          </div>
                        </div>
                      )}

                      {/* Strengths & Gaps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testResult.feedback?.strengths && testResult.feedback.strengths.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-emerald-600 font-mono">Strengths</h4>
                            <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 space-y-2">
                              {testResult.feedback.strengths.map((str: string, sIdx: number) => (
                                <div key={sIdx} className="flex gap-2 text-xs font-semibold text-slate-700 leading-tight">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{str}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {testResult.feedback?.gaps && testResult.feedback.gaps.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-amber-600 font-mono font-bold">Areas to Improve</h4>
                            <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50 space-y-2">
                              {testResult.feedback.gaps.map((gap: string, gIdx: number) => (
                                <div key={gIdx} className="flex gap-2 text-xs font-semibold text-slate-700 leading-tight">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{gap}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Next Steps */}
                      {testResult.feedback?.next_step && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-blue-600 font-mono">Recommended Next Steps</h4>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                              {testResult.feedback.next_step}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Breakdown section */}
                      {testResult.breakdown && testResult.breakdown.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 font-mono">Question Breakdown</h4>
                          <div className="space-y-3">
                            {testResult.breakdown.map((item: any, bIdx: number) => (
                              <div key={bIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-widest font-mono">
                                    Question {item.index || bIdx + 1}
                                  </span>
                                  <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest font-mono ${item.is_correct
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                    }`}>
                                    {item.is_correct ? "Correct" : "Incorrect"} ({item.answer_score || 0} pts)
                                  </span>
                                </div>
                                <h5 className="text-sm font-bold text-slate-800 leading-snug">
                                  {item.question}
                                </h5>
                                <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700">
                                  <span className="font-bold block text-slate-400 text-[10px] uppercase tracking-widest mb-1 font-mono">Your Answer</span>
                                  {item.selected_answer || <span className="italic text-slate-400">Empty</span>}
                                </div>
                                {item.evaluation_comment && (
                                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/30 text-xs text-slate-700 leading-relaxed">
                                    <span className="font-bold block text-blue-500 text-[10px] uppercase tracking-widest mb-1 font-mono">AI Evaluation</span>
                                    {item.evaluation_comment}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  {isEvaluating ? (
                    <div className="w-full flex justify-end">
                      <button
                        disabled
                        className="px-8 h-12 rounded-xl text-sm font-bold bg-orange-500/50 text-white flex items-center gap-2 cursor-not-allowed"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Evaluating...
                      </button>
                    </div>
                  ) : !testResult ? (
                    <>
                      <button
                        onClick={() => {
                          if (currentQuestionIndex > 0) {
                            setCurrentQuestionIndex(prev => prev - 1);
                          } else {
                            setIsTestModalOpen(false);
                          }
                        }}
                        className="px-6 h-12 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                      >
                        {currentQuestionIndex > 0 ? "Back" : "Cancel"}
                      </button>

                      {currentQuestionIndex < testQuestions.length - 1 ? (
                        <button
                          onClick={() => {
                            if (!userAnswers[currentQuestionIndex]) {
                              showToast("Please select/type an answer to proceed", "warning");
                              return;
                            }
                            setCurrentQuestionIndex(prev => prev + 1);
                          }}
                          className="px-8 h-12 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/10 flex items-center gap-2 active:scale-95"
                        >
                          Next Question
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitTest}
                          disabled={isSubmittingTest}
                          className="px-8 h-12 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                          {isSubmittingTest ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Submit Assessment
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full flex justify-end">
                      <button
                        onClick={() => setIsTestModalOpen(false)}
                        className="px-8 h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                      >
                        Close Result
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Skill Acquisition Celebration Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showCelebration && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
              
              <ConfettiEffect />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col items-center"
              >
                <button
                  onClick={() => setShowCelebration(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 mb-6 overflow-hidden"
                >
                  <Award className="w-10 h-10" />
                </motion.div>

                <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500 mb-2">
                  New Milestone Achieved!
                </span>
                <h3 className="text-xl font-black text-slate-800 text-center mb-1">
                  Congrats! You have acquired the skill
                </h3>
                <p className="text-xs font-semibold text-slate-500 mb-4">
                  Skill Verified Successfully
                </p>

                <div className="text-sm font-semibold text-slate-700 text-center bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 w-full">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Acquired Skill
                  </div>
                  <div className="text-base font-bold text-slate-800">
                    {acquiredSkillName}
                  </div>
                  {acquiredSkillLevel && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
                      {acquiredSkillLevel}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowCelebration(false)}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold h-12 rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  Awesome! Continue Journey
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* PDF Report Preview Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showReportPreview && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 leading-tight">Career Path Report</h3>
                      <p className="text-xs font-medium text-slate-500">Detailed breakdown of your customized journey</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {reportBlobUrl && (
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = reportBlobUrl;
                          link.download = `Career_Path_Report.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    )}
                    <button
                      onClick={() => setShowReportPreview(false)}
                      className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center transition-colors active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-slate-50/50 relative">
                  {isReportLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                      <h4 className="text-sm font-bold text-slate-700">Generating Your Report...</h4>
                      <p className="text-xs text-slate-500 mt-1">This might take a moment.</p>
                    </div>
                  )}

                  {reportError && !isReportLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20 p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-2">Failed to load report</h4>
                      <p className="text-sm text-red-600 max-w-md font-medium">{reportError}</p>
                      <button
                        onClick={handlePreviewReport}
                        className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors active:scale-95"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {reportBlobUrl && !isReportLoading && (
                    <iframe
                      src={`${reportBlobUrl}#toolbar=0&navpanes=0&view=FitH`}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                    />
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
