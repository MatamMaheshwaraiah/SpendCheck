const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,25,000 — Indian lakh grouping */
export const formatINR = (n, decimals = false) => (decimals ? inr2 : inr0).format(Number(n) || 0);

/** ₹1.2L / ₹3.4Cr / ₹12.5K for chart axes */
export function compactINR(n) {
  const v = Math.abs(n);
  if (v >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

export const formatDate = (d, opts = { day: "numeric", month: "short" }) =>
  new Date(d).toLocaleDateString("en-IN", opts);

export const monthLabel = (d = new Date()) => new Date(d).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export const cn = (...c) => c.flat().filter(Boolean).join(" ");

export const isoDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
