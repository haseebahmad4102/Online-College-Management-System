import { Table, Button } from '../../../components/ui';

export default function ExaminationsTable({ exams, onToggle, onEdit, onDelete }) {
  if (exams.length === 0) {
    return <div className="py-8 text-center text-slate-400 italic">No examinations available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 bg-slate-50/50">
            <th className="py-3 px-4 font-medium">Exam Name</th>
            <th className="py-3 px-4 font-medium">Term</th>
            <th className="py-3 px-4 font-medium">Timeline</th>
            <th className="py-3 px-4 font-medium">Status</th>
            {onToggle && <th className="py-3 px-4 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {exams.map(e => (
            <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 font-semibold text-slate-800">{e.name}</td>
              <td className="px-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 capitalize border border-indigo-100">
                  {e.term}
                </span>
              </td>
              <td className="px-4 text-sm text-slate-600">
                {e.startDate || 'TBD'} <span className="text-slate-400 mx-1">→</span> {e.endDate || 'TBD'}
              </td>
              <td className="px-4">
                {e.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Closed
                  </span>
                )}
              </td>
              {onToggle && (
                <td className="px-4 text-right space-x-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(e)}>Edit</Button>
                  )}
                  <Button 
                    variant={e.isActive ? "outline" : "primary"} 
                    size="sm" 
                    onClick={() => onToggle(e.id)}
                    className={e.isActive ? "text-slate-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50" : ""}
                  >
                    {e.isActive ? 'Close' : 'Re-open'}
                  </Button>
                  {onDelete && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => { if(window.confirm('Delete this exam?')) onDelete(e.id); }}>Delete</Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
