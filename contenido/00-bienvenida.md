---
id: m0
titulo: Bienvenida
dominio: Introducción
peso: 0
descripcion: Cómo funciona el curso, qué es el CCNA y cómo montar tu laboratorio para practicar desde el primer día.
---
=== m0-curso | Cómo aprovechar este curso | 8 | 1
Bienvenido a **Aula de Redes**. Este curso te lleva desde cero hasta el nivel que pide el examen **Cisco CCNA 200-301**, la certificación de redes más solicitada en las ofertas de empleo de Latinoamérica y España. Además incluye un módulo de **bases de datos** y otro de **carrera profesional** para que llegues preparado a tu primera entrevista.

## Cómo está organizado

El temario sigue los seis dominios oficiales del examen, con el mismo peso que tienen en él:

| Módulo | Dominio del CCNA | Peso en el examen |
|---|---|---|
| 1. Fundamentos de redes | Network Fundamentals | 20 % |
| 2. Acceso a la red | Network Access | 20 % |
| 3. Conectividad IP | IP Connectivity | 25 % |
| 4. Servicios IP | IP Services | 10 % |
| 5. Fundamentos de seguridad | Security Fundamentals | 15 % |
| 6. Automatización y programabilidad | Automation and Programmability | 10 % |

Cada lección tiene tres partes: la **explicación** (con animaciones paso a paso cuando el tema lo merece), un **cuestionario** corto para comprobar que lo entendiste y, cuando aplica, un **laboratorio** donde escribes comandos de verdad.

## La forma correcta de estudiar redes

- **Entiende antes de memorizar.** El examen no pregunta definiciones sueltas: pone escenarios. Si sabes *por qué* un switch inunda una trama, contestarás bien aunque la pregunta esté redactada de otra forma.
- **Practica a diario la parte numérica.** El subnetting se aprende con repetición. Dedica 10 minutos al día al entrenador de subnetting hasta que lo hagas de cabeza.
- **Escribe comandos.** Leer `switchport mode access` no es lo mismo que teclearlo. Usa el simulador de CLI y, cuando puedas, Packet Tracer.
- **Pregunta todo al tutor.** En cada lección tienes un tutor con IA que conoce el tema que estás estudiando. Pídele ejemplos, que te lo explique de otra manera o que te ponga ejercicios.

::: examen
El CCNA 200-301 dura **120 minutos** y tiene entre 100 y 120 preguntas: de opción múltiple, de arrastrar y soltar, de simulación y de laboratorio. No se puede volver a una pregunta ya contestada, así que hay que llegar con soltura, no solo con conocimiento.
:::

## Tu progreso

Al completar una lección, aprobar su cuestionario o terminar un laboratorio, tu progreso se guarda en tu cuenta y lo ves en el panel del curso. Para presentarte al examen con garantías, apunta a terminar todo el temario y a sacar **más del 85 %** en dos simulacros de examen seguidos.

::: quiz
? ¿Cuál es el dominio con más peso en el examen CCNA 200-301?
- Fundamentos de redes
+ Conectividad IP
- Fundamentos de seguridad
- Automatización y programabilidad
= Conectividad IP (enrutamiento, OSPF, rutas estáticas, FHRP) pesa un 25 %, el máximo de los seis dominios.

? ¿Cuál es la mejor forma de dominar el subnetting?
- Memorizar una tabla de máscaras la noche antes del examen
+ Practicar un poco cada día hasta hacerlo de cabeza
- Usar siempre una calculadora en línea
= En el examen no hay calculadora de subredes: hay que resolverlo mentalmente y rápido, y eso solo se consigue con práctica diaria.

? ¿Se puede volver a una pregunta ya respondida durante el examen CCNA?
- Sí, al final hay una pantalla de revisión
+ No, cada respuesta es definitiva
= El examen de Cisco no permite volver atrás, por eso conviene llegar con práctica de tiempo en el simulador de examen.
:::

=== m0-laboratorio | Monta tu laboratorio | 10 | 1
Las redes se aprenden tocando equipos. No hace falta comprar nada: hay herramientas gratuitas que simulan routers y switches Cisco.

## Las herramientas

| Herramienta | Qué es | Para qué usarla |
|---|---|---|
| Simulador de este curso | Consola IOS en el navegador | Laboratorios guiados con corrección automática |
| Cisco Packet Tracer | Simulador gratuito de Cisco (cuenta en Cisco Networking Academy) | Topologías completas, el que más se parece al examen |
| GNS3 / EVE-NG | Emuladores con imágenes reales de IOS | Nivel avanzado, requiere imágenes con licencia |
| Cisco Modeling Labs (CML) | Emulador oficial de pago | Preparación profesional y certificaciones superiores |

## Instalar Packet Tracer

1. Crea una cuenta gratuita en [Cisco Networking Academy](https://www.netacad.com/).
2. Inscríbete en el curso gratuito *Getting Started with Cisco Packet Tracer*; desde ahí se descarga el programa.
3. Instálalo (Windows, macOS o Linux) e inicia sesión con la misma cuenta.

::: practica
Abre Packet Tracer, arrastra dos PC y un switch 2960, conéctalos con cables directos (línea continua negra) y asigna a los PC las direcciones `192.168.1.10/24` y `192.168.1.11/24`. Haz `ping` de uno a otro desde el *Command Prompt*. Acabas de montar tu primera LAN.
:::

## La consola de un equipo Cisco

En la vida real te conectas a un equipo nuevo con un **cable de consola** (RJ-45 a USB o serie) y un programa de terminal (PuTTY, Tera Term o `screen`) a **9600 baudios, 8 bits, sin paridad, 1 bit de parada**. Cuando el equipo ya tiene IP, la gestión se hace por **SSH**.

[[cli:basico]]

::: quiz
? ¿Qué velocidad se usa por defecto para conectarse por consola a un equipo Cisco?
- 115200 baudios
+ 9600 baudios
- 19200 baudios
- 1 Gbps
= La consola de los equipos Cisco usa por defecto 9600 baudios, 8 bits de datos, sin paridad y 1 bit de parada (9600 8N1).

? ¿Qué herramienta gratuita de Cisco permite simular topologías completas de routers y switches?
+ Packet Tracer
- Wireshark
- PuTTY
- Cisco Modeling Labs
= Packet Tracer es gratuito con una cuenta de Networking Academy. Cisco Modeling Labs es de pago y Wireshark es un analizador de tráfico, no un simulador.

? Una vez que el equipo tiene dirección IP, ¿cuál es el método recomendado para administrarlo en remoto?
- Telnet
+ SSH
- La consola
- HTTP
= SSH cifra toda la sesión, incluida la contraseña. Telnet y HTTP viajan en texto plano.
:::
