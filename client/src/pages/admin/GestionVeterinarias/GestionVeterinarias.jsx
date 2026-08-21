import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import Sidebar from "../../../components/layout/Sidebar.jsx";
import TopBar from "../../../components/layout/TopBar.jsx";
import RechazarVetModal from "../../../components/administrador/rechazarVetModal/rechazarVetModal.jsx";
import ConfirmModal from "../../../components/ui/confirm-modal/ConfirmModal.jsx";
import styles from "./GestionVeterinarias.module.css";

const ITEMS_POR_PAGINA = 10;
const MAX_SERVICIOS_VISIBLES = 2;

const formatServicios = (servicios = []) => {
  if (!servicios.length) return "—";
  const nombres = servicios.map((s) => s.nombre);
  const visibles = nombres.slice(0, MAX_SERVICIOS_VISIBLES);
  const restantes = nombres.length - visibles.length;
  return restantes > 0
    ? `${visibles.join(", ")} +${restantes} más`
    : visibles.join(", ");
};

const GestionVeterinarias = () => {
  const [tabActiva, setTabActiva] = useState("listado");
  const [veterinarias, setVeterinarias] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaListado, setPaginaListado] = useState(1);
  const [paginaPendientes, setPaginaPendientes] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [vetARechazar, setVetARechazar] = useState(null); // { id, nombre } | null
  const [vetAAprobar, setVetAAprobar] = useState(null); // { id, nombre } | null
  const [isAprobando, setIsAprobando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/admin/veterinarias");
        const todas = response.data.data ?? [];

        setVeterinarias(todas.filter((v) => v.estado === "activa"));
        setPendientes(todas.filter((v) => v.estado === "pendiente"));
      } catch (err) {
        console.error("Error al cargar veterinarias:", err.response?.data || err.message);
        setError("No se pudieron cargar las veterinarias. Intentá de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const listaFiltrada = veterinarias.filter((v) =>
    v.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const pendientesFiltrados = pendientes.filter((v) =>
    v.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const paginar = (lista, pagina) => {
    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    return lista.slice(inicio, inicio + ITEMS_POR_PAGINA);
  };

  const totalPaginasListado = Math.ceil(listaFiltrada.length / ITEMS_POR_PAGINA);
  const totalPaginasPendientes = Math.ceil(pendientesFiltrados.length / ITEMS_POR_PAGINA);
  const listaVisible = paginar(listaFiltrada, paginaListado);
  const pendientesVisibles = paginar(pendientesFiltrados, paginaPendientes);

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPaginaListado(1);
    setPaginaPendientes(1);
  };

  // Abre el modal de confirmación de aprobación
  const abrirModalAprobacion = (vet) => {
    setVetAAprobar({ id: vet._id, nombre: vet.nombre });
  };

  const cerrarModalAprobacion = () => {
    if (isAprobando) return; // evita cerrar mientras hay una request en curso
    setVetAAprobar(null);
  };

  const confirmarAprobacion = async () => {
    if (!vetAAprobar) return;
    try {
      setIsAprobando(true);
      await api.patch(`/admin/veterinarias/${vetAAprobar.id}/aprobar`);

      const aprobada = pendientes.find((v) => v._id === vetAAprobar.id);
      setPendientes((prev) => prev.filter((v) => v._id !== vetAAprobar.id));
      if (aprobada) setVeterinarias((prev) => [...prev, { ...aprobada, estado: "activa" }]);

      setVetAAprobar(null);
    } catch (err) {
      console.error("Error al aprobar:", err.response?.data || err.message);
      alert("Error al aprobar la veterinaria.");
    } finally {
      setIsAprobando(false);
    }
  };

  // Abre el modal de rechazo
  const abrirModalRechazo = (vet) => {
    setVetARechazar({ id: vet._id, nombre: vet.nombre });
  };

  const cerrarModalRechazo = () => setVetARechazar(null);

  const handleRechazoExitoso = () => {
    if (!vetARechazar) return;
    setPendientes((prev) => prev.filter((v) => v._id !== vetARechazar.id));
  };

  const handleToggleEstado = async (vet) => {
    const nuevoEstado = vet.estado === "activa" ? "suspendida" : "activa";
    try {
      await api.put(`/admin/veterinarias/${vet._id}`, { estado: nuevoEstado });
      setVeterinarias((prev) =>
        prev.map((v) => (v._id === vet._id ? { ...v, estado: nuevoEstado } : v))
      );
    } catch (err) {
      console.error("Error al cambiar estado:", err.response?.data || err.message);
      alert("Error al cambiar el estado.");
    }
  };

  const IconoDocumento = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const Paginacion = ({ pagina, total, onChange }) => {
    if (total <= 1) return null;
    return (
      <div className={styles.paginacion}>
        <button className={styles.paginaBtn} onClick={() => onChange(pagina - 1)} disabled={pagina === 1}>
          ← Anterior
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`${styles.paginaBtn} ${pagina === n ? styles.paginaBtnActiva : ""}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button className={styles.paginaBtn} onClick={() => onChange(pagina + 1)} disabled={pagina === total}>
          Siguiente →
        </button>
      </div>
    );
  };

  return (
    <div className={styles.layout}>
      <Sidebar title="Gestión de Veterinarias" />

      <div className={styles.main}>
        <TopBar title="Gestión de Veterinarias" />

        <div className={styles.contenido}>
          <div className={styles.toolbar}>
            <input
              type="text"
              placeholder="Buscar veterinaria..."
              value={busqueda}
              onChange={handleBusqueda}
              className={styles.buscador}
            />
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tabActiva === "porVerificar" ? styles.tabActiva : ""}`}
              onClick={() => { setTabActiva("porVerificar"); setBusqueda(""); }}
            >
              Por Verificar {pendientes.length > 0 && `(${pendientes.length})`}
            </button>
            <button
              className={`${styles.tab} ${tabActiva === "listado" ? styles.tabActiva : ""}`}
              onClick={() => { setTabActiva("listado"); setBusqueda(""); }}
            >
              Listado General
            </button>
          </div>

          {isLoading && <p className={styles.estadoMensaje}>Cargando veterinarias...</p>}
          {error && <p className={`${styles.estadoMensaje} ${styles.estadoError}`}>{error}</p>}

          {!isLoading && !error && tabActiva === "listado" && (
            <>
              <div className={styles.tablaWrapper}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Contacto</th>
                      <th>Servicios</th>
                      <th>CUIT</th>
                      <th>Calificación</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaVisible.length === 0 ? (
                      <tr><td colSpan={7} className={styles.sinResultados}>No se encontraron veterinarias.</td></tr>
                    ) : (
                      listaVisible.map((vet) => (
                        <tr key={vet._id}>
                          <td>{vet.nombre}</td>
                          <td>
                            <span>{vet.email}</span><br />
                            <span className={styles.telefono}>{vet.telefono}</span>
                          </td>
                          <td>{formatServicios(vet.servicios)}</td>
                          <td>{vet.cuit}</td>
                          <td>{vet.rating ? `${vet.rating} ⭐` : "Sin notas"}</td>
                          <td>
                            <button
                              className={`${styles.toggle} ${vet.estado === "activa" ? styles.toggleOn : styles.toggleOff}`}
                              onClick={() => handleToggleEstado(vet)}
                              title={vet.estado === "activa" ? "Suspender" : "Activar"}
                            />
                          </td>
                          <td>
                            <button className={styles.btnIcono} title="Ver datos del registro">
                              <IconoDocumento />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.cards}>
                {listaVisible.length === 0 ? (
                  <p className={styles.sinResultados}>No se encontraron veterinarias.</p>
                ) : (
                  listaVisible.map((vet) => (
                    <div key={vet._id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <button
                          className={`${styles.toggle} ${vet.estado === "activa" ? styles.toggleOn : styles.toggleOff}`}
                          onClick={() => handleToggleEstado(vet)}
                        />
                      </div>
                      <p className={styles.cardNombre}>{vet.nombre}</p>
                      <p className={styles.cardInfo}>{vet.email}</p>
                      <p className={styles.cardInfo}>{vet.telefono}</p>
                      <p className={styles.cardInfo}>CUIT: {vet.cuit}</p>
                      {vet.servicios?.length > 0 && (
                        <div className={styles.tags}>
                          {vet.servicios.slice(0, MAX_SERVICIOS_VISIBLES).map((s) => (
                            <span key={s._id ?? s.nombre} className={styles.tag}>{s.nombre}</span>
                          ))}
                          {vet.servicios.length > MAX_SERVICIOS_VISIBLES && (
                            <span className={styles.tag}>
                              +{vet.servicios.length - MAX_SERVICIOS_VISIBLES} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <Paginacion pagina={paginaListado} total={totalPaginasListado} onChange={setPaginaListado} />
            </>
          )}

          {!isLoading && !error && tabActiva === "porVerificar" && (
            <>
              <div className={styles.tablaWrapper}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Contacto</th>
                      <th>Dirección</th>
                      <th>CUIT</th>
                      <th>Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientesVisibles.length === 0 ? (
                      <tr><td colSpan={6} className={styles.sinResultados}>No hay veterinarias pendientes de verificación.</td></tr>
                    ) : (
                      pendientesVisibles.map((vet) => (
                        <tr key={vet._id}>
                          <td>{vet.nombre}</td>
                          <td>
                            <span>{vet.email}</span><br />
                            <span className={styles.telefono}>{vet.telefono}</span>
                          </td>
                          <td>{vet.direccion}</td>
                          <td>{vet.cuit}</td>
                          <td>{new Date(vet.createdAt).toLocaleDateString("es-AR")}</td>
                          <td>
                            <div className={styles.accionesPendiente}>
                              <button className={styles.btnIcono} title="Ver datos del registro">
                                <IconoDocumento />
                              </button>
                              <button className={styles.btnAprobar} onClick={() => abrirModalAprobacion(vet)}>
                                Aprobar
                              </button>
                              <button className={styles.btnRechazar} onClick={() => abrirModalRechazo(vet)}>
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.cards}>
                {pendientesVisibles.length === 0 ? (
                  <p className={styles.sinResultados}>No hay veterinarias pendientes.</p>
                ) : (
                  pendientesVisibles.map((vet) => (
                    <div key={vet._id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <span className={styles.cardFecha}>{new Date(vet.createdAt).toLocaleDateString("es-AR")}</span>
                      </div>
                      <p className={styles.cardNombre}>{vet.nombre}</p>
                      <p className={styles.cardInfo}>{vet.email}</p>
                      <p className={styles.cardInfo}>{vet.telefono}</p>
                      <p className={styles.cardInfo}>{vet.direccion}</p>
                      <p className={styles.cardInfo}>CUIT: {vet.cuit}</p>
                      <div className={styles.cardAcciones}>
                        <button className={styles.btnAprobar} onClick={() => abrirModalAprobacion(vet)}>Aprobar</button>
                        <button className={styles.btnRechazar} onClick={() => abrirModalRechazo(vet)}>Rechazar</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Paginacion pagina={paginaPendientes} total={totalPaginasPendientes} onChange={setPaginaPendientes} />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        abierto={!!vetAAprobar}
        titulo="Aprobar veterinaria"
        mensaje={`¿Confirmás que querés aprobar el registro de "${vetAAprobar?.nombre}"? Esta acción la activará en la plataforma.`}
        textoConfirmar="Aprobar"
        varianteConfirmar="primario"
        onConfirm={confirmarAprobacion}
        onCancel={cerrarModalAprobacion}
        confirmando={isAprobando}
      />

      {vetARechazar && (
        <RechazarVetModal
          veterinariaId={vetARechazar.id}
          nombreVeterinaria={vetARechazar.nombre}
          onClose={cerrarModalRechazo}
          onSuccess={handleRechazoExitoso}
        />
      )}
    </div>
  );
};

export default GestionVeterinarias;