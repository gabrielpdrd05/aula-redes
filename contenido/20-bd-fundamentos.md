---
area: bd
id: b1
titulo: Fundamentos de bases de datos
dominio: Bases de datos
peso: 0
descripcion: Qué es una base de datos, tipos (relacionales y NoSQL), el modelo relacional, claves y relaciones, tipos de datos, los gestores más usados y tus primeras consultas SQL.
---

=== b1-intro | ¿Qué es una base de datos? | 12 | 1
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

=== b1-tipos | Tipos de bases de datos: relacionales y NoSQL | 14 | 1
No todas las bases de datos guardan la información igual. Elegir el tipo adecuado es una de las primeras decisiones de cualquier proyecto.

## Relacionales (SQL)

Guardan los datos en **tablas** con filas y columnas, y relacionan unas tablas con otras mediante **claves**. Se consultan con **SQL**. Garantizan **transacciones ACID**: o se hace todo o no se hace nada.

- **Ejemplos:** PostgreSQL, MySQL, MariaDB, Microsoft SQL Server, Oracle Database, SQLite.
- **Ideales para:** facturación, banca, inventarios, reservas… cualquier dato estructurado donde la coherencia es crítica.

## NoSQL ("no solo SQL")

Nacieron para casos donde las tablas rígidas se quedan cortas: datos muy variables, volúmenes enormes o necesidad de escalar repartiendo los datos entre muchos servidores.

| Tipo | Cómo guarda | Ejemplos | Uso típico |
|---|---|---|---|
| **Documental** | Documentos JSON con estructura flexible | MongoDB, Couchbase, Firestore | Catálogos de productos, perfiles de usuario, contenidos |
| **Clave-valor** | Un valor por cada clave, como un diccionario gigante | Redis, Amazon DynamoDB, etcd | Caché, sesiones, contadores, colas |
| **Columnar (de columnas anchas)** | Filas con columnas dinámicas, agrupadas por familias | Apache Cassandra, HBase | Telemetría, eventos, series enormes |
| **Grafos** | Nodos y relaciones entre ellos | Neo4j, Amazon Neptune | Redes sociales, rutas, detección de fraude, topologías de red |
| **Series temporales** | Medidas con fecha y hora | InfluxDB, TimescaleDB, Prometheus | Monitorización de redes y servidores, sensores |

::: nota
Las series temporales te interesan especialmente si vienes de redes: herramientas de monitorización como Prometheus o InfluxDB guardan el tráfico de cada interfaz, la CPU de cada router o la latencia de cada enlace minuto a minuto.
:::

## Otros tipos que oirás

- **Almacén de datos (data warehouse):** base de datos optimizada para analizar grandes volúmenes históricos (BigQuery, Snowflake, Amazon Redshift).
- **Base de datos en memoria:** guarda todo en RAM para responder en microsegundos (Redis, SAP HANA).
- **Bases de datos vectoriales:** guardan "embeddings" para búsquedas por similitud, muy usadas en aplicaciones de inteligencia artificial (pgvector, Pinecone, Milvus).
- **Base de datos embebida:** va dentro de la propia aplicación, sin servidor aparte. **SQLite** está en cada móvil y cada navegador; es la que usa nuestro laboratorio.

## ¿Cuál elijo?

- Datos estructurados, relaciones y coherencia → **relacional** (es la opción por defecto en la mayoría de proyectos).
- Estructura muy cambiante o documentos completos que se leen de una vez → **documental**.
- Velocidad extrema para datos sencillos y temporales → **clave-valor**.
- Las relaciones son lo importante → **grafos**.
- Muchas empresas usan **varias a la vez** (persistencia políglota): PostgreSQL para pedidos, Redis como caché e InfluxDB para métricas.

::: quiz
? ¿Qué tipo de base de datos es Redis?
- Relacional
+ Clave-valor (en memoria)
- De grafos
= Redis guarda pares clave-valor en memoria; se usa mucho como caché y para sesiones.

? Una empresa necesita que una transferencia bancaria se haga entera o no se haga. ¿Qué tipo de base de datos encaja mejor?
+ Relacional con transacciones ACID
- Clave-valor sin transacciones
- Un fichero de texto
= La atomicidad y la consistencia de las transacciones ACID son la especialidad de las bases de datos relacionales.

