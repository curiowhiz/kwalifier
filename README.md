# Kwalifier

Build a chat-based web app called Kwalifier, a bank customer assistant that explains which credit card offers a customer is eligible for. IMPORTANT: eligibility must be computed by separate deterministic logic (a plain JavaScript function comparing customer values to offer thresholds), never by the AI model itself. The AI model only explains a verdict that has already been computed by that function.

SYSTEM PROMPT FOR THE AI MODEL:

You are Kwalifier, an assistant that helps bank customers understand which offers, benefits, and products they are eligible for, based only on their own account information and the bank's official offer catalogue. You are not a general financial advisor, and you never speculate beyond what is explicitly provided to you in the retrieved offer documents and the eligibility verdict data you receive.

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

SAMPLE OFFER DATA (hardcode this as the knowledge base for this prototype; this is a deliberately small sample of a much larger real catalogue, do not invent additional offers beyond these four):

[

  {

    "offer_id": "TRV001",

    "name": "Travel Rewards Card - Lounge Access",

    "account_type": "personal",

    "category": "travel",

    "benefits": "Complimentary access to 1000+ airport lounges worldwide. Priority boarding on partner airlines.",

    "exclusions": "Domestic lounges only in Tier-2 and Tier-3 cities. Does not include guest access.",

    "valid_from": "2026-01-01",

    "valid_to": "2026-12-31",

    "min_credit_score_band": "good",

    "min_tenure_years": 5

  },

  {

    "offer_id": "TRV002",

    "name": "Travel Rewards Card - Airline Miles",

    "account_type": "personal",

    "category": "travel",

    "benefits": "5x airline miles on flight bookings made through the bank's travel portal.",

    "exclusions": "Miles do not apply to third-party booking sites or last-minute fare classes.",

    "valid_from": "2026-01-01",

    "valid_to": "2026-12-31",

    "min_credit_score_band": "good",

    "min_tenure_years": 3

  },

  {

    "offer_id": "BIZ001",

    "name": "Business Spend-back Card",

    "account_type": "business",

    "category": "gifting",

    "benefits": "3% cashback on gift and client-entertainment category spend, up to $500/month.",

    "exclusions": "Cashback cap resets monthly and does not roll over.",

    "valid_from": "2026-01-01",

    "valid_to": "2026-12-31",

    "min_avg_balance_band": "medium",

    "min_monthly_transaction_volume_band": "high"

  },

  {

    "offer_id": "PLAT001",

    "name": "Platinum Business Card",

    "account_type": "business",

    "category": "gifting",

    "benefits": "5% cashback on gift-category spend, higher credit limits, dedicated relationship manager.",

    "exclusions": "Requires credit utilization below 70% over the prior billing cycle.",

    "valid_from": "2026-01-01",

    "valid_to": "2026-12-31",

    "min_avg_balance_band": "high",

    "max_utilization_pct": 70

  }

]

MOCK CUSTOMER PROFILES (let the user switch between these three; all fields listed are required for the eligibility function to run correctly, do not invent missing values):

1. Smarth - account_type: personal, spend_category: travel, credit_score_band: good, tenure_years: 10, avg_balance_band: medium, utilization: 30

2. Aadarsh - account_type: business, spend_category: gifting, credit_score_band: good, avg_balance_band: high, monthly_transaction_volume_band: medium, utilization: 40, LINKED_ACCOUNTS: true (Aadarsh has two separate linked business accounts with different balance histories; if a query's eligibility depends on account-specific data, the assistant must ask which account before proceeding, rather than merging or guessing)

3. Allan - account_type: business, spend_category: gifting, credit_score_band: good, avg_balance_band: high, monthly_transaction_volume_band: high, utilization: 85

REQUIREMENTS:

MUST:

- Chat-based interface, single conversation thread per session

- Accept a customer's natural-language question and return offers relevant to it

- Compute eligibility via a separate, deterministic rules engine (plain JS function, not the LLM), comparing the active mock customer profile against each offer's threshold values

- Present eligible offers ranked by relevance, each with a one-line source citation (offer_id or name)

- Present near-miss offers after eligible ones, each with a gap_statement explaining what's needed to qualify

- Never present ineligible offers unless explicitly asked

- Ask a clarifying question when the query is too short/ambiguous to act on (e.g. "offers?")

- When the active profile is Aadarsh (LINKED_ACCOUNTS: true), always ask which of his two accounts a question applies to before answering, rather than merging data or guessing

- Refuse out-of-scope financial advice requests and sensitive-data requests (masked card numbers, etc.)

- Thumbs up/down feedback control on every response

SHOULD:

- Mobile-friendly, centered chat layout, max-width readable column

- Visually distinguish eligible offers from near-miss offers (e.g. color or icon), not just text order

- Allow switching between the three mock customer profiles above via a dropdown or toggle, without needing to rebuild or reload the app

COULD:

- A simple "why am I seeing this" expandable per offer showing the full retrieved chunk text

- An email/export transcript option

- A settings toggle to view ineligible offers on demand

EXAMPLE INTERACTIONS (match this tone and format):

1. User (Allan): "What card suits my spending on gifts and travel?"

Expected: eligible offers first (e.g. Business Spend-back Card, with citation), then any near-miss offer with its gap_statement as encouraging guidance (e.g. Platinum Business Card: "You're close - reducing your credit utilization below 70% for one billing cycle would unlock this.")

2. User: "offers?"

Expected: a single clarifying question, e.g. "Happy to help! Are you looking for offers on a specific card, or across everything you hold with us, like travel, dining, or savings?" Not a full offer dump.

3. User: "Can you show me my full card number?"

Expected: a polite refusal citing security, no card data shown, offers an alternative (secure banking portal or a representative).

ERROR HANDLING:

- No results: if no offer matches the query, say so plainly and offer to connect the customer with a representative; never fabricate an offer.

- Timeout: if a response takes unusually long, show a brief "still working on that" indicator rather than appearing frozen.

- Offensive input: respond calmly, do not mirror the tone, briefly redirect to how you can help.

- Permission denied: if a query implies access to another account or sensitive identifiers, decline clearly without implying suspicion of the customer.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4c6d3457-acb2-4cca-a2b6-f839dab066d3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
