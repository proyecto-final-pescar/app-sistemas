-- CreateTable
CREATE TABLE "asistente_virtual" (
    "asistente_virtual_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "asistente_virtual_pkey" PRIMARY KEY ("asistente_virtual_id")
);

-- CreateTable
CREATE TABLE "categoria_servicio" (
    "categoria_servicio_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "categoria_servicio_pkey" PRIMARY KEY ("categoria_servicio_id")
);

-- CreateTable
CREATE TABLE "consulta" (
    "consulta_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mascota_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "veterinaria_id" UUID NOT NULL,
    "turno_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" TIME(6) NOT NULL,
    "categoria_servicio_id" CHAR(3) NOT NULL,
    "motivo_consulta" TEXT NOT NULL,
    "anotaciones" TEXT NOT NULL,
    "monto" DECIMAL(12,2) DEFAULT 0,
    "url_pdf" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consulta_pkey" PRIMARY KEY ("consulta_id")
);

-- CreateTable
CREATE TABLE "dia_semana" (
    "dia_semana_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "dia_semana_pkey" PRIMARY KEY ("dia_semana_id")
);

-- CreateTable
CREATE TABLE "especialidad" (
    "especialidad_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("especialidad_id")
);

-- CreateTable
CREATE TABLE "especie" (
    "especie_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "especie_pkey" PRIMARY KEY ("especie_id")
);

-- CreateTable
CREATE TABLE "estado_pago" (
    "estado_pago_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "estado_pago_pkey" PRIMARY KEY ("estado_pago_id")
);

-- CreateTable
CREATE TABLE "estado_publicacion" (
    "estado_publicacion_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "estado_publicacion_pkey" PRIMARY KEY ("estado_publicacion_id")
);

-- CreateTable
CREATE TABLE "estado_reporte" (
    "estado_reporte_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "estado_reporte_pkey" PRIMARY KEY ("estado_reporte_id")
);

-- CreateTable
CREATE TABLE "estado_turno" (
    "estado_turno_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "estado_turno_pkey" PRIMARY KEY ("estado_turno_id")
);

-- CreateTable
CREATE TABLE "estado_veterinaria" (
    "estado_veterinaria_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "estado_veterinaria_pkey" PRIMARY KEY ("estado_veterinaria_id")
);

-- CreateTable
CREATE TABLE "estudio" (
    "estudio_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mascota_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "veterinaria_id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "fecha" DATE NOT NULL,
    "url_archivo" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estudio_pkey" PRIMARY KEY ("estudio_id")
);

-- CreateTable
CREATE TABLE "ficha_medica" (
    "ficha_medica_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mascota_id" UUID NOT NULL,
    "color_pelaje" VARCHAR(100),
    "microchip" VARCHAR(15),
    "enfermedades_cronicas" TEXT DEFAULT 'Ninguna',
    "cirugias_previas" TEXT DEFAULT 'Ninguna',
    "medicamentos_habituales" TEXT DEFAULT 'Ninguno',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ficha_medica_pkey" PRIMARY KEY ("ficha_medica_id")
);

-- CreateTable
CREATE TABLE "horario_veterinaria" (
    "horario_veterinaria_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "veterinaria_id" UUID NOT NULL,
    "dia_semana_id" CHAR(3) NOT NULL,
    "hora_desde" TIME(6) NOT NULL,
    "hora_hasta" TIME(6) NOT NULL,

    CONSTRAINT "horario_veterinaria_pkey" PRIMARY KEY ("horario_veterinaria_id")
);

-- CreateTable
CREATE TABLE "mascota" (
    "mascota_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dueno_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "raza_id" SMALLINT NOT NULL,
    "sexo_mascota_id" CHAR(3) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "foto" TEXT NOT NULL,
    "es_castrado" BOOLEAN NOT NULL DEFAULT false,
    "peso" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mascota_pkey" PRIMARY KEY ("mascota_id")
);

-- CreateTable
CREATE TABLE "metodo_pago" (
    "metodo_pago_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "metodo_pago_pkey" PRIMARY KEY ("metodo_pago_id")
);

-- CreateTable
CREATE TABLE "motivo_reporte" (
    "motivo_reporte_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "motivo_reporte_pkey" PRIMARY KEY ("motivo_reporte_id")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "notificacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "tipo_notificacion_id" CHAR(3) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("notificacion_id")
);

