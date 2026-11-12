---
area: redes
id: m5
titulo: Fundamentos de seguridad
dominio: 5.0 Security Fundamentals
peso: 15
descripcion: Amenazas y mitigación, contraseñas y MFA, AAA, listas de control de acceso, seguridad de capa 2, VPN IPsec y seguridad inalámbrica.
---
=== m5-conceptos | Amenazas, vulnerabilidades y ataques | 18 | 1
[[video:phishing]]

## Vocabulario básico

- **Vulnerabilidad:** una debilidad (un software sin parchear, una contraseña por defecto).
- **Amenaza:** algo o alguien que puede aprovechar una vulnerabilidad.
- **Exploit:** la técnica o el programa concreto que la aprovecha.
- **Mitigación:** la medida que reduce el riesgo (parchear, filtrar, formar).

La seguridad busca proteger la **triada CIA**: **Confidencialidad** (solo accede quien debe), **Integridad** (los datos no se alteran) y **Disponibilidad** (el servicio funciona cuando se necesita).

## Tipos de ataque que pide el examen

| Ataque | Cómo funciona |
|---|---|
| DoS / DDoS | Saturar un servicio para que deje de responder (DDoS: desde muchos equipos, una botnet). Ejemplo: inundación SYN |
| Spoofing | Falsificar la dirección de origen (IP, MAC, ARP) para hacerse pasar por otro |
| Reflexión y amplificación | Enviar peticiones con la IP de la víctima como origen a servidores que responden con mucho más tráfico (DNS, NTP) |
| Man-in-the-middle | Interponerse entre dos partes para leer o alterar el tráfico (por ejemplo, con ARP spoofing) |
| Reconocimiento | Recopilar información antes de atacar: escaneo de puertos, consultas whois |
| Malware | Virus (necesita a un usuario), gusano (se propaga solo), troyano (se disfraza de software legítimo), ransomware (cifra y pide rescate) |
| Ingeniería social | Engañar a personas: phishing (correo), spear phishing (dirigido), vishing (voz), smishing (SMS), whaling (directivos), tailgating (colarse detrás de alguien) |
| Ataques a contraseñas | Fuerza bruta, diccionario, robo de credenciales |
| Buffer overflow | Enviar más datos de los esperados para ejecutar código |

::: quiz
? Un atacante envía a servidores DNS consultas con la IP de la víctima como origen, y las respuestas, mucho mayores, saturan a la víctima. ¿Qué ataque es?
- Phishing
+ Reflexión y amplificación
- Buffer overflow
= El atacante refleja el tráfico en terceros que amplifican el volumen hacia la víctima.

? ¿Qué tipo de malware se propaga solo, sin intervención del usuario?
- Virus
+ Gusano
- Troyano
= El gusano explota vulnerabilidades para copiarse a otros equipos por la red.

? Un correo dirigido específicamente al director financiero imitando al banco es un caso de...
- Vishing
+ Whaling (o spear phishing a un directivo)
- Tailgating
= El whaling es phishing dirigido a altos cargos.

? ¿Qué elemento de la triada CIA protege un ataque DoS?
- Confidencialidad
- Integridad
+ Disponibilidad
= Un DoS busca dejar el servicio no disponible.
:::

=== m5-programa | El programa de seguridad | 10 | 1
La tecnología no basta: la mayoría de incidentes empiezan por un error humano. Un **programa de seguridad** completo incluye:

- **Concienciación de los usuarios:** campañas periódicas, simulacros de phishing, avisos sobre amenazas actuales.
- **Formación:** cursos específicos según el puesto (los administradores necesitan más que el resto).
- **Control de acceso físico:** salas de equipos cerradas, tarjetas o biometría, cámaras, registro de visitas. Quien tiene acceso físico a un equipo puede restablecer sus contraseñas.
- **Políticas:** uso aceptable, contraseñas, copias de seguridad, respuesta a incidentes.

## Concienciación frente a formación

La diferencia es una pregunta típica del examen:

| | Concienciación (awareness) | Formación (training) |
| --- | --- | --- |
| A quién | A todos los empleados | A puestos concretos |
| Objetivo | Reconocer amenazas y saber a quién avisar | Saber hacer tareas de seguridad |
| Ejemplos | Carteles, correos, simulacros de phishing, charlas cortas | Curso de configuración segura para administradores de red |
| Frecuencia | Continua, varias veces al año | Al entrar en el puesto y al cambiar la tecnología |

