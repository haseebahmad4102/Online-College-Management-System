import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, useFlash, useConfirm, errText, fmtDate } from '../../components/ui';

export default function Issues() {
  // library.view = watch the ledger; returns & fine actions need library.manage.
  const { can } = useAuth();
  const manage = can('library.manage');
  const [tab, setTab] = useState('out');
  const [issues, setIssues] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () => {
    setIssues(null);
    api.get('/library/issues', { params: { status: tab === 'out' ? 'open' : 'returned' } }).then((r) => setIssues(r.data.issues));
  };
  useEffect(load, [tab]);

  function doReturn(issue) {
    confirm(`Mark "${issue.book.title}" as returned by ${issue.student.name}?`, async () => {
      try {
        const r = await api.put(`/library/issues/${issue.id}/return`);
        flash({ type: 'ok', text: r.data.message });
        load();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function fine(issue, action) {
    try {
      await api.put(`/library/issues/${issue.id}/fine`, { action });
      flash({ type: 'ok', text: `Fine marked ${action}.` });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Issues & Returns</h1>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {[['out', 'Currently issued'], ['returned', 'Returned']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === k ? 'bg-primary text-white' : 'text-slate-600'}`}>{label}</button>
          ))}
        </div>
      </div>
      <Card>
        <Table
          columns={[
            { header: 'Book', cell: (i) => i.book.title },
            { header: 'Student', cell: (i) => `${i.student.name} (${i.student.rollNumber})` },
            { header: 'Issued', cell: (i) => fmtDate(i.issuedOn) },
            { header: 'Due', cell: (i) => <span className={i.overdue ? 'font-semibold text-accent' : ''}>{fmtDate(i.dueDate)}{i.overdue ? ' (overdue)' : ''}</span> },
            ...(tab === 'returned' ? [{ header: 'Returned', cell: (i) => fmtDate(i.returnedOn) }] : []),
            {
              header: 'Fine',
              cell: (i) => Number(i.projectedFine) > 0
                ? <span className="font-semibold text-accent">Rs. {Number(i.projectedFine)} {i.returnedOn && <Badge value={i.fineStatus} />}</span>
                : '—',
            },
            ...(manage ? [{
              header: 'Actions',
              cell: (i) => (
                <div className="flex gap-2">
                  {!i.returnedOn && <Button onClick={() => doReturn(i)}>Mark returned</Button>}
                  {i.returnedOn && i.fineStatus === 'pending' && (
                    <>
                      <Button variant="outline" onClick={() => fine(i, 'paid')}>Fine paid</Button>
                      <Button variant="outline" onClick={() => fine(i, 'waived')}>Waive</Button>
                    </>
                  )}
                </div>
              ),
            }] : []),
          ]}
          rows={issues ?? []}
          empty={issues === null ? 'Loading…' : 'Nothing here.'}
        />
      </Card>
    </div>
  );
}
