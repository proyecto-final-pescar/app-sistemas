import { useEffect, useState } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import { obtenerMiVeterinaria } from "../../../services/veterinariaService";
import { crearOfertaHoraria } from "../../../services/turnosService";
import styles from "./CargaTurnos.module.css";

const RECURRENCIAS = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
];

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Obtiene la fecha del próximo día de la semana
const obtenerProximaFecha = (diaSemana) => {
  const hoy = new Date();
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diaObjetivo = diasSemana.indexOf(diaSemana);
  const diff = (diaObjetivo - hoy.getDay() + 7) % 7 || 7;
  const fecha = new Date(hoy);
  fecha.setDate(hoy.getDate() + diff);
  return fecha.toISOString().split("T")[0];
};

export default function AjustesVet() {
  const [veterinaria, setVeterinaria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Formulario
  const [especialidad, setEspecialidad] = useState("");
  const [profesionales, setProfesionales] = useState([]);
  const [recurrencia, setRecurrencia] = useState("semanal");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("13:00");
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerMiVeterinaria();
        setVeterinaria(data);
      } catch (err) {
        setError("No se pudo cargar la información de la veterinaria.");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const toggleProfesional = (id) => {
    setProfesionales((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleDia = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  // Servicio seleccionado para mostrar la duración
  const servicioSeleccionado = veterinaria?.servicios?.find(
    (s) => s.nombre === especialidad || s.categoria === especialidad
  );

  // Calcular slots que se van a generar
  const calcularCantidadSlots = () => {
    if (!horaInicio || !horaFin || !servicioSeleccionado) return 0;
    const [hi, hm] = horaInicio.split(":").map(Number);
    const [hf, hfm] = horaFin.split(":").map(Number);
    const minutos = (hf * 60 + hfm) - (hi * 60 + hm);
    if (minutos <= 0) return 0;
    return Math.floor(minutos / servicioSeleccionado.duracion);
  };

  const slotsPorDia = calcularCantidadSlots();


  const calcularFechasExpandidas = () => {
    if (!diasSeleccionados.length) return 0;

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    let fechaFin;
    if (recurrencia === 'unica') return diasSeleccionados.length;

    if (recurrencia === 'semanal') {
      fechaFin = new Date(inicioSemana);
      fechaFin.setDate(inicioSemana.getDate() + 6);
    } else if (recurrencia === 'quincenal') {
      fechaFin = new Date(inicioSemana);
      fechaFin.setDate(inicioSemana.getDate() + 13);
    } else if (recurrencia === 'mensual') {
      fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }

    const diasSemanaMap = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
      'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
    };

    let totalFechas = 0;
    diasSeleccionados.forEach(dia => {
      const diaSemana = diasSemanaMap[dia];
      const fecha = new Date(inicioSemana);
      while (fecha.getDay() !== diaSemana) {
        fecha.setDate(fecha.getDate() + 1);
      }
      while (fecha <= fechaFin) {
        totalFechas++;
        fecha.setDate(fecha.getDate() + 7);
      }
    });

    return totalFechas;
  };

  const cantidadFechas = calcularFechasExpandidas();
  const totalSlots = slotsPorDia * cantidadFechas * profesionales.length;

  const descripcionRecurrencia = {
    unica: "esta semana únicamente",
    semanal: "durante esta semana",
    quincenal: "durante las próximas 2 semanas",
    mensual: `durante todo el mes de ${new Date().toLocaleDateString("es-AR", { month: "long" })}`
  }[recurrencia];

  // En el JSX del resumen
  {
    totalSlots > 0 && (
      <div className={styles.resumen}>
        Se crearán <strong>{totalSlots} turnos</strong> de <strong>{especialidad}</strong> los días <strong>{diasSeleccionados.join(", ")}</strong> de <strong>{horaInicio}</strong> a <strong>{horaFin}</strong> hs con <strong>{profesionales.length} profesional{profesionales.length !== 1 ? "es" : ""}</strong>, <strong>{descripcionRecurrencia}</strong>.
      </div>
    )
  }

  const handleGuardar = async () => {
    setError("");
    setExito("");

    if (!especialidad) return setError("Seleccioná una especialidad.");
    if (!profesionales.length) return setError("Seleccioná al menos un profesional.");
    if (!diasSeleccionados.length) return setError("Seleccioná al menos un día.");
    if (!horaInicio || !horaFin) return setError("Ingresá el horario de inicio y fin.");
    if (horaInicio >= horaFin) return setError("La hora de inicio debe ser anterior a la hora de fin.");
    if (slotsPorDia === 0) return setError("El rango horario no permite generar turnos con la duración del servicio.");

    const dias = diasSeleccionados.map((dia) => obtenerProximaFecha(dia));

    setGuardando(true);
    try {
      const result = await crearOfertaHoraria({
        especialidad,
        profesionales,
        dias: diasSeleccionados,
        horaInicio,
        horaFin,
        recurrencia,
      });
      setExito(`Se crearon ${result.data.cantidad} turnos disponibles correctamente.`);
      // Limpiar formulario
      setEspecialidad("");
      setProfesionales([]);
      setDiasSeleccionados([]);
      setHoraInicio("09:00");
      setHoraFin("13:00");
      setRecurrencia("semanal");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron crear los turnos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar title="Cargar turnos" />

        <div className={styles.content}>
          {loading && <p className={styles.estadoVacio}>Cargando información...</p>}

          {!loading && (
            <>
              {error && <div className={styles.alerta}>{error}</div>}
              {exito && <div className={styles.alertaExito}>{exito}</div>}

              {/* Sección 1 — Configuración del turno */}
              <div className={styles.card}>
                <div className={styles.cardTitulo}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Configuración del turno
                </div>

                <div className={styles.fila}>
                  {/* Especialidad */}
                  <div className={styles.campo}>
                    <label className={styles.label}>Especialidad</label>
                    <select
                      className={styles.select}
                      value={especialidad}
                      onChange={(e) => {
                        setEspecialidad(e.target.value);
                        setProfesionales([]);
                      }}
                    >
                      <option value="">Seleccioná un servicio...</option>
                      {veterinaria?.servicios?.map((s) => (
                        <option key={s._id} value={s.nombre}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Profesionales */}
                  <div className={styles.campo}>
                    <label className={styles.label}>Profesionales disponibles</label>
                    <div className={styles.profesionalesGrid}>
                      {veterinaria?.profesionales?.map((p) => (
                        <button
                          key={p._id}
                          className={`${styles.chipProf} ${profesionales.includes(p._id) ? styles.chipProfActivo : ""}`}
                          onClick={() => toggleProfesional(p._id)}
                          type="button"
                        >
                          {p.nombre}
                          {profesionales.includes(p._id) && (
                            <span className={styles.chipX}>×</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duración */}
                  <div className={styles.campo}>
                    <label className={styles.label}>Duración del turno</label>
                    <div className={styles.duracionBox}>
                      <span className={styles.duracionValor}>
                        {servicioSeleccionado
                          ? `${servicioSeleccionado.duracion} minutos`
                          : "Seleccioná un servicio"}
                      </span>
                      {servicioSeleccionado && (
                        <span className={styles.duracionNota}>
                          Cada turno tendrá una duración de {servicioSeleccionado.duracion} minutos.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 2 — Días y horarios */}
              <div className={styles.card}>
                <div className={styles.cardTituloFila}>
                  <div className={styles.cardTitulo}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Seleccioná días y horarios
                  </div>
                  {diasSeleccionados.length > 0 && slotsPorDia > 0 && (
                    <span className={styles.badgeExito}>
                      ✓ {slotsPorDia} turno{slotsPorDia !== 1 ? "s" : ""} por día seleccionado
                    </span>
                  )}
                </div>

                <div className={styles.filaHorarios}>
                  <div className={styles.campo}>
                    <label className={styles.label}>Recurrencia</label>
                    <select
                      className={styles.select}
                      value={recurrencia}
                      onChange={(e) => setRecurrencia(e.target.value)}
                    >
                      {RECURRENCIAS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.campo}>
                    <label className={styles.label}>Hora de inicio</label>
                    <select
                      className={styles.select}
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = i.toString().padStart(2, "0");
                        return (
                          <option key={`${h}:00`} value={`${h}:00`}>{`${h}:00`}</option>
                        );
                      })}
                    </select>
                  </div>
                  <div className={styles.campo}>
                    <label className={styles.label}>Hora de fin</label>
                    <select
                      className={styles.select}
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = i.toString().padStart(2, "0");
                        return (
                          <option key={`${h}:00`} value={`${h}:00`}>{`${h}:00`}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Cards de días */}
                <div className={styles.diasGrid}>
                  {DIAS_SEMANA.map((dia) => {
                    const seleccionado = diasSeleccionados.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        className={`${styles.diaCard} ${seleccionado ? styles.diaCardActivo : ""}`}
                        onClick={() => toggleDia(dia)}
                      >
                        <span className={styles.diaNombre}>{dia}</span>
                        {seleccionado && horaInicio && (
                          <span className={styles.diaHora}>{horaInicio}</span>
                        )}
                        {especialidad && (
                          <span className={styles.diaEspecialidad}>{especialidad}</span>
                        )}
                        {profesionales.length > 0 && (
                          <span className={styles.diaProfesionales}>
                            {profesionales.length} profesional{profesionales.length !== 1 ? "es" : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Resumen */}
                {totalSlots > 0 && (
                  <div className={styles.resumen}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Se crearán <strong>{totalSlots} turnos</strong> de <strong>{especialidad}</strong> los días <strong>{diasSeleccionados.join(", ")}</strong> de <strong>{horaInicio}</strong> a <strong>{horaFin}</strong> hs con <strong>{profesionales.length} profesional{profesionales.length !== 1 ? "es" : ""}</strong>.
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className={styles.botones}>
                <button
                  className={styles.btnCancelar}
                  onClick={() => {
                    setEspecialidad("");
                    setProfesionales([]);
                    setDiasSeleccionados([]);
                    setHoraInicio("09:00");
                    setHoraFin("13:00");
                    setRecurrencia("semanal");
                    setError("");
                    setExito("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnGuardar}
                  onClick={handleGuardar}
                  disabled={guardando}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  {guardando ? "Guardando..." : "Guardar turnos"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}