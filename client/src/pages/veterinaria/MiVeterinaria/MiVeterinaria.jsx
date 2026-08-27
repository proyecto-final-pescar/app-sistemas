import { useEffect, useState } from "react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Modal from "../../../components/layout/modal/Modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/ui/select/Select";
import ConfirmModal from "../../../components/ui/confirm-modal/ConfirmModal";
import SuccessModal from "../../../components/ui/success-modal/SuccessModal";
import ErrorModal from "../../../components/ui/error-modal/ErrorModal";
import { useCategoriasServicio } from "../../../hooks/useCategoriasServicio";
import {
  actualizarMiVeterinaria,
  obtenerMiVeterinaria,
} from "../../../services/veterinariaService";
import {
  DIAS,
  HORAS,
  construirHorarios,
  validarEmail,
  validarHorarios,
  validarPrecio,
  validarTelefono,
} from "../../../utils/RegistroVeterinarias";

import styles from "./MiVeterinaria.module.css";

const CLAVES_DIAS = {
  Lunes: "lunes",
  Martes: "martes",
  Miércoles: "miercoles",
  Jueves: "jueves",
  Viernes: "viernes",
  Sábado: "sabado",
  Domingo: "domingo",
};

const TABS = ["Datos generales", "Servicios", "Profesionales", "Horarios"];


const REGEX_SOLO_LETRAS = /^[a-zA-ZÀ-ÖØ-öø-ÿ\u00f1\u00d1\s'.-]+$/;
const esTextoValido = (texto) => REGEX_SOLO_LETRAS.test((texto || "").trim());

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
  </svg>
);

const obtenerMensajeError = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

const horariosASeleccionados = (horarios = {}) => {
  const seleccionados = {};

  for (const dia of DIAS) {
    const horario = horarios[CLAVES_DIAS[dia]];
    if (horario?.desde && horario?.hasta) {
      seleccionados[dia] = { desde: horario.desde, hasta: horario.hasta };
    }
  }

  return seleccionados;
};

const normalizarVeterinaria = (veterinaria) => ({
  datos: {
    nombre: veterinaria.nombre || "",
    direccion: veterinaria.direccion || "",
    telefono: veterinaria.telefono || "",
    email: veterinaria.email || "",
    sitioWeb: veterinaria.sitioWeb || "",
  },
  servicios: Array.isArray(veterinaria.servicios)
    ? veterinaria.servicios.map((servicio) => ({ ...servicio }))
    : [],
  profesionales: Array.isArray(veterinaria.profesionales)
    ? veterinaria.profesionales.map((profesional) => ({ ...profesional }))
    : [],
  diasSeleccionados: horariosASeleccionados(veterinaria.horarios),
  urgencias24hs: Boolean(veterinaria.urgencias24hs),
});


const construirPayloadServicios = (servicios) => ({
  servicios: servicios.map((servicio) => ({
    ...(servicio._id ? { _id: servicio._id } : {}),
    nombre: servicio.nombre.trim(),
    categoria: servicio.categoria,
    precio: Number(servicio.precio),
  })),
});

const construirPayloadProfesionales = (profesionales) => ({
  profesionales: profesionales.map((profesional) => ({
    ...(profesional._id ? { _id: profesional._id } : {}),
    nombre: profesional.nombre.trim(),
    especialidad: profesional.especialidad.trim(),
    email: profesional.email.trim(),
    ...(Array.isArray(profesional.serviciosIds)
      ? { serviciosIds: profesional.serviciosIds }
      : {}),
  })),
});

