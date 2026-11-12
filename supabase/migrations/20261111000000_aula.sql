-- Loopback · esquema de la base de datos (PostgreSQL / Supabase).
-- Pégalo entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez sin romper nada.
--
-- Seguridad:
--  * Row Level Security (RLS) en todas las tablas: cada alumno solo puede leer y escribir SUS filas.
--  * Las comprobaciones de tamaño y formato (CHECK) impiden guardar basura aunque alguien llame a la API a mano.
--  * El uso del tutor solo se modifica con la función tutor_consumir (SECURITY DEFINER), que aplica el límite diario;
--    el alumno no puede ponerse a cero el contador.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- progreso por elemento (lección, cuestionario, laboratorio)
create table if not exists public.progreso (
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     text not null check (item_id ~ '^[a-z0-9:#_-]{1,80}$'),
  tipo        text not null check (tipo in ('leccion', 'quiz', 'lab', 'actividad')),
  puntos      integer check (puntos between 0 and 1000),
  total       integer check (total between 0 and 1000),
  hecho       boolean not null default false,
  datos       jsonb not null default '{}'::jsonb check (pg_column_size(datos) <= 4096),
  actualizado timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ---------------------------------------------------------------- simulacros de examen
create table if not exists public.examenes (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  puntos    integer not null check (puntos between 0 and 500),
  total     integer not null check (total between 1 and 500),
  dominios  jsonb not null default '{}'::jsonb check (pg_column_size(dominios) <= 4096),
  segundos  integer check (segundos between 0 and 36000),
  creado    timestamptz not null default now()
);
create index if not exists examenes_user_idx on public.examenes (user_id, creado);

-- ---------------------------------------------------------------- uso diario del tutor (límite de mensajes)
create table if not exists public.tutor_uso (
  user_id  uuid not null references auth.users(id) on delete cascade,
  dia      date not null default (now() at time zone 'utc')::date,
  mensajes integer not null default 0 check (mensajes >= 0),
  primary key (user_id, dia)
);

alter table public.progreso  enable row level security;
alter table public.examenes  enable row level security;
alter table public.tutor_uso enable row level security;
alter table public.progreso  force row level security;
alter table public.examenes  force row level security;
alter table public.tutor_uso force row level security;

-- Políticas: (select auth.uid()) se evalúa una vez por consulta (recomendación de rendimiento de Supabase).
drop policy if exists progreso_leer on public.progreso;
drop policy if exists progreso_insertar on public.progreso;
drop policy if exists progreso_actualizar on public.progreso;
drop policy if exists progreso_borrar on public.progreso;
create policy progreso_leer       on public.progreso for select to authenticated using (user_id = (select auth.uid()));
create policy progreso_insertar   on public.progreso for insert to authenticated with check (user_id = (select auth.uid()));
create policy progreso_actualizar on public.progreso for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy progreso_borrar     on public.progreso for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists examenes_leer on public.examenes;
drop policy if exists examenes_insertar on public.examenes;
drop policy if exists examenes_borrar on public.examenes;
create policy examenes_leer     on public.examenes for select to authenticated using (user_id = (select auth.uid()));
create policy examenes_insertar on public.examenes for insert to authenticated with check (user_id = (select auth.uid()));
create policy examenes_borrar   on public.examenes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists tutor_uso_leer on public.tutor_uso;
create policy tutor_uso_leer on public.tutor_uso for select to authenticated using (user_id = (select auth.uid()));

-- Permisos mínimos: los anónimos no tocan nada; los usuarios, solo lo que permiten las políticas.
revoke all on public.progreso, public.examenes, public.tutor_uso from anon;
revoke all on public.progreso, public.examenes, public.tutor_uso from authenticated;
grant select, insert, update, delete on public.progreso to authenticated;
grant select, insert, delete on public.examenes to authenticated;
grant select on public.tutor_uso to authenticated;

-- Límite de 200 simulacros guardados por alumno (evita llenar la base de datos desde la API).
create or replace function public.limitar_examenes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.examenes where user_id = new.user_id) >= 200 then
    raise exception 'Límite de simulacros guardados alcanzado';
  end if;
  return new;
end $$;
drop trigger if exists limitar_examenes on public.examenes;
create trigger limitar_examenes before insert on public.examenes for each row execute function public.limitar_examenes();

-- Límite de elementos de progreso por alumno.
create or replace function public.limitar_progreso() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.progreso where user_id = new.user_id) >= 1000 then
    raise exception 'Límite de elementos de progreso alcanzado';
  end if;
  return new;
end $$;
drop trigger if exists limitar_progreso on public.progreso;
create trigger limitar_progreso before insert on public.progreso for each row execute function public.limitar_progreso();

-- ---------------------------------------------------------------- consumo del tutor
-- Suma un mensaje al día de hoy del usuario que llama, si no ha llegado al límite.
-- Devuelve los mensajes que le quedan hoy, o -1 si ya no le quedan.
create or replace function public.tutor_consumir(p_limite integer default 40) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hoy date := (now() at time zone 'utc')::date;
  v_n   integer;
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if p_limite < 1 or p_limite > 500 then raise exception 'Límite no válido'; end if;
  if not public.sesion_segura() then
    raise exception 'Verifica tu segundo factor';
  end if;
  insert into public.tutor_uso (user_id, dia, mensajes) values (v_uid, v_hoy, 0)
    on conflict (user_id, dia) do nothing;
  update public.tutor_uso set mensajes = mensajes + 1
    where user_id = v_uid and dia = v_hoy and mensajes < p_limite
    returning mensajes into v_n;
  if v_n is null then return -1; end if;
  return p_limite - v_n;
end $$;
revoke all on function public.tutor_consumir(integer) from public, anon;
grant execute on function public.tutor_consumir(integer) to authenticated;

-- Devuelve un mensaje consumido si la respuesta del tutor falló (no cobrar errores al alumno).
-- Solo la llama la función del servidor (clave de servicio): un alumno no puede reponerse mensajes.
create or replace function public.tutor_devolver(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.tutor_uso set mensajes = greatest(mensajes - 1, 0)
    where user_id = p_user and dia = (now() at time zone 'utc')::date;
end $$;
revoke all on function public.tutor_devolver(uuid) from public, anon, authenticated;
grant execute on function public.tutor_devolver(uuid) to service_role;

-- Limpieza: el uso del tutor de hace más de 60 días no hace falta.
create or replace function public.tutor_limpiar() returns void
language sql security definer set search_path = '' as $$
  delete from public.tutor_uso where dia < (now() at time zone 'utc')::date - 60;
$$;
revoke all on function public.tutor_limpiar() from public, anon, authenticated;

-- ---------------------------------------------------------------- verificación en dos pasos obligatoria si está activada
-- Si un alumno activó el segundo factor (TOTP), sus datos solo son accesibles con una sesión verificada (aal2).
-- Así, alguien que robe solo la contraseña no puede leer ni modificar su progreso.
-- La comprobación vive en una función SECURITY DEFINER para no depender de permisos sobre el esquema auth.
create or replace function public.sesion_segura() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
$$;
revoke all on function public.sesion_segura() from public, anon;
grant execute on function public.sesion_segura() to authenticated;

drop policy if exists progreso_mfa on public.progreso;
drop policy if exists examenes_mfa on public.examenes;
drop policy if exists tutor_uso_mfa on public.tutor_uso;
create policy progreso_mfa  on public.progreso  as restrictive for all to authenticated using ((select public.sesion_segura())) with check ((select public.sesion_segura()));
create policy examenes_mfa  on public.examenes  as restrictive for all to authenticated using ((select public.sesion_segura())) with check ((select public.sesion_segura()));
create policy tutor_uso_mfa on public.tutor_uso as restrictive for all to authenticated using ((select public.sesion_segura()));

-- ---------------------------------------------------------------- eliminar la propia cuenta
-- Borra al usuario que llama; sus filas se borran en cascada (on delete cascade). Exige aal2 si tiene MFA.
create or replace function public.borrar_mi_cuenta() returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Sin sesión'; end if;
  if not public.sesion_segura() then
    raise exception 'Verifica tu segundo factor antes de eliminar la cuenta';
  end if;
  delete from auth.users where id = v_uid;
end $$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
