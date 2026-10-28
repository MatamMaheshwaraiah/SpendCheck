import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PenLine, ScanLine, MessageSquareText, FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, Camera, RotateCcw, Wand2 } from "lucide-react";
import { api } from "@/services/api";
import { PageHeader, Card, Button, Segmented, CategoryIcon, BucketPill, ConfidenceDot, Badge, AIBadge, Amount } from "@/components/ui";
import { CATEGORIES, categorize, catById } from "@/data/categories";
import { SAMPLE_SMS } from "@/data/mock";
import { formatINR, isoDay } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

const TABS = [
  { value: "manual", label: "Manual", icon: PenLine },
  { value: "receipt", label: "Photo of bill", icon: ScanLine },
  { value: "sms", label: "Bank SMS", icon: MessageSquareText },
  { value: "statement", label: "Statement", icon: FileSpreadsheet },
];

export default function AddImport() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "manual";
  return (
    <>
      <PageHeader title="Add to your ledger" subtitle="Type it, photograph it, paste the bank message or upload a statement." />
      <div className="-mx-4 mb-6 overflow-x-auto px-4"><Segmented value={tab} onChange={(v) => setParams({ tab: v })} options={TABS} /></div>
      <div key={tab} className="animate-rise">
        {tab === "manual" && <Manual />}
        {tab === "receipt" && <Receipt />}
        {tab === "sms" && <Sms />}
        {tab === "statement" && <Statement />}
      </div>
    </>
  );
}

