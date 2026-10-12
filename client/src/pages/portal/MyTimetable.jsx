import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Button } from '../../components/ui';
import TimetableGrid from '../../components/TimetableGrid';

// Shared page: role decides which endpoint feeds the grid.
export default function MyTimetable({ kind }) {
  const [entries, setEntries] = useState(null);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/timetable/my/${kind}`),
      api.get('/timetable/slots'),
    ]).then(([e, s]) => { setEntries(e.data.entries); setSlots(s.data.slots); });
  }, [kind]);

  if (!entries) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">My Timetable</h1>
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
      </div>
      <Card>
        {entries.length === 0
          ? <p className="py-10 text-center text-sm text-slate-400">No timetable entries yet.</p>
          : <TimetableGrid entries={entries} slots={slots} />}
      </Card>
    </div>
  );
}
