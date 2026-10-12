import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Badge, Button, useFlash, errText, fmtDate } from '../../components/ui';
import ChallanPrint from '../../components/ChallanPrint';

export default function StudentChallans() {
  const [student, setStudent] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [flash, flashEl] = useFlash();

  const load = () => api.get('/students/me').then((r) => setStudent(r.data.student));
  useEffect(() => { load(); }, []);

  async function openPrint(c) {
    const r = await api.get(`/challans/${c.id}/print-data`);
    setPrintData(r.data);
  }

  async function uploadPaid(c, file) {
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/challans/${c.id}/paid-copy`, fd);
      flash({ type: 'ok', text: 'Paid copy uploaded — awaiting clerk verification.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  if (!student) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Fee Challans</h1>
      <Card>
        <Table
          columns={[
            { header: 'Challan No', cell: (c) => c.challanNo },
            { header: 'Amount', cell: (c) => `Rs. ${Number(c.totalAmount).toLocaleString()}` },
            { header: 'Due', cell: (c) => fmtDate(c.dueDate) },
            { header: 'Status', cell: (c) => <Badge value={c.status} /> },
            {
              header: 'Actions',
              cell: (c) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openPrint(c)}>View / print</Button>
                  {['unpaid', 'rejected'].includes(c.status) && (
                    <label className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                      Upload paid copy
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                        onChange={(e) => e.target.files[0] && uploadPaid(c, e.target.files[0])} />
                    </label>
                  )}
                </div>
              ),
            },
          ]}
          rows={student.challans}
          empty="No challans issued to you."
        />
      </Card>
      {printData && <ChallanPrint data={printData} onClose={() => setPrintData(null)} />}
    </div>
  );
}
