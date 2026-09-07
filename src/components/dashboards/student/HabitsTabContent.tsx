// components/dashboards/student/HabitsTabContent.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
    Flame,
    CheckCircle2,
    Circle,
    Target,
    BookOpen,
    MessageSquare,
    Code,
    Plus,
    Calendar,
    Loader2,
    X,
    Clock,
    Link,
    Zap,
    Trash2,
    ShieldAlert,
    ChevronDown,
    Trophy,
    Medal,
    Award,
    Shield,
    Sparkles
} from "lucide-react";
import { StatsCard } from "@/components/dashboards/shared/StatsCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/context/ToastContext";
import { useEntitlements, QuotaExceededError } from "@/context/EntitlementContext";
import {
    getStudentDashboardHabits,
    getHabitStreaks,
    getStudentPlans,
    getTodaysPendingHabits,
    logDailyHabits,
    updateLogStatus,
    createHabitPlan,
    getHabitHistory,
    getPlanSummary,
    completeHabitPlanStatus,
    deleteHabitPlan,
    getStudentBadges
} from "@/services/student.services";
import { BASE_DOMAIN } from "@/services/api.services";
import DashboardDynamicModal, { DynamicField } from "@/components/dashboards/shared/DashboardDynamicModal";

// Types
interface Habit {
    id: string;
    title: string;
    streak: number;
    category: string;
    icon: any;
    color: string;
    bgColor: string;
    progress: number;
    weeklyData: ('done' | 'partial' | 'missed' | 'none')[];
}

interface HabitPlan {
    name: string;
    plan_name: string;
    status: string;
    start_date: string;
    end_date: string | null;
    ai_generated: number;
    habits: Habit[];
}

interface StatsData {
    streak: {
        current: number;
        longest: number;
    };
    todayProgress: {
        done: number;
        partial: number;
        remaining: number;
        completionRate: number;
    };
    thisWeek: {
        completed: number;
        total: number;
        days: {
            day: string;
            status: 'done' | 'partial' | 'missed' | 'future';
        }[];
    };
}

interface PendingHabit {
    id: string;
    habit_name: string;
    habit_type: string;
    target_value: number;
    current_value: number;
    status: 'pending' | 'completed' | 'partial';
    plan_name?: string;
}

interface HabitHistoryItem {
    date: string;
    habit_name: string;
    status: 'done' | 'partial' | 'missed';
    value: number;
}

interface SuggestedHabit {
    title: string;
    description: string;
    icon: any;
}

interface HabitFormData {
    plan_name: string;
    start_date: string;
    end_date: string;
    linked_path: string;
    habits: string[];
    ai_generated: number;
}

interface HabitItem {
    habit_name: string;
    doctype?: string;
}

interface BadgeItem {
    badge_id: string;
    badge_name: string;
    streak_count: number;
    description: string;
    badge_icon: string | null;
    color_theme: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    is_earned: boolean;
    earned_date: string | null;
    progress: {
        current: number;
        target: number;
        percentage: number;
    };
}

// Dynamic data
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getImageUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const domain = BASE_DOMAIN.endsWith("/") ? BASE_DOMAIN.slice(0, -1) : BASE_DOMAIN;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (cleanPath.startsWith("/files/") || cleanPath.startsWith("/private/files/")) {
        return `${domain}/api/method/nexedu.habits_builder.api.get_badge_icon?file_url=${encodeURIComponent(cleanPath)}`;
    }
    return `${domain}${cleanPath}`;
};

// Status configurations
const statusConfig = {
    done: {
        icon: CheckCircle2,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        indicator: "✓"
    },
    partial: {
        icon: Circle,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        indicator: "○"
    },
    missed: {
        icon: Circle,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        indicator: "−"
    },
    future: {
        icon: Circle,
        color: "text-slate-300",
        bgColor: "bg-slate-50/20",
        borderColor: "border-slate-200/60 border-dashed",
        indicator: ""
    }
};

// Date conversion functions
const convertDDMMYYYYToISO = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return '';
    const [day, month, year] = ddmmyyyy.split('/');
    if (!day || !month || !year) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const convertISOToDDMMYYYY = (iso: string): string => {
    if (!iso) return '';
    const [year, month, day] = iso.split('-');
    if (!year || !month || !day) return '';
    return `${day}/${month}/${year}`;
};

const getBadgeIcon = (streakCount: number) => {
    if (streakCount >= 365) return Flame;
    if (streakCount >= 100) return Sparkles;
    if (streakCount >= 50) return Trophy;
    if (streakCount >= 30) return Award;
    if (streakCount >= 14) return Shield;
    return Medal;
};

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

