---
id: m3
titulo: Conectividad IP
dominio: 3.0 IP Connectivity
peso: 25
descripcion: La tabla de enrutamiento, cómo decide un router, rutas estáticas IPv4 e IPv6, OSPFv2 y protocolos de redundancia de gateway (FHRP).
---
=== m3-tabla | La tabla de enrutamiento | 16 | 2
El router decide el camino de cada paquete consultando su **tabla de enrutamiento**. Saber leerla es imprescindible para el examen y para el trabajo.

```ios
R1# show ip route
Codes: L - local, C - connected, S - static, O - OSPF, D - EIGRP, B - BGP ...
Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      10.0.0.0/8 is variably subnetted, 4 subnets, 3 masks
C        10.1.1.0/24 is directly connected, GigabitEthernet0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0
O        10.2.2.0/24 [110/2] via 10.0.12.2, 00:05:12, GigabitEthernet0/1
S        10.3.3.0/24 [1/0] via 10.0.13.3
```

## Cómo leer cada entrada

Tomemos `O 10.2.2.0/24 [110/2] via 10.0.12.2, 00:05:12, GigabitEthernet0/1`:

| Parte | Significado |
|---|---|
| `O` | **Código** de origen de la ruta: aprendida por OSPF |
| `10.2.2.0/24` | **Prefijo** de destino y su longitud |
| `110` | **Distancia administrativa (AD)**: fiabilidad del origen |
| `2` | **Métrica**: coste según el protocolo |
| `via 10.0.12.2` | **Siguiente salto** (next hop) |
| `00:05:12` | Tiempo desde que se aprendió |
| `GigabitEthernet0/1` | **Interfaz de salida** |

- **C (connected):** la red de una interfaz con IP que está *up/up*.
- **L (local):** la propia IP de la interfaz, como ruta /32.
- `S*`: ruta estática **por defecto** (*gateway of last resort*): se usa cuando no hay nada más específico.

## Distancia administrativa

Cuando dos fuentes ofrecen el **mismo prefijo**, gana la de **menor AD**:

| Origen | AD |
|---|---|
| Conectada | 0 |
| Estática | 1 |
| eBGP | 20 |
| EIGRP (interna) | 90 |
| OSPF | 110 |
| IS-IS | 115 |
| RIP | 120 |
| EIGRP (externa) | 170 |
| iBGP | 200 |
| Inalcanzable | 255 (no se usa nunca) |

[[anim:enrutamiento]]

::: quiz
? En la entrada `O 10.2.2.0/24 [110/2]`, ¿qué es el 110?
+ La distancia administrativa
- La métrica
- El número de saltos
- El ID de proceso OSPF
= Entre corchetes va [AD/métrica]. 110 es la AD por defecto de OSPF.

? ¿Qué código identifica una ruta local de la propia IP de la interfaz?
- C
+ L
- S
- O
= Las rutas L son /32 de la dirección configurada en la interfaz.

? Un router aprende 172.16.0.0/16 por OSPF y por EIGRP. ¿Cuál instala?
- La de OSPF
+ La de EIGRP, porque su AD (90) es menor que la de OSPF (110)
- Las dos, balanceando carga
= Para el mismo prefijo, gana el origen con menor distancia administrativa.

? ¿Cuál es la AD de una ruta estática?
- 0
+ 1
- 110
- 120
= Conectada 0, estática 1.

? ¿Qué representa la ruta 0.0.0.0/0?
+ La ruta por defecto (gateway of last resort)
- La red de loopback
- Una ruta inalcanzable
= 0.0.0.0/0 coincide con cualquier destino y se usa cuando no hay una ruta más específica.
:::

=== m3-decision | Cómo elige un router el camino | 14 | 2
Un router aplica tres criterios **en este orden**, y cada uno responde a una pregunta distinta:

