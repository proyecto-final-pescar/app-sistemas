import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  LocateFixed,
  MapPin,
  PawPrint,
  Phone,
  Route,
  Search,
} from "lucide-react";
import Reveal from "../ui/reveal/Reveal";
import styles from "./UrgenciasMap.module.css";

/* ---------- Datos de ejemplo (reemplazalos por clínicas reales) ----------
   x / y: posición del pin en el mapa, en porcentaje (0-100).
   km: distancia numérica (se usa para el filtro "Cerca mío"). */
const CLINICAS = [
  {
    id: "palermo",
    nombre: "VetCenter Palermo 24h",
    barrio: "Palermo",
    direccion: "Av. Santa Fe 3500, CABA",
    km: 1.2,
    telefono: "11 5555-0142",
    abierto: true,
    urgencias24: true,
    especialidades: ["Clínica general", "Cirugía", "Vacunación"],
    x: 30,
    y: 26,
  },
  {
    id: "caballito",
    nombre: "Urgencias Vet Caballito",
    barrio: "Caballito",
    direccion: "Av. Rivadavia 5200, CABA",
    km: 2.1,
    telefono: "11 5555-0187",
    abierto: true,
    urgencias24: true,
    especialidades: ["Cardiología", "Dermatología", "Vacunación"],
    x: 22,
    y: 60,
  },
  {
    id: "belgrano",
    nombre: "Hospital Veterinario Belgrano",
    barrio: "Belgrano",
    direccion: "Av. Cabildo 2100, CABA",
    km: 2.8,
    telefono: "11 5555-0233",
    abierto: true,
    urgencias24: false,
    especialidades: ["Clínica general", "Cirugía"],
    x: 62,
    y: 16,
  },
  {
    id: "almagro",
    nombre: "Clínica Vet Almagro",
    barrio: "Almagro",
    direccion: "Av. Corrientes 4300, CABA",
    km: 3.4,
    telefono: "11 5555-0291",
    abierto: false,
    urgencias24: false,
    especialidades: ["Dermatología", "Vacunación"],
    x: 72,
    y: 54,
  },
];

// Posición de "Estás acá"
const USUARIO = { x: 46, y: 46 };

const FILTROS = [
  { id: "cerca", label: "Cerca mío", icon: MapPin },
  { id: "24h", label: "24hs", icon: Clock },
  { id: "todas", label: "Todas", icon: null },
];

const normalizar = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const formatoKm = (km) => `${String(km).replace(".", ",")} km`;

