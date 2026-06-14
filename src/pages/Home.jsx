import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UtensilsCrossed, ArrowRight, Clipboard, MapPin } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';

// Rotating placeholder food suggestions — gives a Nigerian feel
const FOOD_SUGGESTIONS = [
  'jollof rice', 'beans and plantain', 'suya', 'fried rice',
  'egusi soup', 'pepper soup', 'puff puff', 'akara',
  'moi moi', 'bole and fish',
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery]     = useState('');
  const [placeholder, setPlaceholder] = useState(FOOD_SUGGESTIONS[0]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Rotate placeholder every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => {
        const next = (i + 1) % FOOD_SUGGESTIONS.length;
        setPlaceholder(FOOD_SUGGESTIONS[next]);
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const quickSearch = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(var(--bg))' }}>
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Subtle background accent */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07] blur-3xl" style={{ background: 'rgb(var(--brand))' }} />
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
              Nigeria's food discovery platform
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Find your next <br />
              <span className="text-brand-600">great meal</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-500 max-w-xl mx-auto px-2 sm:px-0">
              From sit-down restaurants to your favourite roadside mama put — discover food spots near you, see their menus, and get in touch.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto px-4 sm:px-0">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Try "${placeholder}"…`}
                  className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm sm:text-base shadow-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 sm:h-14 px-6 rounded-2xl shrink-0 w-full sm:w-auto">
                Search
              </Button>
            </form>

            {/* Quick searches */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['Jollof rice', 'Suya', 'Pepper soup', 'Puff puff', 'Sharwarma'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => quickSearch(term)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="bg-white border-t border-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How ChowSpot works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  icon: Search,
                  title: 'Search for food',
                  desc: 'Type what you\'re craving — jollof, beans, suya — and we\'ll show you who sells it nearby.',
                },
                {
                  icon: Clipboard,
                  title: 'See the menu & prices',
                  desc: 'Check the full menu, read reviews from other customers, and find the best deal.',
                },
                {
                  icon: MapPin,
                  title: 'Reach out directly',
                  desc: 'Call, SMS, WhatsApp the vendor or get turn-by-turn directions to their location.',
                },
              ].map((step) => (
                <div key={step.title} className="text-center">
                  <step.icon className="h-10 w-10 mx-auto mb-4 text-brand-600" aria-hidden />
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vendor CTA ────────────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto bg-brand-600 rounded-3xl p-8 sm:p-10 text-center text-white">
            <UtensilsCrossed className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Own a food spot?</h2>
            <p className="text-brand-100 mb-6 text-base">
              Get your restaurant or roadside stall on ChowSpot — completely free. Reach more customers without paying for ads.
            </p>
            <a href="/vendor/signup" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition">
              List your spot free
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} ChowSpot. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="/vendor/signup" className="hover:text-brand-600 transition">List your spot</a>
            <a href="/vendor/login" className="hover:text-brand-600 transition">Vendor login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
