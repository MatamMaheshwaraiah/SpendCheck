/* ─────────────────────────────────────────────────────────────────────────────
   API client. Every function maps 1:1 to a planned REST endpoint (/api/v1/...).
   VITE_USE_MOCK=true  → served from the in-memory demo store below.
   VITE_USE_MOCK=false → real fetch() to the Express + MySQL backend.
   ───────────────────────────────────────────────────────────────────────────── */
import * as db from "@/data/mock";
import { categorize, catById, CATEGORIES } from "@/data/categories";
import { isoDay } from "@/lib/format";

const USE_MOCK = (import.meta.env?.VITE_USE_MOCK ?? "true") !== "false";
const BASE = import.meta.env?.VITE_API_URL ?? "/api/v1";
const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

let accessToken = null;
export const setToken = (t) => (accessToken = t);

async function http(path, { method = "GET", body, form } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: "include", // httpOnly refresh-token cookie
    headers: { ...(form ? {} : { "Content-Type": "application/json" }), ...(accessToken && { Authorization: `Bearer ${accessToken}` }) },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
  return res.status === 204 ? null : res.json();
}

/* ── in-memory store (mock mode) ── */
/* The mock store persists in localStorage so your own entries survive a refresh.
   mode "demo"  = seeded sample data, mode "fresh" = started from an empty ledger. */
const STORE_KEY = "spendcheck.ledger.v1";
const clone = (x) => JSON.parse(JSON.stringify(x));
const demoStore = () => ({ mode: "demo", txns: clone(db.transactions), budgets: clone(db.budgets), goals: clone(db.goals), alerts: clone(db.alerts), rules: [] });
const freshStore = (budgets) => ({ mode: "fresh", txns: [], budgets: clone(budgets ?? db.budgets), goals: [], alerts: [], rules: [] });

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable */ }
  return demoStore();
}
let store = loadStore();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* storage full or blocked */ }
}

/* Budget alerts: fire once per category per month at 80% and 100% */
function checkBudgetAlerts(categoryId, date) {
  const b = store.budgets.find((x) => x.categoryId === categoryId);
  if (!b || catById[categoryId].bucket === "savings") return;
  const month = date.slice(0, 7);
  const spent = store.txns.filter((t) => t.categoryId === categoryId && t.direction === "debit" && t.date.slice(0, 7) === month).reduce((s, t) => s + t.amount, 0);
  const name = catById[categoryId].name;
  for (const [level, type, severity] of [[1, "budget_100", "critical"], [0.8, "budget_80", "warning"]]) {
    if (spent < b.limit * level) continue;
    const key = `${type}:${month}:${categoryId}`;
    if (store.alerts.some((a) => a.key === key)) return;
    store.alerts.unshift({
      id: Date.now(), key, type, severity, read: false, time: "Just now", link: "/app/budgets",
      title: level === 1 ? `${name} is over budget` : `${name} at ${Math.round((spent / b.limit) * 100)}% of budget`,
      body: `₹${spent.toLocaleString("en-IN")} of ₹${b.limit.toLocaleString("en-IN")} used this month.`,
    });
    return;
  }
}

/* Insights for a fresh ledger, computed from the user's own entries */
function ownInsights() {
  const s = summary();
  if (!s.spent) return [];
  const out = [];
  const top = s.topCategories.filter((c) => c.bucket !== "savings")[0];
  if (top) out.push({ id: 1, kind: "summary", title: `${top.name} is where most of your money went`, text: `₹${top.amount.toLocaleString("en-IN")} so far this month — ${Math.round((top.amount / s.spent) * 100)}% of everything you've spent.`, tip: s.budgetTotal ? `At this pace the month ends near ₹${s.projected.toLocaleString("en-IN")} against a plan of ₹${s.budgetTotal.toLocaleString("en-IN")}.` : "Set a budget for it to get an early warning next time.", facts: { category: top.name, amount: top.amount, share_pct: Math.round((top.amount / s.spent) * 100), projected_month_end: s.projected } });
  const wantPct = Math.round((s.buckets.want / (s.buckets.need + s.buckets.want + s.buckets.savings || 1)) * 100);
  out.push({ id: 2, kind: "tip", title: wantPct > 30 ? "Wants are above the 30% guideline" : "Your wants are within the 30% guideline", text: `Wants are ${wantPct}% of what has gone out this month.`, tip: wantPct > 30 ? "Pick one want category and cap it for the rest of the month." : "Anything left in wants at month-end can go straight into a goal.", facts: { wants: s.buckets.want, needs: s.buckets.need, savings: s.buckets.savings, wants_pct: wantPct } });
  return out;
}

