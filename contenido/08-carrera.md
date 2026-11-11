---
id: m8
titulo: Tu carrera en redes
dominio: Carrera profesional
peso: 0
descripcion: Cómo preparar y aprobar el examen CCNA, cómo practicar como en el trabajo, cómo conseguir tu primer empleo en redes y cómo responder en una entrevista técnica.
---
=== m8-examen | El examen CCNA 200-301: plan para aprobar | 14
## Datos del examen

- **Código:** 200-301 CCNA. Un único examen; no hay requisitos previos.
- **Duración:** 120 minutos. Unas **100–120 preguntas**.
- **Tipos de pregunta:** opción única y múltiple, arrastrar y soltar, simulaciones y laboratorios en los que configuras equipos.
- **Dónde:** en un centro **Pearson VUE** o en línea desde casa (con supervisión por cámara).
- **Precio orientativo:** unos 300 USD (consulta el precio vigente en Cisco).
- **Validez:** **3 años**. Se renueva aprobando otro examen o acumulando créditos de formación continua (**Continuing Education**).
- **Nota de aprobado:** Cisco no la publica oficialmente; como referencia, apunta a dominar el 85 % del contenido.

## Plan de 12 semanas (dedicando 1–2 horas al día)

| Semanas | Contenido | Práctica |
|---|---|---|
| 1–3 | Módulo 1: fundamentos, IPv4, **subnetting**, IPv6 | Entrenador de subnetting a diario |
| 4–5 | Módulo 2: IOS, VLAN, trunks, STP, EtherChannel, wifi | Laboratorios de VLAN y trunk |
| 6–7 | Módulo 3: enrutamiento, estáticas, OSPF, FHRP | Laboratorios de estáticas y OSPF |
| 8 | Módulo 4: NAT, DHCP, DNS, NTP, SNMP, syslog, QoS, SSH | Laboratorio de SSH |
| 9 | Módulo 5: seguridad, ACL, capa 2, VPN, wifi | Laboratorios de ACL y port security |
| 10 | Módulo 6: automatización, SDN, REST, JSON | Escribir y leer JSON |
| 11 | Repaso de los puntos débiles | Simulacros de examen completos |
| 12 | Simulacros con tiempo real | Dos simulacros por encima del 85 % → reserva fecha |

## Consejos para el día del examen

- **Gestiona el tiempo:** unos 60–70 segundos por pregunta. No te atasques: no se puede volver atrás, así que elige la mejor opción y sigue.
- **Lee el enunciado dos veces**; fíjate en "elige DOS" y en las palabras *NOT*, *best*, *most likely*.
- En los laboratorios, **guarda la configuración** si te lo piden y verifica con `show`.
- Duerme bien. El subnetting rápido depende de tener la cabeza despejada.

::: quiz
? ¿Cuánto tiempo es válida la certificación CCNA?
- 1 año
- 2 años
+ 3 años
- Para siempre
= Hay que renovarla cada 3 años con otro examen o con créditos de formación continua.

? ¿Se puede volver a las preguntas anteriores en el examen CCNA?
- Sí
+ No
= Cada respuesta es definitiva; conviene no atascarse.

? ¿Qué empresa gestiona los centros donde se hace el examen?
+ Pearson VUE
- Prometric
- CompTIA
= Los exámenes de Cisco se reservan a través de Pearson VUE.
:::

=== m8-practica | Practicar como en el trabajo | 14
Aprobar el CCNA abre la puerta, pero lo que te hace bueno es resolver problemas reales. Practica con la **metodología de resolución de problemas**:

1. **Define el problema:** ¿qué falla exactamente, a quién, desde cuándo? ¿Qué ha cambiado?
2. **Recoge información:** `show`, `ping`, `traceroute`, registros.
3. **Analiza** y formula una hipótesis (empieza por la capa más probable).
4. **Prueba** la hipótesis con **un cambio cada vez**.
5. **Verifica** que se ha resuelto y que no has roto otra cosa.
6. **Documenta** la causa y la solución.

## Laboratorios recomendados para tu portafolio

Monta estas topologías en Packet Tracer y documéntalas (captura del diagrama + configuración + pruebas):

- **Campus pequeño:** 3 VLAN, router-on-a-stick, DHCP en el router, trunk entre dos switches.
- **Sede con salida a internet:** OSPF entre tres routers, ruta por defecto anunciada con `default-information originate`, PAT.
- **Red segura:** SSH con usuarios locales, ACL para limitar la gestión, port security, DHCP snooping.
- **Redundancia:** HSRP entre dos routers y EtherChannel LACP entre switches.
- **Wifi empresarial:** WLC con dos WLAN (empleados con WPA2-Enterprise e invitados con PSK en otra VLAN).

## Herramientas que piden las empresas

**Wireshark** (análisis de tráfico), **PuTTY / SecureCRT**, plataformas de monitorización (**PRTG, Zabbix, SolarWinds**), sistemas de tickets (**ServiceNow, Jira**) y nociones de **Linux** y **Python**.

::: quiz
? Al resolver un problema, ¿cuántos cambios conviene probar a la vez?
+ Uno
- Todos los que se te ocurran
= Así sabes exactamente qué cambio resolvió (o empeoró) el problema.

? ¿Qué herramienta se usa para capturar y analizar el tráfico de red?
+ Wireshark
- Packet Tracer
- Excel
= Wireshark captura paquetes y los decodifica protocolo a protocolo.

? ¿Cuál es el último paso de la metodología de resolución de problemas?
- Probar la hipótesis
+ Documentar la causa y la solución
- Reiniciar el equipo
= La documentación ahorra tiempo la próxima vez que ocurra.
:::

