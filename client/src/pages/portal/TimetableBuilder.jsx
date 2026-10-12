import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Select, Modal, Field, useFlash, useConfirm, errText, fmtTime } from '../../components/ui';
import TimetableGrid from '../../components/TimetableGrid';

// Timetable builder per class shift — TimetableConflictChecker names the exact clash (§6.8)
export default function TimetableBuilder() {
  // timetable.view = read/print the grid; assigning or clearing needs timetable.manage.
  const { can } = useAuth();
  const manage = can('timetable.manage');
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filters, setFilters] = useState({ departmentId: '', sessionId: '', shift: '' });
  const [sectionId, setSectionId] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [slots, setSlots] = useState([]);
  const [rooms, setRooms] = useState([]); // {id, name, type, busy, busyWith, block} for the open cell
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [cell, setCell] = useState(null); // {day, slot, entry}
  const [form, setForm] = useState({ allocationId: '', roomId: '' });
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  useEffect(() => {
    Promise.all([
      api.get('/academic/sections'),
      api.get('/academic/departments'),
      api.get('/academic/sessions'),
    ]).then(([s, d, ss]) => {
      setSections(s.data.sections);
      setDepartments(d.data.departments);
      setSessions(ss.data.sessions);
    });
  }, []);

  // Class-shift picker is narrowed by department / session / shift so a controller
  // with many classes can drill down instead of scrolling one long list.
  const filteredSections = sections.filter((s) =>
    (!filters.departmentId || String(s.program?.departmentId) === String(filters.departmentId))
    && (!filters.sessionId || String(s.academicSessionId) === String(filters.sessionId))
    && (!filters.shift || s.shift === filters.shift));

  // Changing a filter clears a now-hidden selection so the grid never shows a class
  // that no longer matches the filters.
  function applyFilter(patch) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const stillVisible = sections.some((s) => String(s.id) === String(sectionId)
      && (!next.departmentId || String(s.program?.departmentId) === String(next.departmentId))
      && (!next.sessionId || String(s.academicSessionId) === String(next.sessionId))
      && (!next.shift || s.shift === next.shift));
    if (!stillVisible && sectionId) loadSection('');
  }

  // Which rooms are free for this exact day + period — busy ones are shown disabled so a
  // room clash can't be picked in the first place (the server still re-checks on save).
  async function openCell(day, slot, entry) {
    setCell({ day, slot, entry });
    setForm({ allocationId: entry?.allocationId ?? '', roomId: entry?.roomId ?? '' });
    setLoadingRooms(true);
    setRooms([]);
    try {
      const r = await api.get('/timetable/available-rooms', {
        params: { day, timeSlotId: slot.id, ...(entry ? { excludeEntry: entry.id } : {}) },
      });
      setRooms(r.data.rooms);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setLoadingRooms(false); }
  }

  // Rooms grouped by block for the dropdown.
  const roomsByBlock = rooms.reduce((acc, r) => {
    const key = r.block?.name ?? 'Unassigned';
    (acc[key] ??= []).push(r);
    return acc;
  }, {});
  const freeRoomCount = rooms.filter((r) => !r.busy).length;

  const loadSection = async (id) => {
    setSectionId(id);
    const klass = sections.find((s) => String(s.id) === String(id));
    setSelectedClass(klass ?? null);
    if (!id || !klass) {
      setEntries([]);
      setAllocations([]);
      setSlots([]);
      return;
    }
    const [e, a, slotRes] = await Promise.all([
      api.get('/timetable/entries', { params: { section: id } }),
      api.get('/academic/allocations', { params: { section: id } }),
      api.get('/timetable/slots', { params: { shift: klass.shift } }),
    ]);
    setEntries(e.data.entries);
    setAllocations(a.data.allocations);
    setSlots(slotRes.data.slots);
  };

  async function saveEntry() {
    try {
      await api.post('/timetable/entries', {
        allocationId: form.allocationId, day: cell.day, timeSlotId: cell.slot.id, roomId: form.roomId,
      });
      flash({ type: 'ok', text: 'Period saved.' });
      setCell(null); loadSection(sectionId);
    } catch (e) {
      // conflict message names the exact clash — surface it verbatim
      flash({ type: 'error', text: errText(e) });
    }
  }

  function clearAll() {
    confirm(`Clear all ${entries.length} periods from this class's timetable?`, async () => {
      try {
        const r = await api.delete('/timetable/entries', { params: { section: sectionId } });
        flash({ type: 'ok', text: r.data.message });
        loadSection(sectionId);
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function removeEntry(entry) {
    try {
      await api.delete(`/timetable/entries/${entry.id}`);
      flash({ type: 'ok', text: 'Period removed.' });
      setCell(null); loadSection(sectionId);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Timetable Builder</h1>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Department">
            <Select value={filters.departmentId} onChange={(e) => applyFilter({ departmentId: e.target.value })}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Session">
            <Select value={filters.sessionId} onChange={(e) => applyFilter({ sessionId: e.target.value })}>
              <option value="">All sessions</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Shift">
            <Select value={filters.shift} onChange={(e) => applyFilter({ shift: e.target.value })}>
              <option value="">All shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </Select>
          </Field>
          <Field label="Class shift" hint={`${filteredSections.length} class${filteredSections.length === 1 ? '' : 'es'} match`}>
            <Select value={sectionId} onChange={(e) => loadSection(e.target.value)}>
              <option value="">Select a class shift…</option>
              {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.program.code} Semester {s.termNo} · {s.academicSession.name} · {s.shift}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      {sectionId ? (
        <Card
          actions={
            <div className="flex gap-2">
              {manage && <Button variant="danger" onClick={clearAll} disabled={!entries.length}>Clear all</Button>}
              <Button variant="outline" onClick={() => window.print()}>Print grid</Button>
            </div>
          }
          title={`Weekly grid — ${selectedClass?.shift ?? ''} shift`}
        >
          <TimetableGrid
            className="print-area"
            entries={entries}
            slots={slots}
            onCellClick={manage ? openCell : undefined}
          />
        </Card>
      ) : (
        <Card><p className="py-10 text-center text-sm text-slate-400">Pick a class shift to start building.</p></Card>
      )}

      <Modal open={!!cell} title={cell ? `${cell.day.toUpperCase()} — ${cell.slot.name} (${fmtTime(cell.slot.startTime)}–${fmtTime(cell.slot.endTime)})` : ''} onClose={() => setCell(null)}>
        {cell?.entry && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
            <span>{cell.entry.allocation.subject.title} · {cell.entry.room.name} · {cell.entry.allocation.teacher.name}</span>
            <Button variant="danger" onClick={() => removeEntry(cell.entry)}>Remove</Button>
          </div>
        )}
        <div className="space-y-3">
          <Field label="Allocation (subject + teacher)">
            <Select value={form.allocationId} onChange={(e) => setForm({ ...form, allocationId: e.target.value })}>
              <option value="">Select…</option>
              {allocations.map((a) => <option key={a.id} value={a.id}>{a.subject.title} — {a.teacher.name}</option>)}
            </Select>
          </Field>
          <Field
            label="Room / lab"
            hint={loadingRooms ? 'Checking which rooms are free…' : `${freeRoomCount} of ${rooms.length} room${rooms.length === 1 ? '' : 's'} free this period. Busy rooms are disabled.`}
          >
            <Select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} disabled={loadingRooms}>
              <option value="">Select…</option>
              {Object.entries(roomsByBlock).map(([block, list]) => (
                <optgroup key={block} label={block}>
                  {list.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.busy}>
                      {r.name} ({r.type}){r.busy ? ` — busy: ${r.busyWith}` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          {!loadingRooms && rooms.length > 0 && freeRoomCount === 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
              Every room is booked for this day and period. Free one up or pick another slot.
            </p>
          )}
          <div className="flex justify-end">
            <Button disabled={!form.allocationId || !form.roomId} onClick={saveEntry}>Save period</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
