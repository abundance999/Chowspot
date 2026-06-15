import { supabase } from './supabase';
import { calculateDistance, getUserLocation } from './utils';

/**
 * Search for food spots by menu item name or vendor name.
 *
 * Flow:
 *  1. Find menu_items whose name ILIKE the query
 *  2. Collect the unique vendor IDs
 *  3. Fetch those vendors (approved only)
 *  4. Attach matching items (with sizes) to each vendor
 *  5. Sort by distance to user (if location available)
 *
 * @param {string}  query           - the search term (e.g. "beans and plantain")
 * @param {string|null} categoryFilter - 'restaurant' | 'roadside' | null
 * @returns {Promise<{data: SearchResult[], error: object|null}>}
 *
 * @typedef {object} SearchResult
 * @property {object}   vendor        - the vendors row
 * @property {object[]} matchingItems - menu items that matched, each with a `sizes` array
 */
export async function searchFoodSpots(query, categoryFilter = null) {
  const trimmed = query.trim();
  if (!trimmed) return { data: [], error: null };

  // ── Step 1: Find matching menu items ──────────────────────────────────────
  // We join to vendors inline so we can filter by is_approved and category.
  let itemQuery = supabase
    .from('menu_items')
    .select('*, sizes:menu_item_sizes(*), vendor:vendors!inner(*)')
    .ilike('name', `%${trimmed}%`)
    .eq('vendor.is_approved', true);

  if (categoryFilter) {
    itemQuery = itemQuery.eq('vendor.category', categoryFilter);
  }

  const { data: itemRows, error } = await itemQuery;
  if (error) return { data: [], error };
  if (!itemRows || itemRows.length === 0) {
    // Fallback: search by vendor name too
    return searchByVendorName(trimmed, categoryFilter);
  }

  // ── Step 2: Group items by vendor ─────────────────────────────────────────
  const vendorMap = new Map();
  for (const row of itemRows) {
    const { vendor, ...item } = row;
    if (!vendorMap.has(vendor.id)) {
      vendorMap.set(vendor.id, { vendor, matchingItems: [] });
    }
    vendorMap.get(vendor.id).matchingItems.push(item);
  }

  let results = Array.from(vendorMap.values());

  // ── Step 3: Sort by distance if available ────────────────────────────────
  try {
    const userLoc = await getUserLocation();
    results = results.sort((a, b) => {
      const distA = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        a.vendor.latitude,
        a.vendor.longitude
      );
      const distB = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        b.vendor.latitude,
        b.vendor.longitude
      );
      return distA - distB;
    });
  } catch (e) {
    // Silently fail: geolocation unavailable or denied — keep default order
  }

  return { data: results, error: null };
}

/**
 * Fallback search — finds vendors whose business_name matches the query.
 * Used when no menu items match but a vendor name might.
 * Sorts by distance if user location is available.
 * @param {string}      query
 * @param {string|null} categoryFilter
 * @returns {Promise<{data: SearchResult[], error: object|null}>}
 */
async function searchByVendorName(query, categoryFilter) {
  let q = supabase
    .from('vendors')
    .select('*')
    .ilike('business_name', `%${query}%`)
    .eq('is_approved', true);

  if (categoryFilter) q = q.eq('category', categoryFilter);

  const { data: vendors, error } = await q;
  if (error || !vendors) return { data: [], error };

  let results = vendors.map((vendor) => ({ vendor, matchingItems: [] }));

  // Sort by distance if available
  try {
    const userLoc = await getUserLocation();
    results = results.sort((a, b) => {
      const distA = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        a.vendor.latitude,
        a.vendor.longitude
      );
      const distB = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        b.vendor.latitude,
        b.vendor.longitude
      );
      return distA - distB;
    });
  } catch (e) {
    // Silently fail — keep default order
  }

  return { data: results, error: null };
}

/**
 * Get all approved vendors (used for browsing without a search query).
 * Sorts by distance to user if location available, then by rating.
 * @param {string|null} categoryFilter
 * @returns {Promise<{data: SearchResult[], error: object|null}>}
 */
export async function getAllFoodSpots(categoryFilter = null) {
  let q = supabase
    .from('vendors')
    .select('*')
    .eq('is_approved', true)
    .order('rating_avg', { ascending: false });

  if (categoryFilter) q = q.eq('category', categoryFilter);

  const { data, error } = await q;
  if (error) return { data: [], error };

  let results = (data ?? []).map((vendor) => ({ vendor, matchingItems: [] }));

  // Sort by distance if available
  try {
    const userLoc = await getUserLocation();
    results = results.sort((a, b) => {
      const distA = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        a.vendor.latitude,
        a.vendor.longitude
      );
      const distB = calculateDistance(
        userLoc.lat,
        userLoc.lng,
        b.vendor.latitude,
        b.vendor.longitude
      );
      return distA - distB;
    });
  } catch (e) {
    // Silently fail — keep rating-based order
  }

  return { data: results, error };
}
