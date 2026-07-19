import Button from '../ui/button/Button';
import Badge from '../ui/badge/Badge';
import styles from './PublicacionCard.module.css';

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return null;
  return new Date(fechaISO).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const PublicacionCard = ({
  publicacion,
  esPropia,
  onMarcarEncontrada,
  onContactar,
  onCardClick
}) => {
  const { imagen, estado, nombre, ubicacion, descripcion, id, fechaPerdida } = publicacion;
  const esResuelto = estado === 'resuelto';

  const handleAccion = (e) => {
    e.stopPropagation();
    // Regla de negocio: solo el autor de la publicación puede marcarla
    // como encontrada. Cualquier otro usuario solo puede contactar al dueño.
    if (estado === 'buscando' && esPropia) {
      onMarcarEncontrada(id);
    } else if (!esResuelto) {
      onContactar(publicacion);
    }
  };

  const getBadgeLabel = () => (estado === 'buscando' ? 'SE BUSCA' : '¡ENCONTRADO!');
  const getBadgeVariant = () => (estado === 'buscando' ? 'buscado' : 'encontrado');

  const getButtonLabel = () => {
    if (estado === 'buscando' && esPropia) return 'Marcar como Encontrada';
    return 'Contactar al dueño';
  };

  const fechaFormateada = formatearFecha(fechaPerdida);

  return (
    <div
      className={`${styles.card} ${esResuelto ? styles.cardResuelto : ''}`}
      onClick={() => onCardClick?.(id)}
    >
      <div className={styles.imageContainer}>
        <img
          src={imagen || '/placeholder-pet.png'}
          alt={nombre}
          className={styles.image}
        />
        <div className={styles.badgePos}>
          <Badge texto={getBadgeLabel()} variante={getBadgeVariant()} />
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.nombre}>{nombre}</h3>

        <div className={styles.ubicacion}>
          <svg className={styles.iconUbicacion} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={styles.ubicacionText}>{ubicacion}</span>
        </div>

        {fechaFormateada && (
          <p className={styles.fecha}>Perdido el {fechaFormateada}</p>
        )}

        <p className={styles.descripcion}>{descripcion}</p>
      </div>

      <div className={styles.footer}>
        {esResuelto ? (
          <Badge texto="Caso Cerrado" variante="resuelto" />
        ) : (
          <Button
            texto={getButtonLabel()}
            variante="primario"
            tamaño="mediano"
            onClick={handleAccion}
          />
        )}
      </div>
    </div>
  );
};

export default PublicacionCard;