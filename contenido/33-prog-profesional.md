---
area: prog
id: p4
titulo: Programación profesional
dominio: Programación
peso: 0
descripcion: Lo que separa un aficionado de un profesional: estructuras de datos y algoritmos, complejidad, pruebas automáticas, código seguro, cómo funciona una aplicación web de verdad, automatización de redes con Python, programar con IA y cómo conseguir tu primer empleo.
---

=== p4-estructuras | Estructuras de datos: pilas, colas, árboles, grafos y tablas hash | 18 | 3
Elegir la estructura de datos adecuada puede convertir un programa lento en uno instantáneo. Estas son las que aparecen una y otra vez en el trabajo y en las entrevistas.

## Pila (stack): el último en entrar, el primero en salir (LIFO)

Como una pila de platos. Operaciones: `push` (apilar) y `pop` (desapilar).

```python
pila = []
pila.append("abrir conexión")
pila.append("entrar en modo config")
print(pila.pop())     # "entrar en modo config"
```

Usos: el botón "deshacer", la pila de llamadas de las funciones, comprobar paréntesis equilibrados, el historial "atrás" del navegador.

## Cola (queue): el primero en entrar, el primero en salir (FIFO)

Como la cola del supermercado. Las colas de los routers (QoS) y los sistemas de trabajos funcionan así.

```python
from collections import deque
cola = deque(["SW1", "SW2"])
cola.append("SW3")      # entra por el final
print(cola.popleft())   # sale por delante: "SW1"
```

## Tabla hash (diccionario)

Guarda pares clave → valor y encuentra cualquier clave en tiempo **constante** (casi instantáneo), sin recorrer nada. Es lo que hay debajo de los `dict` de Python, los objetos y `Map` de JavaScript… y de la **tabla de direcciones MAC** de un switch.

## Lista enlazada

Cada elemento apunta al siguiente. Insertar o borrar al principio es muy rápido, pero acceder al elemento 500 obliga a recorrer los 499 anteriores.

## Árbol

Estructura jerárquica: un nodo raíz con hijos, que a su vez tienen hijos. Ejemplos: el sistema de ficheros, el DOM de una página web, las jerarquías de una empresa.
- **Árbol binario de búsqueda:** a la izquierda los menores, a la derecha los mayores; búsqueda rápida si está equilibrado.
- **Árbol B:** el que usan los **índices** de las bases de datos.
- **Trie:** árbol de prefijos; los routers buscan la ruta más específica (*longest prefix match*) con estructuras de este tipo.

## Grafo

Nodos unidos por aristas, con o sin peso. **Una red es un grafo**: routers (nodos) y enlaces (aristas con coste). **OSPF** calcula las mejores rutas con el algoritmo de Dijkstra sobre ese grafo.

```python
red = {
    "R1": {"R2": 10, "R3": 1},
    "R2": {"R1": 10, "R3": 1, "R4": 1},
    "R3": {"R1": 1, "R2": 1},
    "R4": {"R2": 1},
}
```

## Resumen

| Estructura | Buscar | Insertar | Ideal para |
|---|---|---|---|
| Lista / array | Lento (recorre) salvo por posición | Rápido al final | Colecciones ordenadas |
| Tabla hash | **Muy rápido** | Muy rápido | Buscar por clave |
| Pila / cola | Solo el extremo | Muy rápido | Orden de procesamiento |
| Árbol de búsqueda equilibrado | Rápido | Rápido | Datos ordenados, rangos |
| Grafo | Depende del algoritmo | — | Redes, rutas, relaciones |

::: quiz
? ¿Qué estructura sigue la regla "el último en entrar, el primero en salir"?
+ Pila
- Cola
- Grafo
= LIFO (pila); FIFO (cola).

? ¿Qué estructura de datos hay detrás de un diccionario de Python?
+ Una tabla hash
- Una lista enlazada
- Una pila
= Por eso encontrar una clave es prácticamente instantáneo.