## Control de acceso físico

La seguridad física es la primera capa de la **defensa en profundidad**. Medidas habituales:

- Puertas con **tarjeta, PIN o biometría** en salas de servidores y armarios de red (racks cerrados con llave).
- **Esclusas (mantraps)** de dos puertas para evitar el *tailgating* (colarse detrás de alguien autorizado).
- **Cámaras** y **registro de visitas**: quién entró, cuándo y acompañado de quién.
- Puertos de red libres **desactivados** (`shutdown`) para que nadie conecte un equipo en una sala de reuniones.

::: cuidado
Con acceso físico a un router o switch, cualquiera puede hacer la **recuperación de contraseña** (reiniciar el equipo e interrumpir el arranque). Por eso los equipos de red siempre van en salas o armarios cerrados.
:::

## Políticas y respuesta a incidentes

Las **políticas** dicen qué está permitido y qué hay que hacer. Las más comunes: uso aceptable, contraseñas, acceso remoto (VPN), clasificación de la información y copias de seguridad. El **plan de respuesta a incidentes** define los pasos cuando algo ocurre: detectar, contener, erradicar, recuperar y aprender (lecciones aprendidas).

::: examen
El CCNA pide **describir** los elementos de un programa de seguridad: concienciación de usuarios, formación y control de acceso físico. Asocia cada ejemplo al elemento correcto.
:::

::: quiz
? Un empleado entra en la sala de servidores siguiendo a un compañero que tiene tarjeta. ¿Qué medida del programa de seguridad falla?
+ El control de acceso físico y la concienciación
- El cifrado
- El enrutamiento
= Es tailgating: se combate con controles físicos (puertas con esclusa) y concienciación.

? ¿Qué elemento del programa de seguridad incluye los simulacros de phishing?
+ La concienciación de los usuarios
- El control de acceso físico
- La NAT
= Los simulacros enseñan a reconocer correos fraudulentos.

? Un curso específico sobre configuración segura de switches para el equipo de redes es un ejemplo de…
+ Formación
- Concienciación general
- Control de acceso físico
= La formación va dirigida a un puesto concreto y enseña a hacer tareas; la concienciación es para todos.

? ¿Por qué hay que guardar los routers en un armario cerrado aunque tengan contraseñas fuertes?
+ Porque con acceso físico se puede hacer la recuperación de contraseña
- Porque el calor estropea las contraseñas
- Porque OSPF lo exige
= Reiniciando el equipo e interrumpiendo el arranque se salta la contraseña: el acceso físico lo anula todo.
:::

=== m5-contrasenas | Contraseñas, MFA y control de acceso a los equipos | 16 | 1
## Políticas de contraseñas

- Longitud mínima (12 o más caracteres; mejor **frases de contraseña**).
- Sin reutilizar contraseñas ni usar las de fábrica.
- Bloqueo tras varios intentos fallidos.
- Mejor que las contraseñas: **MFA**.

## Autenticación multifactor (MFA)

Combina **dos o más factores de tipo distinto**:

- **Algo que sabes:** contraseña, PIN.
- **Algo que tienes:** el móvil con una app de códigos (TOTP), una llave de seguridad, una tarjeta.
- **Algo que eres:** huella, rostro, iris (**biometría**).

Dos contraseñas **no** son MFA: son el mismo factor.

Los **certificados digitales** (PKI) permiten autenticar equipos y usuarios sin contraseña: una autoridad de certificación (CA) firma el certificado y cualquiera que confíe en la CA puede verificarlo.

## Proteger el acceso a un equipo Cisco

```ios
R1(config)# enable secret Cl4ve-Priv!
R1(config)# service password-encryption
R1(config)# security passwords min-length 10
R1(config)# username admin algorithm-type scrypt secret Adm1n-Segur0
R1(config)# login block-for 120 attempts 3 within 60
R1(config)# line console 0
R1(config-line)# login local
R1(config-line)# exec-timeout 5 0
```

| Tipo | Algoritmo | Seguridad |
|---|---|---|
| 0 | Texto plano | Ninguna |
| 7 | Cifrado reversible de Cisco (`service password-encryption`) | Muy débil: se descifra al instante |
| 5 | MD5 | Débil hoy |
| 8 | PBKDF2-SHA-256 | Buena |
| 9 | scrypt | La mejor disponible |