1. **Coincidencia más larga (longest prefix match):** de todas las rutas que contienen el destino, gana la **más específica** (prefijo más largo). Esto se decide **siempre primero**, al reenviar cada paquete.
2. **Distancia administrativa:** cuando varios orígenes (OSPF, estática...) ofrecen **el mismo prefijo**, se instala en la tabla el de menor AD.
3. **Métrica:** dentro de un mismo protocolo, si hay varios caminos al mismo prefijo, se instala el de **menor métrica**. Si empatan, se instalan todos y se balancea la carga (**ECMP**).

## Ejemplo de longest prefix match

Tabla:

| Ruta | Siguiente salto |
|---|---|
| 10.0.0.0/8 | 192.168.1.1 |
| 10.1.0.0/16 | 192.168.1.2 |
| 10.1.1.0/24 | 192.168.1.3 |
| 0.0.0.0/0 | 192.168.1.4 |

- Destino **10.1.1.50** → coincide con las cuatro; gana **/24** → 192.168.1.3.
- Destino **10.1.2.7** → coincide con /8, /16 y /0; gana **/16** → 192.168.1.2.
- Destino **10.200.0.1** → /8 → 192.168.1.1.
- Destino **8.8.8.8** → solo la ruta por defecto → 192.168.1.4.

::: examen
La pregunta trampa típica: una ruta OSPF `/24` y una estática `/16` que contienen el destino. **Gana la /24 de OSPF**, aunque la estática tenga menor AD. La AD solo compara rutas con **el mismo prefijo**.
:::

## Qué hace el router con el paquete

1. Recibe la trama, comprueba el FCS y la desencapsula.
2. Mira la IP de destino y busca en la tabla (longest prefix match).
3. Reduce el **TTL** en 1; si llega a 0, descarta el paquete y envía un **ICMP Time Exceeded** (así funciona `traceroute`).
4. Recalcula el checksum de la cabecera IP.
5. Resuelve la MAC del siguiente salto (ARP) y encapsula en una **trama nueva** para la interfaz de salida.

::: quiz
? Destino 172.16.5.10. Rutas: 172.16.0.0/16 (estática), 172.16.5.0/24 (OSPF) y 0.0.0.0/0. ¿Cuál se usa?
- La estática, por su AD más baja
+ La de OSPF, por ser la coincidencia más larga
- La ruta por defecto
= Primero se aplica la coincidencia de prefijo más larga: /24 gana a /16 aunque tenga más AD.

? ¿Qué criterio se usa para elegir entre dos caminos OSPF al mismo prefijo?
- La distancia administrativa
+ La métrica (coste)
- La dirección del siguiente salto más baja
= Dentro de un mismo protocolo la AD es igual, así que decide la métrica. Si empatan, se balancea (ECMP).

? ¿Qué hace un router cuando el TTL de un paquete llega a 0?
+ Lo descarta y envía un mensaje ICMP Time Exceeded al origen
- Lo reenvía por la ruta por defecto
- Lo devuelve al origen
= Esto evita que los paquetes circulen eternamente en un bucle y es la base de traceroute.

? Destino 10.20.30.40. Rutas: 10.0.0.0/8, 10.20.0.0/16 y 10.20.30.0/25. ¿Cuál gana?
- 10.0.0.0/8
- 10.20.0.0/16
+ 10.20.30.0/25
= 10.20.30.0/25 cubre de .0 a .127; .40 está dentro y es la más específica.
:::

=== m3-estatica | Rutas estáticas IPv4 | 18 | 2
Una **ruta estática** la escribe el administrador a mano. No consume CPU ni ancho de banda, pero no se adapta sola si cambia la red. Se usan en redes pequeñas, en redes *stub* (con una única salida) y para la ruta por defecto.

## Sintaxis

`ip route <red> <máscara> {<siguiente-salto> | <interfaz-de-salida> | <interfaz> <siguiente-salto>} [<AD>]`

