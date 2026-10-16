import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Sparkle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";

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
import { AssistantMessage } from "@/components/genui-message";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerdictCard } from "@/components/verdict-card";
import { computeVerdicts } from "@/lib/eligibility";
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

function KwalifierPage() {
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
          <h1 className="font-serif text-2xl font-semibold text-foreground">Kwalifier</h1>
          <p className="text-xs text-muted-foreground">
            Your card offers, explained clearly
          </p>
        </div>
        <nav aria-label="Site versions">
          <Link
            to="/v2"
            className="text-xs text-foreground underline underline-offset-4 hover:text-primary"
          >
            New design
          </Link>
        </nav>
        <Select value={profileId} onValueChange={switchProfile}>
          <SelectTrigger className="on-parchment w-[168px] bg-card text-card-foreground">
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

      <section className="mt-4 border border-border bg-transparent p-3">
        <div className="flex items-center gap-2">
          <h2 className="font-serif mr-auto text-lg font-medium text-foreground">Your eligibility snapshot</h2>
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
        <div className="relative" style={{ perspective: 1000 }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={profileId}
              initial={{ opacity: 0, x: 28, rotateY: -6 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -28, rotateY: 6 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 grid gap-2 sm:grid-cols-2"
            >
              {shown.map((v, i) => (
                <VerdictCard key={v.offer_id} verdict={v} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
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

          {messages.map((message, messageIndex) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.role === "assistant" ? (
                  <motion.div
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={{ clipPath: "inset(0 0% 0 0)" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <AssistantMessage
                          key={i}
                          text={part.text}
                          streaming={status === "streaming" && messageIndex === messages.length - 1}
                          profile={profile}
                        />
                      ) : null
                    )}
                  </motion.div>
                ) : (
                  message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : null
                  )
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
        <div className="on-parchment mb-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="border border-border bg-card px-3 py-1.5 text-xs text-card-foreground/80 transition-colors hover:border-primary hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <PromptInput
        className="on-parchment bg-card shadow-panel"
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