? ¿Qué tipo de base de datos usarías para guardar la latencia de cada enlace cada minuto durante un año?
- Grafos
+ Series temporales
- Documental
= Las bases de datos de series temporales están optimizadas para medidas con marca de tiempo.

? ¿Qué es SQLite?
+ Una base de datos relacional embebida, sin servidor
- Un servidor NoSQL documental
- Un lenguaje de programación
= SQLite es una librería que guarda toda la base de datos en un archivo y se integra dentro de la aplicación.
:::

=== b1-modelo | El modelo relacional: tablas, claves y relaciones | 16 | 1
El modelo relacional, propuesto por Edgar F. Codd en 1970, sigue siendo la base de casi todas las bases de datos empresariales. Sus piezas son pocas y muy precisas.

[[video:tablas-claves]]

## Vocabulario

| Término | Qué es | Ejemplo |
|---|---|---|
| **Tabla** (relación) | Conjunto de datos de un mismo tipo de cosa | `dispositivos` |
| **Fila** (registro, tupla) | Un elemento concreto | El router R-SDQ-01 |
| **Columna** (atributo, campo) | Una característica, con un tipo de dato | `hostname`, `modelo` |
| **Esquema** | La estructura: qué tablas, columnas y reglas hay | El diagrama de la base |
| **Dominio** | Valores permitidos en una columna | `tipo` solo puede ser router, switch, ap o firewall |

## Claves

- **Clave primaria (PRIMARY KEY):** identifica cada fila de forma **única** y nunca es NULL. Suele ser un número que se genera solo (`id`).
- **Clave candidata:** cualquier columna que también podría identificar la fila (por ejemplo `hostname`, que es único). Se protege con `UNIQUE`.
- **Clave foránea (FOREIGN KEY):** columna que apunta a la clave primaria de **otra** tabla. Es lo que **relaciona** las tablas: `dispositivos.sitio_id` apunta a `sitios.id`.
- **Clave natural frente a clave artificial:** el DNI o el número de serie son naturales; un `id` autonumérico es artificial. Las artificiales no cambian nunca, por eso se prefieren como clave primaria.

## Tipos de relaciones

| Relación | Ejemplo | Cómo se implementa |
|---|---|---|
| **Uno a muchos (1:N)** | Una sede tiene muchos dispositivos | Clave foránea en el lado "muchos" (`dispositivos.sitio_id`) |
| **Muchos a muchos (N:M)** | Un técnico atiende muchas sedes y una sede tiene muchos técnicos | **Tabla intermedia** `tecnico_sitio(tecnico_id, sitio_id)` |
| **Uno a uno (1:1)** | Un dispositivo y su contrato de soporte | Clave foránea con `UNIQUE` |

## Integridad

La base de datos **impide** datos incoherentes:
- **Integridad de entidad:** toda fila tiene una clave primaria válida.
- **Integridad referencial:** no puedes poner `sitio_id = 9` si la sede 9 no existe, ni borrar una sede que todavía tiene dispositivos (salvo que se indique `ON DELETE CASCADE`).
- **Restricciones de dominio:** `CHECK`, `NOT NULL`, tipos de datos.

```sql
CREATE TABLE dispositivos (
  id        INTEGER PRIMARY KEY,
  hostname  TEXT NOT NULL UNIQUE,
  tipo      TEXT NOT NULL CHECK (tipo IN ('router','switch','ap','firewall')),
  sitio_id  INTEGER NOT NULL REFERENCES sitios(id)
);
```

::: examen
Pregunta clásica de entrevista: "¿Qué diferencia hay entre clave primaria y clave foránea?". La primaria identifica la fila en su tabla; la foránea apunta a la primaria de otra tabla para relacionarlas.
:::

::: quiz
? ¿Qué identifica de forma única cada fila de una tabla?
+ La clave primaria
- La clave foránea
- El índice
= La PRIMARY KEY es única y no admite NULL.

