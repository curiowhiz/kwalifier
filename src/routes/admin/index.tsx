import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminCard,
  AdminHeader,
  FLAGGED_TRACES,
  KPIS,
  UPTAKE_SERIES,
  toneStyles,
  useCountUp,
} from "./-shared";

export const Route = createFileRoute("/admin/")({
  component: OverviewPage,
});

function KpiCard({ kpi, index }: { kpi: (typeof KPIS)[number]; index: number }) {
  const display = useCountUp(kpi.value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: "var(--admin-parchment)", borderColor: "var(--ledger-navy)" }}
      className="border p-4"
    >
      <div style={{ fontFamily: "var(--font-display)" }} className={`text-3xl font-semibold tabular-nums ${toneStyles[kpi.tone]}`}>
        {display.toFixed(kpi.decimals)}
        {kpi.suffix}
      </div>
      <div className="mt-1 text-sm font-medium text-[var(--ledger-navy)]">{kpi.label}</div>
      <div className="mt-0.5 text-xs text-[var(--ledger-navy)]/55">{kpi.note}</div>
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{ background: "var(--ledger-navy)", color: "var(--admin-parchment)" }}
      className="px-2.5 py-1.5 text-xs shadow-lg"
    >
      <div className="font-medium">{label}</div>
      <div className="tabular-nums opacity-80">{payload[0]?.value}% uptake</div>
    </div>
  );
}

function OverviewPage() {
  return (
    <div>
      <AdminHeader title="Overview" subtitle="Kwalifier Beta, static snapshot for this pass" />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi, i) => (
          <KpiCard key={kpi.label} kpi={kpi} index={i} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24 }}>
          <AdminCard>
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
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--vault-brass)", strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--ledger-navy)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "var(--ledger-navy)" }}
                    activeDot={{ r: 4.5, fill: "var(--vault-brass)", stroke: "var(--ledger-navy)", strokeWidth: 1.5 }}
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
          <AdminCard>
            <div className="flex items-center justify-between">
              <h2 style={{ color: "var(--ledger-navy)" }} className="text-sm font-semibold">
                Flagged traces awaiting review
              </h2>
              <Link
                to="/admin/failure-queue"
                style={{ color: "var(--vault-brass-text)" }}
                className="text-xs font-medium hover:underline"
              >
                View all →
              </Link>
            </div>
            <Table className="mt-3 table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderColor: "var(--ledger-navy)" }}>
                  <TableHead className="w-[18%] text-[var(--ledger-navy)]/60">Trace ID</TableHead>
                  <TableHead className="w-[46%] text-[var(--ledger-navy)]/60">Query</TableHead>
                  <TableHead className="w-[24%] text-[var(--ledger-navy)]/60">Flag reason</TableHead>
                  <TableHead className="w-[12%] text-[var(--ledger-navy)]/60">Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FLAGGED_TRACES.slice(0, 4).map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.36 + i * 0.05 }}
                    style={{
                      background: i % 2 === 1 ? "var(--admin-parchment)" : "white",
                      borderColor: "var(--border)",
                    }}
                    className="border-b transition-colors hover:bg-[var(--admin-parchment)]"
                  >
                    <TableCell className="truncate font-mono text-xs text-[var(--ledger-navy)]/70">{row.id}</TableCell>
                    <TableCell className="truncate text-sm text-[var(--ledger-navy)]" title={row.query}>
                      {row.query}
                    </TableCell>
                    <TableCell className="truncate text-sm text-[var(--ledger-navy)]/80" title={row.reason}>
                      {row.reason}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ledger-navy)]/60">{row.age}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </motion.div>
      </div>
    </div>
  );
}
