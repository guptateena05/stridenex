"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, Building2, User, Mail, Phone, Briefcase, MapPin, Users, Copy, CheckCircle2, TrendingUp, BookOpen, Target } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { BASE_URL } from "@/services/api.services";
import Dropdown from "@/components/ui/Dropdown";
import ReferralSectionField from "@/components/dashboards/widgets/ReferralSectionField";
import ReferralPerformanceWidget from "@/components/dashboards/widgets/ReferralPerformanceWidget";

interface PartnerData {
  name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  organisation: string;
  job_title: string;
  company_size: string | number;
  partner_type?: string;
  country?: string;
  state: string;
  referal_code?: string;
}

export default function PartnerPage() {
  const { currentUser, logout, isAuthenticated, isInitialized, role } = useAuth();
  const router = useRouter();

  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PartnerData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    if (isInitialized && (!isAuthenticated || role !== "partner")) {
      router.push("/login");
    }
  }, [isAuthenticated, role, isInitialized, router]);

  useEffect(() => {
    if (currentUser && role === "partner") {
      fetchPartnerData();
    }
  }, [currentUser, role]);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${BASE_URL}method/stridenex_app.stridenex_app.doctype.stridenex_partner.stridenex_partner.get_partner`, {
        params: { email: currentUser }
      });

      if (res.data && res.data.message?.status === "success" && res.data.message?.data?.partner) {
        const pData = res.data.message.data.partner;
        const refCode = res.data.message.data.user?.referal_code;

        setPartnerData({ ...pData, referal_code: refCode });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Failed to fetch partner data", err);
      setError("Failed to load partner details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout("/login");
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const copyToClipboard = () => {
    if (partnerData?.referal_code) {
      navigator.clipboard.writeText(partnerData.referal_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditSubmit = async () => {
    if (!editData) return;
    try {
      setEditLoading(true);
      setEditError("");
      setEditSuccess("");
      const payload = {
        name: editData.name,
        first_name: editData.first_name,
        last_name: editData.last_name,
        email: editData.email,
        phone_number: editData.phone_number,
        organisation: editData.organisation,
        job_title: editData.job_title,
        company_size: editData.company_size ? Number(editData.company_size) : undefined,
        state: editData.state
      };

      const res = await axios.put(`${BASE_URL}method/stridenex_app.stridenex_app.doctype.stridenex_partner.stridenex_partner.edit_stridenex_partner`, payload);

      if (res.data && (res.data.status === 200 || res.data.data?.success)) {
        setPartnerData({ ...partnerData, ...editData });
        setIsEditing(false);
        setEditSuccess("Profile updated successfully!");
        setTimeout(() => setEditSuccess(""), 3000);
      } else {
        setEditError(res.data?.message || "Failed to update profile.");
      }
    } catch (e: any) {
      console.error("Failed to edit partner data", e);
      setEditError(e?.response?.data?.message?.message || "Failed to update profile. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading partner details...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/60 font-sans pb-20 relative">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.1] pointer-events-none"></div>
      
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-2xl border-b border-white/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/Logo.png"
              alt="StrideNex Logo"
              width={140}
              height={40}
              className="object-contain"
            />
            <span className="hidden sm:inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded uppercase tracking-wider ml-4 border border-blue-100">
              Partner Portal
            </span>
          </div>
          <button
            onClick={confirmLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Welcome back, {partnerData?.first_name || 'Partner'}!
          </h1>
          <p className="text-slate-500 text-lg">
            Manage your partner profile, view organizational details, and access your exclusive partner resources.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8 animate-in zoom-in-95 relative z-10">
            {error}
          </div>
        ) : partnerData ? (
          <div className="space-y-8 relative z-10">
            {/* Profile Section */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl shadow-indigo-900/5 border border-white/80 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              {/* Cover / Top Section */}
              <div className="h-32 bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
              </div>

              <div className="px-6 sm:px-10 pb-10 relative">
                <div className="flex justify-between items-start -mt-12 sm:-mt-16 mb-8">
                  {/* Avatar Profile */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full border-[5px] border-white shadow-lg flex items-center justify-center text-4xl font-bold text-slate-800 uppercase shrink-0">
                    {partnerData.first_name?.[0]}{partnerData.last_name?.[0]}
                  </div>

                  <div className="mt-16 sm:mt-20">
                    {!isEditing ? (
                      <button
                        onClick={() => { setIsEditing(true); setEditData(partnerData); setEditSuccess(""); }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleEditSubmit}
                          disabled={editLoading}
                          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {editLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 mb-6 text-sm">
                    {editError}
                  </div>
                )}

                {editSuccess && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-lg border border-green-100 mb-6 text-sm">
                    {editSuccess}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200/60 pb-3">
                      Personal Information
                    </h3>

                    <div className="space-y-5">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editData?.first_name || ''}
                                onChange={(e) => setEditData(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="First Name"
                              />
                              <input
                                type="text"
                                value={editData?.last_name || ''}
                                onChange={(e) => setEditData(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Last Name"
                              />
                            </div>
                          ) : (
                            <p className="text-slate-900 font-medium">{partnerData.first_name} {partnerData.last_name}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide mb-1">Email Address</p>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editData?.email || ''}
                              readOnly
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                          ) : (
                            <p className="text-slate-900 font-medium">{partnerData.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editData?.phone_number || ''}
                              readOnly
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                          ) : (
                            <p className="text-slate-900 font-medium">{partnerData.phone_number}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200/60 pb-3">
                      Professional Information
                    </h3>

                    <div className="space-y-5">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide mb-1">Organization</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData?.organisation || ''}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, organisation: e.target.value } : null)}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-slate-900 font-medium">{partnerData.organisation}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1">
                          <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide mb-1">Job Title & Type</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData?.job_title || ''}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, job_title: e.target.value } : null)}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Job Title"
                            />
                          ) : (
                            <p className="text-slate-900 font-medium">
                              {partnerData.job_title}
                              {partnerData.partner_type && <span className="text-slate-400 font-normal ml-1">({partnerData.partner_type})</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide mb-1">Company Size</p>
                          {isEditing ? (
                            <select
                              value={editData?.company_size || ''}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, company_size: e.target.value } : null)}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Size</option>
                              <option value="50">1-50 employees</option>
                              <option value="200">51-200 employees</option>
                              <option value="500">201-500 employees</option>
                              <option value="1000">501-1,000 employees</option>
                              <option value="2000">1,000+ employees</option>
                            </select>
                          ) : (
                            <p className="text-slate-900 font-medium">{partnerData.company_size || "Not specified"}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide mb-1">Location</p>
                          {isEditing ? (
                            <div className="relative">
                              <Dropdown
                                id="state"
                                placeholder="State"
                                value={editData?.state || ''}
                                onChange={(val) => setEditData(prev => prev ? { ...prev, state: val } : null)}
                                endpoint={`${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`}
                                params={{ doctype: "State" }}
                                searchable={true}
                              />
                            </div>
                          ) : (
                            <p className="text-slate-900 font-medium">
                              {partnerData.state}{partnerData.country ? `, ${partnerData.country}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Stats Section */}
            {partnerData?.referal_code && (
              <div className="pt-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Refer & Earn Rewards!</h2>
                  <p className="text-slate-500 text-lg max-w-xl mx-auto">
                    Share your unique partner code to empower others and build a brighter future together. Earn exclusive benefits for every successful referral.
                  </p>
                </div>

                <div className="flex justify-center mb-10">
                  <div className="w-full max-w-2xl transform transition-transform hover:scale-[1.02] duration-300">
                    <ReferralSectionField referralCode={partnerData.referal_code} role="partner" showPerformance={false} />
                  </div>
                </div>

                <ReferralPerformanceWidget referralCode={partnerData.referal_code} role="partner" />
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Out</h3>
              <p className="text-slate-500 text-sm">
                Are you sure you want to sign out of your partner account?
              </p>
            </div>
            <div className="p-4 flex items-center gap-3 border-t border-slate-100">
              <button
                onClick={cancelLogout}
                className="flex-1 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 text-sm font-medium text-white hover:bg-red-700 bg-red-600 rounded-xl transition-colors shadow-sm"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