? ¿Qué estructura representa mejor una red de routers con enlaces de distinto coste?
- Una pila
+ Un grafo con pesos
- Una cola
= OSPF aplica el algoritmo de Dijkstra sobre ese grafo.
:::

=== p4-algoritmos | Algoritmos y complejidad: la notación Big O | 18 | 3
Dos programas pueden dar el mismo resultado y uno tardar un segundo y el otro un día. La **complejidad** mide cómo crece el tiempo (o la memoria) cuando crecen los datos. Se expresa con la notación **Big O**.

[[video:busqueda]]

## Las complejidades más comunes

| Big O | Nombre | Ejemplo | Con 1.000 datos | Con 1.000.000 |
|---|---|---|---|---|
| O(1) | Constante | Buscar en un diccionario | 1 paso | 1 paso |
| O(log n) | Logarítmica | Búsqueda binaria en una lista ordenada | ~10 | ~20 |
| O(n) | Lineal | Recorrer una lista una vez | 1.000 | 1.000.000 |
| O(n log n) | Casi lineal | Buenos algoritmos de ordenación | ~10.000 | ~20 millones |
| O(n²) | Cuadrática | Dos bucles anidados sobre los mismos datos | 1 millón | 1 billón |
| O(2ⁿ) | Exponencial | Probar todas las combinaciones | Imposible | Imposible |

## Búsqueda lineal frente a binaria

```python
def busqueda_lineal(lista, objetivo):          # O(n)
    for i, x in enumerate(lista):
        if x == objetivo:
            return i
    return -1

def busqueda_binaria(lista, objetivo):         # O(log n), la lista debe estar ordenada
    izq, der = 0, len(lista) - 1
    while izq <= der:
        medio = (izq + der) // 2
        if lista[medio] == objetivo:
            return medio
        if lista[medio] < objetivo:
            izq = medio + 1
        else:
            der = medio - 1
    return -1
```

Buscar entre un millón de elementos: hasta un millón de comparaciones frente a unas 20.

## Ordenar

- Algoritmos sencillos (burbuja, inserción): O(n²). Sirven para aprender.
- **Merge sort**, **quicksort**, **Timsort** (el de Python y Java): O(n log n).
- En la práctica, usa el del lenguaje (`sorted()`, `arr.sort()`): está muy optimizado.

## Un ejemplo real

"¿Qué IP de la lista A aparecen también en la lista B?" (10.000 en cada una):

```python
# O(n²): 100 millones de comparaciones
comunes = [ip for ip in a if ip in b]          # "in" sobre una lista recorre la lista

# O(n): convertir B en un conjunto (tabla hash) y buscar al instante
b_set = set(b)
comunes = [ip for ip in a if ip in b_set]
```

Cambiar una línea convierte minutos en milisegundos.

## Técnicas de resolución que conviene conocer

- **Divide y vencerás:** partir el problema (merge sort, búsqueda binaria).
- **Recursividad:** una función que se llama a sí misma con un caso más pequeño, hasta un caso base.
- **Programación dinámica:** guardar resultados intermedios para no recalcularlos.
- **Algoritmos voraces:** elegir lo mejor en cada paso (como Dijkstra para el camino más corto).
- **Recorridos de grafos:** en anchura (BFS) y en profundidad (DFS).

::: quiz
? ¿Qué complejidad tiene buscar una clave en un diccionario?
+ O(1)
- O(n)
- O(n²)
= Las tablas hash encuentran la clave sin recorrer los datos.

? ¿Qué requisito tiene la búsqueda binaria?
+ Que la lista esté ordenada
- Que la lista tenga menos de 100 elementos
- Que los datos sean texto
= Descarta la mitad en cada paso gracias al orden.

? Dos bucles anidados que recorren la misma lista de n elementos tienen una complejidad…
- O(n)
- O(log n)
+ O(n²)
= Por cada elemento se recorre toda la lista otra vez.

