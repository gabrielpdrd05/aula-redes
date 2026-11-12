---
id: m2
titulo: Acceso a la red
dominio: 2.0 Network Access
peso: 20
descripcion: Cisco IOS, VLAN, trunks, enrutamiento entre VLAN, CDP/LLDP, EtherChannel, Spanning Tree y redes inalámbricas con controlador.
---
=== m2-ios | Primeros pasos con Cisco IOS | 18 | 1
**IOS** es el sistema operativo de los routers y switches Cisco. Se maneja por línea de comandos (CLI) y en el examen tendrás que leer y escribir configuraciones.

## Los modos de la CLI

| Modo | Indicador | Cómo se entra | Para qué |
|---|---|---|---|
| EXEC de usuario | `Switch>` | Al conectarte | Comandos básicos de consulta |
| EXEC privilegiado | `Switch#` | `enable` | Todos los `show`, `copy`, `reload`, `debug` |
| Configuración global | `Switch(config)#` | `configure terminal` | Cambiar la configuración |
| Configuración de interfaz | `Switch(config-if)#` | `interface g0/1` | Configurar un puerto |
| Configuración de línea | `Switch(config-line)#` | `line console 0` / `line vty 0 15` | Acceso por consola o remoto |

- `exit` sube un nivel; `end` (o **Ctrl+Z**) vuelve directamente al modo privilegiado.
- `?` muestra la ayuda en cualquier punto; **Tab** completa el comando.
- Los comandos se pueden abreviar mientras no sean ambiguos: `conf t`, `sh run`, `int g0/1`.
- Desde el modo de configuración se pueden ejecutar comandos `show` anteponiendo `do`: `do show ip interface brief`.

## Configuración básica de un equipo

```ios
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# enable secret Cl4ve-Segura
SW1(config)# service password-encryption
SW1(config)# banner motd # Acceso solo para personal autorizado #
SW1(config)# line console 0
SW1(config-line)# password C0nsola!
SW1(config-line)# login
SW1(config-line)# exec-timeout 5 0
SW1(config-line)# end
SW1# copy running-config startup-config
```

## Las dos configuraciones

- **running-config:** la que está en uso, en **RAM**. Se pierde al reiniciar.
- **startup-config:** la que se carga al arrancar, en **NVRAM**.

Guarda siempre con `copy running-config startup-config` (o `write memory`). `show running-config` muestra la configuración actual y `show startup-config` la guardada. Para volver a la configuración de fábrica: `erase startup-config` y `reload`.

## Memorias de un equipo Cisco

| Memoria | Qué guarda |
|---|---|
| ROM | Programa de arranque (bootstrap, POST, ROMMON) |
| Flash | La imagen de IOS |
| NVRAM | startup-config |
| RAM | running-config, tablas (MAC, rutas, ARP), IOS en ejecución |

[[cli:basico]]

::: quiz
? ¿Qué indicador muestra la CLI en el modo EXEC privilegiado?
- Switch>
+ Switch#
- Switch(config)#
= El símbolo # indica el modo privilegiado, al que se entra con enable.

? ¿Dónde se guarda la startup-config?
- RAM
- Flash
+ NVRAM
- ROM
= La NVRAM no se borra al apagar el equipo; en ella vive la startup-config.

? Configuras un switch y lo reinicias sin guardar. ¿Qué pasa con los cambios?
+ Se pierden, porque solo estaban en la running-config (RAM)
- Se mantienen, porque IOS guarda automáticamente
= Hay que ejecutar copy running-config startup-config para que sobrevivan al reinicio.

? ¿Qué combinación vuelve directamente al modo privilegiado desde cualquier submodo de configuración?
- exit
+ end o Ctrl+Z
- disable
= exit solo sube un nivel; end y Ctrl+Z vuelven al modo EXEC privilegiado.

? ¿Qué comando cifra con un hash seguro la contraseña del modo privilegiado?
- enable password
+ enable secret
- service password-encryption
= enable secret guarda un hash (tipo 5, 8 o 9). service password-encryption solo ofusca con el débil tipo 7.
:::

=== m2-primera-red | Tu primera red completa, paso a paso | 20 | 1
Antes de entrar en cada tecnología por separado, veamos **cómo encaja todo** en la red de una oficina pequeña real: 12 PC, una impresora, un switch, un router y salida a Internet. Esta lección es el mapa; en las siguientes profundizas en cada pieza.

## 1. El plan: dibuja antes de configurar

Ningún técnico toca un equipo sin un plan. Para esta oficina:

| Elemento | Decisión |
|---|---|
| Red de la oficina | `192.168.1.0/24` (254 direcciones, de sobra) |
| Puerta de enlace (router) | `192.168.1.1` |
| Equipos fijos (impresora, switch) | `192.168.1.2` a `192.168.1.10`, puestas a mano |
| PC | `192.168.1.11` en adelante, por **DHCP** |
| Enlace con el proveedor | `203.0.113.0/30`: el router es `.2`, el proveedor `.1` |

::: nota
Una **/30** deja solo 2 direcciones útiles: perfecta para un enlace entre dos routers. Lo verás a fondo en Subnetting.
:::

## 2. El cableado

- Cada PC va a un **puerto de acceso** del switch con un cable de par trenzado (Cat 6, conector RJ45).
- El switch va al router por un puerto **Gigabit** (en una oficina con VLAN, este enlace será un **trunk**).
- El router va al equipo del proveedor (ONT, módem o router del ISP).

