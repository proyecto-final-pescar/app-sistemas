-- =====================================================================
-- 01_schema_mypet_local.sql
-- Ejecutar en una base VACÍA y luego correr 02_catalogos_mypet_local.sql
-- =====================================================================

-- ========== CATÁLOGOS ==========
CREATE TABLE asistente_virtual (
  asistente_virtual_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT asistente_virtual_pkey PRIMARY KEY (asistente_virtual_id)
);
CREATE TABLE categoria_servicio (
  categoria_servicio_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT categoria_servicio_pkey PRIMARY KEY (categoria_servicio_id)
);
CREATE TABLE dia_semana (
  dia_semana_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT dia_semana_pkey PRIMARY KEY (dia_semana_id)
);
CREATE TABLE especialidad (
  especialidad_id char(3) NOT NULL,
  nombre varchar(50) NOT NULL UNIQUE,
  CONSTRAINT especialidad_pkey PRIMARY KEY (especialidad_id)
);
CREATE TABLE especie (
  especie_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT especie_pkey PRIMARY KEY (especie_id)
);
CREATE TABLE estado_pago (
  estado_pago_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT estado_pago_pkey PRIMARY KEY (estado_pago_id)
);
CREATE TABLE estado_publicacion (
  estado_publicacion_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT estado_publicacion_pkey PRIMARY KEY (estado_publicacion_id)
);
CREATE TABLE estado_reporte (
  estado_reporte_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT estado_reporte_pkey PRIMARY KEY (estado_reporte_id)
);
CREATE TABLE estado_turno (
  estado_turno_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT estado_turno_pkey PRIMARY KEY (estado_turno_id)
);
CREATE TABLE estado_veterinaria (
  estado_veterinaria_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT estado_veterinaria_pkey PRIMARY KEY (estado_veterinaria_id)
);
CREATE TABLE metodo_pago (
  metodo_pago_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT metodo_pago_pkey PRIMARY KEY (metodo_pago_id)
);
CREATE TABLE motivo_reporte (
  motivo_reporte_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT motivo_reporte_pkey PRIMARY KEY (motivo_reporte_id)
);
CREATE TABLE rol (
  rol_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT rol_pkey PRIMARY KEY (rol_id)
);
CREATE TABLE sexo_mascota (
  sexo_mascota_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT sexo_mascota_pkey PRIMARY KEY (sexo_mascota_id)
);
CREATE TABLE tipo_contacto (
  tipo_contacto_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT tipo_contacto_pkey PRIMARY KEY (tipo_contacto_id)
);
CREATE TABLE tipo_notificacion (
  tipo_notificacion_id char(3) NOT NULL,
  nombre varchar(30) NOT NULL UNIQUE,
  CONSTRAINT tipo_notificacion_pkey PRIMARY KEY (tipo_notificacion_id)
);
CREATE TABLE zona (
  zona_id smallint NOT NULL,
  nombre varchar(50) NOT NULL UNIQUE,
  CONSTRAINT zona_pkey PRIMARY KEY (zona_id)
);
CREATE TABLE raza (
  raza_id smallint NOT NULL,
  especie_id char(3) NOT NULL,
  nombre varchar(100) NOT NULL,
  CONSTRAINT raza_pkey PRIMARY KEY (raza_id),
  CONSTRAINT raza_especie_id_nombre_key UNIQUE (especie_id, nombre),
  CONSTRAINT raza_especie_id_fkey FOREIGN KEY (especie_id) REFERENCES especie(especie_id)
);

