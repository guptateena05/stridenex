"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Maximize2,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { getPartnerReferenceCard } from "@/services/partnerBilling.services";

interface ReferralShareWidgetProps {
  referralCode: string | null | undefined;
  loading?: boolean;
}

export default function ReferralShareWidget({
  referralCode,
  loading = false,
}: ReferralShareWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    let active = true;
    if (!referralCode) {
      return;
    }
    const loadCard = async () => {
      setCardLoading(true);
      try {
        const url = await getPartnerReferenceCard(referralCode, "partner");
        if (active) setCardUrl(url);
      } catch {
        if (active) setCardUrl(null);
      } finally {
        if (active) setCardLoading(false);
      }
    };
    loadCard();

    return () => {
      active = false;
    };
  }, [referralCode]);

  useEffect(() => {
    if (!showFullImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFullImage(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFullImage]);

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = referralCode;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) {
          throw new Error("Fallback copy command failed");
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy referral code", err);
    }
  };

  const handleDownloadCard = async () => {
    if (!cardUrl || downloading) return;
    const filename = `stridenex-referral-card-${referralCode || "partner"}.png`;
    try {
      setDownloading(true);
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(cardUrl)}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Failed to download referral card", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/85 rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-32 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!referralCode) {
    return null;
  }

  return (
    <>
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Referral Code &amp; Share Card</h2>
              <p className="text-xs text-slate-500">
                Share your partner code or branded card to track referrals &amp; commissions
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Code Copy Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white shadow-md">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-200 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Your Partner Referral Code
              </div>
              <div className="flex items-center justify-between gap-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
                <span className="font-mono text-xl font-bold tracking-widest text-white select-all">
                  {referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-900 hover:bg-blue-50"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Every Student, College, Mentor, or Industry signup using this code is automatically attributed to your partner account.
              </p>
            </div>
          </div>

          {/* Reference Card Preview & Download */}
          <div className="lg:col-span-7">
            {cardLoading ? (
              <div className="h-48 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
                Generating referral card preview...
              </div>
            ) : cardUrl ? (
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 p-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowFullImage(true)}
                  className="group relative w-full sm:w-72 rounded-xl overflow-hidden border border-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Click to view full image"
                >
                  <img
                    src={cardUrl}
                    alt="Partner Referral Card"
                    className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3" />
                    Preview
                  </span>
                </button>
                <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    disabled={downloading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {downloading ? "Downloading..." : "Download Card"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFullImage(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Open Full Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-36 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500 p-4 text-center">
                Referral share card preview is currently unavailable. You can still share your referral code above.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-page Full Image Popup Modal */}
      {showFullImage && cardUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowFullImage(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Partner Referral Card ({referralCode})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                >
                  {downloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {downloading ? "Downloading..." : "Download"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullImage(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={cardUrl}
                alt="Partner Referral Card Full Preview"
                className="max-w-full max-h-[70vh] h-auto rounded-xl shadow-lg border border-white object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