El **switch** reparte las tramas dentro de la oficina mirando las **MAC**. El **router** saca hacia Internet todo lo que no es de la oficina mirando las **IP**.

## 3. El switch: lo mínimo para que sea seguro y gestionable

Un switch funciona "de fábrica" (todos los puertos en la VLAN 1), pero en una empresa nunca se deja así:

```ios
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW-OFICINA
SW-OFICINA(config)# enable secret Cl4ve-Priv!
SW-OFICINA(config)# interface vlan 1
SW-OFICINA(config-if)# ip address 192.168.1.2 255.255.255.0
SW-OFICINA(config-if)# no shutdown
SW-OFICINA(config-if)# exit
SW-OFICINA(config)# ip default-gateway 192.168.1.1
SW-OFICINA(config)# end
SW-OFICINA# copy running-config startup-config
```

- La **SVI** (`interface vlan 1`) es la IP del switch para administrarlo; el switch no la necesita para conmutar.
- `ip default-gateway` permite administrarlo desde otras redes.

## 4. El router: la puerta de salida

```ios
Router(config)# hostname R1
R1(config)# interface g0/0
R1(config-if)# description LAN oficina
R1(config-if)# ip address 192.168.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# interface g0/1
R1(config-if)# ip address 203.0.113.2 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1
```

::: cuidado
Las interfaces de un **router** vienen apagadas (`administratively down`): sin `no shutdown` no funcionan. Las de un **switch** vienen encendidas.
:::

La **ruta por defecto** (`0.0.0.0/0`) dice: "todo lo que no conozcas, mándalo al proveedor".

## 5. Servicios: DHCP y NAT

- **DHCP** reparte a cada PC su IP, máscara, puerta de enlace y DNS sin configurarlos a mano.
- **NAT/PAT** traduce las IP privadas (`192.168.x.x`) a la IP pública del router, porque las privadas no existen en Internet.

```ios
R1(config)# ip dhcp excluded-address 192.168.1.1 192.168.1.10
R1(config)# ip dhcp pool OFICINA
R1(dhcp-config)# network 192.168.1.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.1.1
R1(dhcp-config)# dns-server 8.8.8.8
R1(dhcp-config)# exit
R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface g0/1 overload
R1(config)# interface g0/0
R1(config-if)# ip nat inside
R1(config-if)# interface g0/1
R1(config-if)# ip nat outside
```

## 6. Verificar: siempre, y en orden

| Pregunta | Comando |
|---|---|
| ¿Las interfaces están up/up y con la IP correcta? | `show ip interface brief` |
| ¿El router sabe salir a Internet? | `show ip route` (busca `Gateway of last resort`) |
| ¿Hay conexión con el proveedor y más allá? | `ping 203.0.113.1` y `ping 8.8.8.8` |
| ¿Los PC reciben IP? | `show ip dhcp binding` |
| ¿Se traducen las direcciones? | `show ip nat translations` |

Y al final, **guardar**: `copy running-config startup-config`. Lo que no guardas desaparece al reiniciar.

::: practica
Configura tú mismo el router de esta oficina en el laboratorio de abajo. Después, en la sección **Práctica**, tienes los laboratorios de DHCP y NAT.
:::

[[cli:router]]

::: quiz
? ¿Qué equipo decide por dónde salen los paquetes hacia Internet?
- El switch
+ El router
- El PC
= El router trabaja con IP (capa 3) y usa su tabla de rutas; el switch solo reparte tramas dentro de la LAN.

? ¿Qué comando falta casi siempre cuando una interfaz de router recién configurada no funciona?
+ no shutdown
- ip routing
- switchport mode access
= Las interfaces de router vienen administrativamente apagadas.

? ¿Para qué sirve la ruta 0.0.0.0 0.0.0.0 hacia el proveedor?
- Para bloquear Internet
+ Para enviar al proveedor todo lo que el router no conoce
- Para dar IP a los PC
= Es la ruta por defecto: la que se usa cuando no hay una ruta más específica.

? ¿Por qué se excluyen direcciones del DHCP?
+ Para reservarlas a equipos con IP fija (router, impresoras, switch)
- Para que el DHCP vaya más rápido
- Porque son direcciones públicas
= Si no se excluyen, el DHCP podría repartir la IP del router o de la impresora y provocar un conflicto.
:::

=== m2-vlan | VLAN: redes virtuales | 18 | 1
Una **VLAN** divide un switch físico en varios switches lógicos. Cada VLAN es un **dominio de broadcast** distinto y una **subred IP** distinta.

## Por qué usar VLAN

- **Seguridad:** el tráfico de Contabilidad no se mezcla con el de Invitados.
- **Rendimiento:** los broadcasts solo llegan a los equipos de su VLAN.
- **Flexibilidad:** agrupas a los usuarios por función, no por ubicación física.

## Rangos de VLAN

- **VLAN 1:** la VLAN por defecto; todos los puertos están en ella de fábrica. No se puede borrar. Es buena práctica **no usarla** para datos.
- **Rango normal:** 1–1005 (1002–1005 reservadas para tecnologías antiguas).
- **Rango extendido:** 1006–4094.

## Configurar VLAN y puertos de acceso

Un **puerto de acceso** pertenece a **una sola VLAN** y se conecta a un equipo final.

