import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, Plus, PieChart, Sparkles, Target, Repeat, Bell, Settings,
  LogOut, Search, ScanLine, Menu, X, MessageSquareText, FileSpreadsheet, CornerDownLeft,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle, useTheme } from "@/context/ThemeContext";
import { api } from "@/services/api";
import { cn } from "@/lib/format";

const GROUPS = [
  { label: null, items: [
    { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
    { to: "/app/insights", label: "Ask & insights", icon: Sparkles },
  ] },
  { label: "Plan", items: [
    { to: "/app/budgets", label: "Budgets", icon: PieChart },
    { to: "/app/goals", label: "Goals", icon: Target },
    { to: "/app/subscriptions", label: "Subscriptions", icon: Repeat },
  ] },
  { label: "Account", items: [
    { to: "/app/alerts", label: "Alerts", icon: Bell },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ] },
];
const ALL = GROUPS.flatMap((g) => g.items);
const MOBILE = [ALL[0], ALL[1], null, ALL[2], ALL[3]];
const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
const initials = (n = "") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

/* Sidebar nav with one ink marker that glides to the active item */
function SideNav({ unread }) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  const [mark, setMark] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current?.querySelector("a[aria-current='page']");
    setMark(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
  }, [pathname]);
  return (
    <nav ref={ref} className="relative flex-1 overflow-y-auto px-3">
      {mark && <span className="absolute left-3 right-3 rounded-xl bg-white/[0.07] transition-all duration-500 ease-[var(--ease-spring-soft)]" style={mark} aria-hidden="true" />}
      {GROUPS.map((g, gi) => (
        <div key={gi} className={gi ? "mt-6" : ""}>
          {g.label && <p className="mb-1.5 px-3 text-xs font-medium text-ink-500">{g.label}</p>}
          {g.items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn("relative z-[1] flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] transition-colors", isActive ? "font-medium text-ink-50" : "text-ink-400 hover:text-ink-100")}>
              <Icon className="size-[17px]" strokeWidth={1.75} />
              {label}
              {label === "Alerts" && unread > 0 && <span className="num ml-auto grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-medium text-snow">{unread}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

/* ⌘K command palette: jump to any page or start an action from the keyboard */
const COMMANDS = [
  ...ALL.map((i) => ({ label: `Go to ${i.label}`, to: i.to, icon: i.icon })),
  { label: "Add an expense", to: "/app/add", icon: Plus },
  { label: "Scan a receipt", to: "/app/add?tab=receipt", icon: ScanLine },
  { label: "Paste bank SMS", to: "/app/add?tab=sms", icon: MessageSquareText },
  { label: "Import a bank statement", to: "/app/add?tab=statement", icon: FileSpreadsheet },
  { label: "Review uncertain transactions", to: "/app/transactions?review=1", icon: ArrowLeftRight },
];
function CommandPalette({ open, onClose }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef(null);
  useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  const list = q.startsWith("₹") || /^\d/.test(q) ? [] : COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  const items = q.trim() ? [...list, { label: `Search transactions for “${q}”`, to: `/app/transactions?q=${encodeURIComponent(q)}`, icon: Search }] : list;
  const go = (c) => { onClose(); nav(c.to); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command menu">
      <div className="absolute inset-0 animate-fade bg-onyx/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--pop-shadow)]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
          <Search className="size-4 text-ink-400" />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} placeholder="Type a command or search…" className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-400"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setI((i + 1) % items.length); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((i - 1 + items.length) % items.length); }
              if (e.key === "Enter" && items[i]) go(items[i]);
              if (e.key === "Escape") onClose();
            }} />
          <kbd className="rounded-md border border-[var(--line-strong)] px-1.5 py-0.5 text-[11px] text-ink-400">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {items.map((c, k) => (
            <li key={c.label}>
              <button onMouseEnter={() => setI(k)} onClick={() => go(c)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm", k === i ? "bg-white/[0.07] text-ink-50" : "text-ink-300")}>
                <c.icon className="size-4 text-ink-400" strokeWidth={1.75} />{c.label}
                {k === i && <CornerDownLeft className="ml-auto size-3.5 text-ink-400" />}
              </button>
            </li>
          ))}
          {!items.length && <li className="px-3 py-6 text-center text-sm text-ink-400">No matching command</li>}
        </ul>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);

  useEffect(() => { api.alerts().then((a) => setUnread(a.filter((x) => !x.read).length)); }, [loc.pathname]);
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [loc.pathname]);
  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd((c) => !c); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pb-6 pt-6">
        <Link to="/app" aria-label="SpendCheck home"><Logo /></Link>
        <button className="pressable rounded-full p-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
      </div>
      <div className="px-3 pb-5">
        <button onClick={() => nav("/app/add")} className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-ink-50 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-100">
          <Plus className="size-4" />Add money in or out
        </button>
      </div>
      <SideNav unread={unread} />
      <div className="m-3 flex items-center gap-3 rounded-2xl p-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint-400/15 text-[13px] font-semibold text-mint-300">{initials(user?.fullName)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.fullName}</p>
          <p className="truncate text-xs text-ink-400">{user?.email}</p>
        </div>
        <button onClick={async () => { await logout(); nav("/"); }} className="pressable rounded-full p-2 text-ink-400 hover:bg-white/[0.06] hover:text-danger" aria-label="Log out"><LogOut className="size-4" /></button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--line)] bg-ink-850 lg:block">{Sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade bg-onyx/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-[var(--line)] bg-ink-850 shadow-[var(--pop-shadow)] [animation:slidein_.45s_var(--ease-spring-soft)_both]">{Sidebar}</aside>
          <style>{"@keyframes slidein{from{transform:translateX(-100%)}to{transform:none}}"}</style>
        </div>
      )}

      <div className="lg:pl-64">
        <header style={{ paddingTop: "env(safe-area-inset-top)" }} className="sticky top-0 z-20 box-content flex h-16 items-center gap-2 border-b border-[var(--line)] bg-ink-900/80 px-4 backdrop-blur-xl sm:px-8">
          <button className="pressable rounded-full p-2 text-ink-300 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <Link to="/app" className="lg:hidden"><Logo compact /></Link>
          <button onClick={() => setCmd(true)} className="ml-auto hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-full border border-[var(--line)] bg-white/[0.03] px-4 text-sm text-ink-400 transition hover:border-[var(--line-strong)] md:flex lg:ml-0">
            <Search className="size-4" />Search or jump to…
            <kbd className="ml-auto rounded-md border border-[var(--line-strong)] px-1.5 text-[11px]">{MOD} K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setCmd(true)} className="pressable grid size-10 place-items-center rounded-full text-ink-300 hover:bg-white/[0.06] md:hidden" aria-label="Search"><Search className="size-[18px]" /></button>
            <ThemeToggle />
            <button onClick={() => nav("/app/alerts")} className="pressable relative grid size-10 place-items-center rounded-full text-ink-300 hover:bg-white/[0.06] hover:text-ink-50" aria-label={`Alerts, ${unread} unread`}>
              <Bell className="size-[18px]" strokeWidth={1.75} />
              {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-danger ring-2 ring-ink-900" />}
            </button>
          </div>
        </header>

        <main key={loc.pathname} className="relative mx-auto max-w-[1320px] animate-fade px-4 pb-32 pt-8 sm:px-8 lg:pb-16 lg:pt-10">
          <Outlet />
        </main>
      </div>

      {/* Phone tab bar */}
      <nav style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--line)] bg-ink-850/92 px-2 pt-2 backdrop-blur-xl lg:hidden">
        {MOBILE.map((item) =>
          !item ? (
            <button key="add" onClick={() => nav("/app/add")} className="pressable -mt-5 grid place-items-center" aria-label="Add money in or out">
              <span className="grid size-13 place-items-center rounded-full bg-ink-50 text-ink-900 shadow-[var(--pop-shadow)]"><Plus className="size-6" /></span>
            </button>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("pressable flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px]", isActive ? "font-medium text-ink-50" : "text-ink-400")}>
              {({ isActive }) => (
                <>
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors duration-300", isActive && "bg-white/[0.09]")}><item.icon className="size-[19px]" strokeWidth={1.75} /></span>
                  {item.label.split(" ")[0]}
                </>
              )}
            </NavLink>
          ),
        )}
      </nav>

      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  );
}
