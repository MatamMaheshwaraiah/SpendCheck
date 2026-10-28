import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Logo, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/context/ThemeContext";

function Shell({ children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between"><Link to="/" aria-label="SpendCheck home"><Logo /></Link><ThemeToggle /></div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-rise">{children}</div>
        <p className="text-xs text-ink-500">Passwords are hashed with bcrypt. Sessions use short-lived tokens.</p>
      </div>
      <aside className="relative hidden flex-col justify-between overflow-hidden border-l border-[var(--line)] bg-ink-850 p-14 lg:flex">
        <p className="text-sm text-ink-400">Every Sunday morning</p>
        <figure className="max-w-lg">
          <p className="text-sm text-iris-300"><span className="mr-1.5 text-iris-500">✳</span>Your weekly note</p>
          <blockquote className="ai-voice mt-5 text-[2.4rem] leading-[1.2]">
            You kept ₹3,240 more than last week. Groceries came in 12% under budget, and Netflix and Prime both renew on Thursday.
          </blockquote>
        </figure>
        <div className="flex h-3 gap-[3px] overflow-hidden rounded-full">
          <span className="w-[52%] rounded-full bg-need" /><span className="w-[24%] rounded-full bg-want" /><span className="w-[18%] rounded-full bg-save" /><span className="flex-1 rounded-full bg-white/[0.07]" />
        </div>
      </aside>
    </div>
  );
}

function PasswordField({ value, onChange, label = "Password", autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="label" htmlFor={label}>{label}</label>
      <div className="relative">
        <input id={label} className="field pr-11" type={show ? "text" : "password"} value={value} onChange={onChange} required minLength={6} autoComplete={autoComplete} placeholder="••••••••" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-100" aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: "ashok@spendcheck.app", password: "demo1234" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await login(f.email, f.password); nav(loc.state?.from ?? "/app", { replace: true }); }
    catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  }

  return (
    <Shell>
      <h1 className="font-display text-[2.6rem] leading-tight">Welcome back</h1>
      <p className="mt-2 text-ink-400">Log in to see where your money went this week.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="field" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required autoComplete="email" />
        </div>
        <PasswordField value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-300"><input type="checkbox" className="accent-[var(--color-mint-400)]" defaultChecked />Remember me</label>
          <a href="#" className="text-ink-300 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-ink-50">Forgot password?</a>
        </div>
        {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
        <Button type="submit" className="w-full" size="lg" loading={busy}>Log in</Button>
      </form>
      <p className="mt-4 text-center text-xs text-ink-400">The demo account is filled in for you.</p>
      <p className="mt-8 text-center text-sm text-ink-400">New here? <Link to="/register" className="font-medium text-ink-50 underline decoration-[var(--line-strong)] underline-offset-4">Create an account</Link></p>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ fullName: "", email: "", password: "", monthlyIncome: "", consentAi: true, consentReceipts: true });
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await register(f); nav("/app", { replace: true }); } finally { setBusy(false); }
  }

  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(f.password)).length);

  return (
    <Shell>
      <h1 className="font-display text-[2.6rem] leading-tight">Open your ledger</h1>
      <p className="mt-2 text-ink-400">Free for students. No bank login required.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div><label className="label" htmlFor="n">Full name</label><input id="n" className="field" value={f.fullName} onChange={set("fullName")} required autoComplete="name" placeholder="Priya Sharma" /></div>
        <div><label className="label" htmlFor="e">Email</label><input id="e" className="field" type="email" value={f.email} onChange={set("email")} required autoComplete="email" placeholder="you@college.edu" /></div>
        <div>
          <PasswordField value={f.password} onChange={set("password")} autoComplete="new-password" />
          <div className="mt-2 grid grid-cols-4 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 rounded-full ${i < strength ? ["bg-danger", "bg-warning", "bg-mint-500", "bg-mint-400"][strength - 1] : "bg-white/10"}`} />)}</div>
        </div>
        <div><label className="label" htmlFor="i">Monthly take-home income (₹) <span className="text-ink-500">· optional</span></label><input id="i" className="field num" inputMode="numeric" value={f.monthlyIncome} onChange={set("monthlyIncome")} placeholder="45,000" /></div>

        <fieldset className="space-y-2.5 rounded-2xl border border-[var(--line-strong)] p-4">
          <legend className="px-1 text-sm font-medium text-ink-200">What you allow</legend>
          <label className="flex items-start gap-2.5 text-sm text-ink-300"><input type="checkbox" className="mt-1 accent-[var(--color-mint-400)]" checked={f.consentAi} onChange={set("consentAi")} />Use AI to categorise transactions and generate insights</label>
          <label className="flex items-start gap-2.5 text-sm text-ink-300"><input type="checkbox" className="mt-1 accent-[var(--color-mint-400)]" checked={f.consentReceipts} onChange={set("consentReceipts")} />Store receipt images for my records</label>
          <label className="flex items-start gap-2.5 text-sm text-ink-300"><input type="checkbox" className="mt-1 accent-[var(--color-mint-400)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />I agree to the Terms and Privacy Notice</label>
        </fieldset>

        <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!agree}>Create account</Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-400">Already have an account? <Link to="/login" className="font-medium text-ink-50 underline decoration-[var(--line-strong)] underline-offset-4">Log in</Link></p>
    </Shell>
  );
}
