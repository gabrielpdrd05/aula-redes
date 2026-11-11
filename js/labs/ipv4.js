// Cálculos IPv4 para los entrenadores (subnetting, VLSM, wildcards). Funciones puras, sin DOM: se prueban en Node.

export function aEntero(ip) {
  const p = String(ip).trim().split('.');
  if (p.length !== 4 || !p.every(x => /^\d{1,3}$/.test(x) && Number(x) <= 255)) return null;
  return p.reduce((n, x) => n * 256 + Number(x), 0);
}
export const aTexto = n => [24, 16, 8, 0].map(s => Math.floor(n / 2 ** s) % 256).join('.');
export const mascara = prefijo => (prefijo === 0 ? 0 : (2 ** 32 - 2 ** (32 - prefijo)));
export const wildcard = prefijo => 2 ** (32 - prefijo) - 1;
export function prefijoDeMascara(m) {
  const n = typeof m === 'number' ? m : aEntero(m);
  if (n == null) return null;
  for (let p = 0; p <= 32; p++) if (mascara(p) === n) return p;
  return null;
}
export const tamano = prefijo => 2 ** (32 - prefijo);
export const red = (ip, prefijo) => ip - (ip % tamano(prefijo));
export const broadcast = (ip, prefijo) => red(ip, prefijo) + tamano(prefijo) - 1;
export function hostsUtiles(prefijo) {
  if (prefijo === 32) return 1;
  if (prefijo === 31) return 2;
  return tamano(prefijo) - 2;
}

export function calcular(ipTexto, prefijo) {
  const ip = aEntero(ipTexto);
  if (ip == null || !(prefijo >= 0 && prefijo <= 32)) return null;
  const r = red(ip, prefijo), b = broadcast(ip, prefijo);
  const punto = prefijo >= 31;
  return {
    ip: aTexto(ip), prefijo, mascara: aTexto(mascara(prefijo)), wildcard: aTexto(wildcard(prefijo)),
    red: aTexto(r), broadcast: punto ? '—' : aTexto(b),
    primero: aTexto(punto ? r : r + 1), ultimo: aTexto(punto ? b : b - 1),
    hosts: hostsUtiles(prefijo), bloque: bloqueInfo(prefijo),
  };
}

// Octeto "interesante" y tamaño del bloque en ese octeto (método rápido del subnetting).
export function bloqueInfo(prefijo) {
  if (prefijo === 0) return { octeto: 1, salto: 256, valorMascara: 0 };
  const octeto = Math.min(4, Math.ceil(prefijo / 8));
  const bits = prefijo - (octeto - 1) * 8;
  const valorMascara = 256 - 2 ** (8 - bits);
  return { octeto, salto: 256 - valorMascara, valorMascara };
}

