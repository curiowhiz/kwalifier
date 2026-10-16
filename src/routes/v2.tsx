import { createFileRoute } from "@tanstack/react-router";

import { WayfindingPage } from "@/pages/wayfinding-page";
import { wayfindingHead } from "@/pages/designs";

// The wayfinding design, always available here (also the default at `/`).
export const Route = createFileRoute("/v2")({
  head: wayfindingHead,
  component: WayfindingPage,
});
