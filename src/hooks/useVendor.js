import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyVendorProfile } from '@/lib/vendors';

/**
 * Loads the vendor profile that belongs to the currently logged-in user.
 *
 * Returns:
 *  - vendor    the vendors row, or null if not yet set up
 *  - loading   true while fetching
 *  - error     any fetch error
 *  - setVendor update local state (e.g. after the vendor edits their profile)
 *  - refresh   re-fetch the vendor from Supabase
 */
export default function useVendor() {
  const { user } = useAuth();
  const [vendor,  setVendor]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    if (!user) { setVendor(null); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await getMyVendorProfile();
    setVendor(data);
    setError(err);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  return { vendor, loading, error, setVendor, refresh: load };
}
