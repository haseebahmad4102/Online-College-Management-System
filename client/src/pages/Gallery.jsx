import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';
import { FitImage } from '../components/ui';

// Public photo gallery (§5.14) — images are managed by the principal from the portal.
export default function Gallery() {
  const [images, setImages] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api.get('/public/gallery').then((res) => setImages(res.data.images)).catch(() => setImages([]));
  }, []);

  return (
    <div>
      <PageHeader title="Gallery" subtitle="Campus life, events, and facilities in pictures" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {!images && <Loading />}
        {images && images.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No photos have been published yet — please check back soon.
          </div>
        )}
        {images && images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((g) => (
              <figure
                key={g.id}
                className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                onClick={() => setLightbox(g)}
              >
                <FitImage
                  src={g.imagePath}
                  alt={g.caption || 'College gallery photo'}
                  className="h-44 w-full"
                  imgClassName="transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {g.caption && <figcaption className="px-3 py-2 text-xs text-slate-500">{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.imagePath} alt={lightbox.caption || 'College gallery photo'} className="max-h-[80vh] rounded-lg object-contain" />
            {lightbox.caption && <figcaption className="mt-2 text-center text-sm text-white">{lightbox.caption}</figcaption>}
          </figure>
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-xl text-white hover:bg-white/20"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
