/**
 * DETERMINISTIC RULES ENGINE.
 *
 * This is the ONLY place eligibility is decided. The language model never
 * computes a verdict; it only explains the verdict objects produced here.
 */
import {
  OFFERS,
  type Band,
  type CustomerProfile,
  type Offer,
  type SizeBand,
} from "./kwalifier-data";

const SCORE_ORDER: Band[] = ["poor", "fair", "good", "excellent"];
const SIZE_ORDER: SizeBand[] = ["low", "medium", "high"];

const rank = <T extends string>(order: T[], value: T | undefined) =>
  value === undefined ? -1 : order.indexOf(value);

export type Verdict = {
  offer_id: string;
  name: string;
  status: "eligible" | "near_miss" | "ineligible";
  relevance_score: number;
  failed_checks: string[];
  gap_statement?: string;
  gauge_data?: { have: number; need: number; max: number; label: string; };
  source_citation: string;
  retrieved_chunk: { benefits: string; exclusions: string };
};

type Check = {
  label: string;
  passed: boolean;
  /** true when the customer is only one step / small margin away */
  near: boolean;
  gap: string;
  gauge_data?: { have: number; need: number; max: number; label: string; };
};

function buildChecks(offer: Offer, profile: CustomerProfile): Check[] {
  const checks: Check[] = [];

  if (offer.min_credit_score_band) {
    const need = rank(SCORE_ORDER, offer.min_credit_score_band);
    const have = rank(SCORE_ORDER, profile.credit_score_band);
    checks.push({
      label: "credit_score_band",
      passed: have >= need,
      near: have === need - 1,
      gap: `Moving your credit score band from "${profile.credit_score_band}" to "${offer.min_credit_score_band}" would unlock this offer.`,
      gauge_data: { have, need, max: SCORE_ORDER.length - 1, label: "Credit Score" },
    });
  }

  if (offer.min_tenure_years !== undefined) {
    const have = profile.tenure_years ?? 0;
    const need = offer.min_tenure_years;
    const missing = need - have;
    checks.push({
      label: "tenure_years",
      passed: have >= need,
      near: missing > 0 && missing <= 2,
      gap: `You need ${need} years with the bank and currently have ${have} — ${Math.max(missing, 0)} more year(s) would unlock this offer.`,
      gauge_data: { have, need, max: need + 2, label: "Tenure (yrs)" },
    });
  }

  if (offer.min_avg_balance_band) {
    const need = rank(SIZE_ORDER, offer.min_avg_balance_band);
    const have = rank(SIZE_ORDER, profile.avg_balance_band);
    checks.push({
      label: "avg_balance_band",
      passed: have >= need,
      near: have === need - 1,
      gap: `Raising your average balance band from "${profile.avg_balance_band}" to "${offer.min_avg_balance_band}" would unlock this offer.`,
      gauge_data: { have, need, max: SIZE_ORDER.length - 1, label: "Balance" },
    });
  }

  if (offer.min_monthly_transaction_volume_band) {
    const need = rank(SIZE_ORDER, offer.min_monthly_transaction_volume_band);
    const have = rank(SIZE_ORDER, profile.monthly_transaction_volume_band);
    checks.push({
      label: "monthly_transaction_volume_band",
      passed: have >= need,
      near: have === need - 1,
      gap: `Your monthly transaction volume band is "${profile.monthly_transaction_volume_band ?? "unknown"}" and this offer needs "${offer.min_monthly_transaction_volume_band}" — a step up in monthly card activity would unlock it.`,
      gauge_data: { have, need, max: SIZE_ORDER.length - 1, label: "Activity" },
    });
  }

  if (offer.max_utilization_pct !== undefined) {
    const over = profile.utilization - offer.max_utilization_pct;
    checks.push({
      label: "utilization_pct",
      passed: profile.utilization < offer.max_utilization_pct,
      near: over >= 0 && over <= 20,
      gap: `You're close — bringing credit utilization (the share of your credit limit you use) below ${offer.max_utilization_pct}% for one billing cycle, from ${profile.utilization}% today, would unlock this.`,
      gauge_data: { have: profile.utilization, need: offer.max_utilization_pct || 0, max: 100, label: "Utilization %" },
    });
  }

  return checks;
}

function relevance(offer: Offer, profile: CustomerProfile, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (offer.category === profile.spend_category) score += 3;
  if (q.includes(offer.category)) score += 4;
  if (q.includes(offer.offer_id.toLowerCase())) score += 6;
  for (const word of offer.name.toLowerCase().split(/[^a-z]+/)) {
    if (word.length > 3 && q.includes(word)) score += 1;
  }
  for (const kw of ["lounge", "miles", "cashback", "gift", "travel", "flight", "airport"]) {
    if (q.includes(kw) && (offer.benefits + offer.name).toLowerCase().includes(kw)) score += 2;
  }
  return score;
}

export function computeVerdicts(profile: CustomerProfile, query = ""): Verdict[] {
  return OFFERS.map((offer): Verdict => {
    const accountMatches = offer.account_type === profile.account_type;
    const checks = accountMatches ? buildChecks(offer, profile) : [];
    const failed = checks.filter((c) => !c.passed);

    let status: Verdict["status"] = "ineligible";
    let gap_statement: string | undefined;
    let gauge_data: Verdict["gauge_data"];

    const firstFailed = failed[0];
    if (!accountMatches) {
      status = "ineligible";
    } else if (failed.length === 0) {
      status = "eligible";
    } else if (failed.length === 1 && firstFailed?.near) {
      status = "near_miss";
      gap_statement = firstFailed.gap;
      gauge_data = firstFailed.gauge_data;
    }


    return {
      offer_id: offer.offer_id,
      name: offer.name,
      status,
      relevance_score: relevance(offer, profile, query),
      failed_checks: accountMatches ? failed.map((c) => c.label) : ["account_type"],
      ...(gap_statement ? { gap_statement } : {}),
      ...(gauge_data ? { gauge_data } : {}),
      source_citation: `${offer.name} (${offer.offer_id}), valid ${offer.valid_from} to ${offer.valid_to}`,
      retrieved_chunk: { benefits: offer.benefits, exclusions: offer.exclusions },
    };
  }).sort((a, b) => b.relevance_score - a.relevance_score);
}

export const isAmbiguous = (query: string) => {
  const words = query.trim().split(/\s+/).filter(Boolean);
  return words.length <= 3;
};
