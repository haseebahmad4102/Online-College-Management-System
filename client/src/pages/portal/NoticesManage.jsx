import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Input, Select, Modal, Field, Pager, Textarea, useFlash, useConfirm, errText, fmtDate } from '../../components/ui';

const emptyForm = { audience: 'public' };

export default function NoticesManage() {
  // notices.view lets someone read this manager; create/update/delete buttons
  // only appear when their role holds those permissions too.
  const { can } = useAuth();
  const [notices, setNotices] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editNotice, setEditNotice] = useState(null); // null = create, notice object = edit
  const [viewNotice, setViewNotice] = useState(null); // read-only preview
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1, total: 0 });
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = (p = page) => api.get('/notices', { params: { page: p } })
    .then((r) => { setNotices(r.data.notices); setMeta({ pages: r.data.pages, total: r.data.total }); setPage(p); });
  useEffect(() => { load(1); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function closeForm() {
    setFormOpen(false);
    setEditNotice(null);
    setForm(emptyForm);
  }

  function openCreate() {
    setEditNotice(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(n) {
    setEditNotice(n);
    setForm({
      title: n.title,
      body: n.body,
      audience: n.audience,
      expiresAt: n.expiresAt ? n.expiresAt.slice(0, 10) : '',
    });
    setFormOpen(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      if (editNotice) {
        await api.put(`/notices/${editNotice.id}`, form);
        flash({ type: 'ok', text: 'Notice updated.' });
      } else {
        await api.post('/notices', form);
        flash({ type: 'ok', text: 'Notice published.' });
      }
      closeForm();
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  function remove(n) {
    confirm(`Delete notice "${n.title}"?`, async () => {
      await api.delete(`/notices/${n.id}`);
      flash({ type: 'ok', text: 'Notice deleted.' });
      load();
    });
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notices</h1>
        {can('notices.create') && <Button onClick={openCreate}>+ New notice</Button>}
      </div>
      <Card>
        <Table
          onRowClick={(n) => setViewNotice(n)}
          columns={[
            { header: 'Title', cell: (n) => <span className="font-semibold">{n.title}</span> },
            { header: 'Audience', cell: (n) => <Badge value={n.audience} /> },
            { header: 'Program', cell: (n) => n.program?.code ?? 'All' },
            { header: 'Published', cell: (n) => fmtDate(n.publishedAt) },
            { header: 'Expires', cell: (n) => fmtDate(n.expiresAt) },
            {
              header: 'Actions',
              cell: (n) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" onClick={() => setViewNotice(n)}>View</Button>
                  {can('notices.update') && <Button variant="outline" onClick={() => openEdit(n)}>Edit</Button>}
                  {can('notices.delete') && <Button variant="danger" onClick={() => remove(n)}>Delete</Button>}
                </div>
              )
            },
          ]}
          rows={notices ?? []}
          empty={notices === null ? 'Loading…' : 'No notices.'}
        />
        <Pager page={page} pages={meta.pages} total={meta.total} onPage={(p) => load(p)} />
      </Card>

      {/* Create / edit notice */}
      <Modal open={formOpen} wide title={editNotice ? `Edit notice — ${editNotice.title}` : 'Publish notice'} onClose={closeForm}>
        <div className="space-y-3">
          <Field label="Title"><Input value={form.title ?? ''} onChange={set('title')} /></Field>
          <Field label="Body"><Textarea rows={5} value={form.body ?? ''} onChange={set('body')} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Audience (§5.12)">
              <Select value={form.audience ?? 'public'} onChange={set('audience')}>
                {['public', 'applicants', 'students', 'teachers', 'portal_all'].map((a) => <option key={a} value={a}>{a.replaceAll('_', ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Expires (optional)"><Input type="date" value={form.expiresAt ?? ''} onChange={set('expiresAt')} /></Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button disabled={saving || !form.title || !form.body} onClick={save}>
              {saving ? 'Saving…' : editNotice ? 'Save Changes' : 'Publish'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Read-only view */}
      <Modal open={!!viewNotice} wide title={viewNotice?.title ?? ''} onClose={() => setViewNotice(null)}>
        {viewNotice && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge value={viewNotice.audience} />
              <span className="text-slate-500">Program: <b className="text-slate-700">{viewNotice.program?.code ?? 'All'}</b></span>
              <span className="text-slate-500">Published: <b className="text-slate-700">{fmtDate(viewNotice.publishedAt)}</b></span>
              <span className="text-slate-500">Expires: <b className="text-slate-700">{fmtDate(viewNotice.expiresAt)}</b></span>
            </div>
            <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{viewNotice.body}</div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="outline" onClick={() => setViewNotice(null)}>Close</Button>
              {can('notices.update') && (
                <Button onClick={() => { const n = viewNotice; setViewNotice(null); openEdit(n); }}>Edit</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
