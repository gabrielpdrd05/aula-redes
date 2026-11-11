# Aula de Redes

Curso interactivo de **redes** (temario completo del **Cisco CCNA 200-301**) y **bases de datos**, desde cero hasta nivel de empleo, con tutor de IA.

> No es un curso oficial de Cisco ni otorga certificación: prepara para aprobar el examen oficial.

## Qué incluye

| | |
| --- | --- |
| **72 lecciones** en 9 módulos | Los 6 dominios del CCNA con su peso real, más bases de datos/SQL y preparación para el empleo |
| **12 animaciones** paso a paso | Encapsulación, switch, ARP, TCP, DHCP, DNS, VLAN, STP, enrutamiento, NAT, ACL, OSPF |
| **Simulador de Cisco IOS** | 8 laboratorios guiados (configuración inicial, VLAN, trunk, rutas estáticas, OSPF, ACL, SSH, port security) que se corrigen sobre el estado del equipo |
| **Entrenadores** | Subnetting, binario y VLSM con ejercicios infinitos y explicación |
| **Laboratorio SQL** | SQLite en el navegador (WebAssembly) con el inventario de red de una empresa |
| **297 preguntas** | Cuestionario en cada lección y simulacro de examen ponderado por dominio, con cronómetro |
| **Tutor con IA (Claude)** | Conoce la lección que estás viendo; explica, pone ejercicios y hace entrevistas de prueba |
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

Sin configurar Supabase la web funciona igualmente en **modo invitado** (progreso guardado en el navegador; el tutor muestra las lecciones relacionadas).

## Licencias de terceros

`vendor/` incluye [supabase-js](https://github.com/supabase/supabase-js) (MIT) y [sql.js](https://github.com/sql-js/sql.js) (MIT); ver sus archivos de licencia.
