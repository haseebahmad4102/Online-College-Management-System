import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Badge, Button, Input, Modal, Field, Select, useFlash, errText, fmtDate } from '../../components/ui';

export default function StudentLibrary() {
  const [catalog, setCatalog] = useState(null);
  const [mine, setMine] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [request, setRequest] = useState(null);
  const [days, setDays] = useState(14);
  const [flash, flashEl] = useFlash();
  const first = useRef(true);

  const loadCatalog = () => api.get('/library/books', {
    params: { ...(q ? { q } : {}), ...(category ? { category } : {}) },
  }).then((r) => setCatalog(r.data));
  const load = () => Promise.all([loadCatalog(), api.get('/library/mine').then((r) => setMine(r.data))]);
  useEffect(() => { load(); }, []);
  // Debounced live search + instant category filtering.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(loadCatalog, 300);
    return () => clearTimeout(t);
  }, [q, category]);

  async function doRequest() {
    try {
      await api.post('/library/requests', { bookId: request.id, days });
      flash({ type: 'ok', text: 'Request sent to the librarian.' });
      setRequest(null); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  if (!catalog || !mine) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Library</h1>

      <Card title="My books & requests">
        <Table
          columns={[
            { header: 'Book', cell: (i) => i.book.title },
            { header: 'Issued', cell: (i) => fmtDate(i.issuedOn) },
            { header: 'Due', cell: (i) => fmtDate(i.dueDate) },
            { header: 'Returned', cell: (i) => fmtDate(i.returnedOn) },
            { header: 'Fine', cell: (i) => Number(i.fineAmount) > 0 ? <span className="font-semibold text-accent">Rs. {Number(i.fineAmount)} <Badge value={i.fineStatus} /></span> : '—' },
          ]}
          rows={mine.issues}
          empty="No books issued yet."
        />
        {mine.requests.filter((r) => r.status === 'pending').length > 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Pending requests: {mine.requests.filter((r) => r.status === 'pending').map((r) => r.book.title).join(', ')}
          </p>
        )}
      </Card>

      <Card
        title="Browse catalog"
        actions={
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search title, author, ISBN or publisher…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 180 }}>
              <option value="">All categories</option>
              {catalog.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        }
      >
        <Table
          columns={[
            { header: 'Title', cell: (b) => <div className="font-medium text-slate-800">{b.title}</div> },
            { header: 'Author', cell: (b) => b.author },
            { header: 'Publisher', cell: (b) => b.publisher || '—' },
            { header: 'Edition', cell: (b) => b.edition || '—' },
            { header: 'Category', cell: (b) => b.category.name },
            { header: 'Shelf', cell: (b) => b.shelfLocation || '—' },
            {
              header: 'Availability',
              cell: (b) => b.availableCopies > 0
                ? <Badge value={`${b.availableCopies} available`} />
                : <span className="text-xs font-medium text-accent">All out</span>,
            },
            {
              header: 'Actions',
              cell: (b) => (
                <Button variant="outline" disabled={b.availableCopies < 1} onClick={() => { setRequest(b); setDays(14); }}>
                  {b.availableCopies < 1 ? 'Unavailable' : 'Request'}
                </Button>
              ),
            },
          ]}
          rows={catalog.books}
          empty={q || category ? 'No books match your search.' : 'The catalog is empty right now.'}
        />
      </Card>

      <Modal open={!!request} title={`Request — ${request?.title}`} onClose={() => setRequest(null)}>
        <Field label="For how many days?">
          <Select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 10, 14].map((d) => <option key={d} value={d}>{d} days</option>)}
          </Select>
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRequest(null)}>Cancel</Button>
          <Button onClick={doRequest}>Send request</Button>
        </div>
      </Modal>
    </div>
  );
}
