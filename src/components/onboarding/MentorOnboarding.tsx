"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import OnboardingLayout from "./OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateEmail, validateRequired } from "@/lib/validators";
import {
  sendMobileOTP,
  verifyMobileOTP,
  sendEmailOTP,
  verifyEmailOTP
} from "@/services/onboarding.services";
import DynamicForm from "@/components/forms/DynamicForm";
import { FormField } from "@/types/doctypes.types";
import { BASE_URL } from "@/services/api.services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, X } from "lucide-react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentorOnboardingProps {
  onSubmit?: (data: any) => Promise<void>;
  onSkip?: () => void;
}

interface PlatformUrl {
  platform: string;
  url: string;
}

type Step = 1 | 2 | 3;

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Mentor onboarding is complete when isOnboarded >= MENTOR_COMPLETE_FLAG.
 * Steps:
 *   Step 1 → Contact Verification  → sets flag to 1
 *   Step 2 → Location Details      → sets flag to 2
 *   Step 3 → Professional Details  → sets flag to 3  (fully onboarded)
 */
const MENTOR_COMPLETE_FLAG = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseServerError = (responseData: any): string => {
  let errorMsg = "Action failed. Please try again.";
  if (responseData?._server_messages) {
    try {
      const messages = JSON.parse(responseData._server_messages);
      const parsedMessage = JSON.parse(messages[0]);
      errorMsg = parsedMessage.message || errorMsg;
    } catch {
      errorMsg =
        responseData?.message?.message || responseData?.message || errorMsg;
    }
  } else {
    errorMsg =
      responseData?.message?.message || responseData?.message || errorMsg;
  }
  return typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg);
};