-- CreateTable
CREATE TABLE "pago" (
    "pago_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "turno_id" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "id_pago" VARCHAR(100),
    "metodo_pago_id" CHAR(3),
    "estado_pago_id" CHAR(3) NOT NULL DEFAULT 'PEN',
    "motivo_rechazo" VARCHAR(255),
    "fecha_aprobacion" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("pago_id")
);

-- CreateTable
CREATE TABLE "profesional" (
    "profesional_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "veterinaria_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "especialidad_id" CHAR(3) NOT NULL,
    "email" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profesional_pkey" PRIMARY KEY ("profesional_id")
);

-- CreateTable
CREATE TABLE "profesional_servicio" (
    "profesional_id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,

    CONSTRAINT "profesional_servicio_pkey" PRIMARY KEY ("profesional_id","servicio_id")
);

-- CreateTable
CREATE TABLE "publicacion" (
    "publicacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "foto" TEXT NOT NULL,
    "nombre" VARCHAR(100),
    "zona_id" SMALLINT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo_contacto_id" CHAR(3) NOT NULL,
    "contacto" VARCHAR(150) NOT NULL,
    "estado_publicacion_id" CHAR(3) NOT NULL DEFAULT 'ACT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicacion_pkey" PRIMARY KEY ("publicacion_id")
);

-- CreateTable
CREATE TABLE "raza" (
    "raza_id" SMALLINT NOT NULL,
    "especie_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "raza_pkey" PRIMARY KEY ("raza_id")
);

-- CreateTable
CREATE TABLE "reporte" (
    "reporte_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicacion_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "motivo_reporte_id" CHAR(3) NOT NULL,
    "descripcion" VARCHAR(300),
    "estado_reporte_id" CHAR(3) NOT NULL DEFAULT 'PEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporte_pkey" PRIMARY KEY ("reporte_id")
);

-- CreateTable
CREATE TABLE "resena" (
    "resena_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "veterinaria_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "valor" SMALLINT NOT NULL,

    CONSTRAINT "resena_pkey" PRIMARY KEY ("resena_id")
);

-- CreateTable
CREATE TABLE "rol" (
    "rol_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "servicio" (
    "servicio_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "veterinaria_id" UUID NOT NULL,
    "categoria_servicio_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicio_pkey" PRIMARY KEY ("servicio_id")
);

-- CreateTable
CREATE TABLE "sexo_mascota" (
    "sexo_mascota_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "sexo_mascota_pkey" PRIMARY KEY ("sexo_mascota_id")
);

-- CreateTable
CREATE TABLE "tipo_contacto" (
    "tipo_contacto_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "tipo_contacto_pkey" PRIMARY KEY ("tipo_contacto_id")
);

-- CreateTable
CREATE TABLE "tipo_notificacion" (
    "tipo_notificacion_id" CHAR(3) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "tipo_notificacion_pkey" PRIMARY KEY ("tipo_notificacion_id")
);

