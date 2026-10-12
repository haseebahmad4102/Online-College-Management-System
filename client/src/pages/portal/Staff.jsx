import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card, Table, Button, Modal, Field, Input, Select, useFlash, errText } from '../../components/ui';

export default function Staff() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', cnic: '', phone: '', designation: '', status: 'active', createUser: false, email: '', role: 'clerk' });
  const [flash, flashEl] = useFlash();

  const load = async () => {
    try {
      const r = await api.get('/staff');
      setData(r.data.staff);
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = (staff = null) => {
    if (staff) {
      setForm({
        id: staff.id,
        name: staff.name,
        cnic: staff.cnic,
        phone: staff.phone || '',
        designation: staff.designation,
        status: staff.status,
        createUser: false,
        email: '',
        role: 'clerk'
      });
    } else {
      setForm({ id: null, name: '', cnic: '', phone: '', designation: '', status: 'active', createUser: false, email: '', role: 'clerk' });
    }
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        cnic: form.cnic,
        phone: form.phone,
        designation: form.designation,
        status: form.status,
      };
      
      if (!form.id && form.createUser) {
        payload.create_user = true;
        payload.email = form.email;
        payload.role = form.role;
      }
      
      if (form.id) {
        await api.put(`/staff/${form.id}`, payload);
        flash({ type: 'ok', text: 'Staff updated successfully' });
      } else {
        await api.post('/staff', payload);
        flash({ type: 'ok', text: 'Staff created successfully' });
      }
      setModalOpen(false);
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setSaving(false);
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff record?')) return;
    try {
      await api.delete(`/staff/${id}`);
      flash({ type: 'ok', text: 'Staff deleted' });
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading staff...</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Non-Teaching Staff</h1>
        <Button onClick={() => openForm()}>+ Add Staff</Button>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Name', cell: (s) => (
              <div>
                <div className="font-medium text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-500">{s.designation}</div>
              </div>
            )},
            { header: 'CNIC', cell: (s) => s.cnic },
            { header: 'Phone', cell: (s) => s.phone || '-' },
            { header: 'Linked Account', cell: (s) => s.user ? <span className="text-emerald-600">Yes</span> : <span className="text-slate-400">No</span> },
            { header: 'Status', cell: (s) => (
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {s.status}
                </span>
            ) },
            { header: '', cell: (s) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => openForm(s)}>Edit</Button>
                <Button variant="danger" onClick={() => deleteStaff(s.id)}>Delete</Button>
              </div>
            ) }
          ]}
          rows={data}
          empty="No staff members found."
        />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit Staff' : 'Add Staff'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="E.g. Ali Raza" />
            </Field>
            <Field label="CNIC">
              <Input required value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} placeholder="12345-1234567-1" />
            </Field>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0300-1234567" />
            </Field>
            <Field label="Designation">
              <Input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="E.g. Senior Clerk" />
            </Field>
          </div>

          <Field label="Status">
            <Select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>

          {!form.id && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.createUser} onChange={(e) => setForm({ ...form, createUser: e.target.checked })} />
                Create System Login Account
              </label>
              {form.createUser && (
                <div className="mt-3 grid grid-cols-2 gap-4 border-t pt-3">
                  <Field label="Email Address">
                    <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </Field>
                  <Field label="Portal Role">
                    <Select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="clerk">Clerk</option>
                      <option value="librarian">Librarian</option>
                      <option value="timetable">Timetable Controller</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </Field>
                  <p className="col-span-2 text-xs text-slate-500">The default password will be <span className="font-mono">password</span></p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Staff'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