`login block-for 120 attempts 3 within 60` bloquea los inicios de sesión 120 segundos si hay 3 fallos en 60 segundos (protege contra fuerza bruta).

::: quiz
? ¿Cuál de estas combinaciones es MFA?
- Contraseña y PIN
+ Contraseña y código de una app en el móvil
- Dos contraseñas distintas
= Contraseña (algo que sabes) + móvil (algo que tienes) son dos factores distintos.

? ¿Qué tipo de hash de contraseña de Cisco es el más seguro?
- Tipo 7
- Tipo 5
+ Tipo 9 (scrypt)
= Tipo 9 usa scrypt, resistente a ataques por fuerza bruta con hardware especializado.

? ¿Qué hace service password-encryption?
+ Ofusca con el débil tipo 7 las contraseñas que estaban en texto plano
- Aplica scrypt a todas las contraseñas
- Cifra el tráfico de la consola
= Solo evita que se lean a simple vista; el tipo 7 se descifra fácilmente.

? La huella dactilar es un factor del tipo...
- Algo que sabes
- Algo que tienes
+ Algo que eres
= La biometría es "algo que eres".
:::

=== m5-aaa | AAA: autenticación, autorización y registro | 12 | 2
**AAA** centraliza el control de quién entra en los equipos de red y qué hace.

- **Autenticación (Authentication):** ¿quién eres? (usuario y contraseña, certificado).
- **Autorización (Authorization):** ¿qué puedes hacer? (nivel de privilegio, comandos permitidos).
- **Registro (Accounting):** ¿qué has hecho? (comandos, inicio y fin de sesión).

En lugar de crear usuarios en cada router, se usa un servidor central (Cisco ISE, por ejemplo) con uno de estos protocolos:

| | RADIUS | TACACS+ |
|---|---|---|
| Origen | Estándar abierto | Cisco |
| Transporte | UDP 1812 (auth) y 1813 (accounting) | TCP 49 |
| Cifrado | Solo la contraseña | Todo el cuerpo del paquete |
| Separa autenticación y autorización | No (van juntas) | Sí |
| Uso típico | Acceso de usuarios a la red (802.1X, VPN, wifi) | Administración de equipos (control por comando) |

```ios
R1(config)# aaa new-model
R1(config)# tacacs server ISE1
R1(config-server-tacacs)# address ipv4 10.50.0.60
R1(config-server-tacacs)# key Cl4veCompartida
R1(config-server-tacacs)# exit
R1(config)# aaa authentication login default group tacacs+ local
R1(config)# aaa authorization exec default group tacacs+ local
R1(config)# aaa accounting commands 15 default start-stop group tacacs+
```

`group tacacs+ local` significa: usa el servidor TACACS+ y, **si no responde**, la base de datos local (para no quedarte fuera).

**802.1X** autentica a los equipos antes de dejarles usar un puerto del switch o la wifi. Intervienen tres papeles: el **suplicante** (el cliente), el **autenticador** (el switch o el AP) y el **servidor de autenticación** (RADIUS).

::: quiz
? ¿Qué protocolo AAA cifra el paquete completo y usa TCP 49?
- RADIUS
+ TACACS+
= TACACS+ cifra todo el cuerpo y separa autenticación, autorización y accounting.

? ¿Qué componente de AAA registra los comandos que ejecuta un administrador?
- Autenticación
- Autorización
+ Accounting (registro)
= Accounting guarda qué hizo cada usuario y cuándo.

? En 802.1X, ¿qué papel tiene el switch?
- Suplicante
+ Autenticador
- Servidor de autenticación
= El switch hace de intermediario entre el cliente (suplicante) y el servidor RADIUS.

? ¿Qué significa aaa authentication login default group tacacs+ local?
+ Autenticar con TACACS+ y, si el servidor no responde, con los usuarios locales
- Autenticar primero en local y luego con TACACS+
- Usar solo TACACS+
= El método local actúa como respaldo si el servidor no está disponible.
:::

=== m5-acl-estandar | ACL estándar | 18 | 2
Una **lista de control de acceso (ACL)** es una lista ordenada de reglas **permit** o **deny** que el router aplica a los paquetes de una interfaz.

## Cómo se procesa una ACL

