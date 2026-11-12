---
area: prog
id: p2
titulo: Los lenguajes más usados
dominio: Programación
peso: 0
descripcion: Para qué sirve cada lenguaje y cómo se escribe: Python, JavaScript y TypeScript, Java, C#, C y C++, Go y Rust, PHP, Kotlin, Swift, SQL, Bash y PowerShell, con el mismo programa escrito en todos para compararlos.
---

=== p2-panorama | El mapa de los lenguajes: cuál sirve para qué | 16 | 1
Hay cientos de lenguajes, pero una docena concentra la gran mayoría de los empleos. Rankings como la encuesta anual de Stack Overflow, el índice TIOBE o las estadísticas de GitHub coinciden año tras año en los mismos nombres.

## Para qué se usa cada uno

| Lenguaje | Dónde brilla | Ejemplos reales |
|---|---|---|
| **Python** | Automatización, datos, IA, backend, **redes** (Netmiko, Ansible) | Instagram (backend), scripts de administración, ciencia de datos |
| **JavaScript** | **La web**: todo navegador lo ejecuta; también servidores (Node.js) | Cualquier página interactiva, apps con React, Vue o Angular |
| **TypeScript** | JavaScript con tipos para proyectos grandes | VS Code, aplicaciones web empresariales |
| **Java** | Aplicaciones empresariales, banca, Android (histórico) | Sistemas bancarios, backends de grandes empresas |
| **C#** | Ecosistema Microsoft (.NET), aplicaciones de empresa, **videojuegos** (Unity) | Aplicaciones Windows, webs ASP.NET, juegos |
| **C / C++** | Sistemas operativos, firmware, drivers, motores de juegos, alto rendimiento | Linux (C), navegadores y motores 3D (C++), el IOS de los routers |
| **Go** | Servicios en la nube, herramientas de infraestructura | Docker, Kubernetes, Terraform |
| **Rust** | Software rápido y **seguro con la memoria** | Partes de Windows, Linux, Firefox y Android |
| **PHP** | Webs en servidor | WordPress (gran parte de las webs del mundo), Laravel |
| **Kotlin** | Android moderno, backend en la JVM | La mayoría de las apps Android nuevas |
| **Swift** | Apps de Apple (iOS, macOS) | Apps del iPhone |
| **SQL** | Consultar bases de datos | Presente en casi todos los proyectos |
| **Bash / PowerShell** | Automatizar sistemas Linux / Windows | Scripts de administración, despliegues |

## El mismo programa en cinco lenguajes

Mostrar las IP de una lista que pertenecen a la red 10.x:

```python
ips = ["10.0.0.1", "192.168.1.5", "10.20.30.40"]
for ip in ips:
    if ip.startswith("10."):
        print(ip)
```

```javascript
const ips = ["10.0.0.1", "192.168.1.5", "10.20.30.40"];
ips.filter(ip => ip.startsWith("10.")).forEach(ip => console.log(ip));
```

```java
List<String> ips = List.of("10.0.0.1", "192.168.1.5", "10.20.30.40");
for (String ip : ips) {
    if (ip.startsWith("10.")) System.out.println(ip);
}
```

```go
ips := []string{"10.0.0.1", "192.168.1.5", "10.20.30.40"}
for _, ip := range ips {
    if strings.HasPrefix(ip, "10.") {
        fmt.Println(ip)
    }
}
```

```bash
for ip in 10.0.0.1 192.168.1.5 10.20.30.40; do
  [[ $ip == 10.* ]] && echo "$ip"
done
```

Las ideas (variables, bucles, condiciones, funciones) son **las mismas**: cambia la sintaxis. Por eso el segundo lenguaje se aprende mucho más rápido que el primero.

## ¿Por cuál empiezo?

- **Vienes de redes o sistemas:** Python (automatización) y después Bash o PowerShell.
- **Quieres hacer webs:** JavaScript (con HTML y CSS) y luego TypeScript.
- **Apps móviles:** Kotlin (Android) o Swift (iOS); o un framework multiplataforma (Flutter con Dart, React Native con JavaScript).
- **Empresa y banca:** Java o C#.
- **Videojuegos:** C# (Unity) o C++ (Unreal).
- **Sistemas y alto rendimiento:** C, después Rust o Go.

