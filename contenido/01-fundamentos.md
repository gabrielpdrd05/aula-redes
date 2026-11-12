---
area: redes
id: m1
titulo: Fundamentos de redes
dominio: 1.0 Network Fundamentals
peso: 20
descripcion: Qué es una red, qué hace cada equipo, los modelos OSI y TCP/IP, cableado, Ethernet, direccionamiento IPv4 e IPv6, subnetting, TCP/UDP, inalámbrico y virtualización.
---
=== m1-redes | ¿Qué es una red? | 12 | 1
Una **red** es un conjunto de dispositivos conectados que comparten información y recursos. Cuando abres una página web, tu móvil manda datos a través de varias redes (la wifi de tu casa, la red de tu proveedor de internet, la red troncal de internet y la red del servidor) y la respuesta vuelve por el mismo tipo de camino en milisegundos.

## Los elementos de cualquier red

- **Dispositivos finales (endpoints):** los que originan o reciben los datos. PC, portátiles, móviles, impresoras, cámaras IP, servidores.
- **Dispositivos intermedios:** los que mueven los datos. Switches, routers, puntos de acceso inalámbricos, firewalls.
- **Medios:** por donde viajan los datos. Cobre (cable UTP), fibra óptica o el aire (wifi).
- **Servicios y protocolos:** las reglas que todos siguen para entenderse (Ethernet, IP, TCP, DNS, HTTP...).

## Tipos de red según su alcance

| Tipo | Significado | Ejemplo |
|---|---|---|
| LAN | Local Area Network | La red de una oficina o de un edificio |
| WLAN | Wireless LAN | La wifi de un hotel |
| WAN | Wide Area Network | La que une la sede de Santo Domingo con la de Santiago |
| MAN | Metropolitan Area Network | Red de fibra que cubre una ciudad |
| SOHO | Small Office / Home Office | Un router doméstico que hace de switch, wifi y firewall a la vez |

## Topologías

La **topología física** es cómo están conectados los cables; la **lógica**, cómo circulan los datos.

- **Estrella:** todos los equipos conectados a un dispositivo central (un switch). Es la topología de casi todas las LAN modernas: si falla un cable, solo cae un equipo.
- **Estrella extendida o jerárquica:** varias estrellas unidas entre sí; así crecen los campus.
- **Malla completa (full mesh):** cada nodo conectado con todos los demás. Máxima redundancia, alto coste. Para *n* nodos hacen falta *n(n-1)/2* enlaces.
- **Malla parcial:** solo algunos nodos tienen enlaces redundantes. Es lo habitual en las WAN.
- **Bus y anillo:** históricas; hoy casi no se usan en LAN.

::: nota
En los diagramas de red, Cisco usa iconos estándar: el **router** es un círculo con flechas, el **switch** un rectángulo con flechas y la **nube** representa una red que no controlas, como internet o la WAN del proveedor.
:::

::: quiz
? ¿Qué topología física usan casi todas las LAN modernas?
- Bus
- Anillo
+ Estrella
- Malla completa
= En las LAN cada equipo se conecta con su propio cable a un switch central: es una estrella. Si un cable falla, solo se pierde ese equipo.

? ¿Cuántos enlaces hacen falta para una malla completa de 5 routers?
- 5
- 8
+ 10
- 20
= Se aplica n(n-1)/2 = 5·4/2 = 10 enlaces.

? Una impresora de red es un ejemplo de...
+ Dispositivo final
- Dispositivo intermedio
- Medio de transmisión
= Los dispositivos finales originan o reciben datos. Los intermedios (switches, routers) solo los transportan.

? ¿Qué tipo de red une dos sedes de una empresa en ciudades distintas?
- LAN
+ WAN
- WLAN
- SOHO
= Una WAN (red de área amplia) conecta redes separadas geográficamente, normalmente a través de un proveedor.
:::

=== m1-dispositivos | Los dispositivos de red y su función | 14 | 1
Para el examen tienes que saber **qué hace cada equipo** y **en qué capa trabaja**.

## Switch (conmutador)

Conecta los dispositivos de una misma LAN. Trabaja en la **capa 2** (enlace de datos): aprende las **direcciones MAC** de los equipos conectados a cada puerto y envía cada trama solo al puerto donde está el destino. Cada puerto de un switch es un **dominio de colisión** independiente.

Un **switch de capa 3** (multicapa) además enruta entre VLAN, como un router, pero a velocidad de hardware.

## Router (enrutador)

Conecta **redes distintas** y decide el mejor camino para cada paquete según la **dirección IP** de destino (**capa 3**). Separa **dominios de broadcast**: un broadcast nunca atraviesa un router. Es la puerta de enlace (*default gateway*) de los equipos de una LAN.

## Punto de acceso inalámbrico (AP)

Conecta dispositivos wifi a la red cableada. Puede funcionar de forma **autónoma** o **ligera** (*lightweight*), gestionado por un **controlador inalámbrico (WLC)** que centraliza la configuración de decenas o cientos de AP.

## Firewall y NGFW

Un **firewall** filtra el tráfico según reglas y mantiene el estado de las conexiones (*stateful*): deja entrar las respuestas a conexiones que salieron desde dentro y bloquea lo que llega sin haber sido solicitado. Un **firewall de nueva generación (NGFW)** añade inspección de aplicaciones, IPS integrado, filtrado de URL y control por usuario.

## IPS

Un **sistema de prevención de intrusiones (IPS)** analiza el tráfico buscando patrones de ataque (firmas) y los bloquea en tiempo real. Un **IDS** solo los detecta y avisa.

## Servidores y endpoints

Los **servidores** ofrecen servicios (web, correo, DNS, DHCP, ficheros). Los **endpoints** son los equipos de usuario y los dispositivos IoT.

## PoE (Power over Ethernet)

Permite que el switch alimente por el propio cable de red a teléfonos IP, cámaras y puntos de acceso. Los estándares principales son **802.3af (PoE, hasta 15,4 W)**, **802.3at (PoE+, hasta 30 W)** y **802.3bt (PoE++, hasta 60–100 W)**.

| Dispositivo | Capa principal | Separa... |
|---|---|---|
| Hub (obsoleto) | 1 | Nada: todo es un dominio de colisión |
| Switch | 2 | Dominios de colisión |
| Router | 3 | Dominios de colisión y de broadcast |

::: examen
Pregunta clásica: "¿Qué dispositivo separa dominios de broadcast?" → el **router** (o un switch de capa 3 al enrutar entre VLAN). Los switches de capa 2 reenvían los broadcasts por todos sus puertos de la misma VLAN.
:::

::: quiz
? ¿Qué dispositivo toma sus decisiones de reenvío según la dirección MAC de destino?
+ Switch
- Router
- Firewall
- Punto de acceso autónomo funcionando como router
= El switch es un dispositivo de capa 2: mira la MAC de destino de la trama y consulta su tabla de direcciones MAC.

