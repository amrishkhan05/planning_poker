"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function JiraSettingsForm({
  initial,
}: {
  initial?: {
    baseUrl?: string;
    projectKeys?: string[];
    storyPointsField?: string;
    teamField?: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    baseUrl: initial?.baseUrl || "",
    projectKeys: initial?.projectKeys?.join(", ") || "",
    storyPointsField: initial?.storyPointsField || "customfield_10016",
    teamField: initial?.teamField || "",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/integrations/jira/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          projectKeys: form.projectKeys.split(",").map((value) => value.trim()).filter(Boolean),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to connect Jira" }));
        setError(body.error || "Unable to connect Jira");
        return;
      }
      setMessage("Jira settings saved.");
      router.refresh();
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <input
        className="app-input"
        placeholder="https://company.atlassian.net"
        value={form.baseUrl}
        onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
        required
      />
      <input
        className="app-input"
        placeholder="Project keys, comma separated"
        value={form.projectKeys}
        onChange={(event) =>
          setForm((current) => ({ ...current, projectKeys: event.target.value }))
        }
        required
      />
      <input
        className="app-input"
        placeholder="Story points field id"
        value={form.storyPointsField}
        onChange={(event) =>
          setForm((current) => ({ ...current, storyPointsField: event.target.value }))
        }
        required
      />
      <input
        className="app-input"
        placeholder="Optional team field id"
        value={form.teamField}
        onChange={(event) => setForm((current) => ({ ...current, teamField: event.target.value }))}
      />
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button className="app-button" type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Jira configuration"}
      </button>
    </form>
  );
}
