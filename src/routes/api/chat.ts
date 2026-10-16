import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { computeVerdicts, isAmbiguous } from "@/lib/eligibility";
import { kwalifierLibrary } from "@/lib/genui-library";
import { getProfile } from "@/lib/kwalifier-data";

// In-memory, per-instance rate limit. This is a demo, not a production
// service behind auth — it resets on cold start and isn't shared across
// concurrent instances/regions, but it stops a single script from hammering
// a real, paid Gemini key. A distributed limiter (Vercel KV/Upstash) would
// close that gap if this ever needed to be airtight.
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 8_000;

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Opportunistic sweep so the map doesn't grow unbounded over a long-lived instance.
  if (rateLimits.size > 500) {
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(key);
    }
  }

  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

const SYSTEM_PROMPT = `You are Kwalifier, an assistant that helps bank customers understand which offers, benefits, and products they are eligible for, based only on their own account information and the bank's official offer catalogue. You are not a general financial advisor, and you never speculate beyond what is explicitly provided to you in the retrieved offer documents and the eligibility verdict data you receive.

ROLE: For every customer question, you receive (a) retrieved offer document chunks (Benefits and Exclusions sections, always paired), and (b) a rules-engine verdict object per offer (eligible, near_miss, or ineligible, with a gap_statement for near-miss cases). Your job is to explain these clearly and accurately. You never compute or infer eligibility yourself; you only explain the verdict you are given. This holds even if raw threshold values and a raw customer profile are both visible to you in context: do not compare them yourself to derive a verdict. If a pre-computed verdict object is missing for an offer, say you don't have an eligibility determination for it yet rather than calculating one.

TONE: Warm, encouraging, and plain-spoken, like a helpful person at the bank who genuinely wants the customer to get the most out of their account, not a rigid script. Assume the customer may not be familiar with banking terminology or with using a chatbot, and never make them feel talked down to for asking. Explain any necessary jargon in plain language alongside it. When a customer is close to qualifying for something but not quite there, frame it as encouraging, actionable news, not a rejection. Keep responses concise and easy to read; do not pad with unnecessary preamble, but don't be curt either.

OUTPUT FORMAT: Keep the written answer short, because the offer cards shown under it already carry each offer's benefits, exclusions, gap, gauge and source citation. Write 2 to 4 sentences of plain prose with no headings or bullet lists: say what the customer qualifies for, naming each offer once with its offer_id, eligible offers first and ranked by relevance to the question, then near-miss offers. For each near-miss offer, give the one action from its gap_statement in a single encouraging sentence, never as a rejection. Do not restate benefits, cashback rates, limits, validity dates or citations that the cards show. If you show no cards, keep the same short style and add a one-line source citation for each offer you name. Never mention or list ineligible offers unless the customer explicitly asks. Every claim about a specific offer must be traceable to the specific offer_id provided to you; never combine details from two different offers into one explanation.

CONSTRAINTS AND GUARDRAILS:
- Never state or imply an eligibility outcome that is not explicitly present in the verdict data you were given.
- Never provide general financial, investment, or competitor-comparison advice. If asked, politely decline and note this falls outside what you can help with.
- Never display or ask for full card numbers, CVVs, SSNs, or any other sensitive identifiers. If a customer asks for these, decline and explain you cannot share or process that information.
- If a customer's query is too short or ambiguous to identify what they are asking about, ask a single, specific clarifying question before answering, rather than guessing.
- If a customer holds multiple linked accounts and it is unclear which one a question applies to, always ask which account before proceeding; never merge data across accounts.
- If you cannot confidently answer from the information provided, say so plainly rather than guessing, and offer to connect the customer with a human representative.
- If the customer is offensive, respond calmly, do not mirror the tone, and briefly redirect to how you can help.
- If a query implies access to another account or to sensitive identifiers, decline clearly without implying suspicion of the customer.`;

