/* Dependency-free SVG charts on the Ledger tokens.
   Motion: lines draw in, arcs sweep, bars grow with a stagger — once, on mount. */
import { useEffect, useId, useState } from "react";
import { compactINR, formatINR } from "@/lib/format";

function useMounted(delay = 80) {
  const [m, setM] = useState(false);
  useEffect(() => { const t = setTimeout(() => setM(true), delay); return () => clearTimeout(t); }, [delay]);
  return m;
}

/* ── Cumulative spend with forecast band and budget line ── */
export function SpendAreaChart({ data, budget, height = 240 }) {
  const id = useId().replace(/:/g, "");
  const on = useMounted(120);
  const [hover, setHover] = useState(null);
  const W = 640, H = height, P = { l: 4, r: 4, t: 14, b: 26 };
  const max = Math.max(budget ?? 0, ...data.map((d) => d.upper ?? d.cumulative ?? 0)) * 1.08 || 1;
  const x = (i) => P.l + (i / (data.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);

  const actual = data.map((d, i) => [i, d.cumulative]).filter(([, v]) => v != null);
  const fc = data.map((d, i) => [i, d.forecast, d.lower, d.upper]).filter(([, v]) => v != null);
  const line = (pts) => pts.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = actual.length ? `${line(actual)}L${x(actual.at(-1)[0])},${y(0)}L${x(0)},${y(0)}Z` : "";
  const band = fc.length ? `${fc.map(([i, , , u], k) => `${k ? "L" : "M"}${x(i)},${y(u)}`).join("")}${[...fc].reverse().map(([i, , l]) => `L${x(i)},${y(l)}`).join("")}Z` : "";
  const last = actual.at(-1);
  const h = hover != null ? data[hover] : null;

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height }} preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)))));
        }}>
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-mint-400)", stopOpacity: 0.22 }} />
            <stop offset="100%" style={{ stopColor: "var(--color-mint-400)", stopOpacity: 0 }} />
          </linearGradient>
          <clipPath id={`c${id}`}><rect x="0" y="0" height={H} width={on ? W : 0} style={{ transition: "width 1.4s cubic-bezier(0.65,0,0.35,1)" }} /></clipPath>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} style={{ stroke: "var(--line)" }} vectorEffect="non-scaling-stroke" />
        ))}
        {budget && <line x1={P.l} x2={W - P.r} y1={y(budget)} y2={y(budget)} style={{ stroke: "var(--color-danger)" }} strokeOpacity="0.6" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />}
        <g clipPath={`url(#c${id})`}>
          {band && <path d={band} style={{ fill: "var(--color-iris-500)" }} fillOpacity="0.12" />}
          {fc.length > 1 && <path d={line(fc.map(([i, v]) => [i, v]))} fill="none" style={{ stroke: "var(--color-iris-500)" }} strokeWidth="1.75" strokeDasharray="1 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          <path d={area} fill={`url(#a${id})`} />
          <path d={line(actual)} fill="none" style={{ stroke: "var(--color-mint-400)" }} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
        {h && <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} style={{ stroke: "var(--line-strong)" }} vectorEffect="non-scaling-stroke" />}
        {[1, 8, 15, 22, data.length].map((d) => (
          <text key={d} x={x(d - 1)} y={H - 6} style={{ fill: "var(--color-ink-400)" }} fontSize="11" textAnchor={d === 1 ? "start" : d === data.length ? "end" : "middle"} className="num">{d}</text>
        ))}
      </svg>
      {/* "today" marker — a pulsing ink dot on the last real data point */}
      {last && (
        <span className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint-400 ring-4 ring-[color-mix(in_srgb,var(--color-mint-400)_20%,transparent)] transition-opacity duration-500"
          style={{ left: `${(x(last[0]) / W) * 100}%`, top: y(last[1]), opacity: on ? 1 : 0, transitionDelay: "1.2s" }} />
      )}
      {budget && <span className="num absolute right-0 -translate-y-[130%] text-[11px] text-danger" style={{ top: `${(y(budget) / H) * 100}%` }}>Budget {compactINR(budget)}</span>}
      {h && (
        <div className="pointer-events-none absolute top-0 z-10 min-w-40 -translate-x-1/2 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2.5 text-xs shadow-[var(--pop-shadow)]"
          style={{ left: `${Math.min(86, Math.max(14, (x(hover) / W) * 100))}%` }}>
          <div className="mb-1.5 font-display text-sm">Day {h.day}</div>
          {h.cumulative != null && <Row c="var(--color-mint-400)" k="Spent so far" v={h.cumulative} />}
          {h.amount != null && <Row c="var(--color-ink-300)" k="That day" v={h.amount} />}
          {h.forecast != null && <Row c="var(--color-iris-500)" k="Forecast" v={h.forecast} />}
        </div>
      )}
    </div>
  );
}
const Row = ({ c, k, v }) => (
  <div className="flex items-center justify-between gap-4 py-0.5">
    <span className="flex items-center gap-1.5 text-ink-300"><i className="size-1.5 rounded-full" style={{ background: c }} />{k}</span>
    <span className="num text-ink-50">{formatINR(v)}</span>
  </div>
);