? ¿Qué dispositivo separa dominios de broadcast?
- Hub
- Switch de capa 2
+ Router
= Los routers no reenvían broadcasts, así que cada interfaz de un router es un dominio de broadcast distinto.

? ¿Qué diferencia a un IPS de un IDS?
+ El IPS bloquea el tráfico malicioso en línea; el IDS solo lo detecta y avisa
- El IDS bloquea y el IPS solo avisa
- No hay diferencia
= El IPS está en línea con el tráfico y puede descartar paquetes. El IDS recibe una copia del tráfico y genera alertas.

? ¿Qué estándar PoE ofrece hasta 30 W por puerto?
- 802.3af
+ 802.3at (PoE+)
- 802.3bt
- 802.11ac
= 802.3af da hasta 15,4 W, 802.3at (PoE+) hasta 30 W y 802.3bt hasta 60–100 W. 802.11ac es un estándar wifi.

? ¿Qué equipo centraliza la gestión de muchos puntos de acceso ligeros?
- Un router
+ Un controlador inalámbrico (WLC)
- Un switch de capa 2
= Los AP ligeros (lightweight) dependen de un WLC, que les entrega la configuración y gestiona la radiofrecuencia.
:::

=== m1-osi | Los modelos OSI y TCP/IP | 16 | 1
Para que equipos de fabricantes distintos se entiendan, la comunicación se divide en **capas**. Cada capa hace un trabajo concreto y ofrece un servicio a la capa de arriba.

## El modelo OSI (7 capas)

| N.º | Capa | Qué hace | PDU | Ejemplos |
|---|---|---|---|---|
| 7 | Aplicación | Interfaz con las aplicaciones de red | Datos | HTTP, DNS, SMTP, SSH |
| 6 | Presentación | Formato, cifrado, compresión | Datos | TLS, JPEG, ASCII |
| 5 | Sesión | Abre, mantiene y cierra diálogos | Datos | RPC, NetBIOS |
| 4 | Transporte | Comunicación extremo a extremo, puertos, fiabilidad | Segmento (TCP) / datagrama (UDP) | TCP, UDP |
| 3 | Red | Direccionamiento lógico y enrutamiento | Paquete | IPv4, IPv6, ICMP |
| 2 | Enlace de datos | Entrega en el mismo enlace, MAC, detección de errores | Trama | Ethernet, 802.11, PPP |
| 1 | Física | Bits sobre el medio: voltajes, luz, ondas | Bits | Cables, conectores, radio |

Truco para recordarlas de abajo arriba: **"Fíjate En Raquel Todos Sus Pasos Antiguos"** (Física, Enlace, Red, Transporte, Sesión, Presentación, Aplicación).

## El modelo TCP/IP (el que se usa en la práctica)

| Capa TCP/IP | Equivale en OSI |
|---|---|
| Aplicación | 5, 6 y 7 |
| Transporte | 4 |
| Internet | 3 |
| Acceso a la red (enlace + física) | 1 y 2 |

Algunos libros dividen la última capa en *enlace* y *física* (modelo de 5 capas): es la versión que usa Cisco en sus materiales.

## Encapsulación

Cuando un equipo envía datos, cada capa **añade su propia cabecera** a lo que recibe de la capa superior: la aplicación genera los datos, TCP añade puertos (segmento), IP añade direcciones IP (paquete) y Ethernet añade direcciones MAC y una cola de comprobación, el **FCS** (trama). En el receptor ocurre lo contrario: **desencapsulación**, cada capa quita su cabecera y entrega el resto a la de arriba.

[[anim:encapsulacion]]

::: examen
Asocia siempre: **capa 2 → MAC → trama → switch** y **capa 3 → IP → paquete → router**. El examen lo pregunta de muchas formas.
:::

::: quiz
? ¿En qué capa del modelo OSI trabaja el direccionamiento IP?
- Capa 2
+ Capa 3
- Capa 4
- Capa 7
= La capa de red (3) se encarga del direccionamiento lógico (IP) y del enrutamiento.

? ¿Cómo se llama la PDU de la capa de enlace de datos?
- Paquete
- Segmento
+ Trama
- Bit
= Capa 2 → trama; capa 3 → paquete; capa 4 → segmento (TCP) o datagrama (UDP); capa 1 → bits.

? ¿Qué capa del modelo TCP/IP agrupa las capas 5, 6 y 7 del modelo OSI?
+ Aplicación
- Transporte
- Internet
= La capa de aplicación de TCP/IP cubre las funciones de sesión, presentación y aplicación del modelo OSI.

? ¿Qué añade la capa de enlace de datos al final de la trama para detectar errores?
- Un número de puerto
+ El FCS (secuencia de verificación de trama)
- La dirección IP de destino
= El FCS es un CRC que calcula el emisor. Si el receptor obtiene otro valor, descarta la trama.

? Al recibir datos, cada capa quita su cabecera y pasa el resto a la capa superior. ¿Cómo se llama este proceso?
- Encapsulación
+ Desencapsulación
- Segmentación
= Encapsular es añadir cabeceras al enviar; desencapsular es quitarlas al recibir.
:::

=== m1-cableado | Medios físicos y cableado | 15 | 1
La capa física transporta los bits. Elegir bien el medio determina la velocidad, la distancia y la fiabilidad del enlace.

## Cable de cobre UTP

El **par trenzado sin apantallar (UTP)** tiene 4 pares de hilos trenzados para reducir las interferencias. Usa conectores **RJ-45**.

| Categoría | Velocidad típica | Distancia máxima |
|---|---|---|
| Cat 5e | 1 Gbps | 100 m |
| Cat 6 | 1 Gbps (10 Gbps hasta 55 m) | 100 m |
| Cat 6a | 10 Gbps | 100 m |
| Cat 8 | 25/40 Gbps | 30 m |

Los estándares Ethernet sobre cobre se nombran así: **10BASE-T** (10 Mbps), **100BASE-TX** (Fast Ethernet), **1000BASE-T** (Gigabit), **10GBASE-T** (10 Gigabit). El límite de **100 metros** por segmento es una pregunta habitual.

## Cable directo y cruzado

- **Directo (straight-through):** une equipos de **distinto tipo**: PC con switch, router con switch.
- **Cruzado (crossover):** une equipos del **mismo tipo**: switch con switch, router con router, PC con PC, PC con router.

Hoy casi todos los puertos tienen **Auto-MDIX**, que detecta el cable y se adapta solo, pero el examen sigue preguntándolo.

## Fibra óptica

Transmite luz, no electricidad: no le afectan las interferencias electromagnéticas y llega mucho más lejos.

- **Monomodo (SMF):** núcleo muy fino (~9 µm), láser, decenas de kilómetros. Para enlaces largos y WAN.
- **Multimodo (MMF):** núcleo más ancho (50 o 62,5 µm), LED o VCSEL, hasta unos cientos de metros. Para dentro de edificios y centros de datos.

