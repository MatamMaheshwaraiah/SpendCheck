import { Link } from "react-router-dom";
import { BellRing, AlertOctagon, Info, CheckCheck, ChevronRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { PageHeader, Card, Button, Skeleton, EmptyState } from "@/components/ui";

const SEV = {
  critical: { icon: AlertOctagon, cls: "bg-danger/15 text-danger" },
  warning: { icon: BellRing, cls: "bg-warning/15 text-warning" },
  info: { icon: Info, cls: "bg-white/[0.06] text-ink-200" },
};

export default function Alerts() {
  const { data, reload } = useApi(() => api.alerts(), []);
  const unread = (data ?? []).filter((a) => !a.read).length;
  return (
    <>
      <PageHeader title="Alerts" subtitle={unread ? `${unread} unread. Budgets, unusual payments, renewals and goals.` : "You’re up to date."}
        actions={<Button variant="secondary" onClick={async () => { await api.markRead(); reload(); }} disabled={!unread}><CheckCheck className="size-4" />Mark all read</Button>} />
      <Card className="p-0 sm:p-0">
        {!data ? <div className="p-5"><Skeleton className="h-80" /></div> : !data.length ? <EmptyState title="No alerts" body="We'll tell you when something needs attention." /> : (
          <ul className="divide-y divide-[var(--line)]">
            {data.map((a) => {
              const S = SEV[a.severity];
              return (
                <li key={a.id}>
                  <Link to={a.link} onClick={() => api.markRead(a.id)} className={`flex items-start gap-4 p-5 transition hover:bg-white/[0.025] ${a.read ? "opacity-60" : ""}`}>
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full ${S.cls}`}><S.icon className="size-[18px]" strokeWidth={1.75} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium">{a.title}{!a.read && <span className="size-2 rounded-full bg-mint-400" aria-label="Unread" />}</p>
                      <p className="mt-1 text-sm text-ink-400">{a.body}</p>
                      <p className="mt-2 text-xs text-ink-500">{a.time}</p>
                    </div>
                    <ChevronRight className="mt-2 size-4 text-ink-500" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