/* ── Donut: arcs sweep in one after another ── */
export function Donut({ segments, size = 180, thickness = 14, children }) {
  const on = useMounted(150);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "var(--line)" }} strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = Math.max(0, (s.value / total) * C - 4);
          const el = (
            <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: s.color, transition: `stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.18}s` }} strokeWidth={thickness}
              strokeDasharray={`${on ? len : 0} ${C}`} strokeDashoffset={-offset}><title>{`${s.label}: ${formatINR(s.value)}`}</title></circle>
          );
          offset += (s.value / total) * C;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ── Progress ring ── */
export function Ring({ value, size = 76, stroke = 6, color = "var(--color-mint-400)", children }) {
  const on = useMounted(200);
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "var(--line)" }} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: color, transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)" }} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={on ? C * (1 - Math.min(1, value)) : C} />
      </svg>
      <div className="absolute">{children}</div>
    </div>
  );
}

/* ── Stacked monthly bars ── */
export function StackedBars({ data, keys, height = 220 }) {
  const on = useMounted(150);
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => keys.reduce((s, k) => s + d[k.key], 0))) * 1.1 || 1;
  return (
    <div className="flex items-end gap-3 sm:gap-4" style={{ height }}>
      {data.map((d, i) => {
        const total = keys.reduce((s, k) => s + d[k.key], 0);
        const isLast = i === data.length - 1;
        return (
          <div key={d.label} className="relative flex h-full flex-1 flex-col items-center justify-end gap-2" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            {hover === i && (
              <div className="absolute bottom-full z-10 mb-1 min-w-40 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2.5 text-xs shadow-[var(--pop-shadow)]">
                <div className="mb-1 font-display text-sm">{d.label}</div>
                {keys.map((k) => <Row key={k.key} c={k.color} k={k.label} v={d[k.key]} />)}
              </div>
            )}
            <div className="flex w-full max-w-11 flex-col-reverse gap-[2px] overflow-hidden rounded-md transition-[height,opacity] duration-1000 ease-[var(--ease-out)]"
              style={{ height: on ? `${(total / max) * 100}%` : "0%", transitionDelay: `${i * 70}ms`, opacity: hover == null || hover === i ? 1 : 0.4 }}>
              {keys.map((k) => <div key={k.key} className="rounded-[3px]" style={{ height: `${(d[k.key] / (total || 1)) * 100}%`, background: k.color }} />)}
            </div>
            <span className={`text-xs ${isLast ? "font-medium text-ink-100" : "text-ink-400"}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Horizontal bars ── */
export function HBars({ items, max }) {
  const on = useMounted(150);
  const m = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={it.label}>
          <div className="mb-1.5 flex justify-between text-sm"><span className="text-ink-200">{it.label}</span><span className="num text-ink-300">{formatINR(it.value)}</span></div>
          <div className="h-1.5 rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full transition-[width] duration-1000 ease-[var(--ease-out)]" style={{ width: on ? `${(it.value / m) * 100}%` : 0, background: it.color, transitionDelay: `${i * 60}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Sparkline ── */
export function Sparkline({ values, color = "var(--color-mint-400)", width = 96, height = 32 }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / (max - min || 1)) * (height - 4) - 2}`).join(" ");
  return <svg width={width} height={height}><polyline points={pts} fill="none" style={{ stroke: color }} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/* ── Ledger bar: the signature viz. Income split into needs / wants / savings / unspent,
      with tick marks for the 50/30/20 targets. Segments grow in sequence. ── */
export function LedgerBar({ income, buckets, height = 14, showTargets = true }) {
  const on = useMounted(250);
  const segs = [
    { k: "need", v: buckets.need, c: "var(--color-need)" },
    { k: "want", v: buckets.want, c: "var(--color-want)" },
    { k: "savings", v: buckets.savings, c: "var(--color-save)" },
  ];
  const base = Math.max(income, segs.reduce((s, x) => s + x.v, 0)) || 1;
  return (
    <div className="relative">
      <div className="flex w-full gap-[3px] overflow-hidden rounded-full bg-white/[0.06]" style={{ height }}>
        {segs.map((s, i) => (
          <div key={s.k} className="h-full rounded-full transition-[width] duration-1000 ease-[var(--ease-out)]"
            style={{ width: on ? `${(s.v / base) * 100}%` : "0%", background: s.c, transitionDelay: `${i * 220}ms` }} />
        ))}
      </div>
      {showTargets && [50, 80].map((t) => (
        <span key={t} className="absolute -top-1 h-[calc(100%+8px)] w-px bg-ink-50/50" style={{ left: `${t}%` }}>
          <span className="num absolute -bottom-5 -translate-x-1/2 text-[10px] text-ink-400">{t === 50 ? "50%" : "80%"}</span>
        </span>
      ))}
    </div>
  );
}
