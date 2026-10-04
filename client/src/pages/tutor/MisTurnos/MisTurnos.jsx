import { useEffect, useState } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import ConfirmModal from "../../../components/ui/confirm-modal/ConfirmModal";
import DetalleTurnoModal from "../../../components/ui/detalle-turno-modal/DetalleTurnoModal";
import SuccessModal from "../../../components/ui/success-modal/SuccessModal"; // 1. IMPORTAR SUCCESS MODAL
import { FaCalendarAlt, FaClock, FaHospital, FaPaw, FaUserMd } from "react-icons/fa";
import {
  obtenerTurnosPaginadosPorUsuario,
  cancelarTurno,
  pagarEfectivo,
} from "../../../services/turnosService";
import { crearPreferenciaPago } from "../../../services/pagosService";
import SelectorMetodoPago from "../../../components/pagos/SelectorMetodoPago";
import {
  formatearDiaMes,
  formatearFechaLarga,
  ESTADO_BADGE,
} from "../../../utils/turnos";
import styles from "./MisTurnos.module.css";

const TURNOS_POR_PAGINA = 10;

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [turnoMasProximo, setTurnoMasProximo] = useState(null);
  // Se incrementa después de cancelar o pagar para volver a pedir lista y banner
  const [recarga, setRecarga] = useState(0);
  const [tab, setTab] = useState("proximos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState(null);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [pagando, setPagando] = useState(null);
  const [turnoParaPagar, setTurnoParaPagar] = useState(null);
  const [errorAccion, setErrorAccion] = useState("");
  const [mensajeCancelacion, setMensajeCancelacion] = useState(null);
  const [turnoDetalle, setTurnoDetalle] = useState(null);

  // 2. ESTADOS PARA EL SUCCESS MODAL EN EFECTIVO
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [turnoConfirmadoEfectivo, setTurnoConfirmadoEfectivo] = useState(null);

  // Lista de la pestaña activa (una página por vez; filtra y ordena el backend)
  useEffect(() => {
    let cancelado = false;

    const cargarTurnos = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await obtenerTurnosPaginadosPorUsuario({
          tab,
          pagina,
          limite: TURNOS_POR_PAGINA,
        });
        if (cancelado) return;

        // Si la página quedó vacía (ej. se canceló el último de la página), retrocede
        if (data.turnos.length === 0 && pagina > 1) {
          setPagina(pagina - 1);
          return;
        }

        setTurnos(data.turnos);
        setTotal(data.total);
        setTotalPaginas(data.totalPaginas);
      } catch {
        if (!cancelado) setError("No se pudieron cargar los turnos. Intentá de nuevo.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargarTurnos();
    return () => {
      cancelado = true;
    };
  }, [tab, pagina, recarga]);

  // Banner del próximo turno: independiente de la pestaña y de la página
  useEffect(() => {
    let cancelado = false;

    const cargarBanner = async () => {
      try {
        const data = await obtenerTurnosPaginadosPorUsuario({
          tab: "proximos",
          pagina: 1,
          limite: 1,
        });
        if (!cancelado) setTurnoMasProximo(data.turnos[0] || null);
      } catch {
        if (!cancelado) setTurnoMasProximo(null);
      }
    };

    cargarBanner();
    return () => {
      cancelado = true;
    };
  }, [recarga]);

  useEffect(() => {
    const cerrarMenu = () => setMenuAbierto(null);
    document.addEventListener("click", cerrarMenu);
    return () => document.removeEventListener("click", cerrarMenu);
  }, []);

  const cambiarTab = (nuevaTab) => {
    setTab(nuevaTab);
    setPagina(1);
  };

  const handleCancelar = async () => {
    if (!modalCancelar) return;

    setCancelando(modalCancelar);
    setModalCancelar(null);

    try {
      const { reembolso } = await cancelarTurno(modalCancelar);
      // El turno cambia de pestaña: se vuelve a pedir lista y banner
      setRecarga((r) => r + 1);

      if (!reembolso) {
        setMensajeCancelacion("Turno cancelado correctamente.");
      } else if (reembolso.estado === "APR") {
        setMensajeCancelacion(`Turno cancelado. Se reembolsaron $${reembolso.monto} a tu medio de pago.`);
      } else {
        setMensajeCancelacion(`Turno cancelado. Tu reembolso de $${reembolso.monto} está siendo procesado.`);
      }
    } catch (err) {
      const mensaje = err.response?.data?.message || "No se pudo cancelar el turno.";
      setErrorAccion(mensaje);
    } finally {
      setCancelando(null);
    }
  };

  const handleAbrirSelectorPago = (turno) => {
    setMenuAbierto(null);
    setTurnoParaPagar(turno);
  };

  const handlePagarConMercadoPago = async () => {
    const turnoId = turnoParaPagar.turno_id;
    setTurnoParaPagar(null);
    if (pagando) return;
    setPagando(turnoId);

    try {
      const respuesta = await crearPreferenciaPago(turnoId);
      const initPoint = respuesta?.init_point;

      if (!initPoint) {
        throw new Error("No se recibió el enlace de MercadoPago.");
      }

      window.location.href = initPoint;
    } catch (err) {
      const mensaje =
        err.response?.data?.message ||
        err.message ||
        "No se pudo iniciar el pago. Intentá de nuevo.";
      setErrorAccion(mensaje);
      setPagando(null);
    }
  };

  // 3. ACTUALIZAR HANDLER DE PAGO EN EFECTIVO
  const handlePagarEnEfectivo = async () => {
    const turnoSeleccionado = turnoParaPagar;
    const turnoId = turnoSeleccionado.turno_id;
    
    setTurnoParaPagar(null);
    if (pagando) return;
    setPagando(turnoId);

    try {
      await pagarEfectivo({ turnoId });
      // El estado cambió a confirmado: se vuelve a pedir lista y banner
      setRecarga((r) => r + 1);
      
      // Guardar el turno para armar el mensaje e indicar éxito
      setTurnoConfirmadoEfectivo(turnoSeleccionado);
      setIsSuccessOpen(true);
    } catch (err) {
      const mensaje =
        err.response?.data?.message || "No se pudo confirmar el pago en efectivo.";
      setErrorAccion(mensaje);
    } finally {
      setPagando(null);
    }
  };

  // Un PEN con el plazo vencido ya no se puede pagar (el cron lo libera):
  // se oculta la acción en vez de ofrecer algo que el backend va a rechazar.
  const pagoVencido = (turno) =>
    turno?.estado_turno_id === "PEN" &&
    turno?.vence_en &&
    new Date(turno.vence_en) <= new Date();

  return (
    <div className={styles.shell}>
      <Sidebar role="tutor" activeItem="Turnos" title="Mis turnos" />
      <div className={styles.main}>
        <TopBar title="Mis turnos" notifications={0} />

        <div className={styles.content}>

          {/* Tabs */}
          <div className={styles.tabs}>
            <Button
              texto="Próximos"
              variante={tab === "proximos" ? "primario" : "secundario"}
              tamaño="chico"
              onClick={() => cambiarTab("proximos")}
            />
            <Button
              texto="Pasados"
              variante={tab === "pasados" ? "primario" : "secundario"}
              tamaño="chico"
              onClick={() => cambiarTab("pasados")}
            />
          </div>

          {/* Banner próximo turno */}
          {turnoMasProximo && (
            <div className={styles.banner}>
              <div className={styles.bannerInfo}>
                <div className={styles.bannerIcon}>
                  <FaPaw size={22} color="white" />
                </div>
                <div>
                  <p className={styles.bannerLabel}>Próximo turno</p>
                  <p className={styles.bannerTitulo}>
                    {turnoMasProximo.motivo} · {turnoMasProximo.mascota?.nombre || "Mascota"}
                  </p>
                  <p className={styles.bannerMeta}>
                    <span>
                      <FaCalendarAlt size={12} color="rgba(255,255,255,0.85)" />{" "}
                      {formatearFechaLarga(turnoMasProximo.fecha)}
                    </span>
                    <span>
                      <FaClock size={12} color="rgba(255,255,255,0.85)" />{" "}
                      {turnoMasProximo.hora_inicio} hs
                    </span>
                    <span>
                      <FaHospital size={12} color="rgba(255,255,255,0.85)" />{" "}
                      {turnoMasProximo.veterinaria?.nombre || "Veterinaria"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Botones del banner */}
              <div className={styles.bannerAcciones}>
                <button
                  className={styles.bannerBtn}
                  onClick={() => setTurnoDetalle(turnoMasProximo)}
                >
                  Ver detalles
                </button>
                {turnoMasProximo.estado_turno_id === "PEN" && !pagoVencido(turnoMasProximo) && (
                  <button
                    className={`${styles.bannerBtn} ${styles.bannerBtnPagar}`}
                    onClick={() => handleAbrirSelectorPago(turnoMasProximo)}
                    disabled={pagando === turnoMasProximo.turno_id}
                  >
                    {pagando === turnoMasProximo.turno_id ? "Procesando..." : "Pagar"}
                  </button>
                )}
                {new Date(turnoMasProximo.fecha) > new Date() &&
                  turnoMasProximo.estado_turno_id !== "CAN" &&
                  turnoMasProximo.estado_turno_id !== "ATE" && (
                    <button
                      className={`${styles.bannerBtn} ${styles.bannerBtnCancelar}`}
                      onClick={() => setModalCancelar(turnoMasProximo.turno_id)}
                      disabled={cancelando === turnoMasProximo.turno_id}
                    >
                      {cancelando === turnoMasProximo.turno_id ? "Cancelando..." : "Cancelar"}
                    </button>
                  )}
              </div>
            </div>
          )}

          {/* Lista de turnos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {total} turno{total !== 1 ? "s" : ""}{" "}
              {tab === "proximos" ? "programados" : "registrados"}
            </div>

            {loading && <p className={styles.estadoVacio}>Cargando turnos...</p>}
            {!loading && error && <p className={styles.estadoVacio}>{error}</p>}
            {!loading && !error && turnos.length === 0 && (
              <p className={styles.estadoVacio}>
                No hay turnos {tab === "proximos" ? "próximos" : "pasados"} para mostrar.
              </p>
            )}

            {!loading && !error && turnos.map((turno) => {
              const { dia, mes } = formatearDiaMes(turno.fecha);
              const badge = ESTADO_BADGE[turno.estado_turno_id];
              const esFuturo = new Date(turno.fecha) > new Date();
              const puedeCancelar = esFuturo && turno.estado_turno_id !== "CAN" && turno.estado_turno_id !== "ATE";

              return (
                <div key={turno.turno_id} className={styles.turnoRow}>
                  <div className={styles.fechaBox}>
                    <span className={styles.fechaDia}>{dia}</span>
                    <span className={styles.fechaMes}>{mes}</span>
                  </div>

                  <div className={styles.turnoInfo}>
                    <div className={styles.turnoTags}>
                      {badge && <Badge texto={badge.texto} variante={badge.variante} />}
                      <span className={styles.turnoMascota}>
                        <FaPaw size={12} color="#6b7280" />{" "}
                        {turno.mascota?.nombre || "Mascota"}
                      </span>
                    </div>
                    <p className={styles.turnoMotivo}>{turno.motivo}</p>
                    <p className={styles.turnoMeta}>
                      <span>
                        <FaClock size={12} color="#8276ab" />{" "}
                        {turno.hora_inicio} hs
                      </span>
                      <span>
                        <FaHospital size={12} color="#8276ab" />{" "}
                        {turno.veterinaria?.nombre || "Veterinaria"}
                      </span>
                      {turno.profesional && (
                        <span>
                          <FaUserMd size={12} color="#8276ab" />{" "}
                          {`${turno.profesional.nombre} ${turno.profesional.apellido || ""}`.trim()}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className={styles.turnoAcciones}>
                    <button
                      className={styles.menuBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAbierto(menuAbierto === turno.turno_id ? null : turno.turno_id);
                      }}
                    >
                      ⋮
                    </button>

                    {menuAbierto === turno.turno_id && (
                      <div className={styles.dropdown}>
                        <button
                          className={styles.dropdownItem}
                          onClick={() => {
                            setMenuAbierto(null);
                            setTurnoDetalle(turno);
                          }}
                        >
                          Ver detalles
                        </button>

                        {turno.estado_turno_id === "PEN" && !pagoVencido(turno) && (
                          <button
                            className={styles.dropdownItem}
                            onClick={() => handleAbrirSelectorPago(turno)}
                            disabled={pagando === turno.turno_id}
                          >
                            {pagando === turno.turno_id ? "Procesando..." : "Pagar"}
                          </button>
                        )}

                        {puedeCancelar && (
                          <button
                            className={styles.dropdownItem}
                            style={{ color: "#ef4444" }}
                            onClick={() => {
                              setMenuAbierto(null);
                              setModalCancelar(turno.turno_id);
                            }}
                            disabled={cancelando === turno.turno_id}
                          >
                            {cancelando === turno.turno_id ? "Cancelando..." : "Cancelar"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {!loading && !error && totalPaginas > 1 && (
              <div className={styles.paginacion}>
                <Button
                  type="button"
                  texto="← Anterior"
                  variante="secundario"
                  tamaño="chico"
                  disabled={pagina === 1}
                  onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                />

                <span className={styles.paginaInfo}>
                  Página {pagina} de {totalPaginas}
                </span>

                <Button
                  type="button"
                  texto="Siguiente →"
                  variante="secundario"
                  tamaño="chico"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <SelectorMetodoPago
        isOpen={Boolean(turnoParaPagar)}
        onClose={() => setTurnoParaPagar(null)}
        onElegirMercadoPago={handlePagarConMercadoPago}
        onElegirEfectivo={handlePagarEnEfectivo}
        monto={turnoParaPagar?.monto_servicio}
        procesando={pagando !== null}
      />

      {/* 4. RENDERIZADO DEL SUCCESS MODAL */}
      <SuccessModal
        abierto={isSuccessOpen}
        titulo="¡Turno confirmado!"
        mensaje={`Tu turno para ${turnoConfirmadoEfectivo?.mascota?.nombre || "tu mascota"} quedó confirmado. Recordá abonar $${turnoConfirmadoEfectivo?.monto_servicio || ""} en efectivo en el local.`}
        textoBoton="Entendido"
        onClose={() => {
          setIsSuccessOpen(false);
          setTurnoConfirmadoEfectivo(null);
        }}
      />

      {/* Modal de detalle del turno */}
      <DetalleTurnoModal
        key={turnoDetalle?.turno_id || "cerrado"}
        abierto={turnoDetalle !== null}
        turno={turnoDetalle}
        onClose={() => setTurnoDetalle(null)}
      />

      {errorAccion && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorModal}>
            <p>{errorAccion}</p>
            <button onClick={() => setErrorAccion("")}>Entendido</button>
          </div>
        </div>
      )}
      
      {mensajeCancelacion && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorModal}>
            <p>{mensajeCancelacion}</p>
            <button onClick={() => setMensajeCancelacion(null)}>Entendido</button>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      <ConfirmModal
        abierto={modalCancelar !== null}
        titulo="¿Cancelar turno?"
        mensaje="Esta acción no se puede deshacer. ¿Estás seguro que querés cancelar este turno?"
        textoConfirmar="Sí, cancelar"
        textoCancelar="Volver"
        varianteConfirmar="peligro"
        onConfirm={handleCancelar}
        onCancel={() => setModalCancelar(null)}
        confirmando={cancelando !== null}
      />
    </div>
  );
}