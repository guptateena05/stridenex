"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Shield,
} from "lucide-react";
import type { PartnerPayoutSheet } from "@/types/partnerBilling.types";
import {
  createPartnerPayoutSheet,
  formatINR,
  getAllPartnerPayoutSheets,
  releasePartnerPayouts,
} from "@/services/partnerBilling.services";

interface AdminPayoutSheetsPanelProps {
  onSheetUpdated?: () => void;
}

export default function AdminPayoutSheetsPanel({
  onSheetUpdated,
}: AdminPayoutSheetsPanelProps) {
  const [sheets, setSheets] = useState<PartnerPayoutSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payoutCycle, setPayoutCycle] = useState("Monthly");
  const [creating, setCreating] = useState(false);

  // Release state
  const [releasingSheet, setReleasingSheet] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const fetchSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const filters =
        statusFilter !== "All" ? { status: statusFilter } : undefined;
      const list = await getAllPartnerPayoutSheets(filters);
      setSheets(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load payout sheets.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setActionMsg({ type: "error", text: "Please select both start and end dates." });
      return;
    }
    try {
      setCreating(true);
      setActionMsg(null);
      await createPartnerPayoutSheet({
        start_date: startDate,
        end_date: endDate,
        payout_cycle: payoutCycle,
      });
      setActionMsg({ type: "success", text: "Partner payout sheet created successfully." });
      setShowCreate(false);
      setStartDate("");
      setEndDate("");
      await fetchSheets();
      onSheetUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create payout sheet.";
      setActionMsg({
        type: "error",
        text: msg,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleReleasePayouts = async (sheetName: string) => {
    try {
      setReleasingSheet(sheetName);
      setActionMsg(null);
      await releasePartnerPayouts({ sheet_name: sheetName });
      setActionMsg({
        type: "success",
        text: `Payouts released for sheet ${sheetName}.`,
      });
      await fetchSheets();
      onSheetUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to release payouts for ${sheetName}.`;
      setActionMsg({
        type: "error",
        text: msg,
      });
    } finally {
      setReleasingSheet(null);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-indigo-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/90 to-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Admin: Partner Payout Sheets
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                Manager Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate partner payout sheets for a billing period and release approved payouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Released">Released</option>
            <option value="Paid">Paid</option>
          </select>

          <button
            type="button"
            onClick={fetchSheets}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh payout sheets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreate((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Payout Sheet
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`mx-6 mt-4 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            actionMsg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {actionMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreateSheet}
          className="mx-6 mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              End Date
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Payout Cycle
            </label>
            <select
              value={payoutCycle}
              onChange={(e) => setPayoutCycle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Weekly">Weekly</option>
              <option value="Bi-Weekly">Bi-Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="p-6">
        {error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No partner payout sheets found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3">Sheet ID</th>
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3">Cycle</th>
                  <th className="py-3 px-3 text-right">Partners</th>
                  <th className="py-3 px-3 text-right">Total Net (₹)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sheets.map((sheet) => {
                  const isReleased =
                    sheet.status === "Released" || sheet.status === "Paid";
                  return (
                    <tr key={sheet.name} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-800">
                        {sheet.name}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600">
                        {sheet.start_date && sheet.end_date
                          ? `${sheet.start_date} – ${sheet.end_date}`
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600">
                        {sheet.payout_cycle || "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-medium text-slate-700">
                        {sheet.total_partners ?? "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {sheet.total_net_payout !== undefined
                          ? formatINR(sheet.total_net_payout)
                          : "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isReleased
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {sheet.status || "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isReleased ? (
                          <button
                            type="button"
                            onClick={() => handleReleasePayouts(sheet.name)}
                            disabled={releasingSheet === sheet.name}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                          >
                            {releasingSheet === sheet.name ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Release Payouts
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Released</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
