import { useEffect, useState } from "react";
import { href, useNavigate, useParams } from "react-router-dom";
import { getVeterinariaById } from "../../../services/veterinariaService";
import "./PerfilVeterinaria.css";
import Sidebar from "../../../components/layout/Sidebar";
import Button from "../../../components/ui/button/Button.jsx" 
import styles from "../../../styles/MisMascotas.module.css";
import TopBar from "../../../components/layout/TopBar";
import InfoItem from "../../../components/ui/info/InfoItem.jsx";
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EmergencyOutlinedIcon from '@mui/icons-material/EmergencyOutlined';


function EmptyState({ icon, message }) {
  return (
    <div className="perfil-vet__empty">
      <div className="perfil-vet__empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  );
}

function ProfessionalChip({ nombre, especialidad, email }) {
  const inicial = nombre ? nombre.charAt(0).toUpperCase() : "?";

  return (
    <div className="perfil-vet__pro-chip">
      <div className="perfil-vet__pro-avatar">{inicial}</div>
      <div className="perfil-vet__pro-info">
        <span className="perfil-vet__pro-name">{nombre}</span>
        <span className="perfil-vet__pro-specialty">{especialidad}</span>
        <span className="perfil-vet__pro-email">{email}</span>
      </div>
    </div>
  );
}


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
    urgencias24hs,
    telefono,
    profesionales = [],   
    servicios     = [],   
    horarios      = [],
  } = veterinaria;

  return (
    <div className={styles.layout}>
    <Sidebar role="tutor" />
    <div className={styles.pageWrapper}>
    <TopBar title="Perfil" />

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
            <InfoItem icon={LocationOnOutlinedIcon} label="Dirección" value={direccion} />
  <InfoItem icon={PhoneOutlinedIcon} label="Teléfono" value={telefono} />
  <InfoItem icon={EmailOutlinedIcon} label="Email" value={email} />
  <InfoItem
    icon={EmergencyOutlinedIcon}
    label="Emergencias 24hs"
    value={urgencias24hs ? "Disponible" : "No disponible"}
    className={urgencias24hs ? "activo" : "inactivo"}
  />
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
                  email={prof.email}
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
            </div>
          </div>
  );
}
