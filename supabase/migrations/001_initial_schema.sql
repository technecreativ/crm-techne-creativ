-- ============================================================
-- CRM Techne Creativ — Schema inicial
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- PROFILES (extensión de auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  username text unique,
  avatar_url text,
  created_at timestamptz default now()
);

-- Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- PROSPECTOS
create table if not exists public.prospectos (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null,
  contacto text,
  ciudad text,
  nicho text,
  whatsapp text,
  email text,
  website text,
  instagram text,
  score int default 0,
  stage text default 'Nuevo',
  problemas_detectados text,
  notas text,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CLIENTES
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  prospecto_id uuid references public.prospectos(id),
  nombre_negocio text not null,
  contacto text,
  ciudad text,
  whatsapp text,
  email text,
  servicio text,
  estado text default 'Kickoff',
  drive_folder_url text,
  notas text,
  created_at timestamptz default now()
);

-- PROYECTOS
create table if not exists public.proyectos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  nombre text not null,
  tipo text,
  descripcion text,
  estado text default 'En producción',
  fecha_inicio date,
  fecha_entrega date,
  monto_total numeric,
  moneda text default 'CLP',
  monto_cobrado numeric default 0,
  notas text,
  created_at timestamptz default now()
);

-- TAREAS
create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  tipo text default 'Tarea',
  prospecto_id uuid references public.prospectos(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  fecha_limite timestamptz,
  completada boolean default false,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- PROPUESTAS
create table if not exists public.propuestas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  prospecto_id uuid references public.prospectos(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  servicios jsonb default '[]',
  monto_total numeric,
  moneda text default 'CLP',
  estado text default 'Borrador',
  drive_url text,
  notas text,
  created_at timestamptz default now(),
  sent_at timestamptz
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Todos los usuarios autenticados tienen acceso total
-- ============================================================

alter table public.profiles enable row level security;
alter table public.prospectos enable row level security;
alter table public.clientes enable row level security;
alter table public.proyectos enable row level security;
alter table public.tareas enable row level security;
alter table public.propuestas enable row level security;

-- Profiles: cada usuario ve su propio perfil + todos autenticados ven todos
create policy "authenticated_read_profiles" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "own_profile_write" on public.profiles
  for all using (auth.uid() = id);

-- Prospectos
create policy "auth_all_prospectos" on public.prospectos
  for all using (auth.role() = 'authenticated');

-- Clientes
create policy "auth_all_clientes" on public.clientes
  for all using (auth.role() = 'authenticated');

-- Proyectos
create policy "auth_all_proyectos" on public.proyectos
  for all using (auth.role() = 'authenticated');

-- Tareas
create policy "auth_all_tareas" on public.tareas
  for all using (auth.role() = 'authenticated');

-- Propuestas
create policy "auth_all_propuestas" on public.propuestas
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_prospectos_stage on public.prospectos(stage);
create index if not exists idx_prospectos_score on public.prospectos(score desc);
create index if not exists idx_tareas_completada on public.tareas(completada, fecha_limite);
create index if not exists idx_proyectos_cliente on public.proyectos(cliente_id);
create index if not exists idx_propuestas_estado on public.propuestas(estado);
