import { Modal, Button, fmtDate } from './ui';

// 3-copy challan (Bank / College / Student) — print-friendly (§5.5).
// `copies` repeats the whole 3-copy set (used for bulk manual/fine challans).
export default function ChallanPrint({ data, onClose, copies = 1 }) {
  const { challan, bank, college } = data;
  const person = challan.application ?? challan.student;
  const runs = Math.max(1, Number(copies) || 1);

  const Copy = ({ label }) => (
    <div className="break-inside-avoid rounded border border-slate-400 p-3 text-[11px]">
      <div className="mb-1 flex items-center justify-between border-b border-slate-300 pb-1">
        <div>
          <div className="font-bold text-primary">{college.nameEn}</div>
          <div className="font-urdu" dir="rtl">{college.nameUr}</div>
        </div>
        <div className="text-right">
          <div className="font-bold uppercase">{label} copy</div>
          <div>{challan.challanNo}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <div><b>Name:</b> {person?.name}</div>
        <div><b>Father:</b> {person?.fatherName}</div>
        <div><b>{challan.department ? 'Department' : 'Program'}:</b> {challan.application?.program?.name ?? challan.department?.name ?? '—'}</div>
        <div><b>Due date:</b> {fmtDate(challan.dueDate)}</div>
        <div><b>Bank:</b> {bank.name} {bank.branch}</div>
        <div><b>A/C:</b> {bank.accountNo}</div>
      </div>
      <table className="mt-1 w-full border-t border-slate-300">
        <tbody>
          {challan.items.map((i) => (
            <tr key={i.id}><td className="py-0.5">{i.label}</td><td className="text-right">Rs. {Number(i.amount).toLocaleString()}</td></tr>
          ))}
          <tr className="border-t border-slate-300 font-bold"><td className="py-0.5">Total</td><td className="text-right">Rs. {Number(challan.totalAmount).toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div className="mt-3 flex justify-between text-slate-400">
        <span>Depositor signature ___________</span>
        <span>Bank stamp ___________</span>
      </div>
    </div>
  );

  return (
    <Modal open wide title={`Challan ${challan.challanNo}`} onClose={onClose}>
      <div className="mb-3 flex items-center justify-between print:hidden">
        <span className="text-sm text-slate-500">
          {runs > 1 ? `${runs} copies × 3 slips (Bank / College / Student)` : '3 slips (Bank / College / Student)'}
        </span>
        <Button onClick={() => window.print()}>Print{runs > 1 ? ` (${runs} copies)` : ' (3 copies)'}</Button>
      </div>
      <div className="print-area space-y-3 print:space-y-2">
        {Array.from({ length: runs }, (_, i) => (
          <div key={i} className="space-y-3 print:space-y-2 print:break-after-page">
            <Copy label="Bank" />
            <Copy label="College" />
            <Copy label="Student" />
          </div>
        ))}
      </div>
    </Modal>
  );
}
