import { useState } from "react";
import { Plus, CalendarCheck2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { PageHeader, Card, Button, Modal, Skeleton, Badge, Amount } from "@/components/ui";
import { Ring } from "@/components/charts";
import { formatINR, formatDate } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

function projection(g) {
  const left = g.target - g.saved;
  if (left <= 0) return { date: null, onTrack: true };
  const months = Math.ceil(left / Math.max(g.monthly, 1));
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return { date: d, onTrack: !g.targetDate || d <= new Date(g.targetDate) };
}

export default function Goals() {
  const toast = useToast();
  const { data, reload } = useApi(() => api.goals(), []);
  const [adding, setAdding] = useState(false);
  const [contrib, setContrib] = useState(null);
  const [f, setF] = useState({ name: "", target: "", targetDate: "", emoji: "🎯" });

  const total = (data ?? []).reduce((s, g) => s + g.saved, 0);
  const target = (data ?? []).reduce((s, g) => s + g.target, 0);

  return (
    <>
      <PageHeader title="Goals" subtitle="Put what’s left of each month towards something specific."
        actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" />New goal</Button>} />

      <div className="mb-10 flex flex-col items-start gap-6 border-y border-[var(--line)] py-6 sm:flex-row sm:items-center">
        <Ring value={target ? total / target : 0} size={96} stroke={9}><span className="num text-lg font-semibold">{target ? Math.round((total / target) * 100) : 0}%</span></Ring>
        <div className="flex-1">
          <p className="text-sm text-ink-400">Saved across all goals</p>
          <p className="mt-1"><Amount value={total} animate className="money-xl text-[2.6rem]" /> <span className="text-lg text-ink-400">of <Amount value={target} /></span></p>
        </div>
        <p className="text-sm text-ink-400">Setting aside <Amount value={(data ?? []).reduce((s, g) => s + g.monthly, 0)} className="text-ink-50" /> a month</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {!data && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}
        {data?.map((g, i) => {
          const p = g.saved / g.target;
          const pr = projection(g);
          return (
            <Card key={g.id} className="flex animate-rise flex-col" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-full border border-[var(--line)] text-2xl">{g.emoji}</span>
                <Ring value={p} size={64} stroke={6} color={p >= 1 ? "#12b76a" : "#4be3b3"}><span className="num text-xs font-semibold">{Math.round(p * 100)}%</span></Ring>
              </div>
              <h3 className="mt-4 font-display text-[1.4rem] leading-tight">{g.name}</h3>
              <p className="num mt-1 text-sm"><span className="text-ink-50">{formatINR(g.saved)}</span> <span className="text-ink-400">of {formatINR(g.target)}</span></p>
              <div className="mt-4 space-y-1.5 text-xs text-ink-400">
                {g.targetDate && <p className="flex items-center gap-1.5"><CalendarCheck2 className="size-3.5" />Target {formatDate(g.targetDate, { month: "short", year: "numeric" })}</p>}
                {pr.date ? (
                  <p>Projected: <span className="text-ink-200">{formatDate(pr.date, { month: "short", year: "numeric" })}</span> <Badge tone={pr.onTrack ? "mint" : "warn"} className="ml-1">{pr.onTrack ? "On track" : "Behind"}</Badge></p>
                ) : <Badge tone="mint">Reached</Badge>}
              </div>
              <div className="mt-auto pt-5"><Button variant="secondary" size="sm" className="w-full" onClick={() => setContrib({ goal: g, v: "" })} disabled={p >= 1}>Add money</Button></div>
            </Card>
          );
        })}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Create a goal">
        <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await api.addGoal(f); toast("Goal created"); setAdding(false); setF({ name: "", target: "", targetDate: "", emoji: "🎯" }); reload(); }}>
          <div className="flex gap-2">{["🎯", "💻", "🏍️", "✈️", "🏠", "🎓", "💍", "🛟"].map((e) => <button type="button" key={e} onClick={() => setF({ ...f, emoji: e })} className={`grid size-10 place-items-center rounded-xl text-xl ${f.emoji === e ? "bg-white/[0.08] ring-1 ring-ink-50" : "bg-white/[0.03]"}`}>{e}</button>)}</div>
          <div><label className="label">Goal name</label><input className="field" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="New bike" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Target (₹)</label><input className="field num" required inputMode="numeric" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value.replace(/\D/g, "") })} placeholder="80000" /></div>
            <div><label className="label">By</label><input type="date" className="field" value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} /></div>
          </div>
          <Button type="submit" className="w-full">Create goal</Button>
        </form>
      </Modal>

      <Modal open={!!contrib} onClose={() => setContrib(null)} title={`Add to ${contrib?.goal.name ?? ""}`}>
        {contrib && (
          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await api.contribute(contrib.goal.id, contrib.v); toast(`${formatINR(contrib.v)} added`); setContrib(null); reload(); }}>
            <input autoFocus className="field num h-14 text-2xl" required inputMode="numeric" value={contrib.v} onChange={(e) => setContrib({ ...contrib, v: e.target.value.replace(/\D/g, "") })} placeholder="₹ 2,000" />
            <div className="flex gap-2">{[500, 1000, 2000, 5000].map((v) => <button type="button" key={v} onClick={() => setContrib({ ...contrib, v: String(v) })} className="num flex-1 rounded-lg bg-white/[0.05] py-2 text-sm hover:bg-white/10">+{v}</button>)}</div>
            <Button type="submit" className="w-full">Add money</Button>
          </form>
        )}
      </Modal>
    </>
  );
}
