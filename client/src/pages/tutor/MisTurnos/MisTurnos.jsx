import { useEffect, useState } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/common/Badge";
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
  const [cancelando, setCancelando] = useState(null); // id del turno que se está cancelando

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

  const handleCancelar = async (turnoId) => {
    const confirmar = window.confirm("¿Estás seguro que querés cancelar este turno?");
    if (!confirmar) return;

    setCancelando(turnoId);
    try {
      await cancelarTurno(turnoId);
      // Actualiza el estado del turno en la lista sin volver a llamar al backend
      setTurnos((prev) =>
        prev.map((t) =>
          t._id === turnoId ? { ...t, estado: "cancelado" } : t
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
      <Sidebar role="tutor" activeItem="Turnos" />
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
                <div className={styles.bannerIcon}>🐾</div>
                <div>
                  <p className={styles.bannerLabel}>Próximo turno</p>
                  <p className={styles.bannerTitulo}>
                    {turnoMasProximo.motivo} · {turnoMasProximo.mascotaId?.nombre || "Mascota"}
                  </p>
                  <p className={styles.bannerMeta}>
                    <span>📅 {formatearFechaLarga(turnoMasProximo.fecha)}</span>
                    <span>🕒 {turnoMasProximo.hora} hs</span>
                    {/* Diferencia clave respecto a la vista veterinaria: muestra la clínica */}
                    <span>🏥 {turnoMasProximo.veterinariaId?.nombre || "Veterinaria"}</span>
                  </p>
                </div>
              </div>
              <Button texto="Ver detalles →" variante="secundario" tamaño="chico" />
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
                        🐾 {turno.mascotaId?.nombre || "Mascota"}
                      </span>
                    </div>
                    <p className={styles.turnoMotivo}>{turno.motivo}</p>
                    <p className={styles.turnoMeta}>
                      <span>🕒 {turno.hora} hs</span>
                      {/* Diferencia clave: muestra la veterinaria en lugar del tutor */}
                      <span>🏥 {turno.veterinariaId?.nombre || "Veterinaria"}</span>
                    </p>
                  </div>

                  {/* Diferencia clave: dos acciones en lugar de una */}
                  <div className={styles.turnoAcciones}>
                    <Button texto="Ver detalles →" variante="secundario" tamaño="chico" />
                    {puedeCancelar && (
                      <Button
                        texto={cancelando === turno._id ? "Cancelando..." : "Cancelar"}
                        variante="peligro"
                        tamaño="chico"
                        onClick={() => handleCancelar(turno._id)}
                        disabled={cancelando === turno._id}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}