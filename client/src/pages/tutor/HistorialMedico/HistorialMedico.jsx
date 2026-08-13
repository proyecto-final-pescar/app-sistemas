import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerMascotas } from "../../../services/MascotaService";
import { obtenerHistorialesTutor } from "../../../services/historialService";

// Layout & UI Components
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button.jsx";
import styles from "../../../styles/MisMascotas.module.css";
import "./HistorialMedico.css"; // Acá importamos el CSS limpio

// Iconos (MUI)
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';

// --- SUBCOMPONENTES DE UI PURA ---

function EmptyState({ icon, message, onReset }) {
  return (
    <div className="hm-empty">
      <div className="hm-empty__icon">{icon}</div>
      <h3 className="hm-empty__title">No hay registros</h3>
      <p className="hm-empty__text">{message}</p>
      {onReset && (
        <Button 
          texto="Restablecer filtros" 
          variante="secundario" 
          tamaño="pequeño" 
          onClick={onReset} 
        />
      )}
    </div>
  );
}

// Mapeamos la categoría a la clase CSS correspondiente
const BADGE_STYLES = {
  "Vacunación": { label: 'Vacunación', className: 'hm-badge--vacunacion' },
  "Consulta": { label: 'Consulta General', className: 'hm-badge--consulta' },
  "Control": { label: 'Control', className: 'hm-badge--control' },
  "Cirugía": { label: 'Cirugía', className: 'hm-badge--cirugia' }
};

// --- COMPONENTE PRINCIPAL ---

