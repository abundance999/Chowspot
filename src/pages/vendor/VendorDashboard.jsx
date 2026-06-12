import { Link } from 'react-router-dom';
import {
  UtensilsCrossed, CheckCircle2, Clock4, PenLine,
  ListOrdered, LogOut, Star, MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import useVendor from '@/hooks/useVendor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VendorEditProfile from './VendorEditProfile';
import { Loader2 } from 'lucide-react';

export default function VendorDashboard() {
  const { signOut } = useAuth();
  const { vendor, loading, setVendor } = useVendor();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // First-time vendor — no profile yet, show onboarding form
  if (!vendor) {
    return <VendorEditProfile onSaved={setVendor} isOnboarding />;
  }

  const approved = vendor.is_approved;

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg))' }}>
      {/* Vendor top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-gray-900">
              Chow<span className="text-brand-600">Spot</span>
            </span>
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Approval status banner */}
        {!approved ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <Clock4 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Pending approval</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Your profile is under review. Once approved, your spot will appear in search results.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">You're live on ChowSpot 🎉</p>
              <p className="text-sm text-green-700 mt-0.5">
                Customers can find and contact you.{' '}
                <Link to={`/spot/${vendor.id}`} className="underline font-semibold">
                  View your public profile →
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Profile summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden mb-6">
          {vendor.cover_photo_url && (
            <img
              src={vendor.cover_photo_url}
              alt={vendor.business_name}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{vendor.business_name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={vendor.category === 'restaurant' ? 'brand' : 'yellow'}>
                    {vendor.category === 'restaurant' ? '🍽️ Restaurant' : '🥘 Roadside'}
                  </Badge>
                  {vendor.rating_count > 0 && (
                    <span className="flex items-center gap-1 text-sm text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {Number(vendor.rating_avg).toFixed(1)}
                      <span className="text-gray-400">({vendor.rating_count})</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {vendor.address && (
              <div className="flex items-start gap-1.5 mt-3 text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                {vendor.address}
              </div>
            )}
          </div>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            to="/vendor/profile"
            icon={<PenLine className="h-5 w-5 text-brand-600" />}
            title="Edit profile"
            desc="Update your business name, hours, photos, and location."
          />
          <ActionCard
            to="/vendor/menu"
            icon={<ListOrdered className="h-5 w-5 text-brand-600" />}
            title="Manage menu"
            desc="Add or edit the food items customers see on your profile."
          />
        </div>
      </main>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }) {
  return (
    <Link
      to={to}
      className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 card-shadow p-5 hover:border-brand-200 hover:card-shadow-md transition group"
    >
      <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold text-gray-900 group-hover:text-brand-600 transition">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
