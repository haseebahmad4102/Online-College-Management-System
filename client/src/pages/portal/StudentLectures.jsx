import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Card, Button, Badge, useFlash, errText, fmtDate } from '../../components/ui';
import SecurePlayer from '../../components/SecurePlayer';

// Student: recorded lectures for their own class section.
//
// The listing carries no video id — picking a lecture calls the playback
// endpoint, which checks the viewer is an active student of that section before
// returning one. Watch progress is reported back while the video plays, so the
// list can show what is part-watched, what is finished, and whether the
// follow-up quiz has been done.
const hhmmss = (s) => {
  if (!s) return '00h:00m:00s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${String(h).padStart(2, '0')}h:${String(m).padStart(2, '0')}m:${String(secs).padStart(2, '0')}s`;
};
const mins = (s) => (s ? hhmmss(s) : null);

export default function StudentLectures() {
  const [lectures, setLectures] = useState(null);
  const [playing, setPlaying] = useState(null); // { ...lecture, youtubeId }
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [flash, flashEl] = useFlash();
  const navigate = useNavigate();
  const sending = useRef(false);

  const load = () => api.get('/lectures').then((r) => setLectures(r.data.lectures)).catch(() => setLectures([]));
  useEffect(() => { load(); }, []);

  async function play(l) {
    setLoading(true);
    setJustFinished(false);
    setPlaying({ ...l, youtubeId: null });
    try {
      const [pl, pr] = await Promise.all([
        api.get(`/lectures/${l.id}/play`),
        api.get(`/lectures/${l.id}/progress`).catch(() => ({ data: { progress: null } })),
      ]);
      setPlaying(pl.data.lecture);
      setProgress(pr.data.progress);
    } catch (e) {
      setPlaying(null);
      flash({ type: 'error', text: errText(e) });
    } finally { setLoading(false); }
  }

  // Heartbeat from the player. Overlapping sends are dropped rather than queued.
  async function report(payload) {
    if (!playing || sending.current) return;
    sending.current = true;
    try {
      const r = await api.post(`/lectures/${playing.id}/progress`, payload);
      setProgress(r.data.progress);
    } catch { /* a dropped heartbeat is not worth interrupting the lecture for */ }
    finally { sending.current = false; }
  }

  function close() {
    setPlaying(null); setProgress(null); setJustFinished(false);
    load(); // refresh the badges on the list
  }

  if (!lectures) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const quiz = playing?.quiz;

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Recorded Lectures</h1>

      {playing && (
        <Card
          title={playing.title}
          actions={<Button variant="outline" onClick={close}>Close</Button>}
        >
          <SecurePlayer
            youtubeId={playing.youtubeId}
            title={playing.title}
            startAt={progress?.lastPosSec ?? 0}
            onProgress={report}
            onEnded={() => setJustFinished(true)}
            onWatchAgain={() => setJustFinished(false)}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {progress && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-40 rounded-full bg-slate-200">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress.percent ?? 0}%` }} />
                  </div>
                  <span className="text-slate-600">{progress.percent ?? 0}% watched</span>
                </div>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-mono text-xs">{hhmmss(progress.watchedSec)} of viewing</span>
                {progress.completedAt && <Badge value="completed" />}
              </>
            )}
          </div>

          {justFinished && playing.strictTracking && !progress?.completedAt && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="font-semibold text-amber-800">You reached the end, but...</div>
              <p className="mt-1 text-sm text-amber-700">
                This lecture requires you to watch the full video. You skipped parts of it, so it is still marked as Incomplete. Please go back and watch the parts you missed.
              </p>
            </div>
          )}
          {justFinished && quiz && (playing.strictTracking ? progress?.completedAt : true) && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="font-semibold text-green-800">Lecture finished — now take the quiz</div>
              <p className="mt-1 text-sm text-green-700">
                “{quiz.title}” follows this lecture{quiz.totalMarks ? ` (${quiz.totalMarks} marks)` : ''}.
              </p>
              <Button className="mt-3" onClick={() => navigate('/portal/student-classwork')}>
                Go to the quiz →
              </Button>
            </div>
          )}
          {justFinished && !quiz && (playing.strictTracking ? progress?.completedAt : true) && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Lecture finished — your progress has been recorded.
            </div>
          )}

          {playing.description && <p className="mt-3 text-sm text-slate-600">{playing.description}</p>}
          <p className="mt-3 text-xs text-slate-400">
            {playing.subject?.code} — {playing.subject?.title}. This recording is for enrolled students of your
            class; please do not share it outside the class. Your viewing time is recorded for your teacher.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lectures.map((l) => {
          const p = l.progress;
          return (
            <button key={l.id} onClick={() => play(l)} disabled={loading}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-primary disabled:opacity-60">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-800">{l.title}</div>
                {(mins(l.durationSec) || l.durationMins) && (
                  <Badge value={mins(l.durationSec) ?? `${l.durationMins} min`} />
                )}
              </div>
              <div className="mt-1 text-sm text-slate-500">{l.subject?.code} — {l.subject?.title}</div>

              {p ? (
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.percent ?? 0}%` }} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {p.completedAt ? <Badge value="completed" /> : <span>{p.percent ?? 0}% watched</span>}
                    {l.quizId && (l.quizDone
                      ? <Badge value={l.quizScore != null ? `quiz ${l.quizScore}` : 'quiz done'} />
                      : <Badge value="quiz pending" />)}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-400">
                  Not started{l.quizId ? ' · quiz follows' : ''}
                </div>
              )}

              <div className="mt-2 text-xs text-slate-400">Posted {fmtDate(l.createdAt)}</div>
            </button>
          );
        })}
      </div>

      {lectures.length === 0 && (
        <Card><p className="py-10 text-center text-sm text-slate-400">
          No recorded lectures have been posted for your class yet.
        </p></Card>
      )}
    </div>
  );
}