function MiVeterinaria() {
  const { categorias, loading: cargandoCategorias, error: errorCategorias } =
    useCategoriasServicio();
  const [tabActiva, setTabActiva] = useState(TABS[0]);
  const [formulario, setFormulario] = useState(null);

  const [formularioGuardado, setFormularioGuardado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardandoSeccion, setGuardandoSeccion] = useState({
    datos: false,
    horarios: false,
  });
  const [errorCarga, setErrorCarga] = useState("");
  const [modalEdicion, setModalEdicion] = useState(null);
  const [guardandoModal, setGuardandoModal] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [successModal, setSuccessModal] = useState({ abierto: false, mensaje: "" });
  const [errorModal, setErrorModal] = useState({ abierto: false, mensaje: "" });

  const cambio = (campo) =>
    formulario && formularioGuardado
      ? JSON.stringify(formulario[campo]) !== JSON.stringify(formularioGuardado[campo])
      : false;

  const cambioDatos = cambio("datos");
  const cambioHorarios =
    cambio("diasSeleccionados") ||
    (formulario && formularioGuardado
      ? formulario.urgencias24hs !== formularioGuardado.urgencias24hs
      : false);

  const hayCambiosSinGuardar = cambioDatos || cambioHorarios;

  const cargarVeterinaria = async () => {
    setCargando(true);
    setErrorCarga("");

    try {
      const veterinaria = await obtenerMiVeterinaria();
      const normalizada = normalizarVeterinaria(veterinaria);
      setFormulario(normalizada);
      setFormularioGuardado(normalizada);
    } catch (error) {
      setErrorCarga(
        obtenerMensajeError(error, "No se pudieron cargar los datos de tu veterinaria."),
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    obtenerMiVeterinaria()
      .then((veterinaria) => {
        if (activo) {
          const normalizada = normalizarVeterinaria(veterinaria);
          setFormulario(normalizada);
          setFormularioGuardado(normalizada);
        }
      })
      .catch((error) => {
        if (activo) {
          setErrorCarga(
            obtenerMensajeError(
              error,
              "No se pudieron cargar los datos de tu veterinaria.",
            ),
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  
  useEffect(() => {
    if (!hayCambiosSinGuardar) return;

    const avisar = (evento) => {
      evento.preventDefault();
      evento.returnValue = "";
    };

    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayCambiosSinGuardar]);

  const actualizarDatos = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      datos: { ...actual.datos, [campo]: valor },
    }));
  };

  const abrirServicio = (indice = null) => {
    const servicio = indice === null
      ? { nombre: "", categoria: "", precio: "" }
      : { ...formulario.servicios[indice] };
    setModalEdicion({ tipo: "servicio", indice, valores: servicio });
  };

  const abrirProfesional = (indice = null) => {
    const profesional = indice === null
      ? { nombre: "", especialidad: "", email: "", serviciosIds: [] }
      : { ...formulario.profesionales[indice] };
    setModalEdicion({ tipo: "profesional", indice, valores: profesional });
  };

  const actualizarModal = (campo, valor) => {
    setModalEdicion((actual) => ({
      ...actual,
      valores: { ...actual.valores, [campo]: valor },
      error: "",
    }));
  };


  const guardarModal = async () => {
    const { tipo, indice, valores } = modalEdicion;
    let error = "";

    if (tipo === "servicio") {
      if (!valores.nombre.trim() || !valores.categoria) {
        error = "Completá el nombre y la categoría del servicio.";
      } else if (!validarPrecio(valores.precio)) {
        error = "El precio debe ser numérico y mayor a cero.";
      }
    } else if (!valores.nombre.trim() || !valores.especialidad.trim() || !valores.email.trim()) {
      error = "Completá todos los datos del profesional.";
    } else if (!esTextoValido(valores.nombre)) {
      error = "El nombre del profesional solo puede contener letras.";
    } else if (!esTextoValido(valores.especialidad)) {
      error = "La especialidad solo puede contener letras.";
    } else if (!validarEmail(valores.email)) {
      error = "Ingresá un email válido para el profesional.";
    }

    if (error) {
      setModalEdicion((actual) => ({ ...actual, error }));
      return;
    }

    const clave = tipo === "servicio" ? "servicios" : "profesionales";
    const normalizado = tipo === "servicio"
      ? { ...valores, precio: Number(valores.precio) }
      : { ...valores };

    const items = [...formulario[clave]];
    if (indice === null) items.push(normalizado);
    else items[indice] = normalizado;

    const payload = tipo === "servicio"
      ? construirPayloadServicios(items)
      : construirPayloadProfesionales(items);

    setGuardandoModal(true);
    try {
      const actualizada = await actualizarMiVeterinaria(payload);
      const normalizada = normalizarVeterinaria(actualizada);
      setFormulario(normalizada);
      setFormularioGuardado(normalizada);
      setModalEdicion(null);
      setSuccessModal({
        abierto: true,
        mensaje: tipo === "servicio"
          ? `El servicio "${normalizado.nombre}" se guardó correctamente.`
          : `El profesional "${normalizado.nombre}" se guardó correctamente.`,
      });
    } catch (errorPeticion) {
      setModalEdicion((actual) => ({
        ...actual,
        error: obtenerMensajeError(errorPeticion, "No se pudo guardar. Intentá de nuevo."),
      }));
    } finally {
      setGuardandoModal(false);
    }
  };

 
  const confirmarEliminacion = async () => {
    const { tipo, indice, nombre } = confirmacion;
    const clave = tipo === "servicio" ? "servicios" : "profesionales";
    const items = formulario[clave].filter((_, posicion) => posicion !== indice);

    const payload = tipo === "servicio"
      ? construirPayloadServicios(items)
      : construirPayloadProfesionales(items);

    setEliminando(true);
    try {
      const actualizada = await actualizarMiVeterinaria(payload);
      const normalizada = normalizarVeterinaria(actualizada);
      setFormulario(normalizada);
      setFormularioGuardado(normalizada);
      setConfirmacion(null);
      setSuccessModal({
        abierto: true,
        mensaje: tipo === "servicio"
          ? `El servicio "${nombre}" se eliminó correctamente.`
          : `El profesional "${nombre}" se eliminó correctamente.`,
      });
    } catch (errorPeticion) {
      setConfirmacion(null);
      setErrorModal({
        abierto: true,
        mensaje: obtenerMensajeError(errorPeticion, "No se pudo eliminar. Intentá de nuevo."),
      });
    } finally {
      setEliminando(false);
    }
  };

  const toggleDia = (dia) => {
    setFormulario((actual) => {
      const dias = { ...actual.diasSeleccionados };
      if (dias[dia]) delete dias[dia];
      else dias[dia] = { desde: "09:00", hasta: "17:00" };
      return { ...actual, diasSeleccionados: dias };
    });
  };

  const actualizarHorario = (dia, campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      diasSeleccionados: {
        ...actual.diasSeleccionados,
        [dia]: { ...actual.diasSeleccionados[dia], [campo]: valor },
      },
    }));
  };

 
  const validarSeccion = (seccion) => {
    if (seccion === "datos") {
      const { datos } = formulario;
      if (!datos.nombre.trim() || !datos.direccion.trim() || !datos.telefono.trim() || !datos.email.trim()) {
        return "Completá los datos generales obligatorios.";
      }
      if (!validarTelefono(datos.telefono)) return "Ingresá un teléfono válido.";
      if (!validarEmail(datos.email)) return "Ingresá un email institucional válido.";
      return "";
    }

    // horarios
    const { diasSeleccionados } = formulario;
    if (Object.keys(diasSeleccionados).length === 0) return "Seleccioná al menos un día de atención.";
    return validarHorarios(diasSeleccionados);
  };

  const construirPayloadSeccion = (seccion) => {
    if (seccion === "datos") {
      return {
        nombre: formulario.datos.nombre.trim(),
        direccion: formulario.datos.direccion.trim(),
        telefono: formulario.datos.telefono.trim(),
        email: formulario.datos.email.trim(),
        sitioWeb: formulario.datos.sitioWeb.trim(),
      };
    }

   
    return {
      horarios: construirHorarios(formulario.diasSeleccionados),
      urgencias24hs: formulario.urgencias24hs,
    };
  };

  const guardarSeccion = async (seccion) => {
    const error = validarSeccion(seccion);
    if (error) {
      setErrorModal({ abierto: true, mensaje: error });
      return;
    }

    const payload = construirPayloadSeccion(seccion);

    setGuardandoSeccion((actual) => ({ ...actual, [seccion]: true }));
    try {
      const actualizada = await actualizarMiVeterinaria(payload);
      const normalizada = normalizarVeterinaria(actualizada);
      setFormulario(normalizada);
      setFormularioGuardado(normalizada);
      setSuccessModal({
        abierto: true,
        mensaje: "Los datos de tu veterinaria se actualizaron correctamente.",
      });
    } catch (errorPeticion) {
      setErrorModal({
        abierto: true,
        mensaje: obtenerMensajeError(errorPeticion, "No se pudieron guardar los cambios."),
      });
    } finally {
      setGuardandoSeccion((actual) => ({ ...actual, [seccion]: false }));
    }
  };

  if (cargando) {
    return (
      <div className={styles.page}>
        <Sidebar title="Mi Veterinaria" />
        <div className={styles.main}>
          <TopBar title="Mi Veterinaria" />
          <main className={styles.state} aria-live="polite">
            <span className={styles.spinner} />
            <p>Cargando los datos de tu veterinaria...</p>
          </main>
        </div>
      </div>
    );
  }

  if (errorCarga || !formulario) {
    return (
      <div className={styles.page}>
        <Sidebar title="Mi Veterinaria" />
        <div className={styles.main}>
          <TopBar title="Mi Veterinaria" />
          <main className={styles.state}>
            <h1>No pudimos cargar tu veterinaria</h1>
            <p>{errorCarga}</p>
            <Button texto="Reintentar" variante="primario" tamaño="mediano" onClick={cargarVeterinaria} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar title="Mi Veterinaria" />
      <div className={styles.main}>
        <TopBar title="Mi Veterinaria" />

        <main className={styles.content}>
          <header className={styles.heading}>
            <div>
              <h1>Configuración de la veterinaria</h1>
              <p>Gestioná tu equipo profesional, los servicios que ofrecés y los horarios de atención.</p>
            </div>
          </header>

          <nav className={styles.tabs} aria-label="Secciones de la veterinaria">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tab} ${tabActiva === tab ? styles.tabActiva : ""}`}
                onClick={() => setTabActiva(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {tabActiva === "Datos generales" && (
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div><h2>Datos generales</h2><p>Información pública de tu clínica.</p></div>
                <div className={styles.saveAction}>
                  {cambioDatos && (
                    <span className={styles.unsavedBadge} role="status">
                      Cambios sin guardar
                    </span>
                  )}
                  <Button
                    texto={guardandoSeccion.datos ? "Guardando..." : "Guardar"}
                    variante="primario"
                    tamaño="mediano"
                    onClick={() => guardarSeccion("datos")}
                    disabled={guardandoSeccion.datos}
                  />
                </div>
              </div>
              <div className={styles.formGrid}>
                <Input label="Nombre de la clínica *" value={formulario.datos.nombre} onChange={(e) => actualizarDatos("nombre", e.target.value)} />
                <Input label="Teléfono *" value={formulario.datos.telefono} onChange={(e) => actualizarDatos("telefono", e.target.value)} />
                <Input label="Dirección *" value={formulario.datos.direccion} onChange={(e) => actualizarDatos("direccion", e.target.value)} />
                <Input label="Email institucional *" type="email" value={formulario.datos.email} onChange={(e) => actualizarDatos("email", e.target.value)} />
                <div className={styles.fullWidth}>
                  <Input label="Sitio web" value={formulario.datos.sitioWeb} onChange={(e) => actualizarDatos("sitioWeb", e.target.value)} />
                </div>
              </div>
            </section>
          )}

          {tabActiva === "Servicios" && (
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div><h2>Servicios</h2><p>Prestaciones que los tutores pueden reservar.</p></div>
                <button className={styles.addButton} type="button" onClick={() => abrirServicio()}><IconPlus /> Agregar servicio</button>
              </div>
              <div className={styles.list}>
                {formulario.servicios.length === 0 && <div className={styles.empty}>No hay servicios cargados.</div>}
                {formulario.servicios.map((servicio, indice) => (
                  <article className={styles.itemCard} key={servicio._id || `servicio-${indice}`}>
                    <div className={styles.itemBody}><span className={styles.category}>{servicio.categoria}</span><h3>{servicio.nombre}</h3></div>
                    <strong className={styles.price}>$ {Number(servicio.precio).toLocaleString("es-AR")}</strong>
                    <div className={styles.actions}>
                      <button type="button" aria-label={`Editar ${servicio.nombre}`} onClick={() => abrirServicio(indice)}><IconEdit /></button>
                      <button type="button" aria-label={`Eliminar ${servicio.nombre}`} onClick={() => setConfirmacion({ tipo: "servicio", indice, nombre: servicio.nombre })}><IconTrash /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tabActiva === "Profesionales" && (
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div><h2>Profesionales</h2><p>Equipo que atiende en tu veterinaria.</p></div>
                <button className={styles.addButton} type="button" onClick={() => abrirProfesional()}><IconPlus /> Agregar profesional</button>
              </div>
              <div className={styles.list}>
                {formulario.profesionales.length === 0 && <div className={styles.empty}>No hay profesionales cargados.</div>}
                {formulario.profesionales.map((profesional, indice) => (
                  <article className={styles.itemCard} key={profesional._id || `profesional-${indice}`}>
                    <div className={styles.avatar}>{profesional.nombre?.charAt(0).toUpperCase() || "V"}</div>
                    <div className={styles.itemBody}><span className={styles.category}>{profesional.especialidad}</span><h3>{profesional.nombre}</h3><p>{profesional.email}</p></div>
                    <div className={styles.actions}>
                      <button type="button" aria-label={`Editar ${profesional.nombre}`} onClick={() => abrirProfesional(indice)}><IconEdit /></button>
                      <button type="button" aria-label={`Eliminar ${profesional.nombre}`} onClick={() => setConfirmacion({ tipo: "profesional", indice, nombre: profesional.nombre })}><IconTrash /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tabActiva === "Horarios" && (
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div><h2>Horarios de atención</h2><p>Configurá los días y franjas horarias de la clínica.</p></div>
                <div className={styles.saveAction}>
                  {cambioHorarios && (
                    <span className={styles.unsavedBadge} role="status">
                      Cambios sin guardar
                    </span>
                  )}
                  <Button
                    texto={guardandoSeccion.horarios ? "Guardando..." : "Guardar"}
                    variante="primario"
                    tamaño="mediano"
                    onClick={() => guardarSeccion("horarios")}
                    disabled={guardandoSeccion.horarios}
                  />
                </div>
              </div>
              <label className={styles.emergency}><input type="checkbox" checked={formulario.urgencias24hs} onChange={(e) => setFormulario((actual) => ({ ...actual, urgencias24hs: e.target.checked }))} /><span /><div><strong>Atención de urgencias 24 horas</strong><small>Mostrá que tu clínica recibe emergencias durante todo el día.</small></div></label>
              <div className={styles.schedule}>
                {DIAS.map((dia) => {
                  const activo = Boolean(formulario.diasSeleccionados[dia]);
                  const horario = formulario.diasSeleccionados[dia];
                  return (
                    <div className={`${styles.dayRow} ${activo ? styles.dayActive : ""}`} key={dia}>
                      <label className={styles.dayToggle}><input type="checkbox" checked={activo} onChange={() => toggleDia(dia)} /><span />{dia}</label>
                      {activo ? (
                        <div className={styles.timeFields}>
                          <label>Desde<select value={horario.desde} onChange={(e) => actualizarHorario(dia, "desde", e.target.value)}>{HORAS.map((hora) => <option key={hora}>{hora}</option>)}</select></label>
                          <label>Hasta<select value={horario.hasta} onChange={(e) => actualizarHorario(dia, "hasta", e.target.value)}>{HORAS.map((hora) => <option key={hora}>{hora}</option>)}</select></label>
                        </div>
                      ) : <span className={styles.closed}>Cerrado</span>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>

      <Modal isOpen={Boolean(modalEdicion)} onClose={() => (guardandoModal ? null : setModalEdicion(null))}>
        {modalEdicion && (
          <div className={styles.modalForm}>
            <h2>{modalEdicion.indice === null ? "Agregar" : "Editar"} {modalEdicion.tipo}</h2>
            <p>Completá la información y confirmá los cambios.</p>
            {modalEdicion.tipo === "servicio" ? (
              <>
                <Input label="Nombre *" value={modalEdicion.valores.nombre} onChange={(e) => actualizarModal("nombre", e.target.value)} />
                <Select label="Categoría *" opciones={categorias} value={modalEdicion.valores.categoria} onChange={(e) => actualizarModal("categoria", e.target.value)} error={errorCategorias} />
                <Input label="Precio *" type="number" value={modalEdicion.valores.precio} onChange={(e) => actualizarModal("precio", e.target.value)} />
                {cargandoCategorias && <p className={styles.helper}>Cargando categorías...</p>}
              </>
            ) : (
              <>
                <Input label="Nombre y apellido *" value={modalEdicion.valores.nombre} onChange={(e) => actualizarModal("nombre", e.target.value)} />
                <Input label="Especialidad *" value={modalEdicion.valores.especialidad} onChange={(e) => actualizarModal("especialidad", e.target.value)} />
                <Input label="Email *" type="email" value={modalEdicion.valores.email} onChange={(e) => actualizarModal("email", e.target.value)} />
              </>
            )}
            {modalEdicion.error && <p className={styles.formError}>{modalEdicion.error}</p>}
            <div className={styles.modalActions}>
              <Button texto="Cancelar" variante="secundario" tamaño="mediano" onClick={() => setModalEdicion(null)} disabled={guardandoModal} />
              <Button
                texto={guardandoModal ? "Guardando..." : "Guardar"}
                variante="primario"
                tamaño="mediano"
                onClick={guardarModal}
                disabled={guardandoModal || (modalEdicion.tipo === "servicio" && cargandoCategorias)}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal abierto={Boolean(confirmacion)} titulo={`Eliminar ${confirmacion?.tipo || "elemento"}`} mensaje={confirmacion ? `¿Querés eliminar “${confirmacion.nombre}”?` : ""} textoConfirmar={eliminando ? "Eliminando..." : "Eliminar"} onConfirm={confirmarEliminacion} onCancel={() => (eliminando ? null : setConfirmacion(null))} />
      <SuccessModal
        abierto={successModal.abierto}
        titulo="¡Listo!"
        mensaje={successModal.mensaje}
        onClose={() => setSuccessModal({ abierto: false, mensaje: "" })}
      />
      <ErrorModal abierto={errorModal.abierto} titulo="No pudimos completar la acción" mensaje={errorModal.mensaje} onClose={() => setErrorModal({ abierto: false, mensaje: "" })} />
    </div>
  );
}

export default MiVeterinaria;