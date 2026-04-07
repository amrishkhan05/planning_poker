import { WorkspaceShell } from "@/components/workspace-shell";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/store";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);

  return (
    <WorkspaceShell
      workspaceName={dashboard.workspace.name}
      displayName={dashboard.me.displayName}
    >
      {children}
    </WorkspaceShell>
  );
}
