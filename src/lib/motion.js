/* Small, dependency-free motion toolkit.
   - useReducedMotion: respects the OS setting everywhere
   - useCountUp: rAF number tween with expo-out easing (money that "settles")
   - useInView: fire once when an element scrolls into view
   - viewTransition: wrap a DOM change in the View Transitions API when available */
import { useEffect, useRef, useState } from "react";

export function useReducedMotion() {
  const [r, setR] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

const expoOut = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function useCountUp(target, { duration = 1100, delay = 0 } = {}) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(reduced ? target : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced || target == null) { setV(target); return; }
    let raf, start;
    const a = from.current, b = Number(target) || 0;
    const t0 = setTimeout(() => {
      const step = (now) => {
        start ??= now;
        const p = Math.min(1, (now - start) / duration);
        setV(a + (b - a) * expoOut(p));
        if (p < 1) raf = requestAnimationFrame(step);
        else from.current = b;
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t0); cancelAnimationFrame(raf); from.current = b; };
  }, [target, duration, delay, reduced]);
  return v;
}

export function useInView({ threshold = 0.25, once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (once) io.disconnect(); }
      else if (!once) setInView(false);
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return [ref, inView];
}

export function viewTransition(update, origin) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) { update(); return; }
  const t = document.startViewTransition(update);
  if (!origin) return;
  const { x, y } = origin;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  }).catch(() => {});
}
