import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { PageHeader, Card, CardHeader, Button, Progress, CategoryIcon, Skeleton, AIBadge, Badge, Amount } from "@/components/ui";
import { Donut } from "@/components/charts";
import { BUCKETS } from "@/data/categories";
import { formatINR, monthLabel, pct } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export default function Budgets() {
  const toast = useToast();
  const { user } = useAuth();
  const income = Number(user?.monthlyIncome) || 68000;
  const { data, reload } = useApi(() => api.budgets(), []);
  const [split, setSplit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(null);

  async function suggest() {
    setBusy(true);
    setSplit(await api.suggestSplit());
    setBusy(false);
  }
  async function save(id, v) {
    await api.saveBudget(id, Number(v));
    setEdit(null);
    toast("Budget updated");
    reload();
  }

  const byBucket = { need: { limit: 0, spent: 0 }, want: { limit: 0, spent: 0 }, savings: { limit: 0, spent: 0 } };
  (data ?? []).forEach((b) => { byBucket[b.category.bucket].limit += b.limit; byBucket[b.category.bucket].spent += b.spent; });
  const rule = split ?? { need: 50, want: 30, savings: 20 };

  return (
    <>
      <PageHeader title="Budgets" subtitle={`${monthLabel()}. You’ll be told at 50%, 80% and 100% of each limit.`}
        actions={<Button variant="ai" onClick={suggest} loading={busy}>Suggest a split for me</Button>} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card ai={!!split}>
          <CardHeader title={split ? "Your personalised split" : "The 50 / 30 / 20 rule"} subtitle={`Applied to ${formatINR(income)} monthly income`} action={split && <AIBadge label="Suggested for you" />} />
          <div className="flex items-center gap-6">
            <Donut size={150} thickness={16} segments={Object.entries(BUCKETS).map(([k, b]) => ({ label: b.label, value: rule[k], color: b.hex }))}>
              <p className="num text-xl font-medium">{rule.need}/{rule.want}/{rule.savings}</p>
            </Donut>
            <div className="flex-1 space-y-3">
              {Object.entries(BUCKETS).map(([k, b]) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full" style={{ background: b.hex }} />{b.label}</span><span className="num">{rule[k]}%</span></div>
                  <p className="num text-right text-xs text-ink-400">{formatINR((income * rule[k]) / 100)}</p>
                </div>
              ))}
            </div>
          </div>
          {split && <p className="ai-voice mt-5 border-l-2 border-iris-500 pl-4 text-[17px] leading-relaxed text-ink-100">{split.rationale}</p>}
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(BUCKETS).map(([k, b]) => {
            const x = byBucket[k];
            const p = pct(x.spent, x.limit);
            return (
              <Card key={k} className="flex flex-col">
                <span className="flex items-center gap-2 text-sm text-ink-300"><i className="size-2.5 rounded-full" style={{ background: b.hex }} />{b.label}</span>
                <Amount value={x.spent} animate className="mt-4 block text-[1.9rem] font-medium" />
                <p className="num text-xs text-ink-400">of {formatINR(x.limit)} planned</p>
                <div className="mt-auto pt-5"><Progress value={x.spent} max={x.limit || 1} color={b.hex} /></div>
                <p className="num mt-2 text-xs text-ink-400">{p}% used</p>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title="Category budgets" subtitle="Click the pencil to change a limit" />
        {!data ? <Skeleton className="h-80" /> : (
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {data.map((b) => {
              const p = pct(b.spent, b.limit);
              const isSave = b.category.bucket === "savings";
              const state = isSave ? (p >= 100 ? ["mint", "Target met"] : ["neutral", `${p}% invested`]) : b.spent > b.limit ? ["danger", "Over budget"] : p >= 80 ? ["warn", p >= 100 ? "Fully used" : "Close to limit"] : ["mint", "On track"];
              return (
                <div key={b.categoryId} className="flex items-center gap-4">
                  <CategoryIcon category={b.category} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{b.category.name}</span>
                      <Badge tone={state[0]}>{state[1]}</Badge>
                    </div>
                    <Progress value={b.spent} max={b.limit} markers={[50, 80]} />
                    <div className="num mt-1.5 flex items-center justify-between text-xs text-ink-400">
                      <span><span className="text-ink-100">{formatINR(b.spent)}</span> spent · {formatINR(Math.max(0, b.limit - b.spent))} left</span>
                      {edit?.id === b.categoryId ? (
                        <span className="flex items-center gap-1">
                          <input autoFocus className="w-20 rounded-md border border-mint-500 bg-ink-950 px-2 py-0.5 text-right text-ink-50" value={edit.v} onChange={(e) => setEdit({ ...edit, v: e.target.value.replace(/\D/g, "") })} onKeyDown={(e) => e.key === "Enter" && save(b.categoryId, edit.v)} />
                          <button onClick={() => save(b.categoryId, edit.v)} className="text-mint-400" aria-label="Save"><Check className="size-4" /></button>
                        </span>
                      ) : (
                        <button onClick={() => setEdit({ id: b.categoryId, v: b.limit })} className="flex items-center gap-1 hover:text-ink-50">{formatINR(b.limit)}<Pencil className="size-3" /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
