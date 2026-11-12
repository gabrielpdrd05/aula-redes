# Aula de Redes

Plataforma de aprendizaje con **tres áreas completas**, de principiante a nivel de empleo: **Redes** (temario completo del **Cisco CCNA 200-301**), **Bases de datos** y **Programación**.

> No es un curso oficial de Cisco ni otorga certificación: prepara para aprobar el examen oficial.

## Qué incluye

| | |
| --- | --- |
| **120 lecciones** en 3 áreas y 3 niveles | **Redes** (68 lecciones, los 6 dominios del CCNA), **Bases de datos** (23: modelo relacional, SQL completo, diseño, rendimiento, transacciones, administración, NoSQL) y **Programación** (29: fundamentos, los lenguajes más usados, Git, POO, APIs, algoritmos, código seguro, web y automatización de redes) |
| **Laboratorio de código** | Python (Pyodide) y JavaScript ejecutados en el navegador, en un entorno aislado; 9 bloques de ejercicios corregidos automáticamente y zonas libres |
| **12 animaciones** paso a paso | Encapsulación, switch, ARP, TCP, DHCP, DNS, VLAN, STP, enrutamiento, NAT, ACL, OSPF |
| **Simulador de Cisco IOS** | 12 laboratorios guiados (router, switch, VLAN, trunk, router-on-a-stick, rutas estáticas, OSPF, DHCP, NAT, ACL, SSH, port security) y 8 de averías (puerto, trunk, dúplex, gestión, rutas, OSPF, SSH, ACL). Se corrigen sobre el estado del equipo; Tab autocompleta y hay pistas |
| **Guía de comandos** | 82 comandos de IOS por tema y nivel: qué hacen, en qué modo, un ejemplo y el laboratorio donde practicarlos |
| **Entrenadores** | Subnetting, binario y VLSM con ejercicios infinitos y explicación |
| **Laboratorio SQL** | SQLite en el navegador (WebAssembly) con el inventario de red de una empresa: 9 bloques, de SELECT a funciones de ventana y DDL |
| **464 preguntas** | Cuestionario en cada lección y simulacro de examen por área (en Redes, ponderado por dominio del CCNA), con cronómetro |
| **Buscador del curso** | Desde cualquier página, encuentra las lecciones y el fragmento que responden a una duda |
| **Tutor con IA (Claude), opcional** | Desactivado por defecto (la API de Anthropic se paga por uso). Se activa con `"tutorIA": true` en `config.json`; ver la guía |
| **Cuentas** | Registro con confirmación por correo, verificación en dos pasos, progreso sincronizado |

## Lenguajes y tecnologías

- **HTML, CSS y JavaScript** (módulos ES, sin frameworks) para la web.
- **Python** compila el temario (`contenido/*.md` → `data/*.json`).
- **SQL (PostgreSQL)** para la base de datos con seguridad a nivel de fila.
- **TypeScript (Deno)** para la función del servidor que habla con Claude.
- **SQL (SQLite/WebAssembly)** en el laboratorio de bases de datos.
- **YAML** para la integración continua en GitHub Actions.

## Seguridad

- Política de seguridad de contenidos (**CSP**) estricta en todas las páginas: sin scripts en línea, solo se conecta con el propio sitio y con Supabase. Protección contra *clickjacking*.
- El DOM se construye sin `innerHTML`; las respuestas de la IA se muestran con un renderizador de Markdown propio que solo crea texto.
- **Row Level Security** forzada en todas las tablas: cada alumno solo puede leer y escribir lo suyo. Si activa la verificación en dos pasos, sus datos exigen una sesión verificada (aal2).
- El código que escriben los alumnos se ejecuta en un `iframe` con `sandbox="allow-scripts"` (origen opaco) y dentro de un Worker con tiempo límite: no puede leer la sesión, las cookies ni el almacenamiento de la web.
- La clave de Anthropic vive solo como secreto de la función de Supabase. La función valida el JWT, exige correo confirmado, limita los mensajes diarios de forma atómica en la base de datos, limita tamaños y solo acepta peticiones del dominio del curso (cerrado por defecto).
- Contraseñas de 12+ caracteres, recuperación sin revelar qué correos existen, cierre de sesión en todos los dispositivos y eliminación de la cuenta.
- Las pruebas automáticas comprueban la CSP, que no haya código inseguro ni claves en el repositorio, y las reglas RLS sobre un PostgreSQL real.

## Trabajar en el proyecto

```bash
npm install          # solo para las pruebas de la base de datos
npm run build        # compila el temario y genera las páginas
npm test             # pruebas
python3 -m http.server 8000   # y abre http://localhost:8000
```

- El temario está en `contenido/*.md` (formato explicado al principio de `scripts/build_curso.py`).
- Las páginas se editan en `src/paginas/*.html`; `node scripts/paginas.mjs` genera las del directorio raíz con la cabecera, el pie y la CSP.
- Para activar cuentas y tutor, sigue **[docs/CONFIGURAR.md](docs/CONFIGURAR.md)**.

Sin configurar Supabase la web funciona igualmente en **modo invitado** (progreso guardado en el navegador).

## Licencias de terceros

`vendor/` incluye [supabase-js](https://github.com/supabase/supabase-js) (MIT), [sql.js](https://github.com/sql-js/sql.js) (MIT) y [Pyodide](https://github.com/pyodide/pyodide) 0.27.7 (MPL-2.0, ficheros sin modificar); ver sus archivos de licencia.
