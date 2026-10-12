// Decorative backdrop shared by every screen of the app: a near-white wash with
// soft green/gold glow blobs, a fading dotted texture, and crest-style shapes.
//
// It is fixed, aria-hidden, pointer-events-none and painted at -z-10 — below
// every card, table, header and line of text — so it can never overlap, hide,
// or intercept anything. Screens using it must not put an opaque background on
// their own root wrapper (the backdrop provides the base wash instead).
//
// variant="portal" tones everything down for dense work screens;
// the default suits the public site and the auth panels.
export default function FancyBackground({ variant = 'site' }) {
  const soft = variant === 'portal';
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base wash — white melting into faint green and gold */}
      <div className={`absolute inset-0 bg-gradient-to-br ${soft
        ? 'from-slate-50 via-green-50/60 to-amber-50/50'
        : 'from-white via-green-50/70 to-amber-50/60'}`} />

      {/* Dotted texture, strongest in the middle and fading to the edges */}
      <div className={`pattern-dots absolute inset-0 ${soft ? 'opacity-50' : 'opacity-80'} [mask-image:radial-gradient(ellipse_80%_70%_at_50%_35%,black,transparent_82%)]`} />

      {/* Drifting glow blobs */}
      <div className={`blob-drift absolute -right-28 -top-16 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-green-300/40 via-emerald-200/30 to-transparent blur-3xl ${soft ? 'opacity-60' : ''}`} />
      <div className={`blob-drift-slow absolute -left-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-amber-300/35 via-yellow-200/25 to-transparent blur-3xl ${soft ? 'opacity-60' : ''}`} />
      <div className={`blob-drift absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-gradient-to-tl from-green-200/35 to-transparent blur-3xl ${soft ? 'opacity-60' : ''}`} />

      {/* Crest geometry — rings, a tilted square, diamond sparks */}
      <div className={`absolute right-[7%] top-24 h-40 w-40 rounded-full border-[12px] ${soft ? 'border-primary/[0.06]' : 'border-primary/10'}`} />
      <div className={`absolute right-[11%] top-36 h-16 w-16 rounded-full border-8 ${soft ? 'border-gold/10' : 'border-gold/20'}`} />
      <div className={`absolute -left-10 bottom-28 h-32 w-32 rotate-45 rounded-3xl border-[10px] ${soft ? 'border-gold/10' : 'border-gold/15'}`} />
      <div className={`absolute left-[14%] top-28 h-2.5 w-2.5 rotate-45 ${soft ? 'bg-gold/25' : 'bg-gold/45'}`} />
      <div className={`absolute right-[26%] top-14 h-2 w-2 rotate-45 ${soft ? 'bg-primary/15' : 'bg-primary/30'}`} />
      <div className={`absolute left-[30%] bottom-16 h-2 w-2 rotate-45 ${soft ? 'bg-primary/15' : 'bg-primary/25'}`} />
      <div className={`absolute right-[38%] bottom-24 h-2.5 w-2.5 rotate-45 ${soft ? 'bg-gold/20' : 'bg-gold/35'}`} />
    </div>
  );
}
