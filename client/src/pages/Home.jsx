import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/site/Loading';
import { FitImage } from '../components/ui';

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Rises into view once when scrolled to (respects prefers-reduced-motion via CSS).
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}>
      {children}
    </div>
  );
}

// Stat numbers count up from 0 the first time they scroll into view.
function CountUp({ value }) {
  const ref = useRef(null);
  const target = Number(value) || 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1300);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <span ref={ref}>{n}</span>;
}

// Gold flourish under section headings — a small crest-like divider.
function Ornament() {
  return (
    <div aria-hidden className="mb-8 flex items-center justify-center gap-2.5">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/80" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/60" />
      <span className="h-2.5 w-2.5 rotate-45 border-2 border-gold bg-white" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/60" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/80" />
    </div>
  );
}

// Program card with a rich hover popover: full criteria and details (§5.14).
function ProgramCard({ program: p }) {
  const isBs = p.level === 'bs';
  return (
    <div className="group relative">
      <Link
        to="/admissions"
        className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg"
      >
        <div className="font-semibold text-slate-800">{p.name}</div>
        <div className="mt-1 text-xs text-slate-500">
          {isBs ? `${p.totalSemesters} semesters` : `${p.durationYears} years`} · {p.seats} seats · min {p.minPercentage}%
        </div>
      </Link>

      {/* Detailed popover on hover */}
      <div className="pointer-events-none invisible absolute left-1/2 top-full z-30 mt-2 w-80 max-w-[90vw] -translate-x-1/2 translate-y-2 rounded-xl border border-slate-200 bg-white p-5 opacity-0 shadow-xl transition-all duration-300 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="font-bold text-primary">{p.name}</div>
          <span className="shrink-0 rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
            {isBs ? 'BS (4-Year)' : 'Intermediate'}
          </span>
        </div>
        {p.department && <div className="mb-2 text-xs text-slate-500">Department of {p.department}</div>}
        <dl className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Duration</dt>
            <dd className="font-medium text-right">{p.durationYears} years{p.totalSemesters ? ` (${p.totalSemesters} semesters)` : ''}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Seats</dt>
            <dd className="font-medium">{p.seats}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-400">Minimum marks</dt>
            <dd className="font-medium">{p.minPercentage}% in {isBs ? 'Intermediate' : 'Matriculation'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-slate-400">Eligibility</dt>
            <dd className="text-right font-medium">
              {isBs
                ? (p.eligibleGroups?.length ? (p.eligibleGroups.length >= 6 ? 'All intermediate groups' : p.eligibleGroups.join(', ')) : 'Intermediate (any group)')
                : `Matriculation${p.interGroup ? ` — leads to ${p.interGroup}` : ''}`}
            </dd>
          </div>
        </dl>
        <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
          Merit is calculated from your academic record — see the Admissions page to apply online.
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    api.get('/public/home').then((res) => setData(res.data)).catch(() => setData({ error: true }));
  }, []);

  useEffect(() => {
    if (!data?.sliders?.length) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % data.sliders.length), 4000);
    return () => clearInterval(t);
  }, [data]);

  if (!data) return <Loading />;
  if (data.error) return <div className="py-24 text-center text-red-600">Could not load the website. Is the API running?</div>;

  const { sliders, notices, programs, principalMessage, mission, vision, missionImage, visionImage, gallery, stats } = data;
  const bsPrograms = programs.filter((p) => p.level === 'bs');
  const interPrograms = programs.filter((p) => p.level === 'intermediate');

  return (
    <div>
      {/* Slider */}
      {sliders.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white">
          {/* Background Image Layer */}
          {sliders[slide].imagePath && (
            <div className="absolute inset-0 z-0">
              <img
                key={`img-${slide}`}
                src={sliders[slide].imagePath}
                alt={sliders[slide].heading}
                className="hero-swap h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          )}
          
          {/* Floating decorative shapes — only visible if no image, or blended */}
          <div aria-hidden className={`pointer-events-none absolute inset-0 z-0 ${sliders[slide].imagePath ? 'opacity-30' : ''}`}>
            <div className="float-blob absolute -left-16 top-6 h-56 w-56 rounded-full bg-white/10" />
            <div className="float-blob-slow absolute -right-24 -bottom-16 h-80 w-80 rounded-full bg-white/10" />
            <div className="float-blob absolute right-1/4 -top-12 h-40 w-40 rounded-full bg-gold/25" />
            <div className="float-blob-slow absolute left-1/4 bottom-0 h-24 w-24 rounded-full bg-accent/20" />
          </div>
          <div className="relative z-10 mx-auto flex min-h-72 max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
            {/* key={slide} remounts the text so it animates in on every slide change */}
            <div key={`txt-${slide}`} className="hero-swap">
              <h2 className="mb-3 text-3xl font-bold sm:text-4xl">{sliders[slide].heading}</h2>
              <p className="mb-8 max-w-2xl text-lg text-green-100">{sliders[slide].subheading}</p>
            </div>
            <div className="flex gap-4">
              <Link to="/admissions"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-primary shadow transition-all duration-300 hover:-translate-y-1 hover:bg-green-50 hover:shadow-xl">
                Admissions 2026
              </Link>
              <Link to="/departments"
                className="rounded-lg border border-white/60 px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl">
                Explore Departments
              </Link>
            </div>
            <div className="mt-8 flex gap-2">
              {sliders.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === slide ? 'w-7 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Notice ticker */}
      {notices.length > 0 && (
        <div className="flex items-center gap-3 overflow-hidden bg-accent px-4 py-2 text-sm text-white">
          <span className="shrink-0 rounded bg-white/20 px-2 py-0.5 text-xs font-bold uppercase">Latest</span>
          <div className="flex-1 overflow-hidden">
            <div className="ticker-track flex w-max whitespace-nowrap">
              {[...notices, ...notices].map((n, i) => (
                <Link key={`${n.id}-${i}`} to={`/notices/${n.id}`} className="mr-10 hover:underline">
                  {n.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stylish white band: principal's message, mission/vision, and stats.
          White base + green/gold glow blobs, dotted texture, and crest shapes. */}
      <div className="relative overflow-x-clip bg-gradient-to-b from-white via-green-50/60 to-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="pattern-dots absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_38%,black,transparent_80%)]" />
          <div className="blob-drift absolute -right-24 top-10 h-96 w-96 rounded-full bg-gradient-to-br from-green-300/50 via-emerald-200/40 to-transparent blur-3xl" />
          <div className="blob-drift-slow absolute -left-28 top-1/3 h-96 w-96 rounded-full bg-gradient-to-tr from-amber-300/45 via-yellow-200/30 to-transparent blur-3xl" />
          <div className="blob-drift absolute bottom-4 right-1/4 h-72 w-72 rounded-full bg-gradient-to-tl from-green-200/45 to-transparent blur-2xl" />
          <div className="absolute right-[9%] top-16 h-44 w-44 rounded-full border-[14px] border-primary/10" />
          <div className="absolute right-[13%] top-28 h-20 w-20 rounded-full border-8 border-gold/20" />
          <div className="absolute -left-10 bottom-24 h-32 w-32 rotate-45 rounded-3xl border-[10px] border-gold/15" />
          <div className="absolute left-[15%] top-24 h-3 w-3 rotate-45 bg-gold/50" />
          <div className="absolute left-[9%] top-40 h-2 w-2 rotate-45 bg-primary/30" />
          <div className="absolute right-[24%] bottom-36 h-2.5 w-2.5 rotate-45 bg-primary/30" />
          <div className="absolute right-[30%] top-12 h-2 w-2 rotate-45 bg-gold/40" />
        </div>
      <div className="relative">
      {/* Principal's message — directly below the ticker */}
      {principalMessage && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <Reveal>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="shrink-0 text-center sm:w-44">
                {principalMessage.photoUrl ? (
                  <img
                    src={principalMessage.photoUrl}
                    alt={principalMessage.name || 'The Principal'}
                    className="mx-auto h-36 w-36 rounded-full border-4 border-green-100 object-cover object-top shadow"
                  />
                ) : (
                  <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 border-green-100 bg-primary text-5xl font-bold text-white shadow">
                    {(principalMessage.name || 'P').charAt(0)}
                  </div>
                )}
                {principalMessage.name && (
                  <div className="mt-3 text-sm font-bold text-slate-800">{principalMessage.name}</div>
                )}
                <div className="text-xs text-slate-500">Principal</div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-4 text-xl font-bold text-primary">{principalMessage.title}</h2>
                <div
                  className="prose prose-sm max-w-none text-slate-600 [&_p]:mb-3"
                  dangerouslySetInnerHTML={{ __html: principalMessage.content }}
                />
                <p className="mt-4 text-sm font-semibold text-slate-800">
                  — {principalMessage.name || 'The Principal'}, GGCM
                </p>
              </div>
            </div>
          </div>
          </Reveal>
        </section>
      )}

      {/* Our Mission & Vision */}
      {(mission || vision) && (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              ['Our Mission', '🎯', mission, missionImage],
              ['Our Vision', '🔭', vision, visionImage],
            ].filter(([, , text]) => text).map(([title, icon, text, image], i) => (
              <Reveal key={title} delay={i * 140}>
              <div className="group h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                {image && (
                  <div className="relative h-40 w-full overflow-hidden">
                    <FitImage src={image} alt={title} className="h-full w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <h2 className="absolute bottom-3 left-5 flex items-center gap-2 text-xl font-bold text-white">
                      <span>{icon}</span> {title}
                    </h2>
                  </div>
                )}
                <div className="p-6">
                  {!image && (
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-xl">{icon}</span>
                      <h2 className="text-xl font-bold text-primary">{title}</h2>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* GGCM at a Glance — quick stats */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Reveal>
          <h2 className="mb-1 text-center text-2xl font-bold text-slate-900">GGCM at a Glance</h2>
          <p className="mb-3 text-center text-slate-500">Our college in numbers</p>
          <Ornament />
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [stats.programs, 'Programs'],
            [stats.departments, 'Departments'],
            [stats.teachers, 'Faculty Members'],
            [stats.seats, 'Total Seats'],
          ].map(([value, label], i) => (
            <Reveal key={label} delay={i * 110}>
            <div
              className="group h-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:bg-primary hover:shadow-xl"
            >
              <div className="text-3xl font-bold text-primary transition-colors duration-300 group-hover:text-white"><CountUp value={value} /></div>
              <div className="mt-1 text-sm text-slate-500 transition-colors duration-300 group-hover:text-green-100">{label}</div>
            </div>
            </Reveal>
          ))}
        </div>
      </section>
      </div>
      </div>

      {/* Programs grid — hover a card for full details. Near-white green-tinted
          band with a fading line grid and corner color glows. */}
      <section className="relative overflow-x-clip bg-[#f5faf6] px-4 py-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="pattern-grid absolute inset-0 [mask-image:radial-gradient(ellipse_80%_75%_at_50%_30%,black,transparent_82%)]" />
          <div className="blob-drift absolute -left-24 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-300/45 to-transparent blur-3xl" />
          <div className="blob-drift-slow absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-gradient-to-tl from-rose-300/35 via-accent/10 to-transparent blur-3xl" />
          <div className="absolute right-[7%] top-14 h-20 w-20 rotate-12 rounded-2xl border-8 border-primary/10" />
          <div className="absolute left-[8%] bottom-14 h-32 w-32 rounded-full border-[12px] border-accent/10" />
          <div className="absolute left-[20%] top-16 h-2.5 w-2.5 rotate-45 bg-accent/30" />
          <div className="absolute right-[18%] bottom-24 h-2 w-2 rotate-45 bg-primary/30" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-1 text-center text-2xl font-bold text-slate-900">Our Programs</h2>
            <p className="mb-3 text-center text-slate-500">
              Intermediate and 4-year BS degree programs — hover a program for details
            </p>
            <Ornament />
          </Reveal>

          <Reveal delay={120}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">BS (4-Year) Programs</h3>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bsPrograms.map((p) => <ProgramCard key={p.id} program={p} />)}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">Intermediate Programs</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {interPrograms.map((p) => <ProgramCard key={p.id} program={p} />)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Second stylish white band: gallery + notices — gold-leaning mirror of
          the first band so consecutive sections don't repeat. */}
      <div className="relative overflow-x-clip bg-gradient-to-b from-white via-amber-50/60 to-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="pattern-dots absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black,transparent_80%)]" />
          <div className="blob-drift-slow absolute -left-24 top-12 h-96 w-96 rounded-full bg-gradient-to-br from-amber-300/45 via-yellow-200/30 to-transparent blur-3xl" />
          <div className="blob-drift absolute -right-28 bottom-16 h-96 w-96 rounded-full bg-gradient-to-tl from-green-300/45 via-emerald-200/30 to-transparent blur-3xl" />
          <div className="blob-drift-slow absolute left-1/3 bottom-6 h-64 w-64 rounded-full bg-gradient-to-tr from-amber-200/40 to-transparent blur-2xl" />
          <div className="absolute left-[8%] top-20 h-40 w-40 rounded-full border-[14px] border-gold/15" />
          <div className="absolute -right-8 top-1/3 h-32 w-32 rotate-45 rounded-3xl border-[10px] border-primary/10" />
          <div className="absolute right-[14%] top-16 h-3 w-3 rotate-45 bg-primary/30" />
          <div className="absolute left-[22%] bottom-28 h-2.5 w-2.5 rotate-45 bg-gold/45" />
        </div>
      <div className="relative">
      {/* Gallery */}
      {gallery?.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <Reveal>
            <h2 className="mb-1 text-center text-2xl font-bold text-slate-900">Gallery</h2>
            <p className="mb-3 text-center text-slate-500">Life at Govt. Graduate College Muzaffargarh</p>
            <Ornament />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g, i) => (
              <Reveal key={g.id} delay={(i % 4) * 90}>
              <figure className="group h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="overflow-hidden">
                  <img
                    src={g.imagePath}
                    alt={g.caption || 'College gallery photo'}
                    className="h-40 w-full object-cover transition duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                {g.caption && (
                  <figcaption className="px-3 py-2 text-xs text-slate-500 transition-colors duration-300 group-hover:text-primary">{g.caption}</figcaption>
                )}
              </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Notices and Events */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Reveal>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <h2 className="mb-4 text-xl font-bold text-primary">Notices and Events</h2>
          <ul className="space-y-3">
            {notices.map((n) => (
              <li key={n.id} className="border-b border-slate-100 pb-3 transition-transform duration-200 last:border-0 hover:translate-x-1.5">
                <Link to={`/notices/${n.id}`} className="text-sm font-medium text-slate-800 hover:text-primary">
                  {n.title}
                </Link>
                <div className="text-xs text-slate-400">{fmtDate(n.publishedAt)}</div>
              </li>
            ))}
          </ul>
          <Link to="/notices" className="mt-4 inline-block text-sm font-medium text-accent transition-transform duration-200 hover:translate-x-1 hover:underline">
            View all notices and events →
          </Link>
        </div>
        </Reveal>
      </section>
      </div>
      </div>
    </div>
  );
}
