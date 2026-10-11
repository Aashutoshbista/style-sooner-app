import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/admin-api";
import type { Booking, Member, User } from "@/lib/admin-api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Sage & Shears" },
      { name: "description", content: "Staff panel to manage barbers and bookings." },
      { property: "og:title", content: "Admin — Sage & Shears" },
      { property: "og:description", content: "Staff panel to manage barbers and bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-6 lg:px-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="font-display text-xl">Sage &amp; Shears <span className="text-sm text-muted-foreground">· Admin</span></Link>
          {user && (
            <button onClick={async () => { await api.signOut(); setUser(null); }} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary">
              Sign out
            </button>
          )}
        </header>
        {user ? <Dashboard user={user} /> : <AuthCard onDone={setUser} />}
      </div>
    </div>
  );
}

const input = "w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function AuthCard({ onDone }: { onDone: (u: User) => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) { toast.error("Enter an email and a password of 6+ characters."); return; }
    const u = mode === "in" ? await api.signIn(email, password) : await api.signUp(name || email, email, password);
    onDone(u);
  };

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-3xl border border-border bg-card p-8 shadow-sm">
      <h1 className="font-display text-3xl">{mode === "in" ? "Staff sign in" : "Create account"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === "up" && <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />}
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          {mode === "in" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
        {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}

function Dashboard({ user }: { user: User }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"today" | "upcoming" | "all">("upcoming");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const reload = async () => { setMembers(await api.listMembers()); setBookings(await api.listBookings()); };
  useEffect(() => { reload(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const shown = bookings
    .filter((b) => filter === "all" || (filter === "today" ? b.date === today : b.date >= today))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "—";

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.addMember(name.trim(), role.trim() || "Barber");
    setName(""); setRole(""); toast.success("Member added"); reload();
  };

  const stats = [
    ["Today's bookings", bookings.filter((b) => b.date === today && b.status === "confirmed").length],
    ["Upcoming", bookings.filter((b) => b.date >= today && b.status === "confirmed").length],
    ["Active barbers", members.filter((m) => m.active).length],
  ] as const;

  return (
    <div className="mt-8 space-y-8">
      <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className="mt-2 font-display text-4xl">{n}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Bookings</h2>
            <div className="flex gap-1 rounded-full bg-secondary p-1">
              {(["today", "upcoming", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 divide-y divide-border">
            {shown.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No bookings.</p>}
            {shown.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className={`font-semibold ${b.status === "cancelled" ? "line-through opacity-50" : ""}`}>{b.customerName}</div>
                  <div className="text-xs text-muted-foreground">{b.service} · {memberName(b.memberId)} · {b.date} {b.time} · {b.phone}</div>
                </div>
                <button
                  onClick={async () => { await api.setBookingStatus(b.id, b.status === "cancelled" ? "confirmed" : "cancelled"); reload(); }}
                  className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary"
                >
                  {b.status === "cancelled" ? "Restore" : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Team members</h2>
          <form onSubmit={add} className="mt-4 space-y-2">
            <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex gap-2">
              <input className={input} placeholder="Role (e.g. Barber)" value={role} onChange={(e) => setRole(e.target.value)} />
              <button className="shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">+ Add</button>
            </div>
          </form>
          <ul className="mt-4 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={async () => { await api.updateMember(m.id, { active: !m.active }); reload(); }} className="rounded-full border border-border px-2.5 py-1 text-xs">
                    {m.active ? "Active" : "Hidden"}
                  </button>
                  <button onClick={async () => { await api.deleteMember(m.id); reload(); }} aria-label={`Remove ${m.name}`} className="rounded-full px-2 text-sm text-muted-foreground hover:text-destructive">✕</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
