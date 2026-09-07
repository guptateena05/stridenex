"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import OnboardingLayout from "./OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateEmail, validateRequired } from "@/lib/validators";
import {
  sendMobileOTP,
  verifyMobileOTP,
  sendEmailOTP,
  verifyEmailOTP,
  createStudent
} from "@/services/onboarding.services";
import DynamicForm from "@/components/forms/DynamicForm";
import { FormField } from "@/types/doctypes.types";
import { BASE_URL } from "@/services/api.services";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import axios from "axios";

interface OnboardingFormData {
  email: string;
  emailVerified: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  mobileNo: string;
  mobileVerified: boolean;
  firstName: string;
  lastName: string;
  state: string;
  district: string;
  college: string;
  collegeName: string;
  otherCollege: string;
  department: string;
  academicYear: string;
  dateOfBirth: string;
  stream: string;
  course: string;
  semester: string;
  current_year: string;
  courses: string | string[];
  skills: string[];
  careerInterest: string[];
  gender: string;
  resume: any;
  linkedinUrl: string;
  githubUrl: string;
  hasReferral: boolean;
  referal_code: string;
}

interface StudentOnboardingProps {
  onSubmit?: (data: any) => Promise<void>;
  onSkip?: () => void;
}

type Step = 1 | 2;

// Using BASE_URL from api.services

