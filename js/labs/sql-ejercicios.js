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
  inventario: [
    { enunciado: 'Informe 1: sede, hostname e IP de gestión de todos los equipos, ordenados por sede y hostname.', solucion: 'SELECT s.nombre, d.hostname, d.ip_gestion FROM dispositivos d JOIN sitios s ON s.id = d.sitio_id ORDER BY s.nombre, d.hostname;', ordenado: true },
    { enunciado: "Informe 2: hostname y versión de los equipos Cisco IOS/IOS XE con versión anterior a la 17.9 (excluye los firewalls y los Nexus, cuya versión empieza por 10 o por 7).", solucion: "SELECT hostname, version_so FROM dispositivos WHERE version_so < '17.9' AND tipo <> 'firewall' AND version_so NOT LIKE '10.%';", pista: "Compara el texto de la versión con < '17.9'. Excluye tipo = 'firewall' y las versiones que empiezan por '10.'" },
    { enunciado: 'Informe 3: nombre de cada sede y número de interfaces caídas (down) que tiene. Solo sedes con al menos una.', solucion: "SELECT s.nombre, COUNT(*) FROM interfaces i JOIN dispositivos d ON d.id = i.dispositivo_id JOIN sitios s ON s.id = d.sitio_id WHERE i.estado = 'down' GROUP BY s.nombre;" },
    { enunciado: 'Informe 4: hostname de los equipos sin ninguna incidencia registrada.', solucion: 'SELECT d.hostname FROM dispositivos d LEFT JOIN incidencias inc ON inc.dispositivo_id = d.id WHERE inc.id IS NULL;' },
    { enunciado: 'Informe 5: la sede con más incidencias graves (gravedad 1 o 2) sin resolver: nombre de la sede y número de incidencias.', solucion: 'SELECT s.nombre, COUNT(*) AS n FROM incidencias inc JOIN dispositivos d ON d.id = inc.dispositivo_id JOIN sitios s ON s.id = d.sitio_id WHERE inc.gravedad <= 2 AND inc.resuelta = 0 GROUP BY s.nombre ORDER BY n DESC LIMIT 1;' },
  ],
};
