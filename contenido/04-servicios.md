---
area: redes
id: m4
titulo: Servicios IP
dominio: 4.0 IP Services
peso: 10
descripcion: NAT y PAT, DHCP, DNS, NTP, SNMP, Syslog, QoS, acceso remoto con SSH y transferencia de archivos con TFTP/FTP.
---
=== m4-nat | NAT y PAT | 20 | 2
Las direcciones privadas (RFC 1918) no se enrutan en internet. **NAT** (Network Address Translation) traduce las direcciones privadas a públicas al salir y deshace la traducción en las respuestas.

## Terminología (se pregunta mucho)

| Término | Qué es | Ejemplo |
|---|---|---|
| Inside local | IP del equipo interno, tal como la ve la red interna | 192.168.1.10 |
| Inside global | IP con la que ese equipo aparece en internet | 203.0.113.5 |
| Outside global | IP real del destino externo | 8.8.8.8 |
| Outside local | IP del destino externo tal como la ve la red interna (normalmente igual que la outside global) | 8.8.8.8 |

**Local** = visto desde dentro; **global** = visto desde fuera. **Inside/outside** = de qué lado está el equipo.

## Tipos de NAT

- **NAT estática:** una IP privada ↔ una IP pública fija. Para servidores que deben ser accesibles desde internet.
- **NAT dinámica:** un **pool** de IP públicas que se asignan a demanda. Si se agotan, los siguientes no salen.
- **PAT (NAT overload):** **muchas** IP privadas comparten **una sola** IP pública, diferenciadas por el **número de puerto**. Es lo que hace el router de tu casa.

[[anim:nat]]

## Configuración

```ios
! Marcar las interfaces
R1(config)# interface g0/0
R1(config-if)# ip nat inside
R1(config-if)# interface g0/1
R1(config-if)# ip nat outside
R1(config-if)# exit
! NAT estática para un servidor web
R1(config)# ip nat inside source static 192.168.1.100 203.0.113.10
! PAT con la IP de la interfaz exterior
R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface g0/1 overload
! NAT dinámica con un pool
R1(config)# ip nat pool PUBLICAS 203.0.113.20 203.0.113.30 netmask 255.255.255.0
R1(config)# ip nat inside source list 1 pool PUBLICAS
! Verificación
R1# show ip nat translations
R1# show ip nat statistics
R1# clear ip nat translation *
```

::: examen
Errores típicos en los ejercicios de NAT: las interfaces `ip nat inside` / `ip nat outside` al revés, la ACL que no incluye la red interna, o falta la palabra **overload** (sin ella, solo un equipo podría salir a la vez con la IP de la interfaz).
:::

[[cli:nat]]

::: quiz
? Un PC interno 10.0.0.5 sale a internet como 198.51.100.7. ¿Qué es 10.0.0.5?
+ Inside local
- Inside global
- Outside local
- Outside global
= Es la dirección del equipo interno vista desde la red interna.

? ¿Qué tipo de NAT permite que cientos de equipos salgan con una sola IP pública?
- NAT estática
- NAT dinámica
+ PAT (overload)
= PAT distingue las conexiones por el puerto de origen.

? ¿Qué NAT usarías para publicar un servidor web interno en internet?
+ NAT estática
- PAT
- NAT dinámica
= Necesita una correspondencia fija para que las conexiones entrantes lleguen siempre al mismo servidor.

? ¿Qué comando muestra las traducciones NAT activas?
- show ip nat statistics
+ show ip nat translations
- show nat table
= show ip nat translations lista cada correspondencia inside/outside local/global.

? Tras configurar PAT nadie sale a internet. Las interfaces están marcadas al revés. ¿Qué pasa?
+ El router traduce en el sentido equivocado y no funciona
- Funciona igual
= ip nat inside debe ir en la interfaz de la LAN y ip nat outside en la de internet.
:::

