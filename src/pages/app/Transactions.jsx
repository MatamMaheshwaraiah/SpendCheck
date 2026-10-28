import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Download, Plus, Filter, ChevronDown } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { PageHeader, Card, Button, Amount, CategoryIcon, BucketPill, ConfidenceDot, Badge, Skeleton, EmptyState, Segmented, Modal } from "@/components/ui";
import { CATEGORIES, catById } from "@/data/categories";
import { formatDate, formatINR } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

const clean = (d) => d.replace(/^(UPI|POS|NEFT|NACH|AUTOPAY|BBPS)\/(DR|CR)?\/?/i, "");
const title = (d) => clean(d).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const SOURCE = { sms: "SMS", statement: "Statement", receipt: "Receipt", manual: "Manual" };
const BY = { rule: "Your rule", dictionary: "Merchant dictionary", knn: "Your history", llm: "LLM fallback", user: "You" };

export default function Transactions() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [bucket, setBucket] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const review = params.get("review") === "1";
  const [editing, setEditing] = useState(null);
  const [limit, setLimit] = useState(40);

  const { data, loading, reload } = useApi(() => api.transactions({ q, bucket, categoryId, review }), [q, bucket, categoryId, review]);

  const groups = useMemo(() => {
    const g = {};
    (data ?? []).slice(0, limit).forEach((t) => (g[t.date] ??= []).push(t));
    return Object.entries(g);
  }, [data, limit]);

  const totals = useMemo(() => {
    const d = (data ?? []).filter((t) => t.direction === "debit").reduce((s, t) => s + t.amount, 0);
    const c = (data ?? []).filter((t) => t.direction === "credit").reduce((s, t) => s + t.amount, 0);
    return { d, c, n: data?.length ?? 0 };
  }, [data]);

  async function recat(categoryId, createRule) {
    await api.recategorize(editing.id, categoryId, { createRule });
    toast(createRule ? `Saved. Similar transactions will now go to ${catById[categoryId].name}.` : "Category updated");
    setEditing(null);
    reload();
  }

  function exportCsv() {
    const rows = [["Date", "Description", "Category", "Bucket", "Direction", "Amount"], ...(data ?? []).map((t) => [t.date, `"${t.description}"`, catById[t.categoryId].name, t.bucket, t.direction, t.amount])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    a.download = "spendcheck-transactions.csv";
    a.click();
  }

  return (
    <>
      <PageHeader title="Ledger" subtitle="Every payment in and out. Tap one to change its category."
        actions={<><Button variant="secondary" onClick={exportCsv}><Download className="size-4" />Download CSV</Button><Button as={Link} to="/app/add"><Plus className="size-4" />Add entry</Button></>} />

      <div className="mb-8 grid grid-cols-3 gap-4 border-y border-[var(--line)] py-5">
        <div><p className="text-sm text-ink-400">Entries</p><p className="num mt-1 text-2xl font-medium">{totals.n}</p></div>
        <div><p className="text-sm text-ink-400">Money out</p><Amount value={totals.d} className="mt-1 block text-2xl font-medium" /></div>
        <div><p className="text-sm text-ink-400">Money in</p><Amount value={totals.c} className="mt-1 block text-2xl font-medium text-success" /></div>
      </div>

      <Card className="p-0 sm:p-0">
        <div className="flex flex-col gap-3 border-b border-white/[0.05] p-4 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="field h-11 rounded-full pl-10" placeholder="Search merchant or description" />
          </label>
          <Segmented value={bucket} onChange={setBucket} options={[{ value: "all", label: "All" }, { value: "need", label: "Needs" }, { value: "want", label: "Wants" }, { value: "savings", label: "Savings" }]} />
          <label className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field h-11 appearance-none rounded-full pl-9 pr-9 lg:w-56">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          </label>
          <button onClick={() => setParams(review ? {} : { review: "1" })} aria-pressed={review} className={`h-11 rounded-full border px-4 text-sm font-medium ${review ? "border-warning/40 bg-warning/10 text-warning" : "border-white/[0.08] text-ink-300 hover:text-ink-50"}`}>
            Needs review
          </button>
        </div>

        {loading && !data ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !groups.length ? (
          <EmptyState title={review ? "Nothing left to review" : "No entries match"} body={review ? "Every entry has a confident category." : "Try a different search, or clear the filters."} />
        ) : (
          <div>
            {groups.map(([date, items]) => (
              <section key={date}>
                <h4 className="sticky top-16 z-10 flex justify-between bg-ink-850/95 px-5 py-2 text-[13px] font-medium text-ink-300 backdrop-blur">
                  <span>{formatDate(date, { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="num">{formatINR(items.filter((t) => t.direction === "debit").reduce((s, t) => s + t.amount, 0))}</span>
                </h4>
                <ul>
                  {items.map((t) => (
                    <li key={t.id}>
                      <button onClick={() => setEditing(t)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]">
                        <CategoryIcon category={catById[t.categoryId]} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{title(t.description)}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-400">
                            {catById[t.categoryId].name}<span className="text-ink-600">•</span>{SOURCE[t.source]}
                            {t.needsReview && <Badge tone="warn" className="ml-1">Review</Badge>}
                          </p>
                        </div>
                        <div className="hidden w-20 sm:block"><BucketPill bucket={t.bucket} /></div>
                        <div className="hidden w-14 md:block"><ConfidenceDot value={t.confidence} /></div>
                        <Amount value={t.amount} direction={t.direction} className="w-24 text-right font-medium" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {data.length > limit && <div className="p-4 text-center"><Button variant="secondary" onClick={() => setLimit(limit + 40)}>Load more</Button></div>}
          </div>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit category">
        {editing && <EditTxn t={editing} onSave={recat} onDelete={async () => { await api.deleteTransaction(editing.id); toast("Entry deleted"); setEditing(null); reload(); }} />}
      </Modal>
    </>
  );
}

function EditTxn({ t, onSave, onDelete }) {
  const [cat, setCat] = useState(t.categoryId);
  const [rule, setRule] = useState(true);
  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
        <CategoryIcon category={catById[t.categoryId]} />
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{title(t.description)}</p><p className="text-xs text-ink-400">{formatDate(t.date, { day: "numeric", month: "long", year: "numeric" })}</p></div>
        <Amount value={t.amount} direction={t.direction} className="font-semibold" />
      </div>
      <p className="mt-3 text-sm text-ink-400"><span className="mr-1.5 text-iris-500">✳</span>Filed by <span className="text-ink-100">{BY[t.classifiedBy].toLowerCase()}</span>, {Math.round(t.confidence * 100)}% sure</p>
      <p className="label mt-5">Choose category</p>
      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {CATEGORIES.filter((c) => c.kind === (t.direction === "credit" ? "income" : "expense")).map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`pressable flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-medium ${cat === c.id ? "border-ink-50 bg-white/[0.05]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}>
            <CategoryIcon category={c} size="sm" /><span className="leading-tight">{c.name}</span>
          </button>
        ))}
      </div>
      <label className="mt-5 flex items-start gap-2.5 text-sm text-ink-300">
        <input type="checkbox" className="mt-1 accent-[var(--color-mint-400)]" checked={rule} onChange={(e) => setRule(e.target.checked)} />
        File every payment to “{title(t.description).split(" ").slice(0, 2).join(" ")}” this way from now on
      </label>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
        <Button variant="danger" onClick={onDelete}>Delete entry</Button>
        <Button className="flex-1" onClick={() => onSave(cat, rule)}>Save category</Button>
      </div>
    </div>
  );
}
