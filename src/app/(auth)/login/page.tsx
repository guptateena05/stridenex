"use client";

import { useEffect, useState } from "react";
import DynamicForm from "@/components/forms/DynamicForm";
import { FormField } from "@/types/doctypes.types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AuthLayout from "../AuthLayout";
import { validateLoginForm } from "@/lib/validators";

/**
 * Onboarding completion thresholds per role.
 *
 *   student  →  flag >= 2  (2 steps)
 *   mentor   →  flag >= 3  (3 steps)
 *   industry →  flag >= 3  (3 meaningful steps)
 *   college  →  flag >= 4  (4 steps)
 *
 * This single source-of-truth is used both here (post-login routing) and
 * in each onboarding component so the thresholds are never out of sync.
 */
const ONBOARDING_COMPLETE: Record<string, number> = {
  student: 2,
  mentor: 3,
  industry: 3,
  college: 4
};

function isFullyOnboarded(role: string, flag: number): boolean {
  const threshold = ONBOARDING_COMPLETE[role] ?? 1;
  return flag >= threshold;
}

export default function LoginPage() {
  const [appName] = useState<string>("StrideNex");
  const [bgImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formValues, setFormValues] = useState<any>({});

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { isAuthenticated, login, role, isOnboarded } = useAuth();
  const router = useRouter();

  // ─── Post-login / page-load routing ──────────────────────────────────────────
  useEffect(() => {
    // Wait until all auth state is populated
    if (
      !isAuthenticated ||
      !role ||
      isOnboarded === null ||
      isOnboarded === undefined
    )
      return;

    const flag = parseInt(isOnboarded, 10);

    if (isFullyOnboarded(role, flag)) {
      // Fully onboarded → go straight to dashboard
      router.push(`/${role}/dashboard`);
    } else {
      // Not yet fully onboarded → resume the onboarding flow.
      // Each onboarding component reads `isOnboarded` from context and
      // resumes at the correct step automatically.
      router.push(`/onboarding/${role}`);
    }
  }, [isAuthenticated, role, isOnboarded, router]);

  // ─── Form fields ──────────────────────────────────────────────────────────────
  const loginFields: FormField[] = [
    {
      fieldname: "username",
      label: "Email or Username",
      fieldtype: "Data",
      required: true,
      placeholder: "student@college.edu"
    },
    {
      fieldname: "password",
      label: "Password",
      fieldtype: "Password",
      required: true,
      placeholder: "••••••••"
    }
  ];

  const handleFormChange = (data: any) => {
    setFormValues(data);
  };

  // ─── Login handler ────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const errors = validateLoginForm({
      username: formValues.username,
      password: formValues.password
    });

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BASE_URL}method/stridenex_app.api_stridenex_app.app.login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usr: formValues.username,
            pwd: formValues.password
          })
        }
      );

      const data = await response.json();

      if (data.message === "Logged In") {
        const { api_key, api_secret } = data.key_details;
        const fullName =
          data.full_name ||
          formValues.username.split("@")[0];
        const email = data.user || formValues.username;

        // ── Role resolution ────────────────────────────────────────────────
        let userRole = "student";

        if (data.roles && Array.isArray(data.roles)) {
          const lowerRoles = data.roles.map((r: string) =>
            r.toLowerCase()
          );
          if (
            lowerRoles.some((r: string) => r.includes("college"))
          ) {
            userRole = "college";
          } else if (
            lowerRoles.some((r: string) =>
              r.includes("industry")
            )
          ) {
            userRole = "industry";
          } else if (
            lowerRoles.some((r: string) => r.includes("mentor"))
          ) {
            userRole = "mentor";
          } else if (
            lowerRoles.some((r: string) =>
              r.includes("student")
            )
          ) {
            userRole = "student";
          }
        } else if (data.role) {
          const r = data.role.toLowerCase();
          if (r.includes("college") || r.includes("admin")) {
            userRole = "college";
          } else if (r.includes("industry")) {
            userRole = "industry";
          } else if (r.includes("mentor")) {
            userRole = "mentor";
          } else if (r.includes("student")) {
            userRole = "student";
          }
        }

        /**
         * Persist auth — navigation is intentionally NOT triggered here.
         * The useEffect above watches [isAuthenticated, role, isOnboarded]
         * and handles ALL routing after `login()` updates context.
         *
         * This means:
         *  • A fully-onboarded mentor (flag=3) → /mentor/dashboard
         *  • A mid-onboarding mentor (flag=1) → /onboarding/mentor  (step 2)
         *  • A brand-new mentor (flag=0) → /onboarding/mentor        (step 1)
         */
        await login(api_key, api_secret, {
          email,
          fullName,
          role: userRole,
          isOnboarded: data.is_onboarded,
          userImage: data.user_image
        });

        if (userRole === "college") {
          try {
            const { getCollegeDetails } = await import("@/services/college.services");
            const res = await getCollegeDetails(email);
            const collegeDataObj = res?.data || res?.message?.data || res?.message;
            if (collegeDataObj && typeof collegeDataObj === 'object') {
              localStorage.setItem("collegeDetails", JSON.stringify(collegeDataObj));
            }
          } catch (err) {
            console.error("Failed to pre-fetch collegeDetails on login:", err);
          }
        }

        // Do NOT call router.push here — useEffect owns all routing.
      } else {
        const msg = data.message || "Login failed";
        setError(
          typeof msg === "string" ? msg : JSON.stringify(msg)
        );
        setLoading(false);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred during login";
      setError(
        typeof msg === "string" ? msg : JSON.stringify(msg)
      );
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your skill development journey"
      alternateText="Don't have an account?"
      alternateLinkText="Create account"
      alternateLinkHref="/signup"
      appName={appName}
      bgImage={bgImage}
    >
      <div className="space-y-5">
        <DynamicForm
          fields={loginFields}
          onSubmit={() => { }}
          buttonLabel=""
          loading={loading}
          onChange={handleFormChange}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm text-center">
              {error}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={checked =>
                setRememberMe(checked as boolean)
              }
              disabled={loading}
            />
            <Label
              htmlFor="remember"
              className="text-sm text-slate-600"
            >
              Remember me
            </Label>
          </div>

          <Button
            type="button"
            variant="link"
            className="text-sm font-semibold p-0 h-auto text-accent hover:text-orange-600"
            disabled={loading}
          >
            Forgot password?
          </Button>
        </div>

        <Button
          type="button"
          variant="accent"
          className="w-full"
          loading={loading}
          disabled={loading}
          onClick={handleLogin}
        >
          Sign In
        </Button>
      </div>
    </AuthLayout>
  );
}