::: nota
Lo que más se valora no es saber muchos lenguajes, sino dominar **uno** a fondo y entender bien los conceptos. Con eso, cambiar de lenguaje es cuestión de semanas.
:::

::: quiz
? ¿Qué lenguaje ejecutan todos los navegadores web?
+ JavaScript
- Java
- Python
= Java y JavaScript son lenguajes distintos; los navegadores ejecutan JavaScript.

? ¿En qué lenguaje están escritos Docker y Kubernetes?
- PHP
+ Go
- Swift
= Go es muy popular en herramientas de infraestructura y nube.

? Un técnico de redes quiere automatizar la configuración de 200 switches. ¿Qué lenguaje se suele recomendar primero?
+ Python
- Swift
- C++
= Python tiene las bibliotecas de automatización de redes más usadas (Netmiko, NAPALM, Nornir).

? ¿Qué lenguaje se usa en el motor de videojuegos Unity?
- Go
+ C#
- PHP
= Unity se programa en C#; Unreal Engine, en C++.
:::

=== p2-python | Python: el lenguaje más versátil | 18 | 1
Python, creado por Guido van Rossum y publicado en 1991, destaca por una sintaxis clara que se lee casi como inglés. Es el lenguaje más usado en enseñanza, ciencia de datos, inteligencia artificial y automatización, también de redes.

## Lo esencial de un vistazo

```python
# Variables y textos
equipo = "SW-SDQ-01"
puertos = 48
print(f"{equipo} tiene {puertos} puertos")

# Listas y diccionarios
vlans = {10: "VENTAS", 20: "SOPORTE"}
for vid, nombre in vlans.items():
    print(f"vlan {vid}\n name {nombre}")

# Funciones
def es_privada(ip: str) -> bool:
    import ipaddress
    return ipaddress.ip_address(ip).is_private

# Clases
class Router:
    def __init__(self, nombre):
        self.nombre = nombre
        self.interfaces = []
```

- La **sangría** define los bloques.
- **Tipado dinámico**, pero admite anotaciones de tipo (`ip: str -> bool`) que comprueban herramientas como mypy.
- "Baterías incluidas": la biblioteca estándar trae de todo (`json`, `csv`, `datetime`, `ipaddress`, `socket`, `sqlite3`…).

## Su ecosistema

- **pip** instala paquetes desde PyPI: `pip install requests`.
- **Entornos virtuales** (`python -m venv .venv`) aíslan las dependencias de cada proyecto.
- **Bibliotecas famosas:** `requests` (HTTP), `pandas` (datos), `numpy`, `matplotlib` (gráficos), `Django` y `FastAPI` (web), `pytest` (pruebas), `scikit-learn` y `PyTorch` (IA), `Netmiko`, `NAPALM`, `Nornir` (redes).

## Puntos fuertes y débiles

- ✅ Fácil de aprender y leer, productivo, enorme comunidad.
- ⚠️ Más lento que C, Go o Rust en cálculos intensivos (por eso las bibliotecas pesadas se escriben en C por dentro).
- ⚠️ La sangría obligatoria sorprende al principio.

::: practica
Usa la zona libre de abajo para experimentar. Prueba el módulo `ipaddress`, que viene incluido: calcula subredes, comprueba si una IP es privada o recorre los hosts de una red.
:::

[[code:python-libre]]

::: quiz
? ¿Cómo se instalan paquetes de terceros en Python?
+ Con pip
- Con npm
- Con apt-get python
= pip descarga paquetes del índice PyPI.

? ¿Qué módulo de la biblioteca estándar de Python sirve para trabajar con direcciones IP y subredes?
+ ipaddress
- socket.ip
- netaddr
= ipaddress viene incluido; netaddr es una biblioteca externa.

? ¿Para qué sirve un entorno virtual (venv)?
+ Para aislar las dependencias de cada proyecto
- Para ejecutar Python en una máquina virtual de VirtualBox
- Para que Python vaya más rápido
= Cada proyecto tiene sus propias versiones de paquetes sin chocar con otros.
:::

