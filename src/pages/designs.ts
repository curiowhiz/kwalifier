import { ClassicPage } from "@/pages/classic-page";
import { WayfindingPage } from "@/pages/wayfinding-page";

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

/** The two designs of the chat page, each with its own page component and document head. */
export const designs = {
  wayfinding: {
    Page: WayfindingPage,
    head: () => ({
      meta: [...sharedMeta, { name: "theme-color", content: "#00694a" }],
      links: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700;800&display=swap",
        },
      ],
    }),
  },
  classic: {
    Page: ClassicPage,
    head: () => ({ meta: sharedMeta }),
  },
};

/**
 * The design served at `/`, the audience's default.
 *
 * TO ROLL BACK to the classic design, change this to "classic" and deploy.
 * Both designs stay reachable at their own addresses either way:
 * /v2 is always the wayfinding design and /classic is always the classic one.
 */
export const DEFAULT_DESIGN: keyof typeof designs = "wayfinding";
