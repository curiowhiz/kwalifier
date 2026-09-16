import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminCard, AdminHeader, ALL_TRACES, outcomeStyles } from "./-shared";

export const Route = createFileRoute("/admin/traces")({
  component: TracesPage,
});

function TracesPage() {
  return (
    <div>
      <AdminHeader title="Traces" subtitle="Every recent conversation Kwalifier has handled, flagged or not" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6">
        <AdminCard>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "var(--ledger-navy)" }}>
                <TableHead className="w-[13%] text-[var(--ledger-navy)]/60">Trace ID</TableHead>
                <TableHead className="w-[13%] text-[var(--ledger-navy)]/60">Profile</TableHead>
                <TableHead className="w-[38%] text-[var(--ledger-navy)]/60">Query</TableHead>
                <TableHead className="w-[14%] text-[var(--ledger-navy)]/60">Outcome</TableHead>
                <TableHead className="w-[11%] text-[var(--ledger-navy)]/60">Latency</TableHead>
                <TableHead className="w-[11%] text-[var(--ledger-navy)]/60">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALL_TRACES.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.06 + i * 0.035 }}
                  style={{
                    background: i % 2 === 1 ? "var(--admin-parchment)" : "white",
                    borderColor: "var(--border)",
                  }}
                  className="border-b transition-colors hover:bg-[var(--admin-parchment)]"
                >
                  <TableCell className="truncate font-mono text-xs text-[var(--ledger-navy)]/70">{row.id}</TableCell>
                  <TableCell className="truncate text-sm text-[var(--ledger-navy)]">{row.profile}</TableCell>
                  <TableCell className="truncate text-sm text-[var(--ledger-navy)]" title={row.query}>
                    {row.query}
                  </TableCell>
                  <TableCell className={`text-sm font-medium ${outcomeStyles[row.outcome]}`}>{row.outcome}</TableCell>
                  <TableCell className="font-mono text-xs text-[var(--ledger-navy)]/70">{row.latency}</TableCell>
                  <TableCell className="text-sm text-[var(--ledger-navy)]/60">{row.age}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </AdminCard>
      </motion.div>
    </div>
  );
}
