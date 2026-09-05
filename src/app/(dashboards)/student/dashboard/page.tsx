"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import StudentBannerWidget from "@/components/dashboards/widgets/RoleBannerWidget";
import HorizontalTabs from "@/components/dashboards/shared/HorizontalTabs";
import StatsWidget from "@/components/dashboards/widgets/StatsWidget";
import LearningActivityGraph from "@/components/dashboards/widgets/LearningActivityGraph";
import CoachWidget from "@/components/dashboards/widgets/CoachWidget";
import SkillsWidget from "@/components/dashboards/widgets/SkillsWidget";
import AlertsWidget from "@/components/dashboards/widgets/AlertsWidget";
import InternshipsWidget from "@/components/dashboards/widgets/InternshipsWidget";
import { useAuth } from "@/context/AuthContext";
import { getDashboardStats, getStudentByEmail, getStudentInternshipList, getLearningActivity, getTodaysOpportunityAlerts } from "@/services/student.services";
import SuccessStoriesFooter from "@/components/dashboards/student/SuccessStoriesFooter";
import StudentGuidelineTour from "@/components/dashboards/student/StudentGuidelineTour";
import PsychometricTestModal from "@/components/PsychometricTestModal";
import { psychometricApi } from "@/services/psychometricApi";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
};

export default function StudentDashboardPage() {
  const { currentUser, isInitialized } = useAuth();

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
  const [internshipsData, setInternshipsData] = useState<any[]>([]);
  const [learningActivityData, setLearningActivityData] = useState<any>(null);
  const [opportunityAlerts, setOpportunityAlerts] = useState<{
    newPostings: any[];
    deadlineAlerts: any[];
  }>({ newPostings: [], deadlineAlerts: [] });
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitialized) return;
    const emailToCheck = currentUser || (typeof window !== "undefined" ? localStorage.getItem("currentUser") : null);
    if (!emailToCheck) {
      setShowTestModal(false);
      return;
    }

    const checkOnboarding = async () => {
      try {
        const res = await psychometricApi.checkOnboardingStatus(emailToCheck);
        if (res.is_first_login && !res.is_onboarded) {
          setShowTestModal(true);
        } else {
          setShowTestModal(false);
        }
      } catch (err) {
        console.error("Failed to check student onboarding status", err);
      }
    };
    checkOnboarding();
  }, [currentUser, isInitialized]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats(currentUser);
        console.log("Student stats API response:", res);
        const data = res?.data || res?.message;
        if (data) {
          setStatsData(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("studentStats", JSON.stringify(data));
            window.dispatchEvent(new Event("student-stats-updated"));
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchLearningActivity = async () => {
      try {
        const res = await getLearningActivity(currentUser);
        console.log("Student learning activity API response:", res);
        const data = res?.data || res?.message;
        if (data) {
          setLearningActivityData(data);
        }
      } catch (error) {
        console.error("Error fetching learning activity:", error);
      }
    };
    fetchLearningActivity();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchAlerts = async () => {
      try {
        const res = await getTodaysOpportunityAlerts(currentUser);
        console.log("Student opportunity alerts response:", res);
        const data = res?.data || res?.message;

        if (data) {
          setOpportunityAlerts({
            newPostings: data.new_postings || [],
            deadlineAlerts: data.deadline_alerts || []
          });
        } else {
          setOpportunityAlerts({ newPostings: [], deadlineAlerts: [] });
        }
      } catch (error) {
        console.error("Error fetching opportunity alerts:", error);
      }
    };
    fetchAlerts();
  }, [currentUser]);

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
    if (!currentUser) return;
    const fetchInternships = async () => {
      try {
        let course = null;
        let department = null;
        let academicYear = null;
        try {
          const studentRes = await getStudentByEmail(currentUser);
          const profile = studentRes?.message?.data || studentRes?.data || {};
          course = profile.course || null;
          department = profile.department || null;
          academicYear = profile.current_year || profile.academic_year || null;
        } catch (err) {
          console.error("Error fetching student profile for dashboard internships:", err);
        }

        const res = await getStudentInternshipList(currentUser, course, department, academicYear);
        const dataContainer = (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) ? res : (res?.message && typeof res.message === 'object' ? res.message : res);
        const internshipData = dataContainer?.data?.internships || dataContainer?.internships || [];

        // Match mapping function
        const mapped = internshipData.slice(0, 3).map((item: any, index: number) => {
          const matches = [91, 84, 76];
          const match = matches[index % matches.length];

          let ringColor = "border-emerald-500";
          let matchColor = "text-emerald-600";
          let bgColor = "bg-emerald-50";

          if (match < 80) {
            ringColor = "border-orange-500";
            matchColor = "text-orange-600";
            bgColor = "bg-orange-50";
          } else if (match < 90) {
            ringColor = "border-sky-500";
            matchColor = "text-sky-600";
            bgColor = "bg-sky-50";
          }

          let stipendStr = "Unpaid";
          if (item.stipend) {
            const amount = Number(item.stipend);
            if (amount >= 1000) {
              stipendStr = `₹${(amount / 1000).toFixed(0)}k/mo`;
            } else {
              stipendStr = `₹${amount}/mo`;
            }
          }

          let durationStr = "N/A";
          if (item.duration) {
            const days = Number(item.duration);
            if (days >= 30) {
              durationStr = `${Math.round(days / 30)} mo`;
            } else {
              durationStr = `${days} days`;
            }
          }

          return {
            role: item.title || "Internship Role",
            company: item.industry || "Company Name",
            match,
            location: item.location || "Remote",
            duration: durationStr,
            stipend: stipendStr,
            matchColor,
            ringColor,
            bgColor
          };
        });

        setInternshipsData(mapped);
      } catch (error) {
        console.error("Error fetching matching internships:", error);
      }
    };
    fetchInternships();
  }, [currentUser]);



  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsWidget
            title="Employability Score"
            data={{
              value: statsData?.employability_score !== undefined ? statsData.employability_score : 73,
              max: 100,
              change: 8,
              changeLabel: "this month"
            }}
          />
          <StatsWidget
            title="Profile Completeness"
            data={{
              value: statsData?.profile_completeness !== undefined ? `${statsData.profile_completeness}%` : "78%",
              change: 12,
              changeLabel: "this week"
            }}
          />
          <StatsWidget
            title="Total Skills"
            data={{
              value: statsData?.total_skills !== undefined ? statsData.total_skills : 3
            }}
          />
          <StatsWidget
            title="CGPA"
            data={{
              value: statsData?.cgpa !== undefined ? statsData.cgpa : 0,
              change: statsData?.backlog !== undefined ? statsData.backlog : 0,
              changeLabel: "Backlogs",
              trend: statsData?.backlog > 0 ? "down" : "up"
            }}
          />
        </motion.div>

        {/* Main Content Grid */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column (3/3 width since AI Coach is hidden) */}
          <div className="lg:col-span-3">
            {/* Learning Activity Heatmap */}
            <div className="h-full">
              <LearningActivityGraph data={learningActivityData} />
            </div>
          </div>

          {/* Right Column (1/3 width) - Hidden for now as requested */}
          {/* <div>
          <div className="h-full">
            <CoachWidget
              data={{
                message: "Great SQL progress! 🚀 You are top 15% in your cohort. Start your ML module next — 3 resources picked for your style.",
                task: "Sklearn Ch.2 (45 min) + solve 2 classification problems."
              }}
            />
          </div>
        </div> */}
        </motion.div>

        {/* Bottom Row */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SkillsWidget />

          <AlertsWidget data={opportunityAlerts} />
        </motion.div>

        {/* Internships Row */}
        <motion.div variants={item}>
          <InternshipsWidget data={internshipsData.length > 0 ? internshipsData : undefined} />
        </motion.div>

        {/* Success Stories Footer */}
        <motion.div variants={item}>
          <SuccessStoriesFooter />
        </motion.div>
      </motion.div>
      {currentUser && <StudentGuidelineTour studentEmail={currentUser!} />}
      <PsychometricTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        onCompleted={() => setShowTestModal(false)}
        studentEmail={currentUser || undefined}
      />
    </>
  );
}
