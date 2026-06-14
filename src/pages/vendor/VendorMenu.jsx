import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Loader2, ArrowLeft,
  ToggleLeft, ToggleRight, Image as ImageIcon,
  UtensilsCrossed, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useVendor from '@/hooks/useVendor';
import {
  getMenuByVendor, createMenuItem, updateMenuItem,
  deleteMenuItem, toggleItemAvailability,
  addMenuItemSize, updateMenuItemSize, deleteMenuItemSize,
  uploadMenuPhoto,
} from '@/lib/menu';
import { formatNaira } from '@/lib/utils';

const BLANK_ITEM = { name: '', description: '', price: '', photo_url: '', is_available: true };
const BLANK_SIZE = { label: '', price: '' };

export default function VendorMenu() {
  const { vendor, loading: vendorLoading } = useVendor();
  const isRoadside = vendor?.category === 'roadside';

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(BLANK_ITEM);
  const [sizes,      setSizes]      = useState([{ ...BLANK_SIZE }]); // roadside only
  const [photoFile,  setPhotoFile]  = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const fileRef = useRef(null);

  // Which item's sizes panel is expanded (roadside)
  const [expandedId, setExpandedId] = useState(null);

  // ── Load menu ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!vendor?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await getMenuByVendor(vendor.id);
      if (cancelled) return;
      if (error) toast.error('Could not load menu.');
      else setItems(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [vendor?.id]);

  // ── Form helpers ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm(BLANK_ITEM);
    setSizes([{ ...BLANK_SIZE }]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      name:        item.name,
      description: item.description ?? '',
      price:       item.price !== null ? String(item.price) : '',
      photo_url:   item.photo_url ?? '',
      is_available: item.is_available,
    });
    setSizes(
      item.sizes?.length > 0
        ? item.sizes.map((s) => ({ id: s.id, label: s.label, price: String(s.price), is_available: s.is_available }))
        : [{ ...BLANK_SIZE }]
    );
    setPhotoFile(null);
    setPhotoPreview(item.photo_url ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // ── Size row helpers (roadside) ──────────────────────────────────────────
  function addSizeRow() {
    setSizes((prev) => [...prev, { ...BLANK_SIZE }]);
  }

  function removeSizeRow(idx) {
    setSizes((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSizeRow(idx, key, value) {
    setSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Item name is required.');

    // Validate price for restaurants
    if (!isRoadside) {
      const price = parseFloat(form.price);
      if (isNaN(price) || price < 0) return toast.error('Enter a valid price.');
    }

    // Validate sizes for roadside
    if (isRoadside) {
      const valid = sizes.filter((s) => s.label.trim() && s.price);
      if (valid.length === 0) return toast.error('Add at least one size with a price.');
    }

    setSaving(true);
    try {
      let photo_url = form.photo_url;
      if (photoFile) {
        const { url, error } = await uploadMenuPhoto(vendor.id, photoFile);
        if (error) { toast.error(error.message); return; }
        photo_url = url;
      }

      const fields = {
        name:         form.name.trim(),
        description:  form.description.trim() || null,
        price:        isRoadside ? null : parseFloat(form.price),
        photo_url:    photo_url || null,
        is_available: form.is_available,
      };

      if (editingId) {
        // Update existing item
        const { error } = await updateMenuItem(editingId, fields);
        if (error) { toast.error(error.message); return; }

        // Handle size changes for roadside
        if (isRoadside) {
          await syncSizes(editingId, sizes);
        }

        // Refresh the item in state
        const { data: refreshed } = await getMenuByVendor(vendor.id);
        setItems(refreshed);
        toast.success('Item updated.');
      } else {
        // Create new item
        const sizeRows = isRoadside
          ? sizes
            .filter((s) => s.label.trim() && s.price)
            .map((s) => ({ label: s.label.trim(), price: parseFloat(s.price), is_available: true }))
          : [];

        const { data, error } = await createMenuItem(vendor.id, fields, sizeRows);
        if (error) { toast.error(error.message); return; }
        const { data: refreshed } = await getMenuByVendor(vendor.id);
        setItems(refreshed);
        toast.success('Item added to menu.');
      }

      closeForm();
    } finally {
      setSaving(false);
    }
  }

  // Sync size rows after editing a roadside item
  async function syncSizes(itemId, formSizes) {
    for (const s of formSizes) {
      if (!s.label.trim() || !s.price) continue;
      if (s.id) {
        await updateMenuItemSize(s.id, { label: s.label.trim(), price: parseFloat(s.price) });
      } else {
        await addMenuItemSize(itemId, { label: s.label.trim(), price: parseFloat(s.price), is_available: true });
      }
    }
  }

  // ── Toggle availability ───────────────────────────────────────────────────
  async function handleToggle(item) {
    const { error } = await toggleItemAvailability(item.id, !item.is_available);
    if (error) { toast.error(error.message); return; }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.name}" from your menu?`)) return;
    const { error } = await deleteMenuItem(item.id);
    if (error) { toast.error(error.message); return; }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success('Item removed.');
  }

  // ── Delete a single size ──────────────────────────────────────────────────
  async function handleDeleteSize(itemId, sizeId) {
    const { error } = await deleteMenuItemSize(sizeId);
    if (error) { toast.error(error.message); return; }
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, sizes: i.sizes.filter((s) => s.id !== sizeId) } : i
      )
    );
    toast.success('Size removed.');
  }

  // ── Loading states ────────────────────────────────────────────────────────
  if (vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg))' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/vendor/dashboard" className="p-2 rounded-xl hover:bg-gray-100 transition">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="font-extrabold text-lg text-gray-900">Menu</h1>
            <p className="text-xs text-gray-500">
              {isRoadside ? 'Roadside — items can have multiple sizes & prices' : 'Restaurant — one price per item'}
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Add / Edit form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-5 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit item' : 'New menu item'}</h2>
              <button type="button" onClick={closeForm} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo */}
              <div className="flex items-start gap-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="h-20 w-20 shrink-0 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-brand-400 overflow-hidden transition"
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    : <ImageIcon className="h-7 w-7 text-gray-300" />
                  }
                </div>
                <div className="space-y-1">
                  <Label>Photo <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                    Choose image
                  </Button>
                  <p className="text-xs text-gray-400">Max 5 MB</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="item-name">Item name *</Label>
                <Input
                  id="item-name"
                  required
                  placeholder={isRoadside ? 'e.g. Beans and Plantain' : 'e.g. Jollof Rice'}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="item-desc">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Textarea
                  id="item-desc"
                  rows={2}
                  placeholder="Any details customers should know..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Price — restaurant only */}
              {!isRoadside && (
                <div>
                  <Label htmlFor="item-price">Price (₦) *</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 1500"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              )}

              {/* Sizes — roadside only */}
              {isRoadside && (
                <div>
                  <Label>Sizes & prices *</Label>
                  <div className="space-y-2 mt-1">
                    {sizes.map((size, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Size (e.g. Small)"
                          value={size.label}
                          onChange={(e) => updateSizeRow(idx, 'label', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="0"
                          placeholder="₦ Price"
                          value={size.price}
                          onChange={(e) => updateSizeRow(idx, 'price', e.target.value)}
                          className="w-28"
                        />
                        {sizes.length > 1 && (
                          <button type="button" onClick={() => removeSizeRow(idx)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addSizeRow}>
                      <Plus className="h-3.5 w-3.5" />
                      Add size
                    </Button>
                  </div>
                </div>
              )}

              {/* Availability toggle */}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_available: !f.is_available }))}
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                {form.is_available
                  ? <ToggleRight className="h-6 w-6 text-green-500" />
                  : <ToggleLeft className="h-6 w-6 text-gray-300" />
                }
                {form.is_available ? 'Available to customers' : 'Hidden from customers'}
              </button>

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Save changes' : 'Add to menu'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Menu list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
            <UtensilsCrossed className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 mb-1">No items yet</p>
            <p className="text-sm text-gray-400 mb-4">Add your first menu item so customers know what you serve.</p>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add first item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                isRoadside={isRoadside}
                expanded={expandedId === item.id}
                onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item)}
                onToggleAvail={() => handleToggle(item)}
                onDeleteSize={(sizeId) => handleDeleteSize(item.id, sizeId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Menu item row component ─────────────────────────────────────────────────

function MenuItemRow({ item, isRoadside, expanded, onToggleExpand, onEdit, onDelete, onToggleAvail, onDeleteSize }) {
  return (
    <div className={`bg-white rounded-2xl border card-shadow overflow-hidden transition ${!item.is_available ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 p-4">
        {/* Thumbnail */}
        <div className="h-14 w-14 shrink-0 rounded-xl bg-gray-50 overflow-hidden">
          {item.photo_url
            ? <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-gray-300" />
              </div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 truncate">{item.name}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.is_available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {item.is_available ? 'Available' : 'Hidden'}
            </span>
          </div>
          {!isRoadside && item.price !== null && (
            <p className="text-sm font-bold text-brand-600 mt-0.5">{formatNaira(item.price)}</p>
          )}
          {isRoadside && item.sizes?.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{item.sizes.length} size option{item.sizes.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isRoadside && (
            <button
              type="button"
              title="View sizes"
              onClick={onToggleExpand}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <button type="button" title="Toggle availability" onClick={onToggleAvail} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            {item.is_available
              ? <ToggleRight className="h-5 w-5 text-green-500" />
              : <ToggleLeft className="h-5 w-5 text-gray-300" />
            }
          </button>
          <button type="button" title="Edit" onClick={onEdit} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" title="Delete" onClick={onDelete} className="p-2 rounded-xl hover:bg-red-50 transition text-gray-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded sizes panel (roadside) */}
      {isRoadside && expanded && item.sizes?.length > 0 && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sizes</p>
          <div className="space-y-1.5">
            {item.sizes.map((size) => (
              <div key={size.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{size.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-600">{formatNaira(size.price)}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteSize(size.id)}
                    className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
