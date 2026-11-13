"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import { formatINR, getOnboardingPartnerCategories } from "@/services/partnerBilling.services";
import type { OnboardingPartnerCategory } from "@/types/partnerBilling.types";

interface Props {
  value: string;
  onChange: (categoryName: string) => void;
}

function rewardSummary(rs: OnboardingPartnerCategory["reward_structure"]): string {
  let base = "";
  if (rs.type === "Per Module") {
    const v = [rs.student, rs.industry, rs.mentor, rs.college].filter(
      (n): n is number => typeof n === "number" && n > 0
    );
    if (v.length) {
      const lo = Math.min(...v), hi = Math.max(...v);
      base = lo === hi ? `${formatINR(lo)} / referral` : `${formatINR(lo)} to ${formatINR(hi)} / referral`;
    }
  } else if (rs.type === "Tiered Volume" && rs.tiers?.length) {
    const v = rs.tiers.map((t) => t.reward);
    base = `Tiered ${formatINR(Math.min(...v))} - ${formatINR(Math.max(...v))} / referral`;
  } else if (rs.type === "Flat Amount" && rs.flat_reward) {
    base = `${formatINR(rs.flat_reward)} / referral`;
  }
  if (rs.conversion_bonus && rs.conversion_bonus > 0) {
    base += `${base ? " + " : ""}${formatINR(rs.conversion_bonus)} bonus`;
  }
  return base;
}

export default function PartnerCategorySelector({ value, onChange }: Props) {
  const [categories, setCategories] = useState<OnboardingPartnerCategory[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getOnboardingPartnerCategories()
      .then((d) => {
        if (!active) return;
        setCategories(d);
      })
      .catch(() => active && setError("Could not load partner categories. Please refresh."));
    return () => {
      active = false;
    };
  }, []);

  const selected = categories.find((c) => c.category_name === value);

  return (
    <div className="relative">
      <Dropdown
        id="partnerType"
        placeholder="Select your partner type / category"
        value={value}
        onChange={onChange}
        options={categories.map((c) => c.category_name)}
        required
      />
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      {selected && (
        <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-300">{selected.description}</p>
            {selected.badge && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold uppercase">
                {selected.badge}
              </span>
            )}
          </div>
          <ul className="mt-2 space-y-1">
            {selected.features?.map((f) => (
              <li key={f} className="flex items-start gap-1.5 text-xs text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-green-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {rewardSummary(selected.reward_structure) && (
            <p className="mt-2 text-xs font-semibold text-emerald-300">
              {rewardSummary(selected.reward_structure)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
