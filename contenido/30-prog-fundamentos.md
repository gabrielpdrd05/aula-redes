---
area: prog
id: p1
titulo: Fundamentos de programación
dominio: Programación
peso: 0
descripcion: Programar desde cero: qué es un algoritmo, variables y tipos de datos, decisiones, bucles, funciones, colecciones y cómo pensar y depurar un programa, practicando en Python y JavaScript.
---

=== p1-que-es | Qué es programar | 12 | 1
**Programar** es escribir instrucciones precisas para que un ordenador resuelva un problema. El ordenador no entiende "más o menos": hace **exactamente** lo que le dices, ni más ni menos.

## Algoritmo y programa

- Un **algoritmo** es la receta: una secuencia finita de pasos claros para resolver un problema. Existe antes de cualquier lenguaje.
- Un **programa** es ese algoritmo escrito en un **lenguaje de programación** concreto.

Algoritmo para saber si un número es par:
1. Divide el número entre 2.
2. Si el resto es 0, es par; si no, es impar.

```python
numero = 14
if numero % 2 == 0:
    print("Es par")
else:
    print("Es impar")
```

## Cómo entiende el ordenador tu código

El procesador solo ejecuta **código máquina** (instrucciones binarias). Tu código hay que traducirlo:

| Forma | Cómo funciona | Ejemplos |
|---|---|---|
| **Compilado** | Un compilador traduce todo el programa a código máquina antes de ejecutarlo | C, C++, Go, Rust |
| **Interpretado** | Un intérprete lee y ejecuta el código línea a línea | Python, JavaScript, PHP, Bash |
| **Máquina virtual (bytecode)** | Se compila a un código intermedio que ejecuta una máquina virtual | Java (JVM), C# (.NET), Kotlin |

En la práctica la frontera se difumina: JavaScript y Python también compilan internamente para ir más rápido. Lo importante es la idea: **código fuente → traducción → ejecución**.

## Lenguajes de alto y bajo nivel

- **Bajo nivel** (ensamblador, C): cerca del hardware; mucho control, más trabajo.
- **Alto nivel** (Python, JavaScript, Java): cerca del lenguaje humano; el lenguaje se ocupa de la memoria y otros detalles.

## Qué necesitas para empezar

1. Un **editor de código**: Visual Studio Code es gratuito y el más usado.
2. El **intérprete o compilador** del lenguaje (Python se instala desde python.org; JavaScript ya viene en el navegador).
3. Una **terminal** para ejecutar programas.
4. Y aquí mismo: el **laboratorio de código** de esta web ejecuta Python y JavaScript en tu navegador sin instalar nada.

::: nota
No hace falta ser "de ciencias" para programar. Hace falta paciencia, practicar a diario y aprender a buscar soluciones cuando algo falla (que fallará a menudo: es normal).
:::

::: quiz
? ¿Qué es un algoritmo?
+ Una secuencia finita de pasos claros para resolver un problema
- Un lenguaje de programación
- Un tipo de ordenador
= El algoritmo es la idea; el programa es el algoritmo escrito en un lenguaje.

? ¿Cuál de estos lenguajes se suele compilar a código máquina antes de ejecutarse?
+ C
- Python
- Bash
= C, C++, Go y Rust se compilan; Python y Bash se interpretan.

? ¿Qué ejecuta la máquina virtual de Java (JVM)?
- Código fuente Java directamente
+ Bytecode, un código intermedio
- Solo scripts de Bash
= javac compila a bytecode y la JVM lo ejecuta en cualquier sistema.
:::

=== p1-variables | Variables, tipos de datos y operadores | 16 | 1
Una **variable** es un nombre que guarda un valor para usarlo después, como una caja con etiqueta.

```python
hostname = "R1"          # texto (str)
puertos = 24             # entero (int)
latencia = 12.5          # decimal (float)
activo = True            # lógico (bool)
nada = None              # ausencia de valor
```