=== p2-javascript | JavaScript y TypeScript: el lenguaje de la web | 18 | 1
JavaScript nació en 1995 para dar vida a las páginas web y hoy es el único lenguaje que todos los navegadores ejecutan de forma nativa. Con **Node.js** también funciona en servidores.

## Las tres capas de una página web

| Capa | Lenguaje | Se ocupa de |
|---|---|---|
| Estructura | **HTML** | Títulos, párrafos, formularios, botones |
| Estilo | **CSS** | Colores, tipografía, diseño |
| Comportamiento | **JavaScript** | Responder a clics, pedir datos, actualizar la página |

```html
<button id="comprobar">Comprobar</button>
<p id="resultado"></p>
```

```javascript
document.querySelector("#comprobar").addEventListener("click", async () => {
  const respuesta = await fetch("/api/estado");     // pide datos al servidor
  const datos = await respuesta.json();
  document.querySelector("#resultado").textContent = `Equipos caídos: ${datos.caidos}`;
});
```

## Características clave

- **Asíncrono:** `async`/`await` y las *promesas* permiten esperar respuestas de red sin bloquear la página.
- **Funciones de primera clase:** se pasan como argumentos (`arr.map(x => x * 2)`).
- **Objetos y JSON:** JSON (*JavaScript Object Notation*) nació de la sintaxis de objetos de JavaScript.

## El ecosistema

- **npm:** el mayor repositorio de paquetes del mundo (`npm install express`).
- **Frontend:** React, Vue, Angular, Svelte.
- **Backend:** Node.js con Express, Fastify o NestJS. También Deno y Bun.
- **Móvil y escritorio:** React Native, Electron (VS Code, Slack, Discord están hechos con Electron).

## TypeScript: JavaScript con tipos

TypeScript (de Microsoft) añade **tipos estáticos**. Se compila a JavaScript normal. Evita muchos errores en proyectos grandes:

```typescript
interface Interfaz {
  nombre: string;
  estado: "up" | "down";
  velocidadMbps: number;
}

function caidas(lista: Interfaz[]): string[] {
  return lista.filter(i => i.estado === "down").map(i => i.nombre);
}
```

Si escribes `estado: "caida"`, TypeScript avisa antes de ejecutar.

::: cuidado
Java y JavaScript **no tienen nada que ver** (el nombre fue una decisión de marketing de 1995). Mezclarlos en una entrevista causa muy mala impresión.
:::

[[code:js-libre]]

::: quiz
? ¿Qué capa de una web se encarga del comportamiento interactivo?
- HTML
- CSS
+ JavaScript
= HTML da la estructura, CSS el estilo y JavaScript el comportamiento.

? ¿Qué permite ejecutar JavaScript en un servidor?
+ Node.js
- El navegador
- TypeScript
= Node.js lleva el motor de JavaScript fuera del navegador.

? ¿Qué aporta TypeScript sobre JavaScript?
+ Tipos estáticos que detectan errores antes de ejecutar
- Más velocidad en el navegador
- Una sintaxis basada en sangría
= TypeScript se compila a JavaScript; su valor está en la comprobación de tipos.
:::

=== p2-java | Java: el lenguaje de la empresa | 16 | 2
Java (1995) se diseñó con un lema: *"escríbelo una vez, ejecútalo en cualquier parte"*. El código se compila a **bytecode** y lo ejecuta la **máquina virtual de Java (JVM)** en Windows, Linux o macOS sin cambios.

## Cómo se ve

```java
import java.util.ArrayList;
import java.util.List;

public class Inventario {
    public static void main(String[] args) {
        List<Equipo> equipos = new ArrayList<>();
        equipos.add(new Equipo("R1", "router", true));
        equipos.add(new Equipo("SW1", "switch", false));

        for (Equipo e : equipos) {
            if (!e.activo()) {
                System.out.println("Caído: " + e.hostname());
            }
        }
    }
}

record Equipo(String hostname, String tipo, boolean activo) {}
```

