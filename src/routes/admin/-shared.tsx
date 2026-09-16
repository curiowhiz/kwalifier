import { Link, useLocation } from "@tanstack/react-router";
import { motion, animate } from "motion/react";
import { useEffect, useState } from "react";
import { AlertTriangle, Activity, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// Shared hooks
// ============================================================

/** Counts up from 0 to `target` on mount, same technique the chat page's
 *  radial gauge uses (src/routes/index.tsx), reused here for consistency. */
export function useCountUp(target: number, duration = 0.9) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return controls.stop;
  }, [target, duration]);
  return display;
}

// ============================================================
// Mock data (Kwalifier has no persistence layer today, so every
// number here is static, shaped like what a real ops backend would
// eventually return)
// ============================================================

export type Tone = "moss" | "rust" | "brass";

export const toneStyles: Record<Tone, string> = {
  moss: "text-[var(--moss)]",
  rust: "text-[var(--clay-rust)]",
  brass: "text-[var(--vault-brass-text)]",
};

export const KPIS: {
  label: string;
  value: number;
  decimals: number;
  suffix: string;
  tone: Tone;
  note: string;
}[] = [
  { label: "Offer uptake rate", value: 23, decimals: 0, suffix: "%", tone: "moss", note: "Above the 20% launch gate" },
  { label: "Escalation rate", value: 4.2, decimals: 1, suffix: "%", tone: "moss", note: "Below the 5% gate" },
  { label: "Low-confidence flags", value: 6, decimals: 0, suffix: "", tone: "rust", note: "Rules-engine verdict below threshold, needs review" },
  { label: "Policy violations this week", value: 0, decimals: 0, suffix: "", tone: "brass", note: "Clean week" },
];

export const UPTAKE_SERIES = [
  { day: "Day 1", rate: 14 },
  { day: "Day 2", rate: 15 },
  { day: "Day 3", rate: 15 },
  { day: "Day 4", rate: 17 },
  { day: "Day 5", rate: 16 },
  { day: "Day 6", rate: 18 },
  { day: "Day 7", rate: 19 },
  { day: "Day 8", rate: 18 },
  { day: "Day 9", rate: 20 },
  { day: "Day 10", rate: 21 },
  { day: "Day 11", rate: 20 },
  { day: "Day 12", rate: 22 },
  { day: "Day 13", rate: 22 },
  { day: "Day 14", rate: 23 },
];

export type FlaggedTrace = {
  id: string;
  query: string;
  reason: string;
  age: string;
  profile: string;
};

export const FLAGGED_TRACES: FlaggedTrace[] = [
  { id: "trc_8f21a", query: "Can I get the premium card with my current balance?", reason: "Low confidence", age: "2h", profile: "Smarth" },
  { id: "trc_6c04e", query: "What about the other account, the business one", reason: "Ambiguous, account unclear", age: "3h", profile: "Aadarsh" },
  { id: "trc_2d9b7", query: "credit limit increase", reason: "Query too short", age: "5h", profile: "Allan" },
  { id: "trc_af13c", query: "Why was I declined for the travel card", reason: "Low confidence", age: "9h", profile: "Smarth" },
  { id: "trc_51e8f", query: "gift card offers for my second linked account", reason: "Ambiguous, account unclear", age: "1d", profile: "Aadarsh" },
  { id: "trc_c73a0", query: "is there a better card than what I have", reason: "Low confidence", age: "1d", profile: "Allan" },
];

export type TraceRow = {
  id: string;
  query: string;
  outcome: "Answered" | "Flagged" | "Fallback";
  profile: string;
  latency: string;
  age: string;
};

export const ALL_TRACES: TraceRow[] = [
  { id: "trc_9a2e1", query: "What card suits my spending on gifts and travel?", outcome: "Answered", profile: "Smarth", latency: "1.4s", age: "12m" },
  { id: "trc_7b31d", query: "Which offers can I use at the airport?", outcome: "Answered", profile: "Aadarsh", latency: "1.1s", age: "38m" },
  { id: "trc_8f21a", query: "Can I get the premium card with my current balance?", outcome: "Flagged", profile: "Smarth", latency: "1.6s", age: "2h" },
  { id: "trc_4c88b", query: "Am I close to qualifying for anything better?", outcome: "Answered", profile: "Allan", latency: "1.3s", age: "2h" },
  { id: "trc_6c04e", query: "What about the other account, the business one", outcome: "Flagged", profile: "Aadarsh", latency: "1.2s", age: "3h" },
  { id: "trc_1e07f", query: "How do I qualify for lounge access?", outcome: "Answered", profile: "Smarth", latency: "0.9s", age: "4h" },
  { id: "trc_2d9b7", query: "credit limit increase", outcome: "Flagged", profile: "Allan", latency: "0.8s", age: "5h" },
  { id: "trc_5a90c", query: "What benefits come with the business card?", outcome: "Answered", profile: "Aadarsh", latency: "1.5s", age: "7h" },
  { id: "trc_af13c", query: "Why was I declined for the travel card", outcome: "Fallback", profile: "Smarth", latency: "1.7s", age: "9h" },
  { id: "trc_3f64e", query: "Do I get cashback on gift purchases?", outcome: "Answered", profile: "Aadarsh", latency: "1.0s", age: "11h" },
];

export const outcomeStyles: Record<TraceRow["outcome"], string> = {
  Answered: "text-[var(--moss)]",
  Flagged: "text-[var(--clay-rust)]",
  Fallback: "text-[var(--vault-brass-text)]",
};

export const SETTINGS_ITEMS = [
  { label: "Offer uptake launch gate", value: "20%", note: "Minimum weekly uptake rate before the beta is considered viable" },
  { label: "Escalation rate gate", value: "5%", note: "Maximum share of conversations that should need human handoff" },
  { label: "Retrieval confidence floor", value: "0.12", note: "Below this hybrid retrieval score, the assistant falls back instead of guessing" },
  { label: "Groundedness threshold", value: "60%", note: "Minimum share of an answer's terms that must trace back to retrieved context" },
  { label: "Chat rate limit", value: "15 requests / min per IP", note: "Enforced server-side on /api/chat to protect the Gemini key from abuse" },
];

// ============================================================
// Nav
// ============================================================

export const NAV_ITEMS = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard },
  { label: "Failure Queue", to: "/admin/failure-queue", icon: AlertTriangle },
  { label: "Traces", to: "/admin/traces", icon: Activity },
  { label: "Settings", to: "/admin/settings", icon: SettingsIcon },
] as const;

export function AdminNav() {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.to;
        const Icon = item.icon;
        return (
          <Link key={item.to} to={item.to} className="relative">
            {active ? (
              <motion.span
                layoutId="admin-nav-active"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-sm"
                style={{ background: "var(--vault-brass)" }}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors",
                active ? "font-medium" : "text-white/45 hover:text-white/70"
              )}
              style={active ? { color: "var(--ledger-navy)" } : undefined}
            >
              <Icon className="size-4 flex-shrink-0" strokeWidth={2} />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ============================================================
// Shared page chrome
// ============================================================

export function AdminHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 style={{ color: "var(--ledger-navy)", fontFamily: "var(--font-display)" }} className="text-2xl font-semibold">
        {title}
      </h1>
      <p className="mt-1 text-sm text-[var(--ledger-navy)]/60">{subtitle}</p>
    </>
  );
}

export function AdminCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderColor: "var(--ledger-navy)" }} className={cn("border p-4", className)}>
      {children}
    </div>
  );
}