? Un técnico puede atender varias sedes y una sede tiene varios técnicos. ¿Cómo se modela?
- Con una clave foránea en técnicos
+ Con una tabla intermedia
- Con una sola tabla
= Las relaciones muchos a muchos necesitan una tabla intermedia con dos claves foráneas.

? ¿Qué impide la integridad referencial?
+ Que una clave foránea apunte a una fila que no existe
- Que haya dos columnas con el mismo tipo
- Que una tabla tenga más de 1000 filas
= La base de datos rechaza referencias a filas inexistentes.

? En dispositivos(sitio_id) → sitios(id), ¿qué tipo de relación hay entre sitios y dispositivos?
- Uno a uno
+ Uno a muchos
- Muchos a muchos
= Una sede tiene muchos dispositivos; cada dispositivo está en una sola sede.
:::

=== b1-tipos-datos | Tipos de datos y el valor NULL | 12 | 1
Cada columna tiene un **tipo de dato**. Elegir bien el tipo ahorra espacio, evita errores y hace las consultas más rápidas.

## Los tipos más comunes

| Categoría | Tipos habituales (SQL estándar / MySQL / PostgreSQL) | Para qué |
|---|---|---|
| Enteros | `INTEGER`, `SMALLINT`, `BIGINT` | Identificadores, cantidades, puertos |
| Decimales exactos | `DECIMAL(10,2)`, `NUMERIC` | **Dinero** (nunca uses FLOAT para dinero) |
| Decimales aproximados | `REAL`, `FLOAT`, `DOUBLE` | Medidas científicas, latencias |
| Texto | `CHAR(n)`, `VARCHAR(n)`, `TEXT` | Nombres, descripciones |
| Fecha y hora | `DATE`, `TIME`, `TIMESTAMP` | Altas, incidencias, registros |
| Lógico | `BOOLEAN` | Activo / inactivo |
| Binario | `BLOB`, `BYTEA` | Archivos, imágenes (mejor guardarlos fuera y apuntar a ellos) |
| Especiales | `JSON`/`JSONB`, `UUID`, `INET`/`CIDR` (PostgreSQL) | Datos flexibles, identificadores globales, **direcciones IP** |

::: nota
PostgreSQL tiene tipos de red nativos: `INET` para una IP y `CIDR` para una red. Con ellos puedes preguntar "¿qué dispositivos están dentro de 10.20.0.0/16?" directamente en SQL.
:::

## Por qué no FLOAT para dinero

`0.1 + 0.2` en coma flotante da `0.30000000000000004`. Con miles de facturas, esos céntimos se acumulan. `DECIMAL` guarda el número exacto.

## NULL: "no lo sé" o "no aplica"

`NULL` no es cero ni texto vacío: significa **ausencia de valor**. Tiene reglas propias:
- Cualquier comparación con NULL da "desconocido": `vlan = NULL` **nunca** es verdadero. Se usa `vlan IS NULL` o `IS NOT NULL`.
- `COUNT(*)` cuenta filas; `COUNT(columna)` **no cuenta** los NULL.
- `COALESCE(columna, 'valor')` sustituye el NULL por un valor.
- `NOT NULL` en la definición de la columna lo prohíbe.

```sql
SELECT nombre, COALESCE(CAST(vlan AS TEXT), 'enrutada') AS vlan
FROM interfaces
WHERE vlan IS NULL;
```

## SQLite es flexible con los tipos

SQLite usa "afinidad de tipos": guarda lo que le das aunque no coincida exactamente con el tipo declarado. MySQL o PostgreSQL son estrictos. Por eso conviene validar siempre con `CHECK`.

::: quiz
? ¿Qué tipo usarías para guardar precios?
- FLOAT
+ DECIMAL(10,2)
- TEXT
= DECIMAL guarda el valor exacto; FLOAT tiene errores de redondeo.

? ¿Cómo se buscan las filas en las que vlan no tiene valor?
- WHERE vlan = NULL
+ WHERE vlan IS NULL
- WHERE vlan = 0
= Cualquier comparación con = NULL es desconocida; hay que usar IS NULL.

? Una tabla tiene 10 filas y 3 tienen NULL en email. ¿Cuánto da COUNT(email)?
- 10
+ 7
- 3
= COUNT(columna) ignora los NULL.
:::

