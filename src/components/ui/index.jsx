import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Home, ShoppingBasket, Zap, Car, HeartPulse, GraduationCap, Bike, UtensilsCrossed, ShoppingBag,
  Clapperboard, Plane, TrendingUp, Wallet, PiggyBank, CircleDashed, X, Loader2, Inbox,
} from "lucide-react";
import { cn } from "@/lib/format";
import { useCountUp } from "@/lib/motion";
import { BUCKETS } from "@/data/categories";

/* ── Brand ───────────────────────────────────────── */
export function Logo({ className = "", compact = false }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-ink-50" />
        <path d="M8 6h16v20l-2.7-1.6L18.7 26 16 24.4 13.3 26l-2.6-1.6L8 26z" className="fill-ink-900" />
        <path d="M11.5 15.6l3 3 6-6.4" fill="none" className="stroke-mint-400" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className="font-display text-[1.35rem] font-medium tracking-[-0.03em]">spendcheck</span>}
    </span>
  );
}

/* ── Button ───────────────────────────────────────── */
const VARIANTS = {
  primary: "bg-ink-50 text-ink-900 hover:bg-ink-100",
  accent: "bg-mint-400 text-ink-950 hover:bg-mint-500",
  secondary: "border border-[var(--line-strong)] text-ink-50 hover:bg-white/[0.05]",
  ghost: "text-ink-300 hover:bg-white/[0.06] hover:text-ink-50",
  ai: "bg-iris-500 text-onyx hover:bg-iris-400",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
};
const SIZES = { sm: "h-9 px-4 text-sm gap-1.5", md: "h-11 px-5 text-[15px] gap-2", lg: "h-13 px-7 text-base gap-2.5" };

export function Button({ variant = "primary", size = "md", loading, className, children, as: As = "button", ...props }) {
  return (
    <As
      className={cn(
        "pressable inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium tracking-[-0.01em] disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant], SIZES[size], className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </As>
  );
}

/* ── Surfaces ─────────────────────────────────────── */
export function Card({ className, ai, children, ...p }) {
  return <div className={cn(ai ? "card-ai" : "card", "p-5 sm:p-6", className)} {...p}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="font-display text-[1.3rem] leading-tight">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[2.4rem] leading-[1.05] sm:text-[3rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ── Badges ───────────────────────────────────────── */
const TONES = {
  neutral: "bg-white/[0.06] text-ink-200",
  mint: "bg-mint-400/12 text-mint-300",
  iris: "bg-iris-500/15 text-iris-300",
  warn: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
  need: "bg-need/12 text-need",
  want: "bg-want/12 text-want",
  savings: "bg-save/12 text-save",
};
export function Badge({ tone = "neutral", className, children }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", TONES[tone], className)}>{children}</span>;
}

export function BucketPill({ bucket }) {
  const b = BUCKETS[bucket];
  if (!b) return <span className="inline-flex items-center gap-1.5 text-xs text-ink-400"><i className="size-1.5 rounded-full bg-success" />Income</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs text-ink-300"><i className="size-1.5 rounded-full" style={{ background: b.color }} />{b.label.replace(/s$/, "")}</span>;
}

/** Marks text written by the AI. A typographic signature, not a glowing pill. */
export function AIBadge({ label = "Note from SpendCheck AI" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-iris-300">
      <span className="text-base leading-none text-iris-500" aria-hidden="true">✳</span>
      <span className="ai-voice">{label}</span>
    </span>
  );
}

export function ConfidenceDot({ value }) {
  const c = value >= 0.9 ? "bg-success" : value >= 0.75 ? "bg-warning" : "bg-danger";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-400" title={`Model confidence ${Math.round(value * 100)}%`}>
      <span className={cn("size-1.5 rounded-full", c)} />
      <span className="num">{Math.round(value * 100)}%</span>
    </span>
  );
}

/* ── Money ────────────────────────────────────────── */
const grp = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const grp2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹ sign set lighter and smaller than the figure — like a printed statement */
export function Amount({ value, direction, className, decimals, animate }) {
  const live = useCountUp(animate ? Math.abs(value) : null);
  const n = animate ? live : Math.abs(value);
  const sign = direction === "credit" ? "+" : direction === "debit" ? "−" : value < 0 ? "−" : "";
  return (
    <span className={cn("num whitespace-nowrap", direction === "credit" && "text-success", className)}>
      {sign}<span className="mr-[0.08em] font-normal opacity-55">₹</span>{(decimals ? grp2 : grp).format(n)}
    </span>
  );
}

export function Delta({ value, invert = false, suffix = "vs last month" }) {
  const good = invert ? value > 0 : value < 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
      <span className={cn("num font-medium", good ? "text-success" : "text-danger")}>{value > 0 ? "↑" : "↓"} {Math.abs(value)}%</span>{suffix}
    </span>
  );
}

/* ── Progress (grows in on mount) ─────────────────── */
export function Progress({ value, max = 100, color, className, markers, delay = 0 }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 60 + delay); return () => clearTimeout(t); }, [delay]);
  const p = Math.min(100, (value / max) * 100);
  const auto = value > max ? "var(--color-danger)" : p >= 80 ? "var(--color-warning)" : "var(--color-mint-400)";
  return (
    <div className={cn("relative h-1.5 overflow-hidden rounded-full bg-white/[0.07]", className)}>
      <div className="h-full origin-left rounded-full transition-[width] duration-[1100ms] ease-[var(--ease-out)]" style={{ width: on ? `${p}%` : "0%", background: color ?? auto }} />
      {markers?.map((m) => <span key={m} className="absolute inset-y-0 w-0.5 bg-ink-900" style={{ left: `${m}%` }} />)}
    </div>
  );
}