```ios
SW1(config)# vlan 10
SW1(config-vlan)# name VENTAS
SW1(config-vlan)# vlan 20
SW1(config-vlan)# name SOPORTE
SW1(config-vlan)# exit
SW1(config)# interface range g0/1 - 12
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# interface g0/13
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 20
SW1(config-if)# end
SW1# show vlan brief
```

## VLAN de voz

Un teléfono IP suele tener un PC conectado detrás. El puerto lleva **datos sin etiquetar** en la VLAN de acceso y **voz etiquetada** en la VLAN de voz:

```ios
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# switchport voice vlan 50
```

[[anim:vlan]]

[[cli:vlan]]

::: examen
Dos PC en VLAN distintas **no pueden comunicarse** aunque estén en el mismo switch, a menos que haya un router o un switch de capa 3 que enrute entre las VLAN.
:::

::: quiz
? Cada VLAN es...
- Un dominio de colisión
+ Un dominio de broadcast
- Un tipo de cable
= Los broadcasts de una VLAN no salen de ella; por eso cada VLAN necesita su propia subred IP.

? ¿Qué comando asigna un puerto a la VLAN 30?
- vlan 30
+ switchport access vlan 30
- switchport trunk allowed vlan 30
- ip vlan 30
= En modo interfaz, switchport access vlan 30 pone el puerto de acceso en esa VLAN.

? ¿Qué comando muestra un resumen de las VLAN y sus puertos?
+ show vlan brief
- show interfaces trunk
- show ip interface brief
= show vlan brief lista cada VLAN, su nombre, estado y puertos de acceso.

? ¿Cuál es la VLAN por defecto en la que están todos los puertos de un switch Cisco nuevo?
+ VLAN 1
- VLAN 0
- VLAN 1002
- VLAN 4094
= Todos los puertos empiezan en la VLAN 1, que no se puede eliminar.

? Un puerto con un teléfono IP y un PC detrás, ¿cómo lleva el tráfico?
+ Datos sin etiquetar en la VLAN de acceso y voz etiquetada en la VLAN de voz
- Todo sin etiquetar en la misma VLAN
- Como un trunk con todas las VLAN
= switchport voice vlan permite que el teléfono etiquete su tráfico con la VLAN de voz mientras el PC usa la VLAN de datos.
:::

=== m2-trunk | Trunks 802.1Q | 18 | 2
Si las VLAN se extienden por varios switches, el enlace entre ellos debe llevar el tráfico de **todas** las VLAN: es un **trunk** (troncal).

## Cómo funciona 802.1Q

El switch inserta una **etiqueta de 4 bytes** en la trama, entre la MAC de origen y el campo tipo. Contiene el **VLAN ID (12 bits)** y la prioridad **CoS (3 bits)** para QoS. El switch de destino lee la etiqueta, la quita y entrega la trama en la VLAN correcta.

## La VLAN nativa

Las tramas de la **VLAN nativa** viajan por el trunk **sin etiqueta**. Por defecto es la VLAN 1. Debe ser **la misma en los dos extremos**; si no, CDP avisa con un mensaje de *native VLAN mismatch* y el tráfico se mezcla entre VLAN.

Buena práctica de seguridad: cambiar la VLAN nativa a una **VLAN sin uso** para evitar ataques de doble etiquetado (*VLAN hopping*).

## Configuración

```ios
SW1(config)# interface g0/24
SW1(config-if)# switchport trunk encapsulation dot1q   ! solo en switches que también admiten ISL
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# switchport trunk allowed vlan 10,20,50
SW1(config-if)# switchport nonegotiate
SW1(config-if)# end
SW1# show interfaces trunk
```

`switchport trunk allowed vlan add 30` añade una VLAN sin borrar las demás. **Cuidado**: sin `add`, la lista se sustituye entera.

## DTP

El **Dynamic Trunking Protocol** (propietario de Cisco) negocia automáticamente si un enlace será trunk:

| Modo local \ remoto | dynamic auto | dynamic desirable | trunk | access |
|---|---|---|---|---|
| dynamic auto | Acceso | Trunk | Trunk | Acceso |
| dynamic desirable | Trunk | Trunk | Trunk | Acceso |
| trunk | Trunk | Trunk | Trunk | No recomendado |

Dos puertos en **dynamic auto** no forman trunk. Lo recomendable es configurar los trunks de forma estática y desactivar DTP con `switchport nonegotiate`.

## VTP

El **VLAN Trunking Protocol** propaga la lista de VLAN entre switches (modos servidor, cliente y transparente). Es arriesgado: un switch con un número de revisión mayor puede borrar las VLAN de toda la red. Muchas redes usan **modo transparente** o VTPv3.

[[cli:trunk]]

::: quiz
? ¿Cuántos bits tiene el campo VLAN ID de la etiqueta 802.1Q?
- 8
+ 12
- 16
= 12 bits permiten 4096 valores (VLAN 0–4095; utilizables 1–4094).

? ¿Cómo viajan por el trunk las tramas de la VLAN nativa?
+ Sin etiqueta
- Con doble etiqueta
- Cifradas
= Por definición, la VLAN nativa no se etiqueta en 802.1Q.

? Dos switches tienen sus puertos en dynamic auto. ¿Qué tipo de enlace forman?
- Trunk
+ Acceso
- EtherChannel
= Ninguno de los dos inicia la negociación, así que el enlace se queda como acceso.

