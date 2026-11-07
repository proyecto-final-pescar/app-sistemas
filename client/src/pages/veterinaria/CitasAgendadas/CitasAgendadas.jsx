import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, Calendar, Clock, User, Stethoscope, ArrowRight } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";

import { obtenerMiVeterinaria } from "../../../services/veterinariaService";
import { obtenerTurnosPaginadosPorVeterinaria } from "../../../services/turnosService";

import {
  formatearDiaMes,
  formatearFechaLarga,
  ESTADO_BADGE,
} from "../../../utils/turnos";

import styles from "./CitasAgendadas.module.css";

const TURNOS_POR_PAGINA = 10;
const ESPERA_BUSQUEDA_MS = 400;
const ESTADOS_AGENDA = "CON,ATE";


const nombreTutorDe = (turno) => {
  const tutor = turno?.mascota?.usuario;
  return tutor?.nombre ? `${tutor.nombre} ${tutor.apellido || ""}`.trim() : "";
};


const nombreProfesionalDe = (turno) => {
  const profesional = turno?.profesional;
  return profesional?.nombre
    ? `${profesional.nombre} ${profesional.apellido || ""}`.trim()
    : "";
};

export default function CitasAgendadas() {
  const navigate = useNavigate();

  const [veterinariaId, setVeterinariaId] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [turnoMasProximo, setTurnoMasProximo] = useState(null);
  const [tab, setTab] = useState("proximos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // `busquedaInput` es lo que se escribe; `busquedaTutor` es lo que se envía al backend
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busquedaTutor, setBusquedaTutor] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  // La veterinaria se resuelve una sola vez, no en cada cambio de página
  useEffect(() => {
    let cancelado = false;

    const cargarVeterinaria = async () => {
      try {
        const veterinaria = await obtenerMiVeterinaria();
        const id = veterinaria?.veterinaria_id ?? veterinaria?._id;

        if (!id) {
          throw new Error("No se encontró la veterinaria del usuario.");
        }

        if (!cancelado) setVeterinariaId(id);
      } catch (err) {
        console.error("Error al cargar la veterinaria:", err);
        if (cancelado) return;

        if (err.response?.status === 404) {
          setError("Todavía no tenés una veterinaria registrada.");
        } else {
          setError("No se pudieron cargar los turnos. Intentá de nuevo.");
        }
        setLoading(false);
      }
    };

    cargarVeterinaria();
    return () => {
      cancelado = true;
    };
  }, []);

  // Espera a que el usuario deje de tipear antes de pedir al backend
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBusquedaTutor(busquedaInput);
      setPaginaActual(1);
    }, ESPERA_BUSQUEDA_MS);

    return () => clearTimeout(temporizador);
  }, [busquedaInput]);

  // Lista de la pestaña activa (una página por vez; filtra y ordena el backend)
  useEffect(() => {
    if (!veterinariaId) return;
    let cancelado = false;

    const cargarTurnos = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await obtenerTurnosPaginadosPorVeterinaria(veterinariaId, {
          tab,
          estados: ESTADOS_AGENDA,
          busquedaTutor,
          pagina: paginaActual,
          limite: TURNOS_POR_PAGINA,
        });
        if (cancelado) return;

        setTurnos(data.turnos);
        setTotal(data.total);
        setTotalPaginas(data.totalPaginas);
      } catch (err) {
        console.error("Error al cargar los turnos:", err);
        if (!cancelado) setError("No se pudieron cargar los turnos. Intentá de nuevo.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargarTurnos();
    return () => {
      cancelado = true;
    };
  }, [veterinariaId, tab, busquedaTutor, paginaActual]);

  // Banner del próximo turno: no depende de la pestaña, la búsqueda ni la página
  useEffect(() => {
    if (!veterinariaId) return;
    let cancelado = false;

    const cargarBanner = async () => {
      try {
        const data = await obtenerTurnosPaginadosPorVeterinaria(veterinariaId, {
          tab: "proximos",
          estados: ESTADOS_AGENDA,
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
  }, [veterinariaId]);

  const cambiarTab = (nuevaTab) => {
    setTab(nuevaTab);
    setPaginaActual(1);
  };

  const irARegistrarConsulta = (turno) => {
    const turnoId = turno?.turno_id;

    if (!turnoId) {
      setError("No se pudo identificar el turno seleccionado.");
      return;
    }

    navigate(`/historial/registrar/${turnoId}`);
  };

  return (
    <div className={styles.shell}>
      <Sidebar role="veterinaria" activeItem="Turnos" title="Agenda" />

      <div className={styles.main}>
        <TopBar title="Agenda" notifications={2} />

        <div className={styles.content}>
          <div className={styles.tabsRow}>
            <div className={styles.tabs}>
              <Button
                type="button"
                texto="Próximos"
                variante={tab === "proximos" ? "primario" : "secundario"}
                tamaño="chico"
                onClick={() => cambiarTab("proximos")}
              />

              <Button
                type="button"
                texto="Pasados"
                variante={tab === "pasados" ? "primario" : "secundario"}
                tamaño="chico"
                onClick={() => cambiarTab("pasados")}
              />
            </div>

            <input
              type="text"
              placeholder="Filtrar por nombre del tutor..."
              aria-label="Filtrar turnos por nombre del tutor"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              className={styles.inputBusqueda}
            />
          </div>

          {turnoMasProximo && (
            <div className={styles.banner}>
              <div className={styles.bannerInfo}>
                <PawPrint className={styles.bannerIcon} size={28} />

                <div className={styles.bannerTextos}>
                  <p className={styles.bannerLabel}>Próximo turno</p>

                  <p className={styles.bannerTitulo}>
                    {turnoMasProximo.motivo || "Consulta"} ·{" "}
                    {turnoMasProximo.mascota?.nombre || "Mascota"}
                  </p>

                  <p className={styles.bannerMeta}>
                    <span>
                      <Calendar size={14} /> {formatearFechaLarga(turnoMasProximo.fecha)}
                    </span>

                    <span>
                      <Clock size={14} /> {turnoMasProximo.hora_inicio || "Sin horario"} hs
                    </span>

                    <span>
                      <User size={14} /> {nombreTutorDe(turnoMasProximo) || "Tutor"}
                    </span>

                    <span>
                      <Stethoscope size={14} />{" "}
                      {nombreProfesionalDe(turnoMasProximo) || "Sin asignar"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={`${styles.btnAtender} ${styles.btnAtenderBanner}`}
                aria-label={`Atender turno de ${turnoMasProximo.mascota?.nombre || "la mascota"}`}
                onClick={() => irARegistrarConsulta(turnoMasProximo)}
              >
                <span>Atender turno</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {total} turno
              {total !== 1 ? "s" : ""}{" "}
              {tab === "proximos"
                ? total !== 1 ? "programados" : "programado"
                : total !== 1 ? "pasados" : "pasado"}
            </div>

            {loading && (
              <p className={styles.estadoVacio}>Cargando turnos...</p>
            )}

            {!loading && error && <p className={styles.estadoVacio}>{error}</p>}

            {!loading && !error && turnos.length === 0 && (
              <p className={styles.estadoVacio}>
                {busquedaTutor.trim()
                  ? "No hay turnos que coincidan con la búsqueda."
                  : `No hay turnos ${tab === "proximos" ? "próximos" : "pasados"} para mostrar.`}
              </p>
            )}

            {!loading &&
              !error &&
              turnos.map((turno) => {
                const { dia, mes } = formatearDiaMes(turno.fecha);
                // En "Pasados", un turno confirmado (CON) es uno cuyo horario ya
                // pasó sin que se registrara la consulta: no se muestra "Confirmado".
                const sinConsulta = tab === "pasados" && turno.estado_turno_id === "CON";
                const badge = sinConsulta
                  ? { texto: "Sin consulta registrada", variante: "pendiente" }
                  : ESTADO_BADGE[turno.estado_turno_id];

                return (
                  <div key={turno.turno_id} className={styles.turnoRow}>
                    <div className={styles.fechaBox}>
                      <span className={styles.fechaDia}>{dia}</span>

                      <span className={styles.fechaMes}>{mes}</span>
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
                          <PawPrint size={14} /> {turno.mascota?.nombre || "Mascota"}
                        </span>
                      </div>

                      <p className={styles.turnoMotivo}>
                        {turno.motivo || "Consulta veterinaria"}
                      </p>

                      <p className={styles.turnoMeta}>
                        <span>
                          <Clock size={14} /> {turno.hora_inicio || "Sin horario"} hs
                        </span>

                        <span>
                          <User size={14} /> {nombreTutorDe(turno) || "Tutor"}
                        </span>

                        <span>
                          <Stethoscope size={14} />{" "}
                          {nombreProfesionalDe(turno) || "Sin asignar"}
                        </span>
                      </p>
                    </div>

                    {tab === "proximos" && (
                      <button
                        type="button"
                        className={styles.btnAtender}
                        aria-label={`Atender turno de ${turno.mascota?.nombre || "la mascota"}`}
                        onClick={() => irARegistrarConsulta(turno)}
                      >
                        <span>Atender turno</span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    )}
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
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                />

                <span className={styles.paginaInfo}>
                  Página {paginaActual} de {totalPaginas}
                </span>

                <Button
                  type="button"
                  texto="Siguiente →"
                  variante="secundario"
                  tamaño="chico"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}