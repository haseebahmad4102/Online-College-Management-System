import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Input, Modal, Field, useFlash, useConfirm, errText } from '../../components/ui';

// Blocks = campus buildings that hold numbered classrooms and labs (§5.10).
// Rooms are generated from these counts, so the timetable builder always assigns a
// real, uniquely-named room and room clashes stay detectable.
export default function Blocks() {
  // timetable.view = read-only; changing blocks needs timetable.manage.
  const { can } = useAuth();
  const manage = can('timetable.manage');
  const [blocks, setBlocks] = useState(null);
  const [modal, setModal] = useState(null); // 'new' | block object
  const [form, setForm] = useState({ name: '', classrooms: 1, labs: 0 });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null); // block id whose rooms are shown
  const [deletingId, setDeletingId] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () => api.get('/timetable/blocks').then((r) => setBlocks(r.data.blocks));
  useEffect(() => { load(); }, []);

  function openNew() { setForm({ name: '', classrooms: 1, labs: 0 }); setModal('new'); }
  function openEdit(b) { setForm({ name: b.name, classrooms: b.classrooms, labs: b.labs, isActive: b.isActive }); setModal(b); }

  const totalRooms = Number(form.classrooms || 0) + Number(form.labs || 0);
  const nameOk = (form.name || '').trim().length >= 2;
  const formValid = nameOk && totalRooms >= 1 && Number(form.classrooms) >= 0 && Number(form.labs) >= 0;

  async function save() {
    if (!formValid || saving) return;
    setSaving(true);
    try {
      const body = { name: form.name.trim(), classrooms: Number(form.classrooms), labs: Number(form.labs) };
      if (modal === 'new') {
        await api.post('/timetable/blocks', body);
        flash({ type: 'ok', text: `Block "${body.name}" created with ${body.classrooms} classroom(s) and ${body.labs} lab(s).` });
      } else {
        await api.put(`/timetable/blocks/${modal.id}`, { ...body, isActive: form.isActive });
        flash({ type: 'ok', text: 'Block updated.' });
      }
      setModal(null); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  function remove(b) {
    confirm(`Delete block "${b.name}" and its ${b.classrooms + b.labs} room(s)? This cannot be undone.`, async () => {
      setDeletingId(b.id);
      try {
        const r = await api.delete(`/timetable/blocks/${b.id}`);
        flash({ type: 'ok', text: r.data.message });
        load();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
      finally { setDeletingId(null); }
    });
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blocks & Rooms</h1>
          <p className="text-sm text-slate-500">Add a block for each building; its classrooms and labs are created automatically for the timetable.</p>
        </div>
        {manage && <Button onClick={openNew}>+ Add block</Button>}
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Block', cell: (b) => <span className="font-semibold text-slate-800">{b.name}</span> },
            { header: 'Classrooms', cell: (b) => b.classrooms },
            { header: 'Labs', cell: (b) => b.labs },
            { header: 'Total rooms', cell: (b) => <span className="font-medium">{b.classrooms + b.labs}</span> },
            { header: 'Status', cell: (b) => <Badge value={b.isActive ? 'active' : 'closed'} /> },
            {
              header: 'Actions',
              cell: (b) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                    {expanded === b.id ? 'Hide rooms' : 'View rooms'}
                  </Button>
                  {manage && <Button variant="outline" onClick={() => openEdit(b)}>Edit</Button>}
                  {manage && (
                    <Button variant="danger" disabled={deletingId === b.id} onClick={() => remove(b)}>
                      {deletingId === b.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={blocks ?? []}
          empty={blocks === null ? 'Loading…' : 'No blocks yet — add your first building to create its rooms.'}
        />
      </Card>

      {expanded && blocks && (() => {
        const b = blocks.find((x) => x.id === expanded);
        if (!b) return null;
        return (
          <Card title={`Rooms in ${b.name}`}>
            {b.rooms.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No rooms.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {b.rooms.map((r) => (
                  <span key={r.id} className={`rounded-lg border px-3 py-1.5 text-sm ${r.type === 'lab' ? 'border-accent/30 bg-accent/5 text-accent' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </Card>
        );
      })()}

      <Modal open={!!modal} title={modal === 'new' ? 'Add block' : `Edit — ${modal?.name}`} onClose={() => setModal(null)}>
        <div className="space-y-3">
          <Field label="Block name" hint="e.g. A Block, Science Block, Main Building.">
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="A Block" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number of classrooms">
              <Input type="number" min="0" max="100" value={form.classrooms ?? ''} onChange={(e) => setForm({ ...form, classrooms: e.target.value })} />
            </Field>
            <Field label="Number of labs">
              <Input type="number" min="0" max="100" value={form.labs ?? ''} onChange={(e) => setForm({ ...form, labs: e.target.value })} />
            </Field>
          </div>
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            {totalRooms >= 1
              ? <>This creates <b>{Number(form.classrooms || 0)}</b> classroom{Number(form.classrooms) === 1 ? '' : 's'} and <b>{Number(form.labs || 0)}</b> lab{Number(form.labs) === 1 ? '' : 's'}, named like “{(form.name || 'A Block').trim()} - Room 1”. Reducing a count only removes rooms that aren’t in the timetable.</>
              : 'Add at least one classroom or lab.'}
          </p>
          {modal !== 'new' && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Block is active (its rooms appear in the timetable builder)
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} disabled={!formValid || saving}>{saving ? 'Saving…' : modal === 'new' ? 'Create block' : 'Save changes'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
