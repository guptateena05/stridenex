// components/dashboards/widgets/ReferralSectionField.tsx
"use client";

import { useState, useEffect } from "react";
import ReferralPerformanceWidget from "@/components/dashboards/widgets/ReferralPerformanceWidget";
import { getReferenceCard } from "@/services/api.services";
import { Copy, Download, CheckCircle2 } from "lucide-react";

interface Props {
  role: "student" | "mentor" | "college" | "industry" | "partner";
  referralCode: string;
  showPerformance?: boolean;
}

export default function ReferralSectionField({ role, referralCode, showPerformance = true }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [refCardUrl, setRefCardUrl] = useState<string | null>(null);

  useEffect(() => {
    if (referralCode) {
      getReferenceCard({ reference_code: referralCode, module: role })
        .then((res: any) => {
          if (res?.message?.data?.image_url) {
            setRefCardUrl(res.message.data.image_url);
          }
        })
        .catch(err => console.error("Failed to load reference card", err));
    }
  }, [referralCode, role]);

  if (!referralCode) return null;

  return (
    <div className="flex flex-col w-full gap-4 mt-2">
      {/* Referral Card Display */}
      {refCardUrl && (
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8 flex flex-col items-center justify-center group hover:shadow-emerald-500/15 transition-all duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05]"></div>
          <div className="relative w-full max-w-[36rem] transform group-hover:-translate-y-2 transition-transform duration-500 flex flex-col sm:flex-row items-start justify-center gap-6">
            <img src={refCardUrl} alt="Referral Card" className="w-full sm:w-auto flex-1 h-auto rounded-xl border border-white shadow-lg group-hover:shadow-2xl transition-shadow duration-500" />
            
            <div className="relative z-10 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(referralCode);
                    setCopiedCard(true);
                    setTimeout(() => setCopiedCard(false), 2000);
                  } catch (err) {
                    console.error("Failed to copy code", err);
                  }
                }}
                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all shadow-md border ${
                  copiedCard 
                    ? "bg-emerald-500 text-white border-emerald-600 scale-105" 
                    : "bg-white backdrop-blur-md text-emerald-700 hover:bg-emerald-50 hover:scale-105 border-emerald-100"
                }`}
                title="Copy Code"
              >
                {copiedCard ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Copy size={22} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPerformance && (
        <ReferralPerformanceWidget referralCode={referralCode} role={role} />
      )}
    </div>
  );
}

