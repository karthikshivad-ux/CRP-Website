import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  IndianRupee,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X
} from "lucide-react";
import "./GrowthAdmin.css";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(value || 0));

const date = (value, options = { day: "2-digit", month: "short", year: "numeric" }) => {
  if (!value) return "—";
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.valueOf()) ? "—" : parsed.toLocaleDateString("en-IN", options);
};

const memberCode = (id) => String(id || "").replaceAll("-", "").slice(0, 8).toUpperCase();

const getStatus = (member) => {
  if (member.membership_status === "active" && member.membership_end_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${member.membership_end_date}T00:00:00`);
    const days = Math.ceil((expiry - today) / 86400000);
    if (days < 0) return "expired";
    if (days <= 5) return "expiring";
  }
  return member.membership_status || "pending";
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

function memberExportDocument(members, status, generatedAt) {
  const labels = { active: "Active Members", expiring: "Expiring in the Next 5 Days", expired: "Expired Members" };
  const title = labels[status];
  const rows = members.map((member) => `
    <tr>
      <td>CRP-${escapeHtml(member.member_code || memberCode(member.id))}</td>
      <td><strong>${escapeHtml(member.name || "Unnamed member")}</strong><small>${escapeHtml(member.business_name || "")}${member.place ? `${member.business_name ? " · " : ""}${escapeHtml(member.place)}` : ""}</small></td>
      <td><strong>${escapeHtml(member.phone || "—")}</strong><small>WhatsApp: ${escapeHtml(member.whatsapp || "—")}</small></td>
      <td>${member.membership_plan === "yearly" ? "1 year" : member.membership_plan === "monthly" ? "1 month" : "—"}</td>
      <td>${escapeHtml(date(member.membership_start_date))}</td>
      <td>${escapeHtml(date(member.membership_end_date))}</td>
      <td>${escapeHtml(status)}</td>
      <td>${escapeHtml(member.payment_status || "—")}</td>
    </tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>CRP GROWTH - ${title}</title><style>
    @page{size:landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,"Noto Sans",sans-serif;color:#16344b;margin:0;font-size:10pt}
    header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #08729a;padding-bottom:12px;margin-bottom:18px}
    h1{font-size:20pt;margin:0 0 5px}p{margin:0;color:#64798a;font-size:9pt}.brand{font-weight:700;color:#08729a;font-size:9pt;letter-spacing:.12em}
    table{width:100%;border-collapse:collapse}th{background:#eef5f8;color:#456175;text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:.05em}
    th,td{padding:9px 8px;border-bottom:1px solid #dce6ec;vertical-align:top}td{font-size:9pt}td small{display:block;color:#768a98;margin-top:3px}footer{margin-top:12px;color:#7d8d99;font-size:8pt}
    .empty{padding:24px;text-align:center;color:#718392}@media print{tr{break-inside:avoid}}
  </style></head><body><header><div><div class="brand">CRP GROWTH · MEMBERSHIP</div><h1>${title}</h1><p>${members.length} member${members.length === 1 ? "" : "s"}</p></div><p>Generated ${escapeHtml(date(generatedAt, { day: "2-digit", month: "short", year: "numeric" }))}</p></header>
    <table><thead><tr><th>Member ID</th><th>Name / Business / Place</th><th>Phone / WhatsApp</th><th>Plan</th><th>Start date</th><th>Expiry date</th><th>Membership</th><th>Payment</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty">No members in this status group.</td></tr>'}</tbody></table>
    <footer>Confidential member information · CRP GROWTH</footer></body></html>`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Something went wrong. Please try again.");
  }
  return result;
}

function StatusPill({ value }) {
  const status = String(value || "pending").toLowerCase();
  const label = status === "expiring" ? "Next 5 days" : status;
  return <span className={`ga-status ga-status-${status}`}>{label}</span>;
}

function Loading({ label = "Loading dashboard…" }) {
  return <div className="ga-loading"><LoaderCircle size={19} className="ga-spin" />{label}</div>;
}

function GrowthAdminLogin({ onLogin, recovery, initialError }) {
  const [mode, setMode] = useState(recovery ? "recovery" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
        return;
      }
      if (mode === "forgot") {
        const result = await request("/api/admin/forgot-password", {
          method: "POST", body: JSON.stringify({ email })
        });
        setNotice(result.message);
        return;
      }
      if (password.length < 10) throw new Error("Use a password with at least 10 characters.");
      if (password !== confirmPassword) throw new Error("The passwords do not match.");
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const result = await request("/api/admin/update-password", {
        method: "POST",
        body: JSON.stringify({ accessToken, refreshToken, password })
      });
      window.history.replaceState({}, "", "/growth-admin");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setNotice(result.message);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "forgot" ? "Reset your password" : mode === "recovery" ? "Choose a new password" : "Admin sign in";
  const intro = mode === "forgot"
    ? "Enter your authorized admin email and we’ll send a reset link."
    : mode === "recovery"
      ? "Set a new password for your CRP GROWTH admin account."
      : "Sign in with your authorized admin account to manage memberships.";

  return (
    <div className="ga-login-page">
      <div className="ga-login-shade" />
      <a className="ga-login-brand" href="/" aria-label="CRP home">
        <img src="/crp-logo.png" alt="CRP Growth" />
        <span>GROWTH ADMIN</span>
      </a>
      <form className="ga-login-card" onSubmit={submit}>
        <div className="ga-login-mark"><ShieldCheck size={22} /></div>
        <span className="ga-eyebrow">CRP GROWTH · ADMINISTRATION</span>
        <h1>{title}</h1>
        <p className="ga-login-copy">{intro}</p>
        {initialError && <div className="ga-alert ga-alert-error"><AlertCircle size={17} />{initialError}</div>}

        {mode !== "recovery" && (
          <label className="ga-field">
            <span>Email address</span>
            <span className="ga-input-wrap"><Mail size={17} /><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" required /></span>
          </label>
        )}
        {mode !== "forgot" && (
          <label className="ga-field">
            <span>{mode === "recovery" ? "New password" : "Password"}</span>
            <span className="ga-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "login" ? "Enter your password" : "At least 10 characters"} required minLength={mode === "recovery" ? 10 : undefined} /><button className="ga-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
          </label>
        )}
        {mode === "recovery" && (
          <label className="ga-field">
            <span>Confirm new password</span>
            <span className="ga-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required minLength="10" /></span>
          </label>
        )}
        {mode === "login" && <button type="button" className="ga-forgot" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}>Forgot password?</button>}
        {error && <div className="ga-alert ga-alert-error"><AlertCircle size={17} />{error}</div>}
        {notice && <div className="ga-alert ga-alert-success"><CheckCircle2 size={17} />{notice}</div>}
        <button className="ga-primary ga-login-submit" type="submit" disabled={busy}>
          {busy ? <LoaderCircle size={18} className="ga-spin" /> : null}
          {busy ? "Please wait…" : mode === "login" ? "Sign In" : mode === "forgot" ? "Send reset link" : "Update password"}
          {!busy && mode === "login" && <ArrowRight size={18} />}
        </button>
        {mode !== "login" && <button className="ga-back-login" type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>Back to sign in</button>}
        <div className="ga-login-security"><LockKeyhole size={14} /> Protected admin access</div>
      </form>
      <p className="ga-login-footer">© {new Date().getFullYear()} CRP · GROWTH Membership</p>
    </div>
  );
}

function MetricCard({ title, value, hint, icon: Icon, color }) {
  return (
    <article className={`ga-metric ga-metric-${color}`}>
      <div className="ga-metric-icon"><Icon size={19} /></div>
      <div className="ga-metric-copy"><span>{title}</span><strong>{value}</strong><small>{hint}</small></div>
    </article>
  );
}

function MemberTable({ members, onView, compact = false }) {
  if (compact) {
    return (
      <div className="ga-recent-list">
        {members.map((member) => (
          <button type="button" className="ga-recent-member" key={member.id} onClick={() => onView(member.id)}>
            <span className="ga-avatar">{(member.name || "M").slice(0, 1).toUpperCase()}</span>
            <span className="ga-recent-copy"><strong>{member.name || "Unnamed member"}</strong><small>{member.phone || "—"}</small></span>
            <StatusPill value={getStatus(member)} />
            <ChevronRight size={16} />
          </button>
        ))}
        {!members.length && <p className="ga-empty">No member records yet.</p>}
      </div>
    );
  }

  return (
    <>
    <div className="ga-table-scroll ga-desktop-table">
      <table className="ga-table">
        <thead><tr><th>Member ID</th><th>Member</th><th>Phone</th><th>Plan</th><th>Start date</th><th>Expiry date</th><th>Status</th><th /></tr></thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td className="ga-member-code">CRP-{member.member_code || memberCode(member.id)}</td>
              <td><strong>{member.name || "Unnamed member"}</strong><small>{member.business_name || member.place || "—"}</small></td>
              <td>{member.phone || "—"}</td>
              <td>{member.membership_plan === "yearly" ? "1 year" : member.membership_plan === "monthly" ? "1 month" : "—"}</td>
              <td>{date(member.membership_start_date)}</td>
              <td>{date(member.membership_end_date)}</td>
              <td><StatusPill value={getStatus(member)} /></td>
              <td><button className="ga-icon-button" type="button" onClick={() => onView(member.id)} aria-label={`View ${member.name}`}><ArrowRight size={16} /></button></td>
            </tr>
          ))}
          {!members.length && <tr><td colSpan="8" className="ga-empty">No members match this search.</td></tr>}
        </tbody>
      </table>
    </div>
    <div className="ga-mobile-member-list">
      {members.map((member) => (
        <article className="ga-mobile-member-card" key={member.id}>
          <div className="ga-mobile-member-title"><span className="ga-avatar">{(member.name || "M").slice(0, 1).toUpperCase()}</span><span><strong>{member.name || "Unnamed member"}</strong><small>CRP-{member.member_code || memberCode(member.id)}</small></span><StatusPill value={getStatus(member)} /></div>
          <div className="ga-mobile-member-facts"><span><Phone size={13} />{member.phone || "—"}</span><span>{member.membership_plan === "yearly" ? "1 year" : member.membership_plan === "monthly" ? "1 month" : "No plan"}</span><span>Started {date(member.membership_start_date)}</span><span>Expires {date(member.membership_end_date)}</span></div>
          <button type="button" className="ga-mobile-view-member" onClick={() => onView(member.id)}>View member details <ArrowRight size={14} /></button>
        </article>
      ))}
      {!members.length && <p className="ga-empty">No members match this search.</p>}
    </div>
    </>
  );
}

function PaymentRows({ payments, onVerify, onFail }) {
  return (
    <>
    <div className="ga-table-scroll ga-desktop-table">
      <table className="ga-table ga-payment-table">
        <thead><tr><th>Payment</th><th>Member</th><th>Plan</th><th>Amount</th><th>Received</th><th>Status</th><th>Transaction / action</th></tr></thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td><strong>{payment.payment_reference}</strong><small>{date(payment.created_at, { day: "2-digit", month: "short", year: "numeric" })}</small></td>
              <td>{payment.member?.name || "Member"}<small>{payment.member?.phone || "—"}</small></td>
              <td>{payment.membership_plan === "yearly" ? "1 year" : "1 month"}</td>
              <td><strong>{money(payment.amount)}</strong></td>
              <td>{date(payment.paid_at, { day: "2-digit", month: "short", year: "numeric" })}</td>
              <td><StatusPill value={payment.status} /></td>
              <td>
                {payment.status === "pending" ? (
                  <div className="ga-payment-actions"><button className="ga-verify-button" type="button" onClick={() => onVerify(payment)}>Verify</button><button className="ga-fail-button" type="button" onClick={() => onFail(payment)}>Mark failed</button></div>
                ) : <span className="ga-payment-verified-cell">{payment.transaction_reference && <span className="ga-transaction-ref">{payment.transaction_reference}</span>}{payment.receipt_url && <a className="ga-receipt-link" href={payment.receipt_url} target="_blank" rel="noreferrer">Receipt <ArrowRight size={13} /></a>}{!payment.transaction_reference && !payment.receipt_url && "—"}</span>}
              </td>
            </tr>
          ))}
          {!payments.length && <tr><td colSpan="7" className="ga-empty">No payment records yet.</td></tr>}
        </tbody>
      </table>
    </div>
    <div className="ga-mobile-payment-list">
      {payments.map((payment) => (
        <article className="ga-mobile-payment-card" key={payment.id}>
          <div className="ga-mobile-payment-top"><span><strong>{payment.member?.name || "Member"}</strong><small>{payment.member?.phone || "—"}</small></span><StatusPill value={payment.status} /></div>
          <div className="ga-mobile-payment-amount"><strong>{money(payment.amount)}</strong><span>{payment.membership_plan === "yearly" ? "1 year" : "1 month"} · {date(payment.created_at)}</span></div>
          <div className="ga-mobile-payment-ref">Payment ref: {payment.payment_reference}</div>
          {payment.transaction_reference && <div className="ga-mobile-payment-ref">Transaction: {payment.transaction_reference}</div>}
          {payment.status === "pending" && <div className="ga-payment-actions"><button className="ga-verify-button" type="button" onClick={() => onVerify(payment)}>Verify payment</button><button className="ga-fail-button" type="button" onClick={() => onFail(payment)}>Mark failed</button></div>}
          {payment.receipt_url && <a className="ga-receipt-link" href={payment.receipt_url} target="_blank" rel="noreferrer">View receipt <ArrowRight size={13} /></a>}
        </article>
      ))}
      {!payments.length && <p className="ga-empty">No payment records yet.</p>}
    </div>
    </>
  );
}

function PaymentVerifyDialog({ payment, onClose, onSaved }) {
  const [transactionReference, setTransactionReference] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await request("/api/admin/verify-payment", {
        method: "POST",
        body: JSON.stringify({ paymentId: payment.id, action: "verify", transactionReference, paidAt, receiptUrl })
      });
      await onSaved();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ga-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="ga-modal" onSubmit={submit}>
        <button className="ga-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <span className="ga-eyebrow">PAYMENT REVIEW</span>
        <h2>Verify payment</h2>
        <p className="ga-modal-copy">Record the UPI transaction details for <strong>{payment.payment_reference}</strong> ({money(payment.amount)}).</p>
        <label className="ga-field"><span>Verified transaction reference</span><input value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="Enter UTR / transaction ID" required /></label>
        <label className="ga-field"><span>Payment date</span><input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} required /></label>
        <label className="ga-field"><span>Receipt link <small>Optional · HTTPS link</small></span><input type="url" value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} placeholder="https://…" /></label>
        {error && <div className="ga-alert ga-alert-error"><AlertCircle size={16} />{error}</div>}
        <div className="ga-modal-actions"><button type="button" className="ga-secondary" onClick={onClose}>Cancel</button><button className="ga-primary" disabled={busy}>{busy ? "Saving…" : "Verify and activate"}</button></div>
      </form>
    </div>
  );
}

function AddMemberDialog({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", businessName: "", place: "", phone: "", whatsapp: "", membershipPlan: "monthly" });
  const [whatsappEdited, setWhatsappEdited] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = form.membershipPlan === "yearly" ? 3000 : 300;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await request("/api/admin/add-member", { method: "POST", body: JSON.stringify(form) });
      await onSaved();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ga-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="ga-modal ga-add-member-modal" onSubmit={submit}>
        <button className="ga-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <span className="ga-eyebrow">MEMBER MANAGEMENT</span>
        <h2>Add a member</h2>
        <p className="ga-modal-copy">Add their details and create a pending payment. Verify the payment from the Payments page to activate the membership.</p>
        <label className="ga-field"><span>Full name</span><input value={form.name} onChange={(event) => update("name", event.target.value)} maxLength="120" autoComplete="name" required /></label>
        <div className="ga-form-grid">
          <label className="ga-field"><span>Business name <small>Optional</small></span><input value={form.businessName} onChange={(event) => update("businessName", event.target.value)} maxLength="160" /></label>
          <label className="ga-field"><span>Place <small>Optional</small></span><input value={form.place} onChange={(event) => update("place", event.target.value)} maxLength="160" /></label>
          <label className="ga-field"><span>Phone number</span><input type="tel" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={(event) => { const phone = event.target.value.replace(/\D/g, "").slice(0, 10); update("phone", phone); if (!whatsappEdited) update("whatsapp", phone); }} pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" required /></label>
          <label className="ga-field"><span>WhatsApp number <small>Defaults to phone</small></span><input type="tel" inputMode="numeric" value={form.whatsapp} onChange={(event) => { setWhatsappEdited(true); update("whatsapp", event.target.value.replace(/\D/g, "").slice(0, 10)); }} pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" required /></label>
        </div>
        <label className="ga-field"><span>Membership plan</span><select value={form.membershipPlan} onChange={(event) => update("membershipPlan", event.target.value)}><option value="monthly">1 month · ₹300</option><option value="yearly">1 year · ₹3,000</option></select></label>
        <div className="ga-add-member-note"><IndianRupee size={15} />A ₹{amount.toLocaleString("en-IN")} pending UPI payment record will be created.</div>
        {error && <div className="ga-alert ga-alert-error"><AlertCircle size={16} />{error}</div>}
        <div className="ga-modal-actions"><button type="button" className="ga-secondary" onClick={onClose}>Cancel</button><button className="ga-primary" disabled={busy}>{busy ? "Adding…" : "Add member"}</button></div>
      </form>
    </div>
  );
}

function MemberDetails({ id, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    request(`/api/admin/member?id=${encodeURIComponent(id)}`)
      .then((result) => { if (active) setData(result); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <Loading label="Loading member details…" />;
  if (error) return <div className="ga-alert ga-alert-error"><AlertCircle size={17} />{error}</div>;
  if (!data) return null;
  const { member, payments, membershipPeriods } = data;

  return (
    <div className="ga-details-page">
      <button type="button" className="ga-back-button" onClick={onBack}><ArrowLeft size={16} /> Back to members</button>
      <div className="ga-page-heading ga-detail-heading"><div><span className="ga-eyebrow">MEMBER PROFILE</span><h1>{member.name || "Member details"}</h1><p>CRP-{member.member_code || memberCode(member.id)} · Joined {date(member.created_at)}</p></div><StatusPill value={getStatus(member)} /></div>
      <div className="ga-detail-grid">
        <section className="ga-panel">
          <div className="ga-panel-heading"><h2>Contact details</h2></div>
          <dl className="ga-detail-list">
            <div><dt>Business</dt><dd>{member.business_name || "—"}</dd></div>
            <div><dt>Place</dt><dd><MapPin size={14} />{member.place || "—"}</dd></div>
            <div><dt>Phone</dt><dd><Phone size={14} />{member.phone || "—"}</dd></div>
            <div><dt>WhatsApp</dt><dd><Phone size={14} />{member.whatsapp || "—"}</dd></div>
            <div><dt>Member ID</dt><dd className="ga-break-word">{member.id}</dd></div>
          </dl>
        </section>
        <section className="ga-panel">
          <div className="ga-panel-heading"><h2>Current membership</h2></div>
          <dl className="ga-detail-list">
            <div><dt>Plan</dt><dd>{member.membership_plan === "yearly" ? "1 year · ₹3,000" : member.membership_plan === "monthly" ? "1 month · ₹300" : "Not verified yet"}</dd></div>
            <div><dt>Start date</dt><dd>{date(member.membership_start_date)}</dd></div>
            <div><dt>Expiry date</dt><dd>{date(member.membership_end_date)}</dd></div>
            <div><dt>Membership status</dt><dd><StatusPill value={getStatus(member)} /></dd></div>
            <div><dt>Payment status</dt><dd><StatusPill value={member.payment_status} /></dd></div>
          </dl>
        </section>
      </div>
      <section className="ga-panel ga-history-panel">
        <div className="ga-panel-heading"><div><h2>Membership history</h2><p>Previous terms and renewals</p></div></div>
        <div className="ga-table-scroll"><table className="ga-table"><thead><tr><th>Plan</th><th>Start date</th><th>Expiry date</th><th>Term</th></tr></thead><tbody>
          {membershipPeriods.map((period) => <tr key={period.id}><td>{period.membership_plan === "yearly" ? "1 year" : "1 month"}</td><td>{date(period.starts_on)}</td><td>{date(period.ends_on)}</td><td><StatusPill value={new Date(`${period.ends_on}T00:00:00`) < new Date(new Date().toDateString()) ? "expired" : "active"} /></td></tr>)}
          {!membershipPeriods.length && <tr><td colSpan="4" className="ga-empty">No verified membership periods recorded yet.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="ga-panel ga-history-panel">
        <div className="ga-panel-heading"><div><h2>Payment history</h2><p>UPI records and receipts</p></div></div>
        <div className="ga-table-scroll"><table className="ga-table"><thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Method</th><th>Transaction reference</th><th>Status</th><th>Receipt</th></tr></thead><tbody>
          {payments.map((payment) => <tr key={payment.id}><td>{date(payment.paid_at || payment.created_at)}</td><td>{payment.membership_plan === "yearly" ? "1 year" : "1 month"}</td><td>{money(payment.amount)}</td><td>{payment.payment_method || "UPI"}</td><td className="ga-member-code">{payment.transaction_reference || payment.payment_reference}</td><td><StatusPill value={payment.status} /></td><td>{payment.receipt_url ? <a className="ga-receipt-link" href={payment.receipt_url} target="_blank" rel="noreferrer">View receipt <ArrowRight size={13} /></a> : "—"}</td></tr>)}
          {!payments.length && <tr><td colSpan="7" className="ga-empty">No payments recorded yet.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}

export default function GrowthAdmin() {
  const [admin, setAdmin] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [initialError, setInitialError] = useState("");
  const [view, setView] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberId, setMemberId] = useState("");
  const [verifyPayment, setVerifyPayment] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportingStatus, setExportingStatus] = useState("");

  const recovery = useMemo(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    return new URLSearchParams(window.location.search).get("recovery") === "1" &&
      hash.get("type") === "recovery" && hash.has("access_token") && hash.has("refresh_token");
  }, []);

  const loadDashboard = async () => {
    const data = await request("/api/admin/dashboard");
    setDashboard(data);
    return data;
  };

  useEffect(() => {
    if (recovery) {
      setCheckingSession(false);
      return;
    }
    request("/api/admin/session")
      .then((session) => { setAdmin(session.admin); return loadDashboard(); })
      .catch((error) => {
        if (error.message !== "Please sign in." && error.message !== "Please sign in again.") setInitialError(error.message);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!admin) return;
    if (view === "dashboard") {
      setLoadingContent(true);
      setContentError("");
      loadDashboard().catch((error) => setContentError(error.message)).finally(() => setLoadingContent(false));
    }
    if (view === "members") loadMembers();
    if (view === "payments") loadPayments();
  }, [admin, view]);

  useEffect(() => {
    if (admin && view === "members") loadMembers();
  }, [search, statusFilter, planFilter, memberPage]);

  const loadMembers = async () => {
    setLoadingContent(true);
    setContentError("");
    const params = new URLSearchParams({ page: String(memberPage) });
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (planFilter) params.set("plan", planFilter);
    try {
      const result = await request(`/api/admin/members?${params}`);
      setMembers(result.members);
      setMembersTotal(result.total);
    } catch (error) {
      setContentError(error.message);
    } finally {
      setLoadingContent(false);
    }
  };

  const loadPayments = async () => {
    setLoadingContent(true);
    setContentError("");
    try {
      const result = await request("/api/admin/payments");
      setPayments(result.payments);
    } catch (error) {
      setContentError(error.message);
    } finally {
      setLoadingContent(false);
    }
  };

  const exportMemberPdf = async () => {
    if (!exportStatus || exportingStatus) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setContentError("Allow pop-ups for this site to export the PDF.");
      return;
    }
    printWindow.document.write("<!doctype html><title>Preparing member report…</title><p style='font:16px Arial;padding:24px'>Preparing member report…</p>");
    setContentError("");
    setExportingStatus(exportStatus);
    try {
      const result = await request(`/api/admin/members/export?status=${encodeURIComponent(exportStatus)}`);
      printWindow.document.open();
      printWindow.document.write(memberExportDocument(result.members, result.status, result.generatedAt));
      printWindow.document.close();
      printWindow.document.title = `CRP GROWTH ${exportStatus} members`;
      printWindow.focus();
      window.setTimeout(() => printWindow.print(), 350);
    } catch (error) {
      printWindow.close();
      setContentError(error.message);
    } finally {
      setExportingStatus("");
    }
  };

  const onMemberAdded = async () => {
    setAddMemberOpen(false);
    setSearch("");
    setStatusFilter("");
    setPlanFilter("");
    setMemberPage(1);
    setContentError("");
    try {
      const [list] = await Promise.all([
        request("/api/admin/members?page=1"),
        loadDashboard().catch(() => null)
      ]);
      setMembers(list.members);
      setMembersTotal(list.total);
    } catch (error) {
      setContentError(error.message);
    }
  };

  const login = async (email, password) => {
    const result = await request("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setAdmin(result.admin);
    setInitialError("");
    setView("dashboard");
    await loadDashboard();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    setAdmin(null);
    setDashboard(null);
    setView("dashboard");
  };

  const markFailed = async (payment) => {
    if (!window.confirm(`Mark payment ${payment.payment_reference} as failed?`)) return;
    setLoadingContent(true);
    try {
      await request("/api/admin/verify-payment", {
        method: "POST", body: JSON.stringify({ paymentId: payment.id, action: "failed" })
      });
      await loadPayments();
      await loadDashboard();
    } catch (error) {
      setContentError(error.message);
      setLoadingContent(false);
    }
  };

  const onPaymentSaved = async () => {
    setVerifyPayment(null);
    await loadPayments();
    await loadDashboard();
  };

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "members", label: "Members", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard }
  ];

  if (checkingSession) return <div className="ga-session-loading"><Loading label="Checking admin access…" /></div>;
  if (!admin || recovery) return <GrowthAdminLogin onLogin={login} recovery={recovery} initialError={initialError} />;

  const pageTitle = memberId ? "Member details" : navigation.find((item) => item.id === view)?.label || "Dashboard";
  const titleText = memberId ? "Member profile and history" : view === "dashboard" ? "Membership overview" : view === "members" ? "Manage CRP GROWTH members" : "Review and verify UPI payments";

  return (
    <div className="growth-admin-app">
      {mobileNavOpen && <button className="ga-nav-scrim" type="button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`ga-sidebar${mobileNavOpen ? " ga-sidebar-open" : ""}`}>
        <a className="ga-sidebar-brand" href="/" aria-label="CRP home"><img src="/crp-logo.png" alt="CRP Growth" /><span>ADMIN</span></a>
        <div className="ga-sidebar-section">WORKSPACE</div>
        <nav className="ga-side-nav" aria-label="Admin pages">
          {navigation.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={view === id && !memberId ? "is-active" : ""} onClick={() => { setView(id); setMemberId(""); setMobileNavOpen(false); }}><Icon size={18} />{label}{id === "payments" && <span className="ga-nav-count">UPI</span>}</button>)}
        </nav>
        <div className="ga-sidebar-spacer" />
        <div className="ga-sidebar-help"><ShieldCheck size={17} /><span><strong>Secure admin area</strong><small>Authorized CRP staff only</small></span></div>
        <button type="button" className="ga-logout" onClick={logout}><LogOut size={17} />Sign out</button>
      </aside>

      <div className="ga-main-column">
        <header className="ga-topbar">
          <button type="button" className="ga-mobile-menu" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="ga-topbar-title"><span>CRP GROWTH</span><ChevronDown size={14} /><small>ADMIN CONSOLE</small></div>
          <div className="ga-admin-profile"><span className="ga-admin-avatar">{(admin.email || "A").slice(0, 1).toUpperCase()}</span><span><strong>{admin.email}</strong><small>Administrator</small></span><ChevronDown size={15} /></div>
        </header>

        <main className="ga-content">
          {memberId ? (
            <MemberDetails id={memberId} onBack={() => { setMemberId(""); setView("members"); }} />
          ) : (
            <>
              <div className="ga-page-heading"><div><span className="ga-eyebrow">GROWTH MEMBERSHIP</span><h1>{pageTitle}</h1><p>{titleText}</p></div><button className="ga-refresh" type="button" onClick={() => view === "dashboard" ? loadDashboard().catch((error) => setContentError(error.message)) : view === "members" ? loadMembers() : loadPayments()} aria-label="Refresh data"><RefreshCw size={16} /><span>Refresh</span></button></div>

              {contentError && <div className="ga-alert ga-alert-error"><AlertCircle size={17} />{contentError}</div>}
              {loadingContent && <Loading />}

              {!loadingContent && view === "dashboard" && dashboard && (
                <>
                  <section className="ga-metrics-grid">
                    <MetricCard title="Currently valid" value={dashboard.stats.currentlyValid} hint="Active and within membership dates" icon={BadgeCheck} color="green" />
                    <MetricCard title="Next 5 days" value={dashboard.stats.expiringNextFiveDays} hint="Current memberships nearing expiry" icon={Clock3} color="amber" />
                    <MetricCard title="Total members" value={dashboard.stats.totalMembers} hint="All registered members" icon={Users} color="blue" />
                    <MetricCard title="Revenue this month" value={money(dashboard.stats.revenueThisMonth)} hint="Verified payments received this month" icon={IndianRupee} color="teal" />
                  </section>
                  <section className="ga-panel ga-overview-panel">
                    <div className="ga-panel-heading"><div><h2>Recent members</h2><p>Latest membership registrations</p></div><button type="button" className="ga-text-link" onClick={() => { setView("members"); setMemberId(""); }}>View all <ArrowRight size={15} /></button></div>
                    <MemberTable members={dashboard.recentMembers} onView={setMemberId} compact />
                  </section>
                  <div className="ga-dashboard-note"><Activity size={16} /><span>Revenue includes verified payments only. Pending UPI transfers are excluded until reviewed.</span></div>
                </>
              )}

              {!loadingContent && view === "members" && (
                <section className="ga-panel ga-members-panel">
                  <div className="ga-panel-heading ga-members-toolbar"><div className="ga-members-title-row"><div><h2>Members</h2><p>{membersTotal.toLocaleString("en-IN")} member records</p></div>
                    <div className="ga-member-actions">
                      <label className="ga-select-wrap ga-export-select"><FileText size={15} /><select aria-label="Choose member status to export" value={exportStatus} onChange={(event) => setExportStatus(event.target.value)}><option value="">Export status…</option><option value="active">Active members</option><option value="expiring">Expiring soon</option><option value="expired">Expired members</option></select><ChevronDown size={15} /></label>
                      <button className="ga-export-button" type="button" disabled={!exportStatus || Boolean(exportingStatus)} onClick={exportMemberPdf}><Download size={15} />{exportingStatus ? "Preparing…" : "Export PDF"}</button>
                      <button className="ga-add-member-button" type="button" onClick={() => setAddMemberOpen(true)}><UserPlus size={16} />Add member</button>
                    </div>
                  </div>
                    <div className="ga-filters"><label className="ga-search"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setMemberPage(1); }} placeholder="Search name, phone or member ID" /></label>
                      <label className="ga-select-wrap"><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setMemberPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="expiring">Expiring soon</option><option value="pending">Pending</option><option value="expired">Expired</option></select><ChevronDown size={15} /></label>
                      <label className="ga-select-wrap"><select value={planFilter} onChange={(event) => { setPlanFilter(event.target.value); setMemberPage(1); }}><option value="">All plans</option><option value="monthly">1 month</option><option value="yearly">1 year</option></select><ChevronDown size={15} /></label>
                    </div>
                  </div>
                  <MemberTable members={members} onView={setMemberId} />
                  <div className="ga-pagination"><span>Showing {membersTotal ? (memberPage - 1) * 20 + 1 : 0}–{Math.min(memberPage * 20, membersTotal)} of {membersTotal}</span><div><button type="button" disabled={memberPage <= 1} onClick={() => setMemberPage((page) => page - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><span>{memberPage}</span><button type="button" disabled={memberPage * 20 >= membersTotal} onClick={() => setMemberPage((page) => page + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
                </section>
              )}

              {!loadingContent && view === "payments" && (
                <section className="ga-panel ga-payments-panel"><div className="ga-panel-heading"><div><h2>Payments</h2><p>UPI registrations and verification history</p></div><span className="ga-payments-caption"><IndianRupee size={14} />Revenue counts verified transactions</span></div><PaymentRows payments={payments} onVerify={setVerifyPayment} onFail={markFailed} /></section>
              )}
            </>
          )}
        </main>
      </div>
      {verifyPayment && <PaymentVerifyDialog payment={verifyPayment} onClose={() => setVerifyPayment(null)} onSaved={onPaymentSaved} />}
      {addMemberOpen && <AddMemberDialog onClose={() => setAddMemberOpen(false)} onSaved={onMemberAdded} />}
    </div>
  );
}
