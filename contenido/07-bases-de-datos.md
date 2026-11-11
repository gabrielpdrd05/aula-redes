---
id: m7
titulo: Bases de datos
dominio: Complementario
peso: 0
descripcion: Modelo relacional, SQL desde cero (consultas, JOIN, agregaciones, modificaciones), diseño y normalización, índices, transacciones y seguridad, con un laboratorio SQL sobre un inventario de red real.
---
=== m7-intro | ¿Qué es una base de datos? | 12
Una **base de datos** guarda información de forma organizada para consultarla y modificarla con eficacia. En redes las encontrarás en todas partes: el inventario de equipos, las direcciones IP asignadas (IPAM), los usuarios de RADIUS, los registros de un SIEM, la configuración de Catalyst Center.

## El modelo relacional

La información se organiza en **tablas** (relaciones):

- Cada **fila** (registro) es un elemento: un switch, una interfaz.
- Cada **columna** (atributo) es un dato con un **tipo**: texto, número entero, fecha.
- La **clave primaria (PK)** identifica cada fila de forma única (por ejemplo, `id`).
- La **clave foránea (FK)** apunta a la clave primaria de otra tabla y así **relaciona** tablas: cada interfaz tiene un `dispositivo_id` que indica a qué equipo pertenece.

Un **SGBD** (sistema gestor de bases de datos) es el programa que las gestiona: **PostgreSQL, MySQL/MariaDB, Microsoft SQL Server, Oracle, SQLite**. Todos usan el lenguaje **SQL**.

## Relacional frente a NoSQL

| | Relacional (SQL) | NoSQL |
|---|---|---|
| Estructura | Tablas con esquema fijo | Documentos (JSON), clave-valor, grafos, columnas |
| Ejemplos | PostgreSQL, MySQL | MongoDB, Redis, Cassandra, Neo4j |
| Puntos fuertes | Consistencia, relaciones, transacciones | Escala horizontal, datos variables, gran volumen |
| En redes | Inventario, IPAM, RADIUS | Telemetría, series temporales (InfluxDB), cachés |

## Nuestro laboratorio

En el laboratorio de este módulo trabajarás con el inventario de red de una empresa ficticia:

| Tabla | Contenido |
|---|---|
| `sitios` | Sedes: id, nombre, ciudad |
| `dispositivos` | Equipos: id, hostname, tipo, modelo, ip_gestion, sitio_id, version_so, alta |
| `interfaces` | Puertos: id, dispositivo_id, nombre, estado, vlan, velocidad_mbps |
| `vlans` | VLAN: id, nombre |
| `incidencias` | Averías: id, dispositivo_id, fecha, gravedad, descripcion, resuelta |

::: quiz
? ¿Qué identifica de forma única cada fila de una tabla?
+ La clave primaria
- La clave foránea
- El nombre de la tabla
= La clave primaria no puede repetirse ni ser nula.

? La columna dispositivo_id de la tabla interfaces, que apunta a dispositivos.id, es...
- Una clave primaria
+ Una clave foránea
- Un índice único
= Una clave foránea relaciona cada interfaz con su equipo.

? ¿Qué tipo de base de datos encaja mejor con la telemetría masiva de miles de equipos cada segundo?
- Una hoja de cálculo
+ Una NoSQL de series temporales
= Bases como InfluxDB están diseñadas para grandes volúmenes de datos con marca de tiempo.
:::

=== m7-select | SQL I: consultar datos con SELECT | 18
**SQL** (Structured Query Language) es el lenguaje estándar para trabajar con bases de datos relacionales. La consulta más importante es `SELECT`.

## Estructura básica

```sql
SELECT columnas
FROM tabla
WHERE condición
ORDER BY columna [ASC | DESC]
LIMIT n;
```

```sql
-- Todas las columnas de todos los equipos
SELECT * FROM dispositivos;

-- Solo algunas columnas
SELECT hostname, ip_gestion FROM dispositivos;

-- Solo los switches, ordenados por nombre
SELECT hostname, modelo
FROM dispositivos
WHERE tipo = 'switch'
ORDER BY hostname;
```

## Condiciones en WHERE