/* ── Manual ─────────────────────────────────────────────────────── */
function Manual() {
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ description: "", amount: "", date: isoDay(new Date()), direction: "debit", categoryId: "" });
  const [busy, setBusy] = useState(false);
  const guess = f.description.length > 2 ? categorize(f.description) : null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    await api.addTransaction({ ...f, categoryId: f.categoryId || guess?.categoryId });
    toast("Expense added");
    nav("/app/transactions");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-1 rounded-full border border-[var(--line)] p-1">
            {["debit", "credit"].map((d) => (
              <button type="button" key={d} onClick={() => setF({ ...f, direction: d, categoryId: "" })} className={`pressable rounded-full py-2 text-sm font-medium ${f.direction === d ? (d === "debit" ? "bg-want/15 text-want" : "bg-success/15 text-success") : "text-ink-400"}`}>
                {d === "debit" ? "Money out" : "Money in"}
              </button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="amt">Amount</label>
            <div className="relative">
              <span className="num absolute left-1 top-1/2 -translate-y-1/2 text-3xl text-ink-400">₹</span>
              <input id="amt" className="field num h-20 border-0 border-b bg-transparent pl-9 text-[2.6rem] font-medium rounded-none focus:shadow-none" inputMode="decimal" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="desc">What was it for?</label>
            <input id="desc" className="field" required value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="e.g. Swiggy dinner, Apollo pharmacy, auto to college" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="dt">Date</label><input id="dt" type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div>
              <label className="label" htmlFor="cat">Category</label>
              <select id="cat" className="field" value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
                <option value="">Detect automatically</option>
                {CATEGORIES.filter((c) => c.kind === (f.direction === "debit" ? "expense" : "income")).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>Add to ledger</Button>
        </form>
      </Card>

      <Card ai>
        <AIBadge label="How this will be filed" />
        {guess && f.direction === "debit" ? (
          <div className="mt-5 animate-fade">
            <div className="flex items-center gap-3">
              <CategoryIcon category={catById[f.categoryId || guess.categoryId]} />
              <div><p className="font-semibold">{catById[f.categoryId || guess.categoryId].name}</p><BucketPill bucket={catById[f.categoryId || guess.categoryId].bucket} /></div>
              <span className="ml-auto"><ConfidenceDot value={f.categoryId ? 1 : guess.confidence} /></span>
            </div>
            <ol className="mt-6 space-y-2 text-sm">
              {[["1", "Your rules", "rule"], ["2", "Merchant dictionary", "dictionary"], ["3", "Your history (kNN)", "knn"], ["4", "LLM fallback", "llm"]].map(([n, l, k]) => {
                const hit = guess.classifiedBy === k;
                return (
                  <li key={k} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${hit ? "bg-iris-500/12 text-ink-50" : "text-ink-400"}`}>
                    <span className="num grid size-6 place-items-center rounded-md bg-white/[0.06] text-xs">{n}</span>{l}
                    {hit && <CheckCircle2 className="ml-auto size-4 text-iris-500" />}
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-ink-400">Cheap, deterministic stages run first. The LLM is only called when they aren't confident — keeping cost and latency low.</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-ink-400">Start typing a description — SpendCheck shows the category, needs/wants bucket and which stage of the classifier decided it.</p>
        )}
      </Card>
    </div>
  );
}

/* ── Receipt OCR ────────────────────────────────────────────────── */
function Receipt() {
  const toast = useToast();
  const nav = useNavigate();
  const input = useRef();
  const [img, setImg] = useState(null);
  const [state, setState] = useState("idle"); // idle | scanning | review
  const [r, setR] = useState(null);
  const [drag, setDrag] = useState(false);

  async function handle(file) {
    if (!file) return;
    if (!/^image\/|pdf$/.test(file.type)) return toast("Please upload an image or PDF", "error");
    if (file.size > 5 * 1024 * 1024) return toast("Max file size is 5 MB", "error");
    setImg(URL.createObjectURL(file));
    setState("scanning");
    const res = await api.scanReceipt(file);
    setR(res);
    setState("review");
  }

  const itemsSum = r ? r.items.reduce((s, i) => s + i.qty * i.price, 0) : 0;
  const computedTotal = r ? +(Number(r.subtotal) + Number(r.cgst) + Number(r.sgst)).toFixed(2) : 0;
  const flags = r ? [
    { ok: Math.abs(itemsSum - r.subtotal) < 1, label: "Line items add up to subtotal" },
    { ok: Math.abs(computedTotal - r.total) <= 1, label: `Subtotal + CGST + SGST = total (computed ${formatINR(computedTotal, true)})` },
    { ok: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(r.gstin), label: "GSTIN format is valid" },
    { ok: new Date(r.date) <= new Date(), label: "Date is not in the future" },
  ] : [];

  async function confirm() {
    await api.addTransaction({ description: `POS/${r.merchant.toUpperCase()}`, amount: r.total, date: r.date, direction: "debit", categoryId: r.categoryId, source: "receipt" });
    toast("Receipt saved with 6 line items");
    nav("/app/transactions");
  }

  if (state === "idle")
    return (
      <Card className="p-0 sm:p-0">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
          className={`m-4 flex flex-col items-center rounded-[1.25rem] border-2 border-dashed px-6 py-16 text-center transition ${drag ? "border-iris-400 bg-iris-500/10" : "border-white/10"}`}
        >
          <UploadCloud className="size-9 text-ink-400" strokeWidth={1.25} />
          <h3 className="mt-5 font-display text-3xl">Drop a receipt or bill here</h3>
          <p className="mt-2 max-w-md text-sm text-ink-400">JPG, PNG or PDF up to 5 MB. Works with thermal supermarket bills, restaurant invoices, pharmacy and fuel receipts.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="ai" onClick={() => input.current.click()}><UploadCloud className="size-4" />Choose file</Button>
            <Button variant="secondary" onClick={() => { input.current.setAttribute("capture", "environment"); input.current.click(); }}><Camera className="size-4" />Use camera</Button>
          </div>
          <input ref={input} type="file" accept="image/*,application/pdf" hidden onChange={(e) => handle(e.target.files[0])} />
          <ul className="mt-10 grid gap-3 text-left text-xs text-ink-400 sm:grid-cols-3">
            <li className="border-t border-[var(--line)] pt-3"><b className="block font-medium text-ink-200">1. The AI reads it</b>Merchant, items, GST and total</li>
            <li className="border-t border-[var(--line)] pt-3"><b className="block font-medium text-ink-200">2. The maths is checked</b>Totals and GSTIN must agree</li>
            <li className="border-t border-[var(--line)] pt-3"><b className="block font-medium text-ink-200">3. You confirm</b>Anything odd is highlighted</li>
          </ul>
        </div>
      </Card>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
      <Card className="relative overflow-hidden">
        <div className="relative overflow-hidden rounded-2xl bg-ink-950">
          <img src={img} alt="Uploaded receipt" className="max-h-[560px] w-full object-contain" />
          {state === "scanning" && (
            <>
              <div className="absolute inset-0 bg-iris-500/10" />
              <div className="absolute inset-x-0 h-0.5 animate-scan bg-iris-400 shadow-[0_0_24px_6px_rgb(157_140_255/0.6)]" />
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setState("idle"); setR(null); }}><RotateCcw className="size-4" />Scan another</Button>
      </Card>

      {state === "scanning" ? (
        <Card ai className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-3xl text-iris-500 [animation:spin_3s_linear_infinite]" aria-hidden="true">✳</span>
          <p className="ai-voice mt-4 text-2xl">Reading your receipt…</p>
          <p className="mt-1 text-sm text-ink-400">Extracting items, taxes and totals</p>
        </Card>
      ) : (
        <Card>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <AIBadge label="Read from your photo" />
            <Badge className="num">{r.engine}</Badge>
            <Badge className="num">{(r.latencyMs / 1000).toFixed(1)}s</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Merchant" value={r.merchant} conf={r.confidence.merchant} />
            <Field label="Date" value={r.date} conf={r.confidence.date} type="date" />
            <Field label="GSTIN" value={r.gstin} conf={r.confidence.gstin} mono />
            <div>
              <label className="label">Category</label>
              <div className="field flex items-center gap-2"><CategoryIcon category={catById[r.categoryId]} size="sm" />{catById[r.categoryId].name}<span className="ml-auto"><BucketPill bucket="need" /></span></div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-xs text-ink-400"><tr><th className="p-3 text-left font-medium">Item</th><th className="p-3 font-medium">Qty</th><th className="p-3 text-right font-medium">Amount</th></tr></thead>
              <tbody className="num">
                {r.items.map((i) => <tr key={i.name} className="border-t border-white/[0.04]"><td className="p-3 font-sans">{i.name}</td><td className="p-3 text-center text-ink-300">{i.qty}</td><td className="p-3 text-right">{formatINR(i.qty * i.price, true)}</td></tr>)}
                {[["Subtotal", r.subtotal], ["CGST 2.5%", r.cgst], ["SGST 2.5%", r.sgst]].map(([k, v]) => <tr key={k} className="border-t border-white/[0.04] text-ink-300"><td className="p-3 font-sans" colSpan={2}>{k}</td><td className="p-3 text-right">{formatINR(v, true)}</td></tr>)}
                <tr className={`border-t ${flags[1].ok ? "border-white/[0.06]" : "border-danger/40 bg-danger/[0.07]"}`}>
                  <td className="p-3 font-sans font-semibold" colSpan={2}>Total on receipt {!flags[1].ok && <Badge tone="danger" className="ml-2">Check</Badge>}</td>
                  <td className="p-3 text-right text-base font-semibold">{formatINR(r.total, true)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-2">
            {flags.map((f) => (
              <li key={f.label} className={`flex items-center gap-2 text-sm ${f.ok ? "text-ink-300" : "text-danger"}`}>
                {f.ok ? <CheckCircle2 className="size-4 text-success" /> : <AlertTriangle className="size-4" />}{f.label}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={confirm}>Confirm & save {formatINR(r.total)}</Button>
            <Button variant="secondary" onClick={() => setR({ ...r, total: computedTotal })}><Wand2 className="size-4" />Use computed total</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, conf, type = "text", mono }) {
  const low = conf < 0.85;
  return (
    <div>
      <label className="label flex justify-between">{label}<ConfidenceDot value={conf} /></label>
      <input type={type} defaultValue={value} className={`field ${mono ? "num" : ""} ${low ? "border-warning/50" : ""}`} />
    </div>
  );
}

/* ── SMS ────────────────────────────────────────────────────────── */
function Sms() {
  const toast = useToast();
  const [text, setText] = useState("");
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);

  async function parse() {
    setBusy(true);
    setRows(await api.parseSms(text || SAMPLE_SMS));
    if (!text) setText(SAMPLE_SMS);
    setBusy(false);
  }
  async function importAll() {
    for (const r of rows.filter((x) => x.ok)) await api.addTransaction({ description: `UPI/${r.direction === "debit" ? "DR" : "CR"}/${r.merchant.toUpperCase()}`, amount: r.amount, direction: r.direction, date: isoDay(new Date()), categoryId: r.categoryId, source: "sms" });
    toast(`${rows.filter((x) => x.ok).length} transactions imported`);
    setRows(null); setText("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="font-display text-2xl">Paste bank / UPI SMS alerts</h3>
        <p className="mt-1 text-sm text-ink-400">Copy one or many messages from your SMS app. Separate messages with a blank line.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="field num mt-4 resize-none text-[13px] leading-relaxed" placeholder={SAMPLE_SMS} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={parse} loading={busy}>{text ? "Read these messages" : "Try four sample messages"}</Button>
          {text && <Button variant="ghost" onClick={() => { setText(""); setRows(null); }}>Clear</Button>}
        </div>
        <p className="mt-5 rounded-xl bg-white/[0.03] p-3 text-xs text-ink-400">Why paste instead of auto-read? Google Play only lets the default SMS app read messages. Pasting (or Android's Share → SpendCheck) keeps you in control and keeps the app policy-compliant.</p>
      </Card>

      <Card>
        <h3 className="font-display text-2xl">Detected transactions</h3>
        {!rows ? (
          <p className="mt-6 text-sm text-ink-400">Parsed results appear here — amount, direction, merchant, account and UPI reference.</p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {rows.map((r, i) => (
                <li key={i} className={`rounded-2xl border p-4 ${r.ok ? "border-white/[0.06] bg-white/[0.02]" : "border-danger/30 bg-danger/5"}`}>
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={r.category} size="sm" />
                    <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.merchant}</p><p className="text-xs text-ink-400">{r.category.name} · {r.date}</p></div>
                    <Amount value={r.amount} direction={r.direction} className="font-semibold" />
                  </div>
                  <div className="num mt-3 flex flex-wrap gap-2 text-[11px]">
                    {r.last4 && <Badge>A/c ••{r.last4}</Badge>}
                    {r.ref && <Badge>Ref {r.ref}</Badge>}
                    <BucketPill bucket={r.direction === "credit" ? "none" : r.bucket} />
                    <ConfidenceDot value={r.confidence} />
                  </div>
                </li>
              ))}
            </ul>
            <Button className="mt-5 w-full" onClick={importAll}>Import {rows.filter((x) => x.ok).length} transactions</Button>
          </>
        )}
      </Card>
    </div>
  );
}

/* ── Statement ──────────────────────────────────────────────────── */
function Statement() {
  const input = useRef();
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bank, setBank] = useState("HDFC Bank");

  async function handle(file) {
    if (!file) return;
    setBusy(true);
    setRes(await api.importStatement(file));
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <h3 className="font-display text-2xl">Upload a bank statement</h3>
        <p className="mt-1 text-sm text-ink-400">CSV, XLSX or PDF exported from net banking.</p>
        <label className="label mt-5" htmlFor="bank">Bank</label>
        <select id="bank" className="field" value={bank} onChange={(e) => setBank(e.target.value)}>
          {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Other (auto-detect columns)"].map((b) => <option key={b}>{b}</option>)}
        </select>
        <button onClick={() => input.current.click()} className="mt-5 flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-white/10 py-12 text-center hover:border-mint-400/50 hover:bg-mint-400/[0.03]">
          <FileSpreadsheet className="size-8 text-mint-400" />
          <span className="mt-3 font-semibold">{busy ? "Processing…" : "Choose statement file"}</span>
          <span className="mt-1 text-xs text-ink-400">Password-protected PDFs: unlock before uploading</span>
        </button>
        <input ref={input} type="file" hidden accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => handle(e.target.files[0])} />
      </Card>
      <Card>
        <h3 className="font-display text-2xl">Import summary</h3>
        {!res ? <p className="mt-6 text-sm text-ink-400">Upload a file to see how many rows were imported, de-duplicated and auto-categorised.</p> : (
          <div className="mt-5 animate-fade space-y-3">
            <p className="truncate text-sm text-ink-400">{res.fileName}</p>
            {[["Rows found", res.rowsTotal, "text-ink-50"], ["Imported", res.rowsImported, "text-mint-300"], ["Duplicates skipped", res.rowsDuplicate, "text-ink-300"], ["Auto-categorised", res.autoCategorised, "text-iris-300"], ["Sent to review", res.needsReview, "text-warning"]].map(([k, v, c]) => (
              <div key={k} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3"><span className="text-sm text-ink-300">{k}</span><span className={`num text-lg font-semibold ${c}`}>{v}</span></div>
            ))}
            <p className="text-xs text-ink-400">Duplicates are detected with a SHA-256 hash of date, amount, account and reference — so the same payment from SMS and statement is counted once.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