? ¿Qué es una función recursiva?
+ Una función que se llama a sí misma con un problema más pequeño
- Una función que nunca termina
- Una función sin parámetros
= Necesita un caso base para detenerse.
:::

=== p4-pruebas | Pruebas automáticas y calidad del código | 16 | 3
Un programador profesional no "prueba a mano a ver si funciona": escribe **pruebas automáticas** que se ejecutan en segundos cada vez que cambia algo. Así se puede modificar el código sin miedo a romperlo.

## Tipos de pruebas

| Tipo | Qué prueba | Cuántas |
|---|---|---|
| **Unitarias** | Una función o clase aislada | Muchas, rapidísimas |
| **De integración** | Varias piezas juntas (código + base de datos, + API) | Unas cuantas |
| **De extremo a extremo (E2E)** | La aplicación completa como un usuario (abrir el navegador, pulsar botones) | Pocas, las más lentas |

Es la **pirámide de pruebas**: muchas unitarias en la base y pocas E2E en la cima.

## Una prueba unitaria con pytest

```python
# red.py
def hosts_utiles(prefijo):
    if not 0 <= prefijo <= 32:
        raise ValueError("Prefijo no válido")
    if prefijo >= 31:
        return 2 ** (32 - prefijo)
    return 2 ** (32 - prefijo) - 2

# test_red.py
import pytest
from red import hosts_utiles

def test_redes_normales():
    assert hosts_utiles(24) == 254
    assert hosts_utiles(30) == 2

def test_enlace_punto_a_punto():
    assert hosts_utiles(31) == 2

def test_prefijo_invalido():
    with pytest.raises(ValueError):
        hosts_utiles(40)
```

```bash
pytest -q        # ...  3 passed in 0.02s
```

En JavaScript se usan Jest, Vitest o el ejecutor integrado de Node (`node --test`); en Java, JUnit; en C#, xUnit o NUnit.

::: nota
Los ejercicios del laboratorio de código de esta web funcionan exactamente así: tu función se ejecuta contra varias pruebas y cada una dice si el resultado es el esperado.
:::

## Qué probar

- El caso normal, los **casos límite** (0, vacío, el máximo, /31 y /32) y las entradas no válidas.
- Cada error que encuentres: escribe primero la prueba que lo reproduce y después arréglalo, para que no vuelva.

## TDD: primero la prueba

En el **desarrollo guiado por pruebas** (*Test-Driven Development*): 1) escribes una prueba que falla, 2) escribes el código mínimo para que pase, 3) mejoras el código manteniendo las pruebas en verde.

## Calidad automática

- **Linters** (Ruff, ESLint): detectan errores y malas prácticas.
- **Formateadores** (Black, Prettier): todo el equipo escribe con el mismo estilo.
- **Integración continua (CI):** GitHub Actions o GitLab CI ejecutan las pruebas en cada `push`; si algo falla, no se publica. Esta misma web se comprueba así antes de cada publicación.
- **Revisión de código** (*code review*): otra persona revisa cada cambio antes de unirlo.

## Código limpio

- Nombres que se explican solos; funciones cortas que hacen una sola cosa.
- Comentarios que explican **por qué**, no qué (el qué ya lo dice el código).
- Nada de números mágicos: `TIEMPO_ESPERA = 30` en lugar de un `30` suelto.

::: quiz
? ¿Qué prueba una prueba unitaria?
+ Una función o clase de forma aislada
- La aplicación entera desde el navegador
- Solo el diseño de la página
= Son rápidas y deben ser las más numerosas.

? En TDD, ¿qué se escribe primero?
+ Una prueba que falla
- Todo el código
- La documentación
= Rojo (falla), verde (pasa), refactorizar.

? ¿Qué hace la integración continua (CI)?
+ Ejecuta automáticamente las pruebas con cada cambio subido
- Une ramas sin revisar
- Escribe las pruebas por ti
= Si algo falla, el cambio no se publica.
:::

