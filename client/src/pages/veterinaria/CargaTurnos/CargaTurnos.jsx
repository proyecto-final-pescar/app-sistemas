import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import { obtenerMiVeterinaria } from "../../../services/veterinariaService";
import { crearOfertaHoraria, obtenerTurnosPorVeterinaria } from "../../../services/turnosService";
import styles from "./CargaTurnos.module.css";

const RECURRENCIAS = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
];

const DURACIONES = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
];

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const obtenerLunesDeSemana = (offset = 0) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7) + offset * 7);
  return lunes;
};

const generarFechasSemana = (offset) => {
  const lunes = obtenerLunesDeSemana(offset);
  return DIAS_SEMANA.map((_, i) => {
    const f = new Date(lunes);
    f.setDate(lunes.getDate() + i);
    return f;
  });
};

const formatearFecha = (fecha) =>
  fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" });

const generarSlots = (apertura, cierre, duracion) => {
  const slots = [];
  const [aH, aM] = apertura.split(":").map(Number);
  const [cH, cM] = cierre.split(":").map(Number);
  let total = aH * 60 + aM;
  const fin = cH * 60 + cM;
  while (total + duracion <= fin) {
    const h = Math.floor(total / 60).toString().padStart(2, "0");
    const m = (total % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    total += duracion;
  }
  return slots;
};

export default function CargaTurnos() {
  const [veterinaria, setVeterinaria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [profesionales, setProfesionales] = useState([]);
  const [recurrencia, setRecurrencia] = useState("semanal");
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [slotsSeleccionados, setSlotsSeleccionados] = useState({});
  const [slotsExistentes, setSlotsExistentes] = useState([]);
  const semanaAjustadaRef = useRef(false);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const servicioSeleccionado = veterinaria?.servicios?.find(s => s._id === servicioId);
  const [duracion, setDuracion] = useState(30);

  // Solo los profesionales que brindan el servicio elegido
  const profesionalesDelServicio = veterinaria?.profesionales
    ?.filter(p => p.servicioId === servicioId) || [];

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerMiVeterinaria();
        setVeterinaria(data);
      } catch {
        setError("No se pudo cargar la información de la veterinaria.");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const cargarExistentes = useCallback(async () => {
    if (!veterinaria?._id) return;
    try {
      const turnos = await obtenerTurnosPorVeterinaria(veterinaria._id, { estado: "disponible" });
      setSlotsExistentes(turnos.map(t => ({
        fecha: new Date(t.fecha).toISOString().split("T")[0],
        hora: t.hora,
        servicioId: t.servicioId?.toString(),
        profesionalId: t.profesionalId?.toString(),
        duracion: t.duracion
      })));
    } catch {
      // silencioso
    }
  }, [veterinaria]);

  useEffect(() => {
    cargarExistentes();
  }, [cargarExistentes, servicioId, profesionales]);

  const normalizarDia = (dia) =>
    dia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const diasDisponibles = veterinaria?.horarios
    ? Object.keys(veterinaria.horarios).filter(dia => {
      const h = veterinaria.horarios[dia];
      return h?.desde && h?.hasta;
    }).map(normalizarDia)
    : [];

  const semanaSinDisponibilidad = (offset) => {
    const fechas = generarFechasSemana(offset);
    return DIAS_SEMANA.every((dia, i) => {
      const disponible = diasDisponibles.includes(normalizarDia(dia));
      return !disponible || esFechaPasada(fechas[i]);
    });
  };

  useEffect(() => {
    if (!veterinaria || semanaAjustadaRef.current) return;

    let offset = 0;
    const maxIntentos = 8;
    while (offset < maxIntentos && semanaSinDisponibilidad(offset)) {
      offset++;
    }

    if (offset > 0) setSemanaOffset(offset);
    semanaAjustadaRef.current = true;
  }, [veterinaria]);

  const obtenerRangoGlobal = () => {
    if (!veterinaria?.horarios) return { apertura: "08:00", cierre: "18:00" };
    let minApertura = "23:59";
    let maxCierre = "00:00";
    Object.values(veterinaria.horarios).forEach(h => {
      if (!h?.desde || !h?.hasta) return;
      if (h.desde < minApertura) minApertura = h.desde;
      if (h.hasta > maxCierre) maxCierre = h.hasta;
    });
    return { apertura: minApertura, cierre: maxCierre };
  };

  const { apertura: aperturaGlobal, cierre: cierreGlobal } = obtenerRangoGlobal();
  const filas = generarSlots(aperturaGlobal, cierreGlobal, duracion);

  const lunesSemana = obtenerLunesDeSemana(semanaOffset);
  const fechasSemana = DIAS_SEMANA.map((_, i) => {
    const f = new Date(lunesSemana);
    f.setDate(lunesSemana.getDate() + i);
    return f;
  });

  const obtenerHorarioDia = (dia) => {
    if (!veterinaria?.horarios) return null;
    const clave = normalizarDia(dia);
    const horario = veterinaria.horarios[clave];
    if (!horario?.desde || !horario?.hasta) return null;
    return horario;
  };

  const esCeldaBloqueada = (dia, hora) => {
    const horario = obtenerHorarioDia(dia);
    if (!horario) return true;
    return hora < horario.desde || hora >= horario.hasta;
  };

  const esCeldaExistente = (fecha, hora) => {
    const fechaStr = fecha.toISOString().split("T")[0];
    const [h, m] = hora.split(":").map(Number);
    const minutosCelda = h * 60 + m;

    return slotsExistentes.some(s => {
      if (s.fecha !== fechaStr) return false;
      if (s.servicioId !== servicioId) return false;
      if (!profesionales.some(p => p.toString() === s.profesionalId)) return false;

      const [sh, sm] = s.hora.split(":").map(Number);
      const inicioSlot = sh * 60 + sm;
      const finSlot = inicioSlot + (s.duracion || duracion);

      return minutosCelda >= inicioSlot && minutosCelda < finSlot;
    });
  };

  const esFechaPasada = (fecha) => {
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    return f < h;
  };

  const esCeldaPasada = (fecha, hora) => {
    const ahora = new Date();
    const [h, m] = hora.split(":").map(Number);
    const fechaSlot = new Date(fecha);
    fechaSlot.setHours(h, m, 0, 0);
    return fechaSlot < ahora;
  };

  const toggleSlot = (diaIdx, hora) => {
    const fecha = fechasSemana[diaIdx];
    if (esFechaPasada(fecha)) return;
    const key = `${diaIdx}-${hora}`;
    setSlotsSeleccionados(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleTodoElDia = (diaIdx) => {
    const fecha = fechasSemana[diaIdx];
    if (esFechaPasada(fecha)) return;
    const dia = DIAS_SEMANA[diaIdx];
    const slotsDelDia = filas.filter(h => !esCeldaBloqueada(dia, h));
    const todosSeleccionados = slotsDelDia.every(h => slotsSeleccionados[`${diaIdx}-${h}`]);

    const nuevos = { ...slotsSeleccionados };
    slotsDelDia.forEach(h => {
      nuevos[`${diaIdx}-${h}`] = !todosSeleccionados;
    });
    setSlotsSeleccionados(nuevos);
  };

  const todoElDiaSeleccionado = (diaIdx) => {
    const dia = DIAS_SEMANA[diaIdx];
    const slotsDelDia = filas.filter(h => !esCeldaBloqueada(dia, h));
    return slotsDelDia.length > 0 && slotsDelDia.every(h => slotsSeleccionados[`${diaIdx}-${h}`]);
  };

  const calcularFechasExpandidas = useCallback((diaIdx) => {
    const fechaBase = fechasSemana[diaIdx];
    if (esFechaPasada(fechaBase)) return [];

    const fechas = [];
    let iteraciones = 1;
    let intervalo = 7;

    if (recurrencia === "quincenal") { iteraciones = 2; intervalo = 7; }
    else if (recurrencia === "mensual") {
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      let f = new Date(fechaBase);
      while (f <= fin) {
        if (!esFechaPasada(f)) fechas.push(new Date(f));
        f.setDate(f.getDate() + 7);
      }
      return fechas;
    }

    for (let i = 0; i < iteraciones; i++) {
      const f = new Date(fechaBase);
      f.setDate(fechaBase.getDate() + i * intervalo);
      if (!esFechaPasada(f)) fechas.push(f);
    }
    return fechas;
  }, [fechasSemana, recurrencia, hoy]);

  const totalSlotsACrear = () => {
    let total = 0;
    Object.entries(slotsSeleccionados).forEach(([key, sel]) => {
      if (!sel) return;
      const [diaIdx] = key.split(/-(.+)/);
      const fechas = calcularFechasExpandidas(Number(diaIdx));
      total += fechas.length;
    });
    return total;
  };

  const toggleProfesional = (id) => {
    setProfesionales(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleGuardar = async () => {
    setError("");
    setExito("");

    if (!servicioId) return setError("Seleccioná un servicio.");
    if (!profesionales.length) return setError("Seleccioná al menos un profesional.");

    const slotsAEnviar = [];
    Object.entries(slotsSeleccionados).forEach(([key, sel]) => {
      if (!sel) return;
      const [diaIdxStr, hora] = key.split(/-(.+)/);
      const diaIdx = Number(diaIdxStr);
      const fechas = calcularFechasExpandidas(diaIdx);
      fechas.forEach(fecha => {
        slotsAEnviar.push({
          fecha: fecha.toISOString().split("T")[0],
          hora
        });
      });
    });

    if (!slotsAEnviar.length) {
      return setError("Seleccioná al menos un horario en la grilla.");
    }

    setGuardando(true);
    try {
      const result = await crearOfertaHoraria({
        servicioId,
        profesionales,
        duracion,
        slots: slotsAEnviar,
      });
      setExito(`Se crearon ${result.data.cantidad} turnos disponibles correctamente.`);
      setSlotsSeleccionados({});
      await cargarExistentes();
      window.scrollTo({ top: 0, behavior: "smooth" });
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

              {/* Sección 1 — Configuración */}
              <div className={styles.card}>
                <div className={styles.cardTitulo}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Configuración del turno
                </div>
                <div className={styles.fila}>
                  <div className={styles.campo}>
                    <label className={styles.label}>Servicio</label>
                    <select
                      className={styles.select}
                      value={servicioId}
                      onChange={(e) => { setServicioId(e.target.value); setProfesionales([]); }}
                    >
                      <option value="">Seleccioná un servicio...</option>
                      {veterinaria?.servicios?.map(s => (
                        <option key={s._id} value={s._id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.campo}>
                    <label className={styles.label}>Profesionales disponibles</label>
                    <div className={styles.profesionalesGrid}>
                      {!servicioId && (
                        <span className={styles.helperTextSuave}>Elegí un servicio para ver los profesionales que lo brindan.</span>
                      )}
                      {servicioId && profesionalesDelServicio.length === 0 && (
                        <span className={styles.helperTextSuave}>Ningún profesional brinda este servicio todavía.</span>
                      )}
                      {profesionalesDelServicio.map(p => (
                        <button
                          key={p._id}
                          className={`${styles.chipProf} ${profesionales.includes(p._id) ? styles.chipProfActivo : ""}`}
                          onClick={() => toggleProfesional(p._id)}
                          type="button"
                        >
                          {p.nombre}
                          {profesionales.includes(p._id) && <span className={styles.chipX}>×</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.campo}>
                    <label className={styles.label}>Duración del turno</label>
                    <select
                      className={styles.select}
                      value={duracion}
                      onChange={(e) => { setDuracion(Number(e.target.value)); setSlotsSeleccionados({}); }}
                    >
                      {DURACIONES.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2 — Grilla */}
              <div className={styles.card}>
                <div className={styles.cardTituloFila}>
                  <div className={styles.cardTitulo}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Seleccioná días y horarios
                  </div>
                  <div className={styles.leyenda}>
                    <span className={styles.leyendaItem}><span className={styles.leyendaDotVerde}></span>Seleccionado</span>
                    <span className={styles.leyendaItem}><span className={styles.leyendaDotGris}></span>No seleccionado</span>
                    <span className={styles.leyendaItem}><span className={styles.leyendaDotVioleta}></span>Ya creado</span>
                    <span className={styles.leyendaItem}><span className={styles.leyendaDotBloqueado}></span>No disponible</span>
                  </div>
                </div>
                <div className={styles.navSemanaTop}>
                  <button
                    className={styles.btnNav}
                    onClick={() => setSemanaOffset(o => Math.max(o - 1, 0))}
                    disabled={semanaOffset === 0}
                    type="button"
                  >‹</button>
                  <button
                    className={styles.btnNav}
                    onClick={() => setSemanaOffset(o => o + 1)}
                    type="button"
                  >›</button>
                </div>
                <div className={styles.filaRecurrencia}>
                  <div className={styles.campo}>
                    <label className={styles.label}>Recurrencia</label>
                    <select
                      className={styles.select}
                      value={recurrencia}
                      onChange={(e) => setRecurrencia(e.target.value)}
                    >
                      {RECURRENCIAS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.grillaWrapper}>
                  <table className={styles.grilla}>
                    <thead>
                      <tr>
                        <th className={styles.thHora}></th>
                        {DIAS_SEMANA.map((dia, i) => {
                          const fecha = fechasSemana[i];
                          const disponible = diasDisponibles.includes(normalizarDia(dia));
                          const pasado = esFechaPasada(fecha);
                          return (
                            <th key={dia} className={`${styles.thDia} ${!disponible || pasado ? styles.thDiaBloqueado : ""}`}>
                              <div className={styles.thDiaContenido}>
                                <span className={styles.thDiaNombre}>{dia}</span>
                                <span className={styles.thDiaFecha}>{formatearFecha(fecha)}</span>
                                {disponible && !pasado && (
                                  <button
                                    className={`${styles.btnTodoDia} ${todoElDiaSeleccionado(i) ? styles.btnTodoDiaActivo : ""}`}
                                    onClick={() => toggleTodoElDia(i)}
                                    type="button"
                                  >
                                    <span className={`${styles.radioCircle} ${todoElDiaSeleccionado(i) ? styles.radioCircleActivo : ""}`}></span>
                                    Todo el día
                                  </button>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map(hora => (
                        <tr key={hora}>
                          <td className={styles.tdHora}>{hora}</td>
                          {DIAS_SEMANA.map((dia, i) => {
                            const fecha = fechasSemana[i];
                            const bloqueado = esCeldaBloqueada(dia, hora);
                            const pasado = esCeldaPasada(fecha, hora);
                            const existente = esCeldaExistente(fecha, hora);
                            const seleccionado = slotsSeleccionados[`${i}-${hora}`];

                            if (bloqueado || pasado) {
                              return (
                                <td key={dia} className={styles.tdBloqueado}>
                                  <div className={styles.celdaBloqueada}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                  </div>
                                </td>
                              );
                            }

                            if (existente) {
                              return (
                                <td key={dia} className={styles.tdExistente}>
                                  <div className={styles.celdaExistente}>{hora}</div>
                                </td>
                              );
                            }

                            return (
                              <td key={dia} className={styles.tdCelda}>
                                <button
                                  type="button"
                                  className={`${styles.celda} ${seleccionado ? styles.celdaSeleccionada : ""}`}
                                  onClick={() => toggleSlot(i, hora)}
                                  disabled={!servicioId || !profesionales.length}
                                >
                                  {hora}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalSlotsACrear() > 0 && (
                  <div className={styles.resumen}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Se crearán <strong>{totalSlotsACrear()} turnos</strong> de <strong>{servicioSeleccionado?.nombre || "el servicio seleccionado"}</strong> con <strong>{profesionales.length} profesional{profesionales.length !== 1 ? "es" : ""}</strong>.
                  </div>
                )}
              </div>

              <div className={styles.botones}>
                <button
                  className={styles.btnCancelar}
                  onClick={() => { setSlotsSeleccionados({}); setError(""); setExito(""); }}
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