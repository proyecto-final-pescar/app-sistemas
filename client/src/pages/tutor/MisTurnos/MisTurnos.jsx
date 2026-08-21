import { useEffect, useState } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import ConfirmModal from "../../../components/ui/confirm-modal/ConfirmModal";
import { FaCalendarAlt, FaClock, FaHospital, FaPaw } from "react-icons/fa";
import { obtenerTurnosPorUsuario, cancelarTurno } from "../../../services/turnosService";
import {
  filtrarProximos,
  filtrarPasados,
  obtenerTurnoMasProximo,
  formatearDiaMes,
  formatearFechaLarga,
  ESTADO_BADGE,
} from "../../../utils/turnos";
import styles from "./MisTurnos.module.css";

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [tab, setTab] = useState("proximos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState(null);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  useEffect(() => {
    const cargarTurnos = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await obtenerTurnosPorUsuario();
        setTurnos(data);
      } catch (err) {
        setError("No se pudieron cargar los turnos. Intentá de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    cargarTurnos();
  }, []);

  useEffect(() => {
    const cerrarMenu = () => setMenuAbierto(null);
    document.addEventListener("click", cerrarMenu);
    return () => document.removeEventListener("click", cerrarMenu);
  }, []);

  const handleCancelar = async () => {
    if (!modalCancelar) return;

    setCancelando(modalCancelar);
    setModalCancelar(null);

    try {
      await cancelarTurno(modalCancelar);
      setTurnos((prev) =>
        prev.map((t) =>
          t._id === modalCancelar ? { ...t, estado: "cancelado" } : t
        )
      );
    } catch (err) {
      const mensaje = err.response?.data?.message || "No se pudo cancelar el turno.";
      alert(mensaje);
    } finally {
      setCancelando(null);
    }
  };

  const proximos = filtrarProximos(turnos);
  const pasados = filtrarPasados(turnos);
  const turnoMasProximo = obtenerTurnoMasProximo(turnos);
  const listaVisible = tab === "proximos" ? proximos : pasados;

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
              onClick={() => setTab("proximos")}
            />
            <Button
              texto="Pasados"
              variante={tab === "pasados" ? "primario" : "secundario"}
              tamaño="chico"
              onClick={() => setTab("pasados")}
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
                    {turnoMasProximo.motivo} · {turnoMasProximo.mascotaId?.nombre || "Mascota"}
                  </p>
                  <p className={styles.bannerMeta}>
                    <span>
                      <FaCalendarAlt size={12} color="rgba(255,255,255,0.85)" />{" "}
                      {formatearFechaLarga(turnoMasProximo.fecha)}
                    </span>
                    <span>
                      <FaClock size={12} color="rgba(255,255,255,0.85)" />{" "}
                      {turnoMasProximo.hora} hs
                    </span>
                    <span>
                      <FaHospital size={12} color="rgba(255,255,255,0.85)" />{" "}
                      {turnoMasProximo.veterinariaId?.nombre || "Veterinaria"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Botones del banner */}
              <div className={styles.bannerAcciones}>
                <button className={styles.bannerBtn}>Ver detalles</button>
                {turnoMasProximo.estado === "pendiente" && (
                  <button className={`${styles.bannerBtn} ${styles.bannerBtnPagar}`}>
                    Pagar
                  </button>
                )}
                {new Date(turnoMasProximo.fecha) > new Date() &&
                  turnoMasProximo.estado !== "cancelado" &&
                  turnoMasProximo.estado !== "atendido" && (
                    <button
                      className={`${styles.bannerBtn} ${styles.bannerBtnCancelar}`}
                      onClick={() => setModalCancelar(turnoMasProximo._id)}
                      disabled={cancelando === turnoMasProximo._id}
                    >
                      {cancelando === turnoMasProximo._id ? "Cancelando..." : "Cancelar"}
                    </button>
                  )}
              </div>
            </div>
          )}

          {/* Lista de turnos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {listaVisible.length} turno{listaVisible.length !== 1 ? "s" : ""}{" "}
              {tab === "proximos" ? "programados" : "registrados"}
            </div>

            {loading && <p className={styles.estadoVacio}>Cargando turnos...</p>}
            {!loading && error && <p className={styles.estadoVacio}>{error}</p>}
            {!loading && !error && listaVisible.length === 0 && (
              <p className={styles.estadoVacio}>
                No hay turnos {tab === "proximos" ? "próximos" : "pasados"} para mostrar.
              </p>
            )}

            {!loading && !error && listaVisible.map((turno) => {
              const { dia, mes } = formatearDiaMes(turno.fecha);
              const badge = ESTADO_BADGE[turno.estado];
              const esFuturo = new Date(turno.fecha) > new Date();
              const puedeCancelar = esFuturo && turno.estado !== "cancelado" && turno.estado !== "atendido";

              return (
                <div key={turno._id} className={styles.turnoRow}>
                  <div className={styles.fechaBox}>
                    <span className={styles.fechaDia}>{dia}</span>
                    <span className={styles.fechaMes}>{mes}</span>
                  </div>

                  <div className={styles.turnoInfo}>
                    <div className={styles.turnoTags}>
                      {badge && <Badge texto={badge.texto} variante={badge.variante} />}
                      <span className={styles.turnoMascota}>
                        <FaPaw size={12} color="#6b7280" />{" "}
                        {turno.mascotaId?.nombre || "Mascota"}
                      </span>
                    </div>
                    <p className={styles.turnoMotivo}>{turno.motivo}</p>
                    <p className={styles.turnoMeta}>
                      <span>
                        <FaClock size={12} color="#8276ab" />{" "}
                        {turno.hora} hs
                      </span>
                      <span>
                        <FaHospital size={12} color="#8276ab" />{" "}
                        {turno.veterinariaId?.nombre || "Veterinaria"}
                        {(() => {
                          const prof = turno.veterinariaId?.profesionales?.find(
                            p => p._id.toString() === turno.profesionalId?.toString()
                          );
                          return prof ? ` · ${prof.nombre}` : "";
                        })()}
                      </span>
                    </p>
                  </div>

                  <div className={styles.turnoAcciones}>
                    <button
                      className={styles.menuBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAbierto(menuAbierto === turno._id ? null : turno._id);
                      }}
                    >
                      ⋮
                    </button>

                    {menuAbierto === turno._id && (
                      <div className={styles.dropdown}>
                        <button className={styles.dropdownItem} onClick={() => {}}>
                          Ver detalles
                        </button>

                        {turno.estado === "pendiente" && (
                          <button className={styles.dropdownItem} onClick={() => {}}>
                            Pagar
                          </button>
                        )}

                        {puedeCancelar && (
                          <button
                            className={styles.dropdownItem}
                            style={{ color: "#ef4444" }}
                            onClick={() => {
                              setMenuAbierto(null);
                              setModalCancelar(turno._id);
                            }}
                            disabled={cancelando === turno._id}
                          >
                            {cancelando === turno._id ? "Cancelando..." : "Cancelar"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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