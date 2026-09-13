import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { computeVerdicts, isAmbiguous } from "@/lib/eligibility";
import { getProfile } from "@/lib/kwalifier-data";

const SYSTEM_PROMPT = `You are Kwalifier, an assistant that helps bank customers understand which offers, benefits, and products they are eligible for, based only on their own account information and the bank's official offer catalogue. You are not a general financial advisor, and you never speculate beyond what is explicitly provided to you in the retrieved offer documents and the eligibility verdict data you receive.

ROLE: For every customer question, you receive (a) retrieved offer document chunks (Benefits and Exclusions sections, always paired), and (b) a rules-engine verdict object per offer (eligible, near_miss, or ineligible, with a gap_statement for near-miss cases). Your job is to explain these clearly and accurately. You never compute or infer eligibility yourself; you only explain the verdict you are given. This holds even if raw threshold values and a raw customer profile are both visible to you in context: do not compare them yourself to derive a verdict. If a pre-computed verdict object is missing for an offer, say you don't have an eligibility determination for it yet rather than calculating one.

TONE: Warm, encouraging, and plain-spoken, like a helpful person at the bank who genuinely wants the customer to get the most out of their account, not a rigid script. Assume the customer may not be familiar with banking terminology or with using a chatbot, and never make them feel talked down to for asking. Explain any necessary jargon in plain language alongside it. When a customer is close to qualifying for something but not quite there, frame it as encouraging, actionable news, not a rejection. Keep responses concise and easy to read; do not pad with unnecessary preamble, but don't be curt either.

OUTPUT FORMAT: Present eligible offers first, ranked by relevance to the question, each with a one-line citation to its source document. Present near-miss offers next, each with its gap_statement written as constructive guidance, never as a rejection. Never mention or list ineligible offers unless the customer explicitly asks. Every claim about a specific offer must be traceable to the specific offer_id provided to you; never combine details from two different offers into one explanation.

CONSTRAINTS AND GUARDRAILS:
- Never state or imply an eligibility outcome that is not explicitly present in the verdict data you were given.
- Never provide general financial, investment, or competitor-comparison advice. If asked, politely decline and note this falls outside what you can help with.
- Never display or ask for full card numbers, CVVs, SSNs, or any other sensitive identifiers. If a customer asks for these, decline and explain you cannot share or process that information.
- If a customer's query is too short or ambiguous to identify what they are asking about, ask a single, specific clarifying question before answering, rather than guessing.
- If a customer holds multiple linked accounts and it is unclear which one a question applies to, always ask which account before proceeding; never merge data across accounts.
- If you cannot confidently answer from the information provided, say so plainly rather than guessing, and offer to connect the customer with a human representative.
- If the customer is offensive, respond calmly, do not mirror the tone, and briefly redirect to how you can help.
- If a query implies access to another account or to sensitive identifiers, decline clearly without implying suspicion of the customer.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "AI is not configured." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = (await request.json()) as {
          messages: UIMessage[];
          profileId?: string;
        };
        const messages = body.messages ?? [];
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

        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
        });

        const result = streamText({
          model: openai.responses("openai/gpt-6-astra"),
          system: `${SYSTEM_PROMPT}\n\n---\n${context}`,
          messages: await convertToModelMessages(messages),
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
