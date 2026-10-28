import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ScanLine, RotateCcw, MessageSquareText, FileSpreadsheet } from "lucide-react";
import QuickAdd from "@/components/QuickAdd";
import ResetDialog from "@/components/ResetDialog";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, Amount, Delta, Progress, CategoryIcon, Skeleton, AIBadge, Button, BucketPill } from "@/components/ui";
import { SpendAreaChart, StackedBars, LedgerBar } from "@/components/charts";
import { BUCKETS, catById } from "@/data/categories";
import { formatINR, formatDate, pct } from "@/lib/format";

const clean = (d) => d.replace(/^(UPI|POS|NEFT|NACH|AUTOPAY|BBPS)\/(DR|CR)?\/?/i, "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function Dashboard() {
  const { user } = useAuth();
  const [v, setV] = useState(0); // bump to refetch everything after an add / reset
  const [resetOpen, setResetOpen] = useState(false);
  const refresh = () => setV((x) => x + 1);
  const s = useApi(() => api.summary(), [v]);
  const trend = useApi(() => api.trend(), [v]);
  const budgets = useApi(() => api.budgets(), [v]);
  const recent = useApi(() => api.transactions(), [v]);
  const insights = useApi(() => api.insights(), [v]);
  const subs = useApi(() => api.subscriptions(), [v]);

  const d = s.data;
  if (!d || !recent.data) return <DashboardSkeleton />;
  const reset = <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} onDone={refresh} />;
  if (!recent.data.length) return <><FreshLedger onChange={refresh} onRestore={() => setResetOpen(true)} name={user?.fullName?.split(" ")[0]} />{reset}</>;
  const change = d.prevSpent ? Math.round(((d.spent - d.prevSpent) / d.prevSpent) * 100) : 0;
  const outflow = d.buckets.need + d.buckets.want + d.buckets.savings || 1;
  const today = new Date().getDate();
  const upcoming = (subs.data ?? []).map((x) => ({ ...x, inDays: (x.nextDate - today + 31) % 31 })).sort((a, b) => a.inDays - b.inDays).slice(0, 4);
  const month = new Date().toLocaleDateString("en-IN", { month: "long" });
  const nextDue = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };

  return (
    <div className="space-y-10">
      {/* ── Statement ───────────────────────────────────────── */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="font-display text-[2.6rem] leading-none sm:text-[3.4rem]">{month}, so far</h1>
          <div className="flex items-center gap-3 text-sm text-ink-400">
            <span>Hi {user?.fullName?.split(" ")[0]} — {d.daysLeft} days until payday</span>
            <button onClick={() => setResetOpen(true)} className="pressable flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 py-1 text-ink-300 hover:text-ink-50"><RotateCcw className="size-3.5" />Start fresh</button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
          {/* Money left = total in − spent − saved */}
          <Card className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-sm text-ink-400">{d.left >= 0 ? "Money left this month" : "Overspent this month"}</p>
              <Amount value={Math.abs(d.left)} animate className={`money-xl mt-2 block text-[3.4rem] sm:text-[4.8rem] ${d.left < 0 ? "text-danger" : ""}`} />
              <p className="mt-3 max-w-md text-sm text-ink-400">
                {!d.income ? "Add your salary as money in to see what's left."
                  : d.left >= 0 ? <>That's about <Amount value={d.left / Math.max(d.daysLeft, 1)} className="text-ink-100" /> a day for the {d.daysLeft} days until payday.</>
                  : "More has gone out than came in. Check the biggest categories below."}
              </p>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-5">
              <div><dt className="text-xs text-ink-400 sm:text-sm">Spent</dt><dd className="mt-1 text-lg font-medium sm:text-xl"><Amount value={d.spent} /></dd>{d.prevSpent > 0 && <dd className="mt-0.5"><Delta value={change} suffix="" /></dd>}</div>
              <div><dt className="text-xs text-ink-400 sm:text-sm">Safe to spend</dt><dd className="mt-1 text-lg font-medium sm:text-xl"><Amount value={d.safeToSpend} /><span className="text-sm font-normal text-ink-400">/day</span></dd></div>
              <div><dt className="text-xs text-ink-400 sm:text-sm">Savings rate</dt><dd className="num mt-1 text-lg font-medium sm:text-xl">{d.savingsRate}%</dd></div>
            </dl>
          </Card>

          <Card className="p-6 sm:p-8">
            <p className="font-display text-[1.3rem]">How it adds up</p>
            <dl className="mt-5 text-[15px]">
              {[
                ["Money in", "+", d.income, "text-success"],
                ["Spent", "−", d.spent, "text-ink-50"],
                ["Saved & invested", "−", d.saved, "text-ink-50"],
              ].map(([k, op, v, c]) => (
                <div key={k} className="flex items-center justify-between border-b border-[var(--line)] py-3">
                  <dt className="flex items-center gap-3 text-ink-300"><span className="num grid size-6 place-items-center rounded-full border border-[var(--line-strong)] text-sm text-ink-400">{op}</span>{k}</dt>
                  <dd className={c}><Amount value={v} className="font-medium" /></dd>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-[3px] border-double border-[var(--line-strong)] pt-4">
                <dt className="flex items-center gap-3 font-medium"><span className="num grid size-6 place-items-center rounded-full bg-ink-50 text-sm text-ink-900">=</span>Left in hand</dt>
                <dd className={d.left < 0 ? "text-danger" : "text-mint-400"}><Amount value={d.left} className="text-xl font-semibold" /></dd>
              </div>
            </dl>
            {d.income > 0 && (
              <div className="mt-6">
                <Progress value={d.spent + d.saved} max={d.income} color={d.left < 0 ? "var(--color-danger)" : "var(--color-ink-300)"} />
                <p className="mt-2 text-xs text-ink-400"><span className="num">{Math.min(100, Math.round(((d.spent + d.saved) / d.income) * 100))}%</span> of this month's money in has gone out</p>
              </div>
            )}
          </Card>
        </div>

        <Card className="mt-5 p-6 pb-7 sm:p-8">
          <p className="mb-5 font-display text-[1.3rem]">Where it went</p>
          <LedgerBar income={d.income} buckets={d.buckets} />
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {Object.entries(BUCKETS).map(([k, b]) => {
              const p = pct(d.buckets[k], outflow);
              const off = k === "savings" ? p < b.target : p > b.target;
              return (
                <div key={k} className="flex items-center gap-2.5 text-sm">
                  <i className="size-2.5 rounded-full" style={{ background: b.color }} />
                  <span className="text-ink-200">{b.label}</span>
                  <Amount value={d.buckets[k]} className="text-ink-50" />
                  <span className={`num text-xs ${off ? "text-warning" : "text-ink-400"}`}>{p}% · aim {b.target}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        {d.reviewCount > 0 && (
          <Link to="/app/transactions?review=1" className="group mt-8 flex items-center gap-3 border-t border-[var(--line)] pt-5 text-sm text-ink-300 hover:text-ink-50">
            <span className="num grid size-6 place-items-center rounded-full bg-warning/15 text-xs font-medium text-warning">{d.reviewCount}</span>
            transactions weren't confidently categorised. Two minutes to review them makes next month's labels more accurate.
            <ArrowUpRight className="ml-auto size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        )}
      </section>

      {/* ── Quick entry ─────────────────────────────────────── */}
      <section aria-labelledby="qa-h">
        <h2 id="qa-h" className="mb-3 font-display text-[1.3rem]">Add an entry</h2>
        <QuickAdd onChange={refresh} />
      </section>

      {/* ── Chart + AI note ─────────────────────────────────── */}
      <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader title="Daily running total" subtitle="Dotted line is where you'll land if this pace holds"
            action={<div className="text-right"><p className="text-xs text-ink-400">Month-end estimate</p><Amount value={d.projected} className={`text-lg font-medium ${d.projected > d.budgetTotal ? "text-warning" : "text-mint-300"}`} /></div>} />
          <SpendAreaChart data={d.daily} budget={d.budgetTotal} />
        </Card>

        <Card ai className="flex flex-col">
          <AIBadge />
          {insights.data && !insights.data.length ? (
            <p className="ai-voice mt-5 text-[1.35rem] leading-snug text-ink-300">Add a few more entries and I'll tell you what stands out.</p>
          ) : insights.data ? (
            <>
              <p className="ai-voice mt-5 text-[1.45rem] leading-snug text-ink-50">{insights.data[0].title}.</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-300">{insights.data[0].text}</p>
              <p className="mt-4 border-l-2 border-iris-500 pl-3 text-[15px] text-ink-100">{insights.data[0].tip}</p>
              <div className="mt-auto pt-6"><Button as={Link} to="/app/insights" variant="secondary" size="sm">Ask a question about your money</Button></div>
            </>
          ) : <Skeleton className="mt-5 h-40" />}
        </Card>
      </section>

      {/* ── Budgets + renewals ──────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Budgets closest to the limit" action={<Link to="/app/budgets" className="text-sm text-ink-300 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-ink-50">All budgets</Link>} />
          <div className="space-y-5">
            {(budgets.data ?? []).filter((b) => b.category.bucket !== "savings").sort((a, b) => b.spent / b.limit - a.spent / a.limit).slice(0, 5).map((b, i) => (
              <div key={b.categoryId}>
                <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink-100">{b.category.name}</span>
                  <span className="text-xs text-ink-400"><Amount value={b.spent} className="text-sm text-ink-50" /> of <Amount value={b.limit} /></span>
                </div>
                <Progress value={b.spent} max={b.limit} delay={i * 90} />
              </div>
            ))}
            {!budgets.data && <Skeleton className="h-44" />}
          </div>
        </Card>

        <Card>
          <CardHeader title="Coming out of your account" subtitle="Detected recurring payments" action={<Link to="/app/subscriptions" className="text-sm text-ink-300 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-ink-50">All</Link>} />
          <ul className="divide-y divide-[var(--line)]">
            {!upcoming.length && <li className="py-4 text-sm text-ink-400">Nothing recurring yet. Payments that repeat for three months show up here.</li>}
            {upcoming.map((x) => {
              const due = nextDue(x.inDays);
              return (
                <li key={x.id} className="flex items-center gap-4 py-3">
                  <div className="w-11 text-center">
                    <p className="font-display text-xl leading-none">{due.getDate()}</p>
                    <p className="text-[11px] text-ink-400">{due.toLocaleDateString("en-IN", { month: "short" })}</p>
                  </div>
                  <div className="flex-1"><p className="text-sm font-medium">{x.name}</p><p className="text-xs text-ink-400">{x.inDays === 0 ? "Today" : `In ${x.inDays} days`}</p></div>
                  <Amount value={x.amount} className="text-sm" />
                </li>
              );
            })}
          </ul>
          <Link to="/app/add?tab=receipt" className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-[var(--line-strong)] px-4 py-3 text-sm text-ink-300 transition hover:border-iris-500/50 hover:text-ink-50">
            <ScanLine className="size-4 text-iris-500" />Paid in cash? Photograph the bill to add it.
          </Link>
        </Card>
      </section>

      {/* ── Ledger + trend ──────────────────────────────────── */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="px-0 sm:px-0">
          <div className="px-5 sm:px-6"><CardHeader title="Latest entries" action={<Link to="/app/transactions" className="text-sm text-ink-300 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-ink-50">Full ledger</Link>} /></div>
          <ul>
            {(recent.data ?? []).slice(0, 7).map((t) => (
              <li key={t.id} className="flex items-center gap-3 border-t border-[var(--line)] px-5 py-3 sm:px-6">
                <CategoryIcon category={catById[t.categoryId]} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{clean(t.description)}</p>
                  <p className="text-xs text-ink-400">{formatDate(t.date)}, {catById[t.categoryId].name}</p>
                </div>
                <div className="hidden w-16 sm:block"><BucketPill bucket={t.bucket} /></div>
                <Amount value={t.amount} direction={t.direction} className="w-24 text-right text-sm font-medium" />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          {reset}
          <CardHeader title="Six months" subtitle="Needs, wants and savings each month" />
          {trend.data ? (
            <StackedBars data={trend.data} keys={[{ key: "need", label: "Needs", color: "var(--color-need)" }, { key: "want", label: "Wants", color: "var(--color-want)" }, { key: "savings", label: "Savings", color: "var(--color-save)" }]} />
          ) : <Skeleton className="h-56" />}
        </Card>
      </section>
    </div>
  );
}

/* Empty ledger: one clear job — add the first entry */
function FreshLedger({ onChange, onRestore, name }) {
  const month = new Date().toLocaleDateString("en-IN", { month: "long" });
  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-12">
      <p className="text-sm text-ink-400">{month}, a fresh ledger{name ? ` for ${name}` : ""}</p>
      <h1 className="mt-3 font-display text-[3rem] leading-[1] sm:text-[4.4rem]" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1', fontWeight: 400 }}>A clean page.</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-300">Start with this month's salary as money in, then add what you've spent. Each entry is filed as a need, a want or savings as you type.</p>
      <div className="mt-10"><QuickAdd onChange={onChange} large /></div>
      <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        {[
          [ScanLine, "Photograph a bill", "Items, GST and total are read for you", "/app/add?tab=receipt"],
          [MessageSquareText, "Paste bank messages", "Add a week of UPI alerts at once", "/app/add?tab=sms"],
          [FileSpreadsheet, "Upload a statement", "Bring in last month from net banking", "/app/add?tab=statement"],
        ].map(([Icon, t, b, to]) => (
          <Link key={t} to={to} className="group bg-[var(--surface-card)] p-5 transition-colors hover:bg-[var(--surface-raised)]">
            <Icon className="size-5 text-ink-400 transition-colors group-hover:text-ink-50" strokeWidth={1.75} />
            <p className="mt-4 font-medium">{t}</p>
            <p className="mt-1 text-sm text-ink-400">{b}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-400">
        Just exploring?{" "}
        <button onClick={onRestore} className="text-ink-100 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-ink-50">Load the sample data</button>
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-14 w-80" />
      <Skeleton className="h-24 w-96 max-w-full" />
      <Skeleton className="h-3.5 w-full rounded-full" />
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
    </div>
  );
}
