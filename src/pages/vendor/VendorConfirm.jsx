import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function VendorConfirm() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/vendor/profile', { replace: true });
      } else {
        navigate('/vendor/login', { replace: true });
      }
    }
  }, [loading, user, navigate]);

  return null;
}