const parseAxiosError = (err: any, fallback: string): string => {
  if (err?.response?.data?._server_messages) {
    try {
      const messages = JSON.parse(err.response.data._server_messages);
      const parsedMessage = JSON.parse(messages[0]);
      return parsedMessage.message || fallback;
    } catch {
      return err?.response?.data?.message || err?.message || fallback;
    }
  }
  const nested = err?.response?.data?.message;
  if (typeof nested === "object" && nested !== null)
    return nested.message || fallback;
  if (typeof nested === "string") return nested;
  return err?.message || fallback;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MentorOnboarding({
  onSubmit,
  onSkip
}: MentorOnboardingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobileSource = searchParams.get("source") === "mobile";
  const { isOnboarded, isInitialized, currentUser, updateOnboardedFlag, logout } = useAuth();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasCreatedRecord, setHasCreatedRecord] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Platform options ────────────────────────────────────────────────────────
  const [platformOptions, setPlatformOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [platformError, setPlatformError] = useState("");

  // ── Platform URLs list ──────────────────────────────────────────────────────
  const [platformUrls, setPlatformUrls] = useState<PlatformUrl[]>([]);
  const [openPlatformDropdown, setOpenPlatformDropdown] = useState<
    number | null
  >(null);
  const platformDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [formData, setFormData] = useState({
    email: "",
    emailVerified: false,
    mobileNo: "",
    mobileVerified: false,
    first_name: "",
    last_name: "",
    type: "",
    country: "India",
    state: "",
    district: "",
    tahsil: "",
    city: "",
    travelling_possible: "Yes",
    approved_status: "Pending",
    isActive: true,
    domain: [] as string[],
    skills: [] as string[],
    profile_description: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    terms_and_conditions: false,
    address_line1: "",
    address_line2: "",
    pincode: "",
    has_gst: false,
    gstin: ""
  });

  // ── OTP state ───────────────────────────────────────────────────────────────
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [mobileVerificationCode, setMobileVerificationCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [mobileTimer, setMobileTimer] = useState(0);

  // ── Validation errors ───────────────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION — runs once auth context is ready
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isInitialized) return;

    const flag = parseInt(isOnboarded || "0", 10);

    /**
     * ROUTING LOGIC (mirrors LoginPage useEffect exactly):
     *
     *  flag >= 3  →  fully onboarded  →  go to dashboard
     *  flag == 2  →  steps 1+2 done   →  resume at step 3
     *  flag == 1  →  step 1 done      →  resume at step 2
     *  flag == 0  →  brand new        →  stay at step 1
     *
     * When resuming at step 2 or 3 we mark email+mobile as already verified
     * so step-level guards don't block forward navigation.
     */
    if (flag >= MENTOR_COMPLETE_FLAG) {
      // Fully onboarded — should never land here; push to dashboard.
      router.push("/mentor/dashboard");
      return;
    }

    if (flag === 2) {
      setCurrentStep(3);
      setCompletedSteps(new Set([1, 2]));
      setHasCreatedRecord(true);
    } else if (flag === 1) {
      setCurrentStep(2);
      setCompletedSteps(new Set([1]));
      setHasCreatedRecord(true);
    }

    const userEmail =
      localStorage.getItem("userEmail") || currentUser || "";
    if (userEmail) {
      setFormData(prev => ({
        ...prev,
        email: userEmail,
        emailVerified: flag >= 1 ? true : prev.emailVerified,
        mobileVerified: flag >= 1 ? true : prev.mobileVerified,
        address_line1: prev.address_line1 || localStorage.getItem("userAddressLine1") || "",
        address_line2: prev.address_line2 || localStorage.getItem("userAddressLine2") || "",
        pincode: prev.pincode || localStorage.getItem("userPincode") || ""
      }));
    }
  }, [isOnboarded, isInitialized, currentUser, router]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH MENTOR DATA when user lands on step 2 or 3
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const userEmail =
      localStorage.getItem("userEmail") || currentUser || "";
    if (userEmail && currentStep >= 2) {
      fetchMentorData(userEmail);
    }
  }, [currentStep, currentUser]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH PLATFORMS on mount
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPlatforms();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // OTP COUNTDOWN TIMERS
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (emailTimer <= 0) return;
    const id = setInterval(
      () => setEmailTimer(prev => prev - 1),
      1000
    );
    return () => clearInterval(id);
  }, [emailTimer]);

  useEffect(() => {
    if (mobileTimer <= 0) return;
    const id = setInterval(
      () => setMobileTimer(prev => prev - 1),
      1000
    );
    return () => clearInterval(id);
  }, [mobileTimer]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOSE PLATFORM DROPDOWN on outside click
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      platformDropdownRefs.current.forEach((ref, index) => {
        if (
          ref &&
          !ref.contains(event.target as Node) &&
          openPlatformDropdown === index
        ) {
          setOpenPlatformDropdown(null);
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [openPlatformDropdown]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchPlatforms = async () => {
    setLoadingPlatforms(true);
    setPlatformError("");
    try {
      const response = await fetch(
        `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctype: "Platform List" })
        }
      );
      const data = await response.json();
      let options: Array<{ value: string; label: string }> = [];
      let arrayData = null;
      if (Array.isArray(data)) {
        arrayData = data;
      } else if (data && data.data) {
        if (Array.isArray(data.data)) {
          arrayData = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          arrayData = data.data.data;
        }
      } else if (data && data.message) {
        if (Array.isArray(data.message)) {
          arrayData = data.message;
        } else if (data.message.data && Array.isArray(data.message.data)) {
          arrayData = data.message.data;
        }
      }

      if (arrayData) {
        options = arrayData.map((item: any) => ({
          value: item.name,
          label: item.name
        }));
      }
      setPlatformOptions(options);
    } catch (err: any) {
      console.error("Error fetching platforms:", err);
      setPlatformError("Failed to load platforms");
    } finally {
      setLoadingPlatforms(false);
    }
  };

  const fetchMentorData = async (email: string) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}method/stridenex_app.api_stridenex_app.mentor.mentor.get_mentor_by_email`,
        { email_id: email }
      );
      if (response.data?.message) {
        const messageObj = response.data.message;
        const data = messageObj.data || messageObj;
        if (data) {
          setFormData(prev => ({
            ...prev,
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            type: data.type || "",
            country: data.country || "India",
            state: data.state || "",
            district: data.district || "",
            tahsil: data.tahsil || "",
            city: data.city || "",
            travelling_possible: data.travelling_possible || "Yes",
            domain: (data.domains || []).map((d: any) => d.domain),
            skills: (data.skills || data.mentor_skills || []).map(
              (s: any) => s.skill
            ),
            profile_description: data.profile_description || "",
            bank_name: data.bank_name || "",
            account_number: data.account_number || "",
            ifsc_code: data.ifsc_code || "",
            address_line1: prev.address_line1 || localStorage.getItem("userAddressLine1") || "",
            address_line2: prev.address_line2 || localStorage.getItem("userAddressLine2") || "",
            pincode: prev.pincode || localStorage.getItem("userPincode") || "",
            has_gst: data.has_gst === 1 || data.has_gst === true || false,
            gstin: data.gstin || ""
          }));

          if (
            data.mentor_platform_urls &&
            data.mentor_platform_urls.length > 0
          ) {
            setPlatformUrls(
              data.mentor_platform_urls.map((url: any) => ({
                platform: url.platform,
                url: url.url
              }))
            );
          }
        }
      }
    } catch (err) {
      console.error("Error fetching mentor data:", err);
      // Non-fatal — don't block the UI, just log it.
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PLATFORM URL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const addPlatformUrl = () =>
    setPlatformUrls([...platformUrls, { platform: "", url: "" }]);

  const removePlatformUrl = (index: number) =>
    setPlatformUrls(platformUrls.filter((_, i) => i !== index));

  const updatePlatformUrl = (
    index: number,
    field: keyof PlatformUrl,
    value: string
  ) => {
    const updated = [...platformUrls];
    updated[index] = { ...updated[index], [field]: value };
    setPlatformUrls(updated);
  };

  const togglePlatformDropdown = (index: number) =>
    setOpenPlatformDropdown(
      openPlatformDropdown === index ? null : index
    );

  const selectPlatform = (index: number, value: string) => {
    updatePlatformUrl(index, "platform", value);
    setOpenPlatformDropdown(null);
  };

  const setPlatformRef =
    (index: number) => (el: HTMLDivElement | null) => {
      platformDropdownRefs.current[index] = el;
    };

  // ─────────────────────────────────────────────────────────────────────────────
  // OTP HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSendEmailOTP = async () => {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setFieldErrors(prev => ({
        ...prev,
        email: emailValidation.error || "Invalid email"
      }));
      return;
    }
    setError("");
    setSuccess("");
    try {
      const response = await sendEmailOTP(formData.email);
      if (response?.message?.status === "success") {
        setSuccess(
          response.message.message || "OTP sent successfully"
        );
        setEmailOtpSent(true);
        setEmailTimer(120);
      } else {
        setError(
          response?.message?.message || "Failed to send OTP"
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message?.message ||
        "Failed to send verification code"
      );
    }
  };

  const handleVerifyEmail = async () => {
    setError("");
    setSuccess("");
    try {
      const response = await verifyEmailOTP(
        formData.email,
        emailVerificationCode
      );
      if (response?.message === "Email verified successfully") {
        setFormData(prev => ({ ...prev, emailVerified: true }));
        setSuccess(response.message);
        // Clear any stale email field error
        setFieldErrors(prev => {
          const e = { ...prev };
          delete e.email;
          return e;
        });
      } else {
        setError(
          response?.message || "Invalid verification code"
        );
      }
    } catch (err: any) {
      setError(
        err?.message || err?.response?.data?.message || "Verification failed"
      );
    }
  };

  const handleSendMobileOTP = async () => {
    setError("");
    setSuccess("");
    if (!formData.mobileNo || formData.mobileNo.length !== 10) {
      setFieldErrors(prev => ({
        ...prev,
        mobileNo:
          "Please enter a valid 10-digit mobile number"
      }));
      return;
    }
    try {
      const response = await sendMobileOTP(
        formData.mobileNo,
        formData.email
      );
      if (response?.message === "OTP sent successfully") {
        setSuccess(response.message);
        setMobileOtpSent(true);
        setMobileTimer(120);
      } else {
        setError(
          response?.message || "Failed to send OTP"
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Failed to send verification code"
      );
    }
  };

  const handleVerifyMobile = async () => {
    setError("");
    setSuccess("");
    try {
      const response = await verifyMobileOTP(
        formData.mobileNo,
        mobileVerificationCode,
        formData.email
      );
      if (
        response?.message === "Mobile number verified successfully"
      ) {
        setFormData(prev => ({ ...prev, mobileVerified: true }));
        setSuccess(response.message);
        localStorage.setItem("userMobileNo", formData.mobileNo);
        // Clear any stale mobile field error
        setFieldErrors(prev => {
          const e = { ...prev };
          delete e.mobileNo;
          return e;
        });
      } else {
        setError(
          response?.message || "Invalid verification code"
        );
      }
    } catch (err: any) {
      setError(
        err?.message || err?.response?.data?.message || "Verification failed"
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // VALIDATION
  //
  // Step 1 validation is ONLY shown when the user is a brand-new user (flag = 0).
  // If flag >= 1, step 1 is already complete and we never block on OTP again.
  // ─────────────────────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    /**
     * If the user has already completed step 1 (isOnboarded >= 1) we bypass
     * OTP validation entirely — they were verified during their first visit.
     */
    const flag = parseInt(isOnboarded || "0", 10);
    if (flag >= 1) return true;

    if (!formData.emailVerified)
      errors.email = "Please verify your email first";
    if (!formData.mobileVerified)
      errors.mobileNo =
        "Please verify your mobile number first";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.state) errors.state = "State is required";
    if (!formData.district)
      errors.district = "District is required";
    if (!formData.tahsil)
      errors.tahsil = "Taluka is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.address_line1?.trim())
      errors.address_line1 = "Address Line 1 is required";
    if (!formData.pincode) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = "Please enter a valid 6-digit pincode";
    }
    if (!formData.travelling_possible)
      errors.travelling_possible =
        "Travelling possible is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.type) errors.type = "Type is required";
    if (!formData.domain || formData.domain.length === 0)
      errors.domain =
        "Please select at least one domain";
    const invalidPlatform = platformUrls.some(
      p => !p.platform || !p.url
    );
    if (invalidPlatform)
      errors.platformUrls =
        "All platform URL fields are required";
    if (!formData.profile_description?.trim()) {
      errors.profile_description =
        "Profile description is required";
    } else {
      const wordCount = formData.profile_description
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      if (wordCount < 50)
        errors.profile_description = `Please write at least 50 words (current: ${wordCount} word${wordCount === 1 ? '' : 's'})`;
    }

    if (formData.has_gst) {
      if (!formData.gstin?.trim()) {
        errors.gstin = "GSTIN is required";
      } else if (formData.gstin.trim().length !== 15) {
        errors.gstin = "GSTIN must be exactly 15 characters long";
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstin.trim())) {
        errors.gstin = "Please enter a valid GSTIN format (e.g. 27AAAAA1111A1Z1)";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // API SUBMISSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build the shared update payload used for step 2 and step 3.
   * IMPORTANT: `terms_accepted` is intentionally OMITTED from all payloads
   * because the server's Mentor doctype does not expose that attribute and
   * sending it triggers a 500 "has no attribute 'terms_accepted'" error.
   */
  const buildUpdatePayload = (userEmail: string) => {
    const domainArray = (formData.domain || []).map(
      (domain: string) => ({ domain })
    );
    const skillsArray = (formData.skills || []).map(
      (skill: string) => ({ skill })
    );
    const validPlatformUrls = platformUrls.filter(
      p => p.platform && p.url
    );
    const platformUrlsArray = validPlatformUrls.map(p => ({
      platform: p.platform,
      url: p.url
    }));
    const cleanMobile = formData.mobileNo.replace(/\D/g, "");
    const formattedMobile =
      cleanMobile && cleanMobile.length === 10
        ? `+91-${cleanMobile}`
        : "";

    return {
      name: userEmail,
      email_id: userEmail,
      first_name:
        localStorage.getItem("userFirstName") ||
        formData.first_name ||
        "Test",
      last_name:
        localStorage.getItem("userLastName") ||
        formData.last_name ||
        "User",
      mobile_no: formattedMobile || null,
      type: formData.type || null,
      travelling_possible: formData.travelling_possible || "Yes",
      country: formData.country || "India",
      state: formData.state || null,
      district: formData.district || null,
      tahsil: formData.tahsil || null,
      city: formData.city || null,
      total_sessions: 0,
      total_hours: 0.0,
      total_earnings: 0.0,
      avg_rating: 0.0,
      bank_name: formData.bank_name?.trim() || null,
      account_number: formData.account_number?.trim() || null,
      ifsc_code: formData.ifsc_code?.trim() || null,
      profile_description:
        formData.profile_description?.trim() || null,
      doctype: "Mentor",
      mentor_platform_urls: platformUrlsArray,
      domain: domainArray,
      mentor_skills: skillsArray,
      has_gst: formData.has_gst ? 1 : 0,
      gstin: formData.has_gst ? formData.gstin?.toUpperCase()?.trim() || "" : ""
      // ⚠️  terms_accepted deliberately excluded — server throws 500
    };
  };

  /**
   * submitStepData is IDEMPOTENT — calling it multiple times for the same
   * step is safe.  The `loading` guard prevents concurrent submissions.
   */
  const submitStepData = async (step: Step) => {
    // Prevent double-submission
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userEmail =
        formData.email ||
        currentUser ||
        localStorage.getItem("userEmail") ||
        "";

      // Determine whether the mentor record already exists on the server.
      const flag = parseInt(isOnboarded || "0", 10);
      const recordExists = flag >= 1 || hasCreatedRecord;

      let endpoint: string;
      let method: "post" | "put" = "post";
      let payload: any;

      if (step === 2 && !recordExists) {
        // ── First time at step 2: CREATE the mentor record ──────────────────
        const cleanMobile = formData.mobileNo.replace(/\D/g, "");
        const formattedMobile = `+91-${cleanMobile}`;

        endpoint = `${BASE_URL}method/stridenex_app.api_stridenex_app.mentor.mentor.create_mentor`;
        method = "post";
        payload = {
          email_id: userEmail,
          first_name:
            localStorage.getItem("userFirstName") ||
            formData.first_name ||
            "Test",
          last_name:
            localStorage.getItem("userLastName") ||
            formData.last_name ||
            "User",
          mobile_no: formattedMobile,
          type: "",
          country: "India",
          state: "",
          district: "",
          tahsil: "",
          city: "",
          travelling_possible: "Yes",
          approved_status: "Pending",
          is_active: 1,
          domains: [],
          skills: [],
          mentor_platform_urls: [],
          bank_name: "",
          account_number: "",
          ifsc_code: "",
          profile_description: "",
          has_gst: formData.has_gst ? 1 : 0,
          gstin: formData.has_gst ? formData.gstin?.toUpperCase()?.trim() || "" : ""
          // ⚠️  terms_accepted deliberately excluded
        };
      } else {
        // ── Update the existing mentor record ────────────────────────────────
        endpoint = `${BASE_URL}method/stridenex_app.api_stridenex_app.mentor.mentor.update_mentor?email_id=${encodeURIComponent(userEmail)}`;
        method = "put";
        payload = buildUpdatePayload(userEmail);
      }

      const response = await axios({
        method,
        url: endpoint,
        data: payload,
        headers: { "Content-Type": "application/json" }
      });

      const internalStatus = response.data?.message?.status;
      const isSuccess =
        response.status === 200 &&
        (internalStatus === 200 ||
          internalStatus === undefined ||
          internalStatus === "success");

      if (isSuccess) {
        setCompletedSteps(prev => new Set([...prev, step]));
        if (method === "post") setHasCreatedRecord(true);

        if (step === 2) {
          if (formData.address_line1) {
            localStorage.setItem("userAddressLine1", formData.address_line1);
          }
          if (formData.address_line2) {
            localStorage.setItem("userAddressLine2", formData.address_line2);
          }
          if (formData.pincode) {
            localStorage.setItem("userPincode", formData.pincode);
          }
          if (typeof updateOnboardedFlag === "function") {
            updateOnboardedFlag("2");
          }
          localStorage.setItem("isOnboarded", "2");
          setCurrentStep(3);
          setSuccess("Step 2 saved successfully!");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (step === 3) {
          /**
           * ONBOARDING COMPLETE - NEW FLOW
           * 
           * After completing all onboarding steps:
           * 1. Update the flag to 3 in context and localStorage
           * 2. Show success message
           * 3. Logout and redirect to login page (instead of going directly to dashboard)
           * 4. User must log in again
           * 5. Login response will have isOnboarded = 3
           * 6. Login page will redirect to /mentor/dashboard
           */

          // ─── BILLING INTEGRATION STARTS HERE ─────────────────────────────────
          try {
            const billingPayload = {
              data: {
                account_type: "Individual",
                role_type: "Mentor",
                email: userEmail,
                user_password: localStorage.getItem("userPassword") || "",
                first_name: formData.first_name || localStorage.getItem("userFirstName") || "Test",
                last_name: formData.last_name || localStorage.getItem("userLastName") || "User",
                default_currency: "INR",
                country: formData.country || "India",
                state: formData.state,
                city: formData.city,
                address_line1: formData.district ? `${formData.tahsil}, ${formData.district}` : "Not Provided",
                billing_details: [{ title: "Stridenex App" }],
                has_gst: formData.has_gst ? 1 : 0,
                gstin: formData.has_gst ? formData.gstin?.toUpperCase()?.trim() || "" : ""
              }
            };

            const storedApiKey = localStorage.getItem("apiKey") || "";
            const storedApiSecret = localStorage.getItem("apiSecret") || "";
            const billingHeaders: Record<string, string> = {
              "Content-Type": "application/json"
            };
            if (storedApiKey && storedApiSecret) {
              billingHeaders["Authorization"] = `token ${storedApiKey}:${storedApiSecret}`;
            }

            const billingResponse = await axios.post(
              `${BASE_URL}method/quantbit_billing_platform.quantbit_billing_platform.doctype.billing_account_master.billing_account_master.create_billing_registration`,
              billingPayload,
              { headers: billingHeaders }
            );

            // Frappe wraps return values inside "message", so check the correct path
            const billingResult = billingResponse.data?.message || billingResponse.data;
            if (billingResult?.status === "error") {
              throw new Error(billingResult.message || "Failed to create billing account.");
            }
          } catch (billingErr: any) {
            console.error("Billing API Integration Error:", billingErr);
            let errorMsg = "Profile saved, but failed to assign the default billing package.";
            if (billingErr?.message) {
              errorMsg = billingErr.message;
            } else if (billingErr?.response?.data?.message) {
              errorMsg = typeof billingErr.response.data.message === 'string'
                ? billingErr.response.data.message
                : "Billing registration failed.";
            }
            setError(errorMsg);
            setLoading(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return; // Stop the redirect if billing fails so the user can see the error
          }
          // ─── BILLING INTEGRATION ENDS HERE ──────────────────────────────────

          setSuccess(
            "Mentor onboarding completed successfully! You will be redirected to login page."
          );

          // Wait 2 seconds for user to see success message, then logout and go to login
          setTimeout(() => {
            logout(isMobileSource ? "https://testwebstridenex.quantcloud.in/login" : "/login");
          }, 2000);
        }
      } else {
        setError(parseServerError(response.data));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setError(
        parseAxiosError(
          err,
          `Error submitting step ${step} data`
        )
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 → STEP 2 TRANSITION
  //
  // After both OTPs are verified we create the mentor record immediately
  // (same as before), but we now guard against double-submission with the
  // `loading` flag.
  // ─────────────────────────────────────────────────────────────────────────────

  const handleContinueToStep2 = async () => {
    if (!validateStep1()) return;
    if (loading) return;

    // If the record was already created (e.g. flag=1 on re-visit) just
    // advance the UI step without another API call.
    const flag = parseInt(isOnboarded || "0", 10);
    if (flag >= 1 || hasCreatedRecord) {
      setCurrentStep(2);
      setSuccess("");
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userEmail =
        formData.email ||
        currentUser ||
        localStorage.getItem("userEmail") ||
        "";
      const cleanMobile = formData.mobileNo.replace(/\D/g, "");
      const formattedMobile = `+91-${cleanMobile}`;

      const payload = {
        email_id: userEmail,
        first_name:
          localStorage.getItem("userFirstName") ||
          formData.first_name ||
          "Test",
        last_name:
          localStorage.getItem("userLastName") ||
          formData.last_name ||
          "User",
        mobile_no: formattedMobile,
        type: "",
        country: "India",
        state: "",
        district: "",
        tahsil: "",
        city: "",
        travelling_possible: "Yes",
        approved_status: "Pending",
        is_active: 1,
        domains: [],
        skills: [],
        mentor_platform_urls: [],
        bank_name: "",
        account_number: "",
        ifsc_code: "",
        profile_description: "",
        has_gst: formData.has_gst ? 1 : 0,
        gstin: formData.has_gst ? formData.gstin?.toUpperCase()?.trim() || "" : ""
        // ⚠️  terms_accepted deliberately excluded
      };

      const response = await axios.post(
        `${BASE_URL}method/stridenex_app.api_stridenex_app.mentor.mentor.create_mentor`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const internalStatus = response.data?.message?.status;
      const isSuccess =
        response.status === 200 &&
        (internalStatus === 200 ||
          internalStatus === undefined ||
          internalStatus === "success");

      if (isSuccess) {
        setHasCreatedRecord(true);
        if (typeof updateOnboardedFlag === "function") {
          updateOnboardedFlag("1");
        }
        localStorage.setItem("isOnboarded", "1");
        setSuccess(
          "Contact verified. Proceeding to location details."
        );
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(parseServerError(response.data));
      }
    } catch (err: any) {
      setError(
        parseAxiosError(
          err,
          "Error creating mentor. Please check your connection and try again."
        )
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToStep3 = () => {
    if (validateStep2()) submitStepData(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep3()) submitStepData(3);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // BACK NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────────

  const goToStep = (step: Step) => {
    setCurrentStep(step);
    setSuccess("");
    setError("");
    setFieldErrors({});
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SKIP FUNCTIONALITY
  // 
  // When user clicks "Skip for now":
  // 1. Calls logout which clears all auth state and localStorage
  // 2. Redirects to login page
  // 3. After re-login, the login page's useEffect will check isOnboarded 
  //    and redirect to the correct step based on the saved flag
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSkip = async () => {
    if (onSkip) {
      onSkip();
    } else {
      /**
       * "Skip for now" functionality:
       * 
       * 1. Call logout to clear all authentication state and localStorage
       * 2. Redirect to login page
       * 3. When user logs in again, the login page will:
       *    - Receive isOnboarded from login response
       *    - Store it in AuthContext and localStorage
       *    - Redirect to /onboarding/mentor (since flag < 3)
       *    - This component will read isOnboarded and resume at correct step
       * 
       * This ensures the skip flow works every time the user skips and logs in again.
       */
      await logout(isMobileSource ? "https://testwebstridenex.quantcloud.in/login" : "/login");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP METADATA
  // ─────────────────────────────────────────────────────────────────────────────

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Contact Verification";
      case 2:
        return "Location Details";
      case 3:
        return "Professional Details";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Please verify your email address and mobile number to get started.";
      case 2:
        return "Tell us about your location and travelling preferences.";
      case 3:
        return "Tell us about your professional background, expertise, and platform presence.";
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: STEP 1 — Contact Verification
  // ─────────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => {
    const emailFields: FormField[] = [
      {
        fieldname: "email",
        label: "Email Address",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter your email address",
        layout: "full",
        read_only: true
      }
    ];
    const mobileFields: FormField[] = [
      {
        fieldname: "mobileNo",
        label: "Mobile Number",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter 10-digit mobile number",
        layout: "full",
        maxLength: 10
      }
    ];

    return (
      <div className="space-y-6">
        {/* ── Email Section ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <DynamicForm
                fields={emailFields}
                onSubmit={() => { }}
                buttonLabel=""
                loading={loading}
                initialValues={{ email: formData.email }}
                onChange={data => {
                  setSuccess("");
                  setError("");
                  if (data.email !== formData.email) {
                    setEmailOtpSent(false);
                    setEmailVerificationCode("");
                    setFormData(prev => ({
                      ...prev,
                      email: data.email,
                      emailVerified: false,
                      mobileNo: "",
                      mobileVerified: false
                    }));
                  }
                }}
              />
            </div>
            {!formData.emailVerified && (
              <Button
                type="button"
                onClick={handleSendEmailOTP}
                disabled={
                  !formData.email ||
                  emailTimer > 0 ||
                  loading
                }
                variant="accent"
                className="mt-7 whitespace-nowrap"
              >
                {emailTimer > 0
                  ? `Resend in ${emailTimer}s`
                  : emailOtpSent
                    ? "Resend OTP"
                    : "Send OTP"}
              </Button>
            )}
          </div>

          {emailOtpSent && !formData.emailVerified && (
            <div>
              <Label
                htmlFor="emailOtp"
                className="text-sm font-medium text-slate-700"
              >
                Verification Code{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="emailOtp"
                  value={emailVerificationCode}
                  onChange={e =>
                    setEmailVerificationCode(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={
                    emailVerificationCode.length !== 6 ||
                    loading
                  }
                  variant="accent"
                  className="whitespace-nowrap"
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {formData.emailVerified && (
            <p className="text-sm text-green-600 font-medium">
              ✓ Email verified
            </p>
          )}
          {fieldErrors.email && (
            <p className="text-xs text-red-500">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* ── Mobile Section (shown only after email is verified) ─────────── */}
        {formData.emailVerified && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <DynamicForm
                  fields={mobileFields}
                  onSubmit={() => { }}
                  buttonLabel=""
                  loading={loading}
                  errors={fieldErrors}
                  initialValues={{ mobileNo: formData.mobileNo }}
                  onChange={data => {
                    setSuccess("");
                    setError("");
                    const mobileNo = (data.mobileNo || "")
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setFieldErrors(prev => {
                      const e = { ...prev };
                      delete e.mobileNo;
                      return e;
                    });
                    if (mobileNo !== formData.mobileNo) {
                      setMobileOtpSent(false);
                      setMobileVerificationCode("");
                      setFormData(prev => ({
                        ...prev,
                        mobileNo,
                        mobileVerified: false
                      }));
                    }
                  }}
                />
              </div>
              {!formData.mobileVerified && (
                <Button
                  type="button"
                  onClick={handleSendMobileOTP}
                  disabled={
                    !formData.mobileNo ||
                    formData.mobileNo.length !== 10 ||
                    loading ||
                    mobileTimer > 0
                  }
                  variant="accent"
                  className="mt-7 whitespace-nowrap"
                >
                  {mobileTimer > 0
                    ? `Resend in ${mobileTimer}s`
                    : mobileOtpSent
                      ? "Resend OTP"
                      : "Send OTP"}
                </Button>
              )}
            </div>

            {mobileOtpSent && !formData.mobileVerified && (
              <div>
                <Label
                  htmlFor="mobileOtp"
                  className="text-sm font-medium text-slate-700"
                >
                  Verification Code{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="mobileOtp"
                    value={mobileVerificationCode}
                    onChange={e =>
                      setMobileVerificationCode(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyMobile}
                    disabled={
                      mobileVerificationCode.length !== 6 ||
                      loading
                    }
                    variant="accent"
                    className="whitespace-nowrap"
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {formData.mobileVerified && (
              <p className="text-sm text-green-600 font-medium">
                ✓ Mobile verified
              </p>
            )}
            {fieldErrors.mobileNo && (
              <p className="text-xs text-red-500">
                {fieldErrors.mobileNo}
              </p>
            )}

            {formData.mobileVerified && (
              <Button
                type="button"
                onClick={handleContinueToStep2}
                variant="accent"
                className="w-full mt-6"
                loading={loading}
                disabled={loading}
              >
                Continue to Location Details
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: STEP 2 — Location Details
  // ─────────────────────────────────────────────────────────────────────────────

  const renderStep2 = () => {
    const step2Fields: FormField[] = [
      {
        fieldname: "state",
        label: "State",
        fieldtype: "Data",
        required: true,
        placeholder: "Select State",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: { doctype: "State" },
        mapOptions: data => {
          const items = data.data || data || [];
          return items.map((item: any) => ({
            value: item.name,
            label: item.name
          }));
        }
      },
      {
        fieldname: "district",
        label: "District",
        fieldtype: "Data",
        required: true,
        placeholder: "Select District",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: formData.state
          ? {
            doctype: "District",
            fields: ["name", "district_name"],
            filters: [["state", "=", formData.state]],
            order_by: "district_name asc",
            limit_page_length: 1000
          }
          : undefined,
        mapOptions: data => {
          const items = data.data || data || [];
          return items.map((item: any) => ({
            value: item.name,
            label: item.district_name || item.name
          }));
        },
        disabled: !formData.state
      },
      {
        fieldname: "tahsil",
        label: "Taluka",
        fieldtype: "Data",
        required: true,
        placeholder: "Select Taluka",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: formData.district
          ? {
            doctype: "Tahsil",
            fields: ["name", "tahsil_name"],
            filters: [
              ["district", "=", formData.district]
            ],
            order_by: "tahsil_name asc",
            limit_page_length: 1000
          }
          : undefined,
        mapOptions: data => {
          const items = data.data || data || [];
          return items.map((item: any) => ({
            value: item.name,
            label: item.tahsil_name || item.name
          }));
        },
        disabled: !formData.district
      },
      {
        fieldname: "city",
        label: "City",
        fieldtype: "Data",
        required: true,
        placeholder: "Select City",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: formData.tahsil
          ? {
            doctype: "City",
            fields: ["name", "city_name"],
            filters: [["tahsil", "=", formData.tahsil]],
            order_by: "city_name asc",
            limit_page_length: 1000
          }
          : undefined,
        mapOptions: data => {
          const items = data.data || data || [];
          return items.map((item: any) => ({
            value: item.name,
            label: item.city_name || item.name
          }));
        },
        disabled: !formData.tahsil
      },
      {
        fieldname: "address_line1",
        label: "Address Line 1",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter Address Line 1",
        layout: "full"
      },
      {
        fieldname: "address_line2",
        label: "Address Line 2 (Optional)",
        fieldtype: "Data",
        required: false,
        placeholder: "Enter Address Line 2",
        layout: "full"
      },
      {
        fieldname: "pincode",
        label: "Pincode",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter 6-digit Pincode",
        layout: "half",
        maxLength: 6
      },
      {
        fieldname: "travelling_possible",
        label: "Travelling Possible",
        fieldtype: "Select",
        required: true,
        placeholder: "Select travelling possibility",
        layout: "half",
        options: ["Yes", "No", "Maybe"]
      }
    ];

    return (
      <div className="space-y-4">
        <DynamicForm
          fields={step2Fields}
          onSubmit={() => { }}
          buttonLabel=""
          loading={loading}
          initialValues={formData}
          errors={fieldErrors}
          onChange={data => {
            setFormData(prev => ({ ...prev, ...data }));
            const updatedErrors = { ...fieldErrors };
            Object.keys(data).forEach(
              key => delete updatedErrors[key]
            );
            setFieldErrors(updatedErrors);
            setError("");
          }}
        />
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep(1)}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleContinueToStep3}
            variant="accent"
            className="flex-1"
            loading={loading}
            disabled={loading}
          >
            Continue to Professional Details
          </Button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: STEP 3 — Professional Details
  // ─────────────────────────────────────────────────────────────────────────────

  const renderStep3 = () => {
    const step3Fields: FormField[] = [
      {
        fieldname: "type",
        label: "Type",
        fieldtype: "Data",
        required: true,
        placeholder: "Select Type",
        layout: "full",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: { doctype: "Type" },
        mapOptions: data => {
          const items = data.data || data || [];
          return items.map((item: any) => ({
            value: item.name,
            label: item.name
          }));
        }
      },
      {
        fieldname: "domain",
        label: "Domain",
        fieldtype: "Data",
        required: true,
        placeholder: "Select Domain",
        layout: "full",
        multiSelect: true,
        allowCustom: true,
        customPlaceholder: "Enter custom domain name",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: { doctype: "Domain" },
        mapOptions: data => {
          const items = data.data || data || [];
          return items.map((item: any) => ({
            value: item.name,
            label: item.name || item.domain_name
          }));
        }
      },
      {
        fieldname: "skills",
        label: "Skills",
        fieldtype: "Data",
        required: false,
        placeholder: "Select skills (optional)",
        layout: "full",
        multiSelect: true,
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: {
          doctype: "Skill",
          fields: ["skill_name"],
        },
        mapOptions: (data) => {
          const items = data.data || data || [];
          return items.map((item: any) => ({
            value: item.name || item.skill_name,
            label: item.skill_name || item.name
          }));
        }
      },
      {
        fieldname: "profile_description",
        label: "Profile Description",
        fieldtype: "Text",
        required: true,
        placeholder:
          "Tell us about your expertise, experience, and what you can offer as a mentor… (minimum 50 words)",
        layout: "full",
        inputClassName: "min-h-[150px]",
        minLetters: 50
      },
      {
        fieldname: "has_gst",
        label: "Do you have a GST number?",
        fieldtype: "Check",
        required: false,
        layout: "full"
      },
      ...(formData.has_gst ? [{
        fieldname: "gstin",
        label: "GSTIN",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter 15-character GSTIN",
        layout: "half" as const,
        maxLength: 15
      }] : [])
    ];

    return (
      <div className="space-y-6">
        <DynamicForm
          fields={step3Fields}
          onSubmit={() => { }}
          buttonLabel=""
          loading={loading}
          initialValues={formData}
          errors={fieldErrors}
          onChange={data => {
            setFormData(prev => {
              const next = { ...prev, ...data };
              if (data.has_gst === false) {
                next.gstin = "";
              }
              return next;
            });
            const updatedErrors = { ...fieldErrors };
            Object.keys(data).forEach(
              key => delete updatedErrors[key]
            );
            if (data.has_gst === false) {
              delete updatedErrors.gstin;
            }
            setFieldErrors(updatedErrors);
            setError("");
          }}
        />

        {/* ── Platform URLs ──────────────────────────────────────────────── */}
        <div className="mt-6">
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Profile URLs
          </Label>

          {platformUrls.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 mb-3"
            >
              <div className="flex-1 grid grid-cols-2 gap-3">
                {/* Platform Dropdown */}
                <div
                  className="relative"
                  ref={setPlatformRef(index)}
                >
                  <div
                    onClick={() =>
                      !loadingPlatforms &&
                      togglePlatformDropdown(index)
                    }
                    className={`w-full h-9 px-3 rounded-md border ${platformError
                      ? "border-red-500"
                      : "border-slate-200"
                      } bg-white text-sm text-slate-900 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1152d4] focus:border-[#1152d4] ${loadingPlatforms
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                      }`}
                    tabIndex={0}
                  >
                    <span
                      className={`truncate ${!item.platform
                        ? "text-slate-400"
                        : "text-slate-900"
                        }`}
                    >
                      {loadingPlatforms
                        ? "Loading platforms..."
                        : item.platform || "Select Platform"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${openPlatformDropdown === index
                        ? "rotate-180"
                        : ""
                        }`}
                    />
                  </div>

                  {openPlatformDropdown === index && (
                    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg">
                      <div className="py-1">
                        {platformOptions.map(option => (
                          <div
                            key={option.value}
                            onClick={() =>
                              selectPlatform(
                                index,
                                option.value
                              )
                            }
                            className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-slate-50 transition-colors ${item.platform === option.value
                              ? "bg-[#1152d4]/5"
                              : ""
                              }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${item.platform === option.value
                                ? "border-[#1152d4]"
                                : "border-slate-300"
                                }`}
                            >
                              {item.platform ===
                                option.value && (
                                  <div className="w-2 h-2 rounded-full bg-[#1152d4]" />
                                )}
                            </div>
                            <span
                              className={`flex-1 ${item.platform === option.value
                                ? "text-[#1152d4] font-medium"
                                : "text-slate-700"
                                }`}
                            >
                              {option.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {platformError && (
                    <div className="mt-1">
                      <p className="text-xs text-red-500 inline">
                        {platformError}.{" "}
                      </p>
                      <button
                        type="button"
                        onClick={fetchPlatforms}
                        className="text-xs text-[#1152d4] underline font-medium hover:no-underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                {/* URL Input */}
                <Input
                  value={item.url}
                  onChange={e =>
                    updatePlatformUrl(index, "url", e.target.value)
                  }
                  placeholder="https://example.com/profile"
                  className="h-9 text-sm focus:ring-2 focus:ring-[#1152d4] focus:border-[#1152d4] font-mono"
                />
              </div>

              {platformUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlatformUrl(index)}
                  className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors mt-0.5"
                  title="Remove URL"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="flex justify-start mt-2">
            <Button
              type="button"
              onClick={addPlatformUrl}
              variant="outline"
              className="h-8 px-4 text-xs border-accent/20 text-accent hover:bg-accent hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Platform URL
            </Button>
          </div>

          {fieldErrors.platformUrls && (
            <p className="text-xs text-red-500 mt-2">
              {fieldErrors.platformUrls}
            </p>
          )}
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep(2)}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="accent"
            className="flex-1"
            loading={loading}
            disabled={loading}
          // onClick={handleSubmit}
          >
            Complete Registration
          </Button>
        </div>
      </div>
    );
  };


  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={3}
      title={getStepTitle()}
      description={getStepDescription()}
      onSkip={handleSkip}
      showSkip={true}
    >
      {success && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </form>
    </OnboardingLayout>
  );
}