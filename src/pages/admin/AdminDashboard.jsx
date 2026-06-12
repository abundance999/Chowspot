import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Loader2, LogOut,
  UtensilsCrossed, Star, Trash2, ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllVendors, setVendorApproval } from '@/lib/vendors';
import { getReviewsByVendor, deleteReview } from '@/lib/reviews';

const TABS = ['Pending', 'Approved', 'All'];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate    = useNavigate();

  const [vendors,   setVendors]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('Pending');
  const [reviewVendorId, setReviewVendorId] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await getAllVendors();
    if (error) toast.error('Could not load vendors.');
    else setVendors(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleApproval = async (vendorId, approved) => {
    const { error } = await setVendorApproval(vendorId, approved);
    if (error) { toast.error(error.message); return; }
    setVendors((prev) =>
      prev.map((v) => v.id === vendorId ? { ...v, is_approved: approved } : v)
    );
    toast.success(approved ? 'Vendor approved and now live.' : 'Vendor rejected.');
  };

  const filteredVendors = vendors.filter((v) => {
    if (tab === 'Pending')  return !v.is_approved;
    if (tab === 'Approved') return  v.is_approved;
    return true;
  });

  const pendingCount  = vendors.filter((v) => !v.is_approved).length;
  const approvedCount = vendors.filter((v) =>  v.is_approved).length;

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg))' }}>
      {/* Admin header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-gray-900">
              Chow<span className="text-brand-600">Spot</span>
              <span className="ml-2 text-xs font-semibold text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-500 hover:text-brand-600 transition">
              View site
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total vendors"   value={vendors.length}  />
          <StatCard label="Pending review"  value={pendingCount}    highlight={pendingCount > 0} />
          <StatCard label="Live on ChowSpot" value={approvedCount} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
              {t === 'Pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={load}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition ml-1"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Vendor list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">No vendors in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVendors.map((vendor) => (
              <VendorRow
                key={vendor.id}
                vendor={vendor}
                onApprove={() => handleApproval(vendor.id, true)}
                onReject={()  => handleApproval(vendor.id, false)}
                onViewReviews={() => setReviewVendorId(reviewVendorId === vendor.id ? null : vendor.id)}
                reviewsOpen={reviewVendorId === vendor.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Reviews panel — shown below selected vendor */}
      {reviewVendorId && (
        <ReviewsPanel
          vendorId={reviewVendorId}
          onClose={() => setReviewVendorId(null)}
        />
      )}
    </div>
  );
}

// ── Vendor row ──────────────────────────────────────────────────────────────

function VendorRow({ vendor, onApprove, onReject, onViewReviews, reviewsOpen }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* Cover photo */}
        <div className="h-14 w-14 shrink-0 rounded-xl bg-orange-50 overflow-hidden">
          {vendor.cover_photo_url
            ? <img src={vendor.cover_photo_url} alt={vendor.business_name} className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center">🍽️</div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 truncate">{vendor.business_name}</p>
            <Badge variant={vendor.is_approved ? 'green' : 'yellow'}>
              {vendor.is_approved ? 'Live' : 'Pending'}
            </Badge>
            <Badge variant={vendor.category === 'restaurant' ? 'brand' : 'default'}>
              {vendor.category === 'restaurant' ? '🍽️ Restaurant' : '🥘 Roadside'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{vendor.phone}</p>
          {vendor.address && (
            <p className="text-xs text-gray-400 truncate">{vendor.address}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {vendor.is_approved ? (
            <Button variant="secondary" size="sm" onClick={onReject}>
              <XCircle className="h-4 w-4 text-red-500" />
              Remove
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onApprove}>
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewReviews}
            className={reviewsOpen ? 'bg-gray-100' : ''}
          >
            <Star className="h-4 w-4" />
            Reviews
            {vendor.rating_count > 0 && (
              <span className="ml-1 text-xs text-gray-400">({vendor.rating_count})</span>
            )}
          </Button>
          {vendor.is_approved && (
            <Link to={`/spot/${vendor.id}`} target="_blank" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reviews panel ───────────────────────────────────────────────────────────

function ReviewsPanel({ vendorId, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await getReviewsByVendor(vendorId);
      setReviews(data);
      setLoading(false);
    })();
  }, [vendorId]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    const { error } = await deleteReview(reviewId);
    if (error) { toast.error(error.message); return; }
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    toast.success('Review deleted.');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl max-h-80 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Reviews</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-700">Close</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{r.reviewer_name}</span>
                    <span className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="text-xs text-gray-500 mt-0.5">{r.comment}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }) {
  return (
    <div className={`bg-white rounded-2xl border card-shadow p-5 ${highlight ? 'border-amber-200 bg-amber-50' : 'border-gray-100'}`}>
      <p className={`text-3xl font-extrabold ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
