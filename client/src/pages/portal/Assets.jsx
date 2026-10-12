import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card, Table, Button, Modal, Field, Input, Select, useFlash, errText } from '../../components/ui';

export default function Assets() {
  const [data, setData] = useState({ assets: [], categories: [], buildings: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', code: '', categoryId: '', departmentId: '', buildingId: '', cost: '', purchaseDate: '', status: 'active' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [flash, flashEl] = useFlash();

  const load = async () => {
    try {
      const r = await api.get('/assets');
      setData(r.data);
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = (asset = null) => {
    if (asset) {
      setForm({
        id: asset.id,
        name: asset.name,
        code: asset.code,
        categoryId: asset.categoryId || '',
        departmentId: asset.departmentId || '',
        buildingId: asset.buildingId || '',
        cost: asset.cost || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.substring(0, 10) : '',
        status: asset.status || 'active'
      });
    } else {
      setForm({ id: null, name: '', code: '', categoryId: '', departmentId: '', buildingId: '', cost: '', purchaseDate: '', status: 'active' });
    }
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        category_id: form.categoryId || null,
        department_id: form.departmentId || null,
        building_id: form.buildingId || null,
        cost: form.cost || null,
        purchase_date: form.purchaseDate || null,
        status: form.status
      };
      
      if (form.id) {
        await api.put(`/assets/${form.id}`, payload);
        flash({ type: 'ok', text: 'Asset updated successfully' });
      } else {
        await api.post('/assets', payload);
        flash({ type: 'ok', text: 'Asset created successfully' });
      }
      setModalOpen(false);
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assets/categories', { name: catForm.name, description: catForm.description });
      flash({ type: 'ok', text: 'Category created successfully' });
      setCategoryModalOpen(false);
      setCatForm({ name: '', description: '' });
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setSaving(false);
    }
  };

  const deleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      flash({ type: 'ok', text: 'Asset deleted' });
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading assets...</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">College Assets</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>+ Add Category</Button>
          <Button onClick={() => openForm()}>+ Add Asset</Button>
        </div>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Code', cell: (a) => <span className="font-mono text-xs">{a.code}</span> },
            { header: 'Asset Name', cell: (a) => a.name },
            { header: 'Category', cell: (a) => a.category?.name },
            { header: 'Department', cell: (a) => a.department?.name || '-' },
            { header: 'Building/Location', cell: (a) => a.building?.name || '-' },
            { header: 'Status', cell: (a) => (
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${a.status === 'active' ? 'bg-green-100 text-green-800' : a.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                  {a.status}
                </span>
            ) },
            { header: '', cell: (a) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => openForm(a)}>Edit</Button>
                <Button variant="danger" onClick={() => deleteAsset(a.id)}>Delete</Button>
              </div>
            ) }
          ]}
          rows={data.assets}
          empty="No assets found."
        />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit Asset' : 'Add Asset'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Asset Name">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="E.g. Dell Optiplex PC" />
            </Field>
            <Field label="Asset Code / Tag">
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="GGCM-IT-001" />
            </Field>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select Category...</option>
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Linked Department (Optional)">
              <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">None / General</option>
                {data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Building Location (Optional)">
              <Select value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })}>
                <option value="">None / Unassigned</option>
                {data.buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Purchase Date">
              <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </Field>
            <Field label="Cost (PKR)">
              <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Asset'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Add Category">
        <form onSubmit={saveCategory} className="space-y-4">
          <Field label="Category Name">
            <Input required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="E.g. Electronics" />
          </Field>
          <Field label="Description (Optional)">
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Category'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
