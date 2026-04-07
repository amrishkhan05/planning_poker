import { InviteMemberForm } from "@/components/invite-member-form";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/store";

export default async function AdminPage() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);

  return (
    <div className="admin-grid">
      <section className="stack">
        <div className="surface">
          <p className="eyebrow">Workspace Admin</p>
          <h1 className="section-title">Members and governance</h1>
        </div>
        <div className="surface">
          <div className="member-list">
            {dashboard.members.map((member) => (
              <article key={member.id} className="member-card">
                <strong>{member.displayName}</strong>
                <p className="muted">{member.email}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill">{member.role}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <aside className="stack">
        <div className="surface">
          <p className="eyebrow">Invite teammate</p>
          <h2 className="section-title">Add members</h2>
          <InviteMemberForm />
        </div>
        <div className="surface">
          <p className="eyebrow">Recent actions</p>
          <h2 className="section-title">Audit feed</h2>
          <div className="audit-list" style={{ marginTop: 12 }}>
            {dashboard.recentAuditEvents.map((event) => (
              <article key={event.id} className="audit-card">
                <strong>{event.action}</strong>
                <p className="muted">{event.detail || event.targetType}</p>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