```ios
! Ruta de red, por siguiente salto
R1(config)# ip route 192.168.20.0 255.255.255.0 10.0.12.2
! Ruta por defecto
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1
! Ruta de host (/32)
R1(config)# ip route 192.168.50.10 255.255.255.255 10.0.12.2
! Ruta flotante de respaldo (AD 5, solo se usa si cae la principal)
R1(config)# ip route 192.168.20.0 255.255.255.0 10.0.13.3 5
! Completamente especificada (interfaz + siguiente salto)
R1(config)# ip route 192.168.30.0 255.255.255.0 g0/1 10.0.12.2
```

## Tipos

- **Ruta de red:** a una subred concreta.
- **Ruta por defecto:** `0.0.0.0/0`, la "salida a todo lo demás".
- **Ruta de host:** `/32`, a un único equipo.
- **Ruta flotante:** con una **AD más alta** que la ruta principal (o que la de un protocolo dinámico). No aparece en la tabla mientras la principal funciona; si esta cae, la flotante se instala.

## Siguiente salto o interfaz de salida

- **Siguiente salto:** lo más habitual; el router hace una búsqueda recursiva para saber por qué interfaz sale.
- **Interfaz de salida:** solo recomendable en enlaces **punto a punto** (serie). En Ethernet, el router tendría que hacer ARP de cada destino.
- **Ambos (fully specified):** lo más preciso.

Recuerda que el tráfico es de **ida y vuelta**: si R1 tiene ruta a la LAN de R2, R2 necesita ruta de vuelta a la LAN de R1.

[[cli:estatica]]

::: quiz
? ¿Qué comando crea una ruta por defecto hacia 203.0.113.1?
- ip route 255.255.255.255 0.0.0.0 203.0.113.1
+ ip route 0.0.0.0 0.0.0.0 203.0.113.1
- ip default-gateway 203.0.113.1
- ip route default 203.0.113.1
= 0.0.0.0 con máscara 0.0.0.0 coincide con cualquier destino. ip default-gateway solo se usa en switches de capa 2 sin enrutamiento.

? Para que una ruta estática sirva de respaldo de una ruta OSPF, ¿qué AD le pondrías?
- 1
- 100
+ 120
= Debe ser mayor que 110 (la AD de OSPF) para quedar como flotante y solo instalarse si OSPF pierde la ruta.

? ¿Qué máscara tiene una ruta de host?
- 255.255.255.0
- 255.255.255.252
+ 255.255.255.255
= Una ruta de host apunta a una sola dirección: /32.

? Un PC de la LAN de R1 hace ping a un PC de la LAN de R2 y no recibe respuesta. R1 tiene ruta hacia la LAN de R2. ¿Qué falta probablemente?
+ La ruta de vuelta en R2 hacia la LAN de R1
- Una VLAN
- El comando ip routing en R1
= El ping es de ida y vuelta: R2 también necesita saber cómo llegar a la red de origen.
:::

=== m3-estatica6 | Rutas estáticas IPv6 | 12 | 3
Las rutas estáticas IPv6 funcionan igual que las de IPv4. Antes que nada, el router debe tener activado el enrutamiento IPv6 con `ipv6 unicast-routing`.

```ios
R1(config)# ipv6 unicast-routing
! Ruta de red por siguiente salto (dirección global)
R1(config)# ipv6 route 2001:db8:acad:2::/64 2001:db8:acad:12::2
! Ruta por defecto
R1(config)# ipv6 route ::/0 2001:db8:acad:12::2
! Ruta de host
R1(config)# ipv6 route 2001:db8:acad:2::10/128 2001:db8:acad:12::2
! Siguiente salto link-local: hay que indicar también la interfaz
R1(config)# ipv6 route 2001:db8:acad:2::/64 g0/1 fe80::2
! Ruta flotante
R1(config)# ipv6 route 2001:db8:acad:2::/64 2001:db8:acad:13::3 5
R1# show ipv6 route static
```

