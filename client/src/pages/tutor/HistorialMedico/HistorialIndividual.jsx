import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../../services/api'
import Sidebar from '../../../components/layout/Sidebar'
import TopBar from '../../../components/layout/TopBar'
import Badge from '../../../components/ui/badge/Badge'
import Button from '../../../components/ui/button/Button'
import styles from './HistorialIndividual.module.css'

export default function HistorialIndividual() {
  const { mascotaId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await api.get(`/historial-completo/${mascotaId}`)
        if (response.data.success) {
          setData(response.data.data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err.response?.data?.message || 'Error al cargar la ficha')
        setLoading(false)
      }
    }

    fetchHistorial()
  }, [mascotaId])

  if (loading) {
    return (
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.main}>
          <TopBar />
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
          <TopBar />
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
          <TopBar />
          <div className={styles.container}>No hay datos</div>
        </div>
      </div>
    )
  }

  const { mascota, fichaMedica, historialClinico, vacunas, estudios } = data

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
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <div className={styles.container}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
          {/* Header */}
          <div className={styles.header}>
            <h1>Ficha Médica - {mascota?.nombre}</h1>
            <p>Tutor: {mascota?.dueñoId?.name || 'No registrado'}</p>
          </div>

          {/* mascota*/}
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
                    texto={mascota?.esCastrado ? "Castrado" : "No castrado"}
                    variante="secondary"
                  />
                  <Badge texto={`Pelaje: ${fichaMedica?.colorPelaje || 'No registrado'}`} variante="success" />
                </div>
              </div>
            </div>
            <div className={styles.responsable}>
              <p className={styles.responsableLabel}>RESPONSABLE</p>
              <p className={styles.responsableName}>{mascota?.dueñoId?.name}</p>
              <p className={styles.responsablePhone}>{mascota?.dueñoId?.telefono || 'N/A'}</p>
            </div>
          </div>

          {/*tarjetitas informacion */}
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
              <p className={styles.cardValue}>{(historialClinico?.length || 0) + (vacunas?.length || 0) + (estudios?.length || 0)}</p>
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
              <p className={styles.cardValue}>{vacunas?.[0]?.fechaAplicada || estudios?.[0]?.fecha ? formatearFecha(vacunas?.[0]?.fechaAplicada || estudios?.[0]?.fecha) : 'N/A'}</p>
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
                  <p>{fichaMedica?.fechaNacimiento ? formatearFecha(fichaMedica.fechaNacimiento) : mascota?.fechaNacimiento ? formatearFecha(mascota.fechaNacimiento) : 'No registrada'}</p>
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
                  <p>{fichaMedica?.enfermedadesCronicas || 'Ninguna registrada'}</p>
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

            {/* Vacunacion y Estudios */}
            <div className={styles.rightColumn}>
              {/* Vacunas */}
              <section className={styles.section}>
                <h2>Registro de Vacunación</h2>
                {vacunas && vacunas.length > 0 ? (
                  <div className={styles.vacunasTable}>
                    {vacunas.map((vacuna, idx) => (
                      <div key={idx} className={styles.vacunaRow}>
                        <span className={styles.vacunaNombre}>{vacuna.nombre}</span>
                        <span className={styles.vacunaFecha}>Aplicada: {formatearFecha(vacuna.fechaAplicada)}</span>
                        <span className={styles.vacunaVet}>{vacuna.profesionalId?.nombre || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>Todavía no hay vacunas registradas.</p>
                )}
              </section>

              {/* Estudios */}
              <section className={styles.section}>
                <h2>Estudios</h2>
                {estudios && estudios.length > 0 ? (
                  <div className={styles.estudios}>
                    {estudios.map((estudio, idx) => (
                      <div key={idx} className={styles.estudioCard}>
                        <h3>{estudio.nombre}</h3>
                        <p>{formatearFecha(estudio.fecha)} · {estudio.profesionalId?.nombre || 'N/A'}</p>
                        {estudio.urlArchivo && (
                          <a
                            href={estudio.urlArchivo}
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