export default function StudentOnboarding({
  onSubmit,
  onSkip
}: StudentOnboardingProps) {
  const router = useRouter();
  const { apiKey, apiSecret, isOnboarded, currentUser, fullName, updateOnboardedFlag } = useAuth();
  const [hasCreatedRecord, setHasCreatedRecord] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [mobileVerificationCode, setMobileVerificationCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailTimer, setEmailTimer] = useState(0);
  const [mobileTimer, setMobileTimer] = useState(0);
  const fetchedFieldsRef = useRef<Set<string>>(new Set());
  const [departmentOptions, setDepartmentOptions] = useState<Array<{
    value: string;
    label: string;
    academicYears: string;
    semester: string; // Add this
  }>>([]);

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OnboardingFormData>({
    email: "",
    emailVerified: false,
    termsAccepted: false,
    privacyAccepted: false,
    mobileNo: "",
    mobileVerified: false,
    firstName: "",
    lastName: "",
    state: "",
    district: "",
    college: "",
    collegeName: "",
    otherCollege: "",
    department: "",
    academicYear: "",
    dateOfBirth: "",
    stream: "",
    course: "",
    semester: "",
    current_year: "",
    courses: "",
    skills: [],
    careerInterest: [],
    gender: "",
    resume: null,
    linkedinUrl: "",
    githubUrl: "",
    hasReferral: false,
    referal_code: ""
  });

  const OTHER_COLLEGE_VALUE = "Other";
  const isOtherCollegeSelected = formData.college === OTHER_COLLEGE_VALUE;

  useEffect(() => {
    const savedEmail = currentUser || localStorage.getItem("userEmail") || "";
    const savedMobile = localStorage.getItem("userMobileNo") || "";
    const savedFirstName = fullName ? fullName.split(' ')[0] : localStorage.getItem("userFirstName") || "";
    const savedLastName = fullName && fullName.includes(' ') ? fullName.split(' ').slice(1).join(' ') : localStorage.getItem("userLastName") || "";
    setFormData(prev => ({
      ...prev,
      email: savedEmail,
      mobileNo: prev.mobileNo || savedMobile,
      firstName: savedFirstName,
      lastName: savedLastName,
    }));
  }, [currentUser, fullName]);

  useEffect(() => {
    const flag = parseInt(isOnboarded || "0", 10);
    if (flag >= 1) {
      // Step 1 (verification) is already done — jump straight to profile form
      setCurrentStep(2);
      setFormData(prev => ({ ...prev, emailVerified: true, mobileVerified: true }));
      // If the create API was already called (flag >= 2), mark as created so
      // resubmit uses update instead of create.
      if (flag >= 2) {
        setHasCreatedRecord(true);
      }
    } else {
      setCurrentStep(1);
    }
  }, [isOnboarded]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mobileTimer > 0) {
      interval = setInterval(() => {
        setMobileTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mobileTimer]);

  // Step 1 fields
  const step1Fields: FormField[] = [
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

  // Step 2 fields
  const step2Fields: FormField[] = [
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

  // Step 3 fields with dependent department dropdown
  const step3Fields: FormField[] = [
    {
      fieldname: "state",
      label: "State",
      fieldtype: "Data",
      required: true,
      placeholder: "Select State",
      layout: "half",
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: {
        doctype: "State"
      },
      mapOptions: (data) => {
        // 'data' is already the array, so just map it directly
        return data.map((state: any) => ({
          value: state.name,
          label: state.name
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
      apiParams: formData.state ? {
        doctype: "District",
        fields: ["name", "district_name"],
        filters: [["state", "=", formData.state]],
        order_by: "district_name asc",
        limit_page_length: 1000
      } : undefined,
      mapOptions: (data) => {
        // data is the array from the response
        return data.map((district: any) => ({
          value: district.name,
          label: district.district_name || district.name
        }));
      },
      disabled: !formData.state
    },
    {
      fieldname: "college",
      label: "College",
      fieldtype: "Data",
      required: true,
      placeholder: "Select College",
      layout: "half",
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: {
        doctype: "College",
        limit_page_length: 1000
      },
      mapOptions: (data) => {
        const colleges = data.data || data || [];
        const collegeOptions = colleges.map((college: any) => ({
          value: college.name,
          label: college.college_name || college.name
        }));

        return [
          ...collegeOptions,
          { value: OTHER_COLLEGE_VALUE, label: "Other" }
        ];
      }
    },
    ...(isOtherCollegeSelected ? [{
      fieldname: "otherCollege",
      label: "College Name",
      fieldtype: "Data",
      required: true,
      placeholder: "Enter full college name",
      layout: "half" as const
    }] : []),
    {
      fieldname: "courses",
      label: "Course Type",
      fieldtype: "Data",
      required: true,
      placeholder: "Select Course Type",
      layout: "half",
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: {
        doctype: "Course Type",
        limit_page_length: 1000
      },
      mapOptions: (data) => {
        const courses = data.data || data || [];
        return courses.map((course: any) => ({
          value: course.name || course.course_type,
          label: course.course_type || course.name
        }));
      }
    },
    {
      fieldname: "stream",
      label: "Stream",
      fieldtype: "Data",
      required: true,
      placeholder: "Select Stream",
      layout: "half",
      apiEndpoint: (formData.college && formData.courses) ? `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data` : undefined,
      apiParams: (formData.college && formData.courses) ? {
        doctype: "College Program Details",
        fields: ["stream"],
        filters: [
          ...(!isOtherCollegeSelected ? [["college", "=", formData.college]] : []),
          ["course_type", "=", formData.courses]
        ],
        limit_page_length: 1000
      } : undefined,
      mapOptions: (data) => {
        const items = data.data || data || [];
        const uniqueStreams = Array.from(new Set(items.map((item: any) => item.stream))).filter(Boolean);
        return uniqueStreams.map((stream: any) => ({
          value: stream,
          label: stream
        }));
      },
      disabled: !(formData.college && formData.courses)
    },
    {
      fieldname: "course",
      label: "Course",
      fieldtype: "Data",
      required: true,
      placeholder: "Select Course",
      layout: "half",
      apiEndpoint: (formData.college && formData.courses && formData.stream) ? `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data` : undefined,
      apiParams: (formData.college && formData.courses && formData.stream) ? {
        doctype: "College Program Details",
        fields: ["course"],
        filters: [
          ...(!isOtherCollegeSelected ? [["college", "=", formData.college]] : []),
          ["course_type", "=", formData.courses],
          ["stream", "=", formData.stream]
        ],
        limit_page_length: 1000
      } : undefined,
      mapOptions: (data) => {
        const items = data.data || data || [];
        const uniqueCourses = Array.from(new Set(items.map((item: any) => item.course))).filter(Boolean);
        return uniqueCourses.map((course: any) => ({
          value: course,
          label: course
        }));
      },
      disabled: !(formData.college && formData.courses && formData.stream)
    },
    {
      fieldname: "department",
      label: "Department",
      fieldtype: "Data",
      required: true,
      placeholder: "Select department",
      layout: "half",
      apiEndpoint: (formData.college && formData.courses && formData.stream && formData.course) ? `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data` : undefined,
      apiParams: (formData.college && formData.courses && formData.stream && formData.course)
        ? isOtherCollegeSelected
          ? {
            doctype: "College Department",
            fields: ["department_name", "academic_years", "semester"],
            filters: [["course", "=", formData.course]],
            limit_page_length: 1000
          }
          : {
            doctype: "College Program Details",
            fields: ["department"],
            filters: [
              ["college", "=", formData.college],
              ["course_type", "=", formData.courses],
              ["stream", "=", formData.stream],
              ["course", "=", formData.course]
            ],
            limit_page_length: 1000
          }
        : undefined,
      mapOptions: (data) => {
        const departments = data.data || data || [];
        const deptOptions = departments.map((dept: any) => ({
          value: dept.department || dept.department_name || dept.name,
          label: dept.department || dept.department_name || dept.name,
          academicYears: dept.academic_years || "3",
          semester: dept.semester || "Semester 1"
        }));
        setDepartmentOptions(deptOptions);
        return deptOptions.map(({ value, label }: { value: string; label: string }) => ({ value, label }));
      },
      disabled: !(formData.college && formData.courses && formData.stream && formData.course)
    },

    {
      fieldname: "academicYear",
      label: "Academic Year",
      fieldtype: "Data",
      required: false,
      placeholder: "Academic years",
      layout: "half",
      read_only: true
    },


    {
      fieldname: "semester",
      label: "Semester",
      fieldtype: "Data",
      required: true,
      placeholder: "Select Semester",
      layout: "half",
      apiEndpoint: formData.department
        ? `${BASE_URL}method/stridenex_app.api_stridenex_app.student.masters.get_semester`
        : undefined,
      mapOptions: (data) => {
        const semesters = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.data)
              ? data.data.data
              : Array.isArray(data?.message?.data)
                ? data.message.data
                : [];

        // Map each semester object to { value, label } format
        return semesters.map((sem: any) => ({
          value: sem.name || sem.value || sem,
          label: sem.name || sem.label || sem
        }));
      },
      disabled: !formData.department
    },
    {
      fieldname: "current_year",
      label: "Current Year",
      fieldtype: "Select",
      required: true,
      placeholder: "Select Current Year",
      layout: "half",
      options: ["First Year", "Second Year", "Third Year", "Final Year"]
    },
    {
      fieldname: "dateOfBirth",
      label: "Date of Birth",
      fieldtype: "Date",
      required: true,
      placeholder: "DD/MM/YYYY",
      layout: "half",
      inputClassName: "uppercase"
    },
    {
      fieldname: "gender",
      label: "Gender",
      fieldtype: "Select",
      required: false,
      placeholder: "Select Gender",
      layout: "half",
      options: ["Male", "Female", "Other", "Prefer not to say"]
    },

    {
      fieldname: "skills",
      label: "Skills",
      fieldtype: "Data",
      required: false,
      placeholder: "Select skills",
      layout: "full",
      multiSelect: true, // This makes it multi-select
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
      fieldname: "careerInterest",
      label: "Career Interest",
      fieldtype: "Data",
      required: false,
      placeholder: "Select career interests",
      layout: "full",
      multiSelect: true, // This makes it multi-select
      apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
      apiParams: {
        doctype: "Student Career Interest" // Updated doctype
      },
      mapOptions: (data) => {
        const items = data.data || data || [];
        return items.map((item: any) => ({
          value: item.name || item.career_interest_name,
          label: item.career_interest_name || item.name
        }));
      }
    },

    {
      fieldname: "resume",
      label: "Resume (PDF only)",
      fieldtype: "File",
      required: false,
      placeholder: "Upload your resume (PDF)",
      layout: "full",
      accept: ".pdf",
    },
    {
      fieldname: "linkedinUrl",
      label: "LinkedIn Profile URL",
      fieldtype: "Data",
      required: false,
      placeholder: "https://linkedin.com/in/username",
      layout: "half",
      inputClassName: "font-mono text-sm"
    },
    {
      fieldname: "githubUrl",
      label: "GitHub Profile URL",
      fieldtype: "Data",
      required: false,
      placeholder: "https://github.com/username",
      layout: "half",
      inputClassName: "font-mono text-sm"
    },
    {
      fieldname: "hasReferral",
      label: "Are you using any referral code?",
      fieldtype: "Check",
      required: false,
      layout: "full"
    },
    ...(formData.hasReferral ? [{
      fieldname: "referal_code",
      label: "Referral Code",
      fieldtype: "Data",
      required: true,
      placeholder: "Enter referral code",
      layout: "half" as const
    }] : [])
  ];

  // ============ STEP 1: EMAIL VERIFICATION ============
  const handleSendEmailOTP = async () => {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setFieldErrors(prev => ({
        ...prev,
        email: emailValidation.error || "Invalid email"
      }));
      return;
    }

    // setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await sendEmailOTP(formData.email);

      if (response?.message?.status === "success") {
        setSuccess(response.message.message || "OTP sent successfully");
        setEmailOtpSent(true);
        setEmailTimer(120); // Start 2 minute timer
      } else {
        setError(response?.message?.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("Error sending email OTP:", err);
      setError(err?.response?.data?.message?.message || "Failed to send verification code");
    } finally {
      // setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    // setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await verifyEmailOTP(formData.email, emailVerificationCode);

      if (response?.message === "Email verified successfully") {
        setFormData(prev => ({ ...prev, emailVerified: true }));
        setSuccess(response.message);
        setError("");
      } else {
        setError(response?.message || "Invalid verification code");
      }
    } catch (err: any) {
      console.error("Error verifying email OTP:", err);
      const errorMessage = err?.message || err?.response?.data?.message || "Verification failed";
      setError(errorMessage);
    } finally {
      // setLoading(false);
    }
  };

  // ============ STEP 2: MOBILE VERIFICATION ============
  const handleSendMobileOTP = async () => {
    // Clear previous messages
    setError("");
    setSuccess("");

    // Check if mobile number is exactly 10 digits
    if (!formData.mobileNo || formData.mobileNo.length !== 10) {
      setFieldErrors(prev => ({
        ...prev,
        mobileNo: "Please enter a valid 10-digit mobile number"
      }));
      return;
    }

    // setLoading(true);
    setError("");

    try {
      const response = await sendMobileOTP(formData.mobileNo, formData.email);

      if (response?.message === "OTP sent successfully") {
        setSuccess(response.message);
        setMobileOtpSent(true);
        setMobileTimer(120); // Start 2 minute timer
        if (response.data) {}
      } else {
        setError(response?.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("Error sending mobile OTP:", err);
      setError(err?.response?.data?.message || "Failed to send verification code");
    } finally {
      // setLoading(false);
    }
  };

  const handleVerifyMobile = async () => {
    // setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await verifyMobileOTP(formData.mobileNo, mobileVerificationCode, formData.email);

      if (response?.message === "Mobile number verified successfully") {
        setFormData(prev => ({ ...prev, mobileVerified: true }));
        setSuccess(response.message);
        localStorage.setItem("userMobileNo", formData.mobileNo);
        setError("");
      } else {
        setError(response?.message || "Invalid verification code");
      }
    } catch (err: any) {
      console.error("Error verifying mobile OTP:", err);
      setError(err?.message || err?.response?.data?.message || "Verification failed");
    } finally {
      // setLoading(false);
    }
  };

  // ============ STEP VALIDATIONS ============
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.emailVerified) {
      errors.email = "Please verify your email first";
    }
    if (!formData.mobileVerified) {
      errors.mobileNo = "Please verify your mobile number first";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueToStep2 = () => {
    if (validateStep1()) {
      // Persist progress so page refresh returns to step 2, not back to OTP screen
      if (typeof updateOnboardedFlag === "function") {
        updateOnboardedFlag("1");
      }
      setCurrentStep(2);
      setSuccess("");
      setFieldErrors({});
    }
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.mobileVerified) {
      errors.mobileNo = "Please verify your mobile number first";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // const handleContinueToStep3 = () => {
  //   if (validateStep2()) {
  //     setCurrentStep(3);
  //     setSuccess("");
  //     setMobileVerificationCode("");
  //     setMobileOtpSent(false);
  //     setFieldErrors({});
  //   }
  // };

  const validateStep3 = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    const stateValidation = validateRequired(formData.state, "State");
    if (!stateValidation.isValid) {
      errors.state = stateValidation.error || "State is required";
    }

    const districtValidation = validateRequired(formData.district, "District");
    if (!districtValidation.isValid) {
      errors.district = districtValidation.error || "District is required";
    }

    const collegeValidation = validateRequired(formData.college, "College");
    if (!collegeValidation.isValid) {
      errors.college = collegeValidation.error || "College is required";
    }

    if (isOtherCollegeSelected) {
      const otherCollegeValidation = validateRequired(formData.otherCollege, "College name");
      if (!otherCollegeValidation.isValid) {
        errors.otherCollege = otherCollegeValidation.error || "College name is required";
      }
    }

    const departmentValidation = validateRequired(formData.department, "Department");
    if (!departmentValidation.isValid) {
      errors.department = departmentValidation.error || "Department is required";
    }
    const streamValidation = validateRequired(formData.stream, "Stream");
    if (!streamValidation.isValid) {
      errors.stream = streamValidation.error || "Stream is required";
    }

    const courseValidation = validateRequired(formData.course, "Course");
    if (!courseValidation.isValid) {
      errors.course = courseValidation.error || "Course is required";
    }

    const semesterValidation = validateRequired(formData.semester, "Semester");
    if (!semesterValidation.isValid) {
      errors.semester = semesterValidation.error || "Semester is required";
    }

    const currentYearValidation = validateRequired(formData.current_year, "Current Year");
    if (!currentYearValidation.isValid) {
      errors.current_year = currentYearValidation.error || "Current Year is required";
    }

    const dobValidation = validateRequired(formData.dateOfBirth, "Date of birth");
    if (!dobValidation.isValid) {
      errors.dateOfBirth = dobValidation.error || "Date of birth is required";
    }

    // Check if course type is selected
    if (!formData.courses) {
      errors.courses = "Please select a course type";
    }

    // Check if at least one skill is selected
    if (formData.skills.length === 0) {
      errors.skills = "Please select at least one skill";
    }

    // Check if at least one career interest is selected
    if (formData.careerInterest.length === 0) {
      errors.careerInterest = "Please select at least one career interest";
    }

    if (formData.hasReferral && !formData.referal_code) {
      errors.referal_code = "Referral code is required when checkbox is checked";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateStep3();

    // If there are validation errors, show the first one and return
    if (Object.keys(validationErrors).length > 0) {
      // Set field errors to show under each field
      setFieldErrors(validationErrors);

      // Scroll to the top to show the error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Guard: if student record was already created (detected on reload via isOnboarded >= 2),
    // skip the create call and just redirect to login.
    if (hasCreatedRecord) {
      localStorage.clear();
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError(""); // Clear any previous errors
    setSuccess(""); // Clear any previous success messages
    setFieldErrors({}); // Clear field errors

    try {
      // Format mobile number with country code
      const mobileVal = formData.mobileNo || localStorage.getItem("userMobileNo") || "";
      const formattedMobile = mobileVal ? `+91-${mobileVal}` : "";

      // Format courses type as array of objects
      const coursesTypeArray = typeof formData.courses === "string" 
        ? (formData.courses ? [{ course_type: formData.courses }] : [])
        : Array.isArray(formData.courses)
          ? formData.courses.map((course: string) => ({ course_type: course }))
          : [];

      // Format skills as array of objects
      const skillsArray = (formData.skills || []).map((skill: string) => ({
        skill: skill
      }));

      // Format career interests as array of objects
      const careerInterestArray = (formData.careerInterest || []).map((interest: string) => ({
        career_interest: interest
      }));

      // academicYear is already a valid label (e.g. "Forth Year") — use as-is
      const academicYearValue = formData.academicYear || "First Year";

      const payload = {
        first_name: localStorage.getItem("userFirstName") || formData.firstName || "Test",
        last_name: localStorage.getItem("userLastName") || formData.lastName || "User",
        mobile_no: formattedMobile,
        email_id: localStorage.getItem("userEmail") || formData.email || "",
        stream: formData.stream || "Engineering",
        courses_type: coursesTypeArray.length > 0 ? coursesTypeArray : [{ course_type: "PG" }],
        college: isOtherCollegeSelected ? "" : (formData.college || "DRK"),
        other_college: isOtherCollegeSelected ? formData.otherCollege.trim() : "",
        course: formData.course || "BA",
        department: formData.department || "Dispatch",
        academic_year: academicYearValue,
        semester: formData.semester || "1",
        current_year: formData.current_year || "",
        date_of_birth: formData.dateOfBirth || new Date().toISOString().split('T')[0],
        skill: skillsArray.length > 0 ? skillsArray : [{ skill: "Creativity & innovation" }],
        career_interest: careerInterestArray.length > 0 ? careerInterestArray : [{ career_interest: "Biotechnology / Genetics" }],
        github: formData.githubUrl || "",
        linkedin: formData.linkedinUrl || "",
        resume: formData.resume || null,
        referal_code: formData.hasReferral ? (formData.referal_code || "") : ""
      };

      // Call the createStudent service
      const responseData = await createStudent(payload);

      // Strict check: responseData status or internal message status
      const internalStatus = responseData?.message?.status;
      const isSuccess = (responseData?.status === 200 || internalStatus === 200 || internalStatus === "success" || responseData?.message === "Student registered successfully");

      if (isSuccess && internalStatus !== 500) {
        // ─── BILLING INTEGRATION STARTS HERE ─────────────────────────────────
        try {
          const userEmail = localStorage.getItem("userEmail") || formData.email || "";
          const billingPayload = {
            data: {
              account_type: "Individual",
              role_type: "Student Base",
              email: userEmail,
              user_password: localStorage.getItem("userPassword") || "",
              first_name: formData.firstName || localStorage.getItem("userFirstName") || "Test",
              last_name: formData.lastName || localStorage.getItem("userLastName") || "User",
              default_currency: "INR",
              country: "India",
              billing_details: [{ title: "Stridenex App" }]
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

        // Set success message (this will show in green Alert)
        setSuccess(typeof responseData?.message === 'string' ? responseData.message : "Student registered successfully!");

        // Clear onboarding-specific localStorage items
        localStorage.clear();

        // Clear any errors
        setError("");
        setFieldErrors({});

        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        // Handle error response - this will show in red Alert
        let errorMsg = "Registration failed. Please try again.";

        if (responseData?._server_messages) {
          try {
            const messages = JSON.parse(responseData._server_messages);
            const parsedMessage = JSON.parse(messages[0]);
            errorMsg = parsedMessage.message || errorMsg;
          } catch (e) {
            errorMsg = responseData?.message?.message || responseData?.message || errorMsg;
          }
        } else {
          errorMsg = responseData?.message?.message || responseData?.message || responseData?.error || errorMsg;
        }

        setError(errorMsg);
      }
    } catch (err: any) {
      console.error("Error submitting onboarding data:", err);

      let errorMessage = "An error occurred during registration";

      if (err?.response?.data?._server_messages) {
        try {
          const messages = JSON.parse(err.response.data._server_messages);
          const parsedMessage = JSON.parse(messages[0]);
          errorMessage = parsedMessage.message || errorMessage;
        } catch (parseError) {
          errorMessage = err?.response?.data?.message || err?.message || errorMessage;
        }
      } else {
        // Extract precise message if available
        const nestedMessage = err?.response?.data?.message;
        if (typeof nestedMessage === 'object' && nestedMessage !== null) {
          errorMessage = nestedMessage.message || errorMessage;
        } else if (typeof nestedMessage === 'string') {
          errorMessage = nestedMessage;
        } else {
          errorMessage = err?.response?.data?.error || err?.message || errorMessage;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const goToStep1 = () => {
    setCurrentStep(1);
    setSuccess("");
    setError("");
    setFieldErrors({});
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Contact Verification";
      case 2: return "Complete your profile";
      default: return "Build your student profile";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Please verify your email address and mobile number to get started.";
      case 2: return "Tell us about your academic background.";
      default: return "";
    }
  };

  // ============ RENDER FUNCTIONS ============
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <DynamicForm
              fields={step1Fields}
              onSubmit={() => { }}
              buttonLabel=""
              loading={loading}
              initialValues={{ email: formData.email }}
              onChange={(data) => {
                setSuccess('');
                setError('');
                if (data.email !== formData.email) {
                  setEmailOtpSent(false);
                  setEmailVerificationCode('');
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

          {!formData.emailVerified && !emailOtpSent && (
            <Button
              type="button"
              onClick={handleSendEmailOTP}
              disabled={!formData.email || emailTimer > 0}
              variant="accent"
              className="mt-7 whitespace-nowrap"
            >
              {emailTimer > 0 ? `Resend in ${emailTimer}s` : "Send OTP"}
            </Button>
          )}

          {emailOtpSent && !formData.emailVerified && (
            <Button
              type="button"
              onClick={handleSendEmailOTP}
              disabled={emailTimer > 0}
              variant="accent"
              className="mt-7 whitespace-nowrap"
            >
              {emailTimer > 0 ? `Resend in ${emailTimer}s` : "Resend OTP"}
            </Button>
          )}
        </div>

        {emailOtpSent && !formData.emailVerified && (
          <div>
            <Label htmlFor="emailOtp" className="text-sm font-medium text-slate-700">
              Verification Code <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="emailOtp"
                value={emailVerificationCode}
                onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="flex-1"
                disabled={loading}
              />
              <Button
                type="button"
                onClick={handleVerifyEmail}
                disabled={emailVerificationCode.length !== 6 || loading}
                variant="accent"
                className="whitespace-nowrap"
              >
                Verify
              </Button>
            </div>
          </div>
        )}
      </div>

      {formData.emailVerified && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <DynamicForm
                fields={step2Fields}
                onSubmit={() => { }}
                buttonLabel=""
                loading={loading}
                errors={fieldErrors}
                onChange={(data) => {
                  setSuccess("");
                  setError("");

                  let mobileNo = data.mobileNo || "";
                  mobileNo = mobileNo.replace(/\D/g, '').slice(0, 10);

                  setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.mobileNo;
                    return newErrors;
                  });

                  if (mobileNo !== formData.mobileNo) {
                    setMobileOtpSent(false);
                    setMobileVerificationCode('');
                    setFormData(prev => ({
                      ...prev,
                      mobileNo,
                      mobileVerified: false
                    }));
                  }
                }}
              />
            </div>

            {!formData.mobileVerified && !mobileOtpSent && (
              <Button
                type="button"
                onClick={handleSendMobileOTP}
                disabled={!formData.mobileNo || formData.mobileNo.length !== 10 || loading || mobileTimer > 0}
                variant="accent"
                className="mt-7 whitespace-nowrap"
              >
                {mobileTimer > 0 ? `Resend in ${mobileTimer}s` : "Send OTP"}
              </Button>
            )}

            {mobileOtpSent && !formData.mobileVerified && (
              <Button
                type="button"
                onClick={handleSendMobileOTP}
                disabled={loading || mobileTimer > 0}
                variant="accent"
                className="mt-7 whitespace-nowrap"
              >
                {mobileTimer > 0 ? `Resend in ${mobileTimer}s` : "Resend OTP"}
              </Button>
            )}
          </div>

          {mobileOtpSent && !formData.mobileVerified && (
            <div>
              <Label htmlFor="mobileOtp" className="text-sm font-medium text-slate-700">
                Verification Code <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="mobileOtp"
                  value={mobileVerificationCode}
                  onChange={(e) => setMobileVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={handleVerifyMobile}
                  disabled={mobileVerificationCode.length !== 6 || loading}
                  variant="accent"
                  className="whitespace-nowrap"
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {formData.mobileVerified && (
            <Button
              type="button"
              onClick={handleContinueToStep2}
              variant="accent"
              className="w-full mt-6"
            >
              Continue to Profile
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    // Helper function to update form data
    const updateFormData = (newData: any, resetFields: string[] = []) => {
      setFormData(prev => {
        // Create base update with all fields from newData
        const baseUpdate = {
          state: newData.state ?? prev.state,
          district: newData.district ?? prev.district,
          college: newData.college ?? prev.college,
          otherCollege: newData.otherCollege ?? prev.otherCollege,
          department: newData.department ?? prev.department,
          academicYear: newData.academicYear ?? prev.academicYear,
          stream: newData.stream ?? prev.stream,
          course: newData.course ?? prev.course,
          semester: newData.semester ?? prev.semester,
          dateOfBirth: newData.dateOfBirth ?? prev.dateOfBirth,
          courses: newData.courses ?? prev.courses,
          skills: newData.skills ?? prev.skills,
          careerInterest: newData.careerInterest ?? prev.careerInterest,
          gender: newData.gender ?? prev.gender,
          current_year: newData.current_year ?? prev.current_year,
          resume: newData.resume ?? prev.resume,
          linkedinUrl: newData.linkedinUrl ?? prev.linkedinUrl,
          githubUrl: newData.githubUrl ?? prev.githubUrl,
          hasReferral: newData.hasReferral ?? prev.hasReferral,
          referal_code: newData.hasReferral === false ? "" : (newData.referal_code ?? prev.referal_code)
        };

        // Reset specific fields to empty strings
        const resetValues = resetFields.reduce((acc, field) => {
          acc[field] = "";
          return acc;
        }, {} as Record<string, any>);

        return {
          ...prev,
          ...baseUpdate,
          ...resetValues
        };
      });
    };

    return (
      <div className="space-y-4">
        <DynamicForm
          fields={step3Fields}
          onSubmit={() => { }}
          buttonLabel=""
          loading={loading}
          initialValues={{
            state: formData.state,
            district: formData.district,
            college: formData.college,
            otherCollege: formData.otherCollege,
            department: formData.department,
            academicYear: formData.academicYear,
            stream: formData.stream,
            course: formData.course,
            semester: formData.semester,
            dateOfBirth: formData.dateOfBirth,
            courses: formData.courses,
            skills: formData.skills,
            careerInterest: formData.careerInterest,
            gender: formData.gender,
            current_year: formData.current_year,
            resume: formData.resume,
            linkedinUrl: formData.linkedinUrl,
            githubUrl: formData.githubUrl,
            hasReferral: formData.hasReferral,
            referal_code: formData.referal_code
          }}
          errors={fieldErrors}
          onChange={(data) => {
            // Determine which field changed
            const changedField = Object.keys(data).find(
              key => data[key] !== formData[key as keyof typeof formData]
            );

            if (!changedField) return;

            // Define field dependencies and what should reset when they change
            const fieldDependencies: Record<string, string[]> = {
              state: ["district", "college", "otherCollege", "courses", "stream", "course", "department", "academicYear", "semester"],
              district: ["college", "otherCollege", "courses", "stream", "course", "department", "academicYear", "semester"],
              college: ["otherCollege", "courses", "stream", "course", "department", "academicYear", "semester"],
              courses: ["stream", "course", "department", "academicYear", "semester"],
              stream: ["course", "department", "academicYear", "semester"],
              course: ["department", "semester"],
              department: ["semester"]
            };

            // Fields that need their errors cleared when parent changes
            const errorDependencies: Record<string, string[]> = {
              state: ["district", "college", "otherCollege", "courses", "stream", "course", "department", "semester"],
              district: ["college", "otherCollege", "courses", "stream", "course", "department", "semester"],
              college: ["otherCollege", "courses", "stream", "course", "department", "semester"],
              courses: ["stream", "course", "department", "semester"],
              stream: ["course", "department", "semester"],
              course: ["department", "semester"],
              department: ["semester"]
            };

            // Get fields to reset
            const fieldsToReset = fieldDependencies[changedField] || [];

            // Update form data with resets
            updateFormData(data, fieldsToReset);

            // Clear errors for changed field and its dependencies
            setFieldErrors(prev => {
              const newErrors = { ...prev };

              // Clear error for the changed field
              delete newErrors[changedField];

              // Clear errors for dependent fields
              if (errorDependencies[changedField]) {
                errorDependencies[changedField].forEach(field => {
                  delete newErrors[field];
                });
              }

              return newErrors;
            });

            // Clear fetched fields ref for dependencies
            if (["state", "district", "college", "courses", "stream", "course"].includes(changedField)) {
              fetchedFieldsRef.current.delete('district');
              fetchedFieldsRef.current.delete('college');
              fetchedFieldsRef.current.delete('courses');
              fetchedFieldsRef.current.delete('stream');
              fetchedFieldsRef.current.delete('course');
              fetchedFieldsRef.current.delete('department');
              fetchedFieldsRef.current.delete('semester');
            } else if (changedField === "department") {
              fetchedFieldsRef.current.delete('semester');
            }

            // Handle special case for department change
            if (changedField === "department" && data.department) {
              const selectedDept = departmentOptions.find(
                dept => dept.value === data.department
              );

              if (selectedDept) {
                // academicYears is already a label like "Forth Year" — use it directly
                const academicYearValue = selectedDept.academicYears;

                // Update academic year separately
                setFormData(prev => ({
                  ...prev,
                  academicYear: academicYearValue
                }));
              }
            }

            // Update skills state if needed
            if (data.skills) {
              setSkills(data.skills);
            }
          }}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(1)}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="accent"
            className="flex-1"
            loading={loading}
            disabled={loading}
            onClick={handleSubmit}
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
      totalSteps={2}
      title={getStepTitle()}
      description={getStepDescription()}
      onSkip={handleSkip}
      showSkip={true}
    >
      {/* Success Message */}
      {success && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </form>
    </OnboardingLayout>
  );
}
