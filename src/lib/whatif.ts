/**
 * WHAT-IF SIMULATOR.
 *
 * Lets a customer move the one factor holding back a near-miss offer and see
 * what the rules engine says. It only edits a copy of the profile and runs
 * computeVerdicts again; nothing here decides eligibility, and the language
 * model is never called.
 */
import { SCORE_ORDER, SIZE_ORDER, computeVerdicts, type Verdict } from "./eligibility";
import type { CustomerProfile } from "./kwalifier-data";

type LeverCheck =
  | "utilization_pct"
  | "tenure_years"
  | "credit_score_band"
  | "avg_balance_band"
  | "monthly_transaction_volume_band";

export type Lever = {
  check: LeverCheck;
  label: string;
  min: number;
  max: number;
  step: number;
  current: number;
  format: (value: number) => string;
};

const bandLever = (
  check: LeverCheck,
  label: string,
  order: readonly string[],
  value: string | undefined,
): Lever => ({
  check,
  label,
  min: 0,
  max: order.length - 1,
  step: 1,
  // An unknown band ranks below every band in the rules engine; start the slider at the lowest one.
  current: Math.max(0, value === undefined ? -1 : order.indexOf(value)),
  format: (v) => order[v] ?? String(v),
});

/** The control for a failed check label from the rules engine, or null if it can't be simulated. */
export function leverFor(profile: CustomerProfile, check: string): Lever | null {
  switch (check) {
    case "utilization_pct":
      return {
        check,
        label: "Credit utilization",
        min: 0,
        max: 100,
        step: 1,
        current: profile.utilization,
        format: (v) => `${v}%`,
      };
    case "tenure_years": {
      const have = profile.tenure_years ?? 0;
      return {
        check,
        label: "Years with the bank",
        min: have,
        max: have + 5,
        step: 1,
        current: have,
        format: (v) => `${v} ${v === 1 ? "year" : "years"}`,
      };
    }
    case "credit_score_band":
      return bandLever(check, "Credit score band", SCORE_ORDER, profile.credit_score_band);
    case "avg_balance_band":
      return bandLever(check, "Average balance", SIZE_ORDER, profile.avg_balance_band);
    case "monthly_transaction_volume_band":
      return bandLever(
        check,
        "Monthly card activity",
        SIZE_ORDER,
        profile.monthly_transaction_volume_band,
      );
    default:
      return null;
  }
}

export function applyLever(profile: CustomerProfile, lever: Lever, value: number): CustomerProfile {
  switch (lever.check) {
    case "utilization_pct":
      return { ...profile, utilization: value };
    case "tenure_years":
      return { ...profile, tenure_years: value };
    case "credit_score_band":
      return { ...profile, credit_score_band: SCORE_ORDER[value] ?? profile.credit_score_band };
    case "avg_balance_band":
      return { ...profile, avg_balance_band: SIZE_ORDER[value] ?? profile.avg_balance_band };
    case "monthly_transaction_volume_band": {
      const band = SIZE_ORDER[value];
      return band ? { ...profile, monthly_transaction_volume_band: band } : profile;
    }
  }
}

export type Simulation = {
  verdicts: Verdict[];
  /** Offers whose status differs from the customer's real profile. */
  changed: { verdict: Verdict; from: Verdict["status"] }[];
};

export function simulate(profile: CustomerProfile, lever: Lever, value: number): Simulation {
  const before = new Map(computeVerdicts(profile).map((v) => [v.offer_id, v.status]));
  const verdicts = computeVerdicts(applyLever(profile, lever, value));
  const changed = verdicts.flatMap((verdict) => {
    const from = before.get(verdict.offer_id);
    return from && from !== verdict.status ? [{ verdict, from }] : [];
  });
  return { verdicts, changed };
}
