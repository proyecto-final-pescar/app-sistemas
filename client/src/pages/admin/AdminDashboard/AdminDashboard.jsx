import { useState, useEffect, useCallback } from 'react';
import { Users, Building2, Calendar, MessageSquare } from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import TopBar from '../../../components/layout/TopBar';
import api from '../../../services/api';
import styles from './AdminDashboard.module.css';
import DetallesDeTurnoModal from '../../../components/administrador/detallesDeTurnoModal/detallesDeTurnoModal';

const DIAS_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const FILTROS_ESTADO = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'confirmado', label: 'Confirmados' },
  { valor: 'pendiente', label: 'Pendientes' },
  { valor: 'cancelado', label: 'Cancelados' },
];

function formatearFechaHoy() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function StatCard({ icono, colorIcono, label, valor, delta, cargando }) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statIcono} ${colorIcono}`}>{icono}</div>
      <div className={styles.statInfo}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValor}>
          {cargando ? '—' : (valor ?? 0).toLocaleString('es-AR')}
        </span>
        {delta && <span className={styles.statDelta}>{delta}</span>}
      </div>
    </div>
  );
}

function TurnoRow({ turno, etiquetaFecha, onVerDetalles }) {
  const claveBadge = `badge${turno.estado.charAt(0).toUpperCase()}${turno.estado.slice(1)}`;

  return (
    <div className={styles.turnoRow}>
      <div className={styles.turnoHora}>
        <span className={styles.turnoHoraLabel}>{etiquetaFecha}</span>
        <span className={styles.turnoHoraValor}>{turno.hora}</span>
      </div>

      <div className={styles.turnoInfo}>
        <div className={styles.turnoInfoTop}>
          <span className={`${styles.badge} ${styles[claveBadge] ?? ''}`}>
            {turno.estado.toUpperCase()}
          </span>
          <span className={styles.turnoMascota}>
            {turno.mascotaId?.nombre} ({turno.mascotaId?.especie})
          </span>
        </div>
        <p className={styles.turnoClinica}>
          {turno.veterinariaId?.nombre} · {turno.usuarioId?.name}
        </p>
      </div>

      <div className={styles.turnoProfesional}>
        <span className={styles.turnoProfesionalNombre}>
          {turno.profesional?.nombre ?? 'Sin asignar'}
        </span>
        <span className={styles.turnoProfesionalLabel}>Profesional asignado</span>
      </div>

      <button
        className={styles.botonDetalles}
        type="button"
        onClick={() => onVerDetalles(turno._id)}
      >
        Ver detalles
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [cargandoMetrics, setCargandoMetrics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState(null);

  const [fecha, setFecha] = useState(formatearFechaHoy());
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const [turnos, setTurnos] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(true);
  const [errorTurnos, setErrorTurnos] = useState(null);

  const [turnoSeleccionadoId, setTurnoSeleccionadoId] = useState(null);

  useEffect(() => {
    async function cargarMetrics() {
      try {
        setCargandoMetrics(true);
        const { data } = await api.get('/admin/dashboard/metrics');
        setMetrics(data.data);
        setErrorMetrics(null);
      } catch (err) {
       
        setErrorMetrics('No se pudieron cargar las métricas.');
      } finally {
        setCargandoMetrics(false);
      }
    }
    cargarMetrics();
  }, []);

  const cargarTurnos = useCallback(async () => {
    try {
      setCargandoTurnos(true);
      const { data } = await api.get('/admin/dashboard/turnos-del-dia', {
        params: { fecha, estado: filtroEstado },
      });
      setTurnos(data.data.turnos);
      setErrorTurnos(null);
    } catch (err) {
      
      setErrorTurnos('No se pudieron cargar los turnos.');
    } finally {
      setCargandoTurnos(false);
    }
  }, [fecha, filtroEstado]);

  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]);

  const turnosFiltrados = turnos.filter((turno) => {
    if (!busqueda.trim()) return true;
    const texto = busqueda.trim().toLowerCase();
    return (
      turno.mascotaId?.nombre?.toLowerCase().includes(texto) ||
      turno.veterinariaId?.nombre?.toLowerCase().includes(texto) ||
      turno.usuarioId?.name?.toLowerCase().includes(texto) ||
      turno.profesional?.nombre?.toLowerCase().includes(texto)
    );
  });

  const maxTurnosDia = metrics
    ? Math.max(...metrics.turnos.porDia.map((d) => d.cantidad), 1)
    : 1;

  const indiceHoy = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const diaActualLabel = DIAS_LABEL[indiceHoy];

  const esFechaHoy = fecha === formatearFechaHoy();
  const etiquetaFecha = esFechaHoy
    ? 'HOY'
    : new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      });

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.main}>
        <TopBar title="Dashboard" />

        <div className={styles.contenido}>
          {errorMetrics && <p className={styles.error}>{errorMetrics}</p>}

          <section className={styles.statsGrid}>
            <StatCard
              icono={<Users size={22} />}
              colorIcono={styles.iconoUsuarios}
              label="USUARIOS"
              valor={metrics?.usuarios.total}
              delta={metrics ? `+${metrics.usuarios.nuevosEstaSemana} esta semana` : null}
              cargando={cargandoMetrics}
            />
            <StatCard
              icono={<Building2 size={22} />}
              colorIcono={styles.iconoVeterinarias}
              label="VETERINARIAS"
              valor={metrics?.veterinarias.total}
              delta={metrics ? `+${metrics.veterinarias.nuevasEstaSemana} nuevas` : null}
              cargando={cargandoMetrics}
            />
            <StatCard
              icono={<Calendar size={22} />}
              colorIcono={styles.iconoTurnos}
              label="TURNOS HOY"
              valor={metrics?.turnos.hoy}
              cargando={cargandoMetrics}
            />
            <StatCard
              icono={<MessageSquare size={22} />}
              colorIcono={styles.iconoForo}
              label="FORO"
              valor={metrics?.foro.total}
              cargando={cargandoMetrics}
            />
          </section>

          <section className={styles.grafico}>
            <h2 className={styles.tituloSeccion}>
              Turnos por día — <span className={styles.tituloSeccionMuted}>esta semana</span>
            </h2>

            {cargandoMetrics ? (
              <p className={styles.mensaje}>Cargando gráfico...</p>
            ) : !metrics ? (
              <p className={styles.mensaje}>No se pudo cargar el gráfico.</p>
            ) : (
              <div className={styles.barras}>
                {metrics.turnos.porDia.map((dia) => {
                  const alturaPct = Math.max((dia.cantidad / maxTurnosDia) * 100, 4);
                  const esHoy = dia.dia === diaActualLabel;
                  return (
                    <div key={dia.dia} className={styles.columnaBarra}>
                      <div
                        className={`${styles.barra} ${esHoy ? styles.barraActiva : ''}`}
                        style={{ height: `${alturaPct}%` }}
                      />
                      <span className={`${styles.labelDia} ${esHoy ? styles.labelDiaActivo : ''}`}>
                        {dia.dia}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.turnosSection}>
            <div className={styles.turnosHeader}>
              <h2 className={styles.tituloSeccion}>Turnos del día</h2>

              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={styles.inputFecha}
              />

              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={styles.inputBusqueda}
              />

              <div className={styles.tabsFiltro}>
                {FILTROS_ESTADO.map((filtro) => (
                  <button
                    key={filtro.valor}
                    type="button"
                    className={`${styles.tabFiltro} ${
                      filtroEstado === filtro.valor ? styles.tabFiltroActivo : ''
                    }`}
                    onClick={() => setFiltroEstado(filtro.valor)}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>
            </div>

            {errorTurnos && <p className={styles.error}>{errorTurnos}</p>}

            {cargandoTurnos ? (
              <p className={styles.mensaje}>Cargando turnos...</p>
            ) : turnosFiltrados.length === 0 ? (
              <p className={styles.mensaje}>No hay turnos para este día.</p>
            ) : (
              <div className={styles.listaTurnos}>
                {turnosFiltrados.map((turno) => (
                  <TurnoRow
                    key={turno._id}
                    turno={turno}
                    etiquetaFecha={etiquetaFecha}
                    onVerDetalles={setTurnoSeleccionadoId}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {turnoSeleccionadoId && (
        <DetallesDeTurnoModal
          turnoId={turnoSeleccionadoId}
          onClose={() => setTurnoSeleccionadoId(null)}
          onVerComprobante={(pagoId) => {
            // hasta que se implementen los pagos 
            console.log('Ver comprobante del pago:', pagoId);
          }}
        />
      )}
    </div>
  );
}