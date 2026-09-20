ALTER TABLE "servicio"
  ADD COLUMN "descripcion" VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN "duracion_minutos" SMALLINT NOT NULL DEFAULT 30;

ALTER TABLE "servicio"
  ADD CONSTRAINT "ck_servicio_duracion_minutos"
  CHECK ("duracion_minutos" BETWEEN 15 AND 480);
