/**
 * Wayfinding renderers for the chat's answer cards.
 *
 * Same component names and props as src/lib/genui-library.tsx, which the
 * server builds the prompt from, so one model answer renders on either page.
 * Each card takes only an offer_id and reads its verdict from the rules engine.
 */
import { createContext, useContext, useMemo, useState } from "react";
import { createLibrary, defineComponent, Renderer, useIsStreaming } from "@openuidev/react-lang";
import { RotateCcw } from "lucide-react";
import { z } from "zod/v4";

import { MessageResponse } from "@/components/ai-elements/message";
import { splitOpenUI } from "@/components/genui-message";
import { StationPlate, StatusText, StopDetails, stopAnchor } from "@/components/v2/route-line";
import { computeVerdicts, type Verdict } from "@/lib/eligibility";
import type { CustomerProfile } from "@/lib/kwalifier-data";
import { cn } from "@/lib/utils";
import { leverFor, simulate } from "@/lib/whatif";

const ProfileContext = createContext<CustomerProfile | null>(null);

function useVerdict(offerId: string) {
  const profile = useContext(ProfileContext);
  const verdict = useMemo(
    () => (profile ? computeVerdicts(profile).find((v) => v.offer_id === offerId) : undefined),
    [profile, offerId],
  );
  return { profile, verdict };
}

const panel = "rounded-xl border border-[var(--wf-rule)] bg-[var(--wf-surface)] p-4";

function OfferSign({ offerId }: { offerId: string }) {
  const { verdict } = useVerdict(offerId);
  const streaming = useIsStreaming();
  if (!verdict) {
    // Mid-stream the offer_id may be half written, so wait for it before saying it's unknown.
    return streaming ? null : (
      <div className={cn(panel, "text-sm text-[var(--wf-ink-soft)]")}>
        I don't have an eligibility determination for {offerId} yet.
      </div>
    );
  }
  if (verdict.status === "eligible") {
    // Already on the snapshot map above: name it and point back instead of repeating it.
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StationPlate name={verdict.name} status="eligible" small as="p" />
        <StatusText status="eligible" />
        <a
          href={`#${stopAnchor(verdict.offer_id)}`}
          className="text-sm font-bold text-[var(--wf-line)] underline decoration-2 underline-offset-4 hover:text-[var(--wf-line-deep)]"
        >
          See it on your line
        </a>
      </div>
    );
  }
  return (
    <div className={cn(panel, "space-y-2")}>
      <StationPlate name={verdict.name} status={verdict.status} small as="p" />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <StatusText status={verdict.status} />
        <span className="wf-tnum text-xs text-[var(--wf-ink-soft)]">{verdict.offer_id}</span>
      </div>
      <StopDetails verdict={verdict} />
    </div>
  );
}

