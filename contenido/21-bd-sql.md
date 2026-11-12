---
area: bd
id: b2
titulo: SQL a fondo
dominio: Bases de datos
peso: 0
descripcion: JOIN, agregados, funciones, subconsultas y CTE, insertar y modificar datos, crear tablas con restricciones, vistas y funciones de ventana, con ejercicios en una base de datos real.
---

=== b2-join | SQL II: relacionar tablas con JOIN | 18 | 2
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

=== b2-agregacion | SQL III: contar, sumar y agrupar | 16 | 2
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

=== b2-funciones | Funciones: texto, números, fechas y CASE | 16 | 2
SQL no solo filtra filas: también **transforma** los datos al mostrarlos. Las funciones se usan en el `SELECT`, en el `WHERE`, en el `ORDER BY` o en el `GROUP BY`.

## Texto

| Función | Qué hace | Ejemplo → resultado |
|---|---|---|
| `UPPER(t)`, `LOWER(t)` | Mayúsculas / minúsculas | `LOWER('SW-01')` → `sw-01` |
| `LENGTH(t)` | Número de caracteres | `LENGTH('R-SDQ-01')` → `8` |
| `SUBSTR(t, inicio, n)` | Trozo del texto (empieza en 1) | `SUBSTR('R-SDQ-01', 3, 3)` → `SDQ` |
| `TRIM(t)` | Quita espacios a los lados | `TRIM('  hola ')` → `hola` |
| `REPLACE(t, a, b)` | Sustituye texto | `REPLACE('Gi0/1', 'Gi', 'GigabitEthernet')` |
| `INSTR(t, buscar)` | Posición de un texto (0 si no está) | `INSTR('10.20.99.1', '.')` → `3` |

## Números

`ROUND(x, 2)`, `ABS(x)`, `x % y` (resto), `CAST(x AS INTEGER)`. Las funciones de **agregado** (`SUM`, `AVG`, `MIN`, `MAX`, `COUNT`) resumen muchas filas en una.

## Fechas

Cada gestor tiene las suyas. En SQLite las fechas se guardan como texto `AAAA-MM-DD` y se manejan con `date()` y `strftime()`:

```sql
SELECT date('now');                              -- hoy
SELECT date('2026-09-15', '+30 days');           -- 2026-10-15
SELECT strftime('%Y', alta) AS anio FROM dispositivos;
SELECT julianday('2026-10-12') - julianday('2026-09-02');  -- días entre fechas
```

En PostgreSQL: `NOW()`, `CURRENT_DATE`, `EXTRACT(YEAR FROM alta)`, `alta + INTERVAL '30 days'`. En MySQL: `NOW()`, `YEAR(alta)`, `DATE_ADD(alta, INTERVAL 30 DAY)`.

## CASE: el "if" de SQL

```sql
SELECT descripcion,
       CASE
         WHEN gravedad <= 2 THEN 'ALTA'
         WHEN gravedad = 3  THEN 'MEDIA'
         ELSE 'BAJA'
       END AS prioridad
FROM incidencias;
```

`CASE` también sirve dentro de agregados para contar por categorías en una sola consulta:

```sql
SELECT sitio_id,
       SUM(CASE WHEN tipo = 'switch' THEN 1 ELSE 0 END) AS switches,
       SUM(CASE WHEN tipo = 'router' THEN 1 ELSE 0 END) AS routers
FROM dispositivos GROUP BY sitio_id;
```

## NULL: COALESCE y NULLIF

- `COALESCE(a, b, c)` devuelve el primer valor que no sea NULL.
- `NULLIF(a, b)` devuelve NULL si `a = b`. Truco útil para evitar dividir por cero: `x / NULLIF(y, 0)`.

[[sql:funciones]]

::: quiz
? ¿Qué devuelve SUBSTR('R-SDQ-01', 3, 3)?
+ SDQ
- -SD
- Q-0
= Empieza en la posición 3 y toma 3 caracteres.

? ¿Qué hace COALESCE(vlan, 0)?
- Cuenta las VLAN
+ Devuelve 0 cuando vlan es NULL
- Borra las filas sin VLAN
= COALESCE devuelve el primer valor no nulo de la lista.

? ¿Para qué sirve CASE en SQL?
+ Para devolver valores distintos según condiciones
- Para crear tablas
- Para unir tablas
= Es el equivalente a if / else dentro de una consulta.
:::

=== b2-subconsultas | Subconsultas y CTE (WITH) | 18 | 2
Una **subconsulta** es un `SELECT` dentro de otro. Permite responder preguntas en varios pasos sin crear tablas intermedias.

## Subconsulta que devuelve una lista: IN

"Equipos con alguna incidencia sin resolver":

```sql
SELECT hostname
FROM dispositivos
WHERE id IN (SELECT dispositivo_id FROM incidencias WHERE resuelta = 0);
```

## Subconsulta escalar: un solo valor

"Interfaces más rápidas que la media":

```sql
SELECT nombre, velocidad_mbps
FROM interfaces
WHERE velocidad_mbps > (SELECT AVG(velocidad_mbps) FROM interfaces);
```

## EXISTS y NOT EXISTS

`EXISTS` comprueba si la subconsulta devuelve **alguna** fila. Es la forma más clara (y a menudo la más rápida) de preguntar "¿tiene…?" o "¿no tiene…?":

```sql
-- Equipos sin ninguna interfaz caída
SELECT d.hostname
FROM dispositivos d
WHERE NOT EXISTS (
  SELECT 1 FROM interfaces i
  WHERE i.dispositivo_id = d.id AND i.estado = 'down'
);
```

Es una **subconsulta correlacionada**: se evalúa para cada fila de fuera (usa `d.id`).

::: cuidado
`NOT IN` con una subconsulta que devuelve algún **NULL** da un resultado vacío inesperado (por la lógica de NULL). Con `NOT EXISTS` no pasa. Por eso muchos equipos prefieren `NOT EXISTS`.
:::

## Subconsulta en el FROM (tabla derivada)

```sql
SELECT AVG(total) AS media_caidas
FROM (SELECT dispositivo_id, COUNT(*) AS total
      FROM interfaces WHERE estado = 'down'
      GROUP BY dispositivo_id) AS t;
```

## CTE: WITH, subconsultas con nombre

Una **CTE** (*Common Table Expression*) le pone nombre a una subconsulta y la deja al principio. El resultado es mucho más legible:

```sql
WITH caidas AS (
  SELECT dispositivo_id, COUNT(*) AS total
  FROM interfaces
  WHERE estado = 'down'
  GROUP BY dispositivo_id
)
SELECT d.hostname, c.total
FROM caidas c
JOIN dispositivos d ON d.id = c.dispositivo_id
WHERE c.total >= 2;
```

Puedes encadenar varias: `WITH a AS (...), b AS (...) SELECT ...`. Existen también las **CTE recursivas** (`WITH RECURSIVE`), que recorren jerarquías como un organigrama o una topología en árbol.

[[sql:subconsultas]]

::: quiz
? ¿Qué devuelve una subconsulta escalar?
+ Un único valor
- Una tabla completa
- Una lista de tablas
= Por eso puede compararse con > o = en el WHERE.

? ¿Qué operador comprueba si una subconsulta devuelve al menos una fila?
- IN
+ EXISTS
- ANY NULL
= EXISTS es verdadero en cuanto la subconsulta encuentra una fila.

? ¿Para qué sirve WITH en SQL?
+ Para dar nombre a una subconsulta y reutilizarla en la consulta
- Para crear un usuario
- Para iniciar una transacción
= Una CTE hace las consultas complejas más legibles.

? ¿Por qué se recomienda NOT EXISTS en lugar de NOT IN con subconsultas?
- Porque NOT IN no existe en SQL
+ Porque NOT IN da resultados inesperados si la subconsulta devuelve NULL
- Porque EXISTS solo funciona en SQLite
= Un NULL en la lista convierte NOT IN en desconocido para todas las filas.
:::

=== b2-modificar | Modificar datos y transacciones | 16 | 2
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

=== b2-ddl | Crear y modificar tablas: DDL y restricciones | 18 | 2
SQL tiene dos grandes partes: el **DML** (*Data Manipulation Language*: `SELECT`, `INSERT`, `UPDATE`, `DELETE`) y el **DDL** (*Data Definition Language*), que define la estructura: `CREATE`, `ALTER`, `DROP`. También se habla de **DCL** (`GRANT`, `REVOKE`: permisos) y **TCL** (`COMMIT`, `ROLLBACK`: transacciones).

## CREATE TABLE con restricciones

```sql
CREATE TABLE tecnicos (
  id        INTEGER PRIMARY KEY,
  nombre    TEXT NOT NULL,
  email     TEXT NOT NULL UNIQUE,
  nivel     INTEGER NOT NULL DEFAULT 1 CHECK (nivel BETWEEN 1 AND 3),
  sitio_id  INTEGER REFERENCES sitios(id) ON DELETE SET NULL,
  alta      TEXT DEFAULT CURRENT_DATE
);
```

| Restricción | Qué garantiza |
|---|---|
| `PRIMARY KEY` | Identificador único y no nulo |
| `NOT NULL` | La columna siempre tiene valor |
| `UNIQUE` | No hay dos filas con el mismo valor |
| `DEFAULT` | Valor por defecto si no se indica |
| `CHECK (condición)` | Solo valores que cumplan la condición |
| `REFERENCES tabla(col)` | Clave foránea: integridad referencial |
| `ON DELETE CASCADE / SET NULL / RESTRICT` | Qué pasa con las filas hijas al borrar la madre |

## ALTER TABLE: cambiar una tabla que ya existe

```sql
ALTER TABLE dispositivos ADD COLUMN numero_serie TEXT;
ALTER TABLE dispositivos RENAME COLUMN alta TO fecha_alta;
ALTER TABLE tecnicos RENAME TO personal_tecnico;
```

En producción, los cambios de esquema se hacen con **migraciones**: scripts numerados y versionados que se aplican en orden en cada entorno.

## DROP y TRUNCATE

- `DROP TABLE t;` borra la tabla **y** sus datos. `DROP TABLE IF EXISTS t;` no falla si no existe.
- `TRUNCATE TABLE t;` (no existe en SQLite) vacía la tabla muy rápido, pero la deja creada.

::: cuidado
`DROP` no tiene papelera. En producción, nunca se ejecuta sin una copia de seguridad reciente y sin revisarlo dos veces.
:::

## Índices y vistas

- **Índice:** `CREATE INDEX idx_interfaces_estado ON interfaces(estado);` acelera las búsquedas por esa columna (lo verás a fondo en el módulo de rendimiento).
- **Vista:** una consulta guardada con nombre que se usa como si fuera una tabla:

```sql
CREATE VIEW v_caidas AS
SELECT d.hostname AS hostname, i.nombre AS interfaz
FROM interfaces i JOIN dispositivos d ON d.id = i.dispositivo_id
WHERE i.estado = 'down';

SELECT * FROM v_caidas;
```

Las vistas simplifican consultas repetidas y sirven para **seguridad**: das permiso sobre la vista y no sobre las tablas con datos sensibles.

[[sql:ddl]]

::: quiz
? ¿Qué parte de SQL incluye CREATE, ALTER y DROP?
+ DDL
- DML
- DCL
= El DDL define la estructura; el DML trabaja con los datos.

? ¿Qué hace ON DELETE CASCADE en una clave foránea?
- Impide borrar la fila madre
+ Borra también las filas hijas
- Pone a NULL la clave foránea
= Al borrar la fila referenciada, se borran en cascada las que apuntan a ella.

? ¿Qué es una vista?
+ Una consulta guardada que se usa como una tabla
- Una copia de seguridad
- Un índice especial
= La vista no guarda datos propios: ejecuta su consulta cada vez.

? Quieres añadir una columna a una tabla con datos. ¿Qué usas?
- CREATE TABLE
+ ALTER TABLE ... ADD COLUMN
- UPDATE
= ALTER TABLE cambia la estructura sin perder las filas.
:::

=== b2-ventanas | Funciones de ventana (OVER) | 18 | 3
Las **funciones de ventana** calculan sobre un grupo de filas relacionadas **sin agruparlas**: cada fila conserva su detalle y además recibe un cálculo del grupo. Son de lo más valorado en entrevistas de análisis de datos.

## GROUP BY frente a OVER

```sql
-- GROUP BY: una fila por sede
SELECT sitio_id, COUNT(*) FROM dispositivos GROUP BY sitio_id;

-- OVER: todas las filas, cada una con el total de su sede
SELECT hostname, sitio_id,
       COUNT(*) OVER (PARTITION BY sitio_id) AS equipos_en_sede
FROM dispositivos;
```

- `PARTITION BY` divide las filas en grupos (como GROUP BY, pero sin juntarlas).
- `ORDER BY` dentro de `OVER` define el orden para numerar o acumular.

## Numerar y clasificar

| Función | Con empates (100, 90, 90, 80) |
|---|---|
| `ROW_NUMBER()` | 1, 2, 3, 4 (siempre distinto) |
| `RANK()` | 1, 2, 2, 4 (salta posiciones) |
| `DENSE_RANK()` | 1, 2, 2, 3 (no salta) |

```sql
-- El equipo más antiguo de cada sede
WITH ordenados AS (
  SELECT hostname, sitio_id, alta,
         ROW_NUMBER() OVER (PARTITION BY sitio_id ORDER BY alta) AS n
  FROM dispositivos
)
SELECT * FROM ordenados WHERE n = 1;
```

Este patrón ("el primero de cada grupo") es una pregunta clásica de entrevista.

## Acumulados y medias móviles

```sql
SELECT fecha, gravedad,
       COUNT(*) OVER (ORDER BY fecha) AS acumulado
FROM incidencias;
```

Con un marco (*frame*) se calculan medias móviles: `AVG(latencia) OVER (ORDER BY hora ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`.

## Mirar la fila anterior o la siguiente

`LAG(columna)` y `LEAD(columna)` devuelven el valor de la fila anterior o siguiente. Perfecto para calcular diferencias, por ejemplo cuánto ha crecido el tráfico de una interfaz respecto a la medida anterior:

```sql
SELECT hora, bytes,
       bytes - LAG(bytes) OVER (ORDER BY hora) AS incremento
FROM trafico_interfaz;
```

[[sql:ventanas]]

::: quiz
? ¿Qué diferencia hay entre GROUP BY y una función de ventana?
+ La ventana mantiene todas las filas y añade el cálculo; GROUP BY las junta
- No hay diferencia
- GROUP BY es más moderno
= Con OVER cada fila conserva su detalle.

? Con valores 100, 90, 90, 80, ¿qué devuelve RANK()?
- 1, 2, 3, 4
+ 1, 2, 2, 4
- 1, 2, 2, 3
= RANK da el mismo puesto a los empates y salta el siguiente; DENSE_RANK no salta.

? ¿Qué función devuelve el valor de la fila anterior?
+ LAG
- LEAD
- FIRST
= LAG mira hacia atrás; LEAD hacia delante.
:::
