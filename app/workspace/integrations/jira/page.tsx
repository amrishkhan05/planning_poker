import { JiraSettingsForm } from "@/components/jira-settings-form";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/store";

export default async function JiraPage() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);
  const jira = dashboard.jiraConnection;

  return (
    <div className="dashboard-grid">
      <section className="surface">
        <p className="eyebrow">Jira Integration</p>
        <h1 className="section-title">Project mapping and writeback settings</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          Connect Jira once, then import issues into planning rooms and sync final estimates back
          after reveal.
        </p>
        <div className="stack" style={{ marginTop: 18 }}>
          <div className="quick-card">
            <strong>Status</strong>
            <p className="muted">{jira ? "Connected" : "Disconnected"}</p>
          </div>
          {jira ? (
            <div className="quick-card">
              <strong>Projects</strong>
              <p className="muted">{jira.projectKeys.join(", ")}</p>
            </div>
          ) : null}
        </div>
      </section>
      <aside className="surface">
        <p className="eyebrow">Configure</p>
        <h2 className="section-title">Connection details</h2>
        <div style={{ marginTop: 16 }}>
          <JiraSettingsForm initial={jira} />
        </div>
      </aside>
    </div>
  );
}
