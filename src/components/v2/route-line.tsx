import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import type { Verdict } from "@/lib/eligibility";
import type { CustomerProfile } from "@/lib/kwalifier-data";
import { cn } from "@/lib/utils";

/** Status words used everywhere on the wayfinding page. */
export const STATUS_LABEL: Record<Verdict["status"], string> = {
  eligible: "Eligible",
  near_miss: "1 stop away",
  ineligible: "Not eligible",
};

export function StatusText({ status }: { status: Verdict["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-bold",
        status === "eligible" && "text-[var(--wf-line)]",
        status === "near_miss" && "text-[var(--wf-amber-ink)]",
        status === "ineligible" && "text-[var(--wf-ink-soft)]",
      )}
    >
      {status === "eligible" ? <Check className="size-4" strokeWidth={3} aria-hidden /> : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

/** What the rules engine found for one offer: gap, gauge reading, and the source documents. */
export function StopDetails({ verdict }: { verdict: Verdict }) {
  const [open, setOpen] = useState(false);
  const gauge = verdict.status === "near_miss" ? verdict.gauge_data : undefined;

  return (
    <div className="space-y-2">
      {gauge ? (
        <p className="wf-tnum text-sm text-[var(--wf-ink)]">
          <span className="text-[var(--wf-ink-soft)]">{gauge.label}</span>{" "}
          <span className="font-bold">{gauge.have}</span>
          <span className="text-[var(--wf-ink-soft)]"> / {gauge.need} required</span>
        </p>
      ) : null}
      {verdict.gap_statement ? (
        <p className="max-w-[60ch] text-sm leading-relaxed text-[var(--wf-ink)]">
          {verdict.gap_statement}
        </p>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--wf-line)] underline decoration-2 underline-offset-4 hover:text-[var(--wf-line-deep)]"
      >
        Why am I seeing this?
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <dl className="max-w-[60ch] space-y-2 rounded-lg bg-[var(--wf-ground)] p-3 text-sm leading-relaxed">
          <div>
            <dt className="font-bold">Benefits</dt>
            <dd className="text-[var(--wf-ink-soft)]">{verdict.retrieved_chunk.benefits}</dd>
          </div>
          <div>
            <dt className="font-bold">Exclusions</dt>
            <dd className="text-[var(--wf-ink-soft)]">{verdict.retrieved_chunk.exclusions}</dd>
          </div>
          <div>
            <dt className="font-bold">Source</dt>
            <dd className="text-[var(--wf-ink-soft)]">{verdict.source_citation}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

function Stop({
  verdict,
  index,
  next,
}: {
  verdict: Verdict;
  index: number;
  next: Verdict | undefined;
}) {
  const near = verdict.status === "near_miss";
  return (
    <li className="wf-stop" style={{ "--i": index } as React.CSSProperties}>
      {next ? (
        <span
          aria-hidden
          className={cn("wf-stop__seg", next.status === "near_miss" && "wf-stop__seg--approach")}
        />
      ) : null}
      <span aria-hidden className={cn("wf-stop__dot", near && "wf-stop__dot--near")} />
      <div className="wf-stop__body space-y-1.5">
        <h3 className="text-lg font-bold leading-snug">{verdict.name}</h3>
        <p className="wf-tnum text-xs text-[var(--wf-ink-soft)]">{verdict.offer_id}</p>
        <StatusText status={verdict.status} />
        <StopDetails verdict={verdict} />
      </div>
    </li>
  );
}

/**
 * The customer's offers drawn as one route: where they are now, the offers
 * already reached (eligible), then the offers one move away (near miss).
 * Every status comes from the rules engine's verdicts.
 */
export function RouteLine({
  profile,
  verdicts,
  showIneligible,
}: {
  profile: CustomerProfile;
  verdicts: Verdict[];
  showIneligible: boolean;
}) {
  const onLine = [
    ...verdicts.filter((v) => v.status === "eligible"),
    ...verdicts.filter((v) => v.status === "near_miss"),
  ];
  const offLine = verdicts.filter((v) => v.status === "ineligible");

  return (
    <div className="space-y-8">
      <ol className="wf-route" aria-label={`Offers on ${profile.name}'s line`}>
        <li className="wf-stop" style={{ "--i": 0 } as React.CSSProperties}>
          {onLine[0] ? (
            <span
              aria-hidden
              className={cn(
                "wf-stop__seg",
                onLine[0].status === "near_miss" && "wf-stop__seg--approach",
              )}
            />
          ) : null}
          <span aria-hidden className="wf-stop__dot wf-stop__dot--here" />
          <div className="wf-stop__body space-y-1">
            <h3 className="text-lg font-bold leading-snug">You are here</h3>
            <p className="text-sm text-[var(--wf-ink-soft)]">{profile.name}</p>
          </div>
        </li>
        {onLine.map((v, i) => (
          <Stop key={v.offer_id} verdict={v} index={i + 1} next={onLine[i + 1]} />
        ))}
      </ol>

      {showIneligible && offLine.length > 0 ? (
        <div className="space-y-4 border-t border-[var(--wf-rule)] pt-6">
          <h3 className="text-base font-bold">Not on your line</h3>
          <ul className="grid gap-5 sm:grid-cols-2">
            {offLine.map((v) => (
              <li key={v.offer_id} className="grid grid-cols-[2rem_1fr] gap-x-3">
                <span aria-hidden className="wf-stop__dot wf-stop__dot--off !m-0 !mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-bold leading-snug">{v.name}</p>
                  <p className="wf-tnum text-xs text-[var(--wf-ink-soft)]">{v.offer_id}</p>
                  <StatusText status={v.status} />
                  <StopDetails verdict={v} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
