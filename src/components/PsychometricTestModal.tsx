"use client";

import React, { useState, useEffect } from "react";
import { psychometricApi, QuestionData, SubmitTestResult } from "@/services/psychometricApi";

interface PsychometricTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCompleted: () => void;
    studentEmail?: string;
}

export default function PsychometricTestModal({
    isOpen,
    onClose,
    onCompleted,
    studentEmail,
}: PsychometricTestModalProps) {
    const [screenName, setScreenName] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [questionNumber, setQuestionNumber] = useState<number>(1);
    const [totalEstimated] = useState<number>(10);

    // Selection states
    const [selectedOption, setSelectedOption] = useState<string | string[]>("");
    const [userInput, setUserInput] = useState<string>("");
    const [openEnded, setOpenEnded] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Results State
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<SubmitTestResult | null>(null);

    useEffect(() => {
        if (isOpen && !screenName) {
            initTest();
        }
    }, [isOpen]);

    const initTest = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const tests = await psychometricApi.getTests();
            const testName = tests && tests.length > 0 ? tests[0].name : "Demo psy 1";

            const sid = await psychometricApi.startNewTest(testName, studentEmail);
            setScreenName(sid);

            const qData = await psychometricApi.loadQuestion(sid);
            setQuestion(qData);
            setQuestionNumber(1);
        } catch (err: any) {
            console.error("Failed to initialize psychometric test:", err);
            setErrorMessage("Could not load test session. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (!screenName || !question) return;

        const qType = question.question_type;
        if (qType === "Choices" && (!selectedOption || (Array.isArray(selectedOption) && selectedOption.length === 0))) {
            setErrorMessage("Please select an option before proceeding.");
            return;
        }
        if (qType === "User Input" && !userInput.trim()) {
            setErrorMessage("Please type your response.");
            return;
        }
        if (qType === "Open Ended" && !openEnded.trim()) {
            setErrorMessage("Please provide your answer.");
            return;
        }

        try {
            setSubmitting(true);
            setErrorMessage("");

            const res = await psychometricApi.nextQuestion({
                screen_name: screenName,
                selected_option: selectedOption,
                user_input: userInput,
                open_ended: openEnded,
            });

            if (res && res.completed) {
                const resultData = await psychometricApi.submitTest(screenName, studentEmail);
                setTestResult(resultData);
                setIsFinished(true);
                return;
            }

            setQuestion(res);
            setQuestionNumber((prev) => prev + 1);
            clearSelections();
        } catch (err: any) {
            console.error("Error advancing question:", err);
            setErrorMessage("Failed to save answer. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrevious = async () => {
        if (!screenName || questionNumber <= 1) return;

        try {
            setSubmitting(true);
            setErrorMessage("");

            const res = await psychometricApi.previousQuestion(screenName);
            setQuestion(res);
            setQuestionNumber((prev) => Math.max(1, prev - 1));

            if (res.saved_response) {
                setSelectedOption(res.saved_response);
                setUserInput(res.saved_response);
                setOpenEnded(res.saved_response);
            } else {
                clearSelections();
            }
        } catch (err: any) {
            console.error("Error loading previous question:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const clearSelections = () => {
        setSelectedOption("");
        setUserInput("");
        setOpenEnded("");
        setErrorMessage("");
    };

    const handleOptionSelect = (opt: string) => {
        setErrorMessage("");
        setSelectedOption(opt);
    };

    const handleFinishAndClose = () => {
        if (isFinished) {
            onCompleted();
        }
        onClose();
    };

    // Strip HTML wrapper tags if any in raw question string
    const cleanQuestionText = (raw: string) => {
        if (!raw) return "";
        return raw.replace(/<[^>]*>?/gm, "").trim();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">

                {/* Header - Stridenex Clean Theme */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-xl shadow-md shadow-blue-500/25">
                            🧠
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Psychometric Assessment
                                </h2>
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold uppercase tracking-wider">
                                    Mandatory
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Personalized Career Pathway Evaluation
                            </p>
                        </div>
                    </div>

                    {/* Manual Close Button (✕) */}
                    <button
                        type="button"
                        onClick={handleFinishAndClose}
                        className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all border border-slate-200 text-sm font-bold active:scale-95"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Top Progress Meter */}
                {!isFinished && !loading && (
                    <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 h-full transition-all duration-500 ease-out shadow-sm"
                            style={{
                                width: `${Math.min(100, (questionNumber / totalEstimated) * 100)}%`,
                            }}
                        />
                    </div>
                )}

                {/* Modal Body */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm font-semibold text-slate-500 tracking-wide">
                                Loading your psychometric test session...
                            </p>
                        </div>
                    ) : isFinished && testResult ? (
                        /* Clean Results & Congrats Card Screen */
                        <div className="space-y-6 animate-fadeIn">
                            {/* Orientation Congrats Banner */}
                            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-blue-50 via-white to-white border border-blue-100 text-center space-y-3 shadow-sm">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 text-xs font-bold uppercase tracking-wider">
                                    🎉 Evaluation Completed
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 tracking-tight">
                                    {testResult.result || "🚀 Startup Oriented"}
                                </h3>
                                <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                    Great job! Your responses have been processed to calculate your primary orientation score and personality traits.
                                </p>
                            </div>

                            {/* Score Breakdown Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-blue-200 transition-colors shadow-sm">
                                    <div className="text-xs text-slate-500 flex items-center justify-between font-semibold">
                                        <span>💼 Job Score</span>
                                        <span className="text-blue-600 font-bold">{testResult.job_score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(100, testResult.job_score)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-orange-200 transition-colors shadow-sm">
                                    <div className="text-xs text-slate-500 flex items-center justify-between font-semibold">
                                        <span>🚀 Startup Score</span>
                                        <span className="text-orange-600 font-bold">{testResult.startup_score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                        <div
                                            className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(100, testResult.startup_score)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-purple-200 transition-colors shadow-sm">
                                    <div className="text-xs text-slate-500 flex items-center justify-between font-semibold">
                                        <span>🎓 Higher Ed Score</span>
                                        <span className="text-purple-600 font-bold">{testResult.higher_ed_score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(100, testResult.higher_ed_score)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Big Five Subject Trait Breakdown */}
                            {testResult.subject_scores && Object.keys(testResult.subject_scores).length > 0 && (
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Personality Trait Breakdown
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(testResult.subject_scores).map(([subj, score], i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
                                                <span className="text-slate-700 font-medium">{subj}</span>
                                                <span className="text-blue-600 font-bold font-mono">{score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : question ? (
                        /* Active Question View */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold uppercase tracking-wider">
                                    {question.subject || "General Trait Assessment"}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                    Question <span className="text-blue-600 font-bold">{questionNumber}</span> / {totalEstimated}
                                </span>
                            </div>

                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
                                {cleanQuestionText(question.question)}
                            </h3>

                            {errorMessage && (
                                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
                                    <span className="text-base">⚠️</span> {errorMessage}
                                </div>
                            )}

                            {question.question_type === "Choices" && question.options && (
                                <div className="grid gap-3 pt-1">
                                    {question.options.map((opt, idx) => {
                                        const isSelected = selectedOption === opt;

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleOptionSelect(opt)}
                                                className={`w-full p-4 rounded-2xl border text-left font-medium text-sm transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${isSelected
                                                    ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm ring-1 ring-blue-500/40"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-200 hover:text-slate-900 shadow-sm"
                                                    }`}
                                            >
                                                <span className="flex items-center gap-3.5">
                                                    <span
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${isSelected
                                                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30"
                                                            : "bg-slate-100 text-slate-500 border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600"
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                    <span className="text-sm font-medium">{opt}</span>
                                                </span>

                                                <span
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs transition-all ${isSelected
                                                        ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                                                        : "border-slate-300 bg-transparent opacity-30 group-hover:opacity-100"
                                                        }`}
                                                >
                                                    {isSelected && "✓"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {question.question_type === "User Input" && (
                                <div className="pt-1">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => {
                                            setUserInput(e.target.value);
                                            setErrorMessage("");
                                        }}
                                        placeholder="Type your answer..."
                                        className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
                                    />
                                </div>
                            )}

                            {question.question_type === "Open Ended" && (
                                <div className="pt-1">
                                    <textarea
                                        rows={4}
                                        value={openEnded}
                                        onChange={(e) => {
                                            setOpenEnded(e.target.value);
                                            setErrorMessage("");
                                        }}
                                        placeholder="Provide your response..."
                                        className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 shadow-sm resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Modal Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex items-center justify-between">
                    {isFinished ? (
                        <button
                            type="button"
                            onClick={handleFinishAndClose}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span>🚀</span> Explore Dashboard & Close
                        </button>
                    ) : !loading ? (
                        <>
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={questionNumber <= 1 || submitting}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center gap-1.5"
                            >
                                ← Previous
                            </button>

                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>Next Question →</>
                                )}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
