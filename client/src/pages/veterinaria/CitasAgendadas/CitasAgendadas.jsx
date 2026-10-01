import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, Calendar, Clock, User, Stethoscope, ArrowRight } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";

import { obtenerMiVeterinaria } from "../../../services/veterinariaService";
import { obtenerTurnosPorVeterinaria } from "../../../services/turnosService";

import {
  formatearDiaMes,
  formatearFechaLarga,
  ESTADO_BADGE,
} from "../../../utils/turnos";

import styles from "./CitasAgendadas.module.css";

const TURNOS_POR_PAGINA = 10;


const normalizarTexto = (texto) =>
  (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();


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


const obtenerFinTurno = (turno) => {
  const fecha = String(turno?.fecha || "").slice(0, 10);
  const hora = turno?.hora_fin || turno?.hora_inicio;
  if (!fecha || !hora) return null;

  const fin = new Date(`${fecha}T${String(hora).slice(0, 5)}:00-03:00`);
  return Number.isNaN(fin.getTime()) ? null : fin;
};

const finTurnoMs = (turno) => obtenerFinTurno(turno)?.getTime() ?? 0;


const turnoVencido = (turno, ahora) => {
  const fin = obtenerFinTurno(turno);
  return fin ? fin.getTime() <= ahora : false;
};

// Próximos: confirmados (CON) cuyo horario de fin todavía no pasó.
const esProximo = (turno, ahora) =>
  turno.estado_turno_id === "CON" && !turnoVencido(turno, ahora);

// Pasados: atendidos (ATE, o sea con consulta registrada) o confirmados cuyo
// horario ya pasó sin que se registrara la consulta.
const esPasado = (turno, ahora) =>
  turno.estado_turno_id === "ATE" ||
  (turno.estado_turno_id === "CON" && turnoVencido(turno, ahora));

export default function CitasAgendadas() {
  const navigate = useNavigate();

  const [turnos, setTurnos] = useState([]);
  const [tab, setTab] = useState("proximos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busquedaTutor, setBusquedaTutor] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);


  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const cargarTurnos = async () => {
      setLoading(true);
      setError("");

      try {
        const veterinaria = await obtenerMiVeterinaria();


        const veterinariaId = veterinaria?.veterinaria_id ?? veterinaria?._id;

        if (!veterinariaId) {
          throw new Error("No se encontró la veterinaria del usuario.");
        }


        const data = await obtenerTurnosPorVeterinaria(veterinariaId, { estados: "CON,ATE" });

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

  // Al cambiar de pestaña o de búsqueda se vuelve a la primera página
  useEffect(() => {
    setPaginaActual(1);
  }, [tab, busquedaTutor]);

  const irARegistrarConsulta = (turno) => {
    const turnoId = turno?.turno_id;

    if (!turnoId) {
      setError("No se pudo identificar el turno seleccionado.");
      return;
    }

    navigate(`/historial/registrar/${turnoId}`);
  };

  // Próximos: del más cercano al más lejano. Pasados: del más reciente al más viejo.
  const proximos = turnos
    .filter((turno) => esProximo(turno, ahora))
    .sort((a, b) => finTurnoMs(a) - finTurnoMs(b));
  const pasados = turnos
    .filter((turno) => esPasado(turno, ahora))
    .sort((a, b) => finTurnoMs(b) - finTurnoMs(a));
  const turnoMasProximo = proximos[0] || null;

  const filtrarPorTutor = (listaTurnos) => {
    const texto = normalizarTexto(busquedaTutor.trim());
    if (!texto) return listaTurnos;

    return listaTurnos.filter((turno) =>
      normalizarTexto(nombreTutorDe(turno)).includes(texto)
    );
  };

  const listaVisible = filtrarPorTutor(tab === "proximos" ? proximos : pasados);

  const totalPaginas = Math.max(Math.ceil(listaVisible.length / TURNOS_POR_PAGINA), 1);
  const inicio = (paginaActual - 1) * TURNOS_POR_PAGINA;
  const listaPagina = listaVisible.slice(inicio, inicio + TURNOS_POR_PAGINA);

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

            <input
              type="text"
              placeholder="Filtrar por nombre del tutor..."
              aria-label="Filtrar turnos por nombre del tutor"
              value={busquedaTutor}
              onChange={(e) => setBusquedaTutor(e.target.value)}
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
              {listaVisible.length} turno
              {listaVisible.length !== 1 ? "s" : ""}{" "}
              {tab === "proximos"
                ? listaVisible.length !== 1 ? "programados" : "programado"
                : listaVisible.length !== 1 ? "pasados" : "pasado"}
            </div>

            {loading && (
              <p className={styles.estadoVacio}>Cargando turnos...</p>
            )}

            {!loading && error && <p className={styles.estadoVacio}>{error}</p>}

            {!loading && !error && listaVisible.length === 0 && (
              <p className={styles.estadoVacio}>
                {busquedaTutor.trim()
                  ? "No hay turnos que coincidan con la búsqueda."
                  : `No hay turnos ${tab === "proximos" ? "próximos" : "pasados"} para mostrar.`}
              </p>
            )}

            {!loading &&
              !error &&
              listaPagina.map((turno) => {
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