Conectores habituales: **LC** (el más usado hoy), **SC** y **ST**. Los switches usan módulos **SFP/SFP+/QSFP** intercambiables para elegir el tipo de fibra o cobre de cada puerto.

## Problemas de interfaz y cable

Con `show interfaces` se ven los contadores de errores. Debes saber interpretarlos:

| Síntoma | Qué significa | Causa típica |
|---|---|---|
| CRC / input errors | Tramas que llegan dañadas | Cable defectuoso, interferencias, desajuste de dúplex |
| Runts | Tramas de menos de 64 bytes | Colisiones, desajuste de dúplex |
| Giants | Tramas de más de 1518 bytes | Configuración de MTU distinta |
| Late collisions | Colisiones después de los primeros 64 bytes | **Desajuste de dúplex** o cable demasiado largo |

El **desajuste de dúplex** (un extremo en *full* y el otro en *half*) es el clásico: el enlace funciona pero lento y con colisiones tardías. Se arregla configurando ambos extremos igual (lo ideal: los dos en `auto`).

```ios
Switch# show interfaces gigabitEthernet0/1
GigabitEthernet0/1 is up, line protocol is up (connected)
  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX
     0 runts, 0 giants, 0 throttles
     12 input errors, 12 CRC, 0 frame, 0 overrun, 0 ignored
     0 late collision, 0 deferred
```

::: quiz
? ¿Cuál es la distancia máxima de un segmento Ethernet sobre UTP Cat 6a a 10 Gbps?
- 55 m
+ 100 m
- 500 m
- 2 km
= Todas las categorías UTP habituales (5e, 6, 6a) están especificadas hasta 100 metros por segmento.

? ¿Qué cable se usa (sin Auto-MDIX) para conectar dos switches?
- Directo
+ Cruzado
- De consola
= Equipos del mismo tipo se conectan con cable cruzado. PC–switch o router–switch usan cable directo.

? ¿Qué tipo de fibra conviene para un enlace de 20 km?
+ Monomodo
- Multimodo
- UTP Cat 8
= La fibra monomodo, con láser y núcleo fino, alcanza decenas de kilómetros. La multimodo se queda en cientos de metros.

? Una interfaz muestra muchas colisiones tardías (late collisions). ¿Cuál es la causa más probable?
- La MTU es distinta en cada extremo
+ Desajuste de dúplex
- El cable es de fibra
- El puerto está en otra VLAN
= Las colisiones tardías aparecen típicamente cuando un extremo trabaja en full-duplex y el otro en half-duplex.

? ¿Qué indica el contador "giants"?
- Tramas demasiado cortas
+ Tramas mayores que el tamaño máximo permitido
- Errores de CRC
= Giants son tramas de más de 1518 bytes (sin contar etiquetas), normalmente por MTU distintas.
:::

=== m1-ethernet | Ethernet y la conmutación de tramas | 15 | 1
**Ethernet** (IEEE 802.3) es el protocolo de capa 2 de casi todas las LAN cableadas.

## La dirección MAC

Cada interfaz de red tiene una **dirección MAC** de **48 bits** (6 bytes), escrita en hexadecimal: `00:1A:2B:3C:4D:5E` o, en formato Cisco, `001a.2b3c.4d5e`. Los primeros 24 bits son el **OUI** (identifican al fabricante) y los otros 24 los asigna el fabricante.

- **Unicast:** un único destino.
- **Broadcast:** `FFFF.FFFF.FFFF`, a todos los equipos de la LAN (o de la VLAN).
- **Multicast:** a un grupo (en IPv4 empiezan por `0100.5E`).

## La trama Ethernet

| Campo | Tamaño | Función |
|---|---|---|
| Preámbulo + SFD | 8 bytes | Sincronización |
| MAC destino | 6 bytes | A quién va |
| MAC origen | 6 bytes | Quién la envía |
| Tipo / longitud | 2 bytes | Protocolo de capa 3 (0x0800 = IPv4, 0x86DD = IPv6) |
| Datos | 46–1500 bytes | El paquete (MTU estándar: 1500) |
| FCS | 4 bytes | Detección de errores (CRC) |

## Cómo trabaja un switch

Un switch hace tres cosas con cada trama:

1. **Aprende:** mira la **MAC de origen** y anota en su tabla MAC (CAM) que esa dirección está en el puerto por el que llegó.
2. **Reenvía o filtra:** busca la **MAC de destino** en la tabla. Si la encuentra, envía la trama **solo por ese puerto** (*known unicast*). Si el destino está en el mismo puerto por el que entró, la descarta.
3. **Inunda (flooding):** si el destino es **desconocido**, un **broadcast** o un multicast, la envía por **todos los puertos** de la VLAN **menos** por el que entró.

Las entradas de la tabla caducan si no se usan durante **300 segundos** (envejecimiento por defecto en Cisco).

[[anim:switch]]

```ios
Switch# show mac address-table
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0050.7966.6800    DYNAMIC     Gi0/1
  10    0050.7966.6801    DYNAMIC     Gi0/2
```

## Dominios de colisión y dúplex

Con los antiguos hubs, todos compartían el medio y usaban **CSMA/CD** para gestionar colisiones. En un switch moderno con **full-duplex**, cada puerto envía y recibe a la vez y **no hay colisiones**.

::: quiz
? ¿Qué campo de la trama usa el switch para aprender en qué puerto está cada equipo?
+ La MAC de origen
- La MAC de destino
- La IP de origen
- El FCS
= El switch aprende con la MAC de origen y decide el reenvío con la MAC de destino.

? Un switch recibe una trama unicast cuya MAC de destino no está en su tabla. ¿Qué hace?
- La descarta
+ La inunda por todos los puertos de la VLAN excepto el de entrada
- La envía al router
- Pide la MAC con ARP
= Es una trama unicast desconocida: el switch la inunda. Cuando el destino responda, aprenderá su MAC.

? ¿Cuántos bits tiene una dirección MAC?
- 32
+ 48
- 64
- 128
= Una MAC tiene 48 bits (6 bytes); los 24 primeros son el OUI del fabricante.

? ¿Cuál es la dirección MAC de broadcast?
- 0000.0000.0000
+ FFFF.FFFF.FFFF
- 0100.5E00.0000
= Todos los bits a 1. Las direcciones que empiezan por 0100.5E son multicast IPv4.

? ¿Cuánto tiempo tarda por defecto en caducar una entrada dinámica de la tabla MAC en un switch Cisco?
- 30 segundos
+ 300 segundos
- 4 horas
= El temporizador de envejecimiento por defecto es de 300 segundos (5 minutos).
:::

=== m1-binario | Números binarios y hexadecimales | 14 | 1
Las direcciones IP y las máscaras son números binarios. Dominar la conversión es la base del subnetting.

## Binario a decimal

Un **octeto** tiene 8 bits. Cada posición vale el doble que la de su derecha:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

