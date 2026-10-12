import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import api from '../api/client';
import FancyBackground from '../components/FancyBackground';

const SiteContext = createContext({ settings: {} });
export const useSite = () => useContext(SiteContext);

const NAV = [
  ['Home', '/'],
  ['About', '/about'],
  ['Admissions', '/admissions'],
  ['Departments', '/departments'],
  ['Faculty', '/faculty'],
  ['Notices & Events', '/notices'],
  ['Gallery', '/gallery'],
  ['Contact', '/contact'],
];

export default function SiteLayout() {
  const [settings, setSettings] = useState({});
  const [logoBroken, setLogoBroken] = useState(false);

  useEffect(() => {
    api.get('/settings/public').then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  const nameEn = settings['site.college_name_en'] || 'Govt. Graduate College Muzaffargarh';
  const nameUr = settings['site.college_name_ur'] || '';
  const logo = settings['site.logo'];

  return (
    <SiteContext.Provider value={{ settings }}>
      <div className="flex min-h-screen flex-col">
        <FancyBackground />
        {/* Utility bar */}
        <div className="bg-primary-dark px-4 py-1.5 text-xs text-green-100 sm:px-6">
          <div className="flex justify-between">
            <span>
              {settings['site.phone'] || '—'} · {settings['site.email'] || ''}
            </span>
          </div>
        </div>

        {/* Masthead */}
        <header className="border-b-4 border-gold bg-white px-4 py-5 sm:px-6">
          <div className="flex items-center gap-5">
            {logo && !logoBroken ? (
              <img src={logo} alt={`${nameEn} logo`} onError={() => setLogoBroken(true)}
                className="h-16 w-16 shrink-0 rounded-full border border-slate-200 bg-white object-contain p-1" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                G
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-primary sm:text-2xl">{nameEn}</h1>
              {nameUr && (
                <p className="w-fit font-urdu text-lg text-accent" dir="rtl">{nameUr}</p>
              )}
            </div>
            <Link
              to="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md ring-1 ring-primary-dark/20 transition hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg sm:px-5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.68 18.68 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
              Portal Login
            </Link>
          </div>
        </header>

        {/* Primary nav */}
        <nav className="sticky top-0 z-20 bg-primary text-sm font-medium text-white shadow">
          <div className="flex flex-wrap px-2 sm:px-4">
            {NAV.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-3 hover:bg-primary-dark ${isActive ? 'bg-primary-dark' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-primary-dark text-green-100">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-3 font-semibold text-white">{nameEn}</h3>
              <p className="text-sm leading-relaxed">
                A public-sector institution serving District Muzaffargarh with quality Intermediate
                and BS education.
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-white">Quick Links</h3>
              <ul className="space-y-1.5 text-sm">
                {NAV.slice(1).map(([label, to]) => (
                  <li key={to}><Link to={to} className="hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-white">Programs</h3>
              <ul className="space-y-1.5 text-sm">
                <li>BS (4-Year) Programs</li>
                <li>FSc Pre-Medical / Pre-Engineering</li>
                <li>ICS · FA · I.Com</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-white">Contact</h3>
              <ul className="space-y-1.5 text-sm">
                <li>{settings['site.address'] || ''}</li>
                <li>{settings['site.phone'] || ''}</li>
                <li>{settings['site.email'] || ''}</li>
                <li>
                  <Link to="/contact" className="mt-1 inline-block rounded-lg border border-white/30 px-3 py-1.5 font-medium text-white hover:bg-white/10">
                    Contact Us →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-xs">
            © {new Date().getFullYear()} {nameEn} — Online College Management System
          </div>
        </footer>
      </div>
    </SiteContext.Provider>
  );
}
