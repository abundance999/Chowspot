# ChowSpot

Nigeria's hyperlocal food discovery platform. Restaurants, kiosks, and roadside spots on one map — customers find them, see menus, and get in touch directly.

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire `SUPABASE_SETUP.sql` file
3. Copy your project URL and anon key from **Settings → API**

### 3. Set up environment variables
```bash
cp .env.example .env
```
Then fill in your Supabase URL and anon key in `.env`.

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npm run build
```
Then push to GitHub and import the repo in [vercel.com](https://vercel.com). Add your environment variables in the Vercel project settings.

---

## Create your admin account
1. Sign up at `/vendor/signup` using your admin email
2. Go to Supabase → Authentication → Users, copy your user ID
3. Run this in the SQL editor:
```sql
update public.profiles set role = 'admin' where id = 'your-user-id-here';
```
4. Log in at `/vendor/login` and you'll be redirected to the admin dashboard

---

## Project structure

```
src/
├── lib/            # Supabase queries (vendors, menu, reviews, search, utils)
├── context/        # AuthContext — vendor/admin auth state
├── hooks/          # useVendor hook
├── components/
│   ├── ui/         # Button, Input, Label, Textarea, Badge, Select
│   ├── layout/     # Header
│   ├── search/     # VendorCard (search result card)
│   ├── spot/       # ContactButtons, MenuSection, ReviewSection
│   └── vendor/     # (future vendor-specific components)
└── pages/
    ├── Home.jsx            # / — hero search + how it works
    ├── SearchResults.jsx   # /search?q=... — results grid
    ├── SpotPage.jsx        # /spot/:id — public vendor profile
    ├── vendor/
    │   ├── VendorSignup.jsx
    │   ├── VendorLogin.jsx
    │   ├── VendorDashboard.jsx
    │   ├── VendorEditProfile.jsx  # also used for onboarding
    │   └── VendorMenu.jsx
    └── admin/
        └── AdminDashboard.jsx
```

---

## Adding your logo
Replace the placeholder in `Header.jsx` and `VendorSignup.jsx` / `VendorLogin.jsx`:
```jsx
// Replace this:
<div className="h-8 w-8 rounded-lg bg-brand-600 ...">
  <UtensilsCrossed ... />
</div>
<span>ChowSpot</span>

// With this:
<img src="/logo.svg" alt="ChowSpot" className="h-8" />
```
Place your logo file at `public/logo.svg` (or `.png`).

---

## Tech stack
- **React 18** + Vite
- **Supabase** — database, auth, storage
- **Tailwind CSS** — styling
- **React Router v6** — routing
- **Lucide React** — icons
- **Sonner** — toast notifications
