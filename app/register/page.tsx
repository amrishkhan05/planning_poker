import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/workspace");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Start a workspace</p>
        <h1 className="section-title">Create a planning room your whole team can trust</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          Set up your workspace owner account first. You can invite admins and participants later
          from the admin area.
        </p>
        <div style={{ marginTop: 20 }}>
          <AuthForm mode="register" />
        </div>
        <p className="muted" style={{ marginTop: 18 }}>
          Already have an account? <Link href="/login">Sign in</Link>.
        </p>
      </section>
    </main>
  );
}