`11000000` = 128 + 64 = **192**.

## Decimal a binario

Resta de izquierda a derecha los valores que caben. Ejemplo con **172**: 172 − 128 = 44 (1), no cabe 64 (0), 44 − 32 = 12 (1), no cabe 16 (0), 12 − 8 = 4 (1), 4 − 4 = 0 (1), y el resto ceros → `10101100`.

## Los valores que debes saber de memoria

Son los únicos valores posibles en un octeto de máscara:

| Binario | Decimal | Bits a 1 |
|---|---|---|
| 10000000 | 128 | 1 |
| 11000000 | 192 | 2 |
| 11100000 | 224 | 3 |
| 11110000 | 240 | 4 |
| 11111000 | 248 | 5 |
| 11111100 | 252 | 6 |
| 11111110 | 254 | 7 |
| 11111111 | 255 | 8 |

## Hexadecimal

Base 16 (0–9 y A–F). Cada dígito hexadecimal son **4 bits**, así que un byte son dos dígitos: `1010 1100` = `AC`. Lo usarás en las MAC y en IPv6.

| Hex | Binario | Decimal |
|---|---|---|
| A | 1010 | 10 |
| C | 1100 | 12 |
| F | 1111 | 15 |

[[lab:binario]]

::: quiz
? ¿Cuánto vale en decimal el octeto 11100000?
- 192
+ 224
- 240
- 248
= 128 + 64 + 32 = 224.

? ¿Cuál es la representación binaria de 10?
- 00001100
+ 00001010
- 00010100
= 10 = 8 + 2 → 00001010.

? ¿Cuántos bits representa cada dígito hexadecimal?
- 2
+ 4
- 8
- 16
= Un dígito hexadecimal va de 0 a 15, que son exactamente 4 bits.

? El octeto de máscara 252 tiene...
- 5 bits a 1
+ 6 bits a 1
- 7 bits a 1
= 252 = 11111100: seis unos y dos ceros.
:::

=== m1-ipv4 | Direccionamiento IPv4 | 16 | 1
Una **dirección IPv4** tiene **32 bits**, escritos como cuatro octetos en decimal separados por puntos: `192.168.10.25`.

## Red y host

Toda dirección IP tiene dos partes: la **porción de red** (igual para todos los equipos de la misma red) y la **porción de host** (distinta para cada equipo). La **máscara de subred** indica dónde está la frontera: los bits a 1 marcan la red y los bits a 0 marcan el host.

`192.168.10.25` con máscara `255.255.255.0` (prefijo **/24**): la red es `192.168.10.0` y el host es `.25`.

## Direcciones especiales de cada red

- **Dirección de red:** todos los bits de host a 0 → `192.168.10.0`. Identifica la red; no se asigna a equipos.
- **Broadcast:** todos los bits de host a 1 → `192.168.10.255`. Llega a todos los equipos de la red.
- **Hosts utilizables:** las que quedan en medio → `.1` a `.254`. Número de hosts = **2ⁿ − 2**, donde *n* son los bits de host. En una /24: 2⁸ − 2 = 254.

## Clases (histórico, pero se pregunta)

| Clase | Primer octeto | Máscara por defecto | Uso |
|---|---|---|---|
| A | 1–126 | /8 | Redes muy grandes |
| B | 128–191 | /16 | Redes medianas |
| C | 192–223 | /24 | Redes pequeñas |
| D | 224–239 | — | Multicast |
| E | 240–255 | — | Experimental |

`127.0.0.0/8` está reservado para **loopback** (`127.0.0.1` es el propio equipo).

## Direcciones privadas (RFC 1918)

No se enrutan en internet; se usan dentro de las organizaciones y salen a internet mediante **NAT**:

- `10.0.0.0/8`
- `172.16.0.0/12` (de 172.16.0.0 a 172.31.255.255)
- `192.168.0.0/16`

Otras especiales: **APIPA** `169.254.0.0/16` (el equipo se la pone solo cuando no encuentra servidor DHCP) y `100.64.0.0/10` (CGNAT de los proveedores).

## Unicast, broadcast y multicast

- **Unicast:** de un equipo a otro.
- **Broadcast:** a todos los de la red.
- **Multicast:** a un grupo suscrito (224.0.0.0/4). Por ejemplo, OSPF usa 224.0.0.5 y 224.0.0.6.

::: examen
Si ves que un PC tiene una dirección `169.254.x.x`, la respuesta casi siempre es: **no ha podido contactar con el servidor DHCP**.
:::

::: quiz
? ¿Cuál de estas direcciones es privada?
- 172.32.1.1
+ 172.20.5.10
- 192.169.1.1
- 11.0.0.1
= El rango privado 172.16.0.0/12 va de 172.16.0.0 a 172.31.255.255. 172.32.x.x ya es pública.

? ¿Cuántos hosts utilizables tiene una red /24?
- 256
+ 254
- 255
- 252
= 8 bits de host → 2⁸ − 2 = 254 (se restan la dirección de red y la de broadcast).

? Un PC tiene la IP 169.254.33.7. ¿Qué ha pasado?
- Tiene una IP pública
+ No ha recibido dirección del servidor DHCP y se ha autoasignado una APIPA
- Está usando NAT
= El rango 169.254.0.0/16 (APIPA o link-local) lo usa el sistema cuando el DHCP no responde.

? ¿Cuál es la dirección de broadcast de la red 10.20.30.0/24?
- 10.20.30.0
- 10.20.255.255
+ 10.20.30.255
= Con /24 el host es el último octeto; todos sus bits a 1 dan 255.

? ¿A qué clase pertenece 150.10.1.1?
- A
+ B
- C
- D
= El primer octeto 150 está entre 128 y 191: clase B.
:::

=== m1-subnetting | Subnetting paso a paso | 22 | 2
**Hacer subredes** (subnetting) es dividir una red en redes más pequeñas tomando bits de la porción de host. Sirve para separar departamentos, reducir los broadcasts y no desperdiciar direcciones.

## Las tres fórmulas

- **Número de subredes:** 2ˢ, donde *s* son los bits que tomas prestados.
- **Hosts por subred:** 2ʰ − 2, donde *h* son los bits de host que quedan.
- **Tamaño del bloque (salto):** 256 − (valor del octeto interesante de la máscara).

## El método del bloque (el más rápido)

Ejemplo: ¿a qué subred pertenece `172.16.45.130/27`, cuál es su broadcast y su rango?

1. **/27** = `255.255.255.224`. El octeto "interesante" (el que no es 255 ni 0) es el cuarto: **224**.
2. **Bloque** = 256 − 224 = **32**. Las subredes empiezan en múltiplos de 32: 0, 32, 64, 96, **128**, 160...
3. 130 cae entre 128 y 159 → red **172.16.45.128**.
4. **Broadcast** = siguiente red − 1 = **172.16.45.159**.
5. **Hosts**: de **.129** a **.158** (2⁵ − 2 = 30 hosts).

