import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { PageHeader, Card, CardHeader, AIBadge, Skeleton, Amount } from "@/components/ui";
import { SpendAreaChart, HBars } from "@/components/charts";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/format";

const PROMPTS = ["Where did I overspend this month?", "How can I save more?", "Can I afford a ₹5,000 purchase?", "Summarise my month"];
const KIND = { summary: "This month", tip: "A saving you could make", anomaly: "Something unusual" };
const label = (k) => k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Note({ x, i }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [vote, setVote] = useState(null);
  return (
    <article className="animate-rise border-t border-[var(--line)] py-8 first:border-t-0 first:pt-0" style={{ animationDelay: `${i * 90}ms` }}>
      <AIBadge label={KIND[x.kind] ?? "Note"} />
      <h3 className="ai-voice mt-3 text-[1.75rem] leading-snug sm:text-[2rem]">{x.title}.</h3>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-300">{x.text}</p>
      <p className="mt-4 max-w-2xl border-l-2 border-iris-500 pl-4 text-ink-100">{x.tip}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-ink-300 hover:text-ink-50" aria-expanded={open}>
          <ChevronDown className={cn("size-4 transition-transform duration-500 ease-[var(--ease-spring)]", open && "rotate-180")} />
          {open ? "Hide the figures" : "Show the figures this is based on"}
        </button>
        <span className="text-ink-500">Was this useful?</span>
        {["Yes", "No"].map((v) => (
          <button key={v} onClick={() => { setVote(v); toast(v === "Yes" ? "Thanks — you'll see more notes like this" : "Noted — fewer notes like this", "info"); }}
            className={cn("pressable rounded-full border px-3 py-0.5 text-xs", vote === v ? "border-ink-50 bg-ink-50 text-ink-900" : "border-[var(--line-strong)] text-ink-300 hover:text-ink-50")}>{v}</button>
        ))}
      </div>
      <div className={cn("grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <dl className="mt-4 max-w-md divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] px-4 text-sm">
            {Object.entries(x.facts).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2"><dt className="text-ink-400">{label(k)}</dt><dd className="num">{typeof v === "number" ? v.toLocaleString("en-IN") : v}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  );
}

export default function Insights() {
  const ins = useApi(() => api.insights(), []);
  const s = useApi(() => api.summary(), []);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);
  useEffect(() => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  async function ask(text) {
    if (!text.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    const r = await api.chat(text);
    setMsgs((m) => [...m, { role: "ai", ...r }]);
    setBusy(false);
  }

  const d = s.data;
  return (
    <>
      <PageHeader title="Ask about your money" subtitle="Answers come from your own transactions. The AI explains the figures — it never makes them up." />
      <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div>
          {ins.data ? ins.data.map((x, i) => <Note key={x.id} x={x} i={i} />) : <div className="space-y-6"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>}

          {d && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Card>
                <CardHeader title="Where the month will end" subtitle="If you keep spending at this pace" />
                <Amount value={d.projected} className="money-xl block text-[2.6rem]" />
                <p className="mt-2 text-sm text-ink-400">Plan <Amount value={d.budgetTotal} className="text-ink-200" />, so <span className={d.projected > d.budgetTotal ? "text-warning" : "text-success"}>{d.projected > d.budgetTotal ? "over" : "under"} by <Amount value={Math.abs(d.projected - d.budgetTotal)} /></span></p>
                <div className="mt-5"><SpendAreaChart data={d.daily} budget={d.budgetTotal} height={140} /></div>
              </Card>
              <Card>
                <CardHeader title="Biggest categories" subtitle="This month" />
                <HBars items={d.topCategories.slice(0, 6).map((c) => ({ label: c.name, value: c.amount, color: c.color }))} />
              </Card>
            </div>
          )}
        </div>

        {/* Conversation */}
        <Card className="flex h-[calc(100dvh-11rem)] min-h-[540px] flex-col p-0 sm:p-0 xl:sticky xl:top-24">
          <div className="border-b border-[var(--line)] px-6 py-5">
            <p className="font-display text-xl">Ask SpendCheck</p>
            <p className="mt-0.5 text-sm text-ink-400">Each answer lists the figures it used.</p>
          </div>
          <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {!msgs.length && (
              <div className="animate-fade">
                <p className="ai-voice text-[1.5rem] leading-snug text-ink-200">What would you like to know about your spending?</p>
                <div className="mt-5 flex flex-col items-start gap-2">
                  {PROMPTS.map((p) => <button key={p} onClick={() => ask(p)} className="pressable rounded-full border border-[var(--line-strong)] px-4 py-2 text-left text-sm text-ink-200 hover:bg-white/[0.05]">{p}</button>)}
                </div>
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex animate-pop justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-50 px-4 py-2.5 text-sm text-ink-900">{m.text}</p>
                </div>
              ) : (
                <div key={i} className="animate-rise">
                  <p className="flex gap-2.5 text-[15px] leading-relaxed text-ink-100"><span className="mt-0.5 text-iris-500" aria-hidden="true">✳</span><span>{m.text}</span></p>
                  {m.facts && (
                    <dl className="ml-6 mt-3 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] px-3 text-xs">
                      {Object.entries(m.facts).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-1.5"><dt className="text-ink-400">{label(k)}</dt><dd className="num text-ink-200">{typeof v === "number" ? v.toLocaleString("en-IN") : v}</dd></div>
                      ))}
                    </dl>
                  )}
                </div>
              ),
            )}
            {busy && (
              <div className="flex items-center gap-1.5 pl-1" aria-label="Thinking">
                {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-iris-500" style={{ animationDelay: `${i * 120}ms` }} />)}
              </div>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="border-t border-[var(--line)] p-4">
            <div className="relative">
              <input value={input} onChange={(e) => setInput(e.target.value)} className="field h-12 rounded-full pl-5 pr-14" placeholder="Ask in your own words…" aria-label="Your question" />
              <button className="pressable absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-full bg-ink-50 text-ink-900 disabled:opacity-30" disabled={!input.trim() || busy} aria-label="Send"><ArrowUp className="size-4" /></button>
            </div>
            {msgs.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {PROMPTS.map((p) => <button key={p} type="button" onClick={() => ask(p)} className="shrink-0 rounded-full border border-[var(--line)] px-3 py-1 text-xs text-ink-300 hover:text-ink-50">{p}</button>)}
              </div>
            )}
          </form>
        </Card>
      </div>
    </>
  );
}
