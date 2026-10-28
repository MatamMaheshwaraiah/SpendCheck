import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ToastCtx = createContext(() => {});
const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONE = { success: "text-mint-500", error: "text-danger", info: "text-ink-500" };

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = "success") => {
    const id = Math.random();
    setItems((t) => [...t, { id, message, type }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8" aria-live="polite">
        {items.map(({ id, message, type }) => {
          const Icon = ICON[type];
          return (
            <div key={id} className="pointer-events-auto flex animate-pop items-center gap-3 rounded-full bg-ink-50 py-2.5 pl-3 pr-5 text-sm font-medium text-ink-900 shadow-[var(--pop-shadow)]">
              <Icon className={`size-4 ${TONE[type]}`} />
              {message}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