=== m4-dhcp | DHCP | 18 | 2
**DHCP** (Dynamic Host Configuration Protocol) entrega automáticamente a cada equipo su **IP, máscara, puerta de enlace, servidores DNS** y otros datos, por un tiempo limitado (**concesión** o *lease*).

## El proceso DORA

1. **Discover:** el cliente, sin IP, pregunta en **broadcast**: "¿hay algún servidor DHCP?" (origen 0.0.0.0, destino 255.255.255.255, UDP 68 → 67).
2. **Offer:** el servidor ofrece una dirección.
3. **Request:** el cliente acepta la oferta, en **broadcast** (para que los demás servidores sepan que no la ha elegido).
4. **Acknowledge (ACK):** el servidor confirma. El cliente ya puede usar la IP.

Al llegar a la **mitad de la concesión (T1)**, el cliente intenta renovarla directamente con el servidor (en unicast).

[[anim:dhcp]]

## Router Cisco como servidor DHCP

```ios
R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.20
R1(config)# ip dhcp pool VENTAS
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# dns-server 8.8.8.8 1.1.1.1
R1(dhcp-config)# domain-name empresa.local
R1(dhcp-config)# lease 7
R1# show ip dhcp binding
R1# show ip dhcp pool
```

Las direcciones excluidas se reservan para el router, servidores e impresoras con IP fija.

## DHCP relay

Los Discover son **broadcast** y los routers **no reenvían broadcasts**. Si el servidor DHCP está en otra red, el router de la LAN de los clientes debe actuar como **agente de retransmisión (relay)**: recibe el broadcast y lo reenvía en **unicast** al servidor.

```ios
R1(config)# interface g0/0
R1(config-if)# ip helper-address 10.50.0.10
```

El comando va en la interfaz que **recibe los broadcasts de los clientes** (la de su LAN), no en la que da al servidor.

## Cliente DHCP en un router

```ios
R1(config-if)# ip address dhcp
```

Típico en la interfaz que da al proveedor de internet.

[[cli:dhcp]]

::: quiz
? ¿Cuál es el orden de los mensajes DHCP?
- Request, Offer, Discover, Ack
+ Discover, Offer, Request, Ack
- Discover, Request, Offer, Ack
= DORA: Discover, Offer, Request, Acknowledge.

? El servidor DHCP está en otra subred y los clientes no reciben IP. ¿Qué comando falta en el router de la LAN de los clientes?
- ip dhcp pool
+ ip helper-address con la IP del servidor
- ip address dhcp
= ip helper-address convierte el broadcast DHCP en unicast hacia el servidor remoto.

? ¿En qué interfaz se configura ip helper-address?
+ En la que recibe los broadcasts de los clientes
- En la que conecta con el servidor DHCP
- En todas
= Va en la interfaz (o SVI) de la LAN de los clientes.

? ¿Para qué sirve ip dhcp excluded-address?
+ Para que el servidor no asigne ciertas direcciones (reservadas a equipos con IP fija)
- Para bloquear clientes concretos
- Para definir el gateway
= Las direcciones excluidas nunca se ofrecen a los clientes.

? ¿Qué puertos usa DHCP?
- TCP 67 y 68
+ UDP 67 (servidor) y 68 (cliente)
- UDP 53
= DHCP funciona sobre UDP: 67 el servidor y 68 el cliente.
:::

=== m4-dns | DNS | 14 | 1
El **DNS** traduce nombres (`www.cisco.com`) en direcciones IP. Sin DNS tendríamos que memorizar IP.

## La jerarquía

- **Raíz** (`.`), 13 grupos de servidores raíz en el mundo.
- **TLD** (dominios de primer nivel): `.com`, `.org`, `.do`, `.es`...
- **Dominios** de segundo nivel: `cisco.com`.
- **Subdominios** y nombres de equipo: `www.cisco.com`.

## Cómo se resuelve un nombre

