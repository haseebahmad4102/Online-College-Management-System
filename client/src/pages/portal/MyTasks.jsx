import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card, Button, useFlash, errText } from '../../components/ui';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, flashEl] = useFlash();

  const load = async () => {
    try {
      const r = await api.get('/tasks/my-tasks');
      setTasks(r.data.tasks);
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/tasks/my-tasks/${id}/status`, { status });
      flash({ type: 'ok', text: 'Status updated' });
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading your tasks...</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-500">Manage tasks assigned to you</p>
      </div>

      {tasks.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">You have no tasks assigned.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(t => (
            <Card key={t.id} className="flex flex-col">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">{t.title}</h3>
                <span className={`inline-flex rounded-full px-2 text-[10px] font-bold uppercase tracking-wide ${t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
              <p className="mb-4 flex-1 text-sm text-slate-600 whitespace-pre-wrap">{t.description}</p>
              
              <div className="mb-4 text-xs text-slate-500">
                <div><strong>Assigned by:</strong> {t.creator?.name || 'System'}</div>
                {t.dueDate && <div><strong>Due Date:</strong> {new Date(t.dueDate).toLocaleDateString()}</div>}
              </div>

              <div className="flex gap-2 border-t pt-3">
                {t.status !== 'pending' && (
                  <Button variant="outline" className="flex-1 text-xs py-1" onClick={() => updateStatus(t.id, 'pending')}>Mark Pending</Button>
                )}
                {t.status !== 'in_progress' && (
                  <Button variant="outline" className="flex-1 text-xs py-1" onClick={() => updateStatus(t.id, 'in_progress')}>Start Work</Button>
                )}
                {t.status !== 'completed' && (
                  <Button className="flex-1 bg-green-600 text-xs py-1 hover:bg-green-700" onClick={() => updateStatus(t.id, 'completed')}>Complete</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
