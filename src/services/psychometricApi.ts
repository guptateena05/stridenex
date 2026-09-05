// Frappe API base URL configuration
const getBackendUrl = () => {
    if (typeof window !== "undefined") {
        if (window.location.port === "3001" || window.location.port === "3000") {
            return "https://devstridenex.quantcloud.in";
        }
        return window.location.origin;
    }
    return "https://devstridenex.quantcloud.in";
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
        const data = await res.json();
        return data.message || [];
    },

    startNewTest: async (testType: string, email?: string): Promise<string> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.start_new_test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ test_type: testType, email })
        });
        const data = await res.json();
        return data.message;
    },

    loadQuestion: async (screenName: string): Promise<QuestionData> => {
        const res = await fetch(`${getBackendUrl()}/api/method/nexedu.api.load_question`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ screen_name: screenName })
        });
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
        const data = await res.json();

        if (typeof window !== "undefined" && email) {
            localStorage.setItem(`psychometric_completed_${email}`, "true");
        }

        return data.message;
    }
};
