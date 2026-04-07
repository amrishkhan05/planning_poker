"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { VoteScale } from "@/lib/types";

type MemberOption = {
  id: string;
  displayName: string;
  email: string;
};

export function CreateSessionForm({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    mode: "live",
    scale: "fibonacci" as VoteScale,
    customValues: "S,M,L,XL",
    participantIds: members.slice(0, 3).map((member) => member.id),
  });

  function toggleParticipant(userId: string) {
    setForm((current) => ({
      ...current,
      participantIds: current.participantIds.includes(userId)
        ? current.participantIds.filter((id) => id !== userId)
        : [...current.participantIds, userId],
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          mode: form.mode,
          scale: form.scale,
          customValues:
            form.scale === "custom"
              ? form.customValues.split(",").map((value) => value.trim()).filter(Boolean)
              : undefined,
          participantIds: form.participantIds,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to create session" }));
        setError(body.error || "Unable to create session");
        return;
      }
      const session = await response.json();
      router.push(`/workspace/sessions/${session.id}`);
      router.refresh();
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <input
        className="app-input"
        placeholder="Session title"
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        required
      />
      <select
        className="app-select"
        value={form.mode}
        onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}
      >
        <option value="live">Live room</option>
        <option value="async">Async round</option>
      </select>
      <select
        className="app-select"
        value={form.scale}
        onChange={(event) =>
          setForm((current) => ({ ...current, scale: event.target.value as VoteScale }))
        }
      >
        <option value="fibonacci">Fibonacci</option>
        <option value="tshirt">T-shirt</option>
        <option value="custom">Custom deck</option>
      </select>
      {form.scale === "custom" ? (
        <input
          className="app-input"
          placeholder="Comma separated values"
          value={form.customValues}
          onChange={(event) =>
            setForm((current) => ({ ...current, customValues: event.target.value }))
          }
        />
      ) : null}
      <div className="field-stack">
        <strong>Invite participants</strong>
        {members.map((member) => (
          <label key={member.id} className="quick-card">
            <input
              type="checkbox"
              checked={form.participantIds.includes(member.id)}
              onChange={() => toggleParticipant(member.id)}
            />{" "}
            {member.displayName}
            <p className="muted">{member.email}</p>
          </label>
        ))}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="app-button" type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create session"}
      </button>
    </form>
  );
}
