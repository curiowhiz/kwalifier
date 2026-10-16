import { createFileRoute } from "@tanstack/react-router";

import { designs } from "@/pages/designs";

// The wayfinding design, always available here (also the default at `/`).
export const Route = createFileRoute("/v2")({
  head: designs.wayfinding.head,
  component: designs.wayfinding.Page,
});
