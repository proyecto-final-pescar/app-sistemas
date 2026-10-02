import { useCallback, useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import DetallesDeDuenoModal from "../../../components/administrador/detallesDeDuenoModal/detallesDeDuenoModal";
import ConfirmModal from "../../../components/ui/confirm-modal/ConfirmModal";
import Button from "../../../components/ui/button/Button.jsx";

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
  const [usuarioParaConfirmar, setUsuarioParaConfirmar] = useState(null);

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

      if (controladorActualRef.current !== controlador) return;

      setUsuarios(respuesta.data || []);
      setTotalPaginas(respuesta.pagination?.totalPages || 1);
    } catch (errorPeticion) {
      if (
        errorPeticion.name === "CanceledError" ||
        errorPeticion.code === "ERR_CANCELED"
      ) {
        return;
      }

      if (controladorActualRef.current !== controlador) return;

      console.error("Error al cargar usuarios:", errorPeticion);

      setUsuarios([]);
      setError(
        errorPeticion.response?.data?.message ||
          "No se pudieron cargar los usuarios. Intentá nuevamente."
      );
    } finally {
      if (controladorActualRef.current === controlador) {
        setCargando(false);
      }
    }
  }, [filtrosAplicados, paginaActual]);

  useEffect(() => {
    const filtrosEnVivo = {
      busqueda,
      filtroNombre,
      filtroEmail,
      filtroTelefono,
      filtroEstado,
    };

    const sinCambios =
      filtrosEnVivo.busqueda === filtrosAplicados.busqueda &&
      filtrosEnVivo.filtroNombre === filtrosAplicados.filtroNombre &&
      filtrosEnVivo.filtroEmail === filtrosAplicados.filtroEmail &&
      filtrosEnVivo.filtroTelefono === filtrosAplicados.filtroTelefono &&
      filtrosEnVivo.filtroEstado === filtrosAplicados.filtroEstado;

    if (sinCambios) return;

    const temporizador = setTimeout(() => {
      setFiltrosAplicados(filtrosEnVivo);
      setPaginaActual(1);
    }, 400);

    return () => clearTimeout(temporizador);
  }, [
    busqueda,
    filtroNombre,
    filtroEmail,
    filtroTelefono,
    filtroEstado,
    filtrosAplicados,
  ]);

  useEffect(() => {
    cargarUsuarios();

    return () => {
      controladorActualRef.current?.abort();
    };
  }, [cargarUsuarios]);

  const ejecutarCambioEstado = async (usuario) => {
    const estadoAnterior = usuario.active;
    const nuevoEstado = !estadoAnterior;

    setUsuarioActualizando(usuario.id);
    setError("");

    setUsuarios((usuariosActuales) =>
      usuariosActuales.map((usuarioActual) =>
        usuarioActual.id === usuario.id
          ? { ...usuarioActual, active: nuevoEstado }
          : usuarioActual
      )
    );

    try {
      await actualizarEstadoUsuario(usuario.id, nuevoEstado);
    } catch (errorPeticion) {
      console.error("Error al actualizar usuario:", errorPeticion);

      setUsuarios((usuariosActuales) =>
        usuariosActuales.map((usuarioActual) =>
          usuarioActual.id === usuario.id
            ? { ...usuarioActual, active: estadoAnterior }
            : usuarioActual
        )
      );

      setError(
        errorPeticion.response?.data?.message ||
          "No se pudo modificar el estado del usuario."
      );
    } finally {
      setUsuarioActualizando(null);
    }
  };

  const pedirConfirmacionCambioEstado = (usuario) => {
    if (usuarioActualizando === usuario.id) return;
    setUsuarioParaConfirmar(usuario);
  };

  const confirmarCambioEstado = async () => {
    if (!usuarioParaConfirmar) return;
    await ejecutarCambioEstado(usuarioParaConfirmar);
    setUsuarioParaConfirmar(null);
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
            <div className={styles.searchBox}>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
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
              onChange={(evento) => setFiltroNombre(evento.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={filtroEmail}
              onChange={(evento) => setFiltroEmail(evento.target.value)}
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={filtroTelefono}
              onChange={(evento) => setFiltroTelefono(evento.target.value)}
            />

            <select
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
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
            {cargando ? (
              <div className={styles.loadingState}>
                Cargando usuarios...
              </div>
            ) : (
              <>
                <div className={styles.tableWrapper}>
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
                              onClick={() => pedirConfirmacionCambioEstado(usuario)}
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
                                <Eye size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.cards}>
                  {usuarios.map((usuario) => (
                    <div key={usuario.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div className={styles.estadoWrapper}>
                          <button
                            type="button"
                            className={`${styles.toggle} ${usuario.active ? styles.toggleActive : ""}`}
                            onClick={() => pedirConfirmacionCambioEstado(usuario)}
                            disabled={usuarioActualizando === usuario.id}
                            aria-label={usuario.active ? `Desactivar a ${usuario.nombre}` : `Activar a ${usuario.nombre}`}
                          >
                            <span />
                          </button>
                          <span className={styles.estadoLabel}>
                            Estado: <strong>{usuario.active ? "Activo" : "Inactivo"}</strong>
                          </span>
                        </div>
                      </div>
                      
                      <p className={styles.cardNombre}>{usuario.nombre}</p>
                      <p className={styles.cardInfo}>{usuario.email}</p>
                      <p className={styles.cardInfo}>{usuario.telefono || "Sin teléfono"}</p>
                      
                      <div className={styles.cardMetaGrid}>
                        <div className={styles.cardMetaItem}>
                          <span className={styles.cardMetaLabel}>Registro</span>
                          <span className={styles.cardMetaValue}>{formatearFecha(usuario.registro)}</span>
                        </div>
                        <div className={styles.cardMetaItem}>
                          <span className={styles.cardMetaLabel}>Turnos (Próx|Pas)</span>
                          <span className={styles.cardMetaValue}>{usuario.turnos?.proximos ?? 0} | {usuario.turnos?.pasados ?? 0}</span>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <Button
                          texto="Ver detalles del dueño"
                          variante="ver-ficha"
                          tamaño="mediano"
                          icon={Eye}
                          onClick={() => setDuenoSeleccionadoId(usuario.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {usuarios.length === 0 && !error && (
                  <p className={styles.emptyState}>
                    No se encontraron dueños con esos filtros.
                  </p>
                )}
              </>
            )}

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

      <ConfirmModal
        abierto={Boolean(usuarioParaConfirmar)}
        titulo={
          usuarioParaConfirmar?.active
            ? "¿Desactivar esta cuenta?"
            : "¿Activar esta cuenta?"
        }
        mensaje={
          usuarioParaConfirmar && (
            <>
              {usuarioParaConfirmar.active
                ? "El dueño no va a poder iniciar sesión hasta que se reactive la cuenta."
                : "El dueño va a poder volver a iniciar sesión con normalidad."}
              <br />
              <strong>{usuarioParaConfirmar.nombre}</strong> (
              {usuarioParaConfirmar.email})
            </>
          )
        }
        textoConfirmar={usuarioParaConfirmar?.active ? "Desactivar" : "Activar"}
        textoConfirmando={
          usuarioParaConfirmar?.active ? "Desactivando…" : "Activando…"
        }
        varianteConfirmar={usuarioParaConfirmar?.active ? "peligro" : "primario"}
        onConfirm={confirmarCambioEstado}
        onCancel={() => setUsuarioParaConfirmar(null)}
        confirmando={usuarioActualizando === usuarioParaConfirmar?.id}
      />
    </div>
  );
}

export default GestionUsuarios;