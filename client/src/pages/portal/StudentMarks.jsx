import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';
import { Card, Table, Badge, fmtDate } from '../../components/ui';

function getGP(percentage) {
  if (percentage >= 85) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 75) return 3.3;
  if (percentage >= 70) return 3.0;
  if (percentage >= 65) return 2.7;
  if (percentage >= 60) return 2.3;
  if (percentage >= 55) return 2.0;
  if (percentage >= 50) return 1.7;
  return 0.0;
}

export default function StudentMarks() {
  const [marks, setMarks] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    api.get('/assessments/mine').then((r) => setMarks(r.data.marks));
  }, []);

  const stats = useMemo(() => {
    if (!marks) return null;
    
    // Group by subject to calculate subject-wise percentage and GP
    const subjects = {};
    marks.forEach(m => {
      if (!subjects[m.subjectId]) {
        subjects[m.subjectId] = { name: m.subject, ch: m.creditHours, obtained: 0, total: 0 };
      }
      subjects[m.subjectId].obtained += (Number(m.obtained) || 0);
      subjects[m.subjectId].total += (Number(m.total) || 0);
    });

    let totalPoints = 0;
    let totalCH = 0;

    Object.values(subjects).forEach(s => {
      if (s.total > 0) {
        const perc = (s.obtained / s.total) * 100;
        const gp = getGP(perc);
        totalPoints += (gp * s.ch);
        totalCH += s.ch;
      }
    });

    const cgpa = totalCH > 0 ? (totalPoints / totalCH).toFixed(2) : '0.00';
    return { cgpa, totalCH };
  }, [marks]);

  const filtered = useMemo(() => {
    if (!marks) return [];
    if (typeFilter === 'all') return marks;
    return marks.filter(m => m.type === typeFilter);
  }, [marks, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Results</h1>
          <p className="text-sm text-slate-500">Only published marks appear here.</p>
        </div>
        {stats && (
          <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-primary/70 uppercase">CGPA</div>
              <div className="text-2xl font-black text-primary">{stats.cgpa}</div>
            </div>
            <div className="h-10 w-px bg-primary/20"></div>
            <div className="text-right">
              <div className="text-xs font-semibold text-primary/70 uppercase">Credit Hrs</div>
              <div className="text-2xl font-black text-primary">{stats.totalCH}</div>
            </div>
          </div>
        )}
      </div>

      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="flex gap-2">
            {['all', 'midterm', 'final', 'practical', 'sessional'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${typeFilter === t ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t === 'all' ? 'All Results' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Table
          columns={[
            { header: 'Subject', cell: (m) => m.subject },
            { header: 'Assessment', cell: (m) => m.title },
            { header: 'Type', cell: (m) => <Badge value={m.type} /> },
            { header: 'Held', cell: (m) => fmtDate(m.heldOn) },
            { header: 'Marks', cell: (m) => m.obtained === null ? <Badge value="absent" /> : <span className="font-semibold text-primary">{Number(m.obtained)} / {m.total}</span> },
          ]}
          rows={filtered}
          empty={marks === null ? 'Loading…' : 'No results found.'}
        />
      </Card>
    </div>
  );
}
