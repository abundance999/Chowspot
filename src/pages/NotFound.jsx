import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <UtensilsCrossed className="h-16 w-16 mb-4 text-gray-300" />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-6">This page doesn't exist — but the food does.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 transition"
      >
        Back to ChowSpot
      </Link>
    </div>
  );
}