? ¿Qué pasa al ejecutar switchport trunk allowed vlan 30 en un trunk que permitía las VLAN 10 y 20?
- Se añade la VLAN 30 a las existentes
+ El trunk pasa a permitir solo la VLAN 30
= Sin la palabra add, la lista se reemplaza. Para añadir: switchport trunk allowed vlan add 30.

? ¿Qué comando muestra los trunks, su VLAN nativa y las VLAN permitidas?
- show vlan brief
+ show interfaces trunk
- show cdp neighbors
= show interfaces trunk lista los puertos en modo trunk con su encapsulación, VLAN nativa y VLAN permitidas y activas.
:::

=== m2-intervlan | Enrutamiento entre VLAN | 16 | 2
Cada VLAN es una subred distinta, así que para comunicarlas hace falta un dispositivo de capa 3. Hay tres formas.

## 1. Un router con una interfaz por VLAN (antiguo)

Una interfaz física del router por cada VLAN. No escala: se acaban las interfaces.

## 2. Router-on-a-stick (ROAS)

Un único enlace **trunk** entre el switch y el router, dividido en **subinterfaces**, una por VLAN:

```ios
R1(config)# interface g0/0
R1(config-if)# no shutdown
R1(config-if)# interface g0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config-subif)# interface g0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0
R1(config-subif)# interface g0/0.99
R1(config-subif)# encapsulation dot1Q 99 native
```

Cada subinterfaz es la puerta de enlace de su VLAN. El puerto del switch hacia el router debe estar en `switchport mode trunk`.

## 3. Switch de capa 3 con SVI (lo habitual hoy)

Una **SVI** (*Switched Virtual Interface*) es una interfaz virtual de VLAN con dirección IP. El switch enruta entre ellas a velocidad de hardware:

```ios
SW1(config)# ip routing
SW1(config)# interface vlan 10
SW1(config-if)# ip address 192.168.10.1 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# interface vlan 20
SW1(config-if)# ip address 192.168.20.1 255.255.255.0
SW1(config-if)# no shutdown
```

Una SVI está **up/up** solo si la VLAN existe y al menos un puerto de esa VLAN está activo (o un trunk que la lleve).

También se puede convertir un puerto de un switch de capa 3 en **puerto enrutado** con `no switchport` y darle una IP, por ejemplo para el enlace con el router de salida.

::: examen
Si un switch de capa 3 no enruta entre VLAN, revisa que tenga `ip routing`. Sin ese comando las SVI funcionan como interfaces de gestión, pero no se enruta.
:::

[[cli:intervlan]]

::: quiz
? En router-on-a-stick, ¿qué comando asocia una subinterfaz a la VLAN 30?
- switchport access vlan 30
+ encapsulation dot1Q 30
- vlan 30
= Dentro de la subinterfaz, encapsulation dot1Q 30 indica qué VLAN atiende.

? ¿Qué es una SVI?
+ Una interfaz virtual de VLAN con dirección IP en un switch
- Un puerto físico en modo trunk
- Un tipo de cable
= Las SVI (interface vlan X) sirven de gateway para cada VLAN en un switch de capa 3.

? ¿Qué comando activa el enrutamiento IPv4 en un switch de capa 3?
+ ip routing
- ipv6 unicast-routing
- router ospf 1
= Por defecto un switch multicapa no enruta; ip routing lo activa.

? ¿Qué convierte un puerto de un switch de capa 3 en puerto enrutado?
- switchport mode trunk
+ no switchport
- ip routing
= no switchport quita la función de capa 2 del puerto y permite asignarle una IP.
:::

=== m2-cdp | CDP y LLDP | 10 | 2
Los protocolos de **descubrimiento de vecinos** permiten saber qué equipo hay al otro lado de cada cable, sin ir físicamente a mirarlo.

## CDP (Cisco Discovery Protocol)

Propietario de Cisco, activado por defecto. Envía anuncios cada **60 segundos** con tiempo de espera (*holdtime*) de **180 segundos**. Muestra nombre del vecino, modelo, interfaz local y remota, IP, versión de IOS y VLAN nativa.

```ios
SW1# show cdp neighbors
Device ID   Local Intrfce   Holdtme   Capability   Platform   Port ID
R1          Gig 0/24        151       R B S I      ISR4331    Gig 0/0/0
SW1# show cdp neighbors detail
```

## LLDP (Link Layer Discovery Protocol)

Estándar abierto **IEEE 802.1AB**, para redes con equipos de varios fabricantes. En Cisco suele estar **desactivado** por defecto. Anuncios cada **30 segundos**, holdtime **120 segundos**.

```ios
SW1(config)# lldp run
SW1(config)# interface g0/1
SW1(config-if)# lldp transmit
SW1(config-if)# lldp receive
SW1# show lldp neighbors
```

## Seguridad

CDP y LLDP revelan información útil para un atacante (modelo, versión de IOS, direcciones). Desactívalos en los puertos que dan a usuarios o a internet: `no cdp enable` en la interfaz o `no cdp run` globalmente.

::: quiz
? ¿Qué protocolo de descubrimiento es un estándar abierto?
- CDP
+ LLDP
= LLDP es IEEE 802.1AB; CDP es propietario de Cisco.

