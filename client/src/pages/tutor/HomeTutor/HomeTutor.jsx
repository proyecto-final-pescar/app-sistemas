import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import PanelDestacado from "../../../components/ui/panel-destacado/PanelDestacado";
import styles from "./HomeTutor.module.css";

const FILTROS = ["Emergencias", "Vacunación", "Cerca mío"];

const HomeTutor = () => {
  const navigate = useNavigate();
  const usuario = useAuth(); 
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
    irABuscar(filtro);
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
                placeholder="Buscar clínica veterinaria 24h..."
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
            <div>
              <strong>Foro de Perdidos</strong>
              <p>Ayudá a encontrar mascotas perdidas</p>
            </div>
            <a href="/foro"><button className={styles.btnVerPublicaciones}>Ver publicaciones ›</button></a>
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