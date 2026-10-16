import { createFileRoute } from "@tanstack/react-router";

import { designs } from "@/pages/designs";

// The classic design, always available here as a backup of the original page.
export const Route = createFileRoute("/classic")({
  head: designs.classic.head,
  component: designs.classic.Page,
});