? ¿Cada cuánto envía CDP sus anuncios por defecto?
- 30 segundos
+ 60 segundos
- 180 segundos
= CDP anuncia cada 60 s y mantiene la información 180 s (holdtime).

? ¿Qué comando activa LLDP globalmente en un equipo Cisco?
+ lldp run
- lldp enable
- cdp run
= lldp run lo activa en todo el equipo; lldp transmit/receive lo controlan por interfaz.

? ¿Por qué conviene desactivar CDP en los puertos hacia los usuarios?
+ Porque revela información de la red que puede aprovechar un atacante
- Porque consume mucho ancho de banda
- Porque provoca bucles
= Modelo, versión de IOS y direcciones IP son datos valiosos para preparar un ataque.
:::

=== m2-etherchannel | EtherChannel | 14 | 3
**EtherChannel** agrupa varios enlaces físicos (hasta 8 activos) en **un único enlace lógico**. Suma el ancho de banda, da redundancia y, para Spanning Tree, cuenta como un solo enlace (no bloquea ninguno).

## Protocolos de negociación

| Protocolo | Tipo | Modos | Forman canal si... |
|---|---|---|---|
| LACP | Estándar IEEE 802.3ad / 802.1AX | `active`, `passive` | Al menos un extremo en active |
| PAgP | Propietario de Cisco | `desirable`, `auto` | Al menos un extremo en desirable |
| Estático | Sin negociación | `on` | Ambos extremos en on |

`passive`–`passive` o `auto`–`auto` **no forman** el canal.

## Requisitos

Todos los puertos del grupo deben coincidir en: **velocidad y dúplex**, **modo** (acceso o trunk), **VLAN de acceso** o **VLAN nativa y VLAN permitidas**.

```ios
SW1(config)# interface range g0/1 - 2
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
SW1# show etherchannel summary
Group  Port-channel  Protocol    Ports
------+-------------+-----------+---------------------------
1      Po1(SU)         LACP      Gi0/1(P)    Gi0/2(P)
```

En `show etherchannel summary`: **S** = capa 2, **U** = en uso, **P** = puerto incluido en el canal. **D** significa caído e **s** (suspendido), normalmente por una configuración que no coincide.

El reparto de tráfico entre enlaces se hace por *hash* (MAC, IP o puertos de origen/destino) con `port-channel load-balance`: un mismo flujo siempre va por el mismo enlace.

::: quiz
? ¿Qué combinación de modos LACP forma un EtherChannel?
- passive / passive
+ active / passive
- auto / auto
= LACP necesita al menos un extremo en active. auto/desirable son modos de PAgP.

? ¿Qué protocolo de EtherChannel es un estándar abierto?
+ LACP
- PAgP
- DTP
= LACP es IEEE 802.3ad (hoy 802.1AX). PAgP es de Cisco.

? ¿Cuántos enlaces activos admite como máximo un EtherChannel?
- 2
- 4
+ 8
- 16
= Hasta 8 enlaces activos (LACP admite hasta 16 configurados, con 8 en espera).

? Uno de los puertos tiene una VLAN nativa distinta. ¿Qué ocurre?
+ Ese puerto no entra en el canal (queda suspendido)
- Se forma el canal sin problemas
- El switch cambia la VLAN nativa automáticamente
= Todos los miembros deben tener la misma configuración; si no, el puerto se suspende.
:::

=== m2-stp | Spanning Tree Protocol | 20 | 2
Los enlaces redundantes entre switches son necesarios para la disponibilidad, pero crean **bucles de capa 2**. Como las tramas Ethernet no tienen TTL, un broadcast daría vueltas para siempre: **tormenta de broadcast**, inestabilidad de la tabla MAC y tramas duplicadas. **STP (IEEE 802.1D)** evita los bucles **bloqueando** los puertos que sobran.

## Cómo decide STP

Los switches intercambian **BPDU** cada **2 segundos**.

1. **Elegir el puente raíz (root bridge):** gana el switch con el **Bridge ID más bajo**. El Bridge ID = **prioridad** (por defecto **32768**, más el número de VLAN en PVST+) + **MAC**. Si empatan en prioridad, gana la MAC más baja.
2. **Elegir el puerto raíz (root port)** en cada switch que no es raíz: el de **menor coste** hasta el raíz.
3. **Elegir el puerto designado** en cada segmento: el que ofrece menor coste hacia el raíz (todos los puertos del raíz son designados).
4. **Bloquear** el resto de puertos.

Desempates, en este orden: menor coste al raíz → menor Bridge ID del vecino → menor prioridad de puerto → menor número de puerto del vecino.

## Costes de los enlaces

| Velocidad | Coste (original) | Coste (largo, 802.1D-2004) |
|---|---|---|
| 10 Mbps | 100 | 2.000.000 |
| 100 Mbps | 19 | 200.000 |
| 1 Gbps | 4 | 20.000 |
| 10 Gbps | 2 | 2.000 |

[[anim:stp]]

## Estados de los puertos (802.1D)

**Blocking** (20 s, *max age*) → **Listening** (15 s) → **Learning** (15 s) → **Forwarding**. Un puerto puede tardar hasta **50 segundos** en empezar a reenviar: por eso nació RSTP.

## Elegir tú el raíz

No dejes que el switch más viejo (MAC más baja) sea el raíz por casualidad. Fija el raíz en el switch de distribución:

