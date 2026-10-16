import { createFileRoute } from "@tanstack/react-router";

import { DEFAULT_DESIGN, designs } from "@/pages/designs";

// Which design this serves is set by DEFAULT_DESIGN in src/pages/designs.ts.
export const Route = createFileRoute("/")({
  head: designs[DEFAULT_DESIGN].head,
  component: designs[DEFAULT_DESIGN].Page,
});
