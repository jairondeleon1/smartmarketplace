import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText, Calendar, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function LinkIcon({ type }) {
  if (type === 'pdf') return <FileText className="w-4 h-4 shrink-0" />;
  if (type === 'signup') return <Calendar className="w-4 h-4 shrink-0" />;
  return <ExternalLink className="w-4 h-4 shrink-0" />;
}

export default function DietitianCornerSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.DietitianCorner.filter({ active: true })
      .then(results => setData(results?.[0] || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  return (
    <div className="rounded-3xl overflow-hidden border border-emerald-100 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-700 px-6 py-5 text-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Nutrition & Wellness</p>
        <h2 className="text-xl font-black uppercase tracking-tight">{data.title}</h2>
        {data.subtitle && <p className="text-emerald-200 text-sm mt-1">{data.subtitle}</p>}
      </div>

      <div className="p-6 space-y-6">
        {/* Hero image */}
        {data.hero_image_url && (
          <div className="rounded-2xl overflow-hidden">
            <img src={data.hero_image_url} alt="Wellness Banner" className="w-full object-cover max-h-64" />
          </div>
        )}

        {/* Dietitian profile + links */}
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Photo */}
          {data.dietitian_photo_url && (
            <div className="shrink-0 flex justify-center">
              <img
                src={data.dietitian_photo_url}
                alt={data.dietitian_name || 'Dietitian'}
                className="w-32 h-32 rounded-2xl object-cover border-4 border-emerald-100 shadow"
              />
            </div>
          )}

          <div className="flex-1 space-y-3">
            {data.dietitian_name && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Dietitian</p>
                <p className="font-bold text-slate-800 text-base">{data.dietitian_name}</p>
              </div>
            )}
            {data.dietitian_bio && (
              <p className="text-sm text-gray-600 leading-relaxed">{data.dietitian_bio}</p>
            )}
          </div>
        </div>

        {/* Resource links */}
        {data.links?.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Resources & Links</p>
            {data.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm uppercase tracking-wide transition active:scale-95"
              >
                <LinkIcon type={link.type} />
                <span className="flex-1 text-left">{link.label}</span>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </a>
            ))}
          </div>
        )}

        {/* Featured image tiles */}
        {data.featured_tiles?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Featured</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.featured_tiles.map((tile, i) => (
                <a
                  key={i}
                  href={tile.link_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={tile.image_url}
                      alt={tile.caption || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {tile.caption && (
                    <div className="p-2 text-[10px] font-bold text-gray-600 uppercase tracking-wide truncate">{tile.caption}</div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}