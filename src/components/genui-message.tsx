import { useMemo } from "react";
import { Renderer } from "@openuidev/react-lang";

import { MessageResponse } from "@/components/ai-elements/message";
import { GenUIProfileProvider, kwalifierLibrary } from "@/lib/genui-library";
import type { CustomerProfile } from "@/lib/kwalifier-data";

type Segment =
  { kind: "markdown"; text: string } | { kind: "openui"; code: string; closed: boolean };

const FENCE_OPEN = /```openui(?:-lang)?[^\S\n]*\n/;

/** Splits an answer into markdown prose and ```openui-lang blocks; the last block may still be streaming. */
export function splitOpenUI(text: string, streaming = false): Segment[] {
  const segments: Segment[] = [];
  let rest = text;
  for (;;) {
    const open = FENCE_OPEN.exec(rest);
    if (!open) break;
    if (open.index > 0) segments.push({ kind: "markdown", text: rest.slice(0, open.index) });
    const body = rest.slice(open.index + open[0].length);
    const close = body.indexOf("```");
    if (close === -1) {
      segments.push({ kind: "openui", code: body, closed: false });
      return segments;
    }
    segments.push({ kind: "openui", code: body.slice(0, close), closed: true });
    rest = body.slice(close + 3);
  }
  // While streaming, hold back a fence that has only partly arrived, so "```open" never flashes as text.
  const partial = rest.lastIndexOf("```");
  const held =
    streaming && partial !== -1 && "```openui-lang".startsWith(rest.slice(partial).trimEnd());
  const visible = held ? rest.slice(0, partial) : rest;
  if (visible.trim()) segments.push({ kind: "markdown", text: visible });
  return segments;
}

export function AssistantMessage({
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
    <GenUIProfileProvider value={profile}>
      {segments.map((segment, i) =>
        segment.kind === "markdown" ? (
          <MessageResponse key={i}>{segment.text}</MessageResponse>
        ) : (
          <Renderer
            key={i}
            library={kwalifierLibrary}
            response={segment.code}
            isStreaming={streaming && !segment.closed}
          />
        ),
      )}
    </GenUIProfileProvider>
  );
}
