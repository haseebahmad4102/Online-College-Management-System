import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Card, Table, Badge, Button, Input, Select, Modal, Field, useFlash, useConfirm, errText } from "../../components/ui";

const POSITION_BADGE = { convener: "bg-yellow-100 text-yellow-800 ring-yellow-200", secretary: "bg-blue-100 text-blue-800 ring-blue-200", member: "bg-slate-100 text-slate-600 ring-slate-200" };
const POSITIONS = ["convener", "secretary", "member"];

// Capitalize first letter helper
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Committees() {
  const { can } = useAuth();
  const manage = can("committee.manage");

  const [committees, setCommittees] = useState(null);
  const [people, setPeople] = useState(null); // { teachers, students }
  const [peopleQ, setPeopleQ] = useState("");
  const [selected, setSelected] = useState(null); // committee being viewed/edited
  const [modal, setModal] = useState(null); // "new" | "edit" | "add-member"
  const [form, setForm] = useState({ name: "", description: "" });
  const [memberType, setMemberType] = useState("teacher"); // "teacher" | "student"
  const [memberId, setMemberId] = useState("");
  const [memberPos, setMemberPos] = useState("member");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () =>
    api.get("/committees").then((r) => setCommittees(r.data.committees));

  const loadPeople = () =>
    api.get("/committees/people", { params: peopleQ ? { q: peopleQ } : {} })
      .then((r) => setPeople(r.data));

  useEffect(() => { load(); }, []);
  useEffect(() => { if (modal === "add-member") loadPeople(); }, [modal, peopleQ]);

  const filtered = useMemo(() => {
    if (!committees) return [];
    const n = q.trim().toLowerCase();
    return n ? committees.filter((c) => c.name.toLowerCase().includes(n) || (c.description || "").toLowerCase().includes(n)) : committees;
  }, [committees, q]);

  function openNew() { setForm({ name: "", description: "" }); setModal("new"); }
  function openEdit(c) { setSelected(c); setForm({ name: c.name, description: c.description || "" }); setModal("edit"); }

  async function save() {
    if (!form.name.trim() || form.name.trim().length < 3) return flash({ type: "error", text: "Name must be at least 3 characters." });
    setBusy(true);
    try {
      if (modal === "new") {
        await api.post("/committees", form);
        flash({ type: "ok", text: `"${form.name.trim()}" committee created.` });
      } else {
        await api.put(`/committees/${selected.id}`, form);
        flash({ type: "ok", text: "Committee updated." });
      }
      setModal(null); load();
    } catch (e) { flash({ type: "error", text: errText(e) }); }
    finally { setBusy(false); }
  }

  function deleteCommittee(c) {
    confirm(`Delete the "${c.name}" committee? This will also remove all its members.`, async () => {
      try { await api.delete(`/committees/${c.id}`); flash({ type: "ok", text: `"${c.name}" deleted.` }); load(); if (selected?.id === c.id) setSelected(null); }
      catch (e) { flash({ type: "error", text: errText(e) }); }
    });
  }

  async function addMember() {
    if (!memberId) return flash({ type: "error", text: "Please select a person." });
    setBusy(true);
    try {
      const path = memberType === "teacher"
        ? `/committees/${selected.id}/members`
        : `/committees/${selected.id}/student-members`;
      const body = memberType === "teacher" ? { teacherId: memberId, position: memberPos } : { studentId: memberId, position: memberPos };
      const r = await api.post(path, body);
      flash({ type: "ok", text: r.data.message });
      setModal(null); setMemberId(""); setMemberPos("member");
      const updated = await api.get("/committees").then((res) => res.data.committees.find((c) => c.id === selected.id));
      setSelected(updated); setCommittees((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } catch (e) { flash({ type: "error", text: errText(e) }); }
    finally { setBusy(false); }
  }

  async function removeMember(type, id) {
    const path = type === "teacher" ? `/committees/${selected.id}/members/${id}` : `/committees/${selected.id}/student-members/${id}`;
    try {
      await api.delete(path);
      flash({ type: "ok", text: "Member removed." });
      const updated = await api.get("/committees").then((res) => res.data.committees.find((c) => c.id === selected.id));
      setSelected(updated); setCommittees((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } catch (e) { flash({ type: "error", text: errText(e) }); }
  }

  if (!committees) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const filteredPeople = people
    ? (memberType === "teacher" ? people.teachers : people.students).filter((p) =>
        !p.name.toLowerCase().includes("search") // no-op filter, already done server-side
      )
    : [];

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Committees</h1>
          <p className="mt-0.5 text-sm text-slate-500">Institute committees — academic, disciplinary, sports, and beyond. Members can be teachers, students, or both.</p>
        </div>
        {manage && <Button onClick={openNew}>+ New committee</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: Committee list */}
        <div className="space-y-3">
          <Input placeholder="Search committees…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="space-y-2">
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{q ? "No committees match." : "No committees yet."}</p>}
            {filtered.map((c) => {
              const total = (c.members?.length ?? 0) + (c.studentMembers?.length ?? 0);
              const isActive = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${isActive ? "border-primary bg-green-50 shadow-sm" : "border-slate-200 bg-white hover:border-primary/40 hover:shadow-sm"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold ${isActive ? "text-primary" : "text-slate-800"}`}>{c.name}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{total} member{total !== 1 ? "s" : ""}</span>
                  </div>
                  {c.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{c.description}</p>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Committee detail */}
        <div>
          {!selected ? (
            <Card>
              <div className="py-16 text-center text-sm text-slate-400">
                <div className="mb-2 text-3xl">🏛️</div>
                Select a committee from the left to view its roster.
              </div>
            </Card>
          ) : (
            <Card
              title={selected.name}
              actions={
                manage ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openEdit(selected)}>Edit</Button>
                    <Button variant="outline" onClick={() => { setMemberId(""); setMemberPos("member"); setMemberType("teacher"); setModal("add-member"); }}>+ Add member</Button>
                    <Button variant="danger" onClick={() => deleteCommittee(selected)}>Delete</Button>
                  </div>
                ) : null
              }
            >
              {selected.description && <p className="mb-4 text-sm text-slate-600">{selected.description}</p>}

              {/* Teacher members */}
              {(selected.members?.length ?? 0) > 0 && (
                <div className="mb-6">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Teachers</div>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {selected.members.map((m) => (
                      <div key={m.teacherId} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-800">{m.teacher.name}</div>
                          <div className="text-xs text-slate-500">{m.teacher.designation?.title} · {m.teacher.department?.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${POSITION_BADGE[m.position]}`}>{cap(m.position)}</span>
                          {manage && (
                            <button onClick={() => removeMember("teacher", m.teacherId)} className="text-slate-300 hover:text-red-500" title="Remove">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student members */}
              {(selected.studentMembers?.length ?? 0) > 0 && (
                <div className="mb-6">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Students</div>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {selected.studentMembers.map((m) => (
                      <div key={m.studentId} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-800">{m.student.name}</div>
                          <div className="text-xs text-slate-500">{m.student.rollNumber} · {m.student.program?.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${POSITION_BADGE[m.position]}`}>{cap(m.position)}</span>
                          {manage && (
                            <button onClick={() => removeMember("student", m.studentId)} className="text-slate-300 hover:text-red-500" title="Remove">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selected.members?.length ?? 0) === 0 && (selected.studentMembers?.length ?? 0) === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No members yet.{manage ? " Click \"+ Add member\" to get started." : ""}</p>
              )}

              <div className="mt-2 flex gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span>👩‍🏫 {selected.members?.length ?? 0} teacher{(selected.members?.length ?? 0) !== 1 ? "s" : ""}</span>
                <span>👨‍🎓 {selected.studentMembers?.length ?? 0} student{(selected.studentMembers?.length ?? 0) !== 1 ? "s" : ""}</span>
                <span>Total: {(selected.members?.length ?? 0) + (selected.studentMembers?.length ?? 0)} member{((selected.members?.length ?? 0) + (selected.studentMembers?.length ?? 0)) !== 1 ? "s" : ""}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New / Edit committee modal */}
      <Modal open={modal === "new" || modal === "edit"} title={modal === "new" ? "New committee" : `Edit — ${selected?.name}`} onClose={() => setModal(null)}>
        <div className="space-y-3">
          <Field label="Name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Discipline Committee" />
          </Field>
          <Field label="Description" hint="Purpose of this committee (optional).">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button disabled={busy || form.name.trim().length < 3} onClick={save}>{busy ? "Saving…" : modal === "new" ? "Create" : "Save changes"}</Button>
          </div>
        </div>
      </Modal>

      {/* Add member modal */}
      <Modal open={modal === "add-member"} title={`Add member — ${selected?.name}`} onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Member type">
            <div className="flex gap-2">
              {["teacher", "student"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setMemberType(t); setMemberId(""); }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${memberType === t ? "border-primary bg-green-50 text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >{t}</button>
              ))}
            </div>
          </Field>

          <Field label="Search">
            <Input placeholder={`Search ${memberType}s by name…`} value={peopleQ} onChange={(e) => setPeopleQ(e.target.value)} />
          </Field>

          <Field label={`Select ${memberType}`}>
            <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">— pick a {memberType} —</option>
              {!people && <option disabled>Loading…</option>}
              {filteredPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {memberType === "teacher"
                    ? `${p.name} — ${p.designation?.title ?? ""} (${p.department?.name ?? ""})`
                    : `${p.name} — ${p.rollNumber} (${p.program?.name ?? ""})`
                  }
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Position">
            <Select value={memberPos} onChange={(e) => setMemberPos(e.target.value)}>
              {POSITIONS.map((p) => <option key={p} value={p}>{cap(p)}</option>)}
            </Select>
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button disabled={!memberId || busy} onClick={addMember}>{busy ? "Adding…" : "Add member"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
