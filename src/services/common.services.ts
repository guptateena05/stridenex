import { api, apiService } from "./api.services";
import type { SubscriptionDashboardResponse } from "@/types/subscription";



// get plans by account type (student, mentor, college, industry)
export const getBillingPackagesByType = async (accountType: string) => {
  try {
    const response = await apiService.get(
      `method/quantbit_billing_platform.quantbit_billing_platform.api.get_billing_packages_by_type?account_type=${encodeURIComponent(accountType)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching plans by account type:", error);
    throw error;
  }
};

/**
 * Fetch the billing platform URL from the backend.
 * This is the same API that the landing page's payNow() function uses
 * to discover the billing/payment platform dynamically.
 *
 * Returns the billing URL string (e.g. "https://billing.example.com/plans.html?from_site=...")
 */
export const getBillingUrl = async (fromSite: string): Promise<string> => {
  try {
    const response = await apiService.get(
      `method/quantbit_billing_platform.quantbit_billing_platform.api.get_billing_url?from_site=${encodeURIComponent(fromSite)}`
    );
    const billingUrl = response?.message;
    if (!billingUrl) {
      throw new Error("Billing URL not returned from server");
    }
    return billingUrl;
  } catch (error) {
    console.error("Error fetching billing URL:", error);
    throw error;
  }
};

export const fetchProjectDetails = async (doctype: string) => {
  try {
    const response = await api.get(
      `method/quantlis_management.api.get_doctype_json`,
      {
        params: { doctype },
      }
    );

    return response.data.message;
  } catch (error) {
    console.error("Error fetching doctype:", error);
    throw new Error("Failed to fetch doctype");
  }
};

export const fetchBackgroundImage = async () => {
  try {
    const response = await api.get(
      `method/quantlis_management.api.get_background_image`
    );

    return response.data.message.background_image;
  } catch (error) {
    console.error("Error fetching background image:", error);
    throw new Error("Failed to fetch background image");
  }
};

export const getUserSubscriptionDashboard =
  async (): Promise<SubscriptionDashboardResponse> => {
    try {
      const response = await apiService.get(
        `method/quantbit_billing_platform.quantbit_billing_platform.api.get_user_subscription_dashboard`
      );
      const data: SubscriptionDashboardResponse = response?.message ?? response;
      return data;
    } catch (error) {
      console.error("Error fetching user subscription dashboard:", error);
      throw error;
    }
  };
