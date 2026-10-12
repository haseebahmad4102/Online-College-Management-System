import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Button, Modal, Field, Textarea, useFlash, errText, fmtDate } from '../../components/ui';

export default function BookRequests() {
  // library.view = watch the queue; deciding requests needs library.manage.
  const { can } = useAuth();
  const manage = can('library.manage');
  const [requests, setRequests] = useState(null);
  const [reject, setReject] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [flash, flashEl] = useFlash();

  const load = () => api.get('/library/requests').then((r) => setRequests(r.data.requests));
  useEffect(() => { load(); }, []);

  async function approve(r) {
    try {
      await api.put(`/library/requests/${r.id}/approve`);
      flash({ type: 'ok', text: `Issued "${r.book.title}" — copies decremented, student notified.` });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function doReject() {
    try {
      await api.put(`/library/requests/${reject.id}/reject`, { remarks });
      flash({ type: 'ok', text: 'Request rejected.' });
      setReject(null); setRemarks(''); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Pending Book Requests</h1>
      <Card>
        <Table
          columns={[
            { header: 'Book', cell: (r) => r.book.title },
            { header: 'Student', cell: (r) => `${r.student.name} (${r.student.rollNumber})` },
            { header: 'Days', cell: (r) => r.daysRequested },
            { header: 'Requested', cell: (r) => fmtDate(r.createdAt) },
            { header: 'Available', cell: (r) => `${r.book.availableCopies}/${r.book.totalCopies}` },
            ...(manage ? [{
              header: 'Actions',
              cell: (r) => (
                <div className="flex gap-2">
                  <Button onClick={() => approve(r)} disabled={r.book.availableCopies < 1}>Approve & issue</Button>
                  <Button variant="danger" onClick={() => setReject(r)}>Reject</Button>
                </div>
              ),
            }] : []),
          ]}
          rows={requests ?? []}
          empty={requests === null ? 'Loading…' : 'No pending requests.'}
        />
      </Card>

      <Modal open={!!reject} title={`Reject — ${reject?.book.title}`} onClose={() => setReject(null)}>
        <Field label="Remarks (sent to the student)">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
          <Button variant="danger" disabled={!remarks.trim()} onClick={doReject}>Reject</Button>
        </div>
      </Modal>
    </div>
  );
}
