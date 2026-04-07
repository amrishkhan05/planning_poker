"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    workspaceName: "",
    displayName: "",
    email: mode === "login" ? "owner@acme.test" : "",
    password: mode === "login" ? "password123" : "",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Request failed" }));
        setError(body.error || "Request failed");
        return;
      }
      router.push("/workspace");
      router.refresh();
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "register" ? (
        <>
          <input
            className="app-input"
            placeholder="Workspace name"
            value={form.workspaceName}
            onChange={(event) =>
              setForm((current) => ({ ...current, workspaceName: event.target.value }))
            }
            required
          />
          <input
            className="app-input"
            placeholder="Your display name"
            value={form.displayName}
            onChange={(event) =>
              setForm((current) => ({ ...current, displayName: event.target.value }))
            }
            required
          />
        </>
      ) : null}
      <input
        className="app-input"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        required
      />
      <input
        className="app-input"
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        required
      />
      {error ? <p className="error-text">{error}</p> : null}
      <button className="app-button" type="submit" disabled={isPending}>
        {isPending ? "Working..." : mode === "login" ? "Sign in" : "Create workspace"}
      </button>
    </form>
  );
}
