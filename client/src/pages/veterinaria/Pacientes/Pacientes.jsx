import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import { obtenerPacientesVeterinaria } from "../../../services/pacientesService";

import styles from "./Pacientes.module.css";

const obtenerEmojiEspecie = (especie = "") => {
  const valor = especie.toLowerCase();

  if (valor.includes("perro") || valor.includes("canino")) return "🐶";
  if (valor.includes("gato") || valor.includes("felino")) return "🐱";
  if (valor.includes("conejo")) return "🐰";
  if (valor.includes("ave") || valor.includes("pájaro")) return "🐦";

  return "🐾";
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return "Edad no disponible";

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let años = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();

  if (
    diferenciaMeses < 0 ||
    (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    años -= 1;
  }

  return años === 1 ? "1 año" : `${años} años`;
};

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPacientes = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta = await obtenerPacientesVeterinaria();
        setPacientes(Array.isArray(respuesta.data) ? respuesta.data : []);
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
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return pacientes;

    return pacientes.filter((paciente) => {
      const nombreMascota = paciente.nombre?.toLowerCase() || "";
      const nombreDueño = paciente.dueño?.nombre?.toLowerCase() || "";

      return (
        nombreMascota.includes(texto) ||
        nombreDueño.includes(texto)
      );
    });
  }, [pacientes, busqueda]);

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
                {pacientes.length} paciente
                {pacientes.length !== 1 ? "s" : ""} registrado
                {pacientes.length !== 1 ? "s" : ""}
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

          {!cargando && !error && pacientesFiltrados.length === 0 && (
            <div className={styles.stateMessage}>
              {busqueda
                ? "No se encontraron pacientes para esa búsqueda."
                : "Todavía no hay pacientes registrados."}
            </div>
          )}

          {!cargando && !error && pacientesFiltrados.length > 0 && (
            <section className={styles.grid}>
              {pacientesFiltrados.map((paciente) => (
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
                    </div>

                    <p>{calcularEdad(paciente.fechaNacimiento)}</p>

                    <div className={styles.owner}>
                      <span>Dueño/a</span>
                      <strong>{paciente.dueño?.nombre}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Pacientes;