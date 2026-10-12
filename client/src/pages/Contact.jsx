import PageHeader from '../components/site/PageHeader';
import { useSite } from '../layouts/SiteLayout';

export default function Contact() {
  const { settings } = useSite();

  const rows = [
    ['Address', settings['site.address']],
    ['Phone', settings['site.phone']],
    ['Email', settings['site.email']],
  ].filter(([, v]) => v);

  return (
    <div>
      <PageHeader title="Contact Us" subtitle="Reach the college office" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-primary">College Office</h2>
          <dl className="space-y-4">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-0.5 text-slate-700">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Office Hours</dt>
              <dd className="mt-0.5 text-slate-700">Monday – Saturday, 08:00 AM – 02:00 PM</dd>
            </div>
          </dl>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {settings['site.map_embed'] ? (
            <div dangerouslySetInnerHTML={{ __html: settings['site.map_embed'] }} />
          ) : (
            <iframe
              title="College location"
              src="https://www.google.com/maps?q=Govt.+Graduate+College+Muzaffargarh&output=embed"
              className="h-full min-h-80 w-full border-0"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </div>
  );
}