| Operador | Ejemplo |
|---|---|
| `=`, `<>` (distinto), `<`, `>`, `<=`, `>=` | `velocidad_mbps >= 1000` |
| `AND`, `OR`, `NOT` | `tipo = 'router' AND sitio_id = 1` |
| `IN (...)` | `vlan IN (10, 20)` |
| `BETWEEN a AND b` | `gravedad BETWEEN 1 AND 3` |
| `LIKE` con `%` (cualquier texto) y `_` (un carácter) | `hostname LIKE 'SW-%'` |
| `IS NULL` / `IS NOT NULL` | `vlan IS NULL` |

Las cadenas van entre **comillas simples**. `NULL` significa "sin valor" y no se compara con `=`: se usa `IS NULL`.

```sql
-- Interfaces caídas de las VLAN 10 o 20
SELECT dispositivo_id, nombre, vlan
FROM interfaces
WHERE estado = 'down' AND vlan IN (10, 20);

-- Las 3 incidencias más graves sin resolver (como en syslog, 1 es la más grave)
SELECT fecha, gravedad, descripcion
FROM incidencias
WHERE resuelta = 0
ORDER BY gravedad ASC
LIMIT 3;
```

[[sql:select]]

::: quiz
? ¿Qué consulta devuelve los hostnames de todos los routers?
+ SELECT hostname FROM dispositivos WHERE tipo = 'router';
- SELECT * WHERE tipo = 'router';
- SELECT hostname FROM dispositivos IF tipo = 'router';
= SELECT columnas FROM tabla WHERE condición.

? ¿Cómo se buscan las filas en las que vlan no tiene valor?
- WHERE vlan = NULL
+ WHERE vlan IS NULL
- WHERE vlan = ''
= NULL no se compara con =; hay que usar IS NULL.

? ¿Qué patrón LIKE encuentra los hostnames que empiezan por SW-?
+ LIKE 'SW-%'
- LIKE '%SW-'
- LIKE 'SW-_'
= % representa cualquier secuencia de caracteres; al final indica "empieza por".

? ¿Qué cláusula ordena de mayor a menor?
- ORDER BY columna ASC
+ ORDER BY columna DESC
- SORT BY columna
= DESC es descendente; ASC (por defecto) ascendente.
:::

=== m7-join | SQL II: relacionar tablas con JOIN | 18
Los datos están repartidos en varias tablas para no repetirlos. **JOIN** las combina usando las claves.

## INNER JOIN

Devuelve solo las filas que tienen pareja en las dos tablas.

```sql
-- Cada interfaz con el hostname de su equipo
SELECT d.hostname, i.nombre, i.estado
FROM interfaces AS i
INNER JOIN dispositivos AS d ON d.id = i.dispositivo_id;
```

`AS i` y `AS d` son **alias** para escribir menos. `ON` indica qué columnas deben coincidir.

## LEFT JOIN

Devuelve **todas** las filas de la tabla de la izquierda, aunque no tengan pareja (las columnas de la derecha salen como `NULL`). Ideal para encontrar "lo que falta".

```sql
-- Equipos y sus incidencias, incluidos los que no tienen ninguna
SELECT d.hostname, inc.descripcion
FROM dispositivos AS d
LEFT JOIN incidencias AS inc ON inc.dispositivo_id = d.id;

-- Solo los equipos que nunca han tenido incidencias
SELECT d.hostname
FROM dispositivos AS d
LEFT JOIN incidencias AS inc ON inc.dispositivo_id = d.id
WHERE inc.id IS NULL;
```

## Varias tablas

```sql
-- Interfaces caídas con el equipo y la sede
SELECT s.nombre AS sede, d.hostname, i.nombre AS interfaz
FROM interfaces AS i
JOIN dispositivos AS d ON d.id = i.dispositivo_id
JOIN sitios AS s ON s.id = d.sitio_id
WHERE i.estado = 'down'
ORDER BY sede, d.hostname;
```

(`JOIN` a secas equivale a `INNER JOIN`.) También existen **RIGHT JOIN** (todas las de la derecha) y **FULL OUTER JOIN** (todas las de ambas).

[[sql:join]]

::: quiz
? ¿Qué JOIN devuelve solo las filas con coincidencia en ambas tablas?
+ INNER JOIN
- LEFT JOIN
- FULL OUTER JOIN
= INNER JOIN descarta las filas sin pareja.

? Quieres listar todos los equipos, tengan o no incidencias. ¿Qué JOIN usas desde dispositivos?
- INNER JOIN incidencias
+ LEFT JOIN incidencias
= LEFT JOIN conserva todas las filas de la tabla de la izquierda.

? En un LEFT JOIN, ¿qué valor tienen las columnas de la derecha cuando no hay pareja?
- 0
- Una cadena vacía
+ NULL
= Las columnas de la tabla sin coincidencia se rellenan con NULL.

? ¿Para qué sirve ON en un JOIN?
+ Para indicar qué columnas deben coincidir entre las tablas
- Para filtrar después de agrupar
- Para ordenar el resultado
= Normalmente se compara la clave foránea con la clave primaria.
:::

=== m7-agregacion | SQL III: contar, sumar y agrupar | 16
Las **funciones de agregación** resumen muchas filas en un valor:

| Función | Devuelve |
|---|---|
| `COUNT(*)` | Número de filas |
| `COUNT(columna)` | Número de valores no nulos |
| `SUM(columna)` | Suma |
| `AVG(columna)` | Media |
| `MIN(columna)` / `MAX(columna)` | Mínimo / máximo |

## GROUP BY

Agrupa las filas por una o varias columnas y calcula la agregación **para cada grupo**:

```sql
-- Cuántos equipos hay de cada tipo
SELECT tipo, COUNT(*) AS total
FROM dispositivos
GROUP BY tipo
ORDER BY total DESC;

-- Interfaces caídas por equipo
SELECT d.hostname, COUNT(*) AS caidas
FROM interfaces AS i
JOIN dispositivos AS d ON d.id = i.dispositivo_id
WHERE i.estado = 'down'
GROUP BY d.hostname;
```

Regla: en el `SELECT` solo puede haber columnas que estén en el `GROUP BY` o dentro de una función de agregación.

## HAVING

`WHERE` filtra **filas antes** de agrupar; `HAVING` filtra **grupos después** de agrupar:

```sql
-- Sedes con más de 3 equipos
SELECT s.nombre, COUNT(d.id) AS equipos
FROM sitios AS s
JOIN dispositivos AS d ON d.sitio_id = s.id
GROUP BY s.nombre
HAVING COUNT(d.id) > 3;
```

## DISTINCT

`SELECT DISTINCT version_so FROM dispositivos;` devuelve cada versión de software una sola vez.

[[sql:agregacion]]

::: quiz
? ¿Qué cláusula filtra los grupos después de agrupar?
- WHERE
+ HAVING
- ORDER BY
= WHERE actúa sobre filas antes de agrupar; HAVING, sobre los grupos.

? ¿Qué devuelve COUNT(vlan) en la tabla interfaces?
- El número total de interfaces
+ El número de interfaces con vlan no nula
- La suma de los números de VLAN
= COUNT(columna) no cuenta los NULL; COUNT(*) cuenta todas las filas.

? ¿Qué consulta cuenta los equipos de cada sede?
+ SELECT sitio_id, COUNT(*) FROM dispositivos GROUP BY sitio_id;
- SELECT COUNT(*) FROM dispositivos ORDER BY sitio_id;
- SELECT sitio_id, COUNT(*) FROM dispositivos;
= Para tener un recuento por sede hay que agrupar por sitio_id.
:::

=== m7-modificar | Modificar datos y transacciones | 16
## INSERT, UPDATE y DELETE

```sql
-- Añadir un equipo
INSERT INTO dispositivos (hostname, tipo, modelo, ip_gestion, sitio_id, version_so, alta)
VALUES ('SW-STI-03', 'switch', 'C9200L-24P-4G', '10.20.99.13', 2, '17.9.4', '2026-11-01');

-- Actualizar: marcar como resueltas las incidencias leves
UPDATE incidencias
SET resuelta = 1
WHERE gravedad >= 5;

-- Borrar las interfaces de un equipo retirado
DELETE FROM interfaces WHERE dispositivo_id = 7;
```

::: cuidado
Un `UPDATE` o `DELETE` **sin WHERE** afecta a **todas las filas** de la tabla. Antes de ejecutarlos, prueba la misma condición con un `SELECT` para ver qué filas vas a tocar.
:::

## Transacciones y ACID

Una **transacción** agrupa varias operaciones que deben hacerse **todas o ninguna**:

```sql
BEGIN;
UPDATE interfaces SET vlan = 30 WHERE dispositivo_id = 3 AND vlan = 20;
INSERT INTO vlans (id, nombre) VALUES (30, 'INVITADOS');
COMMIT;      -- confirma los cambios
-- o ROLLBACK; para deshacerlos
```

Las bases relacionales garantizan las propiedades **ACID**:

- **Atomicidad:** todo o nada.
- **Consistencia:** la base pasa de un estado válido a otro válido (se respetan las restricciones).
- **Aislamiento (Isolation):** las transacciones simultáneas no se estorban.
- **Durabilidad:** lo confirmado sobrevive a un fallo.

[[sql:modificar]]

::: quiz
? ¿Qué ocurre si ejecutas DELETE FROM interfaces; sin WHERE?
+ Se borran todas las filas de la tabla
- No pasa nada, da error
- Se borra la tabla entera con su estructura
= Sin WHERE afecta a todas las filas (DROP TABLE es lo que elimina la estructura).

? ¿Qué comando deshace los cambios de una transacción no confirmada?
- COMMIT
+ ROLLBACK
- UNDO
= ROLLBACK revierte todo lo hecho desde BEGIN.

? ¿Qué propiedad ACID garantiza que una transacción se hace completa o no se hace?
+ Atomicidad
- Durabilidad
- Aislamiento
= Atomicidad: todo o nada.
:::

=== m7-diseno | Diseño: claves, normalización e índices | 18
## Crear tablas

```sql
CREATE TABLE sitios (
  id      INTEGER PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE,
  ciudad  TEXT NOT NULL
);

CREATE TABLE dispositivos (
  id          INTEGER PRIMARY KEY,
  hostname    TEXT NOT NULL UNIQUE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('router', 'switch', 'ap', 'firewall')),
  ip_gestion  TEXT UNIQUE,
  sitio_id    INTEGER NOT NULL REFERENCES sitios(id)
);
```

Las **restricciones** (`NOT NULL`, `UNIQUE`, `CHECK`, `REFERENCES`) impiden datos incorrectos desde la propia base.

## Normalización

Normalizar es organizar las tablas para **no repetir datos** y evitar incoherencias.

- **1FN:** cada celda tiene **un solo valor** (nada de "10,20,30" en una columna de VLAN) y no hay grupos repetidos.
- **2FN:** cumple 1FN y cada columna depende de **toda** la clave primaria (importa en claves compuestas).
- **3FN:** cumple 2FN y ninguna columna depende de otra columna que no sea la clave. Ejemplo de lo que **no** hay que hacer: guardar `ciudad_sede` en `dispositivos`, porque depende de la sede, no del equipo. Va en `sitios`.

Si la ciudad de una sede cambia, en un diseño normalizado se cambia **en un solo sitio**.

## Relaciones

- **Uno a muchos:** una sede tiene muchos equipos → `sitio_id` en `dispositivos`.
- **Muchos a muchos:** un equipo pertenece a varias VLAN y una VLAN está en varios equipos → **tabla intermedia** `dispositivo_vlan(dispositivo_id, vlan_id)`.

## Índices

Un **índice** acelera las búsquedas sobre una columna, como el índice de un libro, a cambio de ocupar espacio y hacer algo más lentas las escrituras.

```sql
CREATE INDEX idx_interfaces_dispositivo ON interfaces (dispositivo_id);
```

Indexa las columnas que usas a menudo en `WHERE` y en los `JOIN` (sobre todo las claves foráneas). Las claves primarias y las columnas `UNIQUE` ya tienen índice.

::: quiz
? Una columna guarda "10,20,30" con varias VLAN. ¿Qué forma normal incumple?
+ 1FN
- 2FN
- 3FN
= La primera forma normal exige valores atómicos en cada celda.

? ¿Cómo se representa una relación muchos a muchos?
- Con una columna de texto con valores separados por comas
+ Con una tabla intermedia que tiene las dos claves foráneas
- No se puede representar
= La tabla intermedia une ambas entidades.

? ¿Qué inconveniente tiene añadir muchos índices?
+ Ocupan espacio y ralentizan las inserciones y actualizaciones
- Hacen más lentas las consultas SELECT
- Impiden usar JOIN
= Cada escritura tiene que actualizar también los índices.

? ¿Qué restricción impide que dos equipos tengan el mismo hostname?
- NOT NULL
+ UNIQUE
- CHECK
= UNIQUE impide valores repetidos en la columna.
:::

=== m7-seguridad | Seguridad en bases de datos | 16
## Inyección SQL

Es una de las vulnerabilidades web más explotadas. Ocurre cuando una aplicación **mete el texto del usuario directamente** en una consulta:

```python
# MAL: vulnerable
usuario = input("Usuario: ")
consulta = f"SELECT * FROM usuarios WHERE nombre = '{usuario}'"
```

Si alguien escribe `' OR '1'='1`, la consulta pasa a ser `... WHERE nombre = '' OR '1'='1'`, que es verdadera para **todas** las filas.

**La solución: consultas parametrizadas** (*prepared statements*). El valor se envía aparte y la base de datos nunca lo interpreta como código:

```python
# BIEN: parametrizada
cursor.execute("SELECT * FROM usuarios WHERE nombre = %s", (usuario,))
```

## Otras medidas

- **Mínimo privilegio:** la aplicación se conecta con un usuario que solo puede hacer lo que necesita (`GRANT SELECT, INSERT ON ... TO app;`), nunca como administrador.
- **Seguridad a nivel de fila** (*Row Level Security*): en PostgreSQL, cada usuario solo ve sus filas. Esta misma plataforma la usa para que cada alumno solo vea su propio progreso.
- **Contraseñas con hash** (bcrypt, scrypt, Argon2), nunca en claro.
- **Cifrado** en tránsito (TLS) y en reposo.
- **Copias de seguridad** periódicas, **probadas** (restaurar al menos una vez) y guardadas fuera del servidor. Regla **3-2-1**: 3 copias, en 2 soportes distintos, 1 fuera de la sede.
- **Auditoría:** registrar quién accede a qué.
- **No exponer** el puerto de la base de datos (5432 PostgreSQL, 3306 MySQL, 1433 SQL Server) a internet.

::: quiz
? ¿Cuál es la defensa principal contra la inyección SQL?
- Ocultar los mensajes de error
+ Usar consultas parametrizadas
- Usar una base NoSQL
= Con parámetros, la entrada del usuario nunca se interpreta como parte del SQL.

? ¿Qué principio dice que la aplicación debe conectarse solo con los permisos que necesita?
+ Mínimo privilegio
- Defensa en profundidad
- Normalización
= Así, si la aplicación se ve comprometida, el daño es limitado.

? ¿Qué es la regla de copias 3-2-1?
+ 3 copias, en 2 soportes distintos, 1 fuera de la sede
- 3 copias diarias, 2 semanales y 1 mensual
- 3 servidores, 2 discos y 1 nube
= Protege contra fallos de hardware, errores y desastres locales.

? ¿En qué puerto escucha PostgreSQL por defecto?
- 3306
+ 5432
- 1433
= 3306 es MySQL y 1433, SQL Server.
:::

=== m7-proyecto | Proyecto: informes sobre el inventario de red | 20
Es hora de juntar todo. Eres el técnico de redes de la empresa y tu jefe te pide varios informes del inventario. Resuélvelos en el laboratorio: cada consulta se comprueba automáticamente.

1. Lista de los equipos de cada sede con su IP de gestión, ordenada por sede y hostname.
2. Equipos que todavía tienen una versión de software anterior a la `17.9` (pista: compara texto con `<`).
3. Número de interfaces caídas por sede.
4. Equipos sin ninguna incidencia registrada.
5. La sede con más incidencias graves (gravedad 1 o 2) sin resolver.

[[sql:inventario]]

::: practica
Cuando termines, pide al tutor que te proponga otros cinco informes más difíciles sobre el mismo inventario, y que te corrija las consultas.
:::

::: quiz
? Para el informe 4 (equipos sin incidencias), ¿qué técnica es la adecuada?
+ LEFT JOIN con incidencias y filtrar las filas donde la incidencia es NULL
- INNER JOIN con incidencias
- GROUP BY tipo
= El LEFT JOIN conserva todos los equipos; los que no tienen pareja muestran NULL en las columnas de incidencias.

? Para contar las interfaces caídas por sede, ¿qué necesitas?
+ Unir interfaces, dispositivos y sitios, filtrar por estado y agrupar por sede
- Solo la tabla sitios
- Un DELETE
= La sede está en sitios y el estado en interfaces: hay que unir las tres tablas.
:::
