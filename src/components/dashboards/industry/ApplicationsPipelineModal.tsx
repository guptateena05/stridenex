import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Loader2, Target, Zap, FileText } from "lucide-react";
import { updateProjectApplicationStatus } from "@/services/industry.services";
import { useToast } from "@/context/ToastContext";
import { BASE_URL, BASE_DOMAIN } from "@/services/api.services";

interface ApplicationsPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationsData: any[];
  applicationsLoading: boolean;
  companyName: string;
  projectName?: string;
  onStatusUpdated: (updatedData: any[]) => void;
}

export default function ApplicationsPipelineModal({
  isOpen,
  onClose,
  applicationsData,
  applicationsLoading,
  companyName,
  projectName,
  onStatusUpdated
}: ApplicationsPipelineModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { showToast } = useToast();

  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const pipelineColumns = useMemo(() => [
    { id: "Applied", title: "Applied", color: "bg-slate-800" },
    { id: "Shortlisted", title: "Shortlisted", color: "bg-blue-600" },
    { id: "Interview Scheduled", title: "Interview Scheduled", color: "bg-orange-500" },
    { id: "Rejected", title: "Rejected", color: "bg-red-600" },
    { id: "Selected", title: "Selected", color: "bg-emerald-500" },
    { id: "Accepted", title: "Accepted", color: "bg-teal-600" },
    { id: "Awarded", title: "Awarded", color: "bg-purple-600" }
  ], []);

  const groupedApplications = useMemo(() => {
    const grouped: Record<string, any[]> = {
      "Applied": [],
      "Shortlisted": [],
      "Interview Scheduled": [],
      "Rejected": [],
      "Selected": [],
      "Accepted": [],
      "Awarded": []
    };
    applicationsData.forEach(app => {
      const status = app.status || "Applied";
      if (grouped[status]) {
        grouped[status].push(app);
      } else {
        grouped["Applied"].push(app);
      }
    });
    return grouped;
  }, [applicationsData]);

  const handleApplicationCardClick = (app: any) => {
    setSelectedApplication(app);
    setSelectedStatus(app.status || "Applied");
  };

  const handleUpdateApplicationStatus = async () => {
    if (!selectedApplication) return;

    const confirmMessage = `Are you sure you want to change ${selectedApplication.student}'s status to ${selectedStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    setUpdateStatusLoading(true);
    try {
      await updateProjectApplicationStatus({
        name: selectedApplication.name,
        industry: companyName,
        status: selectedStatus
      });
      showToast("Status updated successfully", "success");
      
      const updatedData = applicationsData.map(app => 
        app.name === selectedApplication.name ? { ...app, status: selectedStatus } : app
      );
      onStatusUpdated(updatedData);
      setSelectedApplication(null); 
    } catch (err: any) {
      showToast(err?.message || "Failed to update status", "error");
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } catch (e) {
      return dateString;
    }
    return dateString;
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {projectName ? `Pipeline: ${projectName}` : "Applications Pipeline"}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">Track and manage student project applications</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-x-auto p-5 bg-slate-100/50">
                {applicationsLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading pipeline...</p>
                  </div>
                ) : (
                  <div className="flex gap-2 h-full w-full pb-4">
                    {pipelineColumns.map((col) => (
                      <div key={col.id} className="flex-1 min-w-0 flex flex-col gap-3 bg-slate-50/80 rounded-2xl p-1.5 border border-slate-200 shadow-sm h-full overflow-hidden">
                        <div className={`${col.color} text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm shrink-0`}>
                          <h3 className="font-bold text-[13px] tracking-wide truncate">{col.title}</h3>
                          <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            {groupedApplications[col.id]?.length || 0}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 overflow-y-auto hide-scrollbar pb-2 flex-1 p-1">
                          {groupedApplications[col.id]?.length > 0 ? (
                            groupedApplications[col.id].map((app) => (
                              <div 
                                key={app.name} 
                                onClick={() => handleApplicationCardClick(app)}
                                className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <div className={`w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0`}>
                                    {app.student ? app.student.charAt(0).toUpperCase() : "S"}
                                  </div>
                                  <div className="overflow-hidden flex-1">
                                    <h4 className="font-bold text-slate-800 text-xs truncate" title={app.student}>{app.student}</h4>
                                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5" title={app.project}>Project: {app.project}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                    {formatDate(app.applied_on) || 'Recent'}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-40">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Empty Stage</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nested Detail Modal for Updating Status */}
      <AnimatePresence>
        {selectedApplication && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="bg-slate-900 border-b border-slate-100 flex items-center justify-between p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center text-xl font-bold shadow-2xl">
                    {selectedApplication.student ? selectedApplication.student.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h2 className="text-lg font-bold text-white leading-tight truncate" title={selectedApplication.student}>{selectedApplication.student}</h2>
                    <p className="text-xs font-semibold text-slate-400 mt-1 truncate">{selectedApplication.project}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="relative z-10 text-white/50 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-slate-50/50 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Student</span>
                    <span className="text-sm font-bold text-slate-800 text-right">{selectedApplication.student}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Project</span>
                    <span className="text-sm font-bold text-slate-800 text-right">{selectedApplication.project}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Applied On</span>
                    <span className="text-sm font-bold text-slate-800 text-right">{formatDate(selectedApplication.applied_on)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Resume</span>
                    {selectedApplication.resume ? (
                      <a 
                        href={selectedApplication.resume.startsWith('http') ? selectedApplication.resume : `${BASE_DOMAIN}${selectedApplication.resume}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Resume
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Not provided</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest text-left flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-blue-500" /> Update Pipeline Status
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Zap className="h-4 w-4 text-slate-400" />
                      </div>
                      <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all hover:bg-white hover:border-blue-200 cursor-pointer"
                      >
                        {pipelineColumns.filter(col => col.id !== "Accepted").map(col => (
                          <option key={col.id} value={col.id}>{col.title}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {selectedStatus !== selectedApplication.status && (
                      <div className="pt-2">
                        <button 
                          onClick={handleUpdateApplicationStatus}
                          disabled={updateStatusLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                        >
                          {updateStatusLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "Confirm Status Change"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
