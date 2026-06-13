import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, MapPin, AlertTriangle, ArrowLeft,
  Camera, Check, UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  createVendorProfile, updateVendorProfile,
  uploadCoverPhoto, captureCurrentLocation,
} from '@/lib/vendors';
import useVendor from '@/hooks/useVendor';
import { DAYS } from '@/lib/utils';

/**
 * Used both for first-time onboarding (isOnboarding=true)
 * and for editing an existing profile.
 *
 * @param {function} onSaved      - called with the saved vendor object
 * @param {boolean}  isOnboarding - true when this is first-time setup
 */
export default function VendorEditProfile({ onSaved, isOnboarding = false }) {
  const navigate = useNavigate();
  const { vendor } = useVendor();
  const fileRef = useRef(null);

  const existing = vendor ?? {};
  const [form, setForm] = useState({
    business_name: existing.business_name ?? '',
    category:      existing.category      ?? 'restaurant',
    description:   existing.description   ?? '',
    address:       existing.address       ?? '',
    phone:         existing.phone         ?? '',
    whatsapp:      existing.whatsapp      ?? '',
    opening_time:  existing.opening_time  ?? '08:00',
    closing_time:  existing.closing_time  ?? '20:00',
    days_open:     existing.days_open     ?? [1,2,3,4,5],
    latitude:      existing.latitude      ?? null,
    longitude:     existing.longitude     ?? null,
    cover_photo_url: existing.cover_photo_url ?? '',
  });

  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(existing.cover_photo_url ?? null);
  const [locating,     setLocating]     = useState(false);
  const [locationSet,  setLocationSet]  = useState(Boolean(existing.latitude));
  const [saving,       setSaving]       = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function toggleDay(dayValue) {
    setForm((f) => ({
      ...f,
      days_open: f.days_open.includes(dayValue)
        ? f.days_open.filter((d) => d !== dayValue)
        : [...f.days_open, dayValue],
    }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleCaptureLocation() {
    setLocating(true);
    try {
      const { lat, lng } = await captureCurrentLocation();
      setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
      setLocationSet(true);
      toast.success('Location captured successfully.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.business_name.trim()) return toast.error('Business name is required.');
    if (!form.phone.trim())         return toast.error('Phone number is required.');
    if (!locationSet)                return toast.error('Please capture your business location.');

    setSaving(true);

    try {
      let cover_photo_url = form.cover_photo_url;

      // Upload new cover photo if selected
      if (photoFile) {
        const vendorId = vendor?.id ?? 'new';
        const { url, error: photoErr } = await uploadCoverPhoto(vendorId, photoFile);
        if (photoErr) { toast.error(photoErr.message); return; }
        cover_photo_url = url;
      }

      const payload = { ...form, cover_photo_url };

      let result;
      if (vendor?.id) {
        result = await updateVendorProfile(vendor.id, payload);
      } else {
        result = await createVendorProfile(payload);
      }

      if (result.error) { toast.error(result.error.message); return; }

      toast.success(isOnboarding ? 'Profile created! Awaiting approval.' : 'Profile updated.');
      onSaved?.(result.data);
      if (!isOnboarding) navigate('/vendor/dashboard');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg))' }}>
      {/* Mini header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          {!isOnboarding ? (
            <Link to="/vendor/dashboard" className="p-2 rounded-xl hover:bg-gray-100 transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
          ) : (
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          <h1 className="font-extrabold text-lg text-gray-900">
            {isOnboarding ? 'Set up your spot' : 'Edit profile'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {isOnboarding && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-brand-700">
              Welcome! Fill in your business details below. Once submitted, ChowSpot will review and approve your listing before it goes live.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Cover photo */}
          <div>
            <Label>Cover photo</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative h-40 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-brand-400 transition group"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Click to upload cover photo</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <p className="text-xs text-gray-400 mt-1">Max 5 MB. JPG, PNG, or WebP.</p>
          </div>

          {/* Business name */}
          <div>
            <Label htmlFor="business-name">Business name *</Label>
            <Input
              id="business-name"
              required
              placeholder="e.g. Mama Ngozi's Kitchen"
              value={form.business_name}
              onChange={set('business_name')}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Type of spot *</Label>
            <Select id="category" value={form.category} onChange={set('category')}>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="roadside">🥘 Roadside / Kiosk / Mama Put</option>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Short description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="What do you serve? What makes your spot special?"
              value={form.description}
              onChange={set('description')}
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone number *</Label>
            <Input
              id="phone"
              type="tel"
              required
              placeholder="e.g. 08012345678"
              value={form.phone}
              onChange={set('phone')}
            />
          </div>

          {/* WhatsApp */}
          <div>
            <Label htmlFor="whatsapp">WhatsApp number <span className="text-gray-400 font-normal">(if different from phone)</span></Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="Leave blank to use phone number"
              value={form.whatsapp}
              onChange={set('whatsapp')}
            />
          </div>

          {/* Opening hours */}
          <div>
            <Label>Opening hours</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="opening-time" className="text-xs text-gray-500 font-medium">Opens</Label>
                <Input id="opening-time" type="time" value={form.opening_time} onChange={set('opening_time')} />
              </div>
              <div>
                <Label htmlFor="closing-time" className="text-xs text-gray-500 font-medium">Closes</Label>
                <Input id="closing-time" type="time" value={form.closing_time} onChange={set('closing_time')} />
              </div>
            </div>
          </div>

          {/* Days open */}
          <div>
            <Label>Days open</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition border ${
                    form.days_open.includes(day.value)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address (readable) */}
          <div>
            <Label htmlFor="address">Address / landmark</Label>
            <Input
              id="address"
              placeholder="e.g. 12 Market Road, beside Zenith Bank, Awka"
              value={form.address}
              onChange={set('address')}
            />
            <p className="text-xs text-gray-400 mt-1">This is what customers will read on your profile.</p>
          </div>

          {/* Location capture */}
          <div>
            <Label>Business location (GPS) *</Label>

            {/* IMPORTANT notice */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Before capturing your location, make sure you are physically at your business address. This pin is what customers use to get directions to you.
              </p>
            </div>

            {locationSet ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <Check className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">Location captured</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCaptureLocation}
                  disabled={locating}
                >
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Re-capture'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleCaptureLocation}
                  disabled={locating}
                >
                  {locating
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Detecting location…</>
                    : <><MapPin className="h-4 w-4" /> Capture my location</>
                  }
                </Button>

                {/* Manual entry fallback for development/desktop testing */}
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-600">Or enter coordinates manually (for testing)</summary>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Latitude"
                      step="0.00001"
                      value={form.latitude || ''}
                      onChange={(e) => setForm((f) => ({ ...f, latitude: parseFloat(e.target.value) || null }))}
                    />
                    <Input
                      type="number"
                      placeholder="Longitude"
                      step="0.00001"
                      value={form.longitude || ''}
                      onChange={(e) => setForm((f) => ({ ...f, longitude: parseFloat(e.target.value) || null }))}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      if (form.latitude && form.longitude) {
                        setLocationSet(true);
                        toast.success('Location set manually.');
                      } else {
                        toast.error('Please enter both latitude and longitude.');
                      }
                    }}
                  >
                    Set location
                  </Button>
                </details>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full h-11" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isOnboarding ? 'Submit for review' : 'Save changes'}
          </Button>

        </form>
      </main>
    </div>
  );
}
