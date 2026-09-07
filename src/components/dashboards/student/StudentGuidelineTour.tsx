"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Play,
    Check,
    HelpCircle,
    HelpCircle as TourIcon,
    Compass
} from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { getStudentGuidelines, completeStudentGuidelineStep } from "@/services/student.services";
import { BASE_DOMAIN } from "@/services/api.services";

interface GuidelineStep {
    name: string;
    title: string;
    module: string;
    tab: string;
    step_no: number;
    description: string;
    video_url: string | null;
    image: string | null;
    is_mandatory: number;
    status: "Pending" | "Completed";
}

interface StudentGuidelineTourProps {
    studentEmail: string;
}

export default function StudentGuidelineTour({ studentEmail }: StudentGuidelineTourProps) {
    const [steps, setSteps] = useState<GuidelineStep[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [completingStep, setCompletingStep] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Load guidelines on mount
    useEffect(() => {
        setMounted(true);
        fetchGuidelines();
    }, [studentEmail]);

    const fetchGuidelines = async (forceOpen = false) => {
        if (!studentEmail) return;
        setLoading(true);
        try {
            const res = await getStudentGuidelines("Student", null, studentEmail);
            const data = res?.message || res?.data;
            if (data && Array.isArray(data.steps) && data.steps.length > 0) {
                // Sort steps by step_no
                const sortedSteps = [...data.steps].sort((a, b) => a.step_no - b.step_no);
                setSteps(sortedSteps);

                // Auto-open if progress is not complete and user hasn't dismissed it
                const isDismissed = localStorage.getItem("dismissed_student_tour") === "true";
                const hasPending = sortedSteps.some(s => s.status === "Pending");

                if (forceOpen || (hasPending && !isDismissed)) {
                    // Find first pending step index
                    const firstPending = sortedSteps.findIndex(s => s.status === "Pending");
                    setCurrentIndex(firstPending !== -1 ? firstPending : 0);
                    setIsOpen(true);
                }
            }
        } catch (error) {
            console.error("Error loading student guidelines:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;
    if (steps.length === 0) return null;

    const currentStep = steps[currentIndex];
    const totalSteps = steps.length;
    const progressPercentage = Math.round(((currentIndex + 1) / totalSteps) * 100);

    // Helper to build media URL
    const getMediaUrl = (url: string | null | undefined) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        return `${BASE_DOMAIN}${url}`;
    };

    const handleNext = async () => {
        if (currentStep.status === "Pending" && studentEmail) {
            setCompletingStep(true);
            try {
                await completeStudentGuidelineStep(currentStep.name, studentEmail);

                // Update local status of the step
                const updatedSteps = [...steps];
                updatedSteps[currentIndex].status = "Completed";
                setSteps(updatedSteps);
            } catch (error) {
                console.error("Error completing onboarding step:", error);
            } finally {
                setCompletingStep(false);
            }
        }

        if (currentIndex < totalSteps - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Last step: close and mark tour dismissed
            localStorage.setItem("dismissed_student_tour", "true");
            setIsOpen(false);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSkip = () => {
        localStorage.setItem("dismissed_student_tour", "true");
        setIsOpen(false);
    };

    const handleManualOpen = () => {
        fetchGuidelines(true);
    };

    return (
        <>
            {/* Floating help/tour trigger at the bottom right */}
            <button
                onClick={handleManualOpen}
                className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary to-royal text-white shadow-2xl rounded-full p-3 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center group"
                title="App Quick Tour"
                aria-label="App Quick Tour"
            >
                <Compass className="w-6 h-6 animate-spin-slow group-hover:rotate-45 transition-transform duration-300" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-semibold">
                    Quick Guide
                </span>
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Dark Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleSkip}
                                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
                            />

                            {/* Guided Tour Dialog Wrapper */}
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                                    className="w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-3xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 pointer-events-auto"
                                >
                                    {/* Header */}
                                    <div className="px-6 py-4 bg-gradient-to-r from-primary to-royal text-white flex items-center justify-between relative shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                                            <span className="text-sm font-semibold tracking-wider uppercase text-blue-100">
                                                Step {currentIndex + 1} of {totalSteps}
                                            </span>
                                        </div>

                                        <div className="text-center absolute left-1/2 -translate-x-1/2 hidden md:block">
                                            <h3 className="font-bold text-lg">App Onboarding & Features</h3>
                                        </div>

                                        <button
                                            onClick={handleSkip}
                                            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 shrink-0">
                                        <motion.div
                                            className="bg-accent h-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercentage}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>

                                    {/* Content Panel */}
                                    <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">

                                        {/* Left Column: Text & Instructions */}
                                        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                                            <div className="space-y-4">
                                                {currentStep.tab && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                                                        Feature: {currentStep.tab}
                                                    </span>
                                                )}

                                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight leading-tight">
                                                    {currentStep.title}
                                                </h2>

                                                {/* Description rendered safely */}
                                                <div
                                                    className="text-slate-650 dark:text-slate-300 text-base md:text-lg leading-relaxed prose dark:prose-invert max-w-none prose-p:my-2 prose-ul:list-disc prose-ul:ml-5"
                                                    dangerouslySetInnerHTML={{ __html: currentStep.description }}
                                                />
                                            </div>

                                            {/* Step Status Badge */}
                                            <div className="pt-2 flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${currentStep.status === "Completed"
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                                                        : "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40 animate-pulse"
                                                    }`}>
                                                    {currentStep.status === "Completed" ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" />
                                                            Completed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                                                            To Explore
                                                        </>
                                                    )}
                                                </span>
                                                {currentStep.is_mandatory === 1 && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/40">
                                                        Mandatory
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column: Visual Preview */}
                                        <div className="md:col-span-5 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800 min-h-[250px] md:min-h-0 relative overflow-hidden">
                                            {/* Background Gradients */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

                                            <AnimatePresence mode="wait">
                                                {currentStep.image ? (
                                                    <motion.img
                                                        key={`image-${currentIndex}`}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.2 }}
                                                        src={getMediaUrl(currentStep.image) || ""}
                                                        alt={currentStep.title}
                                                        className="max-w-full max-h-[300px] object-contain rounded-lg shadow-md border border-slate-200 dark:border-slate-800 z-10"
                                                    />
                                                ) : currentStep.video_url ? (
                                                    <motion.div
                                                        key={`video-${currentIndex}`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="w-full flex flex-col items-center justify-center space-y-3 z-10 p-4"
                                                    >
                                                        <div className="relative group cursor-pointer w-full aspect-video bg-black rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                                                            <iframe
                                                                src={getMediaUrl(currentStep.video_url) || ""}
                                                                title="Video Guideline"
                                                                className="w-full h-full border-0 absolute inset-0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                                            <Play className="w-3.5 h-3.5" /> Video Demonstration
                                                        </span>
                                                    </motion.div>
                                                ) : (
                                                    // Fallback Illustration when no image or video is configured
                                                    <motion.div
                                                        key={`fallback-${currentIndex}`}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="flex flex-col items-center justify-center space-y-4 text-center z-10 p-6"
                                                    >
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-royal/10 dark:from-primary/20 dark:to-royal/20 flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10">
                                                            <Compass className="w-8 h-8 animate-pulse text-accent" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="font-bold text-slate-750 dark:text-slate-200 text-sm">
                                                                {currentStep.tab || "Dashboard"} Feature
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
                                                                Follow the steps on the left to learn about this tool and get started.
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                    </div>

                                    {/* Footer Controls */}
                                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                        <Button
                                            variant="outline"
                                            onClick={handleSkip}
                                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 hover:border-slate-350 dark:border-slate-800"
                                            disabled={currentStep.is_mandatory === 1}
                                        >
                                            Skip Tour
                                        </Button>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={handleBack}
                                                disabled={currentIndex === 0}
                                                className="border-slate-250 dark:border-slate-800"
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                            </Button>

                                            <Button
                                                variant="accent"
                                                onClick={handleNext}
                                                disabled={completingStep}
                                                className="min-w-[100px] flex items-center justify-center font-semibold"
                                            >
                                                {completingStep ? (
                                                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                ) : currentIndex === totalSteps - 1 ? (
                                                    <>
                                                        Finish <Check className="w-4 h-4 ml-1.5" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Next <ChevronRight className="w-4 h-4 ml-1" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