=== p4-seguridad | Programar de forma segura | 18 | 3
La mayoría de los ataques no rompen la criptografía: aprovechan **errores de programación**. El proyecto **OWASP** publica el famoso Top 10 de riesgos de las aplicaciones web. Estos son los fallos que todo programador debe saber evitar.

## Los fallos más comunes y cómo evitarlos

| Fallo | Qué ocurre | Cómo se evita |
|---|---|---|
| **Inyección** (SQL, comandos) | Datos del usuario se ejecutan como código | Consultas parametrizadas; nunca construir comandos con texto del usuario |
| **Control de acceso roto** | Un usuario ve o cambia datos de otro cambiando un id en la URL | Comprobar **en el servidor** que cada recurso pertenece a quien lo pide |
| **Fallos criptográficos** | Contraseñas en claro, HTTP sin cifrar | HTTPS siempre; contraseñas con hash lento (bcrypt, Argon2) |
| **XSS** (*cross-site scripting*) | El texto de un usuario se inserta como HTML y ejecuta JavaScript en otros navegadores | Escapar la salida; insertar texto como texto (`textContent`, no `innerHTML`); política CSP |
| **Configuración insegura** | Contraseñas por defecto, errores con detalles internos visibles | Revisar la configuración; mensajes de error genéricos al usuario |
| **Componentes vulnerables** | Bibliotecas con fallos conocidos | Actualizar dependencias; `pip-audit`, `npm audit`, Dependabot |
| **Fallos de autenticación** | Fuerza bruta, sesiones que no caducan | Límite de intentos, MFA, sesiones con caducidad |
| **Secretos en el código** | Claves de API publicadas en GitHub | Variables de entorno y gestores de secretos |

## Inyección de comandos: un ejemplo de redes

```python
import subprocess

ip = input("IP a comprobar: ")

# MAL: si alguien escribe  8.8.8.8; rm -rf /  se ejecuta también el segundo comando
subprocess.run(f"ping -c 1 {ip}", shell=True)

# BIEN: validar la entrada y pasar los argumentos como lista, sin shell
import ipaddress
ipaddress.ip_address(ip)                       # lanza ValueError si no es una IP
subprocess.run(["ping", "-c", "1", ip], check=False)
```

## Principios generales

- **No confíes nunca en la entrada:** valida tipo, longitud y formato de todo lo que llega del usuario, de ficheros o de la red. Mejor una lista de lo permitido que de lo prohibido.
- **Mínimo privilegio:** el programa y su usuario de base de datos solo pueden hacer lo imprescindible.
- **Defensa en profundidad:** varias capas (validación + consultas parametrizadas + permisos + cortafuegos).
- **Falla de forma segura:** ante un error, deniega el acceso; no lo concedas por defecto.
- **No inventes tu propia criptografía:** usa bibliotecas reconocidas.

::: nota
Esta misma plataforma aplica estas reglas: política CSP estricta, sin `innerHTML`, permisos por fila en la base de datos y el código de los alumnos ejecutado en un entorno aislado sin acceso a la sesión.
:::

::: quiz
? ¿Qué es XSS?
+ Que un texto introducido por un usuario se ejecute como código JavaScript en el navegador de otros
- Un tipo de base de datos
- Un ataque de denegación de servicio
= Se evita insertando el texto como texto y con una política CSP.

? ¿Cómo se deben guardar las contraseñas de los usuarios?
- En texto plano para poder recuperarlas
- Cifradas con una clave guardada en el código
+ Con un hash lento diseñado para contraseñas (bcrypt, Argon2)
= Así, aunque roben la base de datos, no obtienen las contraseñas.

? Un usuario cambia /factura/1001 por /factura/1002 en la URL y ve la factura de otro. ¿Qué fallo es?
+ Control de acceso roto
- Inyección SQL
- Fallo criptográfico
= El servidor debe comprobar que el recurso pertenece al usuario.

