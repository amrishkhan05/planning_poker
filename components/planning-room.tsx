"use client";

import { io } from "socket.io-client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { APP_URL, FIBONACCI_SCALE, TSHIRT_SCALE } from "@/lib/constants";
import type { PlanningIssueView, PlanningSessionView } from "@/lib/types";

function allowedValues(session: PlanningSessionView) {
  if (session.scale === "custom") return session.customValues;
  if (session.scale === "tshirt") return TSHIRT_SCALE;
  return FIBONACCI_SCALE;
}

export function PlanningRoom({
  initialSession,
  currentUserId,
}: {
  initialSession: PlanningSessionView;
  currentUserId: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [selectedVote, setSelectedVote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeIssue = useMemo(
    () =>
      session.issues.find((issue) => issue.id === session.activeIssueId) ||
      session.issues[0] ||
      null,
    [session],
  );

  const currentRound = activeIssue?.rounds[activeIssue.rounds.length - 1];
  const isFacilitator = session.facilitatorId === currentUserId;
  const currentVote = currentRound?.votes.find((vote) => vote.userId === currentUserId);

  useEffect(() => {
    const socket = io(APP_URL, { path: "/socket.io" });
    socket.emit("planning:join", session.id);
    const refresh = async () => {
      const response = await fetch(`/api/sessions/${session.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = await response.json();
      setSession(next);
    };
    socket.on("session:updated", refresh);
    socket.on("vote:submitted", refresh);
    socket.on("votes:revealed", refresh);
    socket.on("issue:finalized", refresh);
    return () => {
      socket.emit("planning:leave", session.id);
      socket.disconnect();
    };
  }, [session.id]);

  async function runAction(
    path: string,
    method: "POST" | "PATCH" = "POST",
    body?: Record<string, unknown>,
    successMessage?: string,
  ) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Request failed" }));
        setError(payload.error || "Request failed");
        return;
      }
      if (successMessage) setMessage(successMessage);
      const next = await fetch(`/api/sessions/${session.id}`, { cache: "no-store" }).then((res) =>
        res.json(),
      );
      setSession(next);
      router.refresh();
    });
  }

  return (
    <div className="room-grid">
      <div className="stack">
        <div className="room-surface">
          <p className="eyebrow">Planning Room</p>
          <div className="workspace-header">
            <div>
              <h1 className="section-title">{session.title}</h1>
              <p className="muted">
                {session.mode} session with {session.participantCount} participants and{" "}
                {session.summary.completedIssues}/{session.issues.length} issues finalized.
              </p>
            </div>
            <div className="pill-row">
              <button
                className="app-button-ghost"
                style={{ marginRight: 8, fontSize: "0.8rem", padding: "4px 10px" }}
                type="button"
                onClick={handleCopyLink}
              >
                {copied ? "Copied!" : "🔗 Share Link"}
              </button>
              <span className="pill">{session.status}</span>
              <span className="pill">{session.scale}</span>
              {session.jiraProjectKey ? <span className="pill">{session.jiraProjectKey}</span> : null}
            </div>
          </div>
        </div>

        <div className="table-surface room-surface">
          {activeIssue ? (
            <>
              <div className="workspace-header">
                <div>
                  <p className="eyebrow">Active Issue</p>
                  <h2 className="section-title">{activeIssue.title}</h2>
                  <p className="muted">{activeIssue.summary}</p>
                </div>
                <div className="pill-row">
                  <span className="pill">{activeIssue.issueType}</span>
                  <span className="pill">{activeIssue.priority}</span>
                  {activeIssue.referenceStory ? (
                    <span className="pill">Reference {activeIssue.referenceStory}</span>
                  ) : null}
                </div>
              </div>

              <div className="vote-grid" style={{ marginTop: 18 }}>
                {allowedValues(session).map((value) => (
                  <button
                    key={value}
                    className={`vote-card ${selectedVote === value ? "vote-card-selected" : ""}`}
                    onClick={() => setSelectedVote(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>

              <div className="room-actions" style={{ marginTop: 18 }}>
                <button
                  className="app-button"
                  type="button"
                  disabled={!selectedVote || isPending}
                  onClick={() =>
                    runAction(
                      `/api/sessions/${session.id}/issues/${activeIssue.id}/vote`,
                      "POST",
                      { value: selectedVote },
                      "Vote submitted.",
                    )
                  }
                >
                  {isPending ? "Saving..." : "Submit vote"}
                </button>
                {isFacilitator ? (
                  <>
                    <button
                      className="app-button-secondary"
                      type="button"
                      onClick={() =>
                        runAction(
                          `/api/sessions/${session.id}/issues/${activeIssue.id}/reveal`,
                          "POST",
                          undefined,
                          "Votes revealed.",
                        )
                      }
                    >
                      Reveal votes
                    </button>
                    <button
                      className="app-button-ghost"
                      type="button"
                      onClick={() =>
                        runAction(
                          `/api/sessions/${session.id}/issues/${activeIssue.id}/finalize`,
                          "POST",
                          { finalEstimate: selectedVote || currentVote?.value || activeIssue.referenceStory || "5" },
                          "Issue finalized.",
                        )
                      }
                    >
                      Finalize estimate
                    </button>
                    <button
                      className="app-button-ghost"
                      type="button"
                      onClick={() =>
                        runAction(`/api/sessions/${session.id}/close`, "POST", undefined, "Session closed.")
                      }
                    >
                      Close session
                    </button>
                  </>
                ) : null}
              </div>

              <div className="vote-summary" style={{ marginTop: 18 }}>
                <div className="quick-card">
                  <strong>Your vote</strong>
                  <p className="muted">{currentVote?.value || "Not submitted yet"}</p>
                </div>
                <div className="quick-card">
                  <strong>Round status</strong>
                  <p className="muted">{currentRound?.status || "No round"}</p>
                </div>
                <div className="quick-card">
                  <strong>Votes collected</strong>
                  <p className="muted">{activeIssue.voteCount}</p>
                </div>
              </div>

              {currentRound?.status !== "collecting" ? (
                <div className="surface" style={{ marginTop: 18 }}>
                  <strong>Revealed votes</strong>
                  <div className="vote-summary" style={{ marginTop: 12 }}>
                    {currentRound.votes.map((vote) => (
                      <div key={vote.id} className="quick-card">
                        <strong>{vote.displayName}</strong>
                        <p className="muted">{vote.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              No issues loaded yet. Import from Jira from the sidebar, then start estimating.
            </div>
          )}
          {message ? <p className="success-text" style={{ marginTop: 12 }}>{message}</p> : null}
          {error ? <p className="error-text" style={{ marginTop: 12 }}>{error}</p> : null}
        </div>
      </div>

      <div className="stack">
        <div className="surface">
          <div className="workspace-header">
            <div>
              <p className="eyebrow">Issue Queue</p>
              <h2 className="section-title">Session backlog</h2>
            </div>
            <button
              className="app-button-ghost"
              type="button"
              onClick={() =>
                runAction(
                  `/api/sessions/${session.id}/issues/import-jira`,
                  "POST",
                  { projectKey: session.jiraProjectKey || "ACME", count: 3 },
                  "Imported Jira issues.",
                )
              }
            >
              Import Jira issues
            </button>
          </div>
          <div className="issue-list" style={{ marginTop: 12 }}>
            {session.issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                className={`issue-card ${issue.id === activeIssue?.id ? "issue-card-active" : ""}`}
                onClick={() =>
                  isFacilitator
                    ? runAction(
                        `/api/sessions/${session.id}`,
                        "PATCH",
                        { activeIssueId: issue.id },
                        "Active issue updated.",
                      )
                    : undefined
                }
              >
                <strong>{issue.jiraIssueKey ? `${issue.jiraIssueKey} · ` : ""}{issue.title}</strong>
                <p className="muted">{issue.summary}</p>
                <div className="meta-row" style={{ marginTop: 10 }}>
                  <span className="pill">{issue.issueType}</span>
                  <span className="pill">{issue.priority}</span>
                  <span className={`pill ${issue.syncStatus === "synced" ? "pill-success" : "pill-warning"}`}>
                    {issue.syncStatus}
                  </span>
                  {issue.finalEstimate ? <span className="pill">Final {issue.finalEstimate}</span> : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="surface">
          <p className="eyebrow">Participants</p>
          <h2 className="section-title">Room roster</h2>
          <div className="member-list" style={{ marginTop: 12 }}>
            {session.participants.map((participant) => (
              <div key={participant.userId} className="member-card">
                <strong>{participant.displayName}</strong>
                <p className="muted">{participant.email}</p>
                <div className="meta-row" style={{ marginTop: 10 }}>
                  <span className="pill">{participant.role}</span>
                  <span className="pill">{participant.joinedAt ? "joined" : "not active"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
