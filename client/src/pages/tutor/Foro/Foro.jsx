import { useState } from 'react';
import Sidebar from '../../../components/layout/Sidebar';
import TopBar from '../../../components/layout/TopBar';
import Button from '../../../components/ui/button/Button';
import PublicacionCard from '../../../components/publicaciones/PublicacionCard';
import styles from './Foro.module.css';

// Mock — reemplazar por el fetch real al backend
const PUBLICACIONES_MOCK = [
  {
    id: 1,
    nombre: 'Rocky',
    ubicacion: 'Palermo',
    imagen: 'https://picsum.photos/seed/rocky-mypet/500/300',
    descripcion: 'Perrito mestizo con collar azul. Se asustó y salió corriendo por la avenida.',
    estado: 'buscando',
    fechaPerdida: '2026-07-15',
  },
  {
    id: 2,
    nombre: 'Tigre',
    ubicacion: 'San Cristóbal',
    imagen: 'https://picsum.photos/seed/tigre-mypet/500/300',
    descripcion: 'Gato atigrado, muy mimoso. Suele andar por los techos pero no regresó a casa hoy.',
    estado: 'buscando',
    fechaPerdida: '2026-07-18',
  },
  {
    id: 3,
    nombre: 'Cleta',
    ubicacion: 'Caballito',
    imagen: 'https://picsum.photos/seed/cleta-mypet/500/300',
    descripcion: 'Apareció en el patio de mi casa. Ya se reunió con su familia.',
    estado: 'resuelto',
    fechaPerdida: '2026-07-05',
  },
];

// TODO: reemplazar por el usuario logueado real (context/auth)
const USUARIO_ACTUAL_ID = 'user-1';

const TABS = [
  { key: 'buscando', label: 'Buscando' },
  { key: 'resueltos', label: 'Resueltos' },
];

function Foro() {
  const [tabActiva, setTabActiva] = useState('buscando');
  const [zona, setZona] = useState('todas');

  const publicacionesFiltradas = PUBLICACIONES_MOCK.filter((pub) => {
    const coincideEstado =
      tabActiva === 'buscando'
        ? pub.estado !== 'resuelto'
        : pub.estado === 'resuelto';

    const coincideZona = zona === 'todas' || pub.ubicacion === zona;

    return coincideEstado && coincideZona;
  });

  const handleNuevaPublicacion = () => {
    // TODO: abrir modal / navegar a formulario de nueva publicación
  };

  const handleMarcarEncontrada = (id) => {
    // TODO: conectar con el endpoint que actualiza el estado de la publicación
  };

  const handleContactar = (publicacion) => {
    // TODO: abrir modal de contacto con el dueño
  };

  const handleCardClick = (id) => {
    // TODO: navegar al detalle de la publicación
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.contenido}>
        <TopBar title="Foro de Perdidos" />

        <main className={styles.main}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.titulo}>Publicaciones Activas</h1>
              <p className={styles.subtitulo}>Ayudemos a que vuelvan a casa</p>
            </div>

            <Button
              texto="+ Nueva Publicación"
              variante="primario"
              tamaño="mediano"
              onClick={handleNuevaPublicacion}
            />
          </div>

          <div className={styles.filtros}>
            <select
              className={styles.filtroZona}
              value={zona}
              onChange={(e) => setZona(e.target.value)}
            >
              <option value="todas">Zona: Todas</option>
              <option value="Palermo">Palermo</option>
              <option value="San Cristóbal">San Cristóbal</option>
              <option value="Caballito">Caballito</option>
            </select>

            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tab} ${tabActiva === tab.key ? styles.tabActivo : ''}`}
                onClick={() => setTabActiva(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {publicacionesFiltradas.length === 0 ? (
            <p className={styles.vacio}>No hay publicaciones para este filtro todavía.</p>
          ) : (
            <div className={styles.grilla}>
              {publicacionesFiltradas.map((pub) => (
                <PublicacionCard
                  key={pub.id}
                  publicacion={pub}
                  esPropia={pub.autorId === USUARIO_ACTUAL_ID}
                  onMarcarEncontrada={handleMarcarEncontrada}
                  onContactar={handleContactar}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Foro;