## Tabla de prefijos imprescindible

| Prefijo | Máscara | Bloque | Hosts |
|---|---|---|---|
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 |
| /31 | 255.255.255.254 | 2 | 2 (solo enlaces punto a punto, RFC 3021) |
| /32 | 255.255.255.255 | 1 | 1 (una ruta de host) |

Lo mismo se aplica en el tercer o segundo octeto: `10.0.0.0/20` tiene la máscara `255.255.240.0`, bloque 16 en el **tercer** octeto.

## Diseñar subredes según los hosts que necesitas

"Necesito subredes de al menos 50 hosts a partir de 192.168.1.0/24": busca el menor *h* con 2ʰ − 2 ≥ 50 → h = 6 (62 hosts) → prefijo /26 → cuatro subredes: .0, .64, .128, .192.

[[lab:subnetting]]

::: practica
Haz 10 ejercicios del entrenador cada día. Cuando aciertes 10 seguidos en menos de 20 segundos cada uno, estás listo para el examen.
:::

::: quiz
? ¿A qué subred pertenece 192.168.5.77/26?
- 192.168.5.0
+ 192.168.5.64
- 192.168.5.76
- 192.168.5.128
= /26 → bloque 64 → subredes 0, 64, 128, 192. 77 está entre 64 y 127.

? ¿Cuál es el broadcast de 10.1.1.100/28?
- 10.1.1.255
- 10.1.1.96
+ 10.1.1.111
- 10.1.1.112
= /28 → bloque 16 → la subred de .100 empieza en .96 y la siguiente en .112, así que el broadcast es .111.

? ¿Cuántos hosts utilizables tiene una /29?
- 8
+ 6
- 4
- 14
= 3 bits de host → 2³ − 2 = 6.

? ¿Qué máscara corresponde a /20?
- 255.255.255.240
+ 255.255.240.0
- 255.255.248.0
- 255.240.0.0
= 20 bits a 1: 8 + 8 + 4 → 255.255.240.0.

? Necesitas subredes de al menos 100 hosts. ¿Qué prefijo desperdicia menos direcciones?
- /24
+ /25
- /26
= /25 da 126 hosts (≥ 100). /26 solo da 62, que no alcanza.

? ¿Qué prefijo se usa habitualmente en enlaces punto a punto entre dos routers para ahorrar direcciones?
- /24
- /28
+ /30 (o /31)
= Un /30 deja exactamente 2 hosts. Cisco también admite /31 en enlaces punto a punto.
:::

=== m1-vlsm | VLSM y resumen de rutas | 18 | 2
Con subnetting clásico todas las subredes tienen el mismo tamaño. Con **VLSM** (máscara de subred de longitud variable) cada subred tiene el tamaño que necesita.

## Cómo diseñar con VLSM

Ordena las necesidades **de mayor a menor** y asigna en ese orden, empezando cada bloque en un múltiplo de su tamaño.

Ejemplo con `192.168.10.0/24`: Ventas 100 hosts, Soporte 50, Gerencia 20 y dos enlaces entre routers.

| Red | Hosts necesarios | Prefijo | Subred | Rango de hosts | Broadcast |
|---|---|---|---|---|---|
| Ventas | 100 | /25 | 192.168.10.0 | .1 – .126 | .127 |
| Soporte | 50 | /26 | 192.168.10.128 | .129 – .190 | .191 |
| Gerencia | 20 | /27 | 192.168.10.192 | .193 – .222 | .223 |
| Enlace R1–R2 | 2 | /30 | 192.168.10.224 | .225 – .226 | .227 |
| Enlace R2–R3 | 2 | /30 | 192.168.10.228 | .229 – .230 | .231 |

Todavía queda libre de `192.168.10.232` a `.255` para crecer.

## Resumen de rutas (sumarización)

Varias redes contiguas pueden anunciarse con **una sola ruta** si comparten los primeros bits. Así la tabla de enrutamiento es más pequeña y más estable.

Ejemplo: `172.16.0.0/24`, `172.16.1.0/24`, `172.16.2.0/24` y `172.16.3.0/24`. En binario, el tercer octeto es 000000**00**, 000000**01**, 000000**10** y 000000**11**: coinciden los 6 primeros bits del tercer octeto → 8 + 8 + 6 = **/22** → resumen **172.16.0.0/22**.

[[lab:vlsm]]

::: cuidado
Un resumen demasiado amplio puede atraer tráfico hacia redes que no existen detrás de ese router. Resume solo bloques que realmente tienes.
:::

::: quiz
? Con VLSM, ¿en qué orden se asignan las subredes?
+ De la que necesita más hosts a la que necesita menos
- De la más pequeña a la más grande
- En orden alfabético
= Asignar primero las grandes evita que queden huecos mal alineados.

? ¿Cuál es la ruta resumen de 10.1.4.0/24, 10.1.5.0/24, 10.1.6.0/24 y 10.1.7.0/24?
- 10.1.0.0/16
+ 10.1.4.0/22
- 10.1.4.0/23
- 10.1.0.0/21
= 4 = 00000100 y 7 = 00000111: coinciden los 6 primeros bits del tercer octeto → /22 desde 10.1.4.0.

? Una subred para 25 hosts, ¿qué prefijo necesita como mínimo?
- /28
+ /27
- /26
= /27 da 30 hosts. /28 solo da 14.
:::

=== m1-ipv6 | IPv6 | 20 | 2
IPv4 tiene unos 4.300 millones de direcciones y se agotaron hace años. **IPv6** usa **128 bits**: unos 340 sextillones de direcciones.

## Formato

Ocho grupos de cuatro dígitos hexadecimales (16 bits cada uno) separados por dos puntos:

`2001:0DB8:0000:0000:0000:FF00:0042:8329`

## Reglas para abreviar

1. Quitar los **ceros a la izquierda** de cada grupo: `0DB8` → `DB8`, `0042` → `42`.
2. Sustituir **una sola** secuencia de grupos de ceros consecutivos por `::`.

Resultado: `2001:DB8::FF00:42:8329`. Solo se puede usar `::` **una vez**; si no, no se sabría cuántos grupos representa cada uno.

## Prefijo

Igual que en IPv4 pero sin máscara decimal: `2001:DB8:ACAD:1::/64`. En las LAN se usa casi siempre **/64**: 64 bits de red y 64 bits para el **identificador de interfaz**.

## Tipos de direcciones

| Tipo | Prefijo | Para qué |
|---|---|---|
| Global unicast (GUA) | 2000::/3 | Pública y enrutable en internet (equivale a una IPv4 pública) |
| Unique local (ULA) | FC00::/7 (en la práctica FD00::/8) | Privada, como RFC 1918 |
| Link-local | FE80::/10 | Solo válida en el enlace; **toda interfaz IPv6 tiene una**. Los routers la usan como siguiente salto |
| Multicast | FF00::/8 | Grupos. FF02::1 = todos los nodos, FF02::2 = todos los routers |
| Loopback | ::1/128 | El propio equipo |
| No especificada | ::/128 | "Todavía no tengo dirección" |

