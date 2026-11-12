---
area: prog
id: p3
titulo: Programación intermedia
dominio: Programación
peso: 0
descripcion: Las herramientas y técnicas del día a día de cualquier programador: Git y GitHub, programación orientada a objetos, errores y excepciones, archivos y formatos de datos (JSON, CSV, YAML) y cómo consumir APIs web.
---

=== p3-git | Git y GitHub: control de versiones | 18 | 2
**Git** guarda la historia completa de tu código: qué cambió, cuándo, quién y por qué. Permite volver atrás, trabajar en paralelo y colaborar sin pisarse. Es obligatorio en cualquier empleo de programación (y cada vez más en redes, para guardar configuraciones).

[[video:git-flujo]]

## Conceptos

| Concepto | Qué es |
|---|---|
| **Repositorio** | La carpeta del proyecto con toda su historia |
| **Commit** | Una "foto" de los cambios, con un mensaje que explica qué y por qué |
| **Rama (branch)** | Una línea de trabajo paralela: haces cambios sin tocar la rama principal |
| **Merge** | Unir una rama con otra |
| **Remoto** | Una copia del repositorio en un servidor (GitHub, GitLab, Bitbucket) |
| **Pull request** | Petición para revisar y unir los cambios de una rama en GitHub |

## El flujo básico

```bash
git init                          # crea un repositorio (o git clone <url> para copiar uno)
git status                        # qué ha cambiado
git add inventario.py             # prepara el cambio (staging)
git commit -m "Añade el informe de interfaces caídas"
git log --oneline                 # historial

git switch -c informe-vlan        # crea una rama y se cambia a ella
# ... cambios y commits ...
git switch main
git merge informe-vlan            # une la rama

git push origin main              # sube los commits al remoto
git pull                          # trae los cambios de los demás
```

## Las tres zonas

1. **Directorio de trabajo:** tus ficheros tal como los editas.
2. **Área de preparación (staging):** lo que has marcado con `git add` para el próximo commit.
3. **Repositorio:** los commits guardados.

## Buenas prácticas

- Commits **pequeños** y con mensajes claros en presente: "Corrige el cálculo del broadcast", no "cambios".
- Una rama por tarea; la rama principal (`main`) siempre debe funcionar.
- Un fichero **`.gitignore`** para no subir lo que no toca: entornos virtuales, `node_modules`, ficheros temporales y, sobre todo, **contraseñas y claves**.

::: cuidado
Si subes una contraseña o una clave de API a GitHub, **considérala comprometida** aunque borres el commit: queda en la historia y hay robots que rastrean repositorios públicos en minutos. Cámbiala inmediatamente.
:::

## Conflictos

Si dos personas cambian la misma línea, Git no sabe cuál elegir y marca un **conflicto**:

```texto
<<<<<<< HEAD
timeout = 30
=======
timeout = 60
>>>>>>> rama-ana
```

Se edita el fichero dejando la versión correcta, se quitan las marcas y se hace commit.

## GitHub es tu portafolio

Los reclutadores miran tu perfil de GitHub. Proyectos propios con un buen `README` (qué hace, cómo se usa, una captura) valen más que muchas líneas del currículum.

::: quiz
? ¿Qué es un commit?
+ Una instantánea de los cambios con un mensaje que los explica
- Una copia del repositorio en un servidor
- Un error de Git
= Cada commit queda en la historia y se puede volver a él.

? ¿Para qué sirve una rama?
+ Para trabajar en una tarea sin tocar la línea principal
- Para borrar el historial
- Para subir el código a GitHub
= Cuando la tarea está lista, la rama se une (merge) con la principal.

? Subiste por error una contraseña a un repositorio público. ¿Qué haces?
+ Cambiar la contraseña inmediatamente (y después limpiar el historial)
- Borrar el fichero en un commit nuevo y olvidarlo
- Nada, nadie lo verá
= Una vez publicada, hay que darla por comprometida.

? ¿Qué fichero indica a Git qué no debe guardar?
+ .gitignore
- README.md
- .gitconfig del sistema
= En él se listan dependencias, temporales y secretos.
:::

=== p3-poo | Programación orientada a objetos | 18 | 2
La **programación orientada a objetos (POO)** organiza el código en **objetos** que juntan datos (atributos) y comportamiento (métodos), igual que en el mundo real un router tiene interfaces (datos) y puede encenderlas o enrutar (acciones).

## Clase y objeto

- **Clase:** el molde o plano (`Router`).
- **Objeto (instancia):** un ejemplar concreto creado a partir de la clase (`r1 = Router("R1")`).

