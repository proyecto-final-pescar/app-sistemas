// client/src/pages/veterinaria/CitasAgendadas/CitasAgendadas.jsx
import { useEffect, useState } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/common/Badge";
import { obtenerMiVeterinaria } from "../../../services/veterinariaService";
import { obtenerTurnosPorVeterinaria } from "../../../services/turnosService";
import {
  filtrarProximos,
  filtrarPasados,
  obtenerTurnoMasProximo,
  formatearDiaMes,
  formatearFechaLarga,
  ESTADO_BADGE,
} from "../../../utils/turnos";
import styles from "./CitasAgendadas.module.css";

export default function CitasAgendadas() {
  const [turnos, setTurnos] = useState([]);
  const [tab, setTab] = useState("proximos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarTurnos = async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Averiguamos cuál es la veterinaria del usuario logueado
        const veterinaria = await obtenerMiVeterinaria();
        // 2) Recién ahí pedimos sus turnos
        const data = await obtenerTurnosPorVeterinaria(veterinaria._id);
        setTurnos(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Todavía no tenés una veterinaria registrada.");
        } else {
          setError("No se pudieron cargar los turnos. Intentá de nuevo.");
        }
      } finally {
        setLoading(false);
      }
    };

    cargarTurnos();
  }, []);

  const proximos = filtrarProximos(turnos);
  const pasados = filtrarPasados(turnos);
  const turnoMasProximo = obtenerTurnoMasProximo(turnos);
  const listaVisible = tab === "proximos" ? proximos : pasados;

  return (
    <div className={styles.shell}>
      <Sidebar role="veterinaria" activeItem="Turnos" />
      <div className={styles.main}>
        <TopBar title="Turnos veterinaria" notifications={2} />

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

          {/* Banner del turno más próximo (siempre respecto a fecha/hora actual) */}
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
                    <span>👤 {turnoMasProximo.usuarioId?.nombre || "Tutor"}</span>
                  </p>
                </div>
              </div>
              <Button texto="Ver detalles →" variante="secundario" tamaño="chico" />
            </div>
          )}

          {/* Lista de turnos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {listaVisible.length} turno{listaVisible.length !== 1 ? "s" : ""} {tab === "proximos" ? "programados" : "registrados"}
            </div>

            {loading && <p className={styles.estadoVacio}>Cargando turnos...</p>}
            {!loading && error && <p className={styles.estadoVacio}>{error}</p>}
            {!loading && !error && listaVisible.length === 0 && (
              <p className={styles.estadoVacio}>No hay turnos {tab === "proximos" ? "próximos" : "pasados"} para mostrar.</p>
            )}

            {!loading && !error && listaVisible.map((turno) => {
              const { dia, mes } = formatearDiaMes(turno.fecha);
              const badge = ESTADO_BADGE[turno.estado];
              return (
                <div key={turno._id} className={styles.turnoRow}>
                  <div className={styles.fechaBox}>
                    <span className={styles.fechaDia}>{dia}</span>
                    <span className={styles.fechaMes}>{mes}</span>
                  </div>

                  <div className={styles.turnoInfo}>
                    <div className={styles.turnoTags}>
                      {badge && <Badge texto={badge.texto} variante={badge.variante} />}
                      <span className={styles.turnoMascota}>🐾 {turno.mascotaId?.nombre || "Mascota"}</span>
                    </div>
                    <p className={styles.turnoMotivo}>{turno.motivo}</p>
                    <p className={styles.turnoMeta}>
                      <span>🕒 {turno.hora} hs</span>
                      <span>👤 {turno.usuarioId?.nombre || "Tutor"}</span>
                    </p>
                  </div>

                  <Button texto="Ver detalles →" variante="secundario" tamaño="chico" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}