IPv6 **no tiene broadcast**: usa multicast. Existe también **anycast**: la misma dirección en varios equipos; el tráfico llega al más cercano.

## Cómo obtiene un equipo su dirección

- **Manual (estática).**
- **SLAAC:** el router anuncia el prefijo (mensaje *Router Advertisement*, RA) y el equipo crea su identificador de interfaz, aleatorio o con **EUI-64**.
- **DHCPv6** con estado (como DHCP en IPv4) o sin estado (SLAAC para la dirección y DHCPv6 para DNS y otros datos).

## EUI-64

Genera el identificador de interfaz a partir de la MAC de 48 bits: se parte la MAC por la mitad, se inserta **FFFE** en medio y se **invierte el 7.º bit** del primer byte.

MAC `00:1A:2B:3C:4D:5E` → `001A:2BFF:FE3C:4D5E` → 7.º bit invertido: `00` (00000000) pasa a `02` (00000010) → **`021A:2BFF:FE3C:4D5E`**.

```ios
R1(config)# ipv6 unicast-routing
R1(config)# interface g0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::/64 eui-64
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1# show ipv6 interface brief
```

::: examen
`ipv6 unicast-routing` es imprescindible para que un router Cisco **enrute** IPv6 y envíe Router Advertisements. Sin ese comando las interfaces tienen dirección IPv6, pero el router no reenvía paquetes IPv6.
:::

::: quiz
? ¿Cuál es la abreviatura correcta de 2001:0DB8:0000:0000:0001:0000:0000:0001?
- 2001:DB8::1::1
+ 2001:DB8::1:0:0:1
- 2001:DB8:0:0:1::1:1
= Solo se puede usar :: una vez. Se reemplaza la primera secuencia de ceros (dos grupos) y el resto se escribe como 0.

? ¿Qué prefijo identifica las direcciones link-local?
- 2000::/3
- FC00::/7
+ FE80::/10
- FF00::/8
= Las link-local empiezan por FE80 y solo son válidas dentro del enlace.

? ¿Qué sustituye en IPv6 al broadcast de IPv4?
- Anycast
+ Multicast
- Unicast
= IPv6 no tiene broadcast; usa grupos multicast como FF02::1 (todos los nodos).

? ¿Qué comando permite a un router Cisco reenviar tráfico IPv6?
- ipv6 enable
+ ipv6 unicast-routing
- ip routing
= ipv6 unicast-routing activa el enrutamiento IPv6 y el envío de Router Advertisements.

? Con EUI-64, ¿qué se inserta en medio de la MAC?
- 0000
+ FFFE
- FE80
= Se divide la MAC en dos mitades de 24 bits, se inserta FFFE y se invierte el séptimo bit.

? ¿Qué tipo de dirección IPv6 equivale a las privadas de IPv4?
- Global unicast
+ Unique local (FC00::/7)
- Link-local
= Las ULA (FD00::/8 en la práctica) son para uso interno y no se enrutan en internet.
:::

=== m1-transporte | TCP y UDP | 16 | 1
La capa de transporte lleva los datos **de una aplicación a otra**. Para saber a qué aplicación pertenece cada segmento usa **números de puerto**.

## Puertos

- **Bien conocidos (0–1023):** servicios estándar.
- **Registrados (1024–49151):** aplicaciones concretas.
- **Dinámicos o efímeros (49152–65535):** los que elige el cliente para cada conexión.

Una conexión se identifica por el **socket**: IP + puerto de origen y IP + puerto de destino.

## TCP: fiable y orientado a conexión

- **Establece la conexión** con el *three-way handshake*: **SYN → SYN-ACK → ACK**.
- **Numera** cada byte (número de secuencia) y el receptor **confirma** lo recibido (ACK). Lo que no se confirma, se retransmite.
- **Control de flujo** con la **ventana deslizante**: el receptor indica cuántos datos puede aceptar.
- Cierra la conexión con **FIN** y ACK (cuatro mensajes).

[[anim:tcp]]

## UDP: rápido y sin conexión

No establece conexión, no confirma ni retransmite, no ordena. Su cabecera mide solo **8 bytes** (TCP, 20 como mínimo). Es ideal cuando la rapidez importa más que perder algún dato: **voz y vídeo en tiempo real, DNS, DHCP, TFTP, SNMP, syslog**.

## Puertos que tienes que saberte

| Puerto | Protocolo | Transporte |
|---|---|---|
| 20, 21 | FTP (datos, control) | TCP |
| 22 | SSH / SCP / SFTP | TCP |
| 23 | Telnet | TCP |
| 25 | SMTP | TCP |
| 53 | DNS | UDP (y TCP para respuestas grandes y transferencias de zona) |
| 67, 68 | DHCP (servidor, cliente) | UDP |
| 69 | TFTP | UDP |
| 80 | HTTP | TCP |
| 110 | POP3 | TCP |
| 123 | NTP | UDP |
| 143 | IMAP | TCP |
| 161, 162 | SNMP (consultas, traps) | UDP |
| 443 | HTTPS | TCP |
| 514 | Syslog | UDP |
| 3389 | RDP | TCP |

::: quiz
? ¿Cuál es la secuencia del three-way handshake de TCP?
- SYN, ACK, SYN-ACK
+ SYN, SYN-ACK, ACK
- ACK, SYN, FIN
= El cliente envía SYN, el servidor responde SYN-ACK y el cliente confirma con ACK.

? ¿Qué protocolo de transporte usa la voz sobre IP para el audio?
- TCP, porque garantiza la entrega
+ UDP, porque prioriza la baja latencia
= Retransmitir audio que llega tarde no sirve; UDP evita los retrasos de las confirmaciones.

? ¿Qué puerto usa SSH?
- 21
+ 22
- 23
- 443
= SSH usa el puerto TCP 22. Telnet usa el 23.

? ¿Qué mecanismo de TCP permite al receptor indicar cuántos datos puede aceptar antes de confirmar?
- El checksum
+ La ventana deslizante
- El número de puerto
= El tamaño de ventana es el control de flujo de TCP.

? ¿Qué servicio usa los puertos UDP 67 y 68?
- DNS
- TFTP
+ DHCP
- SNMP
= El servidor DHCP escucha en el 67 y el cliente en el 68.

? ¿Cuál es el tamaño de la cabecera UDP?
+ 8 bytes
- 20 bytes
- 40 bytes
= UDP solo lleva puertos de origen y destino, longitud y checksum: 8 bytes.
:::

=== m1-arp | ARP: de la IP a la MAC | 14 | 1
Para enviar un paquete a otro equipo de **su misma red**, un PC necesita la **MAC** del destino, porque la trama Ethernet va dirigida a una MAC. **ARP** (Address Resolution Protocol) la averigua.