::: examen
Si el siguiente salto es una dirección **link-local** (FE80::), es **obligatorio** indicar la interfaz de salida, porque la misma link-local puede existir en varios enlaces.
:::

::: quiz
? ¿Cómo se escribe la ruta por defecto en IPv6?
- 0.0.0.0/0
+ ::/0
- ::1/128
- FE80::/10
= ::/0 coincide con cualquier destino IPv6.

? ¿Por qué hay que indicar la interfaz si el siguiente salto es link-local?
+ Porque una dirección link-local solo es única dentro de su enlace
- Porque las link-local no se pueden enrutar
- No hace falta
= La misma FE80:: puede repetirse en enlaces distintos; la interfaz desambigua.

? ¿Qué comando muestra solo las rutas estáticas IPv6?
- show ip route static
+ show ipv6 route static
- show ipv6 interface brief
= show ipv6 route static filtra la tabla de enrutamiento IPv6.
:::

=== m3-ospf1 | OSPF: conceptos | 18 | 3
**OSPF** (Open Shortest Path First) es el protocolo de enrutamiento dinámico más usado en las redes empresariales. Es abierto, **de estado de enlace** y converge rápido.

## Estado de enlace frente a vector distancia

- **Vector distancia** (RIP, EIGRP en parte): cada router conoce solo lo que le cuentan sus vecinos ("la red X está a 3 saltos por ahí").
- **Estado de enlace** (OSPF, IS-IS): cada router conoce **el mapa completo** de su área y calcula él mismo el mejor camino con el algoritmo **SPF de Dijkstra**.

## Cómo funciona OSPF

1. Descubre vecinos enviando paquetes **Hello**.
2. Intercambia información de enlaces: los **LSA** (Link-State Advertisements).
3. Todos los routers del área construyen la misma base de datos, la **LSDB**.
4. Cada uno ejecuta SPF y pone en la tabla los mejores caminos.

## Áreas

OSPF divide las redes grandes en **áreas** para limitar el tamaño de la LSDB. El **área 0** es el **backbone**: todas las demás áreas deben conectarse a ella. Un router con interfaces en varias áreas es un **ABR**; uno que conecta con otro sistema (internet, otro protocolo) es un **ASBR**. El CCNA solo pide **OSPFv2 de área única**.

## Coste (métrica)

**Coste = ancho de banda de referencia / ancho de banda de la interfaz**. La referencia por defecto es **100 Mbps**, así que FastEthernet, Gigabit y 10 Gigabit valen todos **1**. Para que se distingan, se sube la referencia **igual en todos los routers**:

```ios
R1(config-router)# auto-cost reference-bandwidth 10000
```

Con referencia 10000 (10 Gbps): 10 Gbps = 1, 1 Gbps = 10, 100 Mbps = 100.

## El Router ID

Cada router OSPF se identifica con un **Router ID** de 32 bits. Se elige así:

1. El configurado con `router-id`.
2. Si no hay, la **IP más alta de una loopback** activa.
3. Si no hay loopback, la **IP más alta de una interfaz física** activa.

Cambiarlo requiere reiniciar el proceso: `clear ip ospf process`.

## Paquetes OSPF

| Tipo | Nombre | Función |
|---|---|---|
| 1 | Hello | Descubrir vecinos y mantener la relación |
| 2 | DBD | Resumen de la LSDB |
| 3 | LSR | Pedir los LSA que faltan |
| 4 | LSU | Enviar LSA |
| 5 | LSAck | Confirmar la recepción |

OSPF va directamente sobre IP (**protocolo 89**) y usa las direcciones multicast **224.0.0.5** (todos los routers OSPF) y **224.0.0.6** (DR y BDR).

::: quiz
? ¿Qué algoritmo usa OSPF para calcular las rutas?
- Bellman-Ford
+ SPF de Dijkstra
- DUAL
= OSPF es de estado de enlace y usa SPF (Dijkstra). DUAL es el algoritmo de EIGRP.

