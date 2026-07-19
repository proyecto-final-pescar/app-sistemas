import { useState, useEffect, useCallback } from 'react';

const MOCK_PUBLICACIONES = [
  {
    id: '1',
    nombre: 'Rocky',
    imagen: 'https://images.unsplash.com/photo-1633722715463-d30628519d81?w=400&h=400&fit=crop',
    descripcion: 'Perrito mestizo con collar azul. Se asustó y salió corriendo por la puerta. Tiene 3 años y es muy amigable.',
    raza: 'Mestizo',
    ubicacion: 'Palermo',
    zona: 'CABA',
    estado: 'buscando',
    usuarioId: 'user1',
    fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    nombre: 'Tigre',
    imagen: 'https://images.unsplash.com/photo-1574158622147-e121fadc47d6?w=400&h=400&fit=crop',
    descripcion: 'Gato atigrado, muy mimoso. Suele andar por los techos pero no regresó a casa hoy.',
    raza: 'Gato Atigrado',
    ubicacion: 'San Cristóbal',
    zona: 'CABA',
    estado: 'buscando',
    usuarioId: 'user2',
    fechaCreacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    nombre: 'Cleta',
    imagen: 'https://images.unsplash.com/photo-1569152950711-cfea9f2da9d7?w=400&h=400&fit=crop',
    descripcion: 'Gata blanca y negra. ¡Apareció en el patio de mi casa! Caso resuelto gracias a todos.',
    raza: 'Gato Siamés',
    ubicacion: 'Caballito',
    zona: 'CABA',
    estado: 'resuelto',
    usuarioId: 'user3',
    fechaCreacion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    fechaResolucion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    nombre: 'Max',
    imagen: 'https://images.unsplash.com/photo-1587300411515-5f4ee4a8c937?w=400&h=400&fit=crop',
    descripcion: 'Perro Golden Retriever, muy grande y amigable. Se perdió en zona de Belgrano.',
    raza: 'Golden Retriever',
    ubicacion: 'Belgrano',
    zona: 'CABA',
    estado: 'buscando',
    usuarioId: 'user1',
    fechaCreacion: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: '5',
    nombre: 'Luna',
    imagen: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=400&h=400&fit=crop',
    descripcion: 'Gata negra con ojos verdes. Desapareció hace 4 días de la zona de La Boca.',
    raza: 'Gato Negro',
    ubicacion: 'La Boca',
    zona: 'CABA',
    estado: 'buscando',
    usuarioId: 'user4',
    fechaCreacion: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    nombre: 'Bruno',
    imagen: 'https://images.unsplash.com/photo-1587049352861-d46d8ab1d4a0?w=400&h=400&fit=crop',
    descripcion: '¡Encontrado! Bruno volvió a casa sano y salvo. Gracias a todos por la ayuda.',
    raza: 'Labrador',
    ubicacion: 'Retiro',
    zona: 'CABA',
    estado: 'resuelto',
    usuarioId: 'user5',
    fechaCreacion: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    fechaResolucion: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    id: '7',
    nombre: 'Misha',
    imagen: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=400&fit=crop',
    descripcion: 'Perrita pequeña, raza Chihuahua. Collar rosa con diamantes. Desapareció en Flores.',
    raza: 'Chihuahua',
    ubicacion: 'Flores',
    zona: 'CABA',
    estado: 'buscando',
    usuarioId: 'user6',
    fechaCreacion: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
];

const MOCK_ZONAS = ['CABA', 'GBA Norte', 'GBA Oeste', 'GBA Sur', 'Otros'];

const usePublicaciones = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState('buscando');
  const [zonaFiltro, setZonaFiltro] = useState('Todas');
  const [zonas, setZonas] = useState([]);

  useEffect(() => {
    cargarPublicaciones();
    cargarZonas();
  }, [estadoFiltro, zonaFiltro]);

  const cargarPublicaciones = () => {
    try {
      setLoading(true);
      setError(null);
      setTimeout(() => {
        let filtradas = [...MOCK_PUBLICACIONES];
        filtradas = filtradas.filter(pub => pub.estado === estadoFiltro);
        if (zonaFiltro !== 'Todas') {
          filtradas = filtradas.filter(pub => pub.zona === zonaFiltro);
        }
        setPublicaciones(filtradas);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Error al cargar las publicaciones. Intenta nuevamente.');
      console.error('Error en cargarPublicaciones:', err);
      setLoading(false);
    }
  };

  const cargarZonas = () => {
    try {
      setZonas(['Todas', ...MOCK_ZONAS]);
    } catch (err) {
      console.error('Error al cargar zonas:', err);
      setZonas(['Todas']);
    }
  };

  const marcarEncontrada = useCallback(async (publicacionId) => {
    try {
      const pubIndex = MOCK_PUBLICACIONES.findIndex(p => p.id === publicacionId);
      if (pubIndex !== -1) {
        MOCK_PUBLICACIONES[pubIndex].estado = 'resuelto';
        MOCK_PUBLICACIONES[pubIndex].fechaResolucion = new Date();
      }
      setSuccess('Publicación marcada como encontrada');
      cargarPublicaciones();
      return true;
    } catch (err) {
      setError('Error al marcar como encontrada. Intenta nuevamente.');
      console.error(err);
      return false;
    }
  }, []);

  const contactarDueno = useCallback(async (publicacionId, mensaje) => {
    try {
      console.log('Contactando al dueño de publicación:', publicacionId, 'Mensaje:', mensaje);
      setSuccess('Mensaje enviado al dueño');
      return true;
    } catch (err) {
      setError('Error al enviar el mensaje. Intenta nuevamente.');
      console.error(err);
      return false;
    }
  }, []);

  const crearPublicacion = useCallback(async (datos) => {
    try {
      const nuevaPub = {
        id: Math.random().toString(36).substr(2, 9),
        ...datos,
        estado: 'buscando',
        usuarioId: 'user1',
        fechaCreacion: new Date(),
      };
      MOCK_PUBLICACIONES.unshift(nuevaPub);
      setSuccess('Publicación creada exitosamente');
      cargarPublicaciones();
      return true;
    } catch (err) {
      setError('Error al crear la publicación. Intenta nuevamente.');
      console.error(err);
      return false;
    }
  }, []);

  const limpiarMensajes = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    publicaciones,
    loading,
    error,
    success,
    zonas,
    estadoFiltro,
    zonaFiltro,
    setEstadoFiltro,
    setZonaFiltro,
    marcarEncontrada,
    contactarDueno,
    crearPublicacion,
    cargarPublicaciones,
    limpiarMensajes,
  };
};

export default usePublicaciones;