=== m8-empleo | Tu primer empleo en redes | 14
## Puestos de entrada

| Puesto | Qué hace | Lo que más piden |
|---|---|---|
| Técnico de soporte / Help desk | Atiende incidencias de usuarios, primer nivel | Comunicación, Windows, redes básicas |
| Técnico de NOC | Monitoriza la red 24/7 y escala incidencias | Monitorización, CCNA, turnos |
| Técnico de redes (junior) | Instala y configura switches, AP, cableado | CCNA, Packet Tracer, cableado estructurado |
| Técnico de campo / instalador | Despliegues en sedes de clientes | Carnet de conducir, cableado, fibra |
| Administrador de sistemas junior | Servidores, usuarios, red de la oficina | Windows Server, Linux, redes |

El salto habitual: **soporte o NOC → técnico de redes → administrador o ingeniero de redes** (CCNP) → especialización (seguridad, centros de datos, nube, inalámbrico).

## Tu CV

- **Arriba:** un titular claro: *"Técnico de redes – CCNA (o en preparación)"*.
- **Habilidades técnicas concretas:** VLAN, STP, OSPF, ACL, NAT, DHCP, wifi con WLC, Packet Tracer, Wireshark, Python básico.
- **Proyectos:** los laboratorios de tu portafolio, con un enlace a su documentación.
- **Experiencia:** aunque no sea de redes, destaca la atención al cliente, la resolución de problemas y el trabajo en equipo.
- Una o dos páginas, sin faltas de ortografía.

## LinkedIn y búsqueda

- Pon la certificación (o "en curso") en el titular.
- Comparte lo que aprendes: un resumen de un laboratorio con su diagrama demuestra más que una lista de habilidades.
- Busca en portales de empleo, en la web de integradores y operadores (los partners de Cisco contratan a muchos juniors) y pide prácticas.

::: quiz
? ¿Qué puesto monitoriza la red de forma continua y escala las incidencias?
- Administrador de bases de datos
+ Técnico de NOC
- Programador web
= El NOC (Network Operations Center) vigila la red 24/7.

? ¿Qué aporta más valor a un CV de un técnico sin experiencia?
+ Proyectos de laboratorio documentados que demuestran habilidades concretas
- Una lista larga de adjetivos
- Una foto profesional
= Los proyectos demuestran que sabes hacer el trabajo, no solo que lo has estudiado.
:::

=== m8-entrevista | Preguntas de entrevista técnica | 16
Estas preguntas aparecen en casi todas las entrevistas para puestos junior de redes. Intenta responderlas en voz alta antes de leer la respuesta.

## Preguntas y respuestas modelo

**¿Qué diferencia hay entre un switch y un router?**
El switch conecta equipos de la misma red y reenvía por MAC (capa 2); el router conecta redes distintas y reenvía por IP (capa 3), y separa dominios de broadcast.

**¿Qué pasa cuando escribes una URL en el navegador?**
Resolución DNS del nombre → el equipo comprueba si la IP es local; como no lo es, hace ARP de su gateway → conexión TCP (three-way handshake) al puerto 443 → negociación TLS → petición HTTP GET → el servidor responde → el navegador muestra la página.

**¿Qué es una VLAN y para qué sirve?**
Una red lógica dentro de un switch; cada VLAN es un dominio de broadcast. Separa departamentos por seguridad y rendimiento.

**Un usuario dice que no tiene internet. ¿Qué haces?**
Preguntar qué falla exactamente → revisar su IP (¿169.254?), gateway y DNS con `ipconfig` → ping al gateway → ping a una IP de internet → `nslookup` → si es un problema de más usuarios, revisar el switch y el router.

**¿Qué diferencia hay entre TCP y UDP?**
TCP es fiable y orientado a conexión (handshake, confirmaciones, retransmisiones); UDP es rápido, sin conexión, para tiempo real, DNS o DHCP.

**¿Qué es el subnetting? Divide 192.168.1.0/24 en 4 subredes.**
Dividir una red tomando bits de host. Cuatro subredes → 2 bits → /26: .0, .64, .128 y .192, con 62 hosts cada una.

**¿Qué hace STP?**
Evita bucles de capa 2 bloqueando los enlaces redundantes; elige un switch raíz y desbloquea un enlace si falla otro.

**¿Qué es NAT?**
Traducir direcciones privadas a públicas para salir a internet; PAT permite que muchos equipos compartan una IP pública usando puertos.

## Preguntas de comportamiento

- *Háblame de un problema técnico que resolviste.* Usa el método **STAR**: Situación, Tarea, Acción, Resultado.
- *¿Qué haces si no sabes la respuesta?* Reconocerlo, explicar cómo la buscarías (documentación, compañeros) y no improvisar cambios en producción.

::: practica
Pide al tutor una **entrevista simulada**: "Hazme una entrevista técnica para técnico de redes junior, una pregunta cada vez, y corrígeme cada respuesta".
:::

::: quiz
? En una entrevista te preguntan algo que no sabes. ¿Qué es lo más adecuado?
+ Reconocerlo y explicar cómo lo averiguarías
- Inventar una respuesta convincente
- Cambiar de tema
= La honestidad y el método para resolver dudas son lo que más valoran los entrevistadores.

? ¿Qué método se recomienda para responder preguntas de comportamiento?
+ STAR: Situación, Tarea, Acción, Resultado
- OSI
- DORA
= STAR estructura la respuesta de forma clara y concreta.
:::
