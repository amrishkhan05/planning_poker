"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function InviteMemberForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    role: "member",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to invite member" }));
        setError(body.error || "Unable to invite member");
        return;
      }
      setMessage("Invite created.");
      setForm({ email: "", role: "member" });
      router.refresh();
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <input
        className="app-input"
        placeholder="teammate@company.com"
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        required
      />
      <select
        className="app-select"
        value={form.role}
        onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
        <option value="owner">Owner</option>
      </select>
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button className="app-button" type="submit" disabled={isPending}>
        {isPending ? "Inviting..." : "Invite teammate"}
      </button>
    </form>
  );
}
