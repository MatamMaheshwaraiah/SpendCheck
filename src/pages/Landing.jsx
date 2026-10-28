import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, Lock, EyeOff, ToggleRight, Download, MessageSquareText, ScanLine, FileSpreadsheet } from "lucide-react";
import { Logo, Button, Segmented, CategoryIcon, ConfidenceDot, BucketPill, Amount } from "@/components/ui";
import { ThemeToggle } from "@/context/ThemeContext";
import ReceiptHero from "@/components/landing/ReceiptHero";
import { parseSms } from "@/data/mock";

const SMS_EXAMPLES = {
  hdfc: "Rs.450.00 debited from A/c XX4512 on 26-Oct-26 to ZOMATO via UPI Ref No 629812345671. Not you? Call 18002586161 -HDFC Bank",
  icici: "INR 1,299.00 spent on ICICI Bank Card XX7781 on 25-Oct-26 at AMAZON PAY INDIA. Avl Limit: INR 87,660.00",
  sbi: "Your A/c XX0931 is credited with Rs.4,500.00 on 24-10-26 from PIXEL STUDIO. UPI Ref 629711223344 -SBI",
};

const FEATURES = [
  ["Every label shows how sure it is", "Your own rules run first, then a dictionary of Indian merchants, then your history. The language model is only asked when those disagree, and its confidence is shown on every row."],
  ["Receipts are checked, not just read", "Line items must add up to the subtotal, CGST and SGST must reconcile with the total, and the GSTIN must be well-formed. Anything off is highlighted before it's saved."],
  ["Fix one, fix them all", "Correct a category once and SpendCheck writes a rule, so every past and future payment to that merchant follows."],
  ["Budgets that warn early", "You hear at 50%, 80% and 100% of a limit — once each, never repeatedly — and a month-end estimate tells you if this pace will overshoot."],
  ["Subscriptions you forgot about", "Debits that repeat on a cycle are grouped, totalled per year, and flagged a few days before they renew."],
  ["Goals with an honest date", "Each goal shows when you'll reach it at your current saving rate, not when you hoped to."],
];

const COMPARE = [
  ["Works without typing every expense", "no", "some", "yes"],
  ["Reads paper receipts and GST", "no", "some", "yes"],
  ["Imports UPI and bank SMS", "no", "yes", "yes"],
  ["Splits spending into needs and wants", "no", "no", "yes"],
  ["Explains insights with the numbers behind them", "no", "no", "yes"],
  ["Estimates where the month will end", "no", "no", "yes"],
  ["Export and permanent deletion", "some", "no", "yes"],
];
const Mark = ({ v }) => v === "yes" ? <Check className="mx-auto size-[18px] text-mint-400" /> : v === "no" ? <Minus className="mx-auto size-[18px] text-ink-500" /> : <span className="text-xs text-ink-300">Partly</span>;

