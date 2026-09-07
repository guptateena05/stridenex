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
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { ContactPersonsTable } from "@/components/ContactPersonsTable";
import { validateEmail } from "@/lib/validators";
import {
    sendMobileOTP,
    verifyMobileOTP,
    sendEmailOTP,
    verifyEmailOTP
} from "@/services/onboarding.services";

interface IndustryOnboardingProps {
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

interface Option {
    value: string;
    label: string;
}

type Step = 1 | 2 | 3 | 4;

// Using BASE_URL from api.services

export default function IndustryOnboarding({
    onSubmit,
    onSkip
}: IndustryOnboardingProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobileSource = searchParams.get("source") === "mobile";
    const { apiKey, apiSecret, isOnboarded, isInitialized, currentUser, updateOnboardedFlag } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [hasCreatedRecord, setHasCreatedRecord] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [businessTypeOptions, setBusinessTypeOptions] = useState<Option[]>([]);
    const [industrySectorOptions, setIndustrySectorOptions] = useState<Option[]>([]);
    const [jobFunctionOptions, setJobFunctionOptions] = useState<Option[]>([]);
    const [designationOptions, setDesignationOptions] = useState<Option[]>([]);
    const [salutationOptions, setSalutationOptions] = useState<Option[]>([]);

    const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
    const [loadingIndustrySectors, setLoadingIndustrySectors] = useState(false);
    const [loadingJobFunctions, setLoadingJobFunctions] = useState(false);
    const [loadingDesignations, setLoadingDesignations] = useState(false);
    const [loadingSalutations, setLoadingSalutations] = useState(false);

    const [businessTypeError, setBusinessTypeError] = useState("");
    const [industrySectorError, setIndustrySectorError] = useState("");
    const [jobFunctionError, setJobFunctionError] = useState("");
    const [designationError, setDesignationError] = useState("");
    const [salutationError, setSalutationError] = useState("");

    const [openDesignationDropdown, setOpenDesignationDropdown] = useState<number | null>(null);
    const designationDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
        { title: "", first_name: "", last_name: "", designation: "", contact_no: "", is_admin: true, email: "" }
    ]);

    const [emailVerificationCode, setEmailVerificationCode] = useState("");
    const [mobileVerificationCode, setMobileVerificationCode] = useState("");
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [mobileOtpSent, setMobileOtpSent] = useState(false);
    const [emailTimer, setEmailTimer] = useState(0);
    const [mobileTimer, setMobileTimer] = useState(0);

    const [formData, setFormData] = useState({
        company_name: "",
        business_type: "",
        gst_number: "",
        industry_sector: "",
        employee_head_count: "",
        internship_per_year: "",
        job_function: [],
        country: "India",
        state: "",
        district: "",
        tahsil: "",
        city: "",
        turn_over_in_cr: "",
        company_website: "",
        average_fresher_recruited_per_year: "",
        email: "",
        emailVerified: false,
        mobileNo: "",
        mobileVerified: false,
        address_line_1: "",
        address_line2: "",
        pincode: ""
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const userEmail = localStorage.getItem("userEmail") || currentUser || "";
            if (!userEmail) return;

            // Determine initial step based on isOnboarded flag
            const flag = parseInt(isOnboarded || "0");
            if (flag === 1) {
                setCurrentStep(2);
                setCompletedSteps(new Set([1]));
                // Mark email+mobile as already verified so step-level guards don't block
                setFormData(prev => ({ ...prev, email: userEmail, emailVerified: true, mobileVerified: true }));
            } else if (flag === 2) {
                setCurrentStep(3);
                setCompletedSteps(new Set([1, 2]));
                setFormData(prev => ({ ...prev, email: userEmail, emailVerified: true, mobileVerified: true }));
                setHasCreatedRecord(true);
            } else if (flag >= 3) {
                router.push("/industry/dashboard");
                return;
            } else {
                // Always set the email in formData
                setFormData(prev => ({
                    ...prev,
                    email: userEmail
                }));
            }
        };

        if (isInitialized) {
            fetchInitialData();
        }
    }, [isOnboarded, isInitialized, currentUser, router]);

    // Fetch industry data whenever the user lands on step 2, 3, or 4
    useEffect(() => {
        const userEmail = localStorage.getItem("userEmail") || currentUser || "";
        if (userEmail && currentStep >= 2) {
            fetchIndustryData(userEmail);
        }
        if (userEmail && currentStep === 4) {
            fetchUserDetails(userEmail);
        }
    }, [currentStep, currentUser]);

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

    const fetchIndustryData = async (email: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}method/stridenex_app.api_stridenex_app.industry.industry.get_industry_by_name?email=${email}`);
            if (response.data?.message) {
                const messageObj = response.data.message;
                const data = messageObj.data || messageObj; // Handle both direct and nested data

                if (data) {
                    // Map data to formData
                    setFormData(prev => ({
                        ...prev,
                        company_name: data.company_name || "",
                        business_type: data.business_type || data.other_business_type || "",
                        gst_number: data.gst_number || "",
                        industry_sector: data.industry_sector || data.other_industry_sector || "",
                        employee_head_count: data.employee_head_count?.toString() || "",
                        internship_per_year: data.internship_per_year?.toString() || "",
                        average_fresher_recruited_per_year: data.average_fresher_recruited_per_year?.toString() || "",
                        country: data.country || "India",
                        state: data.state || "",
                        district: data.district || "",
                        tahsil: data.tahsil || "", // Key matches the response (tahsil)
                        city: data.city || "",
                        turn_over_in_cr: data.turn_over_in_cr?.toString() || "",
                        company_website: data.company_website || "",
                        address_line_1: data.address_line_1 || data.address_line_1 || "",
                        address_line2: data.address_line_2 || data.address_line2 || "",
                        pincode: data.pincode || "",
                        job_function: (data.job_functions || data.job_function || []).map((jf: any) => jf.job_function) // Key is singular job_function
                    }));

                    // Map contact persons
                    if (data.contact_details && data.contact_details.length > 0) {
                        setContactPersons(data.contact_details.map((cp: any, index: number) => ({
                            title: cp.title || "",
                            first_name: cp.first_name || "",
                            last_name: cp.last_name || "",
                            designation: cp.designation || "",
                            contact_no: cp.contact_no?.replace(/^\+91-/, '') || "",
                            is_admin: index === 0 ? true : cp.is_admin === 1,
                            email: cp.email || ""
                        })));
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching industry data:", err);
            setError("Failed to load existing profile data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (email: string) => {
        try {
            const response = await axios.get(`${BASE_URL}method/stridenex_app.api_stridenex_app.student.masters.get_user_by_mail?email=${encodeURIComponent(email)}`);
            if (response.data?.status === 200 && response.data?.data?.length > 0) {
                const user = response.data.data[0];
                setContactPersons(prev => {
                    const newPersons = [...prev];
                    const names = (user.full_name || "").split(" ");

                    // Populate if fields are currently empty
                    newPersons[0] = {
                        ...newPersons[0],
                        email: newPersons[0].email || user.email || "",
                        first_name: newPersons[0].first_name || names[0] || "",
                        last_name: newPersons[0].last_name || (names.length > 1 ? names.slice(1).join(" ") : ""),
                        contact_no: newPersons[0].contact_no || (user.mobile_no ? user.mobile_no.replace(/^\+91-/, '') : ""),
                        is_admin: true
                    };
                    return newPersons;
                });
            }
        } catch (err) {
            console.error("Error fetching user details:", err);
        }
    };

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            designationDropdownRefs.current.forEach((ref, index) => {
                if (ref && !ref.contains(event.target as Node) && openDesignationDropdown === index) {
                    setOpenDesignationDropdown(null);
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDesignationDropdown]);

    useEffect(() => {
        fetchBusinessTypes();
        fetchIndustrySectors();
        fetchJobFunctions();
        fetchDesignations();
        fetchSalutations();
    }, []);

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

    const fetchBusinessTypes = () => fetchMasterData("Business Type", setBusinessTypeOptions, setLoadingBusinessTypes, setBusinessTypeError);
    const fetchIndustrySectors = () => fetchMasterData("Industry Sector", setIndustrySectorOptions, setLoadingIndustrySectors, setIndustrySectorError);
    const fetchJobFunctions = () => fetchMasterData("Job Function", setJobFunctionOptions, setLoadingJobFunctions, setJobFunctionError);
    const fetchDesignations = () => fetchMasterData("Designation", setDesignationOptions, setLoadingDesignations, setDesignationError);
    const fetchSalutations = () => fetchMasterData("Salutation", setSalutationOptions, setLoadingSalutations, setSalutationError);

    const removeContactPerson = (index: number) => {
        if (contactPersons.length > 1) {
            setContactPersons(contactPersons.filter((_, i) => i !== index));
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

    const toggleDesignationDropdown = (index: number) => {
        setOpenDesignationDropdown(openDesignationDropdown === index ? null : index);
    };

    const selectDesignation = (index: number, value: string) => {
        handleContactPersonChange(index, 'designation', value);
        setOpenDesignationDropdown(null);
    };

    const getSelectedDesignationLabel = (value: string) => {
        if (!value) return "Select Designation";
        const option = designationOptions.find(opt => opt.value === value);
        return option ? option.label : "Select Designation";
    };

    const setDesignationRef = (index: number) => (el: HTMLDivElement | null) => {
        designationDropdownRefs.current[index] = el;
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
        if (!formData.company_name) errors.company_name = "Company name is required";
        if (!formData.business_type) errors.business_type = "Business type is required";
        if (!formData.industry_sector) errors.industry_sector = "Industry sector is required";
        if (!formData.employee_head_count) errors.employee_head_count = "Employee head count is required";
        if (!formData.internship_per_year) errors.internship_per_year = "Internship per year is required";
        if (!formData.average_fresher_recruited_per_year) errors.average_fresher_recruited_per_year = "Average fresher recruited per year is required";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.state) errors.state = "State is required";
        if (!formData.district) errors.district = "District is required";
        if (!formData.tahsil) errors.tahsil = "Taluka is required";
        if (!formData.city) errors.city = "City is required";
        if (!formData.address_line_1?.trim())
            errors.address_line_1 = "Address Line 1 is required";
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
        const invalidContact = contactPersons.some(
            person => !person.title || !person.first_name || !person.last_name || !person.designation || !person.contact_no
        );
        if (invalidContact) errors.contactPersons = "All contact person fields are required";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submitStepData = async (step: Step) => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const userEmail = formData.email || currentUser || localStorage.getItem("userEmail") || "";

            const validContactPersons = contactPersons.filter(
                person => person.title && person.first_name && person.last_name && person.designation && person.contact_no
            );

            const formattedContactPersons = validContactPersons.map(person => ({
                title: person.title,
                first_name: person.first_name,
                last_name: person.last_name,
                designation: person.designation,
                contact_no: `+91-${person.contact_no.replace(/\D/g, '')}`,
                is_admin: person.is_admin ? 1 : 0,
                email: person.email
            }));

            const isCustomBusinessType = formData.business_type && !businessTypeOptions.some(opt => opt.value === formData.business_type);
            const isCustomIndustrySector = formData.industry_sector && !industrySectorOptions.some(opt => opt.value === formData.industry_sector);

            const jobFunctionArray = (formData.job_function || []).map((jobFunc: string) => ({
                job_function: jobFunc
            }));



            let payload: any = {
                email: userEmail,
                company_name: formData.company_name, // Mandatory for updates
                contact_details: [],
                business_type: isCustomBusinessType ? "" : (formData.business_type || ""),
                other_business_type: isCustomBusinessType ? formData.business_type : "",
                gst_number: "",
                industry_sector: isCustomIndustrySector ? "" : (formData.industry_sector || ""),
                other_industry_sector: isCustomIndustrySector ? formData.industry_sector : "",
                employee_head_count: 0,
                internship_per_year: 0,
                job_functions: [],
                country: "",
                state: "",
                district: "",
                tahsil: "", // Key is tahsil
                city: "",
                turn_over_in_cr: 0,
                company_website: "",
                average_fresher_recruited_per_year: 0,
                address_line_1: "",
                address_line_2: "",
                pincode: ""
            };

            let endpoint = `${BASE_URL}method/stridenex_app.api_stridenex_app.industry.industry.create_industry`;
            let method: 'post' | 'put' = 'post';

            const recordExists = parseInt(isOnboarded || "0") > 1 || hasCreatedRecord;

            if (step === 2 && !recordExists) {
                // Step 2: Initial POST to create_industry
                payload.business_type = isCustomBusinessType ? "" : (formData.business_type || "");
                payload.other_business_type = isCustomBusinessType ? formData.business_type : "";
                payload.industry_sector = isCustomIndustrySector ? "" : (formData.industry_sector || "");
                payload.other_industry_sector = isCustomIndustrySector ? formData.industry_sector : "";
                payload.gst_number = formData.gst_number || "";
                payload.employee_head_count = formData.employee_head_count ? parseInt(formData.employee_head_count) : 0;
                payload.internship_per_year = formData.internship_per_year ? parseInt(formData.internship_per_year) : 0;
                payload.average_fresher_recruited_per_year = formData.average_fresher_recruited_per_year ?
                    parseInt(formData.average_fresher_recruited_per_year) : 0;
            } else {
                // Step 3, Step 4, OR Step 2 update: Use PUT to update_industry
                endpoint = `${BASE_URL}method/stridenex_app.api_stridenex_app.industry.industry.update_industry?company_name=${encodeURIComponent(formData.company_name)}`;
                method = 'put';
                payload.email = userEmail;

                // Always include Step 2 data for cumulative/update payload
                payload.business_type = isCustomBusinessType ? "" : (formData.business_type || "");
                payload.other_business_type = isCustomBusinessType ? formData.business_type : "";
                payload.industry_sector = isCustomIndustrySector ? "" : (formData.industry_sector || "");
                payload.other_industry_sector = isCustomIndustrySector ? formData.industry_sector : "";
                payload.gst_number = formData.gst_number || "";
                payload.employee_head_count = formData.employee_head_count ? parseInt(formData.employee_head_count) : 0;
                payload.internship_per_year = formData.internship_per_year ? parseInt(formData.internship_per_year) : 0;
                payload.average_fresher_recruited_per_year = formData.average_fresher_recruited_per_year ?
                    parseInt(formData.average_fresher_recruited_per_year) : 0;

                // Include Step 3 data
                if (step >= 3 || recordExists) {
                    payload.job_functions = jobFunctionArray;
                    payload.country = formData.country;
                    payload.state = formData.state;
                    payload.district = formData.district;
                    payload.tahsil = formData.tahsil;
                    payload.city = formData.city;
                    payload.turn_over_in_cr = formData.turn_over_in_cr ? parseFloat(formData.turn_over_in_cr) : 0;
                    payload.company_website = formData.company_website || "";
                    payload.address_line_1 = formData.address_line_1 || "";
                    payload.address_line_2 = formData.address_line2 || "";
                    payload.pincode = formData.pincode || "";
                }

                // Include Step 4 data
                if (step === 4 || recordExists) {
                    payload.contact_details = formattedContactPersons;
                }
            }

            const response = await axios({
                method: method,
                url: endpoint,
                data: payload,
                headers: { 'Content-Type': 'application/json' }
            });

            const internalStatus = response.data?.message?.status;
            const isSuccess = response.status === 200 && (internalStatus === 200 || internalStatus === undefined || internalStatus === "success");

            if (isSuccess) {
                // Mark step as completed on success
                setCompletedSteps(prev => new Set([...prev, step]));

                if (method === 'post') {
                    setHasCreatedRecord(true);
                }

                if (step === 2) {
                    // Update isOnboarded flag so reload lands on step 3 instead of step 2
                    if (typeof updateOnboardedFlag === "function") {
                        updateOnboardedFlag("2");
                    }
                    setCurrentStep(3);
                    setSuccess("Step 2 saved successfully!");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (step === 3) {
                    // ─── BILLING INTEGRATION STARTS HERE ─────────────────────────────────
                    try {
                        const billingPayload = {
                            data: {
                                account_type: "Organization",
                                role_type: "Industry Base",
                                company_name: formData.company_name,
                                abbr: formData.company_name ? formData.company_name.substring(0, 3).toUpperCase() : "CO",
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

                    setSuccess("Industry onboarding completed successfully!");
                    localStorage.clear();
                    setTimeout(() => {
                        // ✅ Check if coming from mobile
                        if (isMobileSource) {
                            window.location.href = "https://testwebstridenex.quantcloud.in/login";
                        } else {
                            window.location.href = "/login";
                        }
                    }, 1500);
                } else {
                    setSuccess("Industry onboarding completed successfully!");
                    localStorage.clear();
                    setTimeout(() => {
                        window.location.href = "/login";
                    }, 1500);
                }
            } else {
                let errorMsg = "Action failed. Please try again.";
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
            console.error(`Error submitting Step ${step} data:`, err);
            let errorMessage = `Error submitting step ${step} data`;
            if (err?.response?.data?._server_messages) {
                try {
                    const messages = JSON.parse(err.response.data._server_messages);
                    const parsedMessage = JSON.parse(messages[0]);
                    errorMessage = parsedMessage.message || errorMessage;
                } catch (parseError) {
                    errorMessage = err?.response?.data?.message || err?.message || errorMessage;
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

    const handleContinueToStep2 = () => {
        if (validateStep1()) {
            // Persist progress so page refresh returns to step 2, not back to OTP screen
            if (typeof updateOnboardedFlag === "function") {
                updateOnboardedFlag("1");
            }
            setCurrentStep(2);
            setSuccess("");
            setError("");
        }
    };

    const handleContinueToStep3 = () => {
        if (validateStep2()) {
            submitStepData(2);
        }
    };

    const handleContinueToStep4 = () => {
        if (validateStep3()) {
            submitStepData(3);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep4()) {
            submitStepData(4);
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

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "Verification";
            case 2: return "Company Information";
            case 3: return "Location & Job Functions";
            case 4: return "Contact Details";
            default: return "Industry Onboarding";
        }
    };

    const getStepDescription = () => {
        switch (currentStep) {
            case 1: return "Please verify your email and mobile number.";
            case 2: return "Please provide your company's basic information.";
            case 3: return "Tell us about your location and job functions.";
            case 4: return "Add contact persons.";
            default: return "";
        }
    };


    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        } else {
            localStorage.clear();

            // ✅ Check if coming from mobile
            if (isMobileSource) {
                window.location.href = "https://testwebstridenex.quantcloud.in/login";
            } else {
                window.location.href = "/login";
            }
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
                        Continue to Company Information
                    </Button>
                )}
            </div>
        );
    };

    const renderStep2 = () => {
        const step2Fields: FormField[] = [
            { fieldname: "company_name", label: "Company Name", fieldtype: "Data", required: true, placeholder: "Enter company name", layout: "half" },
            {
                fieldname: "business_type", label: "Business Type", fieldtype: "Data", required: true, placeholder: "Select Business Type", layout: "half",
                apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`, apiParams: { doctype: "Business Type" },
                allowCustom: true,
                customPlaceholder: "Enter custom business type",
                mapOptions: (data) => data.map((item: any) => ({ value: item.name, label: item.name }))
            },
            { fieldname: "gst_number", label: "GST Number", fieldtype: "Data", required: false, placeholder: "Enter GST number", layout: "half" },
            {
                fieldname: "industry_sector", label: "Industry Sector", fieldtype: "Data", required: true, placeholder: "Select Industry Sector", layout: "half",
                apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`, apiParams: { doctype: "Industry Sector" },
                allowCustom: true,
                customPlaceholder: "Enter custom industry sector",
                mapOptions: (data) => data.map((item: any) => ({ value: item.name, label: item.name }))
            },
            { fieldname: "employee_head_count", label: "Employee Head Count", fieldtype: "Data", required: true, placeholder: "Enter employee count", layout: "half" },
            { fieldname: "internship_per_year", label: "Internship Per Year", fieldtype: "Data", required: true, placeholder: "Enter number of internships", layout: "half" },
            { fieldname: "average_fresher_recruited_per_year", label: "Average Fresher Recruited Per Year", fieldtype: "Data", required: true, placeholder: "Enter number of freshers recruited per year", layout: "half" }
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
                        Continue to Location & Job Functions
                    </Button>
                </div>
            </div>
        );
    };

    const renderStep3 = () => {
        const step3Fields: FormField[] = [
            {
                fieldname: "job_function",
                label: "Job Function",
                fieldtype: "Data",
                required: false,
                placeholder: "Select Job Function",
                multiSelect: true,
                layout: "half",
                apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
                apiParams: {
                    doctype: "Job Function"
                },
                allowCustom: true,
                customPlaceholder: "Enter custom job function",
                onCreateCustomValue: async (val: string) => {
                    const apiKey = typeof window !== 'undefined' ? localStorage.getItem("apiKey") : "";
                    const apiSecret = typeof window !== 'undefined' ? localStorage.getItem("apiSecret") : "";
                    await axios.post(`${BASE_URL}method/stridenex_app.stridenex_app.doctype.job_function.job_function.create_job_function`, {
                        job_function: val
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Authorization": `token ${apiKey}:${apiSecret}`
                        }
                    });
                    // Refresh options to include newly created one
                    fetchJobFunctions();
                },
                mapOptions: (data) => data.map((item: any) => ({
                    value: item.name,
                    label: item.name
                }))
            },
            {
                fieldname: "country",
                label: "Country",
                fieldtype: "Data",
                required: true,
                placeholder: "Select Country",
                layout: "half",
                apiEndpoint: `${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`,
                apiParams: {
                    doctype: "Country"
                },
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
                apiParams: {
                    doctype: "State"
                },
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
                fieldname: "turn_over_in_cr",
                label: "Turn Over (in Cr)",
                fieldtype: "Data",
                required: false,
                placeholder: "Enter turnover in crores",
                layout: "half"
            },
            {
                fieldname: "company_website",
                label: "Company Website",
                fieldtype: "Data",
                required: false,
                placeholder: "https://www.company.com",
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
                        Complete Registration
                    </Button>
                </div>
            </div>
        );
    };

    const renderStep4 = () => {
        return (
            <div className="space-y-6">
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
                            const apiKey = typeof window !== 'undefined' ? localStorage.getItem("apiKey") : "";
                            const apiSecret = typeof window !== 'undefined' ? localStorage.getItem("apiSecret") : "";
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
                    <Button type="submit" variant="accent" className="flex-1" loading={loading} disabled={loading}>
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