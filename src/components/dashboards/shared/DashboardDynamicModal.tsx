"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, LucideIcon, ChevronDown, Check, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/services/api.services";
import { parseBackendError } from "@/utils/error.utils";
import { disableToDateBeforeFromDate, getLocalDateString } from "@/utils/date.utils";

const getOneDayPrior = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

export interface DynamicField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "email" | "url" | "date" | "time" | "custom";
  placeholder?: string;
  icon?: LucideIcon;
  colSpan?: 1 | 2;
  options?: { value: string; label: string }[] | string[];
  required?: boolean;
  onFocus?: (fieldName: string) => void;
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  testTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  disabled?: boolean;
  multiple?: boolean;
  apiEndpoint?: string;
  apiMethod?: "GET" | "POST";
  apiParams?: Record<string, any>;
  mapOptions?: (data: any) => Array<{ value: string; label: string }>;
  allowCustom?: boolean;
  customPlaceholder?: string;
  onCreateCustomValue?: (value: string) => Promise<any>;
  min?: string | number;
  max?: string | number;
  customRender?: (formData: any, handleChange: (value: any) => void) => React.ReactNode;
}

interface DashboardDynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerIcon: LucideIcon;
  iconBgColor?: string;
  fields: DynamicField[];
  initialValues?: Record<string, any>;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onFieldFocus?: (fieldName: string) => void;
  onValuesChange?: (values: Record<string, any>, changedFieldName: string) => Record<string, any> | void;
  children?: React.ReactNode;
  /** Optional content rendered between the modal header and the form fields */
  headerContent?: React.ReactNode;
  maxWidth?: string;
  hideFooter?: boolean;
  submitText?: string;
}

