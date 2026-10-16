import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, animate, motion } from "motion/react";

import type { Verdict } from "@/lib/eligibility";
import { cn } from "@/lib/utils";

/** Counts up from 0 to `target` like an adding machine, once per target value. */
function useCountUp(target: number, duration = 1) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [target, duration]);
  return display;
}

export function RadialGauge({
  have,
  need,
  max,
  label,
}: {
  have: number;
  need: number;
  max: number;
  label: string;
}) {
  const percentage = Math.min(100, Math.max(0, (have / max) * 100));
  const needPercentage = Math.min(100, Math.max(0, (need / max) * 100));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const displayHave = useCountUp(have);
  const displayNeed = useCountUp(need);

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-11 shrink-0">
        <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={radius} fill="none" className="stroke-muted" strokeWidth="3" />
          <motion.circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-nearmiss text-nearmiss"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          {/* Threshold marker: the real "need" value, drawn as a tick crossing the ring */}
          <line
            x1="18"
            y1="1"
            x2="18"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-card-foreground/70"
            transform={`rotate(${needPercentage * 3.6} 18 18)`}
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="font-mono text-sm tabular-nums text-card-foreground">
          {displayHave}
          <span className="text-muted-foreground"> / {displayNeed} required</span>
        </span>
      </div>
    </div>
  );
}

/** A sage ink-stamp graphic - the bank's mark of approval, not a status icon. */
function ApprovalSeal() {
  return (
    <div className="pointer-events-none absolute right-3 top-3" aria-hidden="true">
      {/* Ink-press ripple: one-time pulse as the stamp lands */}
      <motion.span
        initial={{ scale: 0.4, opacity: 0.45 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: "easeOut" }}
        className="absolute inset-0 rounded-full bg-eligible"
        style={{ filter: "blur(6px)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 1.8, rotate: 6 }}
        animate={{ opacity: 0.92, scale: 1, rotate: -7 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative text-eligible mix-blend-multiply"
      >
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle
            cx="26"
            cy="26"
            r="23"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2.2 2.6"
          />
          <circle cx="26" cy="26" r="18" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M18 26.5l5.5 5.5L34.5 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <span className="sr-only">Approved</span>
    </div>
  );
}

export function VerdictCard({ verdict, index }: { verdict: Verdict; index: number }) {
  const [open, setOpen] = useState(false);

  const isEligible = verdict.status === "eligible";
  const isNearMiss = verdict.status === "near_miss";

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.2, y: -6 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: "top" }}
      className="on-parchment relative flex flex-col overflow-hidden border border-border bg-card p-4"
    >
      {isEligible && <ApprovalSeal />}

      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex-1 space-y-1", isEligible && "pr-14")}>
          <h3 className="font-serif text-lg font-medium text-card-foreground">{verdict.name}</h3>
          <p className="font-mono text-[11px] text-muted-foreground">{verdict.offer_id}</p>

          {isNearMiss && verdict.gauge_data && (
            <div className="mt-3 mb-2">
              <RadialGauge {...verdict.gauge_data} />
            </div>
          )}

          {verdict.gap_statement ? (
            <p className="mt-2 text-xs leading-relaxed text-card-foreground/80">
              {verdict.gap_statement}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-card-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Why am I seeing this?
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="drawer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5 border-l-2 border-muted pl-3 text-xs leading-relaxed text-muted-foreground">
                  <p>
                    <span className="font-semibold text-card-foreground">Benefits: </span>
                    {verdict.retrieved_chunk.benefits}
                  </p>
                  <p>
                    <span className="font-semibold text-card-foreground">Exclusions: </span>
                    {verdict.retrieved_chunk.exclusions}
                  </p>
                  <p className="pt-1 italic">Source: {verdict.source_citation}</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
