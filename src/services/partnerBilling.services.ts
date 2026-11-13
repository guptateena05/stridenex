import { apiService } from "@/services/api.services";
import type {
  ModuleEarningItem,
  PartnerBillingStatement,
  PartnerBillingSummary,
  PartnerCategoryInfo,
  OnboardingPartnerCategory,
  PartnerPayoutSheet,
} from "@/types/partnerBilling.types";

type UnknownRecord = Record<string, unknown>;

function isRecord(val: unknown): val is UnknownRecord {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Unwrap Frappe / gen_response payloads which may be nested under
 * `res.message.data`, `res.data`, or `res.message`.
 * Checks for array or record payload inside `data` or `message`.
 */
function unwrapPayload<T = unknown>(res: unknown): T {
  if (!isRecord(res)) return res as T;

  // 1. Nested res.message.data
  if (isRecord(res.message) && res.message.data !== undefined) {
    return res.message.data as T;
  }
  // 2. Direct res.data (Frappe / gen_response API structure: { status: 200, message: "...", data: ... })
  if (res.data !== undefined) {
    if (isRecord(res.data) && res.data.data !== undefined) {
      return res.data.data as T;
    }
    return res.data as T;
  }
  // 3. Direct res.message
  if (res.message !== undefined) {
    return res.message as T;
  }

  return res as T;
}

export async function getPartnerBillingSummary(
  partnerEmail?: string
): Promise<PartnerBillingSummary> {
  const res = await apiService.get(
    "method/stridenex_app.stridenex_app.doctype.partner_billing_statement.partner_billing_statement.get_partner_billing_summary",
    { params: partnerEmail ? { partner_email: partnerEmail } : undefined }
  );
  return unwrapPayload<PartnerBillingSummary>(res) || {};
}

export async function getOnboardingPartnerCategories(): Promise<
  OnboardingPartnerCategory[]
> {
  const res = await apiService.get(
    "method/stridenex_app.api_stridenex_app.partner.billing.get_onboarding_partner_categories"
  );
  const data = unwrapPayload<OnboardingPartnerCategory[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function getPartnerCategoryInfo(
  partnerEmail?: string
): Promise<PartnerCategoryInfo> {
  const res = await apiService.get(
    "method/stridenex_app.api_stridenex_app.partner.billing.get_partner_category_info",
    { params: partnerEmail ? { partner_email: partnerEmail } : undefined }
  );
  return unwrapPayload<PartnerCategoryInfo>(res) || {};
}

export async function getPartnerPayoutHistory(
  partnerEmail?: string,
  filters?: { status?: string; from_date?: string; to_date?: string }
): Promise<PartnerBillingStatement[]> {
  const params: Record<string, string> = {};
  if (partnerEmail) params.partner_email = partnerEmail;
  if (filters?.status && filters.status !== "All") params.status = filters.status;
  if (filters?.from_date) params.from_date = filters.from_date;
  if (filters?.to_date) params.to_date = filters.to_date;

  const res = await apiService.get(
    "method/stridenex_app.stridenex_app.doctype.partner_billing_statement.partner_billing_statement.get_partner_payout_history",
    { params: Object.keys(params).length ? params : undefined }
  );
  const data = unwrapPayload<unknown>(res);
  if (Array.isArray(data)) return data as PartnerBillingStatement[];
  if (isRecord(data)) {
    if (Array.isArray(data.statements)) return data.statements as PartnerBillingStatement[];
    if (Array.isArray(data.history)) return data.history as PartnerBillingStatement[];
    if (Array.isArray(data.records)) return data.records as PartnerBillingStatement[];
  }
  return [];
}

export async function getPartnerReferralEarnings(
  partnerEmail?: string
): Promise<ModuleEarningItem[]> {
  const res = await apiService.get(
    "method/stridenex_app.stridenex_app.doctype.partner_billing_statement.partner_billing_statement.get_partner_referral_earnings",
    { params: partnerEmail ? { partner_email: partnerEmail } : undefined }
  );
  const data = unwrapPayload<unknown>(res);

  const defaultModules: ModuleEarningItem[] = [
    { module: "Student", referral_count: 0, converted_count: 0, earned_amount: 0 },
    { module: "College", referral_count: 0, converted_count: 0, earned_amount: 0 },
    { module: "Mentor", referral_count: 0, converted_count: 0, earned_amount: 0 },
    { module: "Industry", referral_count: 0, converted_count: 0, earned_amount: 0 },
  ];

  const normalizeRow = (item: unknown, fallbackModule?: string): ModuleEarningItem => {
    const rec = isRecord(item) ? item : {};
    return {
      module: String(rec.module ?? rec.module_name ?? fallbackModule ?? "Other"),
      referral_count: Number(
        rec.referral_count ?? rec.referrals ?? rec.count ?? rec.total ?? 0
      ),
      converted_count: Number(
        rec.converted_count ?? rec.conversions ?? rec.converted ?? rec.count ?? 0
      ),
      earned_amount: Number(
        rec.earned_amount ?? rec.earnings ?? rec.amount ?? rec.total_earned ?? 0
      ),
      rate: rec.rate !== undefined ? Number(rec.rate) : undefined,
    };
  };

  if (Array.isArray(data)) {
    return data.map((row) => normalizeRow(row));
  }
  if (isRecord(data)) {
    if (Array.isArray(data.modules)) {
      return data.modules.map((row) => normalizeRow(row));
    }
    if (Array.isArray(data.breakdown)) {
      return data.breakdown.map((row) => normalizeRow(row));
    }
    const mapSource = isRecord(data.by_module)
      ? data.by_module
      : isRecord(data.modules)
        ? data.modules
        : data;
    const keys = ["Student", "College", "Mentor", "Industry"];
    const hasKnownKey = keys.some((k) => k in mapSource || k.toLowerCase() in mapSource);
    if (hasKnownKey) {
      return keys.map((k) => {
        const entry = mapSource[k] ?? mapSource[k.toLowerCase()] ?? {};
        return normalizeRow(isRecord(entry) ? entry : { earned_amount: entry }, k);
      });
    }
  }
  return defaultModules;
}

export async function getPartnerProfile(email?: string): Promise<{
  partner: UnknownRecord | null;
  referal_code: string | null;
}> {
  const res = await apiService.get(
    "method/stridenex_app.stridenex_app.doctype.stridenex_partner.stridenex_partner.get_partner",
    { params: email ? { email } : undefined }
  );
  const data = unwrapPayload<unknown>(res);
  if (!isRecord(data)) {
    return { partner: null, referal_code: null };
  }
  const partnerObj = isRecord(data.partner)
    ? data.partner
    : data.first_name
      ? data
      : null;
  const userObj = isRecord(data.user) ? data.user : null;
  const referalCode =
    (userObj?.referal_code as string | undefined) ||
    (partnerObj?.referal_code as string | undefined) ||
    (data.referal_code as string | undefined) ||
    (data.referral_code as string | undefined) ||
    null;

  return { partner: partnerObj, referal_code: referalCode };
}

export async function getPartnerReferralModuleCount(referralCode: string) {
  const res = await apiService.get(
    "method/stridenex_app.stridenex_app.doctype.referal_details.referal_details.get_referral_module_count",
    { params: { referral_code: referralCode } }
  );
  return unwrapPayload<UnknownRecord>(res);
}

export async function getPartnerReferenceCard(
  referenceCode: string,
  module: string = "partner"
): Promise<string | null> {
  const res = await apiService.get(
    "method/stridenex_app.stridenex_app.doctype.stridenex_partner.stridenex_partner.get_reference_card",
    { params: { reference_code: referenceCode, module } }
  );
  const data = unwrapPayload<unknown>(res);
  if (isRecord(data) && typeof data.image_url === "string") {
    return data.image_url;
  }
  return null;
}

// ─── Admin / Partner Manager APIs ────────────────────────────────────────────

export async function getAllPartnerPayoutSheets(
  filters?: Record<string, unknown>
): Promise<PartnerPayoutSheet[]> {
  const res = await apiService.get(
    "method/stridenex_app.api_stridenex_app.partner.billing.get_all_partner_payout_sheets",
    {
      params:
        filters && Object.keys(filters).length
          ? { filters: JSON.stringify(filters) }
          : undefined,
    }
  );
  const data = unwrapPayload<unknown>(res);
  if (Array.isArray(data)) return data as PartnerPayoutSheet[];
  if (isRecord(data)) {
    if (Array.isArray(data.sheets)) return data.sheets as PartnerPayoutSheet[];
    if (Array.isArray(data.data)) return data.data as PartnerPayoutSheet[];
  }
  return [];
}

export async function createPartnerPayoutSheet(payload: {
  start_date: string;
  end_date: string;
  payout_cycle: string;
}) {
  const res = await apiService.post(
    "method/stridenex_app.api_stridenex_app.partner.billing.create_partner_payout_sheet",
    payload
  );
  return unwrapPayload<UnknownRecord>(res);
}

export async function releasePartnerPayouts(payload: { sheet_name: string }) {
  const res = await apiService.post(
    "method/stridenex_app.api_stridenex_app.partner.billing.release_partner_payouts",
    payload
  );
  return unwrapPayload<UnknownRecord>(res);
}

// ─── Formatting & CSV Helpers ────────────────────────────────────────────────

export function formatINR(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return "₹0";
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const escapeCell = (val: string | number | null | undefined) => {
    const str = val === null || val === undefined ? "" : String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