1. Las reglas (ACE) se comprueban **de arriba abajo**.
2. En la **primera coincidencia**, se aplica la acción y se deja de mirar.
3. Al final hay un **deny any implícito**: lo que no coincide con nada se descarta. Una ACL con solo reglas deny lo bloquea **todo**.

## ACL estándar

Filtran **solo por la IP de origen**. Números **1–99** y **1300–1999**, o con nombre.

**Dónde aplicarlas: lo más cerca posible del destino**, porque como no miran el destino, si las pones cerca del origen bloquearías tráfico hacia otros sitios.

```ios
! Bloquear al equipo 192.168.10.50 y permitir al resto de su red
R1(config)# access-list 10 deny host 192.168.10.50
R1(config)# access-list 10 permit 192.168.10.0 0.0.0.255
R1(config)# interface g0/2
R1(config-if)# ip access-group 10 out
! Con nombre
R1(config)# ip access-list standard GESTION
R1(config-std-nacl)# permit 192.168.99.0 0.0.0.255
R1(config-std-nacl)# deny any log
R1(config)# line vty 0 15
R1(config-line)# access-class GESTION in
```

## Máscaras wildcard

Un **0** significa "este bit debe coincidir" y un **1**, "me da igual".

| Wildcard | Qué abarca |
|---|---|
| `0.0.0.0` (o `host`) | Una sola IP |
| `0.0.0.255` | Una /24 |
| `0.0.0.63` | Una /26 |
| `255.255.255.255` (o `any`) | Cualquier IP |

Wildcard = 255.255.255.255 − máscara. Para `172.16.32.0/20` → máscara 255.255.240.0 → wildcard **0.0.15.255**.

Solo puede haber **una ACL por interfaz, por sentido y por protocolo** (una IPv4 de entrada y una de salida).

[[anim:acl]]

[[cli:acl]]

::: quiz
? ¿Por qué campo filtra una ACL estándar?
+ La IP de origen
- La IP de destino
- El puerto
- La MAC
= Las estándar solo miran el origen; las extendidas, origen, destino, protocolo y puertos.

? ¿Dónde se recomienda aplicar una ACL estándar?
- Cerca del origen
+ Cerca del destino
= Al no mirar el destino, aplicarla cerca del origen bloquearía más tráfico del deseado.

? Una ACL solo contiene `access-list 5 deny 10.1.1.0 0.0.0.255`. ¿Qué pasa con el resto del tráfico?
- Se permite
+ Se bloquea por el deny any implícito
= Al final de toda ACL hay un deny any implícito; hace falta un permit any explícito.

? ¿Qué wildcard selecciona la subred 10.10.4.0/22?
- 0.0.0.255
+ 0.0.3.255
- 0.0.4.255
- 255.255.252.0
= Máscara /22 = 255.255.252.0 → wildcard 0.0.3.255.

? ¿Con qué comando se aplica una ACL a las líneas VTY?
- ip access-group
+ access-class
= En líneas se usa access-class; en interfaces, ip access-group.
:::

=== m5-acl-extendida | ACL extendidas | 18 | 3
Las **ACL extendidas** filtran por **protocolo, IP de origen, IP de destino y puertos**. Números **100–199** y **2000–2699**, o con nombre.

**Dónde aplicarlas: lo más cerca posible del origen**, para descartar el tráfico no deseado cuanto antes y no gastar ancho de banda.

## Sintaxis

`access-list <100-199> {permit|deny} <protocolo> <origen> <wildcard> [operador puerto] <destino> <wildcard> [operador puerto] [established] [log]`

Protocolos: `ip`, `tcp`, `udp`, `icmp`, `ospf`... Operadores de puerto: `eq` (igual), `neq`, `lt`, `gt`, `range`. El puerto va **detrás de la dirección a la que pertenece**.

```ios
! Permitir web (HTTP/HTTPS) desde la LAN 192.168.10.0/24 al servidor 10.50.0.20
R1(config)# ip access-list extended WEB-SERVIDOR
R1(config-ext-nacl)# 10 permit tcp 192.168.10.0 0.0.0.255 host 10.50.0.20 eq 80
R1(config-ext-nacl)# 20 permit tcp 192.168.10.0 0.0.0.255 host 10.50.0.20 eq 443
R1(config-ext-nacl)# 30 deny ip 192.168.10.0 0.0.0.255 host 10.50.0.20
R1(config-ext-nacl)# 40 permit ip any any
R1(config-ext-nacl)# exit
R1(config)# interface g0/0
R1(config-if)# ip access-group WEB-SERVIDOR in
R1# show access-lists
```

