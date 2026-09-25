// Dynamically resolves backend base URL from environment variables or relative browser origin.
// Priority: NEXT_PUBLIC_BACKEND_URL → NEXT_PUBLIC_API_BASE_URL (strip trailing /api/) → window.location.origin
const getBackendUrl = () => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "");
    }
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        return process.env.NEXT_PUBLIC_API_BASE_URL
            .replace(/\/api\/?$/, "")
            .replace(/\/$/, "");
    }
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    return "";
};

export interface OnboardingStatusResponse {
    is_first_login: boolean;
    is_onboarded: boolean;
    test_completed: boolean;
    has_completed_test: boolean;
    submission?: {
        name: string;
        psychometric_test: string;
        score: number;
        percentage: number;
        creation: string;
    } | null;
    test_screen?: {
        name: string;
        creation: string;
        docstatus: number;
    } | null;
}

export interface QuestionData {
    question: string;
    question_type: "Choices" | "User Input" | "Open Ended";
    subject: string;
    options?: string[];
    multiple_correct?: boolean | number;
    is_last?: boolean;
    no_of_options?: string;
    saved_response?: string | null;
    completed?: boolean;
    total_questions?: number;   // dynamic count from backend (Psychometric Settings)
    current_index?: number;     // 0-based index of the current question
}

export interface SubmitTestResult {
    status: string;
    result: string;
    job_score: number;
    startup_score: number;
    higher_ed_score: number;
    subject_scores: Record<string, number>;
    ai_result?: string | null;
}

export const psychometricApi = {
    checkOnboardingStatus: async (email?: string): Promise<OnboardingStatusResponse> => {
        try {
            const url = email
                ? `${getBackendUrl()}/api/method/nexedu.api.check_onboarding_status?email=${encodeURIComponent(email)}`
                : `${getBackendUrl()}/api/method/nexedu.api.check_onboarding_status`;

            const res = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) {
                throw new Error(`HTTP error ${res.status}`);
            }
            const data = await res.json();
            const message = data.message || { is_first_login: true, is_onboarded: false, test_completed: false, has_completed_test: false };

            if (typeof window !== "undefined" && email && !message.is_onboarded) {
                const localCompleted = localStorage.getItem(`psychometric_completed_${email}`);
                if (localCompleted === "true") {
                    return { ...message, is_first_login: false, is_onboarded: true, test_completed: true, has_completed_test: true };
                }
            }
            return message;
        } catch (err) {
            console.warn("Could not check onboarding status", err);
            return { is_first_login: false, is_onboarded: false, test_completed: false, has_completed_test: false };
        }
    },

    getTests: async (): Promise<Array<{ name: string }>> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.get_tests`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        return data.message || [];
    },

    startNewTest: async (testType: string, email?: string): Promise<any> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.start_new_test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ test_type: testType, email })
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        return data.message !== undefined ? data.message : data;
    },

    loadQuestion: async (screenName: string): Promise<QuestionData> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.load_question`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ screen_name: screenName })
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        return data.message;
    },

    nextQuestion: async (params: {
        screen_name: string;
        selected_option?: string | string[];
        user_input?: string;
        open_ended?: string;
    }): Promise<QuestionData> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.next_question`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(params)
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        return data.message;
    },

    previousQuestion: async (screenName: string): Promise<QuestionData> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.previous_question`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ screen_name: screenName })
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        return data.message;
    },

    submitTest: async (screenName: string, email?: string): Promise<SubmitTestResult> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.submit_test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name: screenName, email })
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();

        if (typeof window !== "undefined" && email) {
            localStorage.setItem(`psychometric_completed_${email}`, "true");
        }

        return data.message;
    }
};
