import { useState, useEffect } from "react";
import api from "../../../services/api.js";
import styles from "./GestionVeterinarias.module.css";

const GestionVeterinarias = () => {
  // ── Estados ──
  const [tabActiva, setTabActiva] = useState("listado"); // "listado" | "porVerificar"
  const [veterinarias, setVeterinarias] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Carga de datos ──
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/veterinarias");
        const todas = response.data.data ?? [];

        setVeterinarias(todas.filter((v) => v.estado === "activa"));
        setPendientes(todas.filter((v) => v.estado === "suspendida"));
      } catch {
        setError("No se pudieron cargar las veterinarias. Intentá de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // ── Filtro por búsqueda ──
  const listaFiltrada = veterinarias.filter(
    (v) =>
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.especialidades?.some((e) =>
        e.toLowerCase().includes(busqueda.toLowerCase())
      )
  );

  // ── Handlers ──
  const handleAprobar = async (id) => {
    try {
      await api.put(`/veterinarias/${id}`, { estado: "activa" });
      const aprobada = pendientes.find((v) => v._id === id);
      setPendientes((prev) => prev.filter((v) => v._id !== id));
      if (aprobada) setVeterinarias((prev) => [...prev, { ...aprobada, estado: "activa" }]);
    } catch {
      alert("Error al aprobar la veterinaria.");
    }
  };

  const handleRechazar = async (id) => {
    if (!confirm("¿Estás seguro de que querés rechazar esta veterinaria?")) return;
    try {
      await api.delete(`/veterinarias/${id}`);
      setPendientes((prev) => prev.filter((v) => v._id !== id));
    } catch {
      alert("Error al rechazar la veterinaria.");
    }
  };

  const handleToggleEstado = async (vet) => {
    const nuevoEstado = vet.estado === "activa" ? "suspendida" : "activa";
    try {
      await api.put(`/veterinarias/${vet._id}`, { estado: nuevoEstado });
      setVeterinarias((prev) =>
        prev.map((v) => (v._id === vet._id ? { ...v, estado: nuevoEstado } : v))
      );
    } catch {
      alert("Error al cambiar el estado.");
    }
  };

  // ── Render de estados ──
  if (isLoading) return <p className={styles.estadoMensaje}>Cargando veterinarias...</p>;
  if (error) return <p className={`${styles.estadoMensaje} ${styles.estadoError}`}>{error}</p>;

  return (
    <div className={styles.container}>
      {/* ── Encabezado ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Gestión de Veterinarias</h1>
          <p className={styles.subtitulo}>Domingo, 26 de mayo de 2024</p>
        </div>
      </div>

      {/* ── Barra de búsqueda y filtros ── */}
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Buscar veterinaria..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={styles.buscador}
        />
        <select className={styles.select}>
          <option value="">Especialidad</option>
          <option value="cirugia">Cirugía</option>
          <option value="rayos">Rayos X</option>
          <option value="urgencias">Urgencias 24hs</option>
        </select>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tabActiva === "porVerificar" ? styles.tabActiva : ""}`}
          onClick={() => setTabActiva("porVerificar")}
        >
          Por Verificar {pendientes.length > 0 && `(${pendientes.length})`}
        </button>
        <button
          className={`${styles.tab} ${tabActiva === "listado" ? styles.tabActiva : ""}`}
          onClick={() => setTabActiva("listado")}
        >
          Listado General
        </button>
      </div>

      {/* ── Tab: Listado General ── */}
      {tabActiva === "listado" && (
        <div className={styles.tablaWrapper}>
          {/* Desktop: tabla */}
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Especialidades</th>
                <th>CUIT</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.sinResultados}>
                    No se encontraron veterinarias.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((vet) => (
                  <tr key={vet._id}>
                    <td className={styles.idCell}>V-{vet._id.slice(-5).toUpperCase()}</td>
                    <td>{vet.nombre}</td>
                    <td>
                      <span>{vet.email}</span>
                      <br />
                      <span className={styles.telefono}>{vet.telefono}</span>
                    </td>
                    <td>{vet.especialidades?.join(", ") || "—"}</td>
                    <td>{vet.cuit}</td>
                    <td>
                      <button
                        className={`${styles.toggle} ${vet.estado === "activa" ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => handleToggleEstado(vet)}
                        title={vet.estado === "activa" ? "Suspender" : "Activar"}
                      />
                    </td>
                    <td className={styles.acciones}>
                      <button className={styles.btnIcono} title="Ver detalle">📄</button>
                      <button className={styles.btnIcono} title="Ver usuario">👤</button>
                      <button className={styles.btnIcono} title="Configuración">⚙️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile: cards */}
          <div className={styles.cards}>
            {listaFiltrada.length === 0 ? (
              <p className={styles.sinResultados}>No se encontraron veterinarias.</p>
            ) : (
              listaFiltrada.map((vet) => (
                <div key={vet._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardId}>V-{vet._id.slice(-5).toUpperCase()}</span>
                    <button
                      className={`${styles.toggle} ${vet.estado === "activa" ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() => handleToggleEstado(vet)}
                    />
                  </div>
                  <p className={styles.cardNombre}>{vet.nombre}</p>
                  <p className={styles.cardInfo}>{vet.email}</p>
                  <p className={styles.cardInfo}>{vet.telefono}</p>
                  <p className={styles.cardInfo}>CUIT: {vet.cuit}</p>
                  {vet.especialidades?.length > 0 && (
                    <div className={styles.tags}>
                      {vet.especialidades.map((e) => (
                        <span key={e} className={styles.tag}>{e}</span>
                      ))}
                    </div>
                  )}
                  <div className={styles.cardAcciones}>
                    <button className={styles.btnIcono}>📄</button>
                    <button className={styles.btnIcono}>👤</button>
                    <button className={styles.btnIcono}>⚙️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Por Verificar ── */}
      {tabActiva === "porVerificar" && (
        <div className={styles.tablaWrapper}>
          {/* Desktop: tabla */}
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th>CUIT</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.sinResultados}>
                    No hay veterinarias pendientes de verificación.
                  </td>
                </tr>
              ) : (
                pendientes.map((vet) => (
                  <tr key={vet._id}>
                    <td className={styles.idCell}>V-{vet._id.slice(-5).toUpperCase()}</td>
                    <td>{vet.nombre}</td>
                    <td>
                      <span>{vet.email}</span>
                      <br />
                      <span className={styles.telefono}>{vet.telefono}</span>
                    </td>
                    <td>{vet.direccion}</td>
                    <td>{vet.cuit}</td>
                    <td>{new Date(vet.createdAt).toLocaleDateString("es-AR")}</td>
                    <td className={styles.accionesPendiente}>
                      <button className={styles.btnAprobar} onClick={() => handleAprobar(vet._id)}>
                        Aprobar
                      </button>
                      <button className={styles.btnRechazar} onClick={() => handleRechazar(vet._id)}>
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile: cards */}
          <div className={styles.cards}>
            {pendientes.length === 0 ? (
              <p className={styles.sinResultados}>No hay veterinarias pendientes.</p>
            ) : (
              pendientes.map((vet) => (
                <div key={vet._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardId}>V-{vet._id.slice(-5).toUpperCase()}</span>
                    <span className={styles.cardFecha}>
                      {new Date(vet.createdAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <p className={styles.cardNombre}>{vet.nombre}</p>
                  <p className={styles.cardInfo}>{vet.email}</p>
                  <p className={styles.cardInfo}>{vet.telefono}</p>
                  <p className={styles.cardInfo}>{vet.direccion}</p>
                  <p className={styles.cardInfo}>CUIT: {vet.cuit}</p>
                  <div className={styles.cardAcciones}>
                    <button className={styles.btnAprobar} onClick={() => handleAprobar(vet._id)}>
                      Aprobar
                    </button>
                    <button className={styles.btnRechazar} onClick={() => handleRechazar(vet._id)}>
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionVeterinarias;