? ¿Cuál es el ancho de banda de referencia por defecto de OSPF?
+ 100 Mbps
- 1 Gbps
- 10 Gbps
= Por eso, sin ajustarlo, todos los enlaces de 100 Mbps o más tienen coste 1.

? Un router no tiene router-id configurado. Tiene una loopback 1.1.1.1 y una interfaz física 192.168.1.1. ¿Qué Router ID usa?
+ 1.1.1.1
- 192.168.1.1
- 0.0.0.0
= Sin router-id manual, la loopback tiene preferencia sobre las interfaces físicas, aunque su IP sea más baja.

? ¿Cómo se llama el área a la que deben conectarse todas las demás?
- Área 1
+ Área 0 (backbone)
- Área stub
= El área 0 es el backbone de OSPF.

? ¿Qué dirección multicast usan los routers OSPF para enviar los Hello a todos los vecinos?
+ 224.0.0.5
- 224.0.0.6
- 224.0.0.9
- 224.0.0.10
= 224.0.0.5 = todos los routers OSPF; 224.0.0.6 = DR y BDR. 224.0.0.9 es RIPv2 y 224.0.0.10, EIGRP.

? ¿Qué paquete OSPF se usa para pedir un LSA concreto?
- Hello
- DBD
+ LSR
- LSAck
= LSR (Link-State Request) pide los LSA que faltan; llegan dentro de un LSU.
:::

=== m3-ospf2 | OSPF: vecinos, DR/BDR y configuración | 22 | 3
## Requisitos para ser vecinos

Dos routers forman adyacencia OSPF solo si coinciden en:

- **Área** de la interfaz.
- **Subred y máscara** de la interfaz.
- **Temporizadores Hello y Dead** (por defecto **10 s y 40 s** en Ethernet).
- **Autenticación**, si se usa.
- **Tipo de red** compatible y misma **MTU** (si no, se quedan en EXSTART/EXCHANGE).
- **Router ID distinto.**
- La interfaz no puede ser **pasiva**.

## Estados de vecino

**Down → Init → 2-Way → ExStart → Exchange → Loading → Full**

- **2-Way:** se han visto mutuamente en los Hello. En redes broadcast, los routers que no son DR ni BDR (**DROther**) se quedan en 2-Way entre sí: es **normal**.
- **Full:** las LSDB están sincronizadas.

## DR y BDR

En redes multiacceso (Ethernet con varios routers), para no formar adyacencias completas entre todos, se elige un **DR** (Designated Router) y un **BDR** (de respaldo). Todos se sincronizan solo con ellos.

- Gana la **prioridad OSPF más alta** de la interfaz (por defecto **1**; con **0** el router nunca será DR ni BDR).
- Si empatan, gana el **Router ID más alto**.
- La elección **no es preferente**: un router nuevo con más prioridad no le quita el puesto al DR actual.

En enlaces **punto a punto** no hay DR ni BDR. Es buena práctica configurar los enlaces entre dos routers como `ip ospf network point-to-point`: la adyacencia se forma más rápido.

## Configuración

```ios
R1(config)# interface loopback 0
R1(config-if)# ip address 1.1.1.1 255.255.255.255
R1(config-if)# exit
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.0.12.0 0.0.0.3 area 0
R1(config-router)# network 192.168.10.0 0.0.0.255 area 0
R1(config-router)# passive-interface g0/0
R1(config-router)# default-information originate
! Alternativa: activar OSPF directamente en la interfaz
R1(config)# interface g0/1
R1(config-if)# ip ospf 1 area 0
R1(config-if)# ip ospf network point-to-point
R1(config-if)# ip ospf priority 100
```

