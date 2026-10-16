import { DEFAULT_DESIGN } from "@/pages/designs";
import { ClassicPage } from "@/pages/classic-page";
import { WayfindingPage } from "@/pages/wayfinding-page";

const pages = { wayfinding: WayfindingPage, classic: ClassicPage };

/** The page component served at `/`, chosen by DEFAULT_DESIGN in src/pages/designs.ts. */
export const DefaultPage = pages[DEFAULT_DESIGN];