## Editar una ACL con nombre o números de secuencia

```ios
R1(config)# ip access-list extended WEB-SERVIDOR
R1(config-ext-nacl)# 15 permit tcp 192.168.10.0 0.0.0.255 host 10.50.0.20 eq 22
R1(config-ext-nacl)# no 30
```

Con los números de secuencia puedes **insertar** una regla entre dos o **borrar** una sola, sin reescribir toda la ACL.

## Errores frecuentes

- Poner las reglas más generales antes que las específicas (las específicas nunca se alcanzan).
- Olvidar el `permit ip any any` final cuando se quiere bloquear algo concreto y dejar pasar lo demás.
- Aplicar la ACL en el sentido equivocado (`in` es tráfico que **entra** al router por esa interfaz).
- Bloquear sin querer los protocolos de enrutamiento (OSPF) o los mensajes ICMP que se necesitan.

::: quiz
? ¿Dónde se recomienda colocar una ACL extendida?
+ Cerca del origen del tráfico
- Cerca del destino
= Al especificar el destino con precisión, puede descartar el tráfico en cuanto entra en la red.

? ¿Qué regla permite HTTPS desde cualquier origen al servidor 10.1.1.10?
- permit tcp host 10.1.1.10 eq 443 any
+ permit tcp any host 10.1.1.10 eq 443
- permit udp any host 10.1.1.10 eq 443
= El puerto de destino va después de la dirección de destino. HTTPS usa TCP 443.

? Una ACL extendida tiene `10 deny ip any any` y `20 permit tcp any any eq 80`. ¿Pasa el tráfico web?
- Sí, porque la regla 20 lo permite
+ No, porque la regla 10 coincide primero
= Las reglas se evalúan en orden y gana la primera coincidencia.

? ¿Qué rango numérico corresponde a las ACL extendidas?
- 1–99
+ 100–199
- 200–299
= 1–99 y 1300–1999 son estándar; 100–199 y 2000–2699 son extendidas.

? ¿Cómo eliminas solo la regla con número de secuencia 30 de una ACL con nombre?
+ Entrando en la ACL y ejecutando no 30
- Borrando y creando de nuevo toda la ACL
- No se puede
= Los números de secuencia permiten editar reglas individuales.
:::

=== m5-averias | Práctica: averías de acceso seguro (SSH y ACL) | 20 | 2
Dos de las quejas más comunes en un equipo de redes son "no puedo entrar por SSH al switch" y "desde que pusisteis la ACL no funciona nada". Las dos tienen causas muy repetidas.

## SSH no funciona: la lista de comprobación

| Requisito | Cómo comprobarlo |
|---|---|
| Hostname distinto del de fábrica y dominio | `show running-config` (`hostname`, `ip domain-name`) |
| Claves RSA generadas (≥ 768 bits para SSHv2, mejor 2048) | `show ip ssh` dice `SSH Enabled - version 2.0` |
| Un usuario local | `username admin privilege 15 secret ...` |
| Las vty piden usuario y aceptan SSH | `line vty 0 15` → `login local` y `transport input ssh` |
| La IP de gestión responde | `ping` a la SVI y `ip default-gateway` |

::: cuidado
`login` (sin `local`) usa la contraseña de la línea, compartida por todos y sin registro de quién entró. En una empresa se usa `login local` o un servidor AAA.
:::

## Una ACL lo ha roto todo: las causas clásicas

1. **Falta el permit final.** Toda ACL acaba con un `deny any` **implícito** que no se ve. Una ACL con solo un `deny` lo bloquea **todo**.
2. **Está en la interfaz o el sentido equivocados.** `in` filtra lo que **entra** por la interfaz; `out`, lo que **sale**.
3. **El orden de las reglas.** Se leen de arriba abajo y gana la **primera** que coincide.
4. **Ubicación:** las **estándar** (solo miran el origen) cerca del **destino**; las **extendidas**, cerca del **origen**.

```ios
R1# show access-lists
Standard IP access list 10
    10 deny   192.168.20.0, wildcard bits 0.0.0.255 (34 matches)
R1# show running-config | include access-group
 ip access-group 10 in
```

Los contadores (*matches*) te dicen qué regla está actuando de verdad.

[[cli:averia-ssh]]

