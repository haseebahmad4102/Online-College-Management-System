import { useEffect, useRef, useState, Fragment } from 'react';

// Shared portal UI kit (§9) — one source for cards, badges, tables, forms, modals.

// Shows any image inside a fixed box without cropping or stretching it: the photo
// is letterboxed (object-contain) over a blurred copy of itself, so odd aspect
// ratios still fill the frame and look intentional. Use for every rectangular
// content image (gallery, cards, banners); circular avatars keep object-cover.
export function FitImage({ src, alt = '', className = '', imgClassName = '', ...props }) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-lg" />
      <img src={src} alt={alt} className={`relative h-full w-full object-contain ${imgClassName}`} {...props} />
    </div>
  );
}

// One-tap photo upload: the button itself opens the device file picker (camera roll
// on phones) and hands the chosen file straight to onPick — no separate
// "Choose File" step. Large tap target for mobile.
export function PhotoPicker({ onPick, label = 'Choose photo & upload', busy = false, className = '' }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow re-picking the same file
          if (file) onPick(file);
        }}
      />
      <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={`min-h-11 ${className}`}>
        {busy ? 'Uploading…' : label}
      </Button>
    </>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <div className="flex gap-2">{actions}</div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Stat({ label, value, accent = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-primary hover:shadow-md active:scale-95' : ''
      }`}
    >
      <div className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-primary'}`}>{value ?? '—'}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

const BADGE_COLORS = {
  // application lifecycle (§6.4)
  submitted: 'bg-blue-100 text-blue-700',
  docs_rejected: 'bg-orange-100 text-orange-700',
  verified: 'bg-teal-100 text-teal-700',
  selected: 'bg-green-100 text-green-700',
  waitlisted: 'bg-yellow-100 text-yellow-700',
  challan_issued: 'bg-indigo-100 text-indigo-700',
  fee_submitted: 'bg-purple-100 text-purple-700',
  enrolled: 'bg-green-100 text-green-800',
  forfeited: 'bg-red-100 text-red-700',
  not_selected: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
  // generic
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  unpaid: 'bg-orange-100 text-orange-700',
  expired: 'bg-slate-100 text-slate-600',
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  leave: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
  waiting: 'bg-yellow-100 text-yellow-700',
  admitted: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-700',
  waived: 'bg-slate-100 text-slate-600',
  none: 'bg-slate-100 text-slate-500',
  active: 'bg-green-100 text-green-700',
  // student lifecycle
  inactive: 'bg-slate-200 text-slate-700',
  passed_out: 'bg-blue-100 text-blue-700',
  struck_off: 'bg-red-100 text-red-700',
  permanent: 'bg-green-100 text-green-700',
  cti: 'bg-blue-100 text-blue-700',
  adhoc: 'bg-yellow-100 text-yellow-700',
  visiting: 'bg-purple-100 text-purple-700',
};

export function Badge({ value }) {
  const cls = BADGE_COLORS[value] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {String(value).replaceAll('_', ' ')}
    </span>
  );
}

export function Table({ columns = [], rows = [], empty = 'Nothing here yet.', onRowClick, expandedRowRender }) {
  const safeCols = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return <EmptyState label={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            {safeCols.map((c) => <th key={c.header} className="py-2 pr-4">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((row, i) => {
            const expandedContent = expandedRowRender ? expandedRowRender(row) : null;
            return (
              <Fragment key={row.id ?? i}>
                <tr
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${onRowClick ? 'cursor-pointer hover:bg-slate-100/50' : ''}`}
                >
                  {safeCols.map((c) => {
                    let content = '—';
                    try { content = c.cell(row); } catch (e) { console.error('Table cell render error:', e); content = 'Error'; }
                    return <td key={c.header} className="py-2.5 pr-4 align-middle">{content}</td>;
                  })}
                </tr>
                {expandedContent && (
                  <tr>
                    <td colSpan={safeCols.length} className="border-b border-slate-200 bg-slate-50 p-4">
                      {expandedContent}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ label }) {
  return <div className="py-10 text-center text-sm text-slate-400">{label}</div>;
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    danger: 'bg-accent text-white hover:opacity-90',
    outline: 'border border-slate-300 text-slate-700 hover:border-primary hover:text-primary',
    ghost: 'text-primary hover:bg-green-50',
  };
  return (
    <button
      className={`rounded-lg px-3.5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white';

export function Input(props) {
  return <input className={inputCls} {...props} />;
}
export function Select({ children, ...props }) {
  return <select className={inputCls} {...props}>{children}</select>;
}
export function Textarea(props) {
  return <textarea className={inputCls} rows={3} {...props} />;
}

export function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-14" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Confirm dialog for destructive actions (§1.7)
export function useConfirm() {
  const [state, setState] = useState(null); // {message, onYes}
  const confirm = (message, onYes) => setState({ message, onYes });
  const dialog = (
    <Modal open={!!state} title="Please confirm" onClose={() => setState(null)}>
      <p className="mb-5 text-sm text-slate-600">{state?.message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setState(null)}>Cancel</Button>
        <Button variant="danger" onClick={() => { state.onYes(); setState(null); }}>Yes, continue</Button>
      </div>
    </Modal>
  );
  return [confirm, dialog];
}

// Flash messages (§1.7)
export function useFlash() {
  const [flash, setFlash] = useState(null); // {type, text}
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);
  const el = flash && (
    <div
      className={`fixed right-4 top-4 z-[60] rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        flash.type === 'error' ? 'bg-red-600 text-white' : 'bg-primary text-white'
      }`}
    >
      {flash.text}
    </div>
  );
  return [setFlash, el];
}

export function errText(err) {
  return err?.response?.data?.message || 'Something went wrong.';
}

// Prev/Next pager for server-paginated tables.
export function Pager({ page, pages, total, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
      <span>Page {page} of {pages}{total != null && ` — ${total} record${total === 1 ? '' : 's'}`}</span>
      <div className="flex gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</Button>
        <Button variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</Button>
      </div>
    </div>
  );
}

// Build a CSV from {header, value(row)} columns and download it (Excel-ready).
export function downloadCsv(filename, columns, rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => esc(c.value(row))).join(','));
  // BOM so Excel opens UTF-8 (names in Urdu etc.) correctly.
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Auto-format a CNIC/B-Form as the user types → #####-#######-# (13 digits max).
export function formatCnic(value) {
  const d = String(value ?? '').replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

// Whole years between a date-of-birth and a reference date (default: today).
export function ageInYears(dob, at = new Date()) {
  if (!dob) return null;
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return null;
  let age = at.getFullYear() - b.getFullYear();
  const m = at.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < b.getDate())) age -= 1;
  return age;
}

export function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
export function fmtDateTime(d) {
  if (!d) return '—';
  const s = new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  return s.replace(' am', ' AM').replace(' pm', ' PM');
}
// "HH:MM" (24h, as stored for time slots) → "h:MM AM/PM"
export function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Class-term label: BS programs run in semesters (Semester 1–8); intermediate
// programs (FA/FSc/ICS) run in years (1st/2nd Year) — termNo there means the
// study year, not a semester. Mirrors the convention in Promotion.jsx.
export function termLabel(level, termNo) {
  if (termNo == null) return '';
  if (level === 'intermediate') {
    return `${termNo === 1 ? '1st' : termNo === 2 ? '2nd' : `${termNo}th`} Year`;
  }
  return `Semester ${termNo}`;
}
