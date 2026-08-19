import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import { obtenerPacientesVeterinaria } from "../../../services/pacientesService";
import { formatearEdad } from "../../../utils/EdadMascota";

import styles from "./Pacientes.module.css";

const PACIENTES_POR_PAGINA = 12;
const DEBOUNCE_BUSQUEDA_MS = 400;

const obtenerEmojiEspecie = (especie = "") => {
  const valor = especie.toLowerCase();

  if (valor.includes("perro") || valor.includes("canino")) return "🐶";
  if (valor.includes("gato") || valor.includes("felino")) return "🐱";
  if (valor.includes("conejo")) return "🐰";
  if (valor.includes("ave") || valor.includes("pájaro")) return "🐦";

  return "🐾";
};

function Pacientes() {
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalPacientes, setTotalPacientes] = useState(0);

  // Debounce: esperamos que el usuario deje de tipear antes de pegarle al
  // backend, y reseteamos a la página 1 porque el set de resultados cambia.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, DEBOUNCE_BUSQUEDA_MS);

    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    const cargarPacientes = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta = await obtenerPacientesVeterinaria(
          pagina,
          PACIENTES_POR_PAGINA,
          busquedaAplicada
        );
        setPacientes(Array.isArray(respuesta.data) ? respuesta.data : []);
        setTotalPaginas(respuesta.paginacion?.totalPaginas || 1);
        setTotalPacientes(respuesta.paginacion?.total || 0);
      } catch (errorPeticion) {
        console.error("Error al cargar pacientes:", errorPeticion);

        setError(
          errorPeticion.response?.data?.message ||
            "No se pudieron cargar los pacientes."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarPacientes();
  }, [pagina, busquedaAplicada]);

  const irAPaginaAnterior = () => {
    setPagina((actual) => Math.max(actual - 1, 1));
  };

  const irAPaginaSiguiente = () => {
    setPagina((actual) => Math.min(actual + 1, totalPaginas));
  };

  return (
    <div className={styles.page}>
      <Sidebar role="veterinaria" activeItem="Pacientes" />

      <div className={styles.main}>
        <TopBar title="Pacientes" notifications={2} />

        <main className={styles.content}>
          <section className={styles.header}>
            <div>
              <h1>Pacientes</h1>
              <p>
                {totalPacientes} paciente
                {totalPacientes !== 1 ? "s" : ""} registrado
                {totalPacientes !== 1 ? "s" : ""}
              </p>
            </div>

            <div className={styles.searchBox}>
              <Search size={18} />

              <input
                type="search"
                placeholder="Buscar por mascota o dueño/a..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
            </div>
          </section>

          {cargando && (
            <div className={styles.stateMessage}>
              Cargando pacientes...
            </div>
          )}

          {!cargando && error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {!cargando && !error && pacientes.length === 0 && (
            <div className={styles.stateMessage}>
              {busquedaAplicada
                ? "No se encontraron pacientes para esa búsqueda."
                : "Todavía no hay pacientes registrados."}
            </div>
          )}

          {!cargando && !error && pacientes.length > 0 && (
            <>
              <section className={styles.grid}>
                {pacientes.map((paciente) => (
                  <article key={paciente.id} className={styles.card}>
                    <div className={styles.avatar}>
                      {paciente.foto ? (
                        <img
                          src={paciente.foto}
                          alt={`Foto de ${paciente.nombre}`}
                        />
                      ) : (
                        <span>
                          {obtenerEmojiEspecie(paciente.especie)}
                        </span>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <h2>{paciente.nombre}</h2>

                      <div className={styles.petData}>
                        <span>{paciente.especie}</span>
                        <span>•</span>
                        <span>{paciente.raza}</span>
                        <span>•</span>
                        <span>{formatearEdad(paciente.fechaNacimiento)}</span>
                      </div>

                      <div className={styles.owner}>
                        <span>Dueño/a</span>
                        <strong>{paciente.dueño?.nombre}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.verFichaButton}
                      onClick={() => navigate(`/pacientes/${paciente.id}`)}
                    >
                      Ver ficha
                    </button>
                  </article>
                ))}
              </section>

              {totalPaginas > 1 && (
                <nav className={styles.paginacion} aria-label="Paginación de pacientes">
                  <button
                    type="button"
                    onClick={irAPaginaAnterior}
                    disabled={pagina === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span>
                    Página {pagina} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    onClick={irAPaginaSiguiente}
                    disabled={pagina === totalPaginas}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Pacientes;