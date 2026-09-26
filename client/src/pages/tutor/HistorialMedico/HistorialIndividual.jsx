import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../../services/api'
import Sidebar from '../../../components/layout/Sidebar'
import TopBar from '../../../components/layout/TopBar'
import Badge from '../../../components/ui/badge/Badge'
import styles from './HistorialIndividual.module.css'

export default function HistorialIndividual() {
  const { mascotaId } = useParams()
  const navigate = useNavigate()

  // Estados generales
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados de Vacunas para scroll infinito
  const [vacunas, setVacunas] = useState([])
  const [pageVacunas, setPageVacunas] = useState(1)
  const [hasMoreVacunas, setHasMoreVacunas] = useState(true)
  const [loadingVacunas, setLoadingVacunas] = useState(false)

  // Estados de Estudios para scroll infinito
  const [estudios, setEstudios] = useState([])
  const [pageEstudios, setPageEstudios] = useState(1)
  const [hasMoreEstudios, setHasMoreEstudios] = useState(true)
  const [loadingEstudios, setLoadingEstudios] = useState(false)

  // Carga inicial
  useEffect(() => {
    let isMounted = true

    const fetchInicial = async () => {
      try {
        setLoading(true)
        const response = await api.get(
          `/historial-completo/${mascotaId}?pageVacunas=1&limitVacunas=10&pageEstudios=1&limitEstudios=10`
        )
        if (response.data.success && isMounted) {
          const resData = response.data.data
          setData(resData)
          setVacunas(resData.vacunas || [])
          setEstudios(resData.estudios || [])

          if (resData.pagination) {
            setHasMoreVacunas(resData.pagination.vacunas?.hasMore ?? false)
            setHasMoreEstudios(resData.pagination.estudios?.hasMore ?? false)
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error:', err)
          setError(err.response?.data?.message || 'Error al cargar la ficha')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (mascotaId) fetchInicial()

    return () => {
      isMounted = false
    }
  }, [mascotaId])

  // Subconsultas con scroll infinito
  const cargarMasVacunas = async () => {
    if (loadingVacunas || !hasMoreVacunas) return
    try {
      setLoadingVacunas(true)
      const nextPage = pageVacunas + 1
      const response = await api.get(
        `/historial-completo/${mascotaId}?pageVacunas=${nextPage}&limitVacunas=10`
      )
      if (response.data.success) {
        const nuevasVacunas = response.data.data.vacunas || []
        setVacunas((prev) => [...prev, ...nuevasVacunas])
        setPageVacunas(nextPage)
        setHasMoreVacunas(response.data.data.pagination?.vacunas?.hasMore ?? false)
      }
    } catch (err) {
      console.error('Error al paginar vacunas:', err)
    } finally {
      setLoadingVacunas(false)
    }
  }

  const cargarMasEstudios = async () => {
    if (loadingEstudios || !hasMoreEstudios) return
    try {
      setLoadingEstudios(true)
      const nextPage = pageEstudios + 1
      const response = await api.get(
        `/historial-completo/${mascotaId}?pageEstudios=${nextPage}&limitEstudios=10`
      )
      if (response.data.success) {
        const nuevosEstudios = response.data.data.estudios || []
        setEstudios((prev) => [...prev, ...nuevosEstudios])
        setPageEstudios(nextPage)
        setHasMoreEstudios(response.data.data.pagination?.estudios?.hasMore ?? false)
      }
    } catch (err) {
      console.error('Error al paginar estudios:', err)
    } finally {
      setLoadingEstudios(false)
    }
  }

  const handleScrollVacunas = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 25) {
      cargarMasVacunas()
    }
  }

  const handleScrollEstudios = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 25) {
      cargarMasEstudios()
    }
  }

  if (loading) {
    return (
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.main}>
          <TopBar title="Historial Clínico" />
          <div className={styles.container}>Cargando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.main}>
          <TopBar title="Historial Clínico" />
          <div className={styles.container}><p>{error}</p></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.main}>
          <TopBar title="Historial Clínico" />
          <div className={styles.container}>No hay datos</div>
        </div>
      </div>
    )
  }

  const { mascota, fichaMedica, historialClinico } = data

  // Compatibilidad universal para los datos del tutor
  const tutorNombre =
    mascota?.dueno?.name ||
    (mascota?.dueno?.nombre
      ? `${mascota.dueno.nombre} ${mascota.dueno.apellido || ''}`.trim()
      : null) ||
    mascota?.dueñoId?.name ||
    (mascota?.usuario
      ? `${mascota.usuario.nombre} ${mascota.usuario.apellido || ''}`.trim()
      : null) ||
    'No registrado'

  const tutorTelefono =
    mascota?.dueno?.telefono ||
    mascota?.dueñoId?.telefono ||
    mascota?.usuario?.telefono ||
    'N/A'

  const calcularEdad = () => {
    if (!mascota?.fechaNacimiento) return 'N/A'
    const hoy = new Date()
    const nacimiento = new Date(mascota.fechaNacimiento)

    let años = hoy.getFullYear() - nacimiento.getFullYear()
    let meses = hoy.getMonth() - nacimiento.getMonth()
    let dias = hoy.getDate() - nacimiento.getDate()

    if (dias < 0) {
      meses--
      dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate()
    }

    if (meses < 0) {
      años--
      meses += 12
    }

    if (años > 0) {
      return `${años} año${años > 1 ? 's' : ''} ${meses} mes${meses !== 1 ? 'es' : ''}`
    } else if (meses > 0) {
      return `${meses} mes${meses !== 1 ? 'es' : ''}`
    } else {
      return `${dias} día${dias !== 1 ? 's' : ''}`
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const ultimaConsultaFecha = historialClinico?.length
    ? historialClinico.reduce(
        (masReciente, c) =>
          !masReciente || new Date(c.fecha) > new Date(masReciente.fecha) ? c : masReciente,
        null
      )?.fecha
    : null

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar title={`Ficha Médica - ${mascota?.nombre || ''}`} />
        <div className={styles.container}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Volver
          </button>

          {/* Header */}
          <div className={styles.header}>
            <h1>Ficha Médica - {mascota?.nombre}</h1>
            <p>Tutor: {tutorNombre}</p>
          </div>

          {/* Mascota Card */}
          <div className={styles.mascotaCard}>
            <div className={styles.mascotaInfo}>
              {mascota?.foto ? (
                <img
                  src={mascota.foto}
                  alt={mascota.nombre}
                  className={styles.mascotaAvatarFoto}
                />
              ) : (
                <div className={styles.mascotaAvatar}>{mascota?.nombre?.charAt(0)}</div>
              )}
              <div className={styles.mascotaDetails}>
                <h2>{mascota?.nombre}</h2>
                <p>{mascota?.especie} · {mascota?.raza} · {mascota?.sexo}</p>
                <div className={styles.badges}>
                  <Badge
                    texto={mascota?.esCastrado ? 'Castrado' : 'No castrado'}
                    variante="secondary"
                  />
                  <Badge
                    texto={`Pelaje: ${fichaMedica?.colorPelaje || 'No registrado'}`}
                    variante="success"
                  />
                </div>
              </div>
            </div>

            {/* Responsable alineado a la derecha */}
            <div className={styles.responsable}>
              <p className={styles.responsableLabel}>RESPONSABLE</p>
              <p className={styles.responsableName}>{tutorNombre}</p>
              <p className={styles.responsablePhone}>{tutorTelefono}</p>
            </div>
          </div>

          {/* Tarjetitas información */}
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="M7 21h10" />
                <path d="M12 3v18" />
                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
              </svg>
              <p className={styles.cardValue}>{mascota?.peso} kg</p>
              <p className={styles.cardLabel}>Peso Actual</p>
            </div>

            <div className={styles.card}>
              <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
                <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
                <path d="M2 21h20" />
                <path d="M7 8v3" />
                <path d="M12 8v3" />
                <path d="M17 8v3" />
                <path d="M7 4h.01" />
                <path d="M12 4h.01" />
                <path d="M17 4h.01" />
              </svg>
              <p className={styles.cardValue}>{calcularEdad()}</p>
              <p className={styles.cardLabel}>Edad Actual</p>
            </div>

            <div className={styles.card}>
              <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect width="8" height="4" x="8" y="2" rx="1" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
              <p className={styles.cardValue}>
                {(historialClinico?.length || 0) + vacunas.length + estudios.length}
              </p>
              <p className={styles.cardLabel}>Consultas Totales</p>
            </div>

            <div className={styles.card}>
              <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
                <path d="m9 16 2 2 4-4" />
              </svg>
              <p className={styles.cardValue}>
                {ultimaConsultaFecha ? formatearFecha(ultimaConsultaFecha) : 'Sin consultas'}
              </p>
              <p className={styles.cardLabel}>Última Consulta</p>
            </div>
          </div>

          <div className={styles.contentGrid}>
            {/* Ficha Permanente */}
            <section className={styles.section}>
              <h2>Ficha permanente</h2>
              <div className={styles.fichaPermanente}>
                <div className={styles.row}>
                  <label>Fecha de nacimiento</label>
                  <p>{mascota?.fechaNacimiento ? formatearFecha(mascota.fechaNacimiento) : 'No registrada'}</p>
                </div>
                <div className={styles.row}>
                  <label>Especie / Raza</label>
                  <p>{mascota?.especie} · {mascota?.raza}</p>
                </div>
                <div className={styles.row}>
                  <label>Color / Pelaje</label>
                  <p>{fichaMedica?.colorPelaje || 'No registrado'}</p>
                </div>
                <div className={styles.row}>
                  <label>Microchip</label>
                  <p>{fichaMedica?.microchip || 'No registrado'}</p>
                </div>
                <div className={styles.row}>
                  <label>Enfermedades crónicas</label>
                  <p>
                    {Array.isArray(fichaMedica?.enfermedadesCronicas)
                      ? fichaMedica.enfermedadesCronicas.join(', ')
                      : fichaMedica?.enfermedadesCronicas || 'Ninguna registrada'}
                  </p>
                </div>
                <div className={styles.row}>
                  <label>Cirugías previas</label>
                  <p>{fichaMedica?.cirugiasPrevias || 'Ninguna registrada'}</p>
                </div>
                <div className={styles.row}>
                  <label>Medicamentos habituales</label>
                  <p>{fichaMedica?.medicamentosHabituales || 'Ninguno'}</p>
                </div>
              </div>
            </section>

            {/* Vacunación y Estudios con Scroll Infinito */}
            <div className={styles.rightColumn}>
              {/* Vacunas */}
              <section className={styles.section}>
                <h2>Registro de Vacunación</h2>
                {vacunas && vacunas.length > 0 ? (
                  <div className={styles.scrollList} onScroll={handleScrollVacunas}>
                    <div className={styles.vacunasTable}>
                      {vacunas.map((vacuna, idx) => (
                        <div key={vacuna.id || vacuna._id || idx} className={styles.vacunaRow}>
                          <span className={styles.vacunaNombre}>{vacuna.nombre}</span>
                          <span className={styles.vacunaFecha}>
                            Aplicada: {formatearFecha(vacuna.fechaAplicada)}
                          </span>
                          <span className={styles.vacunaVet}>
                            {vacuna.profesionalNombre || vacuna.profesionalId?.nombre || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {loadingVacunas && <p className={styles.cargandoMas}>Cargando más vacunas...</p>}
                  </div>
                ) : (
                  <p className={styles.emptyState}>Todavía no hay vacunas registradas.</p>
                )}
              </section>

              {/* Estudios */}
              <section className={styles.section}>
                <h2>Estudios</h2>
                {estudios && estudios.length > 0 ? (
                  <div className={styles.scrollList} onScroll={handleScrollEstudios}>
                    <div className={styles.estudios}>
                      {estudios.map((estudio, idx) => (
                        <div key={estudio.id || estudio._id || idx} className={styles.estudioCard}>
                          <h3>{estudio.nombre || estudio.titulo}</h3>
                          <p>
                            {formatearFecha(estudio.fecha)} ·{' '}
                            {estudio.profesionalNombre || estudio.profesionalId?.nombre || 'N/A'}
                          </p>
                          {(estudio.urlArchivo || estudio.archivoUrl) && (
                            <a
                              href={estudio.urlArchivo || estudio.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.verResultado}
                            >
                              Ver resultado
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                    {loadingEstudios && <p className={styles.cargandoMas}>Cargando más estudios...</p>}
                  </div>
                ) : (
                  <p className={styles.emptyState}>Todavía no hay estudios registrados.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}