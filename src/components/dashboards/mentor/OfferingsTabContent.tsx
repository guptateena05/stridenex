"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Plus, Edit3, Star, Clock, Loader2, AlertCircle, Layout, Tag, Users, Calendar, Timer, FileText, Info } from "lucide-react";
import { getMentorOfferings, createMentorOffering, updateMentorOffering, createLmsBatchForOffering } from "@/services/mentor.services";
import { useAuth } from "@/context/AuthContext";
import DashboardDynamicModal, { DynamicField } from "@/components/dashboards/shared/DashboardDynamicModal";
import { useToast } from "@/context/ToastContext";
import { Pagination } from "@/components/ui/Pagination";

export default function OfferingsTabContent() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const userEmail = currentUser || localStorage.getItem("userEmail") || "";

  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offeringsPage, setOfferingsPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 9;

  const totalOfferingsPages = Math.ceil(offerings.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (offerings.length > 0) {
      const maxPage = Math.ceil(offerings.length / ITEMS_PER_PAGE);
      if (offeringsPage > maxPage) {
        setOfferingsPage(maxPage);
      }
    } else {
      setOfferingsPage(1);
    }
  }, [offerings.length, offeringsPage]);

  const paginatedOfferings = useMemo(() => {
    const startIndex = (offeringsPage - 1) * ITEMS_PER_PAGE;
    return offerings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [offerings, offeringsPage]);

  // Modal State 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingOffering, setEditingOffering] = useState<any>(null);
  const [modalValues, setModalValues] = useState<Record<string, any>>({});

  // Batch creation states
  const [showBatchPrompt, setShowBatchPrompt] = useState(false);
  const [createdOfferingName, setCreatedOfferingName] = useState<string>("");
  const [batchLoading, setBatchLoading] = useState(false);

  const handleCreateBatch = async () => {
    if (!createdOfferingName) return;
    setBatchLoading(true);
    try {
      const response = await createLmsBatchForOffering(createdOfferingName);
      if (response && response.exc_type) {
        let errMsg = "Failed to create LMS batch. Please try again.";
        if (response._server_messages) {
          try {
            const messages = JSON.parse(response._server_messages);
            const msgObj = JSON.parse(messages[0]);
            errMsg = msgObj.message || errMsg;
          } catch (e) {
            console.error("Error parsing server messages:", e);
          }
        }
        alert(errMsg);
      } else {
        const msg = response?.message?.message || (typeof response?.message === "string" ? response.message : null) || "Batch created successfully";
        alert(msg);
        setShowBatchPrompt(false);
        setCreatedOfferingName("");
        fetchOfferings();
      }
    } catch (err: any) {
      console.error("Error creating LMS batch:", err);
      const errMsg = err?.message || "Failed to create LMS Batch";
      alert(errMsg);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleCloseBatchPrompt = () => {
    setShowBatchPrompt(false);
    setCreatedOfferingName("");
    showToast("Offering created successfully", "success");
  };
 
  const fetchOfferings = async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMentorOfferings(userEmail);
      const data = res?.message?.data || res?.message || [];
      setOfferings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch offerings:", err);
      setError(err?.message || "Failed to load offerings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, [userEmail]);

  // Modal Fields
  const offeringFields: DynamicField[] = useMemo(() => {
    const isGroupOrWorkshop = ["Group Session", "Workshop"].includes(modalValues.offering_type);

    const fields: DynamicField[] = [
      { name: "title", label: "Offering Title", type: "text", icon: Layout, required: true, colSpan: 2, placeholder: "e.g. Django API Bootcamp" },
      {
        name: "offering_type", label: "Offering Type", type: "select", icon: Tag, required: true, colSpan: 1,
        options: ["1:1 Mentorship", "Group Session", "Async Review", "Workshop"]
      },
      {
        name: "category", label: "Category", type: "select", icon: Tag, required: true, colSpan: 1,
        options: ["Career", "Technical", "Interview Prep", "Resume", "Startup"]
      },
      { name: "price_per_session", label: "Price per Session (₹)", type: "number", icon: Tag, required: true, colSpan: 1, placeholder: "e.g. 1500" },
      { name: "duration_minutes", label: "Duration (minutes)", type: "number", icon: Clock, required: true, colSpan: 1, placeholder: "e.g. 60" },
      { name: "max_group_size", label: "Max Group Size", type: "number", icon: Users, required: false, colSpan: 1, placeholder: "e.g. 1" },
      {
        name: "status", label: "Initial Status", type: "select", icon: Info, required: true, colSpan: 1,
        options: ["Live", "Draft", "Paused"]
      },
    ];

    if (isGroupOrWorkshop) {
      fields.push(
        { name: "start_date", label: "Start Date", type: "date", icon: Calendar, required: true, colSpan: 1, placeholder: "DD/MM/YYYY", textTransform: "uppercase", min: new Date().toISOString().split('T')[0] },
        { name: "end_date", label: "End Date", type: "date", icon: Calendar, required: true, colSpan: 1, placeholder: "DD/MM/YYYY", textTransform: "uppercase", min: modalValues.start_date },
        { name: "start_time", label: "Start Time", type: "time", icon: Timer, required: true, colSpan: 1 },
        { name: "end_time", label: "End Time", type: "time", icon: Timer, required: true, colSpan: 1 }
      );
    }

    fields.push(
      { name: "description", label: "Detailed Description", type: "textarea", icon: FileText, required: true, colSpan: 2, placeholder: "What will students learn in this offering?" }
    );

    if (isGroupOrWorkshop) {
      fields.push(
        { name: "batch_details", label: "Batch Details", type: "textarea", icon: FileText, required: true, colSpan: 2, placeholder: "Specific info about this batch" }
      );
    }

    // fields.push({
    //   name: "is_featured", label: "Feature on Profile", type: "custom", colSpan: 1,
    //   customRender: (formData, setFieldValue) => (
    //     <div
    //       onClick={() => setFieldValue(formData.is_featured === "1" ? "0" : "1")}
    //       className="flex items-center gap-3 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all"
    //     >
    //       <input
    //         type="checkbox"
    //         checked={formData.is_featured === "1"}
    //         onChange={() => { }}
    //         className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
    //       />
    //       <span className="text-sm font-semibold text-slate-700">Display on main profile</span>
    //     </div>
    //   )
    // });

    return fields;
  }, [modalValues.offering_type, modalValues.start_date]);

  const modalInitialValues = useMemo(() => {
    if (editingOffering) {
      return {
        title: editingOffering.title || "",
        offering_type: editingOffering.offering_type || "1:1 Mentorship",
        category: editingOffering.category || "Technical",
        price_per_session: editingOffering.price_per_session || 0,
        duration_minutes: editingOffering.duration_minutes || 60,
        max_group_size: editingOffering.max_group_size || 1,
        status: editingOffering.status || "Live",
        description: editingOffering.description || "",
        batch_details: editingOffering.batch_details || "",
        start_date: editingOffering.start_date || "",
        end_date: editingOffering.end_date || "",
        start_time: editingOffering.start_time || "",
        end_time: editingOffering.end_time || "",
        is_featured: String(editingOffering.is_featured || "0"),
      };
    }
    return {
      offering_type: "1:1 Mentorship",
      category: "Technical",
      price_per_session: 500,
      duration_minutes: 60,
      max_group_size: 1,
      status: "Live",
      is_featured: "0"
    };
  }, [editingOffering]);

  const handleModalSubmit = async (formData: any) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const payload = {
        ...formData,
        mentor: userEmail,
        is_featured: parseInt(formData.is_featured || "0"),
        price_per_session: parseFloat(formData.price_per_session),
        duration_minutes: parseInt(formData.duration_minutes),
        max_group_size: parseInt(formData.max_group_size || "1"),
        ...(editingOffering ? { name: editingOffering.name } : {}),
      };

      if (editingOffering) {
        await updateMentorOffering(editingOffering.name, payload);
        setIsModalOpen(false);
        fetchOfferings();
      } else {
        const response = await createMentorOffering(payload);
        const createdName = response?.message?.name || response?.name || response?.message || response?.data?.name;
        
        setIsModalOpen(false);
        fetchOfferings();
 
        if (createdName && formData.offering_type === "Group Session") {
          setCreatedOfferingName(createdName);
          setShowBatchPrompt(true);
        } else {
          showToast("Offering created successfully", "success");
        }
      }
    } catch (err: any) {
      setModalError(err?.message || "Failed to save offering");
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusToggle = async (offering: any) => {
    const currentStatus = offering.status;
    const newStatus = currentStatus === "Live" ? "Paused" : "Live";

    try {
      setOfferings(prev => prev.map(o => o.name === offering.name ? { ...o, status: newStatus } : o));

      const payload = {
        ...offering,
        status: newStatus,
        is_featured: parseInt(String(offering.is_featured || "0")),
        price_per_session: parseFloat(String(offering.price_per_session || "0")),
        duration_minutes: parseInt(String(offering.duration_minutes || "60")),
        max_group_size: parseInt(String(offering.max_group_size || "1")),
      };

      await updateMentorOffering(offering.name, payload);
    } catch (err: any) {
      setOfferings(prev => prev.map(o => o.name === offering.name ? { ...o, status: currentStatus } : o));
      showToast(err?.message || "Failed to update status", "error");
    }
  };

  const handleAddOffering = () => {
    setEditingOffering(null);
    setModalValues({
      offering_type: "1:1 Mentorship",
      category: "Technical",
      price_per_session: 500,
      duration_minutes: 60,
      max_group_size: 1,
      status: "Live",
      is_featured: "0"
    });
    setIsModalOpen(true);
  };

  const handleEditOffering = (offering: any) => {
    setEditingOffering(offering);
    setModalValues({
      ...offering,
      is_featured: String(offering.is_featured || "0"),
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading your offerings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-800">Oops! Something went wrong</h3>
          <p className="text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchOfferings}
          className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Offerings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage sessions, pricing, and availability of your mentorship packages</p>
        </div>
        <button
          onClick={handleAddOffering}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Offering
        </button>
      </div>

      {offerings.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No offerings yet</h3>
          <p className="text-slate-500 mt-1 max-w-xs mx-auto">Create your first mentorship offering to start helping students.</p>
          <button
            onClick={handleAddOffering}
            className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            Create Offering
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedOfferings.map((offering, i) => {
              const badges = [
                { label: offering.offering_type || "1:1 Mentorship", style: "bg-blue-50 text-blue-600" },
                { label: offering.duration_minutes ? `${offering.duration_minutes} min` : "60 min", icon: Clock, style: "text-slate-500" },
                { label: offering.category || "General", style: "text-orange-500 font-medium" }
              ];

              return (
                <motion.div
                  key={offering.name || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight flex-1 pr-2">{offering.title}</h3>
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${offering.status === 'Live'
                      ? 'bg-emerald-50 text-emerald-600'
                      : offering.status === 'Paused'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${offering.status === 'Live'
                        ? 'bg-emerald-500'
                        : offering.status === 'Paused'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                        }`}></span>
                      {offering.status || 'Draft'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {badges.map((badge, j) => (
                      <span key={j} className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.style}`}>
                        {badge.icon && <badge.icon className="w-3.5 h-3.5" />}
                        {badge.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-end mt-auto mb-6">
                    <div>
                      <h4 className="text-2xl font-extrabold text-slate-800 leading-none">₹{offering.price_per_session || 0}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Per Session</p>
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-slate-800 leading-none">{offering.total_bookings || 0}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Bookings</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xl font-bold flex items-center gap-1 text-slate-800 leading-none justify-end">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" /> {offering.avg_rating || 0}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Rating</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleEditOffering(offering)}
                      className="flex-1 py-2 text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleStatusToggle(offering)}
                      className={`flex-1 py-2 border font-semibold text-sm rounded-lg transition-colors ${offering.status === 'Live'
                        ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        : offering.status === 'Paused'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border-transparent bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                    >
                      {offering.status === 'Live' ? 'Pause' : offering.status === 'Paused' ? 'Paused' : 'Activate'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <Pagination
            currentPage={offeringsPage}
            totalPages={totalOfferingsPages}
            onPageChange={setOfferingsPage}
            className="mt-6"
          />
        </>
      )}

      <DashboardDynamicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOffering ? "Edit Offering" : "Add New Offering"}
        subtitle={editingOffering ? "Update your mentorship p ackage details" : "Create a new mentorship package for students"}
        headerIcon={editingOffering ? Edit3 : Plus}
        iconBgColor="bg-orange-500"
        fields={offeringFields}
        initialValues={modalInitialValues}
        onSubmit={handleModalSubmit}
        loading={modalLoading}
        error={modalError}
        onValuesChange={(values) => setModalValues(values)}
      />

      {/* Create Batch Prompt Modal */}
      <AnimatePresence>
        {showBatchPrompt && createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 p-8 text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Create Batch</h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  Would you like to automatically create an LMS Batch for your newly created offering <span className="font-bold text-slate-700">{createdOfferingName}</span>?
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleCreateBatch}
                  disabled={batchLoading}
                  className="w-full h-12 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-xl shadow-emerald-600/10 flex items-center justify-center gap-2"
                >
                  {batchLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Create Batch Now"
                  )}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
