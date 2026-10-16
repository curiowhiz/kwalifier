/**
 * GENERATIVE UI LIBRARY (OpenUI).
 *
 * The components the model may place in a chat answer. Each one takes only an
 * offer_id: status, gap, gauge and benefits are read from the rules engine for
 * the active profile, so the model chooses which offers to show but can never
 * write an eligibility outcome onto the screen.
 */
import { createContext, useContext, useMemo, useState } from "react";
import { createLibrary, defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { z } from "zod/v4";

import { Slider } from "@/components/ui/slider";
import { VerdictCard } from "@/components/verdict-card";
import { computeVerdicts, type Verdict } from "@/lib/eligibility";
import type { CustomerProfile } from "@/lib/kwalifier-data";
import { leverFor, simulate } from "@/lib/whatif";
import { cn } from "@/lib/utils";

const ProfileContext = createContext<CustomerProfile | null>(null);
export const GenUIProfileProvider = ProfileContext.Provider;

/** The rules-engine verdict for one offer, for the profile the chat is about. */
function useVerdict(offerId: string): {
  profile: CustomerProfile | null;
  verdict: Verdict | undefined;
} {
  const profile = useContext(ProfileContext);
  const verdict = useMemo(
    () => (profile ? computeVerdicts(profile).find((v) => v.offer_id === offerId) : undefined),
    [profile, offerId],
  );
  return { profile, verdict };
}

function UnknownOffer({ offerId }: { offerId: string }) {
  return (
    <div className="on-parchment border border-dashed border-border bg-card p-3 text-xs text-muted-foreground">
      I don't have an eligibility determination for {offerId} yet.
    </div>
  );
}

const STATUS_COPY: Record<Verdict["status"], { label: string; className: string }> = {
  eligible: { label: "Eligible", className: "bg-eligible text-eligible-foreground" },
  near_miss: { label: "Almost there", className: "bg-nearmiss text-nearmiss-foreground" },
  ineligible: { label: "Not eligible", className: "bg-muted text-muted-foreground" },
};

function StatusBadge({ status }: { status: Verdict["status"] }) {
  const copy = STATUS_COPY[status];
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, y: -6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className={cn("inline-block px-2 py-0.5 text-[11px] font-medium", copy.className)}
      >
        {copy.label}
      </motion.span>
    </AnimatePresence>
  );
}

const OfferCard = defineComponent({
  name: "OfferCard",
  description:
    "One offer's eligibility card. Status, gap, benefits and exclusions come from the bank's rules engine for this offer_id; you only choose which offer to show.",
  props: z.object({
    offer_id: z.string().describe("An offer_id from the verdict data, e.g. TRV001"),
  }),
  component: ({ props }) => <OfferCardView offerId={props.offer_id} />,
});

function OfferCardView({ offerId }: { offerId: string }) {
  const { verdict } = useVerdict(offerId);
  const streaming = useIsStreaming();
  // Mid-stream the offer_id may be half written, so wait for it before saying it's unknown.
  if (!verdict) return streaming ? null : <UnknownOffer offerId={offerId} />;
  return <VerdictCard verdict={verdict} index={0} />;
}

function WhatIfPanel({ profile, verdict }: { profile: CustomerProfile; verdict: Verdict }) {
  const lever = useMemo(
    () => leverFor(profile, verdict.failed_checks[0] ?? ""),
    [profile, verdict],
  );
  const [value, setValue] = useState(lever?.current ?? 0);

  const simulation = useMemo(
    () => (lever ? simulate(profile, lever, value) : null),
    [profile, lever, value],
  );
  if (!lever || !simulation) return null;

  const target = simulation.verdicts.find((v) => v.offer_id === verdict.offer_id);
  const others = simulation.changed.filter((c) => c.verdict.offer_id !== verdict.offer_id);
  const moved = value !== lever.current;

  return (
    <div className="on-parchment border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <div className="mr-auto">
          <h3 className="font-serif text-base font-medium text-card-foreground">What if…</h3>
          <p className="text-xs text-muted-foreground">
            Move your {lever.label.toLowerCase()} and see {verdict.name} re-checked instantly.
          </p>
        </div>
        {moved ? (
          <button
            type="button"
            onClick={() => setValue(lever.current)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{lever.label}</span>
        <span className="font-mono tabular-nums text-card-foreground">
          {lever.format(value)}
          {moved ? (
            <span className="text-muted-foreground"> (today: {lever.format(lever.current)})</span>
          ) : null}
        </span>
      </div>
      <Slider
        className="mt-2"
        min={lever.min}
        max={lever.max}
        step={lever.step}
        value={[value]}
        onValueChange={([next]) => setValue(next ?? lever.current)}
        aria-label={lever.label}
      />

      <div className="mt-4 flex items-center gap-2 text-xs text-card-foreground">
        <span className="mr-auto">{verdict.name}</span>
        {target ? <StatusBadge status={target.status} /> : null}
      </div>
      {others.map(({ verdict: other }) => (
        <div
          key={other.offer_id}
          className="mt-1.5 flex items-center gap-2 text-xs text-card-foreground/80"
        >
          <span className="mr-auto">Also: {other.name}</span>
          <StatusBadge status={other.status} />
        </div>
      ))}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        A simulation only: your account hasn't changed. Results come from the bank's rules engine.
      </p>
    </div>
  );
}

const WhatIf = defineComponent({
  name: "WhatIf",
  description:
    "Interactive simulator for a near_miss offer: the customer moves the one factor holding it back and the rules engine re-checks eligibility instantly, without another message. Place it right after that offer's OfferCard. Only for offers whose verdict status is near_miss.",
  props: z.object({
    offer_id: z.string().describe("The offer_id of a near_miss offer"),
  }),
  component: ({ props }) => <WhatIfView offerId={props.offer_id} />,
});

function WhatIfView({ offerId }: { offerId: string }) {
  const { profile, verdict } = useVerdict(offerId);
  if (!profile || !verdict) return null;
  if (verdict.status === "eligible") {
    return (
      <div className="on-parchment border border-border bg-card p-3 text-xs text-muted-foreground">
        You already qualify for {verdict.name}, so there's nothing to simulate.
      </div>
    );
  }
  if (verdict.status !== "near_miss") return null;
  // Keyed by profile so switching customers starts the slider from their real value.
  return <WhatIfPanel key={profile.id} profile={profile} verdict={verdict} />;
}

const Answer = defineComponent({
  name: "Answer",
  description: "The cards that accompany your written answer, in the order they should appear.",
  props: z.object({
    cards: z.array(z.union([OfferCard.ref, WhatIf.ref])),
  }),
  component: ({ props, renderNode }) => (
    <div className="mt-3 grid gap-2">{renderNode(props.cards)}</div>
  ),
});

export const kwalifierLibrary = createLibrary({
  root: "Answer",
  components: [Answer, OfferCard, WhatIf],
});
