import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Kwalifier Ops — Beta Launch Dashboard" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

// ============================================================
// Server-side auth check. The expected password never reaches the
// client bundle; only a boolean result does.
// ============================================================
const verifyAdminPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { password: string })
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) {
      return { ok: false, error: "Admin access is not configured on this deployment." };
    }
    return { ok: data.password === expected, error: data.password === expected ? undefined : "Incorrect password." };
  });

const SESSION_KEY = "kwalifier_admin_authed";

// ============================================================
// Mock data. Kwalifier has no persistence layer today (no database,
// no logged interactions), so this whole dashboard reads from static
// data shaped like what a real ops backend would eventually return.
// ============================================================
const KPIS: {
  label: string;
  value: string;
  tone: "moss" | "rust" | "brass";
  note: string;
}[] = [
  { label: "Offer uptake rate", value: "23%", tone: "moss", note: "Above the 20% launch gate" },
  { label: "Escalation rate", value: "4.2%", tone: "moss", note: "Below the 5% gate" },
  { label: "Low-confidence flags", value: "6", tone: "rust", note: "Rules-engine verdict below threshold, needs review" },
  { label: "Policy violations this week", value: "0", tone: "brass", note: "Clean week" },
];

const UPTAKE_SERIES = [
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

const FLAGGED_TRACES = [
  { id: "trc_8f21a", query: "Can I get the premium card with my current balance?", reason: "Low confidence", age: "2h" },
  { id: "trc_6c04e", query: "What about the other account, the business one", reason: "Ambiguous, account unclear", age: "3h" },
  { id: "trc_2d9b7", query: "credit limit increase", reason: "Query too short", age: "5h" },
  { id: "trc_af13c", query: "Why was I declined for the travel card", reason: "Low confidence", age: "9h" },
  { id: "trc_51e8f", query: "gift card offers for my second linked account", reason: "Ambiguous, account unclear", age: "1d" },
  { id: "trc_c73a0", query: "is there a better card than what I have", reason: "Low confidence", age: "1d" },
];

const toneStyles: Record<string, string> = {
  moss: "text-[var(--moss)]",
  rust: "text-[var(--clay-rust)]",
  brass: "text-[var(--vault-brass-text)]",
};

// ============================================================
// Component
// ============================================================
function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "true");
    setCheckedStorage(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyAdminPassword({ data: { password } });
      if (result.ok) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setAuthed(true);
      } else {
        setError(result.error ?? "Incorrect password.");
      }
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNav = (label: string) => {
    if (label === "Overview") {
      setActiveNav(label);
      return;
    }
    toast(`${label} isn't built yet`, { description: "Only Overview exists in this first pass." });
  };

  if (!checkedStorage) {
    return <div style={{ background: "var(--ledger-navy)" }} className="min-h-screen" />;
  }

  if (!authed) {
    return (
      <main
        style={{ background: "var(--ledger-navy)" }}
        className="flex min-h-screen items-center justify-center px-4"
      >
        <form
          onSubmit={handleLogin}
          style={{ background: "var(--admin-parchment)", borderColor: "var(--vault-brass)" }}
          className="w-full max-w-sm border p-8"
        >
          <h1
            style={{ color: "var(--ledger-navy)", fontFamily: "var(--font-display)" }}
            className="text-xl font-semibold"
          >
            Kwalifier Ops
          </h1>
          <p className="mt-1 text-sm text-[var(--ledger-navy)]/70">
            Internal beta launch dashboard. Sign in to continue.
          </p>
          <label htmlFor="admin-password" className="mt-6 block text-xs font-medium text-[var(--ledger-navy)]/70">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderColor: "var(--ledger-navy)" }}
            className="mt-1.5 w-full border bg-white px-3 py-2 text-sm text-[var(--ledger-navy)] outline-none focus:ring-2 focus:ring-[var(--vault-brass)]"
          />
          {error ? <p className="mt-2 text-sm text-[var(--clay-rust)]">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !password}
            style={{ background: "var(--vault-brass)", color: "var(--ledger-navy)" }}
            className="mt-5 w-full py-2 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Checking..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div style={{ background: "var(--admin-parchment)" }} className="flex min-h-screen">
      {/* Sidebar */}
      <aside style={{ background: "var(--ledger-navy)" }} className="flex w-56 flex-shrink-0 flex-col px-5 py-6">
        <div style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold text-white">
          Kwalifier
        </div>
        <div className="mb-8 text-xs text-white/50">Ops console</div>
        <nav className="flex flex-col gap-1">
          {["Overview", "Failure Queue", "Traces", "Settings"].map((label) => (
            <button
              key={label}
              onClick={() => handleNav(label)}
              className={cn(
                "rounded-sm px-3 py-2 text-left text-sm transition-colors",
                activeNav === label
                  ? "font-medium"
                  : "text-white/45 hover:text-white/70"
              )}
              style={activeNav === label ? { background: "var(--vault-brass)", color: "var(--ledger-navy)" } : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto text-xs text-white/35">Beta launch monitoring</div>
      </aside>

      {/* Main canvas */}
      <main className="flex-1 overflow-y-auto px-8 py-7">
        <h1 style={{ color: "var(--ledger-navy)", fontFamily: "var(--font-display)" }} className="text-2xl font-semibold">
          Overview
        </h1>
        <p className="mt-1 text-sm text-[var(--ledger-navy)]/60">Kwalifier Beta, static snapshot for this pass</p>

        {/* KPI row */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              style={{ background: "var(--admin-parchment)", borderColor: "var(--ledger-navy)" }}
              className="border p-4"
            >
              <div
                style={{ fontFamily: "var(--font-display)" }}
                className={cn("text-3xl font-semibold", toneStyles[kpi.tone])}
              >
                {kpi.value}
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--ledger-navy)]">{kpi.label}</div>
              <div className="mt-0.5 text-xs text-[var(--ledger-navy)]/55">{kpi.note}</div>
            </div>
          ))}
        </div>

        {/* Chart + table */}
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div style={{ background: "white", borderColor: "var(--ledger-navy)" }} className="border p-4">
            <h2 style={{ color: "var(--ledger-navy)" }} className="text-sm font-semibold">
              Offer uptake, last 14 days
            </h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={UPTAKE_SERIES} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "var(--ledger-navy)", fillOpacity: 0.55 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--ledger-navy)", fillOpacity: 0.55 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    unit="%"
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--ledger-navy)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "var(--ledger-navy)" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: "white", borderColor: "var(--ledger-navy)" }} className="border p-4">
            <h2 style={{ color: "var(--ledger-navy)" }} className="text-sm font-semibold">
              Flagged traces awaiting review
            </h2>
            <Table className="mt-3 table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderColor: "var(--ledger-navy)" }}>
                  <TableHead className="w-[16%] text-[var(--ledger-navy)]/60">Trace ID</TableHead>
                  <TableHead className="w-[38%] text-[var(--ledger-navy)]/60">Query</TableHead>
                  <TableHead className="w-[24%] text-[var(--ledger-navy)]/60">Flag reason</TableHead>
                  <TableHead className="w-[9%] text-[var(--ledger-navy)]/60">Age</TableHead>
                  <TableHead className="w-[13%] text-right text-[var(--ledger-navy)]/60">&nbsp;</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FLAGGED_TRACES.map((row, i) => (
                  <TableRow
                    key={row.id}
                    style={{
                      background: i % 2 === 1 ? "var(--admin-parchment)" : "white",
                      borderColor: "var(--border)",
                    }}
                    className="hover:bg-[var(--admin-parchment)]"
                  >
                    <TableCell className="truncate font-mono text-xs text-[var(--ledger-navy)]/70">{row.id}</TableCell>
                    <TableCell className="truncate text-sm text-[var(--ledger-navy)]" title={row.query}>
                      {row.query}
                    </TableCell>
                    <TableCell className="truncate text-sm text-[var(--ledger-navy)]/80" title={row.reason}>
                      {row.reason}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ledger-navy)]/60">{row.age}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => toast(`Trace ${row.id}`, { description: "Review flow isn't built in this pass." })}
                        style={{ background: "var(--vault-brass)", color: "var(--ledger-navy)" }}
                        className="px-2.5 py-1 text-xs font-medium"
                      >
                        Review
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