/* Recurring payments: same merchant, similar amount, in 3+ different months */
function detectRecurring() {
  const groups = {};
  store.txns.filter((t) => t.direction === "debit").forEach((t) => {
    const k = t.description.replace(/^(UPI|POS|NEFT|NACH|AUTOPAY|BBPS)\/(DR|CR)?\/?/i, "").toLowerCase().trim();
    (groups[k] ??= []).push(t);
  });
  return Object.entries(groups).flatMap(([k, list], i) => {
    const months = new Set(list.map((t) => t.date.slice(0, 7)));
    const avg = list.reduce((s, t) => s + t.amount, 0) / list.length;
    if (months.size < 3 || list.some((t) => Math.abs(t.amount - avg) > avg * 0.1)) return [];
    const day = Number(list[0].date.slice(8, 10));
    return [{ id: i + 1, name: k.replace(/\b\w/g, (c) => c.toUpperCase()), cadence: "monthly", amount: Math.round(avg), nextDate: day, categoryId: list[0].categoryId, color: catById[list[0].categoryId].color, usage: `Seen in ${months.size} months` }];
  });
}

const monthKey = (d) => d.slice(0, 7);
const thisMonth = () => isoDay(new Date()).slice(0, 7);

function summary(month = thisMonth()) {
  const tx = store.txns.filter((t) => monthKey(t.date) === month);
  const prevDate = new Date(month + "-01");
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prev = store.txns.filter((t) => monthKey(t.date) === isoDay(prevDate).slice(0, 7));
  const sum = (a) => a.reduce((s, t) => s + t.amount, 0);
  const debits = tx.filter((t) => t.direction === "debit");
  const income = sum(tx.filter((t) => t.direction === "credit"));
  const spent = sum(debits.filter((t) => t.bucket !== "savings"));
  const saved = sum(debits.filter((t) => t.bucket === "savings"));
  const prevSpent = sum(prev.filter((t) => t.direction === "debit" && t.bucket !== "savings"));

  const buckets = { need: 0, want: 0, savings: 0 };
  debits.forEach((t) => t.bucket in buckets && (buckets[t.bucket] += t.amount));

  const byCat = {};
  debits.forEach((t) => (byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount));
  const topCategories = Object.entries(byCat)
    .map(([id, amount]) => ({ ...catById[id], amount }))
    .sort((a, b) => b.amount - a.amount);

  // Daily cumulative spend + month-end projection (weekday-weighted run rate).
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = new Date();
  const isCurrent = month === thisMonth();
  const lastDay = isCurrent ? today.getDate() : daysInMonth;
  const daily = [];
  let cum = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${month}-${String(d).padStart(2, "0")}`;
    const dayAmt = sum(debits.filter((t) => t.date === key && t.bucket !== "savings"));
    if (d <= lastDay) cum += dayAmt;
    daily.push({ day: d, amount: d <= lastDay ? dayAmt : null, cumulative: d <= lastDay ? cum : null });
  }
  const runRate = cum / Math.max(lastDay, 1);
  daily.forEach((p) => {
    if (p.day >= lastDay) {
      const proj = cum + runRate * (p.day - lastDay);
      p.forecast = Math.round(proj);
      p.lower = Math.round(cum + runRate * 0.8 * (p.day - lastDay));
      p.upper = Math.round(cum + runRate * 1.2 * (p.day - lastDay));
    }
  });
  const projected = Math.round(cum + runRate * (daysInMonth - lastDay));
  const budgetTotal = store.budgets.filter((b) => catById[b.categoryId].bucket !== "savings").reduce((s, b) => s + b.limit, 0);

  return {
    month, income, spent, saved, prevSpent,
    left: income - spent - saved, // money in hand: total in − spending − savings
    savingsRate: income ? Math.round(((income - spent) / income) * 100) : 0,
    buckets, topCategories, daily, projected, budgetTotal,
    daysLeft: daysInMonth - lastDay,
    safeToSpend: Math.max(0, Math.round((budgetTotal - spent) / Math.max(daysInMonth - lastDay, 1))),
    reviewCount: store.txns.filter((t) => t.needsReview).length,
  };
}

function monthlyTrend(n = 6) {
  const res = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const k = isoDay(x).slice(0, 7);
    const tx = store.txns.filter((t) => monthKey(t.date) === k && t.direction === "debit");
    const by = (b) => tx.filter((t) => t.bucket === b).reduce((s, t) => s + t.amount, 0);
    res.push({ label: x.toLocaleDateString("en-IN", { month: "short" }), need: by("need"), want: by("want"), savings: by("savings") });
  }
  return res;
}

/* ── public API ── */
export const api = {
  // Auth  (POST /auth/login, /auth/register, /auth/logout)
  async login(email, password) {
    if (!USE_MOCK) return http("/auth/login", { method: "POST", body: { email, password } });
    await wait(700);
    if (!email || password.length < 6) throw new Error("Invalid email or password");
    return { accessToken: "demo-token", user: { ...db.user, email } };
  },
  async register(payload) {
    if (!USE_MOCK) return http("/auth/register", { method: "POST", body: payload });
    await wait(800);
    return { accessToken: "demo-token", user: { ...db.user, fullName: payload.fullName, email: payload.email } };
  },
  logout: () => (USE_MOCK ? wait(100) : http("/auth/logout", { method: "POST" })),

  // Dashboard  (GET /summary?month)
  summary: async (month) => (USE_MOCK ? (await wait(), summary(month)) : http(`/summary?month=${month ?? ""}`)),
  trend: async () => (USE_MOCK ? (await wait(), monthlyTrend()) : http("/summary/trend")),
  accounts: async () => (USE_MOCK ? (await wait(200), db.accounts) : http("/accounts")),

  // Transactions  (GET/POST/PATCH /transactions)
  async transactions({ q = "", bucket = "all", categoryId = "all", review = false } = {}) {
    if (!USE_MOCK) return http(`/transactions?q=${encodeURIComponent(q)}&bucket=${bucket}&category=${categoryId}&review=${review ? 1 : 0}`);
    await wait(250);
    return store.txns.filter(
      (t) =>
        (!q || t.description.toLowerCase().includes(q.toLowerCase())) &&
        (bucket === "all" || t.bucket === bucket) &&
        (categoryId === "all" || t.categoryId === Number(categoryId)) &&
        (!review || t.needsReview),
    );
  },
  async addTransaction(t) {
    if (!USE_MOCK) return http("/transactions", { method: "POST", body: t });
    await wait(400);
    const c = t.categoryId ? { categoryId: Number(t.categoryId), bucket: catById[t.categoryId].bucket, confidence: 1, classifiedBy: "user" } : categorize(t.description, store.rules);
    const row = { id: Date.now(), source: "manual", accountId: 1, needsReview: false, ...t, amount: Number(t.amount), ...c };
    store.txns.unshift(row);
    if (row.direction === "debit") checkBudgetAlerts(row.categoryId, row.date);
    save();
    return row;
  },
  async deleteTransaction(id) {
    if (!USE_MOCK) return http(`/transactions/${id}`, { method: "DELETE" });
    await wait(200);
    store.txns = store.txns.filter((t) => t.id !== id);
    save();
  },

  /* Ledger reset (DELETE /me/data?keep=budgets).  mode: "fresh" clears every entry,
     goal, alert and rule but keeps budget limits; "demo" restores the sample data. */
  ledgerMode: () => store.mode,
  async resetData(mode = "fresh") {
    if (!USE_MOCK) return http(`/me/data?mode=${mode}`, { method: "DELETE" });
    await wait(500);
    store = mode === "demo" ? demoStore() : freshStore(store.budgets);
    save();
    return store.mode;
  },
  async recategorize(id, categoryId, { createRule = true } = {}) {
    if (!USE_MOCK) return http(`/transactions/${id}`, { method: "PATCH", body: { categoryId, createRule } });
    await wait(200);
    const t = store.txns.find((x) => x.id === id);
    Object.assign(t, { categoryId, bucket: catById[categoryId].bucket, confidence: 1, classifiedBy: "user", needsReview: false });
    if (createRule) {
      const pattern = t.description.replace(/^(UPI|POS|NEFT|NACH|AUTOPAY|BBPS)\/(DR|CR)?\/?/i, "").split(/\s+/).slice(0, 2).join(" ");
      store.rules.push({ pattern, categoryId });
      store.txns.forEach((x) => x.needsReview && x.description.includes(pattern) && Object.assign(x, { categoryId, bucket: catById[categoryId].bucket, classifiedBy: "rule", confidence: 0.99, needsReview: false }));
    }
    save();
    return t;
  },

  // Ingestion  (POST /receipts, /imports/sms, /imports/statement)
  async scanReceipt(file) {
    if (!USE_MOCK) {
      const f = new FormData();
      f.append("receipt", file);
      return http("/receipts", { method: "POST", form: f });
    }
    await wait(2400);
    const items = [
      { name: "Aashirvaad Atta 5kg", qty: 1, price: 285 },
      { name: "Amul Taaza Milk 1L", qty: 3, price: 68 },
      { name: "Tata Salt 1kg", qty: 1, price: 28 },
      { name: "Surf Excel Matic 2kg", qty: 1, price: 489 },
      { name: "Fortune Sunflower Oil 1L", qty: 2, price: 165 },
      { name: "Onion (kg)", qty: 2, price: 42 },
    ];
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const cgst = +(subtotal * 0.025).toFixed(2);
    return {
      receiptId: 77,
      engine: "gemini-2.5-flash (vision)",
      latencyMs: 2380,
      merchant: "Ratnadeep Super Market",
      gstin: "36AABCR1234M1Z5",
      date: isoDay(new Date()),
      paymentMode: "UPI",
      items, subtotal, cgst, sgst: cgst,
      total: Math.round(subtotal + 2 * cgst) + 2, // deliberate ₹2 mismatch to demo validation
      categoryId: 2,
      confidence: { merchant: 0.97, date: 0.99, total: 0.81, gstin: 0.93 },
    };
  },
  parseSms: async (text) => (USE_MOCK ? (await wait(600), db.parseSms(text)) : http("/imports/sms", { method: "POST", body: { text } })),
  async importStatement(file) {
    if (!USE_MOCK) {
      const f = new FormData();
      f.append("statement", file);
      return http("/imports/statement", { method: "POST", form: f });
    }
    await wait(1800);
    return { batchId: 12, fileName: file.name, rowsTotal: 142, rowsImported: 131, rowsDuplicate: 11, autoCategorised: 118, needsReview: 13 };
  },

  // Budgets  (GET/PUT /budgets, POST /budgets/suggest)
  async budgets() {
    if (!USE_MOCK) return http("/budgets");
    await wait();
    const s = summary();
    return store.budgets.map((b) => ({ ...b, category: catById[b.categoryId], spent: s.topCategories.find((c) => c.id === b.categoryId)?.amount ?? 0 }));
  },
  async saveBudget(categoryId, limit) {
    if (!USE_MOCK) return http(`/budgets`, { method: "PUT", body: { categoryId, limit } });
    await wait(200);
    const b = store.budgets.find((x) => x.categoryId === categoryId);
    b ? (b.limit = limit) : store.budgets.push({ categoryId, limit });
    save();
  },
  suggestSplit: async () => (USE_MOCK ? (await wait(500), { need: 58, want: 25, savings: 17, rationale: "Your rent is 24% of income, so a 50% needs cap is unrealistic this year. Start at 58/25/17 and step toward 50/30/20 by trimming food delivery." }) : http("/budgets/suggest", { method: "POST" })),

  // Goals
  goals: async () => (USE_MOCK ? (await wait(), store.goals) : http("/goals")),
  async addGoal(g) {
    if (!USE_MOCK) return http("/goals", { method: "POST", body: g });
    await wait(300);
    const row = { id: Date.now(), saved: 0, emoji: "🎯", monthly: Math.round(g.target / 12), ...g, target: Number(g.target) };
    store.goals.push(row);
    save();
    return row;
  },
  async contribute(id, amount) {
    if (!USE_MOCK) return http(`/goals/${id}/contributions`, { method: "POST", body: { amount } });
    await wait(250);
    const g = store.goals.find((x) => x.id === id);
    g.saved = Math.min(g.target, g.saved + Number(amount));
    save();
    return g;
  },

  // Alerts, insights, recurring
  alerts: async () => (USE_MOCK ? (await wait(200), store.alerts) : http("/alerts")),
  async markRead(id) {
    if (!USE_MOCK) return http(`/alerts/${id ?? "read-all"}`, { method: id ? "PATCH" : "POST" });
    store.alerts.forEach((a) => (id == null || a.id === id) && (a.read = true));
    save();
  },
  insights: async () => (USE_MOCK ? (await wait(), store.mode === "demo" ? db.insights : ownInsights()) : http("/insights")),
  subscriptions: async () => (USE_MOCK ? (await wait(), store.mode === "demo" ? db.subscriptions : detectRecurring()) : http("/recurring")),

  // Assistant  (POST /assistant/chat) — backend uses tool-calling over whitelisted SQL queries
  async chat(message) {
    if (!USE_MOCK) return http("/assistant/chat", { method: "POST", body: { message } });
    await wait(1100);
    const s = summary();
    const m = message.toLowerCase();
    const top = s.topCategories.filter((c) => c.bucket !== "savings").slice(0, 3);
    if (/overspend|where|most|biggest/.test(m))
      return { text: `Your three largest spending categories this month are ${top.map((c) => `${c.name} (₹${c.amount.toLocaleString("en-IN")})`).join(", ")}. Food delivery is running ahead of budget.`, facts: Object.fromEntries(top.map((c) => [c.name, c.amount])), tool: "spend_by_category(month)" };
    if (/save|saving/.test(m))
      return { text: `You've put ₹${s.saved.toLocaleString("en-IN")} into SIPs this month. Your savings rate is ${s.savingsRate}%. Cancelling YouTube Premium and capping food delivery at ₹4,000 would lift it by about 3 points.`, facts: { saved: s.saved, savings_rate: s.savingsRate }, tool: "savings_summary(month)" };
    if (/afford|buy|can i/.test(m))
      return { text: `After your remaining planned bills you can safely spend about ₹${s.safeToSpend.toLocaleString("en-IN")} per day for the next ${s.daysLeft} days without breaking this month's budget.`, facts: { safe_to_spend_per_day: s.safeToSpend, days_left: s.daysLeft }, tool: "safe_to_spend()" };
    return { text: `This month you've spent ₹${s.spent.toLocaleString("en-IN")} against income of ₹${s.income.toLocaleString("en-IN")}. Projected month-end spend is ₹${s.projected.toLocaleString("en-IN")}.`, facts: { spent: s.spent, income: s.income, projected: s.projected }, tool: "month_summary()" };
  },

  categories: CATEGORIES,
};
