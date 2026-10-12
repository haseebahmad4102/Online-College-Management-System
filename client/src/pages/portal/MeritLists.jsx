import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Modal, Field, Select, Input, useFlash, useConfirm, errText, fmtDate } from '../../components/ui';

export default function MeritLists() {
  // merit.view shows the lists; generating needs merit.generate, publish/expire merit.publish.
  const { can } = useAuth();
  const [lists, setLists] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [genOpen, setGenOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [view, setView] = useState(null);
  const [form, setForm] = useState({ cycleId: '', programId: '', seats: 50 });
  const [closeForm, setCloseForm] = useState({ cycleId: '', programId: '' });
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () => Promise.all([
    api.get('/merit').then((r) => setLists(r.data.meritLists)),
    api.get('/academic/cycles').then((r) => setCycles(r.data.cycles)),
    api.get('/academic/programs').then((r) => setPrograms(r.data.programs)),
  ]);
  useEffect(() => { load(); }, []);

  const cycle = cycles.find((c) => c.id === Number(form.cycleId));
  const cyclePrograms = programs.filter((p) => p.programLevelId === cycle?.programLevelId && p.isActive);
  const closeCycle = cycles.find((c) => c.id === Number(closeForm.cycleId));
  const closeCyclePrograms = programs.filter((p) => p.programLevelId === closeCycle?.programLevelId && p.isActive);

  async function generate() {
    try {
      const r = await api.post('/merit/generate', form);
      flash({ type: 'ok', text: `Merit List ${r.data.meritList.listNo} generated as draft.` });
      setGenOpen(false); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function publish(list) {
    confirm(
      `Publish Merit List ${list.listNo} for ${list.program.name}? Selected applicants get challans + notifications and the list appears on the public website.`,
      async () => {
        try {
          await api.put(`/merit/${list.id}/publish`);
          flash({ type: 'ok', text: 'List published — challans issued, notice posted.' });
          load();
        } catch (e) { flash({ type: 'error', text: errText(e) }); }
      }
    );
  }

  async function expire(list) {
    confirm(
      'Mark unpaid selections past their due date as forfeited? Their seats return to the pool for the next list.',
      async () => {
        try {
          const r = await api.post(`/merit/${list.id}/expire-unpaid`);
          flash({ type: 'ok', text: r.data.message });
          load();
        } catch (e) { flash({ type: 'error', text: errText(e) }); }
      }
    );
  }

  async function closeRemaining() {
    confirm(
      'Mark every remaining verified/waitlisted application for this program as "not selected"? They will be notified — only do this once no more lists will be generated for this program in this cycle.',
      async () => {
        try {
          const r = await api.post('/merit/close-remaining', closeForm);
          flash({ type: 'ok', text: r.data.message });
          setCloseOpen(false); load();
        } catch (e) { flash({ type: 'error', text: errText(e) }); }
      }
    );
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Merit Lists</h1>
        <div className="flex gap-2">
          {can('merit.publish') && <Button variant="outline" onClick={() => setCloseOpen(true)}>Close remaining applications</Button>}
          {can('merit.generate') && <Button onClick={() => setGenOpen(true)}>+ Generate list</Button>}
        </div>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Program', cell: (l) => l.program.name },
            { header: 'List', cell: (l) => `List ${l.listNo}` },
            { header: 'Seats', cell: (l) => l.seats },
            { header: 'Cutoff', cell: (l) => l.cutoffScore ?? '—' },
            { header: 'Status', cell: (l) => <Badge value={l.status} /> },
            { header: 'Published', cell: (l) => fmtDate(l.publishedAt) },
            {
              header: 'Actions',
              cell: (l) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setView(l)}>Entries</Button>
                  {l.status === 'draft' && can('merit.publish') && <Button onClick={() => publish(l)}>Publish</Button>}
                  {l.status === 'published' && can('merit.publish') && <Button variant="danger" onClick={() => expire(l)}>Expire unpaid</Button>}
                </div>
              ),
            },
          ]}
          rows={lists}
          empty="No merit lists generated yet."
        />
      </Card>

      <Modal open={genOpen} title="Generate merit list" onClose={() => setGenOpen(false)}>
        <div className="space-y-4">
          <Field label="Admission cycle">
            <Select value={form.cycleId} onChange={(e) => setForm({ ...form, cycleId: e.target.value, programId: '' })}>
              <option value="">Select…</option>
              {cycles.filter((c) => ['open', 'merit', 'closed'].includes(c.status)).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </Field>
          <Field label="Program">
            <Select value={form.programId} onChange={(e) => {
              const p = cyclePrograms.find((x) => x.id === Number(e.target.value));
              setForm({ ...form, programId: e.target.value, seats: p?.seats ?? form.seats });
            }}>
              <option value="">Select…</option>
              {cyclePrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Seats for this list" hint="Verified applications are ranked by merit; the top N are selected, the rest wait.">
            <Input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button disabled={!form.cycleId || !form.programId || !form.seats} onClick={generate}>Generate draft</Button>
          </div>
        </div>
      </Modal>

      <Modal open={closeOpen} title="Close remaining applications" onClose={() => setCloseOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Use this once no further merit lists will be generated for a program. Every application still
            <b> verified</b> or <b>waitlisted</b> for that program in this cycle is marked <b>not selected</b> and
            the applicant is notified on their portal.
          </p>
          <Field label="Admission cycle">
            <Select value={closeForm.cycleId} onChange={(e) => setCloseForm({ ...closeForm, cycleId: e.target.value, programId: '' })}>
              <option value="">Select…</option>
              {cycles.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </Field>
          <Field label="Program">
            <Select value={closeForm.programId} onChange={(e) => setCloseForm({ ...closeForm, programId: e.target.value })}>
              <option value="">Select…</option>
              {closeCyclePrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={!closeForm.cycleId || !closeForm.programId} onClick={closeRemaining}>Close remaining applications</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!view} wide title={view ? `${view.program.name} — List ${view.listNo} (cutoff ${view.cutoffScore ?? '—'})` : ''} onClose={() => setView(null)}>
        {view && (
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="mb-3 flex justify-end print:hidden">
              <Button variant="outline" onClick={() => window.print()}>Print</Button>
            </div>
            <Table
              columns={[
                { header: '#', cell: (e) => e.position },
                { header: 'App No', cell: (e) => e.application.applicationNo },
                { header: 'Name', cell: (e) => e.application.name },
                { header: 'Score', cell: (e) => e.meritScore },
                { header: 'Status', cell: (e) => <Badge value={e.status} /> },
              ]}
              rows={view.entries}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
