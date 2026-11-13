"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  HelpCircle,
  Search,
  X,
} from "lucide-react";
import type { PartnerBillingStatement, PayoutStatus } from "@/types/partnerBilling.types";
import { exportToCsv, formatINR } from "@/services/partnerBilling.services";
import { BASE_DOMAIN } from "@/services/api.services";

interface PayoutStatementsTableProps {
  statements: PartnerBillingStatement[];
  minPayoutAmount?: number;
  loading?: boolean;
}

const STATUS_OPTIONS: ("All" | PayoutStatus)[] = [
  "All",
  "Pending",
  "Approved",
  "Paid",
  "On Hold",
  "Carry Forward",
];

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Approved":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "On Hold":
      return "bg-red-50 text-red-700 border-red-200";
    case "Carry Forward":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function resolveSlipUrl(pdfPath: string): string {
  if (/^https?:\/\//i.test(pdfPath)) return pdfPath;
  const domain = BASE_DOMAIN.replace(/\/$/, "");
  const cleanPath = pdfPath.startsWith("/") ? pdfPath : `/${pdfPath}`;
  return `${domain}${cleanPath}`;
}

function getPeriodLabel(row: PartnerBillingStatement): string {
  if (row.period) return row.period;
  const start = row.period_start || row.start_date;
  const end = row.period_end || row.end_date;
  if (start && end) return `${start} to ${end}`;
  return start || end || "—";
}

export default function PayoutStatementsTable({
  statements,
  minPayoutAmount = 0,
  loading = false,
}: PayoutStatementsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [periodQuery, setPeriodQuery] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const filteredStatements = useMemo(() => {
    return statements.filter((row) => {
      if (statusFilter !== "All" && row.status !== statusFilter) return false;

      if (periodQuery.trim()) {
        const q = periodQuery.trim().toLowerCase();
        const periodStr = getPeriodLabel(row).toLowerCase();
        const catStr = (row.category || "").toLowerCase();
        const refStr = (row.transaction_reference || row.utr_reference || "").toLowerCase();
        if (!periodStr.includes(q) && !catStr.includes(q) && !refStr.includes(q)) {
          return false;
        }
      }

      const rowDateStr = row.payment_date || row.period_start || row.start_date || "";
      if (fromDate && rowDateStr && rowDateStr < fromDate) return false;
      if (toDate && rowDateStr && rowDateStr > toDate) return false;

      return true;
    });
  }, [statements, statusFilter, periodQuery, fromDate, toDate]);

  const handleExportCsv = () => {
    exportToCsv(
      `partner-payout-statements-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Period",
        "Category",
        "Total Referrals",
        "Converted Referrals",
        "Gross Commission (INR)",
        "Conversion Bonus (INR)",
        "TDS Deducted (INR)",
        "Net Payout (INR)",
        "Status",
        "Payment Date",
        "Transaction/UTR Reference",
      ],
      filteredStatements.map((row) => [
        getPeriodLabel(row),
        row.category || "",
        row.total_referrals ?? 0,
        row.converted_referrals ?? 0,
        row.gross_commission ?? 0,
        row.conversion_bonus ?? 0,
        row.tds_amount ?? row.tds_deducted ?? 0,
        row.net_payout ?? 0,
        row.status,
        row.payment_date || "",
        row.transaction_reference || row.utr_reference || "",
      ])
    );
  };

  const clearFilters = () => {
    setStatusFilter("All");
    setPeriodQuery("");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    statusFilter !== "All" || periodQuery.trim() !== "" || fromDate !== "" || toDate !== "";

  if (loading) {
    return (
      <div className="bg-white/85 rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header & Export */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Billing Statements &amp; Payout Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track commission settlements, TDS deductions, UTR references, and download payout slips
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredStatements.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV ({filteredStatements.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                statusFilter === status
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Date / Period Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={periodQuery}
              onChange={(e) => setPeriodQuery(e.target.value)}
              placeholder="Search period, UTR..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
              className="text-xs text-slate-700 focus:outline-none bg-transparent"
            />
            <span className="text-slate-400 text-xs">–</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
              className="text-xs text-slate-700 focus:outline-none bg-transparent"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredStatements.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No billing statements found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {hasActiveFilters
              ? "No statements match your current status or date filters. Try clearing filters."
              : "Your payout statements will appear here once a billing cycle is processed."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3 text-right">Referrals</th>
                <th className="py-3.5 px-3 text-right">Converted</th>
                <th className="py-3.5 px-3 text-right">Gross (₹)</th>
                <th className="py-3.5 px-3 text-right">Conv. Bonus (₹)</th>
                <th className="py-3.5 px-3 text-right">TDS (₹)</th>
                <th className="py-3.5 px-3 text-right">Net Payout (₹)</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Payment Date</th>
                <th className="py-3.5 px-3">UTR / Ref</th>
                <th className="py-3.5 px-4 text-right">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStatements.map((row, idx) => {
                const tdsVal = row.tds_amount ?? row.tds_deducted ?? 0;
                const utrVal = row.transaction_reference || row.utr_reference;
                const isCarryForward = row.status === "Carry Forward";

                return (
                  <tr
                    key={row.name || `${getPeriodLabel(row)}-${idx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {getPeriodLabel(row)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      {row.category || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                      {Number(row.total_referrals ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                      {Number(row.converted_referrals ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-800 whitespace-nowrap">
                      {formatINR(row.gross_commission)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                      {formatINR(row.conversion_bonus)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-rose-600 whitespace-nowrap">
                      {Number(tdsVal) > 0 ? `-${formatINR(tdsVal)}` : formatINR(0)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(row.net_payout)}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                        {isCarryForward && (
                          <div className="relative group">
                            <HelpCircle className="w-3.5 h-3.5 text-purple-500 cursor-help" />
                            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-2 w-60 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl z-30 whitespace-normal">
                              Carried forward because net payout is below the minimum payout threshold
                              {minPayoutAmount > 0 ? ` (${formatINR(minPayoutAmount)})` : ""}. It will be included once the minimum payout amount is reached.
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap text-xs">
                      {row.payment_date || "—"}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {utrVal || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {row.payout_slip_pdf ? (
                        <a
                          href={resolveSlipUrl(row.payout_slip_pdf)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Slip
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
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
  );
}