```javascript
let hostname = "R1";     // texto (string)
const puertos = 24;      // número (number); const no se puede reasignar
let activo = true;       // boolean
let nada = null;
```

## Tipos de datos básicos

| Tipo | Python | JavaScript | Ejemplo |
|---|---|---|---|
| Entero | `int` | `number` (o `bigint`) | `24` |
| Decimal | `float` | `number` | `12.5` |
| Texto | `str` | `string` | `"Gi0/1"` |
| Lógico | `bool` (`True`/`False`) | `boolean` (`true`/`false`) | |
| Vacío | `None` | `null` / `undefined` | |

Python y JavaScript tienen **tipado dinámico**: la variable toma el tipo del valor. Java, C# o Go tienen **tipado estático**: declaras el tipo y el compilador avisa si te equivocas (`int puertos = 24;`).

## Operadores

| Operación | Python | JavaScript |
|---|---|---|
| Suma, resta, multiplicación | `+ - *` | `+ - *` |
| División | `7 / 2` → `3.5` | `7 / 2` → `3.5` |
| División entera | `7 // 2` → `3` | `Math.floor(7 / 2)` |
| Resto (módulo) | `7 % 2` → `1` | `7 % 2` → `1` |
| Potencia | `2 ** 8` → `256` | `2 ** 8` → `256` |
| Comparar | `== != < > <= >=` | `=== !== < > <= >=` |
| Lógicos | `and or not` | `&& \|\| !` |

::: cuidado
En JavaScript usa siempre `===` (igualdad estricta). `==` convierte tipos por su cuenta: `"5" == 5` es `true`, pero `"5" === 5` es `false`.
:::

## Textos

```python
nombre = "SW-01"
print(f"Equipo {nombre} con {puertos} puertos")   # f-string
print(nombre.lower(), len(nombre), nombre[0:2])    # sw-01 5 SW
print(int("42") + 1)                               # convertir texto → número: 43
```

En JavaScript: `` `Equipo ${nombre}` ``, `nombre.toLowerCase()`, `nombre.length`, `Number("42")`.

## Buenos nombres

Usa nombres que expliquen qué guardan: `ip_gestion` mejor que `x`. En Python se usa `snake_case` (`ip_gestion`); en JavaScript y Java, `camelCase` (`ipGestion`).

[[code:python-basico]]

::: quiz
? ¿Qué devuelve 7 // 2 en Python?
+ 3
- 3.5
- 1
= // es la división entera: descarta los decimales.

? ¿Qué devuelve 7 % 2?
- 3
+ 1
- 0
= % devuelve el resto de la división.

? En JavaScript, ¿cuánto vale "5" === 5?
- true
+ false
- Da error
= === compara también el tipo: un texto no es igual a un número.

? ¿Qué es el tipado estático?
+ Declarar el tipo de cada variable, que el compilador comprueba
- No poder cambiar nunca el valor de una variable
- Que el programa no se mueva de la pantalla
= Java, C#, Go o TypeScript comprueban los tipos antes de ejecutar.
:::

=== p1-condicionales | Decisiones: if, else y lógica booleana | 14 | 1
Los programas necesitan **decidir**: si la interfaz está caída, avisa; si no, sigue. Para eso están las **estructuras condicionales**.

## if, elif, else

```python
estado = "down"
errores = 12

if estado == "down":
    print("Interfaz caída: revisa el cable")
elif errores > 10:
    print("Interfaz con errores: revisa el dúplex")
else:
    print("Todo correcto")
```

En Python, los bloques se marcan con **sangría** (4 espacios). En JavaScript, Java, C o C# se usan **llaves**:

```javascript
if (estado === "down") {
  console.log("Interfaz caída");
} else if (errores > 10) {
  console.log("Interfaz con errores");
} else {
  console.log("Todo correcto");
}
```

## Lógica booleana

| Operador | Python | JavaScript | Verdadero cuando… |
|---|---|---|---|
| Y | `and` | `&&` | las dos condiciones lo son |
| O | `or` | `\|\|` | al menos una lo es |
| NO | `not` | `!` | la condición es falsa |

