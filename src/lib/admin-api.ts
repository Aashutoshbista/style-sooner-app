// Placeholder data layer for the admin panel.
// Replace each function body with calls to your own backend.
// Everything here lives in memory only and resets on page reload.

export type Member = { id: string; name: string; role: string; active: boolean };
export type Booking = {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: "confirmed" | "cancelled";
};
export type User = { email: string; name: string };

let members: Member[] = [
  { id: "mara", name: "Mara Vance", role: "Master barber", active: true },
  { id: "jonah", name: "Jonah Reyes", role: "Fade specialist", active: true },
  { id: "elena", name: "Elena Cho", role: "Stylist", active: true },
];

const today = new Date().toISOString().slice(0, 10);
let bookings: Booking[] = [
  { id: "b1", customerName: "Sam Patel", phone: "555-0101", service: "Skin Fade", memberId: "jonah", date: today, time: "10:15", status: "confirmed" },
  { id: "b2", customerName: "Leo Grant", phone: "555-0144", service: "Classic Cut", memberId: "mara", date: today, time: "14:15", status: "confirmed" },
];

// TODO: connect to your auth
export async function signIn(email: string, _password: string): Promise<User> {
  return { email, name: email.split("@")[0] };
}
export async function signUp(name: string, email: string, _password: string): Promise<User> {
  return { email, name };
}
export async function signOut(): Promise<void> {}

// TODO: connect to your members API
export async function listMembers() { return [...members]; }
export async function addMember(name: string, role: string) {
  const m = { id: crypto.randomUUID(), name, role, active: true };
  members = [...members, m];
  return m;
}
export async function updateMember(id: string, patch: Partial<Member>) {
  members = members.map((m) => (m.id === id ? { ...m, ...patch } : m));
}
export async function deleteMember(id: string) { members = members.filter((m) => m.id !== id); }

// TODO: connect to your bookings API
export async function listBookings() { return [...bookings]; }
export async function setBookingStatus(id: string, status: Booking["status"]) {
  bookings = bookings.map((b) => (b.id === id ? { ...b, status } : b));
}