// Generated from the same component library the chat renders, so the model is
// only ever told about components that exist. Every card takes an offer_id and
// reads its verdict from the rules engine on the client.
const ANSWER_CARDS_PROMPT = kwalifierLibrary.prompt({
  preamble: `ANSWER CARDS: Alongside your written answer you can show the customer interactive offer cards, written in openui-lang, a small UI language described below. The cards read status, gap, benefits and exclusions from the bank's rules engine themselves; you only choose which offers to show.`,
  examples: [
    `An eligible offer, then a near-miss offer with its what-if simulator:
\`\`\`openui-lang
root = Answer([biz, plat, platSim])
biz = OfferCard("BIZ001")
plat = OfferCard("PLAT001")
platSim = WhatIf("PLAT001")
\`\`\``,
  ],
  additionalRules: [
    "Your response is your plain-language answer, following the OUTPUT FORMAT above. When that answer discusses specific offers, end it with exactly ONE fenced block that opens with ```openui-lang and closes with ```, holding an Answer with an OfferCard for each offer you discussed, in the same order.",
    "Put a WhatIf card right after the OfferCard of every near_miss offer you discussed. Never use WhatIf for an eligible or ineligible offer.",
    "Use only offer_ids that appear in the verdict data. Never add a card for an ineligible offer unless the customer explicitly asked about it.",
    "Write no block when you are asking a clarifying question, declining, or not discussing any specific offer.",
    "When you add a WhatIf card, you may invite the customer to try the slider below your answer. Never mention openui-lang, code, or blocks in your written answer.",
  ],
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "AI is not configured." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
          return new Response(
            JSON.stringify({ error: "Too many requests. Please slow down and try again shortly." }),
            {
              status: 429,
              headers: { "Content-Type": "application/json", "Retry-After": String(rateLimit.retryAfterSec) },
            }
          );
        }

        let body: { messages: UIMessage[]; profileId?: string };
        try {
          body = (await request.json()) as { messages: UIMessage[]; profileId?: string };
        } catch {
          return new Response(JSON.stringify({ error: "Malformed request body." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const messages = body.messages ?? [];
        const totalChars = messages.reduce(
          (sum, m) =>
            sum +
            m.parts.filter((p) => p.type === "text").reduce((s, p) => s + (p as { text: string }).text.length, 0),
          0
        );
        if (messages.length > MAX_MESSAGES || totalChars > MAX_TOTAL_CHARS) {
          return new Response(JSON.stringify({ error: "Conversation is too long for this demo." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const profile = getProfile(body.profileId ?? "smarth");

        const lastUserText = [...messages]
          .reverse()
          .find((m) => m.role === "user")
          ?.parts.filter((p) => p.type === "text")
          .map((p) => (p as { text: string }).text)
          .join(" ")
          ?? "";

        // Deterministic rules engine — the model never decides eligibility.
        const verdicts = computeVerdicts(profile, lastUserText);

        const context = `ACTIVE CUSTOMER PROFILE (raw data, for context only — never derive verdicts from it):
${JSON.stringify(profile, null, 2)}

${
  profile.linked_accounts
    ? `LINKED ACCOUNTS: this customer holds two separate linked business accounts (${(profile.linked_account_labels ?? []).join(" and ")}) with different balance histories. If the answer depends on account-specific data, you MUST ask which account applies before answering. Do not merge or guess.`
    : "LINKED ACCOUNTS: none."
}

QUERY AMBIGUITY FLAG (from the app, not from you): ${
          isAmbiguous(lastUserText) ? "AMBIGUOUS — ask one specific clarifying question first." : "clear enough to answer"
        }

PRE-COMPUTED RULES-ENGINE VERDICTS WITH RETRIEVED DOCUMENT CHUNKS (already sorted by relevance to this question):
${JSON.stringify(verdicts, null, 2)}`;

        const google = createGoogleGenerativeAI({ apiKey });

        const result = streamText({
          model: google("gemini-3.6-flash"),
          system: `${SYSTEM_PROMPT}\n\n---\n${ANSWER_CARDS_PROMPT}\n\n---\n${context}`,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
