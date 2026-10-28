/* Inline entry bar for the Overview. Built for rapid entry:
   type amount → description → Enter, focus jumps back to amount for the next one.
   The category is guessed live as you type; each added entry can be undone. */
import { useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { api } from "@/services/api";
import { categorize, catById, CATEGORIES } from "@/data/categories";
import { Button, CategoryIcon, Amount } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { cn, isoDay } from "@/lib/format";

const EMPTY = { amount: "", description: "", direction: "debit", categoryId: "", date: isoDay(new Date()) };

export default function QuickAdd({ onChange, large = false }) {
  const toast = useToast();
  const amountRef = useRef(null);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState([]);
  const guess = f.description.trim().length > 2 && f.direction === "debit" ? categorize(f.description) : null;
  const catId = f.categoryId ? Number(f.categoryId) : guess?.categoryId ?? (f.direction === "credit" ? 13 : null);
  const cat = catId ? catById[catId] : null;
  const valid = Number(f.amount) > 0 && f.description.trim();

  async function submit(e) {
    e.preventDefault();
    if (!valid) { amountRef.current?.focus(); return; }
    setBusy(true);
    const row = await api.addTransaction({ ...f, amount: Number(f.amount), description: f.description.trim(), categoryId: catId ?? undefined, source: "manual" });
    setBusy(false);
    setAdded((a) => [row, ...a].slice(0, 4));
    setF({ ...EMPTY, direction: f.direction, date: f.date });
    amountRef.current?.focus();
    onChange?.();
  }

  async function undo(row) {
    await api.deleteTransaction(row.id);
    setAdded((a) => a.filter((x) => x.id !== row.id));
    toast("Entry removed", "info");
    onChange?.();
  }

  return (
    <div>
      <form onSubmit={submit} className={cn("card grid gap-3 p-3 sm:p-3", large ? "lg:grid-cols-[auto_11rem_1fr_13rem_auto]" : "lg:grid-cols-[auto_10rem_1fr_12rem_auto]")} aria-label="Add an entry">
        <div className="grid grid-cols-2 gap-1 rounded-full border border-[var(--line)] p-1 lg:w-44" role="radiogroup" aria-label="Direction">
          {[["debit", "Money out"], ["credit", "Money in"]].map(([d, l]) => (
            <button key={d} type="button" role="radio" aria-checked={f.direction === d} onClick={() => setF({ ...f, direction: d, categoryId: "" })}
              className={cn("pressable rounded-full py-1.5 text-sm font-medium transition-colors", f.direction === d ? "bg-ink-50 text-ink-900" : "text-ink-400 hover:text-ink-100")}>{l}</button>
          ))}
        </div>
        <label className="relative">
          <span className="sr-only">Amount in rupees</span>
          <span className="num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">₹</span>
          <input ref={amountRef} autoFocus={large} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^\d.]/g, "") })}
            placeholder="0" className="field num h-11 rounded-full pl-8 text-lg font-medium" />
        </label>
        <label className="relative">
          <span className="sr-only">What was it for?</span>
          <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
            placeholder={f.direction === "debit" ? "What for? e.g. Swiggy dinner, auto to college" : "From? e.g. Salary, freelance"} className="field h-11 rounded-full pr-36" />
          {cat && (
            <span key={cat.id} className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 animate-pop items-center gap-1.5 rounded-full bg-white/[0.06] py-1 pl-1 pr-2.5 text-xs text-ink-200">
              <CategoryIcon category={cat} size="sm" /><span className="max-w-24 truncate">{cat.name}</span>
            </span>
          )}
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} className="field h-11 rounded-full">
            <option value="">Category: detect automatically</option>
            {CATEGORIES.filter((c) => c.kind === (f.direction === "debit" ? "expense" : "income")).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <Button type="submit" loading={busy} disabled={!valid} className="h-11">Add entry</Button>
      </form>

      {added.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-live="polite">
          {added.map((r) => (
            <li key={r.id} className="flex animate-pop items-center gap-2 rounded-full border border-[var(--line)] py-1 pl-1 pr-1.5 text-sm">
              <CategoryIcon category={catById[r.categoryId]} size="sm" />
              <span className="max-w-40 truncate text-ink-200">{r.description}</span>
              <Amount value={r.amount} direction={r.direction} className="font-medium" />
              <button onClick={() => undo(r)} className="pressable grid size-7 place-items-center rounded-full text-ink-400 hover:bg-white/[0.07] hover:text-ink-50" aria-label={`Undo ${r.description}`}><Undo2 className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