1. El equipo pregunta a su **resolver** (el DNS configurado, por ejemplo el del proveedor o 8.8.8.8): consulta **recursiva** ("dame la respuesta final").
2. Si el resolver no la tiene en caché, pregunta a la **raíz** → le remite a los servidores de **.com** → estos le remiten a los **autoritativos de cisco.com** → que dan la IP. Son consultas **iterativas**.
3. El resolver devuelve la respuesta al cliente y la guarda en **caché** durante su **TTL**.

[[anim:dns]]

## Tipos de registro

| Registro | Contenido |
|---|---|
| A | Nombre → IPv4 |
| AAAA | Nombre → IPv6 |
| CNAME | Alias de otro nombre |
| MX | Servidor de correo del dominio |
| NS | Servidores autoritativos del dominio |
| PTR | IP → nombre (resolución inversa) |
| TXT | Texto (verificaciones, SPF) |

DNS usa **UDP 53** para las consultas normales y **TCP 53** para respuestas grandes y transferencias de zona.

## DNS en un router Cisco

```ios
R1(config)# ip domain-lookup
R1(config)# ip name-server 8.8.8.8
R1(config)# ip domain-name empresa.local
R1(config)# ip host SERVIDOR1 10.50.0.20
! Evitar que un comando mal escrito se interprete como un nombre:
R1(config)# no ip domain-lookup
```

::: quiz
? ¿Qué registro DNS asocia un nombre con una dirección IPv6?
- A
+ AAAA
- PTR
- MX
= A es para IPv4 y AAAA (cuádruple A) para IPv6.

? ¿Qué tipo de consulta hace normalmente un PC a su servidor DNS?
+ Recursiva
- Iterativa
= El PC pide la respuesta final; el resolver hace el trabajo iterativo con los demás servidores.

? ¿Qué registro identifica el servidor de correo de un dominio?
+ MX
- CNAME
- NS
= MX (Mail Exchanger).

? ¿Qué puerto y protocolo usan las consultas DNS normales?
- TCP 53
+ UDP 53
- UDP 67
= Las consultas normales van por UDP 53; TCP 53 se usa para respuestas grandes y transferencias de zona.
:::

=== m4-ntp | NTP: sincronizar la hora | 10 | 2
Que todos los equipos tengan **la misma hora** es esencial para correlacionar registros (logs), para los certificados digitales y para la autenticación (Kerberos falla con más de 5 minutos de diferencia).

**NTP** (Network Time Protocol, **UDP 123**) sincroniza los relojes con una fuente de referencia.

## Estratos

El **estrato** indica la distancia a la fuente original: **estrato 0** = reloj atómico o GPS; **estrato 1** = servidor conectado directamente a él; cada salto suma uno. Hasta 15; **16 = no sincronizado**.

## Configuración

```ios
! Cliente NTP
R1(config)# ntp server 192.0.2.10
R1(config)# clock timezone AST -4
! Hacer que el router sea servidor NTP para la red
R2(config)# ntp master 3
! Autenticación NTP
R1(config)# ntp authenticate
R1(config)# ntp authentication-key 1 md5 ClaveNTP
R1(config)# ntp trusted-key 1
R1(config)# ntp server 192.0.2.10 key 1
R1# show ntp status
R1# show ntp associations
R1# show clock
```

Un router puede ser **cliente** (`ntp server`), **servidor** (`ntp master`) o **par** (`ntp peer`) a la vez.

::: quiz
? ¿Qué puerto usa NTP?
- TCP 123
+ UDP 123
- UDP 161
= NTP funciona sobre UDP 123.

? ¿Qué estrato indica que un dispositivo no está sincronizado?
- 0
- 1
+ 16
= Los estratos válidos van de 0 a 15; 16 significa no sincronizado.

? ¿Qué comando hace que un router Cisco sea servidor NTP con su propio reloj?
+ ntp master
- ntp server
- ntp peer
= ntp master usa el reloj interno como referencia; ntp server lo convierte en cliente.
:::

=== m4-snmp-syslog | SNMP y Syslog | 16 | 2
## SNMP