## Cómo funciona

1. El PC A (192.168.1.10) quiere hablar con 192.168.1.20. Mira su **caché ARP**; si no la tiene...
2. Envía un **ARP Request** en **broadcast** (`FFFF.FFFF.FFFF`): "¿Quién tiene 192.168.1.20? Díselo a 192.168.1.10".
3. Todos los equipos de la LAN lo reciben; solo responde el que tiene esa IP con un **ARP Reply** en **unicast**: "192.168.1.20 está en 0050.7966.6801".
4. A guarda la respuesta en su caché y ya puede enviar la trama.

[[anim:arp]]

## ¿Y si el destino está en otra red?

El PC compara la IP de destino con su propia red (usando su máscara). Si el destino está **fuera**, no hace ARP del destino sino de su **puerta de enlace predeterminada** (default gateway): la trama va a la MAC del router, aunque el paquete lleve la IP del destino final.

::: examen
En cada salto, el router **cambia las direcciones MAC** (origen: su interfaz de salida; destino: el siguiente salto), pero las **direcciones IP de origen y destino no cambian** (salvo que haya NAT). Esta pregunta aparece siempre.
:::

## Ver la caché ARP

```bash
C:\> arp -a
  Dirección de Internet    Dirección física      Tipo
  192.168.1.1              00-1a-2b-3c-4d-5e     dinámico
```

```ios
R1# show ip arp
Protocol  Address        Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.10          3   0050.7966.6800  ARPA   GigabitEthernet0/0
```

En IPv6 no existe ARP: lo sustituye **NDP** (Neighbor Discovery), con los mensajes **Neighbor Solicitation** y **Neighbor Advertisement** enviados por multicast.

::: quiz
? ¿Cómo se envía un ARP Request?
+ En broadcast
- En unicast al router
- En multicast al grupo 224.0.0.5
= Como el emisor no conoce la MAC de destino, pregunta a todos con una trama de broadcast.

? Un PC quiere enviar datos a un servidor de internet. ¿De qué dirección IP hace ARP?
- De la IP del servidor
+ De la IP de su puerta de enlace predeterminada
- De la IP del servidor DNS
= El destino está en otra red, así que la trama se envía al router: necesita la MAC del gateway.

? Cuando un paquete atraviesa un router (sin NAT), ¿qué cambia?
- Las direcciones IP de origen y destino
+ Las direcciones MAC de origen y destino
- Nada
= El router reconstruye la trama en cada salto con nuevas MAC; las IP se mantienen de extremo a extremo.

? ¿Qué protocolo sustituye a ARP en IPv6?
- DHCPv6
+ NDP (Neighbor Discovery)
- ICMP Echo
= NDP usa mensajes ICMPv6 Neighbor Solicitation y Neighbor Advertisement.
:::

=== m1-verificar | Verificar la configuración IP en el sistema operativo | 12 | 1
Antes de culpar a la red, comprueba la configuración del propio equipo. Debes conocer los comandos de Windows, macOS y Linux.

## Ver la configuración

| Sistema | Comando | Qué muestra |
|---|---|---|
| Windows | `ipconfig` / `ipconfig /all` | IP, máscara, gateway; con /all también MAC, DNS y DHCP |
| macOS | `ifconfig` o `networksetup -getinfo Wi-Fi` | Interfaces, IP, máscara |
| Linux | `ip addr` (o `ifconfig`) e `ip route` | Direcciones y tabla de rutas |

Lo que tienes que revisar: **IP, máscara, puerta de enlace y servidores DNS**. Un error en cualquiera rompe la conectividad de forma distinta:

- **Máscara incorrecta:** el equipo cree que destinos locales son remotos o al revés.
- **Gateway incorrecto o ausente:** llega a su red local pero no a otras redes.
- **DNS incorrecto:** `ping 8.8.8.8` funciona pero `ping google.com` no.

## Comandos de diagnóstico

```bash
ping 192.168.1.1          # ¿hay conectividad? (ICMP Echo Request / Reply)
tracert 8.8.8.8           # Windows: por qué routers pasa
traceroute 8.8.8.8        # Linux/macOS
nslookup aula.example     # ¿resuelve el DNS?
ipconfig /release         # Windows: suelta la IP de DHCP
ipconfig /renew           # pide una nueva
ipconfig /flushdns        # vacía la caché DNS
```

## Método para diagnosticar "no tengo internet"

1. `ipconfig`: ¿tengo IP válida (no 169.254) y gateway?
2. `ping` a mi gateway: ¿llego a mi router?
3. `ping 8.8.8.8`: ¿llego a internet?
4. `ping google.com` o `nslookup google.com`: ¿funciona el DNS?

::: quiz
? `ping 8.8.8.8` funciona pero `ping www.cisco.com` falla. ¿Qué es lo más probable?
- La puerta de enlace está mal configurada
+ Hay un problema de DNS
- El cable está roto
= Si llegas a una IP de internet pero no resuelves nombres, el fallo está en el DNS.

? ¿Qué comando de Windows muestra la MAC y los servidores DNS?
- ipconfig
+ ipconfig /all
- arp -d
= ipconfig a secas solo muestra IP, máscara y gateway.

? Un equipo llega a los equipos de su red pero a ningún otro sitio. ¿Qué revisarías primero?
+ La puerta de enlace predeterminada
- El servidor DNS
- La dirección MAC
= Sin un gateway correcto, el equipo no sabe enviar tráfico fuera de su red.
:::

=== m1-inalambrico | Principios de las redes inalámbricas | 16 | 1
Las WLAN usan los estándares **IEEE 802.11**. Comparten el aire, así que conviene entender cómo se reparten las frecuencias.

## Bandas y estándares

| Estándar | Nombre comercial | Bandas | Velocidad teórica |
|---|---|---|---|
| 802.11b/g | — | 2,4 GHz | 11 / 54 Mbps |
| 802.11a | — | 5 GHz | 54 Mbps |
| 802.11n | Wi-Fi 4 | 2,4 y 5 GHz | 600 Mbps |
| 802.11ac | Wi-Fi 5 | 5 GHz | ~3,5 Gbps |
| 802.11ax | Wi-Fi 6 / 6E | 2,4, 5 y 6 GHz (6E) | ~9,6 Gbps |
| 802.11be | Wi-Fi 7 | 2,4, 5 y 6 GHz | ~46 Gbps |

## Canales

- **2,4 GHz:** solo hay **tres canales que no se solapan: 1, 6 y 11**. Más alcance, más interferencias (microondas, Bluetooth).
- **5 GHz:** muchos más canales sin solapamiento; menos alcance, menos interferencias.
- **6 GHz** (Wi-Fi 6E/7): aún más canales y muy limpios.

Al diseñar, los AP vecinos deben usar **canales que no se solapen** entre sí.

## Conceptos básicos