- El comando `network` usa **máscara wildcard** (la inversa de la máscara: 255.255.255.255 − máscara). Activa OSPF en las interfaces cuya IP coincida.
- El **ID de proceso** (el `1` de `router ospf 1`) es local: no tiene que coincidir entre routers.
- `passive-interface` deja de enviar Hello por esa interfaz (la LAN de usuarios) pero sigue anunciando su red.
- `default-information originate` anuncia la ruta por defecto del router a todo el dominio OSPF.

## Verificación

```ios
R1# show ip ospf neighbor
Neighbor ID   Pri   State      Dead Time   Address      Interface
2.2.2.2         1   FULL/DR    00:00:35    10.0.12.2    GigabitEthernet0/1
R1# show ip ospf interface brief
R1# show ip protocols
R1# show ip route ospf
```

[[anim:ospf]]

[[cli:ospf]]

::: quiz
? ¿Cuáles son los temporizadores Hello y Dead por defecto de OSPF en Ethernet?
- 5 y 15 segundos
+ 10 y 40 segundos
- 30 y 120 segundos
= Hello 10 s y Dead 40 s (cuatro veces el Hello). Deben coincidir entre vecinos.

? Dos routers OSPF en la misma Ethernet son DROther. ¿En qué estado se queda su relación?
+ 2-Way, y es normal
- Full
- ExStart, por error de MTU
= Los DROther solo forman adyacencia completa con el DR y el BDR.

? ¿Qué wildcard corresponde a la máscara 255.255.255.252?
- 255.255.255.252
+ 0.0.0.3
- 0.0.0.252
= 255.255.255.255 − 255.255.255.252 = 0.0.0.3.

? ¿Con qué prioridad de interfaz un router nunca será DR ni BDR?
+ 0
- 1
- 255
= Prioridad 0 lo excluye de la elección.

? ¿Qué hace passive-interface en OSPF?
- Desactiva la interfaz
+ Deja de enviar Hello por ella, pero sigue anunciando su red
- Impide que se anuncie la red de la interfaz
= Evita formar vecinos en la LAN de usuarios sin dejar de anunciar esa subred.

? Dos routers no forman vecindad y se quedan en EXSTART. ¿Causa más probable?
- Temporizadores distintos
+ MTU distinta en las interfaces
- Distinto ID de proceso
= Con MTU distintas, el intercambio de DBD no avanza. Los temporizadores distintos impedirían incluso pasar de Init.

? ¿Tiene que coincidir el ID de proceso de router ospf entre vecinos?
- Sí
+ No, es local a cada router
= El ID de proceso solo identifica la instancia dentro del propio router.
:::

=== m3-fhrp | FHRP: redundancia de la puerta de enlace | 14 | 3
Los equipos tienen configurada **una sola puerta de enlace**. Si ese router cae, se quedan sin salida aunque haya otro router disponible. Los protocolos **FHRP** (*First Hop Redundancy Protocol*) crean una **IP virtual y una MAC virtual** compartidas por varios routers: los PC usan la IP virtual como gateway y, si el router activo falla, otro asume la IP virtual sin que los PC noten nada.

## Los tres protocolos

| | HSRP | VRRP | GLBP |
|---|---|---|---|
| Estándar | Cisco | Abierto (RFC 5798) | Cisco |
| Roles | Active / Standby | Master / Backup | AVG / AVF |
| Balanceo de carga | Por grupo (varios grupos) | Por grupo | Sí, en un mismo grupo |
| Preempción por defecto | No | Sí | No |
| MAC virtual | 0000.0C07.ACxx (v1) | 0000.5E00.01xx | 0007.B400.xxyy |

## HSRP

- Gana el rol **Active** la **prioridad más alta** (por defecto **100**); si empatan, la IP más alta.
- **Preempt:** si está activado, un router con más prioridad recupera el rol Active cuando vuelve. Por defecto está **desactivado**.
- Versión 1: grupos 0–255, multicast 224.0.0.2. Versión 2: grupos 0–4095, multicast 224.0.0.102, admite IPv6.

