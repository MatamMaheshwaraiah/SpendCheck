// Deterministic demo dataset: a Hyderabad early-career profile, ~6 months of history.
// Shapes match the planned MySQL tables so the swap to the real API is 1:1.
import { categorize, catById } from "./categories";
import { isoDay } from "@/lib/format";

let seed = 20260612;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rand() * a.length)];
const between = (a, b) => Math.round(a + rand() * (b - a));

export const user = {
  id: 1,
  fullName: "Ashok Kollam",
  email: "ashok@spendcheck.app",
  monthlyIncome: 68000,
  currency: "INR",
  budgetRule: "50_30_20",
  plan: "Student Pro",
};

export const accounts = [
  { id: 1, name: "HDFC Savings", type: "bank", institution: "HDFC Bank", last4: "4512", balance: 84250 },
  { id: 2, name: "SBI Salary", type: "bank", institution: "State Bank of India", last4: "0931", balance: 21780 },
  { id: 3, name: "ICICI Amazon Pay", type: "credit_card", institution: "ICICI Bank", last4: "7781", balance: -12340 },
  { id: 4, name: "Cash Wallet", type: "cash", institution: null, last4: null, balance: 3200 },
];

const DAILY = [
  ["UPI/DR/SWIGGY BANGALORE", 180, 640],
  ["UPI/DR/ZOMATO LTD", 220, 780],
  ["UPI/DR/BLINKIT COMMERCE", 140, 920],
  ["UPI/DR/ZEPTO MARKETPLACE", 120, 650],
  ["UPI/DR/RAPIDO BIKE TAXI", 45, 180],
  ["UPI/DR/UBER INDIA", 160, 520],
  ["UPI/DR/CHAI POINT", 40, 160],
  ["UPI/DR/RATNADEEP SUPERMARKET", 380, 1850],
  ["UPI/DR/HYD METRO RAIL", 30, 75],
  ["POS/AMAZON SELLER SERVICES", 299, 3499],
  ["UPI/DR/MEDPLUS PHARMACY", 90, 860],
  ["UPI/DR/PARADISE BIRYANI", 420, 1380],
  ["POS/MYNTRA DESIGNS", 699, 2999],
  ["UPI/DR/INDIAN OIL PETROL", 300, 900],
  ["UPI/DR/RAMESH KIRANA STORE", 60, 420],
  ["UPI/DR/PVR INOX LTD", 380, 980],
  ["UPI/DR/STARBUCKS HITECH", 290, 640],
  ["UPI/DR/9849XXXX21@YBL", 100, 800],
];

const MONTHLY = [
  [1, "NEFT/DR/RENT - SRINIVAS PROPERTIES", 16000],
  [2, "NACH/DR/ZERODHA COIN SIP", 5000],
  [3, "BBPS/TSSPDCL ELECTRICITY", null],
  [5, "NACH/DR/HDFC MF SIP", 3000],
  [6, "AUTOPAY/AIRTEL POSTPAID", 699],
  [7, "AUTOPAY/NETFLIX.COM", 649],
  [8, "AUTOPAY/SPOTIFY INDIA", 119],
  [12, "AUTOPAY/ACT FIBERNET", 1059],
  [15, "AUTOPAY/AMAZON PRIME", 299],
  [18, "AUTOPAY/YOUTUBE PREMIUM", 149],
  [20, "UPI/DR/COURSERA INC", 0],
];

