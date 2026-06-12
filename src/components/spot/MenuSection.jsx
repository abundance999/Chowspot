import { UtensilsCrossed } from 'lucide-react';
import { formatNaira, menuItemPriceLabel } from '@/lib/utils';

/**
 * Displays the full menu on a vendor's public profile page.
 *
 * - Restaurant vendors: shows item name, description, single price.
 * - Roadside vendors: shows item name, description, and a list of
 *   size/price options (Small ₦500, Medium ₦800, Large ₦1200).
 *
 * @param {object[]} items       - menu_items rows, each with a `sizes` array
 * @param {'restaurant'|'roadside'} vendorType
 */
export default function MenuSection({ items = [], vendorType }) {
  const availableItems = items.filter((item) => item.is_available);

  if (availableItems.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200">
        <UtensilsCrossed className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Menu not available yet</p>
        <p className="text-gray-400 text-sm mt-1">Contact the vendor directly for menu details.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Menu</h2>

      <div className="space-y-3">
        {availableItems.map((item) => (
          <MenuItem key={item.id} item={item} vendorType={vendorType} />
        ))}
      </div>
    </div>
  );
}

// ── Individual menu item ───────────────────────────────────────────────────

function MenuItem({ item, vendorType }) {
  const isRoadside  = vendorType === 'roadside';
  const sizes       = (item.sizes ?? []).filter((s) => s.is_available);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4 flex gap-4">

      {/* Photo (if provided) */}
      {item.photo_url && (
        <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl overflow-hidden bg-gray-50">
          <img
            src={item.photo_url}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-gray-900">{item.name}</p>

          {/* Restaurant: single price shown top-right */}
          {!isRoadside && item.price !== null && (
            <span className="text-base font-extrabold text-brand-600 shrink-0">
              {formatNaira(item.price)}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
        )}

        {/* Roadside: size options */}
        {isRoadside && sizes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <div
                key={size.id}
                className="inline-flex flex-col items-center bg-brand-50 border border-brand-100 rounded-xl px-3 py-2 min-w-[70px]"
              >
                <span className="text-xs font-semibold text-gray-600">{size.label}</span>
                <span className="text-sm font-extrabold text-brand-600">{formatNaira(size.price)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Roadside: no sizes added yet */}
        {isRoadside && sizes.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">Contact vendor for pricing</p>
        )}
      </div>
    </div>
  );
}