```python
if puerto >= 1 and puerto <= 1023:
    print("Puerto bien conocido")
if not activo or en_mantenimiento:
    print("No enviar alertas")
```

Python permite encadenar comparaciones: `1 <= puerto <= 1023`.

## Valores "verdaderos" y "falsos"

Un `0`, un texto vacío `""`, una lista vacía `[]` o `None` cuentan como **falso**; casi todo lo demás, como verdadero. Por eso `if lista:` significa "si la lista tiene algo".

## Elegir entre muchos casos

```python
servicio = {22: "SSH", 23: "Telnet", 80: "HTTP"}.get(puerto, "Desconocido")
```

Python 3.10+ tiene `match` y JavaScript, Java y C tienen `switch`:

```javascript
switch (puerto) {
  case 22: servicio = "SSH"; break;
  case 80: servicio = "HTTP"; break;
  default: servicio = "Desconocido";
}
```

## Expresión condicional (ternaria)

```python
texto = "par" if n % 2 == 0 else "impar"
```

```javascript
const texto = n % 2 === 0 ? "par" : "impar";
```

[[code:python-condicionales]]

::: quiz
? ¿Cómo marca Python qué instrucciones van dentro de un if?
+ Con la sangría
- Con llaves
- Con la palabra end
= La sangría es obligatoria en Python; en JavaScript se usan llaves.

? ¿Cuándo es verdadera la condición A and B?
+ Cuando A y B son verdaderas
- Cuando al menos una es verdadera
- Cuando las dos son falsas
= and (&& en JavaScript) exige que se cumplan las dos.

? En Python, ¿cómo se evalúa if []: (una lista vacía)?
- Como verdadero
+ Como falso
- Da un error
= Las colecciones vacías, 0, "" y None cuentan como falso.
:::

=== p1-bucles | Repetir: bucles for y while | 14 | 1
Los ordenadores son buenos haciendo lo mismo miles de veces sin cansarse. Para repetir se usan **bucles**.

[[video:bucle]]

## for: recorrer una colección o un rango

```python
for i in range(1, 6):          # 1, 2, 3, 4, 5
    print("Vuelta", i)

switches = ["SW1", "SW2", "SW3"]
for sw in switches:
    print("Haciendo copia de", sw)

for numero, sw in enumerate(switches, start=1):
    print(numero, sw)
```

```javascript
for (let i = 1; i <= 5; i++) {
  console.log("Vuelta", i);
}
for (const sw of ["SW1", "SW2", "SW3"]) {
  console.log("Haciendo copia de", sw);
}
```

## while: repetir mientras se cumpla una condición

```python
intentos = 0
conectado = False
while not conectado and intentos < 3:
    intentos += 1
    print("Intento", intentos)
    conectado = intentos == 2     # simulamos que conecta al segundo intento
```

::: cuidado
Si la condición de un `while` nunca se vuelve falsa, el bucle no termina nunca (**bucle infinito**). El laboratorio de esta web corta los programas que tardan más de 5 segundos.
:::

## break y continue

- `break` sale del bucle en ese momento.
- `continue` salta a la siguiente vuelta.

```python
for ip in ["10.0.0.1", "", "10.0.0.3", "FIN", "10.0.0.5"]:
    if ip == "":
        continue        # ignora las vacías
    if ip == "FIN":
        break           # deja de leer
    print("Comprobando", ip)
```

## Acumuladores y contadores

Patrón clásico: una variable que empieza en 0 y se actualiza en cada vuelta.

```python
total = 0
for velocidad in [100, 1000, 1000, 10000]:
    total += velocidad
print("Ancho de banda total:", total, "Mb/s")
```

## Bucles anidados

Un bucle dentro de otro: por cada sede, cada switch. Cuidado con el coste: 1.000 × 1.000 vueltas son un millón.

