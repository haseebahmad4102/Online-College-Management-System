import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card, Table, Button, Modal, Field, Input, Select, useFlash, errText } from '../../components/ui';

export default function Tasks() {
  const [data, setData] = useState({ tasks: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', description: '', assignedTo: '', status: 'pending', dueDate: '' });
  const [userSearch, setUserSearch] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const [flash, flashEl] = useFlash();

  const load = async () => {
    try {
      const r = await api.get('/tasks');
      setData(r.data);
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = (task = null) => {
    if (task) {
      setForm({
        id: task.id,
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedToUserId || '',
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.substring(0, 10) : ''
      });
      if (task.assignedToUserId) {
        const u = data.users.find(x => x.id === task.assignedToUserId);
        setUserSearch(u ? `${u.name} (${u.email})` : '');
      } else {
        setUserSearch('');
      }
    } else {
      setForm({ id: null, title: '', description: '', assignedTo: '', status: 'pending', dueDate: '' });
      setUserSearch('');
    }
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assigned_to_user_id: form.assignedTo || null,
        status: form.status,
        due_date: form.dueDate || null,
      };
      
      if (form.id) {
        await api.put(`/tasks/${form.id}`, payload);
        flash({ type: 'ok', text: 'Task updated successfully' });
      } else {
        await api.post('/tasks', payload);
        flash({ type: 'ok', text: 'Task created successfully' });
      }
      setModalOpen(false);
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      flash({ type: 'ok', text: 'Task deleted' });
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading tasks...</div>;

  const filteredUsers = data.users.filter(u => {
    const term = userSearch.toLowerCase();
    const dept = u.teacher?.department?.name || '';
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || dept.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Task Assignments</h1>
        <Button onClick={() => openForm()}>+ Create Task</Button>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Title', cell: (t) => (
              <div>
                <div className="font-medium text-slate-900">{t.title}</div>
                <div className="text-xs text-slate-500 truncate max-w-xs">{t.description}</div>
              </div>
            )},
            { header: 'Assigned To', cell: (t) => t.assignee?.name || <span className="text-slate-400">Unassigned</span> },
            { header: 'Due Date', cell: (t) => t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-' },
            { header: 'Status', cell: (t) => {
                const colors = { pending: 'bg-slate-100 text-slate-800', in_progress: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800' };
                const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
                return (
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colors[t.status]}`}>
                    {labels[t.status]}
                  </span>
                )
            }},
            { header: '', cell: (t) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => openForm(t)}>Edit</Button>
                <Button variant="danger" onClick={() => deleteTask(t.id)}>Delete</Button>
              </div>
            ) }
          ]}
          rows={data.tasks}
          empty="No tasks created yet."
        />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Task Title">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="E.g. Fix projector in Room 101" />
          </Field>
          
          <Field label="Description">
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Assign To (Search by Name, Email, Dept)">
              <div className="relative">
                <Input
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    if (form.assignedTo) setForm({ ...form, assignedTo: '' });
                    setShowUsers(true);
                  }}
                  onFocus={() => setShowUsers(true)}
                  onBlur={() => setTimeout(() => setShowUsers(false), 200)}
                  placeholder="Type to search..."
                />
                {showUsers && userSearch && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                    {filteredUsers.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-slate-500">No users found</div>
                    ) : (
                      filteredUsers.map(u => (
                        <div
                          key={u.id}
                          className="cursor-pointer px-4 py-2 hover:bg-slate-100"
                          onClick={() => {
                            setForm({ ...form, assignedTo: u.id });
                            setUserSearch(`${u.name} (${u.email})`);
                            setShowUsers(false);
                          }}
                        >
                          <div className="text-sm font-medium text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email} {u.teacher?.department ? `• ${u.teacher.department.name}` : ''}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Due Date">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
          </div>

          <Field label="Status">
            <Select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          </Field>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
