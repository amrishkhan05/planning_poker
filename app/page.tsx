import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="marketing-shell">
        <section className="hero-panel">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">Corporate Planning Poker</p>
              <h1 className="hero-title">Estimate faster. Reveal smarter. Sync cleanly to Jira.</h1>
              <p className="lead" style={{ maxWidth: 620, marginTop: 18 }}>
                Planning Poker turns sprint estimation into a clear, auditable room for product,
                engineering, and delivery leads. Run live sessions, keep votes private until reveal,
                and push final estimates back to Jira with history intact.
              </p>
              <div className="cta-row" style={{ marginTop: 24 }}>
                <Link className="app-button" href="/register">
                  Create a workspace
                </Link>
                <Link className="app-button-ghost" href="/login">
                  Sign in to demo workspace
                </Link>
              </div>
            </div>
            <div className="stack">
              <div className="quick-card">
                <strong>Built for Jira-first teams</strong>
                <p className="muted">
                  Import issues, keep planning snapshots stable, and write back final estimates
                  without leaving the room.
                </p>
              </div>
              <div className="quick-card">
                <strong>Facilitator controls that matter</strong>
                <p className="muted">
                  Reveal votes, finalize consensus, close sessions, and keep a clean audit trail
                  for PMO and engineering leadership.
                </p>
              </div>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <strong>Anonymous voting</strong>
              <p className="muted">Hide estimates until the facilitator reveals the round.</p>
            </div>
            <div className="stat-card">
              <strong>Persistent history</strong>
              <p className="muted">Retain issue snapshots, final estimates, and session actions.</p>
            </div>
            <div className="stat-card">
              <strong>Admin-ready</strong>
              <p className="muted">Invite teammates, manage Jira fields, and review audit events.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
