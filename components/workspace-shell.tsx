"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export function WorkspaceShell({
  workspaceName,
  displayName,
  children,
}: {
  workspaceName: string;
  displayName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const links = [
    { href: "/workspace/sessions", label: "Sessions" },
    { href: "/workspace/history", label: "History" },
    { href: "/workspace/integrations/jira", label: "Jira" },
    { href: "/workspace/admin", label: "Admin" },
  ] as const;

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar">
        <div className="stack">
          <div className="brand-mark">{workspaceName.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="eyebrow">Workspace</p>
            <h2 style={{ margin: 0 }}>{workspaceName}</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              {displayName}
            </p>
          </div>
        </div>
        <nav className="workspace-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              className={`workspace-link ${
                pathname.startsWith(link.href) ? "workspace-link-active" : ""
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          <button
            className="app-button-ghost"
            type="button"
            style={{ flex: 1 }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="workspace-main">{children}</main>
    </div>
  );
}