function build() {
  const out = [];
  let id = 1000;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const day = d.getDate();
    const date = isoDay(d);
    const festive = d.getMonth() === 9 || d.getMonth() === 10; // Dussehra/Diwali spike
    if (day === 1) out.push({ id: id++, date, description: "NEFT/CR/SALARY ACME TECHNOLOGIES PVT LTD", amount: 68000, direction: "credit", accountId: 2, source: "statement" });
    if (day === 22 && rand() > 0.5) out.push({ id: id++, date, description: "UPI/CR/FREELANCE - PIXEL STUDIO", amount: between(3000, 9000), direction: "credit", accountId: 1, source: "sms" });
    for (const [dom, desc, amt] of MONTHLY) {
      if (day !== dom || amt === 0) continue;
      out.push({ id: id++, date, description: desc, amount: amt ?? between(780, 1650), direction: "debit", accountId: dom === 1 ? 2 : 1, source: "statement" });
    }
    const r = rand();
    const n = r < 0.3 ? 0 : r < 0.8 ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const [desc, lo, hi] = pick(DAILY);
      out.push({ id: id++, date, description: desc, amount: between(lo, festive ? hi * 1.2 : hi), direction: "debit", accountId: pick([1, 1, 3, 4]), source: pick(["sms", "sms", "statement", "receipt", "manual"]) });
    }
  }
  return out
    .map((t) => {
      const c = categorize(t.description);
      return { ...t, categoryId: c.categoryId, bucket: t.direction === "credit" ? "none" : c.bucket, confidence: c.confidence, classifiedBy: c.classifiedBy, needsReview: t.direction === "debit" && c.confidence < 0.75 };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const transactions = build();

export const budgets = [
  { categoryId: 1, limit: 16000 },
  { categoryId: 2, limit: 6000 },
  { categoryId: 3, limit: 3500 },
  { categoryId: 4, limit: 3500 },
  { categoryId: 5, limit: 2000 },
  { categoryId: 7, limit: 4000 },
  { categoryId: 8, limit: 3000 },
  { categoryId: 9, limit: 5000 },
  { categoryId: 10, limit: 2000 },
  { categoryId: 12, limit: 8000 },
];

export const goals = [
  { id: 1, name: "Emergency fund", emoji: "🛟", target: 200000, saved: 126500, targetDate: "2027-03-31", monthly: 15000 },
  { id: 2, name: "MacBook Air M5", emoji: "💻", target: 115000, saved: 41200, targetDate: "2027-06-30", monthly: 6000 },
  { id: 3, name: "Goa trip with friends", emoji: "🏖️", target: 35000, saved: 29800, targetDate: "2026-12-20", monthly: 5200 },
  { id: 4, name: "GATE coaching fee", emoji: "🎓", target: 48000, saved: 12000, targetDate: "2027-01-15", monthly: 5000 },
];

export const subscriptions = [
  { id: 1, name: "Netflix", cadence: "monthly", amount: 649, nextDate: 7, categoryId: 10, color: "#e50914", usage: "Low use · 2 hrs last month" },
  { id: 2, name: "Amazon Prime", cadence: "monthly", amount: 299, nextDate: 15, categoryId: 10, color: "#00a8e1", usage: "Used for delivery" },
  { id: 3, name: "Spotify", cadence: "monthly", amount: 119, nextDate: 8, categoryId: 10, color: "#1db954", usage: "Daily use" },
  { id: 4, name: "YouTube Premium", cadence: "monthly", amount: 149, nextDate: 18, categoryId: 10, color: "#ff0033", usage: "Overlaps with Spotify" },
  { id: 5, name: "Airtel Postpaid", cadence: "monthly", amount: 699, nextDate: 6, categoryId: 3, color: "#e40000", usage: "Essential" },
  { id: 6, name: "ACT Fibernet", cadence: "monthly", amount: 1059, nextDate: 12, categoryId: 3, color: "#f7941d", usage: "Essential" },
];

export const alerts = [
  { id: 1, type: "budget_80", severity: "warning", title: "Food Delivery at 86% of budget", body: "₹3,440 of ₹4,000 used with 4 days left. At this pace you'll cross the limit by the 29th.", time: "2h ago", read: false, link: "/app/budgets" },
  { id: 2, type: "anomaly", severity: "critical", title: "Unusual spend: Myntra ₹4,560", body: "That's 3.8× your typical Shopping transaction. Was this you?", time: "Yesterday", read: false, link: "/app/transactions" },
  { id: 3, type: "renewal", severity: "info", title: "Netflix renews in 3 days", body: "₹649 will be auto-debited from HDFC ••4512 on 7 Nov.", time: "Yesterday", read: false, link: "/app/subscriptions" },
  { id: 4, type: "goal", severity: "info", title: "Goa trip goal is 85% funded", body: "₹5,200 more and you're there — 2 months ahead of schedule.", time: "3 days ago", read: true, link: "/app/goals" },
  { id: 5, type: "forecast_overrun", severity: "warning", title: "Month-end projection exceeds plan", body: "Projected spend ₹49,800 vs plan ₹47,600 (+4.6%). Wants are the main driver.", time: "4 days ago", read: true, link: "/app/insights" },
];

export const insights = [
  { id: 1, kind: "summary", title: "Food delivery is your fastest-growing category", text: "You ordered 19 times this month (₹6,240), 38% above your 3-month average of ₹4,520. Most orders land between 10 pm and midnight.", tip: "Set a weekday cut-off at 9:30 pm and batch weekend orders — this alone saves ≈₹1,700/month.", facts: { this_month: 6240, avg_3m: 4520, change_pct: 38, orders: 19 } },
  { id: 2, kind: "tip", title: "Two music subscriptions overlap", text: "Spotify (₹119) and YouTube Premium (₹149) both cover music streaming. You played Spotify 41 times vs YouTube Music 3 times in October.", tip: "Cancelling YouTube Premium saves ₹1,788 a year.", facts: { spotify_plays: 41, ytm_plays: 3, annual_saving: 1788 } },
  { id: 3, kind: "anomaly", title: "Festive spending is on track", text: "Shopping is up 42% for Diwali, but you're still within your Wants bucket thanks to lower travel spend.", tip: "Move the ₹2,100 left in Travel into your Goa trip goal.", facts: { shopping_change: 42, travel_left: 2100 } },
];

/* Parses Indian bank / UPI SMS alerts → transaction drafts (client-side, regex stage). */
export function parseSms(text) {
  return text
    .split(/\n\s*\n|\n(?=[A-Z]{2}-)/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((sms) => {
      const amt = sms.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
      const debit = /debited|spent|paid|sent|withdrawn|dr\b/i.test(sms);
      const credit = /credited|received|deposited|cr\b/i.test(sms);
      const to = sms.match(/(?:to|at|trf to|towards)\s+([A-Za-z0-9 .&@_-]{3,40}?)(?:\s+on|\s+ref|\.|,|\s+upi|$)/i);
      const from = sms.match(/(?:from|by)\s+([A-Za-z0-9 .&@_-]{3,40}?)(?:\s+on|\s+ref|\.|,|$)/i);
      const date = sms.match(/(\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
      const ref = sms.match(/(?:ref(?:\s*no)?|upi ref|rrn)[:.\s]*([0-9]{6,16})/i);
      const acct = sms.match(/(?:a\/c|ac|acct|card)\s*(?:no\.?)?\s*[xX*]*(\d{3,4})/i);
      const merchant = ((debit ? to?.[1] : from?.[1]) || "Unknown").replace(/\s+(via|using|thru|through)$/i, "").trim();
      const isCredit = credit && !debit;
      const c = isCredit
        ? { categoryId: /salary/i.test(sms) ? 13 : 14, bucket: "none", confidence: 0.95, classifiedBy: "dictionary" }
        : categorize(merchant + " " + sms);
      return {
        raw: sms,
        ok: Boolean(amt),
        amount: amt ? Number(amt[1].replace(/,/g, "")) : 0,
        direction: isCredit ? "credit" : "debit",
        merchant,
        date: date?.[1] ?? "Today",
        ref: ref?.[1] ?? null,
        last4: acct?.[1] ?? null,
        ...c,
        category: catById[c.categoryId],
      };
    });
}

export const SAMPLE_SMS = `Rs.450.00 debited from A/c XX4512 on 26-Oct-26 to SWIGGY via UPI Ref No 629812345671. Not you? Call 18002586161 -HDFC Bank

Dear Customer, INR 1,299.00 spent on ICICI Bank Card XX7781 on 25-Oct-26 at AMAZON PAY INDIA. Avl Limit: INR 87,660.00

Your A/c XX0931 is credited with Rs.4,500.00 on 24-10-26 from PIXEL STUDIO. UPI Ref 629711223344 -SBI

Rs 260 sent to RAMESH KIRANA on 26-10-26. UPI Ref 629855566677 -Kotak`;
