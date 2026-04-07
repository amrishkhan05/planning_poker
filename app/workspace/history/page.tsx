import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/store";

export default async function HistoryPage() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);

  return (
    <div className="history-grid">
      <section className="surface">
        <p className="eyebrow">History</p>
        <h1 className="section-title">Closed sessions and audit trail</h1>
        <div className="stack" style={{ marginTop: 16 }}>
          {dashboard.sessions.map((session) => (
            <article key={session.id} className="history-card">
              <strong>{session.title}</strong>
              <p className="muted">
                {session.summary.completedIssues} issues finalized · {session.summary.syncedIssues} synced · last updated{" "}
                {new Date(session.updatedAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>
      <aside className="surface">
        <p className="eyebrow">Recent Audit</p>
        <h2 className="section-title">Operational trace</h2>
        <div className="audit-list" style={{ marginTop: 16 }}>
          {dashboard.recentAuditEvents.map((event) => (
            <article key={event.id} className="audit-card">
              <strong>{event.action}</strong>
              <p className="muted">{event.detail || event.targetType}</p>
              <p className="muted" style={{ marginTop: 10 }}>
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
