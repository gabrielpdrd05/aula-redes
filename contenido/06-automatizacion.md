---
id: m6
titulo: Automatización y programabilidad
dominio: 6.0 Automation and Programmability
peso: 10
descripcion: Redes controladas por software, SDN, IA en las operaciones de red, APIs REST, JSON y herramientas de automatización como Ansible y Terraform.
---
=== m6-automatizacion | Por qué automatizar la red | 12 | 2
Configurar 200 switches uno a uno por CLI es lento y propenso a errores: basta un comando mal escrito en un equipo para causar una caída. La **automatización** aplica cambios a muchos equipos de forma rápida, repetible y verificable.

## Ventajas

- **Menos errores humanos:** la misma plantilla se aplica igual en todos los equipos.
- **Rapidez:** un cambio en cientos de equipos en minutos.
- **Consistencia y cumplimiento:** se detecta cualquier equipo que se desvíe de la configuración de referencia (*configuration drift*).
- **Escalabilidad:** el equipo de red crece sin crecer la plantilla de personas en la misma proporción.
- **Visibilidad:** los datos de la red se recogen de forma estructurada para analizarlos.

## Redes tradicionales frente a redes controladas

| Tradicional | Basada en controlador |
|---|---|
| Cada equipo tiene su propio plano de control | El controlador centraliza buena parte del control |
| Configuración equipo a equipo por CLI | Se define la intención y el controlador la aplica |
| Difícil de auditar | Configuración y estado centralizados |
| Automatización con scripts frágiles (CLI scraping) | APIs estándar |

::: quiz
? ¿Cuál es una ventaja principal de automatizar la configuración de la red?
+ Aplicar cambios consistentes y repetibles con menos errores humanos
- Eliminar la necesidad de conocimientos de redes
- No tener que hacer copias de seguridad
= La automatización reduce errores y acelera los cambios, pero sigue exigiendo saber redes.

? ¿Cómo se llama la desviación de un equipo respecto a la configuración de referencia?
+ Configuration drift
- Spanning tree
- Jitter
= Detectar el drift es una de las funciones de las herramientas de gestión de configuración.
:::

=== m6-sdn | SDN y redes basadas en controlador | 18 | 3
## Los tres planos

- **Plano de datos (data plane):** reenvía los paquetes y tramas. Es el trabajo de cada interfaz: buscar en la tabla, encapsular, filtrar con ACL, aplicar NAT.
- **Plano de control (control plane):** decide cómo reenviar. Protocolos de enrutamiento (OSPF), STP, ARP, construir las tablas.
- **Plano de gestión (management plane):** administrar el equipo. SSH, SNMP, syslog, NTP.

En una red tradicional cada equipo tiene los tres. En **SDN** (*Software-Defined Networking*) parte del plano de control se **centraliza en un controlador**.

## APIs del controlador

- **Northbound (hacia arriba):** comunican el controlador con las aplicaciones y los scripts del administrador. Normalmente **REST** sobre HTTPS.
- **Southbound (hacia abajo):** comunican el controlador con los equipos de red. Ejemplos: **OpenFlow**, **NETCONF**, **RESTCONF**, SSH/CLI, SNMP.

## Underlay, overlay y fabric

- **Underlay:** la red física y su enrutamiento (por ejemplo, IP con IS-IS u OSPF entre los switches).
- **Overlay:** las redes lógicas que se construyen **encima** mediante túneles (VXLAN), independientes de la topología física.
- **Fabric:** el conjunto de underlay + overlay gestionado como un todo.

## Soluciones de Cisco

- **Catalyst Center** (antes DNA Center): controlador para redes de campus (**SD-Access**, con fabric VXLAN y LISP). Gestión basada en la **intención** (*intent-based networking*), garantía (*assurance*) con analítica.
- **SD-WAN** (Catalyst SD-WAN, antes Viptela): controla las WAN de muchas sedes.
- **Meraki:** gestión en la nube.

## Gestión tradicional frente a Catalyst Center

| Tradicional | Catalyst Center |
|---|---|
| CLI equipo a equipo | Políticas centralizadas desde una interfaz gráfica o API |
| Diagnóstico manual | Analítica y recomendaciones automáticas (assurance) |
| Cambios lentos | Plantillas y provisión automática (PnP) |

::: quiz
? ¿En qué plano funciona OSPF?
- Datos
+ Control
- Gestión
= OSPF decide las rutas: es plano de control. El reenvío en sí es plano de datos.

? ¿Qué API comunica el controlador SDN con los equipos de red?
- Northbound
+ Southbound
= Southbound (OpenFlow, NETCONF, RESTCONF...) va hacia los equipos; northbound, hacia las aplicaciones.

? ¿Qué es el overlay en una fabric SDN?
- La red física
+ Las redes lógicas construidas con túneles sobre la red física
- El controlador
= El underlay es la red física; el overlay, las redes virtuales sobre ella (VXLAN).

? SSH, SNMP y syslog pertenecen al plano de...
- Datos
- Control
+ Gestión
= Son las herramientas para administrar y monitorizar el equipo.

