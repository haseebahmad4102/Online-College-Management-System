import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Field, Textarea, FitImage, PhotoPicker, useFlash, errText } from '../../components/ui';

// Principal-only website content manager: principal's message (name, photo, message)
// and the public photo gallery (§5.14).
export default function Website() {
  const [flash, flashEl] = useFlash();
  const { user, can } = useAuth();
  // The principal's photo is personal — only the Principal may replace it (not admin).
  const isPrincipal = (user?.roles ?? []).includes('principal');
  // website.view = read-only preview; edits/uploads need website.manage.
  const manage = can('website.manage');

  // ── Principal's message ──
  const [msg, setMsg] = useState(null);
  const [savingMsg, setSavingMsg] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Gallery ──
  const [images, setImages] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Mission / Vision card images ──
  const [siteImages, setSiteImages] = useState({ mission: '', vision: '' });
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const loadMsg = () => api.get('/settings/principal-message').then((r) => setMsg(r.data));
  const loadGallery = () => api.get('/settings/gallery').then((r) => setImages(r.data.images));
  const loadSiteImages = () => api.get('/settings/public').then((r) => setSiteImages({
    mission: r.data.settings['site.mission_image'] || '',
    vision: r.data.settings['site.vision_image'] || '',
  }));

  useEffect(() => {
    loadMsg();
    loadGallery();
    loadSiteImages();
  }, []);

  async function uploadSlotImage(slot, file) {
    try {
      setUploadingSlot(slot);
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post(`/settings/site-image/${slot}`, fd);
      setSiteImages((s) => ({ ...s, [slot]: r.data.url }));
      flash({ type: 'ok', text: r.data.message });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setUploadingSlot(null); }
  }

  async function saveMessage() {
    try {
      setSavingMsg(true);
      await api.put('/settings/principal-message', { title: msg.title, content: msg.content, name: msg.name });
      flash({ type: 'ok', text: "Principal's message saved — it is live on the homepage." });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSavingMsg(false); }
  }

  async function uploadPhoto(file) {
    try {
      setUploadingPhoto(true);
      const fd = new FormData();
      fd.append('photo', file);
      const r = await api.post('/settings/principal-photo', fd);
      setMsg((m) => ({ ...m, photoUrl: r.data.url }));
      flash({ type: 'ok', text: 'Principal photo updated.' });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setUploadingPhoto(false); }
  }

  async function uploadGalleryImage(file) {
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('image', file);
      if (caption) fd.append('caption', caption);
      await api.post('/settings/gallery', fd);
      setCaption('');
      flash({ type: 'ok', text: 'Photo added to the gallery.' });
      loadGallery();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setUploadingImage(false); }
  }

  async function toggleImage(g) {
    await api.put(`/settings/gallery/${g.id}`, { isActive: !g.isActive }).catch((e) => flash({ type: 'error', text: errText(e) }));
    loadGallery();
  }

  async function deleteImage(g) {
    if (!window.confirm('Delete this photo from the gallery permanently?')) return;
    await api.delete(`/settings/gallery/${g.id}`).catch((e) => flash({ type: 'error', text: errText(e) }));
    loadGallery();
  }

  if (!msg || images === null) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Website Content</h1>

      <Card title="Principal's message (homepage)">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Field label="Section title">
              <Input value={msg.title} onChange={(e) => setMsg({ ...msg, title: e.target.value })} />
            </Field>
            <Field label="Principal name" hint="Shown under the photo and in the message signature.">
              <Input value={msg.name} onChange={(e) => setMsg({ ...msg, name: e.target.value })} />
            </Field>
            <Field label="Message" hint="Basic HTML is supported — wrap paragraphs in <p>…</p>.">
              <Textarea rows={8} value={msg.content} onChange={(e) => setMsg({ ...msg, content: e.target.value })} />
            </Field>
            {manage && <Button disabled={savingMsg} onClick={saveMessage}>{savingMsg ? 'Saving…' : 'Save message'}</Button>}
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Principal photo</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
              {msg.photoUrl ? (
                <img src={msg.photoUrl} alt="Principal" className="mx-auto mb-3 h-32 w-32 rounded-full border-4 border-green-100 object-cover object-top" />
              ) : (
                <div className="mx-auto mb-3 flex h-32 w-32 items-center justify-center rounded-full bg-slate-200 text-4xl text-slate-400">👤</div>
              )}
              {isPrincipal ? (
                <>
                  <PhotoPicker label="Change photo" busy={uploadingPhoto} onPick={uploadPhoto} className="w-full" />
                  <p className="mt-2 text-xs text-slate-400">Tap to pick a photo — it uploads right away. JPG or PNG, max 2 MB.</p>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Only the Principal can change this photo.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Mission & Vision card images (homepage)">
        <div className="grid gap-4 sm:grid-cols-2">
          {['mission', 'vision'].map((slot) => (
            <div key={slot} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-medium capitalize text-slate-700">Our {slot}</div>
              {siteImages[slot] ? (
                <FitImage src={siteImages[slot]} alt={`${slot} card`} className="mb-3 h-32 w-full rounded-lg" />
              ) : (
                <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-slate-200 text-sm text-slate-400">No image</div>
              )}
              {manage && <PhotoPicker label="Change image" busy={uploadingSlot === slot} onPick={(file) => uploadSlotImage(slot, file)} className="w-full sm:w-auto" />}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">The mission/vision text itself is edited under Settings → site.mission / site.vision.</p>
      </Card>

      <Card title="Photo gallery (public website)">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-xs font-medium text-slate-600">Caption (optional) — type it first, then pick the photo</div>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Annual sports day 2026" />
          </div>
          {manage && <PhotoPicker label="+ Add photo" busy={uploadingImage} onPick={uploadGalleryImage} className="w-full sm:w-auto" />}
        </div>

        {images.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No gallery photos yet — add the first one above.</p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((g) => (
            <div key={g.id} className={`overflow-hidden rounded-xl border shadow-sm ${g.isActive ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50 opacity-60'}`}>
              <FitImage src={g.imagePath} alt={g.caption || 'Gallery photo'} className="h-32 w-full" />
              <div className="p-2.5">
                <div className="truncate text-xs text-slate-600">{g.caption || <span className="text-slate-300">No caption</span>}</div>
                {manage && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button onClick={() => toggleImage(g)} className="text-xs font-medium text-primary hover:underline">
                      {g.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => deleteImage(g)} className="text-xs font-medium text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
