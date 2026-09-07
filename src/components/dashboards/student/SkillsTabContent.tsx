// components/dashboards/student/SkillsTabContent.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ShieldCheck, Award, FileText, Lock, Star, Loader2, Clock, Globe } from "lucide-react";
import { StatsCard } from "@/components/dashboards/shared/StatsCard";
import { SkillRadar } from "@/components/dashboards/shared/RadarChart";
import { SummaryList } from "@/components/dashboards/shared/SummaryList";
import { CircularScore } from "@/components/dashboards/shared/CircularScore";
import { getSkillLedger, createStudentSkill, addSkillEvidence, getSkillTestQuestions, submitSkillTest } from "@/services/student.services";
import { getSkillScore } from "@/services/api.services";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ChevronRight, AlertCircle, Sparkles, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardDynamicModal, { DynamicField } from "@/components/dashboards/shared/DashboardDynamicModal";
import { useToast } from "@/context/ToastContext";

// Types
interface RadarData {
  subject: string;
  value: number;
  fullMark: number;
}

interface SkillRow {
  id: string;
  name: string;
  category: string;
  categoryType: "Technical" | "Cognitive" | "Soft Skill";
  level: string;
  levelType: "Advanced" | "Intermediate" | "Beginner";
  evidence: number;
  endorsements: number;
  aiVerified: boolean;
  lastDemo: string;
}


const getCategoryStyle = (category: string) => {
  const styles: Record<string, string> = {
    Technical: "bg-blue-50 text-blue-600 border-blue-100",
    Cognitive: "bg-purple-50 text-purple-600 border-purple-100",
    "Soft Skill": "bg-emerald-50 text-emerald-600 border-emerald-100"
  };
  return styles[category] || "bg-slate-50 text-slate-600 border-slate-100";
};

const getLevelStyle = (level: string, type: string) => {
  if (type === 'Advanced') return "text-orange-500 font-medium text-xs";
  if (type === 'Intermediate') return "text-blue-500 font-medium text-xs";
  return "text-slate-500 font-medium text-xs";
};