- **Tipado estático y fuerte:** cada variable tiene su tipo (`String`, `int`, `List<Equipo>`).
- **Orientado a objetos:** todo vive dentro de clases.
- Más "ceremonioso" que Python, pero muy predecible en proyectos enormes con muchos programadores.

## Dónde se usa

- Backends de banca, seguros, telecomunicaciones y comercio electrónico.
- **Spring Boot**: el framework más usado para servicios web en Java.
- Big data: Hadoop, Kafka y Elasticsearch corren en la JVM.
- Android (hoy sobre todo con Kotlin, que funciona sobre la JVM y es 100 % compatible con Java).

## Herramientas

JDK (OpenJDK, Temurin), **Maven** o **Gradle** para dependencias y compilación, y los IDE IntelliJ IDEA, Eclipse o VS Code.

## Otros lenguajes de la JVM

**Kotlin** (más moderno y conciso, el preferido para Android) y **Scala** (funcional, usado en big data).

::: quiz
? ¿Qué ejecuta los programas Java compilados?
+ La máquina virtual de Java (JVM)
- El navegador web
- El intérprete de Python
= javac genera bytecode y la JVM lo ejecuta en cualquier sistema.

? ¿Cuál es el framework más usado para crear servicios web con Java?
+ Spring Boot
- Django
- Laravel
= Django es de Python y Laravel de PHP.

? ¿Qué lenguaje recomienda Google para las apps Android nuevas?
- Java exclusivamente
+ Kotlin
- Swift
= Kotlin es el preferido para Android y convive con Java en la JVM.
:::

=== p2-csharp | C# y .NET | 14 | 2
C# (se pronuncia "C sharp") es el lenguaje principal de la plataforma **.NET** de Microsoft. Es moderno, con tipos estáticos, y hoy funciona en Windows, Linux y macOS.

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

var interfaces = new List<(string Nombre, string Estado)> {
    ("Gi0/0", "up"), ("Gi0/1", "down"), ("Gi0/2", "down")
};

var caidas = interfaces.Where(i => i.Estado == "down").Select(i => i.Nombre);
Console.WriteLine($"Caídas: {string.Join(", ", caidas)}");
```

- **LINQ** (`Where`, `Select`, `OrderBy`) permite consultar colecciones con un estilo parecido a SQL.
- `async`/`await` (C# lo popularizó antes que JavaScript).

## Dónde se usa

| Campo | Tecnología |
|---|---|
| Webs y APIs | ASP.NET Core |
| Aplicaciones de escritorio Windows | WPF, WinForms, WinUI |
| Videojuegos | **Unity** (miles de juegos móviles y de consola) |
| Nube | Azure Functions y servicios de Azure |
| Automatización de Windows | Junto con **PowerShell**, que está construido sobre .NET |

## Java frente a C#

Son primos: sintaxis parecida, máquina virtual (la JVM frente al CLR de .NET), recolector de basura y orientación a objetos. Quien domina uno aprende el otro rápidamente. La elección suele depender del ecosistema de la empresa.

::: quiz
? ¿Sobre qué plataforma funciona C#?
+ .NET
- La JVM
- Node.js
= C# se compila para el entorno de ejecución de .NET.

? ¿Qué motor de videojuegos se programa en C#?
+ Unity
- Unreal Engine
- Godot exclusivamente con C++
= Unity usa C#; Unreal, C++.

? ¿Qué es LINQ?
+ Una forma de consultar colecciones en C# con un estilo parecido a SQL
- Un servidor web
- Un tipo de base de datos
= Where, Select u OrderBy funcionan sobre listas, bases de datos o XML.
:::

=== p2-c-cpp | C y C++: cerca del hardware | 16 | 2
**C** (1972) es la base de casi todo: Linux, Windows, el firmware de los routers y la mayoría de los lenguajes (el intérprete de Python está escrito en C). **C++** (1985) añade orientación a objetos y muchísimas abstracciones, sin perder velocidad.

## C: control total

```c
#include <stdio.h>

