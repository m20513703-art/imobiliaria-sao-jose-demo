-- Imobiliária São José: anúncios e solicitações de interesse com RLS.
create extension if not exists pgcrypto;

create table if not exists public.properties (
  id text primary key,
  title text not null check (char_length(title) between 1 and 100),
  kind text not null check (kind in ('Casa','Apartamento')),
  deal text not null check (deal in ('Venda','Aluguel')),
  price text not null check (char_length(price) between 1 and 40),
  rooms integer not null default 0 check (rooms between 0 and 50),
  area numeric not null default 0 check (area between 0 and 100000),
  neighborhood text not null default '' check (char_length(neighborhood) <= 100),
  city text not null default 'Divinolândia, SP' check (char_length(city) <= 100),
  photo text not null default 'casa-ficticia.webp' check (photo in ('casa-ficticia.webp','apartamento-ficticio.webp')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete set null,
  property_title text not null default 'Imóvel' check (char_length(property_title) <= 120),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 7 and 24),
  message text not null default '' check (char_length(message) <= 300),
  status text not null default 'Novo' check (status in ('Novo','Em atendimento','Concluído')),
  created_at timestamptz not null default now()
);
-- Access allowlist; leave empty until the owner separately approves an invite.
create table if not exists public.admin_users (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);
alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
create or replace function public.is_sao_jose_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;
revoke all on function public.is_sao_jose_admin() from public;
grant execute on function public.is_sao_jose_admin() to anon, authenticated;

drop policy if exists "Anyone can read active properties" on public.properties;
create policy "Anyone can read active properties" on public.properties for select to anon, authenticated using (active or public.is_sao_jose_admin());
drop policy if exists "Authenticated users manage properties" on public.properties;
create policy "Allowlisted users manage properties" on public.properties for all to authenticated using (public.is_sao_jose_admin()) with check (public.is_sao_jose_admin());
drop policy if exists "Anyone can submit leads" on public.leads;
create policy "Anyone can submit leads" on public.leads for insert to anon, authenticated with check (status = 'Novo');
drop policy if exists "Authenticated users read leads" on public.leads;
drop policy if exists "Allowlisted users read leads" on public.leads;
create policy "Allowlisted users read leads" on public.leads for select to authenticated using (public.is_sao_jose_admin());
drop policy if exists "Authenticated users update leads" on public.leads;
drop policy if exists "Allowlisted users update leads" on public.leads;
create policy "Allowlisted users update leads" on public.leads for update to authenticated using (public.is_sao_jose_admin()) with check (public.is_sao_jose_admin());

grant select on public.properties to anon, authenticated;
grant insert, update, delete on public.properties to authenticated;
grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;

insert into public.properties (id,title,kind,deal,price,rooms,area,neighborhood,city,photo,active) values
('sj-001','Casa fictícia no Centro','Casa','Venda','R$ 420.000',3,120,'Centro','Divinolândia, SP','casa-ficticia.webp',true),
('sj-002','Apartamento fictício','Apartamento','Aluguel','R$ 1.600/mês',2,78,'Jardim','Divinolândia, SP','apartamento-ficticio.webp',true),
('sj-003','Casa fictícia com varanda','Casa','Venda','R$ 510.000',3,145,'Vila Nova','Divinolândia, SP','casa-ficticia.webp',true)
on conflict (id) do nothing;

-- Add only an explicitly approved owner account's auth.users.id to admin_users.
-- Disable public sign-ups in Authentication settings before deploying production.
