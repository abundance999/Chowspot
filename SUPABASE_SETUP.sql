-- ════════════════════════════════════════════════════════════════════════════
-- ChowSpot — Supabase SQL Setup
-- Run the entire file in your Supabase SQL editor (in order).
-- ════════════════════════════════════════════════════════════════════════════


-- ── 1. Profiles ─────────────────────────────────────────────────────────────
-- Extends auth.users with a role (vendor or admin).

create table public.profiles (
  id      uuid primary key references auth.users(id) on delete cascade,
  role    text not null check (role in ('vendor', 'admin')) default 'vendor',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'vendor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);


-- ── 2. Vendors ───────────────────────────────────────────────────────────────

create table public.vendors (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  business_name    text not null,
  category         text not null check (category in ('restaurant', 'roadside')),
  description      text,
  address          text,
  latitude         float8,
  longitude        float8,
  phone            text,
  whatsapp         text,
  opening_time     time,
  closing_time     time,
  days_open        int[] default '{}',
  cover_photo_url  text,
  gallery_urls     text[] default '{}',
  is_approved      boolean not null default false,
  rating_avg       numeric(3,2) not null default 0,
  rating_count     int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- RLS
alter table public.vendors enable row level security;

-- Anyone can read approved vendors (public search and profile pages)
create policy "Public can read approved vendors"
  on public.vendors for select
  using (is_approved = true);

-- Vendors can read their own row (even if pending)
create policy "Vendors can read own row"
  on public.vendors for select
  using (auth.uid() = user_id);

-- Vendors can insert their own profile
create policy "Vendors can create own profile"
  on public.vendors for insert
  with check (auth.uid() = user_id);

-- Vendors can update their own profile
create policy "Vendors can update own profile"
  on public.vendors for update
  using (auth.uid() = user_id);

-- Admins can do everything (we use service_role from admin functions,
-- but for RLS let's also allow admin role users full access)
create policy "Admins have full access to vendors"
  on public.vendors for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ── 3. Menu items ─────────────────────────────────────────────────────────

create table public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendors(id) on delete cascade,
  name         text not null,
  description  text,
  price        numeric(10,2),          -- null for roadside (uses sizes table)
  photo_url    text,
  is_available boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.menu_items enable row level security;

create policy "Public can read menu items"
  on public.menu_items for select
  using (true);

create policy "Vendors manage own menu items"
  on public.menu_items for all
  using (
    vendor_id in (select id from public.vendors where user_id = auth.uid())
  );


-- ── 4. Menu item sizes (roadside vendors only) ────────────────────────────

create table public.menu_item_sizes (
  id             uuid primary key default gen_random_uuid(),
  menu_item_id   uuid not null references public.menu_items(id) on delete cascade,
  label          text not null,         -- e.g. "Small", "Medium", "Large"
  price          numeric(10,2) not null,
  is_available   boolean not null default true
);

-- RLS
alter table public.menu_item_sizes enable row level security;

create policy "Public can read sizes"
  on public.menu_item_sizes for select
  using (true);

create policy "Vendors manage own sizes"
  on public.menu_item_sizes for all
  using (
    menu_item_id in (
      select mi.id from public.menu_items mi
      join public.vendors v on v.id = mi.vendor_id
      where v.user_id = auth.uid()
    )
  );


-- ── 5. Reviews ───────────────────────────────────────────────────────────

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references public.vendors(id) on delete cascade,
  reviewer_name  text not null,
  rating         int not null check (rating >= 1 and rating <= 5),
  comment        text,
  created_at     timestamptz not null default now()
);

-- RLS
alter table public.reviews enable row level security;

-- Anyone can read reviews
create policy "Public can read reviews"
  on public.reviews for select
  using (true);

-- Anyone can submit a review (no login required)
create policy "Anyone can submit a review"
  on public.reviews for insert
  with check (true);

-- Admins can delete reviews
create policy "Admins can delete reviews"
  on public.reviews for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ── 6. Storage buckets ────────────────────────────────────────────────────
-- Run these in Storage section OR via the Supabase dashboard.

-- Vendor cover photos
insert into storage.buckets (id, name, public) values ('vendor-covers', 'vendor-covers', true);

-- Vendor gallery photos
insert into storage.buckets (id, name, public) values ('vendor-gallery', 'vendor-gallery', true);

-- Menu item photos
insert into storage.buckets (id, name, public) values ('menu-photos', 'menu-photos', true);

-- Storage policies — allow authenticated users to upload to their own folders
create policy "Vendors upload cover photos"
  on storage.objects for insert
  with check (bucket_id = 'vendor-covers' and auth.role() = 'authenticated');

create policy "Public read vendor covers"
  on storage.objects for select
  using (bucket_id = 'vendor-covers');

create policy "Vendors upload gallery photos"
  on storage.objects for insert
  with check (bucket_id = 'vendor-gallery' and auth.role() = 'authenticated');

create policy "Public read vendor gallery"
  on storage.objects for select
  using (bucket_id = 'vendor-gallery');

create policy "Vendors upload menu photos"
  on storage.objects for insert
  with check (bucket_id = 'menu-photos' and auth.role() = 'authenticated');

create policy "Public read menu photos"
  on storage.objects for select
  using (bucket_id = 'menu-photos');


-- ── 7. Create your admin account ─────────────────────────────────────────
-- After signing up with your admin email through /vendor/signup,
-- run this query to promote yourself to admin:
--
-- update public.profiles set role = 'admin' where id = '<your-user-id>';
--
-- Find your user ID in Supabase dashboard → Authentication → Users.
