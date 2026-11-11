// Base de datos del laboratorio SQL: el inventario de red de una empresa ficticia (SQLite).
export const ESQUEMA = `
CREATE TABLE sitios (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  ciudad TEXT NOT NULL
);
CREATE TABLE dispositivos (
  id INTEGER PRIMARY KEY,
  hostname TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('router','switch','ap','firewall')),
  modelo TEXT NOT NULL,
  ip_gestion TEXT UNIQUE,
  sitio_id INTEGER NOT NULL REFERENCES sitios(id),
  version_so TEXT,
  alta TEXT
);
CREATE TABLE vlans (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL
);
CREATE TABLE interfaces (
  id INTEGER PRIMARY KEY,
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id),
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('up','down','admin-down')),
  vlan INTEGER REFERENCES vlans(id),
  velocidad_mbps INTEGER
);
CREATE TABLE incidencias (
  id INTEGER PRIMARY KEY,
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id),
  fecha TEXT NOT NULL,
  gravedad INTEGER NOT NULL CHECK (gravedad BETWEEN 1 AND 5),
  descripcion TEXT NOT NULL,
  resuelta INTEGER NOT NULL DEFAULT 0
);`;

export const DATOS = `
INSERT INTO sitios VALUES (1,'Sede central','Santo Domingo'),(2,'Sucursal norte','Santiago'),(3,'Sucursal este','La Romana'),(4,'Centro de datos','Santo Domingo');
INSERT INTO dispositivos VALUES
 (1,'R-SDQ-01','router','ISR4331','10.10.99.1',1,'17.9.4','2023-02-10'),
 (2,'SW-SDQ-CORE','switch','C9300-48P','10.10.99.2',1,'17.9.4','2023-02-10'),
 (3,'SW-SDQ-01','switch','C9200L-24P-4G','10.10.99.11',1,'17.6.5','2023-03-01'),
 (4,'SW-SDQ-02','switch','C9200L-24P-4G','10.10.99.12',1,'17.6.5','2023-03-01'),
 (5,'AP-SDQ-01','ap','C9120AXI','10.10.99.31',1,'17.9.5','2024-01-15'),
 (6,'FW-SDQ-01','firewall','FPR1120','10.10.99.254',1,'7.2.5','2023-02-10'),
 (7,'R-STI-01','router','ISR1111','10.20.99.1',2,'17.3.8','2022-06-20'),
 (8,'SW-STI-01','switch','C2960X-24PS','10.20.99.11',2,'15.2.7','2021-09-05'),
 (9,'SW-STI-02','switch','C2960X-24PS','10.20.99.12',2,'15.2.7','2021-09-05'),
 (10,'AP-STI-01','ap','C9115AXI','10.20.99.31',2,'17.9.5','2024-03-02'),
 (11,'R-LRM-01','router','ISR1111','10.30.99.1',3,'16.12.4','2020-11-11'),
 (12,'SW-LRM-01','switch','C2960X-24PS','10.30.99.11',3,'15.2.7','2020-11-11'),
 (13,'SW-DC-SPINE1','switch','N9K-C9336C','10.40.99.1',4,'10.3.4','2024-05-20'),
 (14,'SW-DC-LEAF1','switch','N9K-C93180YC','10.40.99.11',4,'10.3.4','2024-05-20'),
 (15,'SW-DC-LEAF2','switch','N9K-C93180YC','10.40.99.12',4,'10.3.4','2024-05-20');
INSERT INTO vlans VALUES (10,'VENTAS'),(20,'SOPORTE'),(30,'INVITADOS'),(50,'VOZ'),(99,'GESTION');
INSERT INTO interfaces (dispositivo_id,nombre,estado,vlan,velocidad_mbps) VALUES
 (1,'Gi0/0/0','up',NULL,1000),(1,'Gi0/0/1','up',NULL,1000),(1,'Gi0/0/2','admin-down',NULL,1000),
 (2,'Gi1/0/1','up',99,10000),(2,'Gi1/0/2','up',99,10000),(2,'Gi1/0/3','up',10,1000),(2,'Gi1/0/48','down',NULL,1000),
 (3,'Gi1/0/1','up',10,1000),(3,'Gi1/0/2','up',10,1000),(3,'Gi1/0/3','down',10,1000),(3,'Gi1/0/4','up',50,1000),(3,'Gi1/0/5','admin-down',NULL,1000),
 (4,'Gi1/0/1','up',20,1000),(4,'Gi1/0/2','down',20,1000),(4,'Gi1/0/3','down',30,1000),(4,'Gi1/0/4','up',30,1000),
 (5,'Gi0','up',99,2500),
 (6,'Eth1/1','up',NULL,1000),(6,'Eth1/2','up',NULL,1000),
 (7,'Gi0/0/0','up',NULL,1000),(7,'Gi0/0/1','down',NULL,1000),
 (8,'Fa0/1','up',10,100),(8,'Fa0/2','down',10,100),(8,'Fa0/3','down',20,100),(8,'Fa0/4','up',50,100),(8,'Gi0/1','up',99,1000),
 (9,'Fa0/1','up',20,100),(9,'Fa0/2','up',20,100),(9,'Fa0/3','down',30,100),
 (10,'Gi0','up',99,1000),
 (11,'Gi0/0/0','up',NULL,1000),(11,'Gi0/0/1','down',NULL,1000),
 (12,'Fa0/1','up',10,100),(12,'Fa0/2','down',10,100),(12,'Fa0/3','down',30,100),(12,'Gi0/1','up',99,1000),
 (13,'Eth1/1','up',NULL,100000),(13,'Eth1/2','up',NULL,100000),
 (14,'Eth1/1','up',NULL,25000),(14,'Eth1/49','up',NULL,100000),
 (15,'Eth1/1','up',NULL,25000),(15,'Eth1/49','down',NULL,100000);
INSERT INTO incidencias (dispositivo_id,fecha,gravedad,descripcion,resuelta) VALUES
 (1,'2026-09-02',2,'Caída del enlace con el proveedor',1),
 (3,'2026-09-15',4,'Puerto Gi1/0/3 con errores CRC',0),
 (4,'2026-10-01',3,'Bucle por cable mal conectado en recepción',1),
 (7,'2026-08-21',1,'Router sin respuesta tras corte eléctrico',1),
 (7,'2026-10-12',2,'Enlace WAN con pérdidas del 8 %',0),
 (8,'2026-07-30',5,'Ventilador ruidoso',0),
 (8,'2026-10-20',2,'Switch reiniciándose cada hora',0),
 (11,'2026-09-28',1,'Sucursal este sin conexión',0),
 (11,'2026-10-05',3,'CPU alta por tormenta de broadcast',1),
 (12,'2026-10-06',4,'Puerto Fa0/2 en err-disabled por port security',0),
 (14,'2026-10-18',2,'Pérdida de un enlace hacia el spine',1),
 (15,'2026-11-02',2,'Enlace Eth1/49 caído',0);`;