-- ========== USUARIOS ==========
CREATE TABLE usuario (
  usuario_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre varchar(100) NOT NULL,
  apellido varchar(100) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  telefono varchar(20),
  zona_id smallint,
  foto_url text,
  rol_id char(3) NOT NULL DEFAULT 'DUE',
  asistente_virtual_id char(3) DEFAULT 'PER',
  active boolean NOT NULL DEFAULT true,
  verificado boolean NOT NULL DEFAULT false,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT usuario_pkey PRIMARY KEY (usuario_id),
  CONSTRAINT usuario_asistente_virtual_id_fkey FOREIGN KEY (asistente_virtual_id) REFERENCES asistente_virtual(asistente_virtual_id),
  CONSTRAINT usuario_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES rol(rol_id),
  CONSTRAINT usuario_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES zona(zona_id)
);
CREATE TABLE usuario_google_auth (
  usuario_id uuid NOT NULL,
  google_id varchar(50) NOT NULL UNIQUE,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT usuario_google_auth_pkey PRIMARY KEY (usuario_id),
  CONSTRAINT usuario_google_auth_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
);
CREATE TABLE usuario_password (
  usuario_id uuid NOT NULL,
  password_hash varchar(100) NOT NULL,
  token_verificacion varchar(255),
  token_verificacion_expires timestamptz(6),
  reset_password_token varchar(255),
  reset_password_expires timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT usuario_password_pkey PRIMARY KEY (usuario_id),
  CONSTRAINT usuario_password_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
);

-- ========== VETERINARIA ==========
CREATE TABLE veterinaria (
  veterinaria_id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE,
  nombre varchar(150) NOT NULL,
  direccion varchar(255) NOT NULL,
  razon_social varchar(150),
  cuit varchar(13) NOT NULL UNIQUE,
  telefono varchar(20) NOT NULL,
  email varchar(255) NOT NULL,
  sitio_web text,
  latitud numeric(9,6) NOT NULL,
  longitud numeric(9,6) NOT NULL,
  urgencias boolean NOT NULL DEFAULT false,
  estado_veterinaria_id char(3) NOT NULL DEFAULT 'PEN',
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT veterinaria_pkey PRIMARY KEY (veterinaria_id),
  CONSTRAINT veterinaria_estado_veterinaria_id_fkey FOREIGN KEY (estado_veterinaria_id) REFERENCES estado_veterinaria(estado_veterinaria_id),
  CONSTRAINT veterinaria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
);
CREATE INDEX ix_veterinaria_usuario ON veterinaria (usuario_id);

CREATE TABLE veterinaria_mercadopago (
  veterinaria_id uuid NOT NULL,
  mp_user_id varchar(50) NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  public_key varchar(255) NOT NULL,
  token_expira_en timestamptz(6) NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT veterinaria_mercadopago_pkey PRIMARY KEY (veterinaria_id),
  CONSTRAINT veterinaria_mercadopago_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);
CREATE TABLE horario_veterinaria (
  horario_veterinaria_id uuid NOT NULL DEFAULT gen_random_uuid(),
  veterinaria_id uuid NOT NULL,
  dia_semana_id char(3) NOT NULL,
  hora_desde time(6) NOT NULL,
  hora_hasta time(6) NOT NULL,
  CONSTRAINT horario_veterinaria_pkey PRIMARY KEY (horario_veterinaria_id),
  CONSTRAINT horario_veterinaria_veterinaria_id_dia_semana_id_key UNIQUE (veterinaria_id, dia_semana_id),
  CONSTRAINT horario_veterinaria_dia_semana_id_fkey FOREIGN KEY (dia_semana_id) REFERENCES dia_semana(dia_semana_id),
  CONSTRAINT horario_veterinaria_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);
CREATE TABLE profesional (
  profesional_id uuid NOT NULL DEFAULT gen_random_uuid(),
  veterinaria_id uuid NOT NULL,
  nombre varchar(100) NOT NULL,
  apellido varchar(100) NOT NULL,
  especialidad_id char(3) NOT NULL,
  email varchar(255),
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT profesional_pkey PRIMARY KEY (profesional_id),
  CONSTRAINT profesional_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES especialidad(especialidad_id),
  CONSTRAINT profesional_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);
