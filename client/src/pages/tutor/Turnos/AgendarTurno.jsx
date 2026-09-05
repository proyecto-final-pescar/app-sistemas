import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { crearPreferenciaPago } from "../../../services/pagoService";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";

import Select from "../../../components/ui/select/Select";
import SuccessModal from "../../../components/ui/success-modal/SuccessModal";

import styles from "../../../styles/AgendarTurno.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const ANTICIPACION_MINIMA_HORAS = 10;
const PLAZO_PAGO_HORAS = 3;

const formatearFechaId = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const fechaIdDesdeISO = (fechaISO) => fechaISO.slice(0, 10);

const cumpleAntelacionMinima = (fechaStr, hora) => {
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const fechaHoraTurno = new Date(anio, mes - 1, dia, hh, mm);

  const limiteMinimo = new Date(
    Date.now() + ANTICIPACION_MINIMA_HORAS * 60 * 60 * 1000
  );

  return fechaHoraTurno >= limiteMinimo;
};

const obtenerToken = () => localStorage.getItem("token");

// Helpers para leer un mismo campo tanto si viene con el shape viejo de
// Mongo (_id) como con el nuevo de Postgres (turno_id, mascota_id, etc).
// Se dejan como fallback defensivo hasta confirmar que TODOS los
// endpoints que consume esta pantalla ya están migrados — ver nota
// aparte sobre /veterinarias/:id y /mascotas.
const idDeTurno = (t) => t.turno_id || t._id;
const idDeMascota = (m) => m.mascota_id || m._id;
const idDeServicio = (s) => s.servicio_id || s._id;
const idDeProfesional = (p) => p.profesional_id || p._id;

