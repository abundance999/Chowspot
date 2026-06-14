import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import Header from '@/components/layout/Header';
import VendorCard from '@/components/search/VendorCard';
import { searchFoodSpots, getAllFoodSpots } from '@/lib/search';

const FILTERS = [
  { label: 'All spots',   value: null },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Roadside',   value: 'roadside' },
];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query    = searchParams.get('q') || '';
  const category = searchParams.get('cat') || null;

  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [inputVal, setInputVal] = useState(query);

  // Re-run search whenever query or category filter changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = query
        ? await searchFoodSpots(query, category)
        : await getAllFoodSpots(category);
      if (!cancelled) { setResults(data); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [query, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = inputVal.trim();
    if (!q) return;
    setSearchParams(category ? { q, cat: category } : { q });
  };

  const setCategory = (val) => {
    const params = {};
    if (query) params.q = query;
    if (val)   params.cat = val;
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg))' }}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Back + search bar */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-col sm:flex-row">
          <Link to="/" className="p-2 rounded-xl hover:bg-gray-100 transition shrink-0 hidden sm:block">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search for food…"
                className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
            <button
              type="submit"
              className="h-11 sm:h-12 px-4 sm:px-5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 flex-wrap overflow-x-auto pb-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" />
          {FILTERS.map((f) => (
            <button
              key={String(f.value)}
              type="button"
              onClick={() => setCategory(f.value)}
              className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition border shrink-0 ${
                category === f.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-5">
            {results.length === 0
              ? query
                ? `No food spots found for "${query}"`
                : 'No approved vendors yet.'
              : `${results.length} spot${results.length === 1 ? '' : 's'} found${query ? ` for "${query}"` : ''}`}
          </p>
        )}

        {/* Results grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : results.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {results.map(({ vendor, matchingItems }) => (
              <VendorCard key={vendor.id} vendor={vendor} matchingItems={matchingItems} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="text-center py-20">
      <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <h3 className="font-bold text-gray-900 text-lg mb-2">
        {query ? `No results for "${query}"` : 'No food spots yet'}
      </h3>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">
        {query
          ? 'Try searching for something else — like "jollof rice" or "suya".'
          : 'Check back soon — vendors are being added every day.'}
      </p>
      <Link to="/" className="inline-block mt-6 text-brand-600 font-semibold hover:underline text-sm">
        Back to home
      </Link>
    </div>
  );
}