[[cli:averia-acl]]

::: quiz
? show ip ssh responde "%SSH has not been enabled". ¿Qué falta?
+ Generar las claves RSA
- El comando login local
- Una ACL en las vty
= SSH se activa al generar las claves RSA (crypto key generate rsa).

? Una ACL tiene solo la línea "deny 192.168.20.0 0.0.0.255". ¿Qué tráfico deja pasar?
- Todo menos la red 192.168.20.0/24
+ Ninguno
- Solo la red 192.168.20.0/24
= El deny any implícito del final bloquea todo lo que no tiene un permit.

? ¿Dónde se coloca normalmente una ACL estándar?
+ Lo más cerca posible del destino
- Lo más cerca posible del origen
- Siempre en la interfaz hacia Internet
= Como solo filtra por origen, ponerla cerca del origen bloquearía también otros destinos.

? ¿Qué comando de línea vty permite solo conexiones SSH?
- login local
+ transport input ssh
- ip ssh version 2
= transport input define qué protocolos aceptan las líneas virtuales.
:::

=== m5-capa2 | Seguridad de capa 2 | 18 | 3
Los ataques dentro de la LAN son frecuentes y los switches tienen funciones para frenarlos.

## Port security

Limita **qué MAC** y **cuántas** pueden usar un puerto de acceso.

```ios
SW1(config)# interface g0/5
SW1(config-if)# switchport mode access
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 2
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# switchport port-security violation restrict
SW1# show port-security interface g0/5
```

| Modo de violación | Descarta tráfico | Envía log/SNMP y cuenta violaciones | Desactiva el puerto |
|---|---|---|---|
| **shutdown** (por defecto) | Sí | Sí | **Sí (err-disabled)** |
| restrict | Sí | Sí | No |
| protect | Sí | No | No |

**Sticky** aprende las MAC conectadas y las guarda en la running-config. Para recuperar un puerto en err-disabled: `shutdown` y `no shutdown` (o `errdisable recovery cause psecure-violation`).

## DHCP snooping

Impide los **servidores DHCP falsos** (*rogue*): solo los puertos **trusted** (hacia el servidor DHCP legítimo o los uplinks) pueden enviar respuestas DHCP (Offer, Ack). Además construye la **tabla de asociaciones** (IP–MAC–puerto–VLAN) que usan otras funciones.

```ios
SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10,20
SW1(config)# interface g0/24
SW1(config-if)# ip dhcp snooping trust
SW1(config)# interface range g0/1 - 23
SW1(config-if-range)# ip dhcp snooping limit rate 10
```

## Dynamic ARP Inspection (DAI)

Frena el **ARP spoofing** (envenenamiento ARP): comprueba cada mensaje ARP de los puertos no confiables contra la tabla de DHCP snooping y descarta los que no coinciden.

```ios
SW1(config)# ip arp inspection vlan 10,20
SW1(config)# interface g0/24
SW1(config-if)# ip arp inspection trust
```

## Otras buenas prácticas

- Apagar los puertos sin usar (`shutdown`) y moverlos a una VLAN sin uso.
- No usar la VLAN 1 ni dejarla como nativa; desactivar DTP (`switchport nonegotiate`).
- PortFast + BPDU Guard en los puertos de acceso.

[[cli:portsecurity]]

::: quiz
? ¿Cuál es el modo de violación de port security por defecto?
+ shutdown
- restrict
- protect
= shutdown pone el puerto en err-disabled al producirse la violación.

? ¿Qué modo de violación descarta el tráfico no autorizado sin registrar nada?
- shutdown
- restrict
+ protect
= protect descarta en silencio; restrict además registra y cuenta las violaciones.

? ¿Qué función impide que un equipo de la LAN actúe como servidor DHCP falso?
+ DHCP snooping
- DAI
- Port security
= Solo los puertos trusted pueden enviar mensajes de servidor DHCP.

? ¿En qué tabla se apoya DAI para validar los mensajes ARP?
- La tabla MAC
+ La tabla de asociaciones de DHCP snooping
- La tabla de enrutamiento
= DAI compara las parejas IP–MAC de los ARP con las asignadas por DHCP.

? ¿Qué hace la opción sticky de port security?
+ Aprende las MAC conectadas y las añade a la running-config
- Bloquea el puerto para siempre
- Permite MAC ilimitadas
= Las MAC sticky se comportan como estáticas una vez guardada la configuración.
:::

