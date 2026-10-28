import { Repeat, AlertTriangle, BellOff } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { PageHeader, Card, Skeleton, Badge, Button, AIBadge, Amount } from "@/components/ui";
import { formatINR } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

export default function Subscriptions() {
  const toast = useToast();
  const { data } = useApi(() => api.subscriptions(), []);
  const monthly = (data ?? []).reduce((s, x) => s + x.amount, 0);
  const today = new Date().getDate();

  return (
    <>
      <PageHeader title="Subscriptions" subtitle="Found automatically: payments to the same merchant, for a similar amount, at least three months running." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-ink-400">Every month</p><Amount value={monthly} animate className="money-xl mt-3 block text-[2.4rem]" /></Card>
        <Card><p className="text-sm text-ink-400">Over a year</p><Amount value={monthly * 12} animate className="money-xl mt-3 block text-[2.4rem]" /></Card>
        <Card ai>
          <AIBadge label="Two services overlap" />
          <p className="ai-voice mt-3 text-[17px] leading-relaxed text-ink-100">Spotify and YouTube Premium both stream music. Keeping only one saves ₹1,788 a year.</p>
        </Card>
      </div>

      <Card className="p-0 sm:p-0">
        {!data ? <div className="p-5"><Skeleton className="h-72" /></div> : (
          <ul className="divide-y divide-[var(--line)]">
            {data.map((x) => {
              const inDays = (x.nextDate - today + 31) % 31;
              return (
                <li key={x.id} className="flex flex-wrap items-center gap-4 p-5">
                  <span className="grid size-11 place-items-center rounded-full font-display text-lg text-snow" style={{ background: x.color }}>{x.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{x.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-400"><Repeat className="size-3" />{x.cadence} · {x.usage}</p>
                  </div>
                  <div className="text-right">
                    <Amount value={x.amount} className="font-semibold" />
                    <p className={`text-xs ${inDays <= 3 ? "text-warning" : "text-ink-400"}`}>{inDays === 0 ? "Renews today" : `Renews in ${inDays} days`}</p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    {/Overlap|Low use/.test(x.usage) && <Badge tone="warn"><AlertTriangle className="size-3" />Review</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => toast(`Reminder muted for ${x.name}`, "info")}><BellOff className="size-4" /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
