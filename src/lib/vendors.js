import { supabase } from './supabase';

// ── Storage buckets ────────────────────────────────────────────────────────
const COVER_BUCKET   = 'vendor-covers';
const GALLERY_BUCKET = 'vendor-gallery';
const MAX_FILE_SIZE  = 5 * 1024 * 1024; // 5 MB

// ── Read ───────────────────────────────────────────────────────────────────

/**
 * Fetch a single approved vendor by ID (public access).
 * @param {string} vendorId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getVendorById(vendorId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .eq('is_approved', true)
    .single();
  return { data, error };
}

/**
 * Fetch the vendor profile that belongs to the currently logged-in user.
 * Returns null in data if the vendor hasn't set up their profile yet.
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getMyVendorProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not logged in') };

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return { data, error };
}

/**
 * Fetch all vendors for the admin panel (approved and pending).
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function getAllVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

// ── Write ──────────────────────────────────────────────────────────────────

/**
 * Create a new vendor profile for the logged-in user.
 * @param {object} fields  - vendor profile fields (excluding id, user_id)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createVendorProfile(fields) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not logged in') };

  const { data, error } = await supabase
    .from('vendors')
    .insert([{ user_id: user.id, ...fields }])
    .select()
    .single();
  return { data, error };
}

/**
 * Update the logged-in vendor's profile.
 * @param {string} vendorId
 * @param {object} fields
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateVendorProfile(vendorId, fields) {
  const { data, error } = await supabase
    .from('vendors')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', vendorId)
    .select()
    .single();
  return { data, error };
}

// ── Admin ──────────────────────────────────────────────────────────────────

/**
 * Approve or reject a vendor application.
 * @param {string}  vendorId
 * @param {boolean} approved
 * @returns {Promise<{error: object|null}>}
 */
export async function setVendorApproval(vendorId, approved) {
  const { error } = await supabase
    .from('vendors')
    .update({ is_approved: approved, updated_at: new Date().toISOString() })
    .eq('id', vendorId);
  return { error };
}

// ── Photo upload ───────────────────────────────────────────────────────────

/**
 * Upload a vendor cover photo and return the public URL.
 * @param {string} vendorId
 * @param {File}   file
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
export async function uploadCoverPhoto(vendorId, file) {
  return uploadToStorage(COVER_BUCKET, `${vendorId}/cover-${Date.now()}`, file);
}

/**
 * Upload a gallery photo for a vendor and return the public URL.
 * @param {string} vendorId
 * @param {File}   file
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
export async function uploadGalleryPhoto(vendorId, file) {
  return uploadToStorage(GALLERY_BUCKET, `${vendorId}/${Date.now()}`, file);
}

/**
 * Internal helper — uploads a file to a Supabase storage bucket.
 * @param {string} bucket
 * @param {string} path
 * @param {File}   file
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
async function uploadToStorage(bucket, path, file) {
  if (!file) return { url: null, error: new Error('No file provided') };
  if (file.size > MAX_FILE_SIZE)
    return { url: null, error: new Error('Image must be under 5 MB.') };
  if (!file.type.startsWith('image/'))
    return { url: null, error: new Error('Please upload an image file.') };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const fullPath = `${path}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  return { url: data.publicUrl, error: null };
}

// ── Location capture ───────────────────────────────────────────────────────

/**
 * Get the device's current GPS coordinates.
 * Used during vendor onboarding to pin their business location.
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function captureCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const messages = {
          1: 'Location access was denied. Please allow location access and try again.',
          2: 'Could not detect your location. Make sure you have a GPS signal.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(messages[err.code] || 'Unknown location error.'));
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  });
}
