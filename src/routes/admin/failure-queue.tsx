import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminCard, AdminHeader, FLAGGED_TRACES } from "./-shared";

export const Route = createFileRoute("/admin/failure-queue")({
  component: FailureQueuePage,
});

function FailureQueuePage() {
  return (
    <div>
      <AdminHeader
        title="Failure Queue"
        subtitle={`${FLAGGED_TRACES.length} conversations flagged by the rules engine, waiting on a human review`}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6">
        <AdminCard>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "var(--ledger-navy)" }}>
                <TableHead className="w-[14%] text-[var(--ledger-navy)]/60">Trace ID</TableHead>
                <TableHead className="w-[16%] text-[var(--ledger-navy)]/60">Profile</TableHead>
                <TableHead className="w-[34%] text-[var(--ledger-navy)]/60">Query</TableHead>
                <TableHead className="w-[20%] text-[var(--ledger-navy)]/60">Flag reason</TableHead>
                <TableHead className="w-[8%] text-[var(--ledger-navy)]/60">Age</TableHead>
                <TableHead className="w-[8%] text-right text-[var(--ledger-navy)]/60">&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FLAGGED_TRACES.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
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
                  <TableCell className="truncate text-sm text-[var(--ledger-navy)]/80" title={row.reason}>
                    {row.reason}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--ledger-navy)]/60">{row.age}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => toast(`Trace ${row.id}`, { description: "Review flow isn't built in this pass." })}
                      style={{ background: "var(--vault-brass)", color: "var(--ledger-navy)" }}
                      className="px-2.5 py-1 text-xs font-medium transition-transform hover:scale-105"
                    >
                      Review
                    </button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </AdminCard>
      </motion.div>
    </div>
  );
}
