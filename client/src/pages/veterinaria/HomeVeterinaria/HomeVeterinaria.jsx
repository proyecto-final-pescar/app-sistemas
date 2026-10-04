import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { obtenerMiVeterinaria } from "../../../services/veterinariaService";
import { obtenerTurnosPorVeterinaria } from "../../../services/turnosService";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Card from "../../../components/ui/card/Card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import PanelDestacado from "../../../components/ui/panel-destacado/PanelDestacado";

import styles from "./HomeVeterinaria.module.css";


const RUTAS = {
  agenda: "/agenda",
  cargarTurnos: "/cargar-turnos",
  pacientes: "/pacientes",
};


const ESTADOS_NO_ACTIVOS = ["DIS", "CAN", "DISPONIBLE", "CANCELADO"];

const MIN_CARACTERES_BUSQUEDA = 2;


let cacheHome = null; 


const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconCalendarPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconPaw = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="10.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="15.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="19" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12.8 11.5c-2.6 0-5.3 3.3-5.3 5.4 0 1.6 1.4 2.1 2.6 2.1 1 0 1.7-.4 2.7-.4s1.7.4 2.7.4c1.2 0 2.6-.5 2.6-2.1 0-2.1-2.7-5.4-5.3-5.4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const formatearFechaLocal = (fechaInput) => {
  if (!fechaInput) return "";

  let fecha;
  if (typeof fechaInput === "string") {
    const soloFecha = fechaInput.split("T")[0];
    const [anio, mes, dia] = soloFecha.split("-").map(Number);
    fecha = new Date(anio, mes - 1, dia, 12, 0, 0);
  } else {
    fecha = new Date(fechaInput);
  }

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};


const formatearFechaLarga = (fechaStr) => {
  const iso = formatearFechaLocal(fechaStr);
  if (!iso) return "";
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia, 12, 0, 0).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const obtenerHora = (turno) => {
  const raw = turno?.hora_inicio ?? turno?.hora ?? "";
  if (!raw) return "";
  if (typeof raw === "string" && raw.includes("T")) {
    return raw.split("T")[1].slice(0, 5);
  }
  return String(raw).slice(0, 5);
};


const momentoDeTurno = (turno) => {
  const [anio, mes, dia] = formatearFechaLocal(turno?.fecha).split("-").map(Number);
  const [h = 0, m = 0] = obtenerHora(turno).split(":").map(Number);
  return new Date(anio, mes - 1, dia, h, m);
};

const obtenerEstado = (turno) =>
  String(turno?.estado_turno_id ?? turno?.estado ?? "").toUpperCase();

const esTurnoActivo = (turno) => !ESTADOS_NO_ACTIVOS.includes(obtenerEstado(turno));

const capitalizar = (texto) =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;

const normalizar = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();


const obtenerMascota = (turno) => turno?.mascota ?? turno?.mascotaId ?? null;

const obtenerIdMascota = (turno) => {
  const mascota = obtenerMascota(turno);
  return turno?.mascota_id ?? mascota?.mascota_id ?? mascota?.id ?? mascota?._id ?? null;
};

const obtenerDueno = (turno) => {
  const mascota = obtenerMascota(turno);
  const d =
    turno?.usuario ?? turno?.tutor ?? mascota?.usuario ?? mascota?.tutor ?? mascota?.dueno ?? null;
  if (!d) return "";
  return [d.nombre, d.apellido].filter(Boolean).join(" ");
};

const claveDeMascota = (turno) =>
  obtenerIdMascota(turno) ??
  `${normalizar(obtenerMascota(turno)?.nombre)}|${normalizar(obtenerDueno(turno))}`;

const HomeVeterinaria = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Clave estable del usuario para no re-disparar el efecto si el objeto cambia de referencia
  const usuarioKey =
    usuario?.usuario_id ?? usuario?.id ?? usuario?._id ?? usuario?.email ?? usuario?.nombre;

  const cache = cacheHome && usuarioKey && cacheHome.usuarioKey === usuarioKey ? cacheHome : null;

  const [nombreVet, setNombreVet] = useState(cache?.nombreVet || usuario?.nombre || "");
  const [turnos, setTurnos] = useState(cache?.turnos || []);
  const [loading, setLoading] = useState(!cache);

  // Buscador
  const [termino, setTermino] = useState("");
  const [terminoAplicado, setTerminoAplicado] = useState("");
  const [avisoBusqueda, setAvisoBusqueda] = useState("");

  useEffect(() => {
    if (!usuarioKey) return;
    let cancelado = false;

    async function cargarDatosHome() {
      try {
        let vetId = cacheHome?.usuarioKey === usuarioKey ? cacheHome.vetId : null;
        let nombre = cacheHome?.usuarioKey === usuarioKey ? cacheHome.nombreVet : "";

        // Solo se pide la veterinaria si no está cacheada
        if (!vetId) {
          const miVet = await obtenerMiVeterinaria();
          if (cancelado) return;
          vetId = miVet?.veterinaria_id ?? miVet?.id ?? miVet?._id;
          nombre = miVet?.nombre || usuario?.nombre || "";
          if (nombre) setNombreVet(nombre);
        }

        if (!vetId) {
          console.warn("HomeVeterinaria: no se pudo obtener el id de la veterinaria");
          return;
        }

        const respuesta = await obtenerTurnosPorVeterinaria(vetId);
        if (cancelado) return;

        const lista = Array.isArray(respuesta) ? respuesta : respuesta?.data || [];
        const reales = lista.filter(esTurnoActivo);

        setTurnos(reales);
        cacheHome = { usuarioKey, vetId, nombreVet: nombre, turnos: reales };
      } catch (error) {
        console.error("Error cargando el Home:", error);
        if (!cancelado && usuario?.nombre && !nombreVet) setNombreVet(usuario.nombre);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargarDatosHome();
    return () => {
      cancelado = true;
    };
    
  }, [usuarioKey]);

  /* ---------- Próximo turno ---------- */
  const proximoTurno = useMemo(() => {
    const ahora = new Date();
    const futuros = turnos
      .map((t) => ({ turno: t, momento: momentoDeTurno(t) }))
      .filter(({ momento }) => momento >= ahora)
      .sort((a, b) => a.momento - b.momento);
    return futuros.length > 0 ? futuros[0].turno : null;
  }, [turnos]);

  const pacientes = useMemo(() => {
    const ahora = new Date();
    const mapa = new Map();

    turnos.forEach((t) => {
      const mascota = obtenerMascota(t);
      if (!mascota?.nombre) return;

      const clave = claveDeMascota(t);
      if (!mapa.has(clave)) {
        mapa.set(clave, {
          clave,
          mascotaId: obtenerIdMascota(t),
          nombre: mascota.nombre,
          especie: mascota.especie?.nombre ?? mascota.especie ?? "",
          dueno: obtenerDueno(t),
          turnos: [],
        });
      }
      mapa.get(clave).turnos.push({ turno: t, momento: momentoDeTurno(t) });
    });

    return Array.from(mapa.values()).map((p) => {
      const ordenados = [...p.turnos].sort((a, b) => a.momento - b.momento);
      const futuro = ordenados.find((x) => x.momento >= ahora);
      const pasados = ordenados.filter((x) => x.momento < ahora);
      const ultimo = pasados[pasados.length - 1];
      return {
        ...p,
        proximo: futuro?.turno ?? null,
        ultimo: ultimo?.turno ?? null,
        totalTurnos: ordenados.length,
      };
    });
  }, [turnos]);

  const resultados = useMemo(() => {
    const q = normalizar(terminoAplicado);
    if (!q) return [];
    return pacientes
      .filter((p) => normalizar(`${p.dueno} ${p.nombre}`).includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [pacientes, terminoAplicado]);

  /* ---------- Acciones del buscador ---------- */
  const ejecutarBusqueda = () => {
    const limpio = termino.trim();
    if (limpio.length < MIN_CARACTERES_BUSQUEDA) {
      setTerminoAplicado("");
      setAvisoBusqueda(
        `Escribí al menos ${MIN_CARACTERES_BUSQUEDA} letras del nombre del dueño o de la mascota.`,
      );
      return;
    }
    setAvisoBusqueda("");
    setTerminoAplicado(limpio);
  };

  const limpiarBusqueda = () => {
    setTermino("");
    setTerminoAplicado("");
    setAvisoBusqueda("");
  };

  const manejarTecla = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ejecutarBusqueda();
    }
  };

  const nombreMascotaProximo = obtenerMascota(proximoTurno)?.nombre || "Mascota";
  const hayBusqueda = Boolean(terminoAplicado) || Boolean(avisoBusqueda);

  return (
    <div className={styles.shell}>
      <Sidebar role="veterinaria" activeItem="Home" title="Inicio" />

      <div className={styles.main}>
        <TopBar
          title="Home"
          notifications={2}
          userInitial={usuario?.nombre?.charAt(0)}
        />

        <div className={styles.contentWrap}>
          <PanelDestacado
            titulo={`Hola, ${nombreVet || "..."}`}
            subtitulo={capitalizar(
              new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            )}
          >
            <div className={styles.searchBarRow} onKeyDown={manejarTecla}>
              <div className={styles.inputSearchContainer}>
                <Input
                  placeholder="Buscar paciente por dueño o mascota..."
                  value={termino}
                  onChange={(e) => setTermino(e?.target ? e.target.value : e)}
                />
              </div>

              <div className={styles.btnBuscarTexto}>
                <Button
                  texto="Buscar"
                  variante="primario"
                  tamaño="mediano"
                  onClick={ejecutarBusqueda}
                />
              </div>

              <button
                type="button"
                className={styles.btnBuscarIcono}
                aria-label="Buscar"
                onClick={ejecutarBusqueda}
              >
                <IconSearch />
              </button>
            </div>

            <div className={styles.actionButtonsRow}>
              <Button
                texto="Cargar turnos"
                variante="secundario"
                tamaño="mediano"
                onClick={() => navigate(RUTAS.cargarTurnos)}
              />
              <Button
                texto="Ver agenda"
                variante="primario"
                tamaño="mediano"
                onClick={() => navigate(RUTAS.agenda)}
              />
            </div>
          </PanelDestacado>

          {/* Resultados de la búsqueda */}
          {hayBusqueda && (
            <section className={styles.resultados} aria-live="polite">
              <div className={styles.resultadosHeader}>
                <h2 className={styles.resultadosTitulo}>
                  {avisoBusqueda
                    ? "Búsqueda de pacientes"
                    : resultados.length === 1
                      ? `1 paciente para “${terminoAplicado}”`
                      : `${resultados.length} pacientes para “${terminoAplicado}”`}
                </h2>
                <button type="button" className={styles.btnLimpiar} onClick={limpiarBusqueda}>
                  Limpiar
                </button>
              </div>

              {avisoBusqueda && <p className={styles.estadoVacio}>{avisoBusqueda}</p>}

              {!avisoBusqueda && resultados.length === 0 && (
                <p className={styles.estadoVacio}>
                  No encontramos pacientes con ese nombre. Solo aparecen mascotas que ya tienen
                  turnos en tu veterinaria.
                </p>
              )}

              {resultados.length > 0 && (
                <div className={styles.resultadosGrid}>
                  {resultados.map((p) => {
                    const turnoMostrado = p.proximo || p.ultimo;
                    return (
                      <Card key={p.clave} className={styles.pacienteCard}>
                        <div className={styles.pacienteHeader}>
                          <span className={styles.icon}>
                            <IconPaw />
                          </span>
                          <div className={styles.pacienteTitulos}>
                            <h4 className={styles.pacienteNombre}>{p.nombre}</h4>
                            <p className={styles.pacienteMeta}>
                              {[p.especie, p.dueno && `Dueño: ${p.dueno}`]
                                .filter(Boolean)
                                .join(" · ") || "Sin datos del dueño"}
                            </p>
                          </div>
                        </div>

                        {turnoMostrado && (
                          <p className={styles.pacienteTurno}>
                            <span className={styles.pacienteTurnoLabel}>
                              {p.proximo ? "Próximo turno" : "Último turno"}
                            </span>
                            {formatearFechaLarga(turnoMostrado.fecha)} · {obtenerHora(turnoMostrado)} hs
                          </p>
                        )}
                        <p className={styles.pacienteMeta}>
                          {p.totalTurnos === 1 ? "1 turno" : `${p.totalTurnos} turnos`} en total
                        </p>

                        {p.mascotaId && (
                          <Link
                            to={`${RUTAS.pacientes}/${p.mascotaId}`}
                            className={styles.cardLink}
                          >
                            Ver ficha →
                          </Link>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Grilla de tarjetas */}
          <div className={styles.cardsGrid}>
            {/* Próximo turno */}
            <Card className={styles.metricCard}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}>
                  <IconCalendar />
                </span>
                <h3>Próximo turno</h3>
              </div>
              {proximoTurno ? (
                <div className={styles.cardBody}>
                  <h4 className={styles.mainDetail}>{nombreMascotaProximo}</h4>
                  {proximoTurno.motivo && (
                    <p className={styles.subDetail}>{proximoTurno.motivo}</p>
                  )}
                  <p className={styles.timeDetail}>
                    {formatearFechaLarga(proximoTurno.fecha)} · {obtenerHora(proximoTurno)} hs
                  </p>
                </div>
              ) : (
                <div className={styles.cardBody}>
                  <p className={styles.emptyText}>
                    {loading ? "Cargando..." : "No hay turnos próximos agendados."}
                  </p>
                </div>
              )}
            </Card>

            {/* Cargar turnos */}
            <Card className={styles.metricCard}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}>
                  <IconCalendarPlus />
                </span>
                <h3>Cargar turnos</h3>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.subDetail}>
                  Publicá los horarios en los que atendés para que los dueños puedan reservar.
                </p>
              </div>
              <Link to={RUTAS.cargarTurnos} className={styles.cardLink}>
                Cargar turnos →
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeVeterinaria;