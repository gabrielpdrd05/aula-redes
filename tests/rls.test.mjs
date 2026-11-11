// La migración se ejecuta en un PostgreSQL real (PGlite) con un esquema "auth" mínimo que imita a Supabase,
// y se comprueba que un alumno no puede ver ni tocar los datos de otro, que los anónimos no ven nada,
// que el límite del tutor no se puede saltar y que la verificación en dos pasos se exige cuando está activada.
// Requiere: npm install (dependencia de desarrollo @electric-sql/pglite).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

let PGlite;
try { ({ PGlite } = await import('@electric-sql/pglite')); } catch { /* sin dependencia: se omite */ }
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
let db;

const STUB = `
create schema auth;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create table auth.users (id uuid primary key, email text);
create table auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, status text);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub', '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
insert into auth.users values ('${A}', 'a@x.test'), ('${B}', 'b@x.test');
`;

async function como(rol, sub, aal = 'aal1') {
  await db.exec(`reset role; select set_config('request.jwt.claims', '${sub ? JSON.stringify({ sub, aal, role: rol }) : ''}', false); set role ${rol};`);
}
const filas = async q => (await db.query(q)).rows;
const falla = async (q, re) => { await assert.rejects(db.query(q), re); };

before(async () => {
  if (!PGlite) return;
  db = new PGlite();
  const sql = (await readFile(new URL('../supabase/migrations/20261111000000_aula.sql', import.meta.url), 'utf8')).replace(/create extension[^;]*;/, '');
  await db.exec(STUB);
  await db.exec(sql);
  await db.exec(sql); // se puede ejecutar dos veces
});

test('RLS y permisos de la base de datos', { skip: !PGlite && 'falta @electric-sql/pglite (npm install)' }, async t => {
  await t.test('cada alumno solo ve y modifica lo suyo', async () => {
    await como('authenticated', A);
    await db.query(`insert into public.progreso (user_id, item_id, tipo, hecho) values ('${A}', 'leccion:m1-osi', 'leccion', true)`);
    await falla(`insert into public.progreso (user_id, item_id, tipo) values ('${B}', 'leccion:m1-osi', 'leccion')`, /row-level security/);
    await como('authenticated', B);
    assert.equal((await filas('select * from public.progreso')).length, 0);
    const r = await db.query(`update public.progreso set hecho = false where user_id = '${A}'`);
    assert.equal(r.affectedRows, 0);
    await db.query(`delete from public.progreso where user_id = '${A}'`);
    await como('authenticated', A);
    assert.equal((await filas('select * from public.progreso')).length, 1);
  });

  await t.test('los anónimos no pueden leer nada', async () => {
    await como('anon', null);
    await falla('select * from public.progreso', /permission denied/);
    await falla('select * from public.examenes', /permission denied/);
    await falla('select public.tutor_consumir(40)', /permission denied/);
  });

  await t.test('formato de los datos validado por CHECK', async () => {
    await como('authenticated', A);
    await falla(`insert into public.progreso (user_id, item_id, tipo) values ('${A}', '<script>', 'leccion')`, /check/);
    await falla(`insert into public.progreso (user_id, item_id, tipo) values ('${A}', 'x', 'admin')`, /check/);
    await falla(`insert into public.examenes (user_id, puntos, total) values ('${A}', 900, 100)`, /check/);
  });

  await t.test('el límite diario del tutor no se puede saltar', async () => {
    await como('authenticated', A);
    assert.equal((await filas('select public.tutor_consumir(3) as n'))[0].n, 2);
    await filas('select public.tutor_consumir(3)'); await filas('select public.tutor_consumir(3)');
    assert.equal((await filas('select public.tutor_consumir(3) as n'))[0].n, -1);
    await falla(`update public.tutor_uso set mensajes = 0`, /permission denied/);
    await falla(`select public.tutor_devolver('${A}')`, /permission denied/);
    await como('service_role', null);
    await db.query(`select public.tutor_devolver('${A}')`);
    await como('authenticated', A);
    assert.equal((await filas('select public.tutor_consumir(3) as n'))[0].n, 0);
  });

  await t.test('con MFA activado hace falta una sesión aal2', async () => {
    await db.exec(`reset role; insert into auth.mfa_factors (user_id, status) values ('${A}', 'verified');`);
    await como('authenticated', A, 'aal1');
    assert.equal((await filas('select * from public.progreso')).length, 0);
    await falla('select public.tutor_consumir(40)', /segundo factor/);
    await como('authenticated', A, 'aal2');
    assert.equal((await filas('select * from public.progreso')).length, 1);
  });

  await t.test('borrar la propia cuenta elimina sus datos en cascada', async () => {
    await como('authenticated', B);
    await db.query(`insert into public.examenes (user_id, puntos, total) values ('${B}', 80, 100)`);
    await db.query('select public.borrar_mi_cuenta()');
    await db.exec('reset role');
    assert.equal((await filas(`select * from auth.users where id = '${B}'`)).length, 0);
    assert.equal((await filas(`select * from public.examenes where user_id = '${B}'`)).length, 0);
    assert.equal((await filas(`select * from auth.users where id = '${A}'`)).length, 1);
  });
});
