-- Admin configuration table for auth & domain settings
create table if not exists public.admin_config (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  value text not null,
  updated_at timestamp with time zone default now()
);

alter table public.admin_config enable row level security;

-- Block all public access (only service_role can access)
create policy "No public select" on public.admin_config for select using (false);
create policy "No public insert" on public.admin_config for insert with check (false);
create policy "No public update" on public.admin_config for update using (false);
create policy "No public delete" on public.admin_config for delete using (false);

-- Default admin credentials (password: admin → SHA-256 hash)
insert into public.admin_config (key, value) values
  ('admin_username', 'admin'),
  ('admin_password', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
  ('domains', '["@domain.com","@mail.test"]')
on conflict (key) do nothing;