**SNMP** (Simple Network Management Protocol) permite a una plataforma de monitorización (el **NMS** o **gestor**) consultar y configurar los equipos (los **agentes**). La información se organiza en la **MIB**, donde cada dato tiene un identificador **OID**.

Operaciones:

- **Get / GetNext / GetBulk:** el gestor lee valores (CPU, tráfico de interfaces).
- **Set:** el gestor cambia un valor.
- **Trap:** el agente avisa por iniciativa propia de un evento (una interfaz cae). Sin confirmación.
- **Inform:** como un trap, pero el gestor confirma la recepción.

Puertos: **UDP 161** (consultas al agente) y **UDP 162** (traps e informs hacia el gestor).

| Versión | Seguridad |
|---|---|
| SNMPv1 / v2c | Solo **community strings** en texto plano (como una contraseña compartida) |
| SNMPv3 | **Autenticación** y **cifrado** por usuario (niveles noAuthNoPriv, authNoPriv, **authPriv**) |

```ios
R1(config)# snmp-server community LecturaSegura RO
R1(config)# snmp-server host 10.50.0.30 version 2c LecturaSegura
! SNMPv3 recomendado:
R1(config)# snmp-server group ADMINS v3 priv
R1(config)# snmp-server user monitor ADMINS v3 auth sha ClaveAuth123 priv aes 128 ClavePriv123
```

## Syslog

**Syslog** envía los mensajes de registro de los equipos a un servidor central (**UDP 514**).

| Nivel | Nombre | Ejemplo |
|---|---|---|
| 0 | Emergency | El sistema no es utilizable |
| 1 | Alert | Hay que actuar de inmediato |
| 2 | Critical | Condición crítica |
| 3 | Error | Error |
| 4 | Warning | Advertencia |
| 5 | Notification | Normal pero significativo (interfaz up/down) |
| 6 | Informational | Informativo |
| 7 | Debugging | Depuración |

Regla mnemotécnica: **"Every Awesome Cisco Engineer Will Need Ice cream Daily"**. Al configurar un nivel, se envían **ese nivel y todos los más graves** (números menores).

```ios
R1(config)# logging host 10.50.0.40
R1(config)# logging trap warning
R1(config)# service timestamps log datetime msec
R1# show logging
```

Formato de un mensaje: `*Mar 1 10:15:02.123: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to up` → **facility** LINEPROTO, **gravedad 5**, **mnemónico** UPDOWN.

::: quiz
? ¿Qué versión de SNMP ofrece autenticación y cifrado?
- v1
- v2c
+ v3
= SNMPv3 con nivel authPriv autentica y cifra. v1 y v2c solo usan community strings en claro.

? ¿Qué mensaje SNMP envía un agente por iniciativa propia, sin esperar confirmación?
- Get
- Set
+ Trap
- Inform
= El trap avisa de un evento; el inform es similar pero requiere confirmación.

? Si configuras logging trap 4, ¿qué niveles se envían?
- Solo el 4
+ Del 0 al 4
- Del 4 al 7
= Se envía el nivel indicado y todos los más graves.

? En %LINEPROTO-5-UPDOWN, ¿qué indica el 5?
+ El nivel de gravedad (notification)
- El número de interfaz
- El número de mensajes
= El número entre guiones es la gravedad syslog.

? ¿Qué puerto usa Syslog?
- TCP 514
+ UDP 514
- UDP 162
= Syslog clásico usa UDP 514.
:::

=== m4-qos | Calidad de servicio (QoS) | 18 | 3
Cuando un enlace se satura, los paquetes se acumulan en colas. **QoS** decide **qué tráfico va primero** para que la voz y el vídeo funcionen aunque haya congestión.

## Características que hay que controlar

- **Ancho de banda:** capacidad del enlace.
- **Retardo (delay):** cuánto tarda un paquete. Voz: **≤ 150 ms** en un sentido.
- **Variación del retardo (jitter):** voz **≤ 30 ms**.
- **Pérdida:** voz **≤ 1 %**.

