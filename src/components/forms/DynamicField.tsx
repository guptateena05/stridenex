"use client";

import { FormField } from "@/types/doctypes.types";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, X, Check, Eye, EyeOff, Search, Plus, Loader2 } from "lucide-react";
import axios from "axios";
import { parseBackendError } from "@/utils/error.utils";

interface Props {
  field: FormField;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
}

// Simple Button component
const Button = ({ children, onClick, disabled, className, variant, ...props }: any) => {
  const baseClasses = "px-4 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent";
  const variantClasses = variant === "outline"
    ? "border border-slate-200 hover:bg-slate-50"
    : "bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function DynamicField({ field, value, onChange, error }: Props) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [filteredOptions, setFilteredOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const justOpenedRef = useRef(false);

  // Lifted hooks to prevent Rules of Hooks violations
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  // Memoized lookup map to avoid O(N) arrays scans on every render
  const optionsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      map.set(opt.value, opt.label);
    }
    return map;
  }, [options]);

  // Check if this field should have "Others" option based on the allowCustom prop
  const hasOthersOption = field.allowCustom === true;

  // Combine base classes with custom input classes
  const baseInputClasses =
    "w-full px-3 py-2 bg-white border rounded-lg " +
    "focus:ring-2 focus:ring-accent focus:border-accent " +
    "transition-all text-sm text-slate-900 placeholder:text-slate-400 " +
    (error ? "border-red-500" : "border-slate-200") + " " +
    (field.inputClassName || "");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setShowCustomInput(false);
        setCustomValue("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Removed automatic fetch effects to strictly call API only on click

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current && !showCustomInput) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    if (showCustomInput && customInputRef.current) {
      setTimeout(() => {
        customInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, showCustomInput]);

  // Filter options based on search term or fetch paginated results from API
  useEffect(() => {
    if (!field.apiEndpoint) {
      if (options.length > 0) {
        const searchLower = searchTerm.toLowerCase();
        const filtered = options.filter(option =>
          option.label && option.label.toLowerCase().includes(searchLower)
        ).slice(0, 100);
        setFilteredOptions(filtered);
      }
      return;
    }

    if (isOpen) {
      if (justOpenedRef.current) {
        justOpenedRef.current = false;
        return;
      }

      const delayDebounce = setTimeout(() => {
        fetchOptions(1, searchTerm);
      }, 400);

      return () => clearTimeout(delayDebounce);
    }
  }, [searchTerm, isOpen, field.apiEndpoint]);

  const serializedParams = JSON.stringify(field.apiParams);
  useEffect(() => {
    setOptions([]);
    setFilteredOptions([]);
    setPage(1);
    setTotalPages(1);
    setHasNext(false);
    setHasPrev(false);
  }, [serializedParams, field.apiEndpoint]);

  // Removed initial country fetch

  const fetchOptions = async (pageNum = 1, searchTxt = "") => {
    if (!field.apiEndpoint) return;

    setLoading(true);
    setFetchError("");
    try {
      let response;
      let responseData;

      if (field.apiEndpoint.includes('frappe.client.get_list')) {
        response = await axios.get(field.apiEndpoint, {
          params: {
            ...(field.apiParams || {}),
            page: pageNum,
            page_size: 20,
            search: searchTxt
          },
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
        responseData = response.data;
      }
      else if (field.apiEndpoint.includes('master.get_master_data')) {
        const body = {
          ...(field.apiParams || {}),
          search: searchTxt,
          page: pageNum
        };
        response = await axios.post(field.apiEndpoint, body, {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
        responseData = response.data;
      }
      else if (field.apiEndpoint.includes('student.masters.get_semester')) {
        response = await axios.get(field.apiEndpoint);
        responseData = response.data;
      }
      else {
        response = await axios.get(field.apiEndpoint, {
          params: {
            ...(field.apiParams || {}),
            page: pageNum,
            page_size: 20,
            search: searchTxt
          }
        });
        responseData = response.data;
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
          const pageSize = pag.message.pagination.page_size || 20;
          totalPgs = Math.ceil(totalCount / pageSize) || 1;
        } else {
          if (Array.isArray(responseData)) {
            data = responseData;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            data = responseData.data;
          } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
            data = responseData.data.data;
          } else if (responseData.message && Array.isArray(responseData.message)) {
            data = responseData.message;
          } else if (responseData.message?.data && Array.isArray(responseData.message.data)) {
            data = responseData.message.data;
          } else if (responseData.message?.message && Array.isArray(responseData.message.message)) {
            data = responseData.message.message;
          }
        }
      }

      let mappedOptions = [];
      if (field.mapOptions) {
        mappedOptions = field.mapOptions(data.length > 0 ? data : responseData);
      } else if (data.length > 0) {
        mappedOptions = data.map((item: any) => ({
          value: item.name || item.value || item,
          label: item.label || item.name || item.value || item
        }));
      }

      setOptions(mappedOptions);
      setFilteredOptions(mappedOptions);
      if (mappedOptions.length === 0) {
        setFetchError("No options available");
      }

      setHasNext(nextFlag || data.length === 20);
      setHasPrev(prevFlag || pageNum > 1);
      setTotalPages(totalPgs);
      setPage(pageNum);
    } catch (err: any) {
      console.error(`Error fetching ${field.label}:`, err);
      const msg = err?.response?.data?.message || err?.message || `Failed to load ${field.fieldname}`;
      setFetchError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownClick = () => {
    if (field.read_only || field.disabled) return;

    if (field.fieldname !== "country") {
      fetchOptions(1, '');
    } else {
      if (options.length === 0 && !loading && !fetchError) {
        fetchOptions(1, '');
      }
    }

    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      justOpenedRef.current = true;
    } else {
      setSearchTerm("");
      setShowCustomInput(false);
      setCustomValue("");
    }
  };

  const handleRetry = () => {
    setFetchError("");
    fetchOptions(1, searchTerm);
  };

  const handleSingleSelect = (selectedValue: string) => {
    onChange(field.fieldname, selectedValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleMultiSelect = (selectedValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentValues = Array.isArray(value) ? value : [];
    let newValues: string[];

    if (currentValues.includes(selectedValue)) {
      newValues = currentValues.filter(v => v !== selectedValue);
    } else {
      newValues = [...currentValues, selectedValue];
    }

    onChange(field.fieldname, newValues);
    // Keep dropdown open for multi-select
  };

  const handleAddCustomValue = async () => {
    if (customValue.trim()) {
      const currentValues = Array.isArray(value) ? value : [];
      // Use the actual custom value text
      const customOptionValue = customValue.trim();

      if (field.onCreateCustomValue) {
        try {
          setCustomError(null);
          setLoading(true);
          await field.onCreateCustomValue(customOptionValue);
        } catch (err) {
          console.error("Failed to create custom value:", err);
          setCustomError(parseBackendError(err));
          setLoading(false);
          return;
        } finally {
          setLoading(false);
        }
      }

      // Add to options list for display
      const newOption = {
        value: customOptionValue,
        label: customValue.trim()
      };

      // Check if this custom value already exists in options
      const exists = optionsMap.has(customOptionValue);
      if (!exists) {
        setOptions(prev => [...prev, newOption]);
        setFilteredOptions(prev => [...prev, newOption]);
      }

      // Add to selected values
      if (field.multiSelect) {
        if (!currentValues.includes(customOptionValue)) {
          onChange(field.fieldname, [...currentValues, customOptionValue]);
        }
      } else {
        onChange(field.fieldname, customOptionValue);
      }

      setCustomValue("");
      setShowCustomInput(false);
    }
  };

  const handleCustomInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomValue();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomValue("");
    }
  };

  const removeSelectedItem = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (Array.isArray(value)) {
      const newValues = value.filter(v => v !== itemToRemove);
      onChange(field.fieldname, newValues);
    }
  };

  const isSelected = (optionValue: string) => {
    if (field.multiSelect) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const getSelectedLabels = () => {
    if (!Array.isArray(value) || value.length === 0) return null;
    return value.map(val => ({
      value: val,
      label: optionsMap.get(val) || val
    }));
  };

  const getSelectedLabel = () => {
    if (!value) return field.placeholder || `Select ${field.label}`;
    // If we have a value but options aren't loaded yet, show the value itself
    // This allows pre-filled data to be visible without triggering an API call
    return optionsMap.get(value) || value;
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ?
            <span key={i} className="bg-yellow-200 font-medium">{part}</span> :
            <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  if (field.hidden) return null;

  const renderField = () => {
    // API Dropdown (Single or Multi select) with search
    if (field.apiEndpoint) {
      return (
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown trigger */}
          <div
            onClick={!field.disabled ? handleDropdownClick : undefined}
            className={`w-full min-h-10 px-3 py-2 rounded-md border ${error ? "border-red-500" : fetchError ? "border-red-500" : "border-slate-200"
              } bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer flex flex-wrap items-center gap-1 relative hover:border-slate-300 transition-colors ${field.read_only || field.disabled ? "bg-slate-50 cursor-not-allowed opacity-60" : ""
              } ${field.inputClassName || ""}`}
          >
            {field.multiSelect && Array.isArray(value) && value.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1 flex-1">
                {getSelectedLabels()?.map((selected) => (
                  <span
                    key={selected.value}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded-md text-xs font-medium"
                  >
                    {selected.label}
                    <button
                      onClick={(e) => removeSelectedItem(selected.value, e)}
                      className="hover:text-accent-foreground focus:outline-none"
                      disabled={field.read_only}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className={`flex-1 truncate ${!value && !field.multiSelect ? "text-slate-400" : ""}`}>
                {fetchError ? "Failed to load" : field.multiSelect ? field.placeholder || "Select options" : getSelectedLabel()}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Dropdown menu with search and "Others" option */}
          {isOpen && !fetchError && (
            <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
              {!showCustomInput ? (
                <>
                  {/* Search input */}
                  <div className="p-2 border-b border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Options list */}
                  <div className="max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="p-3 text-sm text-slate-400 text-center flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        <span>Loading...</span>
                      </div>
                    ) : filteredOptions.length === 0 ? (
                      <div className="p-3 text-sm text-slate-400 text-center">
                        {searchTerm ? "No matching options" : "No options available"}
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredOptions.map((option, index) => (
                          <div
                            key={option.value || option.label || index}
                            onClick={(e) => field.multiSelect ? handleMultiSelect(option.value, e) : handleSingleSelect(option.value)}
                            className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-slate-50 transition-colors ${isSelected(option.value)
                              ? "bg-accent/5 text-accent font-medium"
                              : "text-slate-700"
                              }`}
                          >
                            {field.multiSelect ? (
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected(option.value)
                                ? "bg-accent border-accent"
                                : "border-slate-300"
                                }`}>
                                {isSelected(option.value) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                            ) : (
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected(option.value)
                                ? "border-accent"
                                : "border-slate-300"
                                }`}>
                                {isSelected(option.value) && (
                                  <div className="w-2 h-2 rounded-full bg-accent" />
                                )}
                              </div>
                            )}
                            <span className="flex-1">
                              {searchTerm ? highlightMatch(option.label, searchTerm) : option.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {field.apiEndpoint && !loading && !fetchError && (hasNext || hasPrev || totalPages > 1) && (
                    <div className="flex items-center justify-between p-2 border-t border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={!hasPrev || loading}
                        onClick={() => fetchOptions(page - 1, searchTerm)}
                        className={`px-2 py-1 rounded border transition-colors ${hasPrev
                          ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                      >
                        Previous
                      </button>

                      <span>
                        Page {page} of {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={!hasNext || loading}
                        onClick={() => fetchOptions(page + 1, searchTerm)}
                        className={`px-2 py-1 rounded border transition-colors ${hasNext
                          ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  )}

                  {/* "Others" option for fields that allow custom values */}
                  {hasOthersOption && (
                    <div
                      onClick={() => setShowCustomInput(true)}
                      className="px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-slate-50 transition-colors border-t border-slate-200 text-accent font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Others (Custom Value)</span>
                    </div>
                  )}
                </>
              ) : (
                /* Custom input for "Others" */
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {field.customPlaceholder || "Enter custom value"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={customInputRef}
                      type="text"
                      value={customValue}
                      onChange={(e) => {
                        setCustomValue(e.target.value);
                        if (customError) setCustomError(null);
                      }}
                      onKeyDown={handleCustomInputKeyDown}
                      placeholder="Type here..."
                      className={`flex-1 px-3 py-2 text-sm border ${customError ? 'border-red-500' : 'border-slate-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent`}
                      autoFocus
                    />
                    <Button
                      onClick={handleAddCustomValue}
                      disabled={!customValue.trim() || loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomValue("");
                        setCustomError(null);
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                  {customError && (
                    <p className="text-xs text-red-500 mt-2 font-medium">
                      {customError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading state - COMMENTED OUT AS REQUESTED */}
          {/* {loading && (
            <p className="text-xs text-slate-400 mt-1">Loading options...</p>
          )} */}

          {/* Error and retry */}
          {fetchError && !loading && (
            <div className="mt-1">
              <p className="text-xs text-red-500 inline">{fetchError}. </p>
              <button
                type="button"
                onClick={handleRetry}
                className="text-xs text-accent underline font-medium hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      );
    }

    // Regular Select field (non-API) with search
    if (field.fieldtype === "Select" && field.options && field.options.length > 0) {
      return (
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={!field.disabled ? () => setIsOpen(!isOpen) : undefined}
            className={`w-full min-h-10 px-3 py-2 rounded-md border ${error ? "border-red-500" : "border-slate-200"
              } bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer flex items-center justify-between hover:border-slate-300 transition-colors ${field.read_only || field.disabled ? "bg-slate-50 cursor-not-allowed opacity-60" : ""
              }`}
          >
            <span className={`flex-1 truncate ${!value ? "text-slate-400" : ""}`}>
              {value || field.placeholder || `Select ${field.label}`}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
              {/* Search input for regular select */}
              <div className="p-2 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {field.options
                  .filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        onChange(field.fieldname, opt);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${value === opt ? "bg-accent/5 text-accent font-medium" : "text-slate-700"
                        }`}
                    >
                      {searchTerm ? highlightMatch(opt, searchTerm) : opt}
                    </div>
                  ))}
                {field.options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div className="p-3 text-sm text-slate-400 text-center">
                    No matching options
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Regular field types
    switch (field.fieldtype) {
      case "Password":
        return (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={field.placeholder}
              value={value || ""}
              onChange={(e) => onChange(field.fieldname, e.target.value)}
              className={baseInputClasses + " pr-10"}
              disabled={field.read_only}
              required={field.required}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );

      case "Check":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(field.fieldname, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
              disabled={field.read_only}
            />
            <span className="text-sm text-slate-600">{field.label}</span>
          </div>
        );

      case "Text":
      case "Long Text":
        const wordCount = value ? value.trim().split(/\s+/).filter((w: string) => w.length > 0).length : 0;
        const minLetters = field.minLetters || 0;
        return (
          <div className="space-y-1">
            <textarea
              placeholder={field.placeholder}
              value={value || ""}
              onChange={(e) => onChange(field.fieldname, e.target.value)}
              className={`${baseInputClasses} min-h-[100px] ${field.inputClassName || ''}`}
              disabled={field.read_only}
              required={field.required}
              maxLength={field.maxLength}
            />
            {minLetters > 0 && (
              <div className="flex items-center justify-between mt-1">
                {wordCount >= minLetters ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ Minimum reached — feel free to write more!
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">
                    {minLetters - wordCount} more {minLetters - wordCount === 1 ? 'word' : 'words'} needed
                    <span className="text-slate-400 ml-1">(minimum {minLetters} words)</span>
                  </p>
                )}
                <p className="text-xs text-slate-400">{wordCount} {wordCount === 1 ? 'word' : 'words'}</p>
              </div>
            )}
          </div>
        );

      case "Int":
      case "Float":
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(field.fieldname, e.target.value)}
            className={baseInputClasses}
            disabled={field.read_only}
            required={field.required}
            step={field.fieldtype === "Float" ? "0.01" : "1"}
          />
        );

      case "Date":
        return (
          <input
            type="date"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(field.fieldname, e.target.value)}
            className={baseInputClasses}
            disabled={field.read_only}
            required={field.required}
          />
        );

      case "Time":
        return (
          <input
            type="time"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(field.fieldname, e.target.value)}
            className={baseInputClasses}
            disabled={field.read_only}
            required={field.required}
          />
        );

      case "Datetime":
        return (
          <input
            type="datetime-local"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(field.fieldname, e.target.value)}
            className={baseInputClasses}
            disabled={field.read_only}
            required={field.required}
          />
        );

      case "Data":
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(field.fieldname, e.target.value)}
            className={baseInputClasses}
            disabled={field.read_only}
            required={field.required}
            maxLength={field.maxLength}
          />
        );

      case "File":

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.type !== 'application/pdf') {
              alert('Please upload only PDF files');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              alert('File size should be less than 5MB');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              return;
            }

            setFileName(file.name);
            onChange(field.fieldname, file);
          } else {
            setFileName("");
            onChange(field.fieldname, null);
          }
        };

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={field.read_only}
                />
                <div className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 flex items-center justify-between ${error ? "border-red-500" : "border-slate-200"} ${field.read_only ? "bg-slate-50 cursor-not-allowed" : "cursor-pointer hover:border-accent transition-colors"}`}>
                  <span className={`truncate ${fileName ? "text-slate-900" : "text-slate-400"}`}>
                    {fileName || field.placeholder || "Choose file..."}
                  </span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                    Browse
                  </span>
                </div>
              </div>
            </div>
            {fileName && (
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <span>✓</span>
                <span className="truncate">{fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName("");
                    onChange(field.fieldname, null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-500 hover:text-red-700 ml-auto"
                >
                  Remove
                </button>
              </div>
            )}
            {field.description && (
              <p className="text-xs text-slate-500 mt-1">{field.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-1">
      {field.fieldtype !== "Check" && (
        <label className="text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.description && (
            <span className="text-xs font-normal text-slate-500 ml-2">
              {field.description}
            </span>
          )}
        </label>
      )}

      {renderField()}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
