import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/workspace");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1 className="section-title">Sign in to your planning workspace</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          Demo credentials are preloaded: `owner@acme.test` / `password123`.
        </p>
        <div style={{ marginTop: 20 }}>
          <AuthForm mode="login" />
        </div>
        <p className="muted" style={{ marginTop: 18 }}>
          Need a new workspace? <Link href="/register">Create one here</Link>.
        </p>
      </section>
    </main>
  );
}
