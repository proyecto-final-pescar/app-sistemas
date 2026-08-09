import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Card from '../../../components/ui/card/Card';
import Badge from '../../../components/ui/badge/Badge';
import TurnosAdminService from '../../../services/TurnosAdminService';
import styles from './GestionTurnos.module.css';

const TABS_ESTADO = ['Todos', 'Confirmados', 'Pendientes', 'Cancelados'];

export default function GestionTurnos() {
  const navigate = useNavigate();

  const [turnos, setTurnos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmados: 0,
    pendientes: 0,
    cancelados: 0,
  });
  const [tabActivo, setTabActivo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [fecha, setFecha] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarTurnos();
  }, [tabActivo, busqueda, fecha, pagina]);

  const cargarTurnos = async () => {
    setCargando(true);
    try {
      const res = await TurnosAdminService.getTurnos({
        estado: tabActivo !== 'Todos' ? tabActivo : undefined,
        busqueda: busqueda || undefined,
        fecha: fecha || undefined,
        pagina,
      });
      setTurnos(res.data.turnos);
      setStats(res.data.stats);
      setTotalPaginas(res.data.totalPaginas);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cambiarTab = (tab) => {
    setTabActivo(tab);
    setPagina(1);
  };

  const verDetalle = (turnoId) => {
    // Vista de solo lectura para auditoría, sin acciones de modificación
    navigate(`/admin/turnos/${turnoId}`);
  };

  return (
    <div className={styles.gestionTurnos}>
      <div className={styles.header}>
        <h1>Turnos</h1>
        <p className={styles.subtitulo}>
          Gestión y seguimiento de todos los turnos del sistema
        </p>
      </div>

      <div className={styles.stats}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcono} ${styles.statIconoVioleta}`}>
            <Calendar size={20} />
          </div>
          <div>
            <span className={styles.statNumero}>{stats.total}</span>
            <span className={styles.statLabel}>Total este mes</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcono} ${styles.statIconoVerde}`}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className={styles.statNumero}>{stats.confirmados}</span>
            <span className={styles.statLabel}>Confirmados</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcono} ${styles.statIconoNaranja}`}>
            <Clock size={20} />
          </div>
          <div>
            <span className={styles.statNumero}>{stats.pendientes}</span>
            <span className={styles.statLabel}>Pendientes de pago</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcono} ${styles.statIconoRojo}`}>
            <XCircle size={20} />
          </div>
          <div>
            <span className={styles.statNumero}>{stats.cancelados}</span>
            <span className={styles.statLabel}>Cancelados</span>
          </div>
        </Card>
      </div>

      <Card className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitulo}>
            <h2>Turnos por veterinaria</h2>
            <span className={styles.resultados}>
              Mostrando {turnos.length} de {stats.total} resultados
            </span>
          </div>

          <div className={styles.filtros}>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setPagina(1);
              }}
              className={styles.inputFecha}
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              className={styles.inputBusqueda}
            />
          </div>
        </div>

        <div className={styles.tabs}>
          {TABS_ESTADO.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${
                tabActivo === tab ? styles.tabActivo : ''
              }`}
              onClick={() => cambiarTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.tablaWrapper}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Veterinaria</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className={styles.vacio}>
                    Cargando turnos...
                  </td>
                </tr>
              ) : turnos.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.vacio}>
                    No se encontraron turnos
                  </td>
                </tr>
              ) : (
                turnos.map((turno) => (
                  <tr key={turno._id}>
                    <td>{turno.fecha}</td>
                    <td>{turno.hora}</td>
                    <td>{turno.veterinariaNombre}</td>
                    {/* el "usuario" es el cliente que pidió el turno */}
                    <td>{turno.usuarioNombre}</td>
                    <td>
                      <Badge texto={turno.estado} variante={turno.estado} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.ver}
                        onClick={() => verDetalle(turno._id)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.paginacion}>
          <span className={styles.paginaInfo}>
            Página {pagina} de {totalPaginas}
          </span>
          <div className={styles.paginacionBotones}>
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}