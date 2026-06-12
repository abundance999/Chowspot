import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Wraps a route that requires authentication.
 * Redirects unauthenticated users to the vendor login page.
 * Redirects users whose role doesn't match to the home page.
 *
 * @param {string[]} roles  - allowed roles, e.g. ['vendor'] or ['admin']
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/vendor/login" replace />;

  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