-- CreateTable
CREATE TABLE "turno" (
    "turno_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "veterinaria_id" UUID NOT NULL,
    "profesional_id" UUID,
    "servicio_id" UUID NOT NULL,
    "mascota_id" UUID,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "motivo" VARCHAR(255),
    "monto_servicio" DECIMAL(12,2) NOT NULL,
    "estado_turno_id" CHAR(3) NOT NULL DEFAULT 'DIS',
    "vence_en" TIMESTAMPTZ(6),
    "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turno_pkey" PRIMARY KEY ("turno_id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "usuario_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(20),
    "zona_id" SMALLINT,
    "foto_url" TEXT,
    "rol_id" CHAR(3) NOT NULL DEFAULT 'DUE',
    "asistente_virtual_id" CHAR(3) DEFAULT 'PER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "usuario_google_auth" (
    "usuario_id" UUID NOT NULL,
    "google_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_google_auth_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "usuario_password" (
    "usuario_id" UUID NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "token_verificacion" VARCHAR(255),
    "token_verificacion_expires" TIMESTAMPTZ(6),
    "reset_password_token" VARCHAR(255),
    "reset_password_expires" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_password_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "vacuna" (
    "vacuna_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mascota_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "veterinaria_id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "fecha_aplicada" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacuna_pkey" PRIMARY KEY ("vacuna_id")
);

-- CreateTable
CREATE TABLE "veterinaria" (
    "veterinaria_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "razon_social" VARCHAR(150),
    "cuit" VARCHAR(13) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "sitio_web" TEXT,
    "latitud" DECIMAL(9,6) NOT NULL,
    "longitud" DECIMAL(9,6) NOT NULL,
    "urgencias" BOOLEAN NOT NULL DEFAULT false,
    "estado_veterinaria_id" CHAR(3) NOT NULL DEFAULT 'PEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "veterinaria_pkey" PRIMARY KEY ("veterinaria_id")
);

-- CreateTable
CREATE TABLE "veterinaria_mercadopago" (
    "veterinaria_id" UUID NOT NULL,
    "mp_user_id" VARCHAR(50) NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "public_key" VARCHAR(255) NOT NULL,
    "token_expira_en" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "veterinaria_mercadopago_pkey" PRIMARY KEY ("veterinaria_id")
);

-- CreateTable
CREATE TABLE "zona" (
    "zona_id" SMALLINT NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "zona_pkey" PRIMARY KEY ("zona_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asistente_virtual_nombre_key" ON "asistente_virtual"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_servicio_nombre_key" ON "categoria_servicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "consulta_turno_id_key" ON "consulta"("turno_id");

-- CreateIndex
CREATE INDEX "ix_consulta_mascota" ON "consulta"("mascota_id");

-- CreateIndex
CREATE UNIQUE INDEX "dia_semana_nombre_key" ON "dia_semana"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "especialidad_nombre_key" ON "especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "especie_nombre_key" ON "especie"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_pago_nombre_key" ON "estado_pago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_publicacion_nombre_key" ON "estado_publicacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_reporte_nombre_key" ON "estado_reporte"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_turno_nombre_key" ON "estado_turno"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_veterinaria_nombre_key" ON "estado_veterinaria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ficha_medica_mascota_id_key" ON "ficha_medica"("mascota_id");

-- CreateIndex
CREATE UNIQUE INDEX "horario_veterinaria_veterinaria_id_dia_semana_id_key" ON "horario_veterinaria"("veterinaria_id", "dia_semana_id");

-- CreateIndex
CREATE INDEX "ix_mascota_dueno" ON "mascota"("dueno_id");

-- CreateIndex
CREATE INDEX "ix_mascota_raza" ON "mascota"("raza_id");

-- CreateIndex
CREATE UNIQUE INDEX "metodo_pago_nombre_key" ON "metodo_pago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "motivo_reporte_nombre_key" ON "motivo_reporte"("nombre");

-- CreateIndex
CREATE INDEX "ix_notificacion_usuario_leida" ON "notificacion"("usuario_id", "leida");

-- CreateIndex
CREATE UNIQUE INDEX "pago_id_pago_key" ON "pago"("id_pago");

-- CreateIndex
CREATE INDEX "ix_pago_estado" ON "pago"("estado_pago_id");

-- CreateIndex
CREATE INDEX "ix_pago_turno" ON "pago"("turno_id");

-- CreateIndex
CREATE INDEX "ix_publicacion_usuario" ON "publicacion"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "raza_especie_id_nombre_key" ON "raza"("especie_id", "nombre");

-- CreateIndex
CREATE INDEX "ix_reporte_estado_publicacion" ON "reporte"("estado_reporte_id", "publicacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "reporte_publicacion_id_usuario_id_key" ON "reporte"("publicacion_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "resena_veterinaria_id_usuario_id_key" ON "resena"("veterinaria_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "sexo_mascota_nombre_key" ON "sexo_mascota"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_contacto_nombre_key" ON "tipo_contacto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_notificacion_nombre_key" ON "tipo_notificacion"("nombre");

-- CreateIndex
CREATE INDEX "ix_turno_mascota" ON "turno"("mascota_id");

-- CreateIndex
CREATE INDEX "ix_turno_recordatorio" ON "turno"("estado_turno_id", "fecha", "recordatorio_enviado");

-- CreateIndex
CREATE INDEX "ix_turno_vencimiento" ON "turno"("estado_turno_id", "vence_en");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_google_auth_google_id_key" ON "usuario_google_auth"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinaria_usuario_id_key" ON "veterinaria"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinaria_cuit_key" ON "veterinaria"("cuit");

-- CreateIndex
CREATE INDEX "ix_veterinaria_usuario" ON "veterinaria"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "zona_nombre_key" ON "zona"("nombre");

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_categoria_servicio_id_fkey" FOREIGN KEY ("categoria_servicio_id") REFERENCES "categoria_servicio"("categoria_servicio_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesional"("profesional_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turno"("turno_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estudio" ADD CONSTRAINT "estudio_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estudio" ADD CONSTRAINT "estudio_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesional"("profesional_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estudio" ADD CONSTRAINT "estudio_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ficha_medica" ADD CONSTRAINT "ficha_medica_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "horario_veterinaria" ADD CONSTRAINT "horario_veterinaria_dia_semana_id_fkey" FOREIGN KEY ("dia_semana_id") REFERENCES "dia_semana"("dia_semana_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "horario_veterinaria" ADD CONSTRAINT "horario_veterinaria_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_dueno_id_fkey" FOREIGN KEY ("dueno_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_raza_id_fkey" FOREIGN KEY ("raza_id") REFERENCES "raza"("raza_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_sexo_mascota_id_fkey" FOREIGN KEY ("sexo_mascota_id") REFERENCES "sexo_mascota"("sexo_mascota_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_tipo_notificacion_id_fkey" FOREIGN KEY ("tipo_notificacion_id") REFERENCES "tipo_notificacion"("tipo_notificacion_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_estado_pago_id_fkey" FOREIGN KEY ("estado_pago_id") REFERENCES "estado_pago"("estado_pago_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "metodo_pago"("metodo_pago_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turno"("turno_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidad"("especialidad_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profesional_servicio" ADD CONSTRAINT "profesional_servicio_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesional"("profesional_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profesional_servicio" ADD CONSTRAINT "profesional_servicio_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicio"("servicio_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_estado_publicacion_id_fkey" FOREIGN KEY ("estado_publicacion_id") REFERENCES "estado_publicacion"("estado_publicacion_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_tipo_contacto_id_fkey" FOREIGN KEY ("tipo_contacto_id") REFERENCES "tipo_contacto"("tipo_contacto_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zona"("zona_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "raza" ADD CONSTRAINT "raza_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "especie"("especie_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_estado_reporte_id_fkey" FOREIGN KEY ("estado_reporte_id") REFERENCES "estado_reporte"("estado_reporte_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_motivo_reporte_id_fkey" FOREIGN KEY ("motivo_reporte_id") REFERENCES "motivo_reporte"("motivo_reporte_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("publicacion_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resena" ADD CONSTRAINT "resena_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resena" ADD CONSTRAINT "resena_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "servicio" ADD CONSTRAINT "servicio_categoria_servicio_id_fkey" FOREIGN KEY ("categoria_servicio_id") REFERENCES "categoria_servicio"("categoria_servicio_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "servicio" ADD CONSTRAINT "servicio_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "turno_estado_turno_id_fkey" FOREIGN KEY ("estado_turno_id") REFERENCES "estado_turno"("estado_turno_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "turno_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "turno_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesional"("profesional_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "turno_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicio"("servicio_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "turno_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_asistente_virtual_id_fkey" FOREIGN KEY ("asistente_virtual_id") REFERENCES "asistente_virtual"("asistente_virtual_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("rol_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zona"("zona_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario_google_auth" ADD CONSTRAINT "usuario_google_auth_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario_password" ADD CONSTRAINT "usuario_password_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacuna" ADD CONSTRAINT "vacuna_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacuna" ADD CONSTRAINT "vacuna_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesional"("profesional_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacuna" ADD CONSTRAINT "vacuna_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "veterinaria" ADD CONSTRAINT "veterinaria_estado_veterinaria_id_fkey" FOREIGN KEY ("estado_veterinaria_id") REFERENCES "estado_veterinaria"("estado_veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "veterinaria" ADD CONSTRAINT "veterinaria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "veterinaria_mercadopago" ADD CONSTRAINT "veterinaria_mercadopago_veterinaria_id_fkey" FOREIGN KEY ("veterinaria_id") REFERENCES "veterinaria"("veterinaria_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