export default function HabitsTabContent() {
    const { showToast } = useToast();
    const { checkAndConsume, hasQuota, getRemaining, entitlements } = useEntitlements();
    const [statsData, setStatsData] = useState<StatsData>({
        streak: { current: 0, longest: 0 },
        todayProgress: { done: 0, partial: 0, remaining: 0, completionRate: 0 },
        thisWeek: { completed: 0, total: 0, days: [] }
    });
    const [habitPlans, setHabitPlans] = useState<HabitPlan[]>([]);
    const [pendingHabits, setPendingHabits] = useState<PendingHabit[]>([]);
    const [habitHistory, setHabitHistory] = useState<HabitHistoryItem[]>([]);
    const [suggestedHabit, setSuggestedHabit] = useState<SuggestedHabit | null>(null);
    const [loading, setLoading] = useState(true);
    const [badges, setBadges] = useState<BadgeItem[]>([]);
    const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<BadgeItem | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
    const [mounted, setMounted] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [habitToEdit, setHabitToEdit] = useState<any | null>(null);

    // Expired plans dropdown toggle
    const [showExpiredPlans, setShowExpiredPlans] = useState(false);

    // Habit fields for dynamic modal
    const habitFields: DynamicField[] = [
        { name: "plan_name", label: "Plan Name", type: "text", icon: Target, required: true, colSpan: 2, placeholder: "e.g., Daily Coding Challenge", disabled: !!habitToEdit },
        { name: "start_date", label: "Start Date", type: "date", icon: Calendar, required: true, placeholder: "MM/DD/YYYY", textTransform: "uppercase" },
        { name: "end_date", label: "End Date", type: "date", icon: Calendar, placeholder: "MM/DD/YYYY", textTransform: "uppercase" },
        // { name: "linked_path", label: "Linked Path", type: "text", icon: Link, placeholder: "e.g., /career/software-engineering" },
        {
            name: "habits",
            label: "Habits",
            type: "custom",
            required: true,
            colSpan: 2,
            customRender: (formData: any, handleChange: (value: any) => void) => {
                const HABIT_TYPES = ["Learning", "Physical", "Mindfulness", "Networking", "Building"];
                return (
                    <div className="space-y-2">
                        {formData.habits?.map((habit: any, index: number) => {
                            const habitName = typeof habit === "string" ? habit : (habit?.habit_name || "");
                            const habitType = typeof habit === "string" ? "Learning" : (habit?.habit_type || "Learning");
                            return (
                                <div key={index} className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={habitName}
                                        onChange={(e) => {
                                            const newHabits = [...(formData.habits || [])];
                                            newHabits[index] = { habit_name: e.target.value, habit_type: habitType };
                                            handleChange(newHabits);
                                        }}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                        placeholder="Enter habit name"
                                    />
                                    <select
                                        value={habitType}
                                        onChange={(e) => {
                                            const newHabits = [...(formData.habits || [])];
                                            newHabits[index] = { habit_name: habitName, habit_type: e.target.value };
                                            handleChange(newHabits);
                                        }}
                                        className="px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-600 bg-white min-w-[120px]"
                                    >
                                        {HABIT_TYPES.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newHabits = [...(formData.habits || [])];
                                            newHabits.splice(index, 1);
                                            handleChange(newHabits);
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => {
                                const newHabits = [...(formData.habits || []), { habit_name: "", habit_type: "Learning" }];
                                handleChange(newHabits);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm shadow-orange-500/10"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Habit</span>
                        </button>
                    </div>
                );
            }
        },
        // {
        //     name: "ai_generated",
        //     label: "AI Generated",
        //     type: "custom",
        //     customRender: (formData: any, handleChange: (value: any) => void) => {
        //         return (
        //             <div className="flex items-center gap-3 cursor-pointer">
        //                 <input
        //                     type="checkbox"
        //                     checked={formData.ai_generated === 1}
        //                     onChange={(e) => handleChange(e.target.checked ? 1 : 0)}
        //                     className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
        //                 />
        //                 <div className="flex items-center gap-2">
        //                     <Zap className="w-4 h-4 text-orange-500" />
        //                     <span className="text-sm font-medium text-slate-700">AI Generated</span>
        //                 </div>
        //             </div>
        //         );
        //     }
        // }
    ];
    const [completingHabit, setCompletingHabit] = useState<string | null>(null);

    // Modal handlers
    const handlePostNewHabit = () => {
        setHabitToEdit(null);
        setIsModalOpen(true);
    };

    const handleManageHabit = (habit: any) => {
        setHabitToEdit(habit);
        setIsModalOpen(true);
    };

    const handleDeleteHabit = async (habit: any) => {
        try {
            const studentEmail = localStorage.getItem("currentUser") || "";
            await deleteHabitPlan(habit.planName, habit.title, studentEmail);
            showToast("Habit deleted successfully!", "success");
            fetchData(); // Refresh the data
        } catch (error) {
            console.error("Error deleting habit:", error);
            showToast("Failed to delete habit. Please try again.", "error");
        }
    };

    const VALID_HABIT_TYPES = ["Learning", "Physical", "Mindfulness", "Networking", "Building"];

    const normalizeHabitType = (rawType: string): string => {
        if (!rawType) return "Learning";
        const found = VALID_HABIT_TYPES.find(t => t.toLowerCase() === rawType.toLowerCase());
        return found || "Learning";
    };

    const modalInitialValues = useMemo(() => {
        if (habitToEdit) {
            return {
                ...habitToEdit,
                habits: Array.isArray(habitToEdit.habits)
                    ? habitToEdit.habits.map((h: any) => ({
                        habit_name: h.title || h.habit_name || h.habit || (typeof h === "string" ? h : ""),
                        habit_type: normalizeHabitType(h.category || h.habit_type || "Learning")
                    }))
                    : Array.isArray(habitToEdit.required_skills)
                        ? habitToEdit.required_skills.map((s: any) => ({
                            habit_name: s.skill || s.skills || "",
                            habit_type: "Learning"
                        }))
                        : [{ habit_name: "", habit_type: "Learning" }]
            };
        }
        return {
            plan_name: '',
            start_date: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
            end_date: '',
            linked_path: '',
            habits: [{ habit_name: '', habit_type: 'Learning' }],
            ai_generated: 0
        };
    }, [habitToEdit]);

    const handleModalSubmit = async (data: any) => {
        try {
            setModalLoading(true);
            setModalError(null);

            // ── Quota gate ───────────────────────────────────────────────
            // Only check quota for NEW plans (not edits)
            if (!habitToEdit) {
                await checkAndConsume("create_new_habit_plan");
            }
            // ─────────────────────────────────────────────────────────────

            const studentEmail = localStorage.getItem("currentUser") || "";
            const payload: any = {
                student: studentEmail,
                plan_name: data.plan_name,
                start_date: data.start_date,
                end_date: data.end_date || null,
                linked_path: data.linked_path || null,
                habits: data.habits
                    .filter((h: any) => {
                        const name = typeof h === "string" ? h : (h?.habit_name || "");
                        return name.trim() !== '';
                    })
                    .map((habit: any) => ({
                        habit_name: typeof habit === "string" ? habit : (habit?.habit_name || ""),
                        habit_type: typeof habit === "string" ? "Learning" : normalizeHabitType(habit?.habit_type || "Learning"),
                        doctype: "Habit Plan Item"
                    })),
                ai_generated: parseInt(data.ai_generated) || 0
            };

            if (habitToEdit) {
                payload.plan_id = habitToEdit.name;
            }

            await createHabitPlan(payload);
            setIsModalOpen(false);
            setHabitToEdit(null);
            fetchData();
            showToast(habitToEdit ? "Habit plan updated successfully!" : "Habit plan created successfully!", "success");
        } catch (error: any) {
            if (error instanceof QuotaExceededError) {
                const remaining = getRemaining("create_new_habit_plan");
                const limit = entitlements["create_new_habit_plan"]?.limit;
                const message = limit !== undefined
                    ? `You've reached your habit plan limit (${limit} plans). Upgrade your plan to create more.`
                    : "You've reached your habit plan limit. Upgrade your plan to create more.";
                setModalError(message);
                showToast(message, "warning");
            } else {
                console.error("Error creating habit plan:", error);
                setModalError(error?.message || "Failed to create habit plan. Please try again.");
            }
        } finally {
            setModalLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const studentEmail = localStorage.getItem("currentUser") || "";
            if (!studentEmail) {
                setLoading(false);
                return;
            }

            // Fetch all habits data in parallel
            const [dashboardRes, pendingRes, plansRes, streaksRes, badgesRes] = await Promise.all([
                getStudentDashboardHabits(studentEmail),
                getTodaysPendingHabits(studentEmail),
                getStudentPlans(studentEmail),
                getHabitStreaks(studentEmail),
                getStudentBadges(studentEmail)
            ]);

            const mapPlansFromAPI = (apiPlans: any[]) => {
                return apiPlans.map((plan: any, planIndex: number) => {
                    const habits = Array.isArray(plan.habits) ? plan.habits.map((habit: any, habitIndex: number) => ({
                        id: habit.name || `${plan.name || planIndex}-${habitIndex}`,
                        title: habit.habit_name || "Untitled Habit",
                        streak: habit.current_streak || 0,
                        category: habit.habit_type || "General",
                        icon: getIconForCategory(habit.habit_type),
                        color: getColorForCategory(habit.habit_type),
                        bgColor: getBgColorForCategory(habit.habit_type),
                        progress: habit.completion_rate || 0,
                        weeklyData: habit.weekly_data || ['none', 'none', 'none', 'none', 'none', 'none', 'none']
                    })) : [];

                    return {
                        name: plan.name || `plan-${planIndex}`,
                        plan_name: plan.plan_name || "Untitled Plan",
                        status: plan.status || "Active",
                        start_date: plan.start_date,
                        end_date: plan.end_date,
                        ai_generated: plan.ai_generated || 0,
                        habits: habits
                    };
                });
            };

            // Process dashboard data
            if (dashboardRes?.message) {
                const data = dashboardRes.message;

                // Map streak data
                if (data.current_streak !== undefined && data.longest_streak !== undefined) {
                    setStatsData(prev => ({
                        ...prev,
                        streak: {
                            current: data.current_streak || 0,
                            longest: data.longest_streak || 0
                        }
                    }));
                }

                // Map today's progress data
                if (data.today_done !== undefined) {
                    const doneCount = data.today_done || 0;
                    const partialCount = data.today_partial || 0;
                    const remainingCount = data.today_remaining || 0;

                    const totalDue = doneCount + remainingCount;
                    let calculatedRate = 0;
                    if (totalDue > 0) {
                        calculatedRate = (doneCount / totalDue) * 100;
                    }

                    setStatsData(prev => ({
                        ...prev,
                        todayProgress: {
                            done: doneCount,
                            partial: partialCount,
                            remaining: remainingCount,
                            completionRate: calculatedRate
                        }
                    }));
                }

                // Map this week data
                if (data.this_week && Array.isArray(data.this_week)) {
                    const completedCount = data.this_week.filter((day: any) => day.status === 'done').length;
                    const totalCount = data.this_week.length;
                    const localTodayStr = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD

                    setStatsData(prev => ({
                        ...prev,
                        thisWeek: {
                            completed: completedCount,
                            total: totalCount,
                            days: data.this_week.map((day: any) => {
                                let status: 'done' | 'partial' | 'missed' | 'future' = 'future';
                                if (day.date > localTodayStr) {
                                    status = 'future';
                                } else if (day.date === localTodayStr) {
                                    if (day.status === 'done') status = 'done';
                                    else if (day.status === 'partial') status = 'partial';
                                    else status = 'future'; // Today, not logged yet -> show as future/pending
                                } else {
                                    if (day.status === 'done') status = 'done';
                                    else if (day.status === 'partial') status = 'partial';
                                    else status = 'missed'; // Past day unlogged/none -> missed
                                }
                                return {
                                    day: day.day,
                                    status
                                };
                            })
                        }
                    }));
                }

                // Map habits from dashboard
                if (data.habits && Array.isArray(data.habits)) {
                    setHabitPlans(mapPlansFromAPI(data.habits));
                }
            }

            // Process pending habits
            if (pendingRes?.message && Array.isArray(pendingRes.message)) {
                setPendingHabits(pendingRes.message);
            } else {}

            // Process habit plans from getStudentPlans API (always process to ensure we get all plans)
            if (plansRes?.message && Array.isArray(plansRes.message)) {
                setHabitPlans(mapPlansFromAPI(plansRes.message));
            }

            // Process streaks if not already set from dashboard
            if (streaksRes?.message && Array.isArray(streaksRes.message) && !statsData.streak.current) {
                // Find the habit with highest current streak for overall stats
                const maxStreak = streaksRes.message.reduce((max: any, habit: any) => {
                    return (habit.current_streak || 0) > (max?.current_streak || 0) ? habit : max;
                }, null);

                if (maxStreak) {
                    setStatsData(prev => ({
                        ...prev,
                        streak: {
                            current: maxStreak.current_streak || 0,
                            longest: maxStreak.longest_streak || 0
                        }
                    }));
                }
            }

            // Generate suggested habit based on activity
            const allHabits = habitPlans.flatMap(p => p.habits || []);
            if (allHabits.length > 0) {
                const categories = allHabits.map(h => h.category);
                const suggestion = generateSuggestedHabit(categories);
                setSuggestedHabit(suggestion);
            }

            // Process badges
            const badgesData = badgesRes?.message || badgesRes;
            if (badgesData && Array.isArray(badgesData.badges)) {
                setBadges(prevBadges => {
                    const celebratedStr = localStorage.getItem("celebrated_badges") || "[]";
                    let celebratedIds: string[] = [];
                    try {
                        celebratedIds = JSON.parse(celebratedStr);
                    } catch (e) {
                        celebratedIds = [];
                    }
                    const celebratedSet = new Set(celebratedIds);

                    // Get today's date in YYYY-MM-DD format (local time)
                    const localToday = new Date();
                    const year = localToday.getFullYear();
                    const month = String(localToday.getMonth() + 1).padStart(2, '0');
                    const day = String(localToday.getDate()).padStart(2, '0');
                    const todayStr = `${year}-${month}-${day}`;

                    let newlyEarned = null;

                    if (prevBadges && prevBadges.length > 0) {
                        // Case A: Transition during the session (completing a habit)
                        const prevEarnedIds = new Set(prevBadges.filter(b => b.is_earned).map(b => b.badge_id));
                        newlyEarned = badgesData.badges.find(
                            (b: any) => b.is_earned && !prevEarnedIds.has(b.badge_id)
                        );
                    } else {
                        // Case B: First load of the page, badge was earned today but not celebrated yet
                        newlyEarned = badgesData.badges.find(
                            (b: any) => b.is_earned && b.earned_date === todayStr && !celebratedSet.has(b.badge_id)
                        );
                    }

                    if (newlyEarned) {
                        setNewlyUnlockedBadge(newlyEarned);
                        showToast(`🏆 Badge Unlocked: ${newlyEarned.badge_name}!`, "success");

                        // Mark as celebrated
                        celebratedSet.add(newlyEarned.badge_id);
                        localStorage.setItem("celebrated_badges", JSON.stringify(Array.from(celebratedSet)));
                    }

                    return badgesData.badges;
                });
            }

        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for dynamic styling
    const getIconForCategory = (category: string) => {
        const iconMap: { [key: string]: any } = {
            'Problem Solving': Code,
            'ML': BookOpen,
            'Communication': MessageSquare,
            'Various': Target,
            'General': Target
        };
        return iconMap[category] || Target;
    };

    const getColorForCategory = (category: string) => {
        const colorMap: { [key: string]: string } = {
            'Problem Solving': 'text-blue-600',
            'ML': 'text-purple-600',
            'Communication': 'text-orange-600',
            'Various': 'text-emerald-600',
            'General': 'text-slate-600'
        };
        return colorMap[category] || 'text-slate-600';
    };

    const getBgColorForCategory = (category: string) => {
        const bgColorMap: { [key: string]: string } = {
            'Problem Solving': 'bg-blue-50',
            'ML': 'bg-purple-50',
            'Communication': 'bg-orange-50',
            'Various': 'bg-emerald-50',
            'General': 'bg-slate-50'
        };
        return bgColorMap[category] || 'bg-slate-50';
    };

    const generateSuggestedHabit = (categories: string[]): SuggestedHabit => {
        const hasProblemSolving = categories.includes('Problem Solving');
        const hasML = categories.includes('ML');
        const hasCommunication = categories.includes('Communication');

        if (!hasCommunication && categories.length >= 2) {
            return {
                title: "Daily Networking",
                description: "Connect with professionals in your field to expand your network",
                icon: MessageSquare
            };
        }

        if (hasProblemSolving && !hasML) {
            return {
                title: "ML Fundamentals",
                description: "Build your machine learning foundation with daily practice",
                icon: BookOpen
            };
        }

        return {
            title: "Morning Meditation",
            description: "Start your day with mindfulness and focus",
            icon: Calendar
        };
    };

    // API interaction functions
    const handleLogHabit = async (habitId: string, value: number, planName?: string) => {
        try {
            setCompletingHabit(habitId);
            const studentEmail = localStorage.getItem("currentUser") || "";

            // Find the habit to get plan name if not provided
            const habit = pendingHabits.find(h => h.id === habitId);

            // Optimistically update UI - remove the habit from pending list immediately
            setPendingHabits(prev => prev.filter(habit => habit.id !== habitId));

            await logDailyHabits({
                student: studentEmail,
                logs: [{
                    habit: habitId,
                    value: value,
                    date: new Date().toISOString().split('T')[0]
                }]
            });

            // Refresh data to ensure consistency with backend
            fetchData();
        } catch (error) {
            console.error("Error logging habit:", error);
            // If there's an error, refresh data to restore the correct state
            fetchData();
        } finally {
            setCompletingHabit(null);
        }
    };

    const handleUpdateHabitStatus = async (logName: string, status: string) => {
        try {
            await updateLogStatus(logName, status);
            // Refresh data after updating
            fetchData();
        } catch (error) {
            console.error("Error updating habit status:", error);
        }
    };

    const handleCreateHabitPlan = async (planData: any) => {
        try {
            const studentEmail = localStorage.getItem("currentUser") || "";
            await createHabitPlan({
                ...planData,
                student: studentEmail
            });
            // Refresh data after creating
            fetchData();
        } catch (error) {
            console.error("Error creating habit plan:", error);
        }
    };


    const handleGetHabitHistory = async (habitName: string) => {
        try {
            const studentEmail = localStorage.getItem("currentUser") || "";
            const historyRes = await getHabitHistory(studentEmail, habitName, 30);
            if (historyRes?.message && Array.isArray(historyRes.message)) {
                setHabitHistory(historyRes.message);
            }
        } catch (error) {
            console.error("Error fetching habit history:", error);
        }
    };

    const todayProgressItems = [
        { key: 'done', label: 'Done', value: statsData.todayProgress.done },
        { key: 'partial', label: 'Partial', value: statsData.todayProgress.partial },
        { key: 'remaining', label: 'Remaining', value: statsData.todayProgress.remaining }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="text-sm font-medium italic tracking-widest uppercase opacity-70">Syncing Habits...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Premium Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Streak Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 border border-orange-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/30 rounded-full blur-2xl -mr-5 -mt-5" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Current Streak</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-800">{statsData.streak.current}</span>
                                <span className="text-sm font-bold text-slate-500">days</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 transform hover:scale-105 transition-transform duration-200">
                            <Flame className="w-6 h-6 animate-pulse" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-orange-100/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Keep the fire burning!</span>
                        <span className="font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/40 text-xs">
                            Best: {statsData.streak.longest}d
                        </span>
                    </div>
                </div>

                {/* Completion Rate Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30 border border-emerald-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full blur-2xl -mr-5 -mt-5" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Today's Progress</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-800">{statsData.todayProgress.completionRate.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 transform hover:scale-105 transition-transform duration-200">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2.5">
                        <Progress value={statsData.todayProgress.completionRate} className="h-1.5 bg-slate-100" indicatorColor="bg-emerald-500" />
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>Done: <strong className="text-emerald-600">{statsData.todayProgress.done}</strong></span>
                            <span>Partial: <strong className="text-amber-600">{statsData.todayProgress.partial}</strong></span>
                            <span>Remaining: <strong className="text-rose-600">{statsData.todayProgress.remaining}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Weekly Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/30 border border-indigo-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/30 rounded-full blur-2xl -mr-5 -mt-5" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Weekly Activity</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-800">{statsData.thisWeek.completed}</span>
                                <span className="text-sm font-bold text-slate-500">/ {statsData.thisWeek.total} days</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-transform duration-200">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-indigo-100/50 flex items-center justify-between gap-1">
                        {statsData.thisWeek.days.map((day) => {
                            const config = statusConfig[day.status];
                            return (
                                <div
                                    key={day.day}
                                    className={`flex-1 flex flex-col items-center py-1.5 rounded border text-[10px] font-extrabold ${config.bgColor} ${config.color} ${config.borderColor}`}
                                    title={`${day.day}: ${day.status}`}
                                >
                                    <span>{day.day[0]}</span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Color Coding Legend */}
                    <div className="mt-3.5 pt-2.5 border-t border-indigo-100/30 flex items-center justify-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-200 shadow-sm" />
                            <span>Done</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 border border-amber-200 shadow-sm" />
                            <span>Partial</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-rose-500 border border-rose-200 shadow-sm" />
                            <span>Missed</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200 border-dashed" />
                            <span>Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Habit Plans Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden"
            >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-800">My Habit Plans</h3>
                        {/* Quota badge */}
                        {entitlements["create_new_habit_plan"] && (() => {
                            const ent = entitlements["create_new_habit_plan"];
                            const isUnlimited = ent.remaining === "Unlimited";
                            const remaining = ent.remaining as number;
                            const limit = ent.limit as number;
                            const exhausted = !isUnlimited && remaining <= 0;
                            const nearLimit = !isUnlimited && remaining <= Math.max(1, Math.ceil(limit * 0.2));
                            return (
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${exhausted
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : nearLimit
                                            ? "bg-amber-50 text-amber-600 border-amber-200"
                                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        }`}
                                    title={`${isUnlimited ? "Unlimited" : remaining} habit plan${isUnlimited || remaining !== 1 ? "s" : ""} remaining of ${isUnlimited ? "Unlimited" : limit}`}
                                >
                                    {exhausted && <ShieldAlert className="w-3 h-3" />}
                                    {isUnlimited ? "Unlimited" : `${remaining} / ${limit}`}
                                </span>
                            );
                        })()}
                    </div>
                    <button
                        onClick={handlePostNewHabit}
                        disabled={!hasQuota("create_new_habit_plan")}
                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
                        title={!hasQuota("create_new_habit_plan") ? "Habit plan limit reached. Upgrade your plan to add more." : "Create a new habit plan"}
                    >
                        <Plus className="w-4 h-4" /> New Habit
                    </button>
                </div>

                <div className="p-4 space-y-3 bg-slate-50/30 max-h-[420px] overflow-y-auto">
                    {habitPlans.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
                            No habit plans created yet. Click &quot;New Habit&quot; to get started!
                        </div>
                    ) : (() => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                        const activePlans = habitPlans.filter(plan => {
                            const isExpired = plan.end_date && new Date(plan.end_date) < today;
                            return !isExpired && plan.status !== "Inactive";
                        });
                        const expiredPlans = habitPlans.filter(plan => {
                            const isExpired = plan.end_date && new Date(plan.end_date) < today;
                            return isExpired || plan.status === "Inactive";
                        });

                        const renderPlanCard = (plan: HabitPlan, forceExpired = false) => {
                            const isExpired = plan.end_date && new Date(plan.end_date) < today;
                            const isInactive = plan.status === "Inactive" || isExpired;
                            return (
                                <div
                                    key={plan.name}
                                    className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 ${isInactive ? "border-slate-200/50 opacity-80" : "border-slate-200/80"
                                        }`}
                                >
                                    {/* Plan Header */}
                                    <div className={`p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 ${isInactive ? "bg-slate-50/80" : "bg-slate-50/60"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isExpired
                                                ? "bg-rose-50 border-rose-100"
                                                : isInactive
                                                    ? "bg-slate-100 border-slate-200"
                                                    : "bg-orange-50 border-orange-100"
                                                }`}>
                                                <Target className={`w-5 h-5 ${isExpired ? "text-rose-400" : isInactive ? "text-slate-400" : "text-orange-500"
                                                    }`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-base">{plan.plan_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isExpired
                                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                                        : isInactive
                                                            ? "bg-slate-100 text-slate-600 border-slate-200"
                                                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        }`}>
                                                        {isExpired ? "Expired" : isInactive ? "Inactive" : "Active"}
                                                    </span>
                                                    {plan.ai_generated === 1 && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-0.5">
                                                            <Zap className="w-2.5 h-2.5" /> AI
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-xs text-slate-600 bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 flex items-center gap-2 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>
                                                    {plan.start_date ? new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Start"}
                                                    {" — "}
                                                    {plan.end_date ? new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Ongoing"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleManageHabit(plan)}
                                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-orange-500 hover:border-orange-100 text-slate-600 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
                                                    title={isInactive ? "Resume / Extend Plan" : "Edit Plan"}
                                                >
                                                    {isInactive ? "Resume" : "Edit"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Habits Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/20">
                                                    {['Habit', 'Category', 'Streak', 'Progress', 'This Week', ''].map((header) => (
                                                        <th key={header} className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm divide-y divide-slate-100">
                                                {plan.habits.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-8 px-6 text-center text-slate-400 text-xs">
                                                            No habits under this plan.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    plan.habits.map((habit: any) => {
                                                        const Icon = habit.icon;
                                                        return (
                                                            <tr key={habit.id} className="hover:bg-slate-50/20 transition-colors group">
                                                                <td className="py-3.5 px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg ${habit.bgColor} flex items-center justify-center`}>
                                                                            <Icon className={`w-4 h-4 ${habit.color}`} />
                                                                        </div>
                                                                        <span className={`font-semibold ${isInactive ? "text-slate-500" : "text-slate-700"
                                                                            }`}>{habit.title}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3.5 px-6">
                                                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200/60 text-xs font-semibold">
                                                                        {habit.category}
                                                                    </Badge>
                                                                </td>
                                                                <td className="py-3.5 px-6">
                                                                    <div className="flex items-center gap-1">
                                                                        <Flame className={`w-4 h-4 ${isInactive ? "text-slate-400" : "text-orange-500"}`} />
                                                                        <span className="font-bold text-slate-700">{habit.streak}</span>
                                                                        <span className="text-[10px] text-slate-400 font-medium">days</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3.5 px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs font-bold text-slate-500 w-8">{Math.round(habit.progress)}%</span>
                                                                        <Progress
                                                                            value={habit.progress}
                                                                            className="w-16 h-1.5 bg-slate-100"
                                                                            indicatorColor={isInactive ? "bg-slate-400" : "bg-orange-500"}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="py-3.5 px-6">
                                                                    <div className="flex items-center gap-1">
                                                                        {habit.weeklyData.map((status: 'done' | 'partial' | 'missed' | 'none', idx: number) => {
                                                                            let boxClass = "";
                                                                            if (isInactive) {
                                                                                boxClass = status === 'done'
                                                                                    ? 'bg-slate-100 text-slate-500 border border-slate-300'
                                                                                    : 'bg-slate-50/50 text-slate-300 border border-slate-200/50';
                                                                            } else {
                                                                                if (status === 'done') {
                                                                                    boxClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm shadow-emerald-100';
                                                                                } else if (status === 'partial') {
                                                                                    boxClass = 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm shadow-amber-100';
                                                                                } else if (status === 'missed') {
                                                                                    boxClass = 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm shadow-rose-100';
                                                                                } else {
                                                                                    boxClass = 'bg-slate-50 text-slate-400 border border-slate-200/80';
                                                                                }
                                                                            }
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${boxClass}`}
                                                                                    title={`${weekDays[idx]}: ${status}`}
                                                                                >
                                                                                    {weekDays[idx][0]}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3.5 px-6 text-right">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteHabit({ planName: plan.plan_name, title: habit.title });
                                                                        }}
                                                                        className="p-2 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Delete Habit"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <>
                                {/* Active plans */}
                                {activePlans.length === 0 && expiredPlans.length > 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
                                        No active plans right now. Resume an expired plan below to continue.
                                    </div>
                                )}
                                {activePlans.map(plan => renderPlanCard(plan))}

                                {/* Expired / Inactive plans collapsible */}
                                {expiredPlans.length > 0 && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => setShowExpiredPlans(prev => !prev)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all group"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs font-bold uppercase tracking-widest">
                                                    Expired / Inactive Plans
                                                </span>
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                                                    {expiredPlans.length}
                                                </span>
                                            </div>
                                            <ChevronDown
                                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showExpiredPlans ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        {showExpiredPlans && (
                                            <div className="mt-3 space-y-4">
                                                {expiredPlans.map(plan => renderPlanCard(plan, true))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </motion.div>

            {/* Streak Achievements Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-orange-500" />
                            My Achievements
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Track your consistency milestones</p>
                    </div>
                    {badges.length > 0 && (
                        <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{badges.filter(b => b.is_earned).length} / {badges.length} Badges Earned</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left & Middle: Earned Badges Row */}
                    <div className="md:col-span-2 space-y-3">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Earned Badges</h4>
                        {badges.filter(b => b.is_earned).length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200/80 rounded-2xl bg-slate-50/40 text-center">
                                <Medal className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-500">No badges earned yet</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Complete your daily habits to start unlocking badges!</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-4">
                                {badges.filter(b => b.is_earned).map((b) => {
                                    const IconComponent = getBadgeIcon(b.streak_count);

                                    const themes = {
                                        Bronze: "from-amber-500 to-amber-700 shadow-amber-500/20 text-white",
                                        Silver: "from-slate-400 to-slate-600 shadow-slate-500/20 text-white",
                                        Gold: "from-yellow-400 via-amber-500 to-yellow-600 shadow-yellow-500/30 text-white",
                                        Platinum: "from-sky-400 via-indigo-500 to-purple-600 shadow-indigo-500/25 text-white",
                                        Diamond: "from-cyan-400 via-teal-400 to-blue-600 shadow-cyan-500/30 text-white"
                                    };
                                    const themeClass = themes[b.color_theme] || themes.Bronze;

                                    return (
                                        <div
                                            key={b.badge_id}
                                            onClick={() => setSelectedBadge(b)}
                                            className="group relative flex flex-col items-center p-3 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors w-24 cursor-pointer"
                                        >
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${themeClass} flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 overflow-hidden`}>
                                                {b.badge_icon ? (
                                                    <img src={getImageUrl(b.badge_icon)} alt={b.badge_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <IconComponent className="w-6 h-6" />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-700 text-center mt-2.5 leading-tight truncate w-full">
                                                {b.badge_name}
                                            </span>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                                                <p className="font-bold text-orange-400 mb-0.5">{b.badge_name}</p>
                                                <p className="text-slate-300 leading-normal">{b.description}</p>
                                                {b.earned_date && (
                                                    <p className="text-emerald-400 font-semibold mt-1">Earned on: {new Date(b.earned_date).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Next Milestone */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Next Milestone</h4>
                        {(() => {
                            const nextBadge = badges.find(b => !b.is_earned);
                            if (!nextBadge) {
                                return (
                                    <div className="flex flex-col items-center justify-center p-6 border border-slate-200/60 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 text-center h-[106px]">
                                        <Trophy className="w-6 h-6 text-emerald-500 mb-1" />
                                        <p className="text-xs font-black text-slate-800">All Badges Unlocked!</p>
                                        <p className="text-[10px] text-slate-500 font-medium">You are a habit master!</p>
                                    </div>
                                );
                            }

                            const IconComponent = getBadgeIcon(nextBadge.streak_count);
                            return (
                                <div className="p-4 border border-slate-200/60 rounded-2xl bg-slate-50/30 flex flex-col justify-between h-[106px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-200/60 text-slate-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {nextBadge.badge_icon ? (
                                                <img src={getImageUrl(nextBadge.badge_icon)} alt={nextBadge.badge_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <IconComponent className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{nextBadge.badge_name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Reach {nextBadge.streak_count}-day streak</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        <div className="flex justify-between text-[9px] font-extrabold text-slate-500">
                                            <span>Current Streak: {nextBadge.progress.current}d</span>
                                            <span>Target: {nextBadge.progress.target}d</span>
                                        </div>
                                        <Progress value={nextBadge.progress.percentage} className="h-1.5 bg-slate-200/60" indicatorColor="bg-orange-500" />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </motion.div>

            {/* Today's Pending Habits Section */}
            {pendingHabits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-sm font-bold text-slate-800">Today&apos;s Pending Habits</h3>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                            {pendingHabits.length} remaining
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {pendingHabits.map((habit, index) => {
                            const Icon = getIconForCategory(habit.habit_type);
                            return (
                                <div key={`${habit.id}-${habit.habit_name}-${index}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-lg ${getBgColorForCategory(habit.habit_type)} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-3.5 h-3.5 ${getColorForCategory(habit.habit_type)}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{habit.habit_name}</p>
                                            <p className="text-[10px] text-slate-400">{habit.plan_name} · {habit.habit_type}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="text-xs h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-white"
                                        onClick={() => handleLogHabit(habit.id, habit.target_value, habit.plan_name)}
                                        disabled={completingHabit === habit.id}
                                    >
                                        {completingHabit === habit.id ? (
                                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Completing...</>
                                        ) : 'Complete'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}



            {/* Suggested Habit Section */}
            {suggestedHabit && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200/60 shadow-sm overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <suggestedHabit.icon className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 mb-1">{suggestedHabit.title}</h4>
                                <p className="text-sm text-slate-600 mb-3">{suggestedHabit.description}</p>
                                <Button
                                    size="sm"
                                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white"
                                    onClick={() => handleCreateHabitPlan({
                                        plan_name: suggestedHabit.title,
                                        habit_type: "Suggested",
                                        description: suggestedHabit.description
                                    })}
                                >
                                    Add This Habit
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <DashboardDynamicModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={habitToEdit ? "Manage Habit Plan" : "Create New Habit Plan"}
                subtitle={habitToEdit ? `Updating: ${habitToEdit.plan_name}` : "Set up a new habit to track your progress"}
                headerIcon={Target}
                iconBgColor="bg-orange-500"
                fields={habitFields}
                initialValues={modalInitialValues}
                onSubmit={handleModalSubmit}
                loading={modalLoading}
                error={modalError}
            />

            {/* Badge Celebration Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {newlyUnlockedBadge && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                            <ConfettiEffect />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col items-center"
                            >
                                <button
                                    onClick={() => setNewlyUnlockedBadge(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                    className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${newlyUnlockedBadge.color_theme === 'Bronze' ? 'from-amber-600 to-amber-800' :
                                        newlyUnlockedBadge.color_theme === 'Silver' ? 'from-slate-400 to-slate-600' :
                                            newlyUnlockedBadge.color_theme === 'Gold' ? 'from-yellow-500 via-amber-500 to-yellow-600' :
                                                newlyUnlockedBadge.color_theme === 'Platinum' ? 'from-sky-400 via-indigo-500 to-purple-600' :
                                                    'from-cyan-400 via-teal-400 to-blue-600'
                                        } text-white flex items-center justify-center shadow-xl shadow-orange-500/25 mb-6 overflow-hidden`}
                                >
                                    {(() => {
                                        if (newlyUnlockedBadge.badge_icon) {
                                            return <img src={getImageUrl(newlyUnlockedBadge.badge_icon)} alt={newlyUnlockedBadge.badge_name} className="w-full h-full object-cover" />;
                                        }
                                        const Icon = getBadgeIcon(newlyUnlockedBadge.streak_count);
                                        return <Icon className="w-12 h-12" />;
                                    })()}
                                </motion.div>

                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500 mb-2">New Achievement!</span>
                                <h3 className="text-xl font-black text-slate-800 text-center mb-1">
                                    {newlyUnlockedBadge.badge_name}
                                </h3>
                                <p className="text-sm font-semibold text-slate-500 mb-4">{newlyUnlockedBadge.streak_count}-Day Streak Milestone</p>

                                <p className="text-sm text-slate-600 text-center bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 font-medium">
                                    &quot;{newlyUnlockedBadge.description}&quot;
                                </p>

                                <Button
                                    onClick={() => setNewlyUnlockedBadge(null)}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold h-12 rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-transform"
                                >
                                    Awesome! Keep it up
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Earned Badge Detail Popup Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selectedBadge && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedBadge(null)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col items-center"
                            >
                                <button
                                    onClick={() => setSelectedBadge(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <motion.div
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${selectedBadge.color_theme === 'Bronze' ? 'from-amber-500 to-amber-700 shadow-amber-500/25' :
                                        selectedBadge.color_theme === 'Silver' ? 'from-slate-400 to-slate-600 shadow-slate-500/25' :
                                            selectedBadge.color_theme === 'Gold' ? 'from-yellow-400 via-amber-500 to-yellow-600 shadow-yellow-500/25' :
                                                selectedBadge.color_theme === 'Platinum' ? 'from-sky-400 via-indigo-500 to-purple-600 shadow-indigo-500/25' :
                                                    'from-cyan-400 via-teal-400 to-blue-600 shadow-cyan-500/25'
                                        } text-white flex items-center justify-center shadow-2xl mb-6 overflow-hidden transform hover:rotate-3 transition-transform duration-300`}
                                >
                                    {(() => {
                                        if (selectedBadge.badge_icon) {
                                            return <img src={getImageUrl(selectedBadge.badge_icon)} alt={selectedBadge.badge_name} className="w-full h-full object-cover" />;
                                        }
                                        const Icon = getBadgeIcon(selectedBadge.streak_count);
                                        return <Icon className="w-16 h-16" />;
                                    })()}
                                </motion.div>

                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Earned Badge</span>
                                <h3 className="text-xl font-black text-slate-800 text-center mb-1">
                                    {selectedBadge.badge_name}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mb-4">{selectedBadge.streak_count}-Day Streak Milestone</p>

                                <p className="text-sm text-slate-600 text-center bg-slate-50/80 rounded-2xl p-4 border border-slate-100/60 mb-6 font-semibold w-full">
                                    &quot;{selectedBadge.description}&quot;
                                </p>

                                {selectedBadge.earned_date && (
                                    <div className="text-xs font-bold text-slate-500 bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl border border-emerald-100/50 flex items-center gap-1.5 mb-6">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Unlocked on {new Date(selectedBadge.earned_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                )}

                                <Button
                                    onClick={() => setSelectedBadge(null)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-2xl shadow-lg transition-transform active:scale-95"
                                >
                                    Close View
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