```python
class Interfaz:
    def __init__(self, nombre, ip=None):
        self.nombre = nombre        # atributos
        self.ip = ip
        self.activa = False

    def encender(self):             # método
        self.activa = True

    def __str__(self):
        return f"{self.nombre} ({'up' if self.activa else 'down'})"

g0 = Interfaz("Gi0/0", "10.0.0.1")
g0.encender()
print(g0)        # Gi0/0 (up)
```

`self` (en JavaScript y Java, `this`) es el propio objeto.

## Los cuatro pilares

| Pilar | Idea | Ejemplo |
|---|---|---|
| **Encapsulación** | Ocultar los detalles internos y exponer solo métodos seguros | Cambiar el estado solo con `encender()`, no tocando el atributo directamente |
| **Abstracción** | Mostrar lo esencial y esconder lo complejo | `switch.guardar_config()` sin saber cómo lo hace por dentro |
| **Herencia** | Una clase hereda de otra y añade o cambia cosas | `Switch` y `Router` heredan de `Dispositivo` |
| **Polimorfismo** | Objetos distintos responden al mismo método a su manera | `d.mostrar_estado()` funciona con routers, switches y AP |

```python
class Dispositivo:
    def __init__(self, hostname):
        self.hostname = hostname

    def descripcion(self):
        return f"Dispositivo {self.hostname}"

class Switch(Dispositivo):              # hereda de Dispositivo
    def __init__(self, hostname, puertos):
        super().__init__(hostname)
        self.puertos = puertos

    def descripcion(self):              # polimorfismo: sobrescribe el método
        return f"Switch {self.hostname} de {self.puertos} puertos"

for d in [Dispositivo("X1"), Switch("SW1", 48)]:
    print(d.descripcion())
```

## En JavaScript

```javascript
class Dispositivo {
  #estado = "down";                   // campo privado (encapsulación)
  constructor(hostname) { this.hostname = hostname; }
  encender() { this.#estado = "up"; }
  get estado() { return this.#estado; }
}
class Router extends Dispositivo {}
const r1 = new Router("R1");
r1.encender();
console.log(r1.hostname, r1.estado);   // R1 up
```

## Composición frente a herencia

La herencia crea dependencias fuertes. A menudo es mejor la **composición**: un `Router` **tiene** una lista de `Interfaz` (en lugar de "es" algo). Regla práctica: usa herencia solo cuando de verdad "B es un tipo de A".

[[code:python-poo]]

[[code:js-avanzado]]

::: quiz
? ¿Qué es una clase?
+ El molde a partir del cual se crean objetos
- Un objeto concreto
- Una variable global
= La clase define atributos y métodos; cada objeto es un ejemplar.

? Switch y Router heredan de Dispositivo. ¿Qué pilar de la POO es?
- Encapsulación
+ Herencia
- Abstracción
= La subclase reutiliza y amplía lo que define la clase base.

? Distintos objetos responden al mismo método cada uno a su manera. ¿Cómo se llama?
+ Polimorfismo
- Herencia múltiple
- Recursividad
= Por ejemplo, descripcion() en Dispositivo y en Switch.

? Un router tiene interfaces. ¿Qué relación es?
+ Composición
- Herencia
- Polimorfismo
= "Tiene un/unos" es composición; "es un" es herencia.
:::

=== p3-errores | Errores y excepciones | 14 | 2
Los programas se encuentran con situaciones inesperadas: un fichero que no existe, una red que no responde, un dato mal escrito. Un buen programa **no se cae**: detecta el problema, lo gestiona y avisa con un mensaje claro.

## Excepciones

Cuando algo falla, Python lanza una **excepción**. Si nadie la captura, el programa se detiene con un *traceback*.

```python
def leer_puerto(texto):
    try:
        puerto = int(texto)
    except ValueError:
        print(f"'{texto}' no es un número")
        return None
    if not 1 <= puerto <= 65535:
        raise ValueError(f"Puerto fuera de rango: {puerto}")
    return puerto
```

| Bloque | Cuándo se ejecuta |
|---|---|
| `try` | El código que puede fallar |
| `except TipoDeError` | Si ocurre ese error concreto |
| `else` | Si no hubo ningún error |
| `finally` | Siempre, haya error o no (cerrar ficheros o conexiones) |
| `raise` | Lanzar tú mismo un error |

## Errores frecuentes en Python

| Excepción | Causa típica |
|---|---|
| `NameError` | Variable que no existe (o mal escrita) |
| `TypeError` | Operación con tipos incompatibles: `"5" + 3` |
| `ValueError` | Valor no válido: `int("abc")` |
| `KeyError` | Clave que no está en el diccionario |
| `IndexError` | Posición fuera de la lista |
| `FileNotFoundError` | El fichero no existe |
| `ZeroDivisionError` | Dividir por cero |
| `TimeoutError` / `ConnectionError` | La red no responde |

