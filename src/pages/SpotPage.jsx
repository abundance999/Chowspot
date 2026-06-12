import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, MapPin, ArrowLeft, Loader2, AlertTriangle, UtensilsCrossed } from 'lucide-react';
import Header from '@/components/layout/Header';
import ContactButtons from '@/components/spot/ContactButtons';
import MenuSection from '@/components/spot/MenuSection';
import ReviewSection from '@/components/spot/ReviewSection';
import { Badge } from '@/components/ui/badge';
import { getVendorById } from '@/lib/vendors';
import { getMenuByVendor } from '@/lib/menu';
import { isOpenNow, formatTime, formatDays } from '@/lib/utils';

export default function SpotPage() {
  const { id } = useParams();

  const [vendor,    setVendor]    = useState(null);
  const [menu,      setMenu]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      // Fetch vendor and menu in parallel
      const [{ data: v, error }, { data: m }] = await Promise.all([
        getVendorById(id),
        getMenuByVendor(id),
      ]);
      if (cancelled) return;
      if (error || !v) { setNotFound(true); }
      else { setVendor(v); setMenu(m); }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
          <h2 className="font-bold text-xl text-gray-900">Spot not found</h2>
          <p className="text-gray-500 text-sm">This food spot may have been removed or doesn't exist.</p>
          <Link to="/" className="text-brand-600 font-semibold hover:underline text-sm">Back to home</Link>
        </div>
      </div>
    );
  }

  const open = isOpenNow(vendor);

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg))' }}>
      <Header />

      {/* Cover photo */}
      <div className="relative h-40 sm:h-52 md:h-72 bg-orange-50 overflow-hidden">
        {vendor.cover_photo_url ? (
          <img
            src={vendor.cover_photo_url}
            alt={vendor.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="h-16 w-16 text-gray-300" />
          </div>
        )}
        {/* Back button overlay */}
        <Link
          to={-1}
          className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-white transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        {/* Vendor header */}
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow-md p-4 sm:p-5 -mt-6 sm:-mt-8 relative z-10 mb-6">
          <div className="flex items-start justify-between gap-2 sm:gap-3 flex-col sm:flex-row">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">{vendor.business_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={vendor.category === 'restaurant' ? 'brand' : 'yellow'}>
                  {vendor.category === 'restaurant' ? '🍽️ Restaurant' : '🥘 Roadside'}
                </Badge>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${open ? 'badge-open' : 'badge-closed'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-green-500' : 'bg-red-400'}`} />
                  {open ? 'Open now' : 'Closed'}
                </span>
              </div>
            </div>

            {/* Rating */}
            {vendor.rating_count > 0 && (
              <div className="flex flex-col items-center shrink-0 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-gray-900">{Number(vendor.rating_avg).toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-400">{vendor.rating_count} review{vendor.rating_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {vendor.description && (
            <p className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed">{vendor.description}</p>
          )}

          {/* Meta info */}
          <div className="mt-4 space-y-2">
            {vendor.address && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                <span>{vendor.address}</span>
              </div>
            )}
            {vendor.opening_time && vendor.closing_time && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  {formatTime(vendor.opening_time)} – {formatTime(vendor.closing_time)}
                  {vendor.days_open?.length > 0 && (
                    <span className="text-gray-400"> · {formatDays(vendor.days_open)}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contact & Directions */}
        <div className="mb-8">
          <ContactButtons
            phone={vendor.phone}
            whatsapp={vendor.whatsapp}
            lat={vendor.latitude}
            lng={vendor.longitude}
          />
        </div>

        {/* Gallery (if vendor has uploaded photos) */}
        {vendor.gallery_urls?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Photos</h2>
            <div className="grid grid-cols-3 gap-2">
              {vendor.gallery_urls.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="mb-8">
          <MenuSection items={menu} vendorType={vendor.category} />
        </div>

        {/* Reviews */}
        <ReviewSection vendorId={vendor.id} />
      </div>
    </div>
  );
}
