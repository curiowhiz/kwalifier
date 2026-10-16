import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Eye, EyeOff, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import mark from "@/assets/kwalifier-mark.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Toaster } from "@/components/ui/sonner";
import { WayfindingAnswer } from "@/components/v2/genui-v2";
import { RouteLine } from "@/components/v2/route-line";
import { computeVerdicts } from "@/lib/eligibility";
import { PROFILES, getProfile } from "@/lib/kwalifier-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/v2")({
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
      { name: "theme-color", content: "#00694a" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700;800&display=swap",
      },
    ],
  }),
  component: WayfindingPage,
});

const STARTERS = [
  "What card suits my spending on gifts and travel?",
  "Which offers can I use at the airport?",
  "Am I close to qualifying for anything better?",
];

function WayfindingPage() {
  const [profileId, setProfileId] = useState(PROFILES[0]!.id);
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
    <div className="wf min-h-screen">
      <Toaster />

      <header className="bg-[var(--wf-line)] text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-6">
          <img
            src={mark}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full bg-white p-1"
          />
          <div className="mr-auto">
            <h1 className="text-2xl font-extrabold leading-tight">Kwalifier</h1>
            <p className="text-sm text-white/85">Your card offers, explained clearly</p>
          </div>
          <nav aria-label="Site versions" className="order-last w-full sm:order-none sm:w-auto">
            <Link
              to="/"
              className="text-sm font-bold text-white underline decoration-white/60 decoration-2 underline-offset-4 hover:decoration-white"
            >
              Classic design
            </Link>
          </nav>
          <select
            aria-label="Signed-in customer"
            value={profileId}
            onChange={(e) => switchProfile(e.currentTarget.value)}
            className="h-10 rounded-full border-2 border-white bg-[var(--wf-line-deep)] px-4 text-sm font-bold text-white"
          >
            {PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-8 pt-5 sm:px-6">
        <p className="text-sm text-[var(--wf-ink-soft)]">Signed in as {profile.blurb}</p>

        <section
          aria-labelledby="wf-snapshot"
          className="rounded-2xl bg-[var(--wf-surface)] p-5 shadow-[0_1px_2px_rgb(16_35_26/0.06),0_8px_24px_rgb(16_35_26/0.06)] sm:p-7"
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h2 id="wf-snapshot" className="mr-auto text-xl font-extrabold">
              Your eligibility snapshot
            </h2>
            <button
              type="button"
              aria-pressed={showIneligible}
              onClick={() => setShowIneligible((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--wf-rule)] px-3 py-1.5 text-sm font-bold hover:border-[var(--wf-line)]"
            >
              {showIneligible ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
              {showIneligible ? "Hide" : "Show"} not-eligible
            </button>
          </div>
          {/* Keyed by profile so the line draws again for each customer. */}
          <RouteLine
            key={profileId}
            profile={profile}
            verdicts={verdicts}
            showIneligible={showIneligible}
          />
          <p className="mt-7 border-t border-[var(--wf-rule)] pt-4 text-xs text-[var(--wf-ink-soft)]">
            Eligibility is calculated by the bank's rules engine, not by the assistant.
          </p>
        </section>

        <section aria-label="Chat" className="flex flex-col gap-4">
          <Conversation className="min-h-[280px]">
            <ConversationContent className="gap-6 px-0">
              {messages.length === 0 ? (
                <div className="py-6">
                  <h2 className="text-xl font-extrabold">
                    Hi {profile.name}, what would you like to know?
                  </h2>
                  <p className="mt-1 text-[var(--wf-ink-soft)]">
                    Ask about a card, a benefit, or where your spending could earn you more.
                  </p>
                </div>
              ) : null}

              {messages.map((message, messageIndex) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--wf-line)] px-4 py-2.5 text-white">
                      {message.parts
                        .map((part) => (part.type === "text" ? part.text : ""))
                        .join("")}
                    </p>
                  </div>
                ) : (
                  <article
                    key={message.id}
                    className="max-w-[46rem] rounded-2xl rounded-bl-md bg-[var(--wf-surface)] p-4 sm:p-5"
                  >
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <WayfindingAnswer
                          key={i}
                          text={part.text}
                          streaming={status === "streaming" && messageIndex === messages.length - 1}
                          profile={profile}
                        />
                      ) : null,
                    )}
                    <div className="mt-3 flex gap-1">
                      <button
                        type="button"
                        aria-label="Helpful"
                        title="Helpful"
                        aria-pressed={feedback[message.id] === "up"}
                        onClick={() => {
                          setFeedback((f) => ({ ...f, [message.id]: "up" }));
                          toast.success("Thanks — glad that helped.");
                        }}
                        className="rounded-full p-2 text-[var(--wf-ink-soft)] hover:bg-[var(--wf-ground)]"
                      >
                        <ThumbsUp
                          className={cn(
                            "size-4",
                            feedback[message.id] === "up" && "text-[var(--wf-line)]",
                          )}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label="Not helpful"
                        title="Not helpful"
                        aria-pressed={feedback[message.id] === "down"}
                        onClick={() => {
                          setFeedback((f) => ({ ...f, [message.id]: "down" }));
                          toast("Thanks for the nudge — we'll use this to improve.");
                        }}
                        className="rounded-full p-2 text-[var(--wf-ink-soft)] hover:bg-[var(--wf-ground)]"
                      >
                        <ThumbsDown
                          className={cn(
                            "size-4",
                            feedback[message.id] === "down" && "text-[var(--wf-alert)]",
                          )}
                        />
                      </button>
                    </div>
                  </article>
                ),
              )}

              {status === "submitted" ? (
                <p
                  className="flex items-center gap-2 text-sm text-[var(--wf-ink-soft)]"
                  role="status"
                >
                  <span
                    aria-hidden
                    className="size-2.5 animate-pulse rounded-full bg-[var(--wf-amber)]"
                  />
                  Checking your offers…
                </p>
              ) : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border-2 border-[var(--wf-line)] bg-[var(--wf-surface)] px-4 py-2 text-left text-sm font-bold text-[var(--wf-line)] hover:bg-[var(--wf-line)] hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-2xl border-2 border-[var(--wf-rule)] bg-[var(--wf-surface)] p-2 focus-within:border-[var(--wf-line)]"
          >
            <label htmlFor="wf-question" className="sr-only">
              Ask about your offers, benefits or cards
            </label>
            <textarea
              id="wf-question"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about your offers, benefits or cards…"
              className="max-h-40 min-h-11 flex-1 resize-none [field-sizing:content] max-sm:min-h-[4.5rem] bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-[var(--wf-ink-soft)] focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--wf-line)] px-4 font-bold text-white hover:bg-[var(--wf-line-deep)] disabled:cursor-not-allowed disabled:bg-[var(--wf-rule)] disabled:text-[var(--wf-ink-soft)]"
            >
              Ask
              <ArrowUp className="size-4" aria-hidden />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
