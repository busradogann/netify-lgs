-- Schools table
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('fen', 'anadolu', 'sosyal', 'imam_hatip', 'meslek')),
  city text not null,
  district text not null,
  created_at timestamptz default now()
);

-- Placement scores (yearly data per school)
create table public.placement_scores (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  year int not null,
  quota int,
  placed int,
  min_score numeric(6,2),
  min_ranking int,
  max_ranking int,
  created_at timestamptz default now(),
  unique (school_id, year)
);

-- User profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'ogrenci' check (role in ('ogrenci', 'ebeveyn')),
  target_ranking int,
  created_at timestamptz default now()
);

-- Favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, school_id)
);

-- Score history
create table public.score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  turkce int not null default 0,
  matematik int not null default 0,
  fen int not null default 0,
  inkilap int not null default 0,
  din int not null default 0,
  yabanci_dil int not null default 0,
  total_net numeric(5,2) not null default 0,
  estimated_score numeric(6,2),
  estimated_ranking int,
  created_at timestamptz default now()
);

-- Indexes
create index idx_placement_school on public.placement_scores(school_id);
create index idx_placement_year on public.placement_scores(year);
create index idx_favorites_user on public.favorites(user_id);
create index idx_score_history_user on public.score_history(user_id);

-- RLS policies
alter table public.schools enable row level security;
alter table public.placement_scores enable row level security;
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.score_history enable row level security;

-- Schools and placement_scores: everyone can read
create policy "Schools are viewable by everyone"
  on public.schools for select using (true);

create policy "Placement scores are viewable by everyone"
  on public.placement_scores for select using (true);

-- Profiles: users can read/update their own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Favorites: users can manage their own
create policy "Users can view own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- Score history: users can manage their own
create policy "Users can view own score history"
  on public.score_history for select using (auth.uid() = user_id);

create policy "Users can insert own score history"
  on public.score_history for insert with check (auth.uid() = user_id);

create policy "Users can delete own score history"
  on public.score_history for delete using (auth.uid() = user_id);