? ¿Cuál es la forma segura de ejecutar ping con una IP escrita por el usuario?
+ Validar que es una IP y pasar los argumentos como lista, sin shell
- Usar shell=True para que funcione en todos los sistemas
- Confiar en que el usuario escribe bien
= Así es imposible encadenar otros comandos.
:::

=== p4-web | Cómo funciona una aplicación web de verdad | 16 | 2
Casi todo el software actual es una aplicación web o se comunica con una. Entender la arquitectura completa te sitúa, sea cual sea tu especialidad.

## Las piezas

```texto
Navegador (frontend)  ──HTTPS──▶  Servidor web / API (backend)  ──▶  Base de datos
 HTML, CSS, JS                    Python, Node.js, Java, C#, PHP       PostgreSQL, MySQL, Redis
   React, Vue                      Django, Express, Spring, ASP.NET
```

| Capa | Responsabilidad | Tecnologías |
|---|---|---|
| **Frontend** | Lo que el usuario ve y toca | HTML, CSS, JavaScript/TypeScript, React, Vue, Angular |
| **Backend** | Lógica, permisos, cálculos; expone una API | Python (Django, FastAPI), Node.js (Express), Java (Spring), C# (ASP.NET), PHP (Laravel), Go |
| **Base de datos** | Guardar los datos de forma segura | PostgreSQL, MySQL, MongoDB, Redis |
| **Infraestructura** | Dónde y cómo se ejecuta todo | Servidores, contenedores, nube, CDN, balanceadores |

Un desarrollador **full stack** trabaja en frontend y backend.

## Qué pasa cuando abres una web

1. **DNS** traduce el nombre (`ejemplo.com`) a una IP.
2. Se abre una conexión **TCP** (puerto 443) y se negocia **TLS** (el candado de HTTPS).
3. El navegador envía una petición **HTTP** `GET`.
4. El servidor ejecuta el código del backend, que consulta la base de datos.
5. Devuelve HTML o JSON; el navegador dibuja la página y ejecuta su JavaScript.

Cada paso es materia de tu curso de redes: DNS, TCP, puertos, TLS, NAT, cortafuegos y balanceo.

## Despliegue: de tu ordenador a internet

- **Contenedores (Docker):** empaquetan la aplicación con todo lo que necesita, para que funcione igual en cualquier sitio.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- **Orquestación (Kubernetes):** gestiona cientos de contenedores, los reinicia si fallan y los escala con la demanda.
- **Nube (AWS, Azure, Google Cloud)** y plataformas sencillas para empezar (GitHub Pages para webs estáticas como esta, Render, Railway, Vercel, Netlify).
- **CI/CD:** cada cambio en Git pasa por pruebas automáticas y se despliega solo.

## Una API mínima con FastAPI (Python)

```python
from fastapi import FastAPI

app = FastAPI()
EQUIPOS = {"R1": "up", "SW1": "down"}

@app.get("/equipos/{hostname}")
def estado(hostname: str):
    return {"hostname": hostname, "estado": EQUIPOS.get(hostname, "desconocido")}
```

::: quiz
? ¿Qué capa de una aplicación web se ejecuta en el navegador del usuario?
+ El frontend
- El backend
- La base de datos
= El frontend usa HTML, CSS y JavaScript; el backend se ejecuta en el servidor.

? ¿Qué es lo primero que ocurre al escribir una dirección web en el navegador?
+ La resolución DNS del nombre
- La consulta a la base de datos
- La ejecución del JavaScript
= Sin la IP del servidor no se puede conectar.

? ¿Para qué sirve Docker?
+ Para empaquetar una aplicación con todo lo que necesita y ejecutarla igual en cualquier sitio
- Para diseñar páginas web
- Para sustituir a la base de datos
= Los contenedores eliminan el "en mi ordenador funciona".
:::

=== p4-redes | Automatizar redes con Python | 20 | 3
Aquí se unen tus dos mundos. Configurar 300 switches a mano lleva días y genera errores; un script lo hace en minutos y siempre igual. La automatización forma parte del temario del CCNA y es una de las habilidades mejor pagadas en redes.

