import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import type { Verdict } from "@/lib/eligibility";
import type { CustomerProfile } from "@/lib/kwalifier-data";
import { cn } from "@/lib/utils";

/** Status words used everywhere on the wayfinding page. */
const STATUS_LABEL: Record<Verdict["status"], string> = {
  eligible: "Eligible",
  near_miss: "1 stop away",
  ineligible: "Not eligible",
};

/** Id of an offer's stop on the snapshot map, so chat answers can point back to it. */
export const stopAnchor = (offerId: string) => `wf-stop-${offerId}`;

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

/** An offer's name set on a plate in its route colour, the way a stop is named on a sign. */
export function StationPlate({
  name,
  status,
  small = false,
  as: Tag = "h3",
}: {
  name: string;
  status: Verdict["status"];
  small?: boolean;
  as?: "h3" | "p";
}) {
  return (
    <Tag
      className={cn(
        "wf-plate",
        status === "near_miss" && "wf-plate--near",
        status === "ineligible" && "wf-plate--off",
        small && "wf-plate--small",
      )}
    >
      {name}
    </Tag>
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

function Branch({ verdict, index }: { verdict: Verdict; index: number }) {
  const near = verdict.status === "near_miss";
  return (
    <li
      id={stopAnchor(verdict.offer_id)}
      className="wf-node scroll-mt-6"
      style={{ "--i": index } as React.CSSProperties}
    >
      <span aria-hidden className={cn("wf-node__branch", near && "wf-node__branch--approach")} />
      <span aria-hidden className={cn("wf-dot", near && "wf-dot--near")} />
      <div className="grid gap-x-8 gap-y-2 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-2">
          <StationPlate name={verdict.name} status={verdict.status} />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <StatusText status={verdict.status} />
            <span className="wf-id text-xs text-[var(--wf-ink-soft)]">{verdict.offer_id}</span>
          </div>
        </div>
        <div className="md:pt-2.5">
          <StopDetails verdict={verdict} />
        </div>
      </div>
    </li>
  );
}

/**
 * The customer's offers drawn as a small network: a "You are here" hub, then
 * one branch per offer. Offers already reached (eligible) come first, then the
 * offers one move away (near miss). Every status comes from the rules engine.
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
    <div className="flex flex-col gap-8">
      <ul
        className={cn("wf-net", onLine.length === 0 && "wf-net--solo")}
        aria-label={`Offers on ${profile.name}'s line`}
      >
        <li className="wf-node wf-node--hub" style={{ "--i": 0 } as React.CSSProperties}>
          <span aria-hidden className="wf-dot wf-dot--here" />
          <div className="flex min-h-[2.7rem] flex-wrap items-baseline gap-x-3 pt-2">
            <p className="text-lg font-extrabold leading-tight">You are here</p>
            <p className="text-sm text-[var(--wf-ink-soft)]">{profile.name}</p>
          </div>
        </li>
        {onLine.map((v, i) => (
          <Branch key={v.offer_id} verdict={v} index={i + 1} />
        ))}
      </ul>

      {showIneligible && offLine.length > 0 ? (
        <div className="space-y-4 border-t border-[var(--wf-rule)] pt-6">
          <h3 className="text-base font-bold">Not on your line</h3>
          <ul className="wf-net wf-net--off grid gap-5 sm:grid-cols-2">
            {offLine.map((v, i) => (
              <li
                key={v.offer_id}
                id={stopAnchor(v.offer_id)}
                className="wf-node !pb-0"
                style={{ "--i": i } as React.CSSProperties}
              >
                <span aria-hidden className="wf-dot wf-dot--off" />
                <div className="space-y-2">
                  <StationPlate name={v.name} status={v.status} small as="p" />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <StatusText status={v.status} />
                    <span className="wf-id text-xs text-[var(--wf-ink-soft)]">{v.offer_id}</span>
                  </div>
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
