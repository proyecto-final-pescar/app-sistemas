import {
  Bell,
  CalendarCheck,
  ClipboardList,
  FileText,
  Menu,
  Scale,
  Syringe,
} from "lucide-react";
import Reveal from "../ui/reveal/Reveal";
import { getMascota } from "./mascotas";
import styles from "./AppPreview.module.css";


const PET = {
  nombre: "Milo",
  tutor: "Ana Gómez",
  detalle: "Perro · Mestizo · Macho",
  chips: ["Castrado"],
  pelaje: "Pelaje: marrón claro",
};

const STATS = [
  { icon: Scale, valor: "22 kg", label: "Peso actual" },
  { icon: ClipboardList, valor: "3", label: "Consultas totales" },
];

const VACUNAS = [
  { nombre: "Vacuna antirrábica", fecha: "Aplicada: 16 de sept de 2026", vet: "Dr. Juan Pérez" },
  { nombre: "Vacuna séxtuple", fecha: "Aplicada: 30 de mar de 2026", vet: "Dr. Juan Pérez" },
  { nombre: "Vacuna quíntuple", fecha: "Aplicada: 8 de oct de 2025", vet: "Dra. Laura Díaz" },
];

const TURNO = { fecha: "Lunes, 5 de octubre · 12:00 hs", lugar: "Veterinaria Palermo" };
const ESTUDIO = { nombre: "Electrocardiograma", fecha: "9 de sept de 2026" };

const PUNTOS = [
  {
    icon: FileText,
    titulo: "Ficha médica completa",
    texto: "Peso, edad, consultas y datos permanentes de tu mascota, siempre al día.",
  },
  {
    icon: Syringe,
    titulo: "Vacunas y estudios",
    texto: "Cada vacuna con su fecha y el veterinario que la aplicó, y los resultados de estudios a un toque.",
  },
  {
    icon: CalendarCheck,
    titulo: "Turnos a la vista",
    texto: "Tu próximo turno y el historial de cada mascota, en un resumen de salud claro.",
  },
];


const LogoMark = () => (
  
 <img src="/logo-mypett.svg" alt="Ícono MyPet" className={styles.logo} />
);

       
const AppPreview = () => {
  const mascota = getMascota(5);

  return (
    <section id="app" className={styles.section}>
      <div className={styles.container}>
        {/* Texto */}
        <Reveal className={styles.textColumn}>
          <p className={styles.eyebrow}>Su historial, siempre con vos</p>
          <h2 className={styles.title}>
            Todo lo de tu mascota,{" "}
            <span className={styles.titleAccent}>en tu bolsillo.</span>
          </h2>
          <p className={styles.lead}>
            Un perfil claro y siempre actualizado, para que cualquier decisión
            sobre su salud la tomes con toda la información.
          </p>

          <ul className={styles.points}>
            {PUNTOS.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className={styles.point}>
                <span className={styles.pointIcon}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className={styles.pointTitle}>{titulo}</h3>
                  <p className={styles.pointText}>{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Mockup */}
        <Reveal delay={150} className={styles.deviceColumn}>
          <div className={styles.stage}>
            <div className={styles.glow} aria-hidden="true" />

            <div
              className={styles.phone}
              role="img"
              aria-label={`Vista previa de la ficha médica de ${PET.nombre} en la app MyPet`}
            >
              <div className={styles.notch} aria-hidden="true" />

              <div className={styles.screen} aria-hidden="true">
                {/* Header de la app */}
                <div className={styles.appBar}>
                  <LogoMark />
                  <div className={styles.appBarActions}>
                    <span className={`${styles.iconBtn} ${styles.iconBtnRound}`}>
                      <Bell size={15} />
                    </span>
                    <span className={styles.iconBtn}>
                      <Menu size={15} />
                    </span>
                  </div>
                </div>

                <h3 className={styles.screenTitle}>Ficha Médica - {PET.nombre}</h3>
                <p className={styles.screenSub}>Tutor: {PET.tutor}</p>

                {/* Identidad */}
                <div className={styles.idCard}>
                  <img
                    src={mascota.src}
                    alt=""
                    width="44"
                    height="44"
                    loading="lazy"
                    decoding="async"
                    className={styles.avatar}
                  />
                  <div className={styles.idText}>
                    <p className={styles.idName}>{PET.nombre}</p>
                    <p className={styles.idMeta}>{PET.detalle}</p>
                    <div className={styles.chips}>
                      {PET.chips.map((c) => (
                        <span key={c} className={`${styles.chip} ${styles.chipViolet}`}>
                          {c}
                        </span>
                      ))}
                      <span className={`${styles.chip} ${styles.chipGreen}`}>{PET.pelaje}</span>
                    </div>
                  </div>
                </div>

                {/* Datos rápidos */}
                <div className={styles.stats}>
                  {STATS.map(({ icon: Icon, valor, label }) => (
                    <div key={label} className={styles.stat}>
                      <Icon size={15} className={styles.statIcon} />
                      <p className={styles.statValue}>{valor}</p>
                      <p className={styles.statLabel}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Vacunas */}
                <div className={styles.vaccinesBox}>
                  <p className={styles.vaccinesTitle}>Registro de Vacunación</p>
                  <ul className={styles.vaccines}>
                    {VACUNAS.map((v) => (
                      <li key={v.nombre} className={styles.vaccine}>
                        <p className={styles.vaccineName}>{v.nombre}</p>
                        <p className={styles.vaccineDate}>{v.fecha}</p>
                        <p className={styles.vaccineVet}>{v.vet}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            
            <div className={`${styles.float} ${styles.floatTurno}`} aria-hidden="true">
              <span className={styles.floatIcon}>
                <CalendarCheck size={16} />
              </span>
              <div>
                <p className={styles.floatTitle}>{TURNO.fecha}</p>
                <p className={styles.floatMeta}>{TURNO.lugar}</p>
              </div>
            </div>

            <div className={`${styles.float} ${styles.floatEstudio}`} aria-hidden="true">
              <div>
                <p className={styles.floatTitle}>{ESTUDIO.nombre}</p>
                <p className={styles.floatMeta}>{ESTUDIO.fecha}</p>
              </div>
              <span className={styles.floatPill}>Ver resultado</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default AppPreview;