import { useCallback, useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import DetallesDeDuenoModal from "../../../components/administrador/detallesDeDuenoModal/detallesDeDuenoModal";

import {
  actualizarEstadoUsuario,
  listarUsuarios,
} from "../../../services/usuarioService";

import styles from "./GestionUsuarios.module.css";

const USUARIOS_POR_PAGINA = 10;

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "Sin información";
  }

  return new Intl.DateTimeFormat("es-AR").format(new Date(fecha));
};

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);

  // Valores "en vivo": se actualizan en cada tecla, sin disparar fetch todavía.
  const [busqueda, setBusqueda] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEmail, setFiltroEmail] = useState("");
  const [filtroTelefono, setFiltroTelefono] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

 
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    busqueda: "",
    filtroNombre: "",
    filtroEmail: "",
    filtroTelefono: "",
    filtroEstado: "",
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuarioActualizando, setUsuarioActualizando] = useState(null);

  
 
  const [duenoSeleccionadoId, setDuenoSeleccionadoId] = useState(null);

  // NOTA 
  // Si hay contenido en los filtros avanzados de Nombre o Email, el buscador
  // general se deshabilita (en vez de quedar pisado ) para que el
  // usuario entienda por qué no está buscando.
  const busquedaGeneralDeshabilitada = Boolean(
    filtroNombre.trim() || filtroEmail.trim()
  );

  // Referencia para poder abortar una petición anterior si todavía no
  // termino cuando se dispara una nueva 
  const controladorActualRef = useRef(null);

  const cargarUsuarios = useCallback(async () => {
    controladorActualRef.current?.abort();
    const controlador = new AbortController();
    controladorActualRef.current = controlador;

    setCargando(true);
    setError("");

    try {
      const busquedaLimpia = filtrosAplicados.busqueda.trim();

      const respuesta = await listarUsuarios({
        nombre:
          filtrosAplicados.filtroNombre.trim() ||
          (!busquedaLimpia.includes("@") ? busquedaLimpia : ""),
        email:
          filtrosAplicados.filtroEmail.trim() ||
          (busquedaLimpia.includes("@") ? busquedaLimpia : ""),
        telefono: filtrosAplicados.filtroTelefono.trim(),
        estado: filtrosAplicados.filtroEstado,
        page: paginaActual,
        limit: USUARIOS_POR_PAGINA,
        signal: controlador.signal,
      });

      setUsuarios(respuesta.data || []);
      setTotalPaginas(respuesta.pagination?.totalPages || 1);
    } catch (errorPeticion) {
      
      if (
        errorPeticion.name === "CanceledError" ||
        errorPeticion.code === "ERR_CANCELED"
      ) {
        return;
      }

      console.error("Error al cargar usuarios:", errorPeticion);

      setUsuarios([]);
      setError(
        errorPeticion.response?.data?.message ||
          "No se pudieron cargar los usuarios. Intentá nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }, [filtrosAplicados, paginaActual]);

  
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setFiltrosAplicados({
        busqueda,
        filtroNombre,
        filtroEmail,
        filtroTelefono,
        filtroEstado,
      });
      setPaginaActual(1);
    }, 400);

    return () => clearTimeout(temporizador);
  }, [busqueda, filtroNombre, filtroEmail, filtroTelefono, filtroEstado]);

  
  useEffect(() => {
    cargarUsuarios();

    return () => {
      controladorActualRef.current?.abort();
    };
  }, [cargarUsuarios]);

  const cambiarEstado = async (usuario) => {
    const nuevoEstado = !usuario.active;

    setUsuarioActualizando(usuario.id);
    setError("");

    try {
      await actualizarEstadoUsuario(usuario.id, nuevoEstado);

      setUsuarios((usuariosActuales) =>
        usuariosActuales.map((usuarioActual) =>
          usuarioActual.id === usuario.id
            ? { ...usuarioActual, active: nuevoEstado }
            : usuarioActual
        )
      );
    } catch (errorPeticion) {
      console.error("Error al actualizar usuario:", errorPeticion);

      setError(
        errorPeticion.response?.data?.message ||
          "No se pudo modificar el estado del usuario."
      );
    } finally {
      setUsuarioActualizando(null);
    }
  };

  const irPaginaAnterior = () => {
    setPaginaActual((pagina) => Math.max(pagina - 1, 1));
  };

  const irPaginaSiguiente = () => {
    setPaginaActual((pagina) => Math.min(pagina + 1, totalPaginas));
  };

  return (
    <div className={styles.page}>
      <Sidebar role="administrador" activeItem="Dueños" title="Gestión de Dueños" />

      <div className={styles.main}>
        <TopBar
          title="Gestión de Dueños"
          subtitle="Administración de usuarios"
          notifications={2}
        />

        <main className={styles.content}>
          <section className={styles.toolbar}>
            <div
              className={styles.searchBox}
              title={
                busquedaGeneralDeshabilitada
                  ? "Deshabilitado mientras usás el filtro de Nombre o Email"
                  : undefined
              }
            >
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                placeholder={
                  busquedaGeneralDeshabilitada
                    ? "Buscador deshabilitado (hay un filtro avanzado activo)"
                    : "Buscar por nombre o email..."
                }
                value={busqueda}
                disabled={busquedaGeneralDeshabilitada}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                }}
              />
            </div>

            {busquedaGeneralDeshabilitada && (
              <p className={styles.searchHint}>
                Buscador general deshabilitado: hay un filtro avanzado de
                Nombre o Email activo. Borralo para volver a usarlo.
              </p>
            )}
          </section>

          <section className={styles.filters}>
            <span className={styles.filtersLabel}>
              <span aria-hidden="true">▽</span>
              Filtros avanzados:
            </span>

            <input
              type="text"
              placeholder="Nombre"
              value={filtroNombre}
              onChange={(evento) => {
                setFiltroNombre(evento.target.value);
              }}
            />

            <input
              type="email"
              placeholder="Email"
              value={filtroEmail}
              onChange={(evento) => {
                setFiltroEmail(evento.target.value);
              }}
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={filtroTelefono}
              onChange={(evento) => {
                setFiltroTelefono(evento.target.value);
              }}
            />

            <select
              value={filtroEstado}
              onChange={(evento) => {
                setFiltroEstado(evento.target.value);
              }}
            >
              <option value="">Estado</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </section>

          {error && (
            <div className={styles.errorMessage} role="alert">
              <span>{error}</span>

              <button type="button" onClick={cargarUsuarios}>
                Reintentar
              </button>
            </div>
          )}

          <section className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              {cargando ? (
                <div className={styles.loadingState}>
                  Cargando usuarios...
                </div>
              ) : (
                <>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Contacto</th>
                        <th>Mascotas</th>
                        <th>Registro</th>
                        <th>
                          Turnos
                          <br />
                          (Próx | Pas)
                        </th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id}>
                          <td>{usuario.nombre}</td>

                          <td>
                            <span>{usuario.email}</span>
                            <span>{usuario.telefono || "Sin teléfono"}</span>
                          </td>

                          <td>
                            <span className={styles.petCount}>
                              {usuario.mascotas}
                            </span>
                          </td>

                          <td>{formatearFecha(usuario.registro)}</td>

                          <td>
                            {usuario.turnos?.proximos ?? 0} |{" "}
                            {usuario.turnos?.pasados ?? 0}
                          </td>

                          <td>
                            <button
                              type="button"
                              className={`${styles.toggle} ${
                                usuario.active ? styles.toggleActive : ""
                              }`}
                              onClick={() => cambiarEstado(usuario)}
                              disabled={usuarioActualizando === usuario.id}
                              aria-label={
                                usuario.active
                                  ? `Desactivar a ${usuario.nombre}`
                                  : `Activar a ${usuario.nombre}`
                              }
                            >
                              <span />
                            </button>
                          </td>

                          <td>
                            <div className={styles.actions}>
                              <button
                                type="button"
                                onClick={() =>
                                  setDuenoSeleccionadoId(usuario.id)
                                }
                                aria-label={`Ver información de ${usuario.nombre}`}
                                title="Ver información"
                              >
                                <Eye size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {usuarios.length === 0 && !error && (
                    <p className={styles.emptyState}>
                      No se encontraron dueños con esos filtros.
                    </p>
                  )}
                </>
              )}
            </div>

            {!cargando && !error && usuarios.length > 0 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  onClick={irPaginaAnterior}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>

                {Array.from({ length: totalPaginas }, (_, indice) => {
                  const numeroPagina = indice + 1;

                  return (
                    <button
                      type="button"
                      key={numeroPagina}
                      onClick={() => setPaginaActual(numeroPagina)}
                      className={
                        paginaActual === numeroPagina
                          ? styles.activePage
                          : ""
                      }
                    >
                      {numeroPagina}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={irPaginaSiguiente}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      <DetallesDeDuenoModal
        duenoId={duenoSeleccionadoId}
        onClose={() => setDuenoSeleccionadoId(null)}
      />
    </div>
  );
}

export default GestionUsuarios;