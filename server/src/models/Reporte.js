import mongoose from 'mongoose';

const ReporteSchema = new mongoose.Schema({
  publicacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publicacion',
    required: true
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  motivo: {
    type: String,
    required: [true, 'El motivo del reporte es requerido'],
    enum: {
      values: [
        'contenido_inapropiado',
        'informacion_falsa',
        'spam',
        'animal_ya_encontrado',
        'publicacion_duplicada',
        'otro'
      ],
      message: 'Motivo de reporte no válido'
    }
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [300, 'La descripción no puede superar los 300 caracteres'],
    required: [
      function () {
        return this.motivo === 'otro';
      },
      'La descripción es requerida.'
    ]
  },
  estado: {
    type: String,
    enum: ['pendiente', 'revisado', 'descartado'],
    default: 'pendiente'
  }// pendiente es cuando esta en la badeja del admin y no se tomo ninguna decision , revisado se tomo una decision (eliminar publi y/o tambien se baneo user)
   // descartado ->se descarto el reporte -> icon del circulo
}, {
  timestamps: true
});

// Evita que un mismo usuario reporte la misma publicación mas de una vez
ReporteSchema.index({ publicacionId: 1, usuarioId: 1 }, { unique: true });

const Reporte = mongoose.model('Reporte', ReporteSchema);

export default Reporte;