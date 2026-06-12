import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * ChowSpot top navigation.
 * - Shows "List your spot" for logged-out visitors
 * - Shows dashboard + logout for logged-in vendors/admins
 */
export default function Header() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          {/* Replace this div with <img src="/logo.svg" alt="ChowSpot" className="h-8" /> once logo is ready */}
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 group-hover:text-brand-600 transition-colors hidden xs:inline">
            Chow<span className="text-brand-600">Spot</span>
          </span>
        </Link>

        {/* Right side nav */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {!user ? (
            <>
              <Link to="/vendor/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Vendor login</Button>
                <Button variant="ghost" size="sm" className="sm:hidden px-2" title="Login">
                  <LogOut className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/vendor/signup">
                <Button variant="primary" size="sm" className="text-xs sm:text-sm px-3 sm:px-4">List spot</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to={role === 'admin' ? '/admin' : '/vendor/dashboard'}>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" className="sm:hidden" title="Dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleSignOut} className="hidden sm:inline-flex text-xs sm:text-sm">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSignOut} className="sm:hidden" title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </nav>

      </div>
    </header>
  );
}