- **SSID:** el nombre de la red wifi.
- **BSS:** un AP y sus clientes. Se identifica por el **BSSID** (la MAC de la radio del AP).
- **ESS:** varios AP con el mismo SSID unidos por la red cableada; el cliente puede moverse entre ellos (**roaming**).
- **IBSS (ad hoc):** clientes conectados entre sí sin AP.
- **Modo de acceso:** wifi usa **CSMA/CA** (evitar colisiones), porque una radio no puede escuchar mientras transmite.

## Factores de la radiofrecuencia

Absorción (agua, personas), reflexión (metal), dispersión e interferencias reducen la señal. Se mide en **dBm**: −30 dBm es excelente, −67 dBm es el mínimo recomendado para voz, −80 dBm es mala.

::: quiz
? ¿Cuáles son los canales de 2,4 GHz que no se solapan?
- 1, 5 y 9
+ 1, 6 y 11
- 2, 7 y 12
- 36, 40 y 44
= En 2,4 GHz los canales están separados 5 MHz y ocupan 20 MHz: solo 1, 6 y 11 no se pisan.

? ¿Qué método de acceso al medio usa wifi?
- CSMA/CD
+ CSMA/CA
- Token passing
= Las radios no pueden detectar colisiones mientras transmiten, así que intentan evitarlas (Collision Avoidance).

? ¿Cómo se llama un conjunto de AP que comparten SSID y permiten el roaming?
- BSS
+ ESS
- IBSS
= Un ESS (Extended Service Set) son varios BSS con el mismo SSID unidos por un sistema de distribución.

? ¿Qué estándar corresponde a Wi-Fi 6?
- 802.11n
- 802.11ac
+ 802.11ax
= Wi-Fi 4 = 802.11n, Wi-Fi 5 = 802.11ac, Wi-Fi 6/6E = 802.11ax, Wi-Fi 7 = 802.11be.
:::

=== m1-virtualizacion | Virtualización y nube | 14 | 2
## Máquinas virtuales

Un **hipervisor** permite ejecutar varias **máquinas virtuales (VM)** en un mismo servidor físico, cada una con su propio sistema operativo.

- **Tipo 1 (bare metal):** se instala directamente sobre el hardware. VMware ESXi, Microsoft Hyper-V, KVM. Es el de los centros de datos.
- **Tipo 2 (hosted):** se ejecuta sobre un sistema operativo. VirtualBox, VMware Workstation.

Las VM se conectan a la red a través de un **switch virtual** (vSwitch) dentro del hipervisor, que a su vez sale por las tarjetas físicas del servidor.

## Contenedores

Un **contenedor** empaqueta una aplicación con sus dependencias, pero **comparte el núcleo** del sistema operativo anfitrión. Arranca en segundos y ocupa mucho menos que una VM. Herramientas: **Docker** para crearlos y **Kubernetes** para orquestarlos.

## VRF

**VRF (Virtual Routing and Forwarding)** permite tener **varias tablas de enrutamiento independientes** en un mismo router, como si fueran varios routers. Los proveedores lo usan para separar clientes que incluso pueden usar las mismas IP privadas.

## Modelos de nube

| Modelo | El proveedor gestiona | Tú gestionas | Ejemplo |
|---|---|---|---|
| IaaS | Hardware, red, virtualización | SO, aplicaciones, datos | AWS EC2, Azure VM |
| PaaS | Todo lo anterior + SO y plataforma | Aplicaciones y datos | Google App Engine |
| SaaS | Todo | Solo usarlo | Microsoft 365, Gmail |

Tipos de despliegue: **pública, privada, híbrida y comunitaria**. La conexión a la nube puede ir por internet (con VPN) o por enlaces privados dedicados (AWS Direct Connect, Azure ExpressRoute).

::: quiz
? ¿Qué tipo de hipervisor se instala directamente sobre el hardware?
+ Tipo 1
- Tipo 2
= El tipo 1 (bare metal, como ESXi) no necesita un sistema operativo debajo.

? ¿Qué diferencia principal hay entre un contenedor y una VM?
- El contenedor tiene su propio núcleo
+ El contenedor comparte el núcleo del sistema anfitrión
- Las VM son más ligeras
= Por compartir el núcleo, los contenedores son mucho más ligeros y rápidos de arrancar.

? ¿Qué tecnología permite varias tablas de enrutamiento aisladas en un mismo router?
- VLAN
+ VRF
- HSRP
- NAT
= VRF crea instancias de enrutamiento independientes en el mismo equipo.

? Una empresa usa Microsoft 365 para el correo. ¿Qué modelo de nube es?
- IaaS
- PaaS
+ SaaS
= Software como servicio: la empresa solo usa la aplicación.
:::

=== m1-arquitecturas | Arquitecturas de red | 14 | 2
## Diseño jerárquico de campus

**Tres capas** (redes grandes):

- **Acceso:** donde se conectan los usuarios. Switches con PoE, VLAN, seguridad de puertos.
- **Distribución:** agrega los switches de acceso, aplica políticas (ACL), enruta entre VLAN y da redundancia.
- **Núcleo (core):** el troncal de alta velocidad. Debe ser rápido y redundante; no se le añaden filtros que lo ralenticen.

**Dos capas o núcleo colapsado (collapsed core):** distribución y núcleo en los mismos equipos. Habitual en empresas medianas.

## Spine-leaf (centros de datos)

Cada switch **leaf** (donde se conectan los servidores) se une a **todos** los switches **spine**, y los spine no se conectan entre sí ni los leaf entre ellos. Así cualquier servidor está siempre a la **misma distancia** (leaf → spine → leaf) de cualquier otro, ideal para el tráfico **este-oeste** entre servidores.

## WAN

Conecta sedes: líneas dedicadas, **MPLS** del proveedor, **Metro Ethernet**, internet con VPN o **SD-WAN** (gestión centralizada que combina varios enlaces).

## SOHO

Un solo equipo hace de router, switch, punto de acceso wifi, firewall, servidor DHCP y NAT.

## On-premises frente a nube

- **On-premises:** los equipos están en las instalaciones de la empresa; control total, inversión inicial alta.
- **Nube:** pago por uso, escalabilidad inmediata; dependes de la conexión y del proveedor.

::: quiz
? ¿En qué capa del modelo jerárquico se conectan los usuarios finales?
+ Acceso
- Distribución
- Núcleo
= La capa de acceso conecta los endpoints y aplica funciones como PoE, VLAN y port security.

? En una arquitectura spine-leaf, ¿con qué se conecta cada leaf?
- Solo con otro leaf
+ Con todos los spine
- Con un único spine
= Cada leaf se conecta con todos los spine, así todo servidor está a dos saltos de cualquier otro.

? ¿Qué es un diseño de núcleo colapsado?
+ Las capas de distribución y núcleo se combinan en los mismos equipos
- Una red sin capa de acceso
- Una red que ha fallado
= Es el diseño de dos capas, típico en sedes medianas.
:::
