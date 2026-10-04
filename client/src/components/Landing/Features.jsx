import {
  ArrowRight,
  Calendar,
  CreditCard,
  Heart,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import Reveal from "../ui/reveal/Reveal";
import { getMascota } from "./mascotas";
import styles from "./Features.module.css";


const features = [
  {
    icon: Calendar,
    title: "Turnos online",
    description: "Reservá con tu veterinaria cuando quieras, sin llamadas ni esperas.",
    tint: "a",
   
  },
  {
    icon: Heart,
    title: "Perfil de tu mascota",
    description: "Toda su historia clínica, vacunas y estudios en un solo lugar.",
    tint: "b",
    
  },
  {
    icon: Search,
    title: "Mascotas perdidas",
    description: "Una comunidad atenta para ayudar a que vuelvan a casa.",
    tint: "c",
  },
  {
    icon: MapPin,
    title: "Urgencias cerca",
    description: "Encontrá clínicas veterinarias disponibles estés donde estés.",
    tint: "a",
  },
  {
    icon: CreditCard,
    title: "Pagos simples",
    description: "Pagá tus consultas de forma segura con Mercado Pago.",
    tint: "b",
   
  },
  {
    icon: Sparkles,
    title: "Asistente con IA",
    description: "Respuestas útiles para acompañarte en cada etapa.",
    tint: "c",
  },
];

const Features = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Todo lo que necesitás</p>
              <h2 className={styles.title}>
                Una app que entiende{" "}
                <span className={styles.titleAccent}>lo importante.</span>
              </h2>
            </div>
            <p className={styles.lead}>
              Porque ser parte de su vida también es estar pendiente de su
              salud, sus momentos y todo lo que los hace felices.
            </p>
          </header>
        </Reveal>

        <div className={styles.grid}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal
                key={feature.title}
                delay={(index % 3) * 100}
                className={styles.revealItem}
              >
                <article className={`${styles.card} ${styles[`tint${feature.tint}`]}`}>
                  <div className={styles.cardTop}>
                    <span className={styles.iconWrapper}>
                      <Icon size={24} aria-hidden="true" />
                    </span>

                    {feature.mascota && (
                      <img
                        src={getMascota(index + 3).src}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className={styles.petAvatar}
                      />
                    )}
                  </div>

                  <h3 className={styles.cardTitle}>
                    {feature.title}
                    {feature.proximamente && (
                      <span className={styles.soon}>Próximamente</span>
                    )}
                  </h3>
                  <p className={styles.cardDescription}>{feature.description}</p>

                  <span className={styles.arrow} aria-hidden="true">
                    <ArrowRight size={20} />
                  </span>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;