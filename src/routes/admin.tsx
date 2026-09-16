import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AdminNav } from "./admin/-shared";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Kwalifier Ops — Beta Launch Dashboard" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

// ============================================================
// Server-side auth check. The expected password never reaches the
// client bundle; only a boolean result does.
// ============================================================
const verifyAdminPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { password: string })
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) {
      return { ok: false, error: "Admin access is not configured on this deployment." };
    }
    return { ok: data.password === expected, error: data.password === expected ? undefined : "Incorrect password." };
  });

const SESSION_KEY = "kwalifier_admin_authed";

function AdminLayout() {
  const [authed, setAuthed] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "true");
    setCheckedStorage(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyAdminPassword({ data: { password } });
      if (result.ok) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setAuthed(true);
      } else {
        setError(result.error ?? "Incorrect password.");
      }
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkedStorage) {
    return <div style={{ background: "var(--ledger-navy)" }} className="min-h-screen" />;
  }

  if (!authed) {
    return (
      <main
        style={{ background: "var(--ledger-navy)" }}
        className="flex min-h-screen items-center justify-center px-4"
      >
        <form
          onSubmit={handleLogin}
          style={{ background: "var(--admin-parchment)", borderColor: "var(--vault-brass)" }}
          className="w-full max-w-sm border p-8"
        >
          <h1
            style={{ color: "var(--ledger-navy)", fontFamily: "var(--font-display)" }}
            className="text-xl font-semibold"
          >
            Kwalifier Ops
          </h1>
          <p className="mt-1 text-sm text-[var(--ledger-navy)]/70">
            Internal beta launch dashboard. Sign in to continue.
          </p>
          <label htmlFor="admin-password" className="mt-6 block text-xs font-medium text-[var(--ledger-navy)]/70">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderColor: "var(--ledger-navy)" }}
            className="mt-1.5 w-full border bg-white px-3 py-2 text-sm text-[var(--ledger-navy)] outline-none focus:ring-2 focus:ring-[var(--vault-brass)]"
          />
          {error ? <p className="mt-2 text-sm text-[var(--clay-rust)]">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !password}
            style={{ background: "var(--vault-brass)", color: "var(--ledger-navy)" }}
            className="mt-5 w-full py-2 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Checking..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div style={{ background: "var(--admin-parchment)" }} className="flex min-h-screen">
      <Toaster />
      <aside style={{ background: "var(--ledger-navy)" }} className="flex w-56 flex-shrink-0 flex-col px-5 py-6">
        <div style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold text-white">
          Kwalifier
        </div>
        <div className="mb-8 text-xs text-white/50">Ops console</div>
        <AdminNav />
        <div className="mt-auto text-xs text-white/35">Beta launch monitoring</div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-7">
        <Outlet />
      </main>
    </div>
  );
}