## Las herramientas, en orden

1. **Clasificación:** identificar el tráfico (por ACL, por puerto, por NBAR, que reconoce aplicaciones).
2. **Marcado:** escribir la prioridad en la cabecera para que los demás equipos no tengan que volver a clasificar. En capa 2 se usa **CoS** (3 bits en la etiqueta 802.1Q, valores 0–7) y en capa 3, **DSCP** (6 bits en la cabecera IP, valores 0–63).
3. **Gestión de colas:** **LLQ** (cola de prioridad estricta para voz más colas con ancho de banda garantizado, CBWFQ).
4. **Evitar la congestión:** **WRED** descarta al azar algunos paquetes TCP antes de que la cola se llene, para que las sesiones reduzcan su velocidad poco a poco (evita la sincronización global de TCP).
5. **Policing y shaping:** ambos limitan la velocidad, de forma distinta.

| Herramienta | Qué hace con el exceso | Efecto | Dónde se usa |
|---|---|---|---|
| **Policing** | Lo **descarta** (o lo remarca) | Puede perder paquetes, sin añadir retardo | Entrada del proveedor |
| **Shaping** | Lo **almacena en cola** y lo envía después | No pierde, pero añade retardo | Salida del cliente hacia el proveedor |

## Marcas DSCP habituales

| Tráfico | DSCP | Valor |
|---|---|---|
| Voz | **EF** (Expedited Forwarding) | 46 |
| Vídeo interactivo | AF41 | 34 |
| Señalización de voz | CS3 | 24 |
| Datos críticos | AF21–AF31 | 18–26 |
| Normal | Default / BE | 0 |

## Trust boundary

El **límite de confianza** es el punto a partir del cual se respetan las marcas. Lo ideal: lo más cerca posible del origen, por ejemplo en el **teléfono IP**, para no dejar que un PC se marque a sí mismo como voz.

::: quiz
? ¿Qué valor DSCP se usa para la voz?
- AF41
+ EF (46)
- CS1
- 0
= Expedited Forwarding (46) es la marca estándar de la voz.

? ¿Qué diferencia hay entre policing y shaping?
+ Policing descarta el exceso; shaping lo retiene en cola y lo envía después
- Son lo mismo
- Shaping descarta y policing almacena
= Policing es estricto y puede perder paquetes; shaping suaviza el tráfico a costa de retardo.

? ¿Qué mecanismo descarta paquetes antes de que la cola se llene para evitar la sincronización global de TCP?
- LLQ
+ WRED
- CBWFQ
= WRED (Weighted Random Early Detection) descarta al azar de forma anticipada.

? ¿Cuántos bits ocupa el campo DSCP?
- 3
+ 6
- 8
= DSCP usa 6 bits (64 valores). CoS usa 3 bits.

? ¿Qué jitter máximo se recomienda para la voz?
- 5 ms
+ 30 ms
- 150 ms
= Voz: retardo ≤ 150 ms, jitter ≤ 30 ms, pérdida ≤ 1 %.
:::

=== m4-ssh | Acceso remoto seguro con SSH | 14 | 2
Configurar SSH en un router o switch es una tarea que harás en tu primer día de trabajo y que el examen pregunta paso a paso.

## Los pasos

```ios
SW1(config)# hostname SW1
SW1(config)# ip domain-name empresa.local
SW1(config)# crypto key generate rsa modulus 2048
SW1(config)# ip ssh version 2
SW1(config)# username admin privilege 15 algorithm-type scrypt secret Cl4veFuerte!
SW1(config)# line vty 0 15
SW1(config-line)# login local
SW1(config-line)# transport input ssh
SW1(config-line)# exec-timeout 10 0
SW1(config-line)# exit
! En un switch de capa 2, para gestionarlo en remoto:
SW1(config)# interface vlan 99
SW1(config-if)# ip address 192.168.99.10 255.255.255.0
SW1(config-if)# no shutdown
SW1(config)# ip default-gateway 192.168.99.1
SW1# show ip ssh
SW1# show ssh
```

