"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import {
  Building2,
  Edit3,
  Monitor,
  Star,
  Globe,
  MapPin,
  Layers,
  Target as TargetIcon,
  Users,
  Zap,
  ShieldCheck,
  Factory,
  GraduationCap,
  Plus,
  ArrowUpRight,
  Loader2,
  FileText,
  Briefcase,
  Layout,
  Calendar,
  ListChecks,
  Clock,
  Pen,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { BaseCard } from "@/components/dashboards/shared/BaseCard";
import { CardHeader } from "@/components/dashboards/shared/CardHeader";
import { updateIndustry, addRequiredRole, updateIndustryRole, deleteIndustryRole, addHiringRound, getProjectApplicationCount, getSkillDomain, createSkillDomain, updateSkillDomain, deleteSkillDomain, getCampusPartnerList, createCampusPartner, deleteCampusPartner, getMasterData, deleteHiringRound, updateHiringRound, createDomain, createSubDomain, createDesignation, createSkill } from "@/services/industry.services";
import { useIndustry, IndustryData, IndustryRole, HiringRound } from "@/context/IndustryContext";
import { useToast } from "@/context/ToastContext";
import DashboardDynamicModal, { DynamicField } from "@/components/dashboards/shared/DashboardDynamicModal";
import { Pagination } from "@/components/ui/Pagination";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.3 } },
};

const colorThemes = [
  {
    color: "text-blue-600",
    dotBg: "bg-blue-600",
    bg: "bg-blue-50/50",
    borderColor: "border-blue-100",
  },
  {
    color: "text-purple-600",
    dotBg: "bg-purple-600",
    bg: "bg-purple-50/50",
    borderColor: "border-purple-100",
  },
  {
    color: "text-orange-600",
    dotBg: "bg-orange-600",
    bg: "bg-orange-50/50",
    borderColor: "border-orange-100",
  },
  {
    color: "text-emerald-600",
    dotBg: "bg-emerald-600",
    bg: "bg-emerald-50/50",
    borderColor: "border-emerald-100",
  }
];

export default function CompanyProfileTabContent() {
  const {
    industryData: data,
    roleList,
    loading,
    roleLoading,
    error,
    refreshIndustryData,
    refreshRoleList
  } = useIndustry();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"role" | "hiring" | "skill_domain" | "campus_partner">("role");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalValues, setModalValues] = useState<Record<string, any>>({});

  const [roleToEdit, setRoleToEdit] = useState<IndustryRole | undefined>(undefined);
  const [roundToEdit, setRoundToEdit] = useState<HiringRound | undefined>(undefined);
  const [skillDomainToEdit, setSkillDomainToEdit] = useState<any | undefined>(undefined);
  const [isDeletingSkillDomain, setIsDeletingSkillDomain] = useState<string | null>(null);
  const [isDeletingPartner, setIsDeletingPartner] = useState<string | null>(null);
  const [isDeletingHiringRound, setIsDeletingHiringRound] = useState<string | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState<string | null>(null);

  const [businessTypeOptions, setBusinessTypeOptions] = useState<string[]>([]);
  const [industrySectorOptions, setIndustrySectorOptions] = useState<string[]>([]);
  const [hiringProcessOptions, setHiringProcessOptions] = useState<string[]>([]);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [domainOptions, setDomainOptions] = useState<string[]>([]);

  const [skillDomains, setSkillDomains] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const [skillsPage, setSkillsPage] = useState(1);
  const skillsPerPage = 2;

  const totalSkillsPages = Math.ceil(skillDomains.length / skillsPerPage) || 1;

  useEffect(() => {
    if (skillsPage > totalSkillsPages && totalSkillsPages > 0) {
      setSkillsPage(totalSkillsPages);
    }
  }, [skillDomains.length, skillsPage, totalSkillsPages]);

  const paginatedSkillDomains = useMemo(() => {
    const startIndex = (skillsPage - 1) * skillsPerPage;
    return skillDomains.slice(startIndex, startIndex + skillsPerPage);
  }, [skillDomains, skillsPage]);

  const [campusPartners, setCampusPartners] = useState<any[]>([]);
  const [campusPartnersLoading, setCampusPartnersLoading] = useState(false);
  const [collegeOptions, setCollegeOptions] = useState<string[]>([]);

  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  const fetchSkillsList = async () => {
    const companyName = data?.company_name || data?.name;
    if (!companyName) return;
    try {
      setSkillsLoading(true);
      const response = await getSkillDomain(companyName);

      // Extensive data extraction
      let apiData: any[] = [];
      if (Array.isArray(response)) {
        apiData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        apiData = response.data;
      } else if (response?.message?.data && Array.isArray(response.message.data)) {
        apiData = response.message.data;
      } else if (response?.message && Array.isArray(response.message)) {
        apiData = response.message;
      } else if (typeof response === 'object' && response !== null) {
        // Fallback for single object or nested 'message' with 'data'
        apiData = response.data || response.message?.data || response.message || [];
      }

      if (!Array.isArray(apiData)) apiData = [];

      const mapped = apiData.map((domain: any, idx: number) => {
        const theme = colorThemes[idx % colorThemes.length] || colorThemes[0];
        return {
          id: domain.name || `domain-${idx}-${Date.now()}`,
          title: domain.domain || domain.skill_domain || "Untitled Domain",
          tags: Array.isArray(domain.skills) ? domain.skills.map((s: any) => s.skill).filter(Boolean) : [],
          roles: Array.isArray(domain.roles) && domain.roles.length > 0 ? domain.roles.map((r: any) => r.designation).filter(Boolean).join(" • ") : "N/A",
          openings: Number(domain.openings) || 0,
          ...theme,
          raw: domain
        };
      });
      setSkillDomains(mapped);
    } catch (err: any) {
      console.error("Error in fetchSkillsList:", err);
      setSkillsError(err?.message || "Failed to load skill domains");
      setSkillDomains([]);
    } finally {
      setSkillsLoading(false);
    }
  };

  const fetchCampusPartners = async () => {
    const companyName = data?.company_name || data?.name;
    if (!companyName) return;
    try {
      setCampusPartnersLoading(true);
      setPartnersError(null);
      const response = await getCampusPartnerList(companyName);
      const apiData = response?.data || response?.message?.data || response?.message || [];
      setCampusPartners(Array.isArray(apiData) ? apiData : []);
    } catch (err: any) {
      console.error("Error fetching campus partners:", err);
      setPartnersError(err?.message || "Failed to load campus partners");
    } finally {
      setCampusPartnersLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillsList();
    fetchCampusPartners();
    // Fetch critical options on mount to ensure they are available for the modal
    fetchMasterOptions("Skill", setSkillOptions);
    fetchMasterOptions("Designation", setDesignationOptions);
    fetchMasterOptions("College", setCollegeOptions);
    fetchMasterOptions("Domain", setDomainOptions);
    setSkillsPage(1);
  }, [data?.company_name]);


  const roleFields: DynamicField[] = useMemo(() => [
    { name: "role", label: "Job Role", type: "text", icon: Briefcase, required: true, colSpan: 2, placeholder: "e.g. Software Development Engineer" },
    { name: "duration", label: "Duration", type: "text", icon: Calendar, required: true, placeholder: "e.g. 6 Months" },
    { name: "semester", label: "Semester", type: "text", icon: GraduationCap, required: true, placeholder: "e.g. 6th or 8th" },
    { name: "available_positions", label: "Open Positions", type: "number", icon: Users, required: true, placeholder: "e.g. 10" },
    { name: "description", label: "Description", type: "textarea", icon: FileText, required: true, colSpan: 2, placeholder: "List key responsibilities and requirements..." },
  ], []);

  const hiringFields: DynamicField[] = useMemo(() => [
    {
      name: "round",
      label: "Round Name",
      type: "select",
      icon: ListChecks,
      options: hiringProcessOptions.length > 0 ? hiringProcessOptions : ["Technical Interview", "HR Interview", "Aptitude Test", "Other"],
      required: true,
      colSpan: 2,
      placeholder: "Select Round Name"
    },
    { name: "based_on", label: "Based On", type: "text", icon: TargetIcon, required: true, colSpan: 2, placeholder: "e.g. Coding & Data Structures" },
    { name: "duration", label: "Duration (min)", type: "number", icon: Clock, required: true, colSpan: 2, placeholder: "e.g. 45" },
  ], [hiringProcessOptions]);

  const skillDomainFields: DynamicField[] = useMemo(() => [
    {
      name: "domain",
      label: "Domain Name",
      type: "select",
      icon: TargetIcon,
      required: true,
      colSpan: 2,
      placeholder: "Select Domain",
      allowCustom: true,
      customPlaceholder: "Enter custom domain...",
      onCreateCustomValue: async (val: string) => {
        try {
          await createDomain(val);
          // Refresh local options list to include the new domain
          fetchMasterOptions("Domain", setDomainOptions);
        } catch (err) {
          console.error("Failed to create domain master record:", err);
          throw err;
        }
      },
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Domain" }
    },
    {
      name: "sub_domain",
      label: "Sub Domain",
      type: (modalValues.domain && domainOptions.length > 0 && !domainOptions.includes(modalValues.domain)) ? "text" : "select",
      icon: TargetIcon,
      required: false,
      colSpan: 2,
      placeholder: modalValues.domain ? "Select Sub Domain" : "Select Domain first",
      disabled: !modalValues.domain,
      allowCustom: true,
      customPlaceholder: "Enter custom sub domain...",
      onCreateCustomValue: async (val: string) => {
        try {
          await createSubDomain(val, modalValues.domain);
          // Sub-domain API results are usually filtered by domain, so we don't necessarily 
          // need to refresh a global list here like we did for domains.
        } catch (err) {
          console.error("Failed to create sub-domain master record:", err);
          throw err;
        }
      },
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: {
        doctype: "Sub Domain",
        filters: { domain: modalValues.domain }
      }
    },
    { 
      name: "skills", 
      label: "Skills We Audit", 
      type: "select", 
      icon: Zap, 
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Skill" },
      required: true, 
      colSpan: 2, 
      placeholder: "Select Skills", 
      multiple: true, 
      allowCustom: true, 
      customPlaceholder: "Enter custom skill...",
      onCreateCustomValue: async (val: string) => {
        try {
          await createSkill(val);
        } catch (err) {
          console.error("Failed to create skill record:", err);
          throw err;
        }
      }
    },
    { 
      name: "roles", 
      label: "Designations", 
      type: "select", 
      icon: Briefcase, 
      apiEndpoint: "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      apiParams: { doctype: "Designation" },
      required: true, 
      colSpan: 2, 
      placeholder: "Select Designations", 
      multiple: true, 
      allowCustom: true, 
      customPlaceholder: "Enter custom designation...",
      onCreateCustomValue: async (val: string) => {
        try {
          await createDesignation(val);
        } catch (err) {
          console.error("Failed to create designation record:", err);
          throw err;
        }
      }
    },
  ], [modalValues.domain, domainOptions]);

  const handleModalValuesChange = (values: Record<string, any>, changedField: string) => {
    setModalValues(values);
    if (changedField === "domain") {
      setModalValues(prev => ({ ...prev, sub_domain: "" }));
      return { sub_domain: "" };
    }
  };

  const campusPartnerFields: DynamicField[] = useMemo(() => [
    { name: "college", label: "Select College", type: "select", icon: GraduationCap, options: collegeOptions, required: true, colSpan: 2, placeholder: "Select Campus Partner" },
  ], [collegeOptions]);

  const activeFields = useMemo(() => {
    if (modalMode === "role") return roleFields;
    if (modalMode === "skill_domain") return skillDomainFields;
    if (modalMode === "campus_partner") return campusPartnerFields;
    return hiringFields;
  }, [modalMode, roleFields, hiringFields, skillDomainFields, campusPartnerFields]);

  const modalInitialValues = useMemo(() => {
    if (modalMode === "role") {
      return roleToEdit ? { ...roleToEdit } : undefined;
    }
    if (modalMode === "skill_domain") {
      if (skillDomainToEdit) {
        return {
          domain: skillDomainToEdit.domain || skillDomainToEdit.skill_domain || "",
          sub_domain: skillDomainToEdit.sub_domain || "",
          skills: Array.isArray(skillDomainToEdit.skills) ? skillDomainToEdit.skills.map((s: any) => s.skill) : [],
          roles: Array.isArray(skillDomainToEdit.roles) ? skillDomainToEdit.roles.map((r: any) => r.designation) : [],
        };
      }
      return { industry: data?.company_name };
    }
    if (modalMode === "campus_partner") {
      return { industry: data?.company_name };
    }
    return roundToEdit ? { ...roundToEdit } : undefined;
  }, [modalMode, data, roleToEdit, roundToEdit, skillDomainToEdit]);

  // Sync modalValues when modal opens or initial values change
  useEffect(() => {
    if (isModalOpen && modalInitialValues) {
      setModalValues(modalInitialValues);
    } else if (!isModalOpen) {
      setModalValues({});
    }
  }, [isModalOpen, modalInitialValues]);

  const handleModalSubmit = async (formData: any) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (modalMode === "role") {
        const payload = {
          ...formData,
          industry: data?.company_name || formData.industry,
          amended_from: formData.amended_from || "",
          name: roleToEdit?.name || formData.name
        };
        if (roleToEdit?.name) {
          await updateIndustryRole(roleToEdit.name, payload);
          setRoleToEdit(undefined);
        } else {
          await addRequiredRole(payload, data?.company_name || formData.industry || "");
        }
        await refreshRoleList();
      } else if (modalMode === "hiring") {
        const payload = {
          ...formData,
          industry_name: data?.company_name,
        };
        if (roundToEdit?.name) {
          payload.row_name = roundToEdit.name;
          await updateHiringRound(payload);
        } else {
          await addHiringRound(payload);
        }
        await refreshIndustryData();
      } else if (modalMode === "skill_domain") {
        const payload = {
          industry: data?.company_name || data?.name || "",
          domain: formData.domain,
          sub_domain: formData.sub_domain || "",
          skills: Array.isArray(formData.skills) ? formData.skills.map((s: string) => ({ skill: s })) : [],
          roles: Array.isArray(formData.roles) ? formData.roles.map((r: string) => ({ designation: r })) : [],
        };
        if (skillDomainToEdit) {
          await updateSkillDomain(skillDomainToEdit.name, { ...payload, name: skillDomainToEdit.name });
          setSkillDomainToEdit(undefined);
        } else {
          await createSkillDomain(payload);
        }
        await fetchSkillsList();
      } else if (modalMode === "campus_partner") {
        const payload = {
          industry: data?.company_name,
          college: formData.college
        };
        await createCampusPartner(payload);
        await fetchCampusPartners();
      }
      showToast(`${modalMode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} saved successfully`, "success");
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to save data";
      setModalError(msg);
      showToast(msg, "error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSkillDomain = async (name: string) => {
    if (!window.confirm("Are you sure you want to delete this skill domain?")) return;
    try {
      setIsDeletingSkillDomain(name);
      await deleteSkillDomain(name);
      await fetchSkillsList();
      showToast("Skill domain deleted", "success");
    } catch (err: any) {
      console.error("Error deleting skill domain:", err);
      showToast(err?.message || "Failed to delete skill domain", "error");
    } finally {
      setIsDeletingSkillDomain(null);
    }
  };

  const handleDeleteCampusPartner = async (name: string) => {
    if (!window.confirm("Are you sure you want to delete this campus partner?")) return;
    try {
      setIsDeletingPartner(name);
      await deleteCampusPartner(name);
      await fetchCampusPartners();
      showToast("Campus partner removed", "success");
    } catch (err: any) {
      console.error("Error deleting campus partner:", err);
      showToast(err?.message || "Failed to delete campus partner", "error");
    } finally {
      setIsDeletingPartner(null);
    }
  };

  const handleDeleteHiringRound = async (rowName: string) => {
    if (!window.confirm("Are you sure you want to delete this hiring round?")) return;
    try {
      setIsDeletingHiringRound(rowName);
      await deleteHiringRound(data?.company_name || "", rowName);
      await refreshIndustryData();
      showToast("Hiring round deleted", "success");
    } catch (err: any) {
      console.error("Error deleting hiring round:", err);
      showToast(err?.message || "Failed to delete hiring round", "error");
    } finally {
      setIsDeletingHiringRound(null);
    }
  };

  const handleDeleteRole = async (name: string) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      setIsDeletingRole(name);
      await deleteIndustryRole(name);
      await refreshRoleList();
      showToast("Role deleted", "success");
    } catch (err: any) {
      console.error("Error deleting role:", err);
      showToast(err?.message || "Failed to delete role", "error");
    } finally {
      setIsDeletingRole(null);
    }
  };

  const fetchMasterOptions = async (doctype: string, setter: (val: string[]) => void) => {
    try {
      const data = await getMasterData(doctype);
      const apiData = data.data || data.message || [];
      const options = Array.isArray(apiData) ? apiData.map((item: any) => item.name) : [];
      setter(options);
    } catch (err) {
      console.error(`Error fetching ${doctype} options:`, err);
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    if (fieldName === "business_type" && businessTypeOptions.length === 0) {
      fetchMasterOptions("Business Type", setBusinessTypeOptions);
    } else if (fieldName === "industry_sector" && industrySectorOptions.length === 0) {
      fetchMasterOptions("Industry Sector", setIndustrySectorOptions);
    } else if (fieldName === "round" && hiringProcessOptions.length === 0) {
      fetchMasterOptions("Hiring Process", setHiringProcessOptions);
    } else if (fieldName === "skills" && skillOptions.length === 0) {
      fetchMasterOptions("Skill", setSkillOptions);
    } else if (fieldName === "roles" && designationOptions.length === 0) {
      fetchMasterOptions("Designation", setDesignationOptions);
    } else if (fieldName === "college" && collegeOptions.length === 0) {
      fetchMasterOptions("College", setCollegeOptions);
    } else if (fieldName === "domain" && domainOptions.length === 0) {
      fetchMasterOptions("Domain", setDomainOptions);
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };


  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm tracking-widest uppercase tracking-widest">Loading Company Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center px-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <Zap className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
        <p className="text-slate-500 font-medium max-w-md">{error || "We couldn't retrieve the company profile at this time."}</p>
        <button
          onClick={() => refreshIndustryData()}
          className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* Dynamic Modal */}
      <DashboardDynamicModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSkillDomainToEdit(undefined);
          setRoleToEdit(undefined);
          setRoundToEdit(undefined);
        }}
        title={
          modalMode === "role" ? (roleToEdit ? "Edit Role" : "Add New Role") :
            modalMode === "skill_domain" ? (skillDomainToEdit ? "Edit Skill Domain" : "Add Skill Domain") :
              modalMode === "campus_partner" ? "Add Campus Partner" :
                (roundToEdit ? "Edit Hiring Round" : "Add Hiring Round")
        }
        subtitle={capitalizeFirstLetter(data?.company_name || "")}
        headerIcon={
          modalMode === "role" ? Briefcase :
            modalMode === "skill_domain" ? TargetIcon :
              modalMode === "campus_partner" ? GraduationCap :
                ListChecks
        }
        iconBgColor={
          modalMode === "role" ? "bg-indigo-600" :
            modalMode === "skill_domain" ? "bg-red-600" :
              modalMode === "campus_partner" ? "bg-emerald-600" :
                "bg-emerald-600"
        }
        fields={activeFields}
        initialValues={modalInitialValues}
        onSubmit={handleModalSubmit}
        loading={modalLoading}
        error={modalError}
        onFieldFocus={handleFieldFocus}
        onValuesChange={handleModalValuesChange}
      />

      {/* Main Grid Stories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          <BaseCard className="border-slate-200 shadow-sm rounded-3xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Company Overview</h2>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">THE MISSION</h3>
                  <p className="text-base text-slate-700 leading-relaxed font-medium opacity-90">
                    {data?.about || "No overview available for this company."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Industry", value: data?.industry_sector || "N/A", icon: Layers, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Size", value: data?.employee_head_count ? `${parseInt(data.employee_head_count).toLocaleString()}+` : "N/A", icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
                    { label: "HQ", value: data?.headquarters || "N/A", icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "Website", value: data?.company_website || "N/A", icon: Globe, color: "text-indigo-500", bg: "bg-indigo-50" },
                    { label: "CIN", value: data?.cin || "N/A", icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
                    { label: "Stage", value: "Series F Unicorn", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },

                    { label: "GST Status", value: data?.gst_number ? "Registered" : "Pending", icon: ShieldCheck, color: "text-slate-600", bg: "bg-slate-100" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className={`p-2 rounded-xl ${item.bg}`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate pl-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BaseCard>

          {/* Skill Domains - Vibrant */}
          {/* Skill Domains - Vibrant & Robust */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-3">
                <TargetIcon className="w-5 h-5 text-red-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Skill Domains We Audit</h2>
              </div>
              <button
                onClick={() => {
                  setSkillDomainToEdit(undefined);
                  setModalMode("skill_domain");
                  setIsModalOpen(true);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-red-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Re-trigger container for visibility and debug */}
            <div className="grid grid-cols-1 gap-4">
              {skillsLoading ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fetching Skill Domains...</p>
                </div>
              ) : skillsError ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 bg-red-50/50 rounded-3xl border-2 border-dashed border-red-100 text-center px-6">
                  <Zap className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-red-700">{skillsError}</p>
                    <button
                      onClick={fetchSkillsList}
                      className="mt-3 bg-white text-red-600 px-4 py-1.5 rounded-xl text-xs font-bold border border-red-200 hover:bg-red-50 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : skillDomains.length > 0 ? (
                paginatedSkillDomains.map((domain) => (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`${domain.bg} border-2 ${domain.borderColor} rounded-3xl p-6 group hover:bg-white hover:border-slate-200 transition-all cursor-default relative overflow-hidden shadow-sm`}
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-3 h-3 rounded-full ${domain.dotBg} shadow-lg shadow-black/10`} />
                          <h3 className="text-xl font-bold text-slate-900">{domain.title}</h3>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSkillDomainToEdit(domain.raw);
                                setModalMode("skill_domain");
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-white/50 rounded-lg text-slate-400 hover:text-blue-600"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSkillDomain(domain.raw.name);
                              }}
                              disabled={isDeletingSkillDomain === domain.raw.name}
                              className="p-1.5 hover:bg-white/50 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-30"
                            >
                              {isDeletingSkillDomain === domain.raw.name ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5 mb-6">
                          {domain.tags.length > 0 ? domain.tags.map((tag: string) => (
                            <span key={tag} className="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-100 shadow-sm hover:border-slate-300 transition-colors">
                              {tag}
                            </span>
                          )) : (
                            <span className="text-xs text-slate-400 font-medium italic opacity-60">No skills added</span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-white/50 px-3 py-1 rounded-lg inline-block border border-slate-100">
                          <span className="text-slate-400">ROLES:</span> {domain.roles || "None defined"}
                        </p>
                      </div>

                      {domain.openings > 0 && (
                        <span className={`px-4 py-2 bg-white ${domain.color} text-[10px] font-bold rounded-xl border-2 ${domain.borderColor} uppercase tracking-[0.1em] shadow-sm`}>
                          {domain.openings} OPENINGS
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 text-center px-6">
                  <TargetIcon className="w-8 h-8 text-slate-300" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">No skill domains listed</p>
                    <p className="text-xs text-slate-500 mt-1">We haven't audited any skill domains for this company yet.</p>
                  </div>
                </div>
              )}
            </div>

            {totalSkillsPages > 1 && (
              <Pagination
                currentPage={skillsPage}
                totalPages={totalSkillsPages}
                onPageChange={setSkillsPage}
                className="mt-4"
              />
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          {/* <BaseCard className="border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Roles We Offer</h3>
              <button
                onClick={() => {
                  setRoleToEdit(undefined);
                  setModalMode("role");
                  setIsModalOpen(true);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-blue-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {roleLoading ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Updating Roles...</p>
                </div>
              ) : roleList && roleList.length > 0 ? (
                roleList.map((role, idx) => {
                  const roleIcons: Record<string, any> = {
                    "Full-Time": Building2,
                    "Internship": Monitor,
                    "Research": GraduationCap,
                  };
                  const Icon = roleIcons[role.role] || Building2;

                  return (
                    <div key={idx} className="flex items-center justify-between group cursor-default hover:translate-x-1 transition-transform relative">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-transparent shadow-sm group-hover:border-inherit transition-all`}>
                          <Icon className={`w-6 h-6 text-blue-500`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-800 leading-tight">{role.role}</h4>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRoleToEdit(role);
                                  setModalMode("role");
                                  setIsModalOpen(true);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-blue-600"
                                title="Edit Role"
                              >
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (role.name) handleDeleteRole(role.name);
                                }}
                                disabled={isDeletingRole === role.name}
                                className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-red-500 disabled:opacity-30"
                                title="Delete Role"
                              >
                                {isDeletingRole === role.name ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
                            {Number(role.duration) > 0 ? `${role.duration} Months` : role.semester}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-orange-600 leading-none">{role.available_positions}</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">OPEN</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl group hover:border-blue-200 transition-all">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-6 text-center px-4">No roles listed yet</p>
                  <button
                    onClick={() => {
                      setRoleToEdit(undefined);
                      setModalMode("role");
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                  >
                    <Plus className="w-4 h-4" /> Add Required Role
                  </button>
                </div>
              )}
            </div>
          </BaseCard> */}

          {/* Hiring Pipeline */}
          <BaseCard className="border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Hiring Pipeline</h3>
              <button
                onClick={() => {
                  setRoundToEdit(undefined);
                  setModalMode("hiring");
                  setIsModalOpen(true);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-emerald-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-10 relative">
              {data?.hiring_process && data.hiring_process.length > 0 ? (
                data.hiring_process.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 group">
                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold text-slate-800 leading-none">{step.round}</h4>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setRoundToEdit(step);
                              setModalMode("hiring");
                              setIsModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-emerald-600"
                            title="Edit Round"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { if (step.name) handleDeleteHiringRound(step.name); }}
                            disabled={isDeletingHiringRound === step.name}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-red-500 disabled:opacity-30"
                            title="Delete Round"
                          >
                            {isDeletingHiringRound === step.name ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">Based on: {step.based_on}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                    <TargetIcon className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-6 text-center px-4">No hiring rounds defined</p>
                  <button
                    onClick={() => {
                      setRoundToEdit(undefined);
                      setModalMode("hiring");
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                  >
                    <Plus className="w-4 h-4" /> Add Hiring Round
                  </button>
                </div>
              )}
            </div>
          </BaseCard>

          {/* Campus Partners */}
          {/* <BaseCard className="border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-gradient-to-br from-slate-50 to-white">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                Campus Partners
                {!campusPartnersLoading && campusPartners.length > 0 && (
                  <button
                    onClick={() => {
                      setModalMode("campus_partner");
                      setIsModalOpen(true);
                    }}
                    className="p-1 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {campusPartnersLoading ? (
                  <div className="w-full py-4 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : partnersError ? (
                  <div className="w-full py-4 text-center">
                    <p className="text-[10px] font-bold text-red-500 uppercase mb-2">{partnersError}</p>
                    <button
                      onClick={fetchCampusPartners}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : campusPartners.length > 0 ? (
                  campusPartners.map((partner, idx) => {
                    const partnerId = partner.name || `${data?.company_name}-${partner.college}`;
                    const isDeleting = isDeletingPartner === partnerId;

                    return (
                      <div
                        key={partnerId}
                        className={`px-3 py-1.5 bg-white text-slate-700 text-[10px] font-bold rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-default flex items-center gap-2 group/tag shrink-0 ${isDeleting ? 'opacity-50 grayscale' : ''}`}
                      >
                        <span className="truncate max-w-[150px]">{partner.college}</span>
                        <button
                          onClick={() => handleDeleteCampusPartner(partnerId)}
                          disabled={isDeleting}
                          className="text-slate-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 ml-1">No campus partners added</p>
                    <button
                      onClick={() => {
                        setModalMode("campus_partner");
                        setIsModalOpen(true);
                      }}
                      className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-2xl border border-slate-200 transition-all text-xs flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus className="w-5 h-5 text-indigo-500" /> Add Corporate Partner
                    </button>
                  </div>
                )}
              </div>
            </div>
          </BaseCard> */}
        </div>
      </div>
    </motion.div>
  );
}
