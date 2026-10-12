import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';

export default function About() {
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get('/public/pages/about').then((res) => setPage(res.data.page)).catch(() => setNotFound(true));
  }, []);

  return (
    <div>
      <PageHeader title="About the College" subtitle="History, mission, and facilities of GGCM" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {notFound && <p className="text-slate-500">Content coming soon.</p>}
        {!page && !notFound && <Loading />}
        {page && (
          <div
            className="rounded-xl border border-slate-200 bg-white p-8 leading-relaxed text-slate-700 shadow-sm [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}
      </div>
    </div>
  );
}