CREATE INDEX ix_profesional_veterinaria ON profesional (veterinaria_id);

CREATE TABLE servicio (
  servicio_id uuid NOT NULL DEFAULT gen_random_uuid(),
  veterinaria_id uuid NOT NULL,
  categoria_servicio_id char(3) NOT NULL,
  nombre varchar(150) NOT NULL,
  precio numeric(12,2) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT servicio_pkey PRIMARY KEY (servicio_id),
  CONSTRAINT servicio_categoria_servicio_id_fkey FOREIGN KEY (categoria_servicio_id) REFERENCES categoria_servicio(categoria_servicio_id),
  CONSTRAINT servicio_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);
CREATE INDEX ix_servicio_veterinaria_categoria ON servicio (veterinaria_id, categoria_servicio_id);

CREATE TABLE profesional_servicio (
  profesional_id uuid NOT NULL,
  servicio_id uuid NOT NULL,
  CONSTRAINT profesional_servicio_pkey PRIMARY KEY (profesional_id, servicio_id),
  CONSTRAINT profesional_servicio_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesional(profesional_id),
  CONSTRAINT profesional_servicio_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES servicio(servicio_id)
);
CREATE TABLE resena (
  resena_id uuid NOT NULL DEFAULT gen_random_uuid(),
  veterinaria_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  valor smallint NOT NULL CHECK (valor >= 1 AND valor <= 5),
  CONSTRAINT resena_pkey PRIMARY KEY (resena_id),
  CONSTRAINT resena_veterinaria_id_usuario_id_key UNIQUE (veterinaria_id, usuario_id),
  CONSTRAINT resena_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id),
  CONSTRAINT resena_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);

-- ========== MASCOTAS Y TURNOS ==========
CREATE TABLE mascota (
  mascota_id uuid NOT NULL DEFAULT gen_random_uuid(),
  dueno_id uuid NOT NULL,
  nombre varchar(100) NOT NULL,
  raza_id smallint NOT NULL,
  sexo_mascota_id char(3) NOT NULL,
  fecha_nacimiento date NOT NULL,
  foto text NOT NULL,
  es_castrado boolean NOT NULL DEFAULT false,
  peso numeric(5,2) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT mascota_pkey PRIMARY KEY (mascota_id),
  CONSTRAINT mascota_dueno_id_fkey FOREIGN KEY (dueno_id) REFERENCES usuario(usuario_id),
  CONSTRAINT mascota_raza_id_fkey FOREIGN KEY (raza_id) REFERENCES raza(raza_id),
  CONSTRAINT mascota_sexo_mascota_id_fkey FOREIGN KEY (sexo_mascota_id) REFERENCES sexo_mascota(sexo_mascota_id)
);
CREATE INDEX ix_mascota_dueno ON mascota (dueno_id);
CREATE INDEX ix_mascota_raza ON mascota (raza_id);

CREATE TABLE turno (
  turno_id uuid NOT NULL DEFAULT gen_random_uuid(),
  veterinaria_id uuid NOT NULL,
  profesional_id uuid,
  servicio_id uuid NOT NULL,
  mascota_id uuid,
  fecha date NOT NULL,
  hora_inicio time(6) NOT NULL,
  hora_fin time(6) NOT NULL,
  motivo varchar(255),
  monto_servicio numeric(12,2) NOT NULL,
  estado_turno_id char(3) NOT NULL DEFAULT 'DIS',
  vence_en timestamptz(6),
  recordatorio_enviado boolean NOT NULL DEFAULT false,
  notas text,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT turno_pkey PRIMARY KEY (turno_id),
  CONSTRAINT turno_estado_turno_id_fkey FOREIGN KEY (estado_turno_id) REFERENCES estado_turno(estado_turno_id),
  CONSTRAINT turno_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascota(mascota_id),
  CONSTRAINT turno_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesional(profesional_id),
  CONSTRAINT turno_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES servicio(servicio_id),
  CONSTRAINT turno_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);