function SmsDemo() {
  const [bank, setBank] = useState("hdfc");
  const [text, setText] = useState(SMS_EXAMPLES.hdfc);
  const row = useMemo(() => parseSms(text)[0], [text]);
  return (
    <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
      <div>
        <Segmented value={bank} onChange={(b) => { setBank(b); setText(SMS_EXAMPLES[b]); }} options={[{ value: "hdfc", label: "HDFC" }, { value: "icici", label: "ICICI card" }, { value: "sbi", label: "SBI credit" }]} />
        <label className="label mt-5" htmlFor="sms-demo">Bank message — edit it and watch the result change</label>
        <textarea id="sms-demo" value={text} onChange={(e) => setText(e.target.value)} rows={5}
          className="field resize-none rounded-2xl rounded-bl-md bg-white/[0.04] font-[Geist_Mono,ui-monospace,monospace] text-[13px] leading-relaxed" />
      </div>
      <div className="lg:pt-[3.6rem]">
        <p className="label">What SpendCheck records</p>
        {row?.ok ? (
          <div key={text.length} className="card animate-pop p-5">
            <div className="flex items-center gap-3">
              <CategoryIcon category={row.category} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.merchant.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                <p className="text-sm text-ink-400">{row.category.name}</p>
              </div>
              <Amount value={row.amount} direction={row.direction} className="text-xl font-medium" />
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-4 text-sm">
              <div><dt className="text-xs text-ink-400">Account</dt><dd className="num mt-0.5">{row.last4 ? `••${row.last4}` : "—"}</dd></div>
              <div><dt className="text-xs text-ink-400">Bucket</dt><dd className="mt-0.5"><BucketPill bucket={row.direction === "credit" ? "none" : row.bucket} /></dd></div>
              <div><dt className="text-xs text-ink-400">Confidence</dt><dd className="mt-0.5"><ConfidenceDot value={row.confidence} /></dd></div>
            </dl>
          </div>
        ) : (
          <div className="card p-5 text-sm text-ink-400">No amount found yet. A bank alert usually contains “Rs”, “INR” or “₹” followed by the amount.</div>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="overflow-x-clip">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--line)] bg-ink-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" aria-label="SpendCheck home"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-sm text-ink-300 md:flex">
            <a href="#how" className="hover:text-ink-50">How it works</a>
            <a href="#features" className="hover:text-ink-50">Features</a>
            <a href="#compare" className="hover:text-ink-50">Compare</a>
            <a href="#privacy" className="hover:text-ink-50">Privacy</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <span className="hidden sm:block"><Button as={Link} to="/login" variant="ghost" size="sm">Log in</Button></span>
            <Button as={Link} to="/register" size="sm">Start free</Button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pb-28 pt-28 sm:pt-36">
        <div className="mx-auto grid max-w-[1240px] items-center gap-20 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10 [&>*]:min-w-0">
          <div className="animate-rise">
            <h1 className="font-display text-[3.3rem] leading-[0.98] sm:text-[4.8rem] lg:text-[5.6rem]" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1', fontWeight: 400 }}>
              Every rupee,<br />accounted for.
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-300">
              Photograph a bill, paste a bank SMS or drop in a statement. SpendCheck files each payment as a need, a want or savings — and tells you in plain words what to change before the month runs out.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button as={Link} to="/register" size="lg">Create a free account</Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">Explore the demo</Button>
            </div>
            <p className="mt-8 text-sm text-ink-400">Reads UPI and card alerts from HDFC, SBI, ICICI, Kotak and Axis. No bank login needed.</p>
          </div>
          <ReceiptHero />
        </div>
      </section>

      {/* ── Live demo ────────────────────────────────────────── */}
      <section id="how" className="border-t border-[var(--line)] bg-ink-850 py-24 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.6fr] [&>*]:min-w-0">
            <div>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">Most of your spending never prints a receipt.</h2>
              <p className="mt-5 text-ink-300">UPI payments leave a trail in your messages instead. Paste one and SpendCheck pulls out the amount, merchant, account and reference, then files it.</p>
              <ul className="mt-8 space-y-3 text-sm text-ink-300">
                <li className="flex items-center gap-3"><MessageSquareText className="size-4 text-ink-400" strokeWidth={1.75} />Bank and UPI messages</li>
                <li className="flex items-center gap-3"><ScanLine className="size-4 text-ink-400" strokeWidth={1.75} />Photos of bills and invoices</li>
                <li className="flex items-center gap-3"><FileSpreadsheet className="size-4 text-ink-400" strokeWidth={1.75} />Statements as CSV, Excel or PDF</li>
              </ul>
            </div>
            <SmsDemo />
          </div>
        </div>
      </section>

      {/* ── Features: editorial list, not a card grid ────────── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.6fr]">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl lg:sticky lg:top-28 lg:self-start">Automatic where it helps. Yours to correct everywhere else.</h2>
          <dl className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {FEATURES.map(([t, b]) => (
              <div key={t} className="grid gap-2 py-7 sm:grid-cols-[1fr_1.5fr] sm:gap-10">
                <dt className="font-display text-[1.35rem] leading-snug">{t}</dt>
                <dd className="leading-relaxed text-ink-300">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── AI note example ──────────────────────────────────── */}
      <section className="border-y border-[var(--line)] bg-ink-850 py-24 sm:py-28">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
          <figure>
            <p className="text-sm text-iris-300"><span className="mr-1.5 text-iris-500">✳</span>A note SpendCheck wrote for Priya in October</p>
            <blockquote className="ai-voice mt-6 text-[2rem] leading-[1.25] sm:text-[2.6rem]">
              You ordered food 19 times this month, mostly after 10 pm. Stopping at 9:30 on weeknights would leave about ₹1,700 for your Goa trip.
            </blockquote>
          </figure>
          <div className="card p-6">
            <p className="font-display text-xl">The numbers behind that sentence</p>
            <p className="mt-1 text-sm text-ink-400">Calculated from Priya's transactions first. The AI only puts them into words.</p>
            <dl className="mt-5 divide-y divide-[var(--line)] text-sm">
              {[["Food delivery orders", "19"], ["Spent on food delivery", "₹6,240"], ["Three-month average", "₹4,520"], ["Orders after 10 pm", "14"], ["Estimated saving", "₹1,700"]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5"><dt className="text-ink-300">{k}</dt><dd className="num font-medium">{v}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Compare ──────────────────────────────────────────── */}
      <section id="compare" className="py-24 sm:py-32">
        <div className="mx-auto max-w-[980px] px-5 sm:px-8">
          <h2 className="font-display text-4xl sm:text-5xl">Compared with what you use now</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[600px] text-[15px]">
              <thead>
                <tr className="border-b border-[var(--line-strong)] text-left text-sm text-ink-400">
                  <th className="py-3 pr-4 font-normal" />
                  <th className="w-32 py-3 text-center font-normal">Notebook or Excel</th>
                  <th className="w-32 py-3 text-center font-normal">Typical tracker app</th>
                  <th className="w-32 py-3 text-center font-display text-base text-ink-50">SpendCheck</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, ...vals]) => (
                  <tr key={label} className="border-b border-[var(--line)]">
                    <td className="py-4 pr-4 text-ink-200">{label}</td>
                    {vals.map((v, i) => <td key={i} className="py-4 text-center"><Mark v={v} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Privacy ──────────────────────────────────────────── */}
      <section id="privacy" className="border-t border-[var(--line)] py-24 sm:py-28">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.6fr]">
          <div>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">Your money data stays yours.</h2>
            <p className="mt-5 text-ink-300">Built around India's Digital Personal Data Protection Act: consent for each purpose, and you can take your data with you or erase it.</p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {[
              [Lock, "Encrypted at rest", "Notes, phone numbers and receipt text are encrypted with AES-256-GCM."],
              [EyeOff, "Names never reach the AI", "Personal names and account numbers are removed before any model sees a transaction."],
              [ToggleRight, "Consent you can change", "Switch off AI processing or receipt storage at any time in Settings."],
              [Download, "Leave whenever you like", "Download everything as CSV or JSON, or delete your account permanently."],
            ].map(([Icon, t, b]) => (
              <li key={t}>
                <Icon className="size-5 text-mint-400" strokeWidth={1.75} />
                <p className="mt-3 font-medium">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-400">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────── */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-[1240px] rounded-[2rem] bg-ink-50 px-8 py-16 text-ink-900 sm:px-16 sm:py-20">
          <h2 className="max-w-3xl font-display text-[2.6rem] leading-[1.05] sm:text-[4rem]" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1', fontWeight: 400 }}>Start this month's ledger tonight.</h2>
          <p className="mt-5 max-w-lg text-ink-500">Two minutes to set up. Try it with demo data first if you'd rather not add your own yet.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button as={Link} to="/register" size="lg" className="bg-ink-900 text-ink-50 hover:bg-ink-800">Create a free account</Button>
            <Button as={Link} to="/login" size="lg" variant="ghost" className="text-ink-700 hover:bg-ink-900/[0.07] hover:text-ink-900">Explore the demo</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] py-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <p>A final-year project extending “SpendCheck” (IEEE GSEACT 2026).</p>
        </div>
      </footer>
    </div>
  );
}
