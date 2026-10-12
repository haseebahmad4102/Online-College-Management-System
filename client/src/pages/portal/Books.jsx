import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Input, Select, Modal, Field, useFlash, useConfirm, errText } from '../../components/ui';

const BLANK = { title: '', author: '', isbn: '', publisher: '', edition: '', categoryId: '', shelfLocation: '', totalCopies: 1 };

export default function Books() {
  // library.view = browse the catalog read-only; changing it needs library.manage.
  const { can } = useAuth();
  const manage = can('library.manage');
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState(null); // 'new' | book
  const [form, setForm] = useState(BLANK);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();
  const first = useRef(true);

  const load = () => api.get('/library/books', {
    params: { ...(q ? { q } : {}), ...(category ? { category } : {}), ...(showArchived ? { all: '1' } : {}) },
  }).then((r) => setData(r.data));

  useEffect(() => { load(); }, []);
  // Debounced live search + instant filter changes.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q, category, showArchived]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const formValid = form.title?.trim() && form.author?.trim() && form.categoryId && Number(form.totalCopies) >= 1;

  async function save() {
    if (!formValid) return;
    try {
      if (modal === 'new') { await api.post('/library/books', form); flash({ type: 'ok', text: `“${form.title}” added.` }); }
      else { await api.put(`/library/books/${modal.id}`, form); flash({ type: 'ok', text: 'Book updated.' }); }
      setModal(null); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  function remove(b) {
    confirm(`Delete “${b.title}”? If it has borrowing history it will be archived instead.`, async () => {
      setDeletingId(b.id);
      try {
        await api.delete(`/library/books/${b.id}`);
        flash({ type: 'ok', text: `“${b.title}” deleted.` });
        load();
      } catch (e) {
        // Books with history can't be hard-deleted — offer archiving as the clean alternative.
        try { await api.put(`/library/books/${b.id}`, { isActive: false }); flash({ type: 'ok', text: `“${b.title}” archived (kept for records).` }); load(); }
        catch (e2) { flash({ type: 'error', text: errText(e2) }); }
      } finally { setDeletingId(null); }
    });
  }

  async function toggleArchive(b) {
    try { await api.put(`/library/books/${b.id}`, { isActive: !b.isActive }); flash({ type: 'ok', text: b.isActive ? 'Archived.' : 'Restored.' }); load(); }
    catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function addCategory() {
    if (newCat.trim().length < 2) return;
    try { await api.post('/library/categories', { name: newCat.trim() }); setNewCat(''); flash({ type: 'ok', text: 'Category added.' }); load(); }
    catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function removeCategory(c) {
    try { await api.delete(`/library/categories/${c.id}`); flash({ type: 'ok', text: `“${c.name}” removed.` }); load(); }
    catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  if (!data) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Library Catalog</h1>
        <div className="flex flex-wrap gap-2">
          {manage && <Button variant="outline" onClick={() => setCatModal(true)}>Categories</Button>}
          {manage && <Button onClick={() => { setForm({ ...BLANK, categoryId: data.categories[0]?.id ?? '' }); setModal('new'); }}>+ Add book</Button>}
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search title, author, ISBN or publisher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 280, flex: 1 }}
          />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 200 }}>
            <option value="">All categories</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c._count?.books ?? 0})</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived
          </label>
        </div>
        <Table
          columns={[
            { header: 'Title', cell: (b) => <div className="font-medium text-slate-800">{b.title}</div> },
            { header: 'Author', cell: (b) => b.author },
            { header: 'Publisher', cell: (b) => b.publisher || '—' },
            { header: 'Edition', cell: (b) => b.edition || '—' },
            { header: 'Category', cell: (b) => b.category.name },
            { header: 'ISBN', cell: (b) => b.isbn || '—' },
            { header: 'Shelf', cell: (b) => b.shelfLocation || '—' },
            {
              header: 'Copies',
              cell: (b) => (
                <span className={b.availableCopies === 0 ? 'font-semibold text-accent' : 'text-slate-700'}>
                  {b.availableCopies}/{b.totalCopies}
                </span>
              ),
            },
            { header: 'Status', cell: (b) => <Badge value={b.isActive ? 'active' : 'archived'} /> },
            ...(manage ? [{
              header: 'Actions',
              cell: (b) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setForm({ ...BLANK, ...b }); setModal(b); }}>Edit</Button>
                  <Button variant="outline" onClick={() => toggleArchive(b)}>{b.isActive ? 'Archive' : 'Restore'}</Button>
                  <Button variant="danger" disabled={deletingId === b.id} onClick={() => remove(b)}>
                    {deletingId === b.id ? '…' : 'Delete'}
                  </Button>
                </div>
              ),
            }] : []),
          ]}
          rows={data.books}
          empty={q || category ? 'No books match your search.' : 'No books yet — add your first title.'}
        />
        {data.books.length > 0 && <p className="mt-3 text-xs text-slate-400">{data.books.length} title{data.books.length === 1 ? '' : 's'} shown.</p>}
      </Card>

      <Modal open={!!modal} title={modal === 'new' ? 'Add book' : `Edit — ${modal?.title}`} onClose={() => setModal(null)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title *"><Input value={form.title ?? ''} onChange={set('title')} /></Field>
          <Field label="Author *"><Input value={form.author ?? ''} onChange={set('author')} /></Field>
          <Field label="ISBN"><Input value={form.isbn ?? ''} onChange={set('isbn')} /></Field>
          <Field label="Publisher"><Input value={form.publisher ?? ''} onChange={set('publisher')} /></Field>
          <Field label="Edition"><Input value={form.edition ?? ''} onChange={set('edition')} placeholder="e.g. 3rd ed." /></Field>
          <Field label="Category *">
            <Select value={form.categoryId ?? ''} onChange={set('categoryId')}>
              <option value="">Select…</option>
              {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Shelf location"><Input value={form.shelfLocation ?? ''} onChange={set('shelfLocation')} placeholder="e.g. A-3" /></Field>
          <Field label="Total copies *"><Input type="number" min="1" value={form.totalCopies ?? ''} onChange={set('totalCopies')} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} disabled={!formValid}>{modal === 'new' ? 'Add book' : 'Save changes'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={catModal} title="Book categories" onClose={() => setCatModal(false)}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} />
            <Button onClick={addCategory} disabled={newCat.trim().length < 2}>Add</Button>
          </div>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {data.categories.length === 0 && <p className="p-3 text-sm text-slate-400">No categories yet.</p>}
            {data.categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{c.name} <span className="text-slate-400">· {c._count?.books ?? 0} book{(c._count?.books ?? 0) === 1 ? '' : 's'}</span></span>
                <Button variant="danger" disabled={(c._count?.books ?? 0) > 0} onClick={() => removeCategory(c)}>Delete</Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
