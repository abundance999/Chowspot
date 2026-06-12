import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VendorSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);

    // Sign up with Supabase Auth
    const { error } = await supabase.auth.signUp({
      email:    form.email.trim(),
      password: form.password,
      options: {
        // Store the role in the user's metadata so our DB trigger can pick it up
        data: { role: 'vendor' },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Account created, go directly to profile setup
    toast.success('Account created! Now set up your business profile.');
    navigate('/vendor/profile', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12" style={{ background: 'rgb(var(--bg))' }}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6 sm:mb-8">
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <UtensilsCrossed className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
        </div>
        <span className="font-extrabold text-lg sm:text-xl text-gray-900">
          Chow<span className="text-brand-600">Spot</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">List your food spot</h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">Create a free vendor account to get started.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
            />
          </div>

          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={set('confirm')}
            />
          </div>

          <Button type="submit" className="w-full h-12 sm:h-11" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/vendor/login" className="text-brand-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