## El camino de la automatización

1. **Scripts** que se conectan por SSH, envían comandos y leen la salida (Netmiko).
2. **Plantillas** que generan configuraciones a partir de datos (Jinja2 + YAML).
3. **APIs** de los equipos y controladores (RESTCONF, NETCONF, Meraki, Catalyst Center).
4. **Herramientas declarativas** (Ansible, Terraform, Nornir) y **fuente de verdad** (NetBox).

## Netmiko: SSH a equipos de red

```python
import os
from netmiko import ConnectHandler

equipo = {
    "device_type": "cisco_ios",
    "host": "10.10.99.11",
    "username": "admin",
    "password": os.environ["CLAVE_RED"],
}

with ConnectHandler(**equipo) as con:
    salida = con.send_command("show ip interface brief")
    print(salida)
    cambios = con.send_config_set([
        "interface Gi1/0/10",
        "description Impresora planta 2",
        "switchport access vlan 10",
    ])
    con.save_config()
```

## Leer la salida de forma estructurada

Recortar texto a mano es frágil. Con `use_textfsm=True` (plantillas NTC) o con **Genie** (de Cisco), la salida de `show` se convierte en una lista de diccionarios:

```python
interfaces = con.send_command("show ip interface brief", use_textfsm=True)
caidas = [i["interface"] for i in interfaces if i["status"] == "down"]
```

## Muchos equipos a la vez

```python
from concurrent.futures import ThreadPoolExecutor

def copia(ip):
    with ConnectHandler(**{**plantilla, "host": ip}) as con:
        config = con.send_command("show running-config")
    with open(f"backup_{ip}.txt", "w", encoding="utf-8") as f:
        f.write(config)
    return ip

with ThreadPoolExecutor(max_workers=20) as hilos:
    for ip in hilos.map(copia, lista_de_ips):
        print("Copia hecha:", ip)
```

## Plantillas con Jinja2

```python
from jinja2 import Template

plantilla = Template("""hostname {{ nombre }}
{% for v in vlans %}vlan {{ v.id }}
 name {{ v.nombre }}
{% endfor %}""")
print(plantilla.render(nombre="SW-STI-03", vlans=[{"id": 10, "nombre": "VENTAS"}, {"id": 20, "nombre": "SOPORTE"}]))
```

Los datos (YAML o NetBox) dicen **qué** debe haber; la plantilla dice **cómo** se escribe; el script lo aplica. Cambias los datos, no cien configuraciones.

## Buenas prácticas

- Prueba siempre en un laboratorio (Cisco Modeling Labs, GNS3, EVE-NG, Containerlab) antes de producción.
- Haz **copia de la configuración** antes de cambiar nada y valida después (`show` + comprobaciones automáticas).
- Credenciales en variables de entorno o un gestor de secretos; usuarios de solo lectura para los scripts que solo consultan.
- Guarda los scripts y las configuraciones en **Git**.
- Empieza por tareas **de lectura** (inventario, copias, auditorías) antes que por cambios.

::: practica
En el laboratorio de abajo practicas las piezas básicas sin equipos reales: calcular redes con `ipaddress`, convertir MAC, analizar una salida de `show ip interface brief` y generar configuración de VLAN.
:::

[[code:python-redes]]

::: quiz
? ¿Qué biblioteca de Python se usa habitualmente para conectarse por SSH a equipos de red y enviar comandos?
+ Netmiko
- pandas
- Flask
= Netmiko simplifica SSH con equipos de muchos fabricantes.

? ¿Para qué sirve Jinja2 en automatización de redes?
+ Para generar configuraciones a partir de plantillas y datos
- Para cifrar contraseñas
- Para hacer ping
= Separa los datos (qué) de la forma de escribir la configuración (cómo).

? Antes de lanzar un script de cambios en 200 switches de producción, ¿qué debes hacer?
+ Probarlo en un laboratorio y hacer copia de las configuraciones
- Lanzarlo directamente un viernes por la tarde
- Desactivar el registro de cambios
= Laboratorio, copia, cambio controlado y validación.

