import { useCallback, useEffect, useRef, useState } from "react";

// Lecture player for an unlisted YouTube upload.
//
// YouTube chrome is eliminated entirely: controls=0, disablekb=1, rel=0,
// no annotations, no info bar, no logo. The player uses the youtube-nocookie.com
// domain which suppresses the YouTube watermark/logo in the video corner.
//
// A full-surface transparent shield sits on top of the iframe. It intercepts
// every click (play/pause), every right-click (context menu blocked), and any
// keyboard event the YT player might otherwise steal.
//
// The YT video ID still reaches the browser to play, and progress is
// client-reported (the server clamps each heartbeat). This is evidence of
// engagement, not cryptographic proof of attention.

const HEARTBEAT_MS = 10000;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

let apiReady = null;
function loadYouTubeApi() {
  if (apiReady) return apiReady;
  apiReady = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
    if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
  return apiReady;
}

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60), h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

// ── SVG icon components for clean, sharp controls ─────────────────────
const IconPlay = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M8 5v14l11-7z"/>
  </svg>
);
const IconPause = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);
const IconVolume = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);
const IconMute = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>
);
const IconFullscreen = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
  </svg>
);
const IconExitFullscreen = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
  </svg>
);

export default function SecurePlayer({ youtubeId, title, startAt = 0, onProgress, onEnded, onWatchAgain }) {
  const host = useRef(null);
  const player = useRef(null);
  const shell = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [pos, setPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [full, setFull] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef(null);

  const playedSince = useRef(0);
  const lastTick = useRef(null);

  const report = useCallback((extra = {}) => {
    const played = Math.round(playedSince.current);
    playedSince.current = 0;
    const p = player.current;
    if (!p || typeof p.getCurrentTime !== "function") return;
    onProgress?.({
      positionSec: Math.floor(p.getCurrentTime() || 0),
      durationSec: Math.floor(p.getDuration() || 0),
      playedSec: played,
      ...extra,
    });
  }, [onProgress]);

  // ── Build the player ────────────────────────────────────────────────
  useEffect(() => {
    if (!youtubeId) return undefined;
    let dead = false;
    loadYouTubeApi().then((YT) => {
      if (dead || !host.current) return;
      player.current = new YT.Player(host.current, {
        videoId: youtubeId,
        playerVars: {
          controls: 0,           // no YouTube controls
          disablekb: 1,          // no YouTube keyboard shortcuts
          modestbranding: 1,     // suppress YT branding
          rel: 0,                // no related-video suggestions
          iv_load_policy: 3,     // no annotations
          fs: 0,                 // fullscreen via our own button only
          playsinline: 1,
          showinfo: 0,           // hide title bar
          cc_load_policy: 0,     // no auto-captions
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: (e) => {
            if (dead) return;
            setReady(true);
            setDuration(e.target.getDuration() || 0);
            e.target.setVolume(volume);
            if (startAt > 5) e.target.seekTo(startAt, true);
          },
          onStateChange: (e) => {
            const s = e.data;
            setPlaying(s === YT.PlayerState.PLAYING);
            if (s === YT.PlayerState.PLAYING) lastTick.current = Date.now();
            if (s === YT.PlayerState.PAUSED) { report(); lastTick.current = null; }
            if (s === YT.PlayerState.ENDED) {
              setFinished(true);
              report({ ended: true });
              onEnded?.();
            }
          },
        },
      });
    });
    return () => {
      dead = true;
      try { player.current?.destroy?.(); } catch { /* already gone */ }
      player.current = null;
    };
  }, [youtubeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tick: position, buffered, honest play-time accumulation ─────────
  useEffect(() => {
    const id = setInterval(() => {
      const p = player.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      if (!scrubbing) setPos(p.getCurrentTime() || 0);
      setDuration(p.getDuration() || 0);
      setBuffered((p.getVideoLoadedFraction?.() || 0) * (p.getDuration() || 0));
      if (playing && document.visibilityState === "visible" && lastTick.current) {
        const delta = (Date.now() - lastTick.current) / 1000;
        if (delta > 0 && delta < 5) playedSince.current += delta;
      }
      lastTick.current = playing ? Date.now() : null;
    }, 500);
    return () => clearInterval(id);
  }, [playing, scrubbing]);

  // Heartbeat while playing.
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => report(), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [playing, report]);

  // Pause on tab hide, flush on page unload.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        try { player.current?.pauseVideo?.(); } catch { /* ignore */ }
        report();
      }
    };
    const onUnload = () => report();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onUnload);
      report();
    };
  }, [report]);

  // Block context menu on the whole player element.
  useEffect(() => {
    const el = shell.current;
    if (!el) return undefined;
    const noMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setBlocked(true);
      setTimeout(() => setBlocked(false), 1800);
    };
    el.addEventListener("contextmenu", noMenu, true);
    return () => el.removeEventListener("contextmenu", noMenu, true);
  }, []);

  // Track fullscreen state from the browser.
  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Auto-hide controls after 3s of inactivity while playing.
  const revealControls = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    if (playing) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  };
  useEffect(() => {
    if (!playing) { setShowControls(true); clearTimeout(controlsTimeout.current); }
    else { controlsTimeout.current = setTimeout(() => setShowControls(false), 3000); }
    return () => clearTimeout(controlsTimeout.current);
  }, [playing]);

  // ── Controls ────────────────────────────────────────────────────────
  const toggle = () => {
    const p = player.current; if (!p) return;
    if (playing) p.pauseVideo(); else p.playVideo();
  };
  const seekTo = (t) => {
    const p = player.current; if (!p) return;
    const clamped = Math.max(0, Math.min(t, duration || 0));
    p.seekTo(clamped, true);
    setPos(clamped);
  };
  const nudge = (d) => seekTo((player.current?.getCurrentTime?.() || 0) + d);
  const setVol = (v) => {
    setVolume(v); setMuted(v === 0);
    try {
      player.current?.setVolume?.(v);
      v === 0 ? player.current?.mute?.() : player.current?.unMute?.();
    } catch { /* ignore */ }
  };
  const toggleMute = () => {
    if (muted) { setMuted(false); try { player.current?.unMute?.(); } catch { /* ignore */ } }
    else { setMuted(true); try { player.current?.mute?.(); } catch { /* ignore */ } }
  };
  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    try { player.current?.setPlaybackRate?.(next); } catch { /* ignore */ }
  };
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else shell.current?.requestFullscreen?.();
  };

  const onKey = (e) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); toggle(); revealControls(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); nudge(5); revealControls(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-5); revealControls(); }
    else if (k === "m") { e.preventDefault(); toggleMute(); }
    else if (k === "f") { e.preventDefault(); toggleFull(); }
  };

  if (!youtubeId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-sm text-slate-400">
        Loading lecture…
      </div>
    );
  }

  const pct = duration ? (pos / duration) * 100 : 0;
  const bufPct = duration ? Math.min(100, (buffered / duration) * 100) : 0;

  return (
    <div
      ref={shell}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseMove={revealControls}
      className="group relative select-none overflow-hidden rounded-xl bg-black shadow-2xl outline-none"
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      {/* ── Video surface ─────────────────────────────────────────────── */}
      <div className="relative aspect-video bg-black">
        {/* The actual YT iframe — hidden until ready to prevent the logo flash */}
        <div
          className="absolute inset-0 h-full w-full transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0, pointerEvents: "none" }}
        >
          <div ref={host} className="h-full w-full" />
        </div>

        {/* Full-surface transparent shield.
            pointer-events:all ensures the iframe cannot receive any click or
            right-click. The button handles play/pause; right-click is caught by
            the contextmenu listener on the shell above. */}
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => { toggle(); revealControls(); }}
          onDoubleClick={toggleFull}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent"
          style={{ WebkitTapHighlightColor: "transparent" }}
        />

        {/* Loading state */}
        {!ready && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-900">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-green-400" />
            <span className="text-sm text-slate-400">Loading lecture…</span>
          </div>
        )}

        {/* Large centre play overlay when paused */}
        {ready && !playing && !finished && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/70 text-white shadow-xl ring-4 ring-white/20 backdrop-blur-sm transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="ml-1.5 h-9 w-9 fill-current" aria-hidden="true">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Lecture-complete overlay */}
        {finished && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="mb-2 text-4xl">✓</div>
              <div className="text-xl font-bold">Lecture complete</div>
              <div className="mt-1.5 text-sm text-white/70">Your progress has been recorded.</div>
            </div>
            <button
              onClick={() => {
                setFinished(false);
                playedSince.current = 0;
                report({ newAttempt: true });
                player.current?.seekTo(0, true);
                player.current?.playVideo();
                onWatchAgain?.();
              }}
              className="mt-6 rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-colors backdrop-blur-md cursor-pointer"
            >
              Watch Again
            </button>
          </div>
        )}

        {/* Context-menu blocked notice */}
        {blocked && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg bg-black/90 px-4 py-2 text-xs text-white shadow-xl backdrop-blur-sm">
            🔒 This lecture is for enrolled students only.
          </div>
        )}

        {/* Gradient overlay at the bottom for control bar legibility */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", opacity: showControls ? 1 : 0 }}
        />
      </div>

      {/* ── Custom control bar ───────────────────────────────────────── */}
      <div
        className="relative z-20 px-4 pb-3 pt-2 transition-opacity duration-300"
        style={{ background: "linear-gradient(to top, #0a0a0a 0%, #111 100%)", opacity: showControls ? 1 : 0 }}
      >
        {/* Progress / scrub bar */}
        <div
          className="group/bar relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/20"
          onMouseDown={() => setScrubbing(true)}
          onMouseUp={() => setScrubbing(false)}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - r.left) / r.width) * duration);
          }}
        >
          {/* Buffered */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-all" style={{ width: `${bufPct}%` }} />
          {/* Played */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          {/* Thumb — appears on hover */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 scale-0 rounded-full bg-emerald-400 shadow transition-transform group-hover/bar:scale-100"
            style={{ left: `${pct}%` }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-1 text-white">
          {/* Play / Pause */}
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
            title={playing ? "Pause (Space)" : "Play (Space)"}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>

          {/* Skip back 10s */}
          <button
            onClick={() => nudge(-10)}
            className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title="Back 10s"
          >
            −10s
          </button>

          {/* Skip forward 10s */}
          <button
            onClick={() => nudge(10)}
            className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title="Forward 10s"
          >
            +10s
          </button>

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title={muted ? "Unmute (m)" : "Mute (m)"}
          >
            {muted ? <IconMute /> : <IconVolume />}
          </button>

          {/* Volume slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : volume}
            onChange={(e) => setVol(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer rounded-full"
            style={{ accentColor: "#34d399" }}
            aria-label="Volume"
          />

          {/* Timestamp */}
          <span className="ml-2 shrink-0 font-mono text-xs tabular-nums text-white/70">
            {fmt(pos)} / {fmt(duration)}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title="Playback speed"
          >
            {speed}×
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFull}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title={full ? "Exit full screen (f)" : "Full screen (f)"}
          >
            {full ? <IconExitFullscreen /> : <IconFullscreen />}
          </button>
        </div>
      </div>
    </div>
  );
}
