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
  especialidades: Array.isArray(veterinaria.especialidades)
    ? veterinaria.especialidades
    : [],
  servicios: Array.isArray(veterinaria.servicios)
    ? veterinaria.servicios.map((servicio) => ({
        ...servicio,
        duracion: servicio.duracion ?? 30,
      }))
    : [],
  profesionales: Array.isArray(veterinaria.profesionales)
    ? veterinaria.profesionales.map((profesional) => ({ ...profesional }))
    : [],
  diasSeleccionados: horariosASeleccionados(veterinaria.horarios),
  urgencias24hs: Boolean(veterinaria.urgencias24hs),
});

function MiVeterinaria() {
  const { categorias, loading: cargandoCategorias, error: errorCategorias } =
    useCategoriasServicio();
  const [tabActiva, setTabActiva] = useState(TABS[0]);
  const [formulario, setFormulario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [especialidadNueva, setEspecialidadNueva] = useState("");
  const [modalEdicion, setModalEdicion] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ abierto: false, mensaje: "" });

  const cargarVeterinaria = async () => {
    setCargando(true);
    setErrorCarga("");

    try {
      const veterinaria = await obtenerMiVeterinaria();
      setFormulario(normalizarVeterinaria(veterinaria));
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
        if (activo) setFormulario(normalizarVeterinaria(veterinaria));
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

  const actualizarDatos = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      datos: { ...actual.datos, [campo]: valor },
    }));
  };

  const agregarEspecialidad = () => {
    const especialidad = especialidadNueva.trim();
    if (!especialidad) return;
    if (formulario.especialidades.some((item) => item.toLowerCase() === especialidad.toLowerCase())) {
      setErrorModal({ abierto: true, mensaje: "Esa especialidad ya está agregada." });
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      especialidades: [...actual.especialidades, especialidad],
    }));
    setEspecialidadNueva("");
  };

  const abrirServicio = (indice = null) => {
    const servicio = indice === null
      ? { nombre: "", categoria: "", precio: "", duracion: 30 }
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

  const guardarModal = () => {
    const { tipo, indice, valores } = modalEdicion;
    let error = "";

    if (tipo === "servicio") {
      if (!valores.nombre.trim() || !valores.categoria) {
        error = "Completá el nombre y la categoría del servicio.";
      } else if (!validarPrecio(valores.precio)) {
        error = "El precio debe ser numérico y mayor a cero.";
      } else if (!Number.isFinite(Number(valores.duracion)) || Number(valores.duracion) < 15 || Number(valores.duracion) > 480) {
        error = "La duración debe estar entre 15 y 480 minutos.";
      }
    } else if (!valores.nombre.trim() || !valores.especialidad.trim() || !valores.email.trim()) {
      error = "Completá todos los datos del profesional.";
    } else if (!validarEmail(valores.email)) {
      error = "Ingresá un email válido para el profesional.";
    }

    if (error) {
      setModalEdicion((actual) => ({ ...actual, error }));
      return;
    }

    const clave = tipo === "servicio" ? "servicios" : "profesionales";
    const normalizado = tipo === "servicio"
      ? { ...valores, precio: Number(valores.precio), duracion: Number(valores.duracion) }
      : { ...valores };

    setFormulario((actual) => {
      const items = [...actual[clave]];
      if (indice === null) items.push(normalizado);
      else items[indice] = normalizado;
      return { ...actual, [clave]: items };
    });
    setModalEdicion(null);
  };

  const confirmarEliminacion = () => {
    const { tipo, indice } = confirmacion;
    const clave = tipo === "servicio" ? "servicios" : "profesionales";
    setFormulario((actual) => ({
      ...actual,
      [clave]: actual[clave].filter((_, posicion) => posicion !== indice),
    }));
    setConfirmacion(null);
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

  const validarFormulario = () => {
    const { datos, servicios, profesionales, diasSeleccionados } = formulario;
    if (!datos.nombre.trim() || !datos.direccion.trim() || !datos.telefono.trim() || !datos.email.trim()) {
      return "Completá los datos generales obligatorios.";
    }
    if (!validarTelefono(datos.telefono)) return "Ingresá un teléfono válido.";
    if (!validarEmail(datos.email)) return "Ingresá un email institucional válido.";
    if (servicios.some((s) => !s.nombre?.trim() || !s.categoria || !validarPrecio(s.precio) || Number(s.duracion) < 15 || Number(s.duracion) > 480)) {
      return "Revisá los datos de los servicios.";
    }
    if (profesionales.some((p) => !p.nombre?.trim() || !p.especialidad?.trim() || !validarEmail(p.email || ""))) {
      return "Revisá los datos de los profesionales.";
    }
    if (Object.keys(diasSeleccionados).length === 0) return "Seleccioná al menos un día de atención.";
    return validarHorarios(diasSeleccionados);
  };

  const guardarCambios = async () => {
    const error = validarFormulario();
    if (error) {
      setErrorModal({ abierto: true, mensaje: error });
      return;
    }

    const payload = {
      nombre: formulario.datos.nombre.trim(),
      direccion: formulario.datos.direccion.trim(),
      telefono: formulario.datos.telefono.trim(),
      email: formulario.datos.email.trim(),
      sitioWeb: formulario.datos.sitioWeb.trim(),
      especialidades: formulario.especialidades.map((item) => item.trim()),
      servicios: formulario.servicios.map((servicio) => ({
        ...(servicio._id ? { _id: servicio._id } : {}),
        nombre: servicio.nombre.trim(),
        categoria: servicio.categoria,
        precio: Number(servicio.precio),
        duracion: Number(servicio.duracion),
      })),
      profesionales: formulario.profesionales.map((profesional) => ({
        ...(profesional._id ? { _id: profesional._id } : {}),
        nombre: profesional.nombre.trim(),
        especialidad: profesional.especialidad.trim(),
        email: profesional.email.trim(),
        ...(Array.isArray(profesional.serviciosIds)
          ? { serviciosIds: profesional.serviciosIds }
          : {}),
      })),
      horarios: construirHorarios(formulario.diasSeleccionados),
      urgencias24hs: formulario.urgencias24hs,
    };

    setGuardando(true);
    try {
      const actualizada = await actualizarMiVeterinaria(payload);
      setFormulario(normalizarVeterinaria(actualizada));
      setSuccessModal(true);
    } catch (errorPeticion) {
      setErrorModal({
        abierto: true,
        mensaje: obtenerMensajeError(errorPeticion, "No se pudieron guardar los cambios."),
      });
    } finally {
      setGuardando(false);
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
            <div className={styles.saveAction}>
              <Button
                texto={guardando ? "Guardando..." : "Guardar cambios"}
                variante="primario"
                tamaño="mediano"
                onClick={guardarCambios}
                disabled={guardando}
              />
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
                <div><h2>Datos generales</h2><p>Información pública y especialidades de tu clínica.</p></div>
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
              <div className={styles.specialties}>
                <h3>Especialidades</h3>
                <div className={styles.addSpecialty}>
                  <input value={especialidadNueva} onChange={(e) => setEspecialidadNueva(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarEspecialidad(); } }} placeholder="Ej: Cardiología" />
                  <button type="button" onClick={agregarEspecialidad}><IconPlus /> Agregar</button>
                </div>
                <div className={styles.chips}>
                  {formulario.especialidades.length === 0 && <p className={styles.emptyInline}>Todavía no agregaste especialidades.</p>}
                  {formulario.especialidades.map((especialidad, indice) => (
                    <span className={styles.chip} key={`${especialidad}-${indice}`}>
                      {especialidad}
                      <button type="button" aria-label={`Eliminar ${especialidad}`} onClick={() => setFormulario((actual) => ({ ...actual, especialidades: actual.especialidades.filter((_, posicion) => posicion !== indice) }))}>×</button>
                    </span>
                  ))}
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
                    <div className={styles.itemBody}><span className={styles.category}>{servicio.categoria}</span><h3>{servicio.nombre}</h3><p>{servicio.duracion} minutos</p></div>
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
              <div className={styles.sectionHeading}><div><h2>Horarios de atención</h2><p>Configurá los días y franjas horarias de la clínica.</p></div></div>
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
              <label className={styles.emergency}><input type="checkbox" checked={formulario.urgencias24hs} onChange={(e) => setFormulario((actual) => ({ ...actual, urgencias24hs: e.target.checked }))} /><span /><div><strong>Atención de urgencias 24 horas</strong><small>Mostrá que tu clínica recibe emergencias durante todo el día.</small></div></label>
            </section>
          )}
        </main>
      </div>

      <Modal isOpen={Boolean(modalEdicion)} onClose={() => setModalEdicion(null)}>
        {modalEdicion && (
          <div className={styles.modalForm}>
            <h2>{modalEdicion.indice === null ? "Agregar" : "Editar"} {modalEdicion.tipo}</h2>
            <p>Completá la información y confirmá los cambios.</p>
            {modalEdicion.tipo === "servicio" ? (
              <>
                <Input label="Nombre *" value={modalEdicion.valores.nombre} onChange={(e) => actualizarModal("nombre", e.target.value)} />
                <Select label="Categoría *" opciones={categorias} value={modalEdicion.valores.categoria} onChange={(e) => actualizarModal("categoria", e.target.value)} error={errorCategorias} />
                <Input label="Precio *" type="number" value={modalEdicion.valores.precio} onChange={(e) => actualizarModal("precio", e.target.value)} />
                <Input label="Duración en minutos *" type="number" value={modalEdicion.valores.duracion} onChange={(e) => actualizarModal("duracion", e.target.value)} />
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
              <Button texto="Cancelar" variante="secundario" tamaño="mediano" onClick={() => setModalEdicion(null)} />
              <Button texto="Guardar" variante="primario" tamaño="mediano" onClick={guardarModal} disabled={modalEdicion.tipo === "servicio" && cargandoCategorias} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal abierto={Boolean(confirmacion)} titulo={`Eliminar ${confirmacion?.tipo || "elemento"}`} mensaje={confirmacion ? `¿Querés eliminar “${confirmacion.nombre}”? El cambio se aplicará al guardar.` : ""} textoConfirmar="Eliminar" onConfirm={confirmarEliminacion} onCancel={() => setConfirmacion(null)} />
      <SuccessModal abierto={successModal} titulo="Cambios guardados" mensaje="Los datos de tu veterinaria se actualizaron correctamente." onClose={() => setSuccessModal(false)} />
      <ErrorModal abierto={errorModal.abierto} titulo="No pudimos completar la acción" mensaje={errorModal.mensaje} onClose={() => setErrorModal({ abierto: false, mensaje: "" })} />
    </div>
  );
}

export default MiVeterinaria;
