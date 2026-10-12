import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Button, Input, Select, Modal, Field, useFlash, useConfirm, errText, fmtTime } from '../../components/ui';

export default function Slots() {
  // timetable.view = read-only; changing slots needs timetable.manage.
  const { can } = useAuth();
  const manage = can('timetable.manage');
  const [slots, setSlots] = useState(null);
  const [ranges, setRanges] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ shift: 'morning' });
  const [saving, setSaving] = useState(false);
  const [gen, setGen] = useState({
    morning: { duration: 40, breakStart: '', breakDuration: 0 },
    evening: { duration: 40, breakStart: '', breakDuration: 0 },
  });
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () => api.get('/timetable/slots').then((r) => { setSlots(r.data.slots); setRanges(r.data.ranges); });
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setRange = (shift, k) => (e) => setRanges({ ...ranges, [shift]: { ...ranges[shift], [k]: e.target.value } });

  async function saveRanges() {
    if (saving) return;
    setSaving(true);
    try {
      const r = await api.put('/timetable/shift-ranges', ranges);
      flash({ type: 'ok', text: r.data.message });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  async function save() {
    if (saving) return; // double-click fires a second request before the first row exists
    setSaving(true);
    try {
      if (modal === 'new') {
        await api.post('/timetable/slots', form);
        flash({ type: 'ok', text: 'Slot added.' });
      } else {
        await api.put(`/timetable/slots/${modal.id}`, form);
        flash({ type: 'ok', text: 'Slot updated.' });
      }
      setModal(null); setForm({ shift: 'morning' }); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  const setGenField = (shift, k) => (e) => setGen({ ...gen, [shift]: { ...gen[shift], [k]: e.target.value } });

  function generate(shift) {
    const g = gen[shift];
    confirm(`Re-time the ${shift} shift into ${g.duration}-minute periods? Any existing timetable periods keep their subjects and just move to the new times.`, async () => {
      if (saving) return;
      setSaving(true);
      try {
        const r = await api.post('/timetable/slots/generate', { shift, ...g });
        flash({ type: 'ok', text: r.data.message });
        load();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
      finally { setSaving(false); }
    });
  }

  function openEdit(slot) {
    setModal(slot);
    setForm({ name: slot.name, startTime: slot.startTime, endTime: slot.endTime, shift: slot.shift });
  }

  function clearAll() {
    confirm(`Remove all ${slots?.length ?? 0} time slots from both shifts?`, async () => {
      try {
        const r = await api.delete('/timetable/slots');
        flash({ type: 'ok', text: r.data.message });
        load();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  function remove(slot) {
    confirm(`Remove ${slot.name} from ${slot.shift} shift?`, async () => {
      try {
        await api.delete(`/timetable/slots/${slot.id}`);
        flash({ type: 'ok', text: 'Slot removed.' });
        load();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Time Slots</h1>
        {manage && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={clearAll} disabled={!slots?.length}>Clear all</Button>
            <Button onClick={() => { setModal('new'); setForm({ shift: 'morning' }); }}>+ Add slot</Button>
          </div>
        )}
      </div>

      {ranges && (
        <Card>
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-accent">Shift timings</h2>
          <p className="mb-4 text-xs text-slate-500">
            Every time slot must fall inside its shift&apos;s range — a morning period cannot be saved at an evening time, and vice versa.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {['morning', 'evening'].map((shift) => (
              <div key={shift} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold capitalize text-slate-700">{shift} shift</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Starts"><Input type="time" value={ranges[shift].start} onChange={setRange(shift, 'start')} /></Field>
                  <Field label="Ends"><Input type="time" value={ranges[shift].end} onChange={setRange(shift, 'end')} /></Field>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Auto-create periods</div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Lecture (min)"><Input type="number" min="10" max="180" value={gen[shift].duration} onChange={setGenField(shift, 'duration')} /></Field>
                    <Field label="Break at"><Input type="time" value={gen[shift].breakStart} onChange={setGenField(shift, 'breakStart')} /></Field>
                    <Field label="Break (min)"><Input type="number" min="0" max="120" value={gen[shift].breakDuration} onChange={setGenField(shift, 'breakDuration')} /></Field>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Fills the whole shift with numbered periods. Set break to 0 min for no break.</p>
                  <div className="mt-2 flex justify-end">
                    {manage && <Button variant="outline" onClick={() => generate(shift)} disabled={saving || !gen[shift].duration}>Generate periods</Button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {manage && <div className="mt-4 flex justify-end"><Button onClick={saveRanges} disabled={saving}>{saving ? 'Saving…' : 'Save shift timings'}</Button></div>}
        </Card>
      )}

      {/* Morning and evening are listed separately so the two shifts never read as one timeline. */}
      {['morning', 'evening'].map((shift) => (
        <Card key={shift} title={`${shift.charAt(0).toUpperCase() + shift.slice(1)} shift periods`}>
          <Table
            columns={[
              { header: '#', cell: (s) => s.sortOrder },
              { header: 'Name', cell: (s) => s.name },
              { header: 'Start', cell: (s) => fmtTime(s.startTime) },
              { header: 'End', cell: (s) => fmtTime(s.endTime) },
              ...(manage ? [{
                header: 'Actions',
                cell: (s) => (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(s)}>Remove</Button>
                  </div>
                )
              }] : []),
            ]}
            rows={(slots ?? []).filter((s) => s.shift === shift)}
            empty={slots === null ? 'Loading…' : `No ${shift} periods yet.`}
          />
        </Card>
      ))}

      <Modal open={!!modal} title={modal === 'new' ? 'Add Shift Time Slot' : 'Edit Shift Time Slot'} onClose={() => setModal(null)}>
        <div className="space-y-3">
          <Field label="Name (e.g. Period 8)"><Input value={form.name ?? ''} onChange={set('name')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><Input type="time" value={form.startTime ?? ''} onChange={set('startTime')} /></Field>
            <Field label="End"><Input type="time" value={form.endTime ?? ''} onChange={set('endTime')} /></Field>
          </div>
          <Field label="Shift">
            <Select value={form.shift} onChange={set('shift')}>
              <option value="morning">Morning</option><option value="evening">Evening</option>
            </Select>
          </Field>
          {ranges && (
            <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
              <span className="capitalize">{form.shift}</span> slots must be between <b>{fmtTime(ranges[form.shift].start)}</b> and <b>{fmtTime(ranges[form.shift].end)}</b>.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.startTime || !form.endTime}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