```ios
R1(config)# interface g0/0
R1(config-if)# ip address 192.168.10.2 255.255.255.0
R1(config-if)# standby version 2
R1(config-if)# standby 10 ip 192.168.10.1
R1(config-if)# standby 10 priority 110
R1(config-if)# standby 10 preempt
R1# show standby brief
```

Los PC usan **192.168.10.1** (la IP virtual) como gateway.

::: quiz
? ¿Qué FHRP es un estándar abierto?
- HSRP
+ VRRP
- GLBP
= VRRP está definido en el RFC 5798; HSRP y GLBP son de Cisco.

? ¿Cuál es la prioridad HSRP por defecto?
- 0
- 1
+ 100
- 255
= 100. El router con mayor prioridad se convierte en Active.

? ¿Qué dirección deben tener los PC como puerta de enlace en un grupo HSRP?
- La IP del router Active
+ La IP virtual del grupo
- La IP del router Standby
= Así, si el Active cae, el gateway de los PC sigue siendo válido.

? ¿Qué FHRP balancea carga entre varios routers dentro de un mismo grupo?
- HSRP
- VRRP
+ GLBP
= GLBP asigna distintas MAC virtuales (AVF) a los clientes con la misma IP virtual.

? El router R1 (prioridad 110) se reinicia y vuelve. R2 (prioridad 100) es ahora el Active. ¿Recupera R1 el rol Active?
+ Solo si tiene configurado preempt
- Siempre
- Nunca
= Sin preempt, el Active actual conserva el rol aunque llegue un router con más prioridad.
:::

=== m3-diagnostico | Resolución de problemas de conectividad | 14 | 2
Un método ordenado ahorra horas. Cisco recomienda trabajar **por capas**, de abajo arriba o "divide y vencerás" desde la capa 3.

## Comandos esenciales

| Comando | Qué te dice |
|---|---|
| `show ip interface brief` | Estado e IP de cada interfaz (rápido y clave) |
| `show interfaces` | Errores, velocidad, dúplex, contadores |
| `show ip route` | Si existe ruta al destino y por dónde |
| `show ip ospf neighbor` | Si se han formado los vecinos |
| `show cdp neighbors` | Qué hay conectado en cada puerto |
| `ping` / `traceroute` | Hasta dónde llegan los paquetes |
| `show arp` / `show mac address-table` | Resolución de capa 2 |

## Interpretar el estado de una interfaz

| Status / Protocol | Significado probable |
|---|---|
| up / up | Funciona |
| administratively down / down | Falta `no shutdown` |
| down / down | Problema físico: cable, el otro extremo apagado |
| up / down | Problema de capa 2: encapsulación o reloj distintos en enlaces serie, keepalives |
| down / down (err-disabled) | Desactivada por seguridad: port security, BPDU Guard |

## Símbolos de ping y traceroute en IOS

- `!` respuesta recibida, `.` tiempo de espera agotado, `U` destino inalcanzable (un router devolvió ICMP Unreachable).
- En `traceroute`, `* * *` indica un salto que no responde (o un filtro).

## Un caso típico

"PC1 no llega a PC2 en otra subred":

1. ¿PC1 tiene IP, máscara y gateway correctos?
2. ¿Llega a su gateway? (`ping`)
3. ¿El router tiene ruta a la red de PC2? (`show ip route`)
4. ¿El router de PC2 tiene ruta **de vuelta**?
5. ¿Hay una ACL bloqueando? (`show access-lists`)
6. ¿PC2 tiene bien su gateway?

::: quiz
? Una interfaz aparece como "administratively down". ¿Qué falta?
+ El comando no shutdown
- Un cable
- Una ruta
= Está apagada por configuración.

? En un ping de IOS, ¿qué significa el símbolo U?
- Respuesta correcta
- Tiempo agotado
+ Un router informó de que el destino es inalcanzable
= U = ICMP Destination Unreachable recibido; . = sin respuesta; ! = éxito.

