import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Badge, Stat, fmtDate } from '../../components/ui';

export default function StudentAttendance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/attendance/mine').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Overall" value={`${data.overall}%`} accent={data.overall < 75} />
      </div>
      <Card title="Subject-wise">
        <Table
          columns={[
            { header: 'Subject', cell: (s) => s.subject },
            { header: 'Present', cell: (s) => s.present },
            { header: 'Absent', cell: (s) => s.absent },
            { header: 'Leave', cell: (s) => s.leave },
            { header: 'Lectures', cell: (s) => s.total },
            { header: '%', cell: (s) => <span className={s.percentage < 75 ? 'font-semibold text-accent' : 'font-semibold text-primary'}>{s.percentage}%</span> },
          ]}
          rows={data.subjects}
          empty="No attendance marked yet."
        />
      </Card>
      <Card title="Recent lectures">
        <Table
          columns={[
            { header: 'Date', cell: (r) => fmtDate(r.date) },
            { header: 'Subject', cell: (r) => r.subject },
            { header: 'Status', cell: (r) => <Badge value={r.status} /> },
          ]}
          rows={data.recent}
        />
      </Card>
    </div>
  );
}