int main(void) {
    int velocidades[] = {100, 1000, 10000};
    int total = 0;
    for (int i = 0; i < 3; i++) {
        total += velocidades[i];
    }
    printf("Total: %d Mb/s\n", total);
    return 0;
}
```

En C gestionas tú la **memoria**: reservas con `malloc` y liberas con `free`. Es potentísimo y peligroso: un error puede leer o escribir donde no debe.

## Los errores de memoria clásicos

| Error | Qué pasa |
|---|---|
| **Desbordamiento de búfer** (*buffer overflow*) | Escribir más allá del espacio reservado; históricamente una de las fuentes de vulnerabilidades más graves |
| **Uso después de liberar** (*use after free*) | Usar memoria que ya se devolvió |
| **Fuga de memoria** (*memory leak*) | Reservar y no liberar nunca; el programa crece sin parar |

Por eso hoy se recomienda usar lenguajes con **seguridad de memoria** (Rust, Go, Java, C#, Python) para el software nuevo cuando sea posible.

## C++: abstracción sin perder velocidad

```cpp
#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> equipos = {"R1", "SW1", "SW2"};
    for (const auto& e : equipos) {
        std::cout << "Equipo: " << e << '\n';
    }
}
```

C++ moderno (C++17, C++20) usa punteros inteligentes y contenedores que reducen mucho los errores de memoria.

## Dónde se usan

- **C:** sistemas operativos, drivers, **sistemas embebidos y firmware** (routers, switches, electrodomésticos, coches), microcontroladores.
- **C++:** motores de videojuegos (Unreal), navegadores (Chrome), bases de datos, software financiero de alta frecuencia, programas de edición de vídeo y 3D.

::: quiz
? ¿En qué lenguaje está escrito principalmente el núcleo de Linux?
+ C
- Java
- Python
= Linux está escrito en C (y desde hace poco admite también partes en Rust).

? ¿Qué es un desbordamiento de búfer?
+ Escribir más datos de los que caben en la memoria reservada
- Que el disco se llene
- Que la red vaya lenta
= Es una de las vulnerabilidades clásicas de C y C++.

? ¿Qué problema evitan los lenguajes con seguridad de memoria?
+ Errores como desbordamientos o uso de memoria ya liberada
- Los errores de sintaxis
- Los errores lógicos
= Rust, Go, Java, C# o Python gestionan la memoria de forma segura.
:::

=== p2-go-rust | Go y Rust: los lenguajes de la nube y la seguridad | 16 | 3
Dos lenguajes modernos que han ganado muchísimo terreno en infraestructura y sistemas.

## Go: sencillo y concurrente

Creado en Google (2009), Go busca ser **simple, rápido de compilar y fácil de mantener**. Genera un único ejecutable sin dependencias, ideal para servidores y contenedores.

```go
package main

import (
    "fmt"
    "net"
    "time"
)

func comprobar(host string, resultados chan<- string) {
    conn, err := net.DialTimeout("tcp", host, 2*time.Second)
    if err != nil {
        resultados <- host + " NO responde"
        return
    }
    conn.Close()
    resultados <- host + " responde"
}

func main() {
    hosts := []string{"10.0.0.1:22", "10.0.0.2:22", "10.0.0.3:443"}
    resultados := make(chan string)
    for _, h := range hosts {
        go comprobar(h, resultados)   // goroutine: se ejecutan a la vez
    }
    for range hosts {
        fmt.Println(<-resultados)
    }
}
```

- **Goroutines** y **canales**: concurrencia muy sencilla. Comprobar 1.000 equipos a la vez es trivial.
- Los errores se devuelven como valores (`if err != nil`): explícito, sin excepciones.
- Usado en **Docker, Kubernetes, Terraform, Prometheus, Grafana** y muchas herramientas de red y nube.

## Rust: rendimiento de C con seguridad de memoria

Rust (Mozilla, 2015) garantiza la seguridad de la memoria **al compilar**, sin recolector de basura, gracias a su sistema de **propiedad** (*ownership*) y préstamos (*borrowing*).

```rust
fn caidas(interfaces: &[(&str, bool)]) -> Vec<String> {
    interfaces
        .iter()
        .filter(|(_, activa)| !activa)
        .map(|(nombre, _)| nombre.to_string())
        .collect()
}