? Una interfaz está "up/down". ¿En qué capa está el problema más probablemente?
- Capa 1
+ Capa 2
- Capa 3
= La capa física funciona (up) pero el protocolo de enlace no (down): encapsulación, keepalives...

? ¿Qué comando da de un vistazo el estado y la IP de todas las interfaces?
+ show ip interface brief
- show running-config
- show version
= Es el primer comando de casi cualquier diagnóstico.
:::

=== m3-averias | Práctica: averías de IP y enrutamiento | 25 | 2
Ya conoces el método por capas. Ahora toca aplicarlo a los problemas de **capa 3**, los más frecuentes cuando "no hay Internet" o "no llego al servidor".

## Las preguntas, en orden

1. **¿Tengo IP correcta?** `show ip interface brief`: interfaz `up/up`, IP y máscara correctas. Una errata (`10.0.21.1` en vez de `10.0.12.1`) rompe todo.
2. **¿Llego a mi vecino directo?** `ping` al otro extremo del enlace o a la puerta de enlace.
3. **¿Sé llegar al destino?** `show ip route`: ¿hay ruta? ¿hay `Gateway of last resort`?
4. **¿Sabe volver la respuesta?** El otro lado también necesita ruta de vuelta.
5. **¿Algo lo filtra?** `show access-lists`: los contadores de *matches* dicen qué regla está actuando.

## Pistas que da la tabla de rutas

- Una ruta estática **no aparece** en la tabla si su siguiente salto no es alcanzable por una red conectada. Si configuraste `ip route 0.0.0.0 0.0.0.0 10.0.12.6` y no la ves, comprueba que 10.0.12.6 está en una red tuya.
- `Gateway of last resort is not set` = no hay ruta por defecto activa.
- Para cambiar una ruta, primero se **borra** la mala: `no ip route ...`.

## Pistas que da el ping

| Resultado | Lo que suele significar |
|---|---|
| `!!!!!` | Llega y vuelve |
| `.....` | Sin respuesta: falta ruta (ida o vuelta) o el destino no existe |
| `U.U.U` | Un router devolvió "destino inalcanzable", a menudo por una ACL |
| `.!!!!` | El primero se pierde mientras se resuelve ARP: normal |

## La gestión del switch

Un switch de capa 2 también tiene "problemas de IP", pero solo en su **SVI**:
- La SVI debe estar `up`: necesita que la VLAN exista y que haya algún puerto activo en esa VLAN o un trunk.
- La IP de la SVI debe estar en la misma red que su puerta de enlace.
- `ip default-gateway` debe apuntar a un router real; si no, el switch responde solo a su propia red.

::: practica
Arregla las tres averías. Usa primero los comandos de diagnóstico: las tareas te los piden a propósito.
:::

[[cli:averia-gestion]]

[[cli:averia-ruta]]

[[cli:averia-ospf]]

::: quiz
? Configuras una ruta por defecto pero no aparece en show ip route. ¿Causa más probable?
+ Su siguiente salto no está en ninguna red conectada activa
- Falta ip routing en el router
- La ruta por defecto nunca se muestra
= Una ruta estática solo se instala si su siguiente salto es alcanzable.

? ¿Qué indica "Gateway of last resort is not set"?
- Que el router no tiene interfaces
+ Que no hay ruta por defecto activa
- Que OSPF está apagado
= Sin ruta por defecto, el router descarta lo que no conoce.

? Un switch no responde desde otra red, pero sí desde la suya. ¿Qué revisas?
+ ip default-gateway
- La VLAN nativa
- El dúplex
= El switch necesita su puerta de enlace para responder a redes remotas.

? Dos routers no forman vecindad OSPF. ¿Cuál NO es una causa posible?
- Áreas distintas en el enlace
- Interfaz pasiva en uno de los lados
+ Distinto hostname en cada router
= El hostname no influye. Sí influyen área, subred, interfaces pasivas, temporizadores y autenticación.
:::
