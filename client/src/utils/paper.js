import api from '../api/client';

// Print-ready exam/assignment paper: formal college header + fill-in fields for
// the student, then the paper body (instructions and, for built quizzes, the
// questions). Opens the browser's print dialog in a new window.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '____________________';

export async function printPaper({ title, typeLabel, allocation, date, totalMarks, teacherName, instructions, questions }) {
  let college = 'Govt. Graduate College Muzaffargarh';
  try {
    const r = await api.get('/settings/public');
    college = r.data.settings['site.college_name_en'] || college;
  } catch { /* offline settings — keep the default name */ }

  const cs = allocation.classSection;
  const department = cs.program.department?.name;
  const subject = allocation.subject.title;
  const klass = `${cs.program.code} — Semester ${cs.termNo} (${cs.shift})`;

  const infoRow = (label, value) =>
    `<td class="lbl">${label}</td><td class="val">${value}</td>`;

  const questionsHtml = (questions ?? [])
    .map(
      (q, i) => `
      <div class="q">
        <div class="qt"><b>Q${i + 1}.</b> ${esc(q.text)} <span class="marks">(1 mark)</span></div>
        ${q.options.map((o, oi) => `<div class="opt"><span class="circle"></span> <b>${String.fromCharCode(65 + oi)}.</b> ${esc(o)}</div>`).join('')}
      </div>`
    )
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; color: #000; margin: 40px 48px; }
  .college { text-align: center; font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  .dept { text-align: center; font-size: 15px; margin-top: 2px; }
  .ptype { text-align: center; font-size: 17px; font-weight: bold; margin-top: 10px; text-decoration: underline; text-underline-offset: 4px; text-transform: uppercase; }
  .ptitle { text-align: center; font-size: 15px; margin-top: 4px; font-style: italic; }
  hr { border: none; border-top: 2px solid #000; margin: 14px 0 10px; }
  table.info { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px; }
  table.info td { padding: 4px 0; }
  td.lbl { font-weight: bold; width: 110px; white-space: nowrap; }
  td.val { border-bottom: 1px dotted #555; padding-right: 24px !important; }
  .student { margin-top: 14px; border: 1.5px solid #000; padding: 10px 14px; }
  .student .head { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .inst { margin-top: 16px; font-size: 14px; white-space: pre-wrap; }
  .inst b { text-decoration: underline; }
  .q { margin-top: 14px; font-size: 14px; page-break-inside: avoid; }
  .qt .marks { font-size: 11px; color: #333; }
  .opt { margin: 4px 0 0 26px; }
  .circle { display: inline-block; width: 11px; height: 11px; border: 1.2px solid #000; border-radius: 50%; vertical-align: -1px; margin-right: 4px; }
  .space { margin-top: 20px; }
  .space .line { border-bottom: 1px solid #bbb; height: 30px; }
  @media print { body { margin: 16px 24px; } }
</style></head><body>
  <div class="college">${esc(college)}</div>
  ${department ? `<div class="dept">Department of ${esc(department)}</div>` : ''}
  <div class="ptype">${esc(typeLabel)}</div>
  <div class="ptitle">${esc(title)}</div>
  <hr>
  <table class="info">
    <tr>${infoRow('Class:', esc(klass))}${infoRow('Subject:', esc(subject))}</tr>
    <tr>${infoRow('Date:', fmt(date))}${infoRow('Total Marks:', totalMarks ? esc(totalMarks) : '__________')}</tr>
    ${teacherName ? `<tr>${infoRow('Teacher:', esc(teacherName))}<td></td><td></td></tr>` : ''}
  </table>
  <div class="student">
    <div class="head">To be filled by the student</div>
    <table class="info">
      <tr>${infoRow('Name:', '')}${infoRow('Roll No:', '')}</tr>
      <tr>${infoRow('Signature:', '')}${infoRow('Obtained:', '')}</tr>
    </table>
  </div>
  ${instructions ? `<div class="inst"><b>Instructions:</b>\n${esc(instructions)}</div>` : ''}
  ${questionsHtml}
  ${(questions ?? []).length === 0 ? `<div class="space">${'<div class="line"></div>'.repeat(14)}</div>` : ''}
  <script>window.onload = () => window.print();</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return; // popup blocked — the browser shows its own notice
  w.document.write(html);
  w.document.close();
}