// Generador con semilla opcional para pruebas reproducibles.
export function aleatorio(semilla) {
  if (semilla == null) return Math.random;
  let s = semilla >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

export function generarEjercicio(nivel = 'normal', rnd = Math.random) {
  const rangos = { facil: [24, 30], normal: [20, 30], dificil: [12, 30] }[nivel] || [20, 30];
  const prefijo = rangos[0] + Math.floor(rnd() * (rangos[1] - rangos[0] + 1));
  const base = [() => [10, rnd() * 256, rnd() * 256, rnd() * 256], () => [172, 16 + rnd() * 16, rnd() * 256, rnd() * 256], () => [192, 168, rnd() * 256, rnd() * 256]][Math.floor(rnd() * 3)]();
  const ip = aTexto(base.map(Math.floor).reduce((n, x) => n * 256 + x, 0));
  return calcular(ip, prefijo);
}

// Explicación paso a paso con el método del bloque.
export function explicar(c) {
  const { octeto, salto, valorMascara } = c.bloque;
  const partes = c.ip.split('.').map(Number);
  const valor = partes[octeto - 1];
  const inicio = valor - (valor % salto);
  const nombres = ['primer', 'segundo', 'tercer', 'cuarto'];
  return [
    `/${c.prefijo} = ${c.mascara}. El octeto interesante es el ${nombres[octeto - 1]} (${valorMascara}).`,
    `Bloque = 256 − ${valorMascara} = ${salto}. Las subredes empiezan en múltiplos de ${salto} en ese octeto.`,
    `${valor} está en el bloque que empieza en ${inicio} → red ${c.red}.`,
    c.prefijo >= 31 ? `Con /${c.prefijo} no hay dirección de red/broadcast utilizable aparte: ${c.hosts} ${c.hosts === 1 ? 'dirección' : 'direcciones'}.` : `Broadcast = siguiente red − 1 = ${c.broadcast}. Hosts: ${c.primero} a ${c.ultimo} (2^${32 - c.prefijo} − 2 = ${c.hosts}).`,
  ];
}

// ---------------------------------------------------------------- VLSM
export function prefijoParaHosts(n) {
  for (let p = 30; p >= 0; p--) if (hostsUtiles(p) >= n && p <= 30) return p;
  return null;
}

// Solución de referencia: de mayor a menor, cada bloque alineado a su tamaño.
export function resolverVlsm(baseTexto, basePrefijo, necesidades) {
  const base = red(aEntero(baseTexto), basePrefijo);
  const fin = base + tamano(basePrefijo);
  const orden = necesidades.map((n, i) => ({ ...n, i })).sort((a, b) => b.hosts - a.hosts || a.i - b.i);
  let cursor = base;
  const res = [];
  for (const n of orden) {
    const p = prefijoParaHosts(n.hosts);
    const t = tamano(p);
    cursor = Math.ceil(cursor / t) * t;
    if (cursor + t > fin) return null;
    res[n.i] = { nombre: n.nombre, hosts: n.hosts, red: aTexto(cursor), prefijo: p, broadcast: aTexto(cursor + t - 1) };
    cursor += t;
  }
  return res;
}

// Comprueba la propuesta del alumno: cada subred válida, dentro de la base, con hosts suficientes y sin solapes.
export function validarVlsm(baseTexto, basePrefijo, necesidades, propuestas) {
  const base = red(aEntero(baseTexto), basePrefijo), fin = base + tamano(basePrefijo);
  const errores = [], rangos = [];
  necesidades.forEach((n, i) => {
    const txt = String(propuestas[i] || '').trim();
    const m = txt.match(/^(\d+\.\d+\.\d+\.\d+)\s*\/\s*(\d{1,2})$/);
    if (!m) { errores[i] = 'Escribe la subred como red/prefijo, por ejemplo 192.168.1.0/26.'; return; }
    const ip = aEntero(m[1]), p = Number(m[2]);
    if (ip == null || p > 32) { errores[i] = 'Dirección o prefijo no válidos.'; return; }
    if (ip !== red(ip, p)) { errores[i] = `${m[1]} no es una dirección de red para /${p} (sería ${aTexto(red(ip, p))}).`; return; }
    if (ip < base || ip + tamano(p) > fin) { errores[i] = 'Esa subred se sale del bloque disponible.'; return; }
    if (hostsUtiles(p) < n.hosts) { errores[i] = `/${p} solo admite ${hostsUtiles(p)} hosts y necesitas ${n.hosts}.`; return; }
    if (p !== prefijoParaHosts(n.hosts)) errores[i] = `Funciona, pero desperdicia direcciones: basta con /${prefijoParaHosts(n.hosts)}.`;
    rangos[i] = [ip, ip + tamano(p) - 1];
  });
  rangos.forEach((a, i) => rangos.forEach((b, j) => {
    if (i < j && a && b && a[0] <= b[1] && b[0] <= a[1]) { errores[j] = (errores[j] ? errores[j] + ' ' : '') + `Se solapa con ${necesidades[i].nombre}.`; }
  }));
  return errores;
}

export function generarVlsm(rnd = Math.random) {
  const bases = ['192.168.10.0', '192.168.50.0', '172.16.8.0', '10.20.30.0'];
  const nombres = ['Ventas', 'Soporte', 'Gerencia', 'Almacén', 'Invitados', 'Servidores', 'Cámaras'];
  const baseTexto = bases[Math.floor(rnd() * bases.length)];
  for (;;) {
    const n = 3 + Math.floor(rnd() * 2);
    const usados = new Set();
    const necesidades = [];
    for (let i = 0; i < n; i++) {
      let nombre; do { nombre = nombres[Math.floor(rnd() * nombres.length)]; } while (usados.has(nombre));
      usados.add(nombre);
      necesidades.push({ nombre, hosts: [100, 60, 50, 28, 25, 12, 10, 5][Math.floor(rnd() * 8)] });
    }
    necesidades.push({ nombre: 'Enlace R1–R2', hosts: 2 });
    if (resolverVlsm(baseTexto, 24, necesidades)) return { base: baseTexto, prefijo: 24, necesidades };
  }
}

export const aBinario = n => n.toString(2).padStart(8, '0');
