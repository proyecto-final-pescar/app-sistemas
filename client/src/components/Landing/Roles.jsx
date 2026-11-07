import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import Button from "../ui/button/Button";
import Reveal from "../ui/reveal/Reveal";
import { getMascota } from "./mascotas";
import styles from "./Roles.module.css";

const roles = {
  tutor: {
    label: "Soy dueño",
    titulo: "Todo sobre tu mascota, a un clic",
    items: [
      "Sacá turno online con la veterinaria que elijas",
      "Llevá el historial clínico siempre a mano",
      "Encontrá clínicas de urgencias 24h cerca tuyo",
      "Publicá y buscá mascotas perdidas en el foro",
    ],
    cta: "Registrarme como dueño",
    foto: 3,
  },
  veterinaria: {
    label: "Soy veterinaria",
    titulo: "Menos papeles, más tiempo para tus pacientes",
    items: [
      "Gestioná tus turnos desde un solo panel",
      "Registrá consultas y actualizá cada historial",
      "Mostrale tu clínica a dueños de tu zona",
      "Alta verificada por el equipo de MyPet",
    ],
    cta: "Registrar mi veterinaria",
    foto: 6,
  },
};

const Roles = () => {
  const navigate = useNavigate();
  const [rol, setRol] = useState("tutor");
  const actual = roles[rol];
  const foto = getMascota(actual.foto);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <h2 className={styles.title}>Una plataforma, dos formas de usarla</h2>

          <div className={styles.toggle} role="tablist" aria-label="Tipo de usuario">
            {Object.entries(roles).map(([clave, r]) => (
              <button
                key={clave}
                type="button"
                role="tab"
                aria-selected={rol === clave}
                className={`${styles.toggleBtn} ${rol === clave ? styles.toggleBtnActive : ""}`}
                onClick={() => setRol(clave)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className={styles.content} key={rol}>
            <div className={styles.text}>
              <h3 className={styles.subtitle}>{actual.titulo}</h3>
              <ul className={styles.list}>
                {actual.items.map((item) => (
                  <li key={item} className={styles.item}>
                    <span className={styles.check}>
                      <Check size={16} aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                texto={actual.cta}
                variante="primario"
                tamaño="grande"
                onClick={() => navigate("/registro")}
              />
            </div>

            <img
              src={foto.src}
              alt={foto.alt}
              loading="lazy"
              decoding="async"
              className={`${styles.photo} ${rol === "tutor" ? styles.photoTutor : styles.photoVet}`}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Roles;