export default function DashboardDynamicModal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerIcon: HeaderIcon,
  iconBgColor = "bg-blue-600",
  fields,
  initialValues = {},
  onSubmit,
  loading = false,
  error = null,
  onFieldFocus,
  onValuesChange,
  children,
  headerContent,
  maxWidth = "max-w-4xl",
  hideFooter = false,
  submitText
}: DashboardDynamicModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSelect, setActiveSelect] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track which initial values we've already loaded to avoid infinite loops
  const lastInitialValuesRef = useRef<string>("");

  useEffect(() => {
    if (isOpen && initialValues) {
      const currentInitialStr = JSON.stringify(initialValues);

      // Only update if the stringified values have actually changed or it's the first load
      if (lastInitialValuesRef.current !== currentInitialStr) {
        const initial: Record<string, any> = {};
        fields.forEach(field => {
          let val = initialValues?.[field.name];
          if (field.multiple && val !== undefined && val !== null && !Array.isArray(val)) {
            val = typeof val === 'string' && val.includes(',') ? val.split(',').map(s => s.trim()) : [val];
          }
          initial[field.name] = val ?? (field.multiple ? [] : (field.type === "number" ? "" : ""));
        });
        setFormData(initial);
        lastInitialValuesRef.current = currentInitialStr;
      }
    } else if (!isOpen) {
      if (lastInitialValuesRef.current !== "") {
        lastInitialValuesRef.current = "";
        setActiveSelect(null);
        setSearchTerm("");
        setErrors({});
      }
    }
  }, [isOpen, fields, initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? (value === "" ? "" : Number(value)) : value;

    // Calculate new state first to handle side effects cleanly
    const updated = { ...formData, [name]: newValue };

    // Automatically adjust end_date if start_date becomes later
    if (name === "start_date" && updated.end_date) {
      if (new Date(updated.end_date) < new Date(String(newValue))) {
        updated.end_date = newValue;
      }
    }
    if (name === "from_date" && updated.to_date) {
      if (new Date(updated.to_date) < new Date(String(newValue))) {
        updated.to_date = newValue;
      }
    }

    // Automatically adjust regDeadline if driveDate becomes earlier than regDeadline + 1 day
    if (name === "driveDate" && updated.regDeadline && newValue) {
      const drive = new Date(String(newValue));
      const reg = new Date(updated.regDeadline);
      if (!isNaN(drive.getTime()) && !isNaN(reg.getTime())) {
        drive.setDate(drive.getDate() - 1);
        if (reg > drive) {
          updated.regDeadline = drive.toISOString().split("T")[0];
        }
      }
    }
    if (name === "regDeadline" && updated.driveDate && newValue) {
      const drive = new Date(updated.driveDate);
      const reg = new Date(String(newValue));
      if (!isNaN(drive.getTime()) && !isNaN(reg.getTime())) {
        drive.setDate(drive.getDate() - 1);
        if (reg > drive) {
          updated.regDeadline = drive.toISOString().split("T")[0];
        }
      }
    }

    let finalData = updated;

    if (onValuesChange) {
      const sideEffects = onValuesChange(updated, name);
      if (sideEffects) {
        finalData = { ...updated, ...sideEffects };
      }
    }

    setFormData(finalData);

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleSelectValue = (fieldName: string, value: string, multiple: boolean) => {
    let updated;
    if (multiple) {
      const currentValues = Array.isArray(formData[fieldName]) ? formData[fieldName] : [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value];
      updated = { ...formData, [fieldName]: newValues };
    } else {
      setActiveSelect(null);
      setSearchTerm("");
      updated = { ...formData, [fieldName]: value };
    }

    let finalData = updated;
    if (onValuesChange) {
      const sideEffects = onValuesChange(updated, fieldName);
      if (sideEffects) {
        finalData = { ...updated, ...sideEffects };
      }
    }

    setFormData(finalData);

    // Clear error when value is toggled
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const removeMultiSelectValue = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((v: string) => v !== value)
    }));
  };

  const handleFormSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // Perform validation
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required) {
        const value = formData[field.name];
        const isEmpty =
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          newErrors[field.name] = "required";
        }
      }

      // Date min/max validation
      if (field.type === "date" && formData[field.name]) {
        const dateVal = formData[field.name];
        const initialVal = initialValues?.[field.name];

        // Only validate if the user changed the date from its initial value
        if (dateVal !== initialVal) {
          // Determine min constraint
          let minValue = field.min;
          if (field.name === "end_date" || field.name === "to_date") {
            minValue = disableToDateBeforeFromDate(formData.start_date || formData.from_date) || getLocalDateString();
          }

          // Determine max constraint
          let maxValue = field.max;
          if (field.name === "regDeadline") {
            maxValue = getOneDayPrior(formData.driveDate);
          }

          if (minValue && dateVal < minValue) {
            newErrors[field.name] = `Date cannot be before ${minValue}`;
          }
          if (maxValue && dateVal > maxValue) {
            newErrors[field.name] = `Date cannot be after ${maxValue}`;
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      console.warn("DashboardDynamicModal: Validation failed:", newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      // Toast is handled by the parent components which call onSubmit
      console.error("Form submission error:", err);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
          {/* StrideNex Logo brought to front */}
          <div className="absolute top-4 left-6 z-[110] pointer-events-none">
            <img
              src="/images/Logo.png"
              alt="StrideNex Logo"
              className="w-48 h-12 object-contain drop-shadow-sm"
            />
          </div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col border border-slate-100`}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${iconBgColor} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50`}>
                  <HeaderIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                  {subtitle && <p className="text-sm text-slate-500 font-semibold">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Optional header content (e.g. profile image uploader) */}
              {headerContent && (
                <div className="mb-4">{headerContent}</div>
              )}
              {fields.length > 0 && (
                <form id="dynamic-industry-form" onSubmit={handleFormSubmit} className={`grid grid-cols-2 gap-6 ${activeSelect ? 'pb-[240px]' : 'pb-6'}`}>
                  {fields.map((field) => (
                    <DynamicFieldItem
                      key={field.name}
                      field={field}
                      formData={formData}
                      handleChange={handleChange}
                      onFieldFocus={onFieldFocus}
                      activeSelect={activeSelect}
                      setActiveSelect={setActiveSelect}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      toggleSelectValue={toggleSelectValue}
                      removeMultiSelectValue={removeMultiSelectValue}
                      errors={errors}
                      setFormData={setFormData}
                      onValuesChange={onValuesChange}
                    />
                  ))}
                </form>
              )}
              
              {children && (
                <div className={fields.length > 0 ? "pt-4 pb-10" : "pb-4"}>
                  {children}
                </div>
              )}

              {error && <p className="mt-4 text-sm font-semibold text-red-500 text-center">{error}</p>}
            </div>

            {/* Footer */}
            {!hideFooter && (
              <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-6 h-12 rounded-xl text-sm font-bold border-slate-200 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFormSubmit}
                  disabled={loading}
                  className="px-8 h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {submitText || "Save Changes"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DynamicFieldItem({
  field,
  formData,
  handleChange,
  onFieldFocus,
  activeSelect,
  setActiveSelect,
  searchTerm,
  setSearchTerm,
  toggleSelectValue,
  removeMultiSelectValue,
  errors,
  setFormData,
  onValuesChange
}: {
  field: DynamicField;
  formData: any;
  handleChange: any;
  onFieldFocus: any;
  activeSelect: string | null;
  setActiveSelect: any;
  searchTerm: string;
  setSearchTerm: any;
  toggleSelectValue: any;
  removeMultiSelectValue: any;
  errors: any;
  setFormData: any;
  onValuesChange?: (data: any, fieldName: string) => any;
}) {
  const [apiOptions, setApiOptions] = useState<{ value: string; label: string }[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSelect === field.name && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveSelect(null);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeSelect, field.name, setActiveSelect, setSearchTerm]);

  const serializedParams = JSON.stringify(field.apiParams);
  useEffect(() => {
    setApiOptions([]);
    setPage(1);
    setTotalPages(1);
    setHasNext(false);
    setHasPrev(false);
  }, [serializedParams, field.apiEndpoint]);

  useEffect(() => {
    if (!field.apiEndpoint) return;

    const delayDebounce = setTimeout(() => {
      if (activeSelect === field.name) {
        fetchApiOptions(1, searchTerm);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, activeSelect, field.name, field.apiEndpoint]);

  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      setTimeout(() => {
        customInputRef.current?.focus();
      }, 100);
    }
  }, [showCustomInput]);

  const fetchApiOptions = async (pageNum = 1, searchTxt = "") => {
    if (!field.apiEndpoint) return;
    setApiLoading(true);
    setApiError(null);
    try {
      let responseData;

      if (field.apiEndpoint.includes('master.get_master_data') && field.apiMethod !== 'GET') {
        const body = {
          ...(field.apiParams || {}),
          search: searchTxt,
          page: pageNum
        };
        responseData = await apiService.post(field.apiEndpoint, body);
      } else if (field.apiMethod === 'GET') {
        responseData = await apiService.get(field.apiEndpoint, {
          params: {
            ...(field.apiParams || {}),
            page: pageNum,
            page_size: 20,
            search: searchTxt
          }
        });
      } else {
        responseData = await apiService.post(field.apiEndpoint, {
          ...(field.apiParams || {}),
          page: pageNum,
          page_size: 20,
          search: searchTxt
        });
      }

      let data = [];
      let nextFlag = false;
      let prevFlag = false;
      let totalPgs = 1;

      if (responseData) {
        if (responseData.pagination) {
          data = responseData.data || [];
          nextFlag = responseData.pagination.has_next === true;
          prevFlag = responseData.pagination.has_prev === true;
          const totalCount = responseData.pagination.total_count || 0;
          const pageSize = responseData.pagination.page_size || 20;
          totalPgs = Math.ceil(totalCount / pageSize) || 1;
        } else if (responseData.data && responseData.data.pagination) {
          data = responseData.data.data || [];
          const pag = responseData.data.pagination;
          nextFlag = pag.has_next === true;
          prevFlag = pag.has_prev === true;
          const totalCount = pag.total_count || 0;
          const pageSize = pag.page_size || 20;
          totalPgs = Math.ceil(totalCount / pageSize) || 1;
        } else if (responseData.message && responseData.message.pagination) {
          data = responseData.message.data || [];
          const pag = responseData.message.pagination;
          nextFlag = pag.has_next === true;
          prevFlag = pag.has_prev === true;
          const totalCount = pag.total_count || 0;
          const pageSize = pag.page_size || 20;
          totalPgs = Math.ceil(totalCount / pageSize) || 1;
        } else {
          if (Array.isArray(responseData)) {
            data = responseData;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            data = responseData.data;
          } else if (responseData.message && Array.isArray(responseData.message)) {
            data = responseData.message;
          } else if (responseData.message?.data && Array.isArray(responseData.message.data)) {
            data = responseData.message.data;
          } else if (responseData.message?.message && Array.isArray(responseData.message.message)) {
            data = responseData.message.message;
          }
        }
      }

      let mapped = [];
      if (field.mapOptions) {
        mapped = field.mapOptions(responseData || data);
      } else {
        mapped = Array.isArray(data) ? data.map((item: any) => ({
          value: item.name || item.value || item,
          label: item.label || item.name || item.value || item
        })) : [];
      }

      setApiOptions(mapped);

      setHasNext(nextFlag || data.length === 20);
      setHasPrev(prevFlag || pageNum > 1);
      setTotalPages(totalPgs);
      setPage(pageNum);
    } catch (err: any) {
      console.error(`Error fetching options for ${field.name}:`, err);
      setApiError(err?.message || "Failed to load options");
    } finally {
      setApiLoading(false);
    }
  };

  const currentOptions = field.apiEndpoint ? apiOptions : (field.options || []);

  const currentValueArray = Array.isArray(formData[field.name]) 
    ? formData[field.name] 
    : (formData[field.name] 
        ? (typeof formData[field.name] === 'string' && formData[field.name].includes(',') 
            ? formData[field.name].split(',').map((s: string) => s.trim()) 
            : [formData[field.name]]) 
        : []);

  return (
    <div className={`space-y-2 ${field.colSpan === 2 ? 'col-span-2' : 'col-span-2 md:col-span-1'}`}>
      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        {field.icon && (
          <field.icon className={`absolute left-4 ${field.type === 'textarea' ? 'top-4' : 'top-1/2 -translate-y-1/2'} w-4 h-4 text-slate-400 z-10`} />
        )}

        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            onFocus={() => {
              if (field.onFocus) field.onFocus(field.name);
              if (onFieldFocus) onFieldFocus(field.name);
            }}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full ${field.icon ? 'pl-12' : 'px-4'} pr-4 pt-3.5 rounded-[1.5rem] border ${errors[field.name] ? 'border-red-500 bg-red-50/10' : 'border-slate-200'} focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-sm text-slate-900 resize-none outline-none min-h-[100px] disabled:bg-slate-50 disabled:text-slate-500`}
            required={field.required}
            disabled={field.disabled}
          />
        ) : field.type === "select" ? (
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => {
                if (!field.disabled) {
                  setActiveSelect(activeSelect === field.name ? null : field.name);
                  setSearchTerm("");
                  if (field.apiEndpoint && apiOptions.length === 0) fetchApiOptions();
                  if (field.onFocus) field.onFocus(field.name);
                  if (onFieldFocus) onFieldFocus(field.name);
                }
              }}
              className={`w-full min-h-[3rem] ${field.icon ? 'pl-12' : 'px-4'} pr-10 py-2.5 rounded-2xl border ${errors[field.name] ? 'border-red-500 bg-red-50/10' : 'border-slate-200'} focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-sm text-slate-900 bg-white cursor-pointer flex flex-wrap gap-2 ${field.disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed grayscale' : ''}`}
            >
              {field.multiple ? (
                <>
                  {currentValueArray.length === 0 && (
                    <span className="text-slate-400">{
                      apiLoading ? "Loading..." : (field.placeholder || `Select ${field.label}`)
                    }</span>
                  )}
                  {currentValueArray.map((val: string) => (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMultiSelectValue(field.name, val);
                      }}
                    >
                      {val}
                      {!field.disabled && <X className="w-3 h-3 hover:text-red-400 transition-colors" />}
                    </span>
                  ))}
                </>
              ) : (
                <span className={!formData[field.name] ? "text-slate-400" : "text-slate-900"}>
                  {apiLoading ? "Loading..." : (formData[field.name] || (field.placeholder || `Select ${field.label}`))}
                </span>
              )}
              {!field.disabled && (
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${activeSelect === field.name ? 'rotate-180' : ''}`} />
              )}
            </div>

            <AnimatePresence>
              {activeSelect === field.name && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-slate-100 shadow-2xl z-[120] max-h-[320px] overflow-hidden flex flex-col p-2"
                  >
                    {/* Search Input */}
                    <div className="px-2 pt-1 pb-2 border-b border-slate-50 mb-1">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-10 pl-9 pr-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1">
                      {showCustomInput ? (
                        <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Custom Value</span>
                            <button
                              onClick={() => setShowCustomInput(false)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              ref={customInputRef}
                              type="text"
                              value={customValue}
                              onChange={(e) => {
                                setCustomValue(e.target.value);
                                if (customError) setCustomError(null);
                              }}
                              placeholder={field.customPlaceholder || "Enter custom value..."}
                              className={`w-full h-11 px-4 bg-slate-50 border ${customError ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (customValue.trim() && !customLoading) {
                                    setCustomError(null);
                                    if (field.onCreateCustomValue) {
                                      try {
                                        setCustomLoading(true);
                                        await field.onCreateCustomValue(customValue.trim());
                                      } catch (err: any) {
                                        console.error("Error creating custom value:", err);
                                        setCustomError(parseBackendError(err));
                                        return; // Don't add to list if creation failed
                                      } finally {
                                        setCustomLoading(false);
                                      }
                                    }
                                    toggleSelectValue(field.name, customValue.trim(), !!field.multiple);
                                    setShowCustomInput(false);
                                    setCustomValue("");
                                    if (field.apiEndpoint) fetchApiOptions();
                                  }
                                }
                              }}
                            />
                          </div>
                          {customError && (
                            <p className="text-[10px] font-bold text-red-500 ml-1 px-1 py-1 rounded-lg bg-red-50 inline-block">
                              {customError}
                            </p>
                          )}
                          <Button
                            onClick={async () => {
                              if (customValue.trim() && !customLoading) {
                                setCustomError(null);
                                if (field.onCreateCustomValue) {
                                  try {
                                    setCustomLoading(true);
                                    await field.onCreateCustomValue(customValue.trim());
                                  } catch (err: any) {
                                    console.error("Error creating custom value:", err);
                                    setCustomError(parseBackendError(err));
                                    return;
                                  } finally {
                                    setCustomLoading(false);
                                  }
                                }
                                toggleSelectValue(field.name, customValue.trim(), !!field.multiple);
                                setShowCustomInput(false);
                                setCustomValue("");
                                if (field.apiEndpoint) fetchApiOptions();
                              }
                            }}
                            disabled={!customValue.trim() || customLoading}
                            className="w-full h-11 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                          >
                            {customLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Value"}
                          </Button>
                        </div>
                      ) : apiError ? (
                        <div className="py-8 text-center px-4">
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{apiError}</p>
                          <div className="flex flex-col gap-2 mt-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); fetchApiOptions(); }}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Retry Loading Options
                            </button>
                            
                            {field.allowCustom && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCustomInput(true);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-all"
                              >
                                <Plus className="w-3 h-3" />
                                Add Custom Value Instead
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {currentOptions?.filter((opt: any) => {
                            if (!opt) return false;
                            const label = typeof opt === 'string' ? opt : opt?.label;
                            if (!label) return false;
                            return label.toLowerCase().includes(searchTerm.toLowerCase());
                          }).map((opt: any) => {
                            const value = typeof opt === 'string' ? opt : opt?.value;
                            const label = typeof opt === 'string' ? opt : opt?.label;
                            const isSelected = field.multiple
                              ? currentValueArray.includes(value)
                              : formData[field.name] === value;

                            return (
                              <div
                                key={value}
                                onClick={() => toggleSelectValue(field.name, value, !!field.multiple)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all mb-0.5 ${isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                <span className="text-sm font-bold leading-tight">{label}</span>
                                {isSelected && <Check className="w-4 h-4 shrink-0 shadow-sm" />}
                              </div>
                            );
                          })}

                          {field.allowCustom && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowCustomInput(true);
                              }}
                              className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all mb-0.5 text-blue-600 hover:bg-blue-50"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-sm font-bold leading-tight">Others (Add Custom)</span>
                            </div>
                          )}

                          {currentOptions?.filter((opt: any) => {
                            if (!opt) return false;
                            const label = typeof opt === 'string' ? opt : opt?.label;
                            if (!label) return false;
                            return label.toLowerCase().includes(searchTerm.toLowerCase());
                          }).length === 0 && !field.allowCustom && (
                              <div className="py-8 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No results found</p>
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {field.apiEndpoint && !apiLoading && !apiError && (hasNext || hasPrev || totalPages > 1) && (
                      <div className="flex items-center justify-between p-2 border-t border-slate-50 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider rounded-b-2xl mt-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={!hasPrev || apiLoading}
                          onClick={() => fetchApiOptions(page - 1, searchTerm)}
                          className={`px-3 py-1.5 rounded-xl border transition-all ${
                            hasPrev 
                              ? "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-bold" 
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Previous
                        </button>
                        
                        <span className="font-bold text-slate-700">
                          Page {page} of {totalPages}
                        </span>

                        <button
                          type="button"
                          disabled={!hasNext || apiLoading}
                          onClick={() => fetchApiOptions(page + 1, searchTerm)}
                          className={`px-3 py-1.5 rounded-xl border transition-all ${
                            hasNext 
                              ? "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-bold" 
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : field.type === "custom" && field.customRender ? (
          field.customRender(formData, (value) => {
            const updated = { ...formData, [field.name]: value };
            let finalData = updated;
            if (onValuesChange) {
              const sideEffects = onValuesChange(updated, field.name);
              if (sideEffects) {
                finalData = { ...updated, ...sideEffects };
              }
            }
            setFormData(finalData);
          })
        ) : (
          <Input
            name={field.name}
            type={field.type}
            value={formData[field.name] !== undefined && formData[field.name] !== null ? formData[field.name] : ""}
            onChange={handleChange}
            onFocus={() => {
              if (field.onFocus) field.onFocus(field.name);
              if (onFieldFocus) onFieldFocus(field.name);
            }}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            min={
              field.type === "date" && (field.name === "end_date" || field.name === "to_date")
                ? disableToDateBeforeFromDate(formData.start_date || formData.from_date) || getLocalDateString()
                : field.min
            }
            max={
              field.type === "date" && field.name === "regDeadline"
                ? getOneDayPrior(formData.driveDate)
                : field.max
            }
            style={(field.textTransform || (field as any).testTransform) ? { textTransform: field.textTransform || (field as any).testTransform } : {}}
            className={`${field.icon ? 'pl-12' : 'px-4'} h-12 rounded-2xl border ${errors[field.name] ? 'border-red-500 bg-red-50/10' : 'border-slate-200'} focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-900 ${(field.textTransform || (field as any).testTransform) === 'uppercase' ? 'placeholder:uppercase' : ''} disabled:bg-slate-50 disabled:text-slate-500`}
          />
        )}
      </div>
      {errors[field.name] && (
        <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 animate-pulse">
          {errors[field.name] === "required" ? "* This field is mandatory" : errors[field.name]}
        </p>
      )}
    </div>
  );
}
