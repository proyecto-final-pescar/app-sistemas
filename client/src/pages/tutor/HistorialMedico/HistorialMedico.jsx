import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerMascotas } from "../../../services/MascotaService";
import { obtenerHistorialesTutor } from "../../../services/historialService";
import Button from "../../../components/ui/button/Button.jsx";
import ConsultaBadge from "../../../components/historial/ConsultaBadge";
import SkeletonCard from "../../../components/historial/SkeletonCard";
import SearchBar from "../../../components/historial/SearchBar";
import FilterPills from "../../../components/historial/FilterPills";
import EmptyState from "../../../components/historial/EmptyState";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Card from "../../../components/ui/card/Card.jsx";
import styles from "../../../styles/MisMascotas.module.css";
import "./HistorialMedico.css";

// Iconos (MUI)
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';

// Mapea el campo real del backend (categoriaServicio) a las claves que espera ConsultaBadge
const CATEGORIA_A_BADGE = {
  'Vacunación': 'vacunacion',
  'Control': 'control',
  'Consulta': 'consulta',
  'Cirugía': 'cirugia',
};

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

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPet]);

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
        setHistoriales(historialesData.historiales || []);

      } catch (err) {
        console.error("Error al cargar el historial:", err);
        setError("Ocurrió un error al cargar los datos. Intentá de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  const filteredRecords = historiales.filter(record => {
    const titulo = record.motivoConsulta?.toLowerCase() || '';
    const veterinaria = record.veterinariaId?.nombre?.toLowerCase() || '';
    const busqueda = searchTerm.toLowerCase();

    const matchesSearch = titulo.includes(busqueda) || veterinaria.includes(busqueda);
    const matchesPet = selectedPet === 'all' || record.mascotaId?._id === selectedPet;

    return matchesSearch && matchesPet;
  });

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    return new Date(fechaIso).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // FilterPills usa null = "Todas"; el resto del componente usa 'all'.
  // Estos dos helpers traducen entre ambos formatos sin tocar la lógica existente.
  const pillActivo = selectedPet === 'all' ? null : selectedPet;
  const handlePillChange = (id) => setSelectedPet(id === null ? 'all' : id);

  if (error) return <div className={styles.layout}><Sidebar role="tutor" /><div className={styles.pageWrapper}><TopBar title="Historial Médico" />{error}</div></div>;

  return (
    <div className={styles.layout}>
      <Sidebar role="tutor" />

      <div className={styles.pageWrapper}>
        <TopBar title="Historial Médico" />

        <main className="hm-main">

          {/* Filtros */}
          <div className="hm-filters">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el historial..."
            />

            <FilterPills
              mascotas={mascotas}
              activo={pillActivo}
              onChange={handlePillChange}
            />

            <div className="hm-select-mascota-wrapper">
              <Button
                texto={selectedPet === 'all' ? 'Elegí una mascota' : 'Ver ficha médica'}
                variante="primario"
                tamaño="mediano"
                disabled={selectedPet === 'all'}
                onClick={() => navigate(`/tutor/historial-medico/${selectedPet}`)}
              />
            </div>
          </div>

          {/* Listado de Tarjetas */}
          {loading ? (
            <div className="hm-list">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : currentItems.length === 0 ? (
            <EmptyState
              icon="🩺"
              title="Sin resultados"
              text="No encontramos historiales clínicos que coincidan con la búsqueda."
            />
          ) : (
            <div className="hm-list">
              {currentItems.map(record => {
                const mascotaNombre = record.mascotaId?.nombre || 'Mascota';
                const mascotaFoto = mascotas.find(m => m._id === record.mascotaId?._id)?.foto;
                const vetNombre = record.veterinariaId?.nombre || 'Veterinaria';

                let profNombre = 'Profesional';
                if (record.veterinariaId?.profesionales && record.profesionalId) {
                  const profesionalEncontrado = record.veterinariaId.profesionales.find(
                    (prof) => String(prof._id) === String(record.profesionalId)
                  );
                  if (profesionalEncontrado) {
                    profNombre = profesionalEncontrado.nombre;
                  }
                }

                return (
                  <Card
                    key={record._id}
                    onClick={() => setSelectedRecord(record)}
                    className="hm-card-pill"
                  >
                    {/* Icono circular violeta de la izquierda */}
                    <div className="hm-card-pill__icon-wrapper">
                      <MedicalServicesOutlinedIcon fontSize="medium" />
                    </div>

                    {/* Contenido principal de la tarjeta */}
                    <div className="hm-card-pill__content">
                      <div className="hm-card-pill__header">
                        <h3 className="hm-card-pill__title">
                          {record.motivoConsulta}
                        </h3>
                      </div>

                      <div className="hm-card-pill__meta">
                        <span className="hm-card-pill__meta-item">
                          <LocationOnOutlinedIcon fontSize="inherit" /> {vetNombre}
                        </span>

                        <span className="hm-card-pill__meta-item">
                          {mascotaFoto ? (
                            <img src={mascotaFoto} alt="mascota" className="hm-meta-avatar" />
                          ) : (
                            <PetsOutlinedIcon fontSize="inherit" />
                          )}
                          {mascotaNombre}
                        </span>

                        <span className="hm-card-pill__meta-item">
                          <CalendarTodayOutlinedIcon fontSize="inherit" /> {formatearFecha(record.fecha)}
                        </span>

                        <span className="hm-card-pill__meta-item">
                          <PersonOutlineOutlinedIcon fontSize="inherit" /> {profNombre}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="hm-pagination">
              <button
                className="hm-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Anterior
              </button>

              <span className="hm-pagination-info">
                Página <strong>{currentPage}</strong> de {totalPages}
              </span>

              <button
                className="hm-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Modal */}
          {selectedRecord && (
            <div className="hm-modal-overlay" onClick={() => setSelectedRecord(null)}>
              <div className="hm-modal-clean" onClick={(e) => e.stopPropagation()}>

                <button className="hm-modal-clean__close" onClick={() => setSelectedRecord(null)}>
                  <CloseOutlinedIcon fontSize="small" />
                </button>

                <div className="hm-modal-clean__header">
                  <h2>Detalle de Consulta</h2>
                  <p>Revisá las anotaciones de la consulta médica.</p>
                </div>

                <div className="hm-modal-clean__body">
                  <div className="hm-modal-clean__field">
                    <label>
                      {formatearFecha(selectedRecord.fecha)}
                      {selectedRecord.hora ? ` a las ${selectedRecord.hora}hs` : ''}
                    </label>
                  </div>

                  <div className="hm-modal-clean__field">
                    <label>Servicio / Motivo</label>
                    <div className="hm-modal-clean__input-mock">
                      {selectedRecord.motivoConsulta}
                    </div>
                  </div>

                  <div className="hm-modal-clean__field">
                    <label>Anotaciones Médicas</label>
                    <div className="hm-modal-clean__input-mock">
                      {selectedRecord.anotaciones || 'Sin anotaciones registradas.'}
                    </div>
                  </div>
                </div>

                <div className="hm-modal-clean__footer">
                  <Button
                    texto="Cerrar"
                    variante="secundario"
                    tamaño="mediano"
                    onClick={() => setSelectedRecord(null)}
                  />
                  {selectedRecord.urlPdf && (
                    <a href={selectedRecord.urlPdf} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <Button
                        texto="Descargar PDF"
                        variante="primario"
                        tamaño="mediano"
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