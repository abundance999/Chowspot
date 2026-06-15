import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ── Tailwind class helper ──────────────────────────────────────────────────

/**
 * Merge Tailwind classes safely, resolving conflicts.
 * Use this instead of template literals for conditional classes.
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── Currency formatting ────────────────────────────────────────────────────

/**
 * Format a number as Nigerian Naira.
 * @param {number} amount
 * @returns {string}  e.g. "₦1,500"
 */
export function formatNaira(amount) {
  if (amount === null || amount === undefined) return '—';
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

/**
 * Get the display price for a menu item.
 * - Restaurant items: shows exact price.
 * - Roadside items with sizes: shows "from ₦X" (the cheapest size).
 * @param {object} item         - menu_item row
 * @param {Array}  sizes        - menu_item_sizes rows for this item (may be empty)
 * @returns {string}
 */
export function menuItemPriceLabel(item, sizes = []) {
  if (item.price !== null && item.price !== undefined) {
    return formatNaira(item.price);
  }
  const available = sizes.filter((s) => s.is_available);
  if (available.length === 0) return '—';
  const min = Math.min(...available.map((s) => Number(s.price)));
  return `from ${formatNaira(min)}`;
}

// ── Time & open/closed logic ───────────────────────────────────────────────

const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Check if a vendor is open right now based on their stored hours.
 * @param {object} vendor  - must have opening_time, closing_time, days_open
 * @returns {boolean}
 */
export function isOpenNow(vendor) {
  if (!vendor?.opening_time || !vendor?.closing_time || !vendor?.days_open) return false;

  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sunday
  if (!vendor.days_open.includes(todayIndex)) return false;

  const [openH, openM]  = vendor.opening_time.split(':').map(Number);
  const [closeH, closeM] = vendor.closing_time.split(':').map(Number);

  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const openMins  = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  // Handle overnight hours (e.g. 10:00 PM – 02:00 AM)
  if (closeMins < openMins) {
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

/**
 * Format a 24h time string (HH:MM) to 12h display (e.g. "9:00 AM").
 * @param {string} time24  e.g. "09:00"
 * @returns {string}
 */
export function formatTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ── Days of week ───────────────────────────────────────────────────────────

export const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

/**
 * Convert an array of day indices to a human-readable string.
 * @param {number[]} days  e.g. [1,2,3,4,5]
 * @returns {string}       e.g. "Mon – Fri"
 */
export function formatDays(days) {
  if (!days || days.length === 0) return 'No days set';
  if (days.length === 7) return 'Every day';
  // Show abbreviated names
  const names = DAYS.filter((d) => days.includes(d.value)).map((d) => d.label);
  return names.join(', ');
}

// ── Contact deep-links ─────────────────────────────────────────────────────

/**
 * Build a `tel:` link for calling.
 * @param {string} phone
 * @returns {string}
 */
export function telLink(phone) {
  return `tel:${phone}`;
}

/**
 * Build an `sms:` link.
 * @param {string} phone
 * @returns {string}
 */
export function smsLink(phone) {
  return `sms:${phone}`;
}

/**
 * Build a WhatsApp deep-link.
 * Strips leading 0 and prepends Nigeria country code 234.
 * @param {string} phone
 * @returns {string}
 */
export function whatsappLink(phone) {
  // Normalise number: remove spaces, dashes, brackets
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // Convert local 0XXXXXXXXXX to international 234XXXXXXXXXX
  if (cleaned.startsWith('0')) cleaned = '234' + cleaned.slice(1);
  // Remove any leading + for wa.me format
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  return `https://wa.me/${cleaned}`;
}

/**
 * Build a Google Maps directions link from the user to the vendor.
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
export function mapsLink(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// ── String helpers ─────────────────────────────────────────────────────────

/**
 * Truncate a string to maxLen chars, appending "…" if truncated.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Capitalise the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Distance & geolocation ─────────────────────────────────────────────────

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 * @param {number} lat1 - user latitude
 * @param {number} lon1 - user longitude
 * @param {number} lat2 - vendor latitude
 * @param {number} lon2 - vendor longitude
 * @returns {number} distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get user's current geolocation using Geolocation API.
 * @returns {Promise<{lat: number, lng: number}>}
 * @throws {Error} if geolocation is denied or unavailable
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        reject(new Error(`Geolocation error: ${err.message}`));
      },
      { timeout: 5000 }
    );
  });
}
