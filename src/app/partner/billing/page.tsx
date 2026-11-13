"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CreditCard,
  LogOut,
  RefreshCw,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getPartnerBillingSummary,
  getPartnerCategoryInfo,
  getPartnerPayoutHistory,
  getPartnerProfile,
  getPartnerReferralEarnings,
} from "@/services/partnerBilling.services";
import type {
  ModuleEarningItem,
  PartnerBillingStatement,
  PartnerBillingSummary,
  PartnerCategoryInfo,
} from "@/types/partnerBilling.types";
import CategoryPlanBanner from "@/components/partner/billing/CategoryPlanBanner";
import BillingKpiCards from "@/components/partner/billing/BillingKpiCards";
import ModuleEarningsBreakdown from "@/components/partner/billing/ModuleEarningsBreakdown";
import ReferralShareWidget from "@/components/partner/billing/ReferralShareWidget";
import PayoutStatementsTable from "@/components/partner/billing/PayoutStatementsTable";
import AdminPayoutSheetsPanel from "@/components/partner/billing/AdminPayoutSheetsPanel";

export default function PartnerBillingPage() {
  const { currentUser, logout, isAuthenticated, isInitialized, role } = useAuth();
  const router = useRouter();

  const normalizedRole = (role || "").toLowerCase();
  const isPartner = normalizedRole === "partner";
  const isAdminManager =
    normalizedRole === "system manager" ||
    normalizedRole === "administrator" ||
    normalizedRole.includes("system manager") ||
    normalizedRole.includes("administrator");
  const isAuthorized = isPartner || isAdminManager;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<PartnerBillingSummary | null>(null);
  const [categoryInfo, setCategoryInfo] = useState<PartnerCategoryInfo | null>(null);
  const [statements, setStatements] = useState<PartnerBillingStatement[]>([]);
  const [moduleEarnings, setModuleEarnings] = useState<ModuleEarningItem[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (isInitialized && (!isAuthenticated || !isAuthorized)) {
      router.push("/login");
    }
  }, [isInitialized, isAuthenticated, isAuthorized, router]);

  const fetchBillingDashboard = useCallback(async () => {
    if (!isAuthenticated || !isAuthorized) return;
    try {
      setLoading(true);
      setError("");

      const emailArg = currentUser || undefined;

      const [summaryRes, categoryRes, historyRes, earningsRes, profileRes] =
        await Promise.allSettled([
          getPartnerBillingSummary(emailArg),
          getPartnerCategoryInfo(emailArg),
          getPartnerPayoutHistory(emailArg),
          getPartnerReferralEarnings(emailArg),
          getPartnerProfile(emailArg),
        ]);

      const errors: string[] = [];

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
      } else {
        errors.push(summaryRes.reason?.message || "Failed to load billing summary");
      }

      if (categoryRes.status === "fulfilled") {
        setCategoryInfo(categoryRes.value);
      } else {
        errors.push(categoryRes.reason?.message || "Failed to load category plan");
      }

      if (historyRes.status === "fulfilled") {
        setStatements(historyRes.value);
      } else {
        errors.push(historyRes.reason?.message || "Failed to load payout history");
      }

      if (earningsRes.status === "fulfilled") {
        setModuleEarnings(earningsRes.value);
      } else {
        errors.push(earningsRes.reason?.message || "Failed to load module earnings");
      }

      if (profileRes.status === "fulfilled") {
        const ref =
          profileRes.value.referal_code ||
          (summaryRes.status === "fulfilled"
            ? summaryRes.value.referal_code || summaryRes.value.referral_code
            : null) ||
          null;
        setReferralCode(ref);
      } else if (summaryRes.status === "fulfilled") {
        setReferralCode(
          summaryRes.value.referal_code || summaryRes.value.referral_code || null
        );
      }

      if (errors.length === 4) {
        setError(errors[0] || "Unable to load partner billing data. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load billing dashboard.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAuthorized, currentUser]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && isAuthorized) {
      fetchBillingDashboard();
    }
  }, [isInitialized, isAuthenticated, isAuthorized, fetchBillingDashboard]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  const minPayoutAmount = Number(
    (typeof categoryInfo?.billing_settings === "object"
      ? categoryInfo.billing_settings?.min_payout_amount
      : undefined) ??
      categoryInfo?.settings?.min_payout_amount ??
      categoryInfo?.min_payout_amount ??
      summary?.min_payout_amount ??
      0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/60 font-sans pb-20 relative">
      {/* Decorative background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.1] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="bg-white/75 backdrop-blur-2xl border-b border-white/60 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/partner" className="flex items-center">
              <Image
                src="/images/Logo.png"
                alt="StrideNex Logo"
                width={136}
                height={38}
                className="object-contain"
              />
            </Link>
            <span className="hidden md:inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded uppercase tracking-wider border border-blue-100">
              Partner Portal
            </span>

            {/* Navigation Tabs */}
            <nav className="hidden sm:flex items-center gap-1 ml-2 bg-slate-100/80 p-1 rounded-xl">
              <Link
                href="/partner"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Profile &amp; Referrals
              </Link>
              <Link
                href="/partner/billing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-700 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Billing &amp; Earnings
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchBillingDashboard}
              disabled={loading}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Refresh billing data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => router.push("/lms/courses")}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all text-xs sm:text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">LMS Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile sub-nav */}
        <div className="sm:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-2 bg-white/80">
          <Link
            href="/partner"
            className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100"
          >
            Profile &amp; Referrals
          </Link>
          <Link
            href="/partner/billing"
            className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600"
          >
            Billing &amp; Earnings
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Partner Billing &amp; Earnings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor your commission tier, module-wise referral earnings, and payout statements.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-700">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchBillingDashboard}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold self-start sm:self-auto"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Category & Plan Banner */}
        <CategoryPlanBanner
          categoryInfo={categoryInfo}
          summary={summary}
          loading={loading}
        />

        {/* 2. KPI Summary Cards */}
        <BillingKpiCards
          summary={summary}
          categoryInfo={categoryInfo}
          loading={loading}
        />

        {/* 3. Module-wise Earnings Breakdown & Chart */}
        <ModuleEarningsBreakdown items={moduleEarnings} loading={loading} />

        {/* 4. Referral Code & Share Card Widget */}
        <ReferralShareWidget referralCode={referralCode} loading={loading} />

        {/* 5. Billing Statements & Payout Reports Table */}
        <PayoutStatementsTable
          statements={statements}
          minPayoutAmount={minPayoutAmount}
          loading={loading}
        />

        {/* 6. Admin / Partner Manager Payout Sheets (System Manager / Administrator only) */}
        {isAdminManager && (
          <AdminPayoutSheetsPanel onSheetUpdated={fetchBillingDashboard} />
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
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
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => logout("/login")}
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
