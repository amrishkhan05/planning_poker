import Link from "next/link";
import { CreateSessionForm } from "@/components/create-session-form";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/store";

export default async function SessionsPage() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);

  return (
    <div className="session-grid">
      <section className="stack">
        <div className="surface">
          <p className="eyebrow">Planning Sessions</p>
          <h1 className="section-title">Room list and current sprint activity</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            Launch a session, jump into active estimates, or reopen a recent room from history.
          </p>
        </div>
        <div className="surface">
          <div className="session-list">
            {dashboard.sessions.map((session) => (
              <Link key={session.id} href={`/workspace/sessions/${session.id}`} className="issue-card">
                <strong>{session.title}</strong>
                <p className="muted">
                  {session.mode} · {session.status} · {session.participantCount} participants
                </p>
                <div className="meta-row" style={{ marginTop: 10 }}>
                  <span className="pill">{session.summary.completedIssues} completed</span>
                  <span className="pill">{session.summary.syncedIssues} synced</span>
                  <span className="pill">{session.facilitatorName}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <aside className="surface">
        <p className="eyebrow">Create New</p>
        <h2 className="section-title">Open a planning room</h2>
        <p className="muted" style={{ marginTop: 10, marginBottom: 16 }}>
          Choose a deck, pick participants, and start estimating.
        </p>
        <CreateSessionForm members={dashboard.members} />
      </aside>
    </div>
  );
}
