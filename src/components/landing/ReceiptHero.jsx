/* The landing page's one orchestrated moment:
   a thermal receipt prints line by line → each item is stamped NEED or WANT →
   the totals file themselves into this month's ledger. */
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useReducedMotion, useCountUp } from "@/lib/motion";
import { cn } from "@/lib/format";

const ITEMS = [
  { name: "AASHIRVAAD ATTA 5KG", qty: 1, amt: 285, b: "need" },
  { name: "AMUL TAAZA MILK 1L", qty: 3, amt: 204, b: "need" },
  { name: "CADBURY SILK 150G", qty: 1, amt: 180, b: "want" },
  { name: "SURF EXCEL MATIC 2KG", qty: 1, amt: 489, b: "need" },
  { name: "HALDIRAM BHUJIA 400G", qty: 1, amt: 110, b: "want" },
  { name: "TOMATO (KG)", qty: 1, amt: 42, b: "need" },
];
const SUB = ITEMS.reduce((s, i) => s + i.amt, 0); // 1310
const GST = +(SUB * 0.025).toFixed(2);
const TOTAL = SUB + 2 * GST;
const NEEDS = ITEMS.filter((i) => i.b === "need").reduce((s, i) => s + i.amt, 0);
const WANTS = SUB - NEEDS;

// Timeline (ms): header 300, items every 260, totals, then stamps every 180, then ledger
const T_ITEMS = 650, STEP = 260, T_TOTALS = T_ITEMS + ITEMS.length * STEP + 150;
const T_STAMP = T_TOTALS + 700, STAMP_STEP = 190;
const T_LEDGER = T_STAMP + ITEMS.length * STAMP_STEP + 350;

const f2 = (n) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ReceiptHero() {
  const reduced = useReducedMotion();
  const [t, setT] = useState(reduced ? 99999 : 0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduced) { setT(99999); return; }
    setT(0);
    const start = performance.now();
    let raf;
    const tick = (now) => { const e = now - start; setT(e); if (e < T_LEDGER + 1600) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reduced]);

  const printed = (i) => t > T_ITEMS + i * STEP;
  const stamped = (i) => t > T_STAMP + i * STAMP_STEP;
  const ledger = t > T_LEDGER;
  const needs = useCountUp(ledger ? NEEDS : 0, { duration: 900 });
  const wants = useCountUp(ledger ? WANTS : 0, { duration: 900, delay: 150 });

  // receipt grows as it prints
  const lines = 7 + Math.min(ITEMS.length, ITEMS.filter((_, i) => printed(i)).length) + (t > T_TOTALS ? 5 : 0);

  return (
    <div className="relative mx-auto w-full max-w-[460px] lg:mx-0 lg:ml-auto" aria-label="Animated example: a grocery receipt is read and filed into needs and wants">
      {/* printer slot */}
      <div className="relative z-10 mx-auto h-3 w-[86%] rounded-full bg-ink-50/90 shadow-[0_6px_14px_-4px_rgb(0_0_0/0.5)]" />
      <div className="relative mx-auto -mt-1.5 w-[80%] overflow-hidden">
        <div
          className="receipt px-5 pb-8 pt-5 text-[11.5px] leading-[1.65] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.55)] transition-[max-height] duration-500 ease-[var(--ease-out)] sm:text-[12.5px]"
          style={{ maxHeight: reduced ? 2000 : lines * 21 + 40 }}
        >
          <div className={cn("text-center transition-opacity duration-300", t > 200 ? "opacity-100" : "opacity-0")}>
            <p className="font-semibold tracking-wider">RATNADEEP SUPER MARKET</p>
            <p className="opacity-70">Madhapur, Hyderabad 500081</p>
            <p className="opacity-70">GSTIN 36AABCR1234M1Z5</p>
            <p className="mt-1 opacity-70">27/10/2026 19:42 · BILL 004417</p>
          </div>
          <p className="my-2 h-[1.65em] overflow-hidden break-all opacity-50">{"- ".repeat(24)}</p>
          {ITEMS.map((it, i) => (
            <div key={it.name} className={cn("relative flex items-center gap-2 transition-all duration-300", printed(i) ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")}>
              <span className="w-5 opacity-60">{it.qty}</span>
              <span className="flex-1 truncate">{it.name}</span>
              <span className="tabular-nums">{f2(it.amt)}</span>
              <span
                className={cn(
                  "absolute right-[4.6rem] top-1/2 -translate-y-1/2 rounded-[4px] border-[1.5px] bg-[#fbfbf8] px-1 font-sans text-[9px] font-semibold uppercase leading-tight tracking-wide",
                  it.b === "need" ? "border-[#4a5fd6] text-[#4a5fd6]" : "border-[#c93d7c] text-[#c93d7c]",
                  stamped(i) ? "animate-stamp" : "opacity-0",
                )}
              >
                {it.b}
              </span>
            </div>
          ))}
          <div className={cn("transition-opacity duration-300", t > T_TOTALS ? "opacity-100" : "opacity-0")}>
            <p className="my-2 h-[1.65em] overflow-hidden break-all opacity-50">{"- ".repeat(24)}</p>
            <div className="flex justify-between"><span>SUBTOTAL</span><span className="tabular-nums">{f2(SUB)}</span></div>
            <div className="flex justify-between opacity-70"><span>CGST 2.5%</span><span className="tabular-nums">{f2(GST)}</span></div>
            <div className="flex justify-between opacity-70"><span>SGST 2.5%</span><span className="tabular-nums">{f2(GST)}</span></div>
            <div className="mt-1 flex justify-between text-[14px] font-semibold"><span>TOTAL ₹</span><span className="tabular-nums">{f2(TOTAL)}</span></div>
            <p className="mt-2 text-center opacity-60">PAID VIA UPI · THANK YOU</p>
          </div>
        </div>
      </div>

      {/* ledger card the totals file into */}
      <div
        className={cn(
          "card absolute -bottom-10 -left-2 w-[17.5rem] p-4 shadow-[var(--pop-shadow)] transition-all duration-700 ease-[var(--ease-spring-soft)] sm:-left-10",
          ledger ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
      >
        <p className="text-sm text-ink-300">Filed to your October ledger</p>
        <div className="mt-3 flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-white/[0.06]">
          <span className="h-full rounded-full bg-need transition-[width] duration-1000 ease-[var(--ease-out)]" style={{ width: ledger ? `${(NEEDS / SUB) * 100}%` : 0 }} />
          <span className="h-full rounded-full bg-want transition-[width] delay-200 duration-1000 ease-[var(--ease-out)]" style={{ width: ledger ? `${(WANTS / SUB) * 100}%` : 0 }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><p className="flex items-center gap-1.5 text-xs text-ink-400"><i className="size-1.5 rounded-full bg-need" />Needs</p><p className="num mt-0.5 font-medium">₹{Math.round(needs).toLocaleString("en-IN")}</p></div>
          <div><p className="flex items-center gap-1.5 text-xs text-ink-400"><i className="size-1.5 rounded-full bg-want" />Wants</p><p className="num mt-0.5 font-medium">₹{Math.round(wants).toLocaleString("en-IN")}</p></div>
        </div>
      </div>

      {!reduced && (
        <button onClick={() => setRun((r) => r + 1)} className={cn("pressable absolute -bottom-8 right-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-ink-400 transition-opacity hover:text-ink-50", ledger ? "opacity-100" : "pointer-events-none opacity-0")}>
          <RotateCcw className="size-3.5" />Print again
        </button>
      )}
    </div>
  );
}
