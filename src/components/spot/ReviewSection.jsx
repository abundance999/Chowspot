import { useEffect, useState } from 'react';
import { Star, Loader2, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getReviewsByVendor, submitReview } from '@/lib/reviews';

/**
 * Reviews section on the vendor public profile page.
 * Customers can read existing reviews and submit new ones without logging in.
 *
 * @param {string} vendorId
 */
export default function ReviewSection({ vendorId }) {
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ reviewer_name: '', rating: 0, comment: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getReviewsByVendor(vendorId);
      if (!cancelled) { setReviews(data); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [vendorId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data, error } = await submitReview(vendorId, form);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setReviews((prev) => [data, ...prev]);
    setForm({ reviewer_name: '', rating: 0, comment: '' });
    setShowForm(false);
    toast.success('Thanks for your review!');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal text-lg">({reviews.length})</span>}
        </h2>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <MessageSquarePlus className="h-4 w-4" />
            Write a review
          </Button>
        )}
      </div>

      {/* Submit review form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-5 mb-6 animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-4">Leave a review</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewer-name">Your name</Label>
              <Input
                id="reviewer-name"
                placeholder="e.g. Chidi O."
                value={form.reviewer_name}
                onChange={(e) => setForm((f) => ({ ...f, reviewer_name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Rating</Label>
              <StarPicker value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
            </div>

            <div>
              <Label htmlFor="review-comment">Comment (optional)</Label>
              <Textarea
                id="review-comment"
                rows={3}
                placeholder="What did you think? Food quality, service, value for money..."
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit review
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200">
          <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No reviews yet.</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Star picker ─────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 focus-visible:outline-none"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Single review card ───────────────────────────────────────────────────────

function ReviewCard({ review }) {
  const date = new Date(review.created_at).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return (
    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{date}</span>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
