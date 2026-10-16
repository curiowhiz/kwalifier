import { createFileRoute } from "@tanstack/react-router";

import { ClassicPage } from "@/pages/classic-page";
import { classicHead } from "@/pages/designs";

// The classic design, always available here as a backup of the original page.
export const Route = createFileRoute("/classic")({
  head: classicHead,
  component: ClassicPage,
});