? ¿Qué API usan normalmente los scripts para hablar con Catalyst Center?
+ Una API REST northbound
- OpenFlow
- STP
= Las aplicaciones y los scripts usan la API REST northbound del controlador.
:::

=== m6-ia | Inteligencia artificial en las operaciones de red | 12 | 2
La versión actual del CCNA incluye el uso de la IA en la gestión de redes (AIOps).

## IA predictiva y generativa

- **IA predictiva / aprendizaje automático (machine learning):** aprende patrones de datos históricos para **detectar anomalías** y **anticipar problemas**: un enlace que se saturará el lunes por la mañana, un AP con interferencias, un comportamiento de tráfico que parece un ataque. Es la base del *assurance* de Catalyst Center y de las funciones de Meraki.
- **IA generativa:** genera contenido nuevo (texto, código) a partir de una petición en lenguaje natural. En redes: asistentes que explican un fallo, redactan configuraciones o scripts, o resumen registros. Ejemplo: **AI Assistant** de Cisco.

## Aprendizaje supervisado y no supervisado

- **Supervisado:** se entrena con datos etiquetados ("esto fue un ataque, esto no").
- **No supervisado:** encuentra agrupaciones o anomalías en datos sin etiquetar.

## Precauciones

La IA generativa puede **equivocarse con seguridad** ("alucinar"): una configuración generada debe **revisarse y probarse** antes de aplicarla. Tampoco hay que pegar en herramientas externas datos sensibles de la red (contraseñas, configuraciones completas) sin autorización.

::: quiz
? Una plataforma avisa de que un enlace se saturará mañana a partir de su historial de tráfico. ¿Qué tipo de IA es?
+ Predictiva (aprendizaje automático)
- Generativa
= Analiza datos históricos para anticipar un comportamiento.

? ¿Qué precaución hay que tomar con una configuración generada por IA?
+ Revisarla y probarla antes de aplicarla en producción
- Aplicarla directamente: la IA no se equivoca
= Los modelos generativos pueden producir comandos incorrectos con total seguridad.

? Entrenar un modelo con eventos etiquetados como "ataque" o "normal" es aprendizaje...
+ Supervisado
- No supervisado
= Los datos etiquetados son la característica del aprendizaje supervisado.
:::

=== m6-rest | APIs REST | 16 | 3
Una **API** (interfaz de programación de aplicaciones) permite que un programa hable con otro. Las **APIs REST** usan **HTTP** y son las más extendidas para automatizar redes.

## Características de REST

- **Cliente-servidor.**
- **Sin estado (stateless):** cada petición lleva toda la información necesaria; el servidor no recuerda las anteriores.
- **Cacheable** e **interfaz uniforme**: cada recurso tiene su **URI**.

## CRUD y verbos HTTP

| Acción (CRUD) | Verbo HTTP | Ejemplo |
|---|---|---|
| Create (crear) | **POST** | Crear una VLAN |
| Read (leer) | **GET** | Consultar las interfaces |
| Update (actualizar) | **PUT** (sustituye completo) / **PATCH** (modifica una parte) | Cambiar la descripción de una interfaz |
| Delete (borrar) | **DELETE** | Eliminar una ruta |

## Códigos de respuesta

| Código | Significado |
|---|---|
| 200 OK | Correcto |
| 201 Created | Recurso creado |
| 204 No Content | Correcto, sin contenido en la respuesta |
| 400 Bad Request | Petición mal formada |
| 401 Unauthorized | Falta autenticación o no es válida |
| 403 Forbidden | Autenticado pero sin permiso |
| 404 Not Found | El recurso no existe |
| 500 Internal Server Error | Error en el servidor |

**2xx** éxito, **4xx** error del cliente, **5xx** error del servidor.

## Autenticación

Básica (usuario y contraseña en Base64, solo sobre HTTPS), **tokens** (se obtiene un token y se envía en cada petición), **claves de API** u **OAuth**.

## Un ejemplo en Python

```python
import requests

BASE = "https://catalyst-center.ejemplo.local/dna"
token = requests.post(f"{BASE}/system/api/v1/auth/token",
                      auth=("admin", "Cl4ve"), timeout=10).json()["Token"]

respuesta = requests.get(f"{BASE}/intent/api/v1/network-device",
                         headers={"X-Auth-Token": token}, timeout=10)
respuesta.raise_for_status()
for equipo in respuesta.json()["response"]:
    print(equipo["hostname"], equipo["managementIpAddress"], equipo["softwareVersion"])
```

::: quiz
? ¿Qué verbo HTTP se usa para leer información?
+ GET
- POST
- PUT
- DELETE
= GET es la operación Read de CRUD.

? ¿Qué verbo HTTP corresponde a Create en CRUD?
- GET
+ POST
- PATCH
= POST crea un recurso nuevo.

? Una petición devuelve 401. ¿Qué significa?
- El recurso no existe
+ Falta autenticación o las credenciales no son válidas
- Error interno del servidor
= 401 Unauthorized. 403 sería autenticado pero sin permiso; 404, no encontrado.

? ¿Qué significa que REST es sin estado?
+ Cada petición incluye toda la información necesaria; el servidor no guarda contexto de las anteriores
- Que no usa HTTP
- Que no devuelve códigos de estado
= Por eso, por ejemplo, el token se envía en cada petición.

