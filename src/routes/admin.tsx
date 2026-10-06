import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toISODate } from "@/lib/salon";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Sage & Shears" },
      { name: "description", content: "Manage barbers and view bookings." },
      { property: "og:title", content: "Admin — Sage & Shears" },
      { property: "og:description", content: "Manage barbers and view bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setIsAdmin(!!ok);
    } else setIsAdmin(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") check(); });
    return () => data.subscription.unsubscribe();
  }, [check]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-6 lg:px-10">
        <header className="mb-10 flex items-center justify-between">
          <Link to="/" className="font-display text-lg">← Sage &amp; Shears</Link>
          {user && <button onClick={() => supabase.auth.signOut()} className="rounded-full border px-4 py-2 text-xs hover:bg-muted">Sign out</button>}
        </header>
        {loading ? <p className="text-muted-foreground">Loading…</p>
          : !user ? <AuthForm />
          : !isAdmin ? <p className="rounded-2xl border bg-card p-6 text-muted-foreground">Your account ({user.email}) doesn't have admin access.</p>
          : <Dashboard />}
      </div>
    </div>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) toast.error(error.message);
      else if (!data.session) toast.success("Check your email to confirm your account.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-3xl border bg-card p-8 shadow-soft">
      <h1 className="font-display text-3xl font-light">{mode === "in" ? "Staff sign in" : "Create admin account"}</h1>
      <p className="text-xs text-muted-foreground">The first account created becomes the studio admin.</p>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
      <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
      <button disabled={busy} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{mode === "in" ? "Sign in" : "Sign up"}</button>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground hover:text-foreground">
        {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
      </button>
    </form>
  );
}

type Member = { id: string; name: string; role: string; active: boolean };
type Booking = { id: string; customer_name: string; phone: string; service: string; booking_date: string; booking_time: string; status: string; member_id: string | null };

function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "today" | "all">("upcoming");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Barber");

  const load = useCallback(async () => {
    const [m, b] = await Promise.all([
      supabase.from("members").select("*").order("created_at"),
      supabase.from("bookings").select("*").order("booking_date").order("booking_time"),
    ]);
    setMembers(m.data ?? []); setBookings(b.data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const today = toISODate(new Date());
  const shown = bookings.filter((b) => filter === "all" ? true : filter === "today" ? b.booking_date === today : b.booking_date >= today);
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name ?? "—";

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const { error } = await supabase.from("members").insert({ name: newName.trim(), role: newRole.trim() || "Barber" });
    if (error) { toast.error("Could not add member"); return; }
    toast.success("Member added"); setNewName(""); setNewRole("Barber"); load();
  }
  async function toggleMember(m: Member) { await supabase.from("members").update({ active: !m.active }).eq("id", m.id); load(); }
  async function removeMember(m: Member) { if (!confirm(`Remove ${m.name}?`)) return; await supabase.from("members").delete().eq("id", m.id); load(); }
  async function setStatus(b: Booking, status: string) { await supabase.from("bookings").update({ status }).eq("id", b.id); load(); }

  const stats = [
    { label: "Today's bookings", value: bookings.filter((b) => b.booking_date === today && b.status !== "cancelled").length },
    { label: "Upcoming", value: bookings.filter((b) => b.booking_date >= today && b.status !== "cancelled").length },
    { label: "Active barbers", value: members.filter((m) => m.active).length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-light">Studio control</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-4xl font-light">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bookings</p>
            <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
              {(["upcoming", "today", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 capitalize ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{f}</button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet.</p> : (
            <div className="divide-y">
              {shown.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className={`text-sm font-medium ${b.status === "cancelled" ? "line-through text-muted-foreground" : ""}`}>{b.customer_name} <span className="font-normal text-muted-foreground">· {b.phone}</span></p>
                    <p className="text-xs text-muted-foreground">{b.service} · {memberName(b.member_id)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm">{b.booking_time}</p>
                      <p className="text-xs text-muted-foreground">{b.booking_date}</p>
                    </div>
                    {b.status === "cancelled"
                      ? <button onClick={() => setStatus(b, "confirmed")} className="rounded-lg border px-2.5 py-1 text-xs hover:bg-muted">Restore</button>
                      : <button onClick={() => setStatus(b, "cancelled")} className="rounded-lg border px-2.5 py-1 text-xs text-destructive hover:bg-muted">Cancel</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <p className="mb-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">Team members</p>
          <form onSubmit={addMember} className="mb-5 space-y-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} placeholder="Name" className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex gap-2">
              <input value={newRole} onChange={(e) => setNewRole(e.target.value)} maxLength={60} placeholder="Role" className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button className="rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">+ Add</button>
            </div>
          </form>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-secondary text-sm text-secondary-foreground">{m.name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.role}</p>
                </div>
                <button onClick={() => toggleMember(m)} className={`rounded-full px-2.5 py-1 text-[10px] ${m.active ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{m.active ? "Active" : "Hidden"}</button>
                <button onClick={() => removeMember(m)} className="text-xs text-muted-foreground hover:text-destructive" aria-label={`Remove ${m.name}`}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
