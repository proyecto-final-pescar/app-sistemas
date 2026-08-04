import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api.js";
import Sidebar from "../../../components/layout/Sidebar.jsx";
import TopBar from "../../../components/layout/TopBar.jsx";
import FichaMedicaTab from "../../../components/historial/FichaMedicaTab.jsx";
import { actualizarFichaMedica } from "../../../services/fichaMedicaService.js";
import { crearVacuna, actualizarVacuna, eliminarVacuna } from "../../../services/vacunaService.js";
import { crearEstudio, actualizarEstudio, eliminarEstudio } from "../../../services/estudioService.js";
import { subirImagen } from "../../../services/uploadService.js";
import styles from "./FichaPaciente.module.css";

// ── Componente principal ──
const FichaPaciente = () => {
  const { mascotaId } = useParams();
  const navigate = useNavigate();

  const [tabActiva, setTabActiva] = useState("consultas");
  const [historial, setHistorial] = useState([]);
  const [mascota, setMascota] = useState(null);
  const [fichaMedica, setFichaMedica] = useState(null);
  const [vacunas, setVacunas] = useState([]);
  const [estudios, setEstudios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError("");
      try {
        //  trae mascota + historial + ficha médica +
        // vacunas + estudios 
        const res = await api.get(`/historial-completo/${mascotaId}`);
        const data = res.data.data ?? {};

        setHistorial(Array.isArray(data.historialClinico) ? data.historialClinico : []);
        setMascota(data.mascota ?? null);
        setFichaMedica(data.fichaMedica ?? null);
        setVacunas(Array.isArray(data.vacunas) ? data.vacunas : []);
        setEstudios(Array.isArray(data.estudios) ? data.estudios : []);
      } catch (err) {
        if (err.response?.status === 403) {
          setError("Todavía no tenés acceso al historial de esta mascota. El acceso se habilita cuando el turno esté confirmado.");
        } else {
          setError("No se pudo cargar el historial. Intentá de nuevo más tarde.");
        }

      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [mascotaId]);

  // Filtros en tiempo real
  const historialFiltrado = historial.filter((entrada) => {
    const texto = busqueda.trim().toLowerCase();

    const coincideTexto =
      texto === "" ||
      entrada.motivoConsulta?.toLowerCase().includes(texto) ||
      entrada.anotaciones?.toLowerCase().includes(texto) ||
      entrada.categoriaServicio?.toLowerCase().includes(texto);

    const coincideFecha = filtroFecha
      ? new Date(entrada.fecha).toISOString().slice(0, 10) === filtroFecha
      : true;

    return coincideTexto && coincideFecha;
  });

  const handleGuardarFichaMedica = async (datos) => {
    const fichaActualizada = await actualizarFichaMedica(mascotaId, datos);
    setFichaMedica(fichaActualizada);
  };

  const handleGuardarVacuna = async (datos, vacunaId) => {
    if (vacunaId) {
      const vacunaActualizada = await actualizarVacuna(vacunaId, datos);
      setVacunas((actuales) => actuales.map((vacuna) => (
        vacuna._id === vacunaId ? { ...vacuna, ...vacunaActualizada } : vacuna
      )));
      return;
    }

    const nuevaVacuna = await crearVacuna({ ...datos, mascotaId });
    setVacunas((actuales) => [nuevaVacuna, ...actuales]);
  };

  const handleEliminarVacuna = async (vacunaId) => {
    await eliminarVacuna(vacunaId);
    setVacunas((actuales) => actuales.filter((vacuna) => vacuna._id !== vacunaId));
  };

  const handleGuardarEstudio = async (datos, estudioId, archivo) => {
    const datosConArchivo = { ...datos };
    if (archivo) {
      datosConArchivo.urlArchivo = await subirImagen(archivo, "estudios");
    }

    if (estudioId) {
      const estudioActualizado = await actualizarEstudio(estudioId, datosConArchivo);
      setEstudios((actuales) => actuales.map((estudio) => (
        estudio._id === estudioId ? { ...estudio, ...estudioActualizado } : estudio
      )));
      return;
    }

    const nuevoEstudio = await crearEstudio({ ...datosConArchivo, mascotaId });
    setEstudios((actuales) => [nuevoEstudio, ...actuales]);
  };

  const handleEliminarEstudio = async (estudioId) => {
    await eliminarEstudio(estudioId);
    setEstudios((actuales) => actuales.filter((estudio) => estudio._id !== estudioId));
  };

  const nombreMascota = mascota?.nombre ?? "Mascota";
  const nombreDueno = mascota?.dueñoId?.nombre ?? mascota?.dueñoId?.name ?? "—";
  const telefonoDueno = mascota?.dueñoId?.telefono ?? "—";

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.main}>
        <TopBar title="Historial Clínico" />

        <div className={styles.contenido}>
          {/* Botón volver */}
          <button className={styles.btnVolver} onClick={() => navigate(-1)}>
            ← Pacientes
          </button>

          {/* Encabezado */}
          <div className={styles.encabezado}>
            <div>
              <h1 className={styles.titulo}>Ficha Médica - {nombreMascota}</h1>
              <div className={styles.infodueno}>
                <span>Dueño/a: {nombreDueno}</span>
                {telefonoDueno !== "—" && (
                  <span className={styles.telefono}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.95-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.4a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 18z" />
                    </svg>
                    {telefonoDueno}
                  </span>
                )}
              </div>
            </div>
            <button
              className={styles.btnRegistrar}
              onClick={() => navigate(`/registrar-consulta/${mascotaId}`)}
            >
              + Registrar Consulta
            </button>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tabActiva === "consultas" ? styles.tabActiva : ""}`}
              onClick={() => setTabActiva("consultas")}
            >
              Consultas
            </button>
            <button
              className={`${styles.tab} ${tabActiva === "fichaMedica" ? styles.tabActiva : ""}`}
              onClick={() => setTabActiva("fichaMedica")}
            >
              Ficha médica
            </button>
          </div>

          {/* Tab Consultas */}
          {tabActiva === "consultas" && (
            <>
              {/* Buscador y filtro fecha */}
              <div className={styles.filtros}>
                <input
                  type="text"
                  placeholder="Buscar en el historial..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className={styles.buscador}
                />
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className={styles.inputFecha}
                />
              </div>

              {/* Estados */}
              {isLoading && <p className={styles.estadoMensaje}>Cargando historial...</p>}
              {error && <p className={`${styles.estadoMensaje} ${styles.estadoError}`}>{error}</p>}

              {/* Lista de consultas */}
              {!isLoading && !error && (
                <>
                  {historialFiltrado.length === 0 ? (
                    <div className={styles.sinResultados}>
                      <p>No hay consultas registradas para esta mascota.</p>
                    </div>
                  ) : (
                    <div className={styles.listaConsultas}>
                      {historialFiltrado.map((entrada) => (
                        <div key={entrada._id} className={styles.cardConsulta}>
                          <div className={styles.cardIcono}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                          </div>
                          <div className={styles.cardCuerpo}>
                            <h4 className={styles.cardMotivo}>{entrada.motivoConsulta}</h4>
                            <div className={styles.cardMeta}>
                              <span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {new Date(entrada.fecha).toLocaleDateString("es-AR")}
                              </span>
                              {entrada.profesionalId?.nombre && (
                                <span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  {entrada.profesionalId.nombre}
                                </span>
                              )}
                            </div>
                            {entrada.anotaciones && (
                              <p className={styles.cardAnotaciones}>{entrada.anotaciones}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Tab Ficha médica */}
          {tabActiva === "fichaMedica" && (
            isLoading ? (
              <p className={styles.estadoMensaje}>Cargando ficha médica...</p>
            ) : error ? (
              <p className={`${styles.estadoMensaje} ${styles.estadoError}`}>{error}</p>
            ) : (
              <FichaMedicaTab
                mascota={mascota}
                fichaMedica={fichaMedica}
                historial={historial}
                vacunas={vacunas}
                estudios={estudios}
                onGuardarFicha={handleGuardarFichaMedica}
                onGuardarVacuna={handleGuardarVacuna}
                onEliminarVacuna={handleEliminarVacuna}
                onGuardarEstudio={handleGuardarEstudio}
                onEliminarEstudio={handleEliminarEstudio}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FichaPaciente;
