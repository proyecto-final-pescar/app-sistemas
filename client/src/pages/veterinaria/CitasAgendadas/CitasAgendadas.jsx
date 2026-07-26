import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const [turnos, setTurnos] = useState([]);
  const [tab, setTab] = useState("proximos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarTurnos = async () => {
      setLoading(true);
      setError("");

      try {
        const veterinaria = await obtenerMiVeterinaria();

        if (!veterinaria?._id) {
          throw new Error("No se encontró la veterinaria del usuario.");
        }
        const data = await obtenerTurnosPorVeterinaria(veterinaria._id);

        setTurnos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar los turnos:", err);

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

  const irARegistrarConsulta = (turno) => {
    const turnoId = turno?._id || turno?.id;

    if (!turnoId) {
      setError("No se pudo identificar el turno seleccionado.");
      return;
    }

    navigate(`/historial/registrar/${turnoId}`);
  };

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
          {/* Pestañas */}
          <div className={styles.tabs}>
            <Button
              type="button"
              texto="Próximos"
              variante={tab === "proximos" ? "primario" : "secundario"}
              tamaño="chico"
              onClick={() => setTab("proximos")}
            />

            <Button
              type="button"
              texto="Pasados"
              variante={tab === "pasados" ? "primario" : "secundario"}
              tamaño="chico"
              onClick={() => setTab("pasados")}
            />
          </div>

          {/* Banner del turno más próximo */}
          {turnoMasProximo && (
            <div className={styles.banner}>
              <div className={styles.bannerInfo}>
                <div className={styles.bannerIcon}>🐾</div>

                <div>
                  <p className={styles.bannerLabel}>Próximo turno</p>

                  <p className={styles.bannerTitulo}>
                    {turnoMasProximo.motivo || "Consulta"} ·{" "}
                    {turnoMasProximo.mascotaId?.nombre || "Mascota"}
                  </p>

                  <p className={styles.bannerMeta}>
                    <span>
                      📅 {formatearFechaLarga(turnoMasProximo.fecha)}
                    </span>

                    <span>
                      🕒 {turnoMasProximo.hora || "Sin horario"} hs
                    </span>

                    <span>
                      👤 {turnoMasProximo.usuarioId?.nombre || "Tutor"}
                    </span>
                  </p>
                </div>
              </div>

              <Button
                type="button"
                texto="Atender turno →"
                variante="secundario"
                tamaño="chico"
                onClick={() => irARegistrarConsulta(turnoMasProximo)}
              />
            </div>
          )}

          {/* Lista de turnos */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {listaVisible.length} turno
              {listaVisible.length !== 1 ? "s" : ""}{" "}
              {tab === "proximos" ? "programados" : "registrados"}
            </div>

            {loading && (
              <p className={styles.estadoVacio}>
                Cargando turnos...
              </p>
            )}

            {!loading && error && (
              <p className={styles.estadoVacio}>
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              listaVisible.length === 0 && (
                <p className={styles.estadoVacio}>
                  No hay turnos{" "}
                  {tab === "proximos" ? "próximos" : "pasados"} para
                  mostrar.
                </p>
              )}

            {!loading &&
              !error &&
              listaVisible.map((turno) => {
                const { dia, mes } = formatearDiaMes(turno.fecha);
                const badge = ESTADO_BADGE[turno.estado];

                return (
                  <div
                    key={turno._id || turno.id}
                    className={styles.turnoRow}
                  >
                    <div className={styles.fechaBox}>
                      <span className={styles.fechaDia}>
                        {dia}
                      </span>

                      <span className={styles.fechaMes}>
                        {mes}
                      </span>
                    </div>

                    <div className={styles.turnoInfo}>
                      <div className={styles.turnoTags}>
                        {badge && (
                          <Badge
                            texto={badge.texto}
                            variante={badge.variante}
                          />
                        )}

                        <span className={styles.turnoMascota}>
                          🐾 {turno.mascotaId?.nombre || "Mascota"}
                        </span>
                      </div>

                      <p className={styles.turnoMotivo}>
                        {turno.motivo || "Consulta veterinaria"}
                      </p>

                      <p className={styles.turnoMeta}>
                        <span>
                          🕒 {turno.hora || "Sin horario"} hs
                        </span>

                        <span>
                          👤 {turno.usuarioId?.nombre || "Tutor"}
                        </span>
                      </p>
                    </div>

                    {tab === "proximos" && (
                      <Button
                        type="button"
                        texto="Atender turno →"
                        variante="secundario"
                        tamaño="chico"
                        onClick={() => irARegistrarConsulta(turno)}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}