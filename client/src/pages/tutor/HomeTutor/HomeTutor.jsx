import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
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

const HomeTutor = () => {
  const navigate = useNavigate();
 const { usuario } = useAuth(); 
  const [query, setQuery] = useState("");

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
      <Sidebar />

      <div className={styles.pageWrapper}>
        <TopBar title="Home" />

        <main className={styles.content}>
          <PanelDestacado
            titulo={`¡Hola de vuelta, ${usuario.nombre} 👋`}
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
              <a href="#">Ver historial ›</a>
            </header>
            {/* a completar con las secciones faltantes  */}
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomeTutor;