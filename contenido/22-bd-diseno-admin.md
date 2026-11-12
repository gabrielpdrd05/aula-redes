---
area: bd
id: b3
titulo: Diseño, administración y NoSQL
dominio: Bases de datos
peso: 0
descripcion: Modelado entidad-relación, normalización, índices y rendimiento, transacciones y concurrencia, seguridad, copias y alta disponibilidad, MongoDB y Redis, bases de datos desde el código y salidas profesionales.
---

=== b3-modelado | Modelado entidad-relación: diseñar antes de crear | 18 | 2
Antes de escribir un solo `CREATE TABLE`, se dibuja el **modelo entidad-relación (E-R)**. Un buen modelo ahorra meses de problemas; uno malo obliga a parchear durante años.

## Las piezas del modelo

- **Entidad:** una "cosa" de la que guardamos datos: Cliente, Pedido, Dispositivo, Sede.
- **Atributo:** una característica de la entidad: nombre, fecha, modelo.
- **Identificador:** el atributo que distingue cada ejemplar (futura clave primaria).
- **Relación:** cómo se conectan las entidades ("una sede **tiene** dispositivos").
- **Cardinalidad:** cuántos de cada lado: 1:1, 1:N o N:M.

## De la conversación al modelo

El cliente dice: *"Tenemos varias sedes. En cada sede hay equipos de red. Los técnicos atienden incidencias de los equipos y un técnico puede trabajar en varias sedes."*

1. **Sustantivos → entidades:** Sede, Equipo, Técnico, Incidencia.
2. **Verbos → relaciones:** una sede *tiene* equipos (1:N); un equipo *sufre* incidencias (1:N); un técnico *atiende* incidencias (1:N); un técnico *trabaja en* sedes (N:M).
3. **Atributos:** de cada entidad, solo lo que hace falta de verdad.

```texto
SEDE (1) ──< tiene >── (N) EQUIPO (1) ──< sufre >── (N) INCIDENCIA
  (N)                                                       (N)
   └────< trabaja en >──── (N) TÉCNICO (1) ──< atiende >────┘
```

## Del modelo a las tablas

| Regla | Resultado |
|---|---|
| Cada entidad → una tabla | `sedes`, `equipos`, `tecnicos`, `incidencias` |
| Relación 1:N → clave foránea en el lado N | `equipos.sede_id`, `incidencias.equipo_id`, `incidencias.tecnico_id` |
| Relación N:M → tabla intermedia | `tecnico_sede(tecnico_id, sede_id)` con clave primaria compuesta |
| Atributo multivalor (varios teléfonos) → tabla aparte | `telefonos_tecnico(tecnico_id, telefono)` |

## Errores típicos de diseño

- Guardar listas en una columna (`"10,20,30"`): imposible de consultar bien. Usa una tabla relacionada.
- Repetir datos (el nombre de la sede en cada equipo): al cambiarlo, quedan copias desactualizadas. Para eso está la **normalización** (siguiente lección).
- Columnas `telefono1`, `telefono2`, `telefono3`: señal de que falta una tabla.
- No pensar en el **histórico**: si el precio cambia, ¿necesitas saber el precio de cada pedido antiguo? Entonces el pedido guarda su propio precio.

## Herramientas

dbdiagram.io, draw.io, MySQL Workbench o DBeaver generan diagramas E-R; en la notación "pata de gallo" (*crow's foot*) el lado "muchos" se dibuja con tres rayitas.

::: quiz
? En un modelo E-R, ¿qué suele convertirse en una tabla?
+ Cada entidad
- Cada atributo
- Cada consulta
= Las entidades pasan a tablas y sus atributos a columnas.

? ¿Cómo se implementa una relación N:M?
- Con una columna que guarda una lista separada por comas
+ Con una tabla intermedia que tiene dos claves foráneas
- Con dos claves primarias en la misma tabla
= La tabla intermedia une ambas entidades.

? Una tabla tiene las columnas telefono1, telefono2 y telefono3. ¿Qué indica?
+ Que falta una tabla para los teléfonos
- Que el diseño es correcto
- Que hay que usar FLOAT
= Los grupos repetidos se separan en una tabla relacionada.
:::

=== b3-diseno | Diseño: claves, normalización e índices | 18 | 3
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

=== b3-rendimiento | Índices y rendimiento de las consultas | 18 | 3
Una consulta que tarda 20 ms con 1.000 filas puede tardar 20 segundos con 10 millones. El principal motivo casi siempre es el mismo: **faltan índices** o no se usan.

## Cómo funciona un índice

Sin índice, la base de datos lee **todas** las filas (*full table scan*). Un índice es una estructura ordenada (normalmente un **árbol B**) que permite saltar directamente a las filas buscadas, como el índice alfabético de un libro.

```sql
CREATE INDEX idx_dispositivos_sitio ON dispositivos(sitio_id);
CREATE UNIQUE INDEX idx_hostname ON dispositivos(hostname);
CREATE INDEX idx_inc_disp_fecha ON incidencias(dispositivo_id, fecha);  -- compuesto
```

## Ver el plan de ejecución: EXPLAIN

El **plan** dice cómo va a ejecutar la consulta. En SQLite:

```sql
EXPLAIN QUERY PLAN
SELECT * FROM interfaces WHERE estado = 'down';
-- SCAN interfaces                          ← lee toda la tabla
-- tras crear el índice:
-- SEARCH interfaces USING INDEX idx_interfaces_estado (estado=?)
```

En PostgreSQL, `EXPLAIN ANALYZE` además ejecuta la consulta y muestra los tiempos reales. Busca *Seq Scan* en tablas grandes: suele ser el cuello de botella.

## Qué columnas indexar

- Las que aparecen en `WHERE`, en `JOIN ... ON` y en `ORDER BY` de las consultas frecuentes.
- **Las claves foráneas** (muchos gestores no las indexan solos).
- Columnas con muchos valores distintos (*alta selectividad*). Un índice sobre una columna con solo dos valores (activo sí/no) rara vez ayuda.

## Índices compuestos: el orden importa

`(dispositivo_id, fecha)` sirve para `WHERE dispositivo_id = 7` y para `WHERE dispositivo_id = 7 AND fecha > '2026-09-01'`, pero **no** para `WHERE fecha > '2026-09-01'` sola (regla del prefijo izquierdo).

## Lo que impide usar un índice

- Aplicar una función a la columna: `WHERE UPPER(hostname) = 'R1'` (solución: índice sobre la expresión o guardar el dato normalizado).
- `LIKE '%texto'` con comodín al principio.
- Comparar tipos distintos (texto con número).

## El precio de los índices

Cada índice ocupa espacio y **ralentiza** los `INSERT`, `UPDATE` y `DELETE`, porque hay que mantenerlo al día. No se indexa "todo": se indexa lo que las consultas reales necesitan.

## Otros consejos

- Pide solo las columnas necesarias (evita `SELECT *` en aplicaciones).
- Pagina los resultados (`LIMIT`/`OFFSET` o, mejor, paginación por clave).
- Cuidado con el **problema N+1**: una consulta para la lista y otra por cada elemento. Un `JOIN` lo resuelve en una sola.
- Mide antes y después: sin `EXPLAIN`, optimizar es adivinar.

::: quiz
? ¿Qué indica "SCAN" (o "Seq Scan") en un plan de ejecución?
+ Que se está leyendo toda la tabla
- Que se usa un índice
- Que la consulta ha fallado
= Un recorrido completo es lento en tablas grandes; suele indicar que falta un índice.

? Hay un índice compuesto en (dispositivo_id, fecha). ¿Qué consulta NO puede aprovecharlo bien?
- WHERE dispositivo_id = 7
- WHERE dispositivo_id = 7 AND fecha > '2026-01-01'
+ WHERE fecha > '2026-01-01'
= Un índice compuesto se usa desde su primera columna (prefijo izquierdo).

? ¿Qué desventaja tienen los índices?
+ Ocupan espacio y hacen más lentas las escrituras
- Hacen más lentas todas las lecturas
- Borran datos antiguos
= Cada INSERT/UPDATE/DELETE debe actualizar también los índices.

? ¿Qué es el problema N+1?
- Un índice duplicado
+ Hacer una consulta por cada elemento de una lista en lugar de una sola con JOIN
- Una tabla con N+1 columnas
= Muy común en aplicaciones con ORM; se soluciona cargando los datos relacionados de una vez.
:::

=== b3-transacciones | Transacciones, aislamiento y bloqueos | 18 | 3
Ya sabes que una transacción agrupa operaciones que se hacen **todas o ninguna** (ACID). Ahora veamos qué pasa cuando **muchos usuarios** trabajan a la vez sobre los mismos datos.

[[video:transaccion]]

## Repaso: ACID

| Propiedad | Significa |
|---|---|
| **A**tomicidad | Todo o nada (`COMMIT` o `ROLLBACK`) |
| **C**onsistencia | Se pasa de un estado válido a otro válido (se cumplen las restricciones) |
| a**I**slamiento | Las transacciones simultáneas no se estorban |
| **D**urabilidad | Lo confirmado sobrevive a un corte de luz (gracias al registro de transacciones) |

```sql
BEGIN;
UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;
UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2;
COMMIT;   -- o ROLLBACK si algo ha fallado
```

## Problemas de concurrencia

| Problema | Qué ocurre |
|---|---|
| **Lectura sucia** | Lees un cambio que otro aún no ha confirmado (y quizá deshaga) |
| **Lectura no repetible** | Lees una fila dos veces en la misma transacción y ha cambiado |
| **Fila fantasma** | Repites una consulta y aparecen filas nuevas |
| **Actualización perdida** | Dos usuarios leen el mismo saldo, cada uno lo modifica y el segundo pisa al primero |

## Niveles de aislamiento (estándar SQL)

| Nivel | Evita | Coste |
|---|---|---|
| READ UNCOMMITTED | Nada | Mínimo |
| READ COMMITTED (por defecto en PostgreSQL, SQL Server, Oracle) | Lecturas sucias | Bajo |
| REPEATABLE READ (por defecto en MySQL InnoDB) | + lecturas no repetibles | Medio |
| SERIALIZABLE | Todo: como si fueran en fila | Alto (más esperas y reintentos) |

## Bloqueos e interbloqueos

Para aislar, el gestor **bloquea** filas o tablas. Si la transacción A bloquea la fila 1 y espera la 2, mientras B bloquea la 2 y espera la 1, ninguna avanza: es un **interbloqueo** (*deadlock*). El gestor lo detecta y cancela una de las dos, que debe **reintentarse**.

Para evitarlos:
- Transacciones **cortas**: nunca esperes a que el usuario pulse un botón con una transacción abierta.
- Acceder a las tablas y filas **siempre en el mismo orden**.
- Bloqueo explícito cuando hace falta: `SELECT ... FOR UPDATE` (PostgreSQL, MySQL) reserva las filas que vas a modificar.

## Bloqueo optimista

En lugar de bloquear, se añade una columna `version`. Al actualizar: `UPDATE ... SET ..., version = version + 1 WHERE id = 7 AND version = 3`. Si nadie la cambió, actualiza una fila; si otro se adelantó, actualiza cero y la aplicación avisa al usuario. Es muy usado en aplicaciones web.

::: quiz
? Dos transacciones esperan cada una un recurso bloqueado por la otra. ¿Cómo se llama?
+ Interbloqueo (deadlock)
- Lectura sucia
- Fila fantasma
= El gestor lo detecta y aborta una de ellas.

? ¿Qué nivel de aislamiento evita todos los problemas de concurrencia?
- READ COMMITTED
- REPEATABLE READ
+ SERIALIZABLE
= SERIALIZABLE equivale a ejecutar las transacciones una detrás de otra, con más esperas.

? ¿Qué es una lectura sucia?
+ Leer datos que otra transacción aún no ha confirmado
- Leer una tabla sin índice
- Leer datos borrados hace tiempo
= Si la otra transacción hace ROLLBACK, habrás leído algo que nunca existió.

? ¿Qué buena práctica reduce los interbloqueos?
+ Transacciones cortas y acceso a las tablas siempre en el mismo orden
- Usar SELECT * siempre
- Desactivar las claves foráneas
= Cuanto menos dura una transacción y más predecible es su orden, menos choques.
:::

=== b3-seguridad | Seguridad en bases de datos | 16 | 3
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

=== b3-administracion | Copias de seguridad, recuperación y alta disponibilidad | 18 | 3
Los datos son lo más valioso de una empresa. Un buen administrador de bases de datos (DBA) piensa siempre en una pregunta: **"si esto se rompe ahora mismo, ¿cuánto pierdo y cuánto tardo en volver?"**

## RPO y RTO

- **RPO** (*Recovery Point Objective*): cuántos datos puedes permitirte perder. RPO de 1 hora = copias, como mínimo, cada hora.
- **RTO** (*Recovery Time Objective*): cuánto tiempo puedes estar sin servicio mientras restauras.

Un banco quiere RPO y RTO cercanos a cero; un blog personal puede vivir con un día.

## Tipos de copia

| Tipo | Qué guarda | Ventaja |
|---|---|---|
| **Completa** | Toda la base | Restauración sencilla |
| **Diferencial** | Lo cambiado desde la última completa | Restaurar = completa + última diferencial |
| **Incremental** | Lo cambiado desde la última copia de cualquier tipo | Rápida y pequeña |
| **Registro de transacciones** (WAL, binlog) | Cada cambio confirmado | Recuperar hasta un **momento exacto** (*point-in-time recovery*) |

```bash
# Copia lógica de PostgreSQL y su restauración
pg_dump -Fc inventario > inventario_2026-11-12.dump
pg_restore -d inventario_pruebas inventario_2026-11-12.dump

# MySQL
mysqldump --single-transaction inventario > inventario.sql
```

## La regla 3-2-1

**3** copias de los datos, en **2** soportes distintos y **1** fuera de la empresa (otra región de la nube, por ejemplo). Hoy se añade una cuarta idea: al menos una copia **inmutable** o desconectada, para que un ransomware no pueda cifrarla.

::: cuidado
Una copia que nunca has restaurado **no es una copia**: es una esperanza. Programa pruebas de restauración periódicas en un servidor aparte.
:::

## Alta disponibilidad: replicación

- **Réplica primaria-secundaria:** la primaria recibe las escrituras y las envía a una o varias réplicas. Si la primaria cae, se **promueve** una réplica (*failover*).
- **Síncrona** (sin pérdida, más lenta) frente a **asíncrona** (rápida, puede perder los últimos segundos).
- Las réplicas también sirven para **repartir lecturas** (informes, búsquedas).

## Escalar

- **Vertical:** un servidor más grande (más CPU y RAM). Sencillo, con un límite.
- **Horizontal:** repartir los datos entre varios servidores (**particionado** o *sharding*), por ejemplo los clientes A-M en un servidor y N-Z en otro. Potente, pero complica las consultas.

## Tareas del día a día de un DBA

Monitorizar espacio, conexiones y consultas lentas; aplicar parches; gestionar usuarios y permisos; revisar planes de ejecución; mantener estadísticas e índices (`VACUUM`/`ANALYZE` en PostgreSQL); y documentar los procedimientos de recuperación.

::: quiz
? La empresa acepta perder como mucho 15 minutos de datos. ¿Qué valor es ese?
+ El RPO
- El RTO
- El SLA de red
= El RPO mide la pérdida de datos aceptable; el RTO, el tiempo de recuperación.

? ¿Qué copia permite restaurar la base tal como estaba a las 10:42 exactas?
- Solo una copia completa semanal
+ Una copia completa más los registros de transacciones (point-in-time recovery)
- Una copia diferencial mensual
= Reproduciendo el registro de transacciones hasta ese instante.

? ¿Qué dice la regla 3-2-1?
+ 3 copias, en 2 soportes distintos, 1 fuera de la empresa
- 3 servidores, 2 réplicas, 1 primario
- 3 copias diarias, 2 semanales, 1 mensual
= Es la base de cualquier política de copias de seguridad.

? ¿Qué diferencia hay entre replicación síncrona y asíncrona?
- No hay diferencia
+ La síncrona espera a la réplica antes de confirmar (no pierde datos); la asíncrona no espera (más rápida)
- La asíncrona solo funciona en la nube
= Es un equilibrio entre seguridad de los datos y velocidad.
:::

=== b3-nosql | NoSQL en la práctica: MongoDB y Redis | 18 | 3
Ya conoces los tipos de NoSQL. Veamos cómo se trabaja con los dos más populares y cuándo de verdad compensa usarlos.

## MongoDB: documentos JSON

En MongoDB, una **base** tiene **colecciones**, y cada colección guarda **documentos** (parecidos a JSON, guardados como BSON). Los documentos de una misma colección pueden tener campos distintos.

```json
{
  "_id": "R-SDQ-01",
  "tipo": "router",
  "modelo": "ISR4331",
  "sede": { "nombre": "Sede central", "ciudad": "Santo Domingo" },
  "interfaces": [
    { "nombre": "Gi0/0/0", "estado": "up" },
    { "nombre": "Gi0/0/1", "estado": "down" }
  ]
}
```

Fíjate: la sede y las interfaces van **dentro** del documento (*embebidas*). Se lee todo de una vez, sin JOIN.

| SQL | MongoDB (mongosh) |
|---|---|
| `SELECT * FROM equipos WHERE tipo = 'router'` | `db.equipos.find({ tipo: "router" })` |
| `... AND modelo = 'ISR4331'` | `db.equipos.find({ tipo: "router", modelo: "ISR4331" })` |
| `INSERT INTO equipos ...` | `db.equipos.insertOne({ _id: "SW-01", tipo: "switch" })` |
| `UPDATE ... SET estado = 'up'` | `db.equipos.updateOne({ _id: "SW-01" }, { $set: { estado: "up" } })` |
| `DELETE FROM equipos WHERE ...` | `db.equipos.deleteOne({ _id: "SW-01" })` |
| `GROUP BY tipo` | `db.equipos.aggregate([{ $group: { _id: "$tipo", total: { $sum: 1 } } }])` |
| `CREATE INDEX` | `db.equipos.createIndex({ tipo: 1 })` |

**¿Embeber o referenciar?** Embebe lo que se lee siempre junto y no crece sin límite (las interfaces de un router). Referencia (guardar el `_id` de otro documento) lo que es compartido o puede crecer mucho (los millones de registros de tráfico).

## Redis: estructuras en memoria

Redis es un servidor clave-valor con estructuras de datos: textos, listas, conjuntos, hashes y conjuntos ordenados. Responde en fracciones de milisegundo.

```bash
SET sesion:8f2a "usuario=ana" EX 1800    # caduca en 30 minutos
GET sesion:8f2a
INCR visitas:portada                      # contador atómico
HSET equipo:R1 modelo ISR4331 estado up   # hash (como un objeto)
LPUSH cola:alertas "Gi0/1 down en SW-02"  # cola de trabajos
ZADD ranking 1520 "ana" 980 "luis"        # conjunto ordenado (rankings)
```

Usos típicos: **caché** delante de una base relacional, sesiones, límites de peticiones (*rate limiting*), colas y rankings.

## El teorema CAP

En un sistema distribuido, cuando la red se parte (**P**artición), hay que elegir entre **C**onsistencia (todos ven el mismo dato) y **D**isponibilidad (todos reciben respuesta). Muchas NoSQL eligen disponibilidad y **consistencia eventual**: los datos acaban siendo iguales en todas las copias, pero no al instante.

## ¿Cuándo NO usar NoSQL?

Cuando tus datos son claramente relacionales y necesitas transacciones entre varias entidades (pedidos, pagos, stock). Hoy PostgreSQL también guarda JSON (`JSONB`) con índices, así que muchas veces una sola base relacional cubre los dos mundos.

::: quiz
? En MongoDB, ¿cómo se buscan los equipos de tipo router?
+ db.equipos.find({ tipo: "router" })
- SELECT * FROM equipos WHERE tipo = 'router'
- GET equipos:router
= MongoDB se consulta con documentos que describen el filtro.

? ¿Para qué se usa Redis con más frecuencia?
- Para guardar facturas con transacciones complejas
+ Como caché, para sesiones y contadores
- Para dibujar diagramas E-R
= Su velocidad en memoria lo hace ideal para datos de acceso rápido.

? ¿Qué significa consistencia eventual?
+ Que las copias de los datos acaban siendo iguales, aunque no al instante
- Que los datos nunca son iguales
- Que solo hay una copia de los datos
= Es la elección de muchas bases distribuidas para mantener la disponibilidad.

? En MongoDB, ¿cuándo conviene embeber datos dentro del documento?
+ Cuando se leen siempre juntos y no crecen sin límite
- Siempre, sin excepción
- Nunca: hay que referenciar siempre
= Por ejemplo, las interfaces de un router; el histórico de tráfico, mejor aparte.
:::

=== b3-programacion | Bases de datos desde el código | 18 | 2
Las aplicaciones no usan un cliente gráfico: se conectan a la base de datos desde el código. Así se hace bien (y seguro).

## Conectar y consultar desde Python

Python trae **sqlite3** en su biblioteca estándar. Para otros gestores se usan conectores como `psycopg` (PostgreSQL) o `mysql-connector-python`, con la misma idea:

```python
import sqlite3

con = sqlite3.connect("inventario.db")
cur = con.cursor()

tipo = "switch"
cur.execute("SELECT hostname, modelo FROM dispositivos WHERE tipo = ?", (tipo,))
for hostname, modelo in cur.fetchall():
    print(hostname, modelo)

cur.execute("UPDATE incidencias SET resuelta = 1 WHERE id = ?", (6,))
con.commit()      # confirma la transacción
con.close()
```

## Consultas parametrizadas: la regla de oro

Los datos del usuario **nunca** se pegan dentro del texto SQL. Siempre como **parámetros** (`?`, `%s` o `:nombre`, según el conector):

```python
# MAL: inyección SQL. Si nombre = "x' OR '1'='1", devuelve todo
cur.execute(f"SELECT * FROM usuarios WHERE nombre = '{nombre}'")

# BIEN: el conector envía el valor por separado y nunca se ejecuta como SQL
cur.execute("SELECT * FROM usuarios WHERE nombre = ?", (nombre,))
```

La inyección SQL lleva décadas entre los fallos de seguridad más explotados. Los parámetros la eliminan.

## Desde JavaScript (Node.js)

```javascript
import pg from "pg";
const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();
const { rows } = await cliente.query(
  "SELECT hostname FROM dispositivos WHERE sitio_id = $1", [sitioId]);
```

Las credenciales nunca van escritas en el código: se leen de **variables de entorno** o de un gestor de secretos.

## ORM: objetos en lugar de SQL

Un **ORM** (*Object-Relational Mapper*) traduce entre tablas y objetos del lenguaje: SQLAlchemy y Django ORM (Python), Prisma y TypeORM (JavaScript/TypeScript), Hibernate (Java), Entity Framework (C#).

```python
# SQLAlchemy
switches = session.query(Dispositivo).filter_by(tipo="switch").all()
```

- **Ventajas:** menos código repetitivo, protección contra inyección, cambiar de gestor más fácil, migraciones automáticas.
- **Cuidado:** puede generar consultas ineficientes (el problema N+1). Hay que saber SQL igualmente para entender qué está haciendo.

## Pool de conexiones

Abrir una conexión cuesta tiempo. Las aplicaciones mantienen un **pool**: un grupo de conexiones abiertas que se reutilizan entre peticiones (PgBouncer, HikariCP, el pool del propio conector).

::: quiz
? ¿Cómo se evita la inyección SQL?
+ Con consultas parametrizadas
- Poniendo el SQL en mayúsculas
- Usando SELECT * siempre
= El valor viaja separado de la consulta y nunca se interpreta como SQL.

? ¿Qué es un ORM?
+ Una herramienta que traduce entre tablas y objetos del lenguaje
- Un tipo de índice
- Un gestor de bases de datos NoSQL
= SQLAlchemy, Prisma, Hibernate o Entity Framework son ORM.

? ¿Dónde deben ir la contraseña y la dirección de la base de datos de una aplicación?
- Escritas en el código fuente
+ En variables de entorno o un gestor de secretos
- En un comentario del código
= Así no acaban en el repositorio ni a la vista de cualquiera.

? ¿Qué hace con.commit() en Python con sqlite3?
+ Confirma los cambios de la transacción
- Cierra la conexión
- Deshace los cambios
= Sin commit, los cambios no se guardan.
:::

=== b3-carrera | Trabajar con datos: perfiles, certificaciones y cómo empezar | 12 | 1
Saber bases de datos abre muchas puertas, y no solo para quien se dedica a ellas: los técnicos de redes, los desarrolladores y los analistas las usan a diario.

## Perfiles profesionales

| Perfil | Qué hace | Herramientas habituales |
|---|---|---|
| **Administrador de bases de datos (DBA)** | Instala, protege, respalda y optimiza los gestores | SQL Server, Oracle, PostgreSQL, scripts, monitorización |
| **Desarrollador backend** | Diseña tablas y escribe las consultas de las aplicaciones | SQL, ORM, Python, Java, C#, Node.js |
| **Analista de datos** | Responde preguntas de negocio con datos | SQL, Excel, Power BI, Tableau, Python |
| **Ingeniero de datos** | Construye los flujos que mueven y transforman datos (ETL/ELT) | SQL, Python, Spark, Airflow, dbt, almacenes en la nube |
| **Científico de datos** | Modelos estadísticos y de aprendizaje automático | Python, SQL, pandas, scikit-learn |

::: nota
**SQL es el denominador común** de todos estos perfiles. Junto con Excel, es una de las habilidades técnicas más pedidas en ofertas de empleo de todo tipo.
:::

## Certificaciones reconocidas

- **Microsoft:** Azure Data Fundamentals (DP-900, de entrada), Azure Database Administrator Associate (DP-300).
- **Oracle:** Oracle Database SQL Certified Associate (1Z0-071).
- **Bases de datos en la nube:** AWS Certified Data Engineer – Associate, Google Cloud Professional Data Engineer.
- **MongoDB:** MongoDB Associate Developer y Associate DBA.
- **Análisis de datos:** Microsoft Power BI Data Analyst (PL-300).

Comprueba siempre los nombres y requisitos actuales en la web oficial: las certificaciones cambian de código cada pocos años.

## Cómo practicar y demostrar lo que sabes

1. Termina todos los ejercicios del laboratorio SQL de esta web.
2. Instala PostgreSQL y DBeaver, y monta tu propio proyecto: por ejemplo, el inventario de la red de tu casa o de un negocio conocido.
3. Practica en plataformas con ejercicios de entrevista (LeetCode Database, HackerRank SQL, SQLZoo).
4. Publica tus proyectos en GitHub con su diagrama E-R y unas cuantas consultas explicadas: es tu portafolio.

## Preguntas que te harán en una entrevista

- Diferencia entre `INNER JOIN` y `LEFT JOIN`; entre `WHERE` y `HAVING`; entre `DELETE`, `TRUNCATE` y `DROP`.
- Qué es una clave foránea y qué es la normalización (1FN, 2FN, 3FN).
- Qué es un índice y cuándo no conviene.
- Qué significa ACID y qué es un interbloqueo.
- Escribir en la pizarra: "el segundo salario más alto", "el primer pedido de cada cliente", "clientes sin pedidos".

::: quiz
? ¿Qué perfil se dedica a copias, rendimiento y seguridad de los gestores de bases de datos?
+ Administrador de bases de datos (DBA)
- Diseñador gráfico
- Técnico de cableado
= El DBA mantiene los gestores sanos, rápidos y protegidos.

? ¿Qué habilidad comparten el DBA, el analista y el ingeniero de datos?
+ SQL
- Diseño de antenas
- Configuración de OSPF
= SQL es la base común de todos los perfiles de datos.

? ¿Cuál es una buena forma de demostrar tus conocimientos sin experiencia laboral?
+ Proyectos propios publicados con su diagrama y sus consultas explicadas
- Decir que sabes SQL sin mostrar nada
- Memorizar comandos sin practicarlos
= Un portafolio en GitHub enseña lo que sabes hacer.
:::

=== b3-proyecto | Proyecto: informes sobre el inventario de red | 20 | 3
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
