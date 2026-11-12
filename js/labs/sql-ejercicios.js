// Ejercicios del laboratorio SQL. Cada uno se corrige ejecutando la solución y la consulta del alumno sobre copias
// idénticas de la base de datos y comparando los resultados (no el texto de la consulta).
// ordenado: true → el orden de las filas importa (la consulta pide ORDER BY).
// verificar: consulta que comprueba el estado de la base tras un INSERT/UPDATE/DELETE.
export const EJERCICIOS = {
  select: [
    { enunciado: 'Muestra el hostname y la IP de gestión de todos los dispositivos.', solucion: 'SELECT hostname, ip_gestion FROM dispositivos;' },
    { enunciado: 'Muestra el hostname y el modelo de los switches, ordenados por hostname.', solucion: "SELECT hostname, modelo FROM dispositivos WHERE tipo = 'switch' ORDER BY hostname;", ordenado: true },
    { enunciado: 'Lista el dispositivo_id y el nombre de las interfaces caídas (estado down) de las VLAN 10 o 20.', solucion: "SELECT dispositivo_id, nombre FROM interfaces WHERE estado = 'down' AND vlan IN (10, 20);" },
    { enunciado: 'Muestra el hostname de los equipos cuyo hostname empieza por SW-STI.', solucion: "SELECT hostname FROM dispositivos WHERE hostname LIKE 'SW-STI%';" },
    { enunciado: 'Muestra las 3 incidencias sin resolver más graves (gravedad 1 es la más grave): fecha, gravedad y descripción, de más a menos grave.', solucion: 'SELECT fecha, gravedad, descripcion FROM incidencias WHERE resuelta = 0 ORDER BY gravedad ASC, fecha ASC LIMIT 3;', ordenado: true, pista: 'La gravedad 1 es la más grave: ordena de forma ascendente. Si empatan, por fecha.' },
  ],
  join: [
    { enunciado: 'Muestra el hostname de cada equipo junto con el nombre de su sede.', solucion: 'SELECT d.hostname, s.nombre FROM dispositivos d JOIN sitios s ON s.id = d.sitio_id;' },
    { enunciado: 'Lista las interfaces caídas (down) con el hostname de su equipo: hostname y nombre de la interfaz.', solucion: "SELECT d.hostname, i.nombre FROM interfaces i JOIN dispositivos d ON d.id = i.dispositivo_id WHERE i.estado = 'down';" },
    { enunciado: 'Muestra el hostname de los equipos que nunca han tenido ninguna incidencia.', solucion: 'SELECT d.hostname FROM dispositivos d LEFT JOIN incidencias inc ON inc.dispositivo_id = d.id WHERE inc.id IS NULL;' },
    { enunciado: 'Muestra el nombre de la VLAN y el hostname y la interfaz de los puertos de la VLAN INVITADOS.', solucion: "SELECT v.nombre, d.hostname, i.nombre FROM interfaces i JOIN vlans v ON v.id = i.vlan JOIN dispositivos d ON d.id = i.dispositivo_id WHERE v.nombre = 'INVITADOS';" },
  ],
  agregacion: [
    { enunciado: 'Cuenta cuántos equipos hay de cada tipo (tipo y total).', solucion: 'SELECT tipo, COUNT(*) FROM dispositivos GROUP BY tipo;' },
    { enunciado: 'Muestra el nombre de cada sede y cuántos equipos tiene.', solucion: 'SELECT s.nombre, COUNT(d.id) FROM sitios s LEFT JOIN dispositivos d ON d.sitio_id = s.id GROUP BY s.nombre;' },
    { enunciado: 'Muestra el hostname de los equipos con más de una incidencia y su número de incidencias.', solucion: 'SELECT d.hostname, COUNT(*) FROM incidencias inc JOIN dispositivos d ON d.id = inc.dispositivo_id GROUP BY d.hostname HAVING COUNT(*) > 1;' },
    { enunciado: 'Muestra cada versión de software distinta y cuántos equipos la usan.', solucion: 'SELECT version_so, COUNT(*) FROM dispositivos GROUP BY version_so;' },
  ],
  modificar: [
    { enunciado: "Añade la VLAN 40 con el nombre CAMARAS.", solucion: "INSERT INTO vlans (id, nombre) VALUES (40, 'CAMARAS');", verificar: 'SELECT * FROM vlans ORDER BY id;' },
    { enunciado: 'Marca como resuelta la incidencia del ventilador ruidoso (id 6).', solucion: 'UPDATE incidencias SET resuelta = 1 WHERE id = 6;', verificar: 'SELECT id, resuelta FROM incidencias ORDER BY id;' },
    { enunciado: 'Mueve todas las interfaces de la VLAN 30 (INVITADOS) a la VLAN 99.', solucion: 'UPDATE interfaces SET vlan = 99 WHERE vlan = 30;', verificar: 'SELECT id, vlan FROM interfaces ORDER BY id;' },
    { enunciado: 'Borra las incidencias resueltas anteriores a septiembre de 2026 (fecha < 2026-09-01).', solucion: "DELETE FROM incidencias WHERE resuelta = 1 AND fecha < '2026-09-01';", verificar: 'SELECT id FROM incidencias ORDER BY id;' },
  ],
  funciones: [
    { enunciado: 'Muestra el hostname en minúsculas y el número de caracteres de cada hostname (columnas: minusculas, largo).', solucion: 'SELECT LOWER(hostname) AS minusculas, LENGTH(hostname) AS largo FROM dispositivos;', pista: 'LOWER() pasa a minúsculas y LENGTH() cuenta caracteres.' },
    { enunciado: 'Muestra el hostname y el código de sede, que son los caracteres 3 a 5 del hostname (por ejemplo SDQ en R-SDQ-01).', solucion: 'SELECT hostname, SUBSTR(hostname, 3, 3) FROM dispositivos;', pista: 'SUBSTR(texto, inicio, longitud). En SQL se empieza a contar en 1.' },
    { enunciado: 'Muestra la descripción de cada incidencia y una columna prioridad que diga "ALTA" si la gravedad es 1 o 2, "MEDIA" si es 3 y "BAJA" en otro caso.', solucion: "SELECT descripcion, CASE WHEN gravedad <= 2 THEN 'ALTA' WHEN gravedad = 3 THEN 'MEDIA' ELSE 'BAJA' END AS prioridad FROM incidencias;", pista: "CASE WHEN condición THEN valor WHEN … ELSE … END" },
    { enunciado: 'Muestra el nombre de cada interfaz del dispositivo 1 y su VLAN; si no tiene VLAN, muestra el texto "enrutada" (columna vlan_txt).', solucion: "SELECT nombre, COALESCE(CAST(vlan AS TEXT), 'enrutada') AS vlan_txt FROM interfaces WHERE dispositivo_id = 1;", pista: 'COALESCE(a, b) devuelve b cuando a es NULL.' },
    { enunciado: 'Cuenta cuántos equipos se dieron de alta cada año (año como texto de 4 cifras y total), ordenado por año.', solucion: "SELECT strftime('%Y', alta) AS anio, COUNT(*) FROM dispositivos GROUP BY anio ORDER BY anio;", ordenado: true, pista: "En SQLite, strftime('%Y', fecha) extrae el año." },
  ],
  subconsultas: [
    { enunciado: 'Muestra el hostname de los equipos que tienen alguna incidencia sin resolver (usa IN con una subconsulta).', solucion: 'SELECT hostname FROM dispositivos WHERE id IN (SELECT dispositivo_id FROM incidencias WHERE resuelta = 0);' },
    { enunciado: 'Muestra el hostname de los equipos que NO tienen ninguna interfaz caída (down). Usa NOT EXISTS.', solucion: "SELECT d.hostname FROM dispositivos d WHERE NOT EXISTS (SELECT 1 FROM interfaces i WHERE i.dispositivo_id = d.id AND i.estado = 'down');" },
    { enunciado: 'Muestra hostname y velocidad de las interfaces cuya velocidad es mayor que la media de todas las interfaces.', solucion: 'SELECT d.hostname, i.velocidad_mbps FROM interfaces i JOIN dispositivos d ON d.id = i.dispositivo_id WHERE i.velocidad_mbps > (SELECT AVG(velocidad_mbps) FROM interfaces);', pista: 'Una subconsulta escalar entre paréntesis devuelve un único valor: (SELECT AVG(...) FROM ...).' },
    { enunciado: 'Con una CTE (WITH caidas AS (...)) calcula cuántas interfaces down tiene cada dispositivo y muestra hostname y total de los que tienen 2 o más.', solucion: "WITH caidas AS (SELECT dispositivo_id, COUNT(*) AS total FROM interfaces WHERE estado = 'down' GROUP BY dispositivo_id) SELECT d.hostname, c.total FROM caidas c JOIN dispositivos d ON d.id = c.dispositivo_id WHERE c.total >= 2;", pista: 'WITH nombre AS (consulta) SELECT … FROM nombre … — es como una tabla temporal con nombre.' },
  ],
  ddl: [
    { enunciado: 'Crea la tabla tecnicos con: id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, email TEXT NOT NULL UNIQUE y sitio_id INTEGER que haga referencia a sitios(id).', solucion: 'CREATE TABLE tecnicos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, email TEXT NOT NULL UNIQUE, sitio_id INTEGER REFERENCES sitios(id));', verificar: "SELECT name, type, \"notnull\", pk FROM pragma_table_info('tecnicos') ORDER BY cid;", pista: 'CREATE TABLE nombre (columna TIPO restricciones, ...). Respeta los nombres y tipos exactos.' },
    { enunciado: 'Añade a la tabla dispositivos la columna numero_serie de tipo TEXT.', solucion: 'ALTER TABLE dispositivos ADD COLUMN numero_serie TEXT;', verificar: "SELECT name, type FROM pragma_table_info('dispositivos') ORDER BY cid;" },
    { enunciado: 'Crea un índice llamado idx_interfaces_estado sobre la columna estado de la tabla interfaces.', solucion: 'CREATE INDEX idx_interfaces_estado ON interfaces(estado);', verificar: "SELECT name FROM pragma_index_list('interfaces') WHERE name = 'idx_interfaces_estado';" },
    { enunciado: "Crea la vista v_caidas que muestre hostname y nombre de interfaz (columnas hostname, interfaz) de las interfaces con estado 'down'.", solucion: "CREATE VIEW v_caidas AS SELECT d.hostname AS hostname, i.nombre AS interfaz FROM interfaces i JOIN dispositivos d ON d.id = i.dispositivo_id WHERE i.estado = 'down';", verificar: 'SELECT hostname, interfaz FROM v_caidas ORDER BY hostname, interfaz;', pista: 'CREATE VIEW nombre AS SELECT …' },
  ],
  ventanas: [
    { enunciado: 'Numera los equipos de cada sede por hostname: sitio_id, hostname y una columna n con ROW_NUMBER() que empiece en 1 en cada sede.', solucion: 'SELECT sitio_id, hostname, ROW_NUMBER() OVER (PARTITION BY sitio_id ORDER BY hostname) AS n FROM dispositivos;', pista: 'ROW_NUMBER() OVER (PARTITION BY columna ORDER BY columna).' },
    { enunciado: 'Muestra la fecha, la gravedad y el total acumulado de incidencias por orden de fecha (columna acumulado con COUNT(*) OVER).', solucion: 'SELECT fecha, gravedad, COUNT(*) OVER (ORDER BY fecha) AS acumulado FROM incidencias ORDER BY fecha;', ordenado: true },
    { enunciado: 'Clasifica los modelos de switch por número de equipos: modelo, total y su puesto con RANK() (el más numeroso, puesto 1).', solucion: "SELECT modelo, COUNT(*) AS total, RANK() OVER (ORDER BY COUNT(*) DESC) AS puesto FROM dispositivos WHERE tipo = 'switch' GROUP BY modelo;" },
  ],
  inventario: [
    { enunciado: 'Informe 1: sede, hostname e IP de gestión de todos los equipos, ordenados por sede y hostname.', solucion: 'SELECT s.nombre, d.hostname, d.ip_gestion FROM dispositivos d JOIN sitios s ON s.id = d.sitio_id ORDER BY s.nombre, d.hostname;', ordenado: true },
    { enunciado: "Informe 2: hostname y versión de los equipos Cisco IOS/IOS XE con versión anterior a la 17.9 (excluye los firewalls y los Nexus, cuya versión empieza por 10 o por 7).", solucion: "SELECT hostname, version_so FROM dispositivos WHERE version_so < '17.9' AND tipo <> 'firewall' AND version_so NOT LIKE '10.%';", pista: "Compara el texto de la versión con < '17.9'. Excluye tipo = 'firewall' y las versiones que empiezan por '10.'" },
    { enunciado: 'Informe 3: nombre de cada sede y número de interfaces caídas (down) que tiene. Solo sedes con al menos una.', solucion: "SELECT s.nombre, COUNT(*) FROM interfaces i JOIN dispositivos d ON d.id = i.dispositivo_id JOIN sitios s ON s.id = d.sitio_id WHERE i.estado = 'down' GROUP BY s.nombre;" },
    { enunciado: 'Informe 4: hostname de los equipos sin ninguna incidencia registrada.', solucion: 'SELECT d.hostname FROM dispositivos d LEFT JOIN incidencias inc ON inc.dispositivo_id = d.id WHERE inc.id IS NULL;' },
    { enunciado: 'Informe 5: la sede con más incidencias graves (gravedad 1 o 2) sin resolver: nombre de la sede y número de incidencias.', solucion: 'SELECT s.nombre, COUNT(*) AS n FROM incidencias inc JOIN dispositivos d ON d.id = inc.dispositivo_id JOIN sitios s ON s.id = d.sitio_id WHERE inc.gravedad <= 2 AND inc.resuelta = 0 GROUP BY s.nombre ORDER BY n DESC LIMIT 1;' },
  ],
};
