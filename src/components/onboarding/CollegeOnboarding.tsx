"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import OnboardingLayout from "./OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DynamicForm from "@/components/forms/DynamicForm";
import { FormField } from "@/types/doctypes.types";
import { BASE_URL } from "@/services/api.services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Plus, Trash2, Loader2 } from "lucide-react";
import axios from "axios";
import { ContactPersonsTable } from "@/components/ContactPersonsTable";
import { validateEmail } from "@/lib/validators";
import Dropdown from "@/components/ui/Dropdown";
import {
  sendMobileOTP,
  verifyMobileOTP,
  sendEmailOTP,
  verifyEmailOTP
} from "@/services/onboarding.services";

interface CollegeOnboardingProps {
  onSubmit?: (data: any) => Promise<void>;
  onSkip?: () => void;
}

interface ContactPerson {
  title: string;
  first_name: string;
  last_name: string;
  designation: string;
  contact_no: string;
  is_admin?: boolean;
  email?: string;
}

interface Course {
  stream: string;
}

interface Option {
  value: string;
  label: string;
}

type Step = 1 | 2 | 3 | 4;

// Using BASE_URL from api.services

export default function CollegeOnboarding({
  onSubmit,
  onSkip
}: CollegeOnboardingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobileSource = searchParams.get("source") === "mobile";
  const { apiKey, apiSecret, currentUser, isOnboarded, isInitialized, updateOnboardedFlag, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [hasCreatedRecord, setHasCreatedRecord] = useState(false);
  const [createdCollegeName, setCreatedCollegeName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [designationOptions, setDesignationOptions] = useState<Option[]>([]);
  const [salutationOptions, setSalutationOptions] = useState<Option[]>([]);
  const [streamOptions, setStreamOptions] = useState<Option[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingSalutations, setLoadingSalutations] = useState(false);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [designationError, setDesignationError] = useState("");
  const [salutationError, setSalutationError] = useState("");
  const [streamError, setStreamError] = useState("");

  const [openDesignationDropdown, setOpenDesignationDropdown] = useState<number | null>(null);
  const [openStreamDropdown, setOpenStreamDropdown] = useState<number | null>(null);

  const designationDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const streamDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { title: "", first_name: "", last_name: "", designation: "", contact_no: "", is_admin: true, email: "" }
  ]);

  const [courses, setCourses] = useState<Course[]>([
    { stream: "" }
  ]);

  const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [addedCoursesTable, setAddedCoursesTable] = useState<Array<{
    id: string;
    course_type: string;
    stream: string;
    course: string;
    department: any;
  }>>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [mobileVerificationCode, setMobileVerificationCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [mobileTimer, setMobileTimer] = useState(0);

  const [formData, setFormData] = useState({  
    college_name: "",
    trust__governing_body: "",             
    year_of_establishment: "",
    intake_capacity: "",
    country: "India",
    college_code: "",
    state: "",
    university: "",
    district: "",
    college_type: "",
    tahsil: "",
    website: "",
    city: "",
    email: "",
    isActive: true,
    approvedStatus: "Pending",
    emailVerified: false,
    mobileNo: "",
    mobileVerified: false,
    gst_number: "",
    address_line_1: "",
    address_line2: "",
    pincode: ""
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      const flag = parseInt(isOnboarded || "0", 10);
      if (flag === 1) {
        setCurrentStep(2);
      } else if (flag === 2) {
        setCurrentStep(3);
        setHasCreatedRecord(true);
      } else if (flag === 3) {
        setCurrentStep(4);
        setHasCreatedRecord(true);
      } else if (flag >= 4) {
        router.push("/college/dashboard");
        return;
      }

      const userEmail = localStorage.getItem("userEmail") || currentUser || "";
      if (userEmail) {
        setFormData(prev => ({
          ...prev,
          email: userEmail,
          emailVerified: flag >= 1 ? true : prev.emailVerified,
          mobileVerified: flag >= 1 ? true : prev.mobileVerified
        }));
      }
    };

    if (isInitialized) {
      fetchInitialData();
    }
  }, [isOnboarded, isInitialized, currentUser, router]);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail") || currentUser || formData.email || "";
    if (userEmail && currentStep >= 2 && hasCreatedRecord) {
      fetchCollegeData(userEmail);
    }
  }, [currentStep, currentUser, hasCreatedRecord]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      designationDropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target as Node) && openDesignationDropdown === index) {
          setOpenDesignationDropdown(null);
        }
      });
      streamDropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target as Node) && openStreamDropdown === index) {
          setOpenStreamDropdown(null);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDesignationDropdown, openStreamDropdown]);

  useEffect(() => {
    fetchDesignations();
    fetchSalutations();
    fetchStreams();
  }, []);

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

  const handleSendEmailOTP = async () => {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, email: emailValidation.error || "Invalid email" }));
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await sendEmailOTP(formData.email);
      if (response?.message?.status === "success") {
        setSuccess(response.message.message || "OTP sent successfully");
        setEmailOtpSent(true);
        setEmailTimer(120);
      } else {
        setError(response?.message?.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await verifyEmailOTP(formData.email, emailVerificationCode);
      if (response?.message === "Email verified successfully") {
        setFormData(prev => ({ ...prev, emailVerified: true }));
        setSuccess(response.message);
      } else {
        setError(response?.message || "Invalid verification code");
      }
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMobileOTP = async () => {
    setError("");
    setSuccess("");
    if (!formData.mobileNo || formData.mobileNo.length !== 10) {
      setFieldErrors(prev => ({ ...prev, mobileNo: "Please enter a valid 10-digit mobile number" }));
      return;
    }
    setLoading(true);
    try {
      const response = await sendMobileOTP(formData.mobileNo, formData.email);
      if (response?.message === "OTP sent successfully") {
        setSuccess(response.message);
        setMobileOtpSent(true);
        setMobileTimer(120);
      } else {
        setError(response?.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMobile = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await verifyMobileOTP(formData.mobileNo, mobileVerificationCode, formData.email);
      if (response?.message === "Mobile number verified successfully") {
        setFormData(prev => ({ ...prev, mobileVerified: true }));
        setSuccess(response.message);
      } else {
        setError(response?.message || "Invalid verification code");
      }
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollegeData = async (email: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}method/stridenex_app.api_stridenex_app.college.college.get_college?email=${encodeURIComponent(email)}`
      );

      const resData = response.data?.data || response.data?.message?.data || response.data?.message || response.data;
      if (resData && (resData.college_name || resData.email)) {
        setFormData(prev => ({
          ...prev,
          college_name: resData.college_name || prev.college_name,
          trust__governing_body: resData.trust__governing_body || prev.trust__governing_body,
          year_of_establishment: resData.year_of_establishment?.toString() || prev.year_of_establishment,
          intake_capacity: resData.intake_capacity?.toString() || prev.intake_capacity,
          college_code: resData.college_code || prev.college_code,
          country: resData.country || prev.country,
          state: resData.state || prev.state,
          district: resData.district || prev.district,
          tahsil: resData.taluka || resData.tahsil || prev.tahsil,
          city: resData.city || prev.city,
          university: resData.university || prev.university,
          college_type: resData.college_type || prev.college_type,
          website: resData.website || prev.website,
          isActive: resData.is_active === 1 || resData.isActive === true || prev.isActive,
          approvedStatus: resData.approved_status || resData.approvedStatus || prev.approvedStatus,
          gst_number: resData.gst_number || prev.gst_number || "",
          address_line_1: resData.address_line_1 || resData.address_line_1 || prev.address_line_1 || "",
          address_line2: resData.address_line_2 || resData.address_line2 || prev.address_line2 || "",
          pincode: resData.pincode || prev.pincode || ""
        }));

        if (resData.contact_details && Array.isArray(resData.contact_details) && resData.contact_details.length > 0) {
          setContactPersons(resData.contact_details.map((cp: any, idx: number) => ({
            title: cp.title || "",
            first_name: cp.first_name || (idx === 0 ? (resData.user_details?.first_name || "") : ""),
            last_name: cp.last_name || (idx === 0 ? (resData.user_details?.last_name || "") : ""),
            designation: cp.designation || "",
            contact_no: cp.contact_no?.replace(/^\+91-/, '') || "",
            is_admin: cp.is_admin === 1 || cp.is_admin === true || (idx === 0 ? true : false),
            email: cp.email || (idx === 0 ? (resData.email || "") : "")
          })));
        } else {
          setContactPersons([
            {
              title: "",
              first_name: resData.user_details?.first_name || "",
              last_name: resData.user_details?.last_name || "",
              designation: "",
              contact_no: "",
              is_admin: true,
              email: resData.email || ""
            }
          ]);
        }

        if (resData.courses && Array.isArray(resData.courses) && resData.courses.length > 0) {
          setCourses(resData.courses.map((c: any) => ({
            stream: c.stream || ""
          })));

          const initialTable = resData.courses.map((c: any, index: number) => {
            const tempId = `init-${index}-${Math.random().toString(36).substring(7)}`;
            return {
              id: tempId,
              course_type: c.course_type || "",
              stream: c.stream || "",
              course: c.course || c.course_name || "",
              department: c.department ? (typeof c.department === 'string' ? c.department.split(',').map((d:string)=>d.trim()) : c.department) : []
            };
          });
          setAddedCoursesTable(initialTable);
        }
      }
    } catch (err) {
      console.error("Error fetching college data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async (doctype: string, setOptions: any, setLoading: any, setError: any) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctype })
        }
      );
      const data = await response.json();

      let options: Option[] = [];
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
        options = arrayData.map((item: any) => ({ value: item.name, label: item.name }));
      }

      setOptions(options);
    } catch (err: any) {
      console.error(`Error fetching ${doctype}:`, err);
      setError(`Failed to load ${doctype}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = () => fetchMasterData("Designation", setDesignationOptions, setLoadingDesignations, setDesignationError);
  const fetchSalutations = () => fetchMasterData("Salutation", setSalutationOptions, setLoadingSalutations, setSalutationError);
  const fetchStreams = () => fetchMasterData("Stream", setStreamOptions, setLoadingStreams, setStreamError);

  const removeContactPerson = (index: number) => {
    if (contactPersons.length > 1) {
      setContactPersons(contactPersons.filter((_, i) => i !== index));
    }
  };

  const removeCourse = (index: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index));
    }
  };

  const handleContactPersonChange = (index: number, field: keyof ContactPerson, value: string | boolean) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);

    const allFilled = updated.every(person =>
      person.title && person.first_name && person.last_name && person.designation && person.contact_no
    );

    if (allFilled && fieldErrors.contactPersons) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contactPersons;
        return newErrors;
      });
    }
  };

  const addContactPerson = () => {
    setContactPersons([...contactPersons, {
      title: "", first_name: "", last_name: "", designation: "", contact_no: "", is_admin: false, email: ""
    }]);
  };

  const handleCourseChange = (index: number, value: string) => {
    const updated = [...courses];
    updated[index] = { stream: value };
    setCourses(updated);
    if (fieldErrors.courses) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.courses;
        return newErrors;
      });
    }
  };

  const addCourse = () => {
    setCourses([...courses, { stream: "" }]);
  };

  const handleAddCourses = async () => {
    if (selectedCourses.length === 0) return;

    const newRows = [...addedCoursesTable];

    for (const courseName of selectedCourses) {
      if (newRows.some(row => row.course === courseName)) continue;

      const courseDetails = coursesList.find(c => c.name === courseName);
      if (!courseDetails) continue;

      const tempId = Math.random().toString(36).substring(7);

      const newRow = {
        id: tempId,
        course_type: courseDetails.course_type,
        stream: courseDetails.stream,
        course: courseDetails.name,
        department: []
      };

      newRows.push(newRow);
    }

    setAddedCoursesTable(newRows);
    setSelectedCourses([]);

    if (fieldErrors.courses) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.courses;
        return newErrors;
      });
    }
  };

  const handleDepartmentChange = (rowId: string, value: any) => {
    setAddedCoursesTable(prev => prev.map(row =>
      row.id === rowId ? { ...row, department: value } : row
    ));
    if (fieldErrors.courses) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.courses;
        return newErrors;
      });
    }
  };

  const handleRemoveCourseRow = (rowId: string) => {
    setAddedCoursesTable(prev => prev.filter(row => row.id !== rowId));
  };

  const toggleDesignationDropdown = (index: number) => {
    setOpenDesignationDropdown(openDesignationDropdown === index ? null : index);
  };

  const toggleStreamDropdown = (index: number) => {
    setOpenStreamDropdown(openStreamDropdown === index ? null : index);
  };

  const selectDesignation = (index: number, value: string) => {
    handleContactPersonChange(index, 'designation', value);
    setOpenDesignationDropdown(null);
  };

  const selectStream = (index: number, value: string) => {
    handleCourseChange(index, value);
    setOpenStreamDropdown(null);
  };

  const getSelectedDesignationLabel = (value: string) => {
    if (!value) return "Select Designation";
    const option = designationOptions.find(opt => opt.value === value);
    return option ? option.label : "Select Designation";
  };

  const getSelectedStreamLabel = (value: string) => {
    if (!value) return "Select Stream";
    const option = streamOptions.find(opt => opt.value === value);
    return option ? option.label : "Select Stream";
  };

  const setDesignationRef = (index: number) => (el: HTMLDivElement | null) => {
    designationDropdownRefs.current[index] = el;
  };

  const setStreamRef = (index: number) => (el: HTMLDivElement | null) => {
    streamDropdownRefs.current[index] = el;
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.emailVerified) errors.email = "Please verify your email first";
    if (!formData.mobileVerified) errors.mobileNo = "Please verify your mobile number first";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.college_name) errors.college_name = "College name is required";
    if (!formData.trust__governing_body) errors.trust__governing_body = "Trust / Governing body is required";

    if (!formData.year_of_establishment) {
      errors.year_of_establishment = "Year of establishment is required";
    } else if (!/^\d{4}$/.test(formData.year_of_establishment)) {
      errors.year_of_establishment = "Please enter a valid 4-digit year";
    }

    if (!formData.intake_capacity) {
      errors.intake_capacity = "Intake capacity is required";
    } else if (!/^\d+$/.test(formData.intake_capacity)) {
      errors.intake_capacity = "Please enter a valid number";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.college_code) errors.college_code = "College code is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.state) errors.state = "State is required";
    if (!formData.district) errors.district = "District is required";
    if (!formData.tahsil) errors.tahsil = "Taluka is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.university) errors.university = "University is required";
    if (!formData.college_type) errors.college_type = "College type is required";
    if (!formData.address_line_1?.trim()) {
      errors.address_line_1 = "Address Line 1 is required";
    }
    if (!formData.pincode) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = "Please enter a valid 6-digit pincode";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {};
    if (addedCoursesTable.length === 0) {
      errors.courses = "Please add at least one course";
    }
    const invalidContact = contactPersons.some(
      person => !person.title || !person.first_name || !person.last_name || !person.designation || !person.contact_no
    );
    if (invalidContact) errors.contactPersons = "All contact person fields are required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildUpdatePayload = () => {
    const validContactPersons = contactPersons.filter(
      person => person.title && person.first_name && person.last_name && person.designation && person.contact_no
    );
    const formattedContactPersons = validContactPersons.map(person => ({
      title: person.title,
      first_name: person.first_name,
      last_name: person.last_name,
      designation: person.designation,
      contact_no: person.contact_no.startsWith('+91-') ? person.contact_no : `+91-${person.contact_no.replace(/\D/g, '')}`,
      is_admin: person.is_admin ? 1 : 0,
      email: person.email
    }));

    const formattedCourses = addedCoursesTable.map(row => ({
      course_type: row.course_type,
      stream: row.stream,
      course: row.course,
      department: Array.isArray(row.department) ? row.department.join(",") : row.department
    }));
    const userEmail = localStorage.getItem("userEmail") || formData.email;

    return {
      college_name: formData.college_name,
      email: userEmail,
      college_code: formData.college_code || undefined,
      year_of_establishment: formData.year_of_establishment ? parseInt(formData.year_of_establishment) : undefined,
      trust__governing_body: formData.trust__governing_body,
      intake_capacity: formData.intake_capacity ? parseInt(formData.intake_capacity) : undefined,
      country: formData.country || "India",
      state: formData.state || undefined,
      district: formData.district || undefined,
      taluka: formData.tahsil || undefined,
      tahsil: formData.tahsil || undefined,
      city: formData.city || undefined,
      university: formData.university || undefined,
      college_type: formData.college_type || undefined,
      website: formData.website || undefined,
      address_line_1: formData.address_line_1 || undefined,
      address_line_2: formData.address_line2 || undefined,
      pincode: formData.pincode || undefined,
      is_active: formData.isActive ? 1 : 0,
      approved_status: formData.approvedStatus || "Pending",
      contact_details: formattedContactPersons,
      courses: formattedCourses,
      is_admin: 0
    };
  };

  const handleContinueToStep2 = () => {
    if (validateStep1()) {
      if (typeof updateOnboardedFlag === "function") {
        updateOnboardedFlag("1");
      }
      localStorage.setItem("isOnboarded", "1");
      setCurrentStep(2);
      setSuccess("");
    }
  };

  const handleContinueToStep3 = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let response;
      if (hasCreatedRecord) {
        const userEmail = localStorage.getItem("userEmail") || formData.email || "";
        const url = `${BASE_URL}method/stridenex_app.api_stridenex_app.college.college.update_college?email=${encodeURIComponent(userEmail)}`;
        const updateData = buildUpdatePayload();
        response = await axios.put(url, updateData, { headers: { 'Content-Type': 'application/json' } });
      } else {
        const payload = {
          college_name: formData.college_name,
          email: formData.email,
          college_code: formData.college_code || undefined,
          year_of_establishment: formData.year_of_establishment ? parseInt(formData.year_of_establishment) : undefined,
          trust__governing_body: formData.trust__governing_body,
          intake_capacity: formData.intake_capacity ? parseInt(formData.intake_capacity) : undefined,
          address_line_1: undefined,
          address_line_2: undefined
        };
        response = await axios.post(
          `${BASE_URL}method/stridenex_app.api_stridenex_app.college.college.create_college`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check success
      const internalStatus = response.data?.message?.status;
      const isSuccess = response.status === 200 && (
        internalStatus === 200 ||
        internalStatus === undefined ||
        internalStatus === "success" ||
        response.data?.message === "College created successfully" ||
        response.data?.message?.message === "College created successfully" ||
        response.data?.message === "College updated successfully" ||
        response.data?.message?.message === "College updated successfully"
      );

      if (isSuccess) {
        if (!hasCreatedRecord) {
          setHasCreatedRecord(true);
          const returnedName = response.data?.message?.name || response.data?.name || formData.college_name;
          setCreatedCollegeName(returnedName);
        }
        if (typeof updateOnboardedFlag === "function") {
          updateOnboardedFlag("2");
        }
        localStorage.setItem("isOnboarded", "2");
        setSuccess("Basic college information saved successfully!");
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        let errorMsg = hasCreatedRecord ? "Failed to update college. Please try again." : "Failed to create college. Please try again.";
        if (response.data?._server_messages) {
          try {
            const messages = JSON.parse(response.data._server_messages);
            const parsedMessage = JSON.parse(messages[0]);
            errorMsg = parsedMessage.message || errorMsg;
          } catch (e) {
            errorMsg = response.data?.message?.message || response.data?.message || errorMsg;
          }
        } else {
          errorMsg = response.data?.message?.message || response.data?.message || errorMsg;
        }
        setError(errorMsg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error("Error saving college data:", err);
      let errorMessage = "Error submitting college data";
      if (err?.response?.data?._server_messages) {
        try {
          const messages = JSON.parse(err.response.data._server_messages);
          const parsedMessage = JSON.parse(messages[0]);
          errorMessage = parsedMessage.message || "Validation error";
        } catch {
          errorMessage = err?.response?.data?.message || "Error submitting data";
        }
      } else {
        const nestedMessage = err?.response?.data?.message;
        if (typeof nestedMessage === 'object' && nestedMessage !== null) {
          errorMessage = nestedMessage.message || errorMessage;
        } else if (typeof nestedMessage === 'string') {
          errorMessage = nestedMessage;
        } else {
          errorMessage = err?.message || errorMessage;
        }
      }
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToStep4 = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userEmail = localStorage.getItem("userEmail") || formData.email || "";
      const url = `${BASE_URL}method/stridenex_app.api_stridenex_app.college.college.update_college?email=${encodeURIComponent(userEmail)}`;
      const updateData = buildUpdatePayload();

      const response = await axios.put(url, updateData, { headers: { 'Content-Type': 'application/json' } });

      const internalStatus = response.data?.message?.status;
      const isSuccess = response.status === 200 && (
        internalStatus === 200 ||
        internalStatus === undefined ||
        internalStatus === "success" ||
        response.data?.message === "College updated successfully" ||
        response.data?.message?.message === "College updated successfully"
      );

      if (isSuccess) {
        if (typeof updateOnboardedFlag === "function") {
          updateOnboardedFlag("3");
        }
        localStorage.setItem("isOnboarded", "3");
        setSuccess("Location and affiliation details saved successfully!");
        setCurrentStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        let errorMsg = "Failed to update college location details. Please try again.";
        if (response.data?._server_messages) {
          try {
            const messages = JSON.parse(response.data._server_messages);
            const parsedMessage = JSON.parse(messages[0]);
            errorMsg = parsedMessage.message || errorMsg;
          } catch (e) {
            errorMsg = response.data?.message?.message || response.data?.message || errorMsg;
          }
        } else {
          errorMsg = response.data?.message?.message || response.data?.message || errorMsg;
        }
        setError(errorMsg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error("Error saving college location details:", err);
      let errorMessage = "Error submitting location details";
      if (err?.response?.data?._server_messages) {
        try {
          const messages = JSON.parse(err.response.data._server_messages);
          const parsedMessage = JSON.parse(messages[0]);
          errorMessage = parsedMessage.message || "Validation error";
        } catch {
          errorMessage = err?.response?.data?.message || "Error submitting data";
        }
      } else {
        const nestedMessage = err?.response?.data?.message;
        if (typeof nestedMessage === 'object' && nestedMessage !== null) {
          errorMessage = nestedMessage.message || errorMessage;
        } else if (typeof nestedMessage === 'string') {
          errorMessage = nestedMessage;
        } else {
          errorMessage = err?.message || errorMessage;
        }
      }
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const goToStep1 = () => {
    setCurrentStep(1);
    setSuccess("");
    setError("");
  };

  const goToStep2 = () => {
    setCurrentStep(2);
    setSuccess("");
    setError("");
  };

  const goToStep3 = () => {
    setCurrentStep(3);
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep4()) {
      const firstError = Object.values(fieldErrors)[0];
      setError(firstError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userEmail = localStorage.getItem("userEmail") || formData.email || "";
      const url = `${BASE_URL}method/stridenex_app.api_stridenex_app.college.college.update_college?email=${encodeURIComponent(userEmail)}`;
      const updateData = buildUpdatePayload();

      const response = await axios.put(url, updateData, { headers: { 'Content-Type': 'application/json' } });

      const internalStatus = response.data?.message?.status;
      const isSuccess = response.status === 200 && (
        internalStatus === 200 ||
        internalStatus === undefined ||
        internalStatus === "success" ||
        response.data?.message === "College updated successfully" ||
        response.data?.message?.message === "College updated successfully"
      );

      if (isSuccess) {
        // ─── BILLING INTEGRATION STARTS HERE ─────────────────────────────────
        try {
          const billingPayload = {
            data: {
              account_type: "Organization",
              role_type: "College Base",
              company_name: formData.college_name,
              abbr: formData.college_name ? formData.college_name.substring(0, 3).toUpperCase() : "CO",
              gstin: formData.gst_number || "",
              email: userEmail,
              user_password: localStorage.getItem("userPassword") || "",
              first_name: localStorage.getItem("userFirstName") || "User",
              last_name: localStorage.getItem("userLastName") || "",
              default_currency: "INR",
              country: formData.country || "India",
              state: formData.state,
              city: formData.city,
              address_line_1: formData.address_line_1 || "Not Provided",
              address_line_2: formData.address_line2 || "",
              pincode: formData.pincode || "",
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

        setSuccess("College onboarding completed successfully!");

        setTimeout(async () => {
          const redirectUrl = isMobileSource ? "https://testwebstridenex.quantcloud.in/login" : "/login";
          await logout(redirectUrl);
        }, 1500);
      } else {
        let errorMsg = "Failed to complete college onboarding. Please try again.";
        if (response.data?._server_messages) {
          try {
            const messages = JSON.parse(response.data._server_messages);
            const parsedMessage = JSON.parse(messages[0]);
            errorMsg = parsedMessage.message || errorMsg;
          } catch (errParse) {
            errorMsg = response.data?.message?.message || response.data?.message || errorMsg;
          }
        } else {
          errorMsg = response.data?.message?.message || response.data?.message || errorMsg;
        }
        setError(errorMsg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error("Error completing college onboarding:", err);
      let errorMessage = "Error submitting onboarding details";
      if (err?.response?.data?._server_messages) {
        try {
          const messages = JSON.parse(err.response.data._server_messages);
          const parsedMessage = JSON.parse(messages[0]);
          errorMessage = parsedMessage.message || "Validation error";
        } catch {
          errorMessage = err?.response?.data?.message || "Error submitting data";
        }
      } else {
        const nestedMessage = err?.response?.data?.message;
        if (typeof nestedMessage === 'object' && nestedMessage !== null) {
          errorMessage = nestedMessage.message || errorMessage;
        } else if (typeof nestedMessage === 'string') {
          errorMessage = nestedMessage;
        } else {
          errorMessage = err?.message || errorMessage;
        }
      }
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (onSkip) {
      onSkip();
    } else {
      await logout(isMobileSource ? "https://testwebstridenex.quantcloud.in/login" : "/login");
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Verification";
      case 2: return "Basic College Information";
      case 3: return "Location & Affiliation";
      case 4: return "Contact & Courses";
      default: return "College Onboarding";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Please verify your email and mobile number.";
      case 2: return "Please provide basic information about your college.";
      case 3: return "Tell us about your college's location and affiliation.";
      case 4: return "Add contact persons and courses offered.";
      default: return "";
    }
  };

  const renderStep1 = () => {
    const emailField: FormField[] = [
      { fieldname: "email", label: "Email Address", fieldtype: "Data", required: true, placeholder: "Enter your email address", layout: "full", read_only: true }
    ];
    const mobileField: FormField[] = [
      { fieldname: "mobileNo", label: "Mobile Number", fieldtype: "Data", required: true, placeholder: "Enter 10-digit mobile number", layout: "full", maxLength: 10 }
    ];

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <DynamicForm
                fields={emailField}
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
                    setFormData(prev => ({ ...prev, email: data.email, emailVerified: false }));
                  }
                }}
              />
            </div>
            {!formData.emailVerified && !emailOtpSent && (
              <Button type="button" onClick={handleSendEmailOTP} disabled={!formData.email || emailTimer > 0} variant="accent" className="mt-7 whitespace-nowrap">
                {emailTimer > 0 ? `Resend in ${emailTimer}s` : "Send OTP"}
              </Button>
            )}
            {emailOtpSent && !formData.emailVerified && (
              <Button type="button" onClick={handleSendEmailOTP} disabled={emailTimer > 0} variant="accent" className="mt-7 whitespace-nowrap">
                {emailTimer > 0 ? `Resend in ${emailTimer}s` : "Resend OTP"}
              </Button>
            )}
          </div>
          {emailOtpSent && !formData.emailVerified && (
            <div>
              <Label htmlFor="emailOtp" className="text-sm font-medium text-slate-700">Verification Code <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 mt-1">
                <Input id="emailOtp" value={emailVerificationCode} onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" maxLength={6} className="flex-1" disabled={loading} />
                <Button type="button" onClick={handleVerifyEmail} disabled={emailVerificationCode.length !== 6 || loading} variant="accent" className="whitespace-nowrap">Verify</Button>
              </div>
            </div>
          )}
        </div>

        {formData.emailVerified && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <DynamicForm
                  fields={mobileField}
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
                      setFormData(prev => ({ ...prev, mobileNo, mobileVerified: false }));
                    }
                  }}
                />
              </div>
              {!formData.mobileVerified && !mobileOtpSent && (
                <Button type="button" onClick={handleSendMobileOTP} disabled={!formData.mobileNo || formData.mobileNo.length !== 10 || loading || mobileTimer > 0} variant="accent" className="mt-7 whitespace-nowrap">
                  {mobileTimer > 0 ? `Resend in ${mobileTimer}s` : "Send OTP"}
                </Button>
              )}
              {mobileOtpSent && !formData.mobileVerified && (
                <Button type="button" onClick={handleSendMobileOTP} disabled={loading || mobileTimer > 0} variant="accent" className="mt-7 whitespace-nowrap">
                  {mobileTimer > 0 ? `Resend in ${mobileTimer}s` : "Resend OTP"}
                </Button>
              )}
            </div>
            {mobileOtpSent && !formData.mobileVerified && (
              <div>
                <Label htmlFor="mobileOtp" className="text-sm font-medium text-slate-700">Verification Code <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 mt-1">
                  <Input id="mobileOtp" value={mobileVerificationCode} onChange={(e) => setMobileVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" maxLength={6} className="flex-1" disabled={loading} />
                  <Button type="button" onClick={handleVerifyMobile} disabled={mobileVerificationCode.length !== 6 || loading} variant="accent" className="whitespace-nowrap">Verify</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {formData.emailVerified && formData.mobileVerified && (
          <Button type="button" onClick={handleContinueToStep2} variant="accent" className="w-full">
            Continue to Basic College Information
          </Button>
        )}
      </div>
    );
  };

  const renderStep2 = () => {
    const step2Fields: FormField[] = [
      {
        fieldname: "college_name",
        label: "College Name",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter college name",
        layout: "full"
      },
      {
        fieldname: "trust__governing_body",
        label: "Trust / Governing Body",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter trust or governing body name",
        layout: "half"
      },
      {
        fieldname: "year_of_establishment",
        label: "Year of Establishment",
        fieldtype: "Int",
        required: true,
        placeholder: "YYYY",
        layout: "half",
        maxLength: 4
      },
      {
        fieldname: "intake_capacity",
        label: "Intake Capacity",
        fieldtype: "Int",
        required: true,
        placeholder: "Enter total intake capacity",
        layout: "half"
      },
      {
        fieldname: "email",
        label: "Email Address",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter college email address",
        layout: "half",
        read_only: true
      },
      {
        fieldname: "college_code",
        label: "College Code (Registration Number)",
        fieldtype: "Data",
        required: true,
        placeholder: "Enter registration number",
        layout: "full"
      },
      {
        fieldname: "gst_number",
        label: "GST Number (Optional)",
        fieldtype: "Data",
        required: false,
        placeholder: "Enter GST number",
        layout: "half"
      },
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
          onChange={(data) => {
            setFormData(prev => ({ ...prev, ...data }));
            const updatedErrors = { ...fieldErrors };
            Object.keys(data).forEach(key => delete updatedErrors[key]);
            setFieldErrors(updatedErrors);
            setError("");
          }}
        />
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={goToStep1}>Back</Button>
          <Button type="button" onClick={handleContinueToStep3} variant="accent" className="flex-1" disabled={loading}>
            Continue to Location Details
          </Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const step3Fields: FormField[] = [
      {
        fieldname: "country",
        label: "Country",
        fieldtype: "Data",
        required: true,
        placeholder: "Select Country",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: { doctype: "Country" },
        mapOptions: (data) => data.map((country: any) => ({
          value: country.name,
          label: country.name
        }))
      },
      {
        fieldname: "state",
        label: "State",
        fieldtype: "Data",
        required: true,
        placeholder: "Select State",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: { doctype: "State" },
        mapOptions: (data) => data.map((state: any) => ({
          value: state.name,
          label: state.name
        }))
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
        mapOptions: (data) => data.map((district: any) => ({
          value: district.name,
          label: district.district_name || district.name
        })),
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
        apiParams: formData.state ? {
          doctype: "Tahsil",
          fields: ["name", "tahsil_name"],
          filters: [["district", "=", formData.district]],
          order_by: "tahsil_name asc",
          limit_page_length: 1000
        } : undefined,
        mapOptions: (data) => data.map((tahsil: any) => ({
          value: tahsil.name,
          label: tahsil.name
        }))
      },
      {
        fieldname: "city",
        label: "City",
        fieldtype: "Data",
        required: true,
        placeholder: "Select City",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: formData.state ? {
          doctype: "City",
          fields: ["name", "city_name"],
          filters: [["tahsil", "=", formData.tahsil]],
          order_by: "city_name asc",
          limit_page_length: 1000
        } : undefined,
        mapOptions: (data) => data.map((city: any) => ({
          value: city.name,
          label: city.name
        }))
      },
      {
        fieldname: "university",
        label: "University",
        fieldtype: "Data",
        required: true,
        placeholder: "Select University",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: { doctype: "University" },
        mapOptions: (data) => data.map((university: any) => ({
          value: university.name,
          label: university.name
        }))
      },
      {
        fieldname: "college_type",
        label: "College Type",
        fieldtype: "Data",
        required: true,
        placeholder: "Select College Type",
        layout: "half",
        apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
        apiParams: { doctype: "College Type" },
        mapOptions: (data) => data.map((collegeType: any) => ({
          value: collegeType.name,
          label: collegeType.name
        }))
      },
      {
        fieldname: "website",
        label: "Website",
        fieldtype: "Data",
        required: false,
        placeholder: "https://www.college.edu",
        layout: "half",
        inputClassName: "font-mono text-sm"
      },
      {
        fieldname: "address_line_1",
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
      }
    ];

    return (
      <div className="space-y-4">
        <DynamicForm
          fields={step3Fields}
          onSubmit={() => { }}
          buttonLabel=""
          loading={loading}
          initialValues={formData}
          errors={fieldErrors}
          onChange={(data) => {
            setFormData(prev => ({ ...prev, ...data }));
            const updatedErrors = { ...fieldErrors };
            Object.keys(data).forEach(key => delete updatedErrors[key]);
            setFieldErrors(updatedErrors);
            setError("");
          }}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goToStep2}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleContinueToStep4}
            variant="accent"
            className="flex-1"
            disabled={loading}
          >
            Continue to Contact & Courses
          </Button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div className="space-y-6">
        <div className="relative space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Dropdown
                id="course_type"
                label="Course Type"
                placeholder="Select Course Type"
                endpoint={`${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`}
                params={{ doctype: "Course Type" }}
                value={selectedCourseTypes}
                onChange={(val) => {
                  setSelectedCourseTypes(val);
                  setSelectedCourses([]);
                }}
                multiSelect={true}
                searchable={true}
                modalTitle="Select Course Type"
              />
            </div>
            <div>
              <Dropdown
                id="stream"
                label="Stream"
                placeholder="Select Stream"
                endpoint={`${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`}
                params={{ doctype: "Stream" }}
                value={selectedStreams}
                onChange={(val) => {
                  setSelectedStreams(val);
                  setSelectedCourses([]);
                }}
                multiSelect={true}
                searchable={true}
                modalTitle="Select Stream"
              />
            </div>
            <div>
              <Dropdown
                key={`course-dropdown-${selectedCourseTypes.join(",")}-${selectedStreams.join(",")}`}
                id="course"
                label="Course"
                placeholder={selectedCourseTypes.length === 0 || selectedStreams.length === 0 ? "Select Course Type & Stream first" : "Select Course"}
                endpoint={`${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_courses_by_type`}
                params={{
                  course_type: selectedCourseTypes.join(","),
                  stream: selectedStreams.join(",")
                }}
                mapOptions={(data) => {
                  const courses = data?.data?.courses || data?.courses || data?.message?.data?.courses || [];
                  setCoursesList(courses);
                  return courses.map((c: any) => ({
                    value: c.name,
                    label: c.course_name || c.name
                  }));
                }}
                value={selectedCourses}
                onChange={setSelectedCourses}
                multiSelect={true}
                searchable={true}
                disabled={selectedCourseTypes.length === 0 || selectedStreams.length === 0}
                modalTitle="Select Course"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddCourses}
              disabled={selectedCourses.length === 0}
              variant="accent"
              className="flex items-center gap-1 text-xs px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Course
            </Button>
          </div>

          {addedCoursesTable.length > 0 && (
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">Course Type</th>
                    <th className="px-4 py-3 font-medium">Stream</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {addedCoursesTable.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.course_type || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{row.stream || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{row.course || "—"}</td>
                      <td className="px-4 py-3">
                        <Dropdown
                          id={`dept-${row.id}`}
                          placeholder="Select Department"
                          endpoint={`${BASE_URL}method/stridenex_app.stridenex_app.doctype.college_department.college_department.get_departments_by_course`}
                          params={{
                            courses: row.course
                          }}
                          mapOptions={(data) => {
                            const depts = data?.data || data?.message?.data || [];
                            return depts.map((d: any) => ({
                              value: d.name,
                              label: d.department_name || d.name
                            }));
                          }}
                          value={row.department}
                          onChange={(val) => handleDepartmentChange(row.id, val)}
                          searchable={true}
                          multiSelect={true}
                          modalTitle="Select Department"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCourseRow(row.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fieldErrors.courses && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.courses}</p>
          )}
        </div>

        <div className="relative">
          <ContactPersonsTable
            contactPersons={contactPersons}
            fieldErrors={fieldErrors}
            designationOptions={designationOptions}
            salutationOptions={salutationOptions}
            loadingDesignations={loadingDesignations}
            loadingSalutations={loadingSalutations}
            onSelectDesignation={selectDesignation}
            onPersonChange={handleContactPersonChange}
            onRemovePerson={removeContactPerson}
            onAddPerson={addContactPerson}
            getSelectedDesignationLabel={getSelectedDesignationLabel}
            onCreateCustomDesignation={async (val: string) => {
              await axios.post(`${BASE_URL}method/stridenex_app.stridenex_app.doctype.job_function.job_function.create_designation`, {
                designation_name: val
              }, {
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "Authorization": `token ${apiKey}:${apiSecret}`
                }
              });
              fetchDesignations();
            }}
          />
        </div>

        <div className="flex gap-3 pt-6">
          <Button type="button" variant="outline" onClick={goToStep3}>Back</Button>
          <Button type="submit" variant="accent" className="flex-1" loading={loading} disabled={loading} onClick={handleSubmit}>
            Complete Registration
          </Button>
        </div>
      </div>
    );
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={4}
      title={getStepTitle()}
      description={getStepDescription()}
      onSkip={handleSkip}
      showSkip={true}
    >
      {success && <Alert variant="success" className="mb-4"><AlertDescription>{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </form>
    </OnboardingLayout>
  );
}