```ios
SW1(config)# spanning-tree vlan 10 root primary
SW2(config)# spanning-tree vlan 10 root secondary
! o con un valor explícito (múltiplo de 4096):
SW1(config)# spanning-tree vlan 10 priority 4096
SW1# show spanning-tree vlan 10
```

::: quiz
? ¿Qué switch se convierte en puente raíz?
- El de MAC más alta
+ El de Bridge ID más bajo
- El que tiene más puertos
- El primero que se enciende
= Gana el Bridge ID más bajo: primero la prioridad y, si empatan, la MAC más baja.

? ¿Cuál es la prioridad STP por defecto?
- 0
- 4096
+ 32768
- 65535
= 32768 (en PVST+ se le suma el número de VLAN: 32769 en la VLAN 1).

? ¿Cuál es el coste STP (original) de un enlace de 1 Gbps?
- 19
+ 4
- 2
- 100
= Con los costes cortos de 802.1D: 100 Mbps = 19, 1 Gbps = 4, 10 Gbps = 2.

? ¿Cuál es el problema principal que evita STP?
+ Los bucles de capa 2 y las tormentas de broadcast
- Los bucles de enrutamiento de capa 3
- Las colisiones
= Las tramas no tienen TTL y en un bucle circularían indefinidamente.

? ¿Por qué estados pasa un puerto 802.1D antes de reenviar?
+ Blocking → Listening → Learning → Forwarding
- Discarding → Learning → Forwarding
- Listening → Blocking → Forwarding
= Blocking, Listening y Learning; Discarding es un estado de RSTP.

? Las prioridades STP deben configurarse en múltiplos de...
- 1024
+ 4096
- 32768
= Los 4 bits de prioridad del Bridge ID solo admiten múltiplos de 4096 (los otros 12 bits son el ID de VLAN extendido).
:::

=== m2-rstp | RSTP, PortFast y BPDU Guard | 14 | 3
**RSTP (802.1w)** converge en uno o dos segundos en lugar de los 30–50 de STP. Cisco lo implementa por VLAN como **Rapid PVST+**.

## Roles de puerto en RSTP

| Rol | Función |
|---|---|
| Root | Mejor camino al raíz |
| Designated | Reenvía en su segmento |
| Alternate | Camino alternativo al raíz, bloqueado, listo para tomar el relevo del root port |
| Backup | Respaldo de un designated en el mismo segmento (raro: requiere un hub) |

Estados: **Discarding**, **Learning** y **Forwarding**.

Tipos de enlace: **point-to-point** (full-duplex entre switches, converge rápido), **shared** (half-duplex) y **edge** (hacia un equipo final).

```ios
SW1(config)# spanning-tree mode rapid-pvst
```

## PortFast

En un puerto que conecta un **equipo final**, no hace falta esperar a que STP compruebe que no hay bucle: **PortFast** lo pone en forwarding inmediatamente. Así el PC obtiene IP por DHCP sin esperar.

```ios
SW1(config)# interface g0/5
SW1(config-if)# spanning-tree portfast
! o en todos los puertos de acceso:
SW1(config)# spanning-tree portfast default
```

## BPDU Guard

Si en un puerto PortFast aparece una **BPDU** (alguien ha conectado un switch), **BPDU Guard** pone el puerto en **err-disabled** para proteger la topología.

```ios
SW1(config-if)# spanning-tree bpduguard enable
! o global para todos los puertos PortFast:
SW1(config)# spanning-tree portfast bpduguard default
! recuperar el puerto:
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
```

Otras protecciones: **Root Guard** (impide que un puerto se convierta en camino a un raíz no autorizado) y **Loop Guard**.

::: quiz
? ¿Qué rol de RSTP es un camino alternativo al raíz, listo para sustituir al root port?
- Backup
+ Alternate
- Designated
= El puerto alternate está bloqueado (discarding) y pasa a root en cuanto falla el actual.

? ¿En qué puertos debe configurarse PortFast?
+ En puertos conectados a equipos finales
- En los trunks entre switches
- En el puerto raíz
= PortFast salta los estados intermedios; en un enlace entre switches podría crear un bucle temporal.

? ¿Qué hace BPDU Guard al recibir una BPDU en un puerto PortFast?
- Ignora la BPDU
+ Pone el puerto en err-disabled
- Convierte el puerto en root
= Lo desactiva para evitar que un switch no autorizado altere la topología.

? ¿Qué comando activa Rapid PVST+?
+ spanning-tree mode rapid-pvst
- spanning-tree mode mst
- spanning-tree rstp enable
= El modo por defecto suele ser pvst; rapid-pvst activa RSTP por VLAN.
:::

=== m2-averias | Práctica: resolver averías en switches | 25 | 2
En un trabajo de soporte de redes, **la mitad del tiempo es diagnosticar**. Esta lección te da el método y los comandos, y luego lo practicas con tres averías reales en el simulador.

## El método: de abajo arriba

1. **Capa 1, físico:** ¿el puerto está encendido y con cable? ¿Hay errores?
2. **Capa 2, enlace:** ¿el puerto está en la VLAN correcta? ¿El trunk se forma y deja pasar la VLAN?
3. **Capa 3, red:** ¿IP, máscara y puerta de enlace correctas? ¿Hay ping?

::: cuidado
**Nunca cambies nada sin diagnosticar primero.** Si tocas cinco cosas a la vez y vuelve a funcionar, no sabrás cuál era el problema, y quizá hayas roto otra cosa.
:::

