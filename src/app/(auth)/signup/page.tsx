"use client";

import { useEffect, useState } from "react";
import { BASE_URL } from "@/services/api.services";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Users, Building2, Briefcase } from "lucide-react";
import AuthLayout from "../AuthLayout";
import { useAuth } from "@/context/AuthContext";
import DynamicForm from "@/components/forms/DynamicForm";
import { FormField } from "@/types/doctypes.types";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type UserRole = "student" | "mentor" | "college" | "industry" | null;

export default function SignupPage() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>("StrideNex");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formValues, setFormValues] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [shakeRole, setShakeRole] = useState(false);
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/student/dashboard"); // Fallback, real roles will be set next
    }
  }, [isAuthenticated, router]);

  // Password validation function
  const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one special character" };
    }
    return { isValid: true, message: "" };
  };

  // Role selection cards - FIXED COLOR ASSIGNMENTS
  const roles = [
    {
      id: "student",
      label: "Student",
      icon: GraduationCap,
      color: "accent",
      gradient: "from-accent to-orange-600",
      description: "Start your career journey"
    },
    {
      id: "industry",
      label: "Industry",
      icon: Briefcase,
      color: "primary",
      gradient: "from-primary to-purple-600",
      description: "Build your talent pipeline"
    },
    {
      id: "college",
      label: "College",
      icon: Building2,
      color: "blue",
      gradient: "from-blue-600 to-blue-500",
      description: "Enhance student outcomes"
    },
    {
      id: "mentor",
      label: "Mentor",
      icon: Users,
      color: "emerald",
      gradient: "from-emerald-600 to-emerald-500",
      description: "Guide and inspire others"
    },
  ];

  // Update the form fields with custom input for password fields
  const signupFields: FormField[] = [
    {
      fieldname: "firstName",
      label: "First Name",
      fieldtype: "Data",
      required: true,
      placeholder: "Enter first name",
      layout: "half"
    },
    {
      fieldname: "lastName",
      label: "Last Name",
      fieldtype: "Data",
      required: true,
      placeholder: "Enter last name",
      layout: "half"
    },
    {
      fieldname: "email",
      label: "Email",
      fieldtype: "Data",
      required: true,
      placeholder: "name@college.edu",
    },
    {
      fieldname: "password",
      label: "Password",
      fieldtype: "Password",
      required: true,
      placeholder: "Create a password",
    },
    {
      fieldname: "confirmPassword",
      label: "Confirm Password",
      fieldtype: "Password",
      required: true,
      placeholder: "Confirm your password",
    },
  ];

  const handleFormChange = (data: any) => {
    setFormValues(data);
  };

  const handleSubmit = () => {
    // Use the stored form values
    const data = formValues || {};
    const newFieldErrors: Record<string, string> = {};

    // Simple validation
    if (!data.firstName) newFieldErrors.firstName = "First name is required";
    if (!data.lastName) newFieldErrors.lastName = "Last name is required";
    if (!data.email) newFieldErrors.email = "Email is required";
    if (!data.password) newFieldErrors.password = "Password is required";
    if (!data.confirmPassword) newFieldErrors.confirmPassword = "Please confirm your password";

    // Password strength validation
    if (data.password) {
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        newFieldErrors.password = passwordValidation.message;
      }
    }

    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      newFieldErrors.confirmPassword = "Passwords do not match";
    }

    if (!selectedRole) {
      newFieldErrors.role = "Please select a role to continue";
      setShakeRole(true);
      setTimeout(() => setShakeRole(false), 500);
    }

    if (!acceptTerms) {
      newFieldErrors.terms = "You must accept the Terms of Service";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError(""); // Clear global error for validation issues
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});
    const rolePayload = [
      { student: selectedRole === "student" ? 1 : 0 },
      { college: selectedRole === "college" ? 1 : 0 },
      { mentor: selectedRole === "mentor" ? 1 : 0 },
      { industry: selectedRole === "industry" ? 1 : 0 }
    ];

    // Call API
    fetch(`${BASE_URL}method/stridenex_app.api_stridenex_app.app.signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        role: rolePayload,
      }),
    })
      .then(response => response.json())
      .then(responseData => {
      if (responseData?.message === "User created successfully") {
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userFirstName", data.firstName);
        localStorage.setItem("userLastName", data.lastName);
        localStorage.setItem("userPassword", data.password);

        // Navigate based on selected role
        if (selectedRole === "student") {
          router.push("/onboarding/student");
        } else if (selectedRole === "mentor") {
          router.push("/onboarding/mentor");
        } else if (selectedRole === "college") {
          router.push("/onboarding/college");
        } else if (selectedRole === "industry") {
          router.push("/onboarding/industry");
        }
      } else {
        // Handle different error structures
        const errorMsg = responseData?.message ||
          responseData?.message?.error ||
          "Signup failed";

        if (errorMsg.toLowerCase().includes("user already exists") || errorMsg.toLowerCase().includes("email already registered")) {
          setFieldErrors(prev => ({ ...prev, email: "User already exists with this email" }));
          setError("");
        } else {
          setError(errorMsg);
        }
        setLoading(false);
      }
    })
      .catch(err => {
        console.error("Fetch error:", err);
        setError("An error occurred during signup");
        setLoading(false);
      });
  };

  // Custom password input component for DynamicForm
  const PasswordInput = ({ field, value, onChange, showPassword, toggleShow }: any) => (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onChange(field.fieldname, e.target.value)}
        className="w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all text-sm text-slate-900 placeholder:text-slate-400 border-slate-200 pr-10"
        required={field.required}
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  // Override the Password field rendering in DynamicForm
  const renderPasswordField = (field: FormField, value: any, onChange: any) => {
    if (field.fieldname === "password") {
      return (
        <PasswordInput
          field={field}
          value={value}
          onChange={onChange}
          showPassword={showPassword}
          toggleShow={() => setShowPassword(!showPassword)}
        />
      );
    }
    if (field.fieldname === "confirmPassword") {
      return (
        <PasswordInput
          field={field}
          value={value}
          onChange={onChange}
          showPassword={showConfirmPassword}
          toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      );
    }
    return null;
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join StrideNex to start your career development journey"
      alternateText="Already have an account?"
      alternateLinkText="Sign in"
      alternateLinkHref="/login"
      appName={appName}
      bgImage={bgImage}
    >
      <div className="space-y-5">
        {/* Form with 5 fields */}
        <DynamicForm
          fields={signupFields}
          onSubmit={() => { }}
          buttonLabel=""
          loading={loading}
          onChange={handleFormChange}
          errors={fieldErrors}
        />

        {/* Role Selection Cards - Smaller size with centered text */}
        <motion.div 
          className="space-y-3 pt-2"
          animate={shakeRole ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Label className="text-sm font-bold text-slate-800 text-center block w-full">
            Select your role to join as <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.id as UserRole);
                    setFieldErrors(prev => {
                      const { role, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className={`relative p-2.5 rounded-xl border-2 transition-all duration-200 group cursor-pointer ${
                    isSelected
                      ? `border-${role.color} bg-gradient-to-br ${role.gradient} bg-opacity-10 shadow-md transform -translate-y-0.5`
                      : fieldErrors.role 
                        ? 'border-red-300 bg-red-50 hover:border-red-400' 
                        : 'border-slate-200 bg-slate-50 hover:border-accent/40 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                      isSelected
                        ? 'bg-white/20'
                        : `bg-white shadow-sm border border-slate-100 group-hover:border-slate-200`
                    }`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : `text-${role.color}`}`} />
                    </div>
                    <p className={`text-xs font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {role.label}
                    </p>
                    <p className={`text-[9px] leading-tight ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                      {role.description}
                    </p>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100">
                      <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {fieldErrors.role && (
            <p className="text-xs font-semibold text-red-500 text-center animate-pulse">{fieldErrors.role}</p>
          )}
        </motion.div>

        <div className="space-y-1">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => {
                const isChecked = checked as boolean;
                setAcceptTerms(isChecked);
                if (isChecked) {
                  setFieldErrors(prev => {
                    const { terms, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              className={`mt-0.5 ${fieldErrors.terms ? 'border-red-500' : ''}`}
            />
            <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms-of-use"
                target="_blank"
                className="text-accent hover:text-orange-600 font-medium"
              >
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="text-accent hover:text-orange-600 font-medium"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
          {fieldErrors.terms && (
            <p className="text-xs text-red-500 ml-7">{fieldErrors.terms}</p>
          )}
        </div>

        {/* Create Account Button */}
        <Button
          type="button"
          variant="accent"
          className="w-full"
          loading={loading}
          disabled={loading}
          onClick={handleSubmit}
        >
          Create Account
        </Button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}