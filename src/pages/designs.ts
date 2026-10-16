/**
 * Which design the chat page is served in, and each design's document head.
 *
 * This file imports no page components, so the route files can read it
 * without pulling either page into the main bundle.
 */

const sharedMeta = [
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
];

export const wayfindingHead = () => ({
  meta: [...sharedMeta, { name: "theme-color", content: "#00694a" }],
  links: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700;800&display=swap",
    },
  ],
});

export const classicHead = () => ({ meta: sharedMeta });

const heads = { wayfinding: wayfindingHead, classic: classicHead };

/**
 * The design served at `/`, the audience's default.
 *
 * TO ROLL BACK to the classic design, change this to "classic" and deploy.
 * Both designs stay reachable at their own addresses either way:
 * /v2 is always the wayfinding design and /classic is always the classic one.
 */
export const DEFAULT_DESIGN: keyof typeof heads = "wayfinding";

export const defaultHead = heads[DEFAULT_DESIGN];
