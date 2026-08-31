import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, PawPrint } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../services/api";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import PanelDestacado from "../../../components/ui/panel-destacado/PanelDestacado";
import styles from "./HomeTutor.module.css";

const FILTROS = ["Emergencias", "Vacunación", "Cerca mío"];

const IconAlerta = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const formatearFechaHora = (fecha, hora) => {
  const fechaStr = typeof fecha === "string" ? fecha.slice(0, 10) : new Date(fecha).toISOString().slice(0, 10);
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  const fechaObj = new Date(anio, mes - 1, dia);
  const fechaFormateada = fechaObj.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const capitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  return `${capitalizada} · ${hora} hs`;
};

const HomeTutor = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState("");

  const [mascotas, setMascotas] = useState([]);
  const [proximosTurnosPorMascota, setProximosTurnosPorMascota] = useState({});
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [errorResumen, setErrorResumen] = useState(null);

  useEffect(() => {
    const cargarResumenSalud = async () => {
      setCargandoResumen(true);
      setErrorResumen(null);
      try {
        const hoy = new Date().toISOString().slice(0, 10);

        const [resMascotas, resTurnos] = await Promise.all([
          api.get("/mascotas"),
          api.get("/turnos", {
            params: { usuarioId: "me", fechaDesde: hoy, estadoDistinto: "atendido" },
          }),
        ]);

        const mascotasData = resMascotas.data;
        const turnosData = resTurnos.data?.data?.turnos || [];

        // Me quedo con el turno más próximo por mascota (ya vienen ordenados
        // por fecha/hora ascendente desde el backend)
        const proximoPorMascota = {};
        for (const turno of turnosData) {
          const idMascota = turno.mascotaId?._id || turno.mascotaId;
          if (!idMascota || proximoPorMascota[idMascota]) continue;
          proximoPorMascota[idMascota] = turno;
        }

        setMascotas(mascotasData);
        setProximosTurnosPorMascota(proximoPorMascota);
      } catch (error) {
        console.error("Error al cargar el resumen de salud:", error);
        setErrorResumen("No pudimos cargar el resumen de salud.");
      } finally {
        setCargandoResumen(false);
      }
    };

    cargarResumenSalud();
  }, []);

  const irABuscar = (q) => {
    const texto = q.trim();
    navigate(texto ? `/veterinarias?q=${encodeURIComponent(texto)}` : "/veterinarias");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    irABuscar(query);
  };

  const handleFiltro = (filtro) => {
    navigate(`/veterinarias?filtro=${encodeURIComponent(filtro)}`);
  };

  return (
    <div className={styles.layout}>
      <Sidebar role="tutor" activeItem="Home" title="Home" />

      <div className={styles.pageWrapper}>
        <TopBar title="Home" />

        <main className={styles.content}>
          <PanelDestacado
            titulo={`¡Hola de vuelta, ${usuario?.nombre} 👋`}
            subtitulo="Encontrá la mejor atención para tu mejor amigo."
          >
            <form className={styles.buscador} onSubmit={handleSubmit}>
              <input
                type="text"
                className={styles.inputBuscar}
                placeholder="Buscar clínica veterinaria..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className={styles.btnBuscar}>
                Buscar
              </button>
            </form>

            <div className={styles.chips}>
              {FILTROS.map((filtro) => (
                <button
                  key={filtro}
                  type="button"
                  className={styles.chip}
                  onClick={() => handleFiltro(filtro)}
                >
                  {filtro}
                </button>
              ))}
            </div>
          </PanelDestacado>

          <section className={styles.foroPerdidos}>
            <div className={styles.foroPerdidosInfo}>
              <span className={styles.foroPerdidosIcono}>
                <IconAlerta />
              </span>
              <div>
                <strong>Foro de Perdidos</strong>
                <p>Ayudá a encontrar mascotas perdidas</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.btnVerPublicaciones}
              onClick={() => navigate("/foro")}
            >
              Ver publicaciones ›
            </button>
          </section>

          <section className={styles.resumenSalud}>
            <header>
              <h3>Resumen de Salud</h3>
              <button
                type="button"
                className={styles.linkVerTodo}
                onClick={() => navigate("/mascotas")}
              >
                Ver mis mascotas ›
              </button>
            </header>

            {cargandoResumen ? (
              <p className={styles.resumenSaludEstado}>Cargando...</p>
            ) : errorResumen ? (
              <p className={styles.resumenSaludEstado}>{errorResumen}</p>
            ) : mascotas.length === 0 ? (
              <div className={styles.resumenSaludVacio}>
                <PawPrint size={28} />
                <p>Todavía no agregaste ninguna mascota.</p>
                <button type="button" onClick={() => navigate("/mascotas")}>
                  Agregar mascota
                </button>
              </div>
            ) : (
              <div className={styles.mascotasGrid}>
                {mascotas.map((mascota) => {
                  const proximoTurno = proximosTurnosPorMascota[mascota._id];

                  return (
                    <article key={mascota._id} className={styles.mascotaCard}>
                      <div className={styles.mascotaCardHeader}>
                        {mascota.foto ? (
                          <img
                            src={mascota.foto}
                            alt={mascota.nombre}
                            className={styles.mascotaFoto}
                          />
                        ) : (
                          <div className={styles.mascotaFotoPlaceholder}>
                            <PawPrint size={20} />
                          </div>
                        )}
                        <div>
                          <strong className={styles.mascotaNombre}>{mascota.nombre}</strong>
                          <span className={styles.mascotaEspecie}>{mascota.especie}</span>
                        </div>
                      </div>

                      {proximoTurno ? (
                        <div className={styles.proximoTurno}>
                          <Calendar size={18} />
                          <div>
                            <p className={styles.proximoTurnoFecha}>
                              {formatearFechaHora(proximoTurno.fecha, proximoTurno.hora)}
                            </p>
                            <p className={styles.proximoTurnoLugar}>
                              {proximoTurno.veterinariaId?.nombre}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.sinTurnos}>Sin turnos próximos</p>
                      )}

                      <div className={styles.mascotaCardAcciones}>
                        {proximoTurno && (
                          <button
                            type="button"
                            className={styles.btnSecundario}
                            onClick={() => navigate(`/mis-turnos`)}
                          >
                            Ver turno
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.btnTexto}
                          onClick={() => navigate(`/tutor/historial-medico/${mascota._id}`)}
                        >
                          Ver historial
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomeTutor;