import { createFileRoute } from "@tanstack/react-router";

import { DefaultPage } from "@/pages/default-page";
import { defaultHead } from "@/pages/designs";

// Which design this serves is set by DEFAULT_DESIGN in src/pages/designs.ts.
export const Route = createFileRoute("/")({
  head: defaultHead,
  component: DefaultPage,
});