## En JavaScript

```javascript
async function estadoEquipo(ip) {
  try {
    const r = await fetch(`https://api.ejemplo.com/equipos/${ip}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.error("No se pudo consultar", ip, e.message);
    return null;
  } finally {
    console.log("Consulta terminada");
  }
}
```

## Buenas prácticas

- Captura errores **concretos** (`except ValueError`), no todos a ciegas (`except:` vacío esconde fallos reales).
- Falla pronto y con un mensaje útil: "Puerto fuera de rango: 70000" mejor que "error".
- Libera recursos siempre: en Python, `with open(...) as f:` cierra el fichero aunque haya un error.
- En automatización de redes, prevé los fallos habituales: tiempo de espera agotado, credenciales incorrectas, equipo inaccesible… y sigue con el resto de equipos.
- **Registra** (*logging*) los errores con fecha y contexto en lugar de solo imprimirlos.

```python
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logging.warning("SW-02 no responde, se reintentará")
```

::: quiz
? ¿Qué bloque se ejecuta siempre, haya error o no?
- except
- else
+ finally
= finally sirve para cerrar ficheros, conexiones, etc.

? ¿Qué excepción lanza int("abc") en Python?
+ ValueError
- KeyError
- TypeError
= El tipo es correcto (texto), pero el valor no se puede convertir.

? ¿Por qué no es buena idea un except: vacío que captura todo?
+ Porque oculta errores reales que deberían verse
- Porque es más lento
- Porque no existe en Python
= Captura errores concretos y deja que los inesperados se vean.
:::

=== p3-datos | Archivos y formatos de datos: TXT, CSV, JSON y YAML | 16 | 2
Los programas leen y escriben datos constantemente: inventarios, configuraciones, informes, respuestas de APIs. Conocer los formatos más comunes es imprescindible.

## Leer y escribir ficheros de texto

```python
# Leer línea a línea (por ejemplo, un fichero de configuración)
with open("running-config.txt", encoding="utf-8") as f:
    for linea in f:
        if linea.startswith("hostname"):
            print(linea.strip())

# Escribir (w sobrescribe, a añade al final)
with open("informe.txt", "w", encoding="utf-8") as f:
    f.write("Equipos caídos: SW-02\n")
```

`with` cierra el fichero automáticamente, incluso si hay un error. Indica siempre la **codificación** (`utf-8`) para que las tildes y la ñ no se rompan.

## CSV: tablas en texto

Valores separados por comas. Excel lo abre directamente.

```texto
hostname,ip,modelo
R1,10.0.0.1,ISR4331
SW1,10.0.0.2,C9300
```

```python
import csv
with open("inventario.csv", encoding="utf-8", newline="") as f:
    for fila in csv.DictReader(f):
        print(fila["hostname"], fila["ip"])
```

## JSON: el idioma de las APIs

```json
{
  "hostname": "R1",
  "interfaces": [
    { "nombre": "Gi0/0", "ip": "10.0.0.1", "activa": true }
  ]
}
```

```python
import json
datos = json.loads(texto)                     # texto JSON → diccionarios y listas
print(datos["interfaces"][0]["ip"])
texto = json.dumps(datos, indent=2, ensure_ascii=False)   # y al revés
```

En JavaScript: `JSON.parse(texto)` y `JSON.stringify(objeto, null, 2)`.

## YAML: configuraciones legibles

Muy usado por Ansible, Docker Compose, Kubernetes y los CI/CD. La **sangría** importa.

```yaml
sede: Santo Domingo
vlans:
  - id: 10
    nombre: VENTAS
  - id: 20
    nombre: SOPORTE