? ¿Qué ventaja tiene obtener la salida de show de forma estructurada (TextFSM o Genie)?
+ Trabajas con diccionarios en lugar de recortar texto, mucho más fiable
- Los comandos se ejecutan más rápido en el equipo
- No hace falta SSH
= El código no se rompe por un espacio de más en la salida.
:::

=== p4-ia | Programar con asistentes de IA, con criterio | 12 | 2
Los asistentes de IA (Claude, GitHub Copilot, ChatGPT, Gemini…) se han convertido en una herramienta diaria de muchos programadores. Bien usados, multiplican la productividad; mal usados, generan código que no entiendes y que falla en el peor momento.

## Para qué son muy útiles

- Explicar un código o un mensaje de error que no entiendes.
- Generar un primer borrador de funciones, pruebas, expresiones regulares o consultas SQL.
- Traducir código de un lenguaje a otro.
- Revisar tu código y proponer mejoras o casos límite que no habías pensado.
- Documentar: comentarios, README, mensajes de commit.

## Las reglas para usarlos bien

1. **Entiende cada línea** antes de usarla. Si no sabes explicar qué hace, no lo pegues.
2. **Pruébalo siempre:** la IA puede inventar funciones o parámetros que no existen, o equivocarse en casos límite. Las pruebas automáticas son tu red de seguridad.
3. **No compartas secretos ni datos confidenciales** (contraseñas, configuraciones de la empresa, datos de clientes) salvo que tu empresa use una herramienta aprobada para ello.
4. **Revisa la seguridad:** el código generado puede tener inyecciones, credenciales escritas o validaciones ausentes.
5. **Da contexto preciso:** lenguaje, versión, qué entra, qué debe salir y un ejemplo. Una buena petición se parece a una buena especificación.
6. **Aprende primero los fundamentos:** si delegas todo desde el principio, no desarrollarás el criterio que hace falta para detectar los errores.

## Un buen ejemplo de petición

> "En Python 3.12, escribe una función `interfaces_caidas(salida: str) -> list[str]` que reciba la salida de `show ip interface brief` de Cisco IOS y devuelva los nombres de las interfaces cuyo Protocol sea `down`. Ignora la cabecera. Incluye pruebas con pytest para: salida vacía, todas up y una interfaz `administratively down`."

## IA en la automatización de redes

La IA ayuda a escribir scripts, plantillas o expresiones regulares para analizar salidas, y las plataformas de red incorporan asistentes que resumen alarmas o proponen causas. La responsabilidad del cambio en producción sigue siendo tuya: revisa, prueba en laboratorio y valida.

::: quiz
? ¿Qué debes hacer con el código que te propone un asistente de IA?
+ Entenderlo, probarlo y revisar su seguridad antes de usarlo
- Pegarlo directamente si compila
- Publicarlo sin pruebas porque la IA no se equivoca
= La IA puede equivocarse o inventar funciones que no existen.

? ¿Es buena idea pegar en un asistente público las configuraciones con contraseñas de tu empresa?
- Sí, así responde mejor
+ No, salvo que sea una herramienta aprobada por la empresa y sin incluir secretos
- Solo si es viernes
= Los secretos y datos confidenciales no deben salir de la empresa.

? ¿Qué hace que una petición a un asistente de IA sea buena?
+ Contexto preciso: lenguaje, entradas, salidas, ejemplo y casos a probar
- Que sea lo más corta posible
- Que no mencione el lenguaje
= Una buena petición se parece a una buena especificación.
:::

=== p4-carrera | Tu carrera como programador | 14 | 1
Programar abre muchos caminos profesionales. Esta lección te ayuda a elegir uno y a dar los pasos para conseguir tu primer empleo.

## Perfiles más demandados