/* ── Category glyph ───────────────────────────────── */
const ICONS = { Home, ShoppingBasket, Zap, Car, HeartPulse, GraduationCap, Bike, UtensilsCrossed, ShoppingBag, Clapperboard, Plane, TrendingUp, Wallet, PiggyBank, CircleDashed };
export function CategoryIcon({ category, size = "md" }) {
  const Icon = ICONS[category?.icon] ?? CircleDashed;
  const s = size === "sm" ? "size-8 rounded-[10px]" : "size-10 rounded-xl";
  return (
    <span className={cn("grid shrink-0 place-items-center", s)} style={{ background: `${category?.color}1a`, color: category?.color }}>
      <Icon className={size === "sm" ? "size-4" : "size-[18px]"} strokeWidth={1.75} />
    </span>
  );
}

/* ── Modal → bottom sheet on phones, spring dialog on desktop ── */
export function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  const [render, setRender] = useState(open);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (open) { setRender(true); requestAnimationFrame(() => requestAnimationFrame(() => setShow(true))); }
    else { setShow(false); const t = setTimeout(() => setRender(false), 280); return () => clearTimeout(t); }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!render) return null;
  // Portal to <body> so no animated ancestor can trap the dialog under the tab bar
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={cn("absolute inset-0 bg-onyx/50 backdrop-blur-[3px] transition-opacity duration-300", show ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        className={cn(
          "relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-[var(--line)] bg-[var(--surface-raised)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--pop-shadow)] transition-[transform,opacity] sm:rounded-[1.5rem]",
          width,
          show ? "translate-y-0 opacity-100 duration-500 ease-[var(--ease-spring-soft)] sm:scale-100" : "translate-y-full opacity-0 duration-250 ease-[var(--ease-in-out)] sm:translate-y-3 sm:scale-95",
        )}
      >
        <span className="mx-auto -mt-2 mb-4 block h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl">{title}</h3>
          <button onClick={onClose} className="pressable rounded-full p-2 text-ink-400 hover:bg-white/[0.06] hover:text-ink-50" aria-label="Close"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ── States ───────────────────────────────────────── */
export const Skeleton = ({ className }) => <div className={cn("skeleton", className)} />;

export function EmptyState({ icon: Icon = Inbox, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Icon className="size-7 text-ink-500" strokeWidth={1.5} />
      <h4 className="mt-4 font-display text-xl">{title}</h4>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-400">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Segmented control with a sliding indicator ───── */
export function Segmented({ options, value, onChange, className }) {
  const wrap = useRef(null);
  const [pill, setPill] = useState(null);
  useLayoutEffect(() => {
    const el = wrap.current?.querySelector(`[data-value="${value}"]`);
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options.length]);
  return (
    <div ref={wrap} className={cn("relative inline-flex rounded-full border border-[var(--line)] bg-white/[0.03] p-1", className)} role="tablist">
      {pill && <span className="absolute inset-y-1 rounded-full bg-ink-50 transition-all duration-500 ease-[var(--ease-spring-soft)]" style={pill} aria-hidden="true" />}
      {options.map((o) => (
        <button
          key={o.value}
          data-value={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("relative z-[1] flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300", value === o.value ? "text-ink-900" : "text-ink-400 hover:text-ink-100")}
        >
          {o.icon && <o.icon className="size-4" strokeWidth={1.75} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