1. **Hostname** distinto del de fábrica y **nombre de dominio**: hacen falta para generar las claves.
2. **Claves RSA** de al menos **1024 bits** para SSHv2 (recomendado 2048 o más).
3. **SSH versión 2** (la 1 tiene vulnerabilidades).
4. **Usuario local** con contraseña cifrada (`secret`).
5. En las líneas **VTY**: `login local` (usar los usuarios locales) y `transport input ssh` (rechazar Telnet).

Para limitar desde dónde se puede administrar, aplica una ACL a las VTY: `access-class 10 in`.

[[cli:ssh]]

::: quiz
? ¿Qué dos datos hacen falta antes de generar las claves RSA para SSH?
+ Un hostname distinto del de fábrica y un ip domain-name
- Una VLAN y un trunk
- Una ruta por defecto y DNS
= El nombre de la clave se forma con hostname.dominio.

? ¿Qué comando de las líneas VTY impide el acceso por Telnet?
- login local
+ transport input ssh
- no telnet
= transport input ssh solo acepta SSH en esas líneas.

? ¿Qué tamaño mínimo de clave RSA necesita SSH versión 2?
- 512 bits
+ 1024 bits
- 4096 bits
= SSHv2 requiere al menos 1024 bits; hoy se recomiendan 2048 o más.

? ¿Qué hace login local en las líneas VTY?
+ Pide usuario y contraseña de la base de datos local (username)
- Pide solo la contraseña de la línea
- Desactiva la autenticación
= login a secas usaría la contraseña de la línea; login local usa los usuarios creados con username.

? ¿Qué comando aplica una ACL que limita quién puede conectarse por SSH al equipo?
- ip access-group 10 in
+ access-class 10 in (en line vty)
= En las líneas VTY se usa access-class; ip access-group es para interfaces.
:::

=== m4-tftp | TFTP y FTP: copiar imágenes y configuraciones | 10 | 2
Para hacer copias de seguridad de la configuración o actualizar el IOS se copian archivos entre el equipo y un servidor.

| | TFTP | FTP |
|---|---|---|
| Transporte | UDP 69 | TCP 20 (datos) y 21 (control) |
| Autenticación | No | Usuario y contraseña |
| Funciones | Solo enviar y recibir archivos | Listar directorios, renombrar, borrar... |
| Uso típico | Laboratorios, redes internas | Transferencias que requieren autenticación |

Ninguno de los dos cifra: en producción se prefiere **SCP** o **SFTP** (sobre SSH).

```ios
R1# copy running-config tftp:
Address or name of remote host []? 10.50.0.50
Destination filename [r1-confg]? r1-backup.cfg
R1# copy tftp: flash:
R1# show flash:
! FTP con credenciales
R1(config)# ip ftp username respaldos
R1(config)# ip ftp password Cl4ve
R1# copy ftp: flash:
! Arrancar con la nueva imagen
R1(config)# boot system flash:isr4300-universalk9.17.09.04a.SPA.bin
```

Antes de actualizar el IOS comprueba con `show flash:` que hay **espacio suficiente** y verifica la integridad del archivo con `verify /md5 flash:archivo.bin`.

::: quiz
? ¿Qué protocolo de transferencia no tiene autenticación y usa UDP 69?
+ TFTP
- FTP
- SFTP
= TFTP es trivial: sin autenticación ni listados de directorios.

? ¿Qué puertos usa FTP?
- UDP 69
+ TCP 20 y 21
- TCP 22
= 21 para el canal de control y 20 para los datos (en modo activo).

? ¿Qué alternativa cifrada se recomienda para copiar archivos en producción?
- TFTP
- FTP
+ SCP o SFTP
= Ambos funcionan sobre SSH y cifran la transferencia.
:::