export default function SkillsTabContent() {
  const [ledgerItems, setLedgerItems] = useState<any[]>([]);
  const [skillRows, setSkillRows] = useState<SkillRow[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillRow | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skill Verification States
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [showTestIntro, setShowTestIntro] = useState(true);
  const [testSessionId, setTestSessionId] = useState<string>("");
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [testSkill, setTestSkill] = useState<string>("");
  const [testLevel, setTestLevel] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Map skillRows to Radar data
  const radarData = useMemo(() => {
    const mapped = (skillRows || []).slice(0, 6).map(s => {
      let val = 40;
      if (s.level === 'Advanced') val = 90;
      else if (s.level === 'Intermediate') val = 65;
      else val = 40;
      return {
        subject: s.name.length > 8 ? s.name.slice(0, 8) + '..' : s.name,
        value: val,
        fullMark: 100
      };
    });

    // Ensure at least 3 subjects for proper radar rendering
    while (mapped.length < 3) {
      mapped.push({
        subject: `Skill ${mapped.length + 1}`,
        value: 0,
        fullMark: 100
      });
    }

    return mapped;
  }, [skillRows]);

  useEffect(() => {
    fetchSkillStats();
  }, []);

  const fetchSkillStats = async () => {
    try {
      setLoading(true);
      const studentEmail = localStorage.getItem("currentUser") || "";

      const [ledgerRes, scoreRes] = await Promise.all([
        getSkillLedger(studentEmail),
        getSkillScore({ student: studentEmail })
      ]);

      if (ledgerRes?.message) {
        const summary = ledgerRes.message.summary || {};
        const ledger = [
          { label: 'Total Skills', value: summary.total_skills || 0, icon: <span>🎯</span>, bgColor: 'bg-red-50', textColor: 'text-red-500' },
          { label: 'AI Verified', value: summary.ai_verified || 0, icon: <span>🤖</span>, bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
          { label: 'Mentor Endorsed', value: summary.mentor_endorsed || 0, icon: <Award className="w-3 h-3" />, bgColor: 'bg-amber-50', textColor: 'text-amber-500' },
          { label: 'Industry Endorsed', value: summary.industry_endorsed || 0, icon: <span>🏭</span>, bgColor: 'bg-purple-50', textColor: 'text-purple-500' },
          { label: 'Evidence Items', value: summary.evidence_items || 0, icon: <FileText className="w-3 h-3" />, bgColor: 'bg-slate-100', textColor: 'text-slate-500' },
        ];
        setLedgerItems(ledger);

        // Map skills to table rows
        if (ledgerRes.message.skills && Array.isArray(ledgerRes.message.skills)) {
          const mappedRows: SkillRow[] = ledgerRes.message.skills.map((s: any, idx: number) => ({
            id: s.name || `skill-${idx}`,
            name: s.skill || s.skill_name || "Untitled Skill",
            category: s.skill_category || "Technical",
            categoryType: (s.skill_category as any) || "Technical",
            level: s.current_level || "Beginner",
            levelType: (s.current_level as any) || "Beginner",
            evidence: s.evidence_count || 0,
            endorsements: s.endorsement_count || 0,
            aiVerified: !!s.ai_verified,
            lastDemo: s.last_demo || "-"
          }));
          setSkillRows(mappedRows);
        }
      }

      if (scoreRes?.message) {
        setOverallScore(scoreRes?.message || 0);
      }
    } catch (err) {
      console.error("Error fetching skill stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySkillDirect = async (skillName: string, level: string) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const studentEmail = localStorage.getItem("currentUser") || "";
      if (!studentEmail) {
        showToast("Session expired, please login again", "error");
        return;
      }

      const response = await getSkillTestQuestions(studentEmail, skillName, level);
      const data = response?.message || response?.data || response;

      if (data && data.questions && data.questions.length > 0) {
        setTestQuestions(data.questions);
        setTestSessionId(data.session_id);
        setTestSkill(skillName);
        setTestLevel(level);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setTestResult(null);
        setShowTestIntro(true);

        // Close Add New Skill modal if open
        setIsModalOpen(false);
        // Open Test modal
        setIsTestModalOpen(true);
        showToast("Skill test questions loaded successfully!", "success");
      } else {
        showToast("No test questions available for this skill and level.", "error");
      }
    } catch (err: any) {
      console.error("Error fetching skill questions:", err);
      showToast(err?.message || "Failed to load skill test questions", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSkill = async (formData: any) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const studentEmail = localStorage.getItem("currentUser") || "";
      if (!studentEmail) {
        showToast("Session expired, please login again", "error");
        return;
      }

      // Fetch questions from getSkillTestQuestions
      const response = await getSkillTestQuestions(studentEmail, formData.skill, formData.current_level);
      const data = response?.message || response?.data || response;

      if (data && data.questions && data.questions.length > 0) {
        setTestQuestions(data.questions);
        setTestSessionId(data.session_id);
        setTestSkill(formData.skill);
        setTestLevel(formData.current_level);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setTestResult(null);
        setShowTestIntro(true);

        // Close Add New Skill modal
        setIsModalOpen(false);
        // Open Test modal
        setIsTestModalOpen(true);
        showToast("Skill test questions loaded successfully!", "success");
      } else {
        showToast("No test questions available for this skill and level.", "error");
      }
    } catch (err: any) {
      console.error("Error fetching skill questions:", err);
      showToast(err?.message || "Failed to load skill test questions", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTest = async () => {
    if (isSubmittingTest) return;
    const unansweredCount = testQuestions.length - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      showToast(`Please answer all questions before submitting. (${unansweredCount} remaining)`, "warning");
      return;
    }

    try {
      setIsSubmittingTest(true);

      const studentEmail = localStorage.getItem("currentUser") || "";
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

      if (data) {
        setTestResult(data);
        showToast("Skill verification test submitted successfully!", "success");
        fetchSkillStats();
      } else {
        showToast("Failed to retrieve test result.", "error");
      }
    } catch (err: any) {
      console.error("Error submitting test:", err);
      showToast(err?.message || "Failed to submit skill test", "error");
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handleCloseTestModal = () => {
    setIsTestModalOpen(false);
    if (testResult && testResult.passed) {
      window.location.reload();
    }
  };

  const skillFields: DynamicField[] = [
    {
      name: "skill",
      label: "Skill Name",
      type: "select",
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Skill" },
      placeholder: "Select a skill",
      required: true
    },
    {
      name: "current_level",
      label: "Current Level",
      type: "select",
      options: ["Beginner", "Intermediate", "Advanced"],
      required: true
    }
  ];

  const evidenceFields: DynamicField[] = [
    { name: "evidence_type", label: "Evidence Type", type: "select", icon: FileText, options: ["Project", "Certification", "Work Experience", "Competition", "Other"], required: true },
    { name: "evidence_date", label: "Evidence Date", type: "date", icon: Clock, required: true, textTransform: "uppercase" },
    { name: "description", label: "Description", type: "textarea", icon: FileText, placeholder: "Built a full-stack web application using React and Frappe", required: true, colSpan: 2 },
    { name: "document_url", label: "Document URL", type: "url", icon: Globe, placeholder: "https://github.com/user/project", required: false, colSpan: 2 }
  ];

  const handleAddEvidence = async (formData: any) => {
    if (!selectedSkill) return;

    try {
      setIsSubmitting(true);
      const studentEmail = localStorage.getItem("currentUser") || "";

      const payload = {
        student_skill: `${studentEmail}-${selectedSkill.name.toLowerCase()}`,
        evidence_type: formData.evidence_type,
        evidence_date: formData.evidence_date,
        description: formData.description,
        reference_doctype: "",
        reference_name: "",
        document_url: formData.document_url || ""
      };

      const response = await addSkillEvidence(payload);

      const isSuccess = response && (
        response.status === 200 ||
        response.status === "200" ||
        response.message === "Evidence added successfully" ||
        (typeof response.message === 'string' && response.message.startsWith("SE-")) ||
        response.data
      );

      if (isSuccess) {
        showToast("Evidence added successfully!", "success");
        setIsEvidenceModalOpen(false);
        setSelectedSkill(null); // Close the skill details modal as well
        fetchSkillStats(); // Refresh ledger to see updated evidence count
      } else {
        showToast(response?.message || "Failed to add evidence", "error");
      }
    } catch (err: any) {
      console.error("Error adding evidence:", err);
      showToast(err?.message || "Something went wrong", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm font-medium italic tracking-widest uppercase opacity-70">Syncing Skill Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Skill Radar */}
        <StatsCard title="Skill Radar" className="overflow-hidden">
          <SkillRadar data={radarData} />
        </StatsCard>

        {/* Ledger Summary */}
        <StatsCard title="Ledger Summary">
          <SummaryList items={ledgerItems} footer={
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-5 h-5 flex items-center justify-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                Ledger Integrity
              </div>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified
              </span>
            </div>
          } />
        </StatsCard>

        {/* Overall Score */}
        <StatsCard title="Overall Score" className="flex flex-col items-center justify-center relative overflow-hidden group">
          <CircularScore score={overallScore} label="Overall" color="stroke-orange-500" />
          <p className="text-[11px] font-medium text-slate-500 mt-6 group-hover:text-slate-700 transition-colors">
            {overallScore > 70 ? 'Top 15% in cohort' : overallScore > 50 ? 'Above average profile' : 'Keep building your profile'}
          </p>
        </StatsCard>
      </div>

      {/* Full Skill Ledger Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[2rem] border border-slate-200/60 shadow-lg shadow-slate-200/40 overflow-hidden relative mt-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50/50 to-transparent rounded-bl-full -z-10 pointer-events-none" />
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" /> Full Skill Ledger
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Manage and track your verified proficiencies</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-10 px-5 rounded-xl text-xs font-bold gap-2 shadow-lg shadow-orange-500/30 active:scale-95 transition-all border border-orange-400"
          >
            <Plus className="w-4 h-4" />
            Add New Skill
          </Button>
        </div>
        <div className="p-4 pt-0 pb-6">
          <div className="overflow-x-auto overflow-y-auto max-h-[630px] custom-scrollbar rounded-2xl border border-slate-100/50 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm border-b border-slate-200">
                <tr>
                  {['Skill Details', 'Proficiency', 'Evidence & Endorsements', 'Verification', 'Last Demo'].map((header) => (
                    <th key={header} className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest first:pl-8 last:pr-8">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 bg-white">
              {skillRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16">
                    <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed py-10 w-full max-w-md mx-auto">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">No skills documented yet</p>
                      <p className="text-xs font-medium text-slate-400 text-center mt-1">Start building your profile by adding your first skill to the ledger.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                skillRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedSkill(row)}
                    className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/30 transition-all duration-300 group cursor-pointer relative"
                  >
                    <td className="py-5 px-6 first:pl-8 last:pr-8">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-2 group-hover:text-orange-600 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${row.categoryType === 'Technical' ? 'bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]' : row.categoryType === 'Soft Skill' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.5)]'} group-hover:scale-125 transition-transform duration-300`}></div>
                          {row.name}
                        </span>
                        <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase border shadow-sm ${getCategoryStyle(row.categoryType)}`}>
                          {row.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6 first:pl-8 last:pr-8">
                      <div className="flex flex-col gap-2">
                        <span className={`px-2.5 py-1 w-fit rounded-lg text-[10px] uppercase tracking-wider border shadow-sm ${
                          row.levelType === 'Advanced' ? 'bg-orange-50 text-orange-600 border-orange-200 font-black' :
                          row.levelType === 'Intermediate' ? 'bg-blue-50 text-blue-600 border-blue-200 font-bold' :
                          'bg-slate-50 text-slate-600 border-slate-200 font-semibold'
                        }`}>
                          {row.level}
                        </span>
                        {/* Mini visual gauge */}
                        <div className="flex gap-1.5 ml-1">
                          <div className={`w-3 h-1 rounded-full transition-colors duration-500 ${row.levelType ? (row.levelType === 'Advanced' ? 'bg-orange-500' : row.levelType === 'Intermediate' ? 'bg-blue-500' : 'bg-slate-400') : 'bg-slate-400'}`}></div>
                          <div className={`w-3 h-1 rounded-full transition-colors duration-500 delay-75 ${(row.levelType === 'Intermediate' || row.levelType === 'Advanced') ? (row.levelType === 'Advanced' ? 'bg-orange-500' : 'bg-blue-500') : 'bg-slate-200'}`}></div>
                          <div className={`w-3 h-1 rounded-full transition-colors duration-500 delay-150 ${row.levelType === 'Advanced' ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 first:pl-8 last:pr-8">
                      <div className="flex items-center gap-3">
                        {/* Gamified Evidence/Endorsements items */}
                        <div className="flex items-center gap-2 bg-gradient-to-br from-slate-50 to-white px-3 py-1.5 rounded-xl border border-slate-200 group-hover:border-slate-300 group-hover:shadow-md transition-all">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
                            <FileText className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-black text-slate-700">{row.evidence}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-br from-amber-50 to-orange-50/50 px-3 py-1.5 rounded-xl border border-amber-200 group-hover:border-amber-400 group-hover:shadow-md transition-all">
                          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          </div>
                          <span className="text-xs font-black text-amber-700">{row.endorsements}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 first:pl-8 last:pr-8">
                      {row.aiVerified ? (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-xl w-fit shadow-sm relative overflow-hidden group/badge hover:shadow-md transition-all cursor-default">
                          <div className="absolute inset-0 bg-white/40 w-full h-full -translate-x-full group-hover/badge:animate-[shimmer_1.5s_infinite] skew-x-12" />
                          <ShieldCheck className="w-4 h-4 text-emerald-600 relative z-10" />
                          <span className="text-[10px] uppercase tracking-wider font-black text-emerald-700 relative z-10">Verified</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifySkillDirect(row.name, row.level);
                          }}
                          className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white h-8 px-4 rounded-xl text-[10px] font-bold shadow-md shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-1.5 border border-slate-700"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Verify Now
                        </Button>
                      )}
                    </td>
                    <td className="py-5 px-6 first:pl-8 last:pr-8">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                        <Clock className="w-3.5 h-3.5 opacity-40" />
                        {row.lastDemo}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </motion.div>

      <DashboardDynamicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Skill"
        subtitle="Declare your proficiency in a new skill"
        headerIcon={Award}
        iconBgColor="bg-orange-500"
        fields={skillFields}
        onSubmit={handleCreateSkill}
        loading={isSubmitting}
        submitText="Verify Skills"
      />

      {/* Skill Info & Evidence Option Modal */}
      {selectedSkill && (
        <DashboardDynamicModal
          isOpen={!!selectedSkill && !isEvidenceModalOpen}
          onClose={() => setSelectedSkill(null)}
          title={selectedSkill.name}
          subtitle={`${selectedSkill.category} • ${selectedSkill.level}`}
          headerIcon={Award}
          iconBgColor={selectedSkill.categoryType === 'Technical' ? 'bg-blue-500' : selectedSkill.categoryType === 'Soft Skill' ? 'bg-emerald-500' : 'bg-purple-500'}
          fields={[]} // Read-only info view usually doesn't need input fields
          onSubmit={async () => {
            setIsEvidenceModalOpen(true);
          }}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evidence</p>
                <p className="text-xl font-bold text-slate-800">{selectedSkill.evidence} items</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Endorsements</p>
                <p className="text-xl font-bold text-slate-800">{selectedSkill.endorsements} points</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100/50">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Strengthen this skill</h4>
                <p className="text-xs text-slate-500">Add a project, certificate or experience as evidence.</p>
              </div>
            </div>

            <Button
              onClick={() => setIsEvidenceModalOpen(true)}
              className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
            >
              Add New Evidence
            </Button>
          </div>
        </DashboardDynamicModal>
      )}

      {/* Add Evidence Modal */}
      <DashboardDynamicModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title="Add Skill Evidence"
        subtitle={`Proving your proficiency in ${selectedSkill?.name}`}
        headerIcon={FileText}
        iconBgColor="bg-blue-600"
        fields={evidenceFields}
        onSubmit={handleAddEvidence}
        loading={isSubmitting}
      />

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
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
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
                    onClick={handleCloseTestModal}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {!testResult ? (
                    showTestIntro ? (
                      // Intro Screen
                      <div className="space-y-6">
                        {/* Premium Info Card */}
                        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-3xl p-6 border border-orange-100/70 relative overflow-hidden">
                          <div className="absolute right-0 bottom-0 opacity-[0.03] translate-x-4 translate-y-4">
                            <Sparkles className="w-48 h-48 text-orange-500" />
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white shrink-0">
                              <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold text-slate-800">Ready to verify your skill?</h3>
                              <p className="text-sm text-slate-600 font-medium">
                                This is a quick assessment to verify your proficiency in <span className="font-bold text-orange-600">{testSkill}</span> at the <span className="font-bold text-orange-600">{testLevel}</span> level.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* What to Expect */}
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-[11px]">
                              <FileText className="w-4 h-4 text-orange-500" /> What to expect
                            </h4>
                            <ul className="space-y-3 text-sm text-slate-600 font-medium">
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>{testQuestions.length} Questions focused on core concepts.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>Multiple Choice Questions (MCQs) to evaluate knowledge.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>No strict time limit, take your time to answer carefully.</span>
                              </li>
                            </ul>
                          </div>

                          {/* Passing Criteria & Rewards */}
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-[11px]">
                              <Award className="w-4 h-4 text-orange-500" /> Criteria & Badges
                            </h4>
                            <ul className="space-y-3 text-sm text-slate-600 font-medium">
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>Score <span className="font-bold text-slate-800">70% or higher</span> to pass the verification.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-emerald-600 mt-0.5">✓</span>
                                <span>Passing grants you the <span className="font-bold text-emerald-600">AI Verified Badge</span> 🤖 on your profile.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>If you fail, you can always practice and try again later. Your skill status remains unchanged.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Question View
                      <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-orange-500 h-full transition-all duration-300"
                            style={{
                              width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span>Progress</span>
                          <span>Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                        </div>

                        {/* Question Card */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-100 text-orange-600 uppercase tracking-widest mb-3">
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
                    )
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
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

                      {/* Retest Motivation Message */}
                      {!testResult.passed && (
                        <div className="p-5 bg-gradient-to-r from-amber-500/5 to-rose-500/5 rounded-3xl border border-amber-100/70 flex items-start gap-4 shadow-sm animate-fadeIn">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800">Don't give up! We believe in you.</h4>
                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                              Verification is designed to highlight areas of growth. Review the AI feedback and areas to improve below, continue practicing, and feel free to <span className="font-bold text-orange-600">retest this skill whenever you are ready</span>. Best of luck on your next try! 🚀
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Summary feedback */}
                      {testResult.feedback?.summary && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">AI Assessment Summary</h4>
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-sm font-semibold text-slate-700 leading-relaxed">
                            {testResult.feedback.summary}
                          </div>
                        </div>
                      )}

                      {/* Strengths & Gaps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testResult.feedback?.strengths && testResult.feedback.strengths.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-emerald-600">Strengths</h4>
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
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-amber-600">Areas to Improve</h4>
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
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-blue-600">Recommended Next Steps</h4>
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
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Question Breakdown</h4>
                          <div className="space-y-3">
                            {testResult.breakdown.map((item: any, bIdx: number) => (
                              <div key={bIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-widest">
                                    Question {item.index || bIdx + 1}
                                  </span>
                                  <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${item.is_correct
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
                                  <span className="font-bold block text-slate-400 text-[10px] uppercase tracking-widest mb-1">Your Answer</span>
                                  {item.selected_answer || <span className="italic text-slate-400">Empty</span>}
                                </div>
                                {item.evaluation_comment && (
                                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/30 text-xs text-slate-700 leading-relaxed">
                                    <span className="font-bold block text-blue-500 text-[10px] uppercase tracking-widest mb-1">AI Evaluation</span>
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
                  {!testResult ? (
                    showTestIntro ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleCloseTestModal}
                          className="px-6 h-12 rounded-xl text-sm font-bold border-slate-200 text-slate-600 hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => setShowTestIntro(false)}
                          className="px-8 h-12 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-xl shadow-orange-500/25 flex items-center gap-2"
                        >
                          Start Verification Test
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (currentQuestionIndex > 0) {
                              setCurrentQuestionIndex(prev => prev - 1);
                            } else {
                              setShowTestIntro(true);
                            }
                          }}
                          className="px-6 h-12 rounded-xl text-sm font-bold border-slate-200 text-slate-600 hover:bg-slate-200 transition-all"
                        >
                          {currentQuestionIndex > 0 ? "Back" : "Back to Instructions"}
                        </Button>

                        {currentQuestionIndex < testQuestions.length - 1 ? (
                          <Button
                            onClick={() => {
                              if (!userAnswers[currentQuestionIndex]) {
                                showToast("Please select an answer to proceed", "warning");
                                return;
                              }
                              setCurrentQuestionIndex(prev => prev + 1);
                            }}
                            className="px-8 h-12 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/10 flex items-center gap-2"
                          >
                            Next Question
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleSubmitTest}
                            disabled={isSubmittingTest}
                            className="px-8 h-12 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSubmittingTest ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Check className="w-5 h-5" />
                                Submit Test
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )
                  ) : (
                    <div className="w-full flex justify-end items-center gap-3">
                      <Button
                        onClick={handleCloseTestModal}
                        className="px-8 h-12 rounded-xl text-sm font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all border border-slate-200"
                      >
                        Close Result
                      </Button>
                      {!testResult.passed && (
                        <Button
                          onClick={() => handleVerifySkillDirect(testSkill, testLevel)}
                          disabled={isSubmitting}
                          className="px-8 h-12 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/15 flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              Retest Skill
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}