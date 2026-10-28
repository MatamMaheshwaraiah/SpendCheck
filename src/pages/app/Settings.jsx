import { useState } from "react";
import { User, Landmark, ShieldCheck, Bell, Download, Trash2, CreditCard, Wallet, Banknote } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, CardHeader, Button, Amount, Badge, Modal } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import ResetDialog from "@/components/ResetDialog";
import { Palette } from "lucide-react";
import { ThemePicker } from "@/context/ThemeContext";

function Toggle({ label, hint, defaultOn = true }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div><p className="text-sm font-medium">{label}</p>{hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}</div>
      <button role="switch" aria-checked={on} aria-label={label} onClick={() => setOn(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-mint-400" : "bg-ink-600"}`}>
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-snow shadow-sm transition-transform duration-500 ease-[var(--ease-spring)] ${on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

const ACC_ICON = { bank: Landmark, credit_card: CreditCard, cash: Banknote, wallet: Wallet };

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const accounts = useApi(() => api.accounts(), []);
  const [del, setDel] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <PageHeader title="Settings" subtitle="Your details, accounts, appearance, notifications and privacy." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" icon={User} />
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast("Profile saved"); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Full name</label><input className="field" defaultValue={user?.fullName} /></div>
              <div><label className="label">Email</label><input className="field" defaultValue={user?.email} type="email" /></div>
              <div><label className="label">Monthly income (₹)</label><input className="field num" defaultValue={user?.monthlyIncome} /></div>
              <div><label className="label">Language</label><select className="field"><option>English</option><option>हिन्दी</option><option>తెలుగు</option></select></div>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Accounts" icon={Landmark} action={<Button size="sm" variant="secondary">Add</Button>} />
          <ul className="space-y-2">
            {(accounts.data ?? []).map((a) => {
              const I = ACC_ICON[a.type] ?? Wallet;
              return (
                <li key={a.id} className="flex items-center gap-3 border-t border-[var(--line)] py-3 first:border-t-0">
                  <span className="grid size-10 place-items-center rounded-full border border-[var(--line)] text-ink-300"><I className="size-[18px]" strokeWidth={1.75} /></span>
                  <div className="flex-1"><p className="text-sm font-medium">{a.name}</p><p className="num text-xs text-ink-400">{a.institution ?? "Cash"}{a.last4 && ` ••${a.last4}`}</p></div>
                  <Amount value={a.balance} className={a.balance < 0 ? "text-danger" : ""} />
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-ink-400">Direct bank sync through RBI’s Account Aggregator framework is planned.</p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Appearance" icon={Palette} subtitle="System follows your device setting and switches automatically" />
          <div className="max-w-xl"><ThemePicker /></div>
        </Card>

        <Card>
          <CardHeader title="Notifications" icon={Bell} />
          <div className="divide-y divide-white/[0.05]">
            <Toggle label="Budget threshold alerts" hint="At 50%, 80% and 100% of each budget" />
            <Toggle label="Unusual spending" hint="Transactions far above your normal for a category" />
            <Toggle label="Subscription renewals" hint="3 days before auto-debit" />
            <Toggle label="Weekly note from SpendCheck AI" hint="Sunday mornings, a short summary of your week" />
            <Toggle label="Email notifications" defaultOn={false} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Privacy and your data" subtitle="What you’ve agreed to, under India’s DPDP Act" />
          <div className="divide-y divide-white/[0.05]">
            <Toggle label="AI processing" hint="Categorisation, insights and the assistant. Personal identifiers are removed first." />
            <Toggle label="Store receipt images" hint="Off = images are deleted right after extraction" />
            <Toggle label="On-device OCR (privacy mode)" hint="Receipts are read in your browser; only text is sent" defaultOn={false} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => toast("Your data export is being prepared", "info")}><Download className="size-4" />Export my data</Button>
            <Button variant="secondary" onClick={() => setResetOpen(true)}><RotateCcw className="size-4" />Start a fresh ledger</Button>
            <Button variant="danger" onClick={() => setDel(true)}><Trash2 className="size-4" />Delete account</Button>
          </div>
        </Card>
      </div>

      <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} onDone={() => nav("/app")} />

      <Modal open={del} onClose={() => setDel(false)} title="Delete your account?">
        <p className="text-sm text-ink-300">This permanently erases your transactions, receipts, budgets and goals. This cannot be undone.</p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDel(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={async () => { await logout(); nav("/"); }}>Delete permanently</Button>
        </div>
      </Modal>
    </>
  );
}