## Qué buscar en cada comando

| Comando | Qué mirar | Qué significa |
|---|---|---|
| `show interfaces status` | `notconnect` | No hay cable, o el otro extremo está apagado |
| | `disabled` | Alguien hizo `shutdown` en el puerto |
| | `err-disabled` | Lo apagó una protección (port security, BPDU Guard) |
| | Columna `Vlan` | ¿Es la VLAN que debería? `trunk` si es troncal |
| `show interfaces g0/2` | `CRC`, `late collision` | Dúplex distinto en cada extremo o cable dañado |
| `show vlan brief` | Puertos de cada VLAN | Un puerto en la VLAN equivocada |
| `show interfaces trunk` | No sale el puerto | El trunk **no** se ha formado |
| | `Vlans allowed` | Falta una VLAN en la lista permitida |
| | `NATIVE_VLAN_MISMATCH` | VLAN nativa distinta en cada extremo |
| `show interfaces g0/1 switchport` | `Administrative` y `Operational Mode` | Lo configurado frente a lo que de verdad está funcionando |
| `show mac address-table` | La MAC del PC y su puerto | Si el switch "ve" al equipo y en qué VLAN |
| `show cdp neighbors` | Qué hay al otro lado de cada puerto | Confirmar que el cable va donde crees |

## Las tres averías más típicas en un switch

**1. Puerto apagado o en la VLAN equivocada.** El usuario "no tiene red". `show interfaces status` lo delata en segundos.

**2. El trunk no pasa una VLAN.** Las causas suelen ser tres:
- el enlace no es trunk (DTP en `dynamic auto` en los dos lados, o un lado no negocia);
- la VLAN no está en `allowed vlan`;
- la VLAN no existe en uno de los dos switches.

**3. Dúplex distinto en cada extremo.** Funciona, pero lentísimo: un lado en `half` y el otro en `full` provoca colisiones tardías y errores CRC. Solución: `duplex auto` y `speed auto` en los dos lados, o fijar lo mismo en ambos.

```ios
SW1# show interfaces status
SW1# show interfaces g0/1 switchport
SW1# configure terminal
SW1(config)# interface g0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan add 20
```

::: practica
Resuelve las tres averías. En cada una: primero los comandos `show`, después el arreglo y al final la verificación. Si te atascas, pide una pista antes de mirar la solución.
:::

[[cli:averia-puerto]]

[[cli:averia-trunk]]

[[cli:averia-duplex]]

::: quiz
? En show interfaces status un puerto aparece como "disabled". ¿Qué significa?
+ Que tiene shutdown configurado
- Que no tiene cable
- Que lo ha apagado port security
= disabled = apagado a mano; notconnect = sin cable; err-disabled = apagado por una protección.

? Dos switches unidos con los dos puertos en dynamic auto. ¿Qué pasa con las VLAN?
- Pasan todas por el trunk
+ No se forma trunk y solo pasa la VLAN de acceso
- Pasa solo la VLAN nativa etiquetada
= dynamic auto espera que el otro lado lo pida; si los dos esperan, el enlace queda en modo acceso.

? Un servidor va muy lento y show interfaces muestra muchos CRC y colisiones tardías. ¿Qué es lo más probable?
+ Dúplex distinto en cada extremo
- La VLAN nativa es distinta
- Falta una ruta por defecto
= Las colisiones tardías son la firma típica de un desajuste de dúplex.

? ¿Qué comando muestra el modo de un puerto configurado y el modo en el que funciona de verdad?
- show vlan brief
+ show interfaces g0/1 switchport
- show ip interface brief
= Muestra Administrative Mode y Operational Mode, ideal para trunks que no se forman.
:::

=== m2-wlan-arquitectura | Arquitecturas inalámbricas | 16 | 2
## Tipos de despliegue

- **AP autónomo:** cada AP se configura de forma individual. Sirve para pocas unidades.
- **AP ligero (lightweight) + WLC:** los AP dependen de un **controlador inalámbrico (WLC)**. El AP se encarga de las funciones de tiempo real (enviar y recibir tramas, cifrado); el WLC, de la gestión (autenticación, roaming, canales y potencias, políticas). Es la **arquitectura split-MAC**.
- **Nube:** la gestión está en la nube (Cisco Meraki). Los datos de los usuarios no pasan por la nube, solo la gestión.
- **Controlador integrado (Embedded Wireless Controller):** el controlador corre en un AP o en un switch Catalyst 9000.

## CAPWAP

El AP ligero y el WLC se comunican con **CAPWAP** sobre UDP, mediante **dos túneles**: uno de **control** (UDP **5246**, cifrado con DTLS) y uno de **datos** (UDP **5247**). En modo *local*, el tráfico de los clientes viaja por el túnel hasta el WLC y desde ahí sale a la red cableada.

## Modos de un AP ligero

| Modo | Función |
|---|---|
| Local | El normal: da servicio a clientes y envía el tráfico al WLC por CAPWAP |
| FlexConnect | En sedes remotas: puede conmutar el tráfico localmente y seguir funcionando si cae el enlace con el WLC |
| Monitor | No da servicio; escucha el espectro para detectar intrusos (wIPS) |
| Sniffer | Captura tráfico 802.11 y lo envía a un analizador como Wireshark |
| Rogue detector | Detecta AP no autorizados conectados a la red cableada |
| SE-Connect | Analiza el espectro de radiofrecuencia |
| Bridge / Mesh | Enlaces inalámbricos entre AP |

