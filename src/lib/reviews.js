import { supabase } from './supabase';

/**
 * Fetch all reviews for a vendor, newest first.
 * @param {string} vendorId
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function getReviewsByVendor(vendorId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

/**
 * Submit a new review for a vendor.
 * No authentication required — customers just enter their name.
 *
 * @param {string} vendorId
 * @param {object} review     - { reviewer_name, rating (1-5), comment }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function submitReview(vendorId, review) {
  if (!review.reviewer_name?.trim()) {
    return { data: null, error: new Error('Please enter your name.') };
  }
  if (!review.rating || review.rating < 1 || review.rating > 5) {
    return { data: null, error: new Error('Please give a star rating.') };
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert([{
      vendor_id:     vendorId,
      reviewer_name: review.reviewer_name.trim(),
      rating:        review.rating,
      comment:       review.comment?.trim() || null,
    }])
    .select()
    .single();

  // After insert, refresh the vendor's rating aggregate
  if (!error) await refreshVendorRating(vendorId);

  return { data, error };
}

/**
 * Delete a review (admin only).
 * @param {string} reviewId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteReview(reviewId) {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  return { error };
}

/**
 * Recalculate and update a vendor's average rating and review count.
 * Called automatically after every new review submission.
 * @param {string} vendorId
 */
async function refreshVendorRating(vendorId) {
  // Use Supabase aggregation to compute the new average
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('vendor_id', vendorId);

  if (!data || data.length === 0) return;

  const count = data.length;
  const avg   = data.reduce((sum, r) => sum + r.rating, 0) / count;

  await supabase
    .from('vendors')
    .update({ rating_avg: avg.toFixed(2), rating_count: count })
    .eq('id', vendorId);
}
