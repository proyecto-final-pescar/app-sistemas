import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";

import Modal from "../../../components/layout/modal/Modal";
import Select from "../../../components/ui/select/Select";
import Button from "../../../components/ui/button/Button";
import SuccessModal from "../../../components/ui/success-modal/SuccessModal";
import { crearPreferenciaPago } from "../../../services/pagoService";

import styles from "../../../styles/AgendarTurno.module.css";
const API_URL = import.meta.env.VITE_API_URL;  

// Helper para formatear fechas a YYYY-MM-DD sin desfasajes de zona horaria
const formatearFechaId = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Verifica si un turno (fecha + hora) respeta la antelación mínima de 24hs desde ahora
const cumpleAntelacionMinima = (fechaStr, hora) => {
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const fechaHoraTurno = new Date(anio, mes - 1, dia, hh, mm); // hora local

  const limiteMinimo = new Date(Date.now() + 24 * 60 * 60 * 1000); // ahora + 24hs

  return fechaHoraTurno >= limiteMinimo;
};

// Helper centralizado para leer el JWT (evita repetir localStorage.getItem en cada fetch)
const obtenerToken = () => localStorage.getItem("token");

// Tablas de nombres usadas en toda la vista (fuera del componente: no se recrean en cada render)
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
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const AgendarTurnos = () => {
  const navigate = useNavigate();
  const { veterinariaId } = useParams(); // Obtenemos el ID dinámico de la URL

  // --- Estados del Negocio (Base de Datos) ---
  const [veterinaria, setVeterinaria] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [disponibilidadSemanal, setDisponibilidadSemanal] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados de la Interfaz y Formulario ---
  const [fechaInicioSemana, setFechaInicioSemana] = useState(() => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const offset = (diaSemana + 6) % 7; // días transcurridos desde el lunes de esta semana
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - offset);
    return lunes;
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [turnoCreadoId, setTurnoCreadoId] = useState(null);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [servicio, setServicio] = useState("");
  const [mascotaSeleccionadaId, setMascotaSeleccionadaId] = useState("");
  const [mascotaConfirmadaNombre, setMascotaConfirmadaNombre] = useState("");

  // --- Generación dinámica de la estructura de los 7 días visibles ---
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
        activo: fechaStr === hoyStr, // Resalta el día de hoy si cae en la semana visible
      };
    });
  }, [fechaInicioSemana]);

  // Extrae dinámicamente las horas que el backend ya calculó y envió
  const horasVisibles = useMemo(() => {
    const todasLasHoras = new Set();

    // Recorremos los días de la semana y extraemos las horas que devolvió el backend
    Object.values(disponibilidadSemanal).forEach((listaHoras) => {
      if (Array.isArray(listaHoras)) {
        listaHoras.forEach((hora) => todasLasHoras.add(hora));
      }
    });

    return Array.from(todasLasHoras).sort();
  }, [disponibilidadSemanal]);

  // --- Obtención de datos del Servidor (Carga Inicial y paginación) ---
  useEffect(() => {
    let cancelado = false;

    const cargarDatosYDisponibilidad = async () => {
      try {
        setLoading(true);
        const token = obtenerToken();
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Obtener datos de la veterinaria y mascotas en paralelo (solo la primera vez)
        if (!veterinaria) {
          const [resVetRaw, resMascotasRaw] = await Promise.all([
            fetch(`${API_URL}/veterinarias/${veterinariaId}`, { headers }),
            fetch(`${API_URL}/mascotas`, { headers }),
          ]);

          if (!resVetRaw.ok) {
            const texto = await resVetRaw.text();
            console.error("Fallo GET veterinarias:", resVetRaw.status, texto);
            throw new Error(`Error ${resVetRaw.status} al buscar la veterinaria`);
          }
          if (!resMascotasRaw.ok) {
            const texto = await resMascotasRaw.text();
            console.error("Fallo GET mascotas:", resMascotasRaw.status, texto);
            throw new Error(`Error ${resMascotasRaw.status} al buscar mascotas`);
          }

          const [resVet, resMascotas] = await Promise.all([
            resVetRaw.json(),
            resMascotasRaw.json(),
          ]);

          if (cancelado) return;

          if (!resVet.success) {
            setError(
              resVet.message ||
                "No pudimos cargar los datos de esta veterinaria. Intentá de nuevo más tarde.",
            );
            setLoading(false);
            return;
          }
          setVeterinaria(resVet.data);
          setMascotas(Array.isArray(resMascotas) ? resMascotas : []);
        }

        // 2. Resolver concurrencia de turnos para los 7 días mapeados en pantalla
        const hoyStr = formatearFechaId(new Date()); // Obtenemos el string de hoy ("2026-07-06")

        const promesasDisponibilidad = diasSemana.map((dia) => {
          // IF DE SEGURIDAD: Si el día ya pasó o es el día de hoy, evitamos pegarle a la API
          if (dia.fechaStr <= hoyStr) {
            return Promise.resolve({
              fechaStr: dia.fechaStr,
              horarios: [], // Devolvemos vacío localmente sin generar errores 400
            });
          }

          // Si es un día futuro, hacemos la consulta normal al backend
          return fetch(
            `${API_URL}/disponibilidad/${veterinariaId}?fecha=${dia.fechaStr}`,
            { headers },
          )
            .then((r) => r.json())
            .then((res) => ({
              fechaStr: dia.fechaStr,
              horarios: (res.data?.horariosDisponibles || []).filter((hora) =>
                cumpleAntelacionMinima(dia.fechaStr, hora),
              ),
            }));
        });

        const resultados = await Promise.all(promesasDisponibilidad);

        if (cancelado) return;

        // Transformar el array de respuestas en un mapa llave-valor { "2026-07-06": ["09:00", "10:30"] }
        const mapaDisponibilidad = resultados.reduce((acc, curr) => {
          acc[curr.fechaStr] = curr.horarios;
          return acc;
        }, {});

        setDisponibilidadSemanal(mapaDisponibilidad);
        setError(null);
      } catch (err) {
        if (cancelado) return;
        console.error("Error cargando datos del dashboard de turnos:", err);
        setError(
          "No se pudo cargar la grilla de turnos. Intentá de nuevo más tarde.",
        );
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    if (veterinariaId) {
      cargarDatosYDisponibilidad();
    }

    return () => {
      cancelado = true;
    };
  }, [veterinariaId, fechaInicioSemana]);

  // --- Navegación de semanas ---
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
    setTurnoSeleccionado({ dia, hora });
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setServicio("");
    setMascotaSeleccionadaId("");
  };

  // --- Persistencia: Guardar Turno en MongoDB ---
const handleConfirmarTurnoFinal = async (e) => {
  e.preventDefault();

  setErrorPago("");

  try {
    const token = obtenerToken();

    const payload = {
      fecha: turnoSeleccionado.dia.fechaStr,
      hora: turnoSeleccionado.hora,
      motivo: servicioElegido?.nombre || "Consulta veterinaria",
      mascotaId: mascotaSeleccionadaId,
      veterinariaId: veterinariaId,
      servicioId: servicio,
    };

    // 1. Crear el turno
    const response = await fetch(`${API_URL}/turnos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      throw new Error(
        resultado.message || "Error al reservar el turno"
      );
    }

    const turnoId = resultado.data?.turno?._id;

    if (!turnoId) {
      throw new Error("No se pudo identificar el turno creado.");
    }

    // Guardamos el ID: aunque MercadoPago falle,
    // el turno ya existe y no se pierde.
    setTurnoCreadoId(turnoId);

    setMascotaConfirmadaNombre(
      mascotaElegida?.nombre || "tu mascota"
    );

    setDisponibilidadSemanal((prev) => ({
      ...prev,
      [turnoSeleccionado.dia.fechaStr]: (
        prev[turnoSeleccionado.dia.fechaStr] || []
      ).filter((h) => h !== turnoSeleccionado.hora),
    }));

    setIsConfirmOpen(false);

    // 2. Empezar proceso de pago
    setProcesandoPago(true);

    try {
      const respuestaPago = await crearPreferenciaPago(turnoId);

      const initPoint = respuestaPago.data?.init_point;

      if (!initPoint) {
        throw new Error(
          "No se recibió el enlace de MercadoPago."
        );
      }

      // 3. Redirección al checkout externo
      window.location.href = initPoint;
    } catch (pagoError) {
      console.error(
        "Error al crear la preferencia de pago:",
        pagoError
      );

      setProcesandoPago(false);

      setErrorPago(
        pagoError.response?.data?.message ||
          pagoError.message ||
          "El turno fue creado, pero no pudimos iniciar el pago. Intentá nuevamente."
      );
    }
  } catch (err) {
    console.error("Error al reservar turno:", err);

    setProcesandoPago(false);

    alert(
      err.message ||
        "Hubo un problema al agendar el turno. Revisá los datos."
    );
  }
};

  const obtenerFechaFormateada = () => {
    if (!turnoSeleccionado) return "";
    const diaCompleto =
      NOMBRES_DIAS_COMPLETO[turnoSeleccionado.dia.nom] ||
      turnoSeleccionado.dia.nom;
    return `${diaCompleto}, ${turnoSeleccionado.dia.num} de ${turnoSeleccionado.dia.mes} a las ${turnoSeleccionado.hora}hs`;
  };

  const mascotaElegida = mascotas.find((m) => m._id === mascotaSeleccionadaId);
  const servicioElegido = veterinaria?.servicios?.find((s) => s._id === servicio);

  if (loading && !veterinaria) {
    return (
      <div
        className={styles.layout}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <p>Cargando clínica y agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={styles.layout}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
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
          {/* ------ INICIO: CABECERA CON NOMBRE Y DATOS DE LA VETERINARIA ------ */}
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

          {/* ------ INICIO: ÁREA DEL CALENDARIO / GRILLA DE TURNOS ------ */}
          <section className={styles.cardCalendario}>
            <h2 className={styles.tituloCalendario}>Turnos disponibles</h2>

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

            <div className={styles.calendarioContainer}>
              {/* ------ INICIO: CABECERA DE LOS DÍAS DE LA SEMANA (DOM a SAB) ------ */}
              <div className={styles.diasHeader}>
                <div className={styles.espacioHora}></div>
                {diasSemana.map((dia) => (
                  <div
                    key={dia.fechaStr}
                    className={`${styles.diaColumna} ${dia.activo ? styles.diaColumnaActivo : ""}`}
                  >
                    <span className={styles.diaNombre}>{dia.nom}</span>
                    <span className={styles.diaNumero}>{dia.num}</span>
                    <span className={styles.diaMes}>{dia.mes}</span>
                  </div>
                ))}
              </div>

              {/* ------ INICIO: FILAS DE HORARIOS (SLOTS) ------ */}
              <div className={styles.gridHorariosScroll}>
                {horasVisibles.map((hora) => (
                  <div key={hora} className={styles.filaHorario}>
                    <span className={styles.horaLabel}>{hora}</span>
                    {diasSemana.map((dia) => {
                      const horasDisponiblesDelDia =
                        disponibilidadSemanal[dia.fechaStr] || [];
                      // Verificamos si la hora de la fila actual está en los disponibles devueltos por el backend
                      const disponible = horasDisponiblesDelDia.includes(hora);

                      return (
                        <button
                          key={`${dia.fechaStr}-${hora}`}
                          type="button"
                          className={`${styles.slotTurno} ${disponible ? styles.slotDisponible : styles.slotNoDisponible}`}
                          disabled={!disponible}
                          onClick={() => handleSlotClick(dia, hora)}
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
                ))}
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

            {/* ------ INICIO: MODAL DE CONFIRMACIÓN DEL FORMULARIO ------ */}
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
                    Completá los datos para confirmar tu turno en{" "}
                    {veterinaria?.nombre}
                  </p>

                  <div className={styles.modalBadgeFecha}>
                    <span>{obtenerFechaFormateada()}</span>
                  </div>

                  <form
                    className={styles.modalForm}
                    onSubmit={handleConfirmarTurnoFinal}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Servicio / Motivo
                      </label>
                      <div className={styles.selectWrapper}>
                       <select
                        className={styles.modalSelect}
                        value={servicio}
                        onChange={(e) => setServicio(e.target.value)}
                        required
                        >
                        <option value="" disabled hidden>
                        Seleccionar servicio
                        </option>

                        {veterinaria?.servicios?.map((servicioVet) => (
                        <option key={servicioVet._id} value={servicioVet._id}>
                        {servicioVet.nombre}
                        {servicioVet.precio ? ` - $${servicioVet.precio}` : ""}
                        </option>
                        ))}
                      </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Mascota</label>
                      <div className={styles.selectWrapper}>
                        <select
                          className={styles.modalSelect}
                          value={mascotaSeleccionadaId}
                          onChange={(e) =>
                            setMascotaSeleccionadaId(e.target.value)
                          }
                          required
                        >
                          <option value="" disabled hidden>
                            Seleccionar mascota
                          </option>
                          {mascotas.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.nombre} ({m.especie})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.modalAcciones}>
                      {servicioElegido && mascotaElegida && (
                      <div className={styles.resumenPago}>
                        <h4>Resumen de la reserva</h4>

                        <div className={styles.resumenFila}>
                          <span>Veterinaria</span>
                          <strong>{veterinaria?.nombre}</strong>
                        </div>

                        <div className={styles.resumenFila}>
                          <span>Mascota</span>
                          <strong>{mascotaElegida.nombre}</strong>
                        </div>

                        <div className={styles.resumenFila}>
                          <span>Fecha y hora</span>
                          <strong>{obtenerFechaFormateada()}</strong>
                        </div>

                        <div className={styles.resumenFila}>
                          <span>Servicio</span>
                          <strong>{servicioElegido.nombre}</strong>
                        </div>

                        <div className={`${styles.resumenFila} ${styles.resumenTotal}`}>
                          <span>Total</span>
                          <strong>
                            ${Number(servicioElegido.precio || 0).toLocaleString("es-AR")}
                          </strong>
                        </div>

                        <p className={styles.resumenAviso}>
                          Al confirmar vas a ser redirigido a MercadoPago para completar el pago.
                        </p>
                      </div>
                    )}
                   <button type="button"className={styles.btnCancelar} onClick={handleCloseConfirm}>
                    Cancelar
                  </button>

                  <button type="submit"className={styles.btnConfirmar}disabled={procesandoPago}>
                  {procesandoPago ? "Procesando pago..." : "Confirmar reserva y pagar"}
                  </button>
                  </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL DE ÉXITO (usa el nombre guardado aparte, ver mascotaConfirmadaNombre) */}
            <SuccessModal
              abierto={isSuccessOpen}
              titulo="¡Turno Agendado!"
              mensaje={`Tu turno para ${mascotaConfirmadaNombre || "tu mascota"} ha sido registrado con éxito.`}
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