const NOMBRES_DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SAB"];
const NOMBRES_DIAS_COMPLETO = {
  DOM: "domingo",
  LUN: "lunes",
  MAR: "martes",
  MIÉ: "miércoles",
  JUE: "jueves",
  VIE: "viernes",
  SAB: "sábado",
};
const NOMBRES_MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const AgendarTurnos = () => {
  const navigate = useNavigate();
  const { veterinariaId } = useParams();

  // --- Estados del Negocio ---
  const [veterinaria, setVeterinaria] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [error, setError] = useState(null);

  // --- Estados de Selección y Filtro ---
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [busquedaServicio, setBusquedaServicio] = useState("");

  const [fechaInicioSemana, setFechaInicioSemana] = useState(() => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const offset = (diaSemana + 6) % 7;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - offset);
    return lunes;
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  // Ya no elegimos "profesional" en abstracto: cada opción del slot ES un
  // turno concreto y distinto (uno por profesional, ya asignado desde que
  // la veterinaria lo creó). Elegir "profesional" en la UI equivale a
  // elegir directamente CUÁL de esos turnos concretos se reserva.
  const [turnoIdSeleccionado, setTurnoIdSeleccionado] = useState("");
  const [mascotaSeleccionadaId, setMascotaSeleccionadaId] = useState("");
  const [notas, setNotas] = useState("");
  const [mascotaConfirmadaNombre, setMascotaConfirmadaNombre] = useState("");

  // Carga inicial
  useEffect(() => {
    let cancelado = false;

    const cargarDatosBase = async () => {
      try {
        setLoading(true);
        const token = obtenerToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [resVetRaw, resMascotasRaw] = await Promise.all([
          fetch(`${API_URL}/veterinarias/${veterinariaId}`, { headers }),
          fetch(`${API_URL}/mascotas`, { headers }),
        ]);

        if (!resVetRaw.ok || !resMascotasRaw.ok) {
          throw new Error("Error al obtener los datos iniciales.");
        }

        const [resVet, resMascotas] = await Promise.all([
          resVetRaw.json(),
          resMascotasRaw.json(),
        ]);

        if (cancelado) return;

        if (!resVet.success) {
          setError(resVet.message || "No pudimos cargar la veterinaria.");
          setLoading(false);
          return;
        }

        setVeterinaria(resVet.data);
        setMascotas(Array.isArray(resMascotas) ? resMascotas : resMascotas?.data || []);
        setError(null);
      } catch (err) {
        if (cancelado) return;
        console.error("Error cargando datos base:", err);
        setError("No se pudo cargar la clínica. Intentá de nuevo más tarde.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    if (veterinariaId) cargarDatosBase();

    return () => {
      cancelado = true;
    };
  }, [veterinariaId]);

  // Lista de categorías únicas extraídas de los servicios.
  // Nota: en Postgres la categoría vive en categoria_servicio (relación),
  // no como string plano — si /veterinarias/:id ya está migrado, este
  // campo probablemente venga como s.categoria_servicio.nombre. Se deja
  // el fallback a s.categoria por si ese endpoint todavía no cambió.
  const categoriasUnicas = useMemo(() => {
    const cats = new Set(["Todas"]);
    (veterinaria?.servicios || []).forEach((s) => {
      const categoria = s.categoria_servicio?.nombre || s.categoria;
      if (categoria) cats.add(categoria);
    });
    return Array.from(cats);
  }, [veterinaria]);

  const serviciosFiltrados = useMemo(() => {
    return (veterinaria?.servicios || []).filter((s) => {
      const categoria = s.categoria_servicio?.nombre || s.categoria;
      const coincideCategoria =
        categoriaSeleccionada === "Todas" || categoria === categoriaSeleccionada;
      const coincideBusqueda = s.nombre
        .toLowerCase()
        .includes(busquedaServicio.toLowerCase());
      return coincideCategoria && coincideBusqueda;
    });
  }, [veterinaria, categoriaSeleccionada, busquedaServicio]);

  const diasSemana = useMemo(() => {
    const hoyStr = formatearFechaId(new Date());

    return Array.from({ length: 7 }).map((_, idx) => {
      const fechaDia = new Date(fechaInicioSemana);
      fechaDia.setDate(fechaInicioSemana.getDate() + idx);
      const fechaStr = formatearFechaId(fechaDia);

      return {
        nom: NOMBRES_DIAS[fechaDia.getDay()],
        num: fechaDia.getDate(),
        mes: NOMBRES_MESES[fechaDia.getMonth()],
        fechaStr,
        activo: fechaStr === hoyStr,
      };
    });
  }, [fechaInicioSemana]);

  const servicioElegido = useMemo(
    () => veterinaria?.servicios?.find((s) => idDeServicio(s) === servicioSeleccionadoId) || null,
    [veterinaria, servicioSeleccionadoId]
  );

  const mapaProfesionales = useMemo(() => {
    const mapa = {};
    (veterinaria?.profesionales || []).forEach((p) => {
      mapa[idDeProfesional(p)] = p;
    });
    return mapa;
  }, [veterinaria]);

  // Agrupa los turnos por día+hora. Con el modelo nuevo, cada turno de la
  // lista ya es una reserva concreta y distinta (un profesional fijo por
  // fila) — si a las 09:00 hay 2 profesionales libres, van a llegar como
  // 2 turnos separados con la misma fecha/hora, cada uno con su propio
  // turno_id. Agruparlos acá es lo que permite mostrarlos como "un solo
  // slot con varias opciones" en la grilla.
  const turnosPorDiaYHora = useMemo(() => {
    const mapa = {};

    turnosDisponibles.forEach((turno) => {
      const fechaStr = fechaIdDesdeISO(turno.fecha);
      const hora = turno.hora_inicio; // ya viene formateado "HH:MM" por el backend
      if (!cumpleAntelacionMinima(fechaStr, hora)) return;

      if (!mapa[fechaStr]) mapa[fechaStr] = {};
      if (!mapa[fechaStr][hora]) mapa[fechaStr][hora] = [];
      mapa[fechaStr][hora].push(turno);
    });

    return mapa;
  }, [turnosDisponibles]);

  const horasVisibles = useMemo(() => {
    const todasLasHoras = new Set();

    Object.values(turnosPorDiaYHora).forEach((horas) => {
      Object.keys(horas).forEach((hora) => todasLasHoras.add(hora));
    });

    return Array.from(todasLasHoras).sort();
  }, [turnosPorDiaYHora]);

  // Carga de turnos disponibles según servicio y semana
  useEffect(() => {
    let cancelado = false;

    const cargarTurnosDisponibles = async () => {
      if (!servicioSeleccionadoId) {
        setTurnosDisponibles([]);
        return;
      }

      try {
        setLoadingTurnos(true);
        const token = obtenerToken();
        const headers = { Authorization: `Bearer ${token}` };

        const fechaDesde = diasSemana[0].fechaStr;
        const fechaHasta = diasSemana[6].fechaStr;

        const params = new URLSearchParams({
          veterinariaId,
          servicioId: servicioSeleccionadoId,
          estado: "DIS", // código real en Postgres — antes era "disponible"
          fechaDesde,
          fechaHasta,
        });

        const res = await fetch(`${API_URL}/turnos?${params.toString()}`, { headers });
        const resultado = await res.json();

        if (cancelado) return;

        if (!res.ok || !resultado.success) {
          throw new Error(resultado.message || "No se pudieron cargar los turnos");
        }

        setTurnosDisponibles(resultado.data.turnos || []);
      } catch (err) {
        if (cancelado) return;
        console.error("Error cargando turnos disponibles:", err);
        setError("No se pudo cargar la grilla de turnos.");
      } finally {
        if (!cancelado) setLoadingTurnos(false);
      }
    };

    cargarTurnosDisponibles();

    return () => {
      cancelado = true;
    };
  }, [veterinariaId, servicioSeleccionadoId, fechaInicioSemana]);

  const handleSemanaAnterior = () => {
    setFechaInicioSemana((prev) => {
      const nueva = new Date(prev);
      nueva.setDate(prev.getDate() - 7);
      return nueva;
    });
  };

  const handleSemanaSiguiente = () => {
    setFechaInicioSemana((prev) => {
      const nueva = new Date(prev);
      nueva.setDate(prev.getDate() + 7);
      return nueva;
    });
  };

  const handleVolver = () => navigate(-1);

  const handleSlotClick = (dia, hora) => {
    const opciones = turnosPorDiaYHora[dia.fechaStr]?.[hora] || [];
    if (!opciones.length) return;

    setTurnoSeleccionado({ dia, hora, opciones });
    // Si hay un solo profesional disponible en ese horario, se preselecciona
    // directo su turno; si hay varios, el dueño elige cuál en el modal.
    setTurnoIdSeleccionado(opciones.length === 1 ? idDeTurno(opciones[0]) : "");
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setTurnoIdSeleccionado("");
    setMascotaSeleccionadaId("");
    setNotas("");
  };

  const turnoConcretoElegido = useMemo(() => {
    if (!turnoSeleccionado || !turnoIdSeleccionado) return null;
    return (
      turnoSeleccionado.opciones.find(
        (t) => idDeTurno(t) === turnoIdSeleccionado
      ) || null
    );
  }, [turnoSeleccionado, turnoIdSeleccionado]);

  // Reserva un turno YA EXISTENTE (creado de antemano por la veterinaria
  // vía crearOfertaHoraria). Ya no se crea un turno nuevo acá — solo se
  // transiciona de 'disponible' a 'pendiente'. Por eso ya no se manda
  // fecha/hora/veterinariaId/profesionalId: todo eso ya está fijo en el
  // turno_id elegido.
  const reservarTurno = async () => {
    const token = obtenerToken();
    const turnoId = idDeTurno(turnoConcretoElegido);

    const payload = {
      mascotaId: mascotaSeleccionadaId,
      motivo: servicioElegido?.nombre || "",
      notas: notas || undefined,
    };

    const response = await fetch(`${API_URL}/turnos/${turnoId}/reservar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      throw new Error(resultado.message || "Error al reservar el turno");
    }

    const mascotaElegida = mascotas.find((m) => idDeMascota(m) === mascotaSeleccionadaId);
    setMascotaConfirmadaNombre(mascotaElegida?.nombre || "tu mascota");

    setTurnosDisponibles((prev) =>
      prev.filter((t) => idDeTurno(t) !== turnoId)
    );

    return resultado.data.turno;
  };

  const handleConfirmarTurnoFinal = async (e) => {
    e.preventDefault();
    if (!turnoConcretoElegido) {
      alert("Elegí un profesional para continuar.");
      return;
    }
    if (!mascotaSeleccionadaId) {
      alert("Elegí una mascota para continuar.");
      return;
    }

    try {
      await reservarTurno();
      handleCloseConfirm();
      setIsSuccessOpen(true);
    } catch (err) {
      alert(err.message || "Hubo un problema al agendar el turno.");
    }
  };

  const handlePagarAhora = async () => {
    if (!turnoConcretoElegido) {
      alert("Elegí un profesional para continuar.");
      return;
    }
    if (!mascotaSeleccionadaId) {
      alert("Elegí una mascota para continuar.");
      return;
    }

    setErrorPago("");

    try {
      const turnoCreado = await reservarTurno();
      handleCloseConfirm();

      setProcesandoPago(true);

      try {
        // módulo de pagos todavía no está migrado a Postgres
        // Cuando se migre pagos, confirmar que este flujo siga funcionando.
        const respuestaPago = await crearPreferenciaPago(idDeTurno(turnoCreado));
        const initPoint = respuestaPago.data?.init_point;

        if (!initPoint) {
          throw new Error("No se recibió el enlace de MercadoPago.");
        }

        window.location.href = initPoint;
      } catch (pagoError) {
        console.error("Error al crear la preferencia de pago:", pagoError);
        setProcesandoPago(false);
        setErrorPago(
          pagoError.response?.data?.message ||
          pagoError.message ||
          "El turno fue creado, pero no pudimos iniciar el pago. Podés pagarlo más tarde desde 'Mis Turnos'."
        );
      }
    } catch (err) {
      alert(err.message || "Hubo un problema al agendar el turno.");
    }
  };

  const obtenerFechaFormateada = () => {
    if (!turnoSeleccionado) return "";
    const diaCompleto =
      NOMBRES_DIAS_COMPLETO[turnoSeleccionado.dia.nom] ||
      turnoSeleccionado.dia.nom;
    return `${diaCompleto}, ${turnoSeleccionado.dia.num} de ${turnoSeleccionado.dia.mes} a las ${turnoSeleccionado.hora}hs`;
  };

  if (loading && !veterinaria) {
    return (
      <div className={styles.layout} style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Cargando clínica y agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.layout} style={{ justifyContent: "center", alignItems: "center" }}>
        <p>{error}</p>
      </div>
    );
  }
  if (procesandoPago) {
    return (
      <div className={styles.pagoLoadingOverlay}>
        <div className={styles.pagoLoadingCard}>
          <div className={styles.pagoSpinner}></div>

          <h2>Preparando tu pago...</h2>

          <p>
            Estamos generando el checkout seguro de MercadoPago.
          </p>

          <span>Te vamos a redirigir automáticamente.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar role="tutor" title="Turnos" />

      <div className={styles.pageWrapper}>
        <TopBar title="Turnos" />

        <main className={styles.content}>
          {/* HEADER DE LA VETERINARIA */}
          <section className={styles.headerVeterinaria}>
            <button
              type="button"
              className={styles.botonVolver}
              onClick={handleVolver}
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>

            <div className={styles.infoVeterinaria}>
              <h1 className={styles.nombreVeterinaria}>
                {veterinaria?.nombre || "Cargando Veterinaria..."}
              </h1>
              <p className={styles.direccionVeterinaria}>
                {veterinaria?.direccion || "Cargando Dirección..."}
              </p>
            </div>
          </section>

          {/* CARD PRINCIPAL DE AGENDA */}
          <section className={styles.cardCalendario}>
            <div className={styles.cardHeader}>
              <div className={styles.filaTituloNav}>
                <h2 className={styles.tituloCalendario}>¿Qué necesitás?</h2>

                <div className={styles.navControlesPlaceholder}>
                  {servicioSeleccionadoId && (
                    <div className={styles.navControles}>
                      <button
                        type="button"
                        className={styles.btnNav}
                        onClick={handleSemanaAnterior}
                        aria-label="Semana anterior"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className={styles.btnNav}
                        onClick={handleSemanaSiguiente}
                        aria-label="Semana siguiente"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.filaBuscador}>
                <div className={styles.searchBox}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Buscar servicio..."
                    value={busquedaServicio}
                    onChange={(e) => setBusquedaServicio(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
            </div>

            {categoriasUnicas.length > 2 && (
              <div className={styles.categoriasScroll}>
                {categoriasUnicas.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.tabCategoria} ${categoriaSeleccionada === cat ? styles.tabCategoriaActiva : ""
                      }`}
                    onClick={() => setCategoriaSeleccionada(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.chipsScrollContainer}>
              {serviciosFiltrados.length === 0 ? (
                <p className={styles.sinServiciosText}>
                  No encontramos servicios que coincidan con la búsqueda.
                </p>
              ) : (
                serviciosFiltrados.map((s) => {
                  const id = idDeServicio(s);
                  const seleccionado = id === servicioSeleccionadoId;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.chipServicio} ${seleccionado ? styles.chipActivo : ""
                        }`}
                      onClick={() => setServicioSeleccionadoId(id)}
                    >
                      <span className={styles.chipNombre}>{s.nombre}</span>
                      <span className={styles.chipPrecio}>${s.precio}</span>
                    </button>
                  );
                })
              )}
            </div>

            {!servicioSeleccionadoId ? (
              <div className={styles.estadoVacio}>
                <p>Seleccioná un servicio arriba para ver los horarios disponibles esta semana.</p>
              </div>
            ) : (
              <>
                {loadingTurnos ? (
                  <div className={styles.estadoCargando}>
                    <p>Cargando turnos disponibles...</p>
                  </div>
                ) : (
                  <div className={styles.calendarioContainer}>
                    <div className={styles.diasHeader}>
                      <div className={styles.espacioHora}></div>
                      {diasSemana.map((dia) => (
                        <div
                          key={dia.fechaStr}
                          className={`${styles.diaColumna} ${dia.activo ? styles.diaColumnaActivo : ""
                            }`}
                        >
                          <span className={styles.diaNombre}>{dia.nom}</span>
                          <span className={styles.diaNumero}>{dia.num}</span>
                          <span className={styles.diaMes}>{dia.mes}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.gridHorariosScroll}>
                      {horasVisibles.length === 0 ? (
                        <p className={styles.sinTurnosText}>
                          No hay turnos disponibles para este servicio en esta semana.
                        </p>
                      ) : (
                        horasVisibles.map((hora) => (
                          <div key={hora} className={styles.filaHorario}>
                            <span className={styles.horaLabel}>{hora}</span>
                            {diasSemana.map((dia) => {
                              const opciones =
                                turnosPorDiaYHora[dia.fechaStr]?.[hora] || [];
                              const disponible = opciones.length > 0;

                              return (
                                <button
                                  key={`${dia.fechaStr}-${hora}`}
                                  type="button"
                                  className={`${styles.slotTurno} ${disponible
                                    ? styles.slotDisponible
                                    : styles.slotNoDisponible
                                    }`}
                                  disabled={!disponible}
                                  onClick={() => handleSlotClick(dia, hora)}
                                  title={
                                    disponible
                                      ? `${opciones.length} profesional(es) disponible(s)`
                                      : undefined
                                  }
                                >
                                  {disponible ? (
                                    <span style={{ fontWeight: "bold" }}>✓</span>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>

                    <div className={styles.leyendaCalendario}>
                      <div className={styles.leyendaItem}>
                        <div
                          className={`${styles.leyendaCuadro} ${styles.slotDisponible}`}
                        >
                          <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                            ✓
                          </span>
                        </div>
                        <span>Disponible</span>
                      </div>
                      <div className={styles.leyendaItem}>
                        <div
                          className={`${styles.leyendaCuadro} ${styles.slotNoDisponible}`}
                        >
                          -
                        </div>
                        <span>No disponible</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MODAL CONFIRMACIÓN */}
            {isConfirmOpen && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContainer}>
                  <button
                    type="button"
                    className={styles.modalCerrar}
                    aria-label="Cerrar modal"
                    onClick={handleCloseConfirm}
                  >
                    ✕
                  </button>

                  <h3 className={styles.modalTitulo}>Confirmar turno</h3>
                  <p className={styles.modalDescripcion}>
                    {servicioElegido?.nombre} en {veterinaria?.nombre}
                  </p>

                  <div className={styles.modalBadgeFecha}>
                    <span>{obtenerFechaFormateada()}</span>
                  </div>

                  <form
                    className={styles.modalForm}
                    onSubmit={handleConfirmarTurnoFinal}
                  >
                    <div className={styles.formGroup}>
                      <Select
                        label="Profesional"
                        placeholder="Seleccioná un profesional"
                        value={turnoIdSeleccionado}
                        onChange={(e) => setTurnoIdSeleccionado(e.target.value)}
                        opciones={(turnoSeleccionado?.opciones || []).map((turno) => {
                          // El profesional ya viene embebido en el turno
                          // (turno.profesional), no hace falta cruzarlo
                          // contra mapaProfesionales — pero se deja el
                          // fallback por si el shape todavía varía.
                          const prof = turno.profesional || mapaProfesionales[turno.profesional_id];
                          return {
                            value: idDeTurno(turno),
                            label: prof?.especialidad
                              ? `${prof?.nombre || "Profesional"} ${prof?.apellido || ""} · ${prof.especialidad}`
                              : `${prof?.nombre || "Profesional"} ${prof?.apellido || ""}`.trim(),
                          };
                        })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <Select
                        label="Mascota"
                        placeholder="Seleccioná una mascota"
                        value={mascotaSeleccionadaId}
                        onChange={(e) => setMascotaSeleccionadaId(e.target.value)}
                        opciones={mascotas.map((m) => ({
                          value: idDeMascota(m),
                          label: `${m.nombre} · ${m.especie || m.raza?.especie?.nombre || ""}`,
                        }))}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Notas (opcional)</label>
                      <textarea
                        className={styles.modalSelect}
                        rows={2}
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Algo que quieras contarle a la veterinaria..."
                      />
                    </div>

                    {turnoConcretoElegido && (
                      <p className={styles.modalDescripcion}>
                        Precio del servicio: ${turnoConcretoElegido.monto_servicio}
                      </p>
                    )}

                    <p className={styles.modalDescripcion}>
                      Vas a tener {PLAZO_PAGO_HORAS}hs para pagar este turno antes de
                      que se libere automáticamente.
                    </p>

                    <div className={styles.modalAcciones}>
                      <button type="button" className={styles.btnCancelar} onClick={handleCloseConfirm}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className={styles.btnCancelar}
                        onClick={handlePagarAhora}
                        disabled={procesandoPago}
                      >
                        {procesandoPago ? "Procesando..." : "Pagar ahora"}
                      </button>
                      <button type="submit" className={styles.btnConfirmar}>
                        Confirmar turno
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {errorPago && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContainer}>
                  <p style={{ color: "#ef4444", fontWeight: 600 }}>{errorPago}</p>
                  <button className={styles.btnConfirmar} onClick={() => setErrorPago("")}>
                    Entendido
                  </button>
                </div>
              </div>
            )}

            {/* MODAL ÉXITO */}
            <SuccessModal
              abierto={isSuccessOpen}
              titulo="¡Turno reservado!"
              mensaje={`Tu turno para ${mascotaConfirmadaNombre || "tu mascota"} quedó reservado. Tenés ${PLAZO_PAGO_HORAS}hs para pagarlo desde "Mis Turnos" o se libera automáticamente.`}
              textoBoton="Entendido"
              onClose={() => setIsSuccessOpen(false)}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default AgendarTurnos;