? ¿Qué familia de códigos indica un error del servidor?
- 2xx
- 4xx
+ 5xx
= 2xx éxito, 3xx redirección, 4xx error del cliente, 5xx error del servidor.
:::

=== m6-json | JSON y otros formatos de datos | 14 | 2
Las APIs intercambian datos estructurados. El formato más usado es **JSON** (JavaScript Object Notation).

## Reglas de JSON

- Un **objeto** va entre llaves `{ }` y contiene pares **"clave": valor** separados por comas.
- Las **claves** son siempre cadenas entre **comillas dobles**.
- Los valores pueden ser: **cadena** (`"texto"`), **número** (`42`), **booleano** (`true`/`false`), **null**, **objeto** u **array** (lista entre corchetes `[ ]`).
- No se permiten comentarios ni comas finales.

```json
{
  "hostname": "SW-ACCESO-01",
  "modelo": "C9200L-24P-4G",
  "gestionado": true,
  "vlans": [10, 20, 99],
  "interfaces": [
    { "nombre": "GigabitEthernet1/0/1", "estado": "up", "vlan": 10 },
    { "nombre": "GigabitEthernet1/0/2", "estado": "down", "vlan": null }
  ]
}
```

En este ejemplo hay un objeto principal con 5 claves; `vlans` es un array de números e `interfaces` un array de objetos.

## Otros formatos

- **XML:** etiquetas `<hostname>SW1</hostname>`. Lo usa NETCONF.
- **YAML:** basado en la sangría, fácil de leer. Lo usa **Ansible**.

```yaml
hostname: SW-ACCESO-01
vlans:
  - 10
  - 20
```

::: quiz
? ¿Cómo se delimitan las claves en JSON?
+ Con comillas dobles
- Con comillas simples
- Sin comillas
= JSON exige comillas dobles en las claves y las cadenas.

? En JSON, ¿qué representa [ ]?
- Un objeto
+ Un array (lista)
- Un comentario
= Las llaves { } son objetos; los corchetes [ ], arrays.

? ¿Qué formato de datos usa Ansible para sus playbooks?
- JSON
- XML
+ YAML
= Los playbooks de Ansible se escriben en YAML.

? ¿Cuál de estos valores no es válido en JSON?
- true
- null
+ 'texto' (con comillas simples)
- 3.5
= Las cadenas deben ir entre comillas dobles.
:::

=== m6-herramientas | Ansible, Terraform, Puppet y Chef | 16 | 3
Las herramientas de **gestión de configuración** guardan cómo debe estar cada equipo y se encargan de llevarlo a ese estado.

| Herramienta | Agente en el equipo | Lenguaje / formato | Modelo |
|---|---|---|---|
| **Ansible** | **Sin agente** (usa SSH / APIs) | YAML (*playbooks*) | Push (el servidor envía los cambios) |
| **Terraform** | Sin agente (usa las APIs del proveedor) | HCL | Declarativo, muy usado para la nube (*infraestructura como código*) |
| **Puppet** | Con agente (también hay modo sin agente) | DSL propio (*manifests*) | Pull (el agente consulta al servidor) |
| **Chef** | Con agente | Ruby (*recipes*, *cookbooks*) | Pull |

Ansible es el más usado en redes precisamente porque **no necesita instalar nada** en los routers y switches.

## Un playbook de Ansible

```yaml
- name: Configurar VLAN en los switches de acceso
  hosts: switches_acceso
  gather_facts: false
  tasks:
    - name: Crear las VLAN
      cisco.ios.ios_vlans:
        config:
          - vlan_id: 10
            name: VENTAS
          - vlan_id: 20
            name: SOPORTE
        state: merged
```

## Python con Netmiko

Para tareas puntuales, un script de Python con la librería **Netmiko** se conecta por SSH y ejecuta comandos:

```python
from netmiko import ConnectHandler

switches = ["192.168.99.11", "192.168.99.12"]
for ip in switches:
    with ConnectHandler(device_type="cisco_ios", host=ip,
                        username="admin", password="Cl4ve") as conexion:
        conexion.send_config_set(["vlan 30", "name INVITADOS"])
        print(ip, conexion.send_command("show vlan brief | include 30"))
```

::: quiz
? ¿Qué herramienta de automatización no necesita agente y usa playbooks en YAML?
+ Ansible
- Puppet
- Chef
= Ansible se conecta por SSH o APIs sin instalar nada en los equipos.

? ¿Qué herramienta usa recetas (recipes) escritas en Ruby?
- Ansible
- Terraform
+ Chef
= Chef organiza la configuración en recipes y cookbooks en Ruby.

? Terraform se usa sobre todo para...
+ Definir infraestructura como código, especialmente en la nube
- Capturar tráfico
- Configurar STP
= Terraform crea y gestiona recursos a partir de archivos declarativos (HCL).

? ¿Qué modelo usa Puppet por defecto?
- Push
+ Pull, con un agente que consulta al servidor
= El agente de Puppet pide periódicamente su configuración al servidor.
:::