fn main() {
    let ifs = [("Gi0/0", true), ("Gi0/1", false)];
    println!("{:?}", caidas(&ifs));
}
```

- El compilador es muy estricto: cuesta más empezar, pero si compila, desaparecen clases enteras de errores.
- Aparece año tras año como uno de los lenguajes "más queridos" por los desarrolladores en la encuesta de Stack Overflow.
- Se usa en el kernel de Linux, Windows, Android, navegadores, herramientas de línea de comandos y blockchain.

## ¿Cuál aprender?

**Go** si te interesa la infraestructura, DevOps o herramientas de red: se aprende en semanas. **Rust** si te atrae la programación de sistemas, la seguridad o el máximo rendimiento.

::: quiz
? ¿Qué es una goroutine en Go?
+ Una función que se ejecuta de forma concurrente, muy ligera
- Un tipo de error
- Un paquete de red
= Con go funcion() se lanzan miles de tareas concurrentes con poco coste.

? ¿Cómo garantiza Rust la seguridad de la memoria?
+ Con su sistema de propiedad y préstamos, comprobado al compilar
- Con un recolector de basura
- Ejecutándose solo en el navegador
= No necesita recolector de basura: el compilador impide los usos inseguros.

? ¿Qué herramienta muy usada en infraestructura está escrita en Go?
+ Kubernetes
- WordPress
- Microsoft Excel
= Docker, Kubernetes y Terraform están escritas en Go.
:::

=== p2-otros | PHP, Kotlin, Swift, R y otros que conviene conocer | 14 | 2
Además de los grandes, hay lenguajes que dominan nichos concretos y que encontrarás en ofertas de empleo.

## PHP: la web en el servidor

Mueve una parte enorme de la web, con **WordPress** a la cabeza. El PHP moderno (8.x) con el framework **Laravel** es rápido y agradable.

```php
<?php
$equipos = ["R1" => "up", "SW1" => "down"];
foreach ($equipos as $nombre => $estado) {
    echo "$nombre está $estado\n";
}
```

## Kotlin y Swift: el móvil

| | Kotlin | Swift |
|---|---|---|
| Plataforma | Android (y backend en la JVM) | iPhone, iPad, Mac, Apple Watch |
| Creado por | JetBrains (2011) | Apple (2014) |
| Sustituye a | Java en Android | Objective-C |

```kotlin
val equipos = listOf("R1" to true, "SW1" to false)
equipos.filter { !it.second }.forEach { println("Caído: ${it.first}") }
```

```swift
let equipos = [("R1", true), ("SW1", false)]
for (nombre, activo) in equipos where !activo {
    print("Caído: \(nombre)")
}
```

**Multiplataforma:** Flutter (lenguaje Dart) y React Native (JavaScript) crean apps para Android e iOS con un solo código.

## Datos y ciencia

- **R:** estadística y análisis de datos en universidades e investigación.
- **SQL:** imprescindible en cualquier perfil (tienes un área entera en esta web).
- **Julia:** cálculo científico de alto rendimiento.

## Otros que oirás

- **Ruby** (framework Ruby on Rails): productivo; lo usaron GitHub y Shopify desde sus inicios.
- **Dart:** el lenguaje de Flutter.
- **Lua:** scripts dentro de juegos (Roblox usa una variante) y de equipos de red.
- **COBOL:** antiquísimo, pero sigue moviendo sistemas bancarios y gubernamentales. Hay demanda de quien lo mantenga.
- **Ensamblador:** programación a nivel de instrucciones del procesador (ingeniería inversa, firmware).

## Lenguajes que no son de programación (pero se usan a diario)

**HTML** (estructura) y **CSS** (estilo) son lenguajes de marcado y de estilos; **JSON**, **YAML** y **XML** son formatos de datos; **Markdown** es para documentos. No tienen bucles ni lógica, pero los usarás constantemente.

::: quiz
? ¿Qué gestor de contenidos, que mueve gran parte de la web, está hecho en PHP?
+ WordPress
- Kubernetes
- Unity
= WordPress está escrito en PHP.

? ¿Con qué lenguaje se programan las apps nativas del iPhone?
- Kotlin
+ Swift
- C#
= Apple creó Swift en 2014 para sustituir a Objective-C.

? ¿Es HTML un lenguaje de programación?
- Sí, como Python
+ No, es un lenguaje de marcado (estructura de documentos)
- Solo en su versión 5
= HTML describe la estructura; la lógica la pone JavaScript.
:::

=== p2-scripting | Bash y PowerShell: automatizar el sistema | 16 | 2
Los **lenguajes de scripting de shell** automatizan tareas del sistema operativo: copiar ficheros, revisar registros, crear usuarios, comprobar servidores. Son imprescindibles para administradores de sistemas y redes.

## Bash (Linux y macOS)

```bash
#!/usr/bin/env bash
# Comprueba qué equipos responden al ping y guarda un informe
set -euo pipefail

