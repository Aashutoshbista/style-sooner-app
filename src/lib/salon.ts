export const SERVICES = [
  { name: "Classic Cut", duration: "40 min", price: 30, desc: "Consultation, scissor & clipper work, wash and style." },
  { name: "Skin Fade", duration: "50 min", price: 35, desc: "Seamless gradient with crisp, clean edges." },
  { name: "Beard Sculpt", duration: "25 min", price: 18, desc: "Shape, line-up, hot towel and oil." },
  { name: "Cut & Beard", duration: "65 min", price: 45, desc: "The full treatment, head to chin." },
];

export const TIME_SLOTS = ["09:30", "10:15", "11:00", "11:45", "13:30", "14:15", "15:00", "15:45", "16:30", "17:15", "18:00"];

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
