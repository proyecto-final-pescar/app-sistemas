import Veterinaria from '../models/Veterinaria.js';
import Turno from '../models/Turno.js';

// Genera todos los horarios posibles de un día según apertura y cierre
// Por ejemplo: desde "09:00" hasta "18:00" cada 30 minutos
const generarHorarios = (desde, hasta) => {
    const horarios = [];
    const [horaDesde, minDesde] = desde.split(':').map(Number);
    const [horaHasta, minHasta] = hasta.split(':').map(Number);

    let totalMinDesde = horaDesde * 60 + minDesde;
    const totalMinHasta = horaHasta * 60 + minHasta;

    while (totalMinDesde < totalMinHasta) {
        const horas = Math.floor(totalMinDesde / 60).toString().padStart(2, '0');
        const minutos = (totalMinDesde % 60).toString().padStart(2, '0');
        horarios.push(`${horas}:${minutos}`);
        totalMinDesde += 30; // turnos cada 30 minutos
    }

    return horarios;
};

// Convierte el número del día de la semana al nombre en español
const obtenerNombreDia = (numeroDia) => {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return dias[numeroDia];
};

// GET /disponibilidad/:veterinariaId?fecha=YYYY-MM-DD
export const obtenerDisponibilidad = async (req, res) => {
    try {
        const { veterinariaId } = req.params;
        const { fecha } = req.query;

        // ── Validaciones extras agregadas por mi cuenta ──

        // 1. Validar que se envió la fecha
        if (!fecha) {
            return res.status(400).json({ message: 'La fecha es requerida. Formato: ?fecha=YYYY-MM-DD' });
        }

        // 2. Validar formato de fecha (YYYY-MM-DD)
        const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;
        if (!formatoFecha.test(fecha)) {
            return res.status(400).json({ message: 'Formato de fecha inválido. Usá YYYY-MM-DD (ej: 2026-07-15)' });
        }

        // 3. Validar que la fecha no sea en el pasado
        const fechaSolicitada = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaSolicitada < hoy) {
            return res.status(400).json({ message: 'No podés consultar disponibilidad para fechas pasadas' });
        }

        // ── Lógica principal ──

        // 4. Buscar la veterinaria (solo si está activa)
        const veterinaria = await Veterinaria.findOne({ _id: veterinariaId, estado: 'activa' });

        if (!veterinaria) {
            return res.status(404).json({ message: 'El recurso no existe.' });
        }

        // 5. Obtener el día de la semana de la fecha solicitada
        const nombreDia = obtenerNombreDia(fechaSolicitada.getDay());
        const horarioDia = veterinaria.horarios[nombreDia];

        // 6. Verificar si la veterinaria atiende ese día
        if (!horarioDia || !horarioDia.desde || !horarioDia.hasta) {
            return res.status(200).json({
                success: true,
                message: `La veterinaria no atiende los ${nombreDia}`,
                data: {
                    fecha,
                    dia: nombreDia,
                    horariosDisponibles: [],
                    totalDisponibles: 0
                }
            });
        }

        // 7. Generar todos los horarios posibles del día
        const todosLosHorarios = generarHorarios(horarioDia.desde, horarioDia.hasta);

        // 8. Buscar turnos ya ocupados para esa fecha y veterinaria
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);

        const turnosOcupados = await Turno.find({
            veterinariaId,
            fecha: { $gte: fechaInicio, $lt: fechaFin },
            estado: { $in: ['pendiente', 'confirmado'] }
        });

        // 9. Extraer solo las horas ocupadas
        const horasOcupadas = turnosOcupados.map(turno => turno.hora);

        // 10. Filtrar los horarios disponibles
        const horariosDisponibles = todosLosHorarios.filter(hora => !horasOcupadas.includes(hora));

        // 11. Mensaje descriptivo si no hay disponibilidad (pedido por la tarea)
        if (horariosDisponibles.length === 0) {
            return res.status(200).json({
                success: true,
                message: `No hay turnos disponibles para el ${fecha}. Todos los horarios están ocupados.`,
                data: {
                    fecha,
                    dia: nombreDia,
                    horarioAtencion: `${horarioDia.desde} a ${horarioDia.hasta}`,
                    horariosDisponibles: [],
                    totalDisponibles: 0
                }
            });
        }

        // 12. Respuesta exitosa con disponibilidad
        res.status(200).json({
            success: true,
            data: {
                fecha,
                dia: nombreDia,
                horarioAtencion: `${horarioDia.desde} a ${horarioDia.hasta}`,
                horariosDisponibles,
                totalDisponibles: horariosDisponibles.length // extra: cuántos turnos quedan
            }
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
        }
        console.error('Error en GET /disponibilidad/:veterinariaId:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};