"use client";

import React from "react";
import { Clock, HelpCircle, Layers, TrendingUp, Users, Wallet } from "lucide-react";
import type { PartnerBillingSummary, PartnerCategoryInfo } from "@/types/partnerBilling.types";
import { formatINR } from "@/services/partnerBilling.services";

interface BillingKpiCardsProps {
  summary: PartnerBillingSummary | null;
  categoryInfo: PartnerCategoryInfo | null;
  loading?: boolean;
}

export default function BillingKpiCards({
  summary,
  categoryInfo,
  loading = false,
}: BillingKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white/80 rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-3.5 w-36 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const lifetimeReferrals = Number(
    summary?.total_referrals_lifetime ??
      summary?.lifetime_referrals ??
      summary?.total_referrals ??
      0
  );
  const monthReferrals = Number(
    summary?.total_referrals_this_month ??
      summary?.current_month_referrals ??
      summary?.month_referrals ??
      0
  );

  const totalEarned = Number(
    summary?.total_earned_lifetime ??
      summary?.total_paid ??
      summary?.total_earned ??
      0
  );

  const pendingPayout = Number(
    summary?.pending_payout_amount ?? summary?.pending_payout ?? 0
  );
  const carryForward = Number(summary?.carry_forward_amount ?? 0);

  const settingsObj =
    typeof categoryInfo?.billing_settings === "object"
      ? categoryInfo.billing_settings
      : categoryInfo?.settings;

  const minPayout = Number(
    settingsObj?.min_payout_amount ??
      categoryInfo?.min_payout_amount ??
      summary?.min_payout_amount ??
      0
  );

  const commissionType =
    settingsObj?.commission_type ||
    categoryInfo?.commission_type ||
    summary?.commission_type ||
    "Not Assigned";

  const flatRate =
    settingsObj?.flat_rate ??
    (typeof settingsObj?.commission_rate === "number" ? settingsObj.commission_rate : undefined) ??
    categoryInfo?.flat_commission_rate ??
    categoryInfo?.flat_reward_amount ??
    (typeof summary?.commission_rate === "number" ? summary.commission_rate : undefined) ??
    summary?.applicable_rate;

  const rateHeadline =
    summary?.rate_display ||
    (flatRate !== undefined && flatRate !== null && flatRate !== ""
      ? typeof flatRate === "number"
        ? formatINR(flatRate)
        : String(flatRate)
      : commissionType);

  const categoryLabel =
    categoryInfo?.category_name ||
    categoryInfo?.category ||
    categoryInfo?.category_code ||
    summary?.active_category ||
    summary?.category ||
    "Unassigned";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Total Referrals */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Referrals
          </span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {lifetimeReferrals.toLocaleString("en-IN")}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
            +{monthReferrals} this month
          </span>
          <span>lifetime signups</span>
        </div>
      </div>

      {/* 2. Total Earned (Paid) */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Earned (Lifetime)
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {formatINR(totalEarned)}
        </div>
        <div className="mt-2 text-xs font-medium text-emerald-700 flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5" />
          <span>Settled &amp; lifetime earnings</span>
        </div>
      </div>

      {/* 3. Pending Payout / Carry Forward */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Payout
            </span>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl z-30">
                Includes approved/pending payouts. Any{" "}
                <span className="font-semibold text-amber-300">Carry Forward</span>{" "}
                balance will be included in the next payout once{" "}
                {minPayout > 0 ? formatINR(minPayout) : "the minimum payout amount"}{" "}
                is reached.
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {formatINR(pendingPayout)}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          {carryForward > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              Carry Forward: {formatINR(carryForward)}
            </span>
          ) : (
            <span>
              Min threshold: {minPayout > 0 ? formatINR(minPayout) : "None"}
            </span>
          )}
        </div>
      </div>

      {/* 4. Active Commission Plan */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Commission Plan
          </span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
          {rateHeadline}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            {categoryLabel}
          </span>
          <span className="truncate">{commissionType}</span>
        </div>
      </div>
    </div>
  );
}
