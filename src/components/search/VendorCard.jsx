import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isOpenNow, formatNaira, menuItemPriceLabel } from '@/lib/utils';

/**
 * Card shown on the search results page.
 * Displays vendor summary + the menu items that matched the search.
 *
 * @param {object}   vendor        - vendors row
 * @param {object[]} matchingItems - menu items that matched the search query
 */
export default function VendorCard({ vendor, matchingItems = [] }) {
  const open = isOpenNow(vendor);

  return (
    <Link
      to={`/spot/${vendor.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 card-shadow hover:card-shadow-md hover:border-brand-200 transition-all duration-200"
    >
      {/* Cover photo */}
      <div className="relative h-32 sm:h-40 md:h-48 rounded-t-2xl overflow-hidden bg-orange-50">
        {vendor.cover_photo_url ? (
          <img
            src={vendor.cover_photo_url}
            alt={vendor.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Open / closed badge — top right */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${open ? 'badge-open' : 'badge-closed'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-green-500' : 'bg-red-400'}`} />
            {open ? 'Open now' : 'Closed'}
          </span>
        </div>

        {/* Category badge — top left */}
        <div className="absolute top-3 left-3">
          <Badge variant={vendor.category === 'restaurant' ? 'brand' : 'yellow'}>
            {vendor.category === 'restaurant' ? '🍽️ Restaurant' : '🥘 Roadside'}
          </Badge>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight group-hover:text-brand-600 transition-colors">
            {vendor.business_name}
          </h3>
          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-0.5 group-hover:text-brand-600 transition-colors" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-1">
          {vendor.rating_count > 0 ? (
            <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
              <Star className="h-3.5 w-3.5 fill-current" />
              {Number(vendor.rating_avg).toFixed(1)}
              <span className="text-gray-400 font-normal">({vendor.rating_count})</span>
            </span>
          ) : (
            <span className="text-sm text-gray-400">No reviews yet</span>
          )}
        </div>

        {/* Address */}
        {vendor.address && (
          <div className="flex items-start gap-1.5 mt-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span className="text-xs text-gray-500 line-clamp-1">{vendor.address}</span>
          </div>
        )}

        {/* Matching menu items — what the customer searched for */}
        {matchingItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Matching items</p>
            <div className="space-y-1.5">
              {matchingItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                  <span className="text-sm font-bold text-brand-600">
                    {menuItemPriceLabel(item, item.sizes ?? [])}
                  </span>
                </div>
              ))}
              {matchingItems.length > 3 && (
                <p className="text-xs text-gray-400">+{matchingItems.length - 3} more items</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
