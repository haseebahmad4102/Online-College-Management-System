import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Select, Modal, Field, Textarea, useFlash, useConfirm, errText, fmtDate } from '../../components/ui';

export default function Challans() {
  // challans.view = read-only list; the verify/reject actions need challans.verify.
  const { can } = useAuth();
  const [status, setStatus] = useState('fee_submitted');
  const [challans, setChallans] = useState(null);
  const [reject, setReject] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () => {
    setChallans(null);
    api.get('/challans', { params: { status } }).then((r) => setChallans(r.data.challans));
  };
  useEffect(load, [status]);

  async function verify(challan) {
    confirm(
      `Verify challan ${challan.challanNo}? This enrolls the applicant: student record + roll number are created in one transaction.`,
      async () => {
        try {
          const r = await api.put(`/challans/${challan.id}/verify`);
          flash({ type: 'ok', text: r.data.message });
          load();
        } catch (e) { flash({ type: 'error', text: errText(e) }); }
      }
    );
  }

  async function doReject() {
    try {
      await api.put(`/challans/${reject.id}/reject`, { remarks });
      flash({ type: 'ok', text: 'Rejected — applicant asked to re-upload.' });
      setReject(null); setRemarks(''); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function viewPaidCopy(c) {
    const res = await api.get(`/challans/${c.id}/paid-copy`, { responseType: 'blob' });
    window.open(URL.createObjectURL(res.data), '_blank');
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Fee Challans</h1>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
          {['fee_submitted', 'unpaid', 'verified', 'rejected', 'expired', 'all'].map((s) => (
            <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
          ))}
        </Select>
      </div>
      <Card>
        <Table
          columns={[
            { header: 'Challan No', cell: (c) => c.challanNo },
            { header: 'Applicant / Student', cell: (c) => c.application?.name ?? c.student?.name ?? '—' },
            { header: 'Program', cell: (c) => c.application?.program?.name ?? '—' },
            { header: 'Amount', cell: (c) => `Rs. ${Number(c.totalAmount).toLocaleString()}` },
            { header: 'Due', cell: (c) => fmtDate(c.dueDate) },
            { header: 'Status', cell: (c) => <Badge value={c.status} /> },
            {
              header: 'Actions',
              cell: (c) => (
                <div className="flex gap-2">
                  {c.paidCopyPath && <Button variant="outline" onClick={() => viewPaidCopy(c)}>Paid copy</Button>}
                  {c.status === 'fee_submitted' && can('challans.verify') && <Button onClick={() => verify(c)}>Verify → enroll</Button>}
                  {c.status === 'fee_submitted' && can('challans.verify') && <Button variant="danger" onClick={() => setReject(c)}>Reject</Button>}
                </div>
              ),
            },
          ]}
          rows={challans ?? []}
          empty={challans === null ? 'Loading…' : 'No challans in this state.'}
        />
      </Card>

      <Modal open={!!reject} title={`Reject paid copy — ${reject?.challanNo}`} onClose={() => setReject(null)}>
        <Field label="Reason (sent to the applicant)">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Bank stamp not visible" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
          <Button variant="danger" disabled={!remarks.trim()} onClick={doReject}>Reject</Button>
        </div>
      </Modal>
    </div>
  );
}
