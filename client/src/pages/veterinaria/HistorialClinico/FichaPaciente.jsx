import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api.js";
import Sidebar from "../../../components/layout/Sidebar.jsx";
import TopBar from "../../../components/layout/TopBar.jsx";
import styles from "./FichaPaciente.module.css";

// ── Modal Agregar Vacuna ──
const ModalVacuna = ({ onCerrar, onGuardar }) => {
  const [form, setForm] = useState({ nombre: "", fecha: "", veterinario: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.nombre || !form.fecha) return alert("Completá los campos obligatorios.");
    onGuardar(form);
    onCerrar();
  };

  return (
    <div className={styles.modalOverlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitulo}>Agregar vacuna</h3>
          <button className={styles.modalCerrar} onClick={onCerrar}>✕</button>
        </div>

        <div className={styles.modalCuerpo}>
          <label className={styles.label}>NOMBRE DE LA VACUNA</label>
          <input
            name="nombre"
            placeholder="Ej: Antirrábica"
            value={form.nombre}
            onChange={handleChange}
            className={styles.input}
          />

          <label className={styles.label}>FECHA APLICADA</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className={styles.input}
          />

          <label className={styles.label}>VETERINARIO/A RESPONSABLE</label>
          <input
            name="veterinario"
            placeholder="Ej: Dra. Martínez"
            value={form.veterinario}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancelar} onClick={onCerrar}>Cancelar</button>
          <button className={styles.btnConfirmar} onClick={handleSubmit}>Agregar vacuna</button>
        </div>
      </div>
    </div>
  );
};

// ── Modal Agregar Estudio ──
const ModalEstudio = ({ onCerrar, onGuardar }) => {
  const [form, setForm] = useState({ nombre: "", fecha: "", veterinario: "", archivo: null });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleArchivo = (e) => setForm({ ...form, archivo: e.target.files[0] });

  const handleSubmit = () => {
    if (!form.nombre || !form.fecha) return alert("Completá los campos obligatorios.");
    onGuardar(form);
    onCerrar();
  };

  return (
    <div className={styles.modalOverlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitulo}>Agregar estudio</h3>
          <button className={styles.modalCerrar} onClick={onCerrar}>✕</button>
        </div>

        <div className={styles.modalCuerpo}>
          <label className={styles.label}>NOMBRE DEL ESTUDIO</label>
          <input
            name="nombre"
            placeholder="Ej: Radiografía de tórax"
            value={form.nombre}
            onChange={handleChange}
            className={styles.input}
          />

          <label className={styles.label}>FECHA</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className={styles.input}
          />

          <label className={styles.label}>VETERINARIO/A RESPONSABLE</label>
          <input
            name="veterinario"
            placeholder="Ej: Dra. Martínez"
            value={form.veterinario}
            onChange={handleChange}
            className={styles.input}
          />

          <label className={styles.label}>ADJUNTAR RESULTADO (OPCIONAL)</label>
          <div className={styles.archivoWrapper}>
            <label className={styles.btnArchivo}>
              Seleccionar archivo
              <input type="file" onChange={handleArchivo} style={{ display: "none" }} />
            </label>
            <span className={styles.archivoNombre}>
              {form.archivo ? form.archivo.name : "Sin archivos seleccionados"}
            </span>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancelar} onClick={onCerrar}>Cancelar</button>
          <button className={styles.btnConfirmar} onClick={handleSubmit}>Agregar estudio</button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──
const FichaPaciente = () => {
  const { mascotaId } = useParams();
  const navigate = useNavigate();

  const [tabActiva, setTabActiva] = useState("consultas");
  const [historial, setHistorial] = useState([]);
  const [mascota, setMascota] = useState(null);
  // Reservado para cuando se conecte el tab "Ficha médica" con datos reales
  const [fichaMedica, setFichaMedica] = useState(null);
  const [vacunas, setVacunas] = useState([]);
  const [estudios, setEstudios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalVacuna, setModalVacuna] = useState(false);
  const [modalEstudio, setModalEstudio] = useState(false);

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

  const handleGuardarVacuna = (data) => {
    console.log("Vacuna agregada:", data);
    // Acá se conectaría con el endpoint cuando esté disponible
  };

  const handleGuardarEstudio = (data) => {
    console.log("Estudio agregado:", data);
    // Acá se conectaría con el endpoint cuando esté disponible
  };

  const nombreMascota = mascota?.nombre ?? "Mascota";
  const nombreDueno = mascota?.dueñoId?.nombre ?? mascota?.dueñoId?.name ?? "—";
  const telefonoDueno = mascota?.dueñoId?.telefono ?? "—";

  return (
    <div className={styles.layout}>
      <Sidebar title="Historial Clínico" />

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

          {/* Tab Ficha médica - fuera del alcance de esta tarea */}
          {tabActiva === "fichaMedica" && (
            <div className={styles.sinResultados}>
              <p>Esta sección está en desarrollo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {modalVacuna && (
        <ModalVacuna onCerrar={() => setModalVacuna(false)} onGuardar={handleGuardarVacuna} />
      )}
      {modalEstudio && (
        <ModalEstudio onCerrar={() => setModalEstudio(false)} onGuardar={handleGuardarEstudio} />
      )}
    </div>
  );
};

export default FichaPaciente;