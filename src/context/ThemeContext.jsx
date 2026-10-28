import { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/format";
import { viewTransition } from "@/lib/motion";

const ThemeCtx = createContext(null);
const KEY = "spendcheck.theme";
const media = () => window.matchMedia("(prefers-color-scheme: light)");
const resolve = (pref) => (pref === "system" ? (media().matches ? "light" : "dark") : pref);

function read() {
  try { return localStorage.getItem(KEY) || "system"; } catch { return "system"; }
}

function apply(theme) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#ffffff" : "#0e1122");
}

export function ThemeProvider({ children }) {
  const [pref, setPrefState] = useState(read);
  const [theme, setTheme] = useState(() => resolve(read()));

  useEffect(() => {
    const t = resolve(pref);
    setTheme(t);
    apply(t);
    try { localStorage.setItem(KEY, pref); } catch { /* storage blocked */ }
    if (pref !== "system") return;
    const m = media();
    const on = () => { const n = resolve("system"); viewTransition(() => apply(n)); setTheme(n); };
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [pref]);

  /** Change preference; the new theme spreads out from `origin` (the clicked control). */
  const setPref = (next, origin) => {
    const t = resolve(next);
    viewTransition(() => apply(t), origin);
    setPrefState(next);
  };
  const originOf = (e) => {
    const r = e?.currentTarget?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined;
  };
  const toggle = (e) => setPref(theme === "dark" ? "light" : "dark", originOf(e));
  return <ThemeCtx.Provider value={{ pref, theme, setPref, toggle, originOf }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/** Icon button: sun ↔ moon with a spring swap */
export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn("pressable relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-ink-300 hover:bg-white/[0.06] hover:text-ink-50", className)}
    >
      <Sun className={cn("absolute size-[18px] transition-all duration-700 [transition-timing-function:var(--ease-spring)]", dark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")} />
      <Moon className={cn("absolute size-[18px] transition-all duration-700 [transition-timing-function:var(--ease-spring)]", dark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
    </button>
  );
}

/** Light / Dark / System picker with miniature previews */
export function ThemePicker() {
  const { pref, setPref, originOf } = useTheme();
  const opts = [
    { value: "light", label: "Light", icon: Sun, bg: "#ffffff", card: "#f7f8fa", ink: "#151a30" },
    { value: "dark", label: "Dark", icon: Moon, bg: "#0e1122", card: "#1c2137", ink: "#e2e4ec" },
    { value: "system", label: "Match device", icon: Monitor, bg: "linear-gradient(120deg,#ffffff 50%,#0e1122 50%)", card: "rgb(128 132 150 / .35)", ink: "#80859b" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
      {opts.map(({ value, label, icon: Icon, bg, card, ink }) => (
        <button key={value} role="radio" aria-checked={pref === value} onClick={(e) => setPref(value, originOf(e))}
          className={cn("pressable rounded-2xl border p-2 text-left", pref === value ? "border-mint-400 ring-4 ring-mint-400/15" : "border-white/[0.08] hover:border-white/20")}>
          <div className="relative h-16 overflow-hidden rounded-xl border border-white/[0.08]" style={{ background: bg }}>
            <span className="absolute inset-x-2 top-2 h-1.5 w-10 rounded-full" style={{ background: ink, opacity: 0.8 }} />
            <span className="absolute bottom-2 left-2 right-8 h-6 rounded-md" style={{ background: card }} />
            <span className="absolute bottom-2 right-2 size-4 rounded-full bg-[#0c7a6d]" />
          </div>
          <span className="mt-2 flex items-center gap-1.5 px-1 text-sm font-medium"><Icon className="size-4" />{label}</span>
        </button>
      ))}
    </div>
  );
}