const UrgenciasMap = () => {
  const navigate = useNavigate();
  const [activoId, setActivoId] = useState(CLINICAS[0].id);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    let lista = CLINICAS.filter((c) =>
      normalizar(`${c.nombre} ${c.barrio} ${c.direccion}`).includes(q)
    );
    if (filtro === "24h") lista = lista.filter((c) => c.urgencias24);
    if (filtro === "cerca") lista = lista.filter((c) => c.km <= 3);
    return lista;
  }, [busqueda, filtro]);

  const activa = visibles.find((c) => c.id === activoId) ?? visibles[0] ?? null;
  const abiertas = visibles.filter((c) => c.abierto).length;

  const irAClinica = () => navigate("/registro");

  return (
    <section id="urgencias" className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Urgencias 24h</p>
            <h2 className={styles.title}>
              Cuando no hay tiempo,{" "}
              <span className={styles.titleAccent}>la clínica está cerca.</span>
            </h2>
            <p className={styles.lead}>
              Mirá qué clínicas de urgencias 24h tenés alrededor en CABA y
              llegá en minutos — sin llamadas, sin estrés.
            </p>
          </header>
        </Reveal>

        <div className={styles.layout}>
          {/* ---------- Mapa ---------- */}
          <Reveal className={styles.mapReveal}>
            <div className={styles.map}>
              <svg
                className={styles.svg}
                viewBox="0 0 640 520"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <rect width="640" height="520" fill="#f5f3ff" />

                {/* Río */}
                <path
                  d="M560 0 C 610 110 520 230 590 350 S 612 470 584 520 L 640 520 L 640 0 Z"
                  fill="#ddd6fe"
                />

                {/* Manzanas y calles (grilla levemente girada) */}
                <g transform="rotate(-14 320 260)">
                  <rect x="150" y="120" width="86" height="58" rx="14" fill="#d1fae5" />
                  <rect x="360" y="300" width="110" height="64" rx="16" fill="#d1fae5" />
                  <rect x="40" y="330" width="70" height="54" rx="14" fill="#d1fae5" />

                  {Array.from({ length: 13 }, (_, i) => (
                    <line
                      key={`v${i}`}
                      x1={-80 + i * 72}
                      y1="-120"
                      x2={-80 + i * 72}
                      y2="660"
                      stroke="#ffffff"
                      strokeWidth={i % 4 === 0 ? 13 : 6}
                    />
                  ))}
                  {Array.from({ length: 11 }, (_, i) => (
                    <line
                      key={`h${i}`}
                      x1="-120"
                      y1={-60 + i * 62}
                      x2="780"
                      y2={-60 + i * 62}
                      stroke="#ffffff"
                      strokeWidth={i % 4 === 0 ? 13 : 6}
                    />
                  ))}
                </g>
              </svg>

              {/* Botón de ubicación (decorativo, como en la app) */}
              <span className={styles.locate} aria-hidden="true">
                <LocateFixed size={20} />
              </span>

              {/* Ubicación del usuario */}
              <span
                className={styles.user}
                style={{ left: `${USUARIO.x}%`, top: `${USUARIO.y}%` }}
              >
                <span className={styles.userDot} />
                <span className={styles.userLabel}>Estás acá</span>
              </span>

              {/* Pines */}
              {visibles.map((c) => {
                const seleccionada = activa && c.id === activa.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.pin} ${seleccionada ? styles.pinActive : ""} ${
                      !c.abierto ? styles.pinClosed : ""
                    }`}
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                    onClick={() => setActivoId(c.id)}
                    aria-label={`${c.nombre}, a ${formatoKm(c.km)}`}
                    aria-pressed={seleccionada}
                  >
                    <PawPrint size={18} aria-hidden="true" />
                  </button>
                );
              })}

              {/* Popup de la clínica (igual al de la app). En mobile se oculta:
                  ahí manda la tarjeta expandida de la lista. */}
              {activa && (
                <div key={activa.id} className={styles.popup} aria-live="polite">
                  <p className={styles.popupName}>{activa.nombre}</p>
                  <p className={styles.popupRow}>
                    <MapPin size={14} aria-hidden="true" />
                    {activa.direccion}
                  </p>
                  <p className={styles.popupRow}>
                    <Route size={14} aria-hidden="true" />
                    {formatoKm(activa.km)}
                  </p>
                  <div className={styles.chips}>
                    {activa.especialidades.map((e) => (
                      <span key={e} className={styles.chip}>
                        {e}
                      </span>
                    ))}
                  </div>
                  <button type="button" className={styles.primaryBtn} onClick={irAClinica}>
                    Ver clínica
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </Reveal>

          {/* ---------- Panel (estilo "sheet" de la app) ---------- */}
          <Reveal delay={120} className={styles.panelReveal}>
            <div className={styles.panel}>
              <span className={styles.handle} aria-hidden="true" />

              <label className={styles.search}>
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar clínica o barrio..."
                  aria-label="Buscar clínica o barrio"
                />
              </label>

              <div className={styles.filters} role="group" aria-label="Filtros">
                {FILTROS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.filter} ${filtro === id ? styles.filterActive : ""}`}
                    onClick={() => setFiltro(id)}
                    aria-pressed={filtro === id}
                  >
                    {Icon && <Icon size={15} aria-hidden="true" />}
                    {label}
                  </button>
                ))}
              </div>

              <p className={styles.summary}>
                {abiertas} {abiertas === 1 ? "clínica abierta" : "clínicas abiertas"} ·{" "}
                {visibles.length} en total
              </p>

              {visibles.length === 0 ? (
                <p className={styles.empty}>
                  No encontramos clínicas con ese filtro. Probá con otro barrio.
                </p>
              ) : (
                <ul className={styles.list}>
                  {visibles.map((c) => {
                    const seleccionada = activa && c.id === activa.id;
                    return (
                      <li
                        key={c.id}
                        className={`${styles.card} ${seleccionada ? styles.cardActive : ""}`}
                      >
                        <button
                          type="button"
                          className={styles.cardHead}
                          onClick={() => setActivoId(c.id)}
                          aria-expanded={seleccionada}
                        >
                          <span className={styles.cardHeadText}>
                            <span className={styles.cardName}>{c.nombre}</span>
                            {!seleccionada && (
                              <span className={styles.cardSub}>
                                {c.barrio} · {formatoKm(c.km)}
                              </span>
                            )}
                          </span>
                          <span
                            className={`${styles.pill} ${
                              c.abierto ? styles.pillOpen : styles.pillClosed
                            }`}
                          >
                            {c.abierto ? "Abierto" : "Cerrado"}
                          </span>
                        </button>

                        {seleccionada && (
                          <div className={styles.cardBody}>
                            <p className={styles.row}>
                              <MapPin size={14} aria-hidden="true" />
                              {c.direccion}
                            </p>
                            <div className={styles.metaRow}>
                              <span className={styles.row}>
                                <Route size={14} aria-hidden="true" />
                                {formatoKm(c.km)}
                              </span>
                              <span className={styles.row}>
                                <Phone size={14} aria-hidden="true" />
                                {c.telefono}
                              </span>
                              {c.urgencias24 && (
                                <span className={styles.urgencias}>
                                  <Clock size={13} aria-hidden="true" />
                                  Urgencias 24hs
                                </span>
                              )}
                            </div>
                            <div className={styles.chips}>
                              {c.especialidades.map((e) => (
                                <span key={e} className={styles.chip}>
                                  {e}
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              className={`${styles.primaryBtn} ${styles.primaryBtnFull}`}
                              onClick={irAClinica}
                            >
                              Ver clínica
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default UrgenciasMap;