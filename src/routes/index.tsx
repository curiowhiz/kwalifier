import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkle,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import mark from "@/assets/kwalifier-mark.png";
import { Toaster } from "@/components/ui/sonner";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeVerdicts, type Verdict } from "@/lib/eligibility";
import { PROFILES, getProfile } from "@/lib/kwalifier-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kwalifier — Which card offers do I qualify for?" },
      {
        name: "description",
        content:
          "Chat with Kwalifier to see the card offers you're eligible for, plus the ones you're close to unlocking.",
      },
      { property: "og:title", content: "Kwalifier — Which card offers do I qualify for?" },
      {
        property: "og:description",
        content:
          "Eligibility is calculated by the bank's rules engine; Kwalifier explains it in plain language.",
      },
    ],
  }),
  component: KwalifierPage,
});

const STARTERS = [
  "What card suits my spending on gifts and travel?",
  "Which offers can I use at the airport?",
  "Am I close to qualifying for anything better?",
];

function VerdictCard({ verdict }: { verdict: Verdict }) {
  const [open, setOpen] = useState(false);
  const eligible = verdict.status === "eligible";
  const near = verdict.status === "near_miss";

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-left",
        eligible && "border-eligible/30 bg-eligible-surface",
        near && "border-nearmiss/35 bg-nearmiss-surface",
        !eligible && !near && "border-border bg-muted"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded-full p-1",
            eligible && "bg-eligible text-eligible-foreground",
            near && "bg-nearmiss text-nearmiss-foreground",
            !eligible && !near && "bg-muted-foreground/20 text-muted-foreground"
          )}
        >
          {eligible ? (
            <BadgeCheck className="size-3.5" />
          ) : near ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <ShieldAlert className="size-3.5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{verdict.name}</p>
          <p className="text-xs text-muted-foreground">
            {eligible ? "Eligible" : near ? "Almost there" : "Not eligible right now"} ·{" "}
            {verdict.offer_id}
          </p>
          {verdict.gap_statement ? (
            <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">
              {verdict.gap_statement}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Why am I seeing this?
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
          </button>
          {open ? (
            <div className="mt-2 space-y-1.5 rounded-lg bg-card/70 p-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Benefits: </span>
                {verdict.retrieved_chunk.benefits}
              </p>
              <p>
                <span className="font-semibold text-foreground">Exclusions: </span>
                {verdict.retrieved_chunk.exclusions}
              </p>
              <p className="pt-1 italic">Source: {verdict.source_citation}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KwalifierPage() {
  const [profileId, setProfileId] = useState(PROFILES[0].id);
  const [lastQuery, setLastQuery] = useState("");
  const [showIneligible, setShowIneligible] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const profile = getProfile(profileId);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) =>
      toast.error("Kwalifier couldn't answer just now", { description: error.message }),
  });

  const busy = status === "submitted" || status === "streaming";

  const verdicts = useMemo(() => computeVerdicts(profile, lastQuery), [profile, lastQuery]);
  const shown = verdicts.filter((v) => (showIneligible ? true : v.status !== "ineligible"));

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status, profileId]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setLastQuery(trimmed);
    setInput("");
    void sendMessage({ text: trimmed }, { body: { profileId } });
  };

  const switchProfile = (id: string) => {
    setProfileId(id);
    setMessages([]);
    setLastQuery("");
    setFeedback({});
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-6 pt-5 sm:px-6">
      <Toaster />

      <header className="flex flex-wrap items-center gap-3">
        <img src={mark} alt="Kwalifier" width={40} height={40} className="size-10" />
        <div className="mr-auto">
          <h1 className="text-xl leading-tight">Kwalifier</h1>
          <p className="text-xs text-muted-foreground">
            Your card offers, explained clearly
          </p>
        </div>
        <Select value={profileId} onValueChange={switchProfile}>
          <SelectTrigger className="w-[168px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROFILES.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <p className="mt-2 text-xs text-muted-foreground">Signed in as {profile.blurb}</p>

      <section className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-panel">
        <div className="flex items-center gap-2">
          <h2 className="mr-auto text-sm font-semibold">Your eligibility snapshot</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowIneligible((v) => !v)}
          >
            {showIneligible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {showIneligible ? "Hide" : "Show"} not-eligible
          </Button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {shown.map((v) => (
            <VerdictCard key={v.offer_id} verdict={v} />
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Eligibility is calculated by the bank's rules engine, not by the assistant.
        </p>
      </section>

      <Conversation className="mt-4 min-h-[280px] flex-1">
        <ConversationContent className="px-0">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Sparkle className="size-5 text-primary" />}
              title={`Hi ${profile.name}, what would you like to know?`}
              description="Ask about a card, a benefit, or where your spending could earn you more."
            />
          ) : null}

          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null
                )}
                {message.role === "assistant" ? (
                  <MessageActions className="mt-1">
                    <MessageAction
                      tooltip="Helpful"
                      onClick={() => {
                        setFeedback((f) => ({ ...f, [message.id]: "up" }));
                        toast.success("Thanks — glad that helped.");
                      }}
                    >
                      <ThumbsUp
                        className={cn(
                          "size-3.5",
                          feedback[message.id] === "up" && "text-eligible"
                        )}
                      />
                    </MessageAction>
                    <MessageAction
                      tooltip="Not helpful"
                      onClick={() => {
                        setFeedback((f) => ({ ...f, [message.id]: "down" }));
                        toast("Thanks for the nudge — we'll use this to improve.");
                      }}
                    >
                      <ThumbsDown
                        className={cn(
                          "size-3.5",
                          feedback[message.id] === "down" && "text-destructive"
                        )}
                      />
                    </MessageAction>
                  </MessageActions>
                ) : null}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" ? (
            <Shimmer className="text-sm">Checking your offers…</Shimmer>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {messages.length === 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <PromptInput
        className="bg-card shadow-panel"
        onSubmit={(_message, event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <PromptInputTextarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="Ask about your offers, benefits or cards…"
        />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
        </PromptInputFooter>
      </PromptInput>
    </main>
  );
}
