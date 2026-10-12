// Weekly grid shared by teacher/student portals and the builder views (§5.10)
import { fmtTime } from './ui';

const DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday']];

export default function TimetableGrid({ entries, slots, renderCell, onCellClick, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-slate-50 p-2 text-left">Day</th>
            {slots.map((s) => (
              <th key={s.id} className="border border-slate-200 bg-slate-50 p-2 text-center">
                {s.name}<br /><span className="font-normal text-slate-400">{fmtTime(s.startTime)}–{fmtTime(s.endTime)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map(([day, label]) => (
            <tr key={day}>
              <td className="border border-slate-200 bg-slate-50 p-2 font-medium">{label}</td>
              {slots.map((slot) => {
                const entry = entries.find((e) => e.day === day && e.timeSlotId === slot.id);
                return (
                  <td
                    key={slot.id}
                    onClick={onCellClick ? () => onCellClick(day, slot, entry) : undefined}
                    className={`border border-slate-200 p-1.5 text-center align-middle ${onCellClick ? 'cursor-pointer hover:bg-green-50' : ''} ${entry ? 'bg-green-50/60' : ''}`}
                  >
                    {entry ? (
                      renderCell ? renderCell(entry) : (
                        <div>
                          <div className="font-semibold text-primary">{entry.allocation.subject.code}</div>
                          <div className="text-slate-500">{entry.room.name}</div>
                          <div className="text-slate-400">{entry.allocation.teacher.name.split(' ').slice(-2).join(' ')}</div>
                        </div>
                      )
                    ) : (
                      onCellClick ? <span className="text-slate-300">+</span> : null
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
