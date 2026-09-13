export type Band = "poor" | "fair" | "good" | "excellent";
export type SizeBand = "low" | "medium" | "high";

export type Offer = {
  offer_id: string;
  name: string;
  account_type: "personal" | "business";
  category: string;
  benefits: string;
  exclusions: string;
  valid_from: string;
  valid_to: string;
  min_credit_score_band?: Band;
  min_tenure_years?: number;
  min_avg_balance_band?: SizeBand;
  min_monthly_transaction_volume_band?: SizeBand;
  max_utilization_pct?: number;
};

export const OFFERS: Offer[] = [
  {
    offer_id: "TRV001",
    name: "Travel Rewards Card - Lounge Access",
    account_type: "personal",
    category: "travel",
    benefits:
      "Complimentary access to 1000+ airport lounges worldwide. Priority boarding on partner airlines.",
    exclusions:
      "Domestic lounges only in Tier-2 and Tier-3 cities. Does not include guest access.",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    min_credit_score_band: "good",
    min_tenure_years: 5,
  },
  {
    offer_id: "TRV002",
    name: "Travel Rewards Card - Airline Miles",
    account_type: "personal",
    category: "travel",
    benefits: "5x airline miles on flight bookings made through the bank's travel portal.",
    exclusions:
      "Miles do not apply to third-party booking sites or last-minute fare classes.",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    min_credit_score_band: "good",
    min_tenure_years: 3,
  },
  {
    offer_id: "BIZ001",
    name: "Business Spend-back Card",
    account_type: "business",
    category: "gifting",
    benefits: "3% cashback on gift and client-entertainment category spend, up to $500/month.",
    exclusions: "Cashback cap resets monthly and does not roll over.",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    min_avg_balance_band: "medium",
    min_monthly_transaction_volume_band: "high",
  },
  {
    offer_id: "PLAT001",
    name: "Platinum Business Card",
    account_type: "business",
    category: "gifting",
    benefits:
      "5% cashback on gift-category spend, higher credit limits, dedicated relationship manager.",
    exclusions: "Requires credit utilization below 70% over the prior billing cycle.",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    min_avg_balance_band: "high",
    max_utilization_pct: 70,
  },
];

export type CustomerProfile = {
  id: string;
  name: string;
  account_type: "personal" | "business";
  spend_category: string;
  credit_score_band: Band;
  tenure_years?: number;
  avg_balance_band: SizeBand;
  monthly_transaction_volume_band?: SizeBand;
  utilization: number;
  linked_accounts: boolean;
  linked_account_labels?: string[];
  blurb: string;
};

export const PROFILES: CustomerProfile[] = [
  {
    id: "smarth",
    name: "Smarth",
    account_type: "personal",
    spend_category: "travel",
    credit_score_band: "good",
    tenure_years: 10,
    avg_balance_band: "medium",
    utilization: 30,
    linked_accounts: false,
    blurb: "Personal account · travel spender · 10 years with the bank",
  },
  {
    id: "aadarsh",
    name: "Aadarsh",
    account_type: "business",
    spend_category: "gifting",
    credit_score_band: "good",
    avg_balance_band: "high",
    monthly_transaction_volume_band: "medium",
    utilization: 40,
    linked_accounts: true,
    linked_account_labels: ["Business Account A", "Business Account B"],
    blurb: "Business account · gifting spend · two linked business accounts",
  },
  {
    id: "allan",
    name: "Allan",
    account_type: "business",
    spend_category: "gifting",
    credit_score_band: "good",
    avg_balance_band: "high",
    monthly_transaction_volume_band: "high",
    utilization: 85,
    linked_accounts: false,
    blurb: "Business account · gifting spend · high utilization (85%)",
  },
];

export const getProfile = (id: string): CustomerProfile =>
  PROFILES.find((p) => p.id === id) ?? (PROFILES[0] as CustomerProfile);

