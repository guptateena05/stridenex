"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { BarChart3, Download, PieChart as PieChartIcon } from "lucide-react";
import type { ModuleEarningItem } from "@/types/partnerBilling.types";
import { exportToCsv, formatINR } from "@/services/partnerBilling.services";

interface ModuleEarningsBreakdownProps {
  items: ModuleEarningItem[];
  loading?: boolean;
}

const MODULE_COLORS: Record<string, string> = {
  Student: "#3b82f6",
  College: "#8b5cf6",
  Mentor: "#f59e0b",
  Industry: "#10b981",
};

export default function ModuleEarningsBreakdown({
  items,
  loading = false,
}: ModuleEarningsBreakdownProps) {
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");

  if (loading) {
    return (
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-56 bg-slate-200 rounded" />
          <div className="h-9 w-32 bg-slate-100 rounded-lg" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const normalizedItems = items.length
    ? items
    : [
        { module: "Student", referral_count: 0, converted_count: 0, earned_amount: 0 },
        { module: "College", referral_count: 0, converted_count: 0, earned_amount: 0 },
        { module: "Mentor", referral_count: 0, converted_count: 0, earned_amount: 0 },
        { module: "Industry", referral_count: 0, converted_count: 0, earned_amount: 0 },
      ];

  const chartData = normalizedItems.map((item) => ({
    name: item.module,
    referrals: item.referral_count,
    conversions: item.converted_count,
    earnings: item.earned_amount,
    color: MODULE_COLORS[item.module] || "#6366f1",
  }));

  const totalReferrals = normalizedItems.reduce((acc, i) => acc + i.referral_count, 0);
  const totalConversions = normalizedItems.reduce((acc, i) => acc + i.converted_count, 0);
  const totalEarnings = normalizedItems.reduce((acc, i) => acc + i.earned_amount, 0);

  const hasPieData = chartData.some((d) => d.earnings > 0 || d.referrals > 0);

  const handleExportCsv = () => {
    exportToCsv(
      `partner-module-earnings-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Module", "Total Referrals", "Converted Referrals", "Conversion Rate (%)", "Earned Amount (INR)"],
      normalizedItems.map((row) => {
        const convRate =
          row.referral_count > 0
            ? ((row.converted_count / row.referral_count) * 100).toFixed(1)
            : "0.0";
        return [
          row.module,
          row.referral_count,
          row.converted_count,
          convRate,
          row.earned_amount,
        ];
      })
    );
  };

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Module-wise Earnings Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Referral volume, conversions, and commission earned across Student, College, Mentor, and Industry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === "bar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Bar
            </button>
            <button
              type="button"
              onClick={() => setChartType("donut")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === "donut"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              Donut
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Chart */}
        <div className="lg:col-span-5 h-64 w-full">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <RechartsTooltip
                  formatter={(value, name) => [
                    name === "earnings" ? formatINR(Number(value ?? 0)) : String(value ?? 0),
                    name === "earnings" ? "Earned" : String(name ?? ""),
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="earnings" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : hasPieData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey={totalEarnings > 0 ? "earnings" : "referrals"}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={4}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={`pie-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) =>
                    totalEarnings > 0
                      ? formatINR(Number(value ?? 0))
                      : `${String(value ?? 0)} referrals`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center p-4">
              <PieChartIcon className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">No module earnings data yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Earnings distribution will appear once referrals convert.
              </p>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="lg:col-span-7 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3 text-right">Referrals</th>
                <th className="py-3 px-3 text-right">Converted</th>
                <th className="py-3 px-3 text-right">Conv. Rate</th>
                <th className="py-3 px-3 text-right">Earned (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {normalizedItems.map((row) => {
                const color = MODULE_COLORS[row.module] || "#6366f1";
                const convRate =
                  row.referral_count > 0
                    ? ((row.converted_count / row.referral_count) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr key={row.module} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        {row.module}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                      {row.referral_count.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                      {row.converted_count.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500">{convRate}%</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      {formatINR(row.earned_amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/80 text-sm font-bold text-slate-900">
                <td className="py-3 px-3">Total</td>
                <td className="py-3 px-3 text-right">{totalReferrals.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right">{totalConversions.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right">
                  {totalReferrals > 0
                    ? ((totalConversions / totalReferrals) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
                <td className="py-3 px-3 text-right text-emerald-700">
                  {formatINR(totalEarnings)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