=== m5-vpn | VPN: túneles cifrados | 14 | 3
Una **VPN** (red privada virtual) crea un túnel seguro a través de una red no fiable, normalmente internet.

## Tipos

- **Site-to-site (sede a sede):** une dos redes de forma permanente. Los equipos de usuario no saben que existe: los routers o firewalls de cada extremo cifran y descifran. Se usa **IPsec**.
- **Acceso remoto:** un usuario se conecta desde su portátil a la red de la empresa con un **cliente VPN** (Cisco Secure Client / AnyConnect). Se usa **TLS/SSL** o IPsec.

## IPsec

IPsec es un conjunto de protocolos que da:

- **Confidencialidad:** cifrado (AES).
- **Integridad:** hash (SHA).
- **Autenticación:** claves precompartidas o certificados.
- **Anti-replay:** detecta paquetes repetidos.

Protocolos: **ESP** (cifra y autentica; es el que se usa) y **AH** (solo autentica, no cifra). La negociación de claves se hace con **IKE** (UDP 500, y UDP 4500 cuando hay NAT).

**GRE** crea túneles que pueden transportar multicast (y por tanto protocolos de enrutamiento), pero **no cifra**: por eso se combina como **GRE sobre IPsec**. **DMVPN** automatiza túneles entre muchas sedes.

::: quiz
? ¿Qué tipo de VPN une dos sedes de forma permanente sin que los usuarios hagan nada?
+ Site-to-site
- Acceso remoto
= Los routers o firewalls de cada sede mantienen el túnel.

? ¿Qué protocolo de IPsec proporciona cifrado?
- AH
+ ESP
- GRE
= ESP cifra y autentica; AH solo autentica.

? ¿Cuál es la principal limitación de un túnel GRE?
+ No cifra los datos
- No admite multicast
- Solo funciona en IPv6
= GRE encapsula pero no cifra, por eso se combina con IPsec.

? ¿Qué se usa habitualmente para la VPN de acceso remoto de un empleado?
+ Un cliente VPN con TLS/SSL o IPsec
- Un túnel GRE sin cifrar
- NAT estática
= Por ejemplo Cisco Secure Client (antes AnyConnect).
:::

=== m5-wifi | Seguridad inalámbrica | 14 | 2
Como la wifi se propaga por el aire, cualquiera cerca puede capturar el tráfico. Hay que autenticar a los usuarios y cifrar los datos.

## Evolución

| Protocolo | Cifrado | Estado |
|---|---|---|
| WEP | RC4 | **Roto**; no usar nunca |
| WPA | TKIP (RC4) | Obsoleto |
| WPA2 | **AES-CCMP** | Estándar durante años; aún muy extendido |
| WPA3 | **AES-GCMP** (Enterprise 192 bits), **SAE** en lugar de PSK | El recomendado |

## Personal frente a Enterprise

- **Personal (PSK):** una contraseña compartida por todos. Para hogares y oficinas pequeñas. En WPA3 se sustituye por **SAE** (*Simultaneous Authentication of Equals*), que resiste los ataques de diccionario sin conexión.
- **Enterprise (802.1X):** cada usuario se autentica con sus credenciales contra un servidor **RADIUS** mediante **EAP** (EAP-TLS con certificados, PEAP...). Si un empleado se va, se desactiva su cuenta sin cambiar la clave de todos.

WPA3 también incorpora **PMF** (*Protected Management Frames*), que protege contra los ataques de desautenticación, y **forward secrecy**.

::: quiz
? ¿Qué cifrado usa WPA2?
- RC4
- TKIP
+ AES-CCMP
= WPA2 introdujo AES con CCMP como cifrado obligatorio.

? ¿Qué sustituye a PSK en WPA3-Personal?
+ SAE
- WEP
- 802.1X
= SAE (Simultaneous Authentication of Equals) protege contra ataques de diccionario sin conexión.

? Una empresa quiere que cada empleado use sus propias credenciales para la wifi. ¿Qué modo necesita?
- Personal con PSK
+ Enterprise con 802.1X y RADIUS
= El modo Enterprise autentica a cada usuario individualmente contra RADIUS.

? ¿Qué protocolo de seguridad inalámbrica no debe usarse nunca por estar roto?
+ WEP
- WPA3
- WPA2-Enterprise
= WEP puede romperse en minutos.
:::