informe="ping_$(date +%F).txt"
for ip in 10.10.99.1 10.10.99.2 10.10.99.11; do
  if ping -c 1 -W 1 "$ip" > /dev/null 2>&1; then
    echo "$ip OK" >> "$informe"
  else
    echo "$ip CAÍDO" >> "$informe"
  fi
done
grep -c "CAÍDO" "$informe" || true
```

Ideas clave:
- **Tuberías** (`|`): la salida de un comando es la entrada del siguiente: `cat registro.log | grep ERROR | wc -l`.
- **Redirecciones:** `>` sobrescribe un fichero, `>>` añade al final, `2>` redirige los errores.
- Herramientas de texto: `grep` (buscar), `awk` y `cut` (columnas), `sed` (sustituir), `sort`, `uniq`.
- `set -euo pipefail` hace que el script se detenga ante el primer error: buena práctica.

## PowerShell (Windows, y también Linux)

PowerShell no pasa texto entre comandos, sino **objetos** con propiedades. Los comandos (*cmdlets*) siguen el patrón **Verbo-Sustantivo**.

```powershell
# Comprueba qué equipos responden y exporta un CSV
$equipos = "10.10.99.1", "10.10.99.2", "10.10.99.11"
$equipos | ForEach-Object {
    [PSCustomObject]@{
        IP     = $_
        Activo = Test-Connection -TargetName $_ -Count 1 -Quiet
    }
} | Export-Csv -Path informe.csv -NoTypeInformation

Get-Service | Where-Object Status -eq 'Stopped' | Select-Object Name
Get-NetIPAddress -AddressFamily IPv4 | Format-Table InterfaceAlias, IPAddress
```

## Bash frente a PowerShell

| | Bash | PowerShell |
|---|---|---|
| Sistema principal | Linux, macOS | Windows (y multiplataforma desde la versión 7) |
| Entre comandos pasa | Texto | Objetos |
| Estilo de comandos | Cortos (`ls`, `grep`) | Verbo-Sustantivo (`Get-ChildItem`) |
| Ideal para | Servidores Linux, contenedores, redes | Active Directory, Microsoft 365, Azure |

## ¿Cuándo pasar a Python?

Para tareas cortas, Bash o PowerShell son perfectos. Si el script crece (más de 100 líneas, datos complejos, APIs, mucha lógica), Python es más fácil de mantener.

::: quiz
? En Bash, ¿qué hace el operador | (tubería)?
+ Envía la salida de un comando como entrada del siguiente
- Ejecuta dos comandos a la vez sin relación
- Guarda la salida en un fichero
= Por ejemplo: cat registro.log | grep ERROR.

? ¿Qué diferencia principal tiene PowerShell respecto a Bash?
+ Pasa objetos entre comandos, no texto
- Solo funciona en Linux
- No tiene variables
= Los objetos tienen propiedades, así que no hace falta recortar texto.

? En Bash, ¿qué diferencia hay entre > y >>?
+ > sobrescribe el fichero; >> añade al final
- Son iguales
- > lee y >> escribe
= Con >> se acumulan los resultados de varias ejecuciones.
:::
