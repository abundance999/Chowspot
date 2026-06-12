import { supabase } from './supabase';

const MENU_PHOTO_BUCKET = 'menu-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ── Menu items ─────────────────────────────────────────────────────────────

/**
 * Get all menu items for a vendor, including their sizes (for roadside vendors).
 * @param {string} vendorId
 * @returns {Promise<{data: object[], error: object|null}>}
 */
export async function getMenuByVendor(vendorId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, sizes:menu_item_sizes(*)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: true });
  return { data: data ?? [], error };
}

/**
 * Create a menu item.
 * - For restaurants: include `price` in fields, leave sizes empty.
 * - For roadside: leave `price` as null, pass sizes array separately.
 * @param {string}   vendorId
 * @param {object}   fields   - name, description, price (or null), photo_url, is_available
 * @param {object[]} sizes    - [{ label, price, is_available }] for roadside
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createMenuItem(vendorId, fields, sizes = []) {
  const { data: item, error: itemErr } = await supabase
    .from('menu_items')
    .insert([{ vendor_id: vendorId, ...fields }])
    .select()
    .single();

  if (itemErr || !item) return { data: null, error: itemErr };

  // Insert sizes if provided (roadside vendors)
  if (sizes.length > 0) {
    const sizeRows = sizes.map((s) => ({ menu_item_id: item.id, ...s }));
    const { error: sizeErr } = await supabase.from('menu_item_sizes').insert(sizeRows);
    if (sizeErr) return { data: item, error: sizeErr };
  }

  return { data: item, error: null };
}

/**
 * Update a menu item's fields (name, description, price, photo_url).
 * Does NOT update sizes — use updateMenuItemSizes for that.
 * @param {string} itemId
 * @param {object} fields
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateMenuItem(itemId, fields) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();
  return { data, error };
}

/**
 * Toggle a menu item available / unavailable.
 * @param {string}  itemId
 * @param {boolean} isAvailable
 * @returns {Promise<{error: object|null}>}
 */
export async function toggleItemAvailability(itemId, isAvailable) {
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', itemId);
  return { error };
}

/**
 * Delete a menu item (cascades to its sizes).
 * @param {string} itemId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteMenuItem(itemId) {
  const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
  return { error };
}

// ── Sizes (roadside vendors only) ──────────────────────────────────────────

/**
 * Add a new size option to an existing roadside menu item.
 * @param {string} itemId
 * @param {object} size   - { label, price, is_available }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function addMenuItemSize(itemId, size) {
  const { data, error } = await supabase
    .from('menu_item_sizes')
    .insert([{ menu_item_id: itemId, ...size }])
    .select()
    .single();
  return { data, error };
}

/**
 * Update a size option (label, price, or availability).
 * @param {string} sizeId
 * @param {object} fields
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateMenuItemSize(sizeId, fields) {
  const { data, error } = await supabase
    .from('menu_item_sizes')
    .update(fields)
    .eq('id', sizeId)
    .select()
    .single();
  return { data, error };
}

/**
 * Delete a size option.
 * @param {string} sizeId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteMenuItemSize(sizeId) {
  const { error } = await supabase.from('menu_item_sizes').delete().eq('id', sizeId);
  return { error };
}

// ── Photo upload ───────────────────────────────────────────────────────────

/**
 * Upload a menu item photo and return the public URL.
 * @param {string} vendorId
 * @param {File}   file
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
export async function uploadMenuPhoto(vendorId, file) {
  if (!file) return { url: null, error: new Error('No file provided') };
  if (file.size > MAX_FILE_SIZE)
    return { url: null, error: new Error('Image must be under 5 MB.') };
  if (!file.type.startsWith('image/'))
    return { url: null, error: new Error('Please upload an image file.') };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${vendorId}/item-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MENU_PHOTO_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (uploadError) return { url: null, error: uploadError };
  const { data } = supabase.storage.from(MENU_PHOTO_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