## Comprensiones de listas (Python)

```python
cuadrados = [n ** 2 for n in range(1, 6)]           # [1, 4, 9, 16, 25]
caidas = [i for i in interfaces if i["estado"] == "down"]
```

[[code:python-bucles]]

::: quiz
? ¿Qué valores recorre range(1, 4) en Python?
+ 1, 2 y 3
- 1, 2, 3 y 4
- 0, 1, 2 y 3
= El final de range no se incluye.

? ¿Qué hace break dentro de un bucle?
+ Sale del bucle inmediatamente
- Salta a la siguiente vuelta
- Reinicia el bucle
= continue salta a la siguiente vuelta; break termina el bucle.

? ¿Cuándo se produce un bucle infinito?
+ Cuando la condición del while nunca llega a ser falsa
- Cuando el for recorre una lista vacía
- Cuando se usa break
= Hay que asegurarse de que algo dentro del bucle acaba cambiando la condición.
:::

=== p1-funciones | Funciones: dividir el problema | 16 | 1
Una **función** es un bloque de código con nombre que hace una tarea concreta. Recibe datos (**parámetros**), trabaja y devuelve un resultado (**return**).

```python
def hosts_utiles(prefijo):
    """Devuelve cuántos hosts caben en una red IPv4 con ese prefijo."""
    return 2 ** (32 - prefijo) - 2

print(hosts_utiles(24))   # 254
print(hosts_utiles(26))   # 62
```

```javascript
function hostsUtiles(prefijo) {
  return 2 ** (32 - prefijo) - 2;
}
const hostsUtiles2 = (prefijo) => 2 ** (32 - prefijo) - 2;   // función flecha
```

## Por qué usar funciones