```

En Python se lee con la biblioteca externa PyYAML: `yaml.safe_load(texto)` (usa siempre `safe_load`, nunca `load`, con ficheros que no son tuyos).

## Comparativa

| Formato | Ventaja | Uso típico |
|---|---|---|
| TXT | Simple | Registros (logs), configuraciones de equipos |
| CSV | Tablas, abre en Excel | Inventarios, exportaciones |
| JSON | Estructuras anidadas, universal | APIs, ficheros de datos |
| YAML | Muy legible para personas | Configuración de herramientas (Ansible, Kubernetes) |
| XML | Esquemas estrictos | NETCONF, sistemas antiguos, documentos |

::: quiz
? ¿Para qué sirve with open(...) en Python?
+ Para abrir un fichero y cerrarlo automáticamente al terminar
- Para abrir una conexión de red
- Para crear un fichero vacío siempre
= with garantiza que el fichero se cierra aunque haya un error.

? ¿Qué función convierte un texto JSON en diccionarios y listas de Python?
+ json.loads
- json.dumps
- json.write
= loads = load string; dumps hace lo contrario.

? ¿Qué formato usan Ansible, Kubernetes y Docker Compose para su configuración?
- CSV
+ YAML
- TXT plano
= YAML es legible y admite estructuras anidadas mediante la sangría.
:::

=== p3-apis | Consumir APIs web: HTTP y REST | 18 | 2
Una **API** (*Application Programming Interface*) permite que un programa hable con otro. Las **API web REST** usan HTTP, el mismo protocolo que los navegadores: hoy la mayoría de servicios (y de equipos de red modernos) se gestionan así.

## Anatomía de una petición

| Parte | Ejemplo |
|---|---|
| **Método** | `GET` (leer), `POST` (crear), `PUT`/`PATCH` (modificar), `DELETE` (borrar) |
| **URL** (recurso) | `https://api.ejemplo.com/v1/equipos/R1` |
| **Cabeceras** | `Authorization: Bearer <token>`, `Content-Type: application/json` |
| **Cuerpo** | Los datos en JSON (en POST, PUT, PATCH) |

## Códigos de respuesta

| Código | Significado |
|---|---|
| **200** OK / **201** Created / **204** No Content | Todo bien |
| **400** Bad Request | Petición mal formada |
| **401** Unauthorized | Falta autenticarse o el token no vale |
| **403** Forbidden | Autenticado, pero sin permiso |
| **404** Not Found | El recurso no existe |
| **429** Too Many Requests | Demasiadas peticiones: espera |
| **500** / **503** | Error del servidor / servicio no disponible |

## Con Python (requests)

```python
import os
import requests

URL = "https://api.ejemplo.com/v1"
cabeceras = {"Authorization": f"Bearer {os.environ['API_TOKEN']}"}

r = requests.get(f"{URL}/equipos", headers=cabeceras, params={"estado": "down"}, timeout=10)
r.raise_for_status()                 # lanza un error si el código es 4xx o 5xx
for equipo in r.json():
    print(equipo["hostname"])

nuevo = {"hostname": "SW-05", "ip": "10.10.99.15"}
r = requests.post(f"{URL}/equipos", json=nuevo, headers=cabeceras, timeout=10)
print(r.status_code)                 # 201 si se ha creado
```

## Con JavaScript (fetch)

```javascript
const r = await fetch("https://api.ejemplo.com/v1/equipos?estado=down", {
  headers: { Authorization: `Bearer ${token}` },
});
if (!r.ok) throw new Error(`HTTP ${r.status}`);
const equipos = await r.json();
```

## Autenticación

- **Clave de API:** un texto secreto en una cabecera.
- **Token Bearer / OAuth 2.0:** un token temporal que obtienes al iniciar sesión.
- **Básica:** usuario y contraseña codificados (solo sobre HTTPS).

Los secretos van en **variables de entorno**, nunca en el código ni en Git.

## Probar APIs sin programar

**curl** en la terminal o herramientas gráficas como Postman, Insomnia o Bruno:

```bash
curl -s -H "Authorization: Bearer $API_TOKEN" "https://api.ejemplo.com/v1/equipos" | python -m json.tool
```

## APIs en el mundo de las redes

Los equipos y controladores modernos exponen APIs: **RESTCONF** y **NETCONF** (YANG) en routers Cisco IOS XE, la API de **Cisco Catalyst Center** (antes DNA Center), **Meraki Dashboard API**, y las de los fabricantes de firewalls y de la nube. Es una de las bases de la automatización de redes del CCNA y del DevNet.

::: quiz
? ¿Qué método HTTP se usa para leer datos?
+ GET
- POST
- DELETE
= GET lee; POST crea; PUT/PATCH modifican; DELETE borra.

? Una API responde 401. ¿Qué significa?
+ Falta autenticarse o el token no es válido
- El recurso no existe
- Todo ha ido bien
= 401 es "no autenticado"; 403, "autenticado pero sin permiso"; 404, "no existe".

? ¿Dónde deben guardarse los tokens de una API en tu programa?
+ En variables de entorno o un gestor de secretos
- Escritos en el código
- En el README del repositorio
= Así no acaban publicados en Git.

? ¿Qué hace r.raise_for_status() en requests?
+ Lanza un error si la respuesta es un código 4xx o 5xx
- Reintenta la petición
- Convierte la respuesta en JSON
= Evita seguir trabajando con una respuesta de error sin darte cuenta.
:::
