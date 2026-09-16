import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { AdminCard, AdminHeader, SETTINGS_ITEMS } from "./-shared";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <AdminHeader title="Settings" subtitle="Current launch gates and thresholds. Read-only in this pass." />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6">
        <AdminCard className="max-w-2xl">
          {SETTINGS_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
              style={{ borderColor: "var(--border)" }}
              className="flex items-start justify-between gap-6 border-b py-3.5 last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium text-[var(--ledger-navy)]">{item.label}</div>
                <div className="mt-0.5 text-xs text-[var(--ledger-navy)]/55">{item.note}</div>
              </div>
              <div
                style={{ fontFamily: "var(--font-mono)" }}
                className="flex-shrink-0 whitespace-nowrap text-sm font-medium text-[var(--vault-brass-text)]"
              >
                {item.value}
              </div>
            </motion.div>
          ))}
        </AdminCard>
        <p className="mt-4 text-xs text-[var(--ledger-navy)]/50">
          Editing isn't available in this pass. These values are read directly from the codebase (eligibility thresholds
          in <code className="font-mono">src/lib/eligibility.ts</code>, rate limits in{" "}
          <code className="font-mono">src/routes/api/chat.ts</code>).
        </p>
      </motion.div>
    </div>
  );
}
