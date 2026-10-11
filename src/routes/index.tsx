import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MEMBERS, SERVICES, TIME_SLOTS, toISODate } from "@/lib/salon";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sage & Shears — Haircuts & Online Booking" },
      { name: "description", content: "Sharp cuts in a bright, calm studio. Pick your barber, date and time and book online in seconds." },
      { property: "og:title", content: "Sage & Shears — Haircuts & Online Booking" },
      { property: "og:description", content: "Pick your barber, date and time and book online in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <header className="flex items-center justify-between py-6">
          <a href="#" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground">S</span>
            <span className="leading-tight">
              <span className="block font-display text-lg">Sage &amp; Shears</span>
              <span className="block text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Hair studio</span>
            </span>
          </a>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#services" className="hover:text-foreground">Services</a>
            <a href="#team" className="hover:text-foreground">Barbers</a>
            <a href="#book" className="hover:text-foreground">Book</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-xs font-semibold text-muted-foreground hover:text-foreground">Admin</a>
            <a href="#book" className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">Book now</a>
          </div>
        </header>

        <section className="grid items-center gap-12 py-10 lg:grid-cols-2 lg:py-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" /> Open daily · 9:30 – 19:00
            </span>
            <h1 className="mt-6 font-display text-5xl font-light leading-[1.05] tracking-tight md:text-6xl">
              Sharp cuts, <span className="italic text-primary">soft light</span>, honest craft.
            </h1>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              A bright corner studio where every fade is measured by eye and finished by hand. Choose a barber, pick a slot, and relax.
            </p>
            <a href="#book" className="mt-8 inline-block rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90">Reserve a chair</a>
            <div className="mt-9 flex items-center gap-6 text-sm text-muted-foreground">
              <span><span className="font-display text-2xl text-foreground">12k</span> cuts</span>
              <span className="h-8 w-px bg-border" />
              <span><span className="font-display text-2xl text-foreground">4.9</span> rating</span>
              <span className="h-8 w-px bg-border" />
              <span><span className="font-display text-2xl text-foreground">{MEMBERS.length}</span> barbers</span>
            </div>
          </div>
          <div className="relative">
            <img src={hero} alt="Barber cutting a client's hair in a bright studio" width={912} height={1120} className="aspect-[4/5] w-full rounded-3xl object-cover shadow-soft" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border bg-card/85 px-4 py-3 backdrop-blur">
              <p className="font-display text-sm">The Skin Fade</p>
              <p className="text-xs text-muted-foreground">50 min · $35</p>
            </div>
          </div>
        </section>

        <section id="services" className="border-t py-16">
          <h2 className="mb-8 font-display text-3xl font-light">Services</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <div key={s.name} className="rounded-2xl border bg-card p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl">{s.name}</h3>
                  <span className="font-semibold text-accent">${s.price}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-primary">{s.duration}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="team" className="border-t py-16">
          <h2 className="mb-8 font-display text-3xl font-light">Meet the barbers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBERS.map((m) => (
              <div key={m.id} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
                <span className="grid size-12 place-items-center rounded-full bg-secondary font-display text-lg text-secondary-foreground">{m.name[0]}</span>
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Booking />

        <footer className="flex flex-col items-center justify-between gap-3 border-t py-8 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 Sage &amp; Shears Hair Studio</p>
          <p>Open daily · 9:30 – 19:00</p>
        </footer>
      </div>
    </div>
  );
}

function Booking() {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const [service, setService] = useState(SERVICES[0]!.name);
  const [memberId, setMemberId] = useState<string>(MEMBERS[0]!.id);
  const [date, setDate] = useState(toISODate(days[0]!));
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isToday = date === toISODate(new Date());
  const nowHM = new Date().toTimeString().slice(0, 5);
  const svc = SERVICES.find((s) => s.name === service)!;
  const member = MEMBERS.find((m) => m.id === memberId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !time) { toast.error("Please choose a barber and a time."); return; }
    if (name.trim().length < 1 || phone.trim().length < 5) { toast.error("Please enter your name and phone."); return; }
    toast.info("Online booking isn't connected yet — please call the studio to confirm your slot.");
  }

  const chip = (active: boolean, disabled = false) =>
    `rounded-xl border px-3.5 py-2 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : disabled ? "cursor-not-allowed text-muted-foreground/50 line-through" : "bg-card hover:border-primary"}`;

  return (
    <section id="book" className="border-t py-16">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-display text-3xl font-light">Book your chair</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pick a slot</span>
      </div>
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6 rounded-3xl border bg-card p-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Service</p>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => <button type="button" key={s.name} onClick={() => setService(s.name)} className={chip(service === s.name)}>{s.name}</button>)}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Barber</p>
            <div className="flex flex-wrap gap-2">
              {MEMBERS.map((m) => <button type="button" key={m.id} onClick={() => { setMemberId(m.id); setTime(""); }} className={chip(memberId === m.id)}>{m.name}</button>)}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Date</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((d) => {
                const iso = toISODate(d); const active = iso === date;
                return (
                  <button type="button" key={iso} onClick={() => { setDate(iso); setTime(""); }} className={`min-w-16 shrink-0 rounded-xl border py-3 text-center transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary"}`}>
                    <span className="block text-[10px] uppercase tracking-widest opacity-70">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                    <span className="block font-display text-lg">{d.getDate()}</span>
                    <span className="block text-[10px] opacity-70">{d.toLocaleDateString(undefined, { month: "short" })}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Time</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((t) => {
                const disabled = isToday && t <= nowHM;
                return <button type="button" key={t} disabled={disabled} onClick={() => setTime(t)} className={chip(time === t, disabled)}>{t}</button>;
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col rounded-3xl border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your appointment</p>
          <p className="mt-3 font-display text-2xl font-light">{new Date(date + "T00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
          <p className="text-sm text-primary">{time || "Pick a time"} · with {member?.name ?? "—"}</p>
          <div className="mt-5 flex justify-between border-b pb-3 text-sm"><span className="text-muted-foreground">{svc.name}</span><span>${svc.price}</span></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Full name" className="rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="Phone" className="rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <button className="mt-auto w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-soft hover:opacity-90 max-lg:mt-5">
            Confirm booking
          </button>
        </div>
      </form>
    </section>
  );
}