=== b1-sgbd | Los gestores de bases de datos más usados | 14 | 1
Un **SGBD** (sistema gestor de bases de datos, en inglés DBMS) es el programa que guarda los datos, ejecuta las consultas, controla los permisos y garantiza que nada se corrompa.

## Los más importantes

| Gestor | Tipo | Licencia | Dónde lo encontrarás |
|---|---|---|---|
| **PostgreSQL** | Relacional | Libre | Startups, empresas tecnológicas, administración pública; muy completo y estándar |
| **MySQL** / **MariaDB** | Relacional | Libre (MySQL con licencia dual de Oracle) | Webs y aplicaciones (WordPress, tiendas online) |
| **Microsoft SQL Server** | Relacional | Comercial (edición Express gratuita) | Empresas con tecnología Microsoft, ERP |
| **Oracle Database** | Relacional | Comercial | Banca, telecomunicaciones, grandes corporaciones |
| **SQLite** | Relacional embebida | Dominio público | Móviles, navegadores, aplicaciones de escritorio, IoT |
| **MongoDB** | Documental | Licencia SSPL / servicio Atlas | Aplicaciones web y móviles con datos flexibles |
| **Redis** | Clave-valor en memoria | Licencias propias (y la bifurcación libre Valkey) | Caché, sesiones, colas |
| **Elasticsearch** / **OpenSearch** | Motor de búsqueda | Licencias propias / libre | Búsqueda de texto, análisis de registros (logs) |

## Servicios en la nube

Las nubes ofrecen estos gestores **gestionados**: el proveedor se encarga de instalar, parchear, hacer copias y replicar.
- **AWS:** RDS (PostgreSQL, MySQL, SQL Server, Oracle), Aurora, DynamoDB.
- **Azure:** Azure SQL Database, Cosmos DB.
- **Google Cloud:** Cloud SQL, Spanner, Firestore, BigQuery.

## El SQL es (casi) el mismo en todos

El estándar SQL es común, pero cada gestor tiene su "dialecto":

| Operación | PostgreSQL / SQLite / MySQL | SQL Server | Oracle |
|---|---|---|---|
| Las 5 primeras filas | `LIMIT 5` | `SELECT TOP 5 …` | `FETCH FIRST 5 ROWS ONLY` |
| Concatenar texto | operador de doble barra (MySQL: `CONCAT()`) | `+` o `CONCAT()` | operador de doble barra |
| Id autonumérico | `SERIAL`/`IDENTITY`, `AUTO_INCREMENT` | `IDENTITY` | `IDENTITY` o secuencias |

El operador de doble barra se escribe así: `SELECT 'R-' || 'SDQ';` → `R-SDQ`.

Si dominas el SQL estándar, cambiar de gestor es cuestión de días.

## Herramientas para trabajar

- **Clientes gráficos:** DBeaver (gratuito, sirve para casi todos), pgAdmin, MySQL Workbench, SQL Server Management Studio, Azure Data Studio.
- **Línea de comandos:** `psql`, `mysql`, `sqlcmd`, `sqlite3`.

::: practica
Instala **DBeaver** y **PostgreSQL** (o usa Docker: `docker run -e POSTGRES_PASSWORD=clave -p 5432:5432 postgres`) y repite los ejercicios del laboratorio SQL en un gestor "de verdad".
:::

::: quiz
? ¿Qué gestor usa nuestro laboratorio SQL dentro del navegador?
+ SQLite
- Oracle
- MongoDB
= SQLite compilado a WebAssembly (sql.js).

? En SQL Server, ¿cómo se piden las 5 primeras filas?
- LIMIT 5
+ SELECT TOP 5
- ROWNUM 5
= SQL Server usa TOP; PostgreSQL, MySQL y SQLite usan LIMIT.

? ¿Qué ventaja tiene una base de datos gestionada en la nube (como Amazon RDS)?
+ El proveedor se encarga de parches, copias y replicación
- Es siempre gratuita
- No necesita SQL
= Reduces el trabajo de administración, aunque pagas por el servicio.
:::

=== b1-select | SQL I: consultar datos con SELECT | 18 | 1
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
