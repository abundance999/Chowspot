import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public pages
import Home          from '@/pages/Home';
import SearchResults from '@/pages/SearchResults';
import SpotPage      from '@/pages/SpotPage';
import NotFound      from '@/pages/NotFound';

// Vendor pages
import VendorSignup      from '@/pages/vendor/VendorSignup';
import VendorLogin       from '@/pages/vendor/VendorLogin';
import VendorConfirm     from '@/pages/vendor/VendorConfirm';
import VendorDashboard   from '@/pages/vendor/VendorDashboard';
import VendorEditProfile from '@/pages/vendor/VendorEditProfile';
import VendorMenu        from '@/pages/vendor/VendorMenu';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';

/**
 * Redirects already-logged-in users away from auth pages.
 */
function GuestOnly({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={role === 'admin' ? '/admin' : '/vendor/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────────────────────── */}
      <Route path="/"         element={<Home />} />
      <Route path="/search"   element={<SearchResults />} />
      <Route path="/spot/:id" element={<SpotPage />} />

      {/* ── Auth ────────────────────────────────────────────────────────── */}
      <Route path="/vendor/signup" element={<GuestOnly><VendorSignup /></GuestOnly>} />
      <Route path="/vendor/login"  element={<GuestOnly><VendorLogin /></GuestOnly>} />
      <Route path="/vendor/confirm" element={<VendorConfirm />} />

      {/* ── Vendor (requires login + vendor role) ────────────────────────── */}
      <Route
        path="/vendor/dashboard"
        element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>}
      />
      <Route
        path="/vendor/profile"
        element={<ProtectedRoute roles={['vendor']}><VendorEditProfile /></ProtectedRoute>}
      />
      <Route
        path="/vendor/menu"
        element={<ProtectedRoute roles={['vendor']}><VendorMenu /></ProtectedRoute>}
      />

      {/* ── Admin ────────────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>}
      />

      {/* ── Fallback ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
