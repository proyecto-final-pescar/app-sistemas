-- =====================================================================
-- 02_catalogos_mypet_local.sql
-- Ejecutar DESPUÉS de 01_schema_mypet_local.sql
-- =====================================================================

INSERT INTO rol (rol_id, nombre) VALUES
  ('DUE', 'dueno'),
  ('VET', 'veterinaria'),
  ('ADM', 'administrador');

INSERT INTO asistente_virtual (asistente_virtual_id, nombre) VALUES
  ('PER', 'perro'),
  ('GAT', 'gato');

INSERT INTO estado_veterinaria (estado_veterinaria_id, nombre) VALUES
  ('PEN', 'pendiente'),
  ('ACT', 'activa'),
  ('SUS', 'suspendida');

INSERT INTO dia_semana (dia_semana_id, nombre) VALUES
  ('LUN', 'lunes'),
  ('MAR', 'martes'),
  ('MIE', 'miercoles'),
  ('JUE', 'jueves'),
  ('VIE', 'viernes'),
  ('SAB', 'sabado'),
  ('DOM', 'domingo');

INSERT INTO sexo_mascota (sexo_mascota_id, nombre) VALUES
  ('MAC', 'Macho'),
  ('HEM', 'Hembra');

INSERT INTO estado_turno (estado_turno_id, nombre) VALUES
  ('DIS', 'disponible'),
  ('PEN', 'pendiente'),
  ('CON', 'confirmado'),
  ('CAN', 'cancelado'),
  ('ATE', 'atendido');

INSERT INTO categoria_servicio (categoria_servicio_id, nombre) VALUES
  ('CNS', 'Consulta'),
  ('CTR', 'Control'),
  ('VAC', 'Vacunación'),
  ('DES', 'Desparasitación'),
  ('CIR', 'Cirugía'),
  ('INT', 'Internación'),
  ('URG', 'Urgencias'),
  ('DIA', 'Diagnóstico por imágenes'),
  ('LAB', 'Laboratorio'),
  ('ODO', 'Odontología'),
  ('DER', 'Dermatología'),
  ('CAR', 'Cardiología'),
  ('NUT', 'Nutrición'),
  ('REH', 'Rehabilitación'),
  ('OTR', 'Otro');

INSERT INTO metodo_pago (metodo_pago_id, nombre) VALUES
  ('EFE', 'efectivo'),
  ('MPG', 'mercadopago');

INSERT INTO estado_pago (estado_pago_id, nombre) VALUES
  ('PEN', 'pendiente'),
  ('APR', 'aprobado'),
  ('REC', 'rechazado'),
  ('REE', 'reembolsado'),
  ('CAN', 'cancelado'),
  ('PRO', 'en_proceso');

INSERT INTO estado_publicacion (estado_publicacion_id, nombre) VALUES
  ('ACT', 'activa'),
  ('CER', 'cerrada');

INSERT INTO motivo_reporte (motivo_reporte_id, nombre) VALUES
  ('INA', 'contenido_inapropiado'),
  ('FAL', 'informacion_falsa'),
  ('SPM', 'spam'),
  ('ENC', 'animal_ya_encontrado'),
  ('DUP', 'publicacion_duplicada'),
  ('OTR', 'otro');

INSERT INTO estado_reporte (estado_reporte_id, nombre) VALUES
  ('PEN', 'pendiente'),
  ('REV', 'revisado'),
  ('DES', 'descartado');

INSERT INTO tipo_notificacion (tipo_notificacion_id, nombre) VALUES
  ('TCO', 'turno_confirmado'),
  ('TPP', 'turno_pendiente_pago'),
  ('TRE', 'turno_recordatorio'),
  ('EST', 'estudio'),
  ('VAC', 'vacuna'),
  ('MSJ', 'mensaje'),
  ('SIS', 'sistema');

INSERT INTO tipo_contacto (tipo_contacto_id, nombre) VALUES
  ('TEL', 'telefono'),
  ('EML', 'email');

INSERT INTO especialidad (especialidad_id, nombre) VALUES
  ('GEN', 'General'),
  ('CLI', 'Clínica general'),
  ('CIR', 'Cirugía'),
  ('DER', 'Dermatología'),
  ('CAR', 'Cardiología'),
  ('OFT', 'Oftalmología'),
  ('TRA', 'Traumatología / Ortopedia'),
  ('ODO', 'Odontología'),
  ('DIA', 'Diagnóstico por imágenes'),
  ('INT', 'Medicina interna'),
  ('NUT', 'Nutrición'),
  ('ETO', 'Etología'),
  ('EXO', 'Exóticos y silvestres');

INSERT INTO especie (especie_id, nombre) VALUES
  ('PER', 'Perro'),
  ('GAT', 'Gato');

INSERT INTO raza (raza_id, especie_id, nombre) VALUES
  (1, 'PER', 'Labrador Retriever'),
  (2, 'PER', 'Golden Retriever'),
  (3, 'PER', 'Caniche / Poodle'),
  (4, 'PER', 'Bulldog Francés'),
  (5, 'PER', 'Pastor Alemán'),
  (6, 'PER', 'Chihuahua'),
  (7, 'PER', 'Mestizo'),
  (8, 'PER', 'Otra'),
  (9, 'GAT', 'Siamés'),
  (10, 'GAT', 'Persa'),
  (11, 'GAT', 'Maine Coon'),
  (12, 'GAT', 'Común / Doméstico'),
  (13, 'GAT', 'Otra');

-- Barrios de CABA
INSERT INTO zona (zona_id, nombre) VALUES
  (1, 'Agronomía'),
  (2, 'Almagro'),
  (3, 'Balvanera'),
  (4, 'Barracas'),
  (5, 'Belgrano'),
  (6, 'Boedo'),
  (7, 'Caballito'),
  (8, 'Chacarita'),
  (9, 'Coghlan'),
  (10, 'Colegiales'),
  (11, 'Constitución'),
  (12, 'Flores'),
  (13, 'Floresta'),
  (14, 'La Boca'),
  (15, 'La Paternal'),
  (16, 'Liniers'),
  (17, 'Mataderos'),
  (18, 'Monte Castro'),
  (19, 'Monserrat'),
  (20, 'Nueva Pompeya'),
  (21, 'Núñez'),
  (22, 'Palermo'),
  (23, 'Parque Avellaneda'),
  (24, 'Parque Chacabuco'),
  (25, 'Parque Chas'),
  (26, 'Parque Patricios'),
  (27, 'Puerto Madero'),
  (28, 'Recoleta'),
  (29, 'Retiro'),
  (30, 'Saavedra'),
  (31, 'San Cristóbal'),
  (32, 'San Nicolás'),
  (33, 'San Telmo'),
  (34, 'Vélez Sarsfield'),
  (35, 'Versalles'),
  (36, 'Villa Crespo'),
  (37, 'Villa del Parque'),
  (38, 'Villa Devoto'),
  (39, 'Villa General Mitre'),
  (40, 'Villa Lugano'),
  (41, 'Villa Luro'),
  (42, 'Villa Ortúzar'),
  (43, 'Villa Pueyrredón'),
  (44, 'Villa Real'),
  (45, 'Villa Riachuelo'),
  (46, 'Villa Santa Rita'),
  (47, 'Villa Soldati'),
  (48, 'Villa Urquiza');