::: quiz
? En la arquitectura split-MAC, ¿qué hace el WLC?
- Envía y recibe las tramas en tiempo real
+ Gestión: autenticación, roaming, canales y políticas
- Solo da corriente PoE
= El AP hace las funciones de tiempo real; el WLC centraliza la gestión.

? ¿Qué puertos UDP usa CAPWAP?
- 1812 y 1813
+ 5246 (control) y 5247 (datos)
- 67 y 68
= El túnel de control (cifrado con DTLS) usa el 5246 y el de datos el 5247.

? Un AP en una sucursal debe seguir funcionando si cae el enlace con el WLC central. ¿Qué modo usarías?
- Local
+ FlexConnect
- Monitor
= FlexConnect puede conmutar el tráfico localmente y mantener a los clientes conectados sin el controlador.

? ¿Qué solución inalámbrica se gestiona desde la nube?
- AP autónomo
+ Cisco Meraki
- WLC 9800 local
= Meraki se gestiona desde un panel en la nube; el tráfico de usuarios no pasa por ella.
:::

=== m2-wlan-gestion | Acceso de gestión y puertos del WLC | 14 | 3
## Formas de administrar un equipo

| Método | Cifrado | Comentario |
|---|---|---|
| Consola | — (acceso físico) | Configuración inicial y recuperación |
| Telnet (TCP 23) | No | Evítalo: todo, contraseña incluida, va en texto plano |
| SSH (TCP 22) | Sí | El estándar para la CLI remota |
| HTTP (TCP 80) | No | Interfaz web sin cifrar |
| HTTPS (TCP 443) | Sí | Interfaz web cifrada (la del WLC) |
| TACACS+ / RADIUS | — | Autenticación centralizada de los administradores (ver el módulo de seguridad) |

## Puertos e interfaces del WLC

- **Puertos físicos:** puerto de servicio (*service port*, gestión fuera de banda), puertos de distribución (conectan con la red; transportan el tráfico de clientes y la gestión), puerto de consola y puerto de redundancia.
- **Interfaces lógicas (AireOS):** *management* (gestión y CAPWAP), *virtual* (dirección no enrutable para autenticación web y DHCP relay), *service port*, *dynamic interfaces* (una por cada VLAN de clientes, asociada a una WLAN).
- **LAG:** agrupa los puertos de distribución del WLC en un EtherChannel **estático** (modo `on`): el WLC no negocia con LACP ni PAgP.

::: quiz
? ¿Qué método de gestión remota debe preferirse por seguridad?
- Telnet
+ SSH
- HTTP
= SSH cifra toda la sesión.

? ¿Qué tipo de EtherChannel usa la función LAG de un WLC?
- LACP active
- PAgP desirable
+ Estático (modo on)
= El WLC no admite LACP ni PAgP: el switch vecino debe configurar el canal en modo on.

? En un WLC, ¿qué interfaz lógica se asocia a una WLAN para sacar el tráfico de clientes a una VLAN?
- Management
- Virtual
+ Dynamic interface
= Las interfaces dinámicas mapean cada WLAN a una VLAN de la red cableada.
:::

=== m2-wlan-config | Configurar una WLAN en el WLC | 12 | 3
En el examen puede aparecer una captura de la **interfaz gráfica del WLC** y preguntarte qué pestaña o qué opción usar. El flujo típico en un WLC con AireOS:

1. **WLANs → Create New → Go.** Tipo *WLAN*, nombre de perfil, **SSID** y un **ID**.
2. Pestaña **General:** estado *Enabled*, **Interface/Interface Group** = la interfaz dinámica (VLAN) donde saldrán los clientes.
3. Pestaña **Security → Layer 2:** *WPA+WPA2* (o WPA3), cifrado **AES (CCMP)**, gestión de claves **PSK** y la contraseña (*PSK Format: ASCII*). Para empresas: **802.1X** con un servidor RADIUS (pestaña *AAA Servers*).
4. Pestaña **QoS:** perfil *Platinum* para voz, *Gold* para vídeo, *Silver* para el resto (por defecto), *Bronze* para tráfico de fondo.
5. Pestaña **Advanced:** opciones como el tiempo de sesión, FlexConnect o Aironet IE.
6. **Apply.**

En los controladores Catalyst 9800 (IOS XE) el flujo equivalente es **Configuration → Tags & Profiles → WLANs**, y el WLAN se une a una VLAN mediante un *Policy Profile* y una *Policy Tag*.

::: quiz
? ¿En qué pestaña de la WLAN se elige la VLAN (interfaz dinámica) de los clientes?
+ General
- Security
- QoS
- Advanced
= En la pestaña General se elige la interfaz o el grupo de interfaces.

? ¿Qué perfil de QoS conviene para una WLAN de voz?
+ Platinum
- Gold
- Silver
- Bronze
= Platinum da la máxima prioridad, adecuada para la voz.

? Para una WLAN con contraseña compartida y WPA2, ¿qué gestión de claves se elige?
+ PSK
- 802.1X
- CCKM
= PSK (Pre-Shared Key) usa una contraseña común; 802.1X autentica a cada usuario contra un servidor RADIUS.
:::