- **No repetir código** (principio DRY: *Don't Repeat Yourself*). Si hay un error, se arregla en un solo sitio.
- **Dividir** un problema grande en piezas pequeñas que se entienden y se prueban por separado.
- **Dar nombre** a lo que hace el código: `calcular_broadcast(ip, prefijo)` se explica solo.

## Parámetros

```python
def conectar(host, puerto=22, usuario="admin"):     # valores por defecto
    return f"{usuario}@{host}:{puerto}"

conectar("10.0.0.1")                      # admin@10.0.0.1:22
conectar("10.0.0.1", usuario="ana")       # argumento por nombre
```

## return frente a print

`print` **muestra** algo en pantalla; `return` **devuelve** un valor para usarlo en otra parte. Una función sin `return` devuelve `None` (en JavaScript, `undefined`). Las funciones útiles casi siempre devuelven algo.

## Ámbito (scope)

Las variables creadas dentro de una función solo existen dentro de ella (**variables locales**). Evita modificar variables globales desde las funciones: hace el código difícil de seguir.

## Funciones puras

Una función **pura** siempre devuelve lo mismo para los mismos argumentos y no cambia nada fuera de ella. Son las más fáciles de probar y de reutilizar.

## Funciones que ya existen

Antes de escribir una función, mira si el lenguaje ya la trae: `len()`, `max()`, `sorted()`, `sum()` en Python; `Math.max()`, `arr.sort()`, `str.includes()` en JavaScript. Y las **bibliotecas** (módulos) añaden miles más: `import ipaddress`, `import json`, `import datetime`.

[[code:js-basico]]

::: quiz
? ¿Qué diferencia hay entre return y print?
+ return devuelve un valor para usarlo después; print solo lo muestra
- Son lo mismo
- print es más rápido
= Una función que solo hace print no te permite usar el resultado en otro cálculo.

? ¿Qué devuelve una función de Python que no tiene return?
- 0
+ None
- Un error
= Sin return explícito, la función devuelve None.

? ¿Qué es un parámetro con valor por defecto?
+ Uno que toma un valor si no se indica al llamar a la función
- Uno que nunca se puede cambiar
- Uno que siempre vale 0
= def conectar(host, puerto=22) usa 22 si no se indica otro puerto.
:::

=== p1-colecciones | Listas, diccionarios y otras colecciones | 18 | 2
Casi nunca trabajarás con un solo dato: tendrás listas de equipos, tablas de puertos, inventarios… Las **colecciones** agrupan muchos valores.

## Listas (arrays)

Colección **ordenada** que se puede modificar.

```python
vlans = [10, 20, 30]
vlans.append(99)          # añade al final → [10, 20, 30, 99]
vlans.remove(30)          # quita un valor
print(vlans[0], vlans[-1], len(vlans))   # 10 99 3
print(vlans[1:3])         # trozo (slice): [20, 99]
print(20 in vlans)        # True
vlans.sort()
```

```javascript
const vlans = [10, 20, 30];
vlans.push(99);
console.log(vlans[0], vlans.at(-1), vlans.length, vlans.includes(20));
```

## Diccionarios (objetos, mapas)

Pares **clave → valor**. Ideales para buscar algo por su nombre.

```python
equipo = {"hostname": "R1", "modelo": "ISR4331", "puertos": 4}
print(equipo["hostname"])               # R1
equipo["estado"] = "up"                 # añadir o cambiar
print(equipo.get("serie", "desconocida"))
for clave, valor in equipo.items():
    print(clave, "=", valor)
```

```javascript
const equipo = { hostname: "R1", modelo: "ISR4331", puertos: 4 };
console.log(equipo.hostname, equipo["modelo"]);
for (const [clave, valor] of Object.entries(equipo)) console.log(clave, valor);
```

## Listas de diccionarios: la estructura más común

Así llegan los datos de una API, de una base de datos o de un fichero JSON:

```python
inventario = [
    {"hostname": "R1", "tipo": "router", "estado": "up"},
    {"hostname": "SW1", "tipo": "switch", "estado": "down"},
]
caidos = [e["hostname"] for e in inventario if e["estado"] == "down"]
```

## Otras colecciones

| Colección | Python | JavaScript | Para qué |
|---|---|---|---|
| Tupla (inmutable) | `(10, 20)` | — | Datos que no deben cambiar, coordenadas |
| Conjunto (sin repetidos) | `{10, 20}` / `set()` | `new Set()` | Quitar duplicados, pertenencia rápida |
| Mapa | `dict` | `Map` / objeto | Buscar por clave |

```python
macs = ["aa", "bb", "aa", "cc"]
print(len(set(macs)))     # 3 MAC distintas
```

## Transformar colecciones (JavaScript)

`map` transforma cada elemento, `filter` se queda con algunos y `reduce` los combina en un valor:

```javascript
const velocidades = [100, 1000, 10000];
const enGbps = velocidades.map(v => v / 1000);           // [0.1, 1, 10]
const rapidas = velocidades.filter(v => v >= 1000);      // [1000, 10000]
const total = velocidades.reduce((a, v) => a + v, 0);    // 11100
```

[[code:python-colecciones]]

[[code:js-arrays]]

::: quiz
? En Python, ¿qué devuelve vlans[-1]?
+ El último elemento
- El primero
- Un error
= Los índices negativos cuentan desde el final.

? ¿Qué colección usarías para buscar el modelo de un equipo por su hostname?
- Una lista
+ Un diccionario (clave hostname → valor modelo)
- Una tupla
= Los diccionarios buscan por clave de forma directa y rápida.

? ¿Cómo quitas los duplicados de una lista en Python?
+ Convirtiéndola en un conjunto: set(lista)
- Con lista.sort()
- Con len(lista)
= Un conjunto no admite elementos repetidos.

? ¿Qué hace filter en JavaScript?
+ Devuelve un array nuevo solo con los elementos que cumplen la condición
- Ordena el array
- Suma los elementos
= map transforma, filter selecciona y reduce combina.
:::

=== p1-pensar | Pensar como programador: pseudocódigo y depuración | 14 | 1
Saber la sintaxis de un lenguaje es la parte fácil. Lo difícil (y lo que de verdad se aprende con la práctica) es **descomponer problemas** y **encontrar errores**.

## Antes de escribir código

1. **Entiende el problema:** ¿qué datos entran? ¿qué debe salir? Escribe un ejemplo a mano.
2. **Divide:** parte el problema en pasos pequeños.
3. **Escribe pseudocódigo:** los pasos en lenguaje normal, sin preocuparte de la sintaxis.
4. **Tradúcelo** a código, paso a paso, y **pruébalo** después de cada paso.

Problema: *"Avisar de los switches que llevan más de 5 años sin actualizar el software"*.

```texto
PARA cada switch del inventario:
    años = año actual − año de su última actualización
    SI años > 5:
        añadir el switch a la lista de avisos
MOSTRAR la lista de avisos
```

Ahora traducirlo a Python o JavaScript es casi inmediato.

## Diagramas de flujo

Para algoritmos con muchas decisiones ayuda dibujar un diagrama: óvalos para inicio y fin, rectángulos para acciones y rombos para preguntas (sí/no).

## Los tres tipos de errores

| Tipo | Cuándo aparece | Ejemplo |
|---|---|---|
| **De sintaxis** | Antes de ejecutar: el código está mal escrito | Falta un paréntesis o los dos puntos de un `if` |
| **De ejecución** | Al ejecutar: algo imposible | Dividir por cero, usar una variable que no existe |
| **Lógicos** | El programa funciona… pero da un resultado incorrecto | Usar `<` en lugar de `<=` |

Los lógicos son los más difíciles: el ordenador no avisa.

## Cómo depurar (debugging)

1. **Lee el mensaje de error entero**, sobre todo la **última línea** (el tipo de error) y el **número de línea**.
2. **Reproduce** el fallo con el caso más pequeño posible.
3. **Mira los valores**: añade `print()` / `console.log()` para ver qué contiene cada variable en cada paso.
4. Usa un **depurador**: Visual Studio Code y los navegadores permiten pausar el programa (*breakpoints*) y avanzar línea a línea.
5. **Explícaselo a alguien** (o a un patito de goma): al contarlo paso a paso, sueles ver el fallo.
6. **Busca el mensaje de error** en internet: casi seguro que a alguien le pasó antes.

```texto
Traceback (most recent call last):
  File "inventario.py", line 12, in <module>
    total += equipo["puertos"]
KeyError: 'puertos'
```

Lectura: en la línea 12 se pidió la clave `"puertos"` y algún equipo no la tiene. Solución: `equipo.get("puertos", 0)` o revisar los datos.

## Hábitos que marcan la diferencia

- Prueba pronto y a menudo: no escribas 200 líneas antes de ejecutar la primera vez.
- Guarda tu código con **Git** (lo verás más adelante).
- Lee código de otros: es la forma más rápida de aprender estilos y trucos.
- Practica a diario aunque sea 30 minutos: la programación se aprende escribiendo.

::: quiz
? El programa se ejecuta sin errores pero el total sale mal. ¿Qué tipo de error es?
+ Lógico
- De sintaxis
- De compilación
= Los errores lógicos no producen mensajes: el resultado es incorrecto.

? ¿Qué es el pseudocódigo?
+ Los pasos del algoritmo escritos en lenguaje normal, sin sintaxis de un lenguaje concreto
- Código que no funciona
- Un lenguaje de programación antiguo
= Ayuda a pensar la solución antes de escribirla.

? En un mensaje de error de Python, ¿dónde suele estar la información más útil?
+ En la última línea (tipo de error) y en el número de línea
- En la primera palabra
- No hay información útil
= Por ejemplo: KeyError: 'puertos' en la línea 12.

? ¿Qué es un breakpoint?
+ Un punto donde el depurador detiene el programa para inspeccionarlo
- Un error que rompe el programa
- Un tipo de bucle
= Permite ver el valor de las variables en ese momento y avanzar línea a línea.
:::
