import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, useFlash, errText } from '../../components/ui';

// Principal settings UI (§1.1) — everything data-driven, nothing hardcoded.
export default function Settings({ groupFilter }) {
  // settings.view lets someone read values; saving needs settings.update and
  // the logo upload rides on website.manage (matching the server guards).
  const { can } = useAuth();
  const canUpdate = can('settings.update');
  const [settings, setSettings] = useState(null);
  const [edits, setEdits] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [flash, flashEl] = useFlash();
  const logoRef = useRef(null);

  const load = () => api.get('/settings').then((r) => setSettings(r.data.settings));

  useEffect(() => {
    load();
  }, []);

  if (!settings) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const visible = groupFilter ? settings.filter((s) => s.group === groupFilter) : settings;
  const groups = [...new Set(visible.map((s) => s.group))];

  async function save() {
    try {
      await api.put('/settings', { updates: edits });
      flash({ type: 'ok', text: 'Settings saved — the theme and rules update immediately.' });
      setEdits({});
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  // Picker → immediate upload, so the button is never disabled.
  async function uploadLogo(file) {
    if (!file) return;
    try {
      setUploadingLogo(true);
      const data = new FormData();
      data.append('logo', file);
      await api.post('/settings/logo', data);
      flash({ type: 'ok', text: 'Logo uploaded — it is live across the website and portals.' });
      await load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  }

  const settingHint = (key) => {
    if (key === 'rollno.pattern') return 'Use {YEAR}-{COLLEGE}-{DEPT}-{SEQ3}; example: 2022-GCBM-IT-001.';
    if (key === 'site.logo') return 'Upload a JPG or PNG logo below, or paste a hosted image URL.';
    return null;
  };

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{groupFilter === 'library' ? 'Library Settings' : 'System Settings'}</h1>
        {canUpdate && <Button disabled={Object.keys(edits).length === 0} onClick={save}>Save changes</Button>}
      </div>
      {groups.map((group) => (
        <Card key={group} title={group.charAt(0).toUpperCase() + group.slice(1)}>
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.filter((s) => s.group === group).map((s) => (
              <label key={s.key} className="block">
                <span className="mb-1 block text-xs font-mono text-slate-500">{s.key}</span>
                <Input
                  value={edits[s.key] ?? s.value ?? ''}
                  disabled={!canUpdate}
                  onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                />
                {settingHint(s.key) && <span className="mt-1 block text-xs text-slate-400">{settingHint(s.key)}</span>}
                {s.key === 'site.logo' && can('website.manage') && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {s.value && (
                      <img src={s.value} alt="Current site logo" className="mb-3 h-16 w-16 rounded-full border border-slate-200 bg-white object-contain p-1" />
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={logoRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => uploadLogo(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                      <Button type="button" disabled={uploadingLogo} onClick={(e) => { e.preventDefault(); logoRef.current?.click(); }}>
                        {uploadingLogo ? 'Uploading…' : s.value ? 'Change logo' : 'Upload logo'}
                      </Button>
                    </div>
                  </div>
                )}
              </label>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