CREATE INDEX ix_turno_mascota ON turno (mascota_id);
CREATE INDEX ix_turno_recordatorio ON turno (estado_turno_id, fecha, recordatorio_enviado);
CREATE INDEX ix_turno_vencimiento ON turno (estado_turno_id, vence_en);
CREATE INDEX ix_turno_veterinaria_fecha ON turno (veterinaria_id, fecha, hora_inicio);
CREATE UNIQUE INDEX ix_turno_slot ON turno (veterinaria_id, profesional_id, fecha, hora_inicio)
  WHERE (profesional_id IS NOT NULL) AND (estado_turno_id <> 'CAN'::bpchar);
CREATE UNIQUE INDEX ix_turno_slot_unico ON turno (veterinaria_id, profesional_id, fecha, hora_inicio)
  WHERE (estado_turno_id <> 'CAN'::bpchar);

CREATE TABLE pago (
  pago_id uuid NOT NULL DEFAULT gen_random_uuid(),
  turno_id uuid NOT NULL,
  monto numeric(12,2) NOT NULL CHECK (monto >= 0),
  id_pago varchar(100) UNIQUE,
  metodo_pago_id char(3),
  estado_pago_id char(3) NOT NULL DEFAULT 'PEN',
  motivo_rechazo varchar(255),
  fecha_aprobacion timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reembolso_de_id uuid,
  CONSTRAINT pago_pkey PRIMARY KEY (pago_id),
  CONSTRAINT pago_estado_pago_id_fkey FOREIGN KEY (estado_pago_id) REFERENCES estado_pago(estado_pago_id),
  CONSTRAINT pago_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES metodo_pago(metodo_pago_id),
  CONSTRAINT pago_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES turno(turno_id)
);
CREATE INDEX ix_pago_estado ON pago (estado_pago_id);
CREATE INDEX ix_pago_turno ON pago (turno_id);

-- ========== HISTORIA CLÍNICA ==========
CREATE TABLE consulta (
  consulta_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mascota_id uuid NOT NULL,
  profesional_id uuid NOT NULL,
  veterinaria_id uuid NOT NULL,
  turno_id uuid NOT NULL UNIQUE,
  fecha date NOT NULL,
  hora time(6) NOT NULL,
  categoria_servicio_id char(3) NOT NULL,
  motivo_consulta text NOT NULL,
  anotaciones text NOT NULL,
  monto numeric(12,2) DEFAULT 0,
  url_pdf text,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT consulta_pkey PRIMARY KEY (consulta_id),
  CONSTRAINT consulta_categoria_servicio_id_fkey FOREIGN KEY (categoria_servicio_id) REFERENCES categoria_servicio(categoria_servicio_id),
  CONSTRAINT consulta_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascota(mascota_id),
  CONSTRAINT consulta_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesional(profesional_id),
  CONSTRAINT consulta_turno_id_fkey FOREIGN KEY (turno_id) REFERENCES turno(turno_id),
  CONSTRAINT consulta_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);
CREATE INDEX ix_consulta_mascota ON consulta (mascota_id);

CREATE TABLE estudio (
  estudio_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mascota_id uuid NOT NULL,
  profesional_id uuid NOT NULL,
  veterinaria_id uuid NOT NULL,
  nombre varchar(150) NOT NULL,
  fecha date NOT NULL,
  url_archivo text,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT estudio_pkey PRIMARY KEY (estudio_id),
  CONSTRAINT estudio_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascota(mascota_id),
  CONSTRAINT estudio_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesional(profesional_id),
  CONSTRAINT estudio_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);