| Perfil | Qué hace | Lenguajes y herramientas habituales |
|---|---|---|
| **Desarrollador frontend** | Interfaces web | HTML, CSS, JavaScript/TypeScript, React o Vue |
| **Desarrollador backend** | Lógica, APIs, bases de datos | Python, Java, C#, Node.js, Go, SQL |
| **Full stack** | Frontend y backend | JavaScript/TypeScript + un backend + SQL |
| **Desarrollador móvil** | Apps Android e iOS | Kotlin, Swift, Flutter, React Native |
| **DevOps / SRE / ingeniero de plataformas** | Despliegues, nube, fiabilidad | Linux, Bash, Python, Go, Docker, Kubernetes, Terraform |
| **Ingeniero de automatización de redes (NetDevOps)** | Automatizar redes | Python, Ansible, APIs, Git, **tus conocimientos de redes** |
| **Datos e inteligencia artificial** | Análisis, modelos, flujos de datos | Python, SQL, pandas, PyTorch |
| **Ciberseguridad (AppSec, pentesting)** | Encontrar y corregir vulnerabilidades | Python, Bash, conocimiento web y de redes |
| **QA / automatización de pruebas** | Calidad del software | Python, Java, JavaScript, Playwright, Selenium |

::: nota
Si vienes de redes, el perfil **NetDevOps** (redes + programación) es una gran ventaja competitiva: hay pocos profesionales que dominen las dos cosas.
:::

## Ruta recomendada para empezar

1. **Un lenguaje a fondo** (Python o JavaScript), con los fundamentos de esta área.
2. **Git y GitHub** desde el primer día.
3. **SQL** y bases de datos (tienes un área completa en esta web).
4. **Proyectos propios**, cada vez más ambiciosos: un script que haga copias de seguridad de configuraciones, una web con tu portafolio, una API con base de datos, un panel de monitorización.
5. Lo básico de **Linux, redes y la nube**.

## El portafolio

- 3–5 proyectos **terminados** en GitHub, con un README claro: qué problema resuelve, cómo se usa, capturas y qué aprendiste.
- Mejor un proyecto útil y bien hecho que diez tutoriales copiados.
- Si puedes, publícalos funcionando (GitHub Pages, Render, Vercel).

## Certificaciones útiles

No son obligatorias para programar (el portafolio pesa más), pero ayudan: **Cisco DevNet Associate** (automatización de redes), **AWS/Azure/Google Cloud** en sus niveles de entrada, **PCEP/PCAP** de Python Institute, **Oracle Java**, **Microsoft** para .NET y Azure, **Linux Foundation** (LFCS, CKA para Kubernetes).

## La entrevista técnica

- **Preguntas de conceptos:** diferencias entre lista y diccionario, qué es una API REST, qué es Git, qué es la POO, qué es una inyección SQL.
- **Ejercicios en vivo:** problemas tipo "invertir un texto", "encontrar duplicados", "contar palabras", "validar una IP". Practica en LeetCode, HackerRank o Exercism.
- **Explica tu razonamiento en voz alta:** importa tanto cómo piensas como el resultado.
- **Habla de tus proyectos:** qué decisiones tomaste, qué problema tuviste y cómo lo resolviste.

::: quiz
? Vienes de redes y quieres un perfil muy demandado que combine lo que sabes con la programación. ¿Cuál encaja?
+ NetDevOps / automatización de redes
- Diseñador gráfico
- Desarrollador de videojuegos 3D
= Python + Ansible + APIs + redes es una combinación escasa y valorada.

? ¿Qué pesa más al buscar tu primer empleo como programador?
+ Un portafolio con proyectos terminados y bien explicados
- Haber visto muchos tutoriales
- Saber los nombres de muchos lenguajes
= Demuestra lo que sabes hacer de verdad.

? En un ejercicio de programación en una entrevista, ¿qué es importante además del resultado?
+ Explicar tu razonamiento en voz alta
- Escribir lo más rápido posible sin hablar
- No hacer preguntas
= El entrevistador quiere ver cómo piensas y cómo abordas el problema.
:::
