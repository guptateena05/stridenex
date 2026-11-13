"use client";

import React from "react";
import { Award, CalendarClock, Info, Layers, Percent, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import type {
  ModuleRateItem,
  PartnerBillingSummary,
  PartnerCategoryInfo,
  TierRateItem,
} from "@/types/partnerBilling.types";
import { formatINR } from "@/services/partnerBilling.services";

interface CategoryPlanBannerProps {
  categoryInfo: PartnerCategoryInfo | null;
  summary: PartnerBillingSummary | null;
  loading?: boolean;
}

function getCategoryBadgeClasses(categoryName: string): string {
  const lower = categoryName.toLowerCase();
  if (lower.includes("diamond")) {
    return "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25";
  }
  if (lower.includes("platinum")) {
    return "bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-slate-500/25";
  }
  if (lower.includes("gold")) {
    return "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-amber-400/30";
  }
  if (lower.includes("silver")) {
    return "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 shadow-slate-400/25";
  }
  if (lower.includes("bronze")) {
    return "bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-orange-500/25";
  }
  return "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25";
}

export default function CategoryPlanBanner({
  categoryInfo,
  summary,
  loading = false,
}: CategoryPlanBannerProps) {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-6 w-48 bg-slate-200 rounded-full" />
            <div className="h-4 w-72 bg-slate-100 rounded" />
          </div>
          <div className="flex gap-3">
            <div className="h-14 w-32 bg-slate-100 rounded-xl" />
            <div className="h-14 w-32 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const settingsObj =
    typeof categoryInfo?.billing_settings === "object"
      ? categoryInfo.billing_settings
      : categoryInfo?.settings;

  const categoryName =
    categoryInfo?.category_name ||
    categoryInfo?.category ||
    categoryInfo?.category_code ||
    categoryInfo?.partner_category?.category_name ||
    categoryInfo?.partner_category?.name ||
    summary?.active_category ||
    summary?.category ||
    null;

  const hasActiveCategory =
    categoryInfo?.has_active_category === false || summary?.has_active_category === false
      ? false
      : Boolean(categoryName);

  if (!hasActiveCategory || !categoryName) {
    return (
      <div className="bg-blue-50/80 backdrop-blur-xl border border-blue-200 rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            No billing category assigned yet — contact Stridnex team
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Your partner account does not have an active Partner Category Assignment yet. Once assigned by the Stridnex team, your commission rates, payout cycle, and earnings plan will appear here.
          </p>
        </div>
      </div>
    );
  }

  const commissionType =
    settingsObj?.commission_type ||
    categoryInfo?.commission_type ||
    summary?.commission_type ||
    "Flat Rate";

  const payoutCycle =
    settingsObj?.payout_cycle ||
    categoryInfo?.payout_cycle ||
    summary?.payout_cycle ||
    "Monthly";

  const minPayout =
    settingsObj?.min_payout_amount ??
    categoryInfo?.min_payout_amount ??
    summary?.min_payout_amount ??
    0;

  const rewardPerReferral =
    settingsObj?.reward_per_referral ??
    categoryInfo?.reward_per_referral ??
    categoryInfo?.flat_reward_amount;

  const conversionBonus =
    settingsObj?.conversion_bonus ??
    categoryInfo?.conversion_bonus ??
    summary?.conversion_bonus;

  const tdsConfig = categoryInfo?.tds_config || settingsObj?.tds_config;
  const tdsApplicable =
    tdsConfig?.tds_applicable ??
    settingsObj?.tds_applicable ??
    categoryInfo?.tds_applicable ??
    false;

  const tdsRate =
    tdsConfig?.tds_rate ??
    tdsConfig?.tds_percentage ??
    settingsObj?.tds_rate ??
    settingsObj?.tds_percentage ??
    categoryInfo?.tds_rate ??
    categoryInfo?.tds_percentage ??
    0;

  const flatRate =
    settingsObj?.flat_rate ??
    (typeof settingsObj?.commission_rate === "number" ? settingsObj.commission_rate : undefined) ??
    categoryInfo?.flat_commission_rate ??
    categoryInfo?.flat_reward_amount ??
    (typeof summary?.commission_rate === "number" ? summary.commission_rate : undefined) ??
    summary?.applicable_rate;

  // Resolve module rates from summary.commission_rate (Record), categoryInfo, or settingsObj
  let resolvedModuleRates: Record<string, number> | ModuleRateItem[] | null =
    settingsObj?.module_rates || categoryInfo?.module_rates || null;

  if (!resolvedModuleRates) {
    if (summary?.commission_rate && typeof summary.commission_rate === "object") {
      resolvedModuleRates = summary.commission_rate as Record<string, number>;
    } else if (summary?.reward_structure && typeof summary.reward_structure === "object") {
      resolvedModuleRates = summary.reward_structure as Record<string, number>;
    } else if (
      categoryInfo?.student_commission_rate !== undefined ||
      categoryInfo?.college_commission_rate !== undefined ||
      categoryInfo?.mentor_commission_rate !== undefined ||
      categoryInfo?.industry_commission_rate !== undefined
    ) {
      resolvedModuleRates = {
        Student: Number(categoryInfo.student_commission_rate ?? categoryInfo.student_reward_amount ?? 0),
        College: Number(categoryInfo.college_commission_rate ?? categoryInfo.college_reward_amount ?? 0),
        Mentor: Number(categoryInfo.mentor_commission_rate ?? categoryInfo.mentor_reward_amount ?? 0),
        Industry: Number(categoryInfo.industry_commission_rate ?? categoryInfo.industry_reward_amount ?? 0),
      };
    } else if (summary?.applicable_rates && !Array.isArray(summary.applicable_rates)) {
      resolvedModuleRates = summary.applicable_rates as Record<string, number>;
    }
  }

  const tiers =
    settingsObj?.tiers ||
    settingsObj?.tier_rates ||
    categoryInfo?.tiers ||
    categoryInfo?.commission_tiers ||
    (Array.isArray(summary?.applicable_rates) ? summary?.applicable_rates : null);

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Active Partner Plan
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold shadow-sm ${getCategoryBadgeClasses(
                  categoryName
                )}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {categoryName}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-blue-100 border border-white/15">
                <Layers className="w-3 h-3" />
                {commissionType}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1.5">
              {categoryInfo?.partner_category?.description ||
                categoryInfo?.settings_name ||
                `Your referrals are billed under the ${categoryName} tier with ${payoutCycle.toLowerCase()} settlements.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-300">
              <CalendarClock className="w-3.5 h-3.5 text-blue-300" />
              Payout Cycle
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{payoutCycle}</div>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 min-w-[140px]">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-300">
              <Wallet className="w-3.5 h-3.5 text-emerald-300" />
              Min Payout
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{formatINR(minPayout)}</div>
          </div>

          {Boolean(tdsApplicable) && Number(tdsRate) > 0 && (
            <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 min-w-[115px]">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                TDS Rate
              </div>
              <div className="text-sm font-bold text-white mt-0.5">{tdsRate}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Rate / Tier Breakdown Strip */}
      <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        {commissionType === "Flat Rate" && flatRate !== undefined && flatRate !== null && (
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-600" />
            <span className="text-slate-500 font-medium">Commission Rate:</span>
            <span className="font-bold text-slate-900">
              {typeof flatRate === "number" ? `${formatINR(flatRate)} / referral` : flatRate}
            </span>
          </div>
        )}

        {commissionType === "Per Module" && resolvedModuleRates && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium mr-1">Module Rates:</span>
            {Array.isArray(resolvedModuleRates)
              ? (resolvedModuleRates as ModuleRateItem[]).map((m, idx) => (
                  <span
                    key={m.module || idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <span className="text-slate-500">{m.module}:</span>
                    <span className="text-blue-700">
                      {formatINR(m.rate ?? m.commission_rate ?? m.reward_per_referral ?? 0)}
                    </span>
                  </span>
                ))
              : Object.entries(resolvedModuleRates).map(([mod, rate]) => (
                  <span
                    key={mod}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <span className="text-slate-500">{mod}:</span>
                    <span className="text-blue-700">{formatINR(rate as number)}</span>
                  </span>
                ))}
          </div>
        )}

        {commissionType === "Tiered" && Array.isArray(tiers) && tiers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium mr-1">Tiered Slabs:</span>
            {(tiers as TierRateItem[]).map((t, idx) => {
              const range =
                t.max_referrals !== undefined && t.max_referrals !== null
                  ? `${t.min_referrals ?? 0}–${t.max_referrals}`
                  : `${t.min_referrals ?? 0}+`;
              const val = t.rate ?? t.commission_rate ?? t.commission_percentage;
              return (
                <span
                  key={t.tier_name || idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <span className="text-slate-500">
                    {t.tier_name ? `${t.tier_name} (${range})` : `${range} refs`}:
                  </span>
                  <span className="text-indigo-700">
                    {t.commission_percentage ? `${t.commission_percentage}%` : formatINR(val ?? 0)}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {rewardPerReferral !== undefined && rewardPerReferral !== null && Number(rewardPerReferral) > 0 && (
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="text-slate-500 font-medium">Reward / Referral:</span>
            <span className="font-bold text-slate-900">{formatINR(rewardPerReferral)}</span>
          </div>
        )}

        {conversionBonus !== undefined && conversionBonus !== null && Number(conversionBonus) > 0 && (
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="text-slate-500 font-medium">Conversion Bonus:</span>
            <span className="font-bold text-emerald-700">{formatINR(conversionBonus)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