CREATE TABLE ficha_medica (
  ficha_medica_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mascota_id uuid NOT NULL UNIQUE,
  color_pelaje varchar(100),
  microchip varchar(15),
  enfermedades_cronicas text DEFAULT 'Ninguna',
  cirugias_previas text DEFAULT 'Ninguna',
  medicamentos_habituales text DEFAULT 'Ninguno',
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ficha_medica_pkey PRIMARY KEY (ficha_medica_id),
  CONSTRAINT ficha_medica_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascota(mascota_id)
);
CREATE TABLE vacuna (
  vacuna_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mascota_id uuid NOT NULL,
  profesional_id uuid NOT NULL,
  veterinaria_id uuid NOT NULL,
  nombre varchar(150) NOT NULL,
  fecha_aplicada date NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vacuna_pkey PRIMARY KEY (vacuna_id),
  CONSTRAINT vacuna_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascota(mascota_id),
  CONSTRAINT vacuna_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES profesional(profesional_id),
  CONSTRAINT vacuna_veterinaria_id_fkey FOREIGN KEY (veterinaria_id) REFERENCES veterinaria(veterinaria_id)
);

-- ========== PUBLICACIONES, REPORTES, NOTIFICACIONES ==========
CREATE TABLE publicacion (
  publicacion_id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  foto text NOT NULL,
  nombre varchar(100),
  zona_id smallint NOT NULL,
  descripcion text NOT NULL,
  fecha date NOT NULL,
  tipo_contacto_id char(3) NOT NULL,
  contacto varchar(150) NOT NULL,
  estado_publicacion_id char(3) NOT NULL DEFAULT 'ACT',
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT publicacion_pkey PRIMARY KEY (publicacion_id),
  CONSTRAINT publicacion_estado_publicacion_id_fkey FOREIGN KEY (estado_publicacion_id) REFERENCES estado_publicacion(estado_publicacion_id),
  CONSTRAINT publicacion_tipo_contacto_id_fkey FOREIGN KEY (tipo_contacto_id) REFERENCES tipo_contacto(tipo_contacto_id),
  CONSTRAINT publicacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id),
  CONSTRAINT publicacion_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES zona(zona_id)
);
CREATE INDEX ix_publicacion_usuario ON publicacion (usuario_id);

CREATE TABLE reporte (
  reporte_id uuid NOT NULL DEFAULT gen_random_uuid(),
  publicacion_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  motivo_reporte_id char(3) NOT NULL,
  descripcion varchar(300),
  estado_reporte_id char(3) NOT NULL DEFAULT 'PEN',
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reporte_pkey PRIMARY KEY (reporte_id),
  CONSTRAINT reporte_publicacion_id_usuario_id_key UNIQUE (publicacion_id, usuario_id),
  CONSTRAINT reporte_estado_reporte_id_fkey FOREIGN KEY (estado_reporte_id) REFERENCES estado_reporte(estado_reporte_id),
  CONSTRAINT reporte_motivo_reporte_id_fkey FOREIGN KEY (motivo_reporte_id) REFERENCES motivo_reporte(motivo_reporte_id),
  CONSTRAINT reporte_publicacion_id_fkey FOREIGN KEY (publicacion_id) REFERENCES publicacion(publicacion_id),
  CONSTRAINT reporte_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
);
CREATE INDEX ix_reporte_estado_publicacion ON reporte (estado_reporte_id, publicacion_id);
ALTER TABLE reporte
  ADD CONSTRAINT chk_reporte_descripcion
  CHECK (motivo_reporte_id <> 'OTR' OR descripcion IS NOT NULL);

CREATE TABLE notificacion (
  notificacion_id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  tipo_notificacion_id char(3) NOT NULL,
  mensaje text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notificacion_pkey PRIMARY KEY (notificacion_id),
  CONSTRAINT notificacion_tipo_notificacion_id_fkey FOREIGN KEY (tipo_notificacion_id) REFERENCES tipo_notificacion(tipo_notificacion_id),
  CONSTRAINT notificacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
);
CREATE INDEX ix_notificacion_usuario_leida ON notificacion (usuario_id, leida);

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
