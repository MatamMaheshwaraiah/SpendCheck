import { useState } from "react";
import { Check, X } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";

/** Confirm before wiping the ledger. Lists exactly what goes and what stays. */
export default function ResetDialog({ open, onClose, onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const demo = api.ledgerMode() === "demo";

  async function run(mode) {
    setBusy(mode);
    await api.resetData(mode);
    setBusy(null);
    toast(mode === "fresh" ? "Ledger cleared. Add your first entry." : "Sample data restored");
    onClose();
    onDone?.(mode);
  }

  return (
    <Modal open={open} onClose={onClose} title="Start a fresh ledger?">
      <p className="text-[15px] leading-relaxed text-ink-300">
        {demo ? "This removes the sample data so you can track your own money from zero." : "This removes everything you've added so far. It can't be undone."}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-ink-100">Cleared</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-300">
            {["All transactions", "Goals and savings", "Alerts and insights", "Category rules you created"].map((x) => <li key={x} className="flex items-center gap-2"><X className="size-3.5 text-danger" />{x}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-ink-100">Kept</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-300">
            {["Your account and settings", "Budget limits per category", "Theme and notifications"].map((x) => <li key={x} className="flex items-center gap-2"><Check className="size-3.5 text-success" />{x}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Keep my data</Button>
        <Button variant="danger" loading={busy === "fresh"} onClick={() => run("fresh")}>Clear everything</Button>
      </div>
      {!demo && (
        <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm text-ink-400">
          Want to look around first?{" "}
          <button onClick={() => run("demo")} className="text-ink-100 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-ink-50" disabled={!!busy}>Load the sample data instead</button>
        </p>
      )}
    </Modal>
  );
}
