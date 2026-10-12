import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Field, Input, Button, useFlash, errText } from '../../components/ui';
import BookRequests from './BookRequests';
import Issues from './Issues';
import Books from './Books';

// One home for every librarian/principal library screen (§5.11) — replaces the four
// separate sidebar entries (Book Requests, Issues & Returns, Catalog, Settings).
const TABS = [
  ['requests', 'Book Requests', BookRequests],
  ['issues', 'Issues & Returns', Issues],
  ['catalog', 'Library Catalog', Books],
  ['settings', 'Library Settings', LibrarySettings],
];

export default function Library() {
  const [tab, setTab] = useState('requests');
  const [stats, setStats] = useState(null);
  const Active = TABS.find(([k]) => k === tab)?.[2] ?? BookRequests;

  // Re-pull the counters whenever the active tab changes so they reflect just-made actions.
  useEffect(() => { api.get('/library/stats').then((r) => setStats(r.data.stats)).catch(() => setStats(null)); }, [tab]);

  const cards = stats ? [
    ['Titles', stats.titles],
    ['Copies (avail/total)', `${stats.availableCopies}/${stats.totalCopies}`],
    ['Issued out', stats.issuedOut],
    ['Overdue', stats.overdue, stats.overdue > 0],
    ['Pending requests', stats.pendingRequests, stats.pendingRequests > 0],
    ['Categories', stats.categories],
  ] : [];

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map(([label, value, alert]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className={`text-xl font-bold ${alert ? 'text-accent' : 'text-primary'}`}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === k ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}

// Friendly, labelled library-rule editor — saves straight to the library.* settings group.
const SETTINGS_FIELDS = [
  ['library.max_books', 'Books a student can borrow at once', 'Maximum number of books issued to one student at the same time.'],
  ['library.max_days', 'Maximum issue period (days)', 'Longest number of days a student may request a book for.'],
  ['library.fine_per_day', 'Fine per late day (Rs.)', 'Charged for each day a book is returned past its due date.'],
  ['library.grace_days', 'Grace days before a fine starts', 'Late days ignored before the fine begins. Set 0 for no grace period.'],
];

function LibrarySettings() {
  // Reading these needs settings.view (route-guarded); saving needs settings.update.
  const { can } = useAuth();
  const [values, setValues] = useState(null);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [flash, flashEl] = useFlash();

  const load = () =>
    api.get('/settings').then((r) => {
      const lib = Object.fromEntries(r.data.settings.filter((s) => s.group === 'library').map((s) => [s.key, s.value]));
      setValues(lib);
      setEdits({});
    });
  useEffect(() => { load(); }, []);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await api.put('/settings', { updates: edits });
      flash({ type: 'ok', text: 'Library settings saved — new rules apply to future requests and returns.' });
      await load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  if (!values) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Library Settings</h1>
        {can('settings.update') && (
          <Button disabled={saving || Object.keys(edits).length === 0} onClick={save}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </div>
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_FIELDS.map(([key, label, hint]) => (
            <Field key={key} label={label} hint={hint}>
              <Input
                type="number"
                min="0"
                value={edits[key] ?? values[key] ?? ''}
                onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
      </Card>
    </div>
  );
}
