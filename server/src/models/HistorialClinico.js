import mongoose from "mongoose";
import { CATEGORIAS_SERVICIO } from "../constants/categoriasServicio.js";

const HistorialClinicoSchema = new mongoose.Schema(
  {
    mascotaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mascota",
      required: [true, "La mascota es requerida"],
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario tutor es requerido"],
    },

    profesionalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "El profesional a cargo es requerido"],
    },

    veterinariaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinaria",
      required: [true, "La veterinaria es requerida"],
    },

    turnoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turno",
      required: [true, "El turno es requerido"],
    },

    fecha: {
      type: Date,
      required: [true, "La fecha del turno es requerida"],
    },

    hora: {
      type: String,
      required: [true, "La hora del turno es requerida"],
      trim: true,
    },

    categoriaServicio: {
      type: String,
      enum: {
        values: CATEGORIAS_SERVICIO,
        message: "{VALUE} no es una categoría de servicio válida",
      },
      required: [true, "La categoría del servicio es requerida"],
    },

    motivoConsulta: {
      type: String,
      required: [true, "El motivo del turno es requerido"],
      trim: true,
    },

    anotaciones: {
      type: String,
      required: [true, "Las anotaciones médicas son requeridas"],
      trim: true,
    },

    monto: {
      type: Number,
      default: 0,
    },

    urlPdf: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "historiales_clinicos",
  },
);

const HistorialClinico = mongoose.model(
  "HistorialClinico",
  HistorialClinicoSchema,
);

export default HistorialClinico;