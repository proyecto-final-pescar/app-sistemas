import { useState, useEffect, useRef } from "react";
import { Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Card from "../../../components/ui/card/Card";
import Badge from "../../../components/ui/badge/Badge";
import DetallesDeTurnoModal from "../../../components/administrador/detallesDeTurnoModal/detallesDeTurnoModal";
import TurnosAdminService from "../../../services/TurnosAdminService";
import styles from "./GestionTurnos.module.css";

const TABS_ESTADO = ["Todos", "Confirmados", "Pendientes", "Cancelados"];

const formatearFechaTabla = (fechaISO) => {
  if (!fechaISO) return "";
  // Extrae '2026', '10', '03' ignorando la zona horaria UTC
  const [anio, mes, dia] = fechaISO.slice(0, 10).split("-");
  return `${parseInt(dia, 10)}/${parseInt(mes, 10)}/${anio}`;
};

export default function GestionTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmados: 0,
    pendientes: 0,
    cancelados: 0,
  });
  const [tabActivo, setTabActivo] = useState("Todos");
  // Lo que se tipea vs lo que viaja al backend (con debounce de 400ms)
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  // Total con los filtros aplicados (lo devuelve el backend). Las tarjetas
  // de stats usan stats.total, que es el total del mes sin filtrar.
  const [totalResultados, setTotalResultados] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [turnoSeleccionadoId, setTurnoSeleccionadoId] = useState(null);
  // Cancela el request anterior: evita que respuestas fuera de orden
  // pisen la tabla mientras se tipea.
  const abortRef = useRef(null);

  // Espera a que el usuario deje de tipear antes de buscar en el backend
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 400);
    return () => clearTimeout(temporizador);
  }, [busquedaInput]);

  useEffect(() => {
    cargarTurnos();
    return () => abortRef.current?.abort();
  }, [tabActivo, busqueda, fecha, pagina]);

  const cargarTurnos = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setCargando(true);
    try {
      const res = await TurnosAdminService.getTurnos(
        {
          estado: tabActivo !== "Todos" ? tabActivo : undefined,
          busqueda: busqueda || undefined,
          fecha: fecha || undefined,
          pagina,
        },
        controller.signal
      );
      setTurnos(res.data.turnos);
      setStats(res.data.stats);
      setTotalResultados(res.data.totalResultados ?? res.data.stats.total);
      setTotalPaginas(res.data.totalPaginas);
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Error al cargar turnos:", error);
    } finally {
      setCargando(false);
    }
  };

  const cambiarTab = (tab) => {
    setTabActivo(tab);
    setPagina(1);
  };

  const verDetalle = (turnoId) => {
    setTurnoSeleccionadoId(turnoId);
  };

  const cerrarDetalle = () => {
    setTurnoSeleccionadoId(null);
  };

  return (
    <div className={styles.page}>
      <Sidebar role="administrador" activeItem="Turnos" title="Turnos" />

      <div className={styles.main}>
        <TopBar
          title="Turnos"
          subtitle="Gestión y seguimiento de todos los turnos del sistema"
        />

        <main className={styles.content}>
          <div className={styles.stats}>
            <Card className={styles.statCard}>
              <div className={`${styles.statIcono} ${styles.statIconoVioleta}`}>
                <Calendar size={20} />
              </div>
              <div>
                <span className={styles.statNumero}>{stats.total}</span>
                <span className={styles.statLabel}>Total este mes</span>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={`${styles.statIcono} ${styles.statIconoVerde}`}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className={styles.statNumero}>{stats.confirmados}</span>
                <span className={styles.statLabel}>Confirmados</span>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={`${styles.statIcono} ${styles.statIconoNaranja}`}>
                <Clock size={20} />
              </div>
              <div>
                <span className={styles.statNumero}>{stats.pendientes}</span>
                <span className={styles.statLabel}>Pendientes de pago</span>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={`${styles.statIcono} ${styles.statIconoRojo}`}>
                <XCircle size={20} />
              </div>
              <div>
                <span className={styles.statNumero}>{stats.cancelados}</span>
                <span className={styles.statLabel}>Cancelados</span>
              </div>
            </Card>
          </div>

          <Card className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitulo}>
                <h2>Turnos por veterinaria</h2>
                <span className={styles.resultados}>
                  Mostrando {turnos.length} de {totalResultados} resultados
                </span>
              </div>

              <div className={styles.filtros}>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setPagina(1);
                  }}
                  className={styles.inputFecha}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busquedaInput}
                  onChange={(e) => setBusquedaInput(e.target.value)}
                  className={styles.inputBusqueda}
                />
              </div>
            </div>

            <div className={styles.tabs}>
              {TABS_ESTADO.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tab} ${
                    tabActivo === tab ? styles.tabActivo : ""
                  }`}
                  onClick={() => cambiarTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={styles.tablaWrapper}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Veterinaria</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr>
                      <td colSpan={6} className={styles.vacio}>
                        Cargando turnos...
                      </td>
                    </tr>
                  ) : turnos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.vacio}>
                        No se encontraron turnos
                      </td>
                    </tr>
                  ) : (
                    turnos.map((turno) => (
                      <tr key={turno.turno_id}>
                        <td>{formatearFechaTabla(turno.fecha)}</td>
                        <td>{turno.hora}</td>
                        <td>{turno.veterinariaNombre}</td>
                        {/* el "usuario" es el cliente que pidió el turno */}
                        <td>{turno.usuarioNombre}</td>
                        <td>
                          <Badge
                            texto={turno.estado}
                            variante={turno.estado?.toLowerCase()}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.ver}
                            onClick={() => verDetalle(turno.turno_id)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.paginacion}>
              <span className={styles.paginaInfo}>
                Página {pagina} de {totalPaginas}
              </span>
              <div className={styles.paginacionBotones}>
                <button
                  type="button"
                  disabled={pagina === 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </Card>
        </main>
      </div>

      {turnoSeleccionadoId && (
        <DetallesDeTurnoModal
          turnoId={turnoSeleccionadoId}
          onClose={cerrarDetalle}
        />
      )}
    </div>
  );
}