export default function HistorialMedico() {
  const navigate = useNavigate();

  // Estados de datos
  const [mascotas, setMascotas] = useState([]);
  const [historiales, setHistoriales] = useState([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de Filtros y Modal
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPet, setSelectedPet] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch de datos reales
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mascotasData, historialesData] = await Promise.all([
          obtenerMascotas(),
          obtenerHistorialesTutor()
        ]);

        setMascotas(mascotasData.data || mascotasData || []);
        setHistoriales(historialesData || []);
      } catch (err) {
        console.error("Error al cargar el historial:", err);
        setError("Ocurrió un error al cargar los datos. Intentá de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  // Lógica de filtrado
  const filteredRecords = historiales.filter(record => {
    const titulo = record.motivoConsulta?.toLowerCase() || '';
    const veterinaria = record.veterinariaId?.nombre?.toLowerCase() || '';
    const busqueda = searchTerm.toLowerCase();
    
    const matchesSearch = titulo.includes(busqueda) || veterinaria.includes(busqueda);
    const matchesPet = selectedPet === 'all' || record.mascotaId?._id === selectedPet;
    
    return matchesSearch && matchesPet;
  });

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    return new Date(fechaIso).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // --- RENDERIZADOS DE ESTADO ---
  
  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar role="tutor" />
        <div className={styles.pageWrapper}>
          <TopBar title="Historial Médico" />
          <div className="hm-empty" style={{ border: 'none', height: '60vh' }}>
            <div className="perfil-vet__spinner" style={{ marginBottom: '1rem' }} aria-label="Cargando..." />
            <p className="hm-empty__text">Cargando historiales...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.layout}>
        <Sidebar role="tutor" />
        <div className={styles.pageWrapper}>
          <TopBar title="Historial Médico" />
          <div className="hm-empty" style={{ border: 'none', height: '60vh' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</span>
            <p className="hm-empty__text">{error}</p>
            <Button texto="← Volver" variante="secundario" onClick={() => navigate(-1)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar role="tutor" />
      
      <div className={styles.pageWrapper}>
        <TopBar title="Historial Médico" />

        <main className="hm-main">
          
          {/* Header Superior */}
          <div>
            <h2 className="hm-header__title">Registros Médicos</h2>
            <p className="hm-header__subtitle">Consulta las atenciones clínicas de tus mascotas.</p>
          </div>

          {/* Filtros */}
          <div className="hm-filters">
            {/* Input de Búsqueda */}
            <div className="hm-search">
              <div className="hm-search__icon">
                <SearchOutlinedIcon fontSize="small" />
              </div>
              <input
                type="text"
                className="hm-search__input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por motivo o clínica..."
              />
            </div>

            {/* Chips de Mascotas */}
            <div className="hm-pet-filters">
              <button
                onClick={() => setSelectedPet('all')}
                className={`hm-pet-chip ${selectedPet === 'all' ? 'hm-pet-chip--active' : ''}`}
              >
                Todas
              </button>
              {mascotas.map((pet) => (
                <button
                  key={pet._id}
                  onClick={() => setSelectedPet(pet._id)}
                  className={`hm-pet-chip ${selectedPet === pet._id ? 'hm-pet-chip--active' : ''}`}
                >
                  {pet.foto ? (
                    <img src={pet.foto} alt={pet.nombre} className="hm-pet-chip__avatar" />
                  ) : (
                    <PetsOutlinedIcon fontSize="inherit" />
                  )}
                  <span>{pet.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Tarjetas */}
          {filteredRecords.length === 0 ? (
            <EmptyState 
              icon="📂" 
              message="No encontramos historiales clínicos que coincidan con la búsqueda o la mascota seleccionada."
              onReset={() => { setSearchTerm(''); setSelectedPet('all'); }}
            />
          ) : (
            <div className="hm-list">
              {filteredRecords.map(record => {
                const cat = BADGE_STYLES[record.categoriaServicio] || BADGE_STYLES["Consulta"];
                const mascotaNombre = record.mascotaId?.nombre || 'Mascota';
                const vetNombre = record.veterinariaId?.nombre || 'Veterinaria';
                const profNombre = record.profesionalId?.nombre 
                  ? `${record.profesionalId.nombre} ${record.profesionalId.apellido || ''}`
                  : 'Profesional';

                return (
                  <div
                    key={record._id}
                    onClick={() => setSelectedRecord(record)}
                    className="hm-card"
                  >
                    <div className="hm-card__left">
                      <div className="hm-card__icon">
                        <MedicalServicesOutlinedIcon fontSize="small" />
                      </div>

                      <div className="hm-card__content">
                        <div className="hm-card__header">
                          <h3 className="hm-card__title" title={record.motivoConsulta}>
                            {record.motivoConsulta}
                          </h3>
                          <span className={`hm-badge ${cat.className}`}>
                            {cat.label}
                          </span>
                        </div>

                        <div className="hm-card__meta">
                          <span className="hm-card__meta-item">
                            <LocationOnOutlinedIcon fontSize="inherit"/> {vetNombre}
                          </span>
                          <span className="hm-card__meta-item">
                            <PetsOutlinedIcon fontSize="inherit"/> {mascotaNombre}
                          </span>
                          <span className="hm-card__meta-item">
                            <CalendarTodayOutlinedIcon fontSize="inherit"/> {formatearFecha(record.fecha)}
                          </span>
                          <span className="hm-card__meta-item" style={{ display: 'none' }}>
                            {/* Oculto en mobile, se puede mostrar con CSS en desktop si se desea */}
                            <PersonOutlineOutlinedIcon fontSize="inherit"/> {profNombre}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hm-card__arrow">
                      <ArrowForwardIosOutlinedIcon fontSize="small" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal de Detalle Clínico */}
          {selectedRecord && (
            <div className="hm-modal-overlay" onClick={() => setSelectedRecord(null)}>
              {/* Detenemos la propagación para que al hacer clic dentro no se cierre */}
              <div className="hm-modal" onClick={(e) => e.stopPropagation()}>
                
                <div className="hm-modal__header">
                  <div>
                    <h3 className="hm-modal__title">{selectedRecord.motivoConsulta}</h3>
                    <p className="hm-modal__date">
                      {formatearFecha(selectedRecord.fecha)} a las {selectedRecord.hora} hs.
                    </p>
                  </div>
                  <button className="hm-modal__close" onClick={() => setSelectedRecord(null)}>
                    <CloseOutlinedIcon fontSize="small" />
                  </button>
                </div>

                <div className="hm-modal__body">
                  <div className="hm-modal__notes">
                    <p className="hm-modal__notes-title">
                      <MedicalServicesOutlinedIcon fontSize="small" /> Anotaciones Médicas
                    </p>
                    <p className="hm-modal__notes-text">{selectedRecord.anotaciones}</p>
                  </div>

                  <div className="hm-modal__grid">
                    <div className="hm-modal__info-box">
                      <p className="hm-modal__info-label">Atendido por</p>
                      <p className="hm-modal__info-value" title={selectedRecord.profesionalId?.nombre}>
                        {selectedRecord.profesionalId?.nombre || 'Profesional'}
                      </p>
                    </div>
                    <div className="hm-modal__info-box">
                      <p className="hm-modal__info-label">Clínica</p>
                      <p className="hm-modal__info-value" title={selectedRecord.veterinariaId?.nombre}>
                        {selectedRecord.veterinariaId?.nombre || 'Veterinaria'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hm-modal__footer">
                  <Button 
                    texto="Cerrar" 
                    variante="secundario" 
                    onClick={() => setSelectedRecord(null)} 
                  />
                  {selectedRecord.urlPdf && (
                    <a href={selectedRecord.urlPdf} target="_blank" rel="noopener noreferrer" className="hm-modal__btn-link">
                      <Button 
                        texto={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DownloadOutlinedIcon fontSize="small" /> Ver PDF</span>} 
                        variante="primario" 
                      />
                    </a>
                  )}
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}