function JourneyPlanner({ profile, verdict }: { profile: CustomerProfile; verdict: Verdict }) {
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
  const status = target?.status ?? verdict.status;
  const others = simulation.changed.filter((c) => c.verdict.offer_id !== verdict.offer_id);
  const moved = value !== lever.current;
  const inputId = `wf-whatif-${verdict.offer_id}`;

  return (
    <div className={cn(panel, "space-y-4")}>
      <div className="flex items-start gap-3">
        <div className="mr-auto space-y-0.5">
          <h3 className="text-base font-bold">What if…</h3>
          <p className="text-sm text-[var(--wf-ink-soft)]">
            Move your {lever.label.toLowerCase()} and see {verdict.name} re-checked instantly.
          </p>
        </div>
        {moved ? (
          <button
            type="button"
            onClick={() => setValue(lever.current)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-sm font-bold text-[var(--wf-line)] hover:bg-[var(--wf-ground)]"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </button>
        ) : null}
      </div>

      {/* The journey: from where you are to this offer's stop, re-drawn as the value moves. */}
      <div className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-x-2" aria-hidden>
        <span className="wf-dot wf-dot--here" />
        <span
          className={cn(
            "h-0 border-t-[6px] transition-colors",
            status === "eligible" && "border-solid border-[var(--wf-line)]",
            status === "near_miss" && "border-dashed border-[var(--wf-amber)]",
            status === "ineligible" && "border-dashed border-[var(--wf-off)]",
          )}
        />
        <span
          className={cn(
            "wf-dot",
            status === "near_miss" && "wf-dot--near",
            status === "ineligible" && "wf-dot--off",
          )}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
        <StationPlate name={verdict.name} status={status} small as="p" />
        <StatusText status={status} />
      </div>
      {others.map(({ verdict: other }) => (
        <div key={other.offer_id} className="flex items-center gap-2 text-sm">
          <span className="mr-auto">Also: {other.name}</span>
          <StatusText status={other.status} />
        </div>
      ))}

      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <label htmlFor={inputId} className="text-[var(--wf-ink-soft)]">
            {lever.label}
          </label>
          <span className="wf-tnum font-bold">
            {lever.format(value)}
            {moved ? (
              <span className="font-normal text-[var(--wf-ink-soft)]">
                {" "}
                (today: {lever.format(lever.current)})
              </span>
            ) : null}
          </span>
        </div>
        <input
          id={inputId}
          type="range"
          className="wf-range"
          min={lever.min}
          max={lever.max}
          step={lever.step}
          value={value}
          aria-valuetext={lever.format(value)}
          onChange={(e) => setValue(Number(e.currentTarget.value))}
        />
      </div>

      <p className="text-xs leading-relaxed text-[var(--wf-ink-soft)]">
        A simulation only: your account hasn't changed. Results come from the bank's rules engine.
      </p>
    </div>
  );
}

function WhatIfView({ offerId }: { offerId: string }) {
  const { profile, verdict } = useVerdict(offerId);
  if (!profile || !verdict) return null;
  if (verdict.status === "eligible") {
    return (
      <div className={cn(panel, "text-sm text-[var(--wf-ink-soft)]")}>
        You already qualify for {verdict.name}, so there's nothing to simulate.
      </div>
    );
  }
  if (verdict.status !== "near_miss") return null;
  // Keyed by profile so switching customers starts the slider from their real value.
  return <JourneyPlanner key={profile.id} profile={profile} verdict={verdict} />;
}

const OfferCard = defineComponent({
  name: "OfferCard",
  description:
    "One offer's eligibility card. Status, gap, benefits and exclusions come from the bank's rules engine for this offer_id; you only choose which offer to show.",
  props: z.object({
    offer_id: z.string().describe("An offer_id from the verdict data, e.g. TRV001"),
  }),
  component: ({ props }) => <OfferSign offerId={props.offer_id} />,
});

const WhatIf = defineComponent({
  name: "WhatIf",
  description:
    "Interactive simulator for a near_miss offer: the customer moves the one factor holding it back and the rules engine re-checks eligibility instantly, without another message. Place it right after that offer's OfferCard. Only for offers whose verdict status is near_miss.",
  props: z.object({
    offer_id: z.string().describe("The offer_id of a near_miss offer"),
  }),
  component: ({ props }) => <WhatIfView offerId={props.offer_id} />,
});

const Answer = defineComponent({
  name: "Answer",
  description: "The cards that accompany your written answer, in the order they should appear.",
  props: z.object({
    cards: z.array(z.union([OfferCard.ref, WhatIf.ref])),
  }),
  component: ({ props, renderNode }) => (
    <div className="mt-4 grid gap-3">{renderNode(props.cards)}</div>
  ),
});

const wayfindingLibrary = createLibrary({
  root: "Answer",
  components: [Answer, OfferCard, WhatIf],
});

export function WayfindingAnswer({
  text,
  streaming,
  profile,
}: {
  text: string;
  streaming: boolean;
  profile: CustomerProfile;
}) {
  const segments = useMemo(() => splitOpenUI(text, streaming), [text, streaming]);
  return (
    <ProfileContext.Provider value={profile}>
      {segments.map((segment, i) =>
        segment.kind === "markdown" ? (
          <MessageResponse key={i} className="leading-relaxed">
            {segment.text}
          </MessageResponse>
        ) : (
          <Renderer
            key={i}
            library={wayfindingLibrary}
            response={segment.code}
            isStreaming={streaming && !segment.closed}
          />
        ),
      )}
    </ProfileContext.Provider>
  );
}
