// Shared, dependency-free constants for the customer list (the demand-side mirror
// of the provider directory). Arabic labels for the internal dashboard screens.
// Customers are never public — there is no visibility module here.

export type CustomerStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  DRAFT: "مسودة",
  ACTIVE: "مفعّل",
  ARCHIVED: "مؤرشف",
};
export const CUSTOMER_STATUS_ORDER: CustomerStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
