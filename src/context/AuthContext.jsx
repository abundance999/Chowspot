import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * AuthContext provides authentication state for VENDORS only.
 * Customers do not need to log in — they browse the site freely.
 *
 * Provides:
 *  - user         Supabase auth user (or null)
 *  - role         'vendor' | 'admin' | null
 *  - loading      true while session is being resolved
 *  - signOut()    log out the current vendor/admin
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resolve the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      else setLoading(false);
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Look up the user's role in the profiles table.
   * @param {string} userId
   */
  async function fetchRole(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setRole(data?.role ?? null);
    setLoading(false);
  }

  /** Sign out the current user */
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context anywhere in the app.
 * @returns {{ user, role, loading, signOut }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
