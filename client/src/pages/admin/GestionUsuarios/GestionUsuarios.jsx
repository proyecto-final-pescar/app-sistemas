import { useCallback, useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";

import {
  actualizarEstadoUsuario,
  listarUsuarios,
} from "../../../services/usuarioService";

import styles from "./GestionUsuarios.module.css";

const USUARIOS_POR_PAGINA = 4;

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "Sin información";
  }

  return new Intl.DateTimeFormat("es-AR").format(new Date(fecha));
};

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEmail, setFiltroEmail] = useState("");
  const [filtroTelefono, setFiltroTelefono] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuarioActualizando, setUsuarioActualizando] = useState(null);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const busquedaLimpia = busqueda.trim();

      const respuesta = await listarUsuarios({
        nombre:
          filtroNombre.trim() ||
          (!busquedaLimpia.includes("@") ? busquedaLimpia : ""),
        email:
          filtroEmail.trim() ||
          (busquedaLimpia.includes("@") ? busquedaLimpia : ""),
        telefono: filtroTelefono.trim(),
        estado: filtroEstado,
        page: paginaActual,
        limit: USUARIOS_POR_PAGINA,
      });

      setUsuarios(respuesta.data || []);
      setTotalPaginas(respuesta.pagination?.totalPages || 1);
    } catch (errorPeticion) {
      console.error("Error al cargar usuarios:", errorPeticion);

      setUsuarios([]);
      setError(
        errorPeticion.response?.data?.message ||
          "No se pudieron cargar los usuarios. Intentá nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }, [
    busqueda,
    filtroNombre,
    filtroEmail,
    filtroTelefono,
    filtroEstado,
    paginaActual,
  ]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarUsuarios();
    }, 400);

    return () => clearTimeout(temporizador);
  }, [cargarUsuarios]);

  const reiniciarPagina = () => {
    setPaginaActual(1);
  };

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

      if (usuarioSeleccionado?.id === usuario.id) {
        setUsuarioSeleccionado((usuarioActual) => ({
          ...usuarioActual,
          active: nuevoEstado,
        }));
      }
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
      <Sidebar role="administrador" activeItem="Dueños" />

      <div className={styles.main}>
        <TopBar
          title="Gestión de Dueños"
          subtitle="Administración de usuarios"
          notifications={2}
        />

        <main className={styles.content}>
          <section className={styles.toolbar}>
            <div className={styles.searchBox}>
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  reiniciarPagina();
                }}
              />
            </div>
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
                reiniciarPagina();
              }}
            />

            <input
              type="email"
              placeholder="Email"
              value={filtroEmail}
              onChange={(evento) => {
                setFiltroEmail(evento.target.value);
                reiniciarPagina();
              }}
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={filtroTelefono}
              onChange={(evento) => {
                setFiltroTelefono(evento.target.value);
                reiniciarPagina();
              }}
            />

            <select
              value={filtroEstado}
              onChange={(evento) => {
                setFiltroEstado(evento.target.value);
                reiniciarPagina();
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
                                  setUsuarioSeleccionado(usuario)
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

      {usuarioSeleccionado && (
        <div
          className={styles.modalOverlay}
          onClick={() => setUsuarioSeleccionado(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-usuario"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id="titulo-modal-usuario">
                  Información del dueño
                </h2>

                <p>{usuarioSeleccionado.nombre}</p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setUsuarioSeleccionado(null)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <p>
                <strong>Email:</strong> {usuarioSeleccionado.email}
              </p>

              <p>
                <strong>Teléfono:</strong>{" "}
                {usuarioSeleccionado.telefono || "Sin teléfono"}
              </p>

              <p>
                <strong>Mascotas:</strong>{" "}
                {usuarioSeleccionado.mascotas}
              </p>

              <p>
                <strong>Fecha de registro:</strong>{" "}
                {formatearFecha(usuarioSeleccionado.registro)}
              </p>

              <p>
                <strong>Turnos próximos:</strong>{" "}
                {usuarioSeleccionado.turnos?.proximos ?? 0}
              </p>

              <p>
                <strong>Turnos pasados:</strong>{" "}
                {usuarioSeleccionado.turnos?.pasados ?? 0}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {usuarioSeleccionado.active ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionUsuarios;