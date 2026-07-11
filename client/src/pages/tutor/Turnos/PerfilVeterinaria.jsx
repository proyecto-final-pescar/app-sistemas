import { useEffect, useState } from "react";
import { href, useNavigate, useParams } from "react-router-dom";
import { getVeterinariaById } from "../../../services/veterinariaService";
import "./PerfilVeterinaria.css";

import Button from "../../../components/ui/button/Button.jsx" 


function EmptyState({ icon, message }) {
  return (
    <div className="perfil-vet__empty">
      <div className="perfil-vet__empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  );
}

function ProfessionalChip({ nombre, especialidad }) {
  const inicial = nombre ? nombre.charAt(0).toUpperCase() : "?";

  return (
    <div className="perfil-vet__pro-chip">
      <div className="perfil-vet__pro-avatar">{inicial}</div>
      <div className="perfil-vet__pro-info">
        <span className="perfil-vet__pro-name">{nombre}</span>
        <span className="perfil-vet__pro-specialty">{especialidad}</span>
      </div>
    </div>
  );
}

const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.09 1.18 2 2 0 012.08 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.86-.86a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7L2 7" />
  </svg>
);


function formatPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(valor);
}

// COMPONENTE PRINCIPAL
export default function PerfilVeterinaria() {
  const { id } = useParams();

  const navigate = useNavigate(); 

  const [veterinaria, setVeterinaria] = useState(null);   
  const [loading, setLoading]         = useState(true);   
  const [error, setError]             = useState(null);   
  const handleReservarTurno = () => {
    console.log("Turno reservado!");
      navigate(`/turnos/agendar/${veterinaria._id}`);;
  };
  useEffect(() => {

    const fetchVeterinaria = async () => {
      try {
        setLoading(true);   
        setError(null);    

        const data = await getVeterinariaById(id);

        setVeterinaria(data); 
      } catch (err) {

        console.error("Error al cargar veterinaria:", err);
        setError(
          err.response?.status === 404
            ? "No encontramos esta veterinaria."
            : "Ocurrió un error al cargar los datos. Intentá de nuevo."
        );
      } finally {
        setLoading(false); // ocultamos el spinner siempre, sea éxito o error
      }
    };

    fetchVeterinaria();
  }, [id]); 


  if (loading) {
    return (
      <div className="perfil-vet">
        <div className="perfil-vet__status">
          <div className="perfil-vet__spinner" aria-label="Cargando..." />
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-vet">
        <div className="perfil-vet__status">
          <span className="perfil-vet__error-icon">⚠️</span>
          <p className="perfil-vet__error-msg">{error}</p>
          {/* Al hacer click, vuelve a montar el efecto */}
          <button className="perfil-vet__retry-btn" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  const {
    nombre,
    direccion,
    email,
    telefono,
    profesionales = [],   
    servicios     = [],   
    horarios      = [],
  } = veterinaria;


  console.log(veterinaria.horarios); 

  return (
    <div className="perfil-vet">
      <div className="perfil-vet__container">

        {/* ── Encabezado con botón volver ── */}
        <div>
        <button
            className="perfil-vet__back-btn"
            onClick={() => navigate(-1)} // navega a la página anterior del historial
            aria-label="Volver"
          >
            ← Volver
          </button>
          </div>
        <div className="perfil-vet__header">
          <h1 className="perfil-vet__name">{nombre}</h1>
          
          <Button
            texto="Reservar turno"
            variante="primario"
            tamaño="mediano"
            onClick={handleReservarTurno}
          />
        </div>

        {}
        {}
        <div className="perfil-vet__info-grid">
          {direccion && (
            <div className="perfil-vet__info-item">
              <span className="perfil-vet__info-label">
                <IconPin /> Dirección
              </span>
              <p className="perfil-vet__info-value">{direccion}</p>
            </div>
          )}

          {telefono && (
            <div className="perfil-vet__info-item">
              <span className="perfil-vet__info-label">
                <IconPhone /> Teléfono
              </span>
              <p className="perfil-vet__info-value">{telefono}</p>
            </div>
          )}

          {email && (
            <div className="perfil-vet__info-item">
              <span className="perfil-vet__info-label">
                <IconMail /> Email
              </span>
              <p className="perfil-vet__info-value">{email}</p>
            </div>
          )}
        </div>

        {/* ── Profesionales ── */}
        <div className="perfil-vet__card">
          <h2 className="perfil-vet__card-title">Profesionales</h2>

          {}
          {profesionales.length > 0 ? (
            <div className="perfil-vet__professionals">
              {}
              {profesionales.map((prof) => (
                <ProfessionalChip
                  key={prof._id || prof.id}
                  nombre={prof.nombre}
                  especialidad={prof.especialidad}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="👨‍⚕️"
              message="Esta veterinaria aún no tiene profesionales registrados."
            />
          )}
        </div>

        {/* ── Servicios y precios ── */}
        <div className="perfil-vet__card">
          <h2 className="perfil-vet__card-title">Servicios y precios</h2>

          {servicios.length > 0 ? (
            <table className="perfil-vet__services-table">
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio._id || servicio.id}>
                    <td>{servicio.nombre}</td>
                    {}
                    <td>{formatPrecio(servicio.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon="💊"
              message="Aún no hay servicios cargados para esta veterinaria."
            />
          )}
        </div>

        {/* ── Horarios de atención ── */}
        <div className="perfil-vet__card">
          <h2 className="perfil-vet__card-title">
            Horarios de atención
          </h2>

          {
<div className="perfil-vet__schedule-grid">
  {horarios && Object.entries(horarios).map(([dia, h]) => (
    <div key={dia} className="perfil-vet__schedule-row">
      <span className="perfil-vet__schedule-day">
        {dia.charAt(0).toUpperCase() + dia.slice(1)}
      </span>
      {(!h?.desde || !h?.hasta) ? (
        <span className="perfil-vet__schedule-closed">Cerrado</span>
      ) : (
        <span className="perfil-vet__schedule-time">
          {h.desde} – {h.hasta}
        </span>
      )}
      </div>
    ))}
    </div>
    }
    </div>
    </div>
    